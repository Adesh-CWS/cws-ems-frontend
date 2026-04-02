import React, { useState } from "react";
import { Link } from "react-router-dom";

function PasswordReset() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  const sendLink = async (e) => {
    e.preventDefault();

    // ✅ Email validation
    if (!email) {
      setError("Please enter your email");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    // Optional stricter validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;
    if (!emailPattern.test(email)) {
      setError(
        "Enter a valid email (e.g., abc@gmail.com or abc@creativewebsolution.in)",
      );
      return;
    }

    setError(null); // Clear previous error

    try {
      const res = await fetch("http://localhost:8000/sendpasswordlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.status === 201) {
        setEmail("");
        alert(data.message);
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
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
          <h1 className="login-subtitle">Forgot Password?</h1>

          <span style={{ color: "#3a5fbf" }}>
            You can reset your password here.
          </span>
          <form onSubmit={sendLink}>
            <div className="input-group">
              <label>E-mail Address</label>
              <input
                type="text"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-danger mt-2">{error}</p>}
              {/* Forgot Password */}

              <button type="submit" className="btn-login mt-3">
                Get Reset Link
              </button>
              <div className="forgot-link1">
                <Link to="/" style={{ fontWeight: "500" }}>
                  Back To Login
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
