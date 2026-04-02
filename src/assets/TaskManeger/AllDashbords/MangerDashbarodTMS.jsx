// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";

// export default function MangerDashbarodTMS() {
//   const navigate = useNavigate();
//   const [showProfile, setShowProfile] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [formattedProjects, setFormattedProjects] = useState([]);
//   const [upcomingProjects, setUpcomingProjects] = useState([]);

//   const { role, username, id } = useParams();

//   const [loadingEmployees, setLoadingEmployees] = useState(false);

//   const [upcomingItems, setUpcomingItems] = useState([]);
//   /* ---------------- KPI STATES ---------------- */
//   const [totalEmployees, setTotalEmployees] = useState(0);
//   const [totalProjects, setTotalProjects] = useState(0);
//   const [totalTeams, setTotalTeams] = useState(0);
//   const [assignedEmployees, setAssignedEmployees] = useState(0);
//   const [totalTasks, setTotalTasks] = useState(0);
//   const [employees, setEmployees] = useState([]);
//   const [availableEmployees, setAvailableEmployees] = useState([]);
//   /* ---------------- FETCH USER ---------------- */
//   const fetchUser = async () => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       const res = await axios.get("http://localhost:8000/me", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data;
//     } catch (err) {
//       console.error("User fetch error", err);
//       return null;
//     }
//   };

//   /* ---------------- FETCH KPI DATA ---------------- */
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         const token = localStorage.getItem("accessToken");

//         const user = await fetchUser();
//         if (!user?._id) return;

//         /* EMPLOYEES */
//         const empRes = await axios.get(
//           `http://localhost:8000/employees/manager/${user._id}`
//         );

//         /* PROJECTS */
//         const projectRes = await axios.get(
//           `http://localhost:8000/api/projects/manager/${user._id}`
//         );

//         /* TEAMS */
//         const teamRes = await axios.get(
//           "http://localhost:8000/api/teams",
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         /* TASKS */
//         const taskRes = await axios.get(
//           "http://localhost:8000/task/getall",
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const tasks = Array.isArray(taskRes.data)
//           ? taskRes.data
//           : taskRes.data.tasks || taskRes.data.data || [];

//         const employeesData = empRes.data.employees || [];
//         const projects = projectRes.data.projects || projectRes.data.data || [];
//         const teams = teamRes.data.data || teamRes.data.teams || [];

//         const formattedProjects = projects.map((p) => ({
//           type: "PROJECT",
//           title: p.name || "—",
//           startDate: p.startDate ?? null,
//           dueDate: p.dueDate ?? null,
//           lead: p.teamLeadName || "—",
//           status: p.status?.name || "In Progress",
//           teamSize: p.assignedEmployees?.length || 0,
//         }));

//         const formattedTasks = tasks.map((t) => ({
//           type: "TASK",
//           title: t.taskName || "—",
//           dueDate: t.dateOfExpectedCompletion || t.deadline || t.endDate || null,
//           assignedTo: t.assignedTo?.name || "—",

//           projectName: t.projectName || "—",
//         }));

//         const filteredUpcomingItems = [
//           ...formattedProjects.filter((p) => {
//             const daysLeft = getDaysLeft(p.dueDate);
//             return daysLeft !== null && daysLeft >= 0 && daysLeft <= 5; // PROJECT → 5 days
//           }),
//           ...formattedTasks.filter((t) => {
//             const daysLeft = getDaysLeft(t.dueDate);
//             return daysLeft !== null && daysLeft >= 0 && daysLeft <= 3; // TASK → 3 days
//           }),
//         ];

//         const getProjectFinalStatus = (status, dueDate) => {
//           // If backend explicitly says Delayed
//           if (status?.toLowerCase() === "delayed") {
//             return "Delayed";
//           }

//           // If due date is crossed
//           if (dueDate) {
//             const due = new Date(dueDate);
//             const today = new Date();

//             // remove time for accurate comparison
//             due.setHours(0, 0, 0, 0);
//             today.setHours(0, 0, 0, 0);

