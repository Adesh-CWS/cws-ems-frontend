import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Tasklog.css";

const ManagerTasklog = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem("accessToken");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("task");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedDate, setSelectedDate] = useState("");
  const [workloadData, setWorkloadData] = useState([]);
  const [date, setDate] = useState("");
  const [workloadDate, setWorkloadDate] = useState("");
  const [workloadWeek, setWorkloadWeek] = useState("");
  const [workloadMonth, setWorkloadMonth] = useState("");
  const [workloadRangeLabel, setWorkloadRangeLabel] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Workload popup state
  const [selectedWorkload, setSelectedWorkload] = useState(null);

  const viewPopupRef = useRef(null);
  const workloadPopupRef = useRef(null);

  // Handle workload row click
  const handleWorkloadRowClick = (workload) => {
    setSelectedWorkload(workload);
  };

  const closeWorkloadView = () => {
    setSelectedWorkload(null);
  };

  const handleWorkloadReset = () => {
    setWorkloadDate("");
    setWorkloadWeek("");
    setWorkloadMonth("");
    setWorkloadData([]);
    setWorkloadRangeLabel("");
    setDate("");
    fetchWorkload();
  };

  useEffect(() => {
    if (viewOpen && viewPopupRef.current) {
      viewPopupRef.current.focus();
    }
  }, [viewOpen]);

  useEffect(() => {
    if (selectedWorkload && workloadPopupRef.current) {
      workloadPopupRef.current.focus();
    }
  }, [selectedWorkload]);

  const trapFocus = (ref) => (e) => {
    if (!ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

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

  // Helper Functions
  const getTaskDayNumber = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (today < start || today > end) return null;

    let count = 0;
    let current = new Date(start);

    while (current <= today) {
      const day = current.getDay();
      const date = current.getDate();

      if (day === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      if (day === 6 && (date <= 7 || (date >= 15 && date <= 21))) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const formatDateWithoutYear = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateString));
  };

  const isToday = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    return today.getTime() === date.getTime();
  };

  function getWorkingDays(startIso, endIso) {
    if (!startIso || !endIso) return 0;
    
    const start = new Date(startIso);
    const end = new Date(endIso);
    let count = 0;

    function isFirstOrThirdSaturday(date) {
      if (date.getDay() !== 6) return false;
      const day = date.getDate();
      const weekNumber = Math.ceil(day / 7);
      return weekNumber === 1 || weekNumber === 3;
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue;
      if (isFirstOrThirdSaturday(d)) continue;
      count++;
    }

    return count;
  }

  const renderStars = (rating, approved) => {
    if (!rating) return "-";
  
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const starColor = approved ? "#22c55e" : "#9ca3af";
  
    const renderHalfStar = () => (
      <span className="star half" style={{ display: 'inline-block' }}>★</span>
    );
  
    return (
      <span style={{ color: starColor, fontSize: 16 }}>
        {"★".repeat(fullStars)}
        {hasHalf && renderHalfStar()}
      </span>
    );
  };

  const isFirstOrThirdSaturday = (date) => {
    if (date.getDay() !== 6) return false;
    const week = Math.ceil(date.getDate() / 7);
    return week === 1 || week === 3;
  };

  const isWorkingDay = (date) => {
    if (date.getDay() === 0) return false;
    if (isFirstOrThirdSaturday(date)) return false;
    return true;
  };

  const findPreviousWorkingDayWithLogs = async () => {
    const token = localStorage.getItem("accessToken");
    let d = new Date();
    d.setDate(d.getDate() - 1);

    for (let i = 0; i < 15; i++) {
      if (isWorkingDay(d)) {
        const dateStr = d.toISOString().split("T")[0];

        try {
          const res = await axios.get(
            `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/daily-workload?date=${dateStr}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (res.data.data && res.data.data.length > 0) {
            return dateStr;
          }
        } catch (err) {
          console.error("Error fetching workload:", err);
        }
      }
      d.setDate(d.getDate() - 1);
    }

    return "";
  };

  const getUtilizationColor = (utilization) => {
    const baseStyle = {
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.4px",
      marginLeft: "6px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      display: "inline-block",
      lineHeight: "1",
    };
    switch (utilization) {
      case "Balanced":
        return {
          ...baseStyle,
          backgroundColor: "#d1f2dd",
          color: "#0f5132",
        };
      case "Underloaded":
        return {
          ...baseStyle,
          backgroundColor: "#d1e7ff",
          color: "#0d6efd",
        };
      case "Overloaded":
        return {
          ...baseStyle,
          backgroundColor: "#fee2e2",
          color: "#991b1b",
        };
      default:
        return baseStyle;
    }
  };

  useEffect(() => {
    const init = async () => {
      const date = await findPreviousWorkingDayWithLogs();
      setSelectedDate(date);
    };
    init();
  }, []);

  const fetchWorkload = async () => {
    if (!selectedDate) return;

    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(
        `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/daily-workload?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setDate(res.data.date);
      setWorkloadData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch workload", err);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, [selectedDate]);

  const gettingWorkload = async () => {
    try {
      let url = "";

      if (workloadDate) {
        url = `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/daily-workload?date=${workloadDate}`;
      } else if (workloadWeek) {
        const weekStartDate = getStartDateOfWeek(workloadWeek);
        url = `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/workload/weekly?date=${weekStartDate}`;
      } else if (workloadMonth) {
        const [year, month] = workloadMonth.split("-");
        url = `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/workload/monthly?year=${year}&month=${month}`;
      } else {
        console.warn("No filter selected");
        return;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch workload data");
      const json = await response.json();
      setDate(json.date);
      setWorkloadData(json.data || []);

      if (json.week) {
        const [start, end] = json.week.split(" - ");
        setWorkloadRangeLabel(`${formatDate(start)} – ${formatDate(end)}`);
      } else if (workloadDate) {
        setWorkloadRangeLabel(formatDate(workloadDate));
      } else if (workloadMonth) {
        const d = new Date(`${workloadMonth}-01`);
        setWorkloadRangeLabel(
          d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        );
      }
    } catch (error) {
      console.error("Error fetching workload:", error);
    }
  };

  function getStartDateOfWeek(weekStr) {
    const [year, week] = weekStr.split("-W").map(Number);
    const jan4 = new Date(year, 0, 4);
    const day = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - day + 1);
    const targetMonday = new Date(mondayWeek1);
    targetMonday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
    const y = targetMonday.getFullYear();
    const m = String(targetMonday.getMonth() + 1).padStart(2, "0");
    const d = String(targetMonday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatDisplayHours = (h) => {
    if (h === null || h === undefined) return "";
    const num = Number(h);
    if (Number.isNaN(num)) return "";
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  const fetchLogs = async () => {
    if (!user?._id) {
      console.error("No user ID found");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      console.log("Fetching logs for manager ID:", user._id);
      
      const response = await fetch(
        `https://ems-cws-backend-9wgt.vercel.app/api/tasklogs/manager/${user._id}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }
      
      const logsData = await response.json();
      console.log("Fetched logs:", logsData);
      
      if (logsData.length > 0) {
        console.log("Sample log task data:", logsData[0].task);
        console.log("Task dates:", {
          dateOfTaskAssignment: logsData[0].task?.dateOfTaskAssignment,
          dateOfExpectedCompletion: logsData[0].task?.dateOfExpectedCompletion
        });
      }
      
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user?._id]);

  // Filter function
  const handleFilter = () => {
    let data = [...logs];

    if (searchText) {
      const text = searchText.toLowerCase();

      data = data.filter((l) => {
        const workingDays =
          l?.task?.dateOfTaskAssignment && l?.task?.dateOfExpectedCompletion
            ? String(
                getWorkingDays(
                  l.task.dateOfTaskAssignment,
                  l.task.dateOfExpectedCompletion,
                )
              )
            : "";

        return (
          l.employee?.name?.toLowerCase().includes(text) ||
          l.task?.taskName?.toLowerCase().includes(text) ||
          l.status?.toLowerCase().includes(text) ||
          l.workDescription?.toLowerCase().includes(text) ||
          workingDays.includes(text)
        );
      });
    }

    if (filterDate) {
      data = data.filter((l) => {
        const logDate = l.date?.split("T")[0];
        const startDate = l.task?.dateOfTaskAssignment?.split("T")[0];
        const endDate = l.task?.dateOfExpectedCompletion?.split("T")[0];

        return (
          logDate === filterDate ||
          startDate === filterDate ||
          endDate === filterDate
        );
      });
    }

    setFilteredLogs(data);
    setIsFiltered(true);
  };

  const handleReset = () => {
    setSearchText("");
    setFilterDate("");
    setIsFiltered(false);
    setFilteredLogs(logs);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    handleFilter();
  };

  // Pagination
  const tableData = activeTab === "task" 
    ? (isFiltered ? filteredLogs : logs) 
    : workloadData;

  const safeTableData = Array.isArray(tableData) ? tableData : [];
  const totalItems = safeTableData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const paginatedData = safeTableData.slice(startIndex, endIndex);

  const isAnyPopupOpen = viewOpen || !!selectedWorkload;
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

  // Add this debug render
  console.log("Rendering with logs:", logs.length, "Filtered:", filteredLogs.length);

  return (
    <div className="container-fluid">
      <style>
        {`
        @media (max-width: 768px) {
          input[type="date"],
          input[type="week"],
          input[type="month"],
          input[type="search"],
          input[type="filter"] {
            font-size: 16px !important;
            height: 40px !important;
            width: 270px !important;
            max-width: 295px !important;
          }
        }
        `}
      </style>

      <h4 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        {activeTab === "task" ? "Task Logs" : "Work Load"}
      </h4>

      <div className="d-flex gap-2 justify-content-center mt-3 mb-3">
        <button
          onClick={() => {
            setActiveTab("task");
            setCurrentPage(1);
          }}
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 120 }}
        >
          Task Log
        </button>

        <button
          onClick={() => {
            setActiveTab("work");
            setCurrentPage(1);
          }}
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 120 }}
        >
          Work Load
        </button>
      </div>

      {/* Search/Filter Bar for Task Logs */}
      {activeTab === "task" && (
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body">
            <form
              className="row g-2 align-items-center"
              onSubmit={handleFilterSubmit}
            >
              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
                <label
                  htmlFor="searchFilter"
                  className="fw-bold mb-0 text-start text-md-end"
                  style={{ fontSize: "16px", color: "#3A5FBE" }}
                >
                  Search
                </label>
                <input
                  className="form-control"
                  placeholder="Search By Any Field..."
                  value={searchText}
                  type="search"
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ flex: 1, minWidth: "150px" }}
                />
              </div>
              <div className="col-12 col-md-auto d-flex align-items-center mb-1">
                <label
                  className="fw-bold mb-0 text-start text-md-end"
                  style={{
                    fontSize: "16px",
                    color: "#3A5FBE",
                    width: "50px",
                    minWidth: "50px",
                    marginRight: "8px",
                  }}
                >
                  Date
                </label>
                <input
                  className="form-control"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ flex: 1, minWidth: "150px" }}
                />
              </div>
              <div className="col-auto ms-auto d-flex gap-2">
                <button
                  onClick={handleFilter}
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                >
                  Filter
                </button>

                <button
                  onClick={handleReset}
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar for Work Load */}
      {activeTab === "work" && (
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
                <label
                  className="fw-bold mb-0"
                  style={{ fontSize: "16px", color: "#3A5FBE", minWidth: 50 }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={workloadDate}
                  className="form-control"
                  onChange={(e) => {
                    setWorkloadDate(e.target.value);
                    setWorkloadWeek("");
                    setWorkloadMonth("");
                  }}
                  style={{ flex: 1, minWidth: "150px" }}
                />
              </div>

              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
                <label
                  className="fw-bold mb-0"
                  style={{ fontSize: "16px", color: "#3A5FBE", minWidth: 50 }}
                >
                  Week
                </label>
                <input
                  type="week"
                  className="form-control"
                  value={workloadWeek}
                  onChange={(e) => {
                    setWorkloadWeek(e.target.value);
                    setWorkloadDate("");
                    setWorkloadMonth("");
                  }}
                  style={{ flex: 1, minWidth: "150px" }}
                />
              </div>

              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
                <label
                  className="fw-bold mb-0"
                  style={{ fontSize: "16px", color: "#3A5FBE", minWidth: 50 }}
                >
                  Month
                </label>
                <input
                  type="month"
                  className="form-control"
                  value={workloadMonth}
                  onChange={(e) => {
                    setWorkloadMonth(e.target.value);
                    setWorkloadDate("");
                    setWorkloadWeek("");
                  }}
                  style={{ flex: 1, minWidth: "150px" }}
                />
              </div>

              <div className="col-auto ms-auto d-flex gap-2">
                <button
                  type="button"
                  onClick={gettingWorkload}
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 110 }}
                >
                  Get Workload
                </button>

                <button
                  type="button"
                  onClick={handleWorkloadReset}
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Logs Table */}
      {activeTab === "task" && (
        <div
          style={{
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflowX: "auto",
          }}
        >
          {isLoading ? (
            <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>
          ) : (
            <table
              style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {[
                    "Date",
                    "Employee",
                    "Task",
                    "Period",
                    "Working Days",
                    "Hours",
                    "Status",
                    "Approved/Rejected",
                    "Rating",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                      No data found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((log, index) => {
                    const absoluteIndex = startIndex + index;
                    
                    // Debug log for each row
                    console.log(`Row ${index} task dates:`, {
                      assignment: log.task?.dateOfTaskAssignment,
                      completion: log.task?.dateOfExpectedCompletion
                    });
                    
                    return (
                      <tr
                        key={log._id}
                        onClick={() => {
                          setSelectedRow(log);
                          setViewOpen(true);
                        }}
                        style={{
                          cursor: "pointer",
                          borderBottom: "1px solid #e5e7eb",
                          background: "#fff",
                        }}
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
                          {formatDate(log.date)}
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
                          {log?.employee?.name || "-"}
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
                          {log?.task?.taskName || "-"}
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
                          {log?.task?.dateOfTaskAssignment &&
                          log?.task?.dateOfExpectedCompletion ? (
                            <>
                              <div>
                                {formatDateWithoutYear(
                                  log.task.dateOfTaskAssignment,
                                )}{" "}
                                →{" "}
                                {formatDateWithoutYear(
                                  log.task.dateOfExpectedCompletion,
                                )}
                              </div>

                              {isToday(log.date) &&
                                (() => {
                                  const dayNumber = getTaskDayNumber(
                                    log.task.dateOfTaskAssignment,
                                    log.task.dateOfExpectedCompletion,
                                  );

                                  return (
                                    dayNumber && (
                                      <div
                                        style={{
                                          display: "inline-block",
                                          marginTop: 6,
                                          padding: "2px 8px",
                                          borderRadius: 12,
                                          background: "#e0ecff",
                                          color: "#1d4ed8",
                                          fontSize: 12,
                                          fontWeight: 500,
                                        }}
                                      >
                                        Today • Day {dayNumber}
                                      </div>
                                    )
                                  );
                                })()}
                            </>
                          ) : (
                            <span style={{ color: "#999" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 14 }}>
                          {log?.task?.dateOfTaskAssignment &&
                          log?.task?.dateOfExpectedCompletion
                            ? getWorkingDays(
                                log.task.dateOfTaskAssignment,
                                log.task.dateOfExpectedCompletion,
                              )
                            : "—"}
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
                          {formatDisplayHours(log.totalHours)} Hrs
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
                          <span>
                            {log.status}
                            {log.status === "In Progress" && (
                              <span style={{ marginLeft: "5px" }}>
                                {log.progressToday}%
                              </span>
                            )}
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
                          {log?.approvedBy?.name || "-"}
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
                          {renderStars(log.rating, log?.status === "Approved")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Work Load Table */}
      {activeTab === "work" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            overflowX: "auto",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}
          >
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {[
                  "Date",
                  "Employee",
                  "Tasks",
                  "Est. Hours",
                  "Logged Hours",
                  "Utilization",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center" }}>
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                    }}
                    onClick={() => handleWorkloadRowClick(row)}
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
                      {workloadRangeLabel || formatDate(date)}
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
                      {row.employeeName}
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
                      {row.tasks}
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
                      {formatDisplayHours(row.estimatedHours)}
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
                      {formatDisplayHours(row.loggedHours)}
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
                      {row.utilization.toFixed(0)}%{" "}
                      <span style={getUtilizationColor(row.status)}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Popup for Task Logs */}
      {viewOpen && selectedRow && (
        <div
          ref={viewPopupRef}
          tabIndex="-1"
          onKeyDown={trapFocus(viewPopupRef)}
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
            className="modal-dialog modal-dialog-centered"
            style={{ width: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Task Log Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewOpen(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedRow.date)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Employee
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow?.employee?.name || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow?.task?.taskName || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Start Time
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow.startTime || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      End Time
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow.endTime || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Total Hours
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDisplayHours(selectedRow.totalHours)}
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
                        {selectedRow.status || "-"}
                        {selectedRow.status === "In Progress" && selectedRow.progressToday && (
                          <span style={{ marginLeft: "5px" }}>
                            {selectedRow.progressToday}%
                          </span>
                        )}
                      </span>
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
                      {selectedRow.workDescription || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Challenges
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow.challengesFaced || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      What I Learned
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedRow.whatLearnedToday || "-"}
                    </div>
                  </div>

                  {selectedRow.status === "Approved" && (
                    <>
                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Remarks
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {selectedRow.remarks || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Rating
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {renderStars(selectedRow.rating, true)}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Approved By
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {selectedRow?.approvedBy?.name || "-"}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRow.status === "Rejected" && (
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Rejected By
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedRow?.approvedBy?.name || "-"}
                      </div>
                    </div>
                  )}

                  {selectedRow.status !== "Rejected" &&
                    selectedRow.status !== "Approved" && (
                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Approval
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          Not Yet Reviewed
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setViewOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workload Popup */}
      {selectedWorkload && (
        <div
          ref={workloadPopupRef}
          tabIndex="-1"
          onKeyDown={trapFocus(workloadPopupRef)}
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
           className="modal-dialog modal-dialog-centered"
           style={{ width: "600px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Workload Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeWorkloadView}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Period
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {workloadRangeLabel || formatDate(date)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Employee
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedWorkload.employeeName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Tasks
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedWorkload.tasks}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Estimated Hours
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDisplayHours(selectedWorkload.estimatedHours)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Logged Hours
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDisplayHours(selectedWorkload.loggedHours)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Utilization
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedWorkload.utilization.toFixed(0)}%
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
                      <span
                        style={getUtilizationColor(selectedWorkload.status)}
                      >
                        {selectedWorkload.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeWorkloadView}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <span
                style={{
                  fontSize: "14px",
                  marginRight: "8px",
                  color: "#212529",
                }}
              >
                Rows per page:
              </span>
              <select
                className="form-select form-select-sm"
                style={{ width: "auto", fontSize: "14px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <span
              style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
            >
              {startIndex + 1}-{endIndex} of {totalItems}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm focus-ring"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: "#212529",
                }}
              >
                ‹
              </button>
              <button
                className="btn btn-sm focus-ring"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: "#212529",
                }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Back Button */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => {
            if (activeTab === "work") {
              setActiveTab("task");
              setCurrentPage(1);
            } else {
              window.history.go(-1);
            }
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ManagerTasklog;