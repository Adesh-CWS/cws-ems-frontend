import React, { useState, useEffect,useRef } from "react";
import axios from "axios";

function EmployeeResignation({ user }) {
  const [employee, setEmployee] = useState({
    empId: "",
    name: "",
    designation: "",
    department: "",
    manager: "",
    joiningDate: "",
  });
  const [applyFilter, setApplyFilter] = useState(false); //rutuja code

  const [resignations, setResignations] = useState([]);
  const [filteredResignations, setFilteredResignations] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [showEmployeePopup, setShowEmployeePopup] = useState(false);
  const [showResignationDetails, setShowResignationDetails] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [form, setForm] = useState({
    reason: "",
    comments: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const token = localStorage.getItem("accessToken");
  const employeeId = localStorage.getItem("employeeId") || user?.employeeId;
  const modalRef = useRef(null);
  useEffect(() => {
    const isAnyModalOpen = showEmployeePopup || showApply || showResignationDetails;
  
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    };
  }, [showEmployeePopup, showApply, showResignationDetails]);
  
  useEffect(() => {
    const isAnyModalOpen = showEmployeePopup || showApply || showResignationDetails;
  
    if (!isAnyModalOpen || !modalRef.current) return;
  
    const modal = modalRef.current;
  
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    const getFocusableElements = () =>
      modal.querySelectorAll(focusableSelectors);
  
    const focusFirst = () => {
      const elements = getFocusableElements();
      if (elements.length) elements[0].focus();
    };
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showApply) setShowApply(false);
        if (showEmployeePopup) setShowEmployeePopup(false);
        if (showResignationDetails) setShowResignationDetails(false);
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
  }, [showEmployeePopup, showApply, showResignationDetails]);

  async function fetchUser() {
    try {
      const response = await axios.get("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  const fetchEmployeeData = async () => {
    try {
      const userData = await fetchUser();
      if (!userData) return;

      const response = await axios.get(
        `http://localhost:8000/emp/info/${userData.employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEmployee({
        empId: response.data.empId || "",
        name: response.data.name || "",
        designation: response.data.designation || "",
        department: response.data.department || "",
        manager: response.data.manager || "",
        joiningDate: response.data.joiningDate || "",
      });
    } catch (err) {
      console.error("Error fetching employee data:", err);
    }
  };

  const fetchResignations = async () => {
    try {
      const userData = await fetchUser();
      if (!userData) return;

      const response = await axios.get(
        `http://localhost:8000/resignation/${userData.employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const resignationsData = Array.isArray(response.data)
        ? response.data
        : [];

      const transformedData = resignationsData.map((r) => ({
        ...r,
        approverName: r.approvedBy?.name || r.approverName || "-",
        approverComment: r.approverComment || r.hrComment || "-",
        approvedDate: r.approvedDate || "-",
      }));

      setResignations(transformedData);
      setFilteredResignations(transformedData);
    } catch (err) {
      console.error("Error fetching resignations:", err);
      setResignations([]);
      setFilteredResignations([]);
    }
  };

  const handleApply = async (e) => {
    e?.preventDefault();

    if (!form.reason) {
      alert("Please select reason");
      return;
    }
    //Added by Rutuja
    if (!form.comments || form.comments.trim() === "") {
      alert("Please provide comments for resignation");
      return;
    }

    // comment limit
    if (form.comments.trim().length > 300) {
      alert("Comments must be 300 characters or less");
      return;
    }

    try {
      // const userData = await fetchUser();
      // if (!userData) {
      //   alert("User not found");
      //   return;
      // }

      const payload = {
        reason: form.reason,
        comments: form.comments,
      };

      const response = await axios.post(
        "http://localhost:8000/resignation/apply",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (
        response.data.message === "Resignation applied successfully" ||
        response.data.success
      ) {
        alert("Resignation applied successfully!");
        setForm({ reason: "", comments: "" });
        setShowApply(false);
        fetchResignations();
      }
    } catch (err) {
      console.error("Error applying resignation:", err);
      alert(err.response?.data?.message || "Failed to apply resignation");
    }
  };

  const handleDeleteResignation = async (resignationId) => {
    if (!window.confirm("Are you sure you want to cancel this resignation?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:8000/cancel/resignation/${resignationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Resignation cancel successfully");
        fetchResignations();
        setShowResignationDetails(false);
      }
    } catch (err) {
      console.error("Error deleting resignation:", err);
      alert("Failed to cancel resignation");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          await Promise.all([fetchEmployeeData(), fetchResignations()]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [token]);

  // Apply filters when search query changes
  // useEffect(() => {
  //   const query = searchQuery.toLowerCase().trim();
  //   if (query === "") {
  //     setFilteredResignations(resignations);
  //   } else {
  //     const filtered = resignations.filter(
  //       (r) =>
  //         (r.resignationId || "").toString().toLowerCase().includes(query) ||
  //         (r.reason || "").toLowerCase().includes(query) ||
  //         (r.status || "").toLowerCase().includes(query) ||
  //         (r.approverComment || "").toLowerCase().includes(query) ||
  //         (r.approverName || "").toLowerCase().includes(query) ||
  //         formatDate(r.applyDate).toLowerCase().includes(query) ||
  //         (r.approvedDate
  //           ? formatDate(r.approvedDate).toLowerCase().includes(query)
  //           : false) ||
  //         (r.lastWorkingDay
  //           ? formatDate(r.lastWorkingDay).toLowerCase().includes(query)
  //           : false),
  //     );
  //     setFilteredResignations(filtered);
  //   }
  //   setCurrentPage(1);
  // }, [searchQuery, resignations]);

  useEffect(() => {
    if (applyFilter) {
      const query = searchQuery.toLowerCase().trim();
      if (query === "") {
        setFilteredResignations(resignations);
      } else {
        const filtered = resignations.filter(
          (r) =>
            (r.resignationId || "").toString().toLowerCase().includes(query) ||
            (r.reason || "").toLowerCase().includes(query) ||
            (r.status || "").toLowerCase().includes(query) ||
            (r.approverComment || "").toLowerCase().includes(query) ||
            (r.approverName || "").toLowerCase().includes(query) ||
            formatDate(r.applyDate).toLowerCase().includes(query) ||
            (r.approvedDate
              ? formatDate(r.approvedDate).toLowerCase().includes(query)
              : false) ||
            (r.lastWorkingDay
              ? formatDate(r.lastWorkingDay).toLowerCase().includes(query)
              : false),
        );
        setFilteredResignations(filtered);
      }
      setApplyFilter(false);
      setCurrentPage(1);
    }
  }, [applyFilter, searchQuery, resignations]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "N/A";
    try {
      const date = new Date(dateString);
      return date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/\//g, "-");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === "-") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return formatDate(dateString);
    }
  };

  // Function to handle row click
  const handleRowClick = (resignation) => {
    setSelectedResignation(resignation);
    setShowResignationDetails(true);
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return { bg: "#fde68a", color: "#92400e" };
      case "approved":
        return { bg: "#bbf7d0", color: "#065f46" };
      case "rejected":
        return { bg: "#fecaca", color: "#7f1d1d" };
      default:
        return { bg: "#e5e7eb", color: "#4b5563" };
    }
  };

  const resetApplyForm = () => {
    setForm({
      reason: "",
      comments: "",
    });
  };

  // Calculate counts for status cards
  // const statusCounts = {
  //   total: resignations.length,
  //   pending: resignations.filter((r) => r.status?.toLowerCase() === "pending")
  //     .length,
  //   approved: resignations.filter((r) => r.status?.toLowerCase() === "approved")
  //     .length,
  //   rejected: resignations.filter((r) => r.status?.toLowerCase() === "rejected")
  //     .length,
  // };

  // Pagination logic
  const totalPages = Math.ceil(filteredResignations.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredResignations.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentResignations = filteredResignations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilteredResignations(resignations);
  };

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
        My Resignation
      </h2>

      {/* Status Cards */}
      {/* <div className="row g-3 mb-4">
        {[
          {
            title: "Total Requests",
            count: statusCounts.total || 0,
            bg: "#D1ECF1",
          },
          {
            title: "Pending Requests",
            count: statusCounts.pending || 0,
            bg: "#FFE493",
          },
          {
            title: "Approved Requests",
            count: statusCounts.approved || 0,
            bg: "#D7F5E4",
          },
          {
            title: "Rejected Requests",
            count: statusCounts.rejected || 0,
            bg: "#F2C2C2",
          },
        ].map((stat, idx) => (
          <div className="col-12 col-md-4 col-lg-3 mb-3" key={idx}>
            <div className="card shadow-sm h-100 border-0">
              <div
                className="card-body d-flex align-items-center"
                style={{ gap: "20px" }}
              >
                <h4
                  className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: stat.bg,
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
                  {stat.count}
                </h4>
                <p
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  {stat.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* Employee Info Table */}
      {/* <div className="card shadow-sm border-0 mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead>
              <tr>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Joining Date</th>
                <th style={thStyle}>Reporting Manager</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Designation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ cursor: "pointer" }}
                onClick={() => setShowEmployeePopup(true)}
              >
                <td style={tdStyle}>{employee.empId || "N/A"}</td>
                <td style={tdStyle}>{employee.name || "N/A"}</td>
                <td style={tdStyle}>{formatDate(employee.joiningDate)}</td>
                <td style={tdStyle}>{employee.manager || "N/A"}</td>
                <td style={tdStyle}>{employee.department || "N/A"}</td>
                <td style={tdStyle}>{employee.designation || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="searchQuery"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "60px" }}
              >
                Search
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search by any field..."
                style={{ minWidth: 100 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  setApplyFilter(true); //rutuja
                }}
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  setSearchQuery("");
                  setApplyFilter(true);
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Apply Resignation Button */}
      <div className="d-flex justify-content-start mb-4">
        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            resetApplyForm();
            setShowApply(true);
          }}
        >
          Apply Resignation
        </button>
      </div>

      {/* Resignations Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Apply Date</th>
                <th style={thStyle}>LWD</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Approver Name</th>
                <th style={thStyle}>Approver Comment</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentResignations.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-4"
                    style={{ color: "#6c757d" }}
                  >
                    No resignations found
                  </td>
                </tr>
              ) : (
                currentResignations.map((r) => (
                  <tr
                    key={r.resignationId}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(r)}
                  >
                    <td style={tdStyle}>{r.resignationId || "N/A"}</td>
                    <td style={tdStyle}>{formatDate(r.applyDate)}</td>
                    <td style={tdStyle}>
                      {r.lastWorkingDay ? formatDate(r.lastWorkingDay) : "-"}
                    </td>
                    <td style={tdStyle}>{r.reason || "-"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: "500",
                          backgroundColor: getStatusColor(r.status).bg,
                          color: getStatusColor(r.status).color,
                          display: "inline-block",
                          minWidth: "100px",
                          textAlign: "center",
                        }}
                      >
                        {r.status || "Unknown"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {r.status?.toLowerCase() === "pending" ? (
                        "-"
                      ) : (
                        <div>
                          <div>{r.approverName || "-"}</div>
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{r.approverComment || "-"}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      {r.status?.toLowerCase() === "pending" && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() =>
                            handleDeleteResignation(r.resignationId)
                          }
                          style={{
                            fontSize: "12px",
                            padding: "4px 12px",
                            borderRadius: "4px",
                          }}
                        >
                          Cancel
                        </button>
                      )}
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
            {filteredResignations.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredResignations.length}`}
          </span>

          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
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

      {/* Employee Info Popup - Updated to match AdminTaskTMS style */}
      {showEmployeePopup && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
          onClick={() => setShowEmployeePopup(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Employee Information</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEmployeePopup(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Employee ID
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {employee.empId || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {employee.name || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Designation
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {employee.designation || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Department
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {employee.department || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Reporting Manager
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {employee.manager || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Joining Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(employee.joiningDate)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowEmployeePopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Resignation Popup - Updated to match AdminTaskTMS style */}
      {showApply && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
          onClick={() => setShowApply(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Apply Resignation</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    resetApplyForm();
                    setShowApply(false);
                  }}
                />
              </div>

              <div className="modal-body">
                <form onSubmit={handleApply}>
                  <div className="row mb-3">
                    <div className="col-12">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={employeeId}
                        disabled
                        style={{
                          backgroundColor: "#f1f5f9",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Reason *
                      </label>
                      <select
                        className="form-select"
                        value={form.reason}
                        onChange={(e) =>
                          setForm({ ...form, reason: e.target.value })
                        }
                        required
                      >
                        <option value="">Select Reason</option>
                        <option value="Career Growth">Career Growth</option>
                        <option value="Personal Reason">Personal Reason</option>
                        <option value="Higher Studies">Higher Studies</option>
                        <option value="Health Issue">Health Issue</option>
                        <option value="Relocation">Relocation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Comment
                      </label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={form.comments}
                        onChange={(e) =>
                          setForm({ ...form, comments: e.target.value })
                        }
                        placeholder="Enter your resignation comments "
                        style={{ resize: "none" }}
                        maxLength={300}
                      />
                      <div
                        className="char-count mt-1"
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          fontSize: "12px",
                          color:
                            form.comments.length > 300 ? "#dc3545" : "#6c757d",
                        }}
                      >
                        {form.comments.length}/300
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      onClick={() => {
                        resetApplyForm();
                        setShowApply(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm custom-outline-btn"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Details Modal - Updated to match AdminTaskTMS style */}
      {showResignationDetails && selectedResignation && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
          onClick={() => setShowResignationDetails(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Resignation Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowResignationDetails(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Resignation ID
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedResignation.resignationId || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: getStatusColor(
                            selectedResignation.status,
                          ).bg,
                          color: getStatusColor(selectedResignation.status)
                            .color,
                        }}
                      >
                        {selectedResignation.status || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Apply Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedResignation.applyDate)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Last Working Day
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedResignation.lastWorkingDay
                        ? formatDate(selectedResignation.lastWorkingDay)
                        : "Not set"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Reason
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedResignation.reason || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Employee Comments
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedResignation.comments || "No comments"}
                    </div>
                  </div>

                  {/* Approval Details*/}
                  {selectedResignation.status?.toLowerCase() !== "pending" && (
                    <>
                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Approver Name
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {selectedResignation.approverName || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Approved/Rejected Date
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {selectedResignation.approvedDate
                            ? formatDateTime(selectedResignation.approvedDate)
                            : "N/A"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Approver Comment
                        </div>
                        <div
                          className="col-7 col-sm-9"
                          style={{ color: "#212529" }}
                        >
                          {selectedResignation.approverComment ||
                            "No comment provided"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                {selectedResignation.status?.toLowerCase() === "pending" && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      handleDeleteResignation(selectedResignation.resignationId)
                    }
                    // style={{ marginRight: "auto" }}
                  >
                    Cancel Resignation
                  </button>
                )}
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowResignationDetails(false)}
                >
                  Close
                </button>
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

// Styles
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

export default EmployeeResignation;
