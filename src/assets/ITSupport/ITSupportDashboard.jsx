// without notification code
import React, { useEffect, useState } from "react";
import API from "../ITSupport/service/api";
import "../ITSupport/custom.css";

function ITSupportDashboard() {
  /* ================= STATES ================= */

  const [allTickets, setAllTickets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editData, setEditData] = useState(null);
  const [comment, setComment] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [status, setStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedTickets = tickets.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tickets.length / rowsPerPage);

  /* ================= STYLES ================= */
  //   const styles = `
  // .ticket-card {
  //   display: flex;
  //   align-items: center;
  //   gap: 16px;
  //   padding: 18px 20px;
  //   border-radius: 10px;
  //   background: #ffffff;
  //   box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  //   height: 100%;
  // }

  // .ticket-count {
  //   width: 56px;
  //   height: 56px;
  //   display: flex;
  //   align-items: center;
  //   justify-content: center;
  //   font-size: 22px;
  //   font-weight: 700;
  //   border-radius: 8px;
  // }

  // .ticket-info {
  //   font-size: 15px;
  //   font-weight: 500;
  //   color: #212529;
  //   line-height: 1.2;
  // }

  // /* COLORS */
  // .open .ticket-count {
  //   background-color: #dbeafe;
  //   color: #1e40af;
  // }

  // .progress .ticket-count {
  //   background-color: #fef3c7;
  //   color: #92400e;
  // }

  // .closed .ticket-count {
  //   background-color: #fee2e2;
  //   color: #991b1b;
  // }

  // .total .ticket-count {
  //   background-color: #dcfce7;
  //   color: #166534;
  // }

  // `;
  {
    /* //snehal code 03-02-2026 */
  }
  // Limit words (for description)
  const limitWords = (text, wordLimit = 2) => {
    if (!text) return "-";
    const words = text.trim().split(/\s+/);
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;
  };

  // Limit attachments count (only 2 show)
  const limitAttachments = (attachments = []) => {
    if (!attachments.length) return ["-"];

    const fileNames = attachments.map((f) => f.split("/").pop());

    if (fileNames.length === 1) return fileNames;

    return [fileNames[0], "..."];
  };

  {
    /* //snehal code 03-02-2026 */
  }

  /* ================= FETCH ================= */
  const fetchTickets = async () => {
    try {
      const res = await API.get("/tickets");
      setAllTickets(res.data);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* ================= FILTER (FRONTEND) ================= */
  const applyFilter = () => {
    let filtered = [...allTickets];

    if (status !== "All") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (fromDate) {
      filtered = filtered.filter(
        (t) => new Date(t.raisedDate) >= new Date(fromDate),
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (t) => new Date(t.raisedDate) <= new Date(toDate),
      );
    }

    setTickets(filtered);
    setCurrentPage(1); // ✅ reset page
  };

  const resetFilter = () => {
    setStatus("All");
    setFromDate("");
    setToDate("");
    setTickets(allTickets);
    setCurrentPage(1); // ✅ reset page
  };

  /* ================= COUNTS ================= */
  const openCount = allTickets.filter((t) => t.status === "Open").length;
  const progressCount = allTickets.filter(
    (t) => t.status === "In Progress",
  ).length;
  const closedCount = allTickets.filter((t) => t.status === "Closed").length;
  ///////////working save changes

  // const saveChanges = async () => {
  //   try {
  //     const formData = new FormData();
  //     formData.append("status", editData.status);
  //     formData.append("assignedTo", editData.assignedTo || "");

  //     if (editData.newAttachment) {
  //       formData.append("attachment", editData.newAttachment);
  //     }

  //     // ✅ always update ticket
  //     await API.put(`/tickets/${editData._id}`, formData);

  //     // ⚠️ comment failure should not block ticket save
  //     if (comment.trim()) {
  //       try {
  //         await API.post(`/tickets/${editData._id}/comment`, {
  //           message: comment,
  //           role: "IT_Support",
  //         });
  //       } catch (e) {
  //         console.warn("Comment failed but ticket saved");
  //       }
  //     }

  //     alert("✅ Ticket saved successfully");
  //     setComment("");
  //     closeModal();
  //     fetchTickets();

  //   } catch (err) {
  //     console.error("Save error:", err);
  //     alert("❌ Failed to save changes");
  //   }
  // };

  const saveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append("status", editData.status);
      formData.append("assignedTo", editData.assignedTo || "");

      if (editData.newAttachment) {
        formData.append("attachment", editData.newAttachment);
      }

      // 1️⃣ Update ticket
      await API.put(`/tickets/${editData._id}`, formData);

      // 2️⃣ Add IT comment (🔥 role MUST be in headers)
      if (comment.trim()) {
        await API.post(`/tickets/${editData._id}/comment`, {
          message: comment,
          role: "IT_Support",
        });
      }

      // 3️⃣ Fetch updated ticket
      const res = await API.get(`/tickets/${editData._id}`);

      setEditData(res.data);
      setSelectedTicket(res.data);
      setComment("");

      alert("✅ Ticket saved successfully");
      fetchTickets();
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Failed to save changes");
    }
  };

  // Delete ticket
  const deleteTicket = async (id) => {
    // rutuja code strat
    if (!window.confirm("Delete this ticket?")) return;
    // end
    try {
      await API.delete(`/tickets/${id}`);
      closeModal();
      fetchTickets();
      // rutuja code start
      alert("Ticket Delete Succesfully");
      // end
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setEditData(null);
    setViewOnly(false);
  };

  // Badge helpers
  const statusBadge = (s) => {
    let bgColor = "";
    if (s === "Open") bgColor = "#D1E7FF";
    else if (s === "In Progress") bgColor = "#FFF1CC";
    else if (s === "Resolved") bgColor = "#D7F5E4";
    else if (s === "Closed") bgColor = "#E2E3E5";
    else bgColor = "#F8D7DA";

    return {
      backgroundColor: bgColor,
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "13px",
      fontWeight: "500",
      display: "inline-block",
      width: "120px",
      textAlign: "center",
      color: "#3A5FBE",
    };
  };

  {
    /* //snehal code 03-02-2026 */
  }

  // const priorityBadge = (p) =>
  //   `badge bg-${p === "High" ? "danger" : p === "Medium" ? "warning" : "success"}`;

  const formatDateOnly = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  //snehal code format date

  return (
    <div className="container-fluid">
      <h3 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        IT Support Dashboard
      </h3>

      <div className="row g-2 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#dbeafe",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                  //fontWeight: "bold",
                }}
              >
                {allTickets.length}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Total Tickets
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#fef3c7",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#92400e",
                  // fontWeight: "bold",
                }}
              >
                {progressCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                In Progress
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#fee2e2",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#991b1b",
                  //fontWeight: "bold",
                }}
              >
                {closedCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Closed Tickets
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#dcfce7",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#166534",
                  //fontWeight: "bold",
                }}
              >
                {openCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Open Tickets
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div
            className="row g-2 align-items-center"
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                style={{ minWidth: 120 }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>All</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Closed</option>
              </select>
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="fromDate"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "50px" }}
              >
                From
              </label>
              <input
                id="fromDate"
                type="date"
                className="form-control"
                style={{ minWidth: 140 }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="toDate"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "8px",
                }}
              >
                To
              </label>
              <input
                id="toDate"
                type="date"
                className="form-control"
                style={{ minWidth: 140 }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90, marginRight: 10 }}
                onClick={applyFilter}
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={resetFilter}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Ticket ID
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Employee Name
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Priority
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
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
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Attachment
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Assigned
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Raised Date
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Closed Date
                </th>
                <th
                  style={{
                    fontWeight: "500",
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
              {paginatedTickets.map((t) => (
                <tr
                  key={t._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedTicket(t);
                    setViewOnly(true);
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {t.ticketId}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {t.employeeName}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {t.category}
                  </td>
                  {/* //snehal code 03-02-2026 */}
                  <td
                    title={t.description} // full text on hover
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      color: "#212529",
                      maxWidth: "200px",
                    }}
                  >
                    {limitWords(t.description, 2)}
                  </td>
                  {/* //snehal code 03-02-2026 */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.priority}
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
                    <span style={statusBadge(t.status)}>{t.status}</span>
                  </td>
                  {/* //snehal code 03-02-2026 */}
                  <td
                    title={
                      Array.isArray(t.attachment)
                        ? t.attachment.map((f) => f.split("/").pop()).join(", ")
                        : "-"
                    }
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {Array.isArray(t.attachment) && t.attachment.length > 0 ? (
                      <>
                        {t.attachment[0].split("/").pop()}
                        {t.attachment.length > 1 && "..."}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  {/* //snehal code 03-02-2026 */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {t.assignedTo || "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {formatDateOnly(t.raisedDate)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}
                  >
                    {formatDateOnly(t.closedDate)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={() => {
                          setEditData({ ...t });
                          setSelectedTicket(t);
                          setViewOnly(false);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={() => deleteTicket(t._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span
              style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}
            >
              Rows per page:
            </span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", fontSize: "14px" }}
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {indexOfFirstRow + 1}–{Math.min(indexOfLastRow, tickets.length)} of{" "}
            {tickets.length}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
            className="btn btn-sm focus-ring"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

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

      {/* 👁 VIEW MODAL */}
      {selectedTicket && viewOnly && (
        <div
          className="modal fade show"
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
            className="modal-dialog modal-dialog-scrollable"
            style={{ maxWidth: "650px", width: "95%" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Ticket Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              <div className="modal-body">
                <p>
                  <b>Ticket ID:</b> {selectedTicket.ticketId}
                </p>
                <p>
                  <b>Employee:</b> {selectedTicket.employeeName}
                </p>
                <p>
                  <b>Category:</b> {selectedTicket.category}
                </p>
                <p>
                  <b>Description:</b> {selectedTicket.description}
                </p>
                <p>
                  <b>Priority:</b> {selectedTicket.priority}
                </p>
                <p>
                  <b>Status:</b>{" "}
                  <span style={statusBadge(selectedTicket.status)}>
                    {selectedTicket.status}
                  </span>
                </p>
                <p>
                  <b>Attachment:</b>{" "}
                  {Array.isArray(selectedTicket.attachment) &&
                  selectedTicket.attachment.length > 0
                    ? selectedTicket.attachment.map((file, i) => (
                        <div key={i}>
                          <a
                            href={`http://localhost:8000/uploads/${file}`}
                            download
                            className="btn btn-sm btn-outline-primary ms-2"
                          >
                            ⬇ {file.split("/").pop()}
                          </a>
                        </div>
                      ))
                    : "-"}
                </p>

                <p>
                  <b>Assigned:</b> {selectedTicket.assignedTo || "-"}
                </p>
                <p>
                  <b>Raised:</b> {formatDateTime(selectedTicket.raisedDate)}
                </p>
                <p>
                  <b>Closed:</b> {formatDateTime(selectedTicket.closedDate)}
                </p>

                <div className="row mb-2">
                  <div
                    className="col-5 col-sm-3 fw-semibold"
                    style={{ color: "#212529" }}
                  >
                    Comments
                  </div>

                  <div className="col-7 col-sm-9">
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                      {selectedTicket.comments &&
                      selectedTicket.comments.length > 0 ? (
                        [...selectedTicket.comments]
                          .reverse()
                          .map((comment, index) => (
                            <div
                              key={index}
                              className="mb-2 p-2 bg-light rounded"
                            >
                              {comment.timestamp && (
                                <small className="text-muted d-block">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </small>
                              )}
                              <div>
                                <b>{comment.role || "User"}:</b>{" "}
                                {comment.message}
                              </div>
                            </div>
                          ))
                      ) : (
                        <span className="text-muted">No comments yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER – RIGHT SIDE BUTTONS */}
                <div className="modal-footer">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => {
                      setEditData({ ...selectedTicket });
                      setViewOnly(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT MODAL */}
      {editData && !viewOnly && (
        <div
          className="modal fade show"
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
            className="modal-dialog modal-dialog-scrollable"
            style={{ maxWidth: "650px", width: "95%" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Edit Ticket</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditData(null)}
                />
              </div>

              {/* //snehal code 03-02-2026 */}
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={editData.status}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>

                {/* Assigned */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Assigned To</label>
                  <select
                    className="form-select"
                    value={editData.assignedTo || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, assignedTo: e.target.value })
                    }
                  >
                    <option value="">Assign To</option>
                    <option>IT Admin</option>
                    <option>Network Team</option>
                    <option>Hardware Team</option>
                  </select>
                </div>

                {/* Comment */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Add Comment</label>
                  <input
                    className="form-control"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add IT Comment"
                  />
                  <small className="text-muted">Max 100 words</small>
                </div>
                {/* //snehal code 03-02-2026 */}

                {/* Display Previous Comments*/}
                {editData.comments && editData.comments.length > 0 && (
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Previous Comments
                    </div>

                    <div className="col-7 col-sm-9">
                      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {[...(editData.comments || [])]
                          .reverse()
                          .map((comment, index) => (
                            <div
                              key={index}
                              className="mb-2 p-2 bg-light rounded"
                            >
                              {comment.timestamp && (
                                <small className="text-muted d-block">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </small>
                              )}
                              <div>
                                <b>{comment.role || "User"}:</b>{" "}
                                {comment.message}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={saveChanges}
                >
                  Save Changes
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ITSupportDashboard;
