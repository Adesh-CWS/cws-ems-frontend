import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MyAttendance.css";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareCheck } from "@fortawesome/free-solid-svg-icons";

function MyAttendance({ employeeId }) {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [weeklyOff, setWeeklyOff] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [manager, setManager] = useState(null);
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [summary, setSummary] = useState({
    leave: 0,
    present: 0,
    regularized: 0,
    holidays: 0,
    halfDay: 0, //added by rutuja
  });
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  // const [workMode, setWorkMode] = useState("WFO"); // Default to WFO
  const [workMode, setWorkMode] = useState(
    localStorage.getItem("workMode") || "WFO",
  );
  useEffect(() => {
    localStorage.setItem("workMode", workMode);
  }, [workMode]);

  const navigate = useNavigate();
  const { role, username, id } = useParams();

  // Whenever workMode changes, save it
  // useEffect(() => {
  //   localStorage.setItem("workMode", workMode);
  // }, [workMode]);

  // Fetch manager info
  useEffect(() => {
    if (selectedRecord?.leaveRef?.reportingManager) {
      axios
        .get(
          `http://localhost:8000/users/${selectedRecord.leaveRef.reportingManager}`,
        )
        .then((res) => setManager(res.data))
        .catch((err) => console.error("Error fetching manager:", err));
    }
  }, [selectedRecord]);

  useEffect(() => {
    if (!employeeId) return; // ✅ Skip until defined
    const fetchData = async () => {
      try {
        const [attRes, leaveRes, weeklyRes, holidayRes, regRes] =
          await Promise.all([
            axios.get(`http://localhost:8000/attendance/${employeeId}`),
            axios.get(`http://localhost:8000/leave/my/${employeeId}`),
            axios.get(
              `http://localhost:8000/admin/weeklyoff/${new Date().getFullYear()}`,
            ),
            axios.get(`http://localhost:8000/getHolidays`),
            axios.get(
              `http://localhost:8000/attendance/regularization/my/${employeeId}`,
            ),
          ]);

        setWeeklyOff(weeklyRes.data.data?.saturdays || []);
        setHolidays(holidayRes.data || []);
        setLeaves(leaveRes.data);
        setRegularizations(regRes.data);

        // Expand leaves
        const expandedLeaves = [];
        leaveRes.data.forEach((leave) => {
          let current = new Date(leave.dateFrom);
          const to = new Date(leave.dateTo);
          while (current <= to) {
            expandedLeaves.push({
              date: new Date(current),
              leaveRef: leave,
              dayStatus: leave.status === "approved" ? "Leave" : leave.status,
            });
            current.setDate(current.getDate() + 1);
          }
        });

        // Merge attendance + leaves first
        const mergedAttendance = [...attRes.data, ...expandedLeaves];

        // Merge regularizations
        regRes.data.forEach((reg) => {
          const dateKey = new Date(reg.date).toDateString();

          const existingIndex = mergedAttendance.findIndex(
            (att) => new Date(att.date).toDateString() === dateKey,
          );

          const regDate = new Date(reg.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          regDate.setHours(0, 0, 0, 0);

          const isToday = regDate.getTime() === today.getTime();
          const mergedRecord = {
            date: new Date(reg.date),
            checkIn:
              mergedAttendance[existingIndex]?.checkIn ||
              reg.regularizationRequest?.checkIn ||
              null,
            checkOut:
              mergedAttendance[existingIndex]?.checkOut ||
              reg.regularizationRequest?.checkOut ||
              null,
            mode: mergedAttendance[existingIndex]?.mode || reg.mode,
            regStatus: reg.regularizationRequest?.status,
            approvedByRole: reg.regularizationRequest?.approvedByRole,
            // dayStatus:
            //   reg.regularizationRequest?.status === "Approved"
            //     ? "Regularized"
            //     : "Pending Regularization",
            dayStatus:
              isToday &&
              mergedAttendance[existingIndex]?.checkIn &&
              !mergedAttendance[existingIndex]?.checkOut
                ? "Working"
                : reg.regularizationRequest?.status === "Approved"
                  ? "Regularized"
                  : "Absent",
          };

          if (existingIndex > -1) {
            mergedAttendance[existingIndex] = {
              ...mergedAttendance[existingIndex],
              ...mergedRecord,
            };
          } else {
            mergedAttendance.push(mergedRecord);
          }
        });

        setAttendance(mergedAttendance);
        // 👇 Default to today’s record
        const today = new Date();
        setSelectedDate(today);
        setSelectedRecord(
          mergedAttendance.find(
            (rec) => new Date(rec.date).toDateString() === today.toDateString(),
          ) || null,
        );
        setDate(today.toISOString().split("T")[0]);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [employeeId]);

  // Utilities
  const isNthSaturday = (date) => {
    if (date.getDay() !== 6) return false;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    let count = 0;
    for (let d = new Date(firstDay); d <= date; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 6) count++;
    }
    return weeklyOff.includes(count);
  };
  console.log("week off", weeklyOff);

  const getHoliday = (date) =>
    holidays.find(
      (h) => new Date(h.date).toDateString() === date.toDateString(),
    );
  const isHoliday = (date) => !!getHoliday(date);

  const isMonthLocked = (date) => {
    const now = new Date();
    return (
      date.getFullYear() < now.getFullYear() ||
      (date.getFullYear() === now.getFullYear() &&
        date.getMonth() < now.getMonth())
    );
  };

  const calculateWorkedHours = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getWorkedHoursDecimal = (checkIn, checkOut) =>
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);

  // Updated getDayStatus using workingHours if available
  const getDayStatus = (record) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    if (record.leaveRef) return record.dayStatus;

    let hours =
      record.workingHours ||
      (record.checkIn && record.checkOut
        ? getWorkedHoursDecimal(record.checkIn, record.checkOut)
        : 0);

    if (record.regStatus === "Rejected") {
      return "Regularization Rejected";
    }

    
    if (record.regStatus === "Approved") {
      if (hours >= 8) return "Regularized (Full Day)";
      if (hours >= 4) return "Regularized (Half Day)";
      return "Regularized";
    }
    // New change
    if (record.regStatus === "Pending") {
      return "Pending Regularization";
    }
    if (recordDate.getTime() === today.getTime()) {
      if (record.checkIn && !record.checkOut) return "Working";
    }

    if (
      recordDate.getTime() < today.getTime() &&
      record.checkIn &&
      !record.checkOut
    )
      return "Absent";
    if (!record.checkIn && !record.checkOut) return "Absent";

    if (hours >= 8) return "Full Day";
    if (hours >= 4) return "Half Day";
    return "Absent";
  };


  const shouldShowRegularizationButton = (record, date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isPastOrTodayCurrentMonth =
      recordDate.getFullYear() === currentYear &&
      recordDate.getMonth() === currentMonth &&
      recordDate <= today;

    if (!isPastOrTodayCurrentMonth) return false;
    if (record?.leaveRef?.status === "approved") return false;
    if (record?.leaveRef?.status === "rejected") return true;
    if (!record?.checkIn || !record?.checkOut) return true;

    return false;
  };

  const attendanceMap = {};
  attendance.forEach((rec) => {
    const dateKey = new Date(rec.date).toDateString();
    if (!attendanceMap[dateKey] || rec.leaveRef || rec.regStatus) {
      attendanceMap[dateKey] = { ...rec, dayStatus: getDayStatus(rec) };
    }
  });

  const isWeeklyOff = (date) => {
    if (date.getDay() === 0) return true;
    if (date.getDay() === 6) {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      let satCount = 0;
      for (let d = new Date(firstDay); d <= date; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 6) satCount++;
      }
      return weeklyOff.includes(satCount);
    }
    return false;
  };

  //dipali code
  // const tileClassName = ({ date, view }) => {
  //   if (view !== "month") return "";
  //   const rec = attendanceMap[date.toDateString()];
  //   if (isWeeklyOff(date)) return "weekly-off-day";
  //   if (isHoliday(date)) return "holiday-day";
  //   if (rec?.leaveRef) {
  //     if (rec.leaveRef.status === "approved") return "leave-day";
  //     if (rec.leaveRef.status === "rejected") return "rejected-leave-day";
  //     if (rec.leaveRef.status === "pending") return "pending-leave-day";
  //   }

  //    // ✅ Regularization
  // if (rec?.regStatus === "Approved") {
  //   return "present-day"; // green background
  // }
  // if (rec?.regStatus === "Pending") {
  //   return ""; // no background color
  // }
  // if (rec?.regStatus === "Rejected") {
  //   return ""; // no background color
  // }
  //   if (rec?.regStatus === "Approved" || rec?.dayStatus === "Full Day") return "present-day";
  //   if (rec?.dayStatus === "Half Day") return "halfday-day";
  //   if (rec?.regStatus === "Pending") return "pending-regularization-day";
  //   if (rec && (!rec.checkIn || !rec.checkOut)) return "forgot-checkinout";
  //   return "";
  // };

  // const handleDateClick = (date) => {
  //   setSelectedDate(date);
  //   setSelectedRecord(attendanceMap[date.toDateString()] || null);
  //   setDate(date.toISOString().split("T")[0]);
  // };

  //adesh code
  // const tileClassName = ({ date, view }) => {
  //   if (view !== "month") return "";

  //   const today = new Date();
  //   const isToday =
  //     date.getDate() === today.getDate() &&
  //     date.getMonth() === today.getMonth() &&
  //     date.getFullYear() === today.getFullYear();

  //   // support two common key formats in case your map uses ISO keys elsewhere
  //   const key1 = date.toDateString();            // "Thu Nov 13 2025"
  //   const key2 = date.toISOString().slice(0, 10); // "2025-11-13"
  //   const rec = attendanceMap[key1] ?? attendanceMap[key2];

  //   if (isToday) return "today-day";

  //   // weekly off / holiday highest
  //   if (isWeeklyOff(date)) return "weekly-off-day";
  //   if (isHoliday(date)) return "holiday-day";

  //   // If record indicates PRESENT — give it priority over leave
  //   if (rec) {
  //     const ds = rec.dayStatus || "";
  //     const reg = rec.regStatus || "";

  //     if (ds === "Working" || ds === "Full Day" || ds.includes("Regularized") || reg === "Approved") {
  //       return "present-day";
  //     }
  //     if (ds === "Half Day" || ds.includes("Half")) return "halfday-day";
  //     if (reg === "Pending") return "pending-regularization-day";

  //     // leaves (after present checks)
  //     if (rec.leaveRef) {
  //       const st = (rec.leaveRef.status || "").toLowerCase();
  //       if (st === "approved") return "leave-day";
  //       if (st === "rejected") return "rejected-leave-day";
  //       if (st === "pending") return "pending-leave-day";
  //     }

  //     // forgot checkin/out
  //     if (!rec.checkIn || !rec.checkOut) return "forgot-checkinout";
  //   }

  //   return "";
  // };

  //new code

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const key1 = date.toDateString();
    const key2 = date.toISOString().slice(0, 10);
    const rec = attendanceMap[key1] ?? attendanceMap[key2];

    if (isToday) return "today-day";

    if (isWeeklyOff(date)) return "weekly-off-day";
    if (isHoliday(date)) return "holiday-day";

    if (!rec) return "";

    const ds = rec.dayStatus || "";
    const reg = rec.regStatus || "";

    if (reg === "Rejected") {
      return ""; 
    }

    // 1) Pending regularization ⇒ separate color, NOT present
    if (reg === "Pending") return "pending-regularization-day";

  if (
    ds === "Half Day" || 
    ds.includes("Half") || 
    ds === "Regularized (Half Day)"
  ) {
    return "halfday-day";
  }

    // 2) Approved regularization or real present days ⇒ green
    if (
      reg === "Approved" ||
      ds === "Working" ||
      ds === "Full Day" ||
      (ds.includes("Regularized") && !ds.includes("Half") ) 
    ) {
      return "present-day";
    }

    if (rec.leaveRef) {
      const st = (rec.leaveRef.status || "").toLowerCase();
      if (st === "approved") return "leave-day";
      if (st === "rejected") return "rejected-leave-day";
      if (st === "pending") return "pending-leave-day";
    }

    if (!rec.checkIn || !rec.checkOut) return "forgot-checkinout";

    return "";
  };

   ///
  const handleDateClick = (date) => {
    setSelectedDate(date);

    const record = attendanceMap[date.toDateString()] || null; // ✅ define here first
    setSelectedRecord(record);
    setDate(date.toISOString().split("T")[0]);

    // 🪄 Log details in console safely
    console.log("📅 Selected Date:", date.toDateString());
    console.log(
      "🧾 Day Record:",
      record ? record : "No record found for this date",
    );
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRecord?.leaveType) {
      setMessage("❌ Cannot regularize on a leave day!");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const authAxios = axios.create({
        baseURL: "http://localhost:8000",
        headers: { Authorization: `Bearer ${token}` },
      });

      await authAxios.post("/attendance/regularization/apply", {
        employeeId,
        date,
        requestedCheckIn: checkIn || null,
        requestedCheckOut: checkOut || null,
      });

      setMessage("✅ Regularization request submitted successfully!");
      setShowModal(false);
    } catch (err) {
      console.error("Error submitting regularization:", err);
      setMessage("❌ Failed to submit request");
    }
  };


 useEffect(() => {
  const month = activeStartDate.getMonth();
  const year = activeStartDate.getFullYear();

  let leaveCount = 0;
  let presentCount = 0;
  let regularizedCount = 0;
  let holidayCount = 0;
  let halfDayCount = 0;

  // Map attendance by date
  const attendanceByDate = {};
  attendance.forEach((rec) => {
    const dateKey = new Date(rec.date).toDateString();
    attendanceByDate[dateKey] = rec;
  });

  // Map leave days by date
  const leavesByDate = {};
  leaves.forEach((leave) => {
    const from = new Date(leave.dateFrom);
    const to = new Date(leave.dateTo);

    const duration = leave.duration === "half" ? 0.5 : 1;

    while (from <= to) {
      const dateKey = from.toDateString();
      if (from.getMonth() === month && from.getFullYear() === year) {
        leavesByDate[dateKey] = {
          status: leave.status,
          duration,
        };
      }
      from.setDate(from.getDate() + 1);
    }
  });

  // Iterate through each day of the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toDateString();

    // Skip weekly off days
    if (isWeeklyOff(date)) {
      continue;
    }

    // Holiday
    if (isHoliday(date)) {
      holidayCount++;
      continue;
    }

    const rec = attendanceByDate[dateKey];
    const leave = leavesByDate[dateKey];

    // Skip rejected regularization
    if (rec?.regStatus === "Rejected") {
      continue;
    }

    let dayPresent = 0;
    let dayLeave = 0;

    if (rec) {
      const dayStatus = getDayStatus(rec);
      
      // Check if this is a regularized day
      if (rec.regStatus === "Approved") {
        regularizedCount++;
      }
      
      if (dayStatus === "Working" || 
          dayStatus === "Full Day" || 
          dayStatus === "Regularized (Full Day)" ||
          dayStatus === "Regularized") {  
        dayPresent = 1;
      } 
      else if (dayStatus === "Half Day" || dayStatus === "Regularized (Half Day)") {
        dayPresent = 0.5;
        halfDayCount += 1;
      }
      else if (rec?.checkIn && rec?.checkOut && 
               !(dayStatus === "Absent" || dayStatus === "Pending Regularization" || dayStatus === "Regularization Rejected")) {
        const hours = (new Date(rec.checkOut) - new Date(rec.checkIn)) / (1000 * 60 * 60);
        if (hours >= 8) {
          dayPresent = 1;
        } else if (hours >= 4) {
          dayPresent = 0.5;
          halfDayCount += 1;
        }
      }
    }

    // Handle approved leave 
    if (leave?.status === "approved") {
      dayLeave = leave.duration;
    }

    if (dayPresent === 0.5 && dayLeave === 0.5) {
      presentCount += 0.5;
      leaveCount += 0.5;
    } else if (dayPresent === 0 && dayLeave > 0) {
      leaveCount += dayLeave;
    } else {
      presentCount += dayPresent;
    }
  }

  setSummary({
    leave: leaveCount,
    present: presentCount,
    regularized: regularizedCount,
    holidays: holidayCount,
    halfDay: halfDayCount,
  });
}, [attendance, leaves, holidays, activeStartDate]);



  // --- Regularization ---
  const handleRegularizationSubmit = async (e) => {
    e.preventDefault();

    if (selectedRecord?.leaveRef?.status === "approved") {
      setMessage("❌ Cannot regularize on a leave day!");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const authAxios = axios.create({
        baseURL: "http://localhost:8000",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Prepare times in HH:MM format for backend
      const formatTime = (dateTime) => {
        if (!dateTime) return null;
        const d = new Date(dateTime);
        return d.toTimeString().slice(0, 5); // "HH:MM"
      };

      const payload = {
        employeeId,
        date, // should be "YYYY-MM-DD"
        requestedCheckIn:
          checkIn ||
          (selectedRecord?.checkIn ? formatTime(selectedRecord.checkIn) : null),
        requestedCheckOut:
          checkOut ||
          (selectedRecord?.checkOut
            ? formatTime(selectedRecord.checkOut)
            : null),
      };

      console.log("Submitting payload:", payload);

      const res = await authAxios.post(
        "/attendance/regularization/apply",
        payload,
      );

      setMessage("✅ Regularization request submitted successfully!");
      setShowModal(false);
      setCheckIn("");
      setCheckOut("");
      console.log(res.data);
    } catch (err) {
      console.error("Error submitting regularization:", err);
      setMessage("❌ Failed to submit request");
    }
  };

  //harshda's code
  const toLocalDate = (dateStr) => {
    if (!dateStr) return null; // return null if empty, undefined, null

    const d = new Date(dateStr);
    if (isNaN(d)) return null; // invalid date → return null

    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

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

  const token = localStorage.getItem("accessToken");

  const authAxios = axios.create({
    baseURL: "http://localhost:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchTodayLeaveDirect = async () => {
    try {
      const today = toLocalDate(new Date());
      const res = await authAxios.get(`/leave/my/${employeeId}`);
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

  const handleCheckIn = async () => {
    if (!employeeId) return alert("User ID is missing!");

    const today = new Date().toDateString();
    const todayRecord = attendance.find(
      (rec) => new Date(rec.date).toDateString() === today,
    );

    // If already checked in
    if (todayRecord?.checkIn) {
      const time = new Date(todayRecord.checkIn).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return alert(`Already checked in today at ${time}`);
    }

    // Check Leave
    const todayLeaveData = await fetchTodayLeaveDirect();
    if (todayLeaveData) {
      return alert(
        "❗ You have applied for leave today. Check-in is not allowed.",
      );
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const address = await getAddressFromCoords(latitude, longitude);

      try {
        const res = await authAxios.post(`/attendance/${employeeId}/checkin`, {
          lat: latitude,
          lng: longitude,
          address,
          mode: workMode === "WFH" ? "WFH" : "Office",
        });

        alert("Checked in successfully");
        window.location.reload();
      } catch (err) {
        alert(err.response?.data?.message || "Check-in failed");
      }
    });
  };

  //Harshada Added
  const handleCheckOut = async () => {
    try {
      // find today's record by date (safe comparison)
      const today = new Date().toDateString();
      const todayRecord = attendance.find(
        (rec) => new Date(rec.date).toDateString() === today,
      );

      console.log("DEBUG todayRecord for checkout:", todayRecord);

      if (!todayRecord?.checkIn) {
        return alert("Please check in first!");
      }

      if (todayRecord?.checkOut) {
        return alert("Already checked out today!");
      }

      // call backend - keep the same path style as checkin
      await authAxios.post(`/attendance/${employeeId}/checkout`);

      // success message
      alert("Checked Out Successfully");

      // update UI locally without reloading page
      setAttendance((prev) =>
        prev.map((rec) =>
          rec._id === todayRecord._id
            ? { ...rec, checkOut: new Date().toISOString() }
            : rec,
        ),
      );

      // optional: update selectedRecord if it's same day
      setSelectedRecord((prev) =>
        prev && new Date(prev.date).toDateString() === today
          ? { ...prev, checkOut: new Date().toISOString() }
          : prev,
      );
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err?.response?.data?.message || "Checkout Failed");
    }
  };

  //Break Shivani
  const [breakData, setBreakData] = useState([]);
  const [todayBreak, setTodayBreak] = useState(null);

  useEffect(() => {
    const fetchBreaks = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:8000/api/break/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBreakData(res.data);
      } catch (err) {
        console.error("Error fetching breaks", err);
      }
    };

    fetchBreaks();
  }, []);

  useEffect(() => {
    if (!selectedDate || breakData.length === 0) {
      setTodayBreak(null);
      return;
    }

    const selected = breakData.find(
      (b) =>
        new Date(b.date).toDateString() ===
        new Date(selectedDate).toDateString(),
    );

    setTodayBreak(selected || null);
  }, [selectedDate, breakData]);

  const formatSeconds = (secs = 0) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };
  const isHolidayOrWeeklyOff =
    selectedDate &&
    (isHoliday(selectedDate) ||
      selectedDate.getDay() === 0 ||
      isNthSaturday(selectedDate));

  return (
    <div
      className="container-fluid pt-1 px-3"
      style={{ marginTop: "-25px", backgroundColor: "#f5f7fb" }}
    >
      <div className="row g-3">
        <div className="col-md-8 mb-3 ">
          {/* Calender card start */}
          <div className="card p-3 mt-3 shadow-sm p-4 border-10 d-flex justify-content-center">
            <h2
              className="text-center"
              style={{ color: "#3A5FBE", fontSize: "20px" }}
            >
              My Attendance
            </h2>
            <hr
              style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}
            ></hr>
            <div className="d-flex justify-content-center mb-3">
              <Calendar
                onClickDay={handleDateClick}
                tileClassName={tileClassName}
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate }) =>
                  setActiveStartDate(activeStartDate)
                }
              />
            </div>

            {/* <div className="d-flex mt-3 justify-content-around">
                    <div className="badge bg-info p-2">Leave: {summary.leave}</div>
                    <div className="badge bg-success p-2">Present: {summary.present}</div>
                    <div className="badge bg-warning p-2">
                      Regularized: {summary.regularized}
                    </div>
                    <div className="badge bg-danger p-2">Holidays: {summary.holidays}</div>
                </div> */}
            <div
              className="d-flex justify-content-center mt-1 flex-wrap"
              style={{ gap: "35px" }}
            >
              <span>
                <span className="legend-box present"></span> Present ({summary.present}) 
              </span>
              <span>
                <span className="legend-box leave"></span> Leave ({summary.leave})
              </span>
              <span>
                <span className="legend-box holiday"></span> Holidays ({summary.holidays})
              </span>
              <span>
                <span className="legend-box halfday"></span> Half Day ({summary.halfDay})
              </span>
              <span>
                <span className="legend-box today"></span> Today
              </span>
            </div>
          </div>
          {/* Calender card End */}
        </div>

        {/* Today Attendance Section Start */}
        <div className="col-md-4">
          <div className="card p-4 mt-3 shadow-sm  border-10 mb-3">
            <h2
              style={{
                fontSize: "20px",
                color: "#3A5FBE",
                fontWeight: "600",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              Today's Attendance
            </h2>
            <hr
              style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}
            ></hr>

            {/* 🔹 Always show today's check-in record only */}
            {/* {(() => {
              const today = new Date();
              const todayRecord = attendance.find(
                (rec) => new Date(rec.date).toDateString() === today.toDateString()
              ); */}
            {(() => {
              const today = new Date();
              const todayRecord = attendance.find(
                (rec) =>
                  new Date(rec.date).toDateString() === today.toDateString(),
              );
              return (
                <div className="attendance-details">
                  {todayRecord ? (
                    <>
                      {todayRecord?.checkIn ? (
                        <p className="mb-2 text-success">
                          <FontAwesomeIcon
                            icon={faSquareCheck}
                            style={{ marginRight: "8px" }}
                          />
                          <strong
                            style={{ color: "#28a745", fontWeight: "600" }}
                          >
                            Checked in at
                          </strong>{" "}
                          {/* //Added by Jaicy */}
                          {new Date(todayRecord.checkIn).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric", // 6 instead of 06
                              minute: "2-digit", // 05, 30 etc.
                              hourCycle: "h12", // ensures 12-hour format with AM/PM
                            },
                          )}
                        </p>
                      ) : (
                        <p
                          className="mb-2"
                          style={{ color: "#dc3545", fontWeight: "600" }}
                        >
                          Not Checked In
                        </p>
                      )}

                      {/* Checkout timing */}
                      {todayRecord?.checkOut && (
                        <p
                          className="mb-2 text-danger"
                          style={{ fontSize: "16px" }}
                        >
                          <FontAwesomeIcon
                            icon={faSquareCheck}
                            style={{ marginRight: "8px" }}
                          />
                          <strong
                            style={{ color: "#dc3545", fontWeight: "600" }}
                          >
                            Checked out at
                          </strong>{" "}
                          {new Date(todayRecord.checkOut).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hourCycle: "h12",
                            },
                          )}
                        </p>
                      )}
                      {/* Checkout timing end */}

                      {todayRecord?.checkIn && todayRecord?.checkOut && (
                        <>
                          {/* <hr style={{ width: "100%", margin: "5px 0", opacity: "0.2" }} /> */}
                          <p style={{ color: "#3A5FBE" }}>
                            <strong>Total Hours:</strong>{" "}
                            {calculateWorkedHours(
                              todayRecord.checkIn,
                              todayRecord.checkOut,
                            )}
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#dc3545", fontWeight: "600" }}>
                      No record available for today
                    </p>
                  )}

                  {/* ============  Harshada added WFO / WFH UI Section =============*/}

                  {/* <div className="mt-3 d-flex flex-row gap-4 justify-content-start  align-items-center">
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
                      </div> */}
                  <div className="d-flex flex-row gap-5 justify-content-md-start ms-0 mt-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={workMode === "WFO"}
                        onChange={() => setWorkMode("WFO")}
                        disabled={!!todayRecord?.checkIn}
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
                        disabled={!!todayRecord?.checkIn}
                        // onChange={(e) => setWorkMode(e.target.value)}
                      />
                      <label className="form-check-label ms-2">WFH</label>
                    </div>
                  </div>

                  {/* ============ Harshada added =============*/}
                  {/* <hr style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}></hr> */}

                  <div
                    style={{ display: "flex", gap: "15px", marginTop: "10px" }}
                  >
                    <button
                      className={`btn px-4 ${
                        todayRecord?.checkIn ? "btn-secondary" : "btn-success"
                      }`}
                      onClick={handleCheckIn}
                      disabled={!!todayRecord?.checkIn}
                    >
                      Check-In
                    </button>

                    <button
                      className="btn btn-danger px-4"
                      onClick={handleCheckOut}
                      disabled={
                        !todayRecord?.checkIn || !!todayRecord?.checkOut
                      }
                    >
                      Check-Out
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Today Attendance Section End */}

          {/* <div className="col-md-4"> */}
          <div className="card p-4 mt-3  shadow-sm  border-10  ">
            {selectedDate && (
              <div
                className="attendance-details "
                style={{ marginLeft: "18px" }}
              >
                <h2
                  style={{
                    textAlign: "center",
                    color: "#3A5FBE",
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "15px",
                  }}
                >
                  {selectedDate.toDateString()}
                </h2>
                <hr
                  style={{ width: "100%", margin: "10px 0", opacity: "0.2" }}
                ></hr>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* holiday and weekly off */}
                  {isHoliday(selectedDate) ? (
                    <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                      <strong>Holiday:</strong> {getHoliday(selectedDate).name}
                    </p>
                  ) : selectedDate.getDay() === 0 ||
                    isNthSaturday(selectedDate) ? (
                    <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                      <strong>Weekly Off</strong>
                    </p>
                  ) : null}

                  {selectedRecord?.leaveRef ? (
                    <div
                      className={
                        selectedRecord.leaveRef.status === "approved" ? "" : ""
                      }
                    >
                      <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                        <strong style={{ marginleft: "18px" }}>
                          Leave Type:
                        </strong>{" "}
                        <span style={{ marginLeft: "8px" }}>
                          {selectedRecord.leaveRef.leaveType}
                        </span>
                      </p>

                      <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                        <strong style={{ marginRight: "8px" }}>Status:</strong>
                        {selectedRecord.leaveRef.status === "approved"
                          ? "Approved"
                          : selectedRecord.leaveRef.status === "pending"
                            ? "Pending"
                            : selectedRecord.leaveRef.status === "rejected"
                              ? "Rejected"
                              : "N/A"}
                      </p>

                      <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                        <strong style={{ marginRight: "8px" }}>
                          {selectedRecord.leaveRef.status === "approved"
                            ? "Approved By:"
                            : selectedRecord.leaveRef.status === "rejected"
                              ? "Rejected By:"
                              : "Approver Name:"}
                        </strong>
                        {selectedRecord.leaveRef.approvedBy?.name ||
                          manager?.name ||
                          (selectedRecord.leaveRef.status === "pending"
                            ? "Waiting for Approval"
                            : "N/A")}
                      </p>

                      <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                        <strong style={{ marginRight: "8px" }}>
                          Duration:
                        </strong>
                        {Math.ceil(
                          (new Date(selectedRecord.leaveRef.dateTo) -
                            new Date(selectedRecord.leaveRef.dateFrom)) /
                            (1000 * 60 * 60 * 24),
                        ) + 1}
                        Day
                      </p>
                    </div>
                  ) : (
                    selectedDate.getDay() !== 0 &&
                    !isNthSaturday(selectedDate) &&
                    !isHoliday(selectedDate) && (
                      <>
                        <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                          <strong>Status:</strong>{" "}
                          {selectedRecord?.dayStatus || "No record"}
                        </p>
                        <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                          <strong>Check-in:</strong>{" "}
                          {selectedRecord?.checkIn
                            ? new Date(
                                selectedRecord.checkIn,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </p>
                        <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                          <strong>Check-out:</strong>{" "}
                          {selectedRecord?.checkOut
                            ? new Date(
                                selectedRecord.checkOut,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "N/A"}
                        </p>
                        {/* rutuja code  */}
                        {selectedRecord?.checkIn && selectedRecord?.checkOut && (
                          <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                            <strong>Total Working Hours:</strong>{" "}
                            {calculateWorkedHours(selectedRecord.checkIn, selectedRecord.checkOut)}
                          </p>
                        )}
                      </>
                    )
                  )}

                  {/* Break details*/}
                  {!selectedRecord?.leaveRef &&
                    !isHoliday(selectedDate) &&
                    selectedDate.getDay() !== 0 &&
                    !isNthSaturday(selectedDate) && (
                      <>
                        <hr style={{ opacity: 0.2 }} />

                        <h6 style={{ color: "#3A5FBE", fontWeight: "600" }}>
                          Break Details
                        </h6>

                        <div
                          style={{
                            maxHeight: "130px",
                            overflowY: "auto",
                            paddingRight: "6px",
                          }}
                        >
                          {todayBreak ? (
                            <>
                              {todayBreak.breaks.length === 0 ? (
                                <p className="text-muted">No breaks taken</p>
                              ) : (
                                todayBreak.breaks.map((brk, index) => (
                                  <div
                                    key={index}
                                    className="border rounded p-2 mb-2"
                                    style={{ background: "#f8f9fa" }}
                                  >
                                    <p
                                      className="mb-1"
                                      style={{
                                        fontSize: "14px",
                                        marginBottom: "20px",
                                      }}
                                    >
                                      <strong>Type:</strong> {brk.type}
                                    </p>

                                    {brk.type === "Other" && (
                                      <p
                                        className="mb-1"
                                        style={{
                                          fontSize: "14px",
                                          marginBottom: "20px",
                                        }}
                                      >
                                        <strong>Reason:</strong>{" "}
                                        {brk.reason?.trim()
                                          ? brk.reason
                                          : "N/A"}
                                      </p>
                                    )}

                                    <p
                                      className="mb-1"
                                      style={{
                                        fontSize: "14px",
                                        marginBottom: "20px",
                                      }}
                                    >
                                      <strong>Start:</strong>{" "}
                                      {new Date(
                                        brk.startTime,
                                      ).toLocaleTimeString()}
                                    </p>

                                    <p
                                      className="mb-1"
                                      style={{
                                        fontSize: "14px",
                                        marginBottom: "20px",
                                      }}
                                    >
                                      <strong>End:</strong>{" "}
                                      {brk.endTime
                                        ? new Date(
                                            brk.endTime,
                                          ).toLocaleTimeString()
                                        : "In Progress"}
                                    </p>

                                    <p
                                      className="mb-0"
                                      style={{
                                        fontSize: "14px",
                                        marginBottom: "20px",
                                      }}
                                    >
                                      <strong>Duration:</strong>{" "}
                                      {brk.durationSeconds
                                        ? formatSeconds(brk.durationSeconds)
                                        : "Running"}
                                    </p>
                                  </div>
                                ))
                              )}
                            </>
                          ) : (
                            <p className="text-muted">
                              No break record for this date
                            </p>
                          )}
                        </div>

                        {todayBreak?.totalBreakSeconds > 0 && (
                          <p className="mt-2">
                            <strong>Total Break Time:</strong>{" "}
                            {formatSeconds(todayBreak.totalBreakSeconds)}
                          </p>
                        )}
                      </>
                    )}
                </div>
              </div>
            )}
          </div>
          {/* </div> */}

          {/* Apply Regularization btn Start */}

          {shouldShowRegularizationButton(selectedRecord, selectedDate) &&
            !isMonthLocked(selectedDate) &&
            selectedDate.getDay() !== 0 &&
            !isNthSaturday(selectedDate) &&
            !isHoliday(selectedDate) && (
              // <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>Apply Regularization</button>
              <div className="card p-4 mt-3 shadow-sm h border-10  ">
                <button
                  className="btn btn-sm custom-outline-btn p-2"
                  onClick={() =>
                    navigate(
                      `/dashboard/${role}/${username}/${id}/regularization`,
                      { replace: true },
                    )
                  }
                >
                  Apply Regularization
                </button>
              </div>
            )}

          {/* Apply Regularization btn End */}
        </div>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Apply Regularization</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body px-3">
                {message && <p className="mt-2">{message}</p>}
                {date && (
                  <div className="mb-3">
                    <strong>Selected Date:</strong>{" "}
                    {new Date(date + "T00:00").toDateString()}
                  </div>
                )}

                <form onSubmit={handleRegularizationSubmit}>
                  {/* Date */}
                  <div className="mb-2">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Requested Check-In */}
                  <div className="mb-2">
                    <label className="form-label">Requested Check-In</label>
                    <input
                      type="time"
                      className="form-control"
                      value={
                        checkIn ||
                        (selectedRecord?.checkIn
                          ? new Date(selectedRecord.checkIn).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )
                          : "")
                      }
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                    {selectedRecord?.checkIn && (
                      <small className="text-muted">
                        Existing Check-In Time (will be applied)
                      </small>
                    )}
                  </div>

                  {/* Requested Check-Out */}
                  <div className="mb-2">
                    <label className="form-label">Requested Check-Out</label>
                    <input
                      type="time"
                      className="form-control"
                      value={
                        checkOut ||
                        (selectedRecord?.checkOut
                          ? new Date(
                              selectedRecord.checkOut,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          : "")
                      }
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                    {selectedRecord?.checkOut && (
                      <small className="text-muted">
                        Existing Check-Out Time (will be applied)
                      </small>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary mt-3 w-100">
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAttendance;
