import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminWeeklyOffSetup() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [saturdays, setSaturdays] = useState([]);

  // Fetch existing weekly off setup
  useEffect(() => {
    const fetchWeeklyOff = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/admin/weeklyoff/${year}`,
        );
        setSaturdays(res.data?.data?.saturdays || []);
      } catch (err) {
        console.error("Error fetching weekly off:", err);
        setSaturdays([]);
      }
    };
    fetchWeeklyOff();
  }, [year]);

  const toggleSaturday = (num) => {
    setSaturdays((prev) =>
      prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num],
    );
  };

  const saveWeeklyOff = async () => {
    try {
      await axios.post("http://localhost:8000/admin/weeklyoff", {
        year,
        saturdays,
      });
      alert("✅ Weekly off updated successfully!");
    } catch (err) {
      console.error("Error saving weekly off:", err);
      alert("❌ Failed to update weekly off");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5
            className="mb-3"
            style={{ color: "#3A5FBE", fontSize: "20px", cursor: "pointer" }}
          >
            Set Weekly Off{" "}
          </h5>

          <div className="d-flex flex-wrap gap-4 mb-3">
            {["First", "Second", "Third", "Fourth", "Fifth"].map(
              (label, index) => {
                const weekNum = index + 1;
                return (
                  <div key={weekNum}>
                    <input
                      type="checkbox"
                      checked={saturdays.includes(weekNum)}
                      onChange={() => toggleSaturday(weekNum)}
                      id={`sat-${weekNum}`}
                    />{" "}
                    <label htmlFor={`sat-${weekNum}`}>{label} Saturday</label>
                  </div>
                );
              },
            )}
          </div>

          <button
            onClick={saveWeeklyOff}
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
          >
            Save
          </button>
        </div>
      </div>
      {/* //Added by mahesh */}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default AdminWeeklyOffSetup;
