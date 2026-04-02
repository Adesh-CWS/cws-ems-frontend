import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function TLResignation({ user }) {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editedLwd, setEditedLwd] = useState("");
  const [comment, setComment] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  //------------------------------------------------------------shivani
  const [mySearchInput, setMySearchInput] = useState("");
  const [filteredMyResignations, setFilteredMyResignations] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyResignationPopup, setShowMyResignationPopup] = useState(false);
  const [selectedMyResignation, setSelectedMyResignation] = useState(null);
  // My Resignation pagination
  const [myCurrentPage, setMyCurrentPage] = useState(1);
  const [myItemsPerPage, setMyItemsPerPage] = useState(5);

  const [activeTab, setActiveTab] = useState("my");
  const [myResignations, setMyResignations] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    reason: "",
    comments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const employeeId = user?.employeeId || localStorage.getItem("employeeId");

  const [selectedRow, setSelectedRow] = useState(null);

  const openRowPopup = (row) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  const closePopup = () => {
    setShowModal(false);
    setSelectedRow(null);
  };

  //end------------------------------------------------------------------
  //TANVI
  const modalRef = useRef(null);

  //TANVI
  useEffect(() => {
  const isAnyModalOpen = showModal || showProfileModal || showMyResignationPopup || showApplyModal || selectedRow;

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
      if (showProfileModal) setShowProfileModal(false);
      if (showMyResignationPopup) setShowMyResignationPopup(false);
      if (showApplyModal) {
        resetApplyForm();
        setShowApplyModal(false);
      }
      if (selectedRow) closePopup();
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
}, [showModal, showProfileModal, showMyResignationPopup, showApplyModal, selectedRow]);

useEffect(() => {
  const isAnyModalOpen = showModal || showProfileModal || showMyResignationPopup || showApplyModal || selectedRow;
  
  if (isAnyModalOpen) {
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
}, [showModal, showProfileModal, showMyResignationPopup, showApplyModal, selectedRow]);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
  };
