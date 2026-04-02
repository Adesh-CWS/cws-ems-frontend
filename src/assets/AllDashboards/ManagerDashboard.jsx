import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function ManagerDashboard({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  // change date format
  const df = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // "31 Dec 2025" [web:9][web:20][web:1]
  const leaveModalRef = useRef(null);
  const regularizationModalRef = useRef(null);
  // Pagination states
  const [leavePage, setLeavePage] = useState(1);
  const [regPage, setRegPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Leave filters
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("All");
  const [leaveNameFilter, setLeaveNameFilter] = useState("");
  const [leaveDateFromFilter, setLeaveDateFromFilter] = useState("");
  const [leaveDateToFilter, setLeaveDateToFilter] = useState("");

  // Regularization filters
  const [regStatusFilter, setRegStatusFilter] = useState("All");
  const [regNameFilter, setRegNameFilter] = useState("");
  const [regDateFromFilter, setRegDateFromFilter] = useState("");
  const [regDateToFilter, setRegDateToFilter] = useState("");

  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filteredRegularizations, setFilteredRegularizations] = useState([]);

  // aditya code
  const [selectedLeave, setSelectedLeave] = useState(null);
  //Harshada  code
  const [selectedRegularization, setSelectedRegularization] = useState(null);

  useEffect(() => {
    setFilteredLeaves(leaves);
    setFilteredRegularizations(regularizations);
  }, [leaves, regularizations]);

  useEffect(() => {
    if (!user?._id) return;

    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const leavesRes = await axios.get(
        `https://ems-cws-test.vercel.app/leaves/manager/${user._id}`,
      );
      setLeaves(leavesRes.data);

      const regRes = await axios.get(
        `https://ems-cws-test.vercel.app/regularization/manager/${user._id}`,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      const lastThreeMonthsData = regRes.data.filter((req) => {
        const recordDate = new Date(
          req.regularizationRequest?.requestedAt || req.createdAt || req.date,
        );
        recordDate.setHours(0, 0, 0, 0);

        return recordDate >= threeMonthsAgo && recordDate <= today;
      });

      const sortedData = lastThreeMonthsData.sort(
        (a, b) =>
          new Date(
            b.regularizationRequest?.requestedAt || b.createdAt || b.date,
          ) -
          new Date(
            a.regularizationRequest?.requestedAt || a.createdAt || a.date,
          ),
      );

      setRegularizations(sortedData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Update Leave Status =====
  const updateLeaveStatus = async (leaveId, status) => {
    //added by rutuja
    if (!confirm(`Are you sure you want to ${status} this leave request?`)) {
      return;
    }
    try {
      // 🔥 Optimistic UI update
      setLeaves((prev) =>
        prev.map((l) => (l._id === leaveId ? { ...l, status } : l)),
      );

      setFilteredLeaves((prev) =>
        prev.map((l) => (l._id === leaveId ? { ...l, status } : l)),
      );

      if (selectedLeave?._id === leaveId) {
        setSelectedLeave((prev) => ({ ...prev, status }));
      }

      await axios.put(`https://ems-cws-test.vercel.app/leave/${leaveId}/status`, {
        status,
        userId: user._id,
        role: "manager",
      });
      //Added by Rutuja
      alert(`Leave request ${status} successfully!`);
    } catch (err) {
      console.error("Error updating leave status:", err);
    }
  };

  // ===== Update Regularization Status jaicy=====
  const updateRegularizationStatus = async (attendanceId, status) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `https://ems-cws-test.vercel.app/attendance/regularization/${attendanceId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
      //jaicy
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Something went wrong while updating status.";

      alert(`❌ ${errorMessage}`);
      setMessage(errorMessage);
    }
  };

  // if (loading) return <p>Loading data...</p>;
  <div
    className="d-flex flex-column justify-content-center align-items-center"
    style={{ minHeight: "100vh" }}
  >
    <div
      className="spinner-grow"
      role="status"
      style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
      Loading ...
    </p>
  </div>;

  // // ===== Pagination Logic =====
  // const totalLeavePages = Math.ceil(leaves.length / itemsPerPage);
  // const totalRegPages = Math.ceil(regularizations.length / itemsPerPage);

  // const indexOfLastLeave = leavePage * itemsPerPage;
  // const indexOfFirstLeave = indexOfLastLeave - itemsPerPage;
  // const paginatedLeaves = leaves.slice(indexOfFirstLeave, indexOfLastLeave);

  // const indexOfLastReg = regPage * itemsPerPage;
  // const indexOfFirstReg = indexOfLastReg - itemsPerPage;
  // const paginatedRegularizations = regularizations.slice(
  //   indexOfFirstReg,
  //   indexOfLastReg
  // );

  // ===== Pagination Logic =====
  // const totalLeavePages = Math.ceil(leaves.length / itemsPerPage);
  // const totalRegPages = Math.ceil(regularizations.length / itemsPerPage);

  const totalLeavePages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const totalRegPages = Math.ceil(
    filteredRegularizations.length / itemsPerPage,
  );

  const indexOfLastLeave = leavePage * itemsPerPage;
  const indexOfFirstLeave = indexOfLastLeave - itemsPerPage;
  const sortedLeaves = [...filteredLeaves].sort(
    (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
  );

  const paginatedLeaves = sortedLeaves.slice(
    indexOfFirstLeave,
    indexOfLastLeave,
  );

  // Step 1: calculate first and last index
  const indexOfLastReg = regPage * itemsPerPage;
  const indexOfFirstReg = indexOfLastReg - itemsPerPage;

  // Step 2: sort regularizations by appliedAt descending (latest first)
  // const sortedRegularizations = [...regularizations].sort(
  //   (a, b) =>
  //     new Date(b.regularizationRequest.appliedAt || b.createdAt) -
  //     new Date(a.regularizationRequest.appliedAt || a.createdAt)
  // );

  const sortedRegularizations = [...filteredRegularizations].sort((a, b) => {
    const aDate =
      a?.regularizationRequest?.requestedAt ||
      a?.regularizationRequest?.createdAt ||
      a?.createdAt ||
      a?.date;

    const bDate =
      b?.regularizationRequest?.requestedAt ||
      b?.regularizationRequest?.createdAt ||
      b?.createdAt ||
      b?.date;

    return new Date(bDate) - new Date(aDate);
  });

  // Step 3: paginate
  const paginatedRegularizations = sortedRegularizations.slice(
    indexOfFirstReg,
    indexOfLastReg,
  );

  // ===== Pagination Component =====
  const renderPagination = (
    currentPage,
    totalPages,
    totalItems,
    indexOfFirstItem,
    indexOfLastItem,
    setPage,
  ) => (
    <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
      <div className="d-flex align-items-center gap-3">
        {/* Rows per page dropdown */}
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

        {/* Page range display */}
        <span style={{ fontSize: "14px", marginLeft: "16px" }}>
          {totalItems === 0
            ? "0–0 of 0"
            : `${indexOfFirstItem + 1}-${Math.min(
                indexOfLastItem,
                totalItems,
              )} of ${totalItems}`}
        </span>

        {/* Navigation arrows */}
        <div
          className="d-flex align-items-center"
          style={{ marginLeft: "16px" }}
        >
          <button
            className="btn btn-sm focus-ring"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ fontSize: "18px", padding: "2px 8px" }}
          >
            ‹
          </button>
          <button
            className="btn btn-sm focus-ring"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ fontSize: "18px", padding: "2px 8px" }}
          >
            ›
          </button>
        </div>
      </div>
    </nav>
  );

  console.log(paginatedRegularizations);
  console.log("paginatedLeaves", paginatedLeaves);

  {
    /* Add helper function at the top of component (below imports) */
  }
  const formatToIST = (utcDateString) => {
    if (!utcDateString) return "-";
    const date = new Date(utcDateString);
    return date
      .toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true, // 24-hour format
      })
      .toUpperCase();
  };

  //filtercode logic
  const applyLeaveFilters = () => {
    let temp = [...leaves];

    // Filter by status
    if (leaveStatusFilter !== "All") {
      temp = temp.filter(
        (l) => l.status.toLowerCase() === leaveStatusFilter.toLowerCase(),
      );
    }

    // Filter by employee name
    if (leaveNameFilter.trim()) {
      temp = temp.filter((l) =>
        l.employee?.name
          .toLowerCase()
          .includes(leaveNameFilter.trim().toLowerCase()),
      );
    }

    // Filter by date range
    if (leaveDateFromFilter) {
      temp = temp.filter(
        (l) => new Date(l.dateFrom) >= new Date(leaveDateFromFilter),
      );
    }
    if (leaveDateToFilter) {
      temp = temp.filter(
        (l) => new Date(l.dateTo) <= new Date(leaveDateToFilter),
      );
    }

    setFilteredLeaves(temp);
    setLeavePage(1);
  };

  const applyRegFilters = () => {
    let temp = [...regularizations];

    // Filter by status
    if (regStatusFilter !== "All") {
      temp = temp.filter(
        (r) =>
          (r.regularizationRequest?.status || "").toLowerCase() ===
          regStatusFilter.toLowerCase(),
      );
    }

    // Filter by employee name
    if (regNameFilter.trim()) {
      temp = temp.filter((r) =>
        r.employee?.name
          .toLowerCase()
          .includes(regNameFilter.trim().toLowerCase()),
      );
    }

    // Filter by date range
    if (regDateFromFilter) {
      temp = temp.filter(
        (r) => new Date(r.date) >= new Date(regDateFromFilter),
      );
    }
    if (regDateToFilter) {
      temp = temp.filter((r) => new Date(r.date) <= new Date(regDateToFilter));
    }

    setFilteredRegularizations(temp);
    setRegPage(1);
  };

  const resetLeaveFilters = () => {
    setLeaveStatusFilter("All");
    setLeaveNameFilter("");
    setLeaveDateFromFilter("");
    setLeaveDateToFilter("");
    setFilteredLeaves(leaves);
    setLeavePage(1);
  };

  const resetRegFilters = () => {
    setRegStatusFilter("All");
    setRegNameFilter("");
    setRegDateFromFilter("");
    setRegDateToFilter("");
    setFilteredRegularizations(regularizations);
    setRegPage(1);
  };

  ///end
  useEffect(() => {
    const modal = selectedLeave
      ? leaveModalRef.current
      : selectedRegularization
        ? regularizationModalRef.current
        : null;

    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // Auto focus first element
    // firstEl.focus();

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

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
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLeave, selectedRegularization]);

  //bg scroll stop
  useEffect(() => {
    if (selectedLeave || selectedRegularization) {
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
  }, [selectedLeave, selectedRegularization]);
  // dip code changes 09-02-2026
  return (
    <div className="container-fluid">
      {/* ==================== Leave Requests ==================== */}
      <h2
        className="mb-4"
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
        }}
      >
        Leave Requests Assigned to You
      </h2>

      {/* filter code */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyLeaveFilters(); // or applyRegFilters
            }}
            style={{ justifyContent: "space-between" }}
          >
            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="leaveStatusFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                }}
              >
                Status
              </label>
              <select
                id="leaveStatusFilter"
                className="form-select"
                style={{ minWidth: 100 }}
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Name Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="leaveNameFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                }}
              >
                Name
              </label>
              <input
                id="leaveNameFilter"
                type="text"
                className="form-control"
                value={leaveNameFilter}
                onChange={(e) => setLeaveNameFilter(e.target.value)}
                placeholder="Employee name"
                style={{ minWidth: 150 }}
              />
            </div>

            {/* From Date */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="leaveDateFromFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                }}
              >
                From
              </label>
              <input
                id="leaveDateFromFilter"
                type="date"
                className="form-control"
                value={leaveDateFromFilter}
                onChange={(e) => setLeaveDateFromFilter(e.target.value)}
                placeholder="dd-mm-yyyy"
                style={{ minWidth: 140 }}
              />
            </div>

            <style>
              {`
    .form-label-responsive {
      display: inline-block;
      width: 50px;
      min-width: 50px;
      text-align: left;
      margin-right: 0;
    }
    @media (min-width: 768px) {
      .form-label-responsive {
        width: 20px !important;
        min-width:20px !important;
        margin-right: 8px !important;
      }
    }
    `}
            </style>

            {/* To Date */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="leaveDateToFilter"
                className="form-label-responsive fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                }}
              >
                To
              </label>
              <input
                id="leaveDateToFilter"
                type="date"
                className="form-control"
                value={leaveDateToFilter}
                onChange={(e) => setLeaveDateToFilter(e.target.value)}
                placeholder="dd-mm-yyyy"
                style={{ minWidth: 140 }}
              />
            </div>

            {/* Buttons */}
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
                onClick={resetLeaveFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* filter code end*/}

      {leaves.length === 0 ? (
        <p>No leaves assigned to you.</p>
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
                      padding: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ID
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
                    Employee
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
                    Apply Date
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
                    Leave Type
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
                    From
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
                    To
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
                    Duration
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
                    Reason
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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        fontStyle: "italic",
                        color: "#888",
                      }}
                    >
                      No leave records available.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaves.map((l) => (
                    <tr
                      onClick={() => setSelectedLeave(l)}
                      key={l._id}
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
                        {l.employee?.employeeId}
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
                        {l.employee?.name}
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
                        {df.format(new Date(l.appliedAt))}
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
                        {l.leaveType}
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
                        {df.format(new Date(l.dateFrom))}
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
                        {df.format(new Date(l.dateTo))}
                      </td>
                      {/* <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>{l.duration}</td> */}
                      <td
                        style={{
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.duration === "half"
                          ? 0.5
                          : Math.floor(
                              (new Date(l.dateTo) - new Date(l.dateFrom)) /
                                (1000 * 60 * 60 * 24),
                            ) + 1}
                      </td>
                      {/* <td style={{ padding: '12px', verticalAlign: 'middle', fontSize: '14px', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' }}>{l.reason}</td> */}

                      <td
                        style={{
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                          maxWidth: "220px",
                          wordBreak: "break-word",
                          overflow: "auto",
                        }}
                      >
                        {l.reason}
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
                        {l.status === "approved" ? (
                          <span
                            style={{
                              backgroundColor: "#d1f2dd",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: "500",
                              display: "inline-block",
                              width: "100px",
                              textAlign: "center",
                            }}
                          >
                            Approved
                          </span>
                        ) : l.status === "rejected" ? (
                          <span
                            style={{
                              backgroundColor: "#f8d7da",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: "500",
                              display: "inline-block",
                              width: "100px",
                              textAlign: "center",
                            }}
                          >
                            Rejected
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: "#fff3cd",
                              padding: "8px 16px",
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
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLeaveStatus(l._id, "approved");
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation(); // ✅ prevents modal open
                                updateLeaveStatus(l._id, "rejected");
                              }}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedLeave && (
            <div
              className="modal fade show"
              style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
            >
              <div
                className="modal-dialog modal-dialog-centered" 
                ref={leaveModalRef}
                style={{ maxWidth: "600px", width: "95%"}}
              >
                <div className="modal-content">
                  {/* Header */}
                  <div
                    className="modal-header text-white"
                    style={{ backgroundColor: "#3A5FBE" }}
                  >
                    <h5 className="modal-title mb-0">Leave Request Details</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedLeave(null)}
                    />
                  </div>

                  {/* Body */}
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Employee ID
                        </div>
                        <div className="col-sm-9 col-5">
                          {selectedLeave.employee?.employeeId || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Name</div>
                        <div className="col-sm-9 col-5">
                          {selectedLeave.employee?.name || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Apply Date
                        </div>
                        <div className="col-sm-9 col-5">
                          {df.format(new Date(selectedLeave.appliedAt))}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Leave Type
                        </div>
                        <div className="col-sm-9 col-5">
                          {selectedLeave.leaveType}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Date From
                        </div>
                        <div className="col-sm-9 col-5">
                          {df.format(new Date(selectedLeave.dateFrom))}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Date To
                        </div>
                        <div className="col-sm-9 col-5">
                          {df.format(new Date(selectedLeave.dateTo))}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Duration
                        </div>
                        <div className="col-sm-9 col-5">
                          {selectedLeave.duration}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Reason</div>
                        <div
                          className="col-sm-9 col-5"
                          style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {selectedLeave.reason || "-"}
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Status</div>
                        <div className="col-sm-9 col-5">
                          <span
                            className={
                              "badge text-capitalize " +
                              (selectedLeave.status === "approved"
                                ? "bg-success"
                                : selectedLeave.status === "rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark")
                            }
                          >
                            {selectedLeave.status}
                          </span>
                        </div>
                      </div>
                      {/* //Added by rutuja */}
                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          {selectedLeave.status === "approved"
                            ? "Approved by"
                            : selectedLeave.status === "rejected"
                              ? "Rejected by"
                              : "Reviewed by"}
                        </div>
                        <div className="col-sm-9 col-5">
                          {selectedLeave.approvedBy ? (
                            <>
                              {selectedLeave.approvedBy.name}
                              {selectedLeave.approvedBy.role &&
                                ` (${selectedLeave.approvedBy.role})`}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer border-0 pt-0">
                    {selectedLeave.status === "pending" && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-success"
                          style={{  minWidth:"90px" }}
                          onClick={() => {
                            updateLeaveStatus(selectedLeave._id, "approved");
                            setSelectedLeave(null);
                          }}
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{  minWidth:"90px" }}
                          onClick={() => {
                            updateLeaveStatus(selectedLeave._id, "rejected");
                            setSelectedLeave(null);
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-sm  custom-outline-btn"
                      style={{  minWidth:"90px" }}
                      onClick={() => setSelectedLeave(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination bar for Leave Table */}
          {renderPagination(
            leavePage,
            totalLeavePages,
            filteredLeaves.length, // Use filtered, not leaves.length!
            indexOfFirstLeave,
            indexOfLastLeave,
            setLeavePage,
          )}
        </>
      )}

      {/* ==================== Regularization Requests ==================== */}
      <h2
        className="mb-4"
        style={{
          color: "#3A5FBE",
          fontSize: "25px",

          marginTop: "20px",
        }}
      >
        Regularization Requests Assigned to You
      </h2>

      {regularizations.length === 0 ? (
        <p>No regularization requests assigned to you.</p>
      ) : (
        <>
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body">
              <form
                className="row g-2 align-items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyRegFilters(); // The filtering function for regularizations
                }}
                style={{ justifyContent: "space-between" }}
              >
                {/* Status Filter */}
                <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
                  <label
                    htmlFor="regStatusFilter"
                    className="fw-bold mb-0"
                    style={{
                      fontSize: "16px",
                      color: "#3A5FBE",
                      width: "50px",
                      minWidth: "50px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    id="regStatusFilter"
                    className="form-select"
                    style={{ minWidth: 100 }}
                    value={regStatusFilter}
                    onChange={(e) => setRegStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Name Filter */}
                <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
                  <label
                    htmlFor="regNameFilter"
                    className="fw-bold mb-0"
                    style={{
                      fontSize: "16px",
                      color: "#3A5FBE",
                      width: "50px",
                      minWidth: "50px",
                    }}
                  >
                    Name
                  </label>
                  <input
                    id="regNameFilter"
                    type="text"
                    className="form-control"
                    value={regNameFilter}
                    onChange={(e) => setRegNameFilter(e.target.value)}
                    placeholder="Employee name"
                    style={{ minWidth: 150 }}
                  />
                </div>

                {/* From Date */}
                <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
                  <label
                    htmlFor="regDateFromFilter"
                    className="fw-bold mb-0"
                    style={{
                      fontSize: "16px",
                      color: "#3A5FBE",

                      width: "50px",
                      minWidth: "50px",
                    }}
                  >
                    From
                  </label>
                  <input
                    id="regDateFromFilter"
                    type="date"
                    className="form-control"
                    value={regDateFromFilter}
                    onChange={(e) => setRegDateFromFilter(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    style={{ minWidth: 140 }}
                  />
                </div>

                <style>
                  {`
    .form-label-responsive {
      display: inline-block;
      width: 50px;
      min-width: 50px;
      text-align: left;
      margin-right: 0;
    }
    @media (min-width: 768px) {
      .form-label-responsive {
        width: 20px !important;
        min-width:20px !important;
        margin-right: 8px !important;
      }
    }
    `}
                </style>

                {/* To Date */}
                <div className="col-12 col-md-auto d-flex align-items-center mb-1">
                  <label
                    htmlFor="regDateToFilter"
                    className="form-label-responsive fw-bold mb-0"
                    style={{
                      fontSize: "16px",
                      color: "#3A5FBE",
                      width: "50px",
                      minWidth: "50px",
                    }}
                  >
                    To
                  </label>
                  <input
                    id="regDateToFilter"
                    type="date"
                    className="form-control"
                    value={regDateToFilter}
                    onChange={(e) => setRegDateToFilter(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    style={{ minWidth: 140 }}
                  />
                </div>

                {/* Buttons */}
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
                    onClick={resetRegFilters}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

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
                      padding: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ID
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
                    Employee
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
                    Apply Date
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
                    Date
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
                    Check-In
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
                    Check-Out
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
                    Mode
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
                  {/* <th>Requested At</th>
                <th>Reviewed By</th> */}
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
                {/* {paginatedRegularizations.map((r) => ( */}
                {paginatedRegularizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        fontStyle: "italic",
                        color: "#888",
                      }}
                    >
                      No regularization requests assigned to you.
                    </td>
                  </tr>
                ) : (
                  [...paginatedRegularizations].map((r) => (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRegularization(r)}
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
                        {r.employee?.employeeId}
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
                        {r.employee?.name}
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
                        {new Date(
                          r.regularizationRequest.requestedAt,
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
                        {df.format(new Date(r.date))}
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
                        {/* {r.regularizationRequest.checkIn
                        ? new Date(r.regularizationRequest.checkIn).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true, // uncomment for 24-hour clock, e.g., 17:05
                        }).toUpperCase()
                        : "-"} */}

                        {formatToIST(r?.regularizationRequest?.checkIn)}
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
                        {/* {r.regularizationRequest.checkOut
                        ? new Date(r.regularizationRequest.checkOut).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true, // uncomment for 24-hour clock, e.g., 17:05
                        }).toUpperCase()
                        : "-"} */}

                        {formatToIST(r?.regularizationRequest?.checkOut)}
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
                        {r.mode}
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
                        {r?.regularizationRequest?.status === "Approved" ? (
                          <span
                            style={{
                              backgroundColor: "#d1f2dd",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: "500",
                              display: "inline-block",
                              width: "100px",
                              textAlign: "center",
                            }}
                          >
                            Approved
                          </span>
                        ) : r?.regularizationRequest?.status === "Rejected" ? (
                          <span
                            style={{
                              backgroundColor: "#f8d7da",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: "500",
                              display: "inline-block",
                              width: "100px",
                              textAlign: "center",
                            }}
                          >
                            Rejected
                          </span>
                        ) : r?.regularizationRequest?.status === "Pending" ? (
                          <span
                            style={{
                              backgroundColor: "#fff3cd",
                              padding: "8px 16px",
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
                        ) : (
                          <span className="badge bg-secondary-subtle text-dark px-3 py-2">
                            N/A
                          </span>
                        )}
                      </td>
                      {/* <td>
                    {r.regularizationRequest.requestedAt
                      ? new Date(
                          r.regularizationRequest.requestedAt
                        ).toLocaleString()
                      : "-"}
                  </td>
                  <td>{r.regularizationRequest.approvedByName || "-"}</td> */}
                      <td
                        style={{
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.regularizationRequest.status === "Pending" ? (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => {
                                e.stopPropagation();
                                updateRegularizationStatus(r._id, "Approved");
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                e.stopPropagation();
                                updateRegularizationStatus(r._id, "Rejected");
                              }}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ========= Regularization Popup ========= */}
            {selectedRegularization && (
              <div
                className="modal fade show"
                style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  ref={regularizationModalRef}
                  style={{ maxWidth: "600px", width: "95%"}}
                >
                  <div className="modal-content">
                    {/* Header */}
                    <div
                      className="modal-header text-white"
                      style={{ backgroundColor: "#3A5FBE" }}
                    >
                      <h5 className="modal-title mb-0">
                        Regularization Details
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setSelectedRegularization(null)}
                      />
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                      <div className="container-fluid">
                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Employee ID
                          </div>
                          <div className="col-sm-9  col-5">
                            {selectedRegularization.employee?.employeeId || "-"}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">Name</div>
                          <div className="col-sm-9 col-5">
                            {selectedRegularization.employee?.name || "-"}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Apply Date
                          </div>
                          <div className="col-sm-9 col-5">
                            {selectedRegularization?.regularizationRequest
                              ?.requestedAt
                              ? df.format(
                                  new Date(
                                    selectedRegularization.regularizationRequest
                                      .requestedAt,
                                  ),
                                )
                              : "-"}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">Date</div>
                          <div className="col-sm-9 col-5">
                            {df.format(new Date(selectedRegularization.date))}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Check-In
                          </div>
                          <div className="col-sm-9 col-5">
                            {formatToIST(
                              selectedRegularization?.regularizationRequest
                                ?.checkIn,
                            )}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Check-Out
                          </div>
                          <div className="col-sm-9 col-5">
                            {formatToIST(
                              selectedRegularization?.regularizationRequest
                                ?.checkOut,
                            )}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">Mode</div>
                          <div className="col-sm-9 col-5">
                            {selectedRegularization?.mode || "-"}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Reason
                          </div>
                          <div
                            className="col-sm-9 col-5"
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {selectedRegularization?.regularizationRequest
                              ?.reason || "-"}
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-5 col-sm-3 fw-semibold">
                            Status
                          </div>
                          <div className="col-sm-9 col-5">
                            <span
                              className={
                                "badge text-capitalize " +
                                (selectedRegularization?.regularizationRequest
                                  ?.status === "Approved"
                                  ? "bg-success"
                                  : selectedRegularization
                                        ?.regularizationRequest?.status ===
                                      "Rejected"
                                    ? "bg-danger"
                                    : selectedRegularization
                                          ?.regularizationRequest?.status ===
                                        "Pending"
                                      ? "bg-warning text-dark"
                                      : "bg-secondary")
                              }
                            >
                              {selectedRegularization?.regularizationRequest
                                ?.status || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 pt-0">
                      {selectedRegularization?.regularizationRequest?.status?.toLowerCase() ===
                        "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-success"
                            style={{  minWidth:"90px" }}
                            onClick={() => {
                              updateRegularizationStatus(
                                selectedRegularization?._id,
                                "Approved",
                              );
                              setSelectedRegularization(null);
                            }}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{  minWidth:"90px" }}
                            onClick={() => {
                              updateRegularizationStatus(
                                selectedRegularization?._id,
                                "Rejected",
                              );
                              setSelectedRegularization(null);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{  minWidth:"90px" }}
                        onClick={() => setSelectedRegularization(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Pagination bar for Regularization Table */}
          {renderPagination(
            regPage,
            totalRegPages,
            filteredRegularizations.length, // Use filtered, not regularizations.length!
            indexOfFirstReg,
            indexOfLastReg,
            setRegPage,
          )}
        </>
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

export default ManagerDashboard;
