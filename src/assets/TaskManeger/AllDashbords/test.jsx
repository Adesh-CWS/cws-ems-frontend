import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/projects";

function AdminProjectTMS() {
  const [cardCounts, setCardCounts] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    delayed: 0,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [statusList, setStatusList] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("");
  const [projectData, setProjectData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [managerList, setManagerList] = useState([]);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  const [commentModalProject, setCommentModalProject] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [projectComments, setProjectComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [weeklyOffs, setWeeklyOffs] = useState({
    saturdays: [],
    sundayOff: true,
  });

  const userRole = localStorage.getItem("role") || "employee";
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    projectCode: "",
    project: "",
    desc: "",
    managers: [],
    clientName: "",
    startDate: "",
    endDate: "",
    due: "",
    status: "",
    priority: "P1",
  });

  const popupRef = useRef(null);
  useEffect(() => {
    if (showPopup && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showPopup]);

  const trapFocus = (e) => {
    if (!popupRef.current) return;

    const focusableElements = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  const managerRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        showManagerDropdown &&
        managerRef.current &&
        !managerRef.current.contains(e.target)
      ) {
        setShowManagerDropdown(false); // close dropdown
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showManagerDropdown]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8000/managers/list")
      .then((res) => {
        console.log("Managers fetched:", res.data);
        setManagerList(res.data);
      })
      .catch((err) => {
        console.error("Manager fetch error:", err);
      });
  }, []);

  // -------------------------------------------------------------

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/admin/weeklyoff/${new Date().getFullYear()}`,
        );

        const weeklyData = res.data?.data || {};

        setWeeklyOffs({
          saturdays: weeklyData.saturdays || [],
          sundayOff: true, // Sunday always off
        });
      } catch (err) {
        console.error("Weekly off fetch error:", err);
        setWeeklyOffs({ saturdays: [], sundayOff: true });
      }
    };

    fetchWeeklyOffs();
  }, []);

  const fetchStatuses = async () => {
    try {
      const uniqueRes = await axios.get("http://localhost:8000/unique");
      setStatusList(uniqueRes.data.data || []);
    } catch (error) {
      console.error("Error to fetch Status:", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const createStatuses = statusList.filter(
    (s) => s.name.toLowerCase() !== "cancelled",
  );

  const getStatusName = (statusId) => {
    if (!statusId) return "—";
    const status = statusList.find(
      (s) => s._id === statusId || s.id === statusId,
    );
    return status ? status.name : "—";
  };

  // -------------------------------------------------------------

  const fetchProjects = async () => {
    try {
      const res = await axios.get(API_URL);
      setProjectData(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Cannot fetch projects from backend");
    }
  };
  useEffect(() => {
    const total = projectData.length;

    const today = new Date();

    const ongoing = projectData.filter((p) => {
      const start = p.startDate ? new Date(p.startDate) : null;
      const due = p.dueDate ? new Date(p.dueDate) : null;

      return start && due && start <= today && due >= today;
    }).length;

    const completed = projectData.filter(
      (p) => p.status?.name === "Completed",
    ).length;

    const delayed = projectData.filter(
      (p) => p.status?.name === "Delayed",
    ).length;

    setCardCounts({
      total,
      ongoing,
      completed,
      delayed,
    });
  }, [projectData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const formatDateDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  ///
  const extractManagerIds = (managers) => {
    if (!managers) return [];
    if (Array.isArray(managers)) {
      return managers.map((m) => {
        if (typeof m === "string") return m;
        if (m._id) return m._id;
        if (m.id) return m.id;
        return m;
      });
    }
    return [];
  };

  const getManagerNames = (managers) => {
    if (!managers) return [];
    const ids = extractManagerIds(managers);
    const uniqueIds = [...new Set(ids)];

    return uniqueIds.map((id) => {
      const manager = managerList.find((m) => m._id === id);
      return manager ? manager.name : id;
    });
  };

  ////
  const openCreatePopup = () => {
    setPopupMode("create");
    setForm({
      projectCode: "",
      project: "",
      desc: "",
      managers: [],
      clientName: "",
      startDate: "",
      endDate: "",
      due: "",
      status: "",
      priority: "P1",
    });
    setShowPopup(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.projectCode) newErrors.projectCode = "Project code is required";
    if (!form.project) newErrors.project = "Project title is required";
    if (!form.desc) newErrors.desc = "Description is required";
    if (!form.clientName) newErrors.clientName = "Client name is required";
    if (form.managers.length === 0)
      newErrors.managers = "Select at least one manager";

    if (!form.startDate) newErrors.startDate = "Start date is required";
    if (!form.endDate) newErrors.endDate = "End date is required";
    if (!form.due) newErrors.due = "Due date is required";

    if (form.startDate && form.endDate) {
      if (new Date(form.endDate) < new Date(form.startDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (form.startDate && form.due) {
      if (new Date(form.due) < new Date(form.startDate)) {
        newErrors.due = "Due date must be after start date";
      }
    }

    if (!form.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetProjectForm = () => {
    setErrors({});
    setPopupMode("create");
  };

  const formatDate = (date) => date;

  const isWeeklyOff = (date) => {
    const day = new Date(date).getDay();

    if (day === 0 && weeklyOffs.sundayOff) return true;
    if (day === 6 && weeklyOffs.saturdays.includes(date)) return true;

    return false;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    const holidaysRes = await axios.get("http://localhost:8000/getHolidays");
    const holidays = holidaysRes.data?.data || holidaysRes.data || [];

    const isHoliday = (date) =>
      holidays.some((holiday) => holiday.date.split("T")[0] === date);

    const dateFields = [
      { label: "Start Date", value: form.startDate },
      { label: "End Date", value: form.endDate },
      { label: "Due Date", value: form.due },
    ];

    for (let field of dateFields) {
      if (!field.value) continue;

      if (isWeeklyOff(field.value)) {
        alert(
          `${field.label} falls on a Weekly Off. Please select another date.`,
        );
        return;
      }

      if (isHoliday(field.value)) {
        alert(`${field.label} falls on a Holiday. Please select another date.`);
        return;
      }
    }

    const payload = {
      name: form.project,
      projectCode: form.projectCode,
      description: form.desc,
      clientName: form.clientName,
      startDate: form.startDate,
      endDate: form.endDate,
      dueDate: form.due,
      status: form.status,
      priority: form.priority,
      managers: [...new Set(form.managers)],
    };

    console.log("Create Payload:", payload);

    try {
      await axios.post(API_URL, payload);
      alert("Project Created Successfully!");
      setShowPopup(false);
      fetchProjects();
    } catch (err) {
      console.error("Create error:", err.response?.data || err);
      alert("Project creation failed");
    }
  };

  const openRowPopup = async (item, idx) => {
    setSelectedIndex(idx);
    setSelectedProjectId(item._id);
    setPopupMode("view");
    const managerIds = extractManagerIds(item.managers);
    const uniqueManagerIds = [...new Set(managerIds)];
    setForm({
      projectCode: item.projectCode,
      project: item.project || item.name || "",
      desc: item.desc || item.description || "",
      managers: uniqueManagerIds,
      clientName: item.clientName || "",
      startDate: item.startDate?.slice(0, 10),
      endDate: item.endDate?.slice(0, 10),
      due: item.dueDate?.slice(0, 10),
      status: item.status?._id || item.status || "",
      priority: item.priority,
    });
    setShowPopup(true);

    try {
      const response = await axios.get(
        `http://localhost:8000/project/${item._id}/comments`,
      );
      setProjectComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching project comments:", error);
      setProjectComments([]);
    }
  };

  //Added by Rutuja for project comments
  const fetchProjectComments = async (projectId) => {
    setCommentLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/project/${projectId}/comments`,
      );
      setProjectComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = (e, project) => {
    e.stopPropagation();
    setCommentModalProject(project);
    setNewComment("");
    fetchProjectComments(project._id);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    if (!commentModalProject?._id) {
      alert("Project not selected");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8000/project/${commentModalProject._id}/comment`,
        { comment: newComment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (res.data.success) {
        await fetchProjectComments(commentModalProject._id);
        setNewComment("");
        alert("Comment added successfully");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const filteredData =
    searchQuery.trim() === ""
      ? projectData
      : projectData.filter((item) => {
          const q = searchQuery.toLowerCase();

          const fields = [
            item.project || item.name,
            item.projectCode,
            item.desc || item.description,
            item.clientName,
            item.priority,
            item.status?.name,
            formatDateDisplay(item.startDate),
            formatDateDisplay(item.endDate),
            formatDateDisplay(item.dueDate),
            ...getManagerNames(item.managers),
          ];

          return fields.some(
            (f) => f && f.toString().toLowerCase().includes(q),
          );
        });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      // ✅ correct state
      setProjectData((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    const holidaysRes = await axios.get("http://localhost:8000/getHolidays");
    const holidays = holidaysRes.data?.data || holidaysRes.data || [];

    const isHoliday = (date) =>
      holidays.some((holiday) => holiday.date.split("T")[0] === date);

    const dateFields = [
      { label: "Start Date", value: form.startDate },
      { label: "End Date", value: form.endDate },
      { label: "Due Date", value: form.due },
    ];

    for (let field of dateFields) {
      if (!field.value) continue;

      if (isWeeklyOff(field.value)) {
        alert(
          `${field.label}: The selected date is a weekly off. Please choose another date.`,
        );

        return;
      }

      if (isHoliday(field.value)) {
        alert(`${field.label} is a holiday. Kindly select another date.`);

        return;
      }
    }

    if (!selectedProjectId) {
      alert("Project ID not found");
      return;
    }

    const payload = {
      name: form.project,
      projectCode: form.projectCode,
      description: form.desc,
      clientName: form.clientName,
      startDate: form.startDate,
      endDate: form.endDate,
      dueDate: form.due,
      status: form.status, // ✅ send as status_id
      priority: form.priority,
      managers: [...new Set(form.managers)],
    };
    console.log("Payload:", payload);

    try {
      await axios.put(`${API_URL}/${selectedProjectId}`, payload);

      alert("Project Updated Successfully ✅");
      setShowPopup(false);
      fetchProjects(); // 🔄 refresh table
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(err.response?.data?.message || "Update failed");
    }
  };
  const statusColors = {
    "Total Tasks": "#D1ECF1",
    Completed: "#D7F5E4",
    Assigned: "#E8F0FE",
    "In Progress": "#D1E7FF",
    "Assignment Pending": "#E2E3E5",
    Testing: "#FFE493",
    Hold: "#FFF1CC",
    Review: "#E7DDF7",
    Cancelled: "#F8D7DA",
    Delayed: "#FFB3B3",
  };

  const getDerivedProjectStatus = (project) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = project.dueDate ? new Date(project.dueDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    const startDate = project.startDate ? new Date(project.startDate) : null;
    const isCompleted = project.status?.name === "Completed";

    // No due date
    if (!dueDate) return "—";

    // Completed cases
    if (isCompleted) {
      if (project.completedAt) {
        const completedAt = new Date(project.completedAt);
        completedAt.setHours(0, 0, 0, 0);

        if (completedAt <= dueDate) {
          return "Completed";
        } else {
          return "Completed (extra time)";
        }
      }
      return "Completed";
    }

    // Not started
    if (!startDate) {
      return "Not Started";
    }

    // After due date
    if (today > dueDate) {
      return "Delayed";
    }

    // Today is last date
    if (today.getTime() === dueDate.getTime()) {
      return "Today is last date";
    }

    // Future due date
    if (today < dueDate) {
      return "In Progress";
    }

    return "—";
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px" }}>Projects</h2>

        <button
          className="btn btn-sm custom-outline-btn"
          onClick={openCreatePopup}
        >
          Create New Project
        </button>
      </div>

      <div className="row mb-4">
        {[
          { title: "Total Projects", count: cardCounts.total, bg: "#D1ECF1" },
          {
            title: "Completed Projects",
            count: cardCounts.completed,
            bg: "#D7F5E4",
          },
          {
            title: "Ongoing Projects",
            count: cardCounts.ongoing,
            bg: "#FFE493",
          },
          {
            title: "Delayed Projects",
            count: cardCounts.delayed,
            bg: "#FFB3B3",
          },
        ].map((card, i) => (
          <div className="col-md-3" key={i}>
            <div className="card shadow-sm h-100 border-0">
              <div
                className="card-body d-flex align-items-center"
                style={{ gap: "20px" }}
              >
                <h4
                  className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: card.bg,
                    textAlign: "center",
                    minWidth: "70px",
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3A5FBE",
                  }}
                >
                  {card.count}
                </h4>
                <p
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  {card.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      {/* Filter */}
      <div className="card bg-white shadow-sm p-3 mb-4 border-0">
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          {/* Search Input */}
          <div
            className="d-flex align-items-center mb-2 "
            style={{ minWidth: "200px", gap: "10px" }}
          >
            <label
              className="fg-label"
              style={{
                color: "#3A5FBE",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Search
            </label>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by any field..."
              className="form-control "
            />
          </div>

          <div
            className="d-flex align-items-center ms-auto mb-2"
            style={{ gap: "10px" }}
          >
            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={() => setSearchQuery(searchInput)}
            >
              Filter
            </button>

            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Project Code
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Project Name
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Assigned to
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Start Date
                </th>

                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Priority
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Comments
                </th>

                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr
                    key={item._id || index}
                    onClick={() => openRowPopup(item, index)}
                  >
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.projectCode}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.project || item.name}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getManagerNames(item.managers).join(", ") || "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateDisplay(item.startDate)}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateDisplay(item.dueDate)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getDerivedProjectStatus(item) || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.priority}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{
                          fontSize: "12px",
                          padding: "4px 12px",
                          borderRadius: "4px",
                        }}
                        onClick={(e) => handleAddComment(e, item)}
                      >
                        Add Comment
                      </button>
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm custom-outline-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRowPopup(item, index);
                            setPopupMode("edit");
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(item._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ PAGINATION */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "14px", marginRight: "8px" }}>
              Rows per page:
            </span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>

          <span style={{ fontSize: "14px" }}>
            {filteredData.length === 0 ? 0 : indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredData.length)} of{" "}
            {filteredData.length}
          </span>

          <div>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* POPUP */}
      {showPopup && (
        <div
          className="popup-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          <div
            className="popup-box bg-white p-4 shadow"
            ref={popupRef}
            tabIndex="-1"
            autoFocus
            onKeyDown={trapFocus}
            style={{
              width: "600px",
              borderRadius: "10px",
              maxHeight: "68vh",
              overflowY: "auto",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!validateForm()) return;

                if (popupMode === "create") {
                  handleCreateSubmit(e);
                } else {
                  handleEditSave(e);
                }
              }}
            >
              {/* HEADER */}
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#3A5FBE",
                  padding: "10px",
                  color: "#fff",
                  margin: "-25px -24px 15px -24px",
                  borderTopLeftRadius: "10px",
                }}
              >
                <h5 className="fw-bold">
                  {popupMode === "create"
                    ? "Create New Project"
                    : popupMode === "edit"
                      ? "Edit Project"
                      : "Project Details"}
                </h5>

                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowPopup(false);
                    resetProjectForm();
                  }}
                ></button>
              </div>

              {/* Project Code */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Project Code
                </label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{form.projectCode}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={form.projectCode}
                        onChange={(e) => {
                          setForm({ ...form, projectCode: e.target.value });

                          if (errors.projectCode) {
                            setErrors({ ...errors, projectCode: "" });
                          }
                        }}
                      />

                      {errors.projectCode && (
                        <small className="text-danger">
                          {errors.projectCode}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* Project Title */}
              <div className="mb-1 row align-items-center ">
                <label className="col-4 form-label fw-semibold">
                  Project Title
                </label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{form.project}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={50}
                        value={form.project}
                        onChange={(e) => {
                          setForm({ ...form, project: e.target.value });
                          if (errors.project) {
                            setErrors({ ...errors, project: "" });
                          }
                        }}
                      />
                      <div
                        className="char-count"
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "4px",
                        }}
                      >
                        {form.project.length}/50
                      </div>

                      {errors.project && (
                        <small className="text-danger">{errors.project}</small>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Description
                </label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{form.desc}</p>
                  ) : (
                    <>
                      <textarea
                        className="form-control"
                        rows="3"
                        maxLength={200}
                        value={form.desc}
                        onChange={(e) => {
                          setForm({ ...form, desc: e.target.value });
                          if (errors.desc) {
                            setErrors({ ...errors, desc: "" });
                          }
                        }}
                      />
                      {errors.desc && (
                        <small className="text-danger">{errors.desc}</small>
                      )}
                      <div
                        className="char-count"
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "4px",
                        }}
                      >
                        {form.desc.length}/200
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Client Name */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Client Name
                </label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{form.clientName}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={form.clientName}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z\s]*$/.test(value)) {
                            setForm({ ...form, clientName: value });
                            if (errors.clientName) {
                              setErrors({ ...errors, clientName: "" });
                            }
                          }
                        }}
                      />
                      {errors.clientName && (
                        <small className="text-danger">
                          {errors.clientName}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* Managers */}
              <div
                className="mb-1 row align-items-center manager-dropdown-area"
                style={{ position: "relative" }}
                ref={managerRef} // ✅ REQUIRED
              >
                <label className="col-4 form-label fw-semibold">Managers</label>
                <div className="col-8" style={{ position: "relative" }}>
                  {popupMode === "view" ? (
                    <p>{getManagerNames(form.managers).join(", ") || "—"}</p>
                  ) : (
                    <>
                      <div
                        className="form-control d-flex justify-content-between"
                        onClick={() =>
                          setShowManagerDropdown(!showManagerDropdown)
                        }
                        style={{ cursor: "pointer" }} // inline CSS ✔
                      >
                        <span>
                          {form.managers.length === 0
                            ? "Select Managers"
                            : getManagerNames(form.managers).join(", ")}
                        </span>
                        <span>▼</span>
                      </div>

                      {showManagerDropdown && (
                        <div
                          className="shadow bg-white p-2"
                          style={{
                            position: "absolute",
                            width: "100%",
                            top: "40px",
                            left: "0",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            maxHeight: "150px",
                            overflowY: "auto",
                            zIndex: 1050,
                          }} // inline CSS ✔
                        >
                          {managerList.map((m) => (
                            <div className="form-check" key={m._id}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={form.managers.includes(m._id)}
                                onChange={() => {
                                  let updated = [...form.managers];
                                  if (updated.includes(m._id)) {
                                    updated = updated.filter(
                                      (id) => id !== m._id,
                                    );
                                  } else {
                                    updated.push(m._id);
                                  }
                                  setForm({ ...form, managers: updated });

                                  if (errors.managers) {
                                    setErrors({ ...errors, managers: "" });
                                  }
                                }}
                              />
                              <label className="form-check-label">
                                {m.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {errors.managers && (
                        <small className="text-danger">{errors.managers}</small>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* Dates */}

              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Start Date
                </label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{formatDateDisplay(form.startDate)}</p>
                  ) : (
                    <>
                      <input
                        type="date"
                        className="form-control"
                        min={today}
                        value={form.startDate}
                        onChange={(e) => {
                          setForm({ ...form, startDate: e.target.value });
                          if (errors.startDate) {
                            setErrors({ ...errors, startDate: "" });
                          }
                        }}
                      />

                      {errors.startDate && (
                        <small className="text-danger">
                          {errors.startDate}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">End Date</label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{formatDateDisplay(form.endDate)}</p>
                  ) : (
                    <>
                      <input
                        type="date"
                        className="form-control"
                        min={form.startDate || today}
                        value={form.endDate}
                        onChange={(e) => {
                          setForm({ ...form, endDate: e.target.value });
                          if (errors.endDate) {
                            setErrors({ ...errors, endDate: "" });
                          }
                        }}
                      />

                      {errors.endDate && (
                        <small className="text-danger">{errors.endDate}</small>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">Due Date</label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{formatDateDisplay(form.due)}</p>
                  ) : (
                    <>
                      <input
                        type="date"
                        className="form-control"
                        min={form.endDate || form.startDate || today}
                        value={form.due}
                        onChange={(e) => {
                          setForm({ ...form, due: e.target.value });
                          if (errors.due) {
                            setErrors({ ...errors, due: "" });
                          }
                        }}
                      />
                      {errors.due && (
                        <small className="text-danger">{errors.due}</small>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* ----------------------------------------------------------------------------------------------------- */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 fw-semibold">Status</label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{getDerivedProjectStatus(projectData[selectedIndex])}</p>
                  ) : (
                    <>
                      <select
                        className="form-control"
                        value={form.status}
                        onChange={(e) => {
                          setForm({ ...form, status: e.target.value });
                          if (errors.status) {
                            setErrors({ ...errors, status: "" });
                          }
                        }}
                      >
                        <option value="">Select Status</option>
                        {popupMode === "create" &&
                          createStatuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        {popupMode === "edit" &&
                          statusList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                      {errors.status && (
                        <small className="text-danger">{errors.status}</small>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* --------------------------------------------------------------------------------------------------------- */}
              {/* Priority */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">Priority</label>
                <div className="col-8">
                  {popupMode === "view" ? (
                    <p>{form.priority}</p>
                  ) : (
                    <select
                      className="form-control"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Status & Action
              {popupMode !== "create" && (
                <>
                  <div className="mb-3">
                    <label className="fw-semibold">Status</label>
                    {popupMode === "view" ? (
                      <p>{form.status}</p>
                    ) : (
                      <input
                        className="form-control"
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                      />
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="fw-semibold">Action</label>
                    {popupMode === "view" ? (
                      <p>{form.action}</p>
                    ) : (
                      <input
                        className="form-control"
                        value={form.action}
                        onChange={(e) =>
                          setForm({ ...form, action: e.target.value })
                        }
                      />
                    )}
                  </div>
                </>
              )} */}

              {/* //Added by Rutuja for project comments */}
              {popupMode === "view" && (
                <div className="row mb-3">
                  <div className="col-4 fw-semibold">Comments</div>
                  <div className="col-8">
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {projectComments && projectComments.length > 0 ? (
                        projectComments.map((comment, index) => (
                          <div key={index} className="mb-2 p-2 border rounded">
                            <div className="d-flex justify-content-between">
                              <span className="text-primary">
                                {comment.user?.name ||
                                  comment.userId?.name ||
                                  "Anonymous"}
                                <span className="text-muted ms-1">
                                  (
                                  {comment.user?.role ||
                                    comment.userId?.role ||
                                    "Unknown"}
                                  )
                                </span>
                              </span>
                              <small className="text-muted">
                                {comment.createdAt
                                  ? new Date(
                                      comment.createdAt,
                                    ).toLocaleDateString()
                                  : ""}
                              </small>
                            </div>
                            <div className="mt-1">
                              {comment.comment || comment.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted">No comments</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="d-flex justify-content-end gap-2 ">
                {popupMode === "view" &&
                  userRole === "admin" &&
                  userRole !== "ceo" &&
                  userRole !== "md" &&
                  userRole !== "employee" && (
                    <button
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: "90px" }}
                      onClick={() => setPopupMode("edit")}
                    >
                      Edit
                    </button>
                  )}

                {popupMode === "edit" && userRole === "admin" && (
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={handleEditSave}
                  >
                    Save Changes
                  </button>
                )}

                {popupMode === "create" && (
                  <button
                    type="submit"
                    className="btn btn-sm custom-outline-btn"
                  >
                    Save
                  </button>
                )}

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => {
                    setShowPopup(false);
                    resetProjectForm();
                  }}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* //Added by Rutuja for project comments */}
      {commentModalProject && (
        <div
          className="modal fade show"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "500px", width: "95%" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Add Comment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCommentModalProject(null)}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Project:{" "}
                    {commentModalProject.project || commentModalProject.name}
                  </label>
                </div>

                <div className="mb-3">
                  <label htmlFor="commentText" className="form-label">
                    Comment
                  </label>
                  <textarea
                    id="commentText"
                    className="form-control"
                    rows="4"
                    maxLength={300}
                    placeholder="Enter your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div
                    className="char-count"
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "12px",
                      color: "#6c757d",
                      marginTop: "4px",
                    }}
                  >
                    {newComment.length}/300
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setCommentModalProject(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={handleSubmitComment}
                >
                  Submit Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------------------------------------------ */}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default AdminProjectTMS;
