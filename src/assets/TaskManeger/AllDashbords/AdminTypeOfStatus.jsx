import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";

function AdminTypeOfStatus() {
  const [statuses, setStatuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [errors, setErrors] = useState({});
  //Added by harshada 27-01-2026
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  //Added by harshada 27-01-2026
  const handleRowClick = (s) => {
    setSelectedProject(s);
    setShowPopup(true);
  };
  //  Fetch all statuses
  const fetchStatuses = async () => {
    try {
      const res = await axios.get("http://localhost:8000/taskstatus/all");
      setStatuses(res.data.statuses || []);
    } catch (error) {
      console.error("Failed to fetch statuses");
    }
  };
  const openEdit = (status) => {
    setIsEditMode(true);
    setEditId(status._id);
    setNewName(status.name);
    setNewDesc(status.description || "");
    setShowModal(true);
  };

  const validateStatusForm = () => {
    let newErrors = {};

    if (!newName || !newName.trim()) {
      newErrors.name = "Name is required";
    } else if (newName.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!newDesc || !newDesc.trim()) {
      newErrors.desc = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetStatusForm = () => {
    setNewName("");
    setNewDesc("");
    setErrors({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateStatusForm()) return;

    if (!newName.trim()) {
      alert("Status name is required");
      return;
    }

    try {
      setLoading(true);

      await axios.put(`http://localhost:8000/taskstatus/update/${editId}`, {
        name: newName.trim(),
        description: newDesc?.trim() || "",
      });
      alert("Status name updated successfully");
      // Reset & close modal
      setShowModal(false);
      setIsEditMode(false);
      setEditId(null);
      setNewName("");
      setNewDesc("");

      fetchStatuses();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this status?")) return;

    try {
      await axios.delete(`http://localhost:8000/taskstatus/delete/${id}`);
      alert("Task status deleted successfully");
      fetchStatuses(); // refresh list
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete status");
    }
  };

  // 🔹 Load statuses on page load
  useEffect(() => {
    fetchStatuses();
  }, []);

  // 🔹 Create status
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateStatusForm()) return;
    if (!newName.trim()) return;

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/taskstatus/add", {
        name: newName,
        description: newDesc,
      });
     alert("Task status created successfully");
      setNewName("");
      setNewDesc("");
      setShowModal(false);
      fetchStatuses(); // refresh list
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to add status");
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // default like your image

  const totalItems = statuses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const indexOfLastItem = page * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;

  const paginatedStatuses = useMemo(() => {
    return statuses.slice(indexOfFirstItem, indexOfLastItem);
  }, [statuses, indexOfFirstItem, indexOfLastItem]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, totalItems]);

  const popupRef = useRef(null);
  useEffect(() => {
    if (showModal && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showModal]);

  const trapFocus = (e) => {
    if (!popupRef.current) return;

    const focusableElements = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };
 const isAnyPopupOpen = showModal || showPopup;
  useEffect(() => {
    if (isAnyPopupOpen) {
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
  }, [isAnyPopupOpen]);
  return (
    <div
      className="container-fluid "
      
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ color: "#3A5FBE",fontSize:"25px" }}>
          Status
        </h4>
        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            setIsEditMode(false); // 🔑 switch to create mode
            setEditId(null); // clear edit id
            setNewName(""); // clear name field
            setNewDesc(""); // clear description
            setShowModal(true); // open modal
          }}
        >
          + New status
        </button>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0 mt-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
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
                    maxWidth: "220px",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                    maxWidth: "220px",
                  }}
                >
                  Description
                </th>
                <th style={{ fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                    maxWidth: "220px",width: "140px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStatuses.map((s) => (
                <tr
                  key={s._id}
                  onClick={() => handleRowClick(s)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>{s.name}</td>
                  <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>
                    {s.description || "-"}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(s);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent row click [web:21]
                          handleDelete(s._id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {statuses.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-4 text-muted">
                    No statuses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* //added by harshada 27-01-2026 */}

      {showPopup && selectedProject && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={trapFocus}
          className="popup-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
             overflowX: "auto",
            padding: "20px",
          }}
        >
          <div
            className="popup-box bg-white p-4 shadow"
            style={{
              width: "600px",
              borderRadius: "10px",
              maxHeight: "68vh",
              overflowY: "auto",
            }}
          >
            {/* HEADER */}
            <div
              className="modal-header"
              style={{
                backgroundColor: "#3A5FBE",
                padding: "10px",
                color: "#fff",
                margin: "-25px -24px 15px -24px",
                borderTopLeftRadius: "10px",
              }}
            >
              <h5 className="fw-bold">Type Of Status Details</h5>
              <button
                className="btn-close btn-close-white"
                onClick={() => setShowPopup(false)}
              />
            </div>

            {/* DETAILS (VIEW ONLY) */}
            <div className="mb-2 row">
              <label className="col-4 fw-semibold">Task Name</label>
              <div className="col-8">{selectedProject.name}</div>
            </div>

            <div className="mb-2 row">
              <label className="col-4 fw-semibold">Description</label>
              <div className="col-8">{selectedProject.description}</div>
            </div>

            {/* CLOSE BUTTON */}
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination start */}
      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
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
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
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
            {totalItems === 0
              ? "0-0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(
                  indexOfLastItem,
                  totalItems,
                )} of ${totalItems}`}
          </span>

          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm border-0"
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                fontSize: "18px",
                padding: "2px 8px",
                color: page === 1 ? "#c0c4cc" : "#212529",
              }}
            >
              ‹
            </button>

            <button
              className="btn btn-sm border-0"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalItems === 0}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                fontSize: "18px",
                padding: "2px 8px",
                color:
                  page === totalPages || totalItems === 0
                    ? "#c0c4cc"
                    : "#212529",
              }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* Pagination end */}

      {/* <form onSubmit={handleUpdate} className="p-3">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </div>

        <div className="text-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: "#3A5FBE" }}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </form> */}

      {/* Modal */}
      {showModal && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={trapFocus}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <div className="shadow bg-white rounded">
              {/* Header */}
              <div
                style={{
                  backgroundColor: "#3A5FBE",
                  color: "white",
                  padding: "10px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{isEditMode ? "Edit Status" : "New Status"}</span>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetStatusForm();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <form
                onSubmit={isEditMode ? handleUpdate : handleCreate}
                className="p-3"
              >
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setErrors({ ...errors, name: "" });
                    }}
                  />
                  {errors.name && (
                    <small className="text-danger">{errors.name}</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    maxLength={200}
                    value={newDesc}
                    onChange={(e) => {
                      setNewDesc(e.target.value);
                      setErrors({ ...errors, desc: "" });
                    }}
                  />
                  {errors.desc && (
                    <small className="text-danger">{errors.desc}</small>
                  )}
                  <div
                    className="char-count"
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "12px",
                      color: "#6c757d",
                      marginTop: "4px",
                    }}
                  >
                    {newDesc.length}/200
                  </div>
                </div>

                <div className="custom-modal-footer">
                  <button
                    type="button"
                    className="btn  custom-outline-btn"
                    onClick={() => {
                      setShowModal(false);
                      resetStatusForm();
                    }}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="btn  custom-outline-btn">
                    {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                  </button>
                </div>
              </form>
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

export default AdminTypeOfStatus;
