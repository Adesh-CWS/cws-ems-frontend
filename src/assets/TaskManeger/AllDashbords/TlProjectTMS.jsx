import React, { useState, useEffect ,useRef} from "react";
import axios from "axios";

function TlProjectTMS({ user }) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState("view");
  const [projectData, setProjectData] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [managerList, setManagerList] = useState([]);
  
  // Date range filter states
  const [startDateFromFilter, setStartDateFromFilter] = useState("");
  const [startDateToFilter, setStartDateToFilter] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const currentUserId =
    JSON.parse(localStorage.getItem("activeUser"))?._id || user?._id;
  
  // Comment modal state
  const [commentModalProject, setCommentModalProject] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [projectComments, setProjectComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  
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
    fetchTLProjects();
  }, [user]);

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

  const fetchTLProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/${user._id}/projects`);
      
      const transformedProjects = res.data.projects.map(item => ({
        _id: item.project._id,
        projectCode: item.project.projectCode,
        name: item.project.name,
        clientName: item.project.clientName,
        startDate: item.project.startDate,
        endDate: item.project.endDate,
        dueDate: item.project.dueDate,
        priority: item.project.priority,
        status: calculateStatus(item.project), 
        progress: item.project.progress || 0,
        teamId: item.teamId,
        teamName: item.teamName,
        department: item.department,
        teamMembersCount: item.teamMembersCount,
        description: item.project.description || ""
      }));
      
      setProjectData(transformedProjects);
      setFilteredProjects(transformedProjects);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Cannot fetch projects from backend");
    }
  };

  const popupRef = useRef(null);
  const trapFocus = (e) => {
  if (e.key !== "Tab") return;

  const focusableElements = popupRef.current.querySelectorAll(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
};

useEffect(() => {
  if (showPopup && popupRef.current) {
    popupRef.current.focus();
  }
}, [showPopup]);


  // Calculate project status based on dates
  const calculateStatus = (project) => {
    if (!project.dueDate) return "On Track";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(project.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return "Delayed";
    if (daysDiff === 0) return "Today is last date";
    if (daysDiff <= 7) return "On Track";
    return "On Track";
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, itemsPerPage, startDateFromFilter, startDateToFilter]);

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

  const openRowPopup = (item, idx) => {
    setSelectedProjectId(item._id);
    setPopupMode("view");
    fetchProjectComments(item._id);
    
    const managerIds = extractManagerIds(item.managers || []);
    const uniqueManagerIds = [...new Set(managerIds)];
    
    setForm({
      projectCode: item.projectCode,
      project: item.name || "",
      desc: item.description || "",
      managers: uniqueManagerIds,
      clientName: item.clientName || "",
      startDate: item.startDate?.slice(0, 10),
      endDate: item.endDate?.slice(0, 10),
      due: item.dueDate?.slice(0, 10),
      status: item.status || "",
      priority: item.priority,
    });
    
    setShowPopup(true);
  };

  // Apply filters function
  const applyFilters = () => {
    let temp = [...projectData];

    // Apply search filter
    if (searchInput.trim() !== "") {
      const query = searchInput.toLowerCase();
      temp = temp.filter((item) => {
        const searchableFields = [
          item.name || "",
          item.projectCode || "",
          item.status || "",
          item.priority || "",
          item.teamName || "",
          item.department || "",
          item.clientName || "",
          formatDateDisplay(item.startDate) || "",
          formatDateDisplay(item.dueDate) || "",
        ];
        const searchString = searchableFields.join(" ").toLowerCase();
        return searchString.includes(query);
      });
    }

    // Apply date range filters
    if (startDateFromFilter || startDateToFilter) {
      temp = temp.filter((item) => {
        if (!item.startDate) return false;
        const itemDateStr = new Date(item.startDate).toISOString().split("T")[0];
        return (
          (!startDateFromFilter || itemDateStr >= startDateFromFilter) &&
          (!startDateToFilter || itemDateStr <= startDateToFilter)
        );
      });
    }

    setFilteredProjects(temp);
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchInput("");
    setStartDateFromFilter("");
    setStartDateToFilter("");
    setFilteredProjects([...projectData]);
    setCurrentPage(1);
  };

  // Handle filter submit
  const handleFilterSubmit = () => {
    applyFilters();
  };

  const filteredData = filteredProjects;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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
          todayLastDate++;
          onTrack++;
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

  // Comment functions
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

  // Helper function to extract manager IDs
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

  const resetProjectForm = () => {
    setPopupMode("view");
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ color: "#3A5FBE", fontSize: "25px" }}>Team Lead Projects</h4>
      </div>

      <div className="row g-3 mb-4">
        {[
          { title: "Total Projects", count: total, bg: "#D1ECF1" },
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
<div className="col-12 col-md-6 col-lg-3" key={index}>
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

      {/* Filter section */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px", minWidth: "50px", marginRight: "8px" }}
              >
                Search
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by any field..."
                className="form-control form-control-sm"
                style={{ flex: 1 }}
              />
            </div>

            {/* Date From Filter */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px", minWidth: "50px", marginRight: "8px" }}
              >
                From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDateFromFilter}
                onChange={(e) => setStartDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To Filter */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px", minWidth: "50px", marginRight: "8px" }}
              >
                To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDateToFilter}
                onChange={(e) => setStartDateToFilter(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleFilterSubmit}
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={resetFilters}
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
                  Client Name
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
                  Team Name
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
                  Department
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
                  Team Members
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
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr
                    key={`${item._id}-${item.teamId || index}-${index}`}
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
                        ? "This project is cancelled."
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
                      {item.name}
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
                      {item.clientName || "-"}
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
                      {item.teamName || "-"}
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
                      {item.department || "-"}
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
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.status || "—"}
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
                      {item.teamMembersCount || 0}
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
                  <td colSpan="11" className="text-center text-muted py-4">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
    zIndex: 1000
  }}
>
 <div
  className="popup-box bg-white shadow"
  ref={popupRef}
  onKeyDown={trapFocus}  
  tabIndex={-1}
  style={{
    width: "600px",
    borderRadius: "10px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column"
  }}
>

  {/* HEADER */}
  <div
    className="modal-header"
    style={{
      backgroundColor: "#3A5FBE",
      padding: "10px",
      color: "#fff",
      borderTopLeftRadius: "10px",
      borderTopRightRadius: "10px"
    }}
  >
    <h5 className="modal-title mb-0">Project Details</h5>

    <button
   type="button"
    className="btn-close btn-close-white"
      onClick={() => {
        setShowPopup(false);
        resetProjectForm();
      }}
    />
  </div>

  {/* SCROLLABLE BODY */}
  <div
    style={{
      overflowY: "auto",
      padding: "20px",
      flex: 1
    }}
  >
  <form>
              {/* Project Code */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Project Code
                </label>
                <div className="col-8">
                  <p>{form.projectCode}</p>
                </div>
              </div>

              {/* Project Title */}
              <div className="mb-1 row align-items-center ">
                <label className="col-4 form-label fw-semibold">
                  Project Title
                </label>
                <div className="col-8">
                  <p>{form.project}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Description
                </label>
                <div className="col-8">
                  <p>{form.desc}</p>
                </div>
              </div>

              {/* Client Name */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Client Name
                </label>
                <div className="col-8">
                  <p>{form.clientName}</p>
                </div>
              </div>

              {/* Team Information */}
              {paginatedData.find(p => p._id === selectedProjectId) && (
                <>
                  <div className="mb-1 row align-items-center">
                    <label className="col-4 form-label fw-semibold">
                      Team Name
                    </label>
                    <div className="col-8">
                      <p>{paginatedData.find(p => p._id === selectedProjectId)?.teamName || "-"}</p>
                    </div>
                  </div>
                  <div className="mb-1 row align-items-center">
                    <label className="col-4 form-label fw-semibold">
                      Department
                    </label>
                    <div className="col-8">
                      <p>{paginatedData.find(p => p._id === selectedProjectId)?.department || "-"}</p>
                    </div>
                  </div>
                  <div className="mb-1 row align-items-center">
                    <label className="col-4 form-label fw-semibold">
                      Team Members
                    </label>
                    <div className="col-8">
                      <p>{paginatedData.find(p => p._id === selectedProjectId)?.teamMembersCount || 0}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Dates */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">
                  Start Date
                </label>
                <div className="col-8">
                  <p>{formatDateDisplay(form.startDate)}</p>
                </div>
              </div>

              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">Due Date</label>
                <div className="col-8">
                  <p>{formatDateDisplay(form.due)}</p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 fw-semibold">Status</label>
                <div className="col-8">
                  <p>{form.status}</p>
                </div>
              </div>

              {/* Priority */}
              <div className="mb-1 row align-items-center">
                <label className="col-4 form-label fw-semibold">Priority</label>
                <div className="col-8">
                  <p>{form.priority}</p>
                </div>
              </div>

              {/* Comments */}
              <div className="row mb-2">
                <label className="col-4 fw-semibold">Comments</label>
                <div className="col-8">
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {projectComments.length > 0 ? (
                      projectComments.map((c, i) => {
                        const isCommentCreator = c.user?._id === currentUserId;
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
                          <div key={c._id || i} className="mb-2 p-2 border rounded">
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
                                      <i className="bi bi-pencil-square"></i>
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

              {/* Buttons */}
              <div className="d-flex justify-content-end gap-2">
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
        </div>
      )}

      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>

      {/* Comment Modal */}
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
                    Project: {commentModalProject.name}
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

export default TlProjectTMS;