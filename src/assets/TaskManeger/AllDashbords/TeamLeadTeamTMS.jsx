import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const TeamLeadTeamTMS = ({ user }) => {

    // ---------- Stat Cards Data ----------
  const initialTaskStats = [
    { title: "Total Teams", count: 0, color: "#D1ECF1" },
    { title: "Total Managers", count: 0, color: "#FFB3B3" },
    { title: "Total Employees", count: 0, color: "#FFE493" },
    { title: "Total Departments", count: 0, color: "#D7F5E4" },
  ];

  // ---------- Teams Table Data ----------
  const initialTeamsData = [];

  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [taskStats, setTaskStats] = useState(initialTaskStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [departments, setDepartments] = useState([]);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const normalizeDepartment = (value) => {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();

    if (v.startsWith("it")) return "IT";
    if (v.includes("finance")) return "Finance";
    if (v.includes("qa") || v.includes("test")) return "QA";
    if (v.includes("ui")) return "UI/UX";

    return value.trim();
  };

  const popupRef = useRef(null);
  useEffect(() => {
    if (selectedTeam && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedTeam]);

  const trapFocus = (e) => {
    if (!popupRef.current) return;

    const focusableElements = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
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
    }
  };

  useEffect(() => {
    if (!user || !user._id) return;

    const fetchData = async () => {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      Promise.all([
        // Fetch teams data
        fetch(`http://localhost:8000/api/teams/user/${user._id}/teams`)
          .then((res) => res.json()),
        
        // Fetch members count for this team lead
        fetch(`http://localhost:8000/${user._id}/members`)
          .then((res) => res.json())
          .catch(err => {
            console.warn("Members API failed:", err);
            return { success: false, totalMembers: 0, members: [] };
          }),
        
        // Fetch departments
        axios.get("http://localhost:8000/getAllDepartments"),
      ])
        .then(([teamRes, membersRes, deptRes]) => {
          if (!teamRes.success) return;

          const teams = teamRes.data.map((team) => ({
            _id: team._id,
            teamName: team.name,
            projectName: team.project?.projectName || team.project?.name || "N/A",
            managerName: Array.isArray(team.project?.managers) && team.project.managers.length
              ? team.project.managers.map((m) => m.name).join(", ")
              : "N/A",
            teamLeadName: Array.isArray(team.teamLead) && team.teamLead.length
              ? team.teamLead.map((lead) => lead.name).join(", ")
              : "N/A",
            totalMembers: team.assignToProject?.length || 0,
            assignToProject: team.assignToProject || [],
            department: team.department,
          }));

          const totalEmployees = membersRes.success ? membersRes.totalMembers : 0;

          const normalizedDepartments = deptRes.data.departments?.map((d) => normalizeDepartment(d)) || [];
          const uniqueDepartments = [...new Set(normalizedDepartments)];

          setDepartments(uniqueDepartments);
          setAllTeams(teams);
          setFilteredTeams(teams);

          updateStats(teams, uniqueDepartments, totalEmployees);
        })
        .catch((error) => console.error("API Error:", error));
    };

    fetchData();
  }, [user]);

  const applyFilters = () => {
    let temp = [...allTeams];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      temp = temp.filter(
        (team) =>
          team.teamName.toLowerCase().includes(query) ||
          team.managerName.toLowerCase().includes(query) ||
          team.teamLeadName.toLowerCase().includes(query) ||
          team.department.toLowerCase().includes(query) ||
          team.totalMembers.toString().includes(query) ||
          team.projectName.toLowerCase().includes(query),
      );
    }

    setFilteredTeams(temp);
    setCurrentPage(1);
  };

  // ================== Stats Logic ==================

  const updateStats = (teams, departments, totalEmployees) => {
    const managers = new Set();

    teams.forEach((team) => {
      if (team.managerName && team.managerName !== "N/A") {
        team.managerName.split(",").forEach((m) => managers.add(m.trim()));
      }
    });

    setTaskStats([
      { title: "Total Teams", count: teams.length, color: "#D1ECF1" },
      { title: "Total Managers", count: managers.size, color: "#FFB3B3" },
      { title: "Total Employees", count: totalEmployees, color: "#FFE493" },
      {
        title: "Total Departments",
        count: departments.length,
        color: "#D7F5E4",
      },
    ]);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilteredTeams([...allTeams]);
    setCurrentPage(1);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredTeams.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleRowClick = (team) => {
    setSelectedTeam(team);
  };

  const isAnyPopupOpen = !!selectedTeam;
  useEffect(() => {
    if (isAnyPopupOpen) {
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
  }, [isAnyPopupOpen]);

  return (
    <div className="container-fluid">
      <h3 className="mb-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Teams
      </h3>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {taskStats.map((team, i) => (
          <div className="col-12 col-md-6 col-lg-3" key={i}>
            <div
              className="p-3 rounded shadow-sm border-0"
              style={{
                backgroundColor: "#fff",
                height: "100%",
              }}
            >
              <div
                className="d-flex align-items-center"
                style={{ gap: "16px" }}
              >
                <h4
                  className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: team.color,
                    minWidth: "70px",
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3A5FBE",
                  }}
                >
                  {team.count}
                </h4>

                {/* Title */}
                <p
                  className="mb-0 fw-semibold"
                  style={{
                    fontSize: "18px",
                    color: "#3A5FBE",
                    textAlign: "left",
                  }}
                >
                  {team.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            {/* Search Input - Search by any field */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="searchQuery"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "60px" }}
              >
                Search
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="submit"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Teams Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
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
                  Team Name
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
                  Project Name
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
                  Manager name
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
                  Team Lead
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
                  Total Members
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
                  Department
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-4"
                    style={{ color: "#212529" }}
                  >
                    No teams found.
                  </td>
                </tr>
              ) : (
                currentTeams.map((team) => (
                  <tr
                    key={team._id}
                    onClick={() => handleRowClick(team)}
                    style={{ cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <h6 className="mb-0 fw-normal">{team.teamName}</h6>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span>{team.projectName}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span>{team.managerName}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">{team.teamLeadName}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">{team.totalMembers}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">{team.department}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span
              style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}
            >
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

          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {filteredTeams.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredTeams.length
              }`}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={trapFocus}
          className="modal fade show"
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
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Team Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedTeam(null)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Team Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.teamName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Project Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.projectName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Team Lead
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.teamLeadName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Total Members
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.totalMembers}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Team Members
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.assignToProject?.length > 0
                        ? selectedTeam.assignToProject.map((emp) => (
                          <div key={emp._id}>{emp.name}</div>
                        ))
                        : "NA"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Department
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam.department}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setSelectedTeam(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
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
};

export default TeamLeadTeamTMS;