import React, { useEffect, useState } from "react";
import TaskCalendar from "./TaskCalendar";
import axios from "axios";
import "./EmployeeDashbordTMS.css";

export default function EmployeeDashbordTMS({ user }) {
  const employeeId = user?._id || "";
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    ongoingTasks: 0,
    delayedTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return;

      try {
        setLoading(true);
        const [tasksRes] = await Promise.all([
          axios.get(`http://localhost:8000/tasks/assigned/${employeeId}`),
        ]);

        if (tasksRes.data.tasks) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = tasksRes.data.tasks.filter((task) => {
            const isCompleted =
              task.status?.name?.toLowerCase() === "completed";
            if (isCompleted) return false;

            const taskStatus = task.status?.name?.toLowerCase();
            const isAssignedOrInProgress =
              taskStatus === "assigned" ||
              taskStatus === "in progress" ||
              taskStatus === "pending";

            if (!isAssignedOrInProgress) return false;

            if (!task.dateOfTaskAssignment) return false;

            const assignedDate = new Date(task.dateOfTaskAssignment);
            assignedDate.setHours(0, 0, 0, 0);

            return assignedDate > today;
          });

          upcoming.sort((a, b) => {
            const dateA = new Date(a.dateOfTaskAssignment);
            const dateB = new Date(b.dateOfTaskAssignment);
            return dateA - dateB;
          });

          setUpcomingTasks(upcoming);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);
  useEffect(() => {
    if (!user?._id) return;

    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:8000/tasks/assigned/${user._id}`,
        );

        const tasks = res.data.tasks || [];
        // Filter out Assignment Pending tasks first
        const activeTasks = tasks.filter(
          (task) => task.status?.name !== "Assignment Pending",
        );

        // Calculate counts
        const stats = {
          totalTasks: activeTasks.length,
          ongoingTasks: tasks.filter((t) => t.status?.name === "In Progress")
            .length,
          delayedTasks: tasks.filter((t) => t.status?.name === "Delayed")
            .length,
          completedTasks: tasks.filter((t) => t.status?.name === "Completed")
            .length,
        };

        setTaskStats(stats);

        //  Filter today's tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasksToday = tasks.filter((task) => {
          const assignDate = new Date(task.dateOfTaskAssignment);
          assignDate.setHours(0, 0, 0, 0);
          return (
            assignDate.getTime() >= today.getTime() &&
            assignDate.getTime() < tomorrow.getTime()
          );
        });

        setTodayTasks(tasksToday);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStats();
  }, [user?._id]);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTaskDate = (dateString) => {
    if (!dateString) return "Soon";
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAssignDate = (dateString) => {
    if (!dateString) return "No assign date";
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const isAnyPopupOpen = !!showTaskModal;
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
    <div className="main-layout" style={{ marginTop: "-25px" }}>
      <div className="left-section">
        {/* Count Boxes */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card shadow-sm h-100 border-0">
              {/* <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}> */}
              <div
                className="card-body d-flex align-items-center flex-wrap flex-sm-nowrap"
                style={{ gap: "16px" }}
              >
                <h4
                  className="mb-0 d-flex align-items-center justify-content-center"
                  style={{
                    fontSize: "32px",
                    minWidth: "70px",
                    minHeight: "70px",
                    flexShrink: 0,

                    backgroundColor: "#D1ECF1",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    color: "#3A5FBE",
                  }}
                >
                  {loading ? "--" : taskStats.totalTasks}
                </h4>
                {/* <p className="mb-0 fw-semibold" style={{ fontSize: "18px", color: "#3A5FBE" }}> */}
                <p
                  className="mb-0 fw-semibold text-center text-sm-start"
                  style={{
                    fontSize: "18px",
                    color: "#3A5FBE",
                    wordBreak: "break-word",
                  }}
                >
                  Total Tasks
                </p>
              </div>
            </div>
          </div>
          {/* <div className="status-box " style={{ backgroundColor: "#e97dcbff", color: "white" }}>
            <span className="status-label"> Total Tasks</span>
           <span className="status-count" style={{ fontSize: "42px"}}>{loading ? "--" : taskStats.totalTasks}</span>
          </div> */}

          {/* ongoing Task */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm h-100 border-0">
              {/* <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}> */}
              <div
                className="card-body d-flex align-items-center flex-wrap flex-sm-nowrap"
                style={{ gap: "16px" }}
              >
                <h4
                  className="mb-0 d-flex align-items-center justify-content-center"
                  style={{
                    fontSize: "32px",
                    minWidth: "70px",
                    minHeight: "70px",
                    flexShrink: 0,

                    backgroundColor: "#FFE493",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    color: "#3A5FBE",
                  }}
                >
                  {loading ? "--" : taskStats.ongoingTasks}
                </h4>
                {/* <p className="mb-0 fw-semibold" style={{ fontSize: "18px", color: "#3A5FBE" }}> */}
                <p
                  className="mb-0 fw-semibold text-center text-sm-start"
                  style={{
                    fontSize: "18px",
                    color: "#3A5FBE",
                    wordBreak: "break-word",
                  }}
                >
                  Ongoing Tasks
                </p>
              </div>
            </div>
          </div>
          {/* <div className="status-box" style={{ backgroundColor: "#5ff081ff", color: "white" }}>
            <span className="status-label">Ongoing Tasks</span>
            <span className="status-count" style={{ fontSize: "42px"}}>{loading ? "--" : taskStats.ongoingTasks}</span>
          </div> */}
          {/* Delayed task */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm h-100 border-0">
              {/* <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}> */}
              <div
                className="card-body d-flex align-items-center flex-wrap flex-sm-nowrap"
                style={{ gap: "16px" }}
              >
                <h4
                  className="mb-0 d-flex align-items-center justify-content-center"
                  style={{
                    fontSize: "32px",
                    minWidth: "70px",
                    minHeight: "70px",
                    flexShrink: 0,
                    backgroundColor: "#FFB3B3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    color: "#3A5FBE",
                  }}
                >
                  {loading ? "--" : taskStats.delayedTasks}
                </h4>
                {/* <p className="mb-0 fw-semibold" style={{ fontSize: "18px", color: "#3A5FBE" }}> */}
                <p
                  className="mb-0 fw-semibold text-center text-sm-start"
                  style={{
                    fontSize: "18px",
                    color: "#3A5FBE",
                    wordBreak: "break-word",
                  }}
                >
                  Delayed Tasks
                </p>
              </div>
            </div>
          </div>

          {/* <div className="status-box" style={{ backgroundColor: "#f76767ff", color: "white" }}>
            <span className="status-label">Delayed Tasks </span>
            <span className="status-count" style={{ fontSize: "42px"}}> {loading ? "--" : taskStats.delayedTasks}</span>
          </div> */}
          {/* Completed task */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm h-100 border-0">
              {/* <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}> */}
              <div
                className="card-body d-flex align-items-center flex-wrap flex-sm-nowrap"
                style={{ gap: "16px" }}
              >
                <h4
                  className="mb-0 d-flex align-items-center justify-content-center"
                  style={{
                    fontSize: "32px",
                    minWidth: "70px",
                    minHeight: "70px",
                    flexShrink: 0,

                    backgroundColor: "#D7F5E4",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    color: "#3A5FBE",
                  }}
                >
                  {loading ? "--" : taskStats.completedTasks}
                </h4>
                {/* <p className="mb-0 fw-semibold" style={{ fontSize: "18px", color: "#3A5FBE" }}> */}
                <p
                  className="mb-0 fw-semibold text-center text-sm-start"
                  style={{
                    fontSize: "18px",
                    color: "#3A5FBE",
                    wordBreak: "break-word",
                  }}
                >
                  Completed Tasks
                </p>
              </div>
            </div>
          </div>

          {/* <div className="status-box" style={{ backgroundColor: "#59e9d1ff", color: "white" }}>
            <span className="status-label">Completed</span>
            <span className="status-count" style={{ fontSize: "42px"}}>{loading ? "--" : taskStats.completedTasks}</span>
          </div> */}
        </div>

        {/* Progress Card */}
       <div
  className="card shadow-sm p-4 border-0"
  style={{
    borderRadius: "12px",
    minHeight: "182px",   
  }}
>

          <div>
            <h4
              style={{
                fontSize: "25px",
                color: "#3A5FBE",
                fontWeight: "500",
                marginBottom: "15px",
              }}
            >
              Task Progress
            </h4>
            <p>
              {loading
                ? "Loading..."
                : taskStats.totalTasks === 0
                  ? "No tasks assigned."
                  : `${taskStats.completedTasks}/${taskStats.totalTasks} Tasks completed.`}
            </p>
            <span className="date">
              {selectedDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Todays task by harshada */}
        <h3
          className="section-title"
          style={{
            fontSize: "25px",
            color: "#3A5FBE",
            fontWeight: "500",
            marginBottom: "15px",
          }}
        >
          Today's Assigned Task
        </h3>

        {/* // <div className="today-task-scroll"> */}

        {/* <div className="today-task-card">
          <span className="task-badge">TASK</span>
          <h5>Task 1</h5>
          <p>Assigned to: Jayashree</p>
          <p>Project: TMS Upgrade</p>
          <div className="task-footer">
            <span>Due: Dec 25, 2025</span>
            <span className="days-left">1 day left</span>
          </div>
       </div>
       <div className="today-task-card">
          <span className="task-badge">TASK</span>
          <h5>Task 2</h5>
          <p>Assigned to: Harshada</p>
          <p>Project: EMS Module</p>
          <div className="task-footer">
            <span>Due: Dec 26, 2025</span>
            <span className="days-left">2 days left</span>
          </div>
        </div>
        <div className="today-task-card">
           <span className="task-badge">TASK</span>
           <h5>Task 3</h5>
           <p>Assigned to: Aadesh</p>
           <p>Project: PMS Upgrade</p>
           <div className="task-footer">
              <span>Due: Dec 26, 2025</span>
              <span className="days-left">2 days left</span>
           </div>
        </div>
        <div className="today-task-card">
           <span className="task-badge">TASK</span>
           <h5>Task 4</h5>
           <p>Assigned to: Snehal</p>
           <p>Project: Attendance</p>
           <div className="task-footer">
              <span>Due: Dec 27, 2025</span>
              <span className="days-left">3 days left</span>
           </div>
        </div>
        <div className="today-task-card">
           <span className="task-badge">TASK</span>
           <h5>Task 5</h5>
           <p>Assigned to: Mandar</p>
           <p>Project: Payroll</p>
           <div className="task-footer">
              <span>Due: Dec 26, 2025</span>
              <span className="days-left">2 days left</span>
           </div>
        </div> */}

        <div className="today-task-scroll">
          {loading ? (
            <p>Loading today’s tasks...</p>
          ) : todayTasks.length === 0 ? (
            <p style={{ color: "#6c757d" }}>No tasks assigned for today.</p>
          ) : (
            todayTasks.map((task) => (
              <div className="today-task-card" key={task._id}>
                <span className="task-badge">TASK</span>

                <h5>{task.taskName}</h5>

                <p>
                  <strong>Project:</strong> {task.projectName || "N/A"}
                </p>

                <p>
                  <strong>Status:</strong> {task.status?.name}
                </p>

                <div className="task-footer">
                  <span>
                    Due: {formatDateDisplay(task.dateOfExpectedCompletion)}
                  </span>

                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{minWidth:"90px"}}
                    onClick={() => handleViewTask(task)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

     <div className="right-section" >
   <div
       className="task-calendar-wrapper"

      style={{ borderRadius: "14px" , marginTop:"-10px",}}
    >
    
        <TaskCalendar employeeId={employeeId} />
    
    </div>
<h3
  style={{
    color: "#3A5FBE",
    fontSize: "25px",
    fontWeight: "500",
    marginTop: "30px",
    textAlign: "left",   
  }}
>
  Upcoming Tasks
</h3>

    <div
  className="card shadow-sm border-0"
  style={{
    borderRadius: "14px",
    marginTop: "14px",
    minHeight: "180px", 
  }}
>


      <div className="card-body text-center">

       <div
        style={{
             maxHeight: "260px",   
              overflowY: "auto",
                 }}
              >

        {loading ? (
          <div className="spinner-border text-primary" />
        ) : upcomingTasks.length === 0 ? (
          <p>No upcoming tasks.</p>
        ) : (
          upcomingTasks.map((task, index) => (
            <div
              key={task._id || index}
              style={{
                border: "1px solid #3A5FBE",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "10px",
                textAlign: "left",
              }}
            >
              <strong>{task.taskName}</strong>
              <p style={{ fontSize: "13px", margin: "6px 0" }}>
                {task.description || "No description"}
              </p>

              <div style={{ fontSize: "12px", color: "#3A5FBE" }}>
                Assigned: {formatAssignDate(task.dateOfTaskAssignment)}
              </div>

              <div className="text-end mt-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => handleViewTask(task)}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>


   

  </div>
      {/* pop-up code */}
      {showTaskModal && selectedTask && (
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
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%", marginTop: "200px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Task Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowTaskModal(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Project
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.projectName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task Name
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.taskName || "N/A"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Description
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.description || "No description available"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task Type
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.typeOfTask}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.status.name}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Assigned Date
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {formatDateDisplay(selectedTask.dateOfTaskAssignment)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Due Date
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {formatDateDisplay(selectedTask.dateOfExpectedCompletion)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Progress
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.progressPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{minWidth:"90px"}}
                  onClick={() => setShowTaskModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
