import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/gallery";

const CATEGORY_OPTIONS = [
  "Rewards & Recognition",
  "Engagement Activities",
  "Social Activities",
];

function Gallery() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachFiles, setAttachFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  // rutuja code
  const [activeTable, setActiveTable] = useState('image');
  const MAX_DESC_LENGTH = 250;
  //

  const [editData, setEditData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    preview: "",
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Calculate total pages snehal
  // const totalPages = Math.ceil(galleryItems.length / itemsPerPage);

  const [searchInput, setSearchInput] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
const modalRef = useRef(null);
  // Slice galleryItems for current page

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchGallery();
  }, []);
  // bg scroll stop

  // rutuja code start

  const getFileNameFromUrl = (url) => {
    if (!url) return "Untitled PDF";
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const decodedName = decodeURIComponent(filename);
      return decodedName.length > 30 ? decodedName.substring(0, 30) + '...' : decodedName;
    } catch (error) {
      return "PDF File";
    }
  };

  useEffect(() => {
    if (galleryItems.length > 0) {
      const itemsByType = galleryItems.filter(item => item.type === activeTable);
      setFilteredItems(itemsByType);
      setCurrentPage(1);
    }
  }, [galleryItems, activeTable]);

useEffect(() => {
    if (showUploadModal || showViewModal || showEditModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';  
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';  
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';    // Add this line
    };
  }, [showUploadModal, showViewModal, showEditModal]);
  
  const fetchGallery = async () => {
    const res = await axios.get(API_URL);
    setGalleryItems(res.data);
    // setFilteredItems(res.data); // important
    setFilteredItems(res.data.filter(item => item.type === 'image'));
  };

  /* ================= FILE SELECT ================= */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const mapped = files.map((file) => ({
      file,
      type: file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
          ? "video"
          : "pdf",
      preview:
        file.type.startsWith("image") || file.type.startsWith("video")
          ? URL.createObjectURL(file)
          : null,
      title: "",
      description: "",
      category: "",
    }));

    setSelectedFiles(mapped);
  };


