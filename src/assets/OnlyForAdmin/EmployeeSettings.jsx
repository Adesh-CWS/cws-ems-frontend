import React, { useState, useEffect } from "react";
// import axios from "axios";
import MyProfile from "../AllDashboards/MyProfile";
import ChangePassword from "./ChangePassword";
import SupportEmployeeSetting from "../ITSupport/SupportEmployeeSetting";
function EmployeeSettings({ user, setUser }) {
  const [activeTab, setActiveTab] = useState("changePassword");
  // const [passwords, setPasswords] = useState({
  //   currentPassword: "",
  //   newPassword: "",
  //   confirmPassword: "",
  // });
  // const [showPassword, setShowPassword] = useState({
  //   current: false,
  //   new: false,
  //   confirm: false,
  // });
  // const [passwordLoading, setPasswordLoading] = useState(false);
  // const [passwordError, setPasswordError] = useState("");
  // const [passwordSuccess, setPasswordSuccess] = useState("");

  // const handleChangePassword = async () => {
  //   setPasswordError("");
  //   setPasswordSuccess("");

  //   const { currentPassword, newPassword, confirmPassword } = passwords;

  //   // 🔹 Basic required checks
  //   if (!currentPassword || !newPassword || !confirmPassword) {
  //     setPasswordError("All fields are required.");
  //     return;
  //   }

  //   // 🔹 New != current
  //   if (newPassword === currentPassword) {
  //     setPasswordError("New password cannot be the same as current password.");
  //     return;
  //   }

  //   // 🔹 Confirm password match
  //   if (newPassword !== confirmPassword) {
  //     setPasswordError("New password and confirm password do not match.");
  //     return;
  //   }

  //   // 🔹 Strength validation (min 6 chars + upper + lower + digit + special)
  //   const passwordRegex =
  //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-])[A-Za-z\d@$!%*?&#^()_\-]{6,}$/;

  //   if (!passwordRegex.test(newPassword)) {
  //     setPasswordError(
  //       "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."
  //     );
  //     return;
  //   }

  //   try {
  //     setPasswordLoading(true);

  //     const accessToken = localStorage.getItem("accessToken"); // from your login response

  //     const res = await axios.post(
  //       "http://localhost:8000/change-password",
  //       {
  //         currentPassword,
  //         newPassword,
  //         confirmPassword,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       }
  //     );

  //     setPasswordSuccess(res?.data?.message || "Password updated successfully.");
  //     setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  //   } catch (err) {
  //     console.error("Failed to change password:", err);
  //     setPasswordError(
  //       err?.response?.data?.message || "Failed to change password."
  //     );
  //   } finally {
  //     setPasswordLoading(false);
  //   }
  // };

  // const handlePasswordInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setPasswords((prev) => ({ ...prev, [name]: value }));
  // };
  return (
    <div
      className="container-fluid p-3 p-md-4 p-2"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div className="d-flex justify-content-center  mb-3 gap-2">
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "profile" ? "btn-primary" : "btn-outline-primary"
          }`}
          style={{
            backgroundColor:
              activeTab === "profile" ? "#3A5FBE" : "transparent",
            borderColor: "#3A5FBE",
            color: activeTab === "profile" ? "white" : "#3A5FBE",
          }}
          onClick={() => setActiveTab("profile")}
        >
          Update Profile
        </button>

        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "changePassword"
              ? "btn-primary"
              : "btn-outline-primary"
          }`}
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
      {activeTab === "profile" && <MyProfile user={user} setUser={setUser} />}
      {/* Change Password - same card design */}
      {activeTab === "changePassword" && (
        <>
          <ChangePassword />
        </>
      )}
      {/*  Support Option added snehal */} {/* //Added Support Snehal */}
      {activeTab === "support" && (
        <>
          <SupportEmployeeSetting />
        </>
      )}
    </div>
  );
}

export default EmployeeSettings;
