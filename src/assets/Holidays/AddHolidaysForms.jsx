import React, { useState ,useEffect,useRef} from "react";
import axios from "axios";
import "../Events/AddEvent.css";

function AddHolidayForm({ onAdd }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // modal state
  const [errors, setErrors] = useState({ name: "", date: "" });
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
    const newErrors = { name: "", date: "" };

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Please enter the Holiday title.";
      hasError = true;
    }

    // Validate date
    if (!date) {
      newErrors.date = "Please select a Holiday date.";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        "http://localhost:8000/holidays",
        { name, date },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Call parent callback to update holidays dynamically
      //  if (onAdd) onAdd(res.data);

      const newHoliday = res.data.holiday || res.data; // handle both cases
      if (onAdd && newHoliday) onAdd(newHoliday);
      alert("Holiday added successfully!");
      setName("");
      setDate("");
      setErrors({ name: "", date: "" });
      setShowModal(false); // close modal on success
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message) {
        alert(err.response.data.message); // 👈 backend duplicate message
      } else {
        alert("Failed to add holiday.");
      }
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // add 1 day
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <>
      {/* Button to open modal */}
      <button
        className="btn btn-sm custom-outline-btn"
        style={{ minWidth: 90 }}
        onClick={() => setShowModal(true)}
      >
        Add Holiday
      </button>

      {/* Modal - Using Custom Classes */}
      {showModal && (
        <div className="custom-modal-bg" ref={modalRef}
          tabIndex="-1">
          <div className="custom-modal-dialog">
            <div className="custom-modal-content">
              {/* Header */}
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Add Holiday</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  title="Close"
                >
                </button>
              </div>

              {/* Body */}
              <div className="custom-modal-body">
                <form onSubmit={handleSubmit}>
                  {/* <div className="mb-2">
                  <label className="form-label">Holiday Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter holiday name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div> */}
                  <div className="mb-2">
                    <label htmlFor="event-desc" className="form-label">
                      Holiday Title
                    </label>
                    <textarea
                      id="event-desc"
                      className="form-control"
                      rows={3}
                      maxLength={50}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && (
                      <small className="text-danger">{errors.name}</small>
                    )}
                    <div className="char-count">{name.length}/50</div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={minDate}
                    />
                    {errors.date && (
                      <small className="text-danger">{errors.date}</small>
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="custom-modal-footer">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Adding..." : "Add Holiday"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddHolidayForm;
