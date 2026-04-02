import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import TextField from "@mui/material/TextField";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import "bootstrap/dist/css/bootstrap.min.css";
// ✅ helper function
const isToday = (date) => {
  const today = new Date();
  const selected = new Date(date);

  return (
    today.getFullYear() === selected.getFullYear() &&
    today.getMonth() === selected.getMonth() &&
    today.getDate() === selected.getDate()
  );
};
const BASE_URL = "http://localhost:8000";

const HRScheduleInterview = ({user}) => {
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  // ===== TABLE & POPUP STATES =====
  const [allInterviews, setAllInterviews] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [selected, setSelected] = useState(null);


  //jaicy
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


  // ===== FILTER STATES =====
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // ===== PAGINATION STATES =====
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const initialFormState = {
    candidateName: "",
    email: "",
    role: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: "",
    interviewType: "Online",
    interviewerId: "",
    interviewerName: "",
    resume: null,
    link: "",
    manualStatus:"Scheduled",
    comment: "",
  };

  const [formData, setFormData] = useState(initialFormState);


  const modalRef = useRef(null);

  useEffect(() => {
    const isAnyModalOpen = showForm || selected;
  
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
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
  }, [showForm, selected]);


  useEffect(() => {
    const isAnyModalOpen = showForm || selected;
    if (!isAnyModalOpen || !modalRef.current) return;
  
    const modal = modalRef.current;
  
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    const getFocusableElements = () =>
      modal.querySelectorAll(focusableSelectors);
  
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showForm) setShowForm(false);
        if (selected) setSelected(null);
      }
  
      if (e.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (!focusableElements.length) return;
  
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm, selected]);  
  

  /* ---------------- FETCH EMPLOYEES ---------------- */
  useEffect(() => {
    axios
      .get("http://localhost:8000/allEmp")
      .then((res) => {
        if (res.data.success) setEmployees(res.data.employees);
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  /* ---------------- API FUNCTIONS ---------------- */
  const fetchAllInterviews = () => {
    axios
      .get("http://localhost:8000/interviews")
      .then((res) => {
        if (res.data.success) {
          setAllInterviews(res.data.interviews);
          setInterviews(res.data.interviews);
          setShowTable(true);
          setCurrentPage(1);
        }
      })
      .catch((err) => console.error("Error fetching interviews:", err));
  };

  /* ---------------- LOAD INTERVIEWS STATUS UPDATE  ---------------- */
useEffect(() => {
  fetchAllInterviews();

  const interval = setInterval(() => {
    const now = new Date();
    const minutes = now.getMinutes();

    // Refresh every 5 minutes boundary
    if (minutes % 5 === 0) {
      fetchAllInterviews();
    }
  }, 60 * 1000);

  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    if (selected && interviews.length) {
      const updated = interviews.find((i) => i._id === selected._id);
      if (updated) setSelected(updated);
    }
  }, [interviews]);
  console.log("AllInterviews",allInterviews)

  /* ---------------- DELETE INTERVIEW ---------------- */
  const handleDeleteInterview = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this interview?",
    );

    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        `http://localhost:8000/interviewsDelete/${id}`,
      );

      if (res.data.success) {
        alert("Interview deleted successfully");

        // table update without refresh
        setInterviews((prev) => prev.filter((item) => item._id !== id));
        setAllInterviews((prev) => prev.filter((item) => item._id !== id));
        setSelected(null);
        fetchAllInterviews();
      }
    } catch (error) {
      console.error(error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to delete interview");
      }
    }
  };

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

  /* ---------------- UPDATE INTERVIEW ---------------- */
  const handleUpdateInterview = async (id, formData) => {
    const confirmUpdate = window.confirm(
      "Are you sure you want to update this interview?",
    );
    if (!confirmUpdate) return;
    const token = localStorage.getItem("accessToken");
    console.log("form data",formData)
    try {
      const res = await axios.put(
        `http://localhost:8000/interviewsUpdate/${id}`,
        formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }}
      );

      if (res.data.success) {
        alert("Interview updated successfully");

        setInterviews((prev) =>
          prev.map((item) => (item._id === id ? res.data.data : item)),
        );

        setShowForm(false); // 🔥 form close
        setEditingId(null); // 🔥 update mode off
        setFormData(initialFormState);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update interview");
    }finally {
    setIsSubmitting(false); 
   }
  };

  /* ---------------- VALIDATIONS ---------------- */
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const validateName = (name) => /^[A-Za-z ]+$/.test(name);

  const validateFile = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 2 * 1024 * 1024;
    if (!allowedTypes.includes(file.type))
      return "Only PDF, DOC or DOCX files are allowed";
    if (file.size > maxSize) return "Resume size must be less than 2MB";
    return null;
  };

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "interviewerId") {
      const selectedOption = e.target.selectedOptions[0];
      const interviewerName = selectedOption.getAttribute("data-name");

      setFormData((prev) => ({
        ...prev,
        interviewerId: value, // 👈 employeeId
        interviewerName: interviewerName,
      }));

      setErrors((prev) => ({ ...prev, interviewer: "" }));
      return;
    }

    if (name === "resume") {
      const file = files[0];
      if (file) {
        const fileError = validateFile(file);
        if (fileError)
          return setErrors((prev) => ({ ...prev, resume: fileError }));
        setErrors((prev) => ({ ...prev, resume: "" }));
        setFormData((prev) => ({ ...prev, resume: file }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email" && value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Enter a valid email" }));
    }

    //for Duration
    if (name === "startTime" || name === "endTime") {
      const updatedData = { ...formData, [name]: value };
      let newErrors = { ...errors };

      if (updatedData.startTime && updatedData.endTime) {
        const start = new Date(`1970-01-01T${updatedData.startTime}`);
        const end = new Date(`1970-01-01T${updatedData.endTime}`);

        if (end <= start) {
          newErrors.endTime = "End time must be after start time";
          updatedData.duration = "";
        } else {
          // ✅ valid case → calculate duration
          const diffMs = end - start;
          const diffMins = Math.floor(diffMs / 60000);
          const hours = Math.floor(diffMins / 60);
          const minutes = diffMins % 60;

          updatedData.duration =
            hours > 0
              ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
              : `${minutes} minutes`;

          newErrors.endTime = "";
        }
      }

      // 🔥 TODAY + PAST TIME VALIDATION
      if (formData.date && isToday(formData.date)) {
        const now = new Date();
        const selectedTime = new Date(`${formData.date}T${value}`);

        if (selectedTime < now) {
          newErrors[name] = "Time cannot be in the past";
        } else {
          newErrors[name] = "";
        }
      }

      setFormData(updatedData);
      setErrors(newErrors);
      return;
    }
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; // extra protection
    setIsSubmitting(true);
    const formPayload = new FormData();
    let newErrors = {};
    console.log("manualStatus:", formData.manualStatus);
    console.log("status:", formData.status); 

    // 🔥 TODAY + PAST TIME VALIDATION (ON SUBMIT)
    if (formData.date && isToday(formData.date)) {
      const now = new Date();

      if (formData.startTime) {
        const start = new Date(`${formData.date}T${formData.startTime}`);
        if (start < now) {
          newErrors.startTime = "Start time cannot be in the past";
        }
      }

      if (formData.endTime) {
        const end = new Date(`${formData.date}T${formData.endTime}`);
        if (end < now) {
          newErrors.endTime = "End time cannot be in the past";
        }
      }
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!formData.candidateName.trim()) {
      newErrors.candidateName = "Candidate name is required";
    } else if (formData.candidateName.trim().length < 3) {
      newErrors.candidateName = "Name must be at least 3 characters";
    } else if (formData.candidateName.trim().length > 50) {
      newErrors.candidateName = "Name must not exceed 50 characters";
    } else if (!validateName(formData.candidateName.trim())) {
      newErrors.candidateName = "Name should contain only alphabets";
    }

    if (!formData.email || !validateEmail(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.role) newErrors.role = "Please select role";

    if (!formData.date) {
      newErrors.date = "Interview date is required";
    } else {
      const selectedDate = new Date(formData.date);
      if (selectedDate < currentDate) {
        newErrors.date = "Interview date cannot be in the past";
      }
    }

    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (
      formData.startTime &&
      formData.endTime &&
      new Date(`1970-01-01T${formData.endTime}`) <=
        new Date(`1970-01-01T${formData.startTime}`)
    ) {
      newErrors.endTime = "End time must be after start time";
    }
if (
  formData.interviewType === "Online" &&
  !formData.link.trim()
) {
  newErrors.link = "Interview link is required";
}

    if (!formData.interviewerId)
      newErrors.interviewer = "Please select interviewer";
    if (!editingId && !formData.resume)
      newErrors.resume = "Resume upload is required";
   
    // if (editingId) {
    //       if (!formData.manualStatus) {
    //         newErrors.status = "Select a status";
    //   }
    // }

    if (
      ["Scheduled","Not-completed", "Cancelled"].includes(formData.manualStatus) &&
      !formData.comment.trim()
    )
    {
      newErrors.comment = "Comment is required for this status";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }


    formPayload.append("candidateName", formData.candidateName);
    formPayload.append("email", formData.email);
    formPayload.append("role", formData.role);
    formPayload.append("date", formData.date);
    formPayload.append("startTime", formData.startTime);
    formPayload.append("endTime", formData.endTime);
    formPayload.append("duration", formData.duration);
    formPayload.append("interviewType", formData.interviewType);
    formPayload.append("interviewerId", formData.interviewerId);
    formPayload.append("interviewerName", formData.interviewerName);
    formPayload.append("link", formData.link);
    formPayload.append("manualStatus", formData.manualStatus);
    formPayload.append("comment", formData.comment);
    // 🔥 MOST IMPORTANT
    formPayload.append("resume", formData.resume);

    // Update Interveiw code
    if (editingId) {
      const updatePayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "resume") {
          if (formData.resume) {
            updatePayload.append("resume", formData.resume);
          }
        } else {
          updatePayload.append(key, formData[key]);
        }
      });

      handleUpdateInterview(editingId, updatePayload);
      return;
    }
    const token = localStorage.getItem("accessToken");
    axios
      .post("http://localhost:8000/schedule-interview", formPayload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      })

      .then(() => {
        alert("Interview Scheduled Successfully!");
        fetchAllInterviews();
        setShowForm(false);
        setErrors({});
        setFormData(initialFormState);
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(
          "Schedule Interview Error 👉",
          err.response?.data || err.message,
        );
        setIsSubmitting(false);
        const backendMessage =
        err.response?.data?.message || "Failed to schedule interview";
        alert(backendMessage);
      });
  };

  const handleToggleForm = () => {
    setEditingId(null); // ✅ FIX
    setErrors({});
    setFormData(initialFormState);
    setShowForm((prev) => !prev);
  };

  /* ---------------- FILTER HANDLERS ---------------- */
  const applyFilters = () => {
    let filtered = [...allInterviews];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.status?.toLowerCase().trim() ===
          statusFilter.toLowerCase().trim(),
      );
    }
    if (dateFromFilter)
      filtered = filtered.filter(
        (item) => new Date(item.date) >= new Date(dateFromFilter),
      );
    if (dateToFilter)
      filtered = filtered.filter(
        (item) => new Date(item.date) <= new Date(dateToFilter),
      );

    setInterviews(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("All");
    setDateFromFilter("");
    setDateToFilter("");
    setInterviews(allInterviews);
    setCurrentPage(1);
  };

  /* ---------------- PAGINATION ---------------- */
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInterviews = interviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(interviews.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  /* ---------------- JSX ---------------- */
  return (
    <div className="container-fluid px-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
     <h5 className="mb-3 fw-semibold" style={{ color: "#3A5FBE" }}>
        {user.role==="hr"? "HR - Schedule Interview":"Scheduled Interviews"}
      </h5>

        {user?.role === "hr" && (
        <button
          className="btn btn-sm custom-outline-btn mb-3"
          onClick={handleToggleForm}
        >
          Schedule Interview
        </button>
      )}

      </div>

      {/* ================= FORM ================= */}
   {showForm && (
         <div
        className="modal fade show"
        ref={modalRef}
        tabIndex="-1"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      >
    <div className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "650px" }}
            >
      <div className="modal-content">

        {/* Modal Header */}
        <div
          className="modal-header"
          style={{ backgroundColor: "#3A5FBE", color: "#fff" }}
        >
          <h5 className="modal-title">
            {editingId ? "Update Interview" : "Schedule Interview"}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowForm(false)}
          />
        </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* Candidate + Email */}
              {console.log("formData",formData)}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Candidate Name</label>
                  <input
                    type="text"
                    name="candidateName"
                    maxLength={50}
                    className={`form-control ${errors.candidateName ? "is-invalid" : ""}`}
                    value={formData.candidateName}
                    onChange={handleChange}
                  />
                  <div className="invalid-feedback">{errors.candidateName}</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className="invalid-feedback">{errors.email}</div>
                </div>
              </div>

              {/* Role */}
                       <div className="row mb-3">
                     <div className="col-md-6">
                <label className="form-label">Role / Position</label>
                <select
                  name="role"
                  className={`form-select ${errors.role ? "is-invalid" : ""}`}
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="">-- Select Role --</option>
                  <option value="Tester">Tester</option>
                  <option value="Software Developer">Software Developer</option>
                  <option value="Java Developer">Java Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">
                    Full Stack Developer
                  </option>
                </select>
                <div className="invalid-feedback">{errors.role}</div>
              </div>

      
              {/* //snehal code */}
             
  <div className="col-md-6">
    <label className="form-label">Date</label>
    <input
      type="date"
      name="date"
      min={today}
      className={`form-control ${errors.date ? "is-invalid" : ""}`}
      value={formData.date}
      onChange={handleChange}
    />
    <div className="invalid-feedback">{errors.date}</div>
  </div>
  </div>

