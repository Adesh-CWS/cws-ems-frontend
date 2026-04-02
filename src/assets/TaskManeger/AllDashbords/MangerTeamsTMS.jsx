import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ManagerTeamsTMS = ({ role }) => {
  const userRole = role || localStorage.getItem("role");
  const assignRef = useRef(null); //added by aditya
  const [isOpen, setIsOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [teamErrors, setTeamErrors] = useState({});
  const [teamLeads, setTeamLeads] = useState([]); //rutuja
  const [allTeams, setAllTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [department, setDepartment] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]); //////dip code
  const [projectOpen, setProjectOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const projectRef = useRef(null);
  const departmentRef = useRef(null);

  const initialTaskStats = [
    { title: "Total Teams", count: 0 },
    { title: "Total Managers", count: 0 },
    { title: "Total Employees", count: 0 },
    { title: "Total Departments", count: 0 },
  ];
  const [taskStats, setTaskStats] = useState(initialTaskStats);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [teamLeadOpen, setTeamLeadOpen] = useState(false);
  const teamLeadRef = useRef(null); //shivani code

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: "",
    project: "",
    department: "",
    teamLead: [], //shivani
    assignToProject: [],
  });
  const normalizeDepartment = (value) => {
    
    if (!value) return "";
    const v = String(value).trim().toLowerCase();

    if (v.startsWith("it")) return "IT";
    if (v.includes("finance")) return "Finance";
    if (v.includes("qa") || v.includes("test")) return "QA";
    if (v.includes("ui")) return "UI/UX";

    return value.trim();
  };
  //const assignRef = useRef(null);
  const teamPopupRef = useRef(null);
  const addTeamPopupRef = useRef(null);