//             if (due < today) {
//               return "Delayed";
//             }
//           }

//           return "In Progress";
//         };

//         const formatted = projects.map((p) => ({
//           title: p.name || "—",
//           startDate: p.startDate ?? null,   // ✅ ADD THIS
//           dueDate: p.dueDate ?? null,
//           status: getProjectFinalStatus(p.status?.name, p.dueDate),
//         }));

//         setFormattedProjects(formatted);

//         const upcoming = formatted.filter((p) => {
//           if (!p.startDate) return false;

//           const start = new Date(p.startDate);
//           const today = new Date();

//           start.setHours(0, 0, 0, 0);
//           today.setHours(0, 0, 0, 0);

//           return start > today; // ✅ future start date
//         });

//         setUpcomingProjects(upcoming);

//         // ✅ THIS WAS MISSING

//         setUpcomingItems(filteredUpcomingItems);
//         /* KPI COUNTS */
//         setTotalEmployees(employeesData.length);
//         setTotalProjects(projects.length);
//         setTotalTeams(teams.length);
//         setTotalTasks(tasks.length);
//         setEmployees(employeesData);

//         /* ASSIGNED EMPLOYEES */
//         const assignedSet = new Set();
//         projects.forEach((p) => {
//           p.assignedEmployees?.forEach((e) =>
//             assignedSet.add(e.toString())
//           );
//         });

//         setAssignedEmployees(assignedSet.size);

//       } catch (err) {
//         console.error("Dashboard API error", err);
//       }
//     };

//     fetchDashboardData();
//   }, []);

//   useEffect(() => {
//     if (!id) return;

//     const fetchAvailableEmployees = async () => {
//       try {
//         setLoadingEmployees(true);

//         const res = await axios.get(
//           `http://localhost:8000/managers/${id}/assigned-employees`
//         );

//         if (res.data.success) {
//           setAvailableEmployees(res.data.employees);
//         }
//       } catch (err) {
//         console.error("Error fetching available employees", err);
//       } finally {
//         setLoadingEmployees(false);
//       }
//     };

//     fetchAvailableEmployees();
//   }, [id]);

//   const getDaysLeft = (date) => {
//     if (!date) return null;

//     const due = new Date(date);
//     if (isNaN(due.getTime())) return null;

//     const today = new Date();
//     return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
//   };
// const isActiveProject = (startDate, endDate) => {
//   if (!startDate || !endDate) return false;

//   const today = new Date();
//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   // remove time for accurate comparison
//   today.setHours(0, 0, 0, 0);
//   start.setHours(0, 0, 0, 0);
//   end.setHours(0, 0, 0, 0);

//   return start <= today && today <= end;
// };

// const activeProjects = formattedProjects.filter((p) =>
//   isActiveProject(p.startDate, p.dueDate)
// );

//   return (
//       <div >
//       <main style={styles.main}>
//         {/* TOP BAR */}

//         {/* KPI CARDS */}
//         <div style={styles.cardGrid}>
//           <KpiCard
//             title="Total Employees"
//             value={totalEmployees}
//             bg="#0d9488"
//             onView={() => navigate(`/tms-dashboard/${role}/${username}/${id}`)}
//           />

//           <KpiCard
//             title="Total Projects"
//             value={totalProjects}
//             bg="#f97316"
//             onView={() => navigate(`/tms-dashboard/${role}/${username}/${id}/project`)}

//           />

//           <KpiCard
//             title="Total Teams"
//             value={totalTeams}
//             bg="#facc15"
//             onView={() => navigate(`/tms-dashboard/${role}/${username}/${id}/teams`)}
//           />

//           <KpiCard
//             title="Total Assigned Tasks"
//             value={totalTasks}
//             bg="#8b5cf6"
//             onView={() => navigate(`/tms-dashboard/${role}/${username}/${id}/task`)}
//           />
//         </div>

//         {/* MIDDLE */}
//         <div style={styles.twoGrid}>
// <div className="card" style={{ height: "200px", borderRadius: "12px" }}>
//   <div className="card-body d-flex flex-column">
//     <h5 className="card-title mb-3">Active Project Summary</h5>

