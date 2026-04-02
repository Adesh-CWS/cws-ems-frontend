import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function QuickApplyLeave({ user }) {
  const REASON_MAX_LENGTH = 300; // Character limit for reason{/* Reason limit code changes by dip 11-02-2026 */}
  const [formData, setFormData] = useState({
    leaveType: "SL",
    date: "",
  });
  const [showModal, setShowModal] = useState(false);

  // Full form state inside modal
  const [form, setForm] = useState({
    leaveType: "SL",
    dateFrom: "",
    dateTo: "",
    duration: "full",
    reason: "",
  });

  const [message, setMessage] = useState("");
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);
  const [manager, setManager] = useState(null);
  const [weeklyOffs, setWeeklyOffs] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!showModal || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(null);
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);
  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/admin/weeklyoff/${new Date().getFullYear()}`,
        );

        // 👇 Extract weekly off data safely
        const weeklyData = res.data?.data || res.data || {};
        const saturdayOffs = weeklyData.saturdays || []; // example: [2, 4]
        const sundayOff = true; // all Sundays are off by rule

        // ✅ Store in state
        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff });
        console.log("✅ Weekly offs fetched:", {
          saturdays: saturdayOffs,
          sundayOff,
        });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [], sundayOff: true }); // fallback: all Sundays off
      }
    };

    fetchWeeklyOffs();
  }, []);

  useEffect(() => {
    if (weeklyOffs.length > 0) {
      console.log("✅ Weekly offs fetched:", weeklyOffs);
    }
  }, [weeklyOffs]);

  // Fetch manager info
  useEffect(() => {
    const fetchManager = async () => {
      if (!user?.reportingManager) return;
      try {
        const res = await axios.get(
          `http://localhost:8000/users/${user.reportingManager}`,
        );
        setManager(res.data);
      } catch (err) {
        console.error("Error fetching manager:", err);
      }
    };
    fetchManager();
  }, [user]);

  // Open modal with pre-filled data
  const handleApplyClick = () => {
    if (!formData.date) {
      alert("Please select a date!");
      return;
    }

    setForm({
      leaveType: formData.leaveType,
      dateFrom: formData.date,
      dateTo: formData.date,
      duration: "full",
      reason: "",
    });

    // Determine available leave types based on probation
    const now = new Date();
    const doj = new Date(user.doj);
    const probationEnd = new Date(doj);
    probationEnd.setMonth(probationEnd.getMonth() + user.probationMonths);

    if (now < probationEnd) {
      setForm((prev) => ({ ...prev, leaveType: "LWP" }));
      setAvailableLeaveTypes(["LWP"]);
    } else {
      setAvailableLeaveTypes(["SL", "CL", "LWP"]);
    }

    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!form.reason || !form.dateFrom || !form.dateTo) {
  //     setMessage("Please fill all required fields");
  //     return;
  //   }

  //   try {
  //     await axios.post("http://localhost:8000/leave/apply", {
  //       employeeId: user._id,
  //       leaveType: form.leaveType,
  //       dateFrom: form.dateFrom,
  //       dateTo: form.dateTo,
  //       duration: form.duration,
  //       reason: form.reason,
  //       reportingManagerId: manager?._id || null,
  //     });

  //     alert("Leave applied successfully! Waiting for approval.");
  //     setMessage("");
  //     setShowModal(false);
  //     setFormData({ leaveType: "SL", date: "" });
  //   } catch (err) {
  //     setMessage(err.response?.data?.error || "Error applying leave");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fromDate = new Date(form.dateFrom);
    const toDate = new Date(form.dateTo);
    const min = new Date(minDate);
    const max = new Date(maxDate);

    if (!form.reason || !form.dateFrom || !form.dateTo) {
      setMessage("Please fill all required fields");
      return;
    }

    if (fromDate < min) {
      setMessage("From date cannot be before the current month.");
      return;
    }

    if (toDate > max) {
      setMessage("To date cannot be beyond next month.");
      return;
    }

    if (toDate < fromDate) {
      setMessage(
        "⚠️ Invalid date range: 'To Date' cannot precede 'From Date'.",
      );
      return;
    }

    if (!form.reason || !form.dateFrom || !form.dateTo) {
      setMessage("Please fill all required fields");
      return;
    }

    //    // 🚫 Prevent applying on Sunday or weekly off
    // for (
    //   let d = new Date(form.dateFrom);
    //   d <= new Date(form.dateTo);
    //   d.setDate(d.getDate() + 1)
    // ) {
    //   const dateStr = d.toISOString().split("T")[0];
    //   const isSunday = new Date(d).getDay() === 0;
    //   const isWeeklyOff = weeklyOffs.includes(dateStr);
    //   if (isSunday || isWeeklyOff) {
    //     alert(`You cannot apply for leave on Sundays or weekly off days (${dateStr}).`);
    //     return;
    //   }
    // }

    // 🚫 Prevent applying on Sunday or weekly off (Saturday/Sunday)
    for (
      let d = new Date(form.dateFrom);
      d <= new Date(form.dateTo);
      d.setDate(d.getDate() + 1)
    ) {
      const date = new Date(d);
      const dateStr = date.toISOString().split("T")[0];
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Check Sunday off
      if (weeklyOffs.sundayOff && day === 0) {
        alert(`❌ Cannot apply leave on Sunday (${dateStr}).`);
        return;
      }

      // Check 2nd/4th Saturday off
      if (day === 6 && Array.isArray(weeklyOffs.saturdays)) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        let saturdayCount = 0;
        for (
          let temp = new Date(firstDay);
          temp <= date;
          temp.setDate(temp.getDate() + 1)
        ) {
          if (temp.getDay() === 6) saturdayCount++;
        }

        if (weeklyOffs.saturdays.includes(saturdayCount)) {
          alert(`❌ Cannot apply leave on weekly off Saturday (${dateStr}).`);
          return;
        }
      }
    }
 // -------------------- 🚫 HOLIDAY VALIDATION (NEW) --------------------
      const currentYear = new Date().getFullYear();
      try {
        const holidaysRes = await axios.get("http://localhost:8000/getHolidays");
        const holidays = holidaysRes.data.filter(
          (h) => new Date(h.date).getFullYear() === currentYear,
        );

        // 🔹 Check if any date in range is a holiday
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          const checkDate = new Date(d);
          checkDate.setHours(0, 0, 0, 0);

          const isHoliday = holidays.some((holiday) => {
            const holidayDate = new Date(holiday.date);
            holidayDate.setHours(0, 0, 0, 0);
            return holidayDate.getTime() === checkDate.getTime();
          });

          if (isHoliday) {
            alert(
              `🎉 ${checkDate.toDateString()} is a holiday! You cannot apply leave on holidays.`,
            );
            setMessage("Cannot apply leave on holidays.");
            return;
          }
        }
      } catch (holidayErr) {
        console.error("Failed to fetch holidays:", holidayErr);
        
      }
    try {
      // ✅ 1️⃣ Fetch existing leaves of employee
      const existingLeavesRes = await axios.get(
        `http://localhost:8000/leave/my/${user._id}`,
      );
      const existingLeaves = existingLeavesRes.data || [];

      // ✅ 2️⃣ Check if any existing leave overlaps with new one
      const isOverlapping = existingLeaves.some((leave) => {
        const leaveFrom = new Date(leave.dateFrom);
        const leaveTo = new Date(leave.dateTo);

        // normalize time
        leaveFrom.setHours(0, 0, 0, 0);
        leaveTo.setHours(23, 59, 59, 999);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        // overlap check
        return (
          fromDate <= leaveTo &&
          toDate >= leaveFrom &&
          leave.status !== "rejected" // ignore rejected
        );
      });

      if (isOverlapping) {
        setMessage(
          "⚠️ You already applied for leave on one or more of these dates.",
        );
        alert(
          "⚠️ You already applied for leave on one or more of these dates.",
        );
        return;
      }

      await axios.post("http://localhost:8000/leave/apply", {
        employeeId: user._id,
        leaveType: form.leaveType,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        duration: form.duration,
        reason: form.reason,
        reportingManagerId: manager?._id || null, // send manager ID
      });

      //setMessage("Leave applied successfully! Waiting for approval.");
      alert("Leave applied successfully! Waiting for approval.");

      // ✅ Trigger parent refresh
      if (typeof onLeaveApplied === "function") onLeaveApplied();

      setForm({
        leaveType: availableLeaveTypes[0],
        dateFrom: "",
        dateTo: "",
        duration: "full",
        reason: "",
      });
      setShowModal(false);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error applying leave");
    }
  };

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);
  const maxDate = futureDate.toISOString().split("T")[0];

  const [daysCount, setDaysCount] = useState(0); // 👈 New state

  // 🧮 Calculate number of days whenever from/to changes
  useEffect(() => {
    if (form.dateFrom && form.dateTo) {
      const start = new Date(form.dateFrom);
      const end = new Date(form.dateTo);

      if (end >= start) {
        const diffTime = end - start;
        const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1; // include both dates
        setDaysCount(diffDays);
      } else {
        setDaysCount(0); // if invalid range
      }
    } else {
      setDaysCount(0);
    }
  }, [form.dateFrom, form.dateTo]);
  //bg scroll stop
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    useEffect;

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showModal]);
  // dip code changes 11-02-2026
  return (
    <div className="card shadow-sm h-100 border-0">
      <h4 className="ms-4 mt-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Apply for Leave
      </h4>
      <hr style={{ width: "100%", margin: "5px 0", opacity: "0.2" }}></hr>
      <div className="ms-4">
        {/* Quick Select */}
        <div
          className="mb-2"
          style={{ marginRight: "25px", marginTop: "15px" }}
        >
          <label style={{  marginBottom: "10px" }}>Leave Type</label>
          <select
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="SL">Sick Leave</option>
            <option value="CL">Casual Leave</option>
            <option value="LWP">LWP</option>
          </select>
        </div>

        <div className="mb-2" style={{ marginRight: "25px" }}>
          {/* <label>Date</label> */}
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="form-control"
            min={minDate}
            max={maxDate}
          />
        </div>

        <button
          // className="btn"
          // style={{ float: "right", marginRight: "25px",backgroundColor: "#3A5FBE", color: "white" }}
          // className="btn btn-sm btn-outline mb-2"
          style={{
            color: "#3A5FBE",
            borderColor: "#3A5FBE",
            float: "right",
            marginRight: "25px",
            marginTop: "10px",
          }}
          className="btn btn-sm custom-outline-btn mb-2"
          onClick={handleApplyClick}
        >
          Apply
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal d-block"
          ref={modalRef}
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "600px", marginTop: "50px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Apply Leave</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                {message && <div className="alert alert-danger">{message}</div>}
                <form onSubmit={handleSubmit}>
                  {/* Leave Type */}
                  <div className="mb-3 d-flex align-items-center">
                    <label
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                        width: "90px",
                        flexShrink: 0,
                        minWidth: "fit-content",
                      }}
                    >
                      Leave type:
                    </label>

                    <div className="d-flex gap-4 mt-2">
                      {/* Casual Leave */}
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          id="casual-radio"
                          value="CL"
                          checked={form.leaveType === "CL"}
                          onChange={handleChange}
                          disabled={
                            availableLeaveTypes.length === 1 &&
                            availableLeaveTypes[0] === "LWP"
                          }
                          style={{
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            accentColor: "#2E4A8B",
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="casual-radio"
                          style={{
                            fontSize: "14px",
                            color: "#495057",
                            marginLeft: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Casual
                        </label>
                      </div>

                      {/* Sick Leave */}
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          id="sick-radio"
                          value="SL"
                          checked={form.leaveType === "SL"}
                          onChange={handleChange}
                          disabled={
                            availableLeaveTypes.length === 1 &&
                            availableLeaveTypes[0] === "LWP"
                          }
                          style={{
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            accentColor: "#2E4A8B",
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="sick-radio"
                          style={{
                            fontSize: "14px",
                            color: "#495057",
                            marginLeft: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Sick
                        </label>
                      </div>

                      {/* Leave Without Pay */}
                      {availableLeaveTypes.includes("LWP") && (
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="leaveType"
                            id="lwp-radio"
                            value="LWP"
                            checked={form.leaveType === "LWP"}
                            onChange={handleChange}
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                              accentColor: "#2E4A8B",
                            }}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="lwp-radio"
                            style={{
                              fontSize: "14px",
                              color: "#495057",
                              marginLeft: "8px",
                              cursor: "pointer",
                            }}
                          >
                            Leave Without Pay
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Half Day
                  <div className="mb-3 d-flex align-items-center">
                    <label
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                        width: "90px",
                        flexShrink: 0,
                        minWidth: "fit-content",
                      }}
                    >
                      Half day:
                    </label>
                    <div className="form-check">
                      <input
                        disabled
                        type="checkbox"
                        name="duration"
                        className="form-check-input"
                        checked={form.duration === "half"}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            duration: e.target.checked ? "half" : "full",
                          }))
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                          accentColor: "#2E4A8B",
                        }}
                      />
                    </div>
                  </div> */}

                  <div className="mb-3 d-flex align-items-center">
                    {/* Dates */}

                    <div className="mb-3  d-flex align-items-center">
                      <label
                        style={{
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#495057",
                          width: "90px",
                          flexShrink: 0,
                        }}
                      >
                        Select Date:
                      </label>
                      <div className="row">
                        <div className="col-md-4">
                          <label
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginBottom: "6px",
                            }}
                          >
                            From
                          </label>
                          <input
                            type="date"
                            name="dateFrom"
                            value={form.dateFrom}
                            onChange={handleChange}
                            className="form-control"
                            required
                            style={{
                              fontSize: "14px",
                              padding: "8px 12px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                            }}
                            min={minDate}
                            max={maxDate}
                          />
                        </div>
                        <div className="col-md-4">
                          <label
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginBottom: "6px",
                            }}
                          >
                            To
                          </label>
                          <input
                            type="date"
                            name="dateTo"
                            value={form.dateTo}
                            onChange={handleChange}
                            className="form-control"
                            required
                            style={{
                              fontSize: "14px",
                              padding: "8px 12px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                            }}
                            min={minDate}
                            max={maxDate}
                          />
                        </div>

                        {/* No of Days */}
                        <div className="col-md-4">
                          <label
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginBottom: "6px",
                            }}
                          >
                            No of Days
                          </label>
                          <input
                            type="text"
                            value={daysCount}
                            className="form-control"
                            readOnly
                            style={{
                              fontSize: "14px",
                              padding: "8px 12px",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                              backgroundColor: "#f8f9fa",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}

                  {/* Apply to section */}
                  <div className="mb-3  d-flex align-items-center">
                    <label
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                        width: "90px",
                        flexShrink: 0,
                      }}
                    >
                      Apply to:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        manager
                          ? `${
                              manager.role.charAt(0).toUpperCase() +
                              manager.role.slice(1)
                            } (${manager.name})`
                          : "No manager assigned"
                      }
                      style={{
                        fontSize: "14px",
                        padding: "8px 12px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        maxWidth: "250px",
                        backgroundColor: "#f8f9fa",
                        textTransform: "capitalize",
                      }}
                    />
                  </div>

                  {/* Reason limit code changes by dip 11-02-2026 */}
                  {/* Reason */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center">
                      <label
                        style={{
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#495057",
                          width: "90px",
                          flexShrink: 0,
                        }}
                      >
                        Reason:
                      </label>
                      <div style={{ flex: 1, position: "relative" }}>
                        <textarea
                          name="reason"
                          value={form.reason}
                          onChange={handleChange}
                          className="form-control"
                          maxLength={REASON_MAX_LENGTH}
                          style={{
                            minHeight: "80px",
                            resize: "vertical",
                            paddingBottom: "24px",
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div
                      className="d-flex justify-content-end"
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        pointerEvents: "none",
                      }}
                    >
                      {form.reason.length}/{REASON_MAX_LENGTH}
                    </div>
                  </div>
                  {/* Reason limit code changes by dip 11-02-2026 */}

                  {/* Buttons */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      // className="btn"
                      // style={{ backgroundColor: "transparent", color: "#3A5FBE", border: "1px solid #3A5FBE", padding: "10px 28px", fontSize: "14px", fontWeight: "500", borderRadius: "4px" }}

                      className="btn btn-sm custom-outline-btn"
                      style={{
                        padding: "10px 32px",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "4px",
                      }}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 32px",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "4px",
                      }}
                      className="btn btn-sm custom-outline-btn"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickApplyLeave;
