import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Header from "../../AllDashboards/Header";
import TMSSidebar from "./TMSSidebar";

import AdminDashboardTMS from "./AdminDashboardTMS";
import AdminTaskTMS from "./AdminTaskTMS";
import EmployeeDashbordTMS from "./EmployeeDashbordTMS";
import MangerDashbarodTMS from "./MangerDashbarodTMS";
import EmployeeTaskTMS from "./EmployeeTaskTMS";
import MangerTaskTMS from "./MangerTaskTMS";
import AdminProjectTMS from "./AdminProjectTMS";
import MangerProjectTMS from "./MangerProjectTMS";
import EmployeeProjectTMS from "./EmployeeProjectTMS";
import AdminTeamsTMS from "./AdminTeamsTMS";
import ManagerTeamsTMS from "./MangerTeamsTMS";
import EmployeeTeamsTMS from "./EmployeeTeamsTMS";
import AdminReportTMS from "./AdminReportTMS";
import MangerReportTMS from "./MangerReportTMS";
import EmployeeReportTMS from "./EmployeeReportTMS";
import AdminSettingTMS from "./AdminSettingTMS";
import ManagerSettingTMS from "./MangerSettingTMS";
import EmployeeSettingTMS from "./EmployeeSettingTMS";

import "./TMSDashboard.css";
import HRReportTMS from "./HRReportTMS";
import MyProfile from "../../AllDashboards/MyProfile";
import AdminAllEmployeeTMS from "./AdminAllEmployeeTMS";
import AdminTasklog from "../TaskLogs/AdminTasklog";
import ManagerTasklog from "../TaskLogs/ManagerTasklog";
import EmployeeTasklog from "../TaskLogs/EmployeeTasklog";
import EmployeeProfileForAdmin from "../../OnlyForAdmin/EmployeeMyProfileForAdmin";

import TLDashboardTMS from "./TLDashboardTMS";   
import TLTaskTMS from "../AllDashbords/TLTaskTMS"
import TeamLeadTeamTMS from "../AllDashbords/TeamLeadTeamTMS" 
import TlProjectTMS from "../AllDashbords/TlProjectTMS" 
import TLAllEmployee from "../AllDashbords/TLAllEmployee"
import TLTaskLog from "../TaskLogs/TLTaskLog"; 
import TeamLeadReportTMS from "../AllDashbords/TeamLeadReportTMS" //rutuja


