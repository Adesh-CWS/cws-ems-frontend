import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function AllEmployeeRegularizationRequestForAdmin({ showBackButton = true }) {
  const [regularizations, setRegularizations] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // NEW: Status,name date filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [filteredRegularizations, setFilteredRegularizations] = useState([]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!selectedRequest || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedRequest(null);
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
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

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRequest]);
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const isModalOpen = selectedRequest;

    if (isModalOpen) {
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
  }, [selectedRequest]);
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(
        "http://localhost:8000/attendance/regularization/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      //Added by Jaicy
      // ✅ Sort newest first (based on createdAt or request date)
      // 🔒 STRICT last 3 months (rolling window)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      // ✅ FILTER BY DATE FIRST
      const lastThreeMonthsData = res.data.filter((req) => {
        const recordDate = new Date(
          req.regularizationRequest?.requestedAt || req.createdAt || req.date,
        );
        recordDate.setHours(0, 0, 0, 0);

        return recordDate >= threeMonthsAgo && recordDate <= today;
      });

      // ✅ SORT NEWEST FIRST
      const sortedData = lastThreeMonthsData.sort(
        (a, b) =>
          new Date(
            b.regularizationRequest?.requestedAt || b.createdAt || b.date,
          ) -
          new Date(
            a.regularizationRequest?.requestedAt || a.createdAt || a.date,
          ),
      );

      const filtered = sortedData.filter(
        (rec) =>
          rec?.regularizationRequest &&
          (rec.regularizationRequest.checkIn ||
            rec.regularizationRequest.checkOut),
      );

      setRegularizations(filtered);
      setFilteredRegularizations(filtered);

      // Calculate counts
      setApprovedCount(
        filtered.filter((r) => r.regularizationRequest.status === "Approved")
          .length,
      );
      setRejectedCount(
        filtered.filter((r) => r.regularizationRequest.status === "Rejected")
          .length,
      );
      setPendingCount(
        filtered.filter((r) => r.regularizationRequest.status === "Pending")
          .length,
      );
    } catch (err) {
      console.error("Error fetching regularizations", err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `http://localhost:8000/attendance/regularization/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchData();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Something went wrong while applying regularization.";

      alert(`❌ ${errorMessage}`);
      // setMessage(errorMessage);
    }
  };

  // const formatTime = (dateString) =>
  //   dateString ? new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

  // Pagination calculations
  //Added by Jaicy
  const formatToIST = (utcDateString) => {
    const date = new Date(utcDateString);
    return date
      .toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  };

  // ---------- SORTING ----------
  const sortedRegularizations = [...regularizations].sort((a, b) => {
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
  useEffect(() => {
    const sorted = [...regularizations].sort((a, b) => {
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

    setFilteredRegularizations(sorted);
  }, [regularizations]);

  // ---------- PAGINATION ----------
  // const totalPages = Math.ceil(sortedRegularizations.length / itemsPerPage);
  // const indexOfLastItem = Math.min(currentPage * itemsPerPage, sortedRegularizations.length);
  // const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  // const currentRegularizations = sortedRegularizations.slice(
  //   indexOfFirstItem,
  //   indexOfLastItem
  // );

  const totalPages = Math.ceil(filteredRegularizations.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredRegularizations.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentRegularizations = filteredRegularizations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  //   const totalPages = Math.ceil(regularizations.length / itemsPerPage);
  //   const indexOfLastItem = Math.min(currentPage * itemsPerPage, regularizations.length);
  //   const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  //   const currentRegularizations = regularizations.slice(indexOfFirstItem, indexOfLastItem);
  // console.log("currentRegularizations",currentRegularizations)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  console.log("regularizations", regularizations);

  // NEW: Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  console.log("regularizations", regularizations);

  //new code Added by Jaicy
  const applyFilters = () => {
    const filtered = regularizations.filter((reg) => {
      // ✅ Status filter
      const matchesStatus =
        statusFilter === "All" ||
        reg?.regularizationRequest?.status === statusFilter;

      // ✅ Name filter
      const employeeName = reg?.employee?.name || "";
      const matchesName = employeeName
        .toLowerCase()
        .includes(employeeNameFilter.toLowerCase());

      // ✅ Date filter (FIXED)
      const recordDate = new Date(reg.date);

      const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
      if (fromDate) fromDate.setHours(0, 0, 0, 0);

      const toDate = dateToFilter ? new Date(dateToFilter) : null;
      if (toDate) toDate.setHours(23, 59, 59, 999);

      const matchesDateFrom = fromDate ? recordDate >= fromDate : true;
      const matchesDateTo = toDate ? recordDate <= toDate : true;

      return matchesStatus && matchesName && matchesDateFrom && matchesDateTo;
    });

    setFilteredRegularizations(filtered);
    setCurrentPage(1);
  };
  console.log("currentRegularizations", currentRegularizations);
  console.log("filter", filteredRegularizations);
  console.log("currentRegularizations", currentRegularizations);
  return (
    <div className="container-fluid">
      <h3 className="mb-4 ms-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Regularization
      </h3>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex  align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#D7F5E4",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {approvedCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Accepted Regularization Requests
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex  align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#F8D7DA",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {rejectedCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Rejected Regularization Requests
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex  align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#FFE493",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pendingCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Pending Regularization Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {regularizations.length === 0 ? (
        <div className="alert alert-info">
          No regularization requests found.
        </div>
      ) : (
        <>
          {/* NEW: Status Filter Dropdown */}
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body">
              <form
                className="row g-2 align-items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilters();
                }}
              >
                {/* Status Filter */}
                <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                  <label
                    htmlFor="statusFilter"
                    className="fw-bold mb-0 text-start text-md-end" //mahesh code
                    style={{
                      // mahesh code style change
                      width: "55px",
                      minWidth: "55px",
                      fontSize: "16px",
                      color: "#3A5FBE",
                      marginRight: "4px", // mahesh
                    }}
                  >
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    className="form-select"
                    style={{ flex: 1, minWidth: "140px" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                {/* Name Filter */}
                <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                  <label
                    htmlFor="employeeNameFilter"
                    className="fw-bold mb-0 text-start text-md-end" //mahesh code
                    style={{
                      // mahesh code style change
                      width: "55px",
                      minWidth: "55px",
                      fontSize: "16px",
                      color: "#3A5FBE",
                      marginRight: "4px", // mahesh
                    }}
                  >
                    Name
                  </label>
                  <input
                    id="employeeNameFilter"
                    type="text"
                    className="form-control"
                    style={{ flex: 1, minWidth: "140px" }}
                    value={employeeNameFilter}
                    onChange={(e) => setEmployeeNameFilter(e.target.value)}
                    placeholder="Employee name"
                  />
                </div>
                {/* From Date Filter */}
                <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                  <label
                    htmlFor="dateFromFilter"
                    className="fw-bold mb-0 text-start text-md-end" //mahesh code
                    style={{
                      // mahesh code style change
                      width: "55px",
                      minWidth: "55px",
                      fontSize: "16px",
                      color: "#3A5FBE",
                      marginRight: "4px", // mahesh
                    }}
                  >
                    From
                  </label>
                  <input
                    type="date"
                    id="dateFromFilter"
                    className="form-control"
                    style={{ flex: 1, minWidth: "140px" }}
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>
                {/* To Date Filter */}
                <>
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                    <label
                      htmlFor="dateToFilter"
                      className="fw-bold mb-0 text-start text-md-end" //mahesh code
                      style={{
                        // mahesh code style change
                        width: "55px",
                        minWidth: "55px",
                        fontSize: "16px",
                        color: "#3A5FBE",
                        marginRight: "4px", // mahesh
                      }}
                    >
                      To
                    </label>
                    <input
                      type="date"
                      id="dateToFilter"
                      className="form-control "
                      style={{ flex: 1, minWidth: "140px" }}
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      // style={{flex: 1}} (if not using Bootstrap utility)
                    />
                  </div>
                </>

                {/* Filter and Reset Buttons */}
                <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
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
                    onClick={() => {
                      setStatusFilter("All");
                      setEmployeeNameFilter("");
                      setDateFromFilter("");
                      setDateToFilter("");
                      setCurrentPage(1);
                      setFilteredRegularizations(regularizations);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="card shadow-sm border-0">
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* NEW: Show message when no results */}
                  {currentRegularizations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-4"
                        style={{ color: "#6c757d" }}
                      >
                        No regularization requests found with status "
                        {statusFilter}"
                      </td>
                    </tr>
                  ) : (
                    currentRegularizations.map((rec) => {
                      // const checkInTime = rec.checkIn || rec?.regularizationRequest?.checkIn;
                      // const checkOutTime = rec.checkOut || rec?.regularizationRequest?.checkOut;
                      const checkInTime =
                        rec?.regularizationRequest?.checkIn || rec?.checkIn;
                      const checkOutTime =
                        rec?.regularizationRequest?.checkOut || rec?.checkOut;
                      ///new code a
                      const employeeId = rec?.employee?.employeeId ?? "N/A";
                      const employeeName = rec?.employee?.name ?? "N/A";
                      console.log("rec", rec);
                      return (
                        <tr
                          key={rec._id}
                          onClick={() => setSelectedRequest(rec)}
                          className="align-middle"
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
                            {employeeId}
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
                            {employeeName
                              ? employeeName
                                  .split(" ")
                                  .map(
                                    (w) =>
                                      w.charAt(0).toUpperCase() +
                                      w.slice(1).toLowerCase(),
                                  )
                                  .join(" ")
                              : ""}
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
                              rec.regularizationRequest.requestedAt,
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
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
                            {new Date(rec.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
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
                            {formatToIST(checkInTime)}
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
                            {formatToIST(checkOutTime)}
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
                            {rec.mode?.trim().toLowerCase() === "office"
                              ? "WFO"
                              : rec.mode}
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
                            {rec?.regularizationRequest?.status ===
                            "Approved" ? (
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
                            ) : rec?.regularizationRequest?.status ===
                              "Rejected" ? (
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
                                  backgroundColor: "#FFE493",
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
                          {/* //Added by Jaicy */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rec?.regularizationRequest?.status ===
                            "Pending" ? (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-success me-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(rec._id, "Approved");
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(rec._id, "Rejected");
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <div>
                                <span style={{ fontSize: "13px" }}>-</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL code */}
          {selectedRequest && (
            <div
              className="modal fade show"
              ref={modalRef}
              tabIndex="-1"
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
                className="modal-dialog "
                style={{ maxWidth: "650px", width: "95%", marginTop: "80px" }}
              >
                <div className="modal-content">
                  {/* Header */}
                  <div
                    className="modal-header text-white"
                    style={{ backgroundColor: "#3A5FBE" }}
                  >
                    <h5 className="modal-title mb-0">
                      Regularization Request Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedRequest(null)}
                    />
                  </div>

                  {/* Body */}
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row mb-2">
                        <div className="col-sm-3 fw-semibold">Employee ID</div>
                        <div className="col-sm-9">
                          {selectedRequest.employee?.employeeId || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Date</div>
                        <div className="col-7 col-sm-9">
                          {new Date(selectedRequest.date).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Apply Date
                        </div>
                        <div className="col-7 col-sm-9">
                          {new Date(
                            selectedRequest.regularizationRequest.requestedAt,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Check-In
                        </div>
                        <div className="col-7 col-sm-9">
                          {formatToIST(
                            selectedRequest.checkIn ||
                              selectedRequest?.regularizationRequest?.checkIn,
                          )}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">
                          Check-Out
                        </div>
                        <div className="col-7 col-sm-9">
                          {formatToIST(
                            selectedRequest.checkOut ||
                              selectedRequest?.regularizationRequest?.checkOut,
                          )}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Mode</div>
                        <div className="col-7 col-sm-9">
                          {selectedRequest.mode?.trim().toLowerCase() ===
                          "office"
                            ? "WFO"
                            : selectedRequest.mode || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-sm-3 fw-semibold col-5">Reason</div>
                        <div
                          className="col-sm-9 col-7"
                          style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {selectedRequest?.regularizationRequest?.reason ||
                            "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-3 fw-semibold">Status</div>
                        <div className="col-7 col-sm-9">
                          <span
                            className={
                              "badge text-capitalize " +
                              (selectedRequest?.regularizationRequest
                                ?.status === "Approved"
                                ? "bg-success"
                                : selectedRequest?.regularizationRequest
                                      ?.status === "Rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark")
                            }
                          >
                            {selectedRequest?.regularizationRequest?.status ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {/* <div className="modal-footer border-0 pt-0">
                    {(selectedRequest?.regularizationRequest?.status === "Pending" ||
                      selectedRequest?.regularizationRequest?.status === "Rejected") && (
                        <button
                          className="btn btn-outline-danger me-2"
                          onClick={() => {
                            handleDelete(selectedRequest._id);
                            setSelectedRequest(null);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </button>
                  </div> */}
                  <div className="modal-footer border-0 pt-0">
                    {selectedRequest?.regularizationRequest?.status ===
                      "Pending" && (
                      <>
                        <button
                         className="btn btn-sm btn-outline-success"
                           style={{ width: 90 }}
                          onClick={() => {
                            handleStatusChange(selectedRequest._id, "Approved");
                            setSelectedRequest(null);
                          }}
                        >
                          Approve
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                           style={{ width: 90 }}
                          onClick={() => {
                            handleStatusChange(selectedRequest._id, "Rejected");
                            setSelectedRequest(null);
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {/* <button
                      className="btn btn-outline-danger"


                      onClick={() => {
                        handleDelete(selectedRequest._id);
                        setSelectedRequest(null);
                      }}
                    >
                      Delete
                    </button> */}

                    <button
                      className="btn btn-sm custom-outline-btn" // mahesh code close
                      style={{ width: 90 }}
                      onClick={() => {
                        // handleDelete(selectedRequest._id);
                        setSelectedRequest(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
            <div className="d-flex align-items-center gap-3">
              {/* Rows per page */}
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

              {/* Range display */}
              {/*  new Range display */}
              <span style={{ fontSize: "14px", marginLeft: "16px" }}>
                {filteredRegularizations.length > 0 ? indexOfFirstItem + 1 : 0}-
                {indexOfLastItem} of {filteredRegularizations.length}{" "}
                {/* new change */}
              </span>

              {/* Navigation arrows */}
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

          {/* <div className="text-end mt-3">
        <button
          className="btn btn-primary mt-3"
        
          onClick={() => window.history.go(-1)}
        >
          ← Back
        </button>
      </div> */}

          {showBackButton && (
            <div className="text-end mt-3">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => window.history.go(-1)}
              >
                Back
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AllEmployeeRegularizationRequestForAdmin;