//     <div style={{ maxHeight: "104px", overflowY: "auto" }}>
//       {activeProjects.length === 0 ? (
//         <p className="text-muted">No active projects</p>
//       ) : (
//         activeProjects.map((project, index) => (
//           <ProjectItem
//             key={index}
//             name={project.title}
//             status={project.status}   // In Progress / Delayed
//           />
//         ))
//       )}
//     </div>
//   </div>
// </div>

//           <div style={styles.box}>
//             <h5 className="card-title mb-3">Upcoming Projects</h5>

//             {upcomingProjects.length === 0 ? (
//               <p style={styles.small}>No upcoming projects</p>
//             ) : (
//               <div style={{ maxHeight: "104px", overflowY: "auto" }}>
//                 {upcomingProjects.map((project, index) => (
//                   <UpcomingProject
//                     key={index}
//                     name={project.title}
//                     startDate={project.startDate}
//                   />
//                 ))}
//               </div>
//             )}

//           </div>
//         </div >

//         {/* BOTTOM */}
//         <div style={styles.twoGrid}>
//           <div >
//             <div
//               className="card"
//               style={{ borderRadius: "12px", height: "300px" }}
//             >
//               <div className="card-body" style={{ paddingBottom: "8px" }}>
//                 {/* FIXED HEADER */}
//                 <h5 className="card-title mb-3">Upcoming Due Dates</h5>
//                 <div style={{ maxHeight: "230px", overflowY: "auto" }}>
//                   {upcomingItems.map((item, index) => {
//                     const daysLeft = getDaysLeft(item.dueDate);
//                     const isUrgent = daysLeft <= 3;

//                     return (
//                       <div
//                         key={index}
//                         className="mb-3 p-3"
//                         style={{
//                           backgroundColor: isUrgent ? "#fff3cd" : "#d1ecf1",
//                           borderLeft: `4px solid ${isUrgent ? "#ffc107" : "#0dcaf0"
//                             }`,
//                           borderRadius: "8px",
//                         }}
//                       >
//                         {/* HEADER */}
//                         <div className="d-flex align-items-center gap-2 mb-2">
//                           <span
//                             className={`badge ${item.type === "TASK" ? "bg-primary" : ""
//                               }`}
//                             style={{
//                               backgroundColor:
//                                 item.type === "PROJECT" ? "#8B5FBF" : "",
//                               fontSize: "10px",
//                               padding: "4px 8px",
//                             }}
//                           >
//                             <i
//                               className={`bi ${item.type === "PROJECT"
//                                 ? "bi-folder2"
//                                 : "bi-check2-square"
//                                 } me-1`}
//                             ></i>
//                             {item.type}
//                           </span>

//                           <div style={{ fontWeight: 600, fontSize: "14px" }}>
//                             {item.title}
//                           </div>
//                         </div>

//                         {/* DETAILS */}
//                         {item.type === "PROJECT" ? (
//                           <>
//                             <div style={{ fontSize: "12px", color: "#6c757d" }}>
//                               <i className="bi bi-person-circle me-1"></i>
//                               Team Lead: {item.lead}
//                             </div>
//                             <div style={{ fontSize: "12px", color: "#6c757d" }}>
//                               <i className="bi bi-people me-1"></i>
//                               Team: {item.teamSize} members
//                             </div>
//                           </>
//                         ) : (
//                           <>
//                             <div style={{ fontSize: "12px", color: "#6c757d" }}>
//                               <i className="bi bi-person-circle me-1"></i>
//                               Assigned to: {item.assignedTo}
//                             </div>
//                             <div style={{ fontSize: "12px", color: "#6c757d" }}>
//                               <i className="bi bi-folder2 me-1"></i>
//                               Project: {item.projectName}
//                             </div>
//                           </>
//                         )}

