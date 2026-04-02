import React, { useState, useEffect } from "react";
import axios from "axios";
import HolidaysCard from "../Holidays/HolidaysCards";
import EventCard from "../Events/EventCard";
import MyAttendanceCalender from "../MyAttendnceCalender";
import TodaysCheckinCheckoutCount from "../OnlyForAdmin/TodaysCheckinCheckoutCount";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import QuickApplyLeave from "../Leaves/QuickApplyLeave";
import ActivePolls from "../Polls/ActivePolls";
function EmployeeDashboard({ user }) {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [wfhApproved, setWfhApproved] = useState(false);
  const [events, setEvents] = useState([]);
  // Initialize workMode from localStorage, fallback to WFO
  const [workMode, setWorkMode] = useState(
    localStorage.getItem("workMode") || "WFO",
  );

  // rutuja code
  const [selectedRegularization, setSelectedRegularization] = useState(null);

  // Whenever workMode changes, save it
  useEffect(() => {
    localStorage.setItem("workMode", workMode);
  }, [workMode]);

  const handleToggle = (mode) => {
    if (workMode === mode) {
      // if already selected, unselect it
      setWorkMode("");
    } else {
      // switch mode
      setWorkMode(mode);
    }
  };

  const { id } = useParams();
  console.log(user);
  const navigate = useNavigate();
  const { role, username } = useParams();
  // Add this for WFO/WFH toggle
  const [isWFO, setIsWFO] = useState(true); // true = WFO, false = WFH

  const token = localStorage.getItem("accessToken");

  const authAxios = axios.create({
    baseURL: "http://localhost:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  const [todayLeave, setTodayLeave] = useState(null);

  const toLocalDate = (dateStr) => {
    if (!dateStr) return null; // return null if empty, undefined, null

    const d = new Date(dateStr);
    if (isNaN(d)) return null; // invalid date → return null

    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  const fetchTodayLeaveDirect = async () => {
    try {
      const today = toLocalDate(new Date());
      const res = await authAxios.get(`/leave/my/${user._id}`);
      console.log("leave check", res.data);
      const todayApplied = res.data.find((leave) => {
        const from = toLocalDate(leave.dateFrom);
        const to = toLocalDate(leave.dateTo);

        return (
          from &&
          to &&
          today >= from &&
          today <= to &&
          leave.status?.toLowerCase() !== "rejected"
        );
      });

      console.log("test leave checkin", todayApplied);
      return todayApplied || null;
    } catch (err) {
      console.log("Error fetching leave", err);
      return null;
    }
  };

  //attendance record
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get(`/attendance/today/${id}`);
      setAttendance(res.data.attendance || null);
    } catch (err) {
      console.warn("No attendance record found for today");
      setAttendance(null); // still allow check-in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    //fetchTodayLeave();  // <---- Add this
  }, []);

  console.log("attendance", attendance);

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      return data.display_name || "Unknown location";
    } catch (err) {
      console.error("Reverse geocode error", err);
      return "Unknown location";
    }
  };

  //above code is only for wfo and below is is form wfo and wfh
  const handleCheckIn = async () => {
    if (!user._id) return alert("User ID is missing!");
    const today = toLocalDate(new Date());
    console.log(today, "today");
    // 🔍 Step 1: Check if user applied leave today
    const todayLeaveData = await fetchTodayLeaveDirect();
    console.log("todayLeaveData", todayLeaveData);
    if (todayLeaveData) {
      return alert(
        "❗ You have applied for leave today. Check-in is not allowed.",
      );
    }

    if (attendance?.checkIn) {
      const time = new Date(attendance.checkIn).toLocaleTimeString();
      return alert(`Already checked in today at ${time}`);
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);

        try {
          const res = await authAxios.post(`/attendance/${user._id}/checkin`, {
            lat: latitude,
            lng: longitude,
            address,
            mode: workMode === "WFH" ? "WFH" : "Office", // send WFH or Office
          });

          setAttendance(res.data.attendance);
          alert("Checked in successfully");
        } catch (err) {
          alert(err.response?.data?.message || "Check-in failed");
        }
      },
      () => alert("Allow location access"),
    );
  };

  // //existing working code without logoff warning popup
  // const handleCheckOut = async () => {
  //   if (!attendance?.checkIn) return alert("You must check in first");
  //   if (!navigator.geolocation) return alert("Geolocation not supported");

  //   navigator.geolocation.getCurrentPosition(async (position) => {
  //     const { latitude, longitude } = position.coords;
  //     const address = await getAddressFromCoords(latitude, longitude);

  //     try {
  //       const res = await authAxios.post(`/attendance/${user._id}/checkout`, {
  //         lat: latitude,
  //         lng: longitude,
  //         address,
  //         mode: workMode === "WFH" ? "WFH" : "Office",
  //       });

  //       setAttendance(res.data.attendance);
  //       alert("Checked out successfully");
  //     } catch (err) {
  //       alert(err.response?.data?.message || "Check-out failed");
  //     }
  //   }, () => alert("Allow location access"));
  // };

  //   //existing working code with logoff warning popup
  //   const handleCheckOut = async () => {
  //   if (!attendance?.checkIn) return alert("You must check in first");
  //   if (!navigator.geolocation) return alert("Geolocation not supported");

  //   navigator.geolocation.getCurrentPosition(async (position) => {
  //     const { latitude, longitude } = position.coords;
  //     const address = await getAddressFromCoords(latitude, longitude);

  //     try {
  //       // Step 1: Calculate worked hours before sending checkout
  //       const start = new Date(attendance.checkIn);
  //       const now = new Date();

  //       const diffMs = now - start;
  //       const totalHours = diffMs / (1000 * 60 * 60); // decimal hours

  //       let message = "";
  //       if (totalHours < 4) {
  //         message = `⚠️ You have completed only ${totalHours.toFixed(
  //           2
  //         )} hrs.\nYour Absent will be marked.`;
  //       } else if (totalHours >= 4 && totalHours < 8) {
  //         message = `⚠️ You completed ${totalHours.toFixed(
  //           2
  //         )} hrs.\nHalf Day will be considered.`;
  //       } else if (totalHours >= 8) {
  //         message = `✅ Great! You completed ${totalHours.toFixed(
  //           2
  //         )} hrs.\nFull Day will be considered.`;
  //       }
  //       // Show warning BEFORE checkout
  //       alert(message);

  //       // Step 2: Now complete actual checkout
  //       const res = await authAxios.post(`/attendance/${user._id}/checkout`, {
  //         lat: latitude,
  //         lng: longitude,
  //         address,
  //         mode: workMode === "WFH" ? "WFH" : "Office",
  //       });

  //       setAttendance(res.data.attendance);
  //       alert("Checked out successfully");
  //     } catch (err) {
  //       alert(err.response?.data?.message || "Check-out failed");
  //     }
  //   }, () => alert("Allow location access"));
  // };

  const handleCheckOut = async () => {
    if (!attendance?.checkIn) return alert("You must check in first");
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);

        try {
          // Step 1: Calculate worked hours before sending checkout
          const start = new Date(attendance.checkIn);
          const now = new Date();

          const diffMs = now - start;
          const totalHours = diffMs / (1000 * 60 * 60); // decimal hours

          let message = "";
          if (totalHours < 4) {
            message = `⚠️ You have completed only ${totalHours.toFixed(
              2,
            )} hrs.\nAbsent will be marked.\n\nDo you want to proceed?`;
          } else if (totalHours >= 4 && totalHours < 8) {
            message = `⚠️ You completed ${totalHours.toFixed(
              2,
            )} hrs.\nHalf Day will be considered.\n\nDo you want to proceed?`;
          } else if (totalHours >= 8) {
            message = `✅ Great! You completed ${totalHours.toFixed(
              2,
            )} hrs.\nFull Day will be considered.\n\nDo you want to proceed?`;
          }

          // ❗ Show confirmation alert
          const confirmCheckout = window.confirm(message);
          if (!confirmCheckout) return; // cancel checkout

          // Step 2: Now complete actual checkout
          const res = await authAxios.post(`/attendance/${user._id}/checkout`, {
            lat: latitude,
            lng: longitude,
            address,
            mode: workMode === "WFH" ? "WFH" : "Office",
          });

          setAttendance(res.data.attendance);
          alert("Checked out successfully");
        } catch (err) {
          alert(err.response?.data?.message || "Check-out failed");
        }
      },
      () => alert("Allow location access"),
    );
  };

  console.log("attendance", attendance);

  const calculateWorkedHours = () => {
    if (!attendance?.checkIn) {
      return "-"; // No check-in
    }

    if (attendance?.checkIn && !attendance?.checkOut) {
      return "Working..."; // Checked in but not checked out
    }

    if (attendance?.checkIn && attendance?.checkOut) {
      const start = new Date(attendance.checkIn);
      const end = new Date(attendance.checkOut);

      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalDecimal = (diffMs / (1000 * 60 * 60)).toFixed(2);

      return `${diffHrs} hrs ${diffMins} mins`; //(${totalDecimal} hrs)
    }

    return "-";
  };

  const [form, setForm] = useState({
    leaveType: "SL",
    duration: "full",
    date: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //apply for leave
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/leave/apply", {
        employeeId: user._id,
        ...form,
      });
      alert("submit leave");
    } catch (err) {
      setMessage("Error applying leave");
    }
  };
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRegularization, setPendingRegularization] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaveRes, regRes] = await Promise.all([
          axios.get(`http://localhost:8000/leave/my/${user._id}`),
          axios.get(
            `http://localhost:8000/attendance/regularization/my/${user._id}`,
          ),
        ]);

        // ✅ Pending leaves
        const pendingLeaves = leaveRes.data.filter(
          (leave) => leave.status?.trim().toLowerCase() === "pending",
        ).length;
        setPendingCount(pendingLeaves);

        // ✅ Pending regularizations (nested in regularizationRequest)
        const pendingRegs = regRes.data.filter(
          (reg) =>
            reg.regularizationRequest?.status?.trim().toLowerCase() ===
            "pending",
        ).length;
        setPendingRegularization(pendingRegs);
      } catch (err) {
        console.error("Error fetching leave/regularization:", err);
      }
    };

    fetchData();
  }, [user._id]);

  console.log("pending leave", pendingCount, pendingRegularization);

  const getProbationStatus = (user) => {
    if (!user.doj || !user.probationMonths) return "N/A";

    const doj = new Date(user.doj);
    const probationEnd = new Date(doj);
    probationEnd.setMonth(probationEnd.getMonth() + user.probationMonths);

    const today = new Date();

    const options = { day: "2-digit", month: "short", year: "numeric" };
    const endDateStr = probationEnd.toLocaleDateString("en-US", options);

    if (today < probationEnd) {
      return `On Probation (Ends ${endDateStr})`;
    } else {
      return ` On Role`; // ${endDateStr}
    }
  };

  // Open Google Maps at the employee's check-in location
  const handleSeeLocation = () => {
    if (!attendance?.checkIn) {
      return alert("No check-in record found!");
    }

    // Determine whether to use office or employee location
    const location =
      attendance.mode === "WFH"
        ? attendance?.employeeCheckInLocation
        : attendance?.checkInLocation;

    if (!location?.lat || !location?.lng) {
      return alert("Location data not available!");
    }

    // Open the location in Google Maps
    const mapUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    window.open(mapUrl, "_blank");
  };

  //Shivani Break new
  const [breakType, setBreakType] = useState("Tea");
  const [onBreak, setOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakTimer, setBreakTimer] = useState("00:00");
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);
  const [otherReason, setOtherReason] = useState("");

  useEffect(() => {
    let interval = null;

    if (onBreak && breakStartTime) {
      interval = setInterval(() => {
        const diff = Date.now() - breakStartTime;

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        setBreakTimer(
          `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onBreak, breakStartTime]);

  useEffect(() => {
    const fetchTodayBreak = async () => {
      try {
        const res = await authAxios.get("/api/break/my");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayBreak = res.data.find((b) => {
          const d = new Date(b.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        if (!todayBreak) return;

        setTotalBreakSeconds(todayBreak.totalBreakSeconds || 0);

        const activeBreak = todayBreak.breaks.find((b) => !b.endTime);
        if (activeBreak) {
          setOnBreak(true);
          setBreakType(activeBreak.type);
          setBreakStartTime(new Date(activeBreak.startTime).getTime());
        }
      } catch (err) {
        console.log("No break found for today");
      }
    };

    fetchTodayBreak();
  }, []);

  const handleStartBreak = async () => {
    if (!attendance?.checkIn) {
      return alert("Please check in first");
    }

    if (attendance?.checkOut) {
      return alert("You have already checked out");
    }

    if (breakType === "Other" && !otherReason.trim()) {
      return alert("Please enter break reason");
    }

    try {
      const res = await authAxios.post("/api/break/start", {
        breakType,
        reason: breakType === "Other" ? otherReason : "",
      });
      const latestBreak =
        res.data.breakDoc.breaks[res.data.breakDoc.breaks.length - 1];

      setOnBreak(true);
      setBreakStartTime(new Date(latestBreak.startTime).getTime());
      setBreakTimer("00:00");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to start break");
    }
  };

  const handleEndBreak = async () => {
    if (!onBreak) return;

    try {
      const res = await authAxios.post("/api/break/end");

      setOnBreak(false);
      setBreakStartTime(null);
      setBreakTimer("00:00");
      setTotalBreakSeconds(res.data.breakDoc.totalBreakSeconds);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to end break");
    }
  };

  const formatTotalBreakTime = () => {
    let totalSeconds = totalBreakSeconds;

    // ✅ Add running break time if break is active
    if (onBreak && breakStartTime) {
      totalSeconds += Math.floor((Date.now() - breakStartTime) / 1000);
    }

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs} hrs ${mins} mins ${secs} secs`;
  };

  const breakIcons = {
    Tea: "bi-cup-hot",
    Lunch: "bi-egg-fried",
    Personal: "bi-person-circle",
    Other: "bi-three-dots",
  };

  const currentIcon = breakIcons[breakType] || "bi-cup-hot";

  return (
    <>
      {/* <div
        className="container-fluid pt-1 px-3"
        style={{ marginTop: "-25px", backgroundColor: "#f5f7fb" }}
      >
        <div className="row">
          <div className="col-md-8 mb-3 mt-2">
            <div
              className="card shadow-sm p-4 h-100 border-0"
              style={{ borderRadius: "12px" }}
            >
              <div className="row align-items-center">
 
                <div className="col-md-6 text-center text-md-start ">
                  <h6
                    style={{
                      fontSize: "25px",
                      color: "#3A5FBE",
                      fontWeight: "600",
                      marginBottom: "15px",
                    }}
                  >
                    Today's Attendance
                  </h6>
                  <div className="ms-lg-5 ms-0 text-center text-md-start ">
                    <p
                      className={`mb-1 ${attendance?.checkIn ? "text-success" : "text-danger"
                        }`}
                    >
                      {attendance?.checkIn ? (
                        <>
                          <FontAwesomeIcon icon={faSquareCheck} />
                          <span>
                            Checked in at{" "}
                            {new Date(attendance.checkIn).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>

                          {attendance?.checkOut && (
                            <>
                              <span
                                className="text-danger d-block mt-1"
                                style={{ fontSize: "16px" }}
                              >
                                <FontAwesomeIcon icon={faSquareCheck} />
                                Checked out at{" "}
                                {new Date(
                                  attendance.checkOut,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#1bce7b",
                            marginBottom: "2px",
                          }}
                        >
                          "Not Checked In"
                        </span>
                      )}
                    </p>
                    <p
                      className="mb-1"
                      style={{
                        color: "#3A5FBE",
                        fontSize: "15px",
                        fontWeight: "400",
                      }}
                    >
                      <strong>Total Hours:</strong> {calculateWorkedHours()}
                    </p>
                  </div>
                  <div className="d-flex flex-row gap-5 justify-content-center justify-content-md-start align-items-center ms-lg-5 ms-0 mt-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={workMode === "WFO"}
                        onChange={() => setWorkMode("WFO")}
   
                      />
                      <label className="form-check-label ms-2">WFO</label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={workMode === "WFH"}
                        onChange={() => setWorkMode("WFH")}
  
                      />
                      <label className="form-check-label ms-2">WFH</label>
                    </div>
                  </div>
                  <hr
                    style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}
                  ></hr>
                  <div className="mt-3 d-flex flex-row gap-2 justify-content-center justify-content-md-start align-items-center ms-lg-5 ms-0 ">
                    {" "}
                    <button
                      className={`btn px-4 ${attendance?.checkIn ? "btn-secondary" : "btn-success"
                        }`}
                      onClick={handleCheckIn}
                      disabled={!!attendance?.checkIn}
                    >
                      Check-In
                    </button>
                    <button
                      className="btn btn-danger px-4"
                      onClick={handleCheckOut}
                      disabled={!attendance?.checkIn || !!attendance?.checkOut}
                    >
                      Check-Out
                    </button>
                  </div>
                </div>


                <div className="col-md-6 " style={{ paddingTop: "10px" }}>
               

                  <div
                    className="mt-2"
                    style={{
                      backgroundColor: "#fff",
                      color: "#3A5FBE",
                      padding: "10px",
                      textTransform: "capitalize",
                      textAlign: "center",
                      borderRadius: "25px",
                      border: "1px solid #3A5FBE",
                    }}
                  >
                    <strong>Status:</strong> {getProbationStatus(user)}
                  </div>

             
                  <div
                    className="d-flex align-items-center"
                    style={{ paddingTop: "15px", gap: "20px" }}
                  >
                    <p style={{ marginBottom: 0, display: "flex" }}>
                      <strong
                        style={{ whiteSpace: "nowrap", color: "#3A5FBE" }}
                      >
                        {attendance?.mode === "WFH"
                          ? "WFH Location"
                          : "Office Location"}
                      </strong>{" "}
                      <span style={{ marginLeft: "5px" }}>
                        {attendance?.checkIn
                          ? attendance?.mode === "WFH"
                            ? attendance?.employeeCheckInLocation?.address ||
                            "Not checked in yet"
                            : attendance?.checkInLocation?.address ||
                            "Not checked in yet"
                          : "Not checked in yet"}
                      </span>
                    </p>

      
                  </div>

                  <div className="d-flex justify-content-center mt-3">
                    <style>
                      {`
                      .custom-outline-btn {
                        color: #3A5FBE;
                        border-color: #3A5FBE;
                        background-color: transparent;
                        transition: background-color 0.3s, color 0.3s;
                      }
                      .custom-outline-btn:hover {
                        color: #fff !important;
                        background-color: #3A5FBE !important;
                        border-color: #3A5FBE !important;
                      }
                    `}
                    </style>

                    <button
                      className="btn btn-sm custom-outline-btn me-2"
                      style={{
                        whiteSpace: "nowrap",
                        height: "31px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={handleSeeLocation}
                    >
                      See Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3 mt-2">
            <HolidaysCard />
          </div>

          <div className="col-md-8 mt-2">
            <div className="row">
              <div className="col-md-6 mb-2">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body d-flex justify-content-between align-items-center">

                    <div style={{ color: "#3A5FBE", fontSize: "25px" }}>
                      <h6
                        className="mb-2 ms-2"
                        style={{ color: "#3A5FBE", fontSize: "25px" }}
                      >
                        Leave Balance
                      </h6>
                      <p
                        className="mb-1 ms-2"
                        style={{
                          color: "#3A5FBE",
                          fontSize: "18px",
                          fontWeight: 500,
                        }}
                      >
                        {user.casualLeaveBalance} Casual
                      </p>
                      <p
                        className="mb-0 ms-2"
                        style={{
                          color: "#3A5FBE",
                          fontSize: "18px",
                          fontWeight: 500,
                        }}
                      >
                        {user.sickLeaveBalance} Sick
                      </p>
                    </div>


                    <div
                      className=" d-flex justify-content-center align-items-center"
                      style={{ width: "70px", height: "70px" }}
                    >
                      <i
                        className="bi bi-file-earmark-text-fill"
                        style={{ color: "#3A5FBE", fontSize: "50px" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-2">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body d-flex justify-content-between align-items-center">
                 

                    <div style={{ color: "#3A5FBE", fontSize: "25px" }}>
                      <h6
                        className="mb-2 ms-2"
                        style={{ color: "#3A5FBE", fontSize: "25px" }}
                      >
                        Pending Request
                      </h6>

                     
                      <p
                        className="mb-1 ms-2"
                        style={{
                          color: "#3A5FBE",
                          fontSize: "18px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          navigate(
                            `/dashboard/${role}/${username}/${id}/leavebalance`,
                          )
                        }
                      >
                        {pendingCount} : Leave
                      </p>

                     
                      <p
                        className="mb-0 ms-2"
                        style={{
                          color: "#3A5FBE",
                          fontSize: "18px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          navigate(
                            `/dashboard/${role}/${username}/${id}/regularization`,
                          )
                        }
                      >
                        {pendingRegularization} : Regularization
                      </p>
                    </div>

                  
                    <div
                      className="rounded-3 d-flex justify-content-center align-items-center me-3"
                      style={{ width: "70px", height: "70px" }}
                    >
                      <i
                        className="bi bi-stopwatch"
                        style={{ color: "#3A5FBE", fontSize: "50px" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-6 mb-2">
                <QuickApplyLeave user={user} />
              </div>
              <div className="col-md-6 mb-2">
                {" "}
                <EventCard />
              </div>
            </div>

           
            <div className="row mt-3">
              <div className="col-md-6 mb-2 mt-3">
                <div
                  className="card shadow-sm p-4 border-0 h-100"
                  style={{ borderRadius: "12px", minHeight: "260px" }}
                >
                  <div className="row align-items-center">
                    <div className="col-md-12">
                     
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6
                          style={{
                            fontSize: "25px",
                            color: "#3A5FBE",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          Break
                        </h6>

                       
                        <i
                          className={`bi ${currentIcon}`}
                          style={{
                            fontSize: "28px",
                            color: "#3A5FBE",
                            opacity: 0.35,
                          }}
                        ></i>
                      </div>
                      <hr
                        style={{
                          width: "100%",
                          margin: "10px 0",
                          opacity: "0.2",
                        }}
                      />
                      <div className="ms-0">
                   
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span
                            style={{
                              minWidth: "80px",
                              color: "#3A5FBE",
                              fontWeight: "600",
                              fontSize: "18px",
                            }}
                          >
                            Type :
                          </span>
                          <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: "200px" }}
                            value={breakType}
                            disabled={onBreak}
                            onChange={(e) => setBreakType(e.target.value)}
                          >
                            <option value="Tea">Tea</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Personal">Personal</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {breakType === "Other" && (
                          <div className="d-flex align-items-center mb-2">
                            <span
                              style={{
                                minWidth: "88px",
                                color: "#3A5FBE",
                                fontWeight: "600",
                                fontSize: "18px",
                              }}
                            >
                              Reason :
                            </span>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              style={{ maxWidth: "200px" }}
                              placeholder="Enter reason"
                              value={otherReason}
                              disabled={onBreak}
                              onChange={(e) => setOtherReason(e.target.value)}
                            />
                          </div>
                        )}

                   
                        <div className="d-flex align-items-center mb-2">
                          <span
                            style={{
                              minWidth: "89px",
                              color: "#3A5FBE",
                              fontWeight: "600",
                              fontSize: "18px",
                            }}
                          >
                            Time :
                          </span>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "500",
                              color: onBreak ? "#dc3545" : "#6c757d",
                            }}
                          >
                            {onBreak ? breakTimer : "00:00"}
                          </span>
                        </div>

                       
                        <div className="d-flex align-items-center mt-1">
                          <span
                            style={{
                              minWidth: "120px",
                              color: "#3A5FBE",
                              fontWeight: "600",
                              fontSize: "18px",
                            }}
                          >
                            Total Hours :
                          </span>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#3A5FBE",
                            }}
                          >
                            {formatTotalBreakTime()}
                          </span>
                        </div>

 
                        <hr
                          style={{
                            width: "100%",
                            margin: "10px 0",
                            opacity: "0.2",
                          }}
                        />
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-outline-success action-btn"
                            style={{ minWidth: 90, height: 35 }}  
                            onClick={handleStartBreak}
                            disabled={onBreak}
                          >
                            Start Break
                          </button>
                          <button
                            className="btn btn-outline-danger action-btn"  
                            style={{ minWidth: 90, height: 35 }}
                            disabled={
                              !onBreak ||
                              !attendance?.checkIn ||
                              attendance?.checkOut
                            }
                            onClick={handleEndBreak}
                          >
                            End Break
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-2 mt-3 mt-md-0">
            <MyAttendanceCalender employeeId={user._id} />
          </div>
        </div>
      </div> */}
      <div
        className="container-fluid pt-1 px-3"
        style={{ marginTop: "-25px", backgroundColor: "#f5f7fb" }}
      >
        <div className="row">
          <div className="col-md-8 mb-3 mt-2">
            <div
              className="card shadow-sm p-4 h-100 border-0"
              style={{ borderRadius: "12px" }}
            >
              <div className="row align-items-center">
                {/* Left: Attendance Info */}
                <div className="col-md-6 text-center text-md-start ">
                  <h6
                    style={{
                      fontSize: "25px",
                      color: "#3A5FBE",
                      fontWeight: "600",
                      marginBottom: "15px",
                    }}
                  >
                    Today's Attendance
                  </h6>
                  <div className="ms-lg-5 ms-0 text-center text-md-start ">
                    <p
                      className={`mb-1 ${attendance?.checkIn ? "text-success" : "text-danger"
                        }`}
                    >
                      {attendance?.checkIn ? (
                        <>
                          <FontAwesomeIcon icon={faSquareCheck} />
                          <span>
                            Checked in at{" "}
                            {/* {new Date(attendance.checkIn).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )} */}
                            {/* //Added by Jaicy */}
                            {new Date(attendance.checkIn).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hourCycle: "h12",
                            })}
                          </span>

                          {attendance?.checkOut && (
                            <>
                              <span
                                className="text-danger d-block mt-1"
                                style={{ fontSize: "16px" }}
                              >
                                <FontAwesomeIcon icon={faSquareCheck} />
                                Checked out at{" "}
                                {/* //Added by Jaicy */}
                                {new Date(attendance.checkOut).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hourCycle: "h12",
                                })}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "500",
                            color: "#1bce7b",
                            marginBottom: "2px",
                          }}
                        >
                          "Not Checked In"
                        </span>
                      )}
                    </p>
                    <p
                      className="mb-1"
                      style={{
                        color: "#3A5FBE",
                        fontSize: "15px",
                        fontWeight: "400",
                      }}
                    >
                      <strong>Total Hours:</strong> {calculateWorkedHours()}
                    </p>
                  </div>
                  <div className="d-flex flex-row gap-5 justify-content-center justify-content-md-start align-items-center ms-lg-5 ms-0 mt-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={workMode === "WFO"}
                        //Added by Jaicy
                        disabled={!!attendance?.checkIn}
                        onChange={() => setWorkMode("WFO")}
                      // onChange={(e) => setWorkMode(e.target.value)}
                      />
                      <label className="form-check-label ms-2">WFO</label>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={workMode === "WFH"}
                        onChange={() => setWorkMode("WFH")}
                        //Added by Jaicy
                        disabled={!!attendance?.checkIn}
                      // onChange={(e) => setWorkMode(e.target.value)}
                      />
                      <label className="form-check-label ms-2">WFH</label>
                    </div>
                  </div>
                  <hr
                    style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}
                  ></hr>
                  <div className="mt-3 d-flex flex-row gap-2 justify-content-center justify-content-md-start align-items-center ms-lg-5 ms-0 ">
                    {" "}
                    <button
                      className={`btn px-4 ${attendance?.checkIn ? "btn-secondary" : "btn-success"
                        }`}
                      onClick={handleCheckIn}
                      disabled={!!attendance?.checkIn}
                    >
                      Check-In
                    </button>
                    <button
                      className="btn btn-danger px-4"
                      onClick={handleCheckOut}
                      disabled={!attendance?.checkIn || !!attendance?.checkOut}
                    >
                      Check-Out
                    </button>
                  </div>
                </div>

                {/* Right: WFO/WFH Toggle + Office Location */}
                <div className="col-md-6 " style={{ paddingTop: "10px" }}>
                  {/* <div className="mt-2" style={{ backgroundColor: "#3A5FBE", color: "#fff", padding: "1px", textTransform: "capitalize" }}> */}

                  <div
                    className="mt-2"
                    style={{
                      backgroundColor: "#fff",
                      color: "#3A5FBE",
                      padding: "10px",
                      textTransform: "capitalize",
                      textAlign: "center",
                      borderRadius: "25px",
                      border: "1px solid #3A5FBE",
                    }}
                  >
                    <strong>Status:</strong> {getProbationStatus(user)}
                  </div>

                  {/* Attendance Locations */}
                  <div
                    className="d-flex align-items-center"
                    style={{ paddingTop: "15px", gap: "20px" }}
                  >
                    <p style={{ marginBottom: 0, display: "flex" }}>
                      <strong
                        style={{ whiteSpace: "nowrap", color: "#3A5FBE" }}
                      >
                        {attendance?.mode === "WFH"
                          ? "WFH Location"
                          : "Office Location"}:
                      </strong>{" "}
                      <span style={{ marginLeft: "5px" }}>
                        {attendance?.checkIn
                          ? attendance?.mode === "WFH"
                            ? attendance?.employeeCheckInLocation?.address ||
                            "Not checked in yet"
                            : attendance?.checkInLocation?.address ||
                            "Not checked in yet"
                          : "Not checked in yet"}
                      </span>
                    </p>

                    {/* <p>
                    <strong>{attendance?.mode === "WFH" ? "WFH Checkout Location" : ""}:</strong>{" "}
                    {attendance?.checkOut
                      ? attendance?.mode === "WFH"
                        ? attendance?.employeeCheckOutLocation?.address || "Not checked out yet"
                        : attendance?.checkOutLocation?.address || "Not checked out yet"
                      : "Not checked out yet"}
                  </p> */}
                  </div>

                  <div className="d-flex justify-content-center mt-3">
                    <style>
                      {`
                      .custom-outline-btn {
                        color: #3A5FBE;
                        border-color: #3A5FBE;
                        background-color: transparent;
                        transition: background-color 0.3s, color 0.3s;
                      }
                      .custom-outline-btn:hover {
                        color: #fff !important;
                        background-color: #3A5FBE !important;
                        border-color: #3A5FBE !important;
                      }
                    `}
                    </style>

                    <button
                      className="btn btn-sm custom-outline-btn me-2"
                      style={{
                        whiteSpace: "nowrap",
                        height: "31px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={handleSeeLocation}
                    >
                      See Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3 mt-2">
            <div
              className="card shadow-sm p-4 border-0 h-100"
              style={{ borderRadius: "12px", minHeight: "260px" }}
            >
              <div className="row align-items-center">
                <div className="col-md-12">
                  {/* Break Header */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6
                      style={{
                        fontSize: "25px",
                        color: "#3A5FBE",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Break
                    </h6>

                    {/* Icon */}
                    <i
                      className={`bi ${currentIcon}`}
                      style={{
                        fontSize: "28px",
                        color: "#3A5FBE",
                        opacity: 0.35,
                      }}
                    ></i>
                  </div>
                  <hr
                    style={{
                      width: "100%",
                      margin: "10px 0",
                      opacity: "0.2",
                    }}
                  />
                  <div className="ms-0">
                    {/* Break Type */}
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span
                        style={{
                          minWidth: "80px",
                          color: "#3A5FBE",
                          fontWeight: "600",
                          fontSize: "18px",
                        }}
                      >
                        Type :
                      </span>
                      <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: "200px" }}
                        value={breakType}
                        disabled={onBreak}
                        onChange={(e) => setBreakType(e.target.value)}
                      >
                        <option value="Tea">Tea</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Personal">Personal</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {breakType === "Other" && (
                      <div className="d-flex align-items-center mb-2">
                        <span
                          style={{
                            minWidth: "88px",
                            color: "#3A5FBE",
                            fontWeight: "600",
                            fontSize: "18px",
                          }}
                        >
                          Reason :
                        </span>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          style={{ maxWidth: "200px" }}
                          placeholder="Enter reason"
                          value={otherReason}
                          disabled={onBreak}
                          onChange={(e) => setOtherReason(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Break Timer */}
                    <div className="d-flex align-items-center mb-2">
                      <span
                        style={{
                          minWidth: "89px",
                          color: "#3A5FBE",
                          fontWeight: "600",
                          fontSize: "18px",
                        }}
                      >
                        Time :
                      </span>
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "500",
                          color: onBreak ? "#dc3545" : "#6c757d",
                        }}
                      >
                        {onBreak ? breakTimer : "00:00"}
                      </span>
                    </div>

                    {/* Total Break Time */}
                    <div className="d-flex align-items-center mt-1">
                      <span
                        style={{
                          minWidth: "120px",
                          color: "#3A5FBE",
                          fontWeight: "600",
                          fontSize: "18px",
                        }}
                      >
                        Total Hours :
                      </span>
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#3A5FBE",
                        }}
                      >
                        {formatTotalBreakTime()}
                      </span>
                    </div>

                    {/* Buttons */}
                    <hr
                      style={{
                        width: "100%",
                        margin: "10px 0",
                        opacity: "0.2",
                      }}
                    />
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-outline-success action-btn"
                        style={{ minWidth: 90, height: 35 }} //Style And ClassName Added by Rushikesh
                        onClick={handleStartBreak}
                        disabled={onBreak}
                      >
                        Start Break
                      </button>
                      <button
                        className="btn btn-outline-danger action-btn" //Style Added by Rushikesh
                        style={{ minWidth: 90, height: 35 }}
                        disabled={
                          !onBreak ||
                          !attendance?.checkIn ||
                          attendance?.checkOut
                        }
                        onClick={handleEndBreak}
                      >
                        End Break
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-8 mt-2">
            <div className="row">
              <div className="col-md-6 ">
                <div>
                  <div className="card shadow-sm border-0 mb-2">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      {/* Left Content */}
                      <div style={{ color: "#3A5FBE", fontSize: "25px" }}>
                        <h6
                          className="mb-2 ms-2"
                          style={{ color: "#3A5FBE", fontSize: "25px" }}
                        >
                          Leave Balance
                        </h6>
                        <p
                          className="mb-1 ms-2"
                          style={{
                            color: "#3A5FBE",
                            fontSize: "18px",
                            fontWeight: 500,
                          }}
                        >
                          {user.casualLeaveBalance} Casual
                        </p>
                        <p
                          className="mb-0 ms-2"
                          style={{
                            color: "#3A5FBE",
                            fontSize: "18px",
                            fontWeight: 500,
                          }}
                        >
                          {user.sickLeaveBalance} Sick
                        </p>
                      </div>

                      {/* Right Icon */}
                      <div
                        className=" d-flex justify-content-center align-items-center"
                        style={{ width: "70px", height: "70px" }}
                      >
                        <i
                          className="bi bi-file-earmark-text-fill"
                          style={{ color: "#3A5FBE", fontSize: "50px" }}
                        ></i>
                      </div>
                    </div>
                  </div>
                  {/* Pending Request */}
                  <div className="mt-4 ">
                    <div className="card shadow-sm border-0 mb-2">
                      <div className="card-body d-flex justify-content-between align-items-center">
                        {/* Left Content */}
                        {/* <div style={{ color: "#3A5FBE", fontSize: "25px" }}>
                      <h6 className="mb-2" style={{ color: "#3A5FBE", fontSize: "25px" }}>Pending Request</h6>
                      <p className="mb-1" style={{ color: "#3A5FBE", fontSize: "18px", fontWeight: 500 }}>{pendingCount} : Leave</p>
                      <p className="mb-0" style={{ color: "#3A5FBE", fontSize: "18px", fontWeight: 500 }}>{pendingRegularization} Regularization</p>
                    </div> */}

                        <div style={{ color: "#3A5FBE", fontSize: "25px" }}>
                          <h6
                            className="mb-2 ms-2"
                            style={{ color: "#3A5FBE", fontSize: "25px" }}
                          >
                            Pending Request
                          </h6>

                          {/* Navigate to Leave Balance */}
                          <p
                            className="mb-1 ms-2"
                            style={{
                              color: "#3A5FBE",
                              fontSize: "18px",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(
                                `/dashboard/${role}/${username}/${id}/leavebalance`,
                              )
                            }
                          >
                            {pendingCount} : Leave
                          </p>

                          {/* Navigate to Regularization */}
                          <p
                            className="mb-0 ms-2"
                            style={{
                              color: "#3A5FBE",
                              fontSize: "18px",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              navigate(
                                `/dashboard/${role}/${username}/${id}/regularization`,
                              )
                            }
                          >
                            {pendingRegularization} : Regularization
                          </p>
                        </div>

                        {/* Right Icon with margin */}
                        <div
                          className="rounded-3 d-flex justify-content-center align-items-center "
                          style={{ width: "70px", height: "70px" }}
                        >
                          <i
                            className="bi bi-stopwatch"
                            style={{ color: "#3A5FBE", fontSize: "50px" }}
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick apply leave */}
              <div className="col-md-6 " style={{ height: "280px" }}>
                <QuickApplyLeave user={user} />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-6 mb-2">
                {" "}
                <EventCard />
              </div>
              <div className="col-md-6 mb-2">
                <HolidaysCard />
              </div>
            </div>

            {/* addeded samiksha code */}

            {/* ✅ Break Card */}
          </div>

          <div className="col-md-4 mb-2 mt-3 mt-md-0">
            <div
              className="w-100"
              style={{
                minHeight: "530px",
                height: "530px",
                display: "flex",
              }}
            >
              <MyAttendanceCalender employeeId={user._id} />
            </div>
          </div>
          <div className="row g-2 mt-3">
        
      

      {/*  Poll */}
      <div className="col-md-4">
        <ActivePolls user={user} />
      </div>

    </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeDashboard;