function TMSDashboard() {
  const { role } = useParams();
  //
  const navigate = useNavigate();
  const location = useLocation();
  //
  const user = JSON.parse(localStorage.getItem("activeUser"));

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  //
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("/tms-dashboard") ? "TMS" : "EMS",
  );

  // Rutuja
  const [lastTMSRoute, setLastTMSRoute] = useState(() => {
    return (
      localStorage.getItem("lastTMSRoute") ||
      `/tms-dashboard/${user?.role}/${user?.username || user?.name}/${
        user?._id
      }`
    );
  });
  useEffect(() => {
    if (location.pathname.includes("/tms-dashboard")) {
      let cleanPath = location.pathname;
      if (cleanPath.includes("/*")) {
        cleanPath = cleanPath.replace("/*", "");
      }

      if (
        !cleanPath.endsWith(
          `/tms-dashboard/${user?.role}/${user?.username || user?.name}/${
            user?._id
          }`,
        )
      ) {
        setLastTMSRoute(cleanPath);
        localStorage.setItem("lastTMSRoute", cleanPath);
      }
      localStorage.setItem("activeTab", "TMS");
      setActiveTab("TMS");
    }
  }, [location.pathname, user]);

  //
  useEffect(() => {
    async function getUserById(id) {
      try {
        const response = await fetch(`https://ems-cws-backend-9wgt.vercel.app/getEmployee/${id}`);
        if (!response.ok)
          throw new Error(`Failed to fetch user: ${response.status}`);
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user?._id) getUserById(user._id);
  }, [user?._id]);
  /////
  const handleEMS = () => {
    const lastEMS =
      localStorage.getItem("lastEMSRoute") ||
      `/dashboard/${user.role}/${user.username || user.name}/${user._id}`;
    localStorage.setItem("activeTab", "EMS");
    setActiveTab("EMS");
    navigate(lastEMS);
    // setActiveTab("EMS");
    // navigate(`/dashboard/${user.role}/${user.username || user.name}/${user._id}`);
  };

  const handleTMS = () => {
    localStorage.setItem("activeTab", "TMS");
    setActiveTab("TMS");
    navigate(lastTMSRoute);
    // setActiveTab("TMS");
    // navigate(`/tms-dashboard/${user.role}/${user.username || user.name}/${user._id}`);
  };
  /////
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading ...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Clean Centered Pill Tabs - Responsive */}
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

      {/* // main tms Page */}
      <div className="tmsPage">
        <TMSSidebar />

        <div className="tmsMain">
          <Header
            user={userData}
            handleLogout={handleLogout}
            activeTab={activeTab}
          />

          <div className="tmsContent">
            <Routes>
              <Route
                index
                element={
                  role === "admin" ||
                  role === "hr" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ? (
                    <AdminDashboardTMS user={user} />
                  ) : role === "manager" ? (
                    <MangerDashbarodTMS />
                  )
                  : role === "Team_Leader" ? (
                    <TLDashboardTMS/>
                  )
                  : (
                    <EmployeeDashbordTMS user={userData} />
                  )
                }
              />
              <Route
                path="task"
                element={
                  role === "admin" ||
                  role === "hr" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ? (
                    <AdminTaskTMS />
                  ) : role === "manager" ? (
                    <MangerTaskTMS user={user} />
                  ):role === "Team_Leader" ? (
                    <TLTaskTMS user={user} />
                  ) 
                  : (
                    <EmployeeTaskTMS user={user} />
                  )
                }
              />
              <Route
                path="project"
                element={
                  role === "admin" ||
                  role === "hr" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ? (
                    <AdminProjectTMS />
                  ) : role === "manager" ? (
                    <MangerProjectTMS user={user} />
                  ) : role === "Team_Leader"  ? (
                    <TlProjectTMS user={user} /> //rutuja
                  ): (
                    <EmployeeProjectTMS employeeId={user?._id} />
                  )
                }
              />
              <Route
                path="teams"
                element={
                  role === "admin" ||
                  role === "hr" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ? (
                    <AdminTeamsTMS />
                  ) : role === "manager" ? (
                    <ManagerTeamsTMS />
                  ):role === "Team_Leader" ? (
                    <TeamLeadTeamTMS  user={user}  />   //shivani 
                  ) : (
                    <EmployeeTeamsTMS user={user} />
                  )
                }
              />
              <Route path="myprofile" element={<MyProfile user={user} />} />
              <Route
                path="myprofile/:empId"
                element={<EmployeeProfileForAdmin user={user} />}
              />
              <Route
                path="report"
                element={
                  role === "admin" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ||
                  role === "hr" ? (
                    <HRReportTMS />
                  ) : role === "manager" ? (
                    <MangerReportTMS user={user} />
                  ) : role === "Team_Leader" ? (
                    <TeamLeadReportTMS  user={user}  />   
                  ): (
                    <EmployeeReportTMS employeeId={userData?._id || null} />
                  )
                }
              />
              <Route
                path="setting"
                element={
                  role === "admin" ? (
                    <AdminSettingTMS />
                  ) : role === "manager" ? (
                    <ManagerSettingTMS />
                  ) : (
                    <EmployeeSettingTMS />
                  )
                }
              />

              <Route path="employee" element={<AdminAllEmployeeTMS user={user}/>} />

              <Route path="/my-team-member" element={<TLAllEmployee />} />

              <Route
                path="tasklogs"
                element={
                  role === "admin" ||
                  role === "hr" ||
                  role === "ceo" ||
                  role === "coo" ||
                  role === "md" ? (
                    <AdminTasklog />
                  ) : role === "manager" ? (
                    <ManagerTasklog user={user} />
                  ): role === "Team_Leader" ? (
                    <TLTaskLog user={user} />
                  ) : (
                    <EmployeeTasklog user={user} />
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

export default TMSDashboard;
