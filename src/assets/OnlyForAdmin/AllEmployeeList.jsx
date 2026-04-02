

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import EmployeeProfileForAdmin from "./EmployeeMyProfileForAdmin";
import AddEmployee from "../LoginRegistration/AddEmployee";

function AllEmployeeDetails() {
  const [employees, setEmployees] = useState([]);
  const [oldEmployees, setOldEmployees] = useState([]); // Deleted employees
  const [managersList, setManagersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [message, setMessage] = useState("");
  const [viewEmployee, setViewEmployee] = useState(null);

  const [showOldEmployees, setShowOldEmployees] = useState(false);
  const restrictedRoles = ["ceo", "coo", "admin", "md"]; //Added Jayshree
  const userRole = localStorage.getItem("role");
  const { role, username, id } = useParams();
  const modalRef = useRef(null);
  //Rutuja code for serch bar
  const [searchName, setSearchName] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
const [showMdModal, setShowMdModal] = useState(false);
  const [selectedManagerForMd, setSelectedManagerForMd] = useState(null);
  const [selectedMdId, setSelectedMdId] = useState("");
  const [mdList, setMdList] = useState([]);
  const [mdMessage, setMdMessage] = useState("");

  const handleSearch = () => {
    const value = searchName.toLowerCase().trim();

    if (!value) {
      const displayedList = showOldEmployees ? oldEmployees : employees;
      setFilteredEmployees(displayedList);
      setCurrentPage(1);
      return;
    }

    const listToSearch = showOldEmployees ? oldEmployees : employees;

    const filtered = listToSearch.filter((emp) => {
      const id = emp.employeeId?.toString().toLowerCase() || "";
      const name = emp.name?.toLowerCase() || "";
      const email = emp.email?.toLowerCase() || "";
      const dept = emp.department?.toLowerCase() || "";
      const role = emp.role?.toLowerCase() || "";
      const doj = emp.doj
        ? new Date(emp.doj).toLocaleDateString().toLowerCase()
        : "";

      return (
        id.includes(value) ||
        name.includes(value) ||
        email.includes(value) ||
        dept.includes(value) ||
        role.includes(value) ||
        doj.includes(value)
      );
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchName("");
    const displayedList = showOldEmployees ? oldEmployees : employees;
    setFilteredEmployees(displayedList);
    setCurrentPage(1);
  };

  const toggleOldEmployees = () => {
    const newShowOldEmployees = !showOldEmployees;
    setShowOldEmployees(newShowOldEmployees);

    const newList = newShowOldEmployees ? oldEmployees : employees;
    setFilteredEmployees(newList);
    setCurrentPage(1);
    setSearchName(""); // Reset search when switching views
  };
  // code end rutuja
useEffect(() => {
    const isAnyModalOpen = showModal || showMdModal;
  
    if (!isAnyModalOpen || !modalRef.current) return;
  
    const modal = modalRef.current;
  
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    const getFocusableElements = () =>
      modal.querySelectorAll(focusableSelectors);
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showModal) setShowModal(false);
        if (showMdModal) setShowMdModal(false);
      }
  
      if (e.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (!focusableElements.length) return;
  
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
  
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, showMdModal]);

  useEffect(() => {
    const isModalOpen = showModal || showMdModal;

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
  }, [showModal, showMdModal]);
  // Soft delete
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`https://ems-cws-backend-9wgt.vercel.app/soft/deleteEmployee/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from active list and push to deleted list
      const deletedEmp = employees.find((emp) => emp._id === id);
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
      setOldEmployees((prev) => [...prev, deletedEmp]);
      setFilteredEmployees(displayedList);
      alert("Employee soft deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting employee. Please try again.");
    }
  };

  // Permanent delete
  const handleDeleteEmployeepermanent = async (id) => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to permanently delete this employee? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(
        `https://ems-cws-backend-9wgt.vercel.app/deleteEmployee/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
        setOldEmployees((prev) => prev.filter((emp) => emp._id !== id));
        alert("Employee permanently deleted!");
      } else {
        alert("Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Server error while deleting employee.");
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const navigate = useNavigate();

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("https://ems-cws-backend-9wgt.vercel.app/getAllEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        //Geetanjali
        const sortedEmployees = (res.data || []).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setEmployees(sortedEmployees);
        setFilteredEmployees(sortedEmployees);

        const all = res.data || [];
        const active = all.filter((e) => e.isDeleted !== true);
        // const deleted = all.filter((e) => e.isDeleted === true);
        const deleted = all.filter((e) => e.isDeleted === true);
        setOldEmployees(deleted);
        setFilteredEmployees(active);
        setEmployees(active);
        setOldEmployees(deleted);

        console.log("Deleted Employees:", deleted);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch employees.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Assign Manager
  const handleAssignManagerClick = (emp) => {
    console.log("hii", emp);
    setSelectedEmployee(emp);
    setSelectedManagerId(emp.reportingManager?._id || "");
    const managers = employees.filter(
      (e) => e.role === "manager" && e._id !== emp._id,
    );
    setManagersList(managers);
    setShowModal(true);
    setMessage("");
  };

  const handleUpdateManager = async () => {
    if (!selectedManagerId) {
      setMessage("Please select a manager.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `https://ems-cws-backend-9wgt.vercel.app/users/${selectedEmployee._id}/assign-manager`,
        { managerId: selectedManagerId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const managerObj = managersList.find((m) => m._id === selectedManagerId);
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === selectedEmployee._id
            ? { ...emp, reportingManager: managerObj }
            : emp,
        ),
      );
      setFilteredEmployees((prev) =>
        prev.map((emp) =>
          emp._id === selectedEmployee._id
            ? { ...emp, reportingManager: managerObj }
            : emp,
        ),
      );
      setMessage("Manager assigned successfully!");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setMessage("Error assigning manager.");
    }
  };

  const handleAssignMdClick = (emp) => {
    console.log("Assigning MD to manager:", emp);
    setSelectedManagerForMd(emp);
    setSelectedMdId(emp.reportingManager?._id || "");
    
    const mds = employees.filter(
      (e) => e.role === "md" && e._id !== emp._id
    );
    setMdList(mds);
    setShowMdModal(true);
    setMdMessage("");
  };

  const handleUpdateMd = async () => {
    if (!selectedMdId) {
      setMdMessage("Please select an MD.");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `https://ems-cws-backend-9wgt.vercel.app/assignMd/${selectedManagerForMd._id}`,
        { mdId: selectedMdId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mdObj = mdList.find((m) => m._id === selectedMdId);
      
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === selectedManagerForMd._id
            ? { ...emp, reportingManager: mdObj }
            : emp
        )
      );
      setFilteredEmployees((prev) =>
        prev.map((emp) =>
          emp._id === selectedManagerForMd._id
            ? { ...emp, reportingManager: mdObj }
            : emp
        )
      );
      
      setMdMessage("MD assigned successfully!");
      setShowMdModal(false);
    } catch (err) {
      console.error(err);
      setMdMessage("Error assigning MD.");
    }
  };

  // Pagination with filtered data
  const displayedList = filteredEmployees;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = displayedList.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(displayedList.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  if (error) return <p className="text-danger text-center mt-3">{error}</p>;

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
        All Employee Details
      </h2>

      {/* {userRole === "admin" && <AddEmployee />} */}

      {/* Toggle Button for Old Employees */}
      {/* <div className="text-end mb-3">
        <button
          className="btn btn-secondary"
          onClick={() => {
            setShowOldEmployees(!showOldEmployees);
            setCurrentPage(1);
          }}
        >
          {showOldEmployees ? "Show Active Employees" : "Show Old Employees"}
        </button>
      </div> */}

      {userRole === "admin" && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* Add Employee Component (Button Inside) */}
          <AddEmployee />

          {/* Show Old Employees Button */}
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={toggleOldEmployees}
          >
            {showOldEmployees ? "Show Active Employees" : "Show Old Employees"}
          </button>
        </div>
      )}

      <div
        className="filter-grid"
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: "12px 16px",
          border: "1px solid #e5e7eb",
          marginBottom: 16,
        }}
      >
        {/* <div className="fg-row">
          <label className="fg-label">Search by Any Field</label>
          <input
            type="text"
            className="fg-input"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by any field..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div> */}
        {/* 
        <div className="card mb-4 shadow-sm border-0"> */}
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
                placeholder="Search By Any Field..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={handleSearch}
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={handleResetSearch}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty column for alignment
        <div className="fg-row">
          <div></div>
          <div></div>
        </div> */}

      {/* Actions */}
      {/* <div className="fg-actions">
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={handleSearch}
          >
            Search
          </button>
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={handleResetSearch}
          >
            Reset
          </button>
        </div> */}

      <div className="table-responsive mt-2">
        <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                ID
              </th>
              <th
                style={{
                  fontWeight: "600",
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
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Email
              </th>
              <th
                style={{
                  fontWeight: "600",
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
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Position
              </th>
              <th //added jayu
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Reporting Manager
              </th>

              <th
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Date Of Joining
              </th>
              <th
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {currentEmployees.map((emp) => (
              <tr key={emp._id}>
                <td
                  style={{
                    padding: "12px",
                    verticalAlign: "middle",
                    fontSize: "14px",
                    borderBottom: "1px solid #dee2e6",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.employeeId?.slice(0, 9)}
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
                  {emp.name}
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
                  {emp.email}
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
                  {emp.department || "N/A"}
                </td>
                <td
                  style={{
                    padding: "12px",
                    verticalAlign: "middle",
                    fontSize: "14px",
                    borderBottom: "1px solid #dee2e6",
                    whiteSpace: "nowrap",
                  }}
                  className="text-uppercase"
                >
                  {emp.role}
                </td>
                <td //added jayu
                  style={{
                    padding: "12px",
                    verticalAlign: "middle",
                    fontSize: "14px",
                    borderBottom: "1px solid #dee2e6",
                    whiteSpace: "nowrap",
                  }}
                  //className="text-uppercase"
                >
                  {emp.reportingManager
                    ? emp.reportingManager.name
                    : "Not Assigned"}
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
                  {new Date(emp.doj || emp.createdAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </td>

                <td style={{ display: "flex", gap: "5px" }}>
                  <NavLink
                    to={`/dashboard/${role}/${username}/${id}/employeeprofile/${emp._id}`}
                    className="btn btn-sm custom-outline-btn"
                  >
                    View
                  </NavLink>

                  {/* {!showOldEmployees && userRole === "admin" && (
                    <button
                      className="btn btn-sm btn-outline-success me-2"
                      disabled={restrictedRoles.includes(
                        emp.role?.trim().toLowerCase(),
                      )} //added jayu
                      style={{
                        whiteSpace: "nowrap",
                        height: "31px", // Same as Bootstrap btn-sm default
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        //  backgroundColor: "#3A5FBE", color: "#fff"
                      }}
                      onClick={() => handleAssignManagerClick(emp)}
                    >
                      Assign Manager
                    </button>
                  )} */}
{!showOldEmployees && userRole === "admin" && (
                    <>
                      {emp.role === "manager" ? (
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          disabled={restrictedRoles.includes(
                            emp.role?.trim().toLowerCase(),
                          )}
                          style={{
                            whiteSpace: "nowrap",
                              height: "31px", 
                              alignItems: "center",
                              justifyContent: "center"
                          }}
                          onClick={() => handleAssignMdClick(emp)}
                        >
                          Assign MD
                        </button>
                      ) : (
                        <button
                            className="btn btn-sm btn-outline-success me-2"
                            disabled={restrictedRoles.includes(
                              emp.role?.trim().toLowerCase(),
                            )} //added jayu
                            style={{
                              whiteSpace: "nowrap",
                              height: "31px", // Same as Bootstrap btn-sm default
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              //  backgroundColor: "#3A5FBE", color: "#fff"
                            }}
                            onClick={() => handleAssignManagerClick(emp)}
                          >
                            Assign Manager
                        </button>
                      )}
                    </>
                  )}
                  {/* Hide delete buttons on Old Employee view */}
                  {!showOldEmployees && userRole === "admin" && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      style={{
                        whiteSpace: "nowrap",
                        height: "31px", // Same as Bootstrap btn-sm default
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => handleDeleteEmployee(emp._id)}
                    >
                      Move To Bin
                    </button>
                  )}

                  {showOldEmployees && userRole === "admin" && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteEmployeepermanent(emp._id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
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
            {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, displayedList.length)} of{" "}
            {displayedList.length}
          </span>

          <div className="d-flex align-items-center">
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

      {/* Modal for assigning manager */}

      {showModal && (
        <div
          className="modal d-block"
          ref={modalRef}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#3A5FBE",
                  borderColor: "#3A5FBE",
                  color: "#fff",
                }}
              >
                <h5 className="modal-title">Assign Reporting Manager</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {message && <div className="alert alert-info">{message}</div>}
                <div className="mb-3">
                  <label style={{ color: "#3A5FBE", fontWeight: "bold" }}>
                    Manager
                  </label>
                  <select
                    className="form-select mt-2"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                  >
                    <option value="">Select Manager</option>
                    {managersList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} - {m.role} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={handleUpdateManager}
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMdModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          ref={modalRef}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#3A5FBE",
                  borderColor: "#3A5FBE",
                  color: "#fff",
                }}
              >
                <h5 className="modal-title">Assign MD to Manager</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowMdModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {mdMessage && <div className="alert alert-info">{mdMessage}</div>}
                <div className="mb-3">
                  <label style={{ color: "#3A5FBE", fontWeight: "bold" }}>
                    Select MD
                  </label>
                  <select
                    className="form-select mt-2"
                    value={selectedMdId}
                    onChange={(e) => setSelectedMdId(e.target.value)}
                  >
                    <option value="">Select MD</option>
                    {mdList.map((md) => (
                      <option key={md._id} value={md._id}>
                        {md.name} - {md.role} ({md.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() => setShowMdModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={handleUpdateMd}
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
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

export default AllEmployeeDetails;
