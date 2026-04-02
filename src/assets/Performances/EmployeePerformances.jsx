import { useEffect, useState, useRef } from "react";
import axios from "axios";

function EmployeePerformances() {
  const [employeeId, setEmployeeId] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [allPerformances, setAllPerformances] = useState([]);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  /* ===== FILTER STATES ===== */
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* ===== PAGINATION STATES ===== */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const modalRef = useRef(null);

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

  //TANVI
  useEffect(() => {
    if (!selectedPerformance || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();
    // firstEl?.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedPerformance(null);
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
  }, [selectedPerformance]);

  // GET ACTIVE USER
  useEffect(() => {
    const raw = localStorage.getItem("activeUser");
    if (!raw) return console.error("activeUser missing");

    const user = JSON.parse(raw);
    console.log("ACTIVE USER:", user);

    setUserId(user._id); // ✅ ObjectId
    setRole(user.role); // ✅ EMPLOYEE
  }, []);

  //  FETCH EMPLOYEE PERFORMANCES
  useEffect(() => {
    if (!userId || !role) return;

    fetch(
      `http://localhost:8000/performance/employee?userId=${userId}&role=${role}`,
    )
      .then((res) => res.json())
      .then((res) => {
        setPerformances(res.data || []);
        setAllPerformances(res.data || []);
      })
      .catch((err) => console.error("Employee performance fetch error:", err));
  }, [userId, role]);

  /* -------- STATUS COLOUR -------- */
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

  /* -------- RECOMMENDATION COLOUR -------- */
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

  /* ===== APPLY FILTERS  ===== */
  const applyFilters = () => {
    let filtered = [...allPerformances];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (p) =>
          p.status?.toLowerCase().trim() === statusFilter.toLowerCase().trim(),
      );
    }

    if (dateFromFilter) {
      filtered = filtered.filter(
        (p) => new Date(p.durationDate) >= new Date(dateFromFilter),
      );
    }

    if (dateToFilter) {
      filtered = filtered.filter(
        (p) => new Date(p.durationDate) <= new Date(dateToFilter),
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        Object.values(p)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      );
    }

    setPerformances(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("All");
    setDateFromFilter("");
    setDateToFilter("");
    setSearchTerm("");
    setPerformances(allPerformances);
    setCurrentPage(1);
  };

  /* ===== PAGINATION ===== */
  const safePerformances = Array.isArray(performances) ? performances : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = safePerformances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safePerformances.length / itemsPerPage);

  return (
    <div className="container-fluid p-2">
      {/* mahesh code header change font size */}
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        Performance
      </h2>

      {/* ===== FILTER BAR ===== */}
      <div className="card mb-4 mt-3 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1  ms-2">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "55px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "4px",
                }}
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

            {/* <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                type="date"
                className="form-control"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateToFilter"
                className="fw-bold mb-0 text-start text-md-end "
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                  textAlign: "right",
                }}
              >
                To
              </label>
              <input
                type="date"
                className="form-control"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div> */}
            <div className="col-12 col-md-auto d-flex align-items-center  mb-1  ms-2">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  minWidth: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "8px",
                  textAlign: "right",
                }}
              >
                Search
              </label>

              <input
                type="text"
                className="form-control"
                style={{ maxWidth: "600px" }} //mahesh coded search bar size increase
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

      {/* ===== TABLE ===== */}
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
                "Manager",
                "Department",
                "Duration",
                "Rating",
                "Remark",
                "Status",
                "Recommendation",
                "Final Approval",
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
                  No records found
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
                  <td style={tdStyle()}>{row.manager}</td>
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
                <td style={{
                    ...tdStyle(),
                     verticalAlign: "middle",
                      borderBottom: "1px solid #dee2e6",
                      maxWidth: "100px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                  }}>{row.description}</td>

                  {/* Status */}
                  <td style={tdStyle()}>
                    <span
                      style={{
                        backgroundColor:
                          row.status === "Pending" ? "#FFE493" : "#d1f2dd",
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

                  {/* Recommendation */}
                  <td style={tdStyle()}>
                    <span
                      style={{
                        backgroundColor:
                          row.recommendation === "Pending"
                            ? "#FFE493"
                            : "#d1f2dd",
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
                              : row.adminStatus === "rejected"
                                ? "#f8d7da"
                                : "#e9ecef",
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
                        ? row.adminStatus.charAt(0).toUpperCase() +
                          row.adminStatus.slice(1)
                        : "-"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
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
            {safePerformances.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, safePerformances.length)} of ${safePerformances.length}`}
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

      {/* ===== MODAL ===== */}
      {selectedPerformance && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          ref={modalRef}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg"
          style={{
            maxWidth: "650px",
            width: "95%",
          }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Performance Request Details
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPerformance(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                {[
                  ["Request ID", selectedPerformance.requestId],
                  ["Employee Name", selectedPerformance.employeeName],
                  ["Employee ID", selectedPerformance.employeeId],
                  ["Manager", selectedPerformance.manager],
                  ["Department", selectedPerformance.department],
                  [
                    "Duration",
                    `${selectedPerformance.durationType} - ${
                      selectedPerformance.durationType === "Monthly"
                        ? new Date(
                            selectedPerformance.durationDate,
                          ).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })
                        : new Date(
                            selectedPerformance.durationDate,
                          ).toLocaleDateString()
                    }`,
                  ],
                  ["Rating", selectedPerformance.rating ?? "-"],
                  ["Status", selectedPerformance.status],
                  ["Recommendation", selectedPerformance.recommendation],
                  [
                    "Final Approval",
                    selectedPerformance.adminStatus
                      ? selectedPerformance.adminStatus
                          .charAt(0)
                          .toUpperCase() +
                        selectedPerformance.adminStatus.slice(1)
                      : "Pending",
                  ],
                ].map(([label, value]) => {
                  const isStatus = label === "Status";
                  const isRecommendation = label === "Recommendation";
                  const isFinalApproval = label === "Final Approval";
                  return (
                    <div className="row mb-2" key={label}>
                      <div className="col-4 fw-semibold">{label}</div>
                      <div className="col-8">
                        {isStatus ? (
                          <span
                            className={`badge ${getStatusClass(value)}`}
                            style={{
                              minWidth: "110px",
                              textAlign: "center",
                              padding: "6px 14px",
                            }}
                          >
                            {value}
                          </span>
                        ) : isRecommendation ? (
                          <span
                            className={`badge ${getRecommendationClass(value)}`}
                            style={{
                              minWidth: "110px",
                              textAlign: "center",
                              padding: "6px 14px",
                            }}
                          >
                            {value}
                          </span>
                        ) : isFinalApproval ? (
                          <span
                            style={{
                              backgroundColor:
                                selectedPerformance.adminStatus === "pending"
                                  ? "#FFE493"
                                  : selectedPerformance.adminStatus ===
                                      "approved"
                                    ? "#d1f2dd"
                                    : selectedPerformance.adminStatus ===
                                        "rejected"
                                      ? "#f8d7da"
                                      : "#e9ecef",
                              padding: "6px 14px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: 500,
                              display: "inline-block",
                              minWidth: "110px",
                              textAlign: "center",
                            }}
                          >
                            {value}
                          </span>
                        ) : (
                          value // normal text for Rating or others
                        )}
                      </div>
                    </div>
                  );
                })}

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
                            {new Date(
                              selectedPerformance.approvedAt,
                            ).toLocaleDateString()}
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
                            {new Date(
                              selectedPerformance.rejectedAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* DESCRIPTION */}
                <div className="row mt-3">
                  <div className="col-4 fw-semibold">Description</div>
                  <div className="col-8">
                    <div
                      className="p-2 border rounded bg-light"
                      tabIndex={-1}
                     style={{ 
                      whiteSpace: "pre-wrap",
                      maxHeight: "60px",        
                      overflowY: "auto",
                      wordBreak: "break-word"
                    }}
                    >
                      {selectedPerformance.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer border-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{ width: 90 }}
                  onClick={() => setSelectedPerformance(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMMON BUTTON STYLE ===== */}
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

export default EmployeePerformances;