<div className="row mb-3">
  <div className="col-12 col-md-6">
    <label className="form-label">Start Time</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
  <TimePicker
    value={formData.startTime ? dayjs(formData.startTime, "HH:mm") : null}
    onChange={(v) => {
      const start = v ? v.format("HH:mm") : "";
      let duration = formData.duration;

      if (start && formData.endTime) {
        const startDate = new Date(`1970-01-01T${start}`);
        const endDate = new Date(`1970-01-01T${formData.endTime}`);

        if (endDate > startDate) {
          const diffMs = endDate - startDate;
          const diffMins = Math.floor(diffMs / 60000);
          const hours = Math.floor(diffMins / 60);
          const minutes = diffMins % 60;

          duration =
            hours > 0
              ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
              : `${minutes} minutes`;
        }
      }

      setFormData((p) => ({
        ...p,
        startTime: start,
        duration: duration,
      }));
    }}

    viewRenderers={{
      hours: renderTimeViewClock,
      minutes: renderTimeViewClock,
    }}

    slotProps={{
      textField: {
        fullWidth: true,
        size: "small",
      },
    }}
  />
</LocalizationProvider>
    <div className="invalid-feedback">{errors.startTime}</div>
  </div>

  <div className="col-12 col-md-6">
       <label className="form-label">End Time</label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
  <TimePicker
    value={formData.endTime ? dayjs(formData.endTime, "HH:mm") : null}
    onChange={(v) => {
      const end = v ? v.format("HH:mm") : "";
      let duration = "";

      if (formData.startTime && end) {
        const startDate = new Date(`1970-01-01T${formData.startTime}`);
        const endDate = new Date(`1970-01-01T${end}`);

        if (endDate > startDate) {
          const diffMs = endDate - startDate;
          const diffMins = Math.floor(diffMs / 60000);
          const hours = Math.floor(diffMins / 60);
          const minutes = diffMins % 60;

          duration =
            hours > 0
              ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
              : `${minutes} minutes`;
        }
      }

      setFormData((p) => ({
        ...p,
        endTime: end,
        duration: duration,
      }));
    }}

    viewRenderers={{
      hours: renderTimeViewClock,
      minutes: renderTimeViewClock,
    }}

    slotProps={{
      textField: {
        fullWidth: true,
        size: "small",
      },
    }}
  />
