import { useEffect, useState, useRef } from "react";

function TeamLeaderPerformances() {
  const [teamLeaderId, setTeamLeaderId] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [allPerformances, setAllPerformances] = useState([]);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== FILTER STATES ===== */
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  /* ===== PAGINATION STATES ===== */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const modalRef = useRef(null);

  // Modal focus trap
  useEffect(() => {
    const isAnyModalOpen = selectedPerformance;
  
    if (isAnyModalOpen) {
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
  }, [selectedPerformance]);
  
  useEffect(() => {
    if (!selectedPerformance || !modalRef.current) return;
  
    const modal = modalRef.current;
  
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    const getFocusableElements = () =>
      modal.querySelectorAll(focusableSelectors);
  
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedPerformance(null);
        setIsEditMode(false);
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
  }, [selectedPerformance]);

  useEffect(() => {
    const raw = localStorage.getItem("activeUser");

    if (!raw) {
      console.error("activeUser missing");
      return;
    }

    const user = JSON.parse(raw);

    if (user._id && user.role === "Team_Leader") {
      setTeamLeaderId(user._id);
    } else {
      console.error("User is not a Team Leader");
    }
  }, []);

  useEffect(() => {
    if (!teamLeaderId) return;
    fetchPerformances();
  }, [teamLeaderId]);

  const fetchPerformances = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://ems-cws-backend-9wgt.vercel.app/performance/team-leader/${teamLeaderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      console.log("Team Leader API response:", data);
      
      if (data.success) {
        setPerformances(data.data);
        setAllPerformances(data.data);
      } else {
        setPerformances([]);
        setAllPerformances([]);
      }
    } catch (error) {
      console.error("Error fetching performances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePerformance = async () => {
    if (!selectedPerformance.status || !selectedPerformance.recommendation) {
      alert("Status and Recommendation are required");
      return;
    }

    setIsUpdating(true);

    try {
      const payload = {
        rating: selectedPerformance.rating || null,
        status: selectedPerformance.status,
        recommendation: selectedPerformance.recommendation,
      };

      const response = await fetch(
        `https://ems-cws-backend-9wgt.vercel.app/performance/team-leader/${selectedPerformance._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      
      const data = await response.json();

      if (data.success) {
        alert("Performance updated successfully! Request sent to HR for final approval.");
        
        setPerformances((prev) =>
          prev.map((p) =>
            p._id === selectedPerformance._id ? { ...p, ...payload } : p
          )
        );
        setAllPerformances((prev) =>
          prev.map((p) =>
            p._id === selectedPerformance._id ? { ...p, ...payload } : p
          )
        );
        
        setSelectedPerformance(null);
        setIsEditMode(false);
      } else {
        alert(data.message || "Failed to update performance");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Something went wrong while updating");
    } finally {
      setIsUpdating(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allPerformances];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (p) =>
          p.status?.toLowerCase().trim() === statusFilter.toLowerCase().trim()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        Object.values(p)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setPerformances(filtered);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("All");
    setSearchTerm("");
    setPerformances(allPerformances);
    setCurrentPage(1);
  };

  // Pagination logic
  const safePerformances = performances || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = safePerformances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safePerformances.length / itemsPerPage);

  // Status color classes
  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning text-dark";
      case "Added":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getRecommendationClass = (recommendation) => {
    switch (recommendation) {
      case "Pending":
        return "bg-warning text-dark";
      case "Promotion":
      case "Increment":
      case "Training":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getAdminStatusClass = (adminStatus) => {
    switch (adminStatus) {
      case "pending":
        return "bg-warning text-dark";
      case "approved":
        return "bg-success text-white";
      case "rejected":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading team performances...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-1">
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        Team Performance Management
      </h2>

      {/* Filter Bar */}
      <div className="card mb-4 mt-3 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Status
              </label>
              <select
                className="form-select"
                style={{ minWidth: 120 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Added">Added</option>
              </select>
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", marginRight: "8px" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: "600px" }}
                placeholder="Search by any field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
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
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div
        className="table-responsive mt-3"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.1)", borderRadius: "8px" }}
      >
        <table className="table table-hover align-middle mb-0 bg-white">
          <thead>
            <tr>
              {[
                "Request ID",
                "Employee",
                "Department",
                "Duration",
                "Rating",
                "Remark",
                "Status",
                "Recommendation",
                "Final Approval",
                "Action",
              ].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  No performance records found for your team
                </td>
              </tr>
            ) : (
              currentRows.map((row) => (
                <tr
                  key={row._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedPerformance(row)}
                >
                  <td style={tdStyle()}>{row.requestId}</td>
                  <td style={tdStyle()}>{row.employeeName}</td>
                  <td style={tdStyle()}>{row.department}</td>
                  <td style={tdStyle()}>
                    {row.durationType} –{" "}
                    {row.durationType === "Monthly"
                      ? new Date(row.durationDate).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })
                      : new Date(row.durationDate).toLocaleDateString()}
                  </td>
                  <td style={tdStyle()}>{row.rating ?? "-"}</td>
                  <td
                    style={{
                      ...tdStyle(),
                      maxWidth: "150px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={row.description}
                  >
                    {row.description}
                  </td>
                  <td style={tdStyle()}>
                    <span
                      style={{
                        backgroundColor: row.status === "Pending" ? "#FFE493" : "#d1f2dd",
                        padding: "6px 14px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "inline-block",
                        minWidth: "90px",
                        textAlign: "center",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span
                      style={{
                        backgroundColor:
                          row.recommendation === "Pending" ? "#FFE493" : "#d1f2dd",
                        padding: "6px 14px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "inline-block",
                        minWidth: "110px",
                        textAlign: "center",
                      }}
                    >
                      {row.recommendation}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span
                      style={{
                        backgroundColor:
                          row.adminStatus === "pending"
                            ? "#FFE493"
                            : row.adminStatus === "approved"
                            ? "#d1f2dd"
                            : "#f8d7da",
                        padding: "6px 14px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "inline-block",
                        minWidth: "110px",
                        textAlign: "center",
                      }}
                    >
                      {row.adminStatus
                        ? row.adminStatus.charAt(0).toUpperCase() + row.adminStatus.slice(1)
                        : "-"}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <button
                      type="button"
                      className="btn custom-outline-btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerformance(row);
                        setIsEditMode(true);
                      }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: 14, marginRight: 8 }}>Rows per page:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", fontSize: 14 }}
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

          <span style={{ fontSize: 14 }}>
            {performances.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(
                  indexOfLastItem,
                  performances.length
                )} of ${performances.length}`}
          </span>

          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm focus-ring"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      <div className="text-end mt-3">
        <button
          style={{ minWidth: 90 }}
          className="btn btn-sm custom-outline-btn"
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>

      {/* Modal for Update */}
      {selectedPerformance && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          ref={modalRef}
          tabIndex="-1"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            style={{
              maxWidth: "650px",
              width: "95%",
            }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  {isEditMode ? "Update Performance" : "Performance Details"}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setSelectedPerformance(null);
                    setIsEditMode(false);
                  }}
                />
              </div>

              <div className="modal-body" style={{ maxHeight: "60vh" }}>
                {[
                  ["Request ID", selectedPerformance.requestId],
                  ["Employee Name", selectedPerformance.employeeName],
                  ["Employee ID", selectedPerformance.employeeId],
                  ["Department", selectedPerformance.department],
                  [
                    "Duration",
                    `${selectedPerformance.durationType} - ${
                      selectedPerformance.durationType === "Monthly"
                        ? new Date(selectedPerformance.durationDate).toLocaleString(
                            "default",
                            { month: "long", year: "numeric" }
                          )
                        : new Date(selectedPerformance.durationDate).toLocaleDateString()
                    }`,
                  ],
                ].map(([label, value]) => (
                  <div className="row mb-2" key={label}>
                    <div className="col-4 fw-semibold">{label}</div>
                    <div className="col-8">{value}</div>
                  </div>
                ))}

                {/* Rating */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Rating</div>
                  <div className="col-8">
                    {isEditMode ? (
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-control"
                        value={selectedPerformance.rating || ""}
                        onChange={(e) =>
                          setSelectedPerformance({
                            ...selectedPerformance,
                            rating: Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      selectedPerformance.rating ?? "-"
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Status</div>
                  <div className="col-8">
                    {isEditMode ? (
                      <select
                        className="form-select"
                        value={selectedPerformance.status}
                        onChange={(e) =>
                          setSelectedPerformance({
                            ...selectedPerformance,
                            status: e.target.value,
                          })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Added">Added</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${getStatusClass(selectedPerformance.status)}`}
                        style={{
                          minWidth: "110px",
                          textAlign: "center",
                          padding: "6px 14px",
                        }}
                      >
                        {selectedPerformance.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Recommendation</div>
                  <div className="col-8">
                    {isEditMode ? (
                      <select
                        className="form-select"
                        value={selectedPerformance.recommendation}
                        onChange={(e) =>
                          setSelectedPerformance({
                            ...selectedPerformance,
                            recommendation: e.target.value,
                          })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Increment">Increment</option>
                        <option value="Training">Training</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${getRecommendationClass(
                          selectedPerformance.recommendation
                        )}`}
                        style={{
                          minWidth: "110px",
                          textAlign: "center",
                          padding: "6px 14px",
                        }}
                      >
                        {selectedPerformance.recommendation}
                      </span>
                    )}
                  </div>
                </div>

                {/* Final Approval Status */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Final Approval</div>
                  <div className="col-8">
                    <span
                      style={{
                        backgroundColor:
                          selectedPerformance.adminStatus === "pending"
                            ? "#FFE493"
                            : selectedPerformance.adminStatus === "approved"
                            ? "#d1f2dd"
                            : "#f8d7da",
                        padding: "6px 14px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: 500,
                        display: "inline-block",
                        minWidth: "110px",
                        textAlign: "center",
                      }}
                    >
                      {selectedPerformance.adminStatus
                        ? selectedPerformance.adminStatus.charAt(0).toUpperCase() +
                          selectedPerformance.adminStatus.slice(1)
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Approved/Rejected By Info */}
                {selectedPerformance.adminStatus === "approved" &&
                  selectedPerformance.approvedBy && (
                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Approved By</div>
                      <div className="col-8">
                        <span className="fw-semibold">
                          {selectedPerformance.approvedBy.name}
                        </span>
                        {selectedPerformance.approvedAt && (
                          <span className="text-muted ms-2">
                            on{" "}
                            {new Date(selectedPerformance.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {selectedPerformance.adminStatus === "rejected" &&
                  selectedPerformance.rejectedBy && (
                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Rejected By</div>
                      <div className="col-8">
                        <span className="fw-semibold">
                          {selectedPerformance.rejectedBy.name}
                        </span>
                        {selectedPerformance.rejectedAt && (
                          <span className="text-muted ms-2">
                            on{" "}
                            {new Date(selectedPerformance.rejectedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* Description */}
                <div className="row mt-3">
                  <div className="col-4 fw-semibold">Description</div>
                  <div className="col-8">
                    <div
                      className="p-2 border rounded bg-light"
                      style={{
                        whiteSpace: "pre-wrap",
                        maxHeight: "60px",
                        overflowY: "auto",
                        wordBreak: "break-word",
                      }}
                    >
                      {selectedPerformance.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{ width: 90 }}
                  onClick={() => {
                    setSelectedPerformance(null);
                    setIsEditMode(false);
                  }}
                >
                  Close
                </button>

                {isEditMode && (
                  <button
                    className="btn custom-outline-btn btn-sm"
                    style={{ width: 90 }}
                    onClick={handleUpdatePerformance}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-outline-btn {
          border: 1px solid #3A5FBE;
          color: #3A5FBE;
          background: transparent;
        }
        .custom-outline-btn:hover {
          background: #3A5FBE;
          color: #fff;
        }
        .focus-ring:focus {
          outline: none;
          box-shadow: 0 0 0 2px #3A5FBE;
        }
      `}</style>
    </div>
  );
}

const thStyle = {
  fontWeight: 500,
  fontSize: "14px",
  color: "#6c757d",
  borderBottom: "2px solid #dee2e6",
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle = (color = "#212529", weight = 400) => ({
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  whiteSpace: "nowrap",
  color,
  fontWeight: weight,
});

export default TeamLeaderPerformances;