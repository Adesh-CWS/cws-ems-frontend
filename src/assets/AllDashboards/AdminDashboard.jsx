import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HolidaysCards from "../Holidays/HolidaysCards";
//import AddHolidayForm from './AddHolidaysForms';
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import EventCard from "../Events/EventCard";
import ActivePolls from "../Polls/ActivePolls";
function AdminDashboard({ user }) {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [PendingLeaveRequests, setPendingLeaveRequests] = useState([]);

  // ✅ New states
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const { role, username, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // ✅ Role check
      if (
        !user?.role ||
        (role !== "admin" && role !== "ceo" && role !== "coo" && role !== "md")
      ) {
        setError("Access denied: Only admins can view employees.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Parallel requests
        const [empRes, attRes, leaveRegRes] = await Promise.allSettled([
          authAxios.get("/getAllEmployees"),
          authAxios.get("/attendance/today"),
          authAxios.get("/leaves-and-regularizations"),
        ]);

        // ✅ Employees
        if (empRes.status === "fulfilled") setEmployees(empRes.value.data);
        else console.warn("Employees fetch failed:", empRes.reason);

        // ✅ Attendance
        if (attRes.status === "fulfilled") setAttendanceData(attRes.value.data);
        else console.warn("Attendance fetch failed:", attRes.reason);

        // ✅ Leaves + Regularizations
        if (leaveRegRes.status === "fulfilled") {
          const leavesData = leaveRegRes.value.data.leaves || [];
          const regsData = leaveRegRes.value.data.regularizations || [];

          console.log("Leaves fetched:", leavesData.length);
          console.log("Regularizations fetched:", regsData.length);

          setLeaves(leavesData);
          setRegularizations(regsData);

          // ✅ Combine + tag type
          const merged = [
            ...leavesData.map((l) => ({ ...l, type: "Leave" })),
            ...regsData.map((r) => ({ ...r, type: "Regularization" })),
          ];

          // ✅ Sort newest first
          merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // ✅ Set to state
          setAllRequests(merged);

          console.log("Merged Requests:", merged.length);
        } else {
          console.warn(
            "Leave/Regularization fetch failed:",
            leaveRegRes.reason,
          );
        }
      } catch (err) {
        console.error("Main fetch error:", err);
        setError("Network error — please check connection or backend status.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, role]);

  console.log("all request", allRequests);

  // if (loading) return <p>Loading...</p>;
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

  if (error) return <p className="text-danger">{error}</p>;

  const checkedInCount =
    attendanceData?.employees?.filter((emp) => emp.hasCheckedIn).length || 0;
  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const pendingRegularizations = regularizations.filter(
    (r) => r?.regularizationRequest?.status === "Pending",
  );
  // Merge employee info with attendance
  const mergedEmployees = employees.map((emp) => {
    const att = attendanceData?.employees?.find((a) => a._id === emp._id);
    return {
      ...emp,
      hasCheckedIn: att?.hasCheckedIn || false,
      checkInTime: att?.checkInTime || null,
    };
  });

  // Calculate the next upcoming event (birthday or anniversary)
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

  const nextEvent = upcomingEvents[0];

  console.log("allRequests", allRequests);

  return (
    <div className="container-fluid pt-1 px-3" style={{ marginTop: "-25px" }}>
      {/* Top Row: Summary Cards */}
      <div className="row g-2  align-items-stretch">
        {/* Total Employees */}
        <div className="col-md-8">
          <div className="row g-2">
            <div className="col-md-6 mt-3">
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  {/* Employee Count */}
                  {/* <h4 className="text-success mb-0" style={{fontSize:"50px"}}>{employees.length}</h4> */}
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
                      style={{
                        fontSize: "40px",
                        margin: 0, // remove extra margins so it stays centered
                      }}
                    >
                      {employees.length}
                    </h4>
                  </div>
                  {/* Text */}
                  {/* <p className="mb-0 fw-semibold" style={{ fontSize: "20px", color: "#3A5FBE" }}>Total<br />Employees</p> */}
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
                  </p>
                  {/* Button */}
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
              <div className="card shadow-sm text-center h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#ffE493",
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
                      style={{
                        fontSize: "40px",
                        margin: 0, // remove extra margins so it stays centered
                      }}
                    >
                      {pendingLeaves.length}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    Pending <br />
                    Leave Requests
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() =>
                      navigate(
                        `/dashboard/${role}/${username}/${id}/leavebalance`,
                      )
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Regularization */}
            <div className="col-md-6 mt-3">
              <div className="card shadow-sm text-center h-100">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div
                    style={{
                      backgroundColor: "#ffE493",
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
                      style={{
                        fontSize: "40px",
                        margin: 0, // remove extra margins so it stays centered
                      }}
                    >
                      {pendingRegularizations.length}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    Attendance <br />
                    Regularization
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    onClick={() =>
                      navigate(
                        `/dashboard/${role}/${username}/${id}/regularization`,
                      )
                    }
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
            {/* Todays Attendance */}
            <div className="col-md-6 mt-3">
              <div className="card shadow-sm text-center h-100">
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
                      style={{
                        fontSize: "40px",
                        margin: 0, // remove extra margins so it stays centered
                      }}
                    >
                      {checkedInCount}
                    </h4>
                  </div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "20px", color: "#3A5FBE" }}
                  >
                    Today's
                    <br /> Attendance
                  </p>
                  <button
                    className="btn btn-sm custom-outline-btn"
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
        <div className="col-md-4 mt-3">
          <HolidaysCards />
        </div>

        {/* Today’s Attendance */}
      </div>

      {/* Row 3: Employee Registry + Leave Requests + Events */}
      <div className="row g-2 mt-3">
        {/* Recent Employee Registry */}
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
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3).map((emp) => {
                      const formatDate = (date) => {
                        if (!date) return "N/A";
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return "Invalid Date";
                        return d.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                      };

                      return (
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
                            {formatDate(emp.doj)}
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

        {/* Leave & Regularization Requests */}
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
                    {allRequests
                      .filter((req) => {
                        const type = req.type;
                        if (type === "Leave") {
                          return (
                            (req.status || "Pending").toLowerCase() ===
                            "pending"
                          );
                        } else if (type === "Regularization") {
                          return (
                            req.regularizationRequest?.status?.toLowerCase() ===
                            "pending"
                          );
                        }
                        return false;
                      })
                      .slice(0, 3)
                      .map((req, index) => {
                        const type = req.type;
                        const status =
                          type === "Leave"
                            ? req.status || "Pending"
                            : req.regularizationRequest?.status || "Pending";

                        const displayStatus =
                          status.charAt(0).toUpperCase() + status.slice(1);

                        // Format appliedAt date
                        const formatDate = (date) => {
                          if (!date) return "N/A";
                          const d = new Date(date);
                          if (isNaN(d.getTime())) return "Invalid Date";
                          return d.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                        };

                        return (
                          <tr key={index}>
                            <td
                              style={{ fontWeight: "400", fontSize: "14px" }}
                              className="text-capitalize"
                            >
                              {req.employee?.name || "N/A"}
                            </td>
                            <td style={{ fontWeight: "400", fontSize: "14px" }}>
                              {type === "Leave"
                                ? req.leaveType
                                : "Regularization"}
                            </td>
                            <td
                              style={{
                                whiteSpace: "nowrap",
                                fontWeight: "400",
                                fontSize: "14px",
                              }}
                            >
                              {formatDate(req.appliedAt)}
                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  displayStatus === "Approved"
                                    ? "text-dark"
                                    : displayStatus === "Rejected"
                                      ? "text-dark"
                                      : "text-dark"
                                }`}
                                style={{
                                  backgroundColor:
                                    displayStatus === "Approved"
                                      ? "#d1f2dd"
                                      : displayStatus === "Rejected"
                                        ? "#f8d7da"
                                        : "#FFE493",
                                  fontWeight: "600",
                                }}
                              >
                                {displayStatus}
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

        {/* Events Section */}
        <div className="col-md-4">
          <EventCard />
        </div>
        <div className="row g-2 mt-3">
        
      

      {/*  Poll */}
      <div className="col-md-4">
        <ActivePolls user={user} />
      </div>

    </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
