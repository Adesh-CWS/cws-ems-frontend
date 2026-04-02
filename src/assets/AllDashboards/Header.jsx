//not responsive but working
import React, { use } from "react";
import { NavLink } from "react-router-dom";
import Notification from "../../Notification";
import "./Header.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import TaskNotification from "../../TaskNotification";
import Button from "@mui/material/Button";
function Header({ user, handleLogout, notifications, fetchNotifications}) {
  const navigate = useNavigate();

  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.pathname.includes("/tms-dashboard") ? "TMS" : "EMS",
  );

  const handleEMS = () => {
    setActiveTab("EMS");
    navigate(
      `/dashboard/${user.role}/${user.username || user.name}/${user._id}`,
    );
  };

  const handleTMS = () => {
    setActiveTab("TMS");
    //jaicy
    //navigate(`/tms-dashboard/${user.role}/${user.username}/${user.userId}` );
    navigate(
      `/tms-dashboard/${user.role}/${user.username || user.name}/${user._id}`,
    );

    console.log(user);
  };

  return (
    <div>
      {/* White Bar Above Header */}
      {/* <div
  style={{
    width: "100%",
    backgroundColor: "#ffffff",
    padding: "8px 15px",
    boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
    fontWeight: "500",
    fontSize: "14px",
    color: "#333",
    paddingTop: "3px", // fixed
  }}
>
  
  <div
    style={{
      display: "flex",
      alignItems: "center",
      border: "1px solid #3A5FBE",
      borderRadius: "6px",
      overflow: "hidden",
      marginLeft: "6px",   
    }}
  >
    
    <div
      onClick={handleEMS}
      onMouseEnter={(e) => {
        if (activeTab !== "EMS") {
          e.currentTarget.style.backgroundColor = "#f2f2f2";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          activeTab === "EMS" ? "#e3f2fd" : "transparent";
      }}
      style={{
        flex: 1,
        textAlign: "center",
        cursor: "pointer",
        padding: "4px 6px",
        backgroundColor: activeTab === "EMS" ? "#e3f2fd" : "transparent",
        transition: "background-color 0.2s ease",
      }}
    >
      <Button
        variant="text"
        sx={{
          minWidth: "50px",
          fontSize: "0.8rem",
          padding: "0",
          pointerEvents: "none",
          color:"#3A5FBE"
        }}
      >
        EMS
      </Button>
    </div>

    
    <div
      style={{
        width: "1px",
        alignSelf: "stretch",
        backgroundColor: "#555",
      }}
    />

    
    <div
      onClick={handleTMS}
      onMouseEnter={(e) => {
        if (activeTab !== "TMS") {
          e.currentTarget.style.backgroundColor = "#f2f2f2";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          activeTab === "TMS" ? "#e3f2fd" : "transparent";
      }}
      style={{
        flex: 1,
        textAlign: "center",
        cursor: "pointer",
        padding: "4px 6px",
        backgroundColor: activeTab === "TMS" ? "#e3f2fd" : "transparent",
        transition: "background-color 0.2s ease",
      }}
    >
      <Button
        variant="text"
        sx={{
          minWidth: "50px",
          fontSize: "0.8rem",
          padding: "0",
          pointerEvents: "none",
           color:"#3A5FBE"
        }}
      >
        TMS
      </Button>
    </div>
  </div>
</div> */}

      <header className="header-wrapper">
        {/* Left Side */}
        <div className="user-info" style={{ textTransform: "capitalize" }}>
          <h2 className="user-greeting" style={{ textTransform: "capitalize" }}>
            Hello, {user.name}
          </h2>
          <p className="user-role" style={{ textTransform: "uppercase" }}>
            {user.role}
          </p>
        </div>

        {/* Right Side */}
        <div className="header-actions-group">
          {/* Logout Button */}
          {/* <button className="btn position-relative" onClick={handleLogout}>
          <i className="bi bi-power fs-5 text-secondary"></i>
        </button> */}

          {/* Notification Icon */}
          {/* <button className="btn position-relative">
          <i className="bi bi-bell fs-5 text-secondary"></i>
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            3
          </span>
        </button> */}
          <div className="me-2">
            {activeTab === "EMS" ? (
              <Notification 
              userId={user._id} 
              notifications={notifications}
              fetchNotifications={fetchNotifications}
              />
            ) : (
              <TaskNotification userId={user._id} />
            )}
          </div>
          {/* Profile Image */}
          {/* <NavLink
          to={`/dashboard/${user.role}/${user.username || user.name}/${user._id}/myprofile`}
          className="nav-link text-white d-flex flex-column align-items-center"
          id="navlink1"
        >
          <img
            src={
              user?.image
                ? ` 
http://localhost:8000/uploads/${user.image}`
                : "/myprofile.jpg"
            }
            alt="Profile"
            className="rounded-circle border border-2 border-primary profile-img"
            width="40"
            height="40"
          />
        </NavLink> */}

          {/* Profile image with drop down option start */}

          <div className="dropdown">
            <button
              className="btn p-0 focus-ring"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                // src={
                //   user?.image
                //     ?`http://localhost:8000/image/uploads/${user.image}`
                //     : "/myprofile.jpg"
                // }
                src={
                  user?.image
                    ? user.image.startsWith("http")
                      ? user.image
                      : `http://localhost:8000/uploads/${user.image}`
                    : "/myprofile.jpg"
                }
                alt="Profile"
                className="rounded-circle border border-2 border-primary profile-img"
                width="40"
                height="40"
                style={{ cursor: "pointer" }}
              />
            </button>
            {/* Dropdown Section */}
            {/* <div className="dropdown-menu profile-dropdown-menu dropdown-menu-end shadow-lg p-0" style={{ minWidth: '250px' }}> */}
            <div
              className="dropdown-menu profile-dropdown-menu dropdown-menu-start shadow-lg p-0"
              style={{ minWidth: "250px", left: 0, right: "auto" }}
            >
              <div className="px-3 py-3 border-bottom bg-light">
                <div className="d-flex align-items-center mb-2">
                  <img
                    // src={
                    //   user?.image
                    //     ? `http://localhost:8000/image/uploads/${user.image}`
                    //     : "/myprofile.jpg"
                    // }

                    src={
                      user?.image
                        ? user.image.startsWith("http")
                          ? user.image
                          : `http://localhost:8000/uploads/${user.image}`
                        : "/myprofile.jpg"
                    }
                    alt="Profile"
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                  />
                  <div>
                    <p
                      className="mb-0 fw-semibold"
                      style={{ fontSize: "14px", textTransform: "capitalize" }}
                    >
                      {user.name}
                    </p>
                    <span
                      className="badge bg-primary"
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        marginTop: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
                <small className="text-muted" style={{ fontSize: "12px" }}>
                  {user.email || ""}
                </small>
              </div>
              <NavLink
                to={
                  activeTab === "EMS"
                    ? `/dashboard/${user.role}/${user.username || user.name}/${
                        user._id
                      }/myprofile`
                    : `/tms-dashboard/${user.role}/${
                        user.username || user.name
                      }/${user._id}/myprofile`
                }
                className="dropdown-item d-flex align-items-center"
                onClick={() => setShowProfile(false)}
              >
                <i
                  className="bi fw-bold bi-person me-2"
                  style={{ fontWeight: "900", fontSize: "16px" }}
                ></i>
                <span style={{ fontWeight: "600", color: "#212529" }}>
                  View Profile
                </span>
              </NavLink>
              {/*  Sign Out */}
              <button
                className="dropdown-item d-flex align-items-center"
                onClick={handleLogout}
                style={{ fontSize: "14px" }}
              >
                <i
                  className="bi fw-bold bi-box-arrow-right me-2"
                  style={{ fontWeight: "900", fontSize: "16px" }}
                ></i>
                <span style={{ fontWeight: "600", color: "#212529" }}>
                  Sign Out
                </span>
              </button>
            </div>
          </div>
          {/* Profile image with drop down option end */}

          {/* Employee ID */}
          <span
            className="fw-semibold employee-id-text"
            style={{ color: "#3A5FBE" }}
          >
            {user.employeeId}
          </span>

          {/* Company Logo */}
          <img
            src="/emscwslogo.png"
            alt="Company Logo"
            className="companylogo company-logo-img"
          />
        </div>
      </header>
    </div>
  );
}

export default Header;
