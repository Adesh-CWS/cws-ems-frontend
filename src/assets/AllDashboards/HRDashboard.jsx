import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import HolidaysCards from "../Holidays/HolidaysCards";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import EventCard from "../Events/EventCard";

function HRDashboard({ user }) {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const { role, username, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        const [empRes, attRes, leaveRegRes] = await Promise.all([
          authAxios.get("/getAllEmployees"),
          authAxios.get("/attendance/today"),
          authAxios.get("/leaves-and-regularizations"),
        ]);

        setEmployees(empRes.data || []);
        setAttendanceData(attRes.data || { employees: [] });

        const leavesData = leaveRegRes.data.leaves || [];
        const regsData = leaveRegRes.data.regularizations || [];
        setLeaves(leavesData);
        setRegularizations(regsData);

        const mergeAlternate = (leavesArr, regsArr) => {
          const result = [];
          const maxLength = Math.max(leavesArr.length, regsArr.length);
          for (let i = 0; i < maxLength; i++) {
            if (i < leavesArr.length)
              result.push({ ...leavesArr[i], type: "Leave" });
            if (i < regsArr.length)
              result.push({ ...regsArr[i], type: "Regularization" });
          }
          return result;
        };
        setAllRequests(mergeAlternate(leavesData, regsData));
      } catch (err) {
        console.error(err);
        setError("Failed to load HR dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // if (loading) return <p>Loading...</p>;
  <div
    className="d-flex flex-column justify-content-center align-items-center"
    style={{ minHeight: "100vh" }}
  >
    <div
      className="spinner-grow"
      role="status"
      style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
      Loading ...
    </p>
  </div>;

  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading ...
        </p>
      </div>
    );
  }

  const checkedInCount =
    attendanceData?.employees?.filter((emp) => emp.hasCheckedIn).length || 0;
  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const pendingRegularizations = regularizations.filter(
    (r) => r?.regularizationRequest?.status === "Pending",
  );

  const mergedEmployees = employees.map((emp) => {
    const att = attendanceData?.employees?.find((a) => a._id === emp._id);
    return {
      ...emp,
      hasCheckedIn: att?.hasCheckedIn || false,
      checkInTime: att?.checkInTime || null,
    };
  });

  const today = new Date();
  const upcomingEvents = employees
    .map((emp) => {
      const dob = new Date(emp.dob);
      let nextBirthday = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate(),
      );
      if (nextBirthday < today)
        nextBirthday.setFullYear(today.getFullYear() + 1);

      const doj = new Date(emp.doj);
      let nextAnniversary = new Date(
        today.getFullYear(),
        doj.getMonth(),
        doj.getDate(),
      );
      if (nextAnniversary < today)
        nextAnniversary.setFullYear(today.getFullYear() + 1);

      return [
        {
          type: "Birthday",
          name: emp.name,
          date: nextBirthday,
          isToday: nextBirthday.toDateString() === today.toDateString(),
        },
        {
          type: "Anniversary",
          name: emp.name,
          date: nextAnniversary,
          isToday: nextAnniversary.toDateString() === today.toDateString(),
        },
      ];
    })
    .flat()
    .sort((a, b) => a.date - b.date);
  console.log("employees:", employees);
  console.log("mergedEmployees first 5:", mergedEmployees.slice(0, 5));
  return (
    <div className="container-fluid pt-1 px-3" style={{ marginTop: "-25px" }}>
      {/* ================= Summary Cards ================= */}
      <div className="row g-2 align-items-stretch">
        <div className="col-md-8">
          <div className="row g-2">
            {/* Total Employees */}
            <div className="col-md-6 mt-3">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#D7F5E4",
                      padding: "10px",
                      textAlign: "center",
                      minWidth: "75px",
                      minHeight: "75px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h4
                      className="text-success mb-0"
                      style={{ fontSize: "40px" }}
                    >
                      {employees.length}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    <span
                      style={{ marginLeft: "20px", display: "inline-block" }}
                    >
                      Total
                    </span>
                    <br />
                    Employees
                  </p>{" "}
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() =>
                      navigate(
                        `/dashboard/${role}/${username}/${id}/allemployeedetails`,
                      )
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Leaves */}
            <div className="col-md-6 mt-3">
              {/* onClick={() => navigate(`/dashboard/${role}/${username}/${id}/leavebalance`)} */}
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#FFE493",
                      padding: "10px",
                      textAlign: "center",
                      minWidth: "75px",
                      minHeight: "75px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h4
                      className="text-success mb-0"
                      style={{ fontSize: "40px" }}
                    >
                      {pendingLeaves.length}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    <span
                      style={{ marginLeft: "30px", display: "inline-block" }}
                    >
                      Pending{" "}
                    </span>
                    <br />
                    Leave Requests
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ color: "#3A5FBE", borderColor: "#3A5FBE" }}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent card click event from firing
                      navigate(
                        `/dashboard/${role}/${username}/${id}/hr-leavebalance`,
                      );
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Regularization */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#FFE493",
                      padding: "10px",
                      textAlign: "center",
                      minWidth: "75px",
                      minHeight: "75px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h4
                      className="text-success mb-0"
                      style={{ fontSize: "40px" }}
                    >
                      {pendingRegularizations.length}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    <span
                      style={{ marginLeft: "10px", display: "inline-block" }}
                    >
                      Attendance
                    </span>{" "}
                    <br />
                    Regularization
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ color: "#3A5FBE", borderColor: "#3A5FBE" }}
                    onClick={() =>
                      navigate(
                        `/dashboard/${role}/${username}/${id}/hr-employee-regularization`,
                      )
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Attendance */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#D7F5E4",
                      padding: "10px",
                      textAlign: "center",
                      minWidth: "75px",
                      minHeight: "75px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h4
                      className="text-success mb-0"
                      style={{ fontSize: "40px" }}
                    >
                      {checkedInCount}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    <span
                      style={{ marginLeft: "20px", display: "inline-block" }}
                    >
                      Today's{" "}
                    </span>
                    <br /> Attendance
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ color: "#3A5FBE", borderColor: "#3A5FBE" }}
                    onClick={() =>
                      navigate(
                        `/dashboard/${role}/${username}/${id}/TodaysAttendanceDetails`,
                      )
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holidays Card */}
        <div className="col-md-4">
          <HolidaysCards />
        </div>
      </div>

      {/* ================= Requests Table ================= */}
      <div className="row g-3 mt-3">
        {/* Recent Employees */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#fff" }}
            >
              <h6 className="mb-0" style={{ color: "#3A5FBE" }}>
                Recent Employee Registration
              </h6>
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ color: "#3A5FBE", borderColor: "#3A5FBE" }}
                onClick={() =>
                  navigate(
                    `/dashboard/${role}/${username}/${id}/allemployeedetails`,
                  )
                }
              >
                View All
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: "#fff" }}>
                    <tr>
                      <th
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "130px",
                        }}
                      >
                        Name
                      </th>
                      <th style={{ fontWeight: "600", fontSize: "14px" }}>
                        Position
                      </th>
                      <th style={{ fontWeight: "600", fontSize: "14px" }}>
                        Department
                      </th>
                      <th
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          width: "130px",
                        }}
                      >
                        DOJ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedEmployees
                      .filter(
                        (emp) =>
                          emp &&
                          emp.name &&
                          emp.designation &&
                          emp.department &&
                          emp.doj,
                      )
                      .slice(0, 3)
                      .map((emp) => (
                        <tr key={emp._id}>
                          <td
                            className="text-capitalize"
                            style={{ fontWeight: "400", fontSize: "14px" }}
                          >
                            {emp.name}
                          </td>
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            {emp.designation}
                          </td>
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            {emp.department}
                          </td>
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            {new Date(emp.doj).toLocaleDateString("en-GB")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Leave & Regularization */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#fff" }}
            >
              <h6 className="mb-0" style={{ color: "#3A5FBE" }}>
                Leave & Regularization Requests
              </h6>
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ color: "#3A5FBE", borderColor: "#3A5FBE" }}
                onClick={() =>
                  navigate(`/dashboard/${role}/${username}/${id}/allRequest`)
                }
              >
                View All
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: "#fff" }}>
                    <tr>
                      <th style={{ fontWeight: "600", fontSize: "14px" }}>
                        Employee
                      </th>
                      <th style={{ fontWeight: "600", fontSize: "14px" }}>
                        Type
                      </th>
                      <th
                        style={{
                          width: "150px",
                          whiteSpace: "nowrap",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        Date
                      </th>
                      <th style={{ fontWeight: "600", fontSize: "14px" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.slice(0, 3).map((req, i) => {
                      const type = req.type;
                      const status =
                        type === "Leave"
                          ? req.status || "Pending"
                          : req.regularizationRequest?.status || "Pending";

                      const formatted =
                        type === "Leave"
                          ? `${new Date(
                              req.dateFrom,
                            ).toLocaleDateString()} - ${new Date(
                              req.dateTo,
                            ).toLocaleDateString()}`
                          : new Date(req.date).toLocaleDateString();

                      return (
                        <tr key={i}>
                          <td
                            className="text-capitalize"
                            style={{ fontWeight: "400", fontSize: "14px" }}
                          >
                            {req.employee?.name || "N/A"}
                          </td>
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            {type}
                          </td>
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            {formatted}
                          </td>
                          {/* <td style={{ fontWeight: '400', fontSize: '14px'}}>
                          <span
                            className={`badge ${status.toLowerCase() === "approved"
                                ? "#d1f2dd"
                                : status.toLowerCase() === "rejected"
                                  ? "#FFE493"
                                  : "#FFE493"
                              }`}
                          >
                            {status.charAt(0).toUpperCase()+status.slice(1).toLowerCase()}
                          </span>
                        </td> */}
                          <td style={{ fontWeight: "400", fontSize: "14px" }}>
                            <span
                              className="badge text-dark"
                              style={{
                                backgroundColor:
                                  status?.toLowerCase() === "approved"
                                    ? "#d1f2dd" // green
                                    : status?.toLowerCase() === "rejected"
                                      ? "#f8d7da" // yellow
                                      : "#FFE493", // pending or other
                                fontWeight: "600",
                              }}
                            >
                              {status.charAt(0).toUpperCase() +
                                status.slice(1).toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="col-md-4">
          {/* <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <button
                className="btn btn-link text-primary p-0"
                onClick={() =>
                  setCurrentEventIndex((prev) =>
                    prev === 0 ? upcomingEvents.length - 1 : prev - 1
                  )
                }
              >
                <ChevronLeft size={20} />
              </button>
              <span className="fw-semibold text-capitalize" style={{color: "#3A5FBE"}}>
                Upcoming Events
              </span>
              <button
                className="btn btn-link p-0"
                style={{color: "#3A5FBE"}}
                onClick={() =>
                  setCurrentEventIndex((prev) =>
                    prev === upcomingEvents.length - 1 ? 0 : prev + 1
                  )
                }
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="card-body text-center">
              {upcomingEvents.length > 0 ? (
                <>
                {upcomingEvents[currentEventIndex].type === "Birthday" ? (
                    <i className="bi bi-gift fs-2" style={{color: "#3A5FBE"}}></i>
                ) : (
                    <i className="bi bi-building fs-2" style={{color: "#3A5FBE"}}></i>
                )}
                  <p className="mb-0 fw-semibold text-capitalize" style={{color: "#3A5FBE"}}>
                    {upcomingEvents[currentEventIndex].isToday
                      ? `🎉 Happy ${upcomingEvents[currentEventIndex].type}, ${upcomingEvents[currentEventIndex].name}!`
                      : `${upcomingEvents[currentEventIndex].name}'s ${upcomingEvents[currentEventIndex].type}`}
                  </p>
                  <small className="text-muted">
                    {upcomingEvents[currentEventIndex].date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      weekday: "short",
                      year: "numeric",
                    })}
                  </small>
                </>
              ) : (
                <p>No upcoming events</p>
              )}
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-outline"
                  style={{color: "#3A5FBE",borderColor: "#3A5FBE"  }}
                  onClick={() =>
                    navigate(`/dashboard/${role}/${username}/${id}/AllEventsandHolidays`, {
                      state: { employees },
                    })
                  }
                >
                  View All Events
                </button>
              </div>
            </div>
          </div> */}

          <EventCard />
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;
