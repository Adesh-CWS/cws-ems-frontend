{
  /* //Added by Rushikesh */
}

import React, { useEffect, useState, useRef} from "react";
import axios from "axios";
const API_BASE = "http://localhost:8000";
const STORAGE_KEY = "hr_policy";
const ACK_KEY = "policy_ack_employee";

function EmployeePolicy({ user }) {
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // const employeeId = localStorage.getItem("employeeId");
  //const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?._id;
  const employeeName = user?.fullName || user?.name;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [ackData, setAckData] = useState([]);


  const modalRef = useRef(null);
  const isAnyModalOpen = showModal;

  // 🔹 Focus Trap Effect
  useEffect(() => {
    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // Set focus to modal when opened
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(false);
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
  }, [isAnyModalOpen]);

  useEffect(() => {
    const isModalOpen = !!showModal;
  
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
  }, [showModal]);



  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Load policies + acknowledgement----------------------------------
  useEffect(() => {
    fetchPolicies();  // always fetch policies

    if (employeeId) {
      fetchEmployeeAcknowledgements();
    }
  }, [employeeId]);
  const fetchPolicies = async () => {
    try {
      let url = `${API_BASE}/policy/get`;

      if (employeeId) {
        url += `?employeeId=${employeeId}`;
      }

      const res = await fetch(url);
      const result = await res.json();

      console.log("Policies:", result); // for debugging

      if (result.success) {
        setPolicies(result.data);
      }
    } catch (error) {
      console.error("Failed to load policies", error);
    }
  };

  const fetchEmployeeAcknowledgements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/policy/employee-ack/${employeeId}`
      );

      if (res.data.success) {
        setAckData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching acknowledgement", error);
    }
  };

  // 🔹 Acknowledge policy
  const handleAcknowledge = async (policyId) => {
    try {
      if (!employeeId || !employeeName) {
        alert("User not available");
        return;
      }

      const res = await axios.post(
        "http://localhost:8000/policy/acknowledge",
        {
          policyId,
          employeeId,
          employeeName,
        }
      );

      if (res.data.success) {
        alert("Policy acknowledged successfully");

        await fetchEmployeeAcknowledgements();  // 🔥 VERY IMPORTANT
        await fetchPolicies();                  // optional

        setShowModal(false);                    // close modal (optional)
      }
    } catch (error) {
      console.log(error.response?.data);
    }
  };
  const filteredPolicies = policies.filter((p) => {
    if (!searchText.trim()) return true;

    const q = searchText.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p._id?.toLowerCase().includes(q)
    );
  });

  const totalItems = filteredPolicies.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [search]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  const handleCopyPolicy = () => {
    if (!selectedPolicy) return;

    const textToCopy = `Policy Title: ${selectedPolicy.title}\n\n${selectedPolicy.description}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("Policy copied to clipboard");
    });
  };
  const handleDownloadPolicy = () => {
    if (!selectedPolicy) return;

    const content = `Policy Title: ${selectedPolicy.title}\n\n${selectedPolicy.description}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPolicy.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const uniqueTitles = [...new Set(policies.map((p) => p.title))];
  const thStyle = {
    fontWeight: "500",
    fontSize: "14px",
    color: "#6c757d",
    borderBottom: "2px solid #dee2e6",
    padding: "12px",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "12px",
    verticalAlign: "middle",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  };

  const isNewPolicy = (createdAt) => {
    const createdDate = new Date(createdAt);
    const today = new Date();

    const diffDays = (today - createdDate) / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  };

  const isUpdatedPolicy = (createdAt, updatedAt) => {
    if (!updatedAt) return false;
    return new Date(updatedAt) > new Date(createdAt);
  };

  const statusStyle = (status) => {
    switch (status) {
      case "Read":
        return {
          background: "#dcfce7",
          color: "#166534",
        };
      case "Pending":
        return {
          background: "#fde68a",
          color: "#92400e",
        };
      default:
        return {
          background: "#e5e7eb",
          color: "#374151",
        };
    }
  };

  // const getAckStatus = (policyId, userId) => {
  //   const stored = JSON.parse(localStorage.getItem("policy_ack_status")) || {};

  //   if (stored[policyId] && stored[policyId].includes(userId)) {
  //     return true;
  //   }

  //   return false;
  // };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB");
  };

  const formatDateDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getAckStatus = (policyId) => {
    return ackData.some(
      (ack) => ack.policyId === policyId
    );
  };

  return (
    <div className="container-fluid ">
      {/* mahesh code header change font size */}
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        Company Policies
      </h2>
      {/* 
            <div
                style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    marginBottom: "14px",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: isMobile ? "10px" : "12px",
                    flexWrap: "wrap",

                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden"
                }}

            >
                <strong
                    style={{
                        color: "#3A5FBE",
                        whiteSpace: "nowrap"
                    }}
                >
                    Search by any feild
                </strong>
                <input
                    type="text"
                    placeholder="Search by any feild..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        width: "320px",
                        height: "36px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        padding: "0 10px",
                        backgroundColor: "#ffffff",
                        boxSizing: "border-box"
                    }}
                />

             
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginLeft: isMobile ? "0" : "auto",
                        width: isMobile ? "100%" : "auto",
                        justifyContent: isMobile ? "flex-end" : "flex-start"
                    }}
                >
                    <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => {

                            setCurrentPage(1);
                        }}
                    >
                        Search
                    </button>

                    <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => {
                            setSearch("");
                            setCurrentPage(1);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
*/}
      <div className="card mb-3 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Search */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                className="mb-0 fw-bold"
                style={{
                  fontSize: 14,
                  color: "#3A5FBE",
                  whiteSpace: "nowrap",
                }}
              >
                Search
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Search by any field..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: "280px" }}
              />
            </div>

            {/* Buttons */}
            <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => {
                  setSearchText(searchInput);
                  setCurrentPage(1);
                }}
              >
                Search
              </button>

              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => {
                  setSearchInput("");
                  setSearchText("");
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 📋 Policy List */}
      {filteredPolicies.length === 0 && (
        <p style={{ color: "#6b7280" }}>No policies available</p>
      )}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
<thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr >
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
                    Policy Title
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
                    Description
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
                    Created Date
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
                    Updated Date
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
                    Uploaded File
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
              </tr>
            </thead>

            <tbody>
              {currentPolicies.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{ padding: "16px", textAlign: "center" }}
                  >
                    No policies available
                  </td>
                </tr>
              )}

              {currentPolicies.map((policy) => (
                <tr
                  key={policy._id}
                  onClick={() => {
                    setSelectedPolicy(policy);
                    setShowModal(true);
                  }}
                >       <td 
                      style={{     
                         padding: "10px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap", }}>
                    {policy.title}
                    {isNewPolicy(policy.createdAt) &&
                      !isUpdatedPolicy(policy.createdAt, policy.updatedAt) && (
                        <span
                          style={{
                            marginLeft: "8px",
                            //background: "#22c55e",
                            //color: "#ffffff",
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "6px",
                          }}
                        >
                          NEW
                        </span>
                      )}

                    {/* ✏️ UPDATED */}
                    {isUpdatedPolicy(policy.createdAt, policy.updatedAt) && (
                      <span
                        style={{
                          marginLeft: "8px",
                          //background: "#f97316",
                          //color: "#ffffff",
                          background: "#e0f2fe",
                          color: "#075985",
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        UPDATED
                      </span>
                    )}
                  </td>

                  <td style={tdStyle}>
                    <div
                      style={{
                        maxWidth: "250px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={policy.description} // optional: show full text on hover
                    >
                      {policy.description}
                    </div>
                  </td>

                  <td style={tdStyle}>{formatDateDisplay(policy.createdAt)}</td>
                  <td style={tdStyle}>{formatDateDisplay(policy.updatedAt)}</td>

                  <td style={tdStyle}>
                    {policy.image ? (
                      <a
                        href={`http://localhost:8000/uploads/${policy.image}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // 🚫 stop row click
                        style={{
                          color: "#3A5FBE",
                          fontWeight: 500,
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        📄 Download
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af" }}></span>
                    )}
                  </td>
                            <td style={tdStyle}>
                  {(() => {
                    const ack = getAckStatus(policy._id);

                    return ack ? (
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
                        Read
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
                    );
                  })()}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > 0 && (
        <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
          <div className="d-flex align-items-center gap-3">
            {/* Rows per page */}
            <div className="d-flex align-items-center">
              <span
                style={{
                  fontSize: "14px",
                  marginRight: "8px",
                  color: "#212529",
                }}
              >
                Rows per page:
              </span>

              <select
                className="form-select form-select-sm"
                style={{ width: "auto", fontSize: "14px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            {/* Range display */}
            <span
              style={{
                fontSize: "14px",
                marginLeft: "16px",
                color: "#212529",
              }}
            >
              {startIndex + 1}-{endIndex} of {totalItems}
            </span>

            {/* Arrows */}
            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm focus-ring"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: "#212529",
                }}
              >
                ‹
              </button>

              <button
                className="btn btn-sm focus-ring"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: "#212529",
                }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      )}

      {showModal &&
        selectedPolicy &&
        (() => {
          const ack = getAckStatus(selectedPolicy._id, employeeId);

          return (
            <div
              className="modal fade show"
              ref={modalRef}
              tabIndex="-1"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1050,
                overflowX: "auto",
                // padding: "20px",
              }}
            >
              <div
                className="modal-dialog modal-lg modal-dialog-centered"
                style={{ width: "600px" }}              >
                <div className="modal-content">
                  {/* HEADER */}
                  <div
                    className="modal-header text-white"
                    style={{
                      backgroundColor: "#3A5FBE",
                    }}
                  >
                    <h5 className="model-title mb-0">Company Policy</h5>
                    <button
                      className="btn-close btn-close-white p-1"
                      onClick={() => setShowModal(false)}
                    />
                  </div>

                  {/* BODY */}
                  <div className="modal-body">
                    <div className="mb-2 row">
                      <label className="col-4 form-label fw-semibold mb-0">
                        Policy Title
                      </label>
                      <div className="col-8">
                        <p className="mb-0">{selectedPolicy.title}</p>
                      </div>
                    </div>
                    <div className="mb-2 row">
                      <label className="col-4 form-label fw-semibold mb-0">
                        Description
                      </label>
                      <div className="col-8">
                        <p
                          className="mb-0"
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            lineHeight: "1.5",
                            maxHeight: "100px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            paddingRight: "6px",
                          }}
                        >
                          {selectedPolicy.description}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2 row">
                      <label className="col-4 form-label fw-semibold mb-0">
                        Created Date:
                      </label>
                      <div className="col-8">
                        <p className="mb-0">
                          {formatDateDisplay(selectedPolicy.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-2 row">
                      <label className="col-4 form-label fw-semibold mb-0">
                        Last Updated:
                      </label>
                      <div className="col-8">
                        <p className="mb-0">
                          {" "}
                          {formatDateDisplay(
                            selectedPolicy.updatedAt ||
                            selectedPolicy.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 
          <div
            className="mt-3 p-3"
            style={{
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <div>
              <strong>Version:</strong>{" "}
              {selectedPolicy.version || "1.0"}
            </div>
            <div className="mt-2">
              <strong>Created Date:</strong>{" "}
              {formatDateTime(selectedPolicy.createdAt)}
            </div>
            <div>
              <strong>Last Updated:</strong>{" "}
              {formatDateTime(
                selectedPolicy.updatedAt || selectedPolicy.createdAt
              )}
            </div>
          </div>
*/}
                    <hr />

                    {/* ACK SECTION */}
                    {!ack ? (
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() =>
                          handleAcknowledge(
                            selectedPolicy._id,
                            employeeId,
                            employeeName,
                          )
                        }
                      >
                        Read & Acknowledge
                      </button>
                    ) : (
                      <span className="fw-semibold text-success">
                        ✅ Read
                      </span>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                      {/* <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={handleCopyPolicy}
                      >
                        Copy
                      </button> */}

                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={handleDownloadPolicy}
                        style={{ minWidth: 90 }}
                      >
                        Download
                      </button>

                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: "90px" }}
                        onClick={() => setShowModal(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <div className="text-end mt-3">
        <button
          style={{ minWidth: 90 }}
          className="btn btn-sm custom-outline-btn"
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default EmployeePolicy;
