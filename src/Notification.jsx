import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Notification.css";

function Notification({ userId,notifications, fetchNotifications}) {
  // const [notifications, setNotifications] = useState([]);
  const { role, username, id } = useParams();
  const navigate = useNavigate();

  // const fetchNotifications = useCallback(async () => {
  //   if (!userId) return;

  //   try {
  //     const res = await axios.get(
  //       `https://ems-cws-backend-9wgt.vercel.app/notifications/${userId}`,
  //     );

  //     // Filter last 15 days notifications
  //     const fifteenDaysAgo = new Date();
  //     fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  //     const recentNotifications = res.data.filter((n) => {
  //       const createdDate = new Date(n.createdAt);
  //       return createdDate >= fifteenDaysAgo;
  //     });

  //     setNotifications(recentNotifications);
  //   } catch (err) {
  //     console.error("Failed to fetch notifications", err);
  //   }
  // }, [userId]);

  const handleNotificationClick = async (n) => {
    try {
      // Mark as read in backend
      await axios.put(`https://ems-cws-backend-9wgt.vercel.app/notifications/${n._id}/read`);

      // Update state locally for instant UI feedback
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }

    const isRequestNotification = 
      n.message?.includes("New leave request") || 
      n.message?.includes("leave request from") ||
      n.message?.includes("New regularization request") || 
      n.message?.includes("regularization request from");

    // Redirect based on type and role
    // if (n.type === "Leave") {
    //   if (role === "manager") {
    //     navigate(`/dashboard/${role}/${username}/${id}/manager-core-dashboard`);
    //   } else {
    //     navigate(`/dashboard/${role}/${username}/${id}/leavebalance`);
    //   }
    // } else if (n.type === "Regularization") {
    //   if (role === "manager") {
    //     navigate(`/dashboard/${role}/${username}/${id}/manager-core-dashboard`);
    //   } else {
    //     navigate(`/dashboard/${role}/${username}/${id}/regularization`);
    //   }
    // } 
    //rutuja 28-03-2026
    
    if (n.type === "Leave") {
      if (isRequestNotification) {
        if (role === "manager") {
          navigate(`/dashboard/${role}/${username}/${id}/manager-core-dashboard`);
        } else if (role === "Team_Leader") {
          navigate(`/dashboard/${role}/${username}/${id}/tl-dashboard`);
        }else if (role === "hr") {
          navigate(`/dashboard/${role}/${username}/${id}/hr-leavebalance`);
        } else if ( role === "admin" || role === "ceo" || role === "coo" || role === "md") {
          navigate(`/dashboard/${role}/${username}/${id}/leavebalance`);
        } else {
          navigate(`/dashboard/${role}/${username}/${id}/leavebalance`);
        }
      } else {
        navigate(`/dashboard/${role}/${username}/${id}/leavebalance`);
      }
    } 
    else if (n.type === "Regularization") {
      if (isRequestNotification) {
        if (role === "manager") {
          navigate(`/dashboard/${role}/${username}/${id}/manager-core-dashboard`);
        } else if (role === "Team_Leader") {
          navigate(`/dashboard/${role}/${username}/${id}/tl-dashboard`);
        } else if (role === "hr" || role === "admin" || role === "ceo" || role === "coo" || role === "md") {
          navigate(`/dashboard/${role}/${username}/${id}/regularization`);
        } else {
          navigate(`/dashboard/${role}/${username}/${id}/regularization`);
        }
      } else {
        navigate(`/dashboard/${role}/${username}/${id}/regularization`);
      }
    }
    else if (n.type === "Event") {
      navigate(`/dashboard/${role}/${username}/${id}/AllEventsandHolidays`);
    } else if (n.type === "Attendance") {
      navigate(`/dashboard/${role}/${username}/${id}/employee`);
    } else if (n.type === "Ticket") {
      if (role === "IT_Support") {
        navigate(`/dashboard/${role}/${username}/${id}/ITSupportDashboard`);
      } else {
        navigate(`/dashboard/${role}/${username}/${id}/settings`);
      }
    }
    // rutuja code start
    else if (
      n.type === "Event" ||
      n.type === "Holiday" ||
      n.type === "Announcements" ||
      n.type === "Announcement"
    ) {
      //added by rutuja
      navigate(`/dashboard/${role}/${username}/${id}/AllEventsandHolidays`);
    } else if (n.type === "Attendance") {
      navigate(`/dashboard/${role}/${username}/${id}/employee`);
    }

    //Feedback
    else if (n.type === "Feedback" || n.type === "Feedback Viewed") {
      if (role === "employee" || role === "manager"|| role === "Team_Leader") {
        navigate(`/dashboard/${role}/${username}/${id}/employee-feedback`);
      } else {
        navigate(`/dashboard/${role}/${username}/${id}/feedback`);
      }
    }
    // resignation
    else if (n.type === "Resignation") {
      if (role === "employee") {
        navigate(`/dashboard/${role}/${username}/${id}/employee-resignation`);
      } else if (role === "hr" || role === "admin") {
        navigate(`/dashboard/${role}/${username}/${id}/resignation`);
      } else if (role === "manager") {
        navigate(`/dashboard/${role}/${username}/${id}/Manager-Resignation`);
      }
      else if (role === "Team_Leader") {
        navigate(`/dashboard/${role}/${username}/${id}/TL-Resignation`);
      }
    } else if (n.type === "Interview") {
      if (role === "hr") {
        navigate(`/dashboard/${role}/${username}/${id}/schedule-interview`);
      }
      else if (role === "manager") {
        navigate(`/dashboard/${role}/${username}/${id}/manager/interviews`);
      }
      else {
        navigate(`/dashboard/${role}/${username}/${id}/interviews`);
      }
    }
    // rutuja code end
    // added by shivani
    else if (n.type === "Policy") {
      if (role === "employee" || role === "IT_Support"|| role === "Team_Leader" || role === "manager") {  
        navigate(`/dashboard/${role}/${username}/${id}/employee-policy`);
      } else if (role === "manager" || role === "ceo" || role === "md") {
        navigate(`/dashboard/${role}/${username}/${id}/hr-policy`);
      }
    }
    
    //  Performance Notification
    else if (n.type === "Performance") {
      navigate(
        `/dashboard/${role}/${username}/${id}/performance`
      );
    }
    
    else if (n.type === "Job") {
      navigate(
        `/dashboard/${role}/${username}/${id}/careers`
      );
    }
    
    else if (n.type === "Job Application") {
      navigate(
        `/dashboard/${role}/${username}/${id}/careers`
      );
    }
    // 
    else {
      navigate("/");
    }
  };

  // ✅ Safe useEffect: prevents infinite loop & cleanup on logout
  // useEffect(() => {
  //   if (!userId) return; // stop if userId missing (after logout)

  //   let isMounted = true; // cleanup flag to prevent state update on unmount

  //   const fetchNotifications = async () => {
  //     try {
  //       const res = await axios.get(
  //         `https://ems-cws-backend-9wgt.vercel.app/notifications/${userId}`
  //       );

  //       // Filter last 15 days notifications
  //       const fifteenDaysAgo = new Date();
  //       fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  //       const recentNotifications = res.data.filter((n) => {
  //         const createdDate = new Date(n.createdAt);
  //         return createdDate >= fifteenDaysAgo;
  //       });

  //       if (isMounted) {
  //         setNotifications(recentNotifications);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch notifications", err);
  //     }
  //   };

  //   fetchNotifications();

  //   // ✅ Cleanup on unmount (prevents state update after logout)
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  // ✅ 3. Auto-refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Format "time ago"
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 min ago";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 30) return `${diffInDays} days ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return "1 month ago";
    if (diffInMonths < 12) return `${diffInMonths} months ago`;

    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears === 1) return "1 year ago";
    return `${diffInYears} years ago`;
  };

  return (
    <div className="dropdown">
      <button //-------------------------------------------add full button
        className="btn position-relative focus-ring"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        <i className="bi bi-bell fs-5 text-secondary"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount}
          </span>
        )}
      </button>

      <div className="dropdown-menu dropdown-menu-end shadow notification-dropdown-fullwidth">
        {/* Header */}
        <div className="notification-header">
          <h6 className="mb-0 fw-bold">
            Notifications
            {unreadCount > 0 && (
              <span className="badge bg-primary rounded-pill ms-2">
                {unreadCount}
              </span>
            )}
          </h6>
        </div>

        {/* Scrollable Content */}
        <div className="notification-scroll-wrapper">
          {notifications.length === 0 ? (
            <div className="dropdown-item text-muted">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`dropdown-item ${n.isRead ? "text-muted" : ""}`}
                onClick={() => handleNotificationClick(n)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <strong>{n.type}</strong>: {n.message}
                    {/* ✅ Ticket Notification Extra Info */}
                    {n.type === "Ticket" && n.ticketRef && (
                      <div>
                        <small className="text-muted">
                          Ticket ID: <strong>{n.ticketRef.ticketId}</strong>
                        </small>
                      </div>
                    )}
                    {n.approverName && (
                      <span>
                        {" "}
                        by <strong>{n.approverName}</strong>
                      </span>
                    )}
                    <br />
                    <small className="text-muted">
                      {new Date(n.createdAt).toLocaleDateString("en-GB")}{" "}
                      {new Date(n.createdAt).toLocaleTimeString("en-GB")}
                    </small>
                  </div>
                  <div
                    className="d-flex flex-column align-items-end"
                    style={{ minWidth: "80px" }}
                  >
                    {!n.isRead && (
                      <span className="badge bg-primary ms-2 mb-3">New</span>
                    )}
                    <small
                      className="text-muted text-nowrap"
                      style={{ fontSize: "11px" }}
                    >
                      {formatTimeAgo(n.createdAt)}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="notification-footer">
          <button
            //         className="btn btn-sm"
            //         style={{
            // backgroundColor: "#3A5FBE",
            // color: "white",
            // padding: "10px 32px",
            // borderRadius: "4px",
            // }}
            style={{ minWidth: 90 }}
            className="btn btn-sm custom-outline-btn"
            onClick={() =>
              document.querySelector('[data-bs-toggle="dropdown"]').click()
            }
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Notification;
