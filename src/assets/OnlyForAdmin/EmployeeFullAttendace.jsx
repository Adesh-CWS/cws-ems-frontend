import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; //  Import xlsx

function EmployeeFullAttendance() {
  const { empId } = useParams();
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [displayData, setDisplayData] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [loadingBreaks, setLoadingBreaks] = useState(false);
  const modalRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState("");

  //rutuja code 28-03-2026
  const [weeklyOffConfig, setWeeklyOffConfig] = useState(null);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get("https://ems-cws-backend-9wgt.vercel.app/getHolidays", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHolidays(response.data);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
      }
    };
    fetchHolidays();
  }, []);
  
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });
  };

  useEffect(() => {
    const fetchWeeklyOffConfig = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const currentYear = new Date().getFullYear();
        const response = await axios.get(`https://ems-cws-backend-9wgt.vercel.app/admin/weeklyoff/${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWeeklyOffConfig(response.data.data);
      } catch (err) {
        console.error("Failed to fetch weekly off config:", err);
      }
    };
    fetchWeeklyOffConfig();
  }, []);

  const isSaturdayWeeklyOff = (date) => {
    const day = date.getDay();
    if (day !== 6) return false; 
    
    if (!weeklyOffConfig || !weeklyOffConfig.saturdays) {
      return false; 
    }
    
    const saturdayNumber = Math.ceil(date.getDate() / 7);
    return weeklyOffConfig.saturdays.includes(saturdayNumber);
  };

  //rutuja code edn
  //TANVI
  useEffect(() => {
    if (!showPopup || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();
    firstEl?.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPopup(null);
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPopup]);
  useEffect(() => {
    const isModalOpen = showPopup;

    if (isModalOpen) {
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
  }, [showPopup]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "https://ems-cws-backend-9wgt.vercel.app",
          headers: { Authorization: `Bearer ${token}` },
        });

        const empRes = await axios.get(
          `https://ems-cws-backend-9wgt.vercel.app/employees/${empId}`,
        );
        setEmployee(empRes.data);

        const attRes = await authAxios.get(`/attendance/all/${empId}`);
    setAttendance(attRes.data);
setFilteredAttendance(attRes.data);
const initialDisplayData = buildDataWithFullCalendar(
  attRes.data,
  null,
  null,
);
setDisplayData(initialDisplayData);
      } catch (err) {
        console.error("Error fetching employee attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [empId]);
const handleFilter = (e) => {
  e.preventDefault();

  let filtered = displayData;

  if (statusFilter) {
    filtered = filtered.filter(
      (att) => att.dayStatus === statusFilter
    );
  }

  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0,0,0,0);

    filtered = filtered.filter(
      (att) => new Date(att.date) >= from
    );
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23,59,59,999);

    filtered = filtered.filter(
      (att) => new Date(att.date) <= to
    );
  }

  setDisplayData(filtered);
  setCurrentPage(1);
};

