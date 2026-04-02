import React, { useState, useEffect,useRef } from "react";
import axios from "axios";

function EditAnnouncementForm({ data, onClose, onUpdate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const modalRef = useRef(null);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    if (modalRef.current) {
      const focusableSelectors =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      
      const focusableElements = modalRef.current.querySelectorAll(focusableSelectors);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      
        if (e.key === "Tab" && focusableElements.length) {
          const firstEl = focusableElements[0];
          const lastEl = focusableElements[focusableElements.length - 1];
      
          if (e.shiftKey) {
            if (document.activeElement === firstEl || !modalRef.current.contains(document.activeElement)) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl || !modalRef.current.contains(document.activeElement)) {
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
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    };
  }, [onClose]);
  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description);
      setCategory(data.category);
    }
  }, [data]);

  // const handleUpdate = async (e) => {
  //   e.preventDefault();
  //   const token = localStorage.getItem("accessToken");

  //   const formData = new FormData();
  //   formData.append("name", name);
  //   formData.append("description", description);
  //   formData.append("category", category);
  //   if (image) formData.append("image", image);

  //   const res = await axios.put(
  //     `https://ems-cws-backend-9wgt.vercel.app/announcements/${data._id}`,
  //     formData,
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );

  //   onUpdate(res.data.data);
  //   onClose();
  // };
  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      if (image) formData.append("image", image);

      const res = await axios.put(
        `https://ems-cws-backend-9wgt.vercel.app/announcements/${data._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // ✅ SUCCESS ALERT
      alert("Announcement updated successfully ✅");

      onUpdate(res.data.data);
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update announcement ❌");
    }
  };

  return (
    <div
      className="modal fade show"
      ref={modalRef}
          tabIndex="-1"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog "
        style={{
          maxWidth: "650px",
          width: "95%",
          marginTop: "60px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div className="modal-content">
          {/* Header */}
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#3A5FBE" }}
          >
            <h5 className="modal-title mb-0">Edit Announcement </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleUpdate} className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Announcement Name
              </label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Upload Image</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>

            {/* Buttons Right Side */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                onClick={onClose}
                style={{ minWidth: 90 }}
              >
                Close
              </button>

              <button
                type="submit"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditAnnouncementForm;
