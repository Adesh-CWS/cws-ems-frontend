import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./TaskCalendar.css";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

function TaskCalendar({ employeeId }) {
  const [tasks, setTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showNoTaskModal, setShowNoTaskModal] = useState(false);

  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        const [tasksRes] = await Promise.all([
          axios.get(`http://localhost:8000/tasks/assigned/${employeeId}`),
        ]);

        setTasks(tasksRes.data.tasks || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [employeeId]);

  const taskMap = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach((task) => {
    if (task.dateOfExpectedCompletion) {
      const taskDate = new Date(task.dateOfExpectedCompletion);
      taskDate.setHours(0, 0, 0, 0);
      const dateKey = taskDate.toDateString();

      const isCompleted = task.status?.name?.toLowerCase() === "completed";
      const isToday = taskDate.getTime() === today.getTime();
      const isDelayed = taskDate < today && !isCompleted;

      if (isToday || isCompleted || isDelayed) {
        if (!taskMap[dateKey]) {
          taskMap[dateKey] = {
            tasks: [],
            status: "",
            upcomingTasks: [],
          };
        }

        taskMap[dateKey].tasks.push(task);

        if (isToday) {
          taskMap[dateKey].status = "today-task";
        } else if (isCompleted) {
          taskMap[dateKey].status = "completed-task";
        } else if (isDelayed) {
          taskMap[dateKey].status = "delayed-task";
        }
      }
    }

    if (task.dateOfTaskAssignment) {
      const assignmentDate = new Date(task.dateOfTaskAssignment);
      assignmentDate.setHours(0, 0, 0, 0);
      const dateKey = assignmentDate.toDateString();

      const isCompleted = task.status?.name?.toLowerCase() === "completed";
      const isAssignmentToday = assignmentDate.getTime() === today.getTime();
      const isFutureAssignment = assignmentDate > today && !isCompleted;

      if (isAssignmentToday && !isCompleted) {
        if (!taskMap[dateKey]) {
          taskMap[dateKey] = {
            tasks: [],
            status: "",
            upcomingTasks: [],
          };
        }
        taskMap[dateKey].tasks.push(task);
        if (!taskMap[dateKey].status) {
          taskMap[dateKey].status = "today-task";
        }
      } else if (isFutureAssignment) {
        if (!taskMap[dateKey]) {
          taskMap[dateKey] = {
            tasks: [],
            status: "",
            upcomingTasks: [],
          };
        }
        taskMap[dateKey].upcomingTasks.push(task);

        if (!taskMap[dateKey].status) {
          taskMap[dateKey].status = "upcoming-task";
        }
      }
    }
  });

  const getTooltipContent = (date) => {
    const dateKey = date.toDateString();
    const dateTasks = taskMap[dateKey];

    if (
      !dateTasks ||
      (dateTasks.tasks.length === 0 && dateTasks.upcomingTasks.length === 0)
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime()
        ? "Today (No Tasks)"
        : "No tasks";
    }

    const totalTasks = dateTasks.tasks.length + dateTasks.upcomingTasks.length;
    let tooltipText = `${totalTasks} task${totalTasks > 1 ? "s" : ""}`;

    if (dateTasks.status === "today-task") tooltipText += " • Today's Task";
    if (dateTasks.status === "completed-task") tooltipText += " • Completed";
    if (dateTasks.status === "delayed-task") tooltipText += " • Delayed";
    if (dateTasks.status === "upcoming-task") tooltipText += " • Upcoming";

    return tooltipText;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();

    const dateKey = date.toDateString();
    const dateTasks = taskMap[dateKey];

    if (dateTasks) {
      if (dateTasks.status === "today-task") return "today-task-day";
      if (dateTasks.status === "completed-task") return "completed-task-day";
      if (dateTasks.status === "delayed-task") return "delayed-task-day";
      if (dateTasks.status === "upcoming-task") return "upcoming-task-day";
    }

    if (isToday) return "today-day";

    return "";
  };

  const handleDateClick = (date) => {
    const dateKey = date.toDateString();
    const dateTasks = taskMap[dateKey];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();

    if (
      dateTasks &&
      (dateTasks.tasks.length > 0 || dateTasks.upcomingTasks.length > 0)
    ) {
      setSelectedDate(date);
      const allTasks = [...dateTasks.tasks, ...dateTasks.upcomingTasks];
      setSelectedTasks(allTasks);
      setShowNoTaskModal(false);
    } else if (isToday) {
      setSelectedDate(date);
      setSelectedTasks([]);
      setShowNoTaskModal(true);
    }
  };

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;

    const isCurrentMonth =
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear();

    if (!isCurrentMonth) return null;

    const dateKey = date.toDateString();
    const dateTasks = taskMap[dateKey];
    const hasTasks =
      dateTasks &&
      (dateTasks.tasks.length > 0 || dateTasks.upcomingTasks.length > 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();

    const isClickable = hasTasks || isToday;

    return (
      <span
        onClick={() => handleDateClick(date)}
        data-tooltip-id="task-calendar-tip"
        data-tooltip-content={getTooltipContent(date)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          cursor: isClickable ? "pointer" : "default",
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
    .calendar-container .react-calendar .react-calendar__navigation {
      margin-bottom: 0px;
      height: 60px;
    }

    .react-calendar__tile {
      min-height: 5px !important;
      padding: 7px !important;
    }

    .react-calendar__month-view__days__day {
      min-height: 0 !important;
    }
    
    .today-task-day, .completed-task-day, .delayed-task-day, .upcoming-task-day, .today-day {
      cursor: pointer !important;
    }
    
    .today-task-day:hover, .completed-task-day:hover, .delayed-task-day:hover, .upcoming-task-day:hover, .today-day:hover {
      opacity: 0.9;
    }
  `;

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedTasks([]);
    setShowNoTaskModal(false);
  };
  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return {
          backgroundColor: "#d1f2dd",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          color: "#0f5132",
          fontWeight: "500",
        };
      case "In Progress":
        return {
          backgroundColor: "#d1e7ff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          color: "#0d6efd",
          fontWeight: "500",
        };
      case "Delayed":
        return {
          backgroundColor: "#f8d7da",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          color: "#842029",
          fontWeight: "500",
        };
      default:
        return {
          backgroundColor: "#e2e3e5",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          color: "#495057",
          fontWeight: "500",
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isAnyPopupOpen = !!selectedDate;
  useEffect(() => {
    if (isAnyPopupOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyPopupOpen]);
  return (
    <div
      className="card shadow-sm mt-2 border-0 bg-white"
      style={{ borderRadius: "12px", width: "100%", maxHeight: "auto" }}
    >
      <h4
        className="text-center mt-3"
        style={{ color: "#3A5FBE", fontSize: "25px", margin: "0px" }}
      >
        My Task Calendar
      </h4>

      <style>{internalStyles}</style>
      <div className="calendar-container">
        <Calendar
          tileClassName={tileClassName}
          tileContent={tileContent}
          onClickDay={handleDateClick}
          defaultActiveStartDate={
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
          onActiveStartDateChange={({ activeStartDate }) =>
            setCurrentMonth(activeStartDate)
          }
          tileDisabled={tileDisabled}
        />
      </div>

      <Tooltip
        id="task-calendar-tip"
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
        className="d-flex justify-content-center flex-wrap mb-1 mt-1"
        style={{ gap: "15px" }}
      >
        <span>
          <span className="legend-box today-task"></span> Today
        </span>
        <span>
          <span className="legend-box completed"></span> Completed
        </span>
        <span>
          <span className="legend-box delayed"></span> Delayed
        </span>
        <span>
          <span className="legend-box upcoming"></span> Upcoming
        </span>
      </div>

      {/* Pop-up code*/}
      {selectedDate && selectedTasks.length > 0 && (
        <div
          className="modal fade show"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%", marginTop: "100px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Tasks for{" "}
                  {selectedDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              <div className="modal-body">
                {selectedTasks.map((task, index) => {
                  const taskDate = new Date(
                    task.dateOfExpectedCompletion || task.dateOfTaskAssignment,
                  );
                  const isToday =
                    taskDate.toDateString() === today.toDateString();
                  const isCompleted =
                    task.status?.name?.toLowerCase() === "completed";
                  const isDelayed = taskDate < today && !isCompleted;
                  const isUpcoming =
                    task.dateOfTaskAssignment &&
                    new Date(task.dateOfTaskAssignment) > today &&
                    !isCompleted;

                  let statusClass = "";
                  if (isToday) statusClass = "today";
                  if (isCompleted) statusClass = "completed";
                  if (isDelayed) statusClass = "delayed";
                  if (isUpcoming) statusClass = "upcoming";

                  return (
                    <div key={index} className="container-fluid mb-3">
                      <div className="row p-3 rounded ">
                        <div className="row mb-2">
                          <div
                            className="col-4 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Task Name
                          </div>
                          <div className="col-8" style={{ color: "#212529" }}>
                            {task.taskName}
                          </div>
                        </div>

                        {task.projectName?.name && (
                          <div className="row mb-2">
                            <div
                              className="col-4 fw-semibold"
                              style={{ color: "#212529" }}
                            >
                              Project
                            </div>
                            <div className="col-8" style={{ color: "#212529" }}>
                              {task.projectName.name}
                            </div>
                          </div>
                        )}

                        {task.status?.name && (
                          <div className="row mb-2">
                            <div
                              className="col-4 fw-semibold"
                              style={{ color: "#212529" }}
                            >
                              Status
                            </div>
                            <div className="col-8" style={{ color: "#212529" }}>
                              <span >
                                {task.status.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {task.progressPercentage !== undefined && (
                          <div className="row mb-2">
                            <div
                              className="col-4 fw-semibold"
                              style={{ color: "#212529" }}
                            >
                              Progress
                            </div>
                            <div className="col-8" style={{ color: "#212529" }}>
                              <span className="progress-percentage">
                                {task.progressPercentage}%
                              </span>
                            </div>
                          </div>
                        )}

                        {task.dateOfExpectedCompletion && (
                          <div className="row mb-2">
                            <div
                              className="col-4 fw-semibold"
                              style={{ color: "#212529" }}
                            >
                              Due Date
                            </div>
                            <div className="col-8" style={{ color: "#212529" }}>
                              {formatDate(task.dateOfExpectedCompletion)}
                            </div>
                          </div>
                        )}

                        {task.dateOfTaskAssignment && (
                          <div className="row mb-2">
                            <div
                              className="col-4 fw-semibold"
                              style={{ color: "#212529" }}
                            >
                              Assigned Date
                            </div>
                            <div className="col-8" style={{ color: "#212529" }}>
                              {formatDate(task.dateOfTaskAssignment)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* if no task for today*/}
      {/* if no task for today*/}
      {/* //snehal added code 28-01-2023  */}
    
                      {showNoTaskModal && selectedDate && (
                 <div className="modal fade show"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.5)",
                      position: "fixed",
                      inset: 0,
                      zIndex: 1050,
                    }}
                    onClick={closeModal}
                  >
                   
                     <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%", marginTop: "100px" }}
            onClick={(e) => e.stopPropagation()}
          >
                     
                       <div className="modal-content">
        {/* HEADER */}
        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title mb-0">
                         {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeModal}
          />
        </div>

                      {/* BODY */}
                      <div className="modal-body text-center py-5">
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            margin: "0 auto 15px",
                            borderRadius: "12px",
                            border: "2px solid #3A5FBE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "26px", color: "#edf0f7" }}>✔</span>
                        </div>

                        <h4 style={{ color: "#3A5FBE", marginBottom: "8px" }}>No Tasks</h4>
                        <p style={{ color: "#6c757d", margin: 0 }}>
                          You have no tasks assigned for this date.
                        </p>
                      </div>

                      {/* FOOTER */}
                      
                      <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
                      </div>
                    </div>
                  </div>
                )}
         {/* //snehal added code 28-01-2023  */}
    </div>
  );
}

export default TaskCalendar;
