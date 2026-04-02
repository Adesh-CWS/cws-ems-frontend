import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeApplyLeave from "./EmployeeApplyLeave";
import EmployeeMyLeave from "./EmployeeMyLeave";

function EmployeeLeaveBalance({ user, fetchNotifications}) {
  const [balance, setBalance] = useState(null);
  const [refresh, setRefresh] = useState(false); // to refresh after approval

  useEffect(() => {
    if (!user?._id) return;
    axios
      .get(`http://localhost:8000/leave/${user._id}`)
      .then((res) => setBalance(res.data))
      .catch((err) => console.error(err));
  }, [user, refresh]);

  if (!balance) return <p>Loading leave balance...</p>;

  return (
    <div className="container-fluid">
      <h2
        className="mb-3"
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
        }}
      >
        Leaves
      </h2>
      {/* <h4>Your Leave Balance</h4> */}

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
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
                {balance.sickLeaveBalance}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Available Sick Leave
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#faccccff",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {balance.casualLeaveBalance}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Available Casual Leave
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
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
                {balance.sickLeaveBalance + balance.casualLeaveBalance}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Total Leaves
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmployeeApplyLeave
        user={user}
        onLeaveApplied={() => setRefresh(!refresh)}
      />
      <EmployeeMyLeave
        user={user}
        refreshKey={refresh}
        onLeaveApproved={() => setRefresh(!refresh)}
        fetchNotifications={fetchNotifications}
      />
    </div>
  );
}

export default EmployeeLeaveBalance;
