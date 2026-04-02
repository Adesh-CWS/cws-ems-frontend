import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const AdminTeamsTMS = () => {
  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const initialTaskStats = [
    { title: "Total Teams", color: "#D1ECF1", count: 0 },
    { title: "Total Managers", color: "#FFB3B3", count: 0 },
    { title: "Total Employees", color: "#FFE493", count: 0 },
    { title: "Total Departments", color: "#D7F5E4", count: 0 },
  ];
  const [taskStats, setTaskStats] = useState(initialTaskStats);
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
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const [teamsRes, managersRes, employeesRes, departmentsRes] =
        await Promise.all([
          axios.get("http://localhost:8000/api/teams"),
          axios.get("http://localhost:8000/managers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/getEmployeeCount", {}),
          axios.get("http://localhost:8000/getAllDepartments"),
        ]);
      const normalizedDepartments = departmentsRes.data.departments.map((d) =>
        normalizeDepartment(d),
      );
      const uniqueDepartments = [...new Set(normalizedDepartments)];
      const totalTeams = teamsRes.data?.data?.length || 0;
      const totalManagers = managersRes.data?.length || 0;
      const totalEmployees = employeesRes.data?.totalEmployees || 0;
      const totalDepartments = uniqueDepartments?.length || 0;

      setTaskStats([
        { title: "Total Teams", count: totalTeams, color: "#D1ECF1" },
        { title: "Total Managers", count: totalManagers, color: "#FFB3B3" },
        { title: "Total Employees", count: totalEmployees, color: "#FFE493" },
        {
          title: "Total Departments",
          count: totalDepartments,
          color: "#D7F5E4",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats", error);
    }
  };
  const fetchTeams = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/teams");
      setAllTeams(res.data.data || []);
      console.log("all teams", res.data.data);
    } catch (error) {
      const errData = error.response?.data || {};
      console.error("ERROR FETCHING Teams:", errData);
      alert(JSON.stringify(errData, null, 2) || "Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchDashboardStats();
    setFilteredTeams(allTeams);
  }, []);
  useEffect(() => {
    setFilteredTeams(allTeams);
  }, [allTeams]);
  // ---------- Stat Cards Data ----------

  console.log("all teams from use effect", allTeams);

  const applyFilters = () => {
    const query = searchQuery.toLowerCase().trim();
    const temp = allTeams.filter(
      (team) =>
        (team.name || "").toLowerCase().includes(query) ||
        (team.teamLead || "").toLowerCase().includes(query) ||
        (team.department || "").toLowerCase().includes(query) ||
        (team.assignToProject?.length || 0).toString().includes(query)||
        (team.project?.name || "").toLowerCase().includes(query)
    );
    setFilteredTeams(temp);
  };

  //   const updateStats = (teams) => {
  //     const departments = [...new Set(teams.map(team => team.department))];
  //     const totalMembers = teams.reduce((sum, team) => sum + team.totalMembers, 0);
  //     setTaskStats([
  //       { title: "Total Teams", count: teams?.length || 0},
  //       { title: "Total Managers", count: Math.ceil(teams.length * 2.5) },
  //       { title: "Total Employees", count: totalMembers + Math.ceil(teams.length * 3) },
  //       { title: "Total Departments", count: departments.length }

  //     ]);
  //   };
  //

  const resetFilters = () => {
    setSearchQuery("");
    setFilteredTeams([...allTeams]);
    setTaskStats(initialTaskStats);
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
  console.log("filtered teams", filteredTeams);
  console.log("filtered teams", filteredTeams);
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
  console.log("current teams", currentTeams);
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
      <h2 className="mb-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Teams
      </h2>

      {/* Stat Cards */}
      <div className="row  mb-4 g-3">
        {taskStats.map((task, i) => (
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
                    backgroundColor: task.color,
                    minWidth: "70px",
                    minHeight: "70px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3A5FBE",
                  }}
                >
                  {task.count}
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
                  {task.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            style={{ justifyContent: "space-between" }}
          >
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
                onKeyPress={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
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
                onClick={() => {
                  setSearchQuery("");
                  setFilteredTeams([...allTeams]);
                }}
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
                    colSpan="4"
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
                        <span className="mb-0 fw-normal">{team?.name || "-"}</span>
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
                      <span className="fw-normal">
                        {team?.project?.name || "N/A"}
                      </span>
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
                      <span className="fw-normal">
                        {team?.assignToProject?.length || 0}
                      </span>
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
                      <span className="fw-normal">
                        {team?.department || "-"}
                      </span>
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
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${
                  filteredTeams.length
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
          // onClick={() => setSelectedTeam(null)}
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
                      {selectedTeam?.name || ""}
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
                      {selectedTeam?.project?.name || "N/A"}
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
                      {selectedTeam?.assignToProject?.length || 0}
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
                      {selectedTeam?.department || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setSelectedTeam(null)}
                  style={{minWidth:"90px"}}
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

export default AdminTeamsTMS;
