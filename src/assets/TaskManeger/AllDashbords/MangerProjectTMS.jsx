import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/projects";

function ManagerProjectTMS({ user }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("");
  const [projectData, setProjectData] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const [errors, setErrors] = useState({});
  const [weeklyOffs, setWeeklyOffs] = useState({
    saturdays: [],
    sundayOff: true,
  });

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const currentUserId =
    JSON.parse(localStorage.getItem("activeUser"))?._id || user?._id;
  //added by harshada
  const [commentModalProject, setCommentModalProject] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [projectComments, setProjectComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
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

  // -------------------------------------------------------------

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/${user._id}`);
      setProjectData(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Cannot fetch projects from backend");
    }
  };

  useEffect(() => {
    const total = projectData.length;

    const cancelled = projectData.filter(
      (p) => p.status === "Cancelled",
    ).length;

    const ontrack = projectData.filter((p) => p.status === "On Track").length;

    const completed = projectData.filter(
      (p) => p.status === "Completed",
    ).length;

    const delayed = projectData.filter((p) => p.status === "Delayed").length;

    const upcomingProject = projectData.filter(
      (p) => p.status === "Upcoming Project",
    ).length;

    const inProgress = projectData.filter(
      (p) => p.status === "In Progress",
    ).length;
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

  //update status manually(Completed/cancelled)
  //  async function handleStatusChange(projectId, newStatus) {
  //   try {
  //     let apiUrl;
  //     // Change API for specific statuses
  //     if (newStatus === "Completed") {
  //       apiUrl = `http://localhost:8000/api/projects/${projectId}/complete`;
  //     } else if (newStatus === "Cancelled") {
  //       apiUrl = `http://localhost:8000/api/projects/${projectId}/cancel`;
  //     }

  //     await axios.put(apiUrl, { status: newStatus });

  //     // Update state locally
  //     setProjectData(prev =>
  //       prev.map(item =>
  //         item._id === projectId ? { ...item, status: newStatus } : item
  //       )
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to update status");
  //   }

  //   // Close any status popup
  //   setOpenStatusId(null);
  // }

  async function handleStatusChange(projectId, newStatus) {
    try {
      let apiUrl;

      if (newStatus === "Completed") {
        apiUrl = `${API_URL}/${projectId}/complete`;
      } else if (newStatus === "Cancelled") {
        apiUrl = `${API_URL}/${projectId}/cancel`;
      }

      await axios.put(apiUrl, {
        status: newStatus,
        updatedBy: user._id, // ✅ manager id sent to backend
      });

      setProjectData((prev) =>
        prev.map((item) =>
          item._id === projectId ? { ...item, status: newStatus } : item,
        ),
      );
      alert(`Project status update successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }

    setOpenStatusId(null);
  }

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

    // if (!form.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetProjectForm = () => {
    setErrors({});
    setPopupMode("create");
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

  const openRowPopup = (item, idx) => {
    setSelectedProjectId(item._id);
    setPopupMode("view");
    fetchProjectComments(item._id); //added by harshada
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
      status: item.status || "",
      priority: item.priority,
    });
    // console.log("form",form)  get empty
    setShowPopup(true);
  };
////added by shivani 28-01-2026
  const filteredData =
  searchQuery.trim() === ""
    ? projectData
    : projectData.filter((item) => {
        const query = searchQuery.toLowerCase();

        const projectName =
          (item.project || item.name || "").toLowerCase();

        const projectCode =
          item.projectCode?.toLowerCase() || "";

        const status =
          item.status?.toLowerCase() || "";

        const priority =
          item.priority?.toLowerCase() || "";

        const managers =
          getManagerNames(item.managers)
            .join(", ")
            .toLowerCase();

        const startDate =
          formatDateDisplay(item.startDate).toLowerCase();

        const dueDate =
          formatDateDisplay(item.dueDate).toLowerCase();

        return (
          projectName.includes(query) ||
          projectCode.includes(query) ||
          status.includes(query) ||
          priority.includes(query) ||   
          managers.includes(query) ||
          startDate.includes(query) ||
          dueDate.includes(query)
        );
      });
////added by shivani 28-01-2026
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

  // komal's status count code

  const handleEditSave = async (e) => {
    e.preventDefault();

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
      priority: form.priority,
      managers: [...new Set(form.managers)],
    };
    console.log("status", form.status);
    console.log("Payload:", payload);

    try {
      await axios.put(`${API_URL}/${selectedProjectId}`, payload);

      alert("Project Updated Successfully ✅");
      setShowPopup(false);
      fetchProjects(); // refresh table
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    upcoming: 0,
    delayed: 0,
    onTrack: 0,
    todayLastDate: 0,
    futureDue: 0,
    inProgress: 0,
  });

  useEffect(() => {
    if (!projectData.length) return;

    let completed = 0;
    let cancelled = 0;
    let upcoming = 0;
    let delayed = 0;
    let onTrack = 0;
    let todayLastDate = 0;
    let futureDue = 0;

    projectData.forEach((p) => {
      switch (p.status) {
        case "Completed":
          completed++;
          break;
        case "Cancelled":
          cancelled++;
          break;
        case "Upcoming Project":
          upcoming++;
          break;
        case "Delayed":
          delayed++;
          break;
        case "Today is last date":
          onTrack++;
          todayLastDate++;
          break;
        case "On Track":
          onTrack++;
          futureDue++;
          break;
        default:
          break;
      }
    });

    setSummary({
      total: projectData.length,
      completed,
      cancelled,
      upcoming,
      delayed,
      onTrack,
      todayLastDate,
      futureDue,
      inProgress: delayed + onTrack,
    });
  }, [projectData]);

  const {
    total,
    completed,
    cancelled,
    upcoming,
    delayed,
    onTrack,
    todayLastDate,
    futureDue,
    inProgress,
  } = summary;

  console.log("paginated", paginatedData);

  //added by harshada

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
        setCommentModalProject(null);
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert(error?.response?.data?.message || "Failed to add comment");
    }
  };
  const handleAddComment = (e, project) => {
    e.stopPropagation();
    setCommentModalProject(project);
    setNewComment("");
    fetchProjectComments(project._id);
  };

  const handleDeleteComment = async (commentId, projectId) => {
    if (!commentId || !projectId) {
      alert("Cannot delete comment: Missing ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const res = await axios.delete(
        `http://localhost:8000/project/${projectId}/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (res.data.success) {
        await fetchProjectComments(projectId);
        alert("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      alert(error?.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleEditComment = async (commentId, projectId, newText) => {
    if (!commentId || !projectId || !newText.trim()) {
      alert("Cannot edit comment");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:8000/project/${projectId}/comment/${commentId}`,
        { comment: newText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (res.data.success) {
        await fetchProjectComments(projectId);
        setEditingCommentId(null);
        setEditingCommentText("");
        alert("Comment updated successfully");
      }
    } catch (error) {
      console.error("Edit comment error:", error);
      alert(error?.response?.data?.message || "Failed to edit comment");
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.comment || comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const isAnyPopupOpen = !!showPopup || !!commentModalProject;
  useEffect(() => {
    if (isAnyPopupOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyPopupOpen]);
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ color: "#3A5FBE", fontSize: "25px" }}>Projects</h4>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: "Total Projects", count: total, bg: "#D1ECF1" }, ////Changes in all color dip
          { title: "In Progress", count: inProgress, bg: "#D1E7FF" },
          { title: "Delayed", count: delayed, bg: "#FFB3B3" },
          { title: "On Track", count: onTrack, bg: "#e9f5d7" },
          {
            title: "Today is last date",
            count: todayLastDate,
            bg: "#FFE493",
          },
          { title: "Upcoming Projects", count: upcoming, bg: "#E7DDF7" },
          { title: "Completed", count: completed, bg: "#D7F5E4" },
          { title: "Cancelled", count: cancelled, bg: "#F8D7DA" },
        ].map((card, index) => (
          <div className="col-12 col-md-4 col-lg-3" key={index}>
            <div className="card shadow-sm h-100 border-0">
              <div
                className="card-body d-flex align-items-center"
                style={{ gap: "20px" }}
              >
                <h4 className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: card.bg,
                    padding: "10px",
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

      {/* komal  cards */}

      {/* Filter  */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          {/* Search Input */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 14, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Search
              </label>

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search By Any Field..."
                className="form-control form-control-sm"
                style={{ flex: 1 }}
              />
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 ms-auto">
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
                {/* //added harshada */}
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
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  // <tr key={item._id || index} onClick={() => openRowPopup(item, index)}>
                  <tr
                    key={item._id || index}
                    onClick={() => {
                      if (item.status === "Cancelled") return;
                      openRowPopup(item, index);
                    }}
                    style={{
                      opacity: item.status === "Cancelled" ? 0.6 : 1,
                      cursor:
                        item.status === "Cancelled" ? "not-allowed" : "pointer",
                      backgroundColor:
                        item.status === "Cancelled" ? "#f8d7da" : "inherit",
                    }}
                    title={
                      item.status === "Cancelled"
                        ? "This project is cancelled. Status will be auto-managed based on dates when enabled."
                        : ""
                    }
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
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        cursor: ["manager"].includes(userRole)
                          ? "pointer"
                          : "default",
                        color: ["manager"].includes(userRole)
                          ? "#3A5FBE"
                          : "inherit",
                        textDecoration: ["manager"].includes(userRole)
                          ? "underline"
                          : "none",
                        position: "relative",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          ["manager"].includes(userRole) &&
                          item.status !== "Cancelled" &&
                          item.status !== "Completed"
                        ) {
                          setOpenStatusId(item._id);
                        }
                      }}
                    >
                      {item.status || "—"}

                      {openStatusId === item._id && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 2000,
                          }}
                          onClick={() => setOpenStatusId(null)}
                        >
                          <div
                            className="bg-white shadow"
                            style={{
                              width: "500px",
                              borderRadius: "10px",
                              overflow: "hidden",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <div
                              style={{
                                backgroundColor: "#3A5FBE",
                                padding: "15px 20px",
                                color: "#fff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <h5 className="mb-0 fw-bold">Update Status</h5>
                              <button
                                className="btn-close btn-close-white"
                                onClick={() => setOpenStatusId(null)}
                              ></button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: "20px" }}>
                              {/* Status Dropdown */}
                              <div className="mb-4">
                                <label
                                  className="form-label fw-semibold"
                                  style={{ marginBottom: "8px" }}
                                >
                                  Status
                                </label>
                                <select
                                  className="form-control"
                                  defaultValue={item.status}
                                  style={{
                                    border: "1px solid #dee2e6",
                                    padding: "8px 12px",
                                  }}
                                >
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>

                              {/* Buttons */}
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm custom-outline-btn"
                                  style={{ minWidth: "90px" }}
                                  onClick={() => setOpenStatusId(null)}
                                >
                                  Close
                                </button>
                                <button
                                  className="btn btn-sm custom-outline-btn"
                                  style={{ minWidth: "90px" }}
                                  onClick={(e) => {
                                    const newStatus = e.target
                                      .closest(".bg-white")
                                      .querySelector("select").value;
                                    handleStatusChange(item._id, newStatus);
                                    setOpenStatusId(null);
                                  }}
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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

                    {/* //added by harshada */}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* <button
                        className="btn btn-sm custom-outline-btn"
                        style={{
                          fontSize: "12px",
                          padding: "4px 12px",
                          borderRadius: "4px",
                        }}
                        onClick={(e) => handleAddComment(e, item)}
                      >
                        Add Comment
                      </button> */}
                      {item.status !== "Cancelled" && (
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
                      )}
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
      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
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
              className="btn btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              onMouseDown={(e) => e.preventDefault()}
              style={{ userSelect: "none" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={currentPage === totalPages}
              style={{ userSelect: "none" }}
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
            style={{
              width: "600px",
              borderRadius: "10px",
              maxHeight: "90vh",
              overflowY: "auto",
              marginTop: "100px", //added by harshada
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
              >
                <label className="col-4 form-label fw-semibold">Managers</label>
                <div className="col-8 " style={{ position: "relative" }}>
                  {popupMode === "view" ? (
                    <p>{getManagerNames(form.managers).join(", ") || "—"}</p>
                  ) : (
                    <>
                      <div
                        className=" form-control d-flex justify-content-between"
                        onClick={() =>
                          setShowManagerDropdown(!showManagerDropdown)
                        }
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
                          }}
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
              {/* <div className="mb-1 row align-items-center">
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
              </div> */}

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
                {popupMode === "view" ? (
                  <label className="col-4 fw-semibold">Status</label>
                ) : (
                  <></>
                )}
                <div className="col-8">
                  {popupMode === "view" ? <p>{form.status}</p> : <></>}
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

              {/* comments added by harshada */}
              {popupMode === "view" && (
                <div className="row mb-2">
                  <label className="col-4 fw-semibold">Comments</label>

                  <div className="col-8">
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {projectComments.length > 0 ? (
                        projectComments.map((c, i) => {
                          const isCommentCreator =
                            c.user?._id === currentUserId;
                          const isEditing = editingCommentId === c._id;
                          if (isEditing) {
                            return (
                              <div key={i} className="mb-2 p-2 border rounded">
                                <div className="mt-2">
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows="2"
                                    value={editingCommentText}
                                    onChange={(e) =>
                                      setEditingCommentText(e.target.value)
                                    }
                                    maxLength={300}
                                  />
                                  <div className="d-flex justify-content-end gap-2 mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm custom-outline-btn"
                                      onClick={cancelEditing}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm custom-outline-btn"
                                      onClick={() =>
                                        handleEditComment(
                                          c._id,
                                          selectedProjectId,
                                          editingCommentText,
                                        )
                                      }
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={i} className="mb-2 p-2 border rounded">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div>
                                  <strong>
                                    {c.user?.name || "Unknown User"}
                                  </strong>
                                  <small className="text-muted ms-2">
                                    ({c.user?.role || "No role"})
                                  </small>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <small className="text-muted">
                                    {c.createdAt &&
                                      new Date(c.createdAt).toLocaleDateString(
                                        "en-GB",
                                      )}
                                  </small>
                                  {isCommentCreator && (
                                    <div className="d-flex align-items-center gap-1">
                                      <button
                                        className="btn btn-sm custom-outline-btn p-0"
                                        style={{
                                          width: "20px",
                                          height: "20px",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditingComment(c);
                                        }}
                                        title="Edit comment"
                                      >
                                        <i className="bi bi-pencil-square "></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger p-0"
                                        style={{
                                          width: "20px",
                                          height: "20px",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteComment(
                                            c._id,
                                            selectedProjectId,
                                          );
                                        }}
                                        title="Delete comment"
                                      >
                                        <i className="bi bi-trash3"></i>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>{c.comment || c.text}</div>
                            </div>
                          );
                        })
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

      {/* //added by harshada */}
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
    </div>
  );
}

export default ManagerProjectTMS;
