// import React, { useEffect, useState } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import axios from "axios";
// import "./MyAttendance.css";

// function MyAttendanceCalendar({ employeeId }) {
//   const [attendance, setAttendance] = useState([]);
//   const [leaves, setLeaves] = useState([]);
//   const [weeklyOff, setWeeklyOff] = useState([]);
//   const [holidays, setHolidays] = useState([]);
//   const [regularizations, setRegularizations] = useState([]);
//   const [summary, setSummary] = useState({
//     leave: 0,
//     present: 0,
//     regularized: 0,
//     holidays: 0,
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [attRes, leaveRes, weeklyRes, holidayRes, regRes] = await Promise.all([
//           axios.get(`https://ems-cws-test.vercel.app/attendance/${employeeId}`),
//           axios.get(`https://ems-cws-test.vercel.app/leave/my/${employeeId}`),
//           axios.get(`https://ems-cws-test.vercel.app/admin/weeklyoff/${new Date().getFullYear()}`),
//           axios.get(`https://ems-cws-test.vercel.app/getHolidays`),
//           axios.get(`https://ems-cws-test.vercel.app/attendance/regularization/my/${employeeId}`),
//         ]);

//         setWeeklyOff(weeklyRes.data.data?.saturdays || []);
//         setHolidays(holidayRes.data || []);
//         setLeaves(leaveRes.data);
//         setRegularizations(regRes.data);

//         // Expand approved leaves by date
//         const expandedLeaves = [];
//         leaveRes.data.forEach((leave) => {
//           if (leave.status === "approved") {
//             let current = new Date(leave.dateFrom);
//             const to = new Date(leave.dateTo);
//             while (current <= to) {
//               expandedLeaves.push({
//                 date: new Date(current),
//                 dayStatus: "Leave",
//                 leaveType: leave.leaveType,
//               });
//               current.setDate(current.getDate() + 1);
//             }
//           }
//         });

//         // Expand approved regularizations
//         const expandedRegularizations = regRes.data
//           .filter((r) => r.status === "Approved")
//           .map((r) => ({
//             date: new Date(r.date),
//             dayStatus: "Regularized",
//             checkIn: r.requestedCheckIn,
//             checkOut: r.requestedCheckOut,
//           }));

//         // Merge attendance + leaves + regularizations
//         const merged = [...attRes.data, ...expandedLeaves, ...expandedRegularizations];
//         setAttendance(merged);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       }
//     };

//     fetchData();
//   }, [employeeId]);

//   // --- Helper functions ---
//   const isHoliday = (date) =>
//     holidays.some((h) => new Date(h.date).toDateString() === date.toDateString());

//   const isWeeklyOff = (date) => {
//     if (date.getDay() === 0) return true; // Sunday
//     if (date.getDay() === 6) {
//       const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
//       let count = 0;
//       for (let d = new Date(firstDay); d <= date; d.setDate(d.getDate() + 1)) {
//         if (d.getDay() === 6) count++;
//       }
//       return weeklyOff.includes(count);
//     }
//     return false;
//   };

//   // --- Prioritize what to show on the same day ---
//   const attendanceMap = {};
//   attendance.forEach((rec) => {
//     const dateKey = new Date(rec.date).toDateString();
//     const existing = attendanceMap[dateKey];

//     if (!existing) attendanceMap[dateKey] = rec;
//     else {
//       if (rec.dayStatus === "Leave") attendanceMap[dateKey] = rec;
//       else if (rec.dayStatus === "Regularized" && existing.dayStatus !== "Leave")
//         attendanceMap[dateKey] = rec;
//       else if (
//         (rec.dayStatus === "Present" || rec.dayStatus === "Full Day") &&
//         !["Leave", "Regularized"].includes(existing.dayStatus)
//       )
//         attendanceMap[dateKey] = rec;
//     }
//   });

//   // --- Calendar coloring ---
//   const tileClassName = ({ date, view }) => {
//     if (view !== "month") return "";
//     const rec = attendanceMap[date.toDateString()];

//     if (isHoliday(date)) return "holiday-day";
//     if (isWeeklyOff(date)) return "weekly-off-day";
//     if (rec) {
//       if (rec.dayStatus === "Regularized") return "regularized-day";
//       if (rec.dayStatus === "Leave") return "leave-day";
//       if (rec.dayStatus === "Present" || rec.dayStatus === "Full Day")
//         return "present-day";
//       if (rec.dayStatus === "Half Day") return "halfday-day";
//     }
//     return "";
//   };

//   // --- Monthly summary ---
//   useEffect(() => {
//     const now = new Date();
//     const month = now.getMonth();
//     const year = now.getFullYear();

//     let leaveCount = 0,
//       presentCount = 0,
//       regularizedCount = 0,
//       holidayCount = 0;

//     attendance.forEach((rec) => {
//       const d = new Date(rec.date);
//       if (d.getMonth() === month && d.getFullYear() === year) {
//         if (rec.dayStatus === "Leave") leaveCount++;
//         if (rec.dayStatus === "Regularized") regularizedCount++;
//         if (rec.dayStatus === "Present" || rec.dayStatus === "Full Day")
//           presentCount++;
//       }
//     });

//     holidays.forEach((h) => {
//       const d = new Date(h.date);
//       if (d.getMonth() === month && d.getFullYear() === year) holidayCount++;
//     });

//     setSummary({ leave: leaveCount, present: presentCount, regularized: regularizedCount, holidays: holidayCount });
//   }, [attendance, holidays]);

//   // --- Render UI ---
//   return (
//     // <div className="card shadow-sm mt-3 h-100 border-0">
//     //   <h4 className="text-center mt-1" style={{ color: "#3A5FBE" }}>
//     //     Attendance Calendar
//     //   </h4>

//     //   <div
//     //     style={{
//     //       width: "100%",
//     //       maxWidth: "350px",
//     //       margin: "0 auto",
//     //       backgroundColor: "#FFFFFF",
//     //     }}
//     //   >
//     //     <Calendar
//     //       tileClassName={tileClassName}
//     //       defaultActiveStartDate={
//     //         new Date(new Date().getFullYear(), new Date().getMonth(), 1)
//     //       }
//     //     />
//     //   </div>

//     //   <div
//     //     className="d-flex justify-content-center mt-3 flex-wrap"
//     //     style={{ gap: "20px" }}
//     //   >
//     //     <span><span className="legend-box present"></span> Present</span>
//     //     <span><span className="legend-box regularized"></span> Regularized</span>
//     //     <span><span className="legend-box leave"></span> Leave</span>
//     //     <span><span className="legend-box holiday"></span> Holiday</span>
//     //     <span><span className="legend-box weekend"></span> Weekly Off</span>
//     //   </div>
//     // </div>

//     <div className="card shadow-sm mt-2 h-100 border-0">
//       <h4 className="text-center mt-3" style={{ color: "#3A5FBE",fontSize: "25px" }}>
//         Attendance Calendar
//       </h4>

//       <div
//         style={{
//           width: "100%",
//           maxWidth: "350px",
//           margin: "0 auto",
//           backgroundColor: "#FFFFFF",
//         }}
//       >
//         <Calendar
//           tileClassName={tileClassName}
//           defaultActiveStartDate={
//             new Date(new Date().getFullYear(), new Date().getMonth(), 1)
//           }
//         />
//       </div>

//       <div
//         className="d-flex justify-content-center mt-3 flex-wrap"
//         style={{ gap: "20px" }}
//       >
//         <span><span className="legend-box present"></span> Present</span>
//         {/* <span><span className="legend-box regularized"></span> Regularized</span> */}
//         <span><span className="legend-box leave"></span> Leave</span>
//         <span><span className="legend-box holiday"></span> Holiday</span>
//         {/* <span><span className="legend-box weekend"></span> Weekly Off</span> */}

//       </div>
//     </div>
//   );
// }

// export default MyAttendanceCalendar;

// jaicy  code

import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./MyAttendanceCalendar.css";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

function MyAttendanceCalendar({ employeeId }) {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [weeklyOff, setWeeklyOff] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!employeeId) return; // ✅ Skip until defined
    const fetchData = async () => {
      try {
        const [attRes, leaveRes, weeklyRes, holidayRes, regRes] =
          await Promise.all([
            axios.get(`https://ems-cws-test.vercel.app/attendance/${employeeId}`),
            axios.get(`https://ems-cws-test.vercel.app/leave/my/${employeeId}`),
            axios.get(
              `https://ems-cws-test.vercel.app/admin/weeklyoff/${new Date().getFullYear()}`,
            ),
            axios.get(`https://ems-cws-test.vercel.app/getHolidays`),
            axios.get(
              `https://ems-cws-test.vercel.app/attendance/regularization/my/${employeeId}`,
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
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [employeeId]);
  const getHoliday = (date) =>
    holidays.find(
      (h) => new Date(h.date).toDateString() === date.toDateString(),
    );
  const isHoliday = (date) => !!getHoliday(date);
  const getWorkedHoursDecimal = (checkIn, checkOut) =>
    (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);

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

    if (record.regStatus === "Approved") {
      if (hours >= 8) return "Regularized (Full Day)";
      if (hours >= 4) return "Regularized (Half Day)";
      return "Regularized";
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

  const getTooltipContent = (date) => {
    const key1 = date.toDateString();
    const key2 = date.toISOString().slice(0, 10);
    const rec = attendanceMap[key1] ?? attendanceMap[key2];

    if (isHoliday(date)) {
      return `Holiday: ${getHoliday(date)?.name}`;
    }

    if (isWeeklyOff(date)) {
      return "Weekly Off";
    }
    if (!rec) return "No record";

    if (rec.leaveRef) {
      return `Leave: ${rec.leaveRef.leaveType} (${rec.leaveRef.status})`;
    }

    return rec.dayStatus || "No record";
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    // support two common key formats in case your map uses ISO keys elsewhere
    const key1 = date.toDateString(); // "Thu Nov 13 2025"
    const key2 = date.toISOString().slice(0, 10); // "2025-11-13"
    const rec = attendanceMap[key1] ?? attendanceMap[key2];

    if (isToday) return "today-day";

    // weekly off / holiday highest
    if (isWeeklyOff(date)) return "weekly-off-day";
    if (isHoliday(date)) return "holiday-day";

    // If record indicates PRESENT — give it priority over leave
    if (rec) {
      const ds = rec.dayStatus || "";
      const reg = rec.regStatus || "";

      if (ds === "Regularized (Half Day)" || ds.includes("Half") && reg === "Approved") {
        return "halfday-day";
      }

      if (
        ds === "Working" ||
        ds === "Full Day" ||
        ds.includes("Regularized") ||
        reg === "Approved"
      ) {
        return "present-day";
      }
      if (ds === "Half Day" || ds.includes("Half")) return "halfday-day";
      if (reg === "Pending") return "pending-regularization-day";

      // leaves (after present checks)
      if (rec.leaveRef) {
        const st = (rec.leaveRef.status || "").toLowerCase();
        if (st === "approved") return "leave-day";
        if (st === "rejected") return "rejected-leave-day";
        if (st === "pending") return "pending-leave-day";
      }

      // forgot checkin/out
      if (!rec.checkIn || !rec.checkOut) return "forgot-checkinout";
    }

    return "";
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const isCurrentMonth =
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear();

    if (!isCurrentMonth) return null;

    return (
      <span
        data-tooltip-id="calendar-tip"
        data-tooltip-content={getTooltipContent(date)}
        style={{
          //{ display: "block", width: "100%", height: "100%" }

          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    );
  };

  const tileDisabled = ({ date, view }) => {
    if (view !== "month") return false;

    return (
      date.getMonth() !== currentMonth.getMonth() ||
      date.getFullYear() !== currentMonth.getFullYear()
    );
  };

const internalStyles = `
.react-calendar {
  width: 100% !important;
  max-width: 100% !important;
}

.calendar-container .react-calendar .react-calendar__navigation {
  margin-bottom: 0px;
  height: 50px;
}

.react-calendar__month-view__weekdays {
  text-align: center;
  font-size: 12px;
}

.react-calendar__tile {
  min-height: 38px !important;
  padding: 5px !important;
}

.react-calendar__month-view__days__day {
  min-height: 38px !important;
}

.react-calendar__month-view__days {
  gap: 4px;
}

/* mobile */
@media (max-width: 768px) {
  .react-calendar__tile {
    min-height: 32px !important;
    font-size: 12px;
  }
}
`;

  // --- Render UI ---
  return (
    <div
      className="card shadow-sm mt-2  border-0"
      style={{ borderRadius: "12px", width: "100%", maxHeight: "auto" }}
    >
      <h4
        className="text-center mt-3 mb-2"
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          margin: "0px",
        }}
      >
        Attendance Calendar
      </h4>

      <style>{internalStyles}</style>
      <div className="calendar-container">
        <Calendar
          tileClassName={tileClassName}
          tileContent={tileContent}
          defaultActiveStartDate={
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
          //  showNeighboringMonth={false}
          onActiveStartDateChange={({ activeStartDate }) =>
            setCurrentMonth(activeStartDate)
          }
          tileDisabled={tileDisabled}
        />
      </div>
      <Tooltip
        id="calendar-tip"
        place="top"
        style={{
          backgroundColor: "#3A5FBE",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      />

      <div
        className="d-flex justify-content-center flex-wrap mt-3"
        style={{ gap: "25px", }}
      >
        <span>
          <span className="legend-box present"></span> Present
        </span>
        <span>
          <span className="legend-box leave"></span> Leave
        </span>
        <span>
          <span className="legend-box holiday"></span> Holidays
        </span>
        <span>
          <span className="legend-box halfday"></span> Half Day
        </span>
        <span>
          <span className="legend-box today"></span> Today
        </span>
      </div>
    </div>
  );
}

export default MyAttendanceCalendar;