</LocalizationProvider>
    <div className="invalid-feedback">{errors.endTime}</div>
  </div>
</div>

  <div className="mb-3">
    <label className="form-label">Duration</label>
    <input
      type="text"
      className="form-control"
      value={formData.duration}
      disabled
    />
  </div>

{/* //snehal code */}
              {/* Interviewer */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Interviewer</label>
                  <select
                    name="interviewerId"
                    className={`form-select ${errors.interviewer ? "is-invalid" : ""}`}
                    value={formData.interviewerId}
                    onChange={handleChange}
                  >
                    <option value="">-- Select Interviewer --</option>
                    {employees.map((emp) => (
                      <option
                        key={emp._id}
                        value={emp._id}
                        data-name={emp.name}
                      >
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">{errors.interviewer}</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Interview Type</label>
                  <select
                    name="interviewType"
                    className="form-select"
                    value={formData.interviewType}
                    onChange={handleChange}
                  >
                    <option>Online</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>

              {/* Resume */}
              <div className="mb-3">
                <label className="form-label">Upload Resume</label>
                {/* Existing Resume Preview */}
                {formData.resumeUrl && !formData.resume &&(
                  <div className="mb-2">
                    <a
                      href={formData.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn btn-sm custom-outline-btn mb-3"
                    >
                      View Current Resume
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  name="resume"
                  className={`form-control ${errors.resume ? "is-invalid" : ""}`}
                  accept=".pdf,.doc,.docx"
                  onChange={handleChange}
                />
                {/* 🔥 THIS LINE — ONLY FOR UPDATE */}
                {editingId ? (
                  <small className="text-muted">
                    Upload only if you want to replace existing resume
                  </small>
                ) : (
                  <small className="text-muted">
                    Allowed formats: PDF, DOC, DOCX | Max size: 2MB
                  </small>
                )}
                <div className="invalid-feedback">{errors.resume}</div>
              </div>

              {/* Link */}
              {formData.interviewType === "Online"&&<div className="mb-3">
                <label className="form-label">Interview Link</label>
                <input
                  type="text"
                  name="link"
                  className={`form-control ${errors.link ? "is-invalid" : ""}`}
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="Enter meeting link"
                />
                <div className="invalid-feedback">{errors.link}</div>
              </div>}

              {/* Status */}
              {editingId && (<div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  name="manualStatus"
                  className={`form-select ${errors.status ? "is-invalid" : ""}`}
                  value={formData.manualStatus}
                  onChange={handleChange}
                >
                  <option value="">-- Select Status --</option>

                  {/* <option value="Scheduled">Scheduled</option>
                  <option value="On-going">On-going</option> */}
                  <option value="Cancelled">Cancelled</option>
                  {/* <option value="Completed">Completed</option> */}
                  <option value="Not-completed">Not-completed</option>
                </select>
                <div className="invalid-feedback">{errors.status}</div>
              </div>)}

              <div className="mb-3">
                <label className="form-label">Comment / Remark</label>
                <textarea
                  name="comment"
                  rows="3"
                  maxLength={500}
                  className="form-control"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Add comment (required for completed / cancelled/ Not-Completed)"
                />
                <div className="invalid-feedback">{errors.comment}</div>
                <small className="text-muted">Max 500 characters</small>
              </div>

              <button
                type="submit"
                className="btn btn-sm custom-outline-btn mb-3"
                disabled={isSubmitting}
              >
                 {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {editingId ? "Saving....":"Scheduling..."}
                    </>
                  ) : (
                    editingId ? "Update Interview" : "Schedule Interview"
                  )}
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* ================= MANAGER STYLE TABLE ================= */}
      {showTable && (
        <>
          {/* FILTER */}
          <div className="card mb-4 mt-3 shadow-sm border-0">
            <div className="card-body">
              <form
                className="row g-2 align-items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilters();
                }}
              >
                <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                  <label
                    className="fw-bold mb-0 text-start text-md-end"
                    style={{ fontSize: "16px", color: "#3A5FBE" }}
                  >
                    Status
                  </label>
                  <select
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

                <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                  <label
                    className="fw-bold mb-0 text-start text-md-end"
                    style={{
                      fontSize: "16px",
                      color: "#3A5FBE",
                      minWidth: "50px",
                      marginRight: "8px",
                    }}
                  >
                    From
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ minWidth: "140px" }}
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                  <label
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
                    type="date"
                    className="form-control"
                    style={{ minWidth: "140px" }}
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
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

          {/* TABLE */}
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
                    ...(user?.role === "hr" ? ["Action"] : []),
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
                      key={i}
                      onClick={() => {
                        if (item.status!=="Cancelled") setSelected(item)
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
                      {/* jaicy */}
                      <td style={tdStyle()}>{formatTo12Hour(item.startTime)}</td>
                      <td style={tdStyle()}>{item.interviewType}</td>
                      <td style={tdStyle()}>{item.interviewerName}</td>
                      <td style={tdStyle()}>
                        {/* {item.status !== "Completed" &&
                        item.status !== "Cancelled" &&
                        item.status !== "Not-completed" &&
                        item.link ? (
                          <a href={item.link} target="_blank" rel="noreferrer"onClick={(e) => e.stopPropagation()}> */}
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
                        {/* //Rushikesh code */}
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
    padding: "6px 14px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "110px",
    textAlign: "center",
    whiteSpace: "nowrap"
  }}
>
  {item.status}
</span>
               
                </td>
                 {user?.role === "hr" && (
                      <td style={tdStyle()}>
                        {/* {item.status !== "On-going" && ( */}
                          <div className="d-flex gap-2">
                            {/* Update Button */}
                            <button
                              type="button"
                              title={
                                ["Completed", "Cancelled"].includes(item.status)
                                  ? "Cannot modify completed or cancelled interviews"
                                  : ""
                              }
                              className="btn custom-outline-btn btn-sm"
                              style={{ width: 80 }}
                              disabled={["Completed", "Cancelled"].includes(item.status)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(null);
                                setFormData({
                                  ...item,
                                  resume: null, // new upload optional
                                  resumeUrl:
                                    item.resume || item.resumeUrl || null, // 🔥 FIX
                                });
                                setEditingId(item._id);
                                setShowForm(true);
                                setErrors({});
                              }}
                            >
                              Update
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              title={
                                ["Completed", "Cancelled"].includes(item.status)
                                  ? "Cannot modify completed or cancelled interviews"
                                  : ""
                              }
                              className="btn btn-sm btn-outline-danger"
                              disabled={["Completed", "Cancelled"].includes(item.status)}
                              onClick={(e) => {
                                e.stopPropagation(); // row click / popup prevent
                                handleDeleteInterview(item._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        {/* )} */}
                      </td>
                      )}
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
            style={{ width: "650px",marginLeft:500 }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Interview Details</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelected(null)}
                />
              </div>

              <div className="modal-body">
                {Object.entries({
                  "Interview ID": selected.interviewId,
                  Candidate: selected.candidateName,
                  Role: selected.role,
                  Date: formatDate(selected.date),
                  Time: formatTo12Hour(selected.startTime),
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
                      <a href={selected.link} target="_blank" rel="noreferrer"onClick={(e) => e.stopPropagation()}> */}
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
                            href={`${selected.resumeUrl}?fl_attachment=false`}
                            target="_blank"
                            rel="noreferrer"
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
                    <span
                      className={
                        "badge text-capitalize " +
                        (selected.status === "Completed"
                          ? "bg-success"
                          : selected.status === "Cancelled"
                            ? "bg-danger"
                            : selected.status === "Scheduled"
                              ? "bg-primary"
                              : selected.status === "On-going"
                                ? "bg-warning text-dark"
                                : selected.status === "Not-completed"
                                  ? "bg-secondary"
                                  : "bg-secondary")
                      }
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 500,
                        borderRadius: "4px",
                      }}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* Comment / Remark */}
                {selected?.comment && (
                  <div className="row mb-2">
                    <div className="col-4 fw-semibold">Comment</div>
                    <div className="col-8">
                      <div
                        className="p-2 border rounded bg-light"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {selected.comment}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{ width: 90 }}
                  onClick={() => setSelected(null)}
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

export default HRScheduleInterview;
