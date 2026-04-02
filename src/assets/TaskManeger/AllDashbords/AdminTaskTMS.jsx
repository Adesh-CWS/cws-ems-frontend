import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const AdminTaskTMS = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [assignDateFromFilter, setAssignDateFromFilter] = useState("");
  const [assignDateToFilter, setAssignDateToFilter] = useState("");
  // Add this state with your other states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const popupRef = useRef(null);

  ////Komal Code
const getDerivedStatus = (task) => {
  const statusName = task.rawStatus;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignDate = task.assignDate ? new Date(task.assignDate) : null;
  if (assignDate) assignDate.setHours(0, 0, 0, 0);

  const deadline = task.deadline ? new Date(task.deadline) : null;
  if (deadline) deadline.setHours(0, 0, 0, 0);

  const timeSpent = task.timeSpent || 0;

  // // ✅ COMPLETED
  // if (statusName === "Completed") {
  //   if (deadline && task.updatedAt) {
  //     const completedDate = new Date(task.updatedAt);
  //     completedDate.setHours(0, 0, 0, 0);

  //     if (completedDate > deadline) {
  //       const diffDays = Math.ceil(
  //         (completedDate - deadline) / (1000 * 60 * 60 * 24)
  //       );
  //       return `Completed (Delayed by ${diffDays} days)`;
  //     }
  //   }
  //   return "Completed";
  // }

  if (statusName === "Completed") {
  if (deadline && task.updatedAt) {
    const completedDate = new Date(task.updatedAt);
    completedDate.setHours(0, 0, 0, 0);

    if (completedDate > deadline) {
      const diffDays = Math.ceil(
        (completedDate - deadline) / (1000 * 60 * 60 * 24)
      );
      return `Completed (Delayed by ${diffDays} days)`;
    }
  }
  return "Completed";
}


  // ✅ ASSIGNED → AUTO LOGIC
  if (statusName === "Assigned") {
    if (!assignDate) return "Assigned";

    if (today >= assignDate) {
      if (timeSpent === 0) {
        return "Assigned";
      }
      return "On Track (In Progress)";
    }

    return "Assigned";
  }

  // ✅ IN PROGRESS
  if (statusName === "In Progress") {
    if (deadline && today > deadline) {
      return "Delayed (In Progress)";
    }
    return "On Track (In Progress)";
  }

  return statusName || "Unknown";
};
  ///
  useEffect(() => {
    if (selectedTask && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedTask]);

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
////komal code 31-01-2026
 const fetchAllTasks = async () => {
    try {
      const res = await axios.get("http://localhost:8000/task/getall");

      const mappedTasks = res.data.map((task) => {
  const mappedTask = {
    _id: task._id,
    projectName: task.projectName,
    title: task.taskName,
    description: task.taskDescription,

    // RAW status from DB
    rawStatus: task.status?.name || task.status,

    assignDate: task.dateOfTaskAssignment,
    deadline: task.dateOfExpectedCompletion,
    createdAt: task.createdAt,

    assignedTo: task.assignedTo?.name || "Unassigned",
    createdBy: task.createdBy?.name || "Unknown",
    updatedAt: task.updatedAt,   // ⭐ REQUIRED FOR DELAY CALCULATION


    timeTracking: task.timeTracking || null,
    timeSpent: task.timeTracking?.totalSeconds || 0,

    time: task.timeTracking
      ? formatTimeClock(task.timeTracking.totalSeconds || 0)
      : "00:00:00",
  };

  // ✅ NOW derive status (after all fields exist)
  mappedTask.status = getDerivedStatus(mappedTask);

  return mappedTask;
});


      mappedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllTasks(mappedTasks);
      setFilteredTasks(mappedTasks);
      const newActiveTimers = {};
      mappedTasks.forEach((task) => {
        if (
          task.status === "In Progress" &&
          task.timeTracking?.isRunning &&
          task.timeTracking?.startTime
        ) {
          const startTime = new Date(task.timeTracking.startTime);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const totalSeconds =
            (task.timeTracking.totalSeconds || 0) + elapsedSeconds;

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
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS
  useEffect(() => {
    fetchAllTasks();
  }, []);

  // useEffect(() => {
  //   applyFilters();
  // }, [
  //   allTasks,
  //   statusFilter,
  //   projectFilter,
  //   assignDateFromFilter,
  //   assignDateToFilter,
  // ]);

  // Get unique project names for dropdown
  const uniqueProjects = [
    "All",
    ...new Set(allTasks.map((task) => task.projectName)),
  ];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  ////
  // const calculateTaskStatus = () => {
  //   const totalTasks = filteredTasks.length; // Use filteredTasks
  //   const completedTasks = filteredTasks.filter(
  //     (task) => task.status === "Completed",
  //   ).length;
  //   const ongoingTasks = filteredTasks.filter(
  //     (task) => task.status === "In Progress",
  //   ).length;
  //   const unassignedTasks = filteredTasks.filter(
  //     (task) => task.status === "Assignment Pending",
  //   ).length;
  //   const holdTasks = filteredTasks.filter(
  //     (task) => task.status === "On Hold" || task.status === "Hold",
  //   ).length;
  //   const cancelledTasks = filteredTasks.filter(
  //     (task) => task.status === "Cancelled",
  //   ).length;
  //   const delayedTasks = filteredTasks.filter(
  //     (task) => task.status === "Delayed",
  //   ).length;
  //   const assignedTasks = filteredTasks.filter(
  //     (task) => task.status === "Assigned",
  //   ).length;

  //   return {
  //     totalTasks,
  //     completedTasks,
  //     ongoingTasks,
  //     unassignedTasks,
  //     holdTasks,
  //     cancelledTasks,
  //     delayedTasks,
  //     assignedTasks,
  //   };
  // };

  // const stats = calculateTaskStatus();
  ////

  ////Komal code
const calculateTaskStatus = () => {
  const totalTasks = allTasks.length;

  const completedTasks = allTasks.filter(
    (task) => task.status.startsWith("Completed")
  ).length;

  // ✅ In Progress = On Track + Delayed (In Progress)
  const ongoingTasks = allTasks.filter(
    (task) =>
      task.status === "On Track (In Progress)" ||
      task.status === "Delayed (In Progress)" ||
    task.status === "Delayed"
    ).length;

  const unassignedTasks = allTasks.filter(
    (task) => task.status === "Assignment Pending"
  ).length;

  const holdTasks = allTasks.filter(
    (task) => task.status === "On Hold" || task.status === "Hold"
  ).length;

  const cancelledTasks = allTasks.filter(
    (task) => task.status === "Cancelled"
  ).length;

  // ✅ Delayed ONLY means delayed-in-progress
  const delayedTasks = allTasks.filter(
    (task) => task.status === "Delayed (In Progress)" || 
    task.status === "Delayed"
  ).length;

  const assignedTasks = allTasks.filter(
    (task) => task.status === "Assigned"
  ).length;

  return {
    totalTasks,
    completedTasks,
    ongoingTasks,
    unassignedTasks,
    holdTasks,
    cancelledTasks,
    delayedTasks,
    assignedTasks,
  };
};


  const stats = calculateTaskStatus();
  ////

  //  Updated applyFilters function
 const applyFilters = () => {
  let temp = [...allTasks];

  //  Search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();

    temp = temp.filter((task) => {
      const searchableFields = [
        task.projectName,
        task.title,
        task.assignedTo,
        // task.description,
        task.status,
        task.createdBy,
        task.time,
        task.assignDate,
        task.deadline,
      ];

      return searchableFields
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }

  //  Assign Date range filter (NO Date object usage)
  if (assignDateFromFilter || assignDateToFilter) {
    temp = temp.filter((task) => {
      if (!task.assignDate) return false;

      const taskDateStr = task.assignDate.slice(0, 10); // YYYY-MM-DD

      return (
        (!assignDateFromFilter ||
          taskDateStr >= assignDateFromFilter) &&
        (!assignDateToFilter || taskDateStr <= assignDateToFilter)
      );
    });
  }

  //  Sort by deadline (safe)
  temp.sort(
    (a, b) =>
      new Date(a.deadline || "9999-12-31") -
      new Date(b.deadline || "9999-12-31")
  );

  setFilteredTasks(temp);
  setCurrentPage(1);
};
  const resetFilters = () => {
    setSearchQuery("");
    setAssignDateFromFilter("");
    setAssignDateToFilter("");
    setFilteredTasks([...allTasks]);
    setCurrentPage(1);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredTasks.length,
  );
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const cardBgColors = {
    "Total Tasks": "#D1ECF1",
    Completed: "#D7F5E4",
    Assigned: "#cfdffbff",
    "In Progress": "#D1E7FF",
    "Assignment Pending": "#E2E3E5",
    Testing: "#FFE493",
    Hold: "#FFF1CC",
    Review: "#E7DDF7",
    Cancelled: "#F8D7DA",
    Delayed: "#FFB3B3",
  };

  // const getStatusColor = (status) => ({
  //   backgroundColor: cardBgColors[status] || "#E2E3E5",
  //   padding: "8px 16px",
  //   borderRadius: "4px",
  //   fontSize: "13px",
  //   fontWeight: "500",
  //   display: "inline-block",
  //   width: "120px",
  //   textAlign: "center",
  //   color: "#3A5FBE",
  // });

  const [activeTimers, setActiveTimers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState({});

  const formatTimeClock = (totalSeconds) => {
    if (!totalSeconds) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const updatedTimers = { ...timerSeconds };
      let hasChanges = false;

      Object.keys(activeTimers).forEach((taskId) => {
        const timer = activeTimers[taskId];
        if (timer) {
          const elapsedSeconds = Math.floor(
            (now - new Date(timer.startTime)) / 1000,
          );
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

  const isAnyPopupOpen = !!selectedTask;

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
    <div className="container-fluid ">
      <h2 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>Tasks</h2>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {/* Row 1 - 4 Cards */}
         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
              className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.totalTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Total Tasks
              </p>
            </div>
          </div>
        </div>

         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D7F5E4",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.completedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Completed Tasks
              </p>
            </div>
          </div>
        </div>
         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFE493",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.assignedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Assigned Tasks
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
              className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#F1F3F5",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.unassignedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Unassigned Tasks
              </p>
            </div>
          </div>
        </div>
         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1E7FF",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.ongoingTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                In Progress Tasks
              </p>
            </div>
          </div>
        </div>

         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFF1CC",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.holdTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Tasks On Hold
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#F2C2C2",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.cancelledTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Cancelled Tasks
              </p>
            </div>
          </div>
        </div>

         <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4 className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFB3B3",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.delayedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "18px" }}
              >
                Delayed Tasks
              </p>
            </div>
          </div>
        </div>

        {/* Empty Card Placeholder */}
        {/* <div className="col-md-3"></div> */}
      </div>
      {/* Filter design */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            {/*  SEARCH */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1">
              <label
                htmlFor="searchFilter"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Search
              </label>
              <input
                id="searchFilter"
                type="text"
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: 150 }}
              />
            </div>

            {/*  FROM DATE  */}
            <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
              <label
                htmlFor="assignDateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                id="assignDateFromFilter"
                type="date"
                className="form-control"
                value={assignDateFromFilter}
                onChange={(e) => setAssignDateFromFilter(e.target.value)}
                style={{ minWidth: 150 }}
              />
            </div>

            {/*  TO DATE  */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="assignDateToFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                To
              </label>
              <input
                id="assignDateToFilter"
                type="date"
                className="form-control"
                value={assignDateToFilter}
                onChange={(e) => setAssignDateToFilter(e.target.value)}
                style={{ minWidth: 150 }}
              />
            </div>

            {/*  BUTTONS  */}
            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="submit"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* filter design end */}

      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
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
                  Task Name
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
                  Created By
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
                  Assigned To
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
                  Assigned Date
                </th>
                {/* <th style={{ fontWeight: '500', fontSize: '14px', color: '#6c757d', borderBottom: '2px solid #dee2e6', padding: '12px', whiteSpace: 'nowrap' }}>Expected Date</th> */}
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
                  Deadline
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
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-4"
                    style={{ color: "#212529" }}
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((task, index) => (
                  <tr
                    key={index}
                    onClick={() => setSelectedTask(task)}
                    style={{ cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="mb-0 fw-normal">{task.projectName}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="mb-0 fw-normal">{task.title}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="mb-0 fw-normal">{task.createdBy}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "250px",
                      }}
                    >
                      <span className="fw-normal" title={task.assignedTo}>
                        {task.assignedTo || "-"}
                      </span>
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
                      <span>{task.status}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">
                        {formatDate(task.assignDate)}
                      </span>
                    </td>
                    {/* <td style={{
                      padding: '12px',
                      verticalAlign: 'middle',
                      fontSize: '14px',
                      borderBottom: '1px solid #dee2e6',
                      whiteSpace: 'nowrap',
                      color: "#212529"
                    }}>
                      <span className="fw-normal">
                        {formatDate(task.expectedDate)}
                      </span>
                    </td> */}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">
                        {formatDate(task.deadline)}
                      </span>
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
                      {task.status === "In Progress" &&
                      task.timeTracking?.isRunning ? (
                        <div className="d-flex align-items-center">
                          <span className="text-success fw-bold">
                            {formatTimeClock(
                              timerSeconds[task._id] ||
                                task.timeTracking.totalSeconds ||
                                0,
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="fw-normal">
                          {task.time || "00:00:00"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Rows per page */}
          <div className="d-flex align-items-center">
            <span
              style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}
            >
              Rows per page:
            </span>
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

          {/* Range display */}
          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {filteredTasks.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${
                  filteredTasks.length
                }`}
          </span>

          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {selectedTask && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={trapFocus}
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
         // onClick={() => setSelectedTask(null)}   //comment by harshada
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Task Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedTask(null)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Project Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.projectName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.title}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Created By
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.createdBy}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Assigned To
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.assignedTo}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Description
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.description}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Assign Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedTask.assignDate)}
                    </div>
                  </div>

                  {/* <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Expected Date</div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{formatDate(selectedTask.expectedDate)}</div>
                  </div> */}

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Deadline
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedTask.deadline)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Time Spent
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.status === "In Progress" &&
                      selectedTask.timeTracking?.isRunning ? (
                        <div className="d-flex align-items-center">
                          <span className="text-success fw-bold">
                            {formatTimeClock(
                              timerSeconds[selectedTask._id] ||
                                selectedTask.timeTracking.totalSeconds ||
                                0,
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="fw-normal">
                          {selectedTask.time || "00:00:00"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div className="col-7 col-sm-9">
                      <span>
                        {selectedTask.status === "Assignment Pending"
                          ? "Unassigned"
                          : selectedTask.status?.name ||
                            selectedTask.status ||
                            "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
              </div>
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
    </div>
  );
};

export default AdminTaskTMS;
