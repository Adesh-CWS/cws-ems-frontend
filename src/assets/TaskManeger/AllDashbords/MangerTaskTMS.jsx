import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";

function isWeeklyOff(date, weeklyOffs = { saturdays: [], sundayOff: true }) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  const saturdays = weeklyOffs.saturdays || [];
  const sundayOff = weeklyOffs.sundayOff ?? true;

  // Sunday
  if (day === 0 && sundayOff) {
    return "Sunday";
  }

  // Saturday (from backend config)
  if (day === 6 && saturdays.length) {
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    if (saturdays.includes(weekOfMonth)) {
      return `${weekOfMonth} Saturday`;
    }
  }

  return null;
}

const MangerTaskTMS = ({ role }) => {
  const userRole = role || localStorage.getItem("role");
  const [department, setDepartment] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [taskType, setTaskType] = useState([]);
  const [project, setProject] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [assignDateFromFilter, setAssignDateFromFilter] = useState("");
  const [assignDateToFilter, setAssignDateToFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedTask, setSelectedTask] = useState(null);
  const [uniqueStatus, setUniqueStatus] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [commentModalTask, setCommentModalTask] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [taskComments, setTaskComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTimers, setActiveTimers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [weeklyOffs, setWeeklyOffs] = useState({
    saturdays: [],
    sundayOff: true,
  });

  const currentUserId = currentUser?._id || JSON.parse(localStorage.getItem("activeUser"))?._id;
  const viewEditRef = useRef(null);
  const commentRef = useRef(null);

  const useFocusTrap = (ref, active) => {
    useEffect(() => {
      if (!active || !ref.current) return;
  
      const container = ref.current;
      
      const previouslyFocused = document.activeElement;
      
      container.focus();
  
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
  
      const handleKeyDown = (e) => {
        if (e.key !== "Tab" || focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === container) {
            e.preventDefault();
            last.focus();
          }
        } 
        else {
          if (document.activeElement === last || document.activeElement === container) {
            e.preventDefault();
            first.focus();
          }
        }
      };
  
      const handleFocusOut = (e) => {
        if (!container.contains(e.relatedTarget)) {
        container.focus();
        }
      };
  
      container.addEventListener("keydown", handleKeyDown);
      container.addEventListener("focusout", handleFocusOut);
  
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
        container.removeEventListener("focusout", handleFocusOut);
        if (previouslyFocused && previouslyFocused.focus) {
          previouslyFocused.focus();
        }
      };
    }, [active, ref]);
  };
  useFocusTrap(viewEditRef, !!selectedTask);
  useFocusTrap(commentRef, !!commentModalTask);

  const formatTimeClock = (totalSeconds) => {
    if (!totalSeconds) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedTimers = { ...timerSeconds };
      let hasChanges = false;

      Object.keys(activeTimers).forEach((taskId) => {
        const timer = activeTimers[taskId];
        if (timer) {
          const elapsedSeconds = Math.floor((now - new Date(timer.startTime)) / 1000);
          const newSeconds = timer.totalSeconds + elapsedSeconds;
          if (updatedTimers[taskId] !== newSeconds) {
            updatedTimers[taskId] = newSeconds;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setTimerSeconds(updatedTimers);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers, timerSeconds]);

  const fetchTaskComments = async (taskId) => {
    setCommentLoading(true);
    try {
      const response = await axios.get(`https://ems-cws-test.vercel.app/task/${taskId}/comments`);
      setTaskComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddCommentClick = (e, task) => {
    e.stopPropagation();
    setCommentModalTask(task);
    setNewComment("");
    fetchTaskComments(task._id);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    if (!commentModalTask?._id) {
      alert("Task not selected");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `https://ems-cws-test.vercel.app/task/${commentModalTask._id}/comment`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        await fetchTaskComments(commentModalTask._id);
        setNewComment("");
        alert("Comment added successfully");
        setCommentModalTask(null);
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId, taskId) => {
    if (!commentId || !taskId) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(
        `https://ems-cws-test.vercel.app/task/${taskId}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        await fetchTaskComments(taskId);
        alert("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      alert(error?.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleEditComment = async (commentId, taskId, newText) => {
    if (!commentId || !taskId || !newText.trim()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `https://ems-cws-test.vercel.app/task/${taskId}/comment/${commentId}`,
        { comment: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        await fetchTaskComments(taskId);
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

  const normalizeDepartment = (value) => {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();

    if (v.startsWith("it")) return "IT";
    if (v.includes("finance")) return "Finance";
    if (v.includes("qa") || v.includes("test")) return "QA";
    if (v.includes("ui")) return "UI/UX";

    return value.trim();
  };

  async function fetchUser() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("https://ems-cws-test.vercel.app/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await axios.get("https://ems-cws-test.vercel.app/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const user = await fetchUser();
      const managerId = user._id;

      const res = await axios.get(`https://ems-cws-test.vercel.app/manager/emp/task/${managerId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const allTasksList = [];
        if (res.data.tasksByEmployee && Array.isArray(res.data.tasksByEmployee)) {
          res.data.tasksByEmployee.forEach((employeeGroup) => {
            if (employeeGroup.tasks && Array.isArray(employeeGroup.tasks)) {
              employeeGroup.tasks.forEach((task) => {
                allTasksList.push({
                  ...task,
                  employeeName: employeeGroup.employee?.name || "Unknown",
                  time: task.timeTracking
                    ? formatTimeClock(task.timeTracking.totalSeconds || 0)
                    : "00:00:00",
                });
              });
            }
          });
        }

        // Alternative: use allTasks array if available
        const processedTasks = (res.data.allTasks || allTasksList).map((task) => ({
          ...task,
          time: task.timeTracking
            ? formatTimeClock(task.timeTracking.totalSeconds || 0)
            : "00:00:00",
        }));

        setAllTasks(processedTasks);
        console.log("Fetched tasks:", processedTasks);

        const newActiveTimers = {};
        processedTasks.forEach((task) => {
          if (
            task.status?.name === "In Progress" &&
            task.timeTracking?.isRunning &&
            task.timeTracking?.startTime
          ) {
            const startTime = new Date(task.timeTracking.startTime);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const totalSeconds = (task.timeTracking.totalSeconds || 0) + elapsedSeconds;

            newActiveTimers[task._id] = {
              startTime: startTime,
              totalSeconds: task.timeTracking.totalSeconds || 0,
            };

            setTimerSeconds((prev) => ({
              ...prev,
              [task._id]: totalSeconds,
            }));
          }
        });

        setActiveTimers(newActiveTimers);
      }
    } catch (error) {
      const errData = error.response?.data || {};
      console.error("ERROR FETCHING TASKS:", errData);
      alert(JSON.stringify(errData, null, 2) || "Failed to load tasks");
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`https://ems-cws-test.vercel.app/unique`);
      if (res.data.success) {
        const normalized = res.data.data.map(s => ({
          _id: s._id || s.id,
          name: s.name,
        }));
        setUniqueStatus(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    }
  };

  const statusCounts = allTasks.reduce((acc, task) => {
    const statusName = task.status?.name || "Unknown";
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchTasks();
      await fetchStatuses();
      
      // Fetch departments and other required data
      try {
        const token = localStorage.getItem("accessToken");
        const user = await fetchUser();
        
        const res = await axios.get("https://ems-cws-test.vercel.app/getAllDepartments");
        const departments = res.data.departments;
        const normalizedDepartments = departments.map((d) => normalizeDepartment(d));
        const uniqueDepartments = [...new Set(normalizedDepartments)];
        setDepartment(uniqueDepartments);
        
        const taskTypeRes = await axios.get(`https://ems-cws-test.vercel.app/api/task-types/unique-names`);
        setTaskType(taskTypeRes.data.taskTypes || []);
        
        const projectRes = await axios.get(`https://ems-cws-test.vercel.app/api/projects/unique-names/${user._id}`);
        setProject(projectRes.data.projects || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch initial data.");
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    setFilteredTasks(allTasks);
  }, [allTasks]);

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(`https://ems-cws-test.vercel.app/admin/weeklyoff/${new Date().getFullYear()}`);
        const weeklyData = res.data?.data || {};
        const saturdayOffs = weeklyData.saturdays || [];
        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff: true });
      } catch (err) {
        console.error("Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [], sundayOff: true });
      }
    };

    fetchWeeklyOffs();
  }, []);

  const applyFilters = () => {
    let temp = [...allTasks];

    if (searchInput.trim() !== "") {
      const query = searchInput.toLowerCase();
      temp = temp.filter((task) => {
        const searchableFields = [
          task.taskId,
          task.taskName,
          task.projectName,
          task.assignedTo?.name,
          task.employeeName,
          task.department,
          task.typeOfTask,
          task.status?.name,
          task.progressPercentage,
          task.taskDescription,
          task.createdBy?.name,
        ];
        const searchString = searchableFields.join(" ").toLowerCase();
        return searchString.includes(query);
      });
    }

    if (assignDateFromFilter || assignDateToFilter) {
      temp = temp.filter((task) => {
        if (!task.dateOfTaskAssignment) return false;
        const taskDateStr = new Date(task.dateOfTaskAssignment).toISOString().split("T")[0];
        return (
          (!assignDateFromFilter || taskDateStr >= assignDateFromFilter) &&
          (!assignDateToFilter || taskDateStr <= assignDateToFilter)
        );
      });
    }

    setFilteredTasks(temp);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setAssignDateFromFilter("");
    setAssignDateToFilter("");
    setFilteredTasks([...allTasks]);
    setCurrentPage(1);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, filteredTasks.length);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const STATUS_COLORS = {
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

  const today = new Date().toISOString().split("T")[0];
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const maxDate = oneMonthLater.toISOString().split("T")[0];

  const handleDownloadExcel = () => {
    if (filteredTasks.length === 0) {
      alert("No data available to download");
      return;
    }

    const excelData = filteredTasks.map((task, index) => ({
      "Sr No": index + 1,
      "Task Name": task.taskName || "-",
      Project: task.projectName || "-",
      "Assigned To": task.assignedTo?.name || task.employeeName || "-",
      Department: task.department || "-",
      "Task Type": task.typeOfTask || "-",
      "Assigned Date": task.dateOfTaskAssignment
        ? new Date(task.dateOfTaskAssignment).toLocaleDateString("en-GB")
        : "-",
      "Due Date": task.dateOfExpectedCompletion
        ? new Date(task.dateOfExpectedCompletion).toLocaleDateString("en-GB")
        : "-",
      "Progress (%)": task.progressPercentage ?? 0,
      Status: task.status?.name || "-",
      "Created By": task.createdBy?.name || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manager Tasks");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const fileName = `Manager_Tasks_${assignDateFromFilter || "ALL"}_to_${assignDateToFilter || "ALL"}.xlsx`;
    saveAs(data, fileName);
  };

  const isAnyPopupOpen = !!commentModalTask || !!selectedTask;
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

  const getFileType = (file) => {
    if (!file) return null;
    if (typeof file === 'string') {
      const clean = file.toLowerCase();
      if (clean.includes('/raw/upload/')) return "pdf";
      if (clean.endsWith(".pdf")) return "pdf";
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(clean)) return "image";
      return "other";
    }
    if (typeof file === 'object' && file.url) return getFileType(file.url);
    return null;
  };

  const getFileName = (doc) => {
    if (!doc) return 'No Document';
    if (typeof doc === 'string') {
      if (doc.includes('cloudinary')) {
        const parts = doc.split('/');
        return parts[parts.length - 1] || 'Document';
      }
      let fileName = doc;
      if (fileName.includes('/')) fileName = fileName.split('/').pop();
      fileName = fileName.split('?')[0];
      return fileName || 'Document';
    }
    if (typeof doc === 'object' && doc.url) return getFileName(doc.url);
    return 'Document';
  };

  const getFileUrl = (doc) => {
    if (!doc) return '#';
    if (typeof doc === 'string') {
      if (doc.includes('res.cloudinary.com')) return doc;
      if (doc.includes('cloudinary') || doc.includes('/upload/')) {
        if (doc.startsWith('http')) return doc;
        if (doc.includes('/raw/upload/')) return `https://res.cloudinary.com/dfvumzr0q/raw/upload/${doc}`;
        return `https://res.cloudinary.com/dfvumzr0q/image/upload/${doc}`;
      }
      return '#';
    }
    if (typeof doc === 'object' && doc.url) return getFileUrl(doc.url);
    return '#';
  };

  const getDerivedStatus = (task) => {
    const statusName = task.status?.name || task.status || "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignDate = task.dateOfTaskAssignment ? new Date(task.dateOfTaskAssignment) : null;
    const dueDate = task.dateOfExpectedCompletion ? new Date(task.dateOfExpectedCompletion) : null;
    const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;

    if (assignDate) assignDate.setHours(0, 0, 0, 0);
    if (dueDate) dueDate.setHours(0, 0, 0, 0);
    if (updatedAt) updatedAt.setHours(0, 0, 0, 0);

    if (statusName === "Completed") {
      if (dueDate && updatedAt && updatedAt > dueDate) {
        const diffTime = updatedAt - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Completed (Delayed by ${diffDays} days)`;
      }
      return "Completed";
    }

    if (statusName === "In Progress") {
      if (dueDate && today > dueDate) return "Delayed (In Progress)";
      return "In Progress";
    }

    return statusName || "-";
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px" }}>Tasks</h2>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm custom-outline-btn"
            onClick={handleDownloadExcel}
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row mb-4">
        {[
          { title: "Total Tasks", count: allTasks.length ?? 0, bg: "#D1ECF1" },
          { title: "Completed Tasks", count: statusCounts.Completed ?? 0, bg: "#D7F5E4" },
          { title: "Assigned Tasks", count: statusCounts.Assigned ?? 0, bg: "#FFE493" },
          { title: "Unassigned Tasks", count: statusCounts["Assignment Pending"] ?? 0, bg: "#F1F3F5" },
          { title: "In Progress", count: statusCounts["In Progress"] ?? 0, bg: "#D1E7FF" },
          { title: "Tasks On Hold", count: statusCounts.Hold ?? 0, bg: "#FFF1CC" },
          { title: "Cancelled Tasks", count: statusCounts.Cancelled ?? 0, bg: "#F2C2C2" },
          { title: "Delayed Tasks", count: statusCounts.Delayed ?? 0, bg: "#FFB3B3" },
        ].map((task, idx) => (
          <div className="col-12 col-md-4 col-lg-3 mb-3" key={idx}>
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}>
                <h4
                  className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: task.bg,
                    padding: "15px",
                    textAlign: "center",
                    minWidth: "70px",
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3A5FBE",
                  }}
                >
                  {task.count}
                </h4>
                <p className="mb-0 fw-semibold" style={{ fontSize: "18px", color: "#3A5FBE" }}>
                  {task.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px", minWidth: "50px", marginRight: "8px" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by any field..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px", minWidth: "50px", marginRight: "8px" }}
              >
                From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={assignDateFromFilter}
                onChange={(e) => setAssignDateFromFilter(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{ width: "50px", fontSize: "16px", color: "#3A5FBE", minWidth: "50px", marginRight: "8px" }}
              >
                To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={assignDateToFilter}
                onChange={(e) => setAssignDateToFilter(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2 ms-auto">
              <button type="button" style={{ minWidth: 90 }} className="btn btn-sm custom-outline-btn" onClick={applyFilters}>
                Filter
              </button>
              <button type="button" style={{ minWidth: 90 }} className="btn btn-sm custom-outline-btn" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mt-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={thStyle}>Task Name</th>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Assigned Date</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Progress</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Status</th>
                {/* <th style={thStyle}>Comments</th> */}
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4" style={{ color: "#6c757d" }}>
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((t, index) => (
                  <tr
                    key={t._id || index}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedTask({ ...t });
                      fetchTaskComments(t._id);
                    }}
                  >
                    <td style={tdStyle}>{t.title || t.taskName || "-"}</td>
                    <td style={tdStyle}>{t.projectName || "-"}</td>
                    <td style={tdStyle}>{t.createdBy?.name || "-"}</td>
                    <td style={tdStyle}>{t.assignedTo?.name || t.employeeName || "-"}</td>
                    <td style={tdStyle}>{t.typeOfTask || "-"}</td>
                    <td style={tdStyle}>
                      {t.dateOfTaskAssignment
                        ? new Date(t.dateOfTaskAssignment).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {t.dateOfExpectedCompletion
                        ? new Date(t.dateOfExpectedCompletion).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td style={tdStyle}>{t.progressPercentage ?? 0}%</td>
                    <td style={tdStyle}>
                      {t.status?.name === "In Progress" && t.timeTracking?.isRunning ? (
                        <div className="d-flex align-items-center">
                          <span className="text-success fw-bold">
                            {formatTimeClock(timerSeconds[t._id] || t.timeTracking.totalSeconds || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="fw-normal">{t.time || "00:00:00"}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span>{getDerivedStatus(t)}</span>
                    </td>
                    {/* <td style={tdStyle}>
                      {currentUser && (
                        <button
                          className="btn btn-sm custom-outline-btn"
                          style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "4px" }}
                          onClick={(e) => handleAddCommentClick(e, t)}
                        >
                          Add Comment
                        </button>
                      )}
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted" style={{ userSelect: "none" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}>Rows per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", fontSize: "14px" }}
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
          <span style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}>
            {filteredTasks.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredTasks.length}`}
          </span>
          <div className="d-flex align-items-center" style={{ marginLeft: "16px" }}>
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* Comment Modal */}
      {commentModalTask && (
        <div
          ref={commentRef}
          tabIndex="-1"
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
          <div className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}>
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: "#3A5FBE" }}>
                <h5 className="modal-title mb-0">Add Comment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCommentModalTask(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Task: {commentModalTask.taskName}</label>
                </div>
                <div className="mb-3">
                  <label htmlFor="commentText" className="form-label">Comment</label>
                  <textarea
                    id="commentText"
                    className="form-control"
                    rows="4"
                    maxLength={300}
                    placeholder="Enter your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="char-count" style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                    {newComment.length}/300
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-sm custom-outline-btn" onClick={() => setCommentModalTask(null)}>Cancel</button>
                <button className="btn btn-sm custom-outline-btn" onClick={handleSubmitComment}>Submit Comment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          ref={viewEditRef}
          tabIndex="-1"
          className="modal fade show"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            overflow: "hidden",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}>
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: "#3A5FBE" }}>
                <h5 className="modal-title mb-0">Task Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTask(null)} />
              </div>
              <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Task Name</div>
                    <div className="col-7 col-sm-9">{selectedTask.taskName || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Project</div>
                    <div className="col-7 col-sm-9">{selectedTask.projectName || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Department</div>
                    <div className="col-7 col-sm-9">{selectedTask.department || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Task Type</div>
                    <div className="col-7 col-sm-9">{selectedTask.typeOfTask || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Assigned To</div>
                    <div className="col-7 col-sm-9">{selectedTask.assignedTo?.name || selectedTask.employeeName || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Created By</div>
                    <div className="col-7 col-sm-9">{selectedTask.createdBy?.name || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Description</div>
                    <div className="col-7 col-sm-9">{selectedTask.taskDescription || selectedTask.description || "-"}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Assign Date</div>
                    <div className="col-7 col-sm-9">
                      {selectedTask.dateOfTaskAssignment
                        ? new Date(selectedTask.dateOfTaskAssignment).toLocaleDateString("en-GB")
                        : "-"}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Due Date</div>
                    <div className="col-7 col-sm-9">
                      {selectedTask.dateOfExpectedCompletion
                        ? new Date(selectedTask.dateOfExpectedCompletion).toLocaleDateString("en-GB")
                        : "-"}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Status</div>
                    <div className="col-7 col-sm-9">
                      {selectedTask.status?.name === "Assignment Pending" ? "Unassigned" : selectedTask.status?.name}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Time Spent</div>
                    <div className="col-7 col-sm-9">
                      {selectedTask.status?.name === "In Progress" && selectedTask.timeTracking?.isRunning ? (
                        <span className="text-success fw-bold">
                          {formatTimeClock(timerSeconds[selectedTask._id] || selectedTask.timeTracking.totalSeconds || 0)}
                        </span>
                      ) : (
                        <span className="fw-normal">{selectedTask.time || "00:00:00"}</span>
                      )}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Progress</div>
                    <div className="col-7 col-sm-9">{selectedTask.progressPercentage || 0}%</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Estimated Hours</div>
                    <div className="col-7 col-sm-9">{selectedTask.estimatedHours || 0}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Document</div>
                    <div className="col-7 col-sm-9">
                      {selectedTask.documentPath || selectedTask.document || selectedTask.documents ? (
                        <div className="d-flex flex-column gap-2">
                          {(() => {
                            const doc = selectedTask.documentPath || selectedTask.document || selectedTask.documents;
                            let documentToShow = doc;
                            if (Array.isArray(doc) && doc.length > 0) documentToShow = doc[0];
                            const fileName = getFileName(documentToShow);
                            const fileUrl = getFileUrl(documentToShow);
                            return (
                              <div className="d-flex align-items-center justify-content-between p-2 border rounded">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-semibold">{fileName}</span>
                                </div>
                                <div className="ms-auto">
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileName} className="btn btn-sm btn-link text-decoration-none" title="Download">
                                    <i className="bi bi-download fs-5"></i>
                                  </a>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : "-"}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Comments</div>
                    <div className="col-7 col-sm-9">
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {taskComments && taskComments.length > 0 ? (
                          taskComments.map((comment, index) => {
                            const isCommentCreator = comment.user?._id === currentUserId;
                            const isEditing = editingCommentId === comment._id;

                            if (isEditing) {
                              return (
                                <div key={index} className="mb-2 p-2 border rounded">
                                  <div className="mt-2">
                                    <textarea
                                      className="form-control form-control-sm"
                                      rows="2"
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      maxLength={300}
                                    />
                                    <div className="d-flex justify-content-end gap-2 mt-2">
                                      <button type="button" className="btn custom-outline-btn" onClick={cancelEditing}>Cancel</button>
                                      <button type="button" className="btn custom-outline-btn" onClick={() => handleEditComment(comment._id, selectedTask._id, editingCommentText)}>Save</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={index} className="mb-2 p-2 border rounded">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <div>
                                    <strong>
                                      {comment.user?.name || "Unknown"}
                                      {comment.user?.role && <span style={{ fontWeight: "normal", marginLeft: "4px" }}>({comment.user.role})</span>}
                                    </strong>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <small className="text-muted">
                                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("en-GB") : ""}
                                    </small>
                                    {isCommentCreator && (
                                      <div className="d-flex align-items-center gap-1">
                                        <button
                                          className="btn btn-sm btn custom-outline-btn p-0"
                                          style={{ width: "20px", height: "20px" }}
                                          onClick={(e) => { e.stopPropagation(); startEditingComment(comment); }}
                                          title="Edit comment"
                                        >
                                          <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-danger p-0"
                                          style={{ width: "20px", height: "20px" }}
                                          onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment._id, selectedTask._id); }}
                                          title="Delete comment"
                                        >
                                          <i className="bi bi-trash3"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1">{comment.text || comment.comment}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-muted">No comments</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-sm custom-outline-btn" style={{ minWidth: "90px" }} onClick={() => setSelectedTask(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-end mt-3">
        <button className="btn btn-sm custom-outline-btn" style={{ minWidth: 90 }} onClick={() => window.history.go(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

const thStyle = {
  fontWeight: "500",
  fontSize: "14px",
  color: "#6c757d",
  borderBottom: "2px solid #dee2e6",
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  verticalAlign: "middle",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  whiteSpace: "nowrap",
  textTransform: "capitalize"
};

export default MangerTaskTMS;