//snehal added 27-01-2026 start limit member name
 const formatMemberNames = (members, limit = 3) => {
  if (!members || members.length === 0) return "NA";

  const names = members.map((emp) => emp.name);

  if (names.length <= limit) {
    return names.join(", ");
  }

  return names.slice(0, limit).join(", ") + " ...";
};
//snehal added 27-01-2026 start limit member name'
  useEffect(() => {
    if (selectedTeam && teamPopupRef.current) {
      teamPopupRef.current.focus();
    }
    if (showAddTeam && addTeamPopupRef.current) {
      addTeamPopupRef.current.focus();
    }
  }, [selectedTeam, showAddTeam]);
  const trapFocus = (e, popupRef) => {
    if (!popupRef.current) return;

    const focusable = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  async function fetchUser() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const user = await fetchUser();
      const [teamsRes, managersRes, employeesRes, departmentsRes] =
        await Promise.all([
          axios.get(`http://localhost:8000/api/teams/createdBy/${user._id}`),
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
        { title: "Total Teams", count: totalTeams },
        { title: "Total Managers", count: totalManagers },
        { title: "Total Employees", count: totalEmployees },
        { title: "Total Departments", count: totalDepartments },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const user = await fetchUser();
      const res = await axios.get(
        `http://localhost:8000/api/teams/createdBy/${user._id}`,
      );

      setAllTeams(res.data.data || []);
      console.log("Teams created by me:", res.data.data);
    } catch (error) {
      console.error(
        "ERROR FETCHING Teams:",
        error.response?.data || error.message,
      );
    }
  };

  // rutuja code strat
  const fetchTeamLeaders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://localhost:8000/teamLead", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamLeads(response.data || []);
      console.log("Team leaders fetched:", response.data);
    } catch (error) {
      console.error("Error fetching team leaders:", error);
    }
  };
  // rutuja end

  useEffect(() => {
    const fetchAddTaskRequiredDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:8000/getAllDepartments");
        const user = await fetchUser();
        const empRes = await axios.get(
          `http://localhost:8000/employees/manager/${user._id}`,
        );
        const projectRes = await axios.get(
          `http://localhost:8000/api/projects/manager/${user._id}`,
        );
        await fetchTeamLeaders(); //rutuja

        const departments = res.data.departments;

        // const employeesNames = empRes.data.employees;
        // rutuja code start
          const allEmployees = empRes.data.employees || [];
      const teamLeaderIds = teamLeads.map(lead => lead._id);
      const employeesNames = allEmployees.filter(
        emp => !teamLeaderIds.includes(emp._id)
      );
        //rutuja code edn

        const projectNames = projectRes.data.data;
        const normalizedDepartments = departments.map((d) =>
          normalizeDepartment(d),
        );
        const uniqueDepartments = [...new Set(normalizedDepartments)];
        const filteredProjects = projectNames.filter(
          (project) =>
            project.status !== "Cancelled" && project.status !== "Completed",
        );
        setProjects(filteredProjects);
        setDepartment(uniqueDepartments);
        setEmployees(employeesNames);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddTaskRequiredDetails();
    fetchTeams();
    fetchDashboardStats();
    setFilteredTeams(allTeams);
  }, []);
  useEffect(() => {
    setFilteredTeams(allTeams);
  }, [allTeams]);
  // ---------- Stat Cards Data ----------

  console.log("all teams from use effect", allTeams);
  const validateTeamForm = () => {
    const errors = {};

    if (!newTeam.name || !newTeam.name.trim()) {
      errors.name = "Team name is required";
    }

    if (!newTeam.project) {
      errors.project = "Project is required";
    }

    if (!newTeam.department) {
      errors.department = "Department is required";
    }

    if (!newTeam.assignToProject || newTeam.assignToProject.length === 0) {
      errors.assignToProject = "Please assign at least one employee";
    }

    if (!newTeam.teamLead || newTeam.teamLead.length === 0) {
      errors.teamLead = "Team Lead is required";
    } //shivani

    setTeamErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleAddTeam(e) {
    try {
      const user = await fetchUser();

      if (!user || !user._id) {
        alert("User not found");
        return;
      }
      const payload = {
        name: newTeam.name,
        project: newTeam.project,
        department: newTeam.department,
        teamLead: newTeam.teamLead, //shivani
        assignToProject: newTeam.assignToProject,
        createdBy: user._id,
      };
      let res;
      if (editTaskId) {
        res = await axios.put(
          `http://localhost:8000/api/teams/${editTaskId}`,
          payload,
          { headers: { "Content-Type": "application/json" } },
        );
        await fetchTeams();
      } else {
        const res = await axios.post(
          "http://localhost:8000/api/teams",
          payload,
          { headers: { "Content-Type": "application/json" } },
        );

        await fetchTeams();
      }

      // setAllTeams((prev) => [...prev, res.data.data]);
      setFilteredTeams(allTeams);
      setShowAddTeam(false);

      if (!editTaskId) {
        const lastPage = Math.ceil(allTeams.length / itemsPerPage);
        setCurrentPage(lastPage);
      }

      setShowAddTeam(false);
      setNewTeam({
        name: "",
        project: "",
        department: "",
        assignToProject: [],
      });
      alert(editTaskId ? "Team updated" : "Team created");
      setEditTaskId(null);
    } catch (error) {
      console.error("Submit failed:", error.response?.data || error.message);
      alert("Operation failed");
    }
  }
  const handleAddTeamSubmit = (e) => {
    e.preventDefault();

    if (!validateTeamForm()) return;

    handleAddTeam();
  };

  const resetAddTeamForm = () => {
    setNewTeam({
      name: "",
      project: "",
      department: "",
      assignToProject: [],
    });

    setTeamErrors({});
    setIsOpen(false);
    setEditTaskId(null);
  };

  const updateStats = (teams) => {
    const departments = [...new Set(teams.map((team) => team.department))];
    const totalMembers = teams.reduce(
      (sum, team) => sum + team.totalMembers,
      0,
    );
    setTaskStats([
      { title: "Total Teams", count: teams?.length || 0 },
      { title: "Total Managers", count: Math.ceil(teams.length * 2.5) },
      {
        title: "Total Employees",
        count: totalMembers + Math.ceil(teams.length * 3),
      },
      { title: "Total Departments", count: departments.length },
    ]);
  };
  //

  // ================= FILTER LOGIC =================
 const applyFilters = () => {
  if (!searchQuery.trim()) {
    setFilteredTeams(allTeams);
    setCurrentPage(1);
    return;
  }

  const query = searchQuery.toLowerCase();

  const result = allTeams.filter((team) => {
    const teamName = team?.name?.toLowerCase() || "";
    const department = team?.department?.toLowerCase() || "";
    const projectName = team?.project?.name?.toLowerCase() || "";
const projectStatus = team?.project?.status?.toLowerCase() || "";


    const memberNames = Array.isArray(team?.assignToProject)
      ? team.assignToProject
          .map((emp) => emp?.name?.toLowerCase())
          .join(" ")
      : "";

    const totalMembers = String(team?.assignToProject?.length || "");

    return (
      teamName.includes(query) ||
      department.includes(query) ||
      projectName.includes(query) ||
      projectStatus.includes(query)||
      memberNames.includes(query) ||
      totalMembers.includes(query)
    );
  });

  setFilteredTeams(result);
  setCurrentPage(1);
};

  const resetFilters = () => {
    setSearchQuery("");
    setFilteredTeams(allTeams);
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
  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/teams/${id}`);
      setAllTeams((prev) => prev.filter((t) => t._id !== id));
      setFilteredTeams((prev) => prev.filter((t) => t._id !== id));
      alert("Team deleted Successfully!!");
    } catch (error) {
      alert("Failed to delete task");
      console.log("error", error.message);
    }
  };
  const handleEditTeam = (team) => {
    console.log("team from edit", team);
    setEditMode(true);
    setEditTaskId(team._id);
    setShowAddTeam(true);

    setNewTeam({
      name: team.name || "",
      project: team.project?._id || team.project?.name || "",
      assignToProject: Array.isArray(team.assignToProject)
        ? team.assignToProject.map((emp) => emp._id) // array of employee IDs
        : [],
      department: team.department || "",
      teamLead: team.teamLead?._id || "", //shivani
    });
  };

  const statCardColors = ["#D1ECF1", "#FFB3B3", "#FFE493", "#D7F5E4"];
  //added by aditya Replace(Dip)
  // PROJECT DROPDOWN
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectRef.current && !projectRef.current.contains(e.target)) {
        setProjectOpen(false);
      }
    };

    if (projectOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [projectOpen]);

  // DEPARTMENT DROPDOWN
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (departmentRef.current && !departmentRef.current.contains(e.target)) {
        setDepartmentOpen(false);
      }
    };

    if (departmentOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [departmentOpen]);


  // shivani code 
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (teamLeadRef.current && !teamLeadRef.current.contains(e.target)) {
        setTeamLeadOpen(false);
      }
    };
  
    if (teamLeadOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [teamLeadOpen]);


  // ASSIGN TO
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (assignRef.current && !assignRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const isAnyPopupOpen = !!selectedTeam || showAddTeam;
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
    <div className="container-fluid ">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0" style={{ color: "#3A5FBE", fontSize: "25px" }}>
          Teams
        </h2>

        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            setNewTeam({
              name: "",
              project: "",
              department: "",
              assignToProject: [],
              teamLead: [], //shivani
            });
            setShowAddTeam(true);
          }}
        >
          + Create New Team
        </button>
      </div>

      {/* Stat Cards */}

      <div className="row g-3 mb-4">
        {taskStats.map((task, i) => (
          <div className="col-12 col-md-6 col-lg-3" key={i}>
            <div className="card shadow-sm h-100 border-0">
              <div
                className="card-body d-flex align-items-center"
                style={{ gap: "20px" }}
              >
                <h4
                  className="mb-0"
                  style={{
                    fontSize: "32px",
                    backgroundColor: statCardColors[i],
                    padding: "15px",
                    textAlign: "center",
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
                <p
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  {task.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      {/* ================= FILTER ================= */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label className="fw-bold mb-0" style={{ color: "#3A5FBE" }}>
                Search
              </label>
              <input
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
              <button className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}>Filter</button>
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{minWidth:"90px"}}
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
      {showAddTeam && (
        <div
          ref={addTeamPopupRef}
          tabIndex={0}
          onKeyDown={(e) => trapFocus(e, addTeamPopupRef)}
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
            className="modal-dialog modal-lg"
            style={{
              maxHeight: "100vh",
              width: "700px",
              maxWidth: "95vw",
            }} //change
          >
            <div className="modal-content">
              <form onSubmit={handleAddTeamSubmit}>
                {/* Header */}
                <div
                  className="modal-header"
                  style={{ background: "#3A5FBE", color: "#fff" }}
                >
                  <h5 className="modal-title">
                    {editTaskId ? "Edit Team" : "Add Team"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      resetAddTeamForm();
                      setShowAddTeam(false);
                    }}
                  />
                </div>

                {/* Body   */}
                <div
                  className="modal-body"
                  style={{ maxHeight: "70vh", overflowY: "auto" }}
                >
                  <div className="container-fluid">
                    {/* Team Name  */}
                    <div className="row align-items-center mb-2">
                      <div className="col-md-3">
                        <label className="form-label mb-0">Team Name:</label>
                      </div>
                      <div className="col-md-9">
                        <input
                          name="name"
                          className="form-control"
                          placeholder="Enter team name"
                          value={newTeam.name}
                          disabled={userRole !== "manager"}
                          onChange={(e) => {
                            setNewTeam({ ...newTeam, name: e.target.value });
                            if (teamErrors.name)
                              setTeamErrors({ ...teamErrors, name: "" });
                          }}
                        />
                        {teamErrors.name && (
                          <small className="text-danger mt-1">
                            {teamErrors.name}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* PROJECT DROPDOWN */}
                    <div
                      className="row align-items-center mb-2"
                      ref={projectRef}
                    >
                      <div className="col-md-3">
                        <label className="form-label mb-0">Project:</label>
                      </div>
                      <div className="col-md-9 position-relative">
                        <div
                          className="form-control d-flex justify-content-between align-items-center p-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => setProjectOpen(!projectOpen)}
                        >
                          <span className="flex-grow-1">
                            {newTeam.project
                              ? projects.find((p) => p._id === newTeam.project)
                                  ?.name || "Select Project"
                              : "Select Project"}
                          </span>
                          <span>▾</span>
                        </div>

                        {projectOpen && (
                          <div
                            className="border rounded mt-1 bg-white position-absolute shadow-sm"
                            style={{
                              top: "100%",
                              left: 0,
                              right: 0,
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1060,
                            }}
                          >
                            {projects.map((pro) => (
                              <div
                                key={pro._id}
                                className="px-3 py-2 "
                                style={{ cursor: "pointer" }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#f0f0f0")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "transparent")
                                }
                                onClick={() => {
                                  setNewTeam({ ...newTeam, project: pro._id });
                                  if (teamErrors.project)
                                    setTeamErrors({
                                      ...teamErrors,
                                      project: "",
                                    });
                                  setProjectOpen(false);
                                }}
                              >
                                {pro.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {teamErrors.project && (
                          <small className="text-danger mt-1">
                            {teamErrors.project}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* DEPARTMENT DROPDOWN  */}
                    <div
                      className="row align-items-center mb-2"
                      ref={departmentRef}
                    >
                      <div className="col-md-3">
                        <label className="form-label mb-0">Department:</label>
                      </div>
                      <div className="col-md-9 position-relative">
                        <div
                          className="form-control d-flex justify-content-between align-items-center p-2"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f0f0f0")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          onClick={() => setDepartmentOpen(!departmentOpen)}
                        >
                          <span className="flex-grow-1">
                            {newTeam.department || "Select Department"}
                          </span>
                          <span>▾</span>
                        </div>

                        {departmentOpen && (
                          <div
                            className="border rounded mt-1 bg-white position-absolute shadow-sm"
                            style={{
                              top: "100%",
                              left: 0,
                              right: 0,
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1060,
                              width: "100%",
                            }}
                          >
                            {department.map((dept, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 "
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setNewTeam({ ...newTeam, department: dept });
                                  if (teamErrors.department)
                                    setTeamErrors({
                                      ...teamErrors,
                                      department: "",
                                    });
                                  setDepartmentOpen(false);
                                }}
                              >
                                {dept}
                              </div>
                            ))}
                          </div>
                        )}
                        {teamErrors.department && (
                          <small className="text-danger mt-1">
                            {teamErrors.department}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* shivani code  */}
                    <div className="row align-items-center mb-2" ref={teamLeadRef}>
                      <div className="col-md-3">
                        <label className="form-label mb-0">Team Lead:</label>
                      </div>

                      <div className="col-md-9 position-relative">
                        <div
                          className="form-control d-flex justify-content-between align-items-center p-2"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamLeadOpen(!teamLeadOpen);
                          }}
                        >
                          <span className="flex-grow-1">
                            {newTeam.teamLead.length > 0
                              ? `${newTeam.teamLead.length} team lead(s) selected`
                              : "Select Team Leads"}
                          </span>
                          <span>▾</span>
                        </div>

                        {teamLeadOpen && (
                          <div
                            className="border rounded mt-1 bg-white position-absolute shadow-sm"
                            style={{
                              top: "100%",
                              left: 0,
                              right: 0,
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1060,
                              width: "100%",
                            }}
                          >
                            {teamLeads.length > 0 ? (
                              teamLeads.map((lead) => (
                                <div key={lead._id} className="form-check py-2 px-3">
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    id={`lead-${lead._id}`}
                                    checked={newTeam.teamLead.includes(lead._id)}
                                    onChange={(e) => {
                                      const updatedLeads = e.target.checked
                                        ? [...newTeam.teamLead, lead._id]
                                        : newTeam.teamLead.filter((id) => id !== lead._id);

                                      setNewTeam({
                                        ...newTeam,
                                        teamLead: updatedLeads,
                                      });

                                      if (teamErrors.teamLead) {
                                        setTeamErrors({
                                          ...teamErrors,
                                          teamLead: "",
                                        });
                                      }
                                    }}
                                  />

                                  <label
                                    className="form-check-label mb-0"
                                    htmlFor={`lead-${lead._id}`}
                                  >
                                    {lead.name} {lead.designation ? `(${lead.designation})` : ""}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-muted">
                                No team leaders found
                              </div>
                            )}
                          </div>
                        )}

                        {teamErrors.teamLead && (
                          <small className="text-danger mt-1">
                            {teamErrors.teamLead}
                          </small>
                        )}
                      </div>
                    </div>



                    {/* ASSIGN TO  */}
                    <div
                      className="row align-items-center mb-2"
                      ref={assignRef}
                    >
                      <div className="col-md-3">
                        <label className="form-label mb-0">Assign To:</label>
                      </div>
                      <div className="col-md-9 position-relative">
                        <div
                          className="form-control d-flex justify-content-between align-items-center p-2"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                          }}
                        >
                          <span className="flex-grow-1">
                            {newTeam.assignToProject.length > 0
                              ? `${newTeam.assignToProject.length} employee(s) selected`
                              : "Select Employees"}
                          </span>
                          <span>▾</span>
                        </div>

                        {isOpen && (
                          <div
                            className="border rounded mt-1 bg-white position-absolute shadow-sm"
                            style={{
                              top: "100%",
                              left: 0,
                              right: 0,
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1060,
                              width: "100%",
                            }}
                          >
                            {employees
                            .filter(emp => !teamLeads.some(lead => lead._id === emp._id))
                            .map((emp) => (
                              <div key={emp._id} className="form-check  py-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input me-2"
                                  id={emp._id}
                                  checked={newTeam.assignToProject.includes(
                                    emp._id,
                                  )}
                                  onChange={(e) => {
                                    const updatedList = e.target.checked
                                      ? [...newTeam.assignToProject, emp._id]
                                      : newTeam.assignToProject.filter(
                                          (id) => id !== emp._id,
                                        );
                                    setNewTeam({
                                      ...newTeam,
                                      assignToProject: updatedList,
                                    });
                                    if (teamErrors.assignToProject) {
                                      setTeamErrors({
                                        ...teamErrors,
                                        assignToProject: "",
                                      });
                                    }
                                  }}
                                />
                                <label
                                  className="form-check-label mb-0"
                                  htmlFor={emp._id}
                                >
                                  {emp.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {teamErrors.assignToProject && (
                          <small className="text-danger mt-1">
                            {teamErrors.assignToProject}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => {
                      setShowAddTeam(false);
                      setEditTaskId(null);
                      resetAddTeamForm();
                    }}
                  >
                    Cancel
                  </button>
                  {userRole === "manager" && (
                    <button
                      type="submit"
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: "90px" }}
                    >
                      {/* {editTaskId ? "Save Changes" : "Save Team"} */}
                      Save
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                {/* shivani */}
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
                {/* // */}
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
                  Project Status
                </th>

                {/* <th style={{ fontWeight: '500', fontSize: '14px', color: '#6c757d', borderBottom: '2px solid #dee2e6', padding: '12px', whiteSpace: 'nowrap' }}>Team Lead</th> */}
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
                  Members Name
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
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan="8" //shivani
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
                    onClick={() => {
                      if (team?.project?.status === "Cancelled") return;
                      handleRowClick(team);
                    }}
                    style={{
                      cursor:
                        team?.project?.status === "Cancelled"
                          ? "not-allowed"
                          : "pointer",
                      opacity: team?.project?.status === "Cancelled" ? 0.6 : 1,
                    }}
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
                      <h6 className="mb-0 fw-normal">{team?.name || "-"}</h6>
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
                        {team?.project?.name || "-"}
                      </span>
                    </td>

                    {/* shivani */}
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
                       {team.teamLead && team.teamLead.length > 0
                        ? team.teamLead.map((lead) => lead.name).join(", ")
                        : "-"}
                      </span>
                    </td>
                    {/* // */}
                    
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
                        {team?.project?.status || "-"}
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
                        {/* {team?.assignToProject?.length > 0
                          ? team.assignToProject
                              .map((emp) => emp.name)
                              .join(", ")
                          : "NA"} */}
                          {/* //Snehal added 27-01-2026 member name */}
                         {formatMemberNames(team?.assignToProject)}
                            {/* //Snehal added 27-01-2026 member name */}

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

                    <td style={tdStyle}>
                      {userRole === "manager" && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm custom-outline-btn"
                            disabled={
                              team?.project?.status === "Completed" ||
                              team?.project?.status === "Cancelled"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTeam(team);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={
                              team?.project?.status === "Completed" ||
                              team?.project?.status === "Cancelled"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeam(team._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
              onMouseDown={(e) => e.preventDefault()}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage + 1)}
              onMouseDown={(e) => e.preventDefault()}
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
          ref={teamPopupRef}
          tabIndex={0}
          onKeyDown={(e) => trapFocus(e, teamPopupRef)}
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
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%" }}
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

                  {/* <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Team Lead</div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedTeam.teamLead}</div>
                  </div> */}
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
                      {selectedTeam?.project?.name || ""}
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
                      Team Members
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTeam?.assignToProject?.length > 0
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
                      {selectedTeam?.department || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                {selectedTeam?.project.status !== "Completed" && (
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => {
                      setSelectedTeam(null);
                      handleEditTeam(selectedTeam);
                    }}
                  >
                    Edit
                  </button>
                )}

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
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
const tdStyle = {
  padding: "12px",
  verticalAlign: "middle",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  whiteSpace: "nowrap",
};

export default ManagerTeamsTMS;