//                         {/* FOOTER */}
//                         <div className="mt-2 d-flex align-items-center gap-2">
//                           <i
//                             className="bi bi-calendar-event"
//                             style={{
//                               color: isUrgent ? "#dc3545" : "#0dcaf0",
//                             }}
//                           ></i>
//                           <span
//                             style={{
//                               fontSize: "12px",
//                               fontWeight: 600,
//                               color: isUrgent ? "#dc3545" : "#0dcaf0",
//                             }}
//                           >
//                             Due: {new Date(item.dueDate).toDateString()}
//                           </span>

//                           <span
//                             className={`badge ${isUrgent ? "bg-warning" : "bg-info"
//                               } text-dark`}
//                             style={{ fontSize: "10px" }}
//                           >
//                             {daysLeft} days left
//                           </span>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div style={styles.box}>
//             <h5 className="card-title mb-3">Available Employees</h5>

//             <div style={styles.employeeScroll}>
//               {loadingEmployees ? (
//                 <p style={styles.small}>Loading...</p>
//               ) : availableEmployees.length === 0 ? (
//                 <p style={styles.small}>No available employees</p>
//               ) : (
//                 availableEmployees.map((emp) => (
//                   <Employee
//                     key={emp._id}
//                     employee={emp}
//                     onView={() => {
//                       setSelectedEmployee(emp);
//                       setShowProfile(true);
//                     }}
//                   />

//                 ))
//               )}
//             </div>
//           </div>

//         </div>
//         {showProfile && selectedEmployee && (
//           <div
//             className="modal fade show"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               background: "rgba(0,0,0,0.5)",
//               position: "fixed",
//               inset: 0,
//               zIndex: 1050,
//             }}
//           >
//             <div
//               className="modal-dialog modal-dialog-scrollable"
//               style={{ maxWidth: "650px", width: "95%", marginTop: "200px" }}
//             >
//               <div className="modal-content">
//                 {/* HEADER */}
//                 <div
//                   className="modal-header text-white"
//                   style={{ backgroundColor: "#3A5FBE" }}
//                 >
//                   <h5 className="modal-title mb-0">Employee Profile</h5>
//                   <button
//                     type="button"
//                     className="btn-close btn-close-white"
//                     onClick={() => setShowProfile(false)}
//                   />
//                 </div>

//                 {/* BODY */}
//                 <div className="modal-body">
//                   <div className="container-fluid">
//                     <div className="row mb-2">
//                       <div className="row mb-2">
//                         <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Employee ID</div>
//                         <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedEmployee.employeeId || "-"} </div>
//                       </div>
//                       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Name</div>
//                       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedEmployee.name}</div>
//                     </div>
//                     <div className="row mb-2">
//                       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Email</div>
//                       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedEmployee.email || "-"}</div>
//                     </div>

//                     <div className="row mb-2">
//                       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Mobile Number</div>
//                       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedEmployee.contact || "-"}  </div>
//                     </div>
//                     <div className="row mb-2">
//                       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Designation</div>
//                       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{selectedEmployee.designation || "-"}  </div>
//                     </div>
//                     <div className="row mb-2">
//                       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Date of Joining</div>
//                       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>{
//                         selectedEmployee.doj
//                           ? new Date(selectedEmployee.doj).toLocaleDateString("en-GB", {
//                             day: "2-digit",
//                             month: "short",
//                             year: "numeric",
//                           })
//                           : "-"
//                       } </div>
//                     </div>

//                   </div>
//                 </div>

//                 {/* FOOTER */}
//                 <div className="modal-footer border-0 pt-0">
//                   <button
//                     className="btn btn-outline-primary"
//                     onClick={() => setShowProfile(false)}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </main>
//     </div>
//   );
// }

// /* ---------- COMPONENTS ---------- */

// function KpiCard({ title, value, bg, onView }) {
//   return (
//     <div style={styles.card}>
//       <div style={styles.left}>
//         <div style={{ ...styles.countBox, backgroundColor: bg + "22", color: bg }}>
//           {value}
//         </div>
//       </div>

//       <div style={styles.center}>
//         <h4 style={styles.title}>{title}</h4>
//       </div>

