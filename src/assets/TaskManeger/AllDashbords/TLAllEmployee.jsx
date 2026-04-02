import React, { useEffect, useState } from "react";
import axios from "axios";

function TLAllEmployee({ teamLeadId: propTeamLeadId, onClose, onViewTasks }) {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamLeadId, setTeamLeadId] = useState(propTeamLeadId);

  // Search state
  const [searchText, setSearchText] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Safe guard for pagination data
  const tasks = Array.isArray(filteredMembers) ? filteredMembers : [];

  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = tasks.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (propTeamLeadId) {
        setTeamLeadId(propTeamLeadId);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };

        const userRes = await axios.get("https://ems-cws-test.vercel.app/me", {
          headers,
        });
        const user = userRes.data;
        
        if (user && user._id) {
          setTeamLeadId(user._id);
        } else {
          console.error("Could not get user ID");
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, [propTeamLeadId]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        
        if (!teamLeadId) {
          console.log("Waiting for teamLeadId...");
          return;
        }

        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };

        const response = await axios.get(`https://ems-cws-test.vercel.app/${teamLeadId}/members`, {
          headers
        });

        console.log("Team Members Response:", response.data);

        if (response.data.success) {
          const membersData = response.data.members || [];
          setMembers(membersData);
          setFilteredMembers(membersData);
        } else {
          console.error("Failed to fetch members:", response.data.message);
          setMembers([]);
          setFilteredMembers([]);
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error);
        setMembers([]);
        setFilteredMembers([]);
      } finally {
        setLoading(false);
      }
    };

    if (teamLeadId) {
      fetchTeamMembers();
    }
  }, [teamLeadId]);


  const handleRowClick = (member) => {
    setSelectedMember(member);
  };

  const handleSearch = () => {
    const value = searchText.toLowerCase().trim();

    if (!value) {
      setFilteredMembers(members);
      setCurrentPage(1);
      return;
    }

    const filtered = members.filter((member) => {
      const name = member.name?.toLowerCase() || "";
      const employeeId = member.employeeId?.toString().toLowerCase() || "";
      const email = member.email?.toLowerCase() || "";
      const designation = member.designation?.toLowerCase() || "";

      return (
        name.includes(value) ||
        employeeId.includes(value) ||
        email.includes(value) ||
        designation.includes(value)
      );
    });

    setFilteredMembers(filtered);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchText("");
    setFilteredMembers(members);
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontSize: "25px", color: "#3A5FBE" }}>
          My Team Members        </h4>
        
      </div>

      {/* Filter section */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 14, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Search
              </label>

              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search By Any Field..."
                className="form-control form-control-sm"
                style={{ flex: 1 }}
              />
            </div>

            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleSearch}
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleResetSearch}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Date of Joining</th>
              </tr>
            </thead>

            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4" style={{ color: "#212529" }}>
                    No team members found.
                  </td>
                </tr>
              ) : (
                currentMembers.map((member) => (
                  <tr
                    key={member._id}
                    style={{ cursor: "default" }}
                    onClick={() => handleRowClick(member)}
                  >
                    <td style={tdStyle}>{member.name || "-"}</td>
                    <td style={tdStyle}>{member.employeeId || "-"}</td>
                    <td style={tdStyle}>{member.email || "-"}</td>
                    <td style={tdStyle}>{member.contact || "-"}</td>
                    <td style={tdStyle}>{member.designation || "-"}</td>
                    <td style={tdStyle}>
                      {member.doj
                        ? new Date(member.doj).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredMembers.length > 0 && (
        <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <span style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}>
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

            <span style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}>
              {filteredMembers.length === 0
                ? "0–0 of 0"
                : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredMembers.length}`}
            </span>

            <div className="d-flex align-items-center" style={{ marginLeft: "16px" }}>
              <button
                className="btn btn-sm border-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
              >
                ‹
              </button>
              <button
                className="btn btn-sm border-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* modal */}
      {selectedMember && (
        <div
          className="modal fade show"
          style={{
            display: "flex",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Team Member Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedMember(null)}
                />
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Employee Name
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedMember?.name || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Employee ID
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedMember?.employeeId || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Email
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{
                        color: "#212529",
                        wordBreak: "break-all",
                        overflowWrap: "anywhere",
                        minWidth: 0,
                      }}
                    >
                      {selectedMember?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Mobile No
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedMember?.contact || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Designation
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedMember?.designation || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Date of Joining
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedMember?.doj
                        ? new Date(selectedMember.doj).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setSelectedMember(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
  color: "#212529",
};

export default TLAllEmployee;