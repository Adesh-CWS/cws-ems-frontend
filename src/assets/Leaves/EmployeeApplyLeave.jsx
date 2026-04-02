import React, { useState, useEffect } from "react";
import axios from "axios";

function EmployeeApplyLeave({ user, onLeaveApplied }) {
  const [form, setForm] = useState({
    leaveType: "SL",
    dateFrom: "",
    dateTo: "",
    duration: "full",
    reason: "",
  });
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [manager, setManager] = useState(null);
  const [weeklyOffs, setWeeklyOffs] = useState({});
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [daysCount, setDaysCount] = useState(0);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `https://ems-cws-backend-9wgt.vercel.app/admin/weeklyoff/${new Date().getFullYear()}`,
        );
        const weeklyData = res.data?.data || res.data || {};
        const saturdayOffs = weeklyData.saturdays || [];
        const sundayOff = true; // All Sundays are off
        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff });
        console.log("✅ Weekly offs fetched:", { saturdays: saturdayOffs, sundayOff });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [1, 3, 5], sundayOff: true }); // Fallback
        console.log("🔄 Using fallback weekly offs:", { saturdays: [1, 3, 5], sundayOff: true });
      }
    };
    fetchWeeklyOffs();
  }, []);

  useEffect(() => {
    console.log("🔍 useEffect for holidays triggered"); // Confirms it runs
    const fetchPublicHolidays = async () => {
      console.log("🔍 Starting holiday fetch");
      setLoadingHolidays(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No auth token found");

        const res = await axios.get('https://ems-cws-backend-9wgt.vercel.app/getHolidays', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        console.log("🔍 Response status:", res.status);
        console.log("🔍 Response data:", res.data);

        if (!Array.isArray(res.data)) {
          throw new Error("Response is not an array");
        }

        const holidays = res.data.map(h => {
          const d = new Date(h.date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        });

        setPublicHolidays(holidays);
        console.log("✅ Holidays loaded in React:", holidays);
        console.log("✅ Total holidays:", holidays.length);
      } catch (err) {
        console.error("❌ Holiday fetch failed:", err.message);
        console.error("Full error:", err);
        setPublicHolidays([]);
        alert(`Failed to load holidays: ${err.message}`);
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchPublicHolidays();
  }, []);

  useEffect(() => {
    const fetchTeamLeaders = async () => {
      if (!user?._id) {
        console.log("user not found");
        return;
      }
      
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `https://ems-cws-backend-9wgt.vercel.app/employee/${user._id}/team-leader`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (Array.isArray(response.data)) {
          setTeamLeaders(response.data);
        } else {
          setTeamLeaders([]);
        }
      } catch (err) {
        console.error("Error fetching team leaders:", err.response?.data || err.message);
        setTeamLeaders([]);
      }
    };
    
    fetchTeamLeaders();
  }, [user]);

  useEffect(() => {
    const fetchManager = async () => {
      if (!user?.reportingManager || !/^[0-9a-fA-F]{24}$/.test(user.reportingManager)) {
        // ✅ Skip if ID is invalid or missing
        console.warn("Invalid or missing reportingManager ID:", user?.reportingManager);
        setManager({ name: "No manager assigned", role: "Unknown", _id: null });
        return;
      }
      try {
        // ✅ Confirm this URL matches your backend (e.g., change to /api/users if needed)
        const res = await axios.get(`https://ems-cws-backend-9wgt.vercel.app/users/${user.reportingManager}`);
        setManager(res.data); // Process response
      } catch (err) {
        // ✅ Handle 404 specifically (user not found)
        if (err.response?.status === 404) {
          console.warn(`Manager not found for ID ${user.reportingManager} (404)`);
          setManager({ name: "No manager assigned", role: "Unknown", _id: null });
        } else {
          // For other errors (e.g., 500, network issues)
          console.error("Error fetching manager:", err.message);
          setManager({ name: "Unknown User", role: "Unknown", _id: null });
        }
      }
    };
    fetchManager();
  }, [user]);

  useEffect(() => {
    if (!showModal) return;
    const now = new Date();
    const doj = new Date(user.doj);
    const probationEnd = new Date(doj);
    probationEnd.setMonth(probationEnd.getMonth() + user.probationMonths);
    if (now < probationEnd) {
      setForm((prev) => ({ ...prev, leaveType: "LWP" }));
      setAvailableLeaveTypes(["LWP"]);
    } else {
      setAvailableLeaveTypes(["SL", "CL", "LWP"]);
      setForm((prev) => ({ ...prev, leaveType: "SL" }));
    }
  }, [showModal, user]);

  useEffect(() => {
    const fetchDays = async () => {
      if (!form.dateFrom || !form.dateTo) {
        setDaysCount(0);
        return;
      }

      try {
        const res = await axios.post(
          "https://ems-cws-backend-9wgt.vercel.app/leave/calculate",
          {
            dateFrom: form.dateFrom,
            dateTo: form.dateTo,
            duration: form.duration,
          }
        );

        setDaysCount(res.data.totalDays || 0);
      } catch (err) {
        console.error("Error calculating leave days:", err);
        setDaysCount(0);
      }
    };

    fetchDays();
  }, [form.dateFrom, form.dateTo, form.duration]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "half" : "full") : value,
    }));
  };

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);
  const maxDate = futureDate.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dateFromParsed = parseDate(form.dateFrom);
    const dateToParsed = parseDate(form.dateTo);
    const fromDate = new Date(dateFromParsed);
    const toDate = new Date(dateToParsed);
    const min = new Date(minDate);
    const max = new Date(maxDate);

    if (!form.reason || !dateFromParsed || !dateToParsed) {
      setMessage("Please fill all required fields");
      return;
    }
    if (fromDate < min) {
      setMessage("From date cannot be before today.");
      return;
    }
    if (toDate > max) {
      setMessage("To date cannot be beyond next 2 months.");
      return;
    }
    if (toDate < fromDate) {
      setMessage("⚠️ Invalid date range: 'To Date' cannot precede 'From Date'.");
      return;
    }

    // 🔄 UPDATED: Check the entire date range for off days (not just from/to)
    if (isOffDay(fromDate) || isOffDay(toDate)) {
      let message = "❌ Cannot apply leave on off days.";
      const offDate = isOffDay(fromDate) ? fromDate : toDate; // Identify which date is off
      if (isHoliday(offDate)) {
        message = "❌ Cannot apply leave on holidays.";
      } else if (isSunday(offDate)) {
        message = "❌ Cannot apply leave on Sundays.";
      } else if (isNthSaturday(offDate)) {
        message = "❌ Cannot apply leave on weekly off Saturdays.";
      }
      alert(message);
      return;
    }

    try {
      const existingLeavesRes = await axios.get(`https://ems-cws-backend-9wgt.vercel.app/leave/my/${user._id}`);
      const existingLeaves = existingLeavesRes.data || [];
      const isOverlapping = existingLeaves.some((leave) => {
        const leaveFrom = new Date(leave.dateFrom);
        const leaveTo = new Date(leave.dateTo);
        leaveFrom.setHours(0, 0, 0, 0);
        leaveTo.setHours(23, 59, 59, 999);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        return fromDate <= leaveTo && toDate >= leaveFrom && leave.status !== "rejected";
      });
      if (isOverlapping) {
        setMessage("⚠️ You already applied for leave on one or more of these dates.");
        alert("⚠️ You already applied for leave on one or more of these dates.");
        return;
      }

      await axios.post("https://ems-cws-backend-9wgt.vercel.app/leave/apply", {
        employeeId: user._id,
        leaveType: form.leaveType,
        dateFrom: dateFromParsed,
        dateTo: dateToParsed,
        duration: form.duration,
        reason: form.reason,
        reportingManagerId: manager?._id || null,
      });

      alert("Leave applied successfully! Waiting for approval.");
      if (typeof onLeaveApplied === "function") onLeaveApplied();
      setForm({ leaveType: availableLeaveTypes[0], dateFrom: "", dateTo: "", duration: "full", reason: "" });
      setShowModal(false);
      setDaysCount(0);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error applying leave");
      alert(err.response?.data?.error || "Error applying leave");
    }
  };

  // Helper functions
  const parseDate = (dateStr) => {
    console.log("Parsing date:", dateStr);
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return null;
  };

  const isHoliday = (d) => {
    const isHol = publicHolidays.includes(d.toISOString().split('T')[0]);
    if (isHol) console.log(`📅 ${d.toISOString().split('T')[0]} is a holiday`);
    return isHol;
  };

  const isSunday = (d) => {
    const isSun = d.getDay() === 0 && weeklyOffs.sundayOff;
    if (isSun) console.log(`☀️ ${d.toISOString().split('T')[0]} is Sunday (off)`);
    return isSun;
  };

  const isNthSaturday = (d) => {
    if (d.getDay() !== 6) return false;
    const nth = Math.ceil(d.getDate() / 7);
    const isNthSat = weeklyOffs.saturdays.includes(nth);
    if (isNthSat) console.log(`🕒 ${d.toISOString().split('T')[0]} is ${nth}th Saturday (off)`);
    return isNthSat;
  };

  const isOffDay = (d) => {
    const off = isSunday(d) || isNthSaturday(d) || isHoliday(d);
    if (off) console.log(`🚫 ${d.toISOString().split('T')[0]} is off day`);
    return off;
  };

  const getApplyToValue = () => {
    if (user?.role === "employee" && teamLeaders.length > 0) {
      return teamLeaders.map(tl => tl.name).join(", ");
    }
    if (user?.role === "employee") {
      return "No team leader assigned";
    }
    if (manager && manager._id) {
      return `${manager.role.charAt(0).toUpperCase() + manager.role.slice(1)} (${manager.name})`;
    }
    return "No approver assigned";
  };

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
  return (
    <>
      <button
        className="btn btn-sm custom-outline-btn me-2"
        // style={{
        //   whiteSpace: "nowrap",
        //   height: "31px",
        //   display: "flex",
        //   alignItems: "center",
        //   justifyContent: "center",
        // }}
        onClick={() => setShowModal(true)}
      >
        Apply Leave
      </button>
      <style>{`
        .modal-body .btn:focus {
          outline: none;
        }

        .modal-body .btn:focus-visible {
          outline: 3px solid #3A5FBE;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
          transform: scale(1.02);
          transition: all 0.2s ease;
        }

        .modal-body button[type="submit"]:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
          filter: brightness(1.1);
        }

        .modal-body button[type="button"]:focus-visible {
          outline: 3px solid #3A5FBE;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
          background-color: rgba(58, 95, 190, 0.05);
        }

        .modal-body input:focus-visible {
          outline: 2px solid #3A5FBE;
          outline-offset: 2px;
          border-color: #3A5FBE;
          box-shadow: 0 0 0 3px rgba(58, 95, 190, 0.15);
        }
      `}</style>

      {showModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered" 
            style={{ maxWidth: "600px", width: "95%"}}
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
                  onClick={() => {
                    setShowModal(false);
                    setForm({
                      leaveType: "SL",
                      dateFrom: "",
                      dateTo: "",
                      duration: "full",
                      reason: "",
                    });
                    setMessage("");
                    setDaysCount(0);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ paddingTop: "24px" }}>
                {/* {message && <div className="alert alert-info">{message}</div>} */}
                <form onSubmit={handleSubmit}>
                  {/* Leave Type */}
                  <div className="mb-3  d-flex align-items-center">
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
                    {/* NEW: Fixed width for all labels */}
                    <div className="d-flex gap-4">
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
                      <div className="form-check">
                        {availableLeaveTypes.includes("LWP") && (
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="leaveType"
                              value="LWP"
                              checked={form.leaveType === "LWP"}
                              onChange={handleChange}
                              style={{
                                width: "20px",
                                height: "20px",
                                accentColor: "#2E4A8B",
                              }}
                            />
                            <label
                              className="form-check-label"
                              style={{ fontSize: "14px", marginLeft: "8px" }}
                            >
                              Leave Without Pay
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Half Day */}
                  <div className="mb-3 d-flex align-items-center">
                    <label
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                        width: "90px",
                        flexShrink: 0,
                      }}
                    >
                      Half day:
                    </label>{" "}
                    {/* NEW: Fixed width */}{" "}
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
                  </div>
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
                          min={minDate} // cannot select past date
                          max={maxDate} // cannot select beyond next 2 months
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
                          min={minDate} // cannot select past date
                          max={maxDate} // cannot select beyond next 2 months
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
                          <label>No of Days: {loadingHolidays ? "Loading..." : daysCount}</label>
                          {/* <span>{daysCount}</span> */}

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
                      value={getApplyToValue()}
                      // value={
                      //   manager
                      //     ? `${manager.role.charAt(0).toUpperCase() +
                      //     manager.role.slice(1)
                      //     } (${manager.name})`
                      //     : "No manager assigned"
                      // }
                      style={{
                        fontSize: "14px",
                        padding: "8px 12px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        maxWidth: "250px",
                        backgroundColor: "#f8f9fa",
                        textTransform: "capitalize",
                        flex: 1 /* Keep flex: 1 */,
                      }}
                    />
                  </div>

                  {/* Reason */}
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
                      Reason:
                    </label>
                    <textarea
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      className="form-control"
                      style={{
                        flex: 1,
                        minHeight: "80px" /* ADDED: Set minimum height */,
                        resize:
                          "vertical" /* ADDED: Allow vertical resize only */,
                      }}
                      required
                    />
                  </div>

                  {/* Buttons */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                      onClick={() => {
                        setShowModal(false);
                        setForm({
                          leaveType: "SL",
                          dateFrom: "",
                          dateTo: "",
                          duration: "full",
                          reason: "",
                        });
                        setMessage("");
                        setDaysCount(0);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}

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
    </>
  );
}

export default EmployeeApplyLeave;