//       <div style={styles.right}>
//         <button className="btn btn-sm custom-outline-btn" onClick={onView}>
//           View
//         </button>
//       </div>
//     </div>
//   );
// }

// function ProjectItem({ name, status }) {
//   const isDelayed = status === "Delayed";

//   return (
//     <div style={styles.projectRow}>
//       <div>
//         <p style={styles.bold}>{name}</p>
//         <p style={styles.small}>Project</p>
//       </div>

//       <span
//         style={{
//           ...styles.badge,
//           background: isDelayed ? "#dc2626" : "#16a34a",
//         }}
//       >
//         {status}
//       </span>
//     </div>
//   );
// }

// function UpcomingProject({ name, startDate }) {
//   return (
//     <div style={styles.projectRow}>
//       <div>
//         <p style={styles.bold}>{name}</p>
//         <p style={styles.small}>
//           Starts on{" "}
//           {startDate
//             ? new Date(startDate).toLocaleDateString("en-GB", {
//               day: "2-digit",
//               month: "short",
//               year: "numeric",
//             })
//             : "—"}
//         </p>
//       </div>

//       <span style={{ ...styles.badge, background: "#0dcaf0" }}>
//         Upcoming
//       </span>
//     </div>
//   );
// }

// function Employee({ employee, onView }) {
//   return (
//     <div style={styles.projectRow}>
//       <div>
//         <p style={styles.bold}>{employee.name}</p>
//         <p style={styles.small}>{employee.designation}</p>
//       </div>
//       <button style={styles.button} onClick={onView}>
//         View Profile
//       </button>
//     </div>
//   );
// }

// function ProfileRowBS({ label, value }) {
//   return (
//     <div className="row mb-2">
//       <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
//         {label}
//       </div>
//       <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
//         {value}
//       </div>
//     </div>
//   );
// }

// /* ---------- STYLES ---------- */

// const styles = {
//   addTaskBtn: {
//     padding: "8px 16px",
//     backgroundColor: "#1976d2",
//     color: "#fff",
//     border: "none",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "500",
//   },
//   container: {
//     minHeight: "100vh",
//     background: "#f1f5f9",
//     fontFamily: "Arial, sans-serif",
//   },
//   main: {
//     padding: "20px",
//   },
//   topBar: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "16px",
//   },
//   heading: {
//     margin: 0,
//     color: "#2563eb",
//   },
//   search: {
//     padding: "6px 10px",
//     width: "260px",
//     borderRadius: "6px",
//     border: "1px solid #ccc",
//   },

//   kpiCard: {
//     color: "#fff",
//     padding: "14px",
//     borderRadius: "10px",
//   },
//   cardGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
//     gap: "20px",
//     marginBottom: "28px",
//   },

//   card: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     background: "#fff",
//     minWidth: "75px",
//     minHeight: "75px",
//     padding: "20px",
//     borderRadius: "10px",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//   },

//   left: {
//     display: "flex",
//     alignItems: "center",
//   },

//   countBox: {
//     width: "70px",
//     height: "70px",
//     borderRadius: "6px",
//     fontSize: "32px",
//     fontWeight: "bold",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   center: {
//     flex: 1,
//     textAlign: "center",
//   },

//   title: {
//     fontSize: "18px",
//     fontWeight: "600",
//     color: "#2563eb",
//     margin: 0,
//   },

//   right: {
//     display: "flex",
//     alignItems: "center",
//   },

