import React, { useState, useEffect } from "react";
import axios from "axios";

import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function ForgotPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { id, token } = useParams();
  const navigate = useNavigate();

  const userValid = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/forgotpassword/${id}/${token}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();
      if (data.status === 201) {
        console.log("User valid");
      } else {
        alert("Invalid user or expired link");
        navigate("/");
      }
    } catch (err) {
      console.error("Error validating user:", err);
    }
  };

  useEffect(() => {
    userValid();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const res = await fetch(
      `http://localhost:8000/forgotpassword/${id}/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    const data = await res.json();
    if (data.status === 201) {
      setPassword("");
      setConfirmPassword("");
      alert("Password set successfully");
      setMessage(true);
      navigate("/");
    } else {
      alert("Link expired, generate new link");
      navigate("/");
    }
  };

  return (
    <div className="full-screen-container forgot-bg">
      <div className="login-container">
        <div className="login-form-container">
          <img
            src="/emscwslogo.png"
            style={{ width: "170px", height: "67px" }}
            alt="Logo"
          />

          <h1 className="login-subtitle">Welcome Back!</h1>
          <span style={{ color: "#3a5fbf" }}>
            Keep your account secure by setting a strong Password.
            <br />
            Make sure it’s unique and safe
          </span>

          <h1 className="login-subtitle">Set Your Password</h1>

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="input-group" style={{ position: "relative" }}>
              <label>Enter New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
                title="Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long"
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "70%", // perfectly centers the icon
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  style={{ color: "#3a5fbf" }}
                />
              </span>
            </div>

            {/* Confirm Password */}
            <div className="input-group mt-3" style={{ position: "relative" }}>
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "70%", // perfectly centers the icon
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                  style={{ color: "#3a5fbf" }}
                />
              </span>
            </div>

            <button type="submit" className="btn-login mt-3">
              Set Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
