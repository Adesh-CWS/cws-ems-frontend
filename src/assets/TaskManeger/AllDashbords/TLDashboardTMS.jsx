import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function TLDashboardTMS() {
  const navigate = useNavigate();
  const { role, username, id } = useParams();

  /* ---------------- STATE VARIABLES ---------------- */
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [assignedEmployees, setAssignedEmployees] = useState(0);

  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  /* ---------------- HELPER FUNCTIONS ---------------- */
  const getDaysLeft = (date) => {
    if (!date) return null;
    const due = new Date(date);
    if (isNaN(due.getTime())) return null;
    const today = new Date();
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const isActiveProject = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    return start <= today && today <= end;
  };

  const getProjectStatus = (project) => {
    const today = new Date();
    const endDate = project.endDate || project.dueDate;
    
    if (!endDate) return "In Progress";
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return end < today ? "Delayed" : "In Progress";
  };

  /* ---------------- FETCH TEAM MEMBERS ---------------- */
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoadingMembers(true);
        const token = localStorage.getItem("accessToken");
        if (!token || !id) return;

        const membersRes = await axios.get(
          `https://ems-cws-test.vercel.app/${id}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (membersRes.data.success) {
          const members = membersRes.data.members || [];
          setTotalEmployees(members.length);
          setEmployees(members);
        }
      } catch (err) {
        console.error("Error fetching team members", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, [id]);

  /* ---------------- FETCH DASHBOARD DATA ---------------- */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token || !id) return;

        // Fetch Teams
        const teamsRes = await axios.get(
          `https://ems-cws-test.vercel.app/api/teams/user/${id}/teams`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const teams = teamsRes.data.success ? teamsRes.data.data || [] : [];
        setTotalTeams(teams.length);

        // Fetch Projects
        const projectsRes = await axios.get(
          `https://ems-cws-test.vercel.app/${id}/projects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const projectsData = projectsRes.data.success ? projectsRes.data.projects || [] : [];
        setTotalProjects(projectsData.length);

        // Process projects for display
        const active = [];
        const upcoming = [];

        projectsData.forEach(item => {
          if (item.project) {
            const project = item.project;
            const startDate = project.startDate;
            const endDate = project.endDate || project.dueDate;
            
            if (isActiveProject(startDate, endDate)) {
              active.push({
                title: project.name || "—",
                dueDate: endDate,
                status: getProjectStatus(project)
              });
            }
            
            if (startDate) {
              const start = new Date(startDate);
              const today = new Date();
              start.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              
              if (start > today) {
                upcoming.push({
                  title: project.name || "—",
                  startDate: startDate,
                  dueDate: endDate,
                  teamName: item.teamName
                });
              }
            }
          }
        });

        setActiveProjects(active);
        setUpcomingProjects(upcoming);

        // Fetch Tasks
        const tasksRes = await axios.get(
          `https://ems-cws-test.vercel.app/tasks/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const tasks = tasksRes.data.success ? tasksRes.data.tasks || [] : [];
        setTotalTasks(tasks.length);

        // Process upcoming due dates
        const upcomingDueItems = [];

        projectsData.forEach(item => {
          if (item.project) {
            const project = item.project;
            const dueDate = project.dueDate || project.endDate;
            const daysLeft = getDaysLeft(dueDate);
            
            if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 5) {
              upcomingDueItems.push({
                type: "PROJECT",
                title: project.name || "—",
                dueDate: dueDate,
                teamName: item.teamName,
                teamSize: item.teamMembersCount || 0
              });
            }
          }
        });

        tasks.forEach(task => {
          const dueDate = task.dateOfExpectedCompletion || task.deadline || task.endDate;
          const daysLeft = getDaysLeft(dueDate);
          
          if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 3) {
            upcomingDueItems.push({
              type: "TASK",
              title: task.taskName || task.name || "—",
              dueDate: dueDate,
              assignedTo: task.assignedTo?.name || "—",
              projectName: task.projectName || "—"
            });
          }
        });

        upcomingDueItems.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setUpcomingItems(upcomingDueItems);

        const assignedSet = new Set();
        projectsData.forEach(item => {
          if (item.project && item.teamMembersCount) {
            assignedSet.add(item.teamId);
          }
        });
        setAssignedEmployees(assignedSet.size);

      } catch (err) {
        console.error("Dashboard API error", err);
      }
    };

    fetchDashboardData();
  }, [id]);

  /* ---------------- FETCH AVAILABLE EMPLOYEES ---------------- */
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const token = localStorage.getItem("accessToken");

        // Use the new available employees API
        const res = await axios.get(
          `https://ems-cws-test.vercel.app/${id}/available-employees`,
          { 
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data.success) {
          setAvailableEmployees(res.data.availableEmployees || []);
        }
      } catch (err) {
        console.error("Error fetching available employees", err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchAvailableEmployees();
  }, [id]); // Added id dependency

  /* ---------------- MODAL SCROLL LOCK ---------------- */
  useEffect(() => {
    if (showProfile) {
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
  }, [showProfile]);

  return (
    <div className="container-fluid " style={{ marginTop: "-25px" }}>
      {/* Main Content */}
      <div>
        {/* Stats Cards Row */}
        <div className="row g-3 mb-4">
          {/* Total Employees */}
          <div className="col-12 col-md-4 col-lg-3">
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
                      backgroundColor: "rgba(13, 148, 136, 0.13)",
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3A5FBE",
                    }}
                  >
                    {loadingMembers ? "..." : totalEmployees}
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
                    navigate(`/tms-dashboard/${role}/${username}/${id}/my-team-member`)
                  }
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Total Projects */}
          <div className="col-12 col-md-4 col-lg-3">
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
          <div className="col-12 col-md-4 col-lg-3">
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

          {/* Total Assigned Tasks */}
          <div className="col-12 col-md-4 col-lg-3">
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
                    {totalTasks}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ color: "#3A5FBE", fontSize: "18px" }}
                  >
                    Total Assigned Tasks
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
        </div>

        {/* Second Row */}
        <div className="row g-3 mb-4">
          {/* Active Project Summary */}
          <div className="col-md-6">
            <div
              className="card"
              style={{
                borderRadius: "12px",
                height: "210px",
              }}
            >
              <div className="card-body">
                <h5 className="card-title mb-3">Active Project Summary</h5>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {activeProjects.length === 0 ? (
                    <p className="text-muted">No active projects</p>
                  ) : (
                    activeProjects.map((project, index) => (
                      <ProjectItem
                        key={index}
                        name={project.title}
                        dueDate={project.dueDate}
                        status={project.status}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Projects */}
          <div className="col-md-6">
            <div
              className="card"
              style={{ borderRadius: "12px", height: "210px" }}
            >
              <div className="card-body">
                <h5 className="card-title mb-3">Upcoming Projects</h5>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {upcomingProjects.length === 0 ? (
                    <p className="text-muted">No upcoming projects</p>
                  ) : (
                    <div style={{ maxHeight: "140px", overflowY: "auto" }}>
                      {upcomingProjects.map((project, index) => (
                        <UpcomingProject
                          key={index}
                          name={project.title}
                          startDate={project.startDate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div className="row g-3">
          {/* Upcoming Due Dates */}
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
                  {upcomingItems.length === 0 && (
                    <p className="text-muted text-center">
                      No upcoming due dates
                    </p>
                  )}

                  {upcomingItems.map((item, index) => {
                    const daysLeft = getDaysLeft(item.dueDate);
                    const isUrgent = daysLeft <= 3;

                    return (
                      <div
                        key={index}
                        className="mb-3 p-3"
                        style={{
                          backgroundColor: isUrgent ? "#fff3cd" : "#d1ecf1",
                          borderLeft: `4px solid ${
                            isUrgent ? "#ffc107" : "#0dcaf0"
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
                              padding: "4px 8px",
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
                              <i className="bi bi-people me-1"></i>
                              Team: {item.teamSize} members
                            </div>
                            {item.teamName && (
                              <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                <i className="bi bi-diagram-3 me-1"></i>
                                Team: {item.teamName}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              <i className="bi bi-person-circle me-1"></i>
                              Assigned to: {item.assignedTo}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                              <i className="bi bi-folder2 me-1"></i>
                              Project: {item.projectName}
                            </div>
                          </>
                        )}

                        {/* FOOTER */}
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <i
                            className="bi bi-calendar-event"
                            style={{
                              color: isUrgent ? "#dc3545" : "#0dcaf0",
                            }}
                          ></i>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: isUrgent ? "#dc3545" : "#0dcaf0",
                            }}
                          >
                            Due:{" "}
                            {new Date(item.dueDate).toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>

                          <span
                            className={`badge ${
                              isUrgent ? "bg-warning" : "bg-info"
                            } text-dark`}
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
          
          {/* Available Employees */}
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
                  {loadingEmployees ? (
                    <p className="text-muted text-center">Loading...</p>
                  ) : availableEmployees.length === 0 ? (
                    <p className="text-muted text-center">
                      No available employees
                    </p>
                  ) : (
                    availableEmployees.map((emp) => (
                      <Employee
                        key={emp._id}
                        employee={emp}
                        onView={() => {
                          setSelectedEmployee(emp);
                          setShowProfile(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Profile Modal */}
        {showProfile && selectedEmployee && (
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
              className="modal-dialog "
              style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
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
                  <div className="container-fluid">
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Employee ID
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.employeeId || "-"}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Name
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.name}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Email
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.email || "-"}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Mobile Number
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.contact || "-"}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Designation
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.designation || "-"}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Date of Joining
                      </div>
                      <div
                        className="col-7 col-sm-9"
                        style={{ color: "#212529" }}
                      >
                        {selectedEmployee.doj
                          ? new Date(selectedEmployee.doj).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer border-0 pt-0">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() => setShowProfile(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function ProjectItem({ name, status, dueDate }) {
  const isDelayed = status === "Delayed";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: "600" }}>{name}</p>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
          Due Date{" "}
          {dueDate
            ? new Date(dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
      </div>

      <span
        style={{
          color: "#fff",
          padding: "3px 10px",
          borderRadius: "14px",
          fontSize: "11px",
          background: isDelayed ? "#dc2626" : "#16a34a",
        }}
      >
        {status}
      </span>
    </div>
  );
}

function UpcomingProject({ name, startDate }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <div>
        <p style={{ margin: 0, fontWeight: "600" }}>{name}</p>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
          Starts on{" "}
          {startDate
            ? new Date(startDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
      </div>

      <span
        style={{
          color: "#fff",
          padding: "3px 10px",
          borderRadius: "14px",
          fontSize: "11px",
          background: "#0dcaf0",
        }}
      >
        Upcoming
      </span>
    </div>
  );
}

function Employee({ employee, onView }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div className="d-flex align-items-center gap-2">
        <img
          src={employee.profileImage || "/myprofile.jpg"}
          alt="Employee"
          className="rounded-circle"
          style={{ width: "40px", height: "40px" }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>
            {employee.name}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>
            {employee.designation || "—"}
          </div>
        </div>
      </div>

      <button className="btn btn-sm custom-outline-btn" onClick={onView}>
        View Profile
      </button>
    </div>
  );
}

export default TLDashboardTMS;