const handleReset = () => {
  setStatusFilter("");
  setFromDate("");
  setToDate("");

  const fullData = buildDataWithFullCalendar(attendance);
  setDisplayData(fullData);

  setCurrentPage(1);
};
  // 🔹 Build full calendar data (every date), filling missing days
  const buildDataWithFullCalendar = (
    data,
    startDate = null,
    endDate = null,
  ) => {
    const src = data || filteredAttendance;
    if (!src.length) return [];

    let start;
    let end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
    } else if (src.length) {
      const dates = src.map((a) => new Date(a.date));
      dates.sort((a, b) => a - b);
      start = dates[0];
      end = new Date(); // today
    } else {
      return [];
    }

    end.setHours(23, 59, 59, 999);

    // Map existing records by normalized date
    const byDate = new Map();
    src.forEach((att) => {
      const d = new Date(att.date);
      const key = d.toDateString();
      byDate.set(key, att);
    });

    const result = [];

    // Walk day by day through full range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toDateString();

      if (byDate.has(key)) {
        result.push(byDate.get(key));
      } else {
        const day = d.getDay(); // 0 = Sunday, 6 = Saturday

        // const isWeekend = day === 0 || day === 6;

        //rutuja 
        let dayStatus;
        if (isHoliday(d)) {
          dayStatus = "Holiday";
        } else if (day === 0) {
          dayStatus = "Weekly Off";
        } else if (day === 6) {
          dayStatus = isSaturdayWeeklyOff(d) ? "Weekly Off" : "Absent";
        } else {
          dayStatus = "Absent";
        }
        //rutuja end
        result.push({
          _id: key, // synthetic ID
          date: d.toISOString(),
          // dayStatus: isWeekend ? "Weekly Off" : "Absent",
          dayStatus: dayStatus,//rutuja
          mode: null,
          workingHours: null,
          checkIn: null,
          checkOut: null,
          employeeCheckInLocation: null,
        });
      }
    }

    return result;
  };

 useEffect(() => {
  if (
    (filteredAttendance.length > 0 || attendance.length > 0) &&
    !fromDate &&
    !toDate
  ) {
    const newDisplayData = buildDataWithFullCalendar(
      filteredAttendance,
      null,
      null,
    );
    setDisplayData(newDisplayData);
  }
}, [filteredAttendance, fromDate, toDate]);
  // ✅ Function to export data to Excel
  const handleDownloadExcel = () => {
    if (filteredAttendance.length === 0) {
      alert("No attendance data to download!");
      return;
    }

    // Map data for Excel
    const excelData = filteredAttendance.map((att) => ({
      "EMP ID": employee?.employeeId || id || "N/A",
      "EMP NAME": employee?.name || username || "N/A",

      Date: new Date(att.date).toLocaleDateString("en-GB"),
      Mode: att.mode,
      "Check In": att.checkIn
        ? new Date(att.checkIn).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      "Check Out": att.checkOut
        ? new Date(att.checkOut).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      "Total Hours": att.workingHours ? `${att.workingHours} hrs` : "-",
      "Day Status": att.dayStatus,
      Details:
        att.regularizationRequest && att.regularizationRequest.status
          ? `Regularization (${att.regularizationRequest.status})`
          : att.dayStatus === "Leave"
            ? `Leave (${att.leaveType || "N/A"})`
            : "Normal Attendance",
      Location: att.employeeCheckInLocation?.address || "N/A",
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    // Download Excel file
    XLSX.writeFile(wb, `${employee?.name || "Employee"}_Attendance.xlsx`);
  };

  //  if (loading) return <p>Loading...</p>;
  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading ...
        </p>
      </div>
    );
  }
  // Format: 1 Oct 2025
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Status pill styles
  const statusBase = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 112,

    fontWeight: 500,
    fontSize: 14,
  };
