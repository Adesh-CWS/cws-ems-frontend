import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Notification.css";

const TaskNotification = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const { role, username, id } = useParams();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await axios.get(
        `https://ems-cws-test.vercel.app/task-notifications/${userId}`,
      );

      const notificationsArray = res.data;

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const recentNotifications = notificationsArray.filter((n) => {
        const createdDate = new Date(n.createdAt);
        return createdDate >= fifteenDaysAgo;
      });

      setNotifications(recentNotifications);
    } catch (error) {
      console.log("Failed to fetch notifications", error);
      setNotifications([]);
    }
  }, [userId]);

  const handleNotificationClick = async (n) => {
    try {
      await axios.put(`https://ems-cws-test.vercel.app/tasknotifications/${n._id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id ? { ...item, isRead: true } : item,
        ),
      );

      //redirect based on type and role
      if (
        n.type === "Task_Assigned" ||
        n.type === "Task_Status_Update" ||
        n.type === "Task_Comment" ||
        n.type === "Task_updated"
      ) {
        if (role === "manager") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/task`);
        } else if (role === "admin") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/task`);
        } else {
          navigate(`/tms-dashboard/${role}/${username}/${id}/task`);
        }
      } else if (
        n.type === "Project_Assigned" ||
        n.type === "Project_update" ||
        n.type === "Project_deleted" ||
        n.type === "Project_Assigned" ||
        n.type === "Project_comment"
      ) {
        if (role === "manager") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        } else if (role === "admin") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        } else {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        }
      } 
      
      else if (n.type === "TaskLog") {
        if (role === "employee") {
          navigate(`/tms-dashboard/employee/${username}/${id}/tasklogs`);
        }else if (role === "Team_Leader") {
          navigate(`/tms-dashboard/Team_Leader/${username}/${id}/tasklogs`);
        } 
      }
      
      else if (n.type === "Team") {
        if (role === "manager") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/teams`);
        } else if (role === "admin") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/teams`);
        } else {
          navigate(`/tms-dashboard/${role}/${username}/${id}/teams`);
        }
      } else if (
        n.type === "Project_created" ||
        n.type === "Project_update" ||
        n.type === "Project_deleted"
      ) {
        if (role === "ceo") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        } else if (role === "hr") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        } else if (role === "md") {
          navigate(`/tms-dashboard/${role}/${username}/${id}/project`);
        }
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId, fetchNotifications]);

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
      <button //-------------------------------------------add
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
            Task Notifications
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
            style={{ minWidth: 90 }}
            className="btn btn-sm custom-outline-btn"
            onClick={() =>
              document.querySelector('[data-bs-toggle="dropdown"]')?.click()
            }
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskNotification;