useEffect(() => {
  const isAnyModalOpen =
    showUploadModal || showViewModal || showEditModal;

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

  // wait for DOM render
  // setTimeout(focusFirst, 0); 
  modalRef.current.focus();//rutuja

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();

      if (showUploadModal) closeModal();
      if (showViewModal) closeViewModal();
      if (showEditModal) setShowEditModal(false);
    }

    if (e.key === "Tab") {
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;

      const firstEl = focusableElements[0];
      const lastEl =
        focusableElements[focusableElements.length - 1];

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

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [showUploadModal, showViewModal, showEditModal]);


  /* ================= INPUT CHANGE ================= */
  const handleChange = (index, field, value) => {
    const updated = [...selectedFiles];
    updated[index][field] = value;
    setSelectedFiles(updated);
  };

  /* ================= UPLOAD ================= */
  // const handleUpload = async () => {
  //   if (!selectedFiles.length) {
  //     alert("Please select files");
  //     return;
  //   }

  //   for (let item of selectedFiles) {
  //     if (!item.category) {
  //       alert("Please select category for all files");
  //       return;
  //     }
  //   }

  //   try {
  //     const formData = new FormData();

  //     selectedFiles.forEach((item) => {
  //       formData.append("files", item.file);
  //       formData.append("titles[]", item.title);
  //       formData.append("descriptions[]", item.description);
  //       formData.append("categories[]", item.category);
  //     });
  //     const res = await axios.post(`${API_URL}/upload`, formData, {
  //       headers: { "Content-Type": "multipart/form-data" },
  //     });

  //     setGalleryItems((prev) => [...res.data, ...prev]);
  //     setSelectedFiles([]);
  //     setEditId(null);
  //     alert("Upload successful ✅");
  //   } catch (err) {
  //     alert(err.response?.data?.message || "Upload failed ❌");
  //   }
  // };
  const handleUpload = async () => {
    if (!selectedFiles.length) {
      alert("Please select files");
      return;
    }

    for (let item of selectedFiles) {
      if (!item.category) {
        alert("Please select category for all files");
        return;
      }
    }

    try {
      const formData = new FormData();

      selectedFiles.forEach((item) => {
        formData.append("files", item.file);
        formData.append("titles[]", item.title);
        formData.append("descriptions[]", item.description);
        formData.append("categories[]", item.category);
      });
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchGallery(); // 🔥 get fresh data from backend
      setCurrentPage(1); // go to first page
      setShowUploadModal(false);
      setSelectedFiles([]);
      alert("Upload successful ✅");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed ❌");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditFile(null);

    setEditData({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "",
      type: item.type,
      preview: item.url, // existing url
    });

    setShowEditModal(true);
  };

  const handleEditCancel = () => {
    setSelectedFiles([]);
    setEditId(null);
    setShowEditModal(false);
  };

  const handleUpdate = async () => {
    if (!editData.category) {
      alert("Please select category");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", editData.title);
      formData.append("description", editData.description);
      formData.append("category", editData.category);

      if (editFile) formData.append("file", editFile);

      const res = await axios.put(`${API_URL}/${editId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // setGalleryItems((prev) =>
      //   prev.map((it) => (it._id === editId ? res.data : it)),
      // );
      // setShowEditModal(false);
      // setEditId(null);
      // setEditFile(null);

      // alert("Updated successfully ✅");
      await fetchGallery();
      setShowEditModal(false);
      setEditId(null);
      setEditFile(null);
      alert("Updated successfully ✅");
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed ❌");
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditFile(file);

    const type = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
        ? "video"
        : "pdf";

    const preview = type === "pdf" ? "" : URL.createObjectURL(file);

    setEditData((p) => ({
      ...p,
      type,
      preview: preview || p.preview, // pdf साठी preview बदलत नाही
    }));
  };

  /* ================= DELETE ================= */
  // const handleDelete = async (id) => {
  //   try {
  //     const confirmDelete = window.confirm(
  //       "Are you sure you want to delete this file?",
  //     );

  //     if (!confirmDelete) return;

  //     const res = await axios.delete(`${API_URL}/${id}`);

  //     if (res.status === 200) {
  //       // 🔥 state update only after success
  //       setGalleryItems((prev) => prev.filter((item) => item._id !== id));
  //     }
  //   } catch (err) {
  //     console.error("DELETE ERROR:", err);
  //     alert(err?.response?.data?.message || "Delete failed ❌");
  //   }
  // };
  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this file?",
      );

      if (!confirmDelete) return;

      await axios.delete(`${API_URL}/${id}`);

      // 🔥 Always refetch fresh data
      await fetchGallery();

      alert("Deleted successfully ✅");
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert(err?.response?.data?.message || "Delete failed ❌");
    }
  };

  const handleRowClick = (item) => {
    setViewItem(item);
    setShowViewModal(true);
  };

  // const closeViewModal = () => {
  //   setShowViewModal(false);
  //   setViewItem(null);
  // };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedFiles([]);
    setEditId(null);
  };
  const closeModal = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setEditId(null);
  };
  // const filteredItems = galleryItems.filter((item) => {
  //   const textMatch =
  //     item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
  //     item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
  //     item.category?.toLowerCase().includes(searchText.toLowerCase());

  //   const categoryMatch = !searchCategory || item.category === searchCategory;

  //   return textMatch && categoryMatch;
  // });

  const openTable = (type) => {
    setActiveTable(type);
    setCurrentPage(1);
    
    setFilteredItems(galleryItems.filter(item => item.type === type));
  };

  const handleFilter = () => {
    const filtered = galleryItems.filter((item) => {
      const textMatch =
        item.title
          ?.toLowerCase()
          .includes(searchInput.toLowerCase()) ||
        item.description
          ?.toLowerCase()
          .includes(searchInput.toLowerCase()) ||
        item.category
          ?.toLowerCase()
          .includes(searchInput.toLowerCase());

      const categoryMatch =
        !searchCategory || item.category === searchCategory;
      
      const typeMatch = item.type === activeTable;

      return textMatch && categoryMatch && typeMatch;
    });

    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearchCategory("");
    setFilteredItems(galleryItems.filter(item => item.type === activeTable));
    setCurrentPage(1);
  };


  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2
          style={{
            color: "#3A5FBE",
            fontSize: "25px",
            marginLeft: "15px",
            marginBottom: "40px",
          }}
        >
          Gallery
        </h2>
        {/* ===== Attach File Button ===== */}
        <button
          className="btn btn-sm custom-outline-btn mb-3"
          onClick={() => fileInputRef.current.click()}
        >
          Attach File
        </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*,.pdf"
        hidden
        onChange={(e) => {
          handleFileChange(e);
          setShowUploadModal(true); // ✅ auto open modal
        }}
      />

      {/* ================= MODAL ================= */}
      {showUploadModal && (
        <div
          className="modal fade show d-block"
          ref={modalRef}
          tabIndex="-1"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: 600 }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 style={{ color: "white" }}>Upload Gallery File</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>

              <div className="modal-body">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="mb-3">
                    {item.type === "image" && (
                      <img
                        src={item.preview}
                        width="120"
                        className="mb-2 rounded"
                      />
                    )}
                    {item.type === "video" && (
                      <video src={item.preview} width="150" controls />
                    )}
                    {item.type === "pdf" && <p>📄 PDF Selected</p>}
                    <div>
                      <label className="form-label fw-bold">Title</label>
                      <input
                        className="form-control mb-2"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          handleChange(index, "title", e.target.value)
                        }
                      />
                    </div>

                    <label className="form-label fw-bold">Description</label>
                    <textarea
                      className="form-control mb-2"
                      placeholder="Description"
                      value={item.description}
                      maxLength={MAX_DESC_LENGTH} 
                      onChange={(e) =>
                        handleChange(index, "description", e.target.value)
                      }
                    />
                    <div className="text-end">
                      <small>{item.description.length}/{MAX_DESC_LENGTH}</small>
                    </div>
                    <label className="form-label fw-bold">
                      Select Category
                    </label>
                    <select
                      className="form-select"
                      value={item.category}
                      onChange={(e) =>
                        handleChange(index, "category", e.target.value)
                      }
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                {selectedFiles.length > 0 && (
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={editId ? handleUpdate : handleUpload}
                  >
                    {editId ? "Update" : "Upload"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex gap-3 justify-content-center">
            <button
               className={`btn btn-sm ${activeTable === 'image' ? 'btn-primary' : 'custom-outline-btn'}`}
               style={{ minWidth: 90 }}
              onClick={() => openTable('image')}
            >
              IMAGES
            </button>
            <button
              className={`btn btn-sm ${activeTable === 'video' ? 'btn-primary' : 'custom-outline-btn'}`}
              style={{ minWidth: 90 }}
              onClick={() => openTable('video')}
            >
              VIDEOS
            </button>
            <button
              className={`btn btn-sm ${activeTable === 'pdf' ? 'btn-primary' : 'custom-outline-btn'}`}
              style={{ minWidth: 90 }}
              onClick={() => openTable('pdf')}
            >
              PDFs
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="row align-items-end g-3">
            {/* SEARCH */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-3 mb-1  ">
              <label
                className="fw-bold mb-1"
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

            {/* STATUS */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-3 mb-1  ms-1">
              <label
                className="fw-bold mb-1"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Status
              </label>

              <select
                className="form-select"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Social Activities">Social Activities</option>
                <option value="Engagement Activities">
                  Engagement Activities
                </option>
                <option value="Rewards & Recognition">
                  Rewards & Recognition
                </option>
              </select>
            </div>

            {/* BUTTONS */}
            <div className="col-auto ms-auto d-flex gap-2">
              <button
                className="btn btn-sm custom-outline-btn "
                style={{ minWidth: 90 }}
                onClick={handleFilter} 
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn "
                style={{ minWidth: 90 }}
                onClick={handleReset} 
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                {["Title", "Description", "Category", "Preview", "Action"].map(
                  (head) => (
                    <th
                      key={head}
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                        textAlign: head === "Action" ? "center" : "left",
                      }}
                    >
                      {head}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {galleryItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4"
                    style={{ color: "#6c757d" }}
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                filteredItems
                  .slice(indexOfFirstItem, indexOfLastItem)
                  .map((item) => (
                    <tr
                      key={item._id}
                      className="align-middle"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRowClick(item)}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        {item.description}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.category}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.type === "image" && (
                          <img
                            src={item.url}
                            style={{
                              width: "100px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                            className="rounded"
                          />
                        )}
                        {item.type === "video" && <span>🎥 Video</span>}
                        {/* rutuja code start */}
                        {item.type === "pdf" && (
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: "20px" }}>📄</span>
                            <span 
                              style={{ 
                                fontSize: "13px",
                                color: "#3A5FBE",
                                textDecoration: "underline",
                                cursor: "pointer"
                              }}
                              title={item.title || getFileNameFromUrl(item.url)}
                            >
                              {item.title || getFileNameFromUrl(item.url)}
                            </span>
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm custom-outline-btn"
                            style={{ minWidth: 90 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ minWidth: 90 }}
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
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* optional small css */}
      <style>{`
  /* TEXT */
  .text-primary {
    color: #3A5FBE !important;
  }

  /* BUTTON */
  .btn-primary {
    background-color: #3A5FBE !important;
    border-color: #3A5FBE !important;
  }

  .btn-primary:hover {
    background-color: #2f4fb0 !important;
    border-color: #2f4fb0 !important;
  }

  /* BORDER */
  .border-primary {
    border-color: #3A5FBE !important;
  }

  .border-dashed {
    border-style: dashed !important;
  }

/* ===== GALLERY TABLE THEME (same as Task table) ===== */

  .gallery-theme-table {
    border: 1px solid #dee2e6;
  }

  .gallery-theme-table th,
  .gallery-theme-table td {
    font-size: 13px;
    color: #212529;
    vertical-align: middle;
    border-color: #dee2e6;
  }

  .gallery-table-head {
    background-color: #ffffff;
    border-bottom: 1px solid #dee2e6;
  }

  .gallery-table-head th {
    font-weight: 600;
    color: #495057;
    white-space: nowrap;
  }

  .gallery-theme-table tbody tr:hover {
    background-color: #f8f9fa;
    cursor: pointer;
  }

  .gallery-page {
  padding-top: 8px !important;   /* main fix */
}

`}</style>

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
            {galleryItems.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredItems.length)} of ${filteredItems.length}
`}
          </span>
          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
                           className="btn btn-sm focus-ring"

              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>

      {showViewModal && viewItem && (
        <div
          className="modal fade show"
           ref={modalRef}
            tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={closeViewModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: 600 }}
          >
            <div
              className="modal-content"
              style={{ borderRadius: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ===== HEADER ===== */}
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#3A5FBE",
                  color: "#fff",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                }}
              >
                <h5 className="modal-title fw-semibold">Gallery Details</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={closeViewModal}
                ></button>
              </div>

              {/* ===== BODY ===== */}
              <div className="modal-body px-4 py-3">
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Title</div>
                  <div className="col-8">{viewItem.title || "-"}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Description</div>
                  <div className="col-8">{viewItem.description || "-"}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Category</div>
                  <div className="col-8">{viewItem.category || "-"}</div>
                </div>

                <div className="row mb-3">
                  <div className="col-4 fw-semibold">Type</div>
                  <div className="col-8 text-capitalize">{viewItem.type}</div>
                </div>

                {/* ===== PREVIEW ===== */}
                <div className="text-center mt-3">
                  {viewItem.type === "image" && (
                    <img
                      src={viewItem.url}
                      className="img-fluid rounded"
                      style={{ maxHeight: 250 }}
                      alt=""
                    />
                  )}

                  {viewItem.type === "video" && (
                    <video
                      src={viewItem.url}
                      controls
                      className="w-100 rounded"
                    />
                  )}

                  {/* rutuja code start */}
                  {viewItem.type === "pdf" && (
                    <div>
                      <div className="mb-2 text-start">
                        <span className="fw-semibold">Filename: </span>
                        <span>{viewItem.title || getFileNameFromUrl(viewItem.url)}</span>
                      </div>
                      <iframe
                        src={`${viewItem.url}#toolbar=1`}
                        title={viewItem.title || "PDF Viewer"}
                        width="100%"
                        height="500px"
                        style={{
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}


                </div>
              </div>

              {/* ===== FOOTER ===== */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && editId && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: 600 }}
          >
            <div
              className="modal-content"
              style={{ borderRadius: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#3A5FBE",
                  color: "#fff",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                }}
              >
                <h5 className="modal-title fw-semibold">
                  Edit Gallery Details
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              {/* BODY */}
              <div className="modal-body px-4 py-3">
                {/* Title */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Title</div>
                  <div className="col-8">
                    <input
                      className="form-control"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Description</div>
                  <div className="col-8">
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editData.description}
                      maxLength={MAX_DESC_LENGTH}
                      onChange={(e) =>
                        setEditData((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                    />
                    <div className="text-end mt-1">
                      <small>{editData.description.length}/{MAX_DESC_LENGTH}</small>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="row mb-3">
                  <div className="col-4 fw-semibold">Category</div>
                  <div className="col-8">
                    <select
                      className="form-select"
                      value={editData.category}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, category: e.target.value }))
                      }
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PREVIEW */}
                <div className="text-center mb-3">
                  {editData.type === "image" && (
                    <img
                      src={editData.preview}
                      className="img-fluid rounded"
                      style={{ maxHeight: 220 }}
                    />
                  )}
                  {editData.type === "video" && (
                    <video
                      src={editData.preview}
                      controls
                      className="w-100 rounded"
                    />
                  )}

                  {editData.type === "pdf" && (
                    <div>
                      <p>📄 PDF Selected</p>
                      <p className="text-muted small">
                        File: {editData.title || getFileNameFromUrl(editData.preview)}
                      </p>
                    </div>
                  )}
                  {/* rutuja code end */}

                </div>

                {/* FILE CHANGE */}
                <div className="text-center">
                  <label
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                  >
                    Change File
                    <input
                      type="file"
                      hidden
                      accept="image/*,video/*,.pdf"
                      onChange={handleEditFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={handleUpdate}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
