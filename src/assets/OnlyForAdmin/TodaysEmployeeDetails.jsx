import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function TodaysEmployeeDetails() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { role, username, id } = useParams();
  const navigate = useNavigate();

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // NEW: Status filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeBreaks, setEmployeeBreaks] = useState([]);
  const [breakLoading, setBreakLoading] = useState(false);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!showModal || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(null);
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
  }, [showModal]);
  useEffect(() => {
    const isModalOpen = showModal;

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
  }, [showModal]);
  const openEmployeePopup = async (emp) => {
    try {
      setSelectedEmployee(emp);
      setShowModal(true);
      setBreakLoading(true);

      const token = localStorage.getItem("accessToken");

      //  today date
      const today = new Date().toISOString().split("T")[0];

      const res = await axios.get(
        `http://localhost:8000/api/break/admin/${emp._id}?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // API returns array → take today's record
      const todayBreakDoc = res.data?.[0];

      setEmployeeBreaks(todayBreakDoc?.breaks || []);
    } catch (error) {
      console.error("Failed to fetch breaks", error);
      setEmployeeBreaks([]);
    } finally {
      setBreakLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };
  const getCompletedBreaks = (breaks = []) =>
    breaks.filter((b) => b.startTime && b.endTime);

  const getBreakDurationInMinutes = (start, end) => {
    if (!start || !end) return 0;
    return Math.floor((new Date(end) - new Date(start)) / (1000 * 60));
  };

  const getTotalBreakMinutes = (breaks = []) =>
    getCompletedBreaks(breaks).reduce(
      (total, brk) =>
        total + getBreakDurationInMinutes(brk.startTime, brk.endTime),
      0,
    );

  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
  };
  const formatDurationHMS = (start, end) => {
    if (!start || !end) return "0 sec";

    const diffMs = new Date(end) - new Date(start);
    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = [];
    if (hours > 0) result.push(`${hours} hr`);
    if (minutes > 0) result.push(`${minutes} min`);
    if (seconds > 0 || result.length === 0) result.push(`${seconds} sec`);

    return result.join(" ");
  };

  const getTotalBreakDurationHMS = (breaks = []) => {
    const totalSeconds = getCompletedBreaks(breaks).reduce((total, brk) => {
      return (
        total +
        Math.floor((new Date(brk.endTime) - new Date(brk.startTime)) / 1000)
      );
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = [];
    if (hours > 0) result.push(`${hours} hr`);
    if (minutes > 0) result.push(`${minutes} min`);
    if (seconds > 0 || result.length === 0) result.push(`${seconds} sec`);

    return result.join(" ");
  };

  // ✅ Summary counts
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    lateCheckIn: 0,
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        // const res = await authAxios.get("/attendance/today");
        // const employees = res.data?.employees || [];
        //Added by Harshada
        const res = await authAxios.get("/attendance/today");
        const employees = res.data?.employees || [];

        const today = new Date().toISOString().split("T")[0];

        // Fetch break for each employee
        const employeesWithBreaks = await Promise.all(
          employees.map(async (emp) => {
            try {
              const breakRes = await authAxios.get(
                `/api/break/admin/${emp._id}?date=${today}`
              );

              const todayBreakDoc = breakRes.data?.[0];

              return {
                ...emp,
                breaks: todayBreakDoc?.breaks || [],
              };
            } catch (err) {
              return {
                ...emp,
                breaks: [],
              };
            }
          })
        );

        // ✅ Calculate counts
        let present = 0;
        let absent = 0;
        let lateCheckIn = 0;

        employees.forEach((emp) => {
          const checkIn = emp.checkInTime ? new Date(emp.checkInTime) : null;
          const checkOut = emp.checkOutTime ? new Date(emp.checkOutTime) : null;

          if (!checkIn && !checkOut) {
            absent++;
          } else {
            present++;

            // Check if late check-in (>= 10:00 AM)
            if (checkIn) {
              const hours = checkIn.getHours();
              const minutes = checkIn.getMinutes();
              if (hours > 10 || (hours === 10 && minutes > 0)) {
                lateCheckIn++;
              }
            }
          }
        });

        setSummary({ present, absent, lateCheckIn });
        //Added by Harshada - to include breaks in employee data
        setAttendanceData({
          ...res.data,
          employees: employeesWithBreaks,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch today's attendance.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);
  useEffect(() => {
    if (attendanceData?.employees) {
      setFilteredEmployees(attendanceData.employees);
    }
  }, [attendanceData]);
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
  };

  //shivani
  // const focusStyles = {
  //   onFocus: (e) => {
  //     e.target.style.backgroundColor = "#3A5FBE";
  //     e.target.style.color = "white";
  //     e.target.style.border = "1px solid #3A5FBE";
  //   },
  //   onBlur: (e) => {
  //     e.target.style.backgroundColor = "transparent";
  //     e.target.style.color = "#3A5FBE";
  //     e.target.style.border = "1px solid #3A5FBE";
  //   }
  // };

  const getStatus = (checkIn, checkOut, workingHours) => {
    if (!checkIn && !checkOut) return "Absent";
    if (checkIn && !checkOut) return "Working";
    if (workingHours >= 8) return "Present";
    if (workingHours >= 4) return "Half Day";
    return "Absent";
  };

  if (loading)
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

  if (error) return <p className="text-danger">{error}</p>;
  if (!attendanceData?.employees?.length)
    return <p>No attendance records for today.</p>;

  const employees = attendanceData.employees;
  // const totalPages = Math.ceil(employees.length / itemsPerPage);
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);

  // const handlePageChange = (newPage) => {
  //   if (newPage >= 1 && newPage <= totalPages) {
  //     setCurrentPage(newPage);
  //   }
  // };

  // dipali code
  // NEW: Filter employees by status
  const applyFilters = () => {
    const employeesList = attendanceData?.employees || [];
    let temp = [...employeesList];

    // Status filter
    if (statusFilter !== "All") {
      temp = temp.filter((emp) => {
        const checkIn = emp.checkInTime;
        const checkOut = emp.checkOutTime;
        const workingHours = calculateWorkingHours(checkIn, checkOut);
        const status = getStatus(checkIn, checkOut, workingHours);
        if (statusFilter === "Late Check-In") {
          // Late check-in: Present AND after 10:00 am
          if (checkIn) {
            const dt = new Date(checkIn);
            const hours = dt.getHours();
            const minutes = dt.getMinutes();
            return (
              (status === "Present" ||
                status === "Half Day" ||
                status === "Working") &&
              (hours > 10 || (hours === 10 && minutes > 0))
            );
          }
          return false;
        } else {
          return status === statusFilter;
        }
      });
    }
    // Name filter
    if (employeeNameFilter.trim() !== "") {
      temp = temp.filter((emp) =>
        emp.name
          .toLowerCase()
          .includes(employeeNameFilter.trim().toLowerCase()),
      );
    }

    setFilteredEmployees(temp);
    setCurrentPage(1); // reset to first page
  };

  // CHANGED: Use filteredEmployees instead of employees for pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  console.log("currentEmployees", currentEmployees);

  return (
    <div className="container-fluid">
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "30px",
        }}
      >
        Today's Attendance Details
      </h2>

      {/* ✅ Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#D7F5E4",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.present}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Total Present Employees
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex  align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#F8D7DA",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.absent}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Total Absent Employees
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#FFE493",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.lateCheckIn}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Late Check-In
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* dipali code */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{ width: "55px", fontSize: "16px", color: "#3A5FBE" }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)} // no auto-filter on change
              >
                <option value="All">All</option>
                <option value="Present">Present</option>
                <option value="Working">Working</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Late Check-In">Late Check-In</option>
              </select>
            </div>

            {/* Name Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "2px",
                }}
              >
                Name
              </label>
              <input
                id="employeeNameFilter"
                type="text"
                className="form-control"
                value={employeeNameFilter}
                onChange={(e) => setEmployeeNameFilter(e.target.value)}
                placeholder="Employee name"
              />
            </div>

            <></>

            {/* Filter and Reset Buttons */}
            <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
              <button
                type="submit"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                Filter
              </button>
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => {
                  setStatusFilter("All");
                  setEmployeeNameFilter("");
                  setCurrentPage(1);
                  setFilteredEmployees(attendanceData.employees || []);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Attendance Table */}
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
                Name
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
                Check-In Time
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
                Check-Out Time
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
              {/* //Added by Harshada */}
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
                Break
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length ===
              0 /* NEW: Show message when no results */ ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4"
                  style={{ color: "#6c757d" }}
                >
                  No employees found with status "{statusFilter}"
                </td>
              </tr>
            ) : (
              currentEmployees.map((emp) => {
                const checkIn = emp.checkInTime;
                const checkOut = emp.checkOutTime;
                const workingHours = calculateWorkingHours(checkIn, checkOut);
                const status = getStatus(checkIn, checkOut, workingHours);
                const badgeStyle = {
                  base: {
                    display: "inline-block",
                    padding: "6px 12px",
                    fontWeight: 400,
                    fontSize: "14px",
                    width: 112,
                    textAlign: "center",
                  },
                  Present: { background: "#d1f7df" }, // soft green
                  "Half Day": { background: "#fff3cd" }, // soft yellow
                  Working: { background: "#cff4fc" }, // soft cyan
                  Absent: { background: "#f8d7da" }, // soft red
                };

                return (
                  <tr
                    key={emp._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openEmployeePopup(emp)}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#212529",
                        whiteSpace: "nowrap",
                        textTransform: "capitalize",
                        borderTop: "1px solid #e9ecef",
                      }}
                    >
                      {emp.name}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkIn
                        ? new Date(checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkOut
                        ? new Date(checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {workingHours > 0 ? `${workingHours} hrs` : "-"}
                    </td>
                    {/* //Added by harshada */}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {emp.breaks && emp.breaks.length > 0
                        ? getTotalBreakDurationHMS(emp.breaks)
                        : "-"}
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
                          ...badgeStyle.base,
                          ...(badgeStyle[status] || {}),
                        }}
                      >
                        {status}
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
                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={() =>
                          navigate(
                            `/dashboard/${role}/${username}/${id}/employeeattendance/${emp._id}`,
                            {
                              state: { employee: emp },
                            },
                          )
                        }
                      >
                        View Attendance
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* ✅ Pagination */}
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
            {filteredEmployees.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} {/* New change */}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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

      {showModal && selectedEmployee && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1050
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ maxWidth: "700px", width: 600 }}
          >
            <div className="modal-content">
              {/* 🔹 Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Employee Attendance Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {/* 🔹 Body */}
                <div className="modal-body">
                  <div className="container-fluid">
                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Name</div>
                      <div className="col-sm-9">
                        {selectedEmployee.name || "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Check-In</div>
                      <div className="col-sm-9">
                        {selectedEmployee.checkInTime
                          ? new Date(
                            selectedEmployee.checkInTime,
                          ).toLocaleTimeString()
                          : "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Check-Out</div>
                      <div className="col-sm-9">
                        {selectedEmployee.checkOutTime
                          ? new Date(
                            selectedEmployee.checkOutTime,
                          ).toLocaleTimeString()
                          : "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Total Hours</div>
                      <div className="col-sm-9">
                        {calculateWorkingHours(
                          selectedEmployee.checkInTime,
                          selectedEmployee.checkOutTime,
                        )}{" "}
                        hrs
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Status</div>
                      <div className="col-sm-9">
                        <span
                          className={
                            "badge text-capitalize " +
                            (getStatus(
                              selectedEmployee.checkInTime,
                              selectedEmployee.checkOutTime,
                              calculateWorkingHours(
                                selectedEmployee.checkInTime,
                                selectedEmployee.checkOutTime,
                              ),
                            ) === "Present"
                              ? "bg-success"
                              : getStatus(
                                selectedEmployee.checkInTime,
                                selectedEmployee.checkOutTime,
                                calculateWorkingHours(
                                  selectedEmployee.checkInTime,
                                  selectedEmployee.checkOutTime,
                                ),
                              ) === "Half Day"
                                ? "bg-warning text-dark"
                                : getStatus(
                                  selectedEmployee.checkInTime,
                                  selectedEmployee.checkOutTime,
                                  calculateWorkingHours(
                                    selectedEmployee.checkInTime,
                                    selectedEmployee.checkOutTime,
                                  ),
                                ) === "Working"
                                  ? "bg-info text-dark"
                                  : "bg-danger")
                          }
                        >
                          {getStatus(
                            selectedEmployee.checkInTime,
                            selectedEmployee.checkOutTime,
                            calculateWorkingHours(
                              selectedEmployee.checkInTime,
                              selectedEmployee.checkOutTime,
                            ),
                          )}
                        </span>
                      </div>
                    </div>

                    <hr />

                    {/* 🔹 Break Details */}
                    <h6 className="mb-3" style={{ color: "#3A5FBE" }}>
                      Break Details
                    </h6>

                    {breakLoading ? (
                      <p className="text-muted">Loading breaks...</p>
                    ) : employeeBreaks.length === 0 ? (
                      //  Case 1: No break taken at all
                      <p className="text-muted">No breaks taken</p>
                    ) : getCompletedBreaks(employeeBreaks).length === 0 ? (
                      //  Case 2: Break in progress
                      <p className="text-muted">Break in progress</p>
                    ) : (
                      getCompletedBreaks(employeeBreaks).map((brk, index) => (
                        <div
                          key={index}
                          className="border rounded p-3 mb-2"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">Type</div>
                            <div className="col-sm-9">{brk.type}</div>
                          </div>
                          {brk.type === "Other" && (
                            <div className="row mb-1">
                              <div className="col-sm-3 fw-semibold">Reason</div>
                              <div className="col-sm-9">
                                {brk.reason?.trim() ? brk.reason : "N/A"}
                              </div>
                            </div>
                          )}

                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">Start</div>
                            <div className="col-sm-9">
                              {new Date(brk.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">End</div>
                            <div className="col-sm-9">
                              {new Date(brk.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-sm-3 fw-semibold">Duration</div>
                            <div className="col-sm-9">
                              {formatDurationHMS(brk.startTime, brk.endTime)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Total Break Time */}
                    <div className="border-top pt-2 mt-3 text-end">
                      <span className="fw-semibold">Total Break Time: </span>
                      <span style={{ color: "#3A5FBE", fontWeight: 600 }}>
                        {getTotalBreakDurationHMS(employeeBreaks)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🔹 Footer */}
                <div className="modal-footer border-0 pt-0">
                  <button
                    className="btn custom-outline-btn"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodaysEmployeeDetails;