//   viewBtn: {
//     border: "1px solid #2563eb",
//     background: "transparent",
//     color: "#2563eb",
//     padding: "6px 14px",
//     borderRadius: "6px",
//     cursor: "pointer",
//     fontWeight: "500",
//   },
//   cardLabel: {
//     margin: 0,
//     fontSize: "13px",
//   },
//   cardValue: {
//     margin: "4px 0 0",
//     fontSize: "26px",
//   },
//   twoGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "16px",
//     marginBottom: "18px",
//   },
//   box: {
//     background: "#fff",
//     padding: "14px",
//     borderRadius: "10px",
//   },
//   boxTitle: {
//     margin: "0 0 10px",
//     fontSize: "15px",
//     color: "#2563eb",
//   },
//   projectRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "8px",
//   },
//   badge: {
//     color: "#fff",
//     padding: "3px 10px",
//     borderRadius: "14px",
//     fontSize: "11px",
//   },
//   bold: {
//     margin: 0,
//     fontWeight: "600",
//   },
//   small: {
//     margin: 0,
//     fontSize: "12px",
//     color: "#6b7280",
//   },
//   button: {
//     padding: "4px 10px",
//     borderRadius: "6px",
//     border: "1px solid #ccc",
//     background: "#fff",
//     cursor: "pointer",
//     fontSize: "12px",
//   },
//   employeeScroll: {
//     maxHeight: "240px",
//     overflowY: "auto",
//     paddingRight: "6px",
//     scrollbarWidth: "thin",       // Firefox
//   },