const statusBg = {
  Present: { background: "#cfe8d8", color: "#000" },
  Absent: { background: "#ead1d3", color: "#000" },
  "Weekly Off": { background: "#d9d9d9", color: "#000" },
  Holiday: { background: "#fff3cd", color: "#856404" },
  Leave: { background: "#c8e3f1", color: "#6c757d" },

};
  //jacy code
  //const sortedAndFilteredData =filteredAttendance()
  const sortedAndFilteredData = displayData
    .filter((att) => new Date(att.date) <= new Date())
    .sort((b, a) => new Date(a.date) - new Date(b.date));

  // 🔹 Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const todayISO = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const handleRowClick = async (att) => {
    setSelectedAttendance(att);
    setShowPopup(true);
    setBreaks([]);
    setLoadingBreaks(true);

    try {
      const token = localStorage.getItem("accessToken");

      const localDate = new Date(att.date);
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, "0");
      const dd = String(localDate.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      console.log("Fetching breaks for:", formattedDate);

      const res = await axios.get(
        `https://ems-cws-backend-9wgt.vercel.app/api/break/admin/${empId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { date: formattedDate },
        },
      );

      setBreaks(res.data?.[0]?.breaks || []);
    } catch (err) {
      console.error("Failed to load breaks", err);
    } finally {
      setLoadingBreaks(false);
    }
  };

  const formatDurationHMS = (start, end) => {
    if (!start || !end) return "-";

    const diff = Math.max(0, new Date(end) - new Date(start));
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${hrs}h ${mins}m ${secs}s`;
  };

  const getTotalBreakDurationHMS = (breaks) => {
    const totalMs = breaks.reduce((sum, b) => {
      if (!b.startTime || !b.endTime) return sum;
      return sum + (new Date(b.endTime) - new Date(b.startTime));
    }, 0);

    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);

    return `${hrs}h ${mins}m ${secs}s`;
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAttendance(null);
  };
  const completedBreaks = breaks.filter((brk) => brk.startTime && brk.endTime);

  const hasRunningBreak = breaks.some((brk) => brk.startTime && !brk.endTime);

  return (
   <div className="container-fluid ">
      {employee && (
        <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <h3 className="mb-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
            <span style={{ textTransform: "capitalize" }}>{employee.name}</span>
            's Attendance
          </h3>
          <button
            className="btn btn-sm custom-outline-btn"
            style={{
              minWidth:90
            }}
            onClick={handleDownloadExcel}
          >
            Download All Attendance Data
          </button>
        </div>
      )}

       <div className="card mb-4 mt-3 shadow-sm border-0">
  <div className="card-body">
    <form className="row g-2 align-items-center">

      <div className="col-12 col-md-auto d-flex align-items-center ms-2">
  <label
    className="fw-bold mb-0"
    style={{
      fontSize: "16px",
      color: "#3A5FBE",
      minWidth: "60px",
      marginRight: "8px",
    }}
  >
    Status
  </label>

  <select
    className="form-select"
    style={{ minWidth: "140px" }}
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="">All</option>
    <option value="Present">Present</option>
    <option value="Absent">Absent</option>
    <option value="Weekly Off">Weekly Off</option>
    <option value="Holiday">Holiday</option>
    <option value="Leave">Leaves</option>
  </select>
</div>

      {/* From */}
      <div className="col-12 col-md-auto d-flex align-items-center ms-2">
        <label
          className="fw-bold mb-0"
          style={{
            fontSize: "16px",
            color: "#3A5FBE",
            minWidth: "50px",
            marginRight: "8px",
          }}
        >
          From
        </label>

        <input
          type="date"
          className="form-control"
          style={{ minWidth: "140px" }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
      </div>

      {/* To */}
      <div className="col-12 col-md-auto d-flex align-items-center ms-2">
        <label
          className="fw-bold mb-0"
          style={{
            fontSize: "16px",
            color: "#3A5FBE",
            minWidth: "50px",
            marginRight: "8px",
          }}
        >
          To
        </label>

        <input
          type="date"
          className="form-control"
          style={{ minWidth: "140px" }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="col-auto ms-auto d-flex gap-2">
      <button
          type="button"
          onClick={handleFilter}
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
        >
          Filter
        </button>

        <button
          type="button"
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

    </form>
  </div>
</div>

      {/* 🔹 Table Section */}
     {sortedAndFilteredData.length === 0 ? (
  <p>No attendance records found for selected dates.</p>
) : (
              <div className="table-responsive">
        <table className="table table-hover mb-0 bg-white">
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
                  Date
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
                  Check  In
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
                  Check Out
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
                  Total Hours
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
                  Mode
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
                  Location
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((att) => {
                const date = fmtDate(att.date);
                const checkIn = att.checkIn
                  ? new Date(att.checkIn).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";
                const checkOut = att.checkOut
                  ? new Date(att.checkOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";
                const workingHours = att.workingHours
                  ? `${att.workingHours} hrs`
                  : "-";
                // jacy code
                const modeDisplay =
                  att.dayStatus === "Absent" ||
                  att.dayStatus === "Leave" ||
                  att.dayStatus === "Leave (Sandwiched)"
                    ? "-"
                    : att.dayStatus === "Present" && att.mode === "Office"
                      ? "WFO"
                      : att.mode;

                const reg = att.regularizationRequest;
                const hasRegularization = reg && reg.status !== null;
                const isLeave = att.dayStatus === "Leave";
                const leaveType = att.leaveType;

                let details = "";
                if (hasRegularization) {
                  details = `Regularization (${reg.status})`;
                } else if (isLeave) {
                  details = `Leave (${leaveType || "N/A"})`;
                } else if (att.checkIn || att.checkOut) {
                  details = "Checked In/Out Normally";
                } else {
                  details = "No Activity";
                }

                return (
                  <tr
                    key={att._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(att)}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {date}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkIn}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkOut}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {workingHours}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {modeDisplay}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                    <span
  style={{
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "400",
    display: "inline-block",
    textAlign: "center",
    minWidth: "110px",
    ...(statusBg[att.dayStatus] || {}),
  }}
>
  {att.dayStatus}
</span>
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {att.employeeCheckInLocation?.address || "N/A"}
                    </td>
                    {/* <td>{details}</td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
         
      )}
      {/* 🔹 Pagination Controls */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "14px", marginRight: "8px" }}>
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

          <span style={{ fontSize: "14px", marginLeft: "16px" }}>
            {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, sortedAndFilteredData.length)} of{" "}
            {sortedAndFilteredData.length}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
             className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px" }}
            >
              ‹
            </button>
            <button
             className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
      {showPopup && selectedAttendance && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          ref={modalRef}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Attendance Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closePopup}
                />
              </div>

              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <div className="container-fluid">
                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Date</div>
                    <div className="col-sm-9">
                      {fmtDate(selectedAttendance.date)}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Check In</div>
                    <div className="col-sm-9">
                      {selectedAttendance.checkIn
                        ? new Date(
                            selectedAttendance.checkIn,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Check Out</div>
                    <div className="col-sm-9">
                      {selectedAttendance.checkOut
                        ? new Date(
                            selectedAttendance.checkOut,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Total Hours</div>
                    <div className="col-sm-9">
                      {selectedAttendance.workingHours
                        ? `${selectedAttendance.workingHours} hrs`
                        : "-"}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Mode</div>
                    <div className="col-sm-9">
                      {selectedAttendance.dayStatus === "Absent" ||
                      selectedAttendance.dayStatus === "Leave"
                        ? "-"
                        : selectedAttendance.mode || "-"}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Status</div>
                    <div className="col-sm-9">
                      <span
                        className="badge px-3 py-2"
                        style={{
                          background:
                            selectedAttendance.dayStatus === "Present"
                              ? "#d1f7df"
                              : selectedAttendance.dayStatus === "Half Day"
                                ? "#fff3cd"
                                : selectedAttendance.dayStatus === "Weekly Off"
                                  ? "#e2e3e5"
                                  : "#f8d7da",
                          color: "#000",
                        }}
                      >
                        {selectedAttendance.dayStatus}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm-3 fw-semibold">Location</div>
                    <div className="col-sm-9">
                      {selectedAttendance.employeeCheckInLocation?.address ||
                        "N/A"}
                    </div>
                  </div>
                </div>
                <hr />
                <h6 className="fw-semibold mb-3" style={{ color: "#3A5FBE" }}>
                  Break Details
                </h6>

                {loadingBreaks ? (
                  <p className="text-muted">Loading breaks...</p>
                ) : breaks.length === 0 ? (
                  <p className="text-muted">No breaks taken</p>
                ) : completedBreaks.length === 0 && hasRunningBreak ? (
                  <p className="text-muted">Break in progress</p>
                ) : (
                  <>
                    {completedBreaks.map((brk, idx) => (
                      <div
                        key={idx}
                        className="border rounded p-3 mb-2"
                        style={{ backgroundColor: "#f8f9fa" }}
                      >
                        <div className="row mb-1">
                          <div className="col-sm-4 fw-semibold">Type</div>
                          <div className="col-sm-8">{brk.type}</div>
                        </div>

                        {brk.type === "Other" && (
                          <div className="row mb-1">
                            <div className="col-sm-4 fw-semibold">Reason</div>
                            <div className="col-sm-8">
                              {brk.reason?.trim() ? brk.reason : "N/A"}
                            </div>
                          </div>
                        )}

                        <div className="row mb-1">
                          <div className="col-sm-4 fw-semibold">Start</div>
                          <div className="col-sm-8">
                            {new Date(brk.startTime).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="row mb-1">
                          <div className="col-sm-4 fw-semibold">End</div>
                          <div className="col-sm-8">
                            {new Date(brk.endTime).toLocaleTimeString()}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-sm-4 fw-semibold">Duration</div>
                          <div className="col-sm-8">
                            {formatDurationHMS(brk.startTime, brk.endTime)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Break Time */}
                    <div className="border-top pt-2 mt-3 text-end">
                      <span className="fw-semibold">Total Break Time: </span>
                      <span style={{ color: "#3A5FBE", fontWeight: 600 }}>
                        {getTotalBreakDurationHMS(breaks)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* 🔹 Footer */}
              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }} onClick={closePopup}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeFullAttendance;
