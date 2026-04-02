import React, { useEffect, useState ,useRef} from "react";
import { useLocation } from "react-router-dom";

const EmployeeInterviews = () => {
  const [employeeId, setEmployeeId] = useState(null);

  const location = useLocation();
  const [allInterviews, setAllInterviews] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [selected, setSelected] = useState(null);

  // ===== FILTER STATES =====
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // ===== PAGINATION STATES =====
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    status: "",
    comment: "",
  });

  const modalRef = useRef(null);
  const isAnyModalOpen = !!selected;

  // 🔹 Focus Trap Effect
  useEffect(() => {
    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // Set focus to modal when opened
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setSelected(null);
        setIsEditing(false);
        setEditData({ status: "", comment: "" });
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
  }, [isAnyModalOpen]);

  useEffect(() => {
    const isModalOpen = !!selected;
  
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
  }, [selected]);




  // to get table after click on notification
  useEffect(() => {
    // const query = new URLSearchParams(location.search);
    // const id = query.get("interviewerId"); // 🔔 notification se aayega
    if (employeeId) {
      handleView(); // 🔥 auto open table
    }
  }, [employeeId]);

  // 🔥 GET EMPLOYEE ID
  useEffect(() => {
    const raw = localStorage.getItem("activeUser");

    if (!raw) {
      console.error("activeUser missing");
      return;
    }

    const user = JSON.parse(raw);

    // ✅ CORRECT
    if (user._id) {
      setEmployeeId(user._id);
    } else {
      console.error("user _id not found");
    }
  }, []);

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

