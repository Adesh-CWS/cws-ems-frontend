import React, { useState, useEffect } from "react";
import axios from "axios";

const TodaysCheckinCheckoutCount = ({ employeeId }) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  const authAxios = axios.create({
    baseURL: "http://localhost:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await authAxios.post(`/attendance/${employeeId}/checkin`);
      setAttendance(res.data.attendance);
    } catch (err) {
      alert(err.response?.data?.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await authAxios.post(`/attendance/${employeeId}/checkout`);
      setAttendance(res.data.attendance);
    } catch (err) {
      alert(err.response?.data?.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's attendance on mount
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const res = await authAxios.get(`/attendance/${employeeId}/today`);
        setAttendance(res.data.attendance);
      } catch (err) {
        console.error(err);
      }
    };
    fetchToday();
  }, [employeeId]);

  return (
    <div className="card shadow-sm p-4">
      <h5>Today's Attendance</h5>

      {attendance ? (
        <div>
          <p>
            Check-in:{" "}
            {attendance.checkIn
              ? new Date(attendance.checkIn).toLocaleTimeString()
              : "--"}
          </p>
          <p>
            Check-out:{" "}
            {attendance.checkOut
              ? new Date(attendance.checkOut).toLocaleTimeString()
              : "--"}
          </p>
          <p>Status: {attendance.dayStatus || "Pending"}</p>
          <p>
            Worked Hours:{" "}
            {attendance.workingHours
              ? attendance.workingHours.toFixed(2) + " hrs"
              : "--"}
          </p>
        </div>
      ) : (
        <p>No record found for today</p>
      )}

      <div className="d-flex gap-2 mt-3">
        <button
          className="btn btn-success"
          onClick={handleCheckIn}
          disabled={loading || (attendance && attendance.checkIn)}
        >
          Check In
        </button>
        <button
          className="btn btn-danger"
          onClick={handleCheckOut}
          disabled={loading || !attendance?.checkIn || attendance?.checkOut}
        >
          Check Out
        </button>
      </div>
    </div>
  );
};

export default TodaysCheckinCheckoutCount;
