import React, { useState, useEffect ,useRef} from "react";
import axios from "axios";

function EditHolidayForm({ holidayData, onUpdate, onClose }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
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
    if (holidayData) {
      setName(holidayData.name || "");
      setDate(holidayData.date?.split("T")[0] || "");
    }
  }, [holidayData]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.put(
        `http://localhost:8000/holidays/${holidayData._id}`, // ✅ FIXED
        { name, date },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Holiday updated successfully ✅");

      onUpdate(res.data.holiday);
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update holiday ❌");
    }
  };

  if (!holidayData) return null;

  return (
    <div
      className="modal fade show d-block"
      ref={modalRef}
          tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog"
        style={{ maxWidth: "500px", marginTop: "180px" }}
      >
        <div className="modal-content">
          {/* Header */}
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#3A5FBE" }}
          >
            <h5 className="modal-title">Edit Holiday</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleUpdate}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Holiday Title</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={onClose}
              >
                Cancel
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

export default EditHolidayForm;
