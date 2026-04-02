import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useParams,
  NavLink,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import AdminDashboard from "./AdminDashboard";
import HRDashboard from "./HRDashboard";
import EmployeeDashbord from "./EmployeeDashbord";
import AllEmployeeDetails from "../OnlyForAdmin/AllEmployeeList";
import TodaysEmployeeDetails from "../OnlyForAdmin/TodaysEmployeeDetails";
import AllEventsCards from "../Events/AllEventCards";
import AllHolidays from "../Holidays/AllHolidays";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AddEmployee from "../LoginRegistration/AddEmployee";
import AdminAddLeaveBalance from "../Leaves/AdminAddLeaveBalance";
import TLResignation from "./TLResignation"
import "bootstrap/dist/css/bootstrap.min.css";
import "./dashboard.css";
import {
  HouseDoorFill,
  PersonLinesFill,
  CalendarCheckFill,
  FileEarmarkTextFill,
  CalendarEventFill,
  BarChartFill,
  GearFill,
} from "react-bootstrap-icons";
import EmployeeLeaveBalance from "../Leaves/EmployeeLeaveBalance";
import ApplyRegularization from "../Regularizations/ApplyRegularization";
import AllEmployeeRegularizationRequestForAdmin from "../Regularizations/AllEmployeeRegularizationRequestForAdmin";
import AllRequest from "../All/AllRequest";
import MyProfile from "./MyProfile";
import MyAttendance from "../MyAttendance";
import AdminSetting from "../OnlyForAdmin/AdminSetting";
import EmployeeSettings from "../OnlyForAdmin/EmployeeSettings";
import EventsAndHolidaysDashboard from "../Events/EventsAndHolidaysDashboard";
import ManagerDashboard from "./ManagerDashboard";
import EmployeeMyProfileForAdmin from "../OnlyForAdmin/EmployeeMyProfileForAdmin";
import EmployeeFullAttendance from "../OnlyForAdmin/EmployeeFullAttendace";
import HrAdminLeavebalance from "./HrAdminLeavebalance";
import ManagerAssignedEmployeesAttendance from "../OnlyForAdmin/ManagerAssignEmployeeAttendance";
import Gallery from "../Events/Gallery";
import VisualDiary from "../Events/VisualDiary";
import AddPolicyPage from "./AddPolicyPage";
import HrPolicy from "./HrPolicy";
import EmployeeTeams from "./EmployeeTeams";
import EmployeeFeedback from "./EmployeeFeedback";
import HRFeedback from "./HRFeedback";
import HRScheduleInterview from "./HRScheduleInterview";
import EmployeeInterviews from "./EmployeeInterviews";
import ManagerInterviews from "./ManagerInterviews";
import AdminCareer from "../Careers/AdminCareer";
import EmployeeCareer from "../Careers/EmployeeCareer";
import EmployeePolicy from "./EmployeePolicy";
import Resignation from "./Resignation";
import HrResignation from "./HrResignation";
import EmployeeResignation from "./EmployeeResignation";
import Performances from "../Performances/Performances";
import ManagerPerformances from "../Performances/ManagerPerformances";
import ManagerResignation from "./ManagerResignation";
import SupportEmployeeSetting from "../ITSupport/SupportEmployeeSetting";
import ITSupportDashboard from "../ITSupport/ITSupportDashboard";
import AdminFeedback from "./AdminFeedback";
// import AdminPerformances from "../Performances/AdminPerformances";
import EmployeePerformances from "../Performances/EmployeePerformances";
// import CooPerformances from "../Performances/CooPerformances";
// import CeoPerformances from "../Performances/CeoPerformances";
import JobCandidates from "../Careers/JobCandidates";//rushikesh
import TLAllEmployee from "../../assets/TaskManeger/AllDashbords/TLAllEmployee";//rutuja
import TLTeamMemberAttendance from "../OnlyForAdmin/TLTeamMemberAttendance" //rutuja
import TLDashboard from "./TLDashboard"
import TeamLeaderPerformances from "../Performances/TeamLeaderPerformances";

function Dashboard() {
  const { role, username, id } = useParams();
  const [user, setUser] = useState(null);
  const location = useLocation(); /////ems tms button
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 🧩 spinner state

  console.log("Dashboard rendered");
  //////////ems tms button
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("/tms-dashboard") ? "TMS" : "EMS",
  );

  //rutuja
  const [lastEMSRoute, setLastEMSRoute] = useState(() => {
    return (
      localStorage.getItem("lastEMSRoute") ||
      `/dashboard/${role}/${username}/${id}`
    );
  });
