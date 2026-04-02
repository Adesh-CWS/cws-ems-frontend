// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import axios from "axios";

// const EmployeeVerify = () => {
//   const { id, token } = useParams();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [validLink, setValidLink] = useState(false);
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     // Verify token
//     const verifyToken = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:8000/employee/verify/${id}/${token}`
//         );
//         if (res.data.success) setValidLink(true);
//       } catch (err) {
//         setMessage("Invalid or expired verification link.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     verifyToken();
//   }, [id, token]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (password !== confirmPassword) {
//       setMessage("Passwords do not match.");
//       return;
//     }

//     try {
//       const res = await axios.post(
//         `http://localhost:8000/employee/set-password`,
//         { id, token, password }
//       );
//       setMessage(res.data.message);
//       setTimeout(() => navigate("/login"), 2000);
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Server error");
//     }
//   };

//   if (loading) return <p>Loading...</p>;

//   if (!validLink) return <p>{message}</p>;

//   return (
//     <div className="full-screen-container forgot-bg">
//       <div className="login-container">
//         <div className="login-form-container">
//           <img src="/emscwslogo.png"
//           style={{ width: "170px", height: "67px" }}
//           alt="Logo" />

//           <h1 className="login-subtitle">Set Your Password</h1>
//           {message && <p className="text-danger">{message}</p>}
//           <form onSubmit={handleSubmit}>
//             <div className="input-group"  style={{ position: "relative" }}>
//               <label>Password</label>
//               <input
//                 type="password"

//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="input-group" style={{ position: "relative" }}>
//               <label>Confirm Password</label>
//               <input
//                 type="password"

//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 required
//               />
//             </div>

//             <div className="forgot-link1">
//               <Link to="/login">Back To Login</Link>
//             </div>

//             <button type="submit" className="btn btn-primary">
//               Set Password
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeVerify;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const EmployeeVerify = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // 👁️ visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/employee/verify/${id}/${token}`,
        );
        if (res.data.success) setValidLink(true);
      } catch (err) {
        setMessage("Invalid or expired verification link.");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8000/employee/set-password`,
        { id, token, password },
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Server error");
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!validLink) return <p>{message}</p>;

  return (
    <div className="full-screen-container forgot-bg">
      <div className="login-container">
        <div className="login-form-container">
          <img
            src="/emscwslogo.png"
            style={{ width: "170px", height: "67px" }}
            alt="Logo"
          />

          <h1 className="login-subtitle">Set Your Password</h1>
          {message && <p className="text-success">{message}</p>}

          <form onSubmit={handleSubmit}>
            {/* Password Field */}
            <div className="input-group" style={{ position: "relative" }}>
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "35px",
                  cursor: "pointer",
                  color: "#555",
                }}
              />
            </div>

            {/* Confirm Password Field */}
            <div className="input-group" style={{ position: "relative" }}>
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showConfirmPassword ? faEyeSlash : faEye}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "35px",
                  cursor: "pointer",
                  color: "#555",
                }}
              />
            </div>

            <div className="forgot-link1">
              <Link to="/">Back To Login</Link>
            </div>

            <button type="submit" className="btn btn-primary">
              Set Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeVerify;
