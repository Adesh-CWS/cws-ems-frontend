import React, { useState } from "react";
import axios from "axios";
function ChangePassword() {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwords;

    // 🔹 Basic required checks
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }

    // 🔹 New != current
    if (newPassword === currentPassword) {
      setPasswordError("New password cannot be the same as current password.");
      return;
    }

    // 🔹 Confirm password match
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    // 🔹 Strength validation (min 6 chars + upper + lower + digit + special)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-])[A-Za-z\d@$!%*?&#^()_\-]{6,}$/;

    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.",
      );
      return;
    }

    try {
      setPasswordLoading(true);
      const accessToken = localStorage.getItem("accessToken"); // from your login response

      const res = await axios.post(
        "http://localhost:8000/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setPasswordSuccess("Password changed successfully. Please login again.");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Failed to change password:", err);
      setPasswordError(
        err?.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div
        className="card shadow-sm border-0 rounded mt-4"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <div className="card-body">
          <h6 className="fw-bold  mb-3" style={{ color: "#3A5FBE" }}>
            Change Password
          </h6>

          {passwordError && (
            <div className="alert alert-danger py-2">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="alert alert-success py-2">{passwordSuccess}</div>
          )}

          <div className="mb-3">
            <label className="form-label " style={{ color: "#3A5FBE" }}>
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword.current ? "text" : "password"}
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordInputChange}
                className="form-control bg-light pe-5"
                placeholder="Enter current password"
              />
              <i
                className={`bi ${
                  showPassword.current ? "bi-eye-fill" : "bi-eye-slash-fill"
                }`}
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#3A5FBE",
                }}
              ></i>
            </div>
          </div>

          {/* New Password Field */}
          <div className="mb-3">
            <label className="form-label " style={{ color: "#3A5FBE" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordInputChange}
                className="form-control bg-light pe-5"
                placeholder="Enter new password"
              />
              <i
                className={`bi ${
                  showPassword.new ? "bi-eye-fill" : "bi-eye-slash-fill"
                }`}
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#3A5FBE",
                }}
              ></i>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: "#3A5FBE" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordInputChange}
                className="form-control bg-light pe-5"
                placeholder="Re-enter new password"
              />
              <i
                className={`bi ${
                  showPassword.confirm ? "bi-eye-fill" : "bi-eye-slash-fill"
                }`}
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#3A5FBE",
                }}
              ></i>
            </div>
          </div>

          <div className="text-end">
            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
      <div className="text-end mt-3">
        <button
          style={{ minWidth: 90 }}
          className="btn btn-sm custom-outline-btn"
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </>
  );
}

export default ChangePassword;
