import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
//   const activeUser = sessionStorage.getItem("activeUser");

//   if (!activeUser) {
//   return <Navigate to="/login" replace/>;
// }

  if (!token) {
    console.log("🔒 Redirecting: no token");
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log("🔒 Redirecting: unauthorized role",role);
    return <Navigate to="/" replace />;
  }

  console.log("✅ ProtectedRoute rendered normally");
  return children;
}

export default ProtectedRoute;
