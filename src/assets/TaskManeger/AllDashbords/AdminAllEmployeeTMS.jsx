import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminAllEmployeeTMS({ user }) { 
  const [employees, setEmployees] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchText, setSearchText] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const tasks = Array.isArray(filteredTasks) ? filteredTasks : [];

  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = tasks.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };

        const role = user?.role;
        const managerId = user?._id;

        let url;
        let response;

        if (role === "manager") {
          url = `https://ems-cws-test.vercel.app/managers/${managerId}/assigned-employees`;
          console.log("Fetching manager's employees from:", url);
          
          response = await axios.get(url, { headers });
          console.log("Manager's employees response:", response.data);
          
          const employeesData = response.data.employees || [];
          setEmployees(employeesData);
          setFilteredTasks(employeesData);
        } else {
          url = "https://ems-cws-test.vercel.app/getAllEmployees";
          console.log("Fetching all employees from:", url);
          
          const employeesRes = await axios.get(url, { headers });
          console.log("All employees response:", employeesRes.data);

          const resData = Array.isArray(employeesRes.data)
            ? employeesRes.data
            : employeesRes.data.employees || employeesRes.data.data || [];

          // 1. Filter only active employees
          const activeEmployees = resData.filter((e) => !e.isDeleted);

          // 2. Allowed roles
          const allowedRoles = ["hr", "manager", "employee", "it_support"];

          // 3. Filter by allowed roles
          const allowedEmployees = activeEmployees.filter((e) =>
            allowedRoles.includes(e.role?.toLowerCase()),
          );

          console.log("Total Employees:", allowedEmployees.length);
          
          setEmployees(allowedEmployees);
          setFilteredTasks(allowedEmployees);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Error status:", error.response.status);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEmployees();
    }
  }, [user]); 

  if (loading) return <div style={{ padding: 20 }}>Loading employees...</div>;

  const handleRowClick = (emp) => {
    setSelectedEmployee(emp);
  };

  const handleSearch = () => {
    const value = searchText.toLowerCase().trim();

    if (!value) {
      setFilteredTasks(employees);
      setCurrentPage(1);
      return;
    }

    const filtered = employees.filter((emp) => {
      const id = emp.employeeId?.toString().toLowerCase() || "";
      const name = emp.name?.toLowerCase() || "";
      const email = emp.email?.toLowerCase() || "";
      const mobile = emp.contact?.toLowerCase() || "";
      const designation = emp.designation?.toLowerCase() || "";
      const doj = emp.doj
        ? new Date(emp.doj).toLocaleDateString("en-GB").toLowerCase()
        : "";

      return (
        id.includes(value) ||
        name.includes(value) ||
        email.includes(value) ||
        mobile.includes(value) ||
        designation.includes(value) ||
        doj.includes(value)
      );
    });

    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchText("");
    setFilteredTasks(employees);
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid">
      <h4 className="mb-3" style={{fontSize:"25px", color: "#3A5FBE" }}>
        {user?.role === "manager" ? "My Team Members" : "All Employees Details"}
      </h4>
      
      {/* Filter section */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
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
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search By Any Field..."
                className="form-control form-control-sm"
                style={{ flex: 1 }}
              />
            </div>

            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleSearch}
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleResetSearch}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Name
                </th>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Employee ID
                </th>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Email
                </th>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Mobile
                </th>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Designation
                </th>
                <th style={{ fontWeight: "500", fontSize: "14px", color: "#6c757d", borderBottom: "2px solid #dee2e6", padding: "12px", whiteSpace: "nowrap" }}>
                  Date of Joining
                </th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4" style={{ color: "#212529" }}>
                    No employees found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((emp) => (
                  <tr
                    key={emp._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(emp)}
                  >
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.name || "-"}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.employeeId || "-"}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.email || "-"}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.contact || "-"}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.designation || "-"}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", color: "#212529" }}>
                      {emp.doj
                        ? new Date(emp.doj).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}>
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

          <span style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}>
            {filteredTasks.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredTasks.length)} of ${filteredTasks.length}`}
          </span>

          <div className="d-flex align-items-center" style={{ marginLeft: "16px" }}>
            <button
              className="btn btn-sm border-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm border-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div
          className="modal fade show"
          style={{
            display: "flex",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Employee Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmployee(null)}
                />
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Employee Name
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.name || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Employee ID
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.employeeId || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Email
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529", wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>
                      {selectedEmployee?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Mobile No
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.contact || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Designation
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.designation || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Date of Joining
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.doj
                        ? new Date(selectedEmployee.doj).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setSelectedEmployee(null)}
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
}

export default AdminAllEmployeeTMS;