const formatTo12Hour = (time24) => {
  if (!time24) return "";

  const [hours, minutes] = time24.split(":");
  
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).toUpperCase();
};
  // 🔥 FETCH EMPLOYEE INTERVIEWS
  const handleView = async () => {
    console.log("View clicked, employeeId:", employeeId);
    if (!employeeId) {
      console.error("employeeId not ready yet");
      return;
    }
    const token = localStorage.getItem("accessToken");
    console.log("token", token);
    try {
      const res = await fetch(
        `https://ems-cws-test.vercel.app/interviews/employee/${employeeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      console.log("Interview data:", data);

      setAllInterviews(data);
      setInterviews(data);
      setShowTable(true);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
    }
  };
 console.log("interviews",interviews)
  {
    /*--------status & comment update-----*/
  }
  const handleUpdate = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `https://ems-cws-test.vercel.app/interviews/employee/${selected._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            manualStatus: editData.status,
            comment: editData.comment
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Update failed");
        return;
      }
      // ✅ Update frontend state for table & popup
      setAllInterviews((prev) =>
        prev.map((item) => (item._id === data.data._id ? data.data : item)),
      );
      setInterviews((prev) =>
        prev.map((item) => (item._id === data.data._id ? data.data : item)),
      );
      setIsEditing(false);

      // ✅ Show confirmation alert first
      window.alert("Interview updated successfully");

      // ✅ Close modal after OK
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating interview");
    }
  };

  {
    /*--------status colour-----*/
  }
  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-success text-white";
      case "Cancelled":
        return "bg-danger text-white";
      case "Scheduled":
        return "bg-primary text-white";
      case "On-going":
        return "bg-warning text-dark";
      case "Not-completed":
        return "bg-secondary text-white";
      default:
        return "bg-secondary";
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = () => {
    let filtered = [...allInterviews];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase().trim() ===
            statusFilter.toLowerCase().trim(),
      );
    }

    if (dateFromFilter) {
      filtered = filtered.filter(
        (item) => new Date(item.date) >= new Date(dateFromFilter),
      );
    }

    if (dateToFilter) {
      filtered = filtered.filter(
        (item) => new Date(item.date) <= new Date(dateToFilter),
      );
    }

    setInterviews(filtered);
    setCurrentPage(1);
  };

  // ===== RESET =====
  const resetFilters = () => {
    setStatusFilter("All");
    setDateFromFilter("");
    setDateToFilter("");
    setInterviews(allInterviews);
    setCurrentPage(1);
  };

  // ===== PAGINATION LOGIC =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInterviews = interviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(interviews.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container-fluid px-3 mt-3">
      {/* mahesh code header change font size */}
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        My Scheduled Interveiw
      </h2>

      {/* ================= FILTER CARD ================= */}
      {showTable && (
        <div className="card mb-4 mt-3 shadow-sm border-0">
          <div className="card-body">
            <form
              className="row g-2 align-items-center"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              {/* STATUS */}
              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                <label
                  htmlFor="statusFilter"
                  className="fw-bold mb-0 text-start text-md-end"
                  style={{ fontSize: "16px", color: "#3A5FBE" }}
                >
                  Status
                </label>
                <select
                  id="statusFilter"
                  className="form-select"
                  style={{ minWidth: 100 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="On-going">On-going</option>
                  <option value="Completed">Completed</option>
                  <option value="Not-completed">Not-completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* FROM */}
              <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
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
                  id="dateFromFilter"
                  type="date"
                  className="form-control"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  style={{ minWidth: "140px" }}
                />
              </div>

              {/* TO */}
              <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                <label
                  htmlFor="dateToFilter"
                  className="fw-bold mb-0 text-start text-md-end"
                  style={{
                    fontSize: "16px",
                    color: "#3A5FBE",
                    minWidth: "50px",
                    marginRight: "8px",
                  }}
                >
                  To
                </label>
                <input
                  id="dateToFilter"
                  type="date"
                  className="form-control"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  style={{ minWidth: "140px" }}
                />
              </div>

              {/* BUTTONS */}
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
      )}

      {/* ================= TABLE ================= */}
      {showTable && (
        <>
          <div
            className="table-responsive mt-3"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <table className="table table-hover align-middle mb-0 bg-white">
              <thead style={{ backgroundColor: "#ffffff" }}>
                <tr>
                  {[
                    "Interview ID",
                    "Candidate",
                    "Role",
                    "Resume",
                    "Date",
                    "Time",
                    "Type",
                    "Interviewer",
                    "Link",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {currentInterviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-4"
                      style={{ color: "#6c757d" }}
                    >
                      No interviews scheduled.
                    </td>
                  </tr>
                ) : (
                  currentInterviews.map((item, i) => (
                    <tr
                      key={item._id || item.interviewId}
                      onClick={() => {
                        //added jayu
                        if (item.status!=="Cancelled"){
                        setSelected(item);
                        setIsEditing(false); // reset edit mode
                        }
                      }}
                       style={{ 
                        cursor: item.status==="Cancelled" ? "not-allowed" : "pointer",
                        opacity: item.status==="Cancelled" ? 0.6 : 1,
                        backgroundColor: item.status==="Cancelled" ? "#f5f5f5" : "",
                        pointerEvents: item.status==="Cancelled"? "none" : "auto"
                      }}
                    >
                      <td style={tdStyle("#3A5FBE", 500)}>
                        {item.interviewId}
                      </td>
                      <td style={tdStyle()}>{item.candidateName}</td>
                      <td style={tdStyle()}>{item.role}</td>
                      <td>
                        {item.resumeUrl ? (
                          <a
                            href={`${item.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Resume
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={tdStyle()}>{formatDate(item.date)}</td>
                      <td style={tdStyle()}>{formatTo12Hour(item.startTime)}</td>
                      <td style={tdStyle()}>{item.interviewType}</td>
                      <td style={tdStyle()}>{item.interviewerName}</td>
                      <td style={tdStyle()}>
                        {/* {item.status !== "Completed" &&
                        item.status !== "Cancelled" &&
                        item.status !== "Not-completed" &&
                        item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          > */}
                                         {item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (
          ["Completed", "Cancelled", "Not-completed"].includes(item.status)
        ) {
          e.preventDefault(); // ❌ stop navigation
          return;
        }
        e.stopPropagation();
      }}
      style={{
        pointerEvents: ["Completed", "Cancelled", "Not-completed"].includes(item.status)
          ? "none"
          : "auto",
        color: ["Completed", "Cancelled", "Not-completed"].includes(item.status)
          ? "#999"
          : "#0d6efd",
        textDecoration: "underline",
        cursor: ["Completed", "Cancelled", "Not-completed"].includes(item.status)
          ? "not-allowed"
          : "pointer",
      }}>
                            Join
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={tdStyle()}>
                        <span
                          style={{
                            backgroundColor:
                              item.status === "Completed"
                                ? "#d1f2dd"
                                : item.status === "Cancelled"
                                  ? "#f8d7da"
                                  : item.status === "Scheduled"
                                    ? "#dbeafe"
                                    : item.status === "On-going"
                                      ? "#FFE493"
                                      : item.status === "Not-completed"
                                        ? "#e2e3e5"
                                        : "#e2e3e5",
                            padding: "8px 16px",

                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            display: "inline-block",
                            width: "100px",
                            textAlign: "center",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                    <td style={tdStyle()}>
                    {/* {item.status !== "On-going" ? ( */}
                      <button
                        className="btn custom-outline-btn btn-sm"
                        style={{ width: 90 }}
                        disabled={item.status === "Cancelled" || item.status === "Completed"}
                        onClick={(e) => {
                          e.stopPropagation();

                          setSelected(item);
                          setIsEditing(true);

                          // ✅ Always initialize editData fresh
                          setEditData({
                            status: item.status || "",
                            comment: item.comment || "",
                          });
                        }}
                      >
                        Update
                      </button>

                    {/* ) : (
                      "-"
                    )} */}
                  </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===== PAGINATION UI ===== */}
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
                {interviews.length === 0
                  ? "0–0 of 0"
                  : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, interviews.length)} of ${interviews.length}`}
              </span>

              <div
                className="d-flex align-items-center"
                style={{ marginLeft: "16px" }}
              >
                <button
                  className="btn btn-sm border-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ fontSize: "18px", padding: "2px 8px" }}
                >
                  ‹
                </button>
                <button
                  className="btn btn-sm border-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ fontSize: "18px", padding: "2px 8px" }}
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
        </>
      )}

      {/* ================= MODAL ================= */}
      {selected && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Interview Details</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    //added jayu
                    setSelected(null);
                    setIsEditing(false); // reset here also
                  }}
                />
              </div>

              <div className="modal-body">
                {Object.entries({
                  "Interview ID": selected.interviewId,
                  Candidate: selected.candidateName,
                  Role: selected.role,
                  Date: formatDate(selected.date),
                  Time: selected.startTime,
                  Duration: selected.duration,
                  Type: selected.interviewType,
                  Interviewer: selected.interviewerName,
                }).map(([k, v]) => (
                  <div className="row mb-2" key={k}>
                    <div className="col-4 fw-semibold">{k}</div>
                    <div className="col-8">{v}</div>
                  </div>
                ))}

                {/* Interview Join Link */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Interview Link</div>
                  <div className="col-8">
                    {/* {selected.status !== "Completed" &&
                    selected.status !== "Cancelled" &&
                    selected.status !== "Not-completed" &&
                    selected.link ? (
                      <a
                        href={selected.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      > */}
                                     {selected.link ? (
    <a
      href={selected.link}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (
          ["Completed", "Cancelled", "Not-completed"].includes(selected.status)
        ) {
          e.preventDefault(); // ❌ stop navigation
          return;
        }
        e.stopPropagation();
      }}
      style={{
        pointerEvents: ["Completed", "Cancelled", "Not-completed"].includes(selected.status)
          ? "none"
          : "auto",
        color: ["Completed", "Cancelled", "Not-completed"].includes(selected.status)
          ? "#999"
          : "#0d6efd",
        textDecoration: "underline",
        cursor: ["Completed", "Cancelled", "Not-completed"].includes(selected.status)
          ? "not-allowed"
          : "pointer",
      }}>
                        Join
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                {/* ✅ RESUME SECTION (SEPARATE) */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Resume</div>
                  <div className="col-8">
                    {selected?.resumeUrl ? (
                      <a
                        href={`${selected.resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn custom-outline-btn btn-sm"
                  style={{ width: 100 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Resume
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                {/* Status  */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Status</div>
                  <div className="col-8">
                    {isEditing ? (
                      // ✏️ EDIT MODE
                      <select
                        className={`form-select ${getStatusClass(editData.status)}`}
                        value={selected.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                        style={{ fontWeight: 500 }}
                      >
                        <option value="">Select Status</option>
                        <option value="Not-completed">Not-completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      // VIEW MODE
                      <span
                        className={`badge ${getStatusClass(selected.status)}`}
                        style={{
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {selected.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment / Remark */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Comment</div>
                  <div className="col-8">
                    {isEditing ? (
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editData.comment}
                        onChange={(e) =>
                          setEditData({ ...editData, comment: e.target.value })
                        }
                      />
                    ) : (
                      <div className="p-2 border rounded bg-light">
                        {selected.comment || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                {isEditing ? (
                  // ✏️ EDIT MODE → Update button
                  <>
                  <button
                    className="btn custom-outline-btn btn-sm"
                    style={{ width: 90 }}
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                  <button
                    className="btn custom-outline-btn btn-sm"
                    style={{ width: 90 }}
                    onClick={() => {
                      setSelected(null);
                      setIsEditing(false);
                      setEditData({ 
                        status: "", 
                        comment: "" 
                      });
                   }}
                  >
                    Close
                  </button>
                  </>
                ) : (
                  <button
                  className="btn custom-outline-btn btn-sm"
                  style={{ width: 90 }}
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                )}
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
};

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

export default EmployeeInterviews;
