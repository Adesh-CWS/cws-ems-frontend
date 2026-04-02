import React, { useEffect, useState } from "react";
import axios from "axios";

function EmployeeCheckInOut({ employeeId }) {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!employeeId) return;
    axios
      .get(`http://localhost:8000/attendance/today/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAttendance(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeeId, token]);

  const handleCheckIn = async () => {
    const res = await axios.post(
      `http://localhost:8000/attendance/checkin/${employeeId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setAttendance(res.data);
  };

  const handleCheckOut = async () => {
    const res = await axios.post(
      `http://localhost:8000/attendance/checkout/${employeeId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setAttendance(res.data);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="card shadow-sm p-3 mb-3">
      <h6 className="fw-bold">Today's Attendance</h6>
      <p>
        <strong>Check-In:</strong>{" "}
        {attendance?.checkIn
          ? new Date(attendance.checkIn).toLocaleTimeString()
          : "-"}
      </p>
      <p>
        <strong>Check-Out:</strong>{" "}
        {attendance?.checkOut
          ? new Date(attendance.checkOut).toLocaleTimeString()
          : "-"}
      </p>

      {!attendance?.checkIn && (
        <button className="btn btn-success me-2" onClick={handleCheckIn}>
          Check-In
        </button>
      )}
      {attendance?.checkIn && !attendance?.checkOut && (
        <button className="btn btn-danger" onClick={handleCheckOut}>
          Check-Out
        </button>
      )}
    </div>
  );
}

export default EmployeeCheckInOut;
