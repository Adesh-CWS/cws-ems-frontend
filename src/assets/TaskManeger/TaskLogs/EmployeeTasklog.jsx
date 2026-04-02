import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import TextField from "@mui/material/TextField";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import axios from "axios";
import "./Tasklog.css";

const EmployeeTasklog = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modalMode, setModalMode] = useState("add");
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const isMobile = window.innerWidth <= 768;
  const token = localStorage.getItem("accessToken");

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const modalRef = useRef(null); // showModal
  const viewModalRef = useRef(null);
  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    if (showViewModal && viewData && viewModalRef.current) {
      viewModalRef.current.focus();
    }
  }, [showViewModal, viewData]);

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
  // rutuja code start
  const CHAR_LIMITS = {
    workDescription: 200,
    challengesFaced: 200,
    whatLearnedToday: 200,
  };

  const countChars = (text) => {
    if (!text) return 0;
    return text.length;
  };

  const autoExpand = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const handleTextChange = (field, value) => {
    const charCount = countChars(value);
    const limit = CHAR_LIMITS[field];

    if (charCount > limit) {
      const truncated = value.substring(0, limit);
      setForm({ ...form, [field]: truncated });
      return;
    }

    setForm({ ...form, [field]: value });
  };

  // rutuja code end

  const getTaskDayNumber = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Today outside task period
    if (today < start || today > end) return null;

    let count = 0;
    let current = new Date(start);

    while (current <= today) {
      const day = current.getDay(); // 0 = Sunday, 6 = Saturday
      const date = current.getDate();

      // Exclude Sundays
      if (day === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Exclude first and third Saturdays
      if (day === 6 && (date <= 7 || (date >= 15 && date <= 21))) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
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
    const start = new Date(startIso);
    const end = new Date(endIso);
    let count = 0;

    // Helper to check if a date is 1st or 3rd Saturday
    function isFirstOrThirdSaturday(date) {
      if (date.getDay() !== 6) return false; // Not Saturday
      const day = date.getDate();
      const weekNumber = Math.ceil(day / 7);
      return weekNumber === 1 || weekNumber === 3;
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue; // Skip Sunday
      if (isFirstOrThirdSaturday(d)) continue; // Skip 1st & 3rd Saturday
      count++;
    }

    return count;
  }

  // Example usage:
  const totalDays = getWorkingDays(
    "2026-01-01T00:00:00.000Z",
    "2026-01-15T00:00:00.000Z",
  );
  console.log(totalDays); // Correct total working days

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  const formatDateWithoutYear = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateString));

  useEffect(() => {
    fetchLogs();
  }, []);

  // rutuja code start updated function
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const logRes = await fetch(
        `http://localhost:8000/api/tasklogs/employee/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const logsData = await logRes.json();

      const taskRes = await fetch(
        `http://localhost:8000/tasks/assigned/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const tasksData = await taskRes.json();
      setLogs(logsData);
      setTasks(tasksData.tasks || tasksData);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  // rutuja code end

  const getStatusColor = (status) => {
    switch (status) {
      case "Submitted":
        return {
          backgroundColor: "#d1f2dd",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#0f5132",
        };
      case "In Progress":
        return {
          backgroundColor: "#d1e7ff",
          padding: "7px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#0d6efd",
        };
      case "Pending":
        return {
          backgroundColor: "#FFE493",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#664d03",
        };
      case "Approved":
        return {
          backgroundColor: "#f1dabfff",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#e9700eff",
        };
      case "Rejected":
        return {
          backgroundColor: "#f8d7da",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#842029",
        };
      default:
        return {
          backgroundColor: "#bfcfeeff",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#495057",
        };
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      setTodayTasks(getTodayAssignedTaskIds());
    }
  }, [tasks]);

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const getTodayAssignedTaskIds = () => {
    const today = normalizeDate(new Date());

    return tasks.filter((task) => {
      const start = normalizeDate(task.dateOfTaskAssignment);
      const end = normalizeDate(task.dateOfExpectedCompletion);

      return task.status?.name === "Assigned" && today >= start && today <= end;
    });
  };
  console.log("today's task", todayTasks);

  const [form, setForm] = useState({
    task: "",
    employee: user._id,
    date: new Date().toISOString().split("T")[0], //ADDED by rutuja
    startTime: null,
    endTime: null,
    totalHours: "",
    workDescription: "",
    challengesFaced: "",
    whatLearnedToday: "",
    status: "",
    progressToday: "",
  });

  const calculateHours = (start, end) => {
    if (!start || !end) return "";
    if (!dayjs.isDayjs(start) || !dayjs.isDayjs(end)) return "";
    const diff = end.diff(start, "minute");
    if (diff <= 0) return "";

    const hours = diff / 60;
    const rounded = Math.round(hours * 1000) / 1000;
    const truncated = Math.floor(rounded * 100) / 100;

    return Number.isInteger(truncated)
      ? truncated.toString()
      : truncated.toFixed(2);
  };

  const formatDisplayHours = (h) => {
    if (h === null || h === undefined) return "";
    const num = Number(h);
    if (Number.isNaN(num)) return "";
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  // upated by rutuja

  // async function handleSave(e) {
  //     e.preventDefault();
  //     const token = localStorage.getItem("accessToken");
  //     try {

  //       const payload = {
  //             task:form.task,
  //             employee:user._id,
  //             date: form.date,
  //             startTime: form.startTime ? form.startTime.format("HH:mm") : "",
  //             endTime: form.endTime ? form.endTime.format("HH:mm") : "",
  //             totalHours: Number(form.totalHours),
  //             workDescription:form.workDescription,
  //             challengesFaced:form.challengesFaced,
  //             whatLearnedToday:form.whatLearnedToday,
  //             status: form.status,
  //       };
  //       if (payload.status === "InProgress") {
  //           payload.progressToday =  Number(form.progressToday);
  //        }
  //       console.log("payload", payload);
  //       let res;
  //       if (editIndex !== null) {
  //         res = await axios.put(
  //           `http://localhost:8000/api/tasklogs/${editIndex}`,
  //           payload,
  //           {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${token}`
  //           }
  //         }
  //         );
  //          await fetchLogs();
  //       } else {
  //         const res = await axios.post(
  //           "http://localhost:8000/api/tasklogs/",
  //           payload,
  //           {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${token}`
  //           }
  //         }
  //         );
  //         await fetchLogs();
  //       }
  //       setForm({
  //           task: "",
  //           employee:"",
  //           date: "",
  //           startTime: null,
  //           endTime: null,
  //           totalHours: "",
  //           workDescription: "",
  //           challengesFaced: "",
  //           whatLearnedToday: "",
  //           status: "",
  //           progressToday: ""
  //         });
  //       setShowModal(false);
  //       alert(editIndex ? "Log updated" : "WorkLog created");
  //       setEditIndex(null);

  //     } catch (error) {
  //        const backendMessage =
  //         error.response?.data?.message ||
  //         error.response?.data?.error ||
  //     "Something went wrong. Please try again.";
  //       console.error("Submit failed:", error.response?.data || error.message);
  //       alert(backendMessage);
  //     }
  //   };

  async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("No authentication token found. Please log in again.");
      return;
    }

    try {
      const payload = {
        task: form.task,
        employee: user._id,
        date: form.date,
        startTime: form.startTime ? form.startTime.format("HH:mm") : null,
        endTime: form.endTime ? form.endTime.format("HH:mm") : null,
        totalHours: Number(form.totalHours) || 0,
        workDescription: form.workDescription,
        challengesFaced: form.challengesFaced,
        whatLearnedToday: form.whatLearnedToday,
        status: form.status,
        ...(form.status === "InProgress" ||
          (form.status === "In Progress" && {
            progressToday: Number(form.progressToday) || 0,
          })),
      };

      const endpoint =
        editIndex !== null
          ? `http://localhost:8000/api/tasklogs/${editIndex}`
          : "http://localhost:8000/api/tasklogs/";

      const method = editIndex !== null ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save task log");
      }

      const result = await response.json();

      setForm({
        task: "",
        employee: user._id,
        date: new Date().toISOString().split("T")[0],
        startTime: null,
        endTime: null,
        totalHours: "",
        workDescription: "",
        challengesFaced: "",
        whatLearnedToday: "",
        status: "",
        progressToday: "",
      });

      setShowModal(false);
      setEditIndex(null);

      await fetchLogs();

      alert(
        editIndex ? "Log updated successfully" : "WorkLog created successfully",
      );
    } catch (error) {
      console.error("Submit failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
    }
  }

  // rutuja code end

  useEffect(() => {
    if (form.status === "InProgress" || form.status === "In Progress") {
      console.log("Progress input should be visible");
    }
  }, [form.status]);

  // const handleFilter = () => {
  //   let data = [...logs];

  //   if (searchText) {
  //     data = data.filter(
  //       (l) =>
  //         l?.task?.taskName.toLowerCase().includes(searchText.toLowerCase()) ||
  //         l?.workDescription.toLowerCase().includes(searchText.toLowerCase()) ||
  //         l.status.toLowerCase().includes(searchText.toLowerCase()),
  //     );
  //   }

  //   if (filterDate) {
  //     data = data.filter((l) => l.date === filterDate);
  //   }

  //   setFilteredLogs(data);
  // };

  const handleFilter = () => {
    let data = [...logs];

    if (searchText) {
      const search = searchText.trim().toLowerCase();
      const searchNumber = Number(search);
      const isNumberSearch = !isNaN(searchNumber);

      data = data.filter((l) => {
        const taskName = l?.task?.taskName?.toLowerCase() || "";
        const desc = l?.workDescription?.toLowerCase() || "";
        const status = l?.status?.toLowerCase() || "";

        // ✅ Time Spent (2, 2 hrs, 2.5)
        const timeSpent =
          l?.totalHours !== undefined ? `${l.totalHours} hrs` : "";

        // ✅ Working Days (calculated)
        const workingDays =
          l?.task?.dateOfTaskAssignment && l?.task?.dateOfExpectedCompletion
            ? getWorkingDays(
                l.task.dateOfTaskAssignment,
                l.task.dateOfExpectedCompletion,
              ).toString()
            : "";

        return (
          (!isNumberSearch &&
            (taskName.includes(search) ||
              desc.includes(search) ||
              status.includes(search))) ||
          // ✅ Time Spent (only when user types hr / hrs)
          (search.includes("hr") && timeSpent.toLowerCase().includes(search)) ||
          // ✅ Working Days (ONLY exact number)
          (isNumberSearch && Number(workingDays) === searchNumber)
        );
      });
    }

    if (filterDate) {
      const filter = new Date(filterDate);

      data = data.filter((l) => {
        // Use date range if available
        const start =
          l?.task?.dateOfTaskAssignment || l?.startDate || l?.date || "";
        const end =
          l?.task?.dateOfExpectedCompletion || l?.endDate || l?.date || "";

        if (!start || !end) return false;

        const startDate = new Date(start);
        const endDate = new Date(end);

        // check if filterDate is within the task date range
        return filter >= startDate && filter <= endDate;
      });
    }

    setFilteredLogs(data);
    setIsFiltered(true);
    setPage(0);
  }; /////samiksha

  const handleReset = () => {
    setSearchText("");
    setFilterDate("");
    setFilteredLogs([]);
    setIsFiltered(false);
    setPage(0);
  };

  const handleEdit = (log) => {
    setEditIndex(log._id);
    setShowModal(true);
    setModalMode("edit");
    console.log("logs", log);
    setForm({
      task: log?.task?._id || "",
      employee: user._id,
      date: log?.date ? new Date(log.date).toISOString().split("T")[0] : "",
      startTime: log.startTime ? dayjs(log.startTime, "HH:mm") : null,
      endTime: log.endTime ? dayjs(log.endTime, "HH:mm") : null,
      totalHours: log?.totalHours,
      workDescription: log?.workDescription,
      challengesFaced: log?.challengesFaced,
      whatLearnedToday: log?.whatLearnedToday,
      status: log?.status || "",
      progressToday: log?.progressToday || "",
    });
  };

  const tableData = isFiltered ? filteredLogs : logs;
  const totalRows = tableData.length;

  const paginatedData = tableData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const isViewMode = modalMode === "view";
  const handleRowClick = (rowData) => {
    setModalMode("view");
    setViewData(rowData);
    setShowViewModal(true);
  };
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  useEffect(() => {
    if (showModal || showViewModal) {
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
  }, [showModal, showViewModal]);

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
          width: 268px !important;

          max-width: 285px !important;
        }
      }
      `}
      </style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0" style={{ color: "#3A5FBE", fontSize: "25px" }}>
          My Worklog
        </h3>

        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            setModalMode("add");
            setEditIndex(null);
            setForm({
              task: "",
              employee: user._id,
              date: new Date().toISOString().split("T")[0],
              startTime: null,
              endTime: null,
              totalHours: "",
              workDescription: "",
              challengesFaced: "",
              whatLearnedToday: "",
              status: "",
            });
            setShowModal(true);
          }}
          style={{ minWidth: 90 }}
        >
          + Add Log
        </button>
      </div>

      {/* SEARCH BAR */}
      {/* mahesh code search bar */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center  gap-3  mb-1 ms-1">
              <label
                htmlFor="searchFilter"
                className="fw-bold mb-0"
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
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-1">
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

      {/* TABLE */}
      <div
        style={{
          background: "#fff",

          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <table
          className="mb-0"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            padding: "20px",
          }}
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
                "Task",
                "Period",
                "Working Days",
                "Time Spent",
                "Description",
                "Status",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#475569",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* {tableData.length === 0 ? ( */}
            {/* samiksha */}
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    padding: "18px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  No data
                </td>
              </tr>
            ) : (
              paginatedData.map((l, i) => (
                <tr
                  onClick={() => handleRowClick(l)}
                  key={l._id}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid #cdd2dcff",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
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
                    {formatDate(l.date)}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      textTransform: "capitalize",
                    }}
                  >
                    {l?.task?.taskName || l.task}
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
                    {l?.task?.dateOfTaskAssignment &&
                    l?.task?.dateOfExpectedCompletion ? (
                      <>
                        {/* Period */}
                        <div>
                          {formatDateWithoutYear(l.task.dateOfTaskAssignment)} →{" "}
                          {formatDateWithoutYear(
                            l.task.dateOfExpectedCompletion,
                          )}
                        </div>

                        {/* Day badge ONLY for today's log */}
                        {isToday(l.date) &&
                          (() => {
                            const dayNumber = getTaskDayNumber(
                              l.task.dateOfTaskAssignment,
                              l.task.dateOfExpectedCompletion,
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
                      "—"
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
                    {l?.task?.dateOfTaskAssignment &&
                    l?.task?.dateOfExpectedCompletion
                      ? getWorkingDays(
                          l.task.dateOfTaskAssignment,
                          l.task.dateOfExpectedCompletion,
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
                    {formatDisplayHours(l.totalHours)} Hrs
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      width: "300px",
                      height: "60px",
                      overflow: "auto",
                      wordWrap: "break-word",
                      // display: "block",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "60px",
                        overflowY: "auto",
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {l.workDescription}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* ///harshda code change */}
                    <span>
                      {l.status}
                      {(l.status === "InProgress" ||
                        l.status === "In Progress") && (
                        <span
                          style={{ marginLeft: "5px" }} ///harshda code change
                        >
                          {l.progressToday}%
                        </span>
                      )}
                    </span>
                  </td>

                  {/* ACTION */}
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
                      style={{
                        minWidth: 90,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(l);
                      }}
                      className="btn btn-sm custom-outline-btn"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          padding: "14px 10px",
          fontSize: 14,
          color: "#475569",
        }}
      >
        {/* Rows per page */}
        <span>Rows per page:</span>

        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>

        {/* Count */}
        <span>
          {page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows}
        </span>

        {/* Prev */}
        <button
          className="btn btn-sm focus-ring "
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          style={{
            border: "none",
            background: "transparent",
            cursor: page === 0 ? "not-allowed" : "pointer",
            fontSize: 18,
            color: page === 0 ? "#cbd5e1" : "#334155",
          }}
        >
          ‹
        </button>

        {/* Next */}
        <button
          className="btn btn-sm focus-ring "
          onClick={() =>
            setPage((p) => ((p + 1) * rowsPerPage >= totalRows ? p : p + 1))
          }
          disabled={(page + 1) * rowsPerPage >= totalRows}
          style={{
            border: "none",
            background: "transparent",
            cursor:
              (page + 1) * rowsPerPage >= totalRows ? "not-allowed" : "pointer",
            fontSize: 18,
            color:
              (page + 1) * rowsPerPage >= totalRows ? "#cbd5e1" : "#334155",
          }}
        >
          ›
        </button>
      </div>
      {/* MODAL */}
      {showModal && (
        <div
          ref={modalRef}
          tabIndex="-1"
          onKeyDown={trapFocus(modalRef)}
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
          // onClick={() => setShowModal(false)}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: "600px",
              width: "95%",
              marginTop: "120px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                height: "85vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* HEADER */}
              <div
                className="modal-header"
                style={{ background: "#3A5FBE", color: "#fff", flexShrink: 0 }}
              >
                <h5 className="modal-title">
                  {modalMode === "add" && "Add Worklog"}
                  {modalMode === "edit" && "Edit Worklog"}
                  {modalMode === "view" && "View Worklog"}
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              {/* BODY */}
              {/* BODY */}
              <div
                className="modal-body"
                style={{
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div className="row g-3">
                  {/* Select Task */}
                  <div className="col-12">
                    <label className="form-label mb-0">Select Task</label>
                    <select
                      className="form-select"
                      disabled={isViewMode}
                      value={form.task}
                      onChange={(e) =>
                        setForm({ ...form, task: e.target.value })
                      }
                    >
                      <option value="">Select Task</option>
                      {todayTasks.map((task) => (
                        <option key={task._id} value={task._id}>
                          {/* rutuja code start */}
                          {task.projectName ||
                            task.task?.projectName ||
                            "Project"}{" "}
                          - {task.taskName || "Task"}
                          {/* rutuja code end */}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      disabled={isViewMode}
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Start Time</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        disabled={isViewMode}
                        value={form.startTime}
                        onChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            startTime: v,
                            totalHours: calculateHours(v, p.endTime),
                          }))
                        }
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  {/* End Time */}
                  <div className="col-md-6">
                    <label className="form-label">End Time</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        disabled={isViewMode}
                        value={form.endTime}
                        onChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            endTime: v,
                            totalHours: calculateHours(p.startTime, v),
                          }))
                        }
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="col-12">
                    {/* rutuja code only label */}
                    <label className="form-label">Work Description</label>

                    <textarea
                      className="form-control"
                      rows={2}
                      disabled={isViewMode}
                      value={form.workDescription}
                      // rutuja code start
                      onChange={(e) => {
                        handleTextChange("workDescription", e.target.value);
                        autoExpand(e);
                      }}
                      onFocus={autoExpand}
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "60px",
                      }}
                      required

                      // rutuja code end
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
                      ({countChars(form.workDescription)}/
                      {CHAR_LIMITS.workDescription} characters)
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="col-12">
                    {/* rutuja code update only label */}
                    <label className="form-label">Challenges Faced</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      disabled={isViewMode}
                      value={form.challengesFaced}
                      // rutuja code start
                      onChange={(e) => {
                        handleTextChange("challengesFaced", e.target.value);
                        autoExpand(e);
                      }}
                      onFocus={autoExpand}
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "60px",
                      }}
                      // rutuja code end
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
                      ({countChars(form.challengesFaced)}/
                      {CHAR_LIMITS.challengesFaced} characters)
                    </div>
                  </div>

                  {/* Learned */}
                  <div className="col-12">
                    {/* rutuja code updated only label */}
                    <label className="form-label">What I Learned Today</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      disabled={isViewMode}
                      value={form.whatLearnedToday}
                      // rutuja code start
                      onChange={(e) => {
                        handleTextChange("whatLearnedToday", e.target.value);
                        autoExpand(e);
                      }}
                      onFocus={autoExpand}
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "60px",
                      }}
                      // rutuja code end
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
                      ({countChars(form.whatLearnedToday)}/
                      {CHAR_LIMITS.whatLearnedToday} characters)
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-12">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      disabled={isViewMode}
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="">Select Status</option>
                      <option value="Submitted">Submitted</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>

                  {/* Show Progress Today input only if InProgress */}
                  {form.status === "InProgress" ||
                    (form.status === "In Progress" && (
                      <div className="col-12">
                        <label>Progress Today (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.progressToday}
                          onChange={(e) =>
                            setForm({ ...form, progressToday: e.target.value })
                          }
                          required
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            marginTop: 6,
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  style={{ minWidth: 90 }}
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                {modalMode !== "view" && (
                  <button
                    type="button"
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={handleSave}
                  >
                    {modalMode === "edit" ? "Update" : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* rutuja code start */}
      {showViewModal && viewData && (
        <div
          ref={viewModalRef}
          tabIndex="-1"
          onKeyDown={trapFocus(viewModalRef)}
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
          // onClick={() => setShowViewModal(false)}  //comment by harshada
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: "600px",
              width: "95%",
              marginTop: "120px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">View Worklog</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewModal(false)}
                />
              </div>

              {/* BODY */}
              <div
                className="modal-body"
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                }}
              >
                <div className="container-fluid">
                  {/* Date */}
                  <div className="row mb-3">
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
                      {formatDate(viewData.date)}
                    </div>
                  </div>

                  {/* Task */}
                  <div className="row mb-3">
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
                      {viewData.task?.taskName}
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="row mb-3">
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
                      {viewData.startTime}
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="row mb-3">
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
                      {viewData.endTime}
                    </div>
                  </div>

                  {/* Time Spent */}
                  <div className="row mb-3">
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
                      {formatDisplayHours(viewData.totalHours)} hrs
                    </div>
                  </div>

                  {/* Status */}
                  <div className="row mb-3">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div className="col-7 col-sm-9">
                      <span>
                        {viewData.status}
                        {(viewData.status === "InProgress" ||
                          viewData.status === "In Progress") && (
                          <span
                            style={{
                              marginLeft: "6px", //remove colore harshada
                            }}
                          >
                            {viewData.progressToday}%
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="row mb-3">
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
                      {viewData.workDescription}
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="row mb-3">
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
                      {viewData.challengesFaced}
                    </div>
                  </div>

                  {/* What I Learned */}
                  <div className="row mb-3">
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
                      {viewData.whatLearnedToday}
                    </div>
                  </div>

                  {/* Approved By */}
                  {viewData.status === "Approved" && (
                    <div className="row mb-3">
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
                        {viewData?.approvedBy?.name || "-"}
                      </div>
                    </div>
                  )}

                  {/* Rejected By */}
                  {viewData.status === "Rejected" && (
                    <div className="row mb-3">
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
                        {viewData?.approvedBy?.name || "-"}
                      </div>
                    </div>
                  )}

                  {/* Not Yet Reviewed */}
                  {viewData.status !== "Rejected" &&
                    viewData.status !== "Approved" && (
                      <div className="row mb-3">
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

              {/* FOOTER */}
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* rutuja code end  */}

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

export default EmployeeTasklog;
