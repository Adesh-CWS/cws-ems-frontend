import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
function AdminDashboardTMS() {
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredUpcomingItems, setFilteredUpcomingItems] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  //
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [teams, setTeams] = useState([]); //added by harshada

  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");
  const { role, username, id } = useParams();
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };

        /* EMPLOYEES */
        const empRes = await axios.get(
          "http://localhost:8000/getAllEmployees",
          { headers },
        );

        const benchEmp = await axios.get(
          "http://localhost:8000/bench-employees",
          { headers },
        );

        const allEmployees = empRes.data || [];

        // 1. Filter active employees only
        const activeEmployees = allEmployees.filter((e) => !e.isDeleted);

        // 2. Filter allowed roles for count (HR, Manager, Employee)
        const allowedRoles = ["hr", "manager", "employee", "it_support"];

        const totalEmployeeCount = activeEmployees.filter((e) =>
          allowedRoles.includes(e.role?.toLowerCase()),
        ).length;
        setAvailableEmployees(benchEmp.data.benchEmployees || []);

        setTotalEmployees(totalEmployeeCount);

        // 4. Set employees table (active only)

        /* PROJECTS */
        const projectRes = await axios.get(
          "http://localhost:8000/api/projects",
          { headers },
        );

        const projectList = projectRes.data || [];
        setProjects(projectList);
        setTotalProjects(projectList.length);

        /* TEAMS */
        // const teamRes = await axios.get("http://localhost:8000/api/teams", {
        //   headers,
        // });
        const teamRes = await axios.get("http://localhost:8000/api/teams", {
          headers,
        });
        const teamList = teamRes.data?.data || [];
        setTeams(teamList);
        setTotalTeams(teamList.length);

        /* TASKS */
        const taskRes = await axios.get("http://localhost:8000/task/getall", {
          headers,
        });
        const taskList = taskRes.data || [];
        setTasks(taskList);
        setTotalTasks(taskList.length);

        /* UPCOMING DUE DATES LOGIC */
        //added by Teamlist in harshada
        prepareUpcomingItems(projectList, taskList, teamList);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      }
    };

    fetchDashboardData();
  }, []);

  const getDaysLeft = (date) => {
    if (!date) return null;
    const today = new Date();
    const due = new Date(date);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const prepareUpcomingItems = (projects, tasks, teams) => {
    const formattedProjects = projects.map((p) => ({
      type: "PROJECT",
      title: p.name || "—",
      startDate: p.startDate ?? null,
      dueDate: p.dueDate ?? null,
      lead: p.managers?.map((m) => m.name).join(", ") || "—",
      status: p.status?.name || "In Progress",
      teamSize: p.assignedEmployees?.length || 0,
    }));

    const formattedTasks = tasks.map((t) => ({
      type: "TASK",
      title: t.taskName || "—",
      dueDate: t.dateOfExpectedCompletion || t.deadline || t.endDate || null,
      assignedTo: t.assignedTo?.name || "—",
      projectName: t.projectName || "—",
    }));

    const filtered = [
      ...formattedProjects.filter((p) => {
        const daysLeft = getDaysLeft(p.dueDate);
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;
      }),
      ...formattedTasks.filter((t) => {
        const daysLeft = getDaysLeft(t.dueDate);
        return daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
      }),
    ];

    setFilteredUpcomingItems(filtered);
  };

  const isUpcomingStart = (startDate) => {
    if (!startDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    return start >= today;
  };

  const upcomingProjects = projects
    ////change dip
    .filter((p) => {
      const statusValue = p.status?.name || p.status || "";
      const statusLower = statusValue.toString().toLowerCase().trim();

      return statusLower === "upcoming project";
    })
    ////change dip
    .map((p) => ({
      id: p._id,
      title: p.name || "—",
      startDate: p.startDate,
      status: p.status || "On Track",
    }))
    // .filter((p) => isUpcomingStart(p.startDate))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3); // show only 3

  // const getActiveProjects = (projects) => {
  //   const today = new Date();

  //   return projects.filter((p) => {
  //     // 1. Check if project status is not cancelled/completed
  //   const status = p.status?.toLowerCase();
  //   if (status === 'cancelled' || status === 'canceled' || status === 'completed') {
  //     return false;
  //   }
  //     if (!p.startDate || !p.endDate) return false;

  //     const start = new Date(p.startDate);
  //     const end = new Date(p.endDate);

  //     return start <= today && today <= end;
  //   });
  // };
  const getActiveProjects = (projects) => {
  return projects.filter((p) => {
    const status = p.status?.toLowerCase();
    
    // Exclude only cancelled and completed projects
    return status !== 'cancelled' && 
           status !== 'canceled' && 
           status !== 'upcoming project' && 
           status !== 'completed';
  });
};

  const getProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const total = end - start;
    const completed = today - start;

    if (total <= 0) return 0;

    return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  };
  //added by harshada
  const activeProjects = getActiveProjects(projects);
  const getTeamSizeByProject = (projectId) => {
    return teams
      .filter((t) => t.project && t.project._id === projectId)
      .reduce((total, team) => total + team.assignToProject.length, 0);
  };
  const popupRef = useRef(null);
  useEffect(() => {
    if (showProfile && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showProfile]);

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
  const isAnyPopupOpen = !!showProfile;

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
    <div className="container-fluid" style={{ marginTop: "-25px" }}>
      {/* Main Content */}
      <div>
        {/* Stats Cards Row */}
        <div className="row g-3 mb-4">
          {/* Total Tasks */}
          <div className="col-12 col-md-6 col-lg-3">
            <div
              className="card shadow-sm h-100 border-0"
              style={{ borderRadius: "7px" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between">
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "20px" }}
                >
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "32px",
                      backgroundColor: "#D1ECF1",
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3A5FBE",
                    }}
                  >
                    {totalTasks}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ color: "#3A5FBE", fontSize: "18px" }}
                  >
                    Total Tasks
                  </p>
                </div>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    navigate(`/tms-dashboard/${role}/${username}/${id}/task`)
                  }
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Total Project */}
          <div className="col-12 col-md-6 col-lg-3">
            <div
              className="card shadow-sm h-100 border-0"
              style={{ borderRadius: "7px" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between">
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "20px" }}
                >
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "32px",
                      backgroundColor: "#FFB3B3",
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3A5FBE",
                    }}
                  >
                    {totalProjects}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ color: "#3A5FBE", fontSize: "18px" }}
                  >
                    Total Projects
                  </p>
                </div>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    navigate(`/tms-dashboard/${role}/${username}/${id}/project`)
                  }
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Total Teams */}
          <div className="col-12 col-md-6 col-lg-3">
            <div
              className="card shadow-sm h-100 border-0"
              style={{ borderRadius: "7px" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between">
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "20px" }}
                >
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "32px",
                      backgroundColor: "#FFE493",
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3A5FBE",
                    }}
                  >
                    {totalTeams}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ color: "#3A5FBE", fontSize: "18px" }}
                  >
                    Total Teams
                  </p>
                </div>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    navigate(`/tms-dashboard/${role}/${username}/${id}/teams`)
                  }
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Total Employees */}
          <div className="col-12 col-md-6 col-lg-3">
            <div
              className="card shadow-sm h-100 border-0"
              style={{ borderRadius: "7px" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between">
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "20px" }}
                >
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "32px",
                      backgroundColor: "#D7F5E4",
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3A5FBE",
                    }}
                  >
                    {totalEmployees}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ color: "#3A5FBE", fontSize: "18px" }}
                  >
                    Total Employees
                  </p>
                </div>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    navigate(
                      `/tms-dashboard/${role}/${username}/${id}/employee`,
                    )
                  }
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="row g-3 mb-4">
          {/* Active Project Summary */}
          <div className="col-md-6">
            <div
              className="card"
              style={{ borderRadius: "12px", height: "100%" }}
            >
              <div className="card-body">
                <h5 className="card-title mb-3">Active Project Summary</h5>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {activeProjects.length === 0 ? (
                    <p className="text-muted">No active projects</p>
                  ) : (
                    activeProjects.map((project) => {
                      const progress = getProgress(
                        project.startDate,
                        project.endDate || project.dueDate,
                      );

                      const isDelayed =
                        new Date() >
                        new Date(project.endDate || project.dueDate);

                      return (
                        <div key={project._id} className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <div>
                                <div
                                  style={{ fontWeight: 600, fontSize: "14px" }}
                                >
                                  {project.name}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#6c757d" }}
                                >
                                  Team Size: {getTeamSizeByProject(project._id)}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`badge ${
                                isDelayed ? "bg-danger" : "bg-success"
                              }`}
                            >
                              {isDelayed ? "Delayed" : "On Track"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/*  Upcoming Project */}
          <div className="col-md-6">
            <div
              className="card"
              style={{ borderRadius: "12px", height: "100%" }}
            >
              <div className="card-body">
                <h5 className="card-title mb-3">Upcoming Project</h5>

                {upcomingProjects.length === 0 && (
                  <p className="text-muted">No upcoming projects</p>
                )}
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {upcomingProjects.map((project) => (
                    <div key={project.id} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>
                            {project.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            Start Date: {formatDate(project.startDate)}
                          </div>
                        </div>

                        <span className="badge bg-success">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div className="row g-3">
          <div className="col-md-6">
            <div
              className="card"
              style={{ borderRadius: "12px", height: "300px" }}
            >
              <div
                className="card-body d-flex flex-column"
                style={{ padding: "1rem", height: "100%" }}
              >
                <h5 className="card-title mb-3" style={{ flexShrink: 0 }}>
                  Upcoming Due Dates
                </h5>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {filteredUpcomingItems.length === 0 && (
                    <p className="text-muted text-center">
                      No upcoming due dates
                    </p>
                  )}

                  {filteredUpcomingItems.map((item, index) => {
                    const daysLeft = getDaysLeft(item.dueDate);
                    const urgent = daysLeft <= 3;

                    return (
                      <div
                        key={index}
                        className="mb-3 p-3"
                        style={{
                          backgroundColor: urgent ? "#fff3cd" : "#d1ecf1",
                          borderLeft: `4px solid ${
                            urgent ? "#ffc107" : "#0dcaf0"
                          }`,
                          borderRadius: "8px",
                        }}
                      >
                        {/* HEADER */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span
                            className={`badge ${
                              item.type === "TASK" ? "bg-primary" : ""
                            }`}
                            style={{
                              backgroundColor:
                                item.type === "PROJECT" ? "#8B5FBF" : "",
                              fontSize: "10px",
                            }}
                          >
                            <i
                              className={`bi ${
                                item.type === "PROJECT"
                                  ? "bi-folder2"
                                  : "bi-check2-square"
                              } me-1`}
                            ></i>
                            {item.type}
                          </span>

                          <div style={{ fontWeight: 600, fontSize: "14px" }}>
                            {item.title}
                          </div>
                        </div>

                        {/* DETAILS */}
                        {item.type === "PROJECT" ? (
                          <>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              Team Lead: {item.lead}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              Team: {item.teamSize} members
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              Assigned to: {item.assignedTo}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              Project: {item.projectName}
                            </div>
                          </>
                        )}

                        {/* DUE DATE */}
                        <div className="mt-2 d-flex align-items-center gap-1">
                          <i className="bi bi-calendar-event"></i>
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>
                            Due:{" "}
                            {new Date(item.dueDate).toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "short", // Mon, Tue, Wed
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span
                            className={`badge ms-2 ${
                              urgent
                                ? "bg-warning text-dark"
                                : "bg-info text-dark"
                            }`}
                            style={{ fontSize: "10px" }}
                          >
                            {daysLeft} days left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Available Employees - separate card, takes 4 columns */}
          <div className="col-md-6">
            <div
              className="card"
              style={{ borderRadius: "12px", height: "300px" }}
            >
              <div
                className="card-body d-flex flex-column"
                style={{ padding: "1rem", height: "100%" }}
              >
                <h5 className="card-title mb-3" style={{ flexShrink: 0 }}>
                  Available Employees
                </h5>
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {availableEmployees.length === 0 && (
                    <p className="text-muted text-center">
                      No available employees
                    </p>
                  )}

                  {availableEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      className="d-flex align-items-center justify-content-between mb-3"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={emp.profileImage || "/myprofile.jpg"}
                          alt="Employee"
                          className="rounded-circle"
                          style={{ width: "40px", height: "40px" }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>
                            {emp.designation || "—"}
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => {
                          const encodedName = encodeURIComponent(emp.name);
                          navigate(
                            `/tms-dashboard/${userRole}/${username}/${id}/myprofile/${emp._id}`,
                          );
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* View profile popup */}
            {showProfile && selectedEmployee && (
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
                  style={{ maxWidth: "650px", width: "95%" }}
                >
                  <div className="modal-content">
                    {/* HEADER */}
                    <div
                      className="modal-header text-white"
                      style={{ backgroundColor: "#3A5FBE" }}
                    >
                      <h5 className="modal-title mb-0">Employee Profile</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowProfile(false)}
                      />
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Employee ID</div>
                        <div className="col-8">
                          {selectedEmployee.employeeId || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Name</div>
                        <div className="col-8">{selectedEmployee.name}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Email</div>
                        <div className="col-8">
                          {selectedEmployee.email || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Mobile</div>
                        <div className="col-8">
                          {selectedEmployee.contact || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Designation</div>
                        <div className="col-8">
                          {selectedEmployee.designation || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Date of Joining</div>
                        <div className="col-8">
                          {selectedEmployee.doj
                            ? new Date(selectedEmployee.doj).toLocaleDateString(
                                "en-GB",
                              )
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => setShowProfile(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboardTMS;
