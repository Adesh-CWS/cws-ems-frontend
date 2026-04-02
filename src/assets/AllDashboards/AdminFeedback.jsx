import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const popupRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (selectedFeedback && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedFeedback]);

  useEffect(() => {
    fetchAllFeedbacks();
  }, []);

  const fetchAllFeedbacks = async () => {
    try {
      const response = await axios.get("http://localhost:8000/feedback/all");

      if (response.data && response.data.success) {
        const allFeedbacks = (response.data.feedbacks || []).map((fb) => {
          return {
            id: fb._id,
            feedbackId: fb.feedbackId,
            senderId: fb.sender?._id,
            senderName: fb.sender?.name || "-",
            senderDesignation: fb.sender?.designation || "-",
            senderRole: fb.sender?.role || "-",
            senderEmail: fb.sender?.email || "-",
            receiverId: fb.receiver?._id,
            receiverName: fb.receiver?.name || "-",
            receiverDesignation: fb.receiver?.designation || "-",
            receiverRole: fb.receiver?.role || "-",
            receiverEmail: fb.receiver?.email || "-",
            date: fb.createdAt
              ? new Date(fb.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
            status: fb.status === "viewed" ? "Viewed" : "Pending",
            title: fb.title || "-",
            description: fb.message || "-",
            readAt: fb.readAt
              ? new Date(fb.readAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : null,
            originalStatus: fb.status,
          };
        });

        setFeedbacks(allFeedbacks);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error("Error fetching all feedbacks:", err);
      setFeedbacks([]);
    }
  };

  const handleSearch = () => setSearchQuery(searchText);

  const handleReset = () => {
    setSearchText("");
    setSearchQuery("");
    setStatusFilter("All");
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const q = searchQuery.toLowerCase();
    const matchesText =
      q === "" ||
      (fb.feedbackId && fb.feedbackId.toLowerCase().includes(q)) ||
      (fb.senderName && fb.senderName.toLowerCase().includes(q)) ||
      (fb.receiverName && fb.receiverName.toLowerCase().includes(q)) ||
      (fb.senderDesignation &&
        fb.senderDesignation.toLowerCase().includes(q)) ||
      (fb.receiverDesignation &&
        fb.receiverDesignation.toLowerCase().includes(q)) ||
      (fb.senderRole && fb.senderRole.toLowerCase().includes(q)) ||
      (fb.receiverRole && fb.receiverRole.toLowerCase().includes(q)) ||
      (fb.title && fb.title.toLowerCase().includes(q)) ||
      (fb.status && fb.status.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "All" || fb.status === statusFilter;

    return matchesText && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredFeedbacks.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentFeedbacks = filteredFeedbacks.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => (
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
            <option value={50}>50</option>
          </select>
        </div>

        <span style={{ fontSize: "14px", marginLeft: "16px" }}>
          {filteredFeedbacks.length === 0
            ? "0–0 of 0"
            : `${indexOfFirstItem + 1}-${Math.min(
                indexOfLastItem,
                filteredFeedbacks.length,
              )} of ${filteredFeedbacks.length}`}
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
  );

  const openFeedbackModal = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleRowClick = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Authentication required. Please login again.");
        return;
      }

      await axios.delete(`http://localhost:8000/feedback/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFeedbacks(feedbacks.filter((f) => f.id !== id));
      alert("Feedback deleted successfully");

      fetchAllFeedbacks();
    } catch (err) {
      console.error("Error deleting feedback:", err);
    }
  };
  ///popup fixed
  useEffect(() => {
    if (selectedFeedback) {
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
  }, [selectedFeedback]);
  ///tab popup focus

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px" }}>Feedback</h2>
      </div>

      {/* Search and Filter */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "5px",
                  minWidth: "50px",
                }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Viewed">Viewed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="searchInput"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "5px",
                }}
              >
                Search
              </label>
              <input
                id="searchInput"
                type="text"
                className="form-control"
                placeholder="Search by sender, receiver, title, etc..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 justify-content-end">
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
                onClick={handleReset}
                style={{ minWidth: 90 }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/*feedback TAble */}
      <h2 style={{ color: "#3A5FBE", fontSize: "20px" }}>
        All Feedback Records
      </h2>

      {filteredFeedbacks.length === 0 ? (
        <div className="text-center py-4">
          <p style={{ color: "#6c757d", fontSize: "16px" }}>
            No feedback records found.
          </p>
        </div>
      ) : (
        <>
          <div
            className="table-responsive mt-3"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <table
              className="table table-hover mb-0"
              style={{ borderCollapse: "collapse" }}
            >
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Feedback ID
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sender
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Receiver
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
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
                      padding: "10px",
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
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentFeedbacks.map((fb) => (
                  <tr
                    key={fb.id}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e9ecef";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => handleRowClick(fb)}
                  >
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.feedbackId}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.senderName}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.receiverName}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.date}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.status === "Viewed" ? (
                        <span
                          style={{
                            backgroundColor: "#d1f2dd",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "inline-block",
                            width: "100px",
                            textAlign: "center",
                          }}
                        >
                          Viewed
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: "#fff3cd",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "inline-block",
                            width: "100px",
                            textAlign: "center",
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.title}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => handleDelete(fb.id, e)}
                        style={{ minWidth: "70px", padding: "5px 10px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderPagination()}
        </>
      )}

      {/* View Details Modal */}
      {selectedFeedback && (
        <div
          ref={popupRef}
          className="modal fade show"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            overflow: "hidden",
          }}
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "600px", width: "95%", marginTop: "80px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Feedback Details - {selectedFeedback.feedbackId}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedFeedback(null)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  {/* Sender info */}
                  <div className="row mb-3">
                    <div className="col-12 mb-2">
                      <h6
                        className="fw-bold"
                        style={{ color: "#3A5FBE", fontSize: "16px" }}
                      >
                        Sender Information
                      </h6>
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
                        {selectedFeedback.senderName}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Role
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.senderRole}
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
                        {selectedFeedback.senderDesignation}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Email
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.senderEmail}
                      </div>
                    </div>
                  </div>
                  {/* Receiver infi */}
                  <div className="row mb-3">
                    <div className="col-12 mb-2">
                      <h6
                        className="fw-bold"
                        style={{ color: "#3A5FBE", fontSize: "16px" }}
                      >
                        Receiver Information
                      </h6>
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
                        {selectedFeedback.receiverName}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Role
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.receiverRole}
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
                        {selectedFeedback.receiverDesignation}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Email
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.receiverEmail}
                      </div>
                    </div>
                  </div>

                  {/* feedback info */}
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Feedback ID
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedFeedback.feedbackId}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Created Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedFeedback.fullDate}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div className="col-7 col-sm-9">
                      <span
                        className={`badge ${selectedFeedback.status === "Viewed" ? "bg-success" : "bg-warning text-dark"}`}
                      >
                        {selectedFeedback.status}
                      </span>
                    </div>
                  </div>

                  {selectedFeedback.readAt && (
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Viewed At
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.readAt}
                      </div>
                    </div>
                  )}
                  <div className="row mb-3">
                    <div className="col-12 mb-2">
                      <h6
                        className="fw-bold"
                        style={{ color: "#3A5FBE", fontSize: "16px" }}
                      >
                        Feedback Content
                      </h6>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Title
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedFeedback.title}
                      </div>
                    </div>
                    <div className="row">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Message
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529", whiteSpace: "pre-wrap" }}
                      >
                        {selectedFeedback.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setSelectedFeedback(null)}
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
};

export default AdminFeedback;
