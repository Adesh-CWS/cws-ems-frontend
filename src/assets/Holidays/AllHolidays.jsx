import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import AddHolidayForm from "./AddHolidaysForms";

function AllHolidays() {
  const { state } = useLocation();
  const { role } = useParams(); // ✅ get role from route
  const holidays = state?.holidays || [];
  const [holidayList, setHolidayList] = useState([]);

  // ✅ check if role is admin
  const isAdmin = role === "admin";

  // Current year
  const currentYear = new Date().getFullYear();

  // Filter holidays only for current year
  useEffect(() => {
    const filtered = holidays.filter((h) => {
      const holidayYear = new Date(h.date).getFullYear();
      return holidayYear === currentYear;
    });
    setHolidayList(filtered);
  }, [holidays, currentYear]);

  // Delete Holiday
  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`http://localhost:8000/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from UI
      setHolidayList((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error(
        "❌ Failed to delete holiday:",
        err.response || err.message,
      );
      alert("Failed to delete holiday.");
    }
  };

  return (
    <div className="container">
      {/* ✅ Show Add Holiday Form only if role from URL is admin */}
      {isAdmin && <AddHolidayForm />}

      <h3 className="mb-4 fw-bold">All Holidays ({currentYear})</h3>
      {holidayList.length > 0 ? (
        <div className="row g-3">
          {holidayList.map((h) => (
            <div key={h._id || h.name} className="col-md-4">
              <div className="card shadow-sm border-0 position-relative">
                <div className="card-header text-center d-flex justify-content-between align-items-center">
                  <span>Holiday</span>
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteHoliday(h._id)}
                    >
                      ❌
                    </button>
                  )}
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title">{h.name}</h5>
                  <p className="card-text text-muted">
                    {new Date(h.date).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          No holidays found for {currentYear}.
          {isAdmin && " Please add holidays for this year."}
        </div>
      )}
    </div>
  );
}

export default AllHolidays;