//shivani start
const fetchTLResignations = async () => {
  try {
    const token = getToken();
    const teamLeadId = user?._id;

    if (!teamLeadId) return;

    const response = await axios.get(
      `https://ems-cws-backend-9wgt.vercel.app/${teamLeadId}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const transformed = response.data.members.flatMap((m) =>
      (m.resignations || []).map((r) => ({
        id: r.resignationId,
        empId: m.employeeId,
        name: m.name,
        designation: m.designation,
        
        dept: m.department?.name || m.department || "-",
        applyDate: formatDate(r.applyDate),
        lwd: r.lastWorkingDay
          ? formatDate(r.lastWorkingDay)
          : "-",

        reason: r.reason,
        comments: r.comments,

        status: r.status,

        approverComment: r.approverComment || "-",
        approvedBy: r.approvedBy || null,
        approvedDate: r.approvedDate
          ? formatDate(r.approvedDate)
          : null,

        originalData: r,
        employeeObjectId: m._id,
      }))
    );
    const sorted = transformed.sort(
  (a, b) => new Date(b.originalData.applyDate) - new Date(a.originalData.applyDate)
);

setRequests(sorted);
setFilteredRequests(sorted);

    setRequests(transformed);
    setFilteredRequests(transformed);

  } catch (err) {
    console.error("Error fetching TL resignations:", err);
  }
};
//shivani end
  const handleDeleteResignation = async (resignationId) => {
    if (!window.confirm("Are you sure you want to cancel this resignation?")) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert("Authentication token missing");
        return;
      }

      const response = await axios.delete(
        `https://ems-cws-backend-9wgt.vercel.app/cancel/resignation/${resignationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert(response.data.message || "Resignation cancelled successfully");
      fetchMyResignations();
    } catch (err) {
      console.error("Error deleting resignation:", err);
      alert(err.response?.data?.message || "Failed to cancel resignation");
    }
  };

  // Approve/reject resignation (manager version)
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
        `https://ems-cws-backend-9wgt.vercel.app/resignation/${selected.originalData.resignationId}`,
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
        fetchTLResignations();
      }
    } catch (err) {
      console.error(`Error ${action}ing resignation:`, err);
      if (err.response?.status === 401) {
        alert("Authentication failed. Please log in again.");
        // Redirect to login or refresh token
      } else if (err.response?.status === 403) {
        alert(
          "Access denied. You don't have permission to perform this action.",
        );
      } else {
        alert(err.response?.data?.message || `Failed to ${action} resignation`);
      }
    }
  };

  //add this ----------------------------------------------------------------shivani
  const handleApplyResignation = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!applyForm.reason) {
      alert("Please select reason");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = getToken();

      const response = await axios.post(
        "https://ems-cws-backend-9wgt.vercel.app/resignation/apply",
        {
          reason: applyForm.reason,
          comments: applyForm.comments,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert(response.data.message); // "Resignation applied successfully"

      setApplyForm({ reason: "", comments: "" });
      setShowApplyModal(false);
      fetchTLResignations(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply resignation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMyResignations = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const empId = user?.employeeId;
      if (!empId) return;

      const response = await axios.get(
        `https://ems-cws-backend-9wgt.vercel.app/resignation/${empId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMyResignations(response.data || []);
    } catch (err) {
      console.error("Error fetching my resignation:", err);
    }
  };

  //end-------------------------------------------------------------------------
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      alert("Please log in to access this page.");
      // You might want to redirect to login here
      return;
    }

    if (user?._id) {
      fetchTLResignations();
      fetchMyResignations();
    }
  }, [user]);

  // Filter and search logic
  useEffect(() => {
    setFilteredRequests(requests);
    setCurrentPage(1);
  }, [requests]);

  const handleFilter = () => {
    let temp = [...requests];

    if (searchInput.trim() !== "") {
      const query = searchInput.toLowerCase();

      temp = temp.filter((r) => {
        const searchableFields = [
          r.id,
          r.empId,
          r.name,
          r.designation,
          r.dept,
          r.status,
          // r.reportingManager,
          r.applyDate,
          r.lwd,
          //r.reason,
          //r.approverComment,
          // r.comments,
          r.approvedBy?.name,
        ];

        const searchString = searchableFields
          .filter((field) => field !== null && field !== undefined)
          .map((field) => String(field).toLowerCase()) // ✅ KEY FIX
          .join(" ");

        return searchString.includes(query);
      });
    }

    setFilteredRequests(temp);
    setCurrentPage(1);
  };
  useEffect(() => {
    setFilteredMyResignations(myResignations);
    setMyCurrentPage(1);
  }, [myResignations]);

  const handleMyFilter = () => {
    let temp = [...myResignations];

    if (mySearchInput.trim() !== "") {
      const query = mySearchInput.toLowerCase();

      temp = temp.filter((r) => {
        const searchableFields = [
          r.resignationId,
          r.applyDate,
          r.lastWorkingDay,
          r.reason,
          r.status,
          r.approverComment,
          r.comments,
          r.approvedBy?.name,
        ];

        const searchString = searchableFields
          .filter((field) => field !== null && field !== undefined)
          .map((field) => String(field).toLowerCase())
          .join(" ");

        return searchString.includes(query);
      });
    }

    setFilteredMyResignations(temp);
    setMyCurrentPage(1);
  };

  // Open modal
  const openModal = (item) => {
    setSelected(item);
    setEditedLwd(item.lwd === "To be set" || item.lwd === "-" ? "" : item.lwd);
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
    setCurrentPage(1);
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

  const resetApplyForm = () => {
    setApplyForm({
      reason: "",
      comments: "",
    });
  };

  // My Resignation pagination logic
  const myTotalPages = Math.ceil(
    filteredMyResignations.length / myItemsPerPage,
  );

  const myIndexOfLastItem = Math.min(
    myCurrentPage * myItemsPerPage,
    myResignations.length,
  );

  const myIndexOfFirstItem = (myCurrentPage - 1) * myItemsPerPage;

  const myCurrentResignations = filteredMyResignations.slice(
    myIndexOfFirstItem,
    myIndexOfLastItem,
  );

  const handleMyPageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > myTotalPages) return;
    setMyCurrentPage(pageNumber);
  };

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

  // Check if user is authorized to view this page
  if (!user || user?.role !== "Team_Leader") {
    return (
      <div className="container-fluid">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "60vh" }}
        >
          <div className="text-center">
            <h5 className="text-danger">Access Denied</h5>
            <p className="text-muted">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Main Heading */}
      <h4 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        {activeTab === "my" ? " My Resignation" : "Team Resignation"}
      </h4>

      {/* Toggle Buttons */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 120 }}
          onClick={() => setActiveTab("my")}
        >
          My Resignation
        </button>

        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 120 }}
          onClick={() => setActiveTab("team")}
        >
          Team Resignation
        </button>
      </div>

      {activeTab === "my" && (
        <div className="card-body">
          

          <button
            className="btn btn-sm custom-outline-btn"
            onClick={() => {
              resetApplyForm();
              setShowApplyModal(true);
            }}
            style={{ marginBottom: "20px" }}
          >
            Apply Resignation
          </button>

          {/* My Resignation Search */}
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div
                  className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1"
                  //style={{ maxWidth: "400px" }}
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
                    placeholder="Search by any feild..."
                    value={mySearchInput}
                    onChange={(e) => setMySearchInput(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2 ms-auto">
                  <button
                    type="button"
                    style={{ minWidth: 90 }}
                    className="btn btn-sm custom-outline-btn"
                    onClick={handleMyFilter}
                  >
                    Filter
                  </button>

                  <button
                    type="button"
                    style={{ minWidth: 90 }}
                    className="btn btn-sm custom-outline-btn"
                    onClick={() => {
                      setMySearchInput("");
                      setFilteredMyResignations(myResignations);
                      setMyCurrentPage(1);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0 mt-4">
            <div className="table-responsive bg-white">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead style={{ backgroundColor: "#ffffffff" }}>
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
                  {myCurrentResignations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center py-4"
                        style={{ color: "#6c757d" }}
                      >
                        No resignation records found
                      </td>
                    </tr>
                  ) : (
                    myCurrentResignations.map((r) => (
                      <tr
                        key={r.resignationId}
                        onClick={() => {
                          setSelectedMyResignation(r);
                          setShowMyResignationPopup(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={tdStyle}>{r.resignationId}</td>
                        <td style={tdStyle}>{formatDate(r.applyDate)}</td>
                        <td style={tdStyle}>
                          {r.lastWorkingDay
                            ? formatDate(r.lastWorkingDay)
                            : "-"}
                        </td>
                        <td style={tdStyle}>{r.reason}</td>
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
                          {r.approvedBy
                            ? `${r.approvedBy.name} (${r.approvedBy.role})`
                            : "N/A"}
                        </td>
                        <td style={tdStyle}>{r.approverComment || "-"}</td>
                        <td
                          style={tdStyle}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.status?.toLowerCase() === "pending" && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDeleteResignation(r.resignationId)
                              }
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
          {/* My Resignation Pagination */}
          <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
            <div className="d-flex align-items-center gap-3">
              {/* Rows per page */}
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
                  value={myItemsPerPage}
                  onChange={(e) => {
                    setMyItemsPerPage(Number(e.target.value));
                    setMyCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>

              {/* Range display */}
              <span
                style={{
                  fontSize: "14px",
                  marginLeft: "16px",
                  color: "#212529",
                }}
              >
                {myResignations.length === 0
                  ? "0–0 of 0"
                  : `${myIndexOfFirstItem + 1}-${myIndexOfLastItem} of ${myResignations.length}`}
              </span>

              {/* Arrows */}
              <div
                className="d-flex align-items-center"
                style={{ marginLeft: "16px" }}
              >
                <button
               className="btn btn-sm focus-ring"
                  onClick={() => handleMyPageChange(myCurrentPage - 1)}
                  disabled={myCurrentPage === 1}
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
                  onClick={() => handleMyPageChange(myCurrentPage + 1)}
                  disabled={myCurrentPage === myTotalPages}
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
        </div>
      )}

      {/*add this -------------------------------------------- */}
      {activeTab === "team" && (
        <>
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
                  className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1"
                  //style={{ maxWidth: "400px" }}
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
                    onClick={handleFilter}
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
                        onClick={() => openRowPopup(r)}
                      >
                        <td style={tdStyle}>{r.id}</td>
                        <td style={tdStyle}>{r.empId}</td>
                        <td style={tdStyle}>{r.name}</td>
                        <td style={tdStyle}>{r.designation}</td>
                        <td style={tdStyle}>{r.dept}</td>
                        <td style={tdStyle}>{r.applyDate}</td>
                        <td style={tdStyle}>{r.lwd}</td>
                        <td style={tdStyle}>
                          {r.approvedBy ? (
                            <div>{r.approvedBy.name}</div>
                          ) : (
                            "N/A"
                          )}
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
                style={{
                  fontSize: "14px",
                  marginLeft: "16px",
                  color: "#212529",
                }}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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
        </>
      )}
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
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div 
              className="modal-content"
              // style={{
              //   maxHeight: "90vh",
              //   display: "flex",
              //   flexDirection: "column",
              // }}
            >
              {/* Header*/}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE", flexShrink: 0 }}
              >
                <h5 className="modal-title mb-0">Resignation Action</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              <div 
                className="modal-body" 
                style={{ 
                  overflowY: "scroll", 
                }}
              >
                
                <div className="container-fluid">
                  {/* Manager Action Section */}
                  {selected.status === "Pending" && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <h6
                          className="fw-semibold mb-3"
                          style={{ color: "#3A5FBE" }}
                        >
                          Manager Action
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
                            <div>{selected.approvedBy.name}</div>
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
              <div className="modal-footer border-0 pt-0 d-flex gap-2" style={{ flexShrink: 0 }}>
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
                  style={{ minWidth: "90px" }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*add this -------------------------------------------shivani */}
      {showMyResignationPopup && selectedMyResignation && (
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
          onClick={() => setShowMyResignationPopup(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">My Resignation Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowMyResignationPopup(false)}
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Resignation ID
                    </div>
                    <div className="col-7 col-sm-8">
                      {selectedMyResignation.resignationId}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Apply Date</div>
                    <div className="col-7 col-sm-8">
                      {formatDate(selectedMyResignation.applyDate)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Last Working Day
                    </div>
                    <div className="col-7 col-sm-8">
                      {selectedMyResignation.lastWorkingDay
                        ? formatDate(selectedMyResignation.lastWorkingDay)
                        : "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Reason</div>
                    <div className="col-7 col-sm-8">
                      {selectedMyResignation.reason}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Status</div>
                    <div className="col-7 col-sm-8">
                      <span
                        style={{
                          padding: "4px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          backgroundColor: getStatusColor(
                            selectedMyResignation.status,
                          ).bg,
                          color: getStatusColor(selectedMyResignation.status)
                            .color,
                        }}
                      >
                        {selectedMyResignation.status}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Approver</div>
                    <div className="col-7 col-sm-8">
                      {selectedMyResignation.approvedBy
                        ? `${selectedMyResignation.approvedBy.name} (${selectedMyResignation.approvedBy.role})`
                        : "N/A"}
                    </div>
                  </div>
                  {/* Approved / Rejected Date */}
                  {selectedMyResignation.status?.toLowerCase() !==
                    "pending" && (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-4 fw-semibold">
                        Approved / Rejected Date
                      </div>
                      <div className="col-7 col-sm-8">
                        {selectedMyResignation.approvedDate
                          ? formatDate(selectedMyResignation.approvedDate)
                          : "N/A"}
                      </div>
                    </div>
                  )}

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Approver Comment
                    </div>
                    <div className="col-7 col-sm-8">
                      {selectedMyResignation.approverComment || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0 d-flex gap-2">
                {selectedMyResignation.status?.toLowerCase() === "pending" && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      handleDeleteResignation(
                        selectedMyResignation.resignationId,
                      )
                    }
                  >
                    Cancel Resignation
                  </button>
                )}
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowMyResignationPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
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
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Employee Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowProfileModal(false)}
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Employee ID
                    </div>
                    <div className="col-7 col-sm-9">
                      {user?.employeeId || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Name</div>
                    <div className="col-7 col-sm-9">{user?.name || "N/A"}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Designation
                    </div>
                    <div className="col-7 col-sm-9">
                      {user?.designation || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Department</div>
                    <div className="col-7 col-sm-9">
                      {user?.department || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Reporting Manager
                    </div>
                    <div className="col-7 col-sm-9">
                      {user?.reportingManager?.name || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Joining Date
                    </div>
                    <div className="col-7 col-sm-9">
                      {formatDate(user?.doj)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
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
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title  mb-0">Apply Resignation</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    resetApplyForm();
                    setShowApplyModal(false);
                  }}
                />
              </div>

              <form onSubmit={handleApplyResignation}>
                <div className="modal-body">
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
                  <div className="mb-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Reason *</label>
                      <select
                        className="form-select"
                        value={applyForm.reason}
                        onChange={(e) =>
                          setApplyForm({ ...applyForm, reason: e.target.value })
                        }
                      >
                        <option value="">Select reason</option>
                        <option value="Career Growth">Career Growth</option>
                        <option value="Personal Reason">Personal Reason</option>
                        <option value="Higher Studies">Higher Studies</option>
                        <option value="Health Issue">Health Issue</option>
                        <option value="Relocation">Relocation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

              <div className="mb-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Comments</label>

                    <textarea
                      className="form-control"
                      rows="3"
                      maxLength={300}
                      value={applyForm.comments}
                      onChange={(e) =>
                        setApplyForm({
                          ...applyForm,
                          comments: e.target.value,
                        })
                      }
                    />

                    <div style={{ fontSize: "12px", textAlign: "right", color: "#6c757d" }}>
                      {applyForm.comments?.length || 0}/300
                    </div>
                  </div>
                </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-sm custom-outline-btn"
                    style={{ maxWidth: 90 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm custom-outline-btn"
                     style={{ maxWidth: 90 }}
                    onClick={() => {
                      resetApplyForm();
                      setShowApplyModal(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal && selectedRow && (
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
          onClick={closePopup}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              {/* ===== Header ===== */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Resignation Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closePopup}
                />
              </div>

              {/* ===== Body ===== */}
              <div className="modal-body">
                <div className="container-fluid">
                  {/* ===== Employee Information ===== */}
                  <div className="row mb-4">
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
                      <div>{selectedRow.empId}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Name</div>
                      <div>{selectedRow.name}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Designation</div>
                      <div>{selectedRow.designation}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Department</div>
                      <div>{selectedRow.dept}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Joining Date</div>
                      <div>{selectedRow.joiningDate || "N/A"}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Reporting Manager</div>
                      <div>{selectedRow.reportingManager || "N/A"}</div>
                    </div>
                    {/* 
              {selectedRow.noticePeriodDays &&
                selectedRow.noticePeriodDays > 0 && (
                  <div className="col-md-6 mb-2">
                    <div className="fw-semibold">Notice Period</div>
                    <div>{selectedRow.noticePeriodDays} days</div>
                  </div>
                )}
              */}
                  </div>

                  {/* ===== Resignation Information ===== */}
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
                      <div>{selectedRow.applyDate}</div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <div className="fw-semibold">Status</div>
                      <div>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            backgroundColor: getStatusColor(selectedRow.status)
                              .bg,
                            color: getStatusColor(selectedRow.status).color,
                          }}
                        >
                          {selectedRow.status}
                        </span>
                      </div>
                    </div>

                    <div className="col-12 mb-2">
                      <div className="fw-semibold">Reason</div>
                      <div>{selectedRow.reason || "-"}</div>
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
    {selectedRow.comments || "-"}
  </div>
</div>
                  </div>
                </div>
              </div>

              {/* ===== Footer ===== */}
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closePopup}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*end------------------------------------------------------------------ */}

      {/* //Added by Mahesh */}
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

export default TLResignation;
