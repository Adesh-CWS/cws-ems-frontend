import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("accessToken");

  const handleBack = () => {
    if (isLoggedIn) {
      navigate(-1); // Go to previous page
    } else {
      navigate("/"); // Go to login/home page
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        padding: "8px 16px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Back
    </button>
  );
}

export default BackButton;
