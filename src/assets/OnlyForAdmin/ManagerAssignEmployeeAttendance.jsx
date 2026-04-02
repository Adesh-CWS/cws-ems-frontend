import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function ManagerAssignedEmployeesAttendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { role, username, id } = useParams(); // 👈 id = managerId
  const navigate = useNavigate();

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

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

        const res = await authAxios.get(`/attendance/manager/${id}/today`);

        // res.data is { employees: [...] }
        const employees = res.data?.employees || [];

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

            // Late check-in (after 10:00 am)
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
        setAttendanceData(res.data); // { employees: [...] }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch today's attendance.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [id]); // 👈 depends on manager id

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

  // ✅ Get employee status
  const getStatus = (checkIn, checkOut, workingHours) => {
    if (!checkIn && !checkOut) return "Absent";
    if (checkIn && !checkOut) return "Working";
    if (workingHours >= 8) return "Present";
    if (workingHours >= 4) return "Half Day";
    return "Absent";
  };

  // ✅ Apply Filters (Status + Name)
  const applyFilters = () => {
    let temp = [...(attendanceData?.employees || [])];

    // Status Filter
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

  // ✅ Pagination Calculations (THIS FIXES YOUR ERROR)
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // ✅ THIS WAS MISSING – CAUSING YOUR CRASH
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // ✅ Page Change Handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container-fluid">
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        Today's Attendance Details
      </h2>

      {/* Summary Cards */}
      <div className="row  mb-4">
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
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#F8D7DA",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {summary.absent}
              </h4>

              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Absent Employees
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
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {summary.lateCheckIn}
              </h4>
              <div>
                <p
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "20px", color: "#3A5FBE" }}
                >
                  Late Check-Ins
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
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
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0"
                style={{ width: "50px", fontSize: "16px", color: "#3A5FBE" }}
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
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0"
                style={{ width: "50px", fontSize: "16px", color: "#3A5FBE" }}
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

      {/* Attendance Table */}
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
                console.log(emp.name, emp.checkInTime);
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
                  <tr key={emp._id}>
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
    </div>
  );
}

export default ManagerAssignedEmployeesAttendance;
