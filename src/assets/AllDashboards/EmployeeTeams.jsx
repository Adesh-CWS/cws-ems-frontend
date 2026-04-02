import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function EmployeeTeams({ user }) { 
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); 

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user || !user._id) {
        setError("User information not available");
        setLoading(false);
        return;
      }

      if (!["manager", "employee"].includes(user.role)) {
        setError("You don't have permission to view teams");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userId = user._id;
        
        if (user.role === "manager") {
          const res = await axios.get(
            `https://ems-cws-backend-9wgt.vercel.app/managers/${userId}/assigned-employees`
          );
          setEmployees(res.data.employees || []);
          setTeamMembers([]); 
        } else {
          const res = await axios.get(
            `https://ems-cws-backend-9wgt.vercel.app/employee/${userId}/team-member`
          );
          
          if (res.data.success) {
            const members = res.data.teamMembers.map(member => ({
              _id: member._id,
              employeeId: member.employeeId,
              name: member.name,
              department: member.department,
              designation: member.designation,
              email: member.email,
              contact: member.contact,
              role: member.role,
              image: member.image
            }));
            
            setTeamMembers(members || []);
            setEmployees([]); 
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
        setError(err.response?.data?.message || "Failed to fetch team data");
        setEmployees([]);
        setTeamMembers([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 700);
      }
    };

    fetchTeamData();
  }, [user]); 

  const displayData = user?.role === "manager"
    ? employees 
    : teamMembers;

  /* ===== Pagination logic ===== */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filteredEmployees.length > 0 
    ? filteredEmployees.slice(indexOfFirstItem, indexOfLastItem)
    : displayData.slice(indexOfFirstItem, indexOfLastItem);
  
  const modalRef = useRef(null);

  useEffect(() => {
    if (!selectedEmployee || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    modal.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedEmployee(null);
      }

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
  }, [selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'relative';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
    };
  }, [selectedEmployee]); 

  useEffect(() => {
    let temp = [...displayData];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();

      temp = temp.filter((emp) =>
        [
          emp.employeeId,
          emp.name,
          emp.department,
          emp.designation,
          emp.email,
          emp.contact,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    setFilteredEmployees(temp);
    setCurrentPage(1);
  }, [displayData, searchQuery]);

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setFilteredEmployees([]);
    setCurrentPage(1);
  };

  /* ===== LOADING ===== */
  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center mt-5"
        style={{
          height: "100vh",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading team members...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
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
        My Team Members
      </h2>
      
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div
              className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100"
              style={{ maxWidth: "400px" }}
            >
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search team members..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  setSearchQuery(searchInput.trim());
                  setCurrentPage(1);
                }}
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
          </div>
        </div>
      </div>
      
      <div className="card-body">
        {/* ===== Table ===== */}
        <div
          className="table-responsive"
          style={{
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                {[
                  "Employee ID",
                  "Name",
                  "Department",
                  "Designation",
                  "Email",
                  "Contact",
                ].map((head) => (
                  <th key={head} style={thStyle}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    {user?.role === "employee" 
                      ? "You are not assigned to any team yet." 
                      : "No team members found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((emp) => (
                  <tr
                    key={emp._id || emp.employeeId}
                    onClick={() => setSelectedEmployee(emp)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={tdStyle}>{emp.employeeId}</td>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={tdStyle}>{emp.department}</td>
                    <td style={tdStyle}>{emp.designation}</td>
                    <td style={tdStyle}>{emp.email}</td>
                    <td style={tdStyle}>{emp.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Pagination ===== */}
        <nav className="d-flex justify-content-end align-items-center mt-3 text-muted">
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
              {displayData.length === 0
                ? "0–0 of 0"
                : `${indexOfFirstItem + 1}-${Math.min(
                    indexOfLastItem,
                    displayData.length,
                  )} of ${displayData.length}`}
            </span>

            <div>
              <button
                className="btn btn-sm focus-ring"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ‹
              </button>
              <button
                className="btn btn-sm focus-ring"
                disabled={indexOfLastItem >= displayData.length}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ===== Modal ===== */}
      {selectedEmployee && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content shadow-lg"
              ref={modalRef}
              tabIndex="-1"
            >
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Team Member Details</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmployee(null)}
                />
              </div>

              <div className="modal-body">
                <Detail
                  label="Employee ID"
                  value={selectedEmployee.employeeId}
                />
                <Detail label="Name" value={selectedEmployee.name} />
                <Detail
                  label="Department"
                  value={selectedEmployee.department}
                />
                <Detail
                  label="Designation"
                  value={selectedEmployee.designation}
                />
                <Detail label="Email" value={selectedEmployee.email} />
                <Detail label="Contact" value={selectedEmployee.contact} />
                <Detail
                  label="Role"
                  value={selectedEmployee.role || "N/A"}
                />
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{ width: 90 }}
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

/* ===== Styles ===== */
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
};

const Detail = ({ label, value }) => (
  <div className="row mb-2">
    <div className="col-5 col-sm-3 fw-semibold">{label}</div>
    <div className="col-sm-9 col-7">{value || "-"}</div>
  </div>
);

export default EmployeeTeams;