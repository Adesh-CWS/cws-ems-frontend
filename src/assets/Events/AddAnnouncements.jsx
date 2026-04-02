import React, { useState,useRef,useEffect } from "react";
import axios from "axios";

function AddAnnouncements({ onAdd }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expirationDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    publishDate: "",
    expirationDate: "",
    category: "",
    image: "",
  });

  const today = new Date().toISOString().split("T")[0];
const modalRef = useRef(null);
  useEffect(() => {
    if (showModal) {
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
            setShowModal(false);
          }

          if (e.key === "Tab" && focusableElements.length) {
            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

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
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
    };
  }, [showModal]);
  const handleSubmit = async (e) => {
    e.preventDefault();

    let hasError = false;
    const newErrors = {
      name: "",
      description: "",
      publishDate: "",
      expirationDate: "",
      category: "",
      image: "",
    };

    if (!name.trim()) {
      newErrors.name = "Please enter announcement name.";
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = "Please enter description.";
      hasError = true;
    }
    if (!publishDate) {
      newErrors.publishDate = "Please select publish date.";
      hasError = true;
    }
    if (!expirationDate) {
      newErrors.expirationDate = "Please select expiry date.";
      hasError = true;
    }
    if (publishDate && expirationDate && expirationDate < publishDate) {
      newErrors.expirationDate = "Expiry date must be after publish date.";
      hasError = true;
    }
    if (!category) {
      newErrors.category = "Please select a category.";
      hasError = true;
    }
    if (!image) {
      newErrors.image = "Please upload an image.";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("publishDate", publishDate);
      formData.append("expirationDate", expirationDate);
      formData.append("category", category);
      formData.append("image", image);

      const response = await axios.post(
        "http://localhost:8000/announcements/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // const newAnnouncement = response.data?.announcement || response.data;
      //Added by samiksha
      const newAnnouncement =
        response.data?.announcement ||
        response.data?.data ||
        response.data;
      if (onAdd && newAnnouncement) onAdd(newAnnouncement);

      alert("Announcement added successfully!");
      setName("");
      setDescription("");
      setPublishDate("");
      setExpiryDate("");
      setCategory("");
      setImage(null);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError("Failed to add announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Open Modal Button */}
      <button
        className="btn btn-sm custom-outline-btn"
        style={{ minWidth: 140 }}
        onClick={() => setShowModal(true)}
      >
        Add Announcement
      </button>

      {/* Modal */}
      {showModal && (
        <div
        ref={modalRef}
          tabIndex="-1"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "900px", // 👈 LARGE WIDTH
              maxHeight: "90vh",
              background: "#fff",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#3A5FBE",
                color: "#fff",
                fontWeight: 800, // 👈 Added font weight
                fontSize: "16px", // (optional) better visibility
              }}
            >
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                Add Announcement
              </span>
              <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  title="Close"
                >
                </button>
            </div>

            {/* Scrollable Body */}
            <div
              style={{
                padding: "16px",
                overflowY: "auto", // 👈 SCROLL ENABLED
                flex: 1,
              }}
            >
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <div className="char-count">{name.length}/50</div>
                  {errors.name && (
                    <small className="text-danger">{errors.name}</small>
                  )}
                </div>

                {/* Description */}
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    maxLength={200}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="char-count">{description.length}/200</div>
                  {errors.description && (
                    <small className="text-danger">{errors.description}</small>
                  )}
                </div>

                {/* Publish Date */}
                <div className="mb-2">
                  <label className="form-label">Publish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={today}
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                  {errors.publishDate && (
                    <small className="text-danger">{errors.publishDate}</small>
                  )}
                </div>

                {/* Expiry Date */}
                <div className="mb-2">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    min={publishDate || today}
                    value={expirationDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  {errors.expirationDate && (
                    <small className="text-danger">
                      {errors.expirationDate}
                    </small>
                  )}
                </div>

                {/* Category */}
                <div className="mb-2">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    <option value="General">General</option>
                    <option value="Event">Event</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  {errors.category && (
                    <small className="text-danger">{errors.category}</small>
                  )}
                </div>

                {/* Image */}
                <div className="mb-2">
                  <label className="form-label">Upload Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                  {errors.image && (
                    <small className="text-danger">{errors.image}</small>
                  )}
                </div>

                {error && <p className="text-danger">{error}</p>}

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "16px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm custom-outline-btn"
                    style={{minWidth:"90px"}}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm custom-outline-btn"
                    style={{minWidth:"90px"}}
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddAnnouncements;
