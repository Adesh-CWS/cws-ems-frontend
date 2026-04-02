import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const HRFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const formModalRef = useRef(null);
  const detailsModalRef = useRef(null);
  ///active tab code Dip 03-02-2026
  const [activeTab, setActiveTab] = useState("received");
  // Pagination state
  const [currentPageSent, setCurrentPageSent] = useState(1);
  const [currentPageReceived, setCurrentPageReceived] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    receiverId: "",
    title: "",
    message: "",
  });
  const [dateSearch, setDateSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "All",
    date: "",
  });
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );
        const userData = JSON.parse(jsonPayload);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
      fetchFeedbacks();
    }
  }, [currentUser]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axios.get(
        "http://localhost:8000/getAllEmployees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data) {
        const nonHREmployees = response.data.filter(
          (emp) => emp.role !== "hr" && emp._id !== currentUser?._id,
        );
        setEmployees(nonHREmployees || []);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token || !currentUser?._id) {
        console.log("Missing token or user ID");
        return;
      }

      const response = await axios.get(
        `http://localhost:8000/feedback/employee/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data && response.data.success) {
        const apiFeedbacks = (response.data.feedbacks || []).map((fb) => {
          const isSent = fb.sender?._id === currentUser._id;

          return {
            id: fb._id,
            feedbackId:
              fb.feedbackId ||
              `FDB${fb._id ? fb._id.toString().slice(-6) : "000000"}`,
            employeeName: !isSent ? fb.sender?.name : fb.receiver?.name,
            designation: !isSent
              ? fb.sender?.designation
              : fb.receiver?.designation,
            assignedTo: fb.receiver?.name,
            date: fb.createdAt
              ? new Date(fb.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
            status: fb.status === "viewed" ? "Viewed" : "Pending",
            title: fb.title || "No Title",
            description: fb.message || "No Message",
            type: isSent ? "sent" : "received",
            receiverId: fb.receiver?._id,
            receiverName: fb.receiver?.name,
            senderName: fb.sender?.name,
            senderId: fb.sender?._id,
            readAt: fb.readAt
              ? new Date(fb.readAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : null,
            originalStatus: fb.status,
          };
        });

        setFeedbacks(apiFeedbacks);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setFeedbacks([]);
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!editId && !formData.receiverId) {
      newErrors.receiverId = "Please select an employee or manager";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const markAsViewed = async (feedbackId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }

      const response = await axios.put(
        `http://localhost:8000/feedback/view/${feedbackId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        setFeedbacks((prevFeedbacks) =>
          prevFeedbacks.map((fb) =>
            fb.id === feedbackId
              ? {
                  ...fb,
                  status: "Viewed",
                  readAt: new Date().toLocaleString("en-GB"),
                  originalStatus: "viewed",
                }
              : fb,
          ),
        );

        if (selectedFeedback && selectedFeedback.id === feedbackId) {
          setSelectedFeedback((prev) => ({
            ...prev,
            status: "Viewed",
            readAt: new Date().toLocaleString("en-GB"),
          }));
        }
      }
    } catch (err) {
      console.error("Error marking feedback as viewed:", err);
    }
  };

  const handleSearch = () => {
    setAppliedFilters({
      search: searchText,
      status: statusFilter,
      date: dateSearch,
    });
  };

  const handleReset = () => {
    setSearchText("");
    setStatusFilter("All");
    setDateSearch("");
    setAppliedFilters({
      search: "",
      status: "All",
      date: "",
    });
  };

  const sentFeedbacks = feedbacks.filter((fb) => fb.type === "sent");
  const receivedFeedbacks = feedbacks.filter((fb) => fb.type === "received");

  const filteredReceivedFeedbacks = receivedFeedbacks.filter((fb) => {
    const q = appliedFilters.search.toLowerCase();
    const dateQ = appliedFilters.date;
    const matchesText =
      q === "" ||
      (fb.feedbackId && fb.feedbackId.toLowerCase().includes(q)) ||
      (fb.employeeName && fb.employeeName.toLowerCase().includes(q)) ||
      (fb.designation && fb.designation.toLowerCase().includes(q)) ||
      (fb.title && fb.title.toLowerCase().includes(q)) ||
      (fb.status && fb.status.toLowerCase().includes(q));
    let matchesDate = true;
    if (dateQ) {
      const fbDateStr = fb.date;
      const fbDate = new Date(fbDateStr.split(" ").reverse().join(" "));
      const selectedDate = new Date(dateQ);

      matchesDate =
        fbDate.getFullYear() === selectedDate.getFullYear() &&
        fbDate.getMonth() === selectedDate.getMonth() &&
        fbDate.getDate() === selectedDate.getDate();
    }

    const matchesStatus =
      appliedFilters.status === "All" || fb.status === appliedFilters.status;
    return matchesText && matchesStatus && matchesDate;
  });

  const filteredSentFeedbacks = sentFeedbacks.filter((fb) => {
    const q = appliedFilters.search.toLowerCase();
    const dateQ = appliedFilters.date;
    const matchesText =
      q === "" ||
      (fb.feedbackId && fb.feedbackId.toLowerCase().includes(q)) ||
      (fb.employeeName && fb.employeeName.toLowerCase().includes(q)) ||
      (fb.designation && fb.designation.toLowerCase().includes(q)) ||
      (fb.title && fb.title.toLowerCase().includes(q)) ||
      (fb.status && fb.status.toLowerCase().includes(q));
    let matchesDate = true;
    if (dateQ) {
      const fbDateStr = fb.date;
      const fbDate = new Date(fbDateStr.split(" ").reverse().join(" "));
      const selectedDate = new Date(dateQ);

      matchesDate =
        fbDate.getFullYear() === selectedDate.getFullYear() &&
        fbDate.getMonth() === selectedDate.getMonth() &&
        fbDate.getDate() === selectedDate.getDate();
    }

    const matchesStatus =
      appliedFilters.status === "All" || fb.status === appliedFilters.status;
    return matchesText && matchesStatus && matchesDate;
  });

  //  show data based on active tab  dip(03-02-2026)
  const currentFeedbacks =
    activeTab === "received"
      ? filteredReceivedFeedbacks
      : filteredSentFeedbacks;
  const currentPage =
    activeTab === "received" ? currentPageReceived : currentPageSent;
  const setCurrentPage =
    activeTab === "received" ? setCurrentPageReceived : setCurrentPageSent;

  const totalPages = Math.ceil(currentFeedbacks.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    currentFeedbacks.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const paginatedFeedbacks = currentFeedbacks.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => (
    // currentPage,
    // totalPages,
    // totalItems,
    // indexOfFirstItem,
    // indexOfLastItem,
    // setPage, //  remove commented code dip(03-02-2026)
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
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
        {/* change total items to currentfeedback.length dip 03-02-2026 */}
        <span style={{ fontSize: "14px", marginLeft: "16px" }}>
          {currentFeedbacks.length === 0
            ? "0–0 of 0"
            : `${indexOfFirstItem + 1}-${Math.min(
                indexOfLastItem,
                currentFeedbacks.length,
              )} of ${currentFeedbacks.length}`}
        </span>

        <div
          className="d-flex align-items-center"
          style={{ marginLeft: "16px" }}
        >
          <button
            className="btn btn-sm focus-ring"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ fontSize: "18px", padding: "2px 8px" }}
          >
            ‹
          </button>
          <button
            className="btn btn-sm focus-ring"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ fontSize: "18px", padding: "2px 8px" }}
          >
            ›
          </button>
        </div>
      </div>
    </nav>
  );

  const openAddForm = () => {
    setEditId(null);
    setFormData({ receiverId: "", title: "", message: "" });
    setShowForm(true);
  };

  const openEditForm = (fb, e) => {
    if (e) e.stopPropagation();
    setEditId(fb.id);
    setFormData({
      receiverId: fb.receiverId || "",
      title: fb.title,
      message: fb.description,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!formData.title || !formData.message || !formData.receiverId) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login first");
        setSending(false);
        return;
      }

      let response;

      if (editId) {
        response = await axios.put(
          `http://localhost:8000/feedback/edit/${editId}`,
          {
            title: formData.title,
            message: formData.message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        response = await axios.post(
          "http://localhost:8000/feedback/send",
          {
            receiverId: formData.receiverId,
            title: formData.title,
            message: formData.message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (response.data.success) {
        await fetchFeedbacks();
        alert(
          editId
            ? "Feedback updated successfully"
            : "Feedback sent successfully",
        );
        setShowForm(false);
        setEditId(null);
        setCurrentPageSent(1);
      } else {
        alert(
          response.data.message ||
            (editId ? "Failed to update feedback" : "Failed to send feedback"),
        );
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert(
        err.response?.data?.message ||
          (editId ? "Failed to update feedback" : "Failed to send feedback"),
      );
    } finally {
      setSending(false);
    }
  };

  const openFeedbackModal = async (feedback) => {
    setSelectedFeedback(feedback);

    if (feedback.type === "received" && feedback.status === "Pending") {
      await markAsViewed(feedback.id);
    }
  };

  const handleRowClick = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await axios.delete(`http://localhost:8000/feedback/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFeedbacks(feedbacks.filter((f) => f.id !== id));
        setCurrentPageSent(1);
        alert("Feedback deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert("Failed to delete feedback");
    }
  };
  console.log("Active Tab:", activeTab);

  /////Disable background scroll
  useEffect(() => {
    if (showForm || selectedFeedback) {
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
  }, [showForm, selectedFeedback]);
  ///Auto focus modal when it opens
  useEffect(() => {
    if (showForm && formModalRef.current) {
      formModalRef.current.focus();
    }

    if (selectedFeedback && detailsModalRef.current) {
      detailsModalRef.current.focus();
    }
  }, [showForm, selectedFeedback]);
  useEffect(() => {
    const modal = showForm
      ? formModalRef.current
      : selectedFeedback
        ? detailsModalRef.current
        : null;

    if (!modal) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setSelectedFeedback(null);
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm, selectedFeedback]);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px" }}>Feedback</h2>
        <button
          className="btn btn-sm custom-outline-btn"
          onClick={openAddForm}
          style={{ minWidth: 140 }}
        >
          Add New Feedback
        </button>
      </div>
      {/* Tab switchinng buttons Dip 03-02-2026 */}
      <div className="d-flex gap-2 justify-content-center mt-3 mb-3">
        <button
          onClick={() => {
            setActiveTab("received");
            setCurrentPageReceived(1);
          }}
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 150 }}
        >
          Received Feedback
        </button>

        <button
          onClick={() => {
            setActiveTab("sent");
            setCurrentPageSent(1);
          }}
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 150 }}
        >
          Sent Feedback
        </button>
      </div>

      {/* Searchfilter  */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "5px",
                  minWidth: "50px",
                }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Viewed">Viewed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="searchInput"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "5px",
                }}
              >
                Search
              </label>
              <input
                id="searchInput"
                type="text"
                className="form-control"
                placeholder="Search by any field..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="dateInput"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  // marginRight: "15px", 
                  minWidth: "40px",
                }}
              >
                Date
              </label>
              <input
                id="dateInput"
                type="date"
                className="form-control"
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
                style={{ minWidth: "140px" }}
              />
            </div>

            <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 justify-content-end">
              <button
                type="submit"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                {/* Search */}
                Filter
              </button>
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                onClick={handleReset}
                style={{ minWidth: 90 }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONDITIONAL RENDERING BASED ON ACTIVE TAB dipali 03-02-2026 */}
      {currentFeedbacks.length === 0 ? (
        <div className="text-center py-4">
          <p style={{ color: "#6c757d", fontSize: "16px" }}>
            No {activeTab} feedback yet.
          </p>
        </div>
      ) : (
        <>
          <div
            className="table-responsive mt-3 "
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <table
              className="table table-hover mb-0"
              style={{ borderCollapse: "collapse" }}
            >
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Feedback ID
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {activeTab === "received" ? "From" : "To"}{" "}
                    {/*change dip 03-02-2026 */}
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Designation
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
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
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Title
                  </th>
                  {/* //added by Rushikesh */}
                  {/* Add activ tab code dip 03-02-2026 */}
                  {activeTab === "received" && (
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Description
                    </th>
                  )}
                  {activeTab === "sent" && (
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Change to paginatedfeedback dip 03-02-2026*/}
                {paginatedFeedbacks.map((fb) => (
                  //addeed by Rushikesh
                  <tr
                    key={fb.id}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e9ecef";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => handleRowClick(fb)}
                  >
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.feedbackId}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.employeeName}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.designation || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.date}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.status === "Viewed" ? (
                        <span
                          style={{
                            backgroundColor: "#d1f2dd",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "inline-block",
                            width: "100px",
                            textAlign: "center",
                          }}
                        >
                          Viewed
                        </span>
                      ) : (
                        <span
                          style={{
                            backgroundColor: "#fff3cd",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "inline-block",
                            width: "100px",
                            textAlign: "center",
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fb.title}
                    </td>
                    {/* //added by Rushikesh */}
                    {activeTab === "received" && (
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          maxWidth: "250px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {fb.description}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* TAB SWTICHING CHANGES DIP 03-02-2026 */}
                      {activeTab === "received" && "sent" ? (
                        <button
                          className="btn btn-sm custom-outline-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFeedbackModal(fb);
                          }}
                          style={{ minWidth: "80px", padding: "5px 10px" }}
                        >
                          View
                        </button>
                      ) : (
                        <div
                          className="d-flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-sm custom-outline-btn"
                            onClick={(e) => {
                              if (fb.status === "Pending") {
                                openEditForm(fb, e);
                              }
                            }}
                            style={{
                              padding: "5px 10px",
                              minWidth: "70px",
                              opacity: fb.status === "Viewed" ? 0.6 : 1,
                              cursor:
                                fb.status === "Viewed"
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            disabled={fb.status === "Viewed"}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => handleDelete(fb.id, e)}
                            style={{ padding: "5px 10px", minWidth: "70px" }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {
            renderPagination()
            // currentPageReceived,
            // totalPagesReceived,
            // filteredReceivedFeedbacks.length,
            // indexOfFirstItemReceived,
            // indexOfLastItemReceived,
            // handlePageChangeReceived, remove all of this dip 03-02-2026
          }
        </>
      )}

      {/* Modal */}
      {showForm && (
        <div
          ref={formModalRef}
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
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
            className="modal-dialog"
            style={{ maxWidth: "500px", width: "95%", marginTop: "80px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  {editId ? "Edit Feedback" : "Send New Feedback"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setFormData({ receiverId: "", title: "", message: "" });
                    setErrors({});
                  }}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setErrors({ ...errors, title: "" });
                    }}
                    placeholder="Enter feedback title"
                  />

                  {errors.title && (
                    <small className="text-danger">{errors.title}</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Send To</label>
                  {editId ? (
                    <div className="form-control bg-light">
                      {employees.find((emp) => emp._id === formData.receiverId)
                        ?.name || "Employee"}
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={formData.receiverId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          receiverId: e.target.value,
                        });
                        setErrors({ ...errors, receiverId: "" });
                      }}
                    >
                      <option value="">Select Employee/Manager</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.designation || "No Designation"}
                        </option>
                      ))}
                    </select>
                  )}

                  {errors.receiverId && (
                    <small className="text-danger">{errors.receiverId}</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    maxLength={300}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setErrors({ ...errors, message: "" });
                    }}
                    placeholder="Enter feedback message"
                  />
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
                    {formData.message.length}/300
                  </div>

                  {errors.message && (
                    <small className="text-danger">{errors.message}</small>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{minWidth:"90px"}} 
                  onClick={handleSubmit}
                  disabled={sending || (!editId && employees.length === 0)}
                >
                  {sending
                    ? editId
                      ? "Updating..."
                      : "Sending..."
                    : editId
                      ? "Update Feedback"
                      : "Send Feedback"}
                </button>
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{minWidth:"90px"}}
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setErrors({});
                    setFormData({ receiverId: "", title: "", message: "" });
                  }}
                  disabled={sending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedFeedback && (
        <div
          ref={detailsModalRef}
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
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
             className="modal-dialog modal-dialog-centered" 
             style={{ maxWidth: "600px", width: "95%"}}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Feedback Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedFeedback(null)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Feedback ID
                    </div>
                    <div className="col-sm-8 col-5">
                      {selectedFeedback.feedbackId}
                    </div>
                  </div>

                  {selectedFeedback.type === "received" ? (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-4 fw-semibold">From</div>
                      <div className="col-sm-8 col-5">
                        {selectedFeedback.employeeName}
                      </div>
                    </div>
                  ) : (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-4 fw-semibold">To</div>
                      <div className="col-sm-8 col-5">
                        {selectedFeedback.employeeName}
                      </div>
                    </div>
                  )}

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Designation
                    </div>
                    <div className="col-sm-8 col-5">
                      {selectedFeedback.designation || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Date</div>
                    <div className="col-sm-8 col-5">
                      {selectedFeedback.date}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Status</div>
                    <div className="col-sm-8 col-5">
                      <span
                        className={`badge ${
                          selectedFeedback.status === "Viewed"
                            ? "bg-success"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {selectedFeedback.status}
                      </span>
                    </div>
                  </div>

                  {selectedFeedback.readAt && (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-4 fw-semibold">
                        Viewed At
                      </div>
                      <div className="col-sm-8 col-5">
                        {selectedFeedback.readAt}
                      </div>
                    </div>
                  )}

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">Title</div>
                    <div className="col-sm-8 col-5">
                      {selectedFeedback.title}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-4 fw-semibold">
                      Description
                    </div>
                    <div
                      className="col-sm-8 col-5"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedFeedback.description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn custom-outline-btn btn-sm"
                  style={{minWidth:"90px"}} 
                  onClick={() => setSelectedFeedback(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => {
            if (activeTab === "sent") {
              setActiveTab("received");
              setCurrentPage(1);
            } else {
              window.history.go(-1);
            }
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default HRFeedback;