// };
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function MangerDashbarodTMS() {
  const navigate = useNavigate();
  const { role, username, id } = useParams();

  /* ---------------- STATE VARIABLES ---------------- */
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [assignedEmployees, setAssignedEmployees] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [managerId, setManagerId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [formattedProjects, setFormattedProjects] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]); // ADD THIS LINE
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  /* ---------------- FETCH USER ---------------- */
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      console.error("User fetch error", err);
      return null;
    }
  };

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

  const getProjectFinalStatus = (status, dueDate) => {
    if (status?.toLowerCase() === "delayed") {
      return "Delayed";
    }

    if (dueDate) {
      const due = new Date(dueDate);
      const today = new Date();

      due.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (due < today) {
        return "Delayed";
      }
    }

    return "In Progress";
  };

  /* ---------------- FETCH DASHBOARD DATA ---------------- */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const user = await fetchUser();
        if (!user?._id) return;
        setManagerId(user._id);

        /* EMPLOYEES */
        const empRes = await axios.get(
          `http://localhost:8000/employees/manager/${user._id}`,
        );

        /* PROJECTS */
        const projectRes = await axios.get(
          `http://localhost:8000/api/projects/manager/${user._id}`,
        );

        /* TEAMS */
        const teamRes = await axios.get(
          `http://localhost:8000/api/teams/createdBy/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        /* TASKS */
        const taskRes = await axios.get(
          `http://localhost:8000/manager/emp/task/${user._id}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

       const tasks = taskRes.data.allTasks || [];
       const totalAssignedTasks = taskRes.data.totalTasks || 0;

        const employeesData = empRes.data.employees || [];
        const projects = projectRes.data.projects || projectRes.data.data || [];
        const teams = teamRes.data.data || teamRes.data.teams || [];
        //////dip code
        //  UPCOMING PROJECTS (ONLY "upcoming project")
        const upcomingProjects = projects
          .filter((p) => {
            const statusValue = p.status?.name || p.status || "";
            const statusLower = statusValue.toString().toLowerCase().trim();
            return statusLower === "upcoming project";
          })
          .map((p) => ({
            title: p.name || "—",
            startDate: p.startDate,
            status: p.status?.name || "Upcoming Project",
          }))
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        //  ACTIVE PROJECTS (ONLY "on track")
        const activeProjectsData = projects
          .filter((p) => {
            const statusValue = p.status?.name || p.status || "";
            const statusLower = statusValue.toString().toLowerCase().trim();
            return statusLower === "on track";
          })
          .map((p) => ({
            title: p.name || "—",
            dueDate: p.dueDate,
            status: "On Track",
          }));

        // Set states
        // setTotalEmployees(employeesData.length);
        // setTotalProjects(projects.length);
        // setTotalTeams(teams.length);
        // setTotalTasks(tasks.length);
        // setEmployees(employeesData);

        setUpcomingProjects(upcomingProjects);
        setFormattedProjects(
          projects.map((p) => ({
            title: p.name || "—",
            startDate: p.startDate ?? null,
            dueDate: p.dueDate ?? null,
            status:
              p.status?.name ||
              getProjectFinalStatus(p.status?.name, p.dueDate),
          })),
        );

        //  SET ACTIVE PROJECTS AS STATE

        setActiveProjects(activeProjectsData);

        const formattedProjectsForUpcoming = projects.map((p) => ({
          type: "PROJECT",
          title: p.name || "—",
          startDate: p.startDate ?? null,
          dueDate: p.dueDate ?? null,
          lead: p.teamLeadName || "—",
          status: p.status?.name || "In Progress",
          teamSize: p.assignedEmployees?.length || 0,
          rawProject: p,
        }));

        /////

        const formattedTasks = tasks.map((t) => ({
          type: "TASK",
          title: t.taskName || "—",
          dueDate:
            t.dateOfExpectedCompletion || t.deadline || t.endDate || null,
          assignedTo: t.assignedTo?.name || "—",
          projectName: t.projectName || "—",
        }));

        const filteredUpcomingItems = [
          ...formattedProjectsForUpcoming.filter((p) => {
            const daysLeft = getDaysLeft(p.dueDate);

            // rutuja code start
            const cancelled = isProjectCancelled(p.rawProject || p);

            return (
              !cancelled && daysLeft !== null && daysLeft >= 0 && daysLeft <= 5
            );
          }),
          // rutuja code end
          //   return daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;
          // }),
          ...formattedTasks.filter((t) => {
            const daysLeft = getDaysLeft(t.dueDate);
            return daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
          }),
        ];

        const formatted = projects.map((p) => ({
          title: p.name || "—",
          startDate: p.startDate ?? null,
          dueDate: p.dueDate ?? null,
          status: getProjectFinalStatus(p.status?.name, p.dueDate),
        }));

        setFormattedProjects(formatted);

        const upcoming = formatted.filter((p) => {
          if (!p.startDate) return false;

          const start = new Date(p.startDate);
          const today = new Date();

          start.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          return start > today;
        });

        // setUpcomingProjects(upcoming);
        setUpcomingItems(filteredUpcomingItems);

        /* KPI COUNTS */
        setTotalEmployees(employeesData.length);
        setTotalProjects(projects.length);
        setTotalTeams(teams.length);
        // setTotalTasks(tasks.length);
        setTotalTasks(totalAssignedTasks);
        setEmployees(employeesData);

        /* ASSIGNED EMPLOYEES */
        const assignedSet = new Set();
        projects.forEach((p) => {
          p.assignedEmployees?.forEach((e) => assignedSet.add(e.toString()));
        });

        setAssignedEmployees(assignedSet.size);
      } catch (err) {
        console.error("Dashboard API error", err);
      }
    };

    fetchDashboardData();
  }, []);

  /* ---------------- FETCH AVAILABLE EMPLOYEES ---------------- */
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      if (!managerId) return; 
      
      try {
        setLoadingEmployees(true);
        const token = localStorage.getItem("accessToken");
        
        const res = await axios.get(
          `http://localhost:8000/manager/${managerId}/available-employees`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        if (res.data.success) {
          setAvailableEmployees(res.data.availableEmployees || []);
        }
      } catch (err) {
        setAvailableEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
  
    fetchAvailableEmployees();
  }, [managerId]);
  

  const activeProjectsData = formattedProjects.filter((p) =>
    isActiveProject(p.startDate, p.dueDate),
  );

  // shiivani
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

  const isProjectCancelled = (project) => {
    const status = project.status?.name || project.status;
    const statusStr = typeof status === "string" ? status.toLowerCase() : "";

    const isCancelled =
      statusStr.includes("cancelled") || project.isCancelled === true;

    return isCancelled;
  };

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
                                weekday: "short", // Mon, Tue, Wed
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
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
                  ) : setAvailableEmployees.length === 0 ? (
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
                              },
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
        Upcoming Project
      </span>
    </div>
  );
}

function Employee({ employee, onView }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div className="d-flex align-items-center gap-2">
        <img
          src={employee.image || "/myprofile.jpg"}
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

export default MangerDashbarodTMS;
