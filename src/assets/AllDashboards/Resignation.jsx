import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function Resignation() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editedLwd, setEditedLwd] = useState("");
  const [comment, setComment] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  //addded by shivani
  const [showRowModal, setShowRowModal] = useState(false);
  const [rowSelected, setRowSelected] = useState(null);
  const openRowModal = (item) => {
    setRowSelected(item);
    setShowRowModal(true);
  };

  const closeRowModal = () => {
    setShowRowModal(false);
    setRowSelected(null);
  };

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  };
  const modalRef = useRef(null);

 useEffect(() => {
    const isAnyModalOpen = showModal || showRowModal;

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
    
        if (showModal) closeModal();
        if (showRowModal) closeRowModal();
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
  }, [showModal, showRowModal]);
  useEffect(() => {
    if (showModal || showRowModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';  
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';  
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    };
  }, [showModal, showRowModal]);
  // Get all resignations
  const fetchResignations = async () => {
    try {
      const token = getToken();
      const response = await axios.get("http://localhost:8000/resignation", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const transformedData = response.data.map((r) => ({
        id: r.resignationId,
        empId: r.employeeId,
        name: r.employeeName,
        designation: r.designation,
        dept: r.department,
        applyDate: formatDate(r.applyDate),
        lwd: r.lastWorkingDay ? formatDate(r.lastWorkingDay) : "-",
        reason: r.reason,
        status: r.status,
        approverComment: r.approverComment || "-",
        approvedBy: r.approvedBy
          ? {
              name: r.approvedBy.name,
            }
          : null,
        approvedDate: r.approvedDate ? formatDate(r.approvedDate) : null,
        joiningDate: r.joiningDate ? formatDate(r.joiningDate) : "N/A",
        reportingManager: r.reportingManager || "Not assigned",
        comments: r.comments || "",
        originalData: r,
      }));

      setRequests(transformedData);
      setFilteredRequests(transformedData);
    } catch (err) {
      console.error("Error fetching resignations:", err);
      if (err.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      }
    }
  };

  // Approve/reject resignation
  const handleResignationAction = async (action) => {
    if (action === "approve") {
      if (!editedLwd) {
        alert("Please enter Last Working Day for approval");
        return;
      }
    } else if (action === "reject") {
      if (!comment.trim()) {
        alert("Please enter rejection reason");
        return;
      }
    }

    if (comment && comment.trim().length > 300) {
      alert("Comment must be 300 characters or less");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const payload = {
        action: action,
        lastWorkingDay: action === "approve" ? editedLwd : null,
        approverComment: comment || "-",
      };

      const response = await axios.put(
        `http://localhost:8000/resignation/${selected.originalData.resignationId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.message) {
        alert(response.data.message);
        closeModal();
        fetchResignations();
      }
    } catch (err) {
      console.error(`Error ${action}ing resignation:`, err);
      if (err.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert(err.response?.data?.message || `Failed to ${action} resignation`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    fetchResignations();
  }, []);

  // Filter and search logic
  // useEffect(() => {
  //   let temp = [...requests];

  //   if (searchInput.trim() !== "") {
  //     const query = searchInput.toLowerCase();
  //     temp = temp.filter((r) => {
  //       const searchableFields = [
  //         r.id,
  //         r.empId,
  //         r.name,
  //         r.designation,
  //         r.dept,
  //         r.status,
  //         r.reportingManager,
  //         r.applyDate,
  //         r.lwd,
  //         r.reason,
  //         r.approverComment,
  //         r.comments,
  //         r.approvedBy?.name,
  //       ];

  //       const searchString = searchableFields
  //         .filter((field) => field !== null && field !== undefined)
  //         .join(" ")
  //         .toLowerCase();

  //       return searchString.includes(query);
  //     });
  //   }

  //   setFilteredRequests(temp);
  //   setCurrentPage(1);
  // }, [requests, searchInput]);

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const query = searchInput.toLowerCase().trim();
    const filtered = requests.filter((r) => {
      const searchFields = [
        r.id?.toString().toLowerCase(),
        r.empId?.toString().toLowerCase(),
        r.name?.toLowerCase(),
        r.designation?.toLowerCase(),
        r.dept?.toLowerCase(),
        r.applyDate?.toLowerCase(),
        r.lwd?.toLowerCase(),
        r.approvedBy?.name?.toLowerCase(),
        r.status?.toLowerCase(),
      ];

      return searchFields.some((field) => field && field.includes(query));
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  // Open modal
  const openModal = (item) => {
    setSelected(item);
    setEditedLwd(item.lwd === "To be set" ? "" : item.lwd);
    setComment("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  // Approve
  const handleApprove = () => {
    handleResignationAction("approve");
  };

  // Reject
  const handleReject = () => {
    handleResignationAction("reject");
  };

  // Reset filters
  const resetFilters = () => {
    setSearchInput("");
    setFilteredRequests(requests);
  };

  // Calculate counts for status cards
  const statusCounts = requests.reduce((acc, request) => {
    acc.total = (acc.total || 0) + 1;
    if (request.status === "Pending") {
      acc.pending = (acc.pending || 0) + 1;
    } else if (request.status === "Approved") {
      acc.approved = (acc.approved || 0) + 1;
    } else if (request.status === "Rejected") {
      acc.rejected = (acc.rejected || 0) + 1;
    }
    return acc;
  }, {});

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredRequests.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "#fde68a", color: "#92400e" };
      case "Approved":
        return { bg: "#bbf7d0", color: "#065f46" };
      case "Rejected":
        return { bg: "#fecaca", color: "#7f1d1d" };
      default:
        return { bg: "#e5e7eb", color: "#374151" };
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px", marginLeft: "15px" }}>
          Resignation Requests
        </h2>
      </div>

      {/* Status Cards */}
      <div className="row g-3 mb-4">
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
      </div>

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div
              className="d-flex align-items-center gap-2"
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
                placeholder="Search by any field..."
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
                onClick={handleSearch}
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

      {/* Table */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={thStyle}>Resignation ID</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Employee Name</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Apply Date</th>
                <th style={thStyle}>LWD</th>
                <th style={thStyle}>Approved/Rejected By</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-4"
                    style={{ color: "#6c757d" }}
                  >
                    No resignation requests found
                  </td>
                </tr>
              ) : (
                currentRequests.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openRowModal(r)}
                  >
                    <td style={tdStyle}>{r.id}</td>
                    <td style={tdStyle}>{r.empId}</td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>{r.designation}</td>
                    <td style={tdStyle}>{r.dept}</td>
                    <td style={tdStyle}>{r.applyDate}</td>
                    <td style={tdStyle}>{r.lwd}</td>
                    <td style={tdStyle}>
                      {r.approvedBy ? <div>{r.approvedBy.name}</div> : "N/A"}
                    </td>
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
                        {r.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(r);
                        }}
                      >
                        View
                      </button>
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
            {filteredRequests.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredRequests.length}`}
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

      {/* Modal */}
      {showModal && selected && (
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
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Resignation Action</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="container-fluid">
                  {/* HR Action Section */}
                  {selected.status === "Pending" && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <h6
                          className="fw-semibold mb-3"
                          style={{ color: "#3A5FBE" }}
                        >
                          Action
                        </h6>
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold">
                          Last Working Day *
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={editedLwd}
                          onChange={(e) => setEditedLwd(e.target.value)}
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold">
                          Comments{" "}
                          {selected.status === "Pending" &&
                            "(Required for rejection)"}
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Enter comments here..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Processed Details */}
                  {selected.status !== "Pending" && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <h6
                          className="fw-semibold mb-3"
                          style={{ color: "#3A5FBE" }}
                        >
                          Processed Details
                        </h6>
                      </div>
                      <div className="col-md-6 mb-2">
                        <div className="fw-semibold">Approver Comment</div>
                        <div>{selected.approverComment}</div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <div className="fw-semibold">Approved/Rejected By</div>
                        <div>
                          {selected.approvedBy ? (
                            <div>
                              <div>{selected.approvedBy.name}</div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <div className="fw-semibold">
                          Approved/Rejected Date
                        </div>
                        <div>{selected.approvedDate || "N/A"}</div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <div className="fw-semibold">Last Working Day</div>
                        <div>{selected.lwd}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0 d-flex gap-2">
                {selected.status === "Pending" ? (
                  <>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={handleApprove}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleReject}
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={closeModal}
                  style={{ minWidth: 90 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Details Modal added by shivani */}
      {showRowModal && rowSelected && (
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
          onClick={closeRowModal}
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Resignation Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeRowModal}
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-12">
                      <h6
                        className="fw-semibold mb-3"
                        style={{ color: "#3A5FBE" }}
                      >
                        Employee Information
                      </h6>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Employee ID</div>
                      <div>{rowSelected.empId}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Name</div>
                      <div>{rowSelected.name}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Designation</div>
                      <div>{rowSelected.designation}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Department</div>
                      <div>{rowSelected.dept}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Joining Date</div>
                      <div>{rowSelected.joiningDate}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Reporting Manager</div>
                      <div>{rowSelected.reportingManager}</div>
                    </div>
                  </div>

                  {/* Resignation Information */}
                  <div className="row mb-3">
                    <div className="col-12">
                      <h6
                        className="fw-semibold mb-3"
                        style={{ color: "#3A5FBE" }}
                      >
                        Resignation Information
                      </h6>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Apply Date</div>
                      <div>{rowSelected.applyDate}</div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Status</div>
                      <div>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            backgroundColor: getStatusColor(rowSelected.status)
                              .bg,
                            color: getStatusColor(rowSelected.status).color,
                          }}
                        >
                          {rowSelected.status}
                        </span>
                      </div>
                    </div>
                    <div className="col-12 mb-2">
                      <div className="fw-semibold">Reason</div>
                      <div>{rowSelected.reason}</div>
                    </div>
<div className="col-12 mb-2">
  <div className="fw-semibold">Employee Comment</div>
  <div
    style={{
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      whiteSpace: "pre-wrap"
    }}
  >
    {rowSelected.comments || "-"}
  </div>
</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeRowModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Back Button added jayshree*/}  
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

// Table styles
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

export default Resignation;
