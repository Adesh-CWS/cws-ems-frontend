import React, { useState } from "react";
import OfficeLocationSetup from "./OfficeLocationSetup";
import AdminWeeklyOffSetup from "./AdminWeeklyOffSetup";
import MyProfile from "../AllDashboards/MyProfile";
import ChangePassword from "./ChangePassword";
import SupportEmployeeSetting from "../ITSupport/SupportEmployeeSetting";

function AdminSetting({ user, setUser }) {
  const [activeTab, setActiveTab] = useState("officeLocation");

  return (
    <div
      className="container-fluid p-3 p-md-4 p-2"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="d-flex justify-content-center  mb-3 gap-2">
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "officeLocation" ? "btn-primary" : "btn-outline-primary"}`}
          style={{
            backgroundColor:
              activeTab === "officeLocation" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "officeLocation" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("officeLocation")}
        >
          Set Office Location
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "weeklyOff" ? "btn-primary" : "btn-outline-primary"}`}
          style={{
            backgroundColor:
              activeTab === "weeklyOff" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "weeklyOff" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("weeklyOff")}
        >
          Set Weekly Off
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "updateProfile" ? "btn-primary" : "btn-outline-primary"}`}
          style={{
            backgroundColor:
              activeTab === "updateProfile" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "updateProfile" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("updateProfile")}
        >
          Update Profile
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "changePassword" ? "btn-primary" : "btn-outline-primary"}`}
          style={{
            backgroundColor:
              activeTab === "changePassword" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "changePassword" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("changePassword")}
        >
          Change Password
        </button>

        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "support" ? "btn-primary" : "btn-outline-primary"
          }`}
          style={{
            backgroundColor:
              activeTab === "support" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "support" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("support")}
        >
          IT Support
        </button>
      </div>

      {activeTab === "officeLocation" && <OfficeLocationSetup />}
      {activeTab === "weeklyOff" && <AdminWeeklyOffSetup />}
      {activeTab === "updateProfile" && (
        <MyProfile user={user} setUser={setUser} />
      )}
      {activeTab === "changePassword" && <ChangePassword />}
      {activeTab === "support" && <SupportEmployeeSetting />}
    </div>
  );
}

export default AdminSetting;
