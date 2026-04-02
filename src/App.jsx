import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import EmployeeVerify from "./assets/LoginRegistration/EmployeeVerify";
import AddEmployee from "./assets/LoginRegistration/AddEmployee";
import Login from "./assets/LoginRegistration/Login";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./assets/AllDashboards/Dashboard";
import PasswordReset from "./assets/LoginRegistration/PasswordReset";
import ForgotPassword from "./assets/LoginRegistration/ForgotPassword";
import BackButton from "./BackButton";
import React, { useEffect } from "react";
import "./App.css";
import TMSDashboard from "./assets/TaskManeger/AllDashbords/TMSDashboard";
//import TMSMainDashboard from "./assets/TaskManeger/AllDashbords/TMSMainDashboard";
import AdminDashboardTMS from "./assets/TaskManeger/AllDashbords/AdminDashboardTMS";
import AdminTaskTMS from "./assets/TaskManeger/AllDashbords/AdminTaskTMS";
import AdminProjectTMS from "./assets/TaskManeger/AllDashbords/AdminProjectTMS";
import AdminTeamsTMS from "./assets/TaskManeger/AllDashbords/AdminTeamsTMS";
import AdminReportTMS from "./assets/TaskManeger/AllDashbords/AdminReportTMS";
import AdminSettingTMS from "./assets/TaskManeger/AllDashbords/AdminSettingTMS";
import EmployeeDashbordTMS from "./assets/TaskManeger/AllDashbords/EmployeeDashbordTMS";
import EmployeeTaskTMS from "./assets/TaskManeger/AllDashbords/EmployeeTaskTMS";
import EmployeeTeamsTMS from "./assets/TaskManeger/AllDashbords/EmployeeTeamsTMS";
import EmployeeProjectTMS from "./assets/TaskManeger/AllDashbords/EmployeeProjectTMS";
import EmployeeReportTMS from "./assets/TaskManeger/AllDashbords/EmployeeReportTMS";
import EmployeeSettingTMS from "./assets/TaskManeger/AllDashbords/EmployeeSettingTMS";
import MangerDashbarodTMS from "./assets/TaskManeger/AllDashbords/MangerDashbarodTMS";
import MangerTaskTMS from "./assets/TaskManeger/AllDashbords/MangerTaskTMS";
import MangerProjectTMS from "./assets/TaskManeger/AllDashbords/MangerProjectTMS";
import ManagerTeamsTMS from "./assets/TaskManeger/AllDashbords/MangerTeamsTMS";
import MangerReportTMS from "./assets/TaskManeger/AllDashbords/MangerReportTMS";
import ManagerSettingTMS from "./assets/TaskManeger/AllDashbords/MangerSettingTMS";

function App() {
  console.log("App rendered");

  useEffect(() => {
    const bc = new BroadcastChannel("auth");

    bc.onmessage = (event) => {
      if (event.data.type === "LOGOUT") {
        // sessionStorage.removeItem("activeUser");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    };

    //  return () => bc.close();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route
          path="/employee/verify/:id/:token"
          element={<EmployeeVerify />}
        />
        <Route path="/forgotpassword/:id/:token" element={<ForgotPassword />} />
        <Route path="/password-reset" element={<PasswordReset />} />

        {/* Protected Route */}
        <Route
          path="/dashboard/:role/:username/:id/*"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "employee",
                "manager",
                "hr",
                "ceo",
                "coo",
                "md",
                "IT_Support",
                "Team_Leader" //rutuja
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/*Harshda ✅✅ TMS DASHBOARD (EASY DIRECT ROUTE) */}

        <Route
          path="/tms-dashboard/:role/:username/:id/*"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "employee",
                "manager",
                "hr",
                "ceo",
                "coo",
                "md",
                "IT_Support",
                "Team_Leader" //rutuja
              ]}
            >
              <TMSDashboard />
            </ProtectedRoute>
          }
        >
          {/* <Route index element={<MangerDashbarodTMS />} />
            <Route path="task" element={<MangerTaskTMS/>}/>
            <Route path="project" element={<MangerProjectTMS/>}/>
            <Route path="teams" element={<ManagerTeamsTMS/>}/>
            <Route path="report" element={<MangerReportTMS/>}/>
            <Route path="setting" element= {<ManagerSettingTMS/>}/>
            
            <Route index element={<EmployeeDashbordTMS />} />
            <Route path="task" element={<EmployeeTaskTMS/>}/>
            <Route path="teams" element={<EmployeeTeamsTMS/>}/>
             <Route path="project" element={<EmployeeProjectTMS/>}/>
             <Route path="report" element={<EmployeeReportTMS/>}/>
            <Route path="setting" element= {<EmployeeSettingTMS/>}/>   
          <Route index element={<AdminDashboardTMS />} />

          {/* ⭐ TASK PAGE → FIXED */}
          {/* <Route path="task" element={<AdminTaskTMS />} />
          <Route path="project" element={<AdminProjectTMS/>}/>
          <Route path="teams" element={<AdminTeamsTMS/>}/>
          <Route path="report" element={<AdminReportTMS/>}/>
          <Route path="setting" element={<AdminSettingTMS/>}/> */}
        </Route>

        {/* 404 or fallback route */}
        <Route
          path="*"
          element={
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you are looking for doesn't exist.</p>
              <a href="/" style={{ color: "#007bff" }}>
                Go to Login
              </a>
              <br />
              <BackButton />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
