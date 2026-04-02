import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";

function AdminTypeOfTask() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("P3");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newAssignedDept, setNewAssignedDept] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  //Added by harshada 27-01-2026
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  //Added by harshada 27-01-2026
  const handleRowClick = (item) => {
    setSelectedProject(item);
    setShowPopup(true);
  };
  const openEdit = (item) => {
    setIsEditMode(true);
    setEditId(item._id);

    setNewName(item.name);
    setNewDesc(item.description || "");
    setNewPriority(item.priority || "P3");
    setNewIsActive(item.isActive ?? true);
    setNewAssignedDept(item.assignedDepartment || "");

    setShowModal(true);
  };

  const fetchTaskTypes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/task-types");
      // setItems(res.data || []);
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ); ////snehal sort changes
      setItems(sorted);
    } catch (error) {
      console.error("Failed to fetch task types", error);
    }
  };

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  const validateStatusForm = () => {
    const newErrors = {};

    if (!newName || !newName.trim()) {
      newErrors.name = "Name is required";
    } else if (newName.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!newDesc || !newDesc.trim()) {
      newErrors.desc = "Description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  ////
  ///snehal code
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:8000/getAllDepartments");

        console.log("Departments API:", res.data);

        if (res.data.success) {
          setDepartments(res.data.departments);
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };

    fetchDepartments();
  }, []);

  ////
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setLoading(true);

      await axios.post("http://localhost:8000/api/task-types", {
        name: newName.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        isActive: newIsActive,
        assignedDepartment: newAssignedDept.trim(),
      });
       alert("Task type created successfully");
      resetForm();
      setShowModal(false);
      fetchTaskTypes(); // refresh table
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create task type");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      alert("Task type name is required");
      return;
    }

    try {
      setLoading(true);

      await axios.put(`http://localhost:8000/api/task-types/${editId}`, {
        name: newName.trim(),
        description: newDesc?.trim() || "",
        priority: newPriority,
        isActive: newIsActive,
        assignedDepartment: newAssignedDept?.trim() || "",
      });

      alert("Task type updated successfully");
      setShowModal(false);
      setIsEditMode(false);
      setEditId(null);
      resetForm();
      fetchTaskTypes();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to update task type");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewDesc("");
    setNewPriority("P3");
    setNewIsActive(true);
    setNewAssignedDept("");
    setErrors({});
  };

  // const handleUpdate = (e) => {
  //   e.preventDefault();
  //   if (!editForm.name.trim()) return;

  //   const now = todayISO();

  //   // Update immutably with map (no mutation). [web:10]
  //   setItems((prev) =>
  //     prev.map((x) =>
  //       x.id === editForm.id
  //         ? {
  //             ...x,
  //             name: editForm.name.trim(),
  //             description: editForm.description.trim(),
  //             priority: editForm.priority,
  //             isActive: editForm.isActive,
  //             assignedDepartment: editForm.assignedDepartment.trim(),
  //             updatedAt: now,
  //           }
  //         : x
  //     )
  //   );

  //   // keep details modal in sync if it's open for the same item
  //   setSelectedItem((cur) => {
  //     if (!cur || cur.id !== editForm.id) return cur;
  //     return {
  //       ...cur,
  //       name: editForm.name.trim(),
  //       description: editForm.description.trim(),
  //       priority: editForm.priority,
  //       isActive: editForm.isActive,
  //       assignedDepartment: editForm.assignedDepartment.trim(),
  //       updatedAt: now,
  //     };
  //   });

  //   closeEdit();
  // };

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this task type?",
    );
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:8000/api/task-types/${id}`);
       alert("Task type deleted successfully");
      fetchTaskTypes();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete task type");
    }
  };

  const thStyle = useMemo(
    () => ({
      fontWeight: "500",
      fontSize: "14px",
      color: "#6c757d",
      borderBottom: "2px solid #dee2e6",
      padding: "12px",
      whiteSpace: "nowrap",
      maxWidth: "220px",
    }),
    [],
  );

  const tdStyle = useMemo(
    () => ({
      padding: "12px",
      verticalAlign: "middle",
      fontSize: "14px",
      borderBottom: "1px solid #dee2e6",
      whiteSpace: "nowrap",
    }),
    [],
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const indexOfLastItem = page * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;

  const paginatedItems = useMemo(() => {
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [items, indexOfFirstItem, indexOfLastItem]);

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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span
          className="fw-semibold"
          style={{ fontSize: "25px", color: "#3A5FBE" }}
        >
          Type of Task
        </span>
        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            resetForm();
            setIsEditMode(false);
            setEditId(null);
            setShowModal(true);
          }}
        >
          + Add New Type
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
                    width: "18%",
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
                    width: "32%",
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
                    maxWidth: "220px",
                  }}
                >
                  Active
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
                  Department
                </th>
                <th style={{ ...thStyle, width: "140px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
               {paginatedItems.map((item) =>  (
                <tr
                  key={item._id}
                  onClick={() => handleRowClick(item)}
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
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
                    {/* //Snehal Added 27-01-2026 start */}
                    {item.description
                      ? item.description.length > 40
                        ? item.description.slice(0, 40) + "..."
                        : item.description
                      : "-"}
                    {/* //Snehal Added 27-01-2026 start */}
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
                    {item.priority}
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
                    {item.isActive ? "Yes" : "No"}
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
                    {item.assignedDepartment || "-"}
                  </td>

                  <td style={tdStyle}>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No task types found
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
            // position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
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
              <h5 className="fw-bold">Type Of Task Details</h5>
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

            <div className="mb-2 row">
              <label className="col-4 fw-semibold">Priority</label>
              <div className="col-8">{selectedProject.priority}</div>
            </div>

            <div className="mb-2 row">
              <label className="col-4 fw-semibold">Active</label>
              <div className="col-8">
                {selectedProject.isActive ? "Yes" : "No"}
              </div>
            </div>

            <div className="mb-2 row">
              <label className="col-4 fw-semibold">Department</label>
              <div className="col-8">{selectedProject.assignedDepartment}</div>
            </div>

            {/* CLOSE BUTTON */}
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-sm custom-outline-btn"  style={{minWidth:"90px"}}
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination code start */}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              onMouseDown={(e) => e.preventDefault()}
              disabled={page === 1}
              style={{
                fontSize: "18px",
                padding: "2px 8px",
                color: page === 1 ? "#c0c4cc" : "#212529",
              }}
              aria-label="Previous page"
            >
              ‹
            </button>

            <button
              className="btn btn-sm border-0"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                fontSize: "18px",
                padding: "2px 8px",
                color: page === totalPages ? "#c0c4cc" : "#212529",
              }}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </nav>

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
          <div style={{ maxWidth: "800px", width: "100%" }}>
            <div className="bg-white rounded shadow">
              <div
                style={{
                  backgroundColor: "#3A5FBE",
                  color: "white",
                  padding: "10px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {isEditMode ? "Edit Task Type" : "Add New Task Type"}
                </span>

                <button
                  onClick={() => {
                    setShowModal(false);

                    resetForm();
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validateStatusForm()) return;

                  isEditMode ? handleUpdate(e) : handleCreate(e);
                }}
                className="p-3"
              >
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (errors.name) {
                          setErrors({ ...errors, name: "" });
                        }
                      }}
                    />
                    {errors.name && (
                      <small className="text-danger">{errors.name}</small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={200}
                    value={newDesc}
                    onChange={(e) => {
                      setNewDesc(e.target.value);
                      if (errors.desc) {
                        setErrors({ ...errors, desc: "" });
                      }
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

                <div className="row">
                  <div className="col-md-6 mb-3">
                    {/* <label className="form-label">Assigned Department</label>
                    <input
                      className="form-control"
                      value={newAssignedDept}
                      onChange={(e) => setNewAssignedDept(e.target.value)}
                    /> */}

                    {/* Snehal code */}
                    {/* //snehal adeed 27-01-2026 Department fetch start */}
                    <label className="form-label">Assigned Departments</label>
                    <select
                      className="form-select"
                      value={newAssignedDept}
                      onChange={(e) => setNewAssignedDept(e.target.value)}
                    >
                      <option value="">Select Department</option>

                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* //snehal adeed 27-01-2026 Department fetch start */}

                  <div className="col-md-3 d-flex align-items-center mb-3">
                    <div className="form-check mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newIsActive}
                        onChange={(e) => setNewIsActive(e.target.checked)}
                      />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                </div>

                <div className="custom-modal-footer">
                  <button
                    type="button"
                    className="btn  btn-sm custom-outline-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm  custom-outline-btn"
                    disabled={loading}
                  >
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

export default AdminTypeOfTask;