const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (location.pathname.includes("/dashboard")) {
      let cleanPath = location.pathname;
      if (cleanPath.includes("/*")) {
        cleanPath = cleanPath.replace("/*", "");
      }

      if (!cleanPath.endsWith(`/dashboard/${role}/${username}/${id}`)) {
        setLastEMSRoute(cleanPath);
        localStorage.setItem("lastEMSRoute", cleanPath);
      }
      localStorage.setItem("activeTab", "EMS");
      setActiveTab("EMS");
    }
  }, [location.pathname, role, username, id]);

  const handleEMS = () => {
    localStorage.setItem("activeTab", "EMS");
    setActiveTab("EMS");
    // navigate(`/dashboard/${user.role}/${user.username || user.name}/${user._id}`);
    navigate(lastEMSRoute);
  };

  const handleTMS = () => {
    const lastTMS =
      localStorage.getItem("lastTMSRoute") ||
      `/tms-dashboard/${user?.role || role}/${user?.username || username || user?.name
      }/${user?._id || id}`;

    localStorage.setItem("activeTab", "TMS");
    setActiveTab("TMS");
    navigate(lastTMS);
    // navigate(`/tms-dashboard/${user.role}/${user.username || user.name}/${user._id}`);
  };
  //////
  useEffect(() => {
    const isInvalid =
      !role ||
      !username ||
      !id ||
      ["null", "undefined"].includes(role) ||
      ["null", "undefined"].includes(username) ||
      ["null", "undefined"].includes(id);

    if (isInvalid) {
      console.warn("⚠️ Invalid session detected. Logging out...");
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Navigate once only
      if (window.location.pathname !== "/") {
        navigate("/", { replace: true });
      }
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    let isMounted = true;
    axios
      .get("https://ems-cws-backend-9wgt.vercel.app/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (isMounted);
        {
          setUser(res.data);

          if (!localStorage.getItem("lastEMSRoute")) {
            localStorage.setItem(
              "lastEMSRoute",
              `/dashboard/${res.data.role}/${res.data.username || res.data.name
              }/${res.data._id}`,
            );
            setLastEMSRoute(
              `/dashboard/${res.data.role}/${res.data.username || res.data.name
              }/${res.data._id}`,
            );
          }
        }
      })
      .catch((err) => {
        console.error("Token check failed:", err?.response?.status);
        localStorage.clear();
        sessionStorage.clear();
        if (isMounted) navigate("/", { replace: true });
      });

    return () => {
      isMounted = false;
    };
  }, []);
  //role, username, id, navigate

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(`https://ems-cws-backend-9wgt.vercel.app/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/");
      });
  }, [navigate]);

  // in Dashboard or Header where logout is triggered
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const refreshToken = localStorage.getItem("refreshToken");
      // call backend to invalidate refresh token (optional)
      await axios.post("https://ems-cws-backend-9wgt.vercel.app/logout", { refreshToken });

      // clear everything
      // ❗ Clear active browser session
      // sessionStorage.removeItem("activeUser");
      // ❗ Clear localStorage tokens
      // localStorage.removeItem("accessToken");
      // localStorage.removeItem("refreshToken");
      // localStorage.removeItem("role");
      // localStorage.removeItem("username");
      // localStorage.removeItem("id");

      //    // Notify all tabs
      // const bc = new BroadcastChannel("auth");
      // bc.postMessage({ type: "LOGOUT" });

      // optionally clear other app state...
      localStorage.clear();
      // update a top-level indicator if you use context or store
      // (not required if App reads localStorage)
      // navigate once after clearing
      // Give time for spinner before redirect
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } catch (err) {
      console.error("Logout error:", err);
      // still clear local state and navigate
      // localStorage.removeItem("accessToken");
      // localStorage.removeItem("refreshToken");
      // localStorage.removeItem("role");
      // localStorage.removeItem("username");
      // localStorage.removeItem("id");
      localStorage.clear();

      navigate("/", { replace: true });
    } finally {
      // optional spinner stop (navigate will mount login)
      setIsLoggingOut(false);
    }
  };
useEffect(() => {
  if (!user?._id) return;
  fetchNotifications();
}, [user?._id]);

const fetchNotifications = async () => {
  console.log("userId",user);
  console.log("userId",user._id);
  if (!user._id) return;
  
  console.log("hello ........")

  try {
    const res = await axios.get(
      `https://ems-cws-backend-9wgt.vercel.app/notifications/${user._id}`
    );

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recentNotifications = res.data.filter((n) => {
      const createdDate = new Date(n.createdAt);
      return createdDate >= fifteenDaysAgo;
    });

    setNotifications(recentNotifications);
  } catch (err) {
    console.error(err);
  }
};
  if (!user)
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow text-primary"
          role="status"
          style={{ width: "4rem", height: "4rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold text-primary">Loading...</p>
      </div>
    );

  const dashboards = {
    admin: <AdminDashboard user={user} role={role} />,
    ceo: <AdminDashboard user={user} role={role} />,
    employee: <EmployeeDashbord user={user} />,
    hr: <EmployeeDashbord user={user} />,
    manager: <EmployeeDashbord user={user} />,
    coo: <AdminDashboard user={user} role={role} />,
    md: <AdminDashboard user={user} role={role} />,
    IT_Support: <EmployeeDashbord user={user} />,
    Team_Leader: <EmployeeDashbord user={user} />,    //rutuja 
  };

  console.log("user", user);
  return (
    <div>
      {/* //EMS TMS BUTTON */}
      <div
        className="top-tab-bar"
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #3A5FBE 0%, #5a7fd4 100%)",
          boxShadow: "0 2px 8px rgba(58, 95, 190, 0.15)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 20px",
          height: "56px",
        }}
      >
        <div
          className="tab-container"
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            padding: "6px",
            borderRadius: "30px",
            backdropFilter: "blur(10px)",
          }}
        >
          <button
            className="tab-button"
            onClick={handleEMS}
            style={{
              padding: "10px 50px",
              borderRadius: "25px",
              border: "none",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "EMS" ? "#fff" : "transparent",
              color: activeTab === "EMS" ? "#3A5FBE" : "#fff",
              boxShadow:
                activeTab === "EMS" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            <span className="tab-full-text">Employee Management System</span>
            <span className="tab-short-text" style={{ display: "none" }}>
              EMS
            </span>
          </button>
          <button
            className="tab-button"
            onClick={handleTMS}
            style={{
              padding: "10px 50px",
              borderRadius: "25px",
              border: "none",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: activeTab === "TMS" ? "#fff" : "transparent",
              color: activeTab === "TMS" ? "#3A5FBE" : "#fff",
              boxShadow:
                activeTab === "TMS" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            <span className="tab-full-text">Task Management System</span>
            <span className="tab-short-text" style={{ display: "none" }}>
              TMS
            </span>
          </button>
        </div>
      </div>

      {/* //// */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        <Sidebar handleLogout={handleLogout} />
        {/* Main content */}
        <div className="main-content-wrapper">
         <Header
            notifications={notifications}
            fetchNotifications={fetchNotifications}
            user={user}
            handleLogout={handleLogout}
            activeTab={activeTab}
          />
          <div className="main-container">
            <Routes>
              <Route path="" element={dashboards[role]} />
              <Route
                path="leavebalance"
                element={
                  user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "coo" ||
                    user.role === "md" ? ( //|| user.role === "hr"
                    <AdminAddLeaveBalance 
                    user={user} 
                    fetchNotifications={fetchNotifications}
                     />
                  ) : (
                    <EmployeeLeaveBalance user={user}
                    fetchNotifications={fetchNotifications} />
                  )
                }
              />
              {/* /hr-core-dashboard */}
              {/* <Route
              path="/hr-core-dashboard"
              element={
                user.role === "hr"  //|| user.role === "hr"
                  ? <HRDashboard user={user} />
                  : null
              }
            /> */}
              {/* hr-leavebalance */}
              <Route
                path="/hr-leavebalance"
                element={
                  user.role === "hr" ? ( //|| user.role === "hr"
                    <HrAdminLeavebalance user={user} />
                  ) : null
                }
              />
              <Route
                path="/hr-employee-regularization"
                element={
                  user.role === "hr" ? ( //|| user.role === "hr"
                    <AllEmployeeRegularizationRequestForAdmin user={user} />
                  ) : null
                }
              />
              <Route
                path="/hr-core-dashboard"
                element={
                  user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "hr" ||
                    user.role === "coo" ||
                    user.role === "md" ? (
                    <HRDashboard user={user} />
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied: Admins Only
                    </h5>
                  )
                }
              />
              <Route
                path="TeamAttendance"
                element={<ManagerAssignedEmployeesAttendance user={user} />}
              />

              {/* rutuja code  */}
              <Route
                path="TLTeamMemberAttendance"
                element={<TLTeamMemberAttendance user= {user} />}
              />



              {/* manager-core-dashboard */}
              <Route
                path="/manager-core-dashboard"
                element={
                  user.role === "manager" ? ( //|| user.role === "hr"
                    <ManagerDashboard user={user} />
                  ) : null
                }
              />
              <Route
                path="allemployeedetails"
                element={<AllEmployeeDetails />}
              />
              {/* <Route path="employeeprofile" element={<EmployeeMyProfileForAdmin />} /> */}
              <Route
                path="employeeprofile/:empId"
                element={
                  user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "hr" ||
                    user.role === "coo" ||
                    user.role === "md" ? (
                    <EmployeeMyProfileForAdmin />
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied: Admins Only
                    </h5>
                  )
                }
              />
              <Route path="addemployee" element={<AddEmployee />} />
              <Route
                path="myprofile"
                element={<MyProfile user={user} setUser={setUser} />}
              />
              <Route
                path="regularization"
                element={
                  user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "coo" ||
                    user.role === "md" ? ( //|| //user.role === "hr"
                    <AllEmployeeRegularizationRequestForAdmin user={user} />
                  ) : (
                    <ApplyRegularization user={user} />
                  )
                }
              />
              <Route
                path="regularization"
                element={
                  // snehal add IT_Supportt
                  ["employee", "IT_Support","Team_Leader"].includes(user.role) ? (
                    <ApplyRegularization />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />
              <Route path="allRequest" element={<AllRequest />} />
              <Route
                path="TodaysAttendanceDetails"
                element={<TodaysEmployeeDetails />}
              />
              <Route path="AllEvents" element={<AllEventsCards />} />
              <Route
                path="AllEventsandHolidays"
                element={<EventsAndHolidaysDashboard />}
              />
              {/* <Route path="AllHolidays" element={<AllHolidays />} /> */}
              {/* <Route path="MyAttendance" element={<MyAttendance employeeId={user._id}/>} /> */}
              {/* <Route
              path="employee"
              element={
                user.role === "ceo"
                  ? <AllEmployeeDetails />
                  : <MyAttendance employeeId={user._id} />
              }
            /> */}
              {/* //added jayashree */}
              <Route
                path="schedule-interview"
                element={
                  ["hr", "coo", "ceo", "md", "admin"].includes(user.role) ? (
                    <HRScheduleInterview user={user} />
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied
                    </h5>
                  )
                }
              />
              <Route
                path="interviews"
                element={
                  user.role === "employee" || user.role === "IT_Support"|| user.role === "Team_Leader" ? (
                    <EmployeeInterviews />
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied
                    </h5>
                  )
                }
              />
              <Route
                path="manager/interviews"
                element={
                  ["manager"].includes(user.role) ? (
                    <ManagerInterviews /> // alag component
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied
                    </h5>
                  )
                }
              />
              // Assuming `user` is available (from context, Redux, or props)
              <Route
                path="employee"
                element={
                  user.role === "employee" ||
                    user.role === "hr" ||
                    user.role === "manager" ||
                    user.role === "Team_Leader" || //rutuja
                    user.role === "IT_Support" ? ( // employee roles
                    <MyAttendance employeeId={user._id} />
                  ) : user.role === "ceo" ||
                    user.role === "admin" ||
                    user.role === "coo" ||
                    user.role === "md" ? ( // admin roles
                    <TodaysEmployeeDetails />
                  ) : (
                    <p>Access Denied</p>
                  )
                }
              />
              {user?.role === "admin" ||
                user?.role === "ceo" ||
                user?.role === "coo" ||
                user?.role === "md" ? (
                <Route
                  path="settings"
                  element={<AdminSetting user={user} setUser={setUser} />}
                />
              ) : (
                <Route
                  path="settings"
                  element={<EmployeeSettings user={user} setUser={setUser} />}
                />
              )}
              {user?.role === "admin" ||
                user?.role === "hr" ||
                // user.role === "manager" ||
                user?.role === "ceo" ||
                user?.role === "coo" ||
                user?.role === "md" ? (
                <Route path="careers" element={<AdminCareer user={user} />} />
              ) : (
                <Route
                  path="careers"
                  element={<EmployeeCareer user={user} />}
                />
              )}
              {/* added by rushikesh */}
              <Route
                path="job-candidates/:jobId"
                element={<JobCandidates />}
              />

              <Route
                path="employeeattendance/:empId"
                element={
                  user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "hr" ||
                    user.role === "manager" ||
                    user.role === "Team_Leader" || //rutuja
                    user.role === "coo" ||
                    user.role === "md" ? (
                    <EmployeeFullAttendance />
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied: Admins Only
                    </h5>
                  )
                }
              />
              <Route
                path="Gallery"
                element={
                  user?.role === "admin" ||
                    user?.role === "ceo" ||
                    user?.role === "coo" ||
                    user?.role === "md" ? (
                    <Gallery user={user} />
                  ) : (
                    <VisualDiary user={user} />
                  )
                }
              />
              <Route
                path="hr-policy"
                element={
                  ["admin", "hr", "ceo", "coo", "md"].includes(user.role) ? (
                    <HrPolicy />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />
              <Route
                path="feedback"
                element={
                  ["hr"].includes(user?.role?.toLowerCase()) ? (
                    <HRFeedback />
                  ) : ["admin"].includes(user?.role?.toLowerCase()) ? (
                    <AdminFeedback />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />
              <Route
                path="/SupportEmployeeSetting"
                element={<SupportEmployeeSetting />}
              />
              <Route
                path="/ITSupportDashboard"
                element={<ITSupportDashboard />}
              />

              <Route
                path="employee-feedback"
                element={
                  ["employee", "manager", "Team_Leader"].includes(user?.role) ? ( //rutuja
                    <EmployeeFeedback user={user} />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />

              <Route
                path="add-policy"
                element={
                  user.role === "admin" || user.role === "hr" ? (
                    <AddPolicyPage />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />


              <Route
                path="teams"
                element={
                  user.role === "employee" ||
                    user.role === "IT_Support" ||
                    user.role === "manager" ? (
                    <EmployeeTeams user={user}/>
                    //rutuja
                  ) 
                  // rutuja code
                  : user.role === "Team_Leader" ? (
                    <TLAllEmployee />
                  ) 
                  //
                  : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied
                    </h5>
                  )
                }
              />



              {/* //Added by Rushikesh */}
              <Route
                path="employee-policy"
                element={
                  ["employee", "manager", "IT_Support","Team_Leader"].includes(user.role) ? (
                    <EmployeePolicy user={user} />
                  ) : (
                    <h5 className="text-danger text-center">Access Denied</h5>
                  )
                }
              />
              <Route
                path="resignation"
                element={
                  ["admin", "ceo", "coo", "md"].includes(user?.role) ? (
                    <Resignation />
                  ) : (
                    <h5 className="text-danger text-center mt-4">
                      Access Denied
                    </h5>
                  )
                }
              />
              <Route
                path="Hr-Resignation"
                element={
                  role === "hr" ? (
                    <HrResignation user={user} />
                  ) : (
                    <h5>Access Denied</h5>
                  )
                }
              />
              <Route
                path="Employee-Resignation"
                element={
                  user?.role === "employee" || user.role === "IT_Support" ? (
                    <EmployeeResignation user={user} />
                  ) : (
                    <h5 className="text-danger text-center mt-4">
                      Access Denied
                    </h5>
                  )
                }
              />

            <Route
                path="TL-Resignation"
                element={
                  user?.role === "Team_Leader" ? (
                    <TLResignation user={user} />
                  ) : (
                    <h5 className="text-danger text-center mt-4">
                      Access Denied
                    </h5>
                  )
                }
              />
              <Route
                path="Manager-Resignation"
                element={
                  user?.role === "manager" ? (
                    <ManagerResignation user={user} />
                  ) : (
                    <h5 className="text-danger text-center mt-4">
                      Access Denied
                    </h5>
                  )
                }
              />

              <Route
                  path="/tl-dashboard"
                  element={
                    user.role === "Team_Leader" ? (
                      <TLDashboard user={user} />
                    ) : (
                      <h5 className="text-center mt-4 text-danger">
                        Access Denied
                      </h5>
                    )
                  }
              />
              {/* It support  */}
              <Route
                path="performance"
                element={
                  user.role === "hr" ||
                    user.role === "admin" ||
                    user.role === "ceo" ||
                    user.role === "coo" ? (
                    <Performances user={user} />
                  ) : user.role === "manager" ? (
                    <ManagerPerformances user={user} />
                  ) : user.role === "employee"  ? (
                    <EmployeePerformances user={user} />
                  ): user.role === "Team_Leader" ? (
                    <TeamLeaderPerformances user={user} /> 
                  ) : (
                    <h5 className="text-center mt-4 text-danger">
                      Access Denied
                    </h5>
                  )
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
