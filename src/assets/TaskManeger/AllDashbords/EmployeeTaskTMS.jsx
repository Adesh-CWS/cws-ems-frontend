import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const EmployeeTaskTMS = ({ user }) => {
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const currentUserId = currentUser?._id || user?._id;
  // Mock data - replace with API call
  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`http://localhost:8000/tasks/assigned/${user._id}`)
      .then((res) => {
        const apiTasks = res.data.tasks
          .filter((task) => task.status?.name !== "Assignment Pending") //  Filter out Assignment Pending
          .map((task) => ({
            _id: task._id,
            id: task.taskName,
            taskName: task.taskName,
            taskType: task.typeOfTask,
            assignDate: task.dateOfTaskAssignment,
            dueDate: task.dateOfExpectedCompletion,
            progress: task.progressPercentage,
            statusId: task.status?._id,
            status: task.status?.name || "Unknown",
            description: task.taskDescription,
            // comments: Array.isArray(task.comments) ? task.comments : [],
            documents: task.documents || null,
            comments: Array.isArray(task.comments)
              ? task.comments.map((comment) => ({
                  ...comment,
                  user: comment.user || {
                    _id: user._id,
                    name: user.name,
                    role: user.role,
                  },
                }))
              : [],
            timeTracking: task.timeTracking || null,
          }));

        setAllTasks(apiTasks);
        setFilteredTasks(apiTasks);
        calculateStats(apiTasks);
        // const activeTask = apiTasks.find(
        //   (task) => task.timeTracking && task.timeTracking.isRunning,
        // );
        // if (activeTask) {
        //   setActiveTimer({
        //     taskId: activeTask._id,
        //     startTime: new Date(activeTask.timeTracking.startTime),
        //     totalSeconds: activeTask.timeTracking.totalSeconds || 0,
        //   });
        // }
        const activeTask = apiTasks.find(
  (task) => task.timeTracking?.isRunning
);

if (activeTask) {
  setActiveTimer({
    taskId: activeTask._id,
    startTime: new Date(activeTask.timeTracking.startTime), //  use backend time
    totalSeconds: activeTask.timeTracking.totalSeconds || 0, //  keep old time
  });

  //  instant display
  setTimerSeconds(activeTask.timeTracking.totalSeconds || 0);
}
 //snehal code timer end
      })
      .catch((err) => {
        console.error("Task fetch error:", err.response?.data || err.message);
      });
  }, []);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor(
          (now - new Date(activeTimer.startTime)) / 1000,
        );
        setTimerSeconds(activeTimer.totalSeconds + elapsedSeconds);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedTask, setSelectedTask] = useState(null);
  const [commentModalTask, setCommentModalTask] = useState(null);
  const [newComment, setNewComment] = useState("");

  // Task statistics
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    ongoingTasks: 0,
    delayedTasks: 0,
  });

  // Get unique task types for dropdown
  const uniqueTaskTypes = [
    "All",
    ...new Set(allTasks.map((task) => task.taskType)),
  ];

  const [statusList, setStatusList] = useState([]);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const taskPopupRef = useRef(null); // selectedTask popup
  const commentPopupRef = useRef(null);
  useEffect(() => {
    if (selectedTask && taskPopupRef.current) {
      taskPopupRef.current.focus();
    }
  }, [selectedTask]);

  useEffect(() => {
    if (commentModalTask && commentPopupRef.current) {
      commentPopupRef.current.focus();
    }
  }, [commentModalTask]);

  const trapFocus = (e, ref) => {
    if (!ref?.current) return;

    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await axios.get("http://localhost:8000/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(response.data);
        } else {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setCurrentUser(user);
      }
    };

    fetchCurrentUser();
  }, [user]);

  useEffect(() => {
    fetch("http://localhost:8000/unique")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatusList(data.data);
        }
      })
      .catch((err) => console.error("Status fetch error:", err));
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setUpdatedStatus(selectedTask.statusId); //  ObjectId
    }
  }, [selectedTask]);

  useEffect(() => {
    setFilteredTasks(allTasks);
    calculateStats(allTasks);
  }, [allTasks]);

  // const calculateStats = (taskList) => {
  //   const stats = {
  //     totalTasks: taskList.length,
  //     ongoingTasks: taskList.filter((t) => t.status === "In Progress").length,
  //     delayedTasks: taskList.filter((t) => t.status === "Delayed").length,
  //   };
  //   setTaskStats(stats);
  // };

  const handleStatusUpdate = async () => {
    if (!selectedTask?._id) {
      alert("Task ID missing");
      return;
    }

    try {
      //  STOP TIMER IF TASK IS RUNNING (DIP CODE)
      if (
        activeTimer &&
        activeTimer.taskId === selectedTask._id &&
        updatedStatus !== "In Progress"
      ) {
        await handleStopTimer(selectedTask._id);
      }

      const res = await fetch(
        `http://localhost:8000/task/${selectedTask._id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: updatedStatus }),
        },
      );

      const data = await res.json();

      //  1. Update selected task
      const updatedTask = {
        ...selectedTask,
        statusId: data.task.status._id,
        status: data.task.status.name,
      };
      setSelectedTask(updatedTask);

      //  2. Update ALL TASKS LIST
      const updatedAllTasks = allTasks.map((task) =>
        task._id === selectedTask._id
          ? { ...task, status: data.task.status.name }
          : task,
      );

      setAllTasks(updatedAllTasks);
      setFilteredTasks(updatedAllTasks);

      alert("Status updated successfully");
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  //Dipali code start
  const applyFilters = () => {
    let temp = [...allTasks];

    // Search across ALL fields
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      temp = temp.filter((task) => {
        // Convert entire task object to searchable string
        const effectiveStatus = getEffectiveStatus(task);////komal code
        const searchableFields = [
          task.id,
          task.taskName,
          task.taskType,
          task.status,
          task.progress,
         normalize(effectiveStatus),
          // Format dates
          task.assignDate
            ? new Date(task.assignDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
          task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
          // Comments
          Array.isArray(task.comments)
            ? task.comments.map((c) => c.text || c).join(" ")
            : "",
        ];

        // Join all fields and search
        const searchString = searchableFields
          .filter((field) => field !== null && field !== undefined)
          .join(" ")
          .toLowerCase();

        return searchString.includes(query);
      });
    }

    setFilteredTasks(temp);
    setCurrentPage(1);
  };
  const resetFilters = () => {
    setSearchQuery("");
    setFilteredTasks([...allTasks]);
    setCurrentPage(1);
  };

  //Dipali code end

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredTasks.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleRowClick = (task) => {
    setSelectedTask(task);
  };

  const handleAddComment = (e, task) => {
    e.stopPropagation();
    setCommentModalTask(task);
    setNewComment("");
  };
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    if (!commentModalTask?._id) {
      alert("Task not selected");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `http://localhost:8000/task/${commentModalTask._id}/comment`,
        { comment: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        const updatedTasks = allTasks.map((task) => {
          if (task._id === commentModalTask._id) {
            const taskCopy = { ...task };
            if (!taskCopy.comments) {
              taskCopy.comments = [];
            }
            taskCopy.comments.push({
              _id: res.data.comment?._id,
              text: newComment.trim(),
              createdAt: new Date().toISOString(),
              user: currentUser || user,
            });
            return taskCopy;
          }
          return task;
        });

        setAllTasks(updatedTasks);
        setFilteredTasks(updatedTasks);

        if (selectedTask && selectedTask._id === commentModalTask._id) {
          const selectedCopy = { ...selectedTask };
          if (!selectedCopy.comments) {
            selectedCopy.comments = [];
          }
          selectedCopy.comments.push({
            _id: res.data.comment?._id,
            text: newComment.trim(),
            createdAt: new Date().toISOString(),
            user: currentUser || user,
          });
          setSelectedTask(selectedCopy);
        }

        setNewComment("");
        setCommentModalTask(null);
        alert("Comment added successfully");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert(error?.response?.data?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(
        `http://localhost:8000/task/${taskId}/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedAllTasks = allTasks.map((task) => {
        if (task._id === taskId) {
          return {
            ...task,
            comments: task.comments.filter(
              (comment) => comment._id !== commentId,
            ),
          };
        }
        return task;
      });

      setAllTasks(updatedAllTasks);
      setFilteredTasks(updatedAllTasks);

      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({
          ...selectedTask,
          comments: selectedTask.comments.filter(
            (comment) => comment._id !== commentId,
          ),
        });
      }

      alert("Comment deleted successfully");
    } catch (error) {
      console.error("Delete comment error:", error);
      alert(error?.response?.data?.message || "Failed to delete comment");
    }
  };
  const handleEditComment = async (taskId, commentId, newText) => {
    if (!taskId || !commentId || !newText.trim()) {
      alert("Cannot edit comment");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `http://localhost:8000/task/${taskId}/comment/${commentId}`,
        { comment: newText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        const updatedAllTasks = allTasks.map((task) => {
          if (task._id === taskId) {
            return {
              ...task,
              comments: task.comments.map((comment) =>
                comment._id === commentId
                  ? { ...comment, text: newText.trim() }
                  : comment,
              ),
            };
          }
          return task;
        });

        setAllTasks(updatedAllTasks);
        setFilteredTasks(updatedAllTasks);

        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask({
            ...selectedTask,
            comments: selectedTask.comments.map((comment) =>
              comment._id === commentId
                ? { ...comment, text: newText.trim() }
                : comment,
            ),
          });
        }

        setEditingCommentId(null);
        setEditingCommentText("");
        alert("Comment updated successfully");
      }
    } catch (error) {
      console.error("Edit comment error:", error);
      alert(error?.response?.data?.message || "Failed to edit comment");
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text || comment.comment || "");
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  //  Build status count from BACKEND statuses
  const taskStatusStats = statusList.reduce((acc, statusObj) => {
    acc[statusObj.name] = 0; // initialize with 0
    return acc;
  }, {});

  allTasks.forEach((task) => {
    const statusName = task.status || "Unknown";
    if (taskStatusStats.hasOwnProperty(statusName)) {
      taskStatusStats[statusName] += 1;
    }
  });

  // this function is to find status ID by name(dipali)
  const getStatusIdByName = (statusName) => {
    const status = statusList.find((s) => s.name === statusName);
    return status ? status.id : null;
  };

  //start complete button code(dipali)

  const handleStartTimer = async (taskId) => {
    //dip code...............

    if (activeTimer && activeTimer.taskId !== taskId) {
      alert("Another task timer is already running.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/task/${taskId}/start`,
      );
      if (response.data.success) {
        // setActiveTimer({
        //   taskId: taskId,
        //   startTime: new Date(),
        //   totalSeconds: 0,
        // });
        //snehal code timer start
        const existingTask = allTasks.find((t) => t._id === taskId);
const previousSeconds = existingTask?.timeTracking?.totalSeconds || 0;

setActiveTimer({
  taskId: taskId,
  startTime: new Date(),
  totalSeconds: previousSeconds,
});

setTimerSeconds(previousSeconds); //  prevents 000 flash
 //snehal code timer end
        alert("Task timer started successfully!");
      }
    } catch (error) {
      console.error("Start timer error:", error);
      alert(error.response?.data?.message || "Failed to start timer");
    }
  };

  // const handleStopTimer = async (taskId) => {
  //   try {
  //     const response = await axios.post(
  //       `http://localhost:8000/task/${taskId}/stop`,
  //     );
  //     if (response.data.success) {
  //       setActiveTimer(null);
  //       alert(
  //         `Task timer stopped! Session: ${response.data.currentSession.formatted}\nTotal: ${response.data.totalTime.formatted}`,
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Stop timer error:", error);
  //     alert(error.response?.data?.message || "Failed to stop timer");
  //   }
  // };
//Snehal COde
  const handleStopTimer = async (taskId) => {
  try {
    const response = await axios.post(
      `http://localhost:8000/task/${taskId}/stop`
    );

    if (response.data.success) {
      const newTotalSeconds = response.data.totalTime.totalSeconds; // 👈 MUST come from backend

      // ✅ Update task list immediately
      const updatedTasks = allTasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              timeTracking: {
                ...task.timeTracking,
                isRunning: false,
                totalSeconds: newTotalSeconds,
              },
            }
          : task
      );

      setAllTasks(updatedTasks);
      setFilteredTasks(updatedTasks);

      // ✅ stop active timer
      setActiveTimer(null);

      alert(
        `Task timer stopped!\nSession: ${response.data.currentSession.formatted}\nTotal: ${response.data.totalTime.formatted}`
      );
    }
  } catch (error) {
    console.error("Stop timer error:", error);
    alert(error.response?.data?.message || "Failed to stop timer");
  }
};
//snehal code
  const isTimerRunning = (taskId) => {
    return activeTimer && activeTimer.taskId === taskId;
  };

  const formatTimeClock = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const getTotalTime = (task) => {
    if (isTimerRunning(task._id)) {
      return formatTimeClock(timerSeconds);
    }

    if (!task.timeTracking || !task.timeTracking.totalSeconds) {
      return "00:00:00";
    }
    return formatTimeClock(task.timeTracking.totalSeconds);
  };

  const handleStartTask = async (task) => {
    //dip code start
    if (activeTimer && activeTimer.taskId !== task._id) {
      alert(
        "Please stop the currently running task before starting another one.",
      );
      return;
    }
    //dip code end
    if (task.status === "In Progress" || task.status === "Completed") {
      alert(
        `${
          task.status === "In Progress"
            ? "Task is already started"
            : "Task is already completed"
        }`,
      );
      return;
    }

    const inProgressStatusId = getStatusIdByName("In Progress");
    if (!inProgressStatusId) {
      alert("In Progress status not found");
      return;
    }

    try {
      const statusRes = await fetch(
        `http://localhost:8000/task/${task._id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: inProgressStatusId }),
        },
      );

      if (!statusRes.ok) throw new Error("Failed to update status");
      const data = await statusRes.json();

      await handleStartTimer(task._id);

      const updatedAllTasks = allTasks.map((t) =>
        t._id === task._id
          ? {
              ...t,
              statusId: data.task.status._id,
              status: data.task.status.name,
            }
          : t,
      );

      setAllTasks(updatedAllTasks);
      setFilteredTasks(updatedAllTasks);
    } catch (error) {
      console.error("Start task failed:", error);
      alert("Failed to start task");
    }
  };

  const handleCompleteTask = async (task) => {
    if (task.status === "Completed") {
      alert("Task is already completed");
      return;
    }
    //  task is started before completing
    if (task.status !== "In Progress") {
      alert("Please start the task before marking it as complete");
      return;
    }
    if (isTimerRunning(task._id)) {
      await handleStopTimer(task._id);
    }

    const completedStatusId = getStatusIdByName("Completed");
    if (!completedStatusId) {
      alert("Completed status not found");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/task/${task._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: completedStatusId }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      const updatedAllTasks = allTasks.map((t) =>
        t._id === task._id
          ? {
              ...t,
              statusId: data.task.status._id,
              status: data.task.status.name,
            }
          : t,
      );

      setAllTasks(updatedAllTasks);
      setFilteredTasks(updatedAllTasks);

      alert("Task completed successfully!");
    } catch (error) {
      console.error("Complete task failed:", error);
      alert("Failed to complete task");
    }
  };

  ////dipali code end

  const cardBgColors = {
    "Total Tasks": "#D1ECF1",
    Completed: "#D7F5E4",
    Assigned: "#E8F0FE",
    "In Progress": "#D1E7FF",
    "Assignment Pending": "#E2E3E5",
    Testing: "#FFE493",
    Hold: "#FFF1CC",
    Review: "#E7DDF7",
    Cancelled: "#F8D7DA",
    Delayed: "#FFB3B3",
  };

  // const getStatusColor = (status) => ({
  //   backgroundColor: cardBgColors[status] || "#E9ECEF",
  //   padding: "8px 16px",
  //   borderRadius: "4px",
  //   fontSize: "13px",
  //   fontWeight: "500",
  //   display: "inline-block",
  //   width: "120px",
  //   textAlign: "center",
  //   color: "#3A5FBE",
  // });
  //stat card header count
  // const stats = {
  //   totalTasks: allTasks.length,
  //   completedTasks: allTasks.filter((t) => t.status === "Completed").length,
  //   assignedTasks: allTasks.filter((t) => t.status === "Assigned").length,
  //   ongoingTasks: allTasks.filter((t) => t.status === "In Progress").length,
  //   holdTasks: allTasks.filter((t) => t.status === "On Hold").length,
  //   cancelledTasks: allTasks.filter((t) => t.status === "Cancelled").length,
  //   delayedTasks: allTasks.filter((t) => t.status === "Delayed").length,
  // };

  const isAnyPopupOpen = !!commentModalTask || !!selectedTask;
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
///komal code 31-01-2026
const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .trim();

const getEffectiveStatus = (task) => {
  if (!task?.dueDate) return task.status;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  // ✅ COMPLETED TASK
  if (task.status === "Completed") {
    if (!task.completedAt) return "Completed";

    const completedDate = new Date(task.completedAt);
    completedDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (completedDate - dueDate) / (1000 * 60 * 60 * 24)
    );

    // ❗ Completed late
    if (diffDays > 0) {
      return `Completed (Delayed by ${diffDays} day${diffDays > 1 ? "s" : ""})`;
    }

    // ✅ Completed on time
    return "Completed";
  }

  // 🔄 IN PROGRESS TASK
  if (task.status === "In Progress") {
    if (dueDate < today) {
      return "Delayed (In Progress)";
    }
    return "On Track (In Progress)";
  }

  return task.status; // Assigned, On Hold, Cancelled
};

const calculateStats = (taskList) => {
  const stats = {
    totalTasks: taskList.length,
    ongoingTasks: taskList.filter(
      (t) =>
        getEffectiveStatus(t) === "On Track" ||
        getEffectiveStatus(t) === "Delayed"
    ).length,
    delayedTasks: taskList.filter(
      (t) => getEffectiveStatus(t) === "Delayed"
    ).length,
  };

  setTaskStats(stats);
};

///komal code
  // const onTrackTasks = allTasks.filter(
  //   (t) => getEffectiveStatus(t) === "On Track",
  // ).length;

  // const delayedTasks = allTasks.filter(
  //   (t) => getEffectiveStatus(t) === "Delayed",
  // ).length;

  // const stats = {
  //   totalTasks: allTasks.length,

  //   completedTasks: allTasks.filter((t) => t.status === "Completed").length,

  //   assignedTasks: allTasks.filter((t) => t.status === "Assigned").length,

  //   onTrackTasks,
  //   delayedTasks,

  //   holdTasks: allTasks.filter((t) => t.status === "On Hold").length,

  //   cancelledTasks: allTasks.filter((t) => t.status === "Cancelled").length,

  //   // ✅ In Progress = On Track + Delayed
  //   inProgressTasks: onTrackTasks + delayedTasks,
  // };
  /////rutuja 30-01-2026 document upload code
const getFileType = (file) => {
    if (!file) return null;
  
    if (typeof file === 'string') {
      const clean = file.toLowerCase();
      
      if (clean.includes('/raw/upload/')) return "pdf";
      if (clean.endsWith(".pdf")) return "pdf";
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(clean)) return "image";
      return "other";
    }
  
    if (typeof file === 'object' && file.url) {
      return getFileType(file.url);
    }
  
    return null;
  };


  const getFileName = (doc) => {
    if (!doc) return 'No Document';
    
    if (typeof doc === 'string') {
      if (doc.includes('cloudinary')) {
        const parts = doc.split('/');
        return parts[parts.length - 1] || 'Document';
      }
      
      let fileName = doc;
      if (fileName.includes('/')) {
        fileName = fileName.split('/').pop();
      }
      
      fileName = fileName.split('?')[0];
      
      return fileName || 'Document';
    }
    
    if (typeof doc === 'object' && doc.url) {
      return getFileName(doc.url);
    }
    
    return 'Document';
  };

  const getFileUrl = (doc) => {
    if (!doc) return '#';
    
    if (typeof doc === 'string') {
      if (doc.includes('res.cloudinary.com')) {
        return doc;
      }
      
      if (doc.includes('cloudinary') || doc.includes('/upload/')) {
        // Check if it already has the full URL structure
        if (doc.startsWith('http')) {
          return doc;
        }
        
        // Handle different Cloudinary URL formats
        if (doc.includes('/raw/upload/')) {
          return `https://res.cloudinary.com/dfvumzr0q/raw/upload/${doc}`;
        }
        
        // For images
        return `https://res.cloudinary.com/dfvumzr0q/image/upload/${doc}`;
      }
      
      return '#';
    }
    
    if (typeof doc === 'object' && doc.url) {
      return getFileUrl(doc.url);
    }
    
    return '#';
  };
////komal code

const completedTasks = allTasks.filter((t) =>
  getEffectiveStatus(t).startsWith("Completed")
).length;

const completedDelayedTasks = allTasks.filter((t) =>
  getEffectiveStatus(t).startsWith("Completed (Delayed")
).length;

const onTrackTasks = allTasks.filter((t) =>
  getEffectiveStatus(t).startsWith("On Track")
).length;

const delayedTasks = allTasks.filter((t) =>
  getEffectiveStatus(t).startsWith("Delayed")
).length;

const stats = {
  totalTasks: allTasks.length,

  completedTasks,
  completedDelayedTasks, // ⭐ NEW

  assignedTasks: allTasks.filter((t) => t.status === "Assigned").length,

  onTrackTasks,
  delayedTasks,

  holdTasks: allTasks.filter((t) => t.status === "Hold").length,
  cancelledTasks: allTasks.filter((t) => t.status === "Cancelled").length,

  // In Progress = On Track + Delayed (In Progress)
  inProgressTasks: onTrackTasks + delayedTasks,
};
/////
  /////rutuja 30-01-2026 document upload code
  return (
    <div className="container-fluid">
      <h2 className="mb-3" style={{ color: "#3A5FBE", fontSize: "25px" }}>
        My Tasks
      </h2>

      {/* Stat Cards */}
      {/* Task Status Cards */}
      {/* <div className="row g-3 mb-4">
        
        <div className="col-6 col-md-4 col-lg-3">
          <div
            className="p-3 rounded"
            style={{
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
              border: "1px solid #f0f0f0",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "16px" }}>
              
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                  fontWeight: "bold",
                }}
              >
                {allTasks.length}
              </h4>

              
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Total Tasks
              </p>
            </div>
          </div>
        </div>

       
        {Object.entries(taskStatusStats)
          .filter(([status]) => status !== "Assignment Pending")
          .map(([status, count]) => (
            <div key={status} className="col-6 col-md-4 col-lg-3">
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "16px" }}
                >
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "32px",
                      backgroundColor: cardBgColors[status],
                      minWidth: "70px",
                      minHeight: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      color: "#3A5FBE",
                      fontWeight: "bold",
                    }}
                  >
                    {count}
                  </h4>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "18px", color: "#3A5FBE" }}
                  >
                    {status}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div> */}

      {/* New stat card design */}
      <div className="row g-3 mb-4">
        {/* TOTAL TASKS */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.totalTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Total Tasks
              </p>
            </div>
          </div>
        </div>

        {/* COMPLETED */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D7F5E4",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.completedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Completed Tasks
              </p>
            </div>
          </div>
        </div>

        {/* ASSIGNED */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFE493",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.assignedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Assigned Tasks
              </p>
            </div>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#daffd1",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.onTrackTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                On Track
              </p>
            </div>
          </div>
        </div>

        {/* ON HOLD */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFF1CC",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.holdTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Tasks On Hold
              </p>
            </div>
          </div>
        </div>

        {/* CANCELLED */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#F2C2C2",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.cancelledTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Cancelled Tasks
              </p>
            </div>
          </div>
        </div>

        {/* DELAYED */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFB3B3",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.delayedTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Delayed Tasks
              </p>
            </div>
          </div>
        </div>

        {/* inProgressTasks */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1E7FF",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3A5FBE",
                }}
              >
                {stats.inProgressTasks}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                In Progress Tasks
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* ............. */}

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div
              className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100"
              style={{ maxWidth: "400px" }}
            >
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={applyFilters}
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                {/* <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Task ID
                </th> */}
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Task Name
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Task Type
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Assigned Date
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Due Date
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Progress
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Time Spent
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Actions
                </th>
                <th
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-4"
                    style={{ color: "#212529" }}
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((task, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(task)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                        textTransform: "capitalize",
                      }}
                    >
                      <h6 className="mb-0 fw-normal">{task.id}</h6>
                    </td> */}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                        textTransform: "capitalize",
                      }}
                    >
                      <span className="mb-0 fw-normal">{task.taskName}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                        textTransform: "capitalize",
                      }}
                    >
                      <span className="fw-normal">{task.taskType}</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">
                        {formatDate(task.assignDate)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      <span className="fw-normal">{task.progress}%</span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>{getEffectiveStatus(task)}</span>
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <span
                          className={
                            isTimerRunning(task._id)
                              ? "fw-bold text-success"
                              : ""
                          }
                        >
                          {getTotalTime(task)}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS COLUMN (dipali)*/}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="d-flex gap-1">
                        {/* start button task */}
                        <button
                          className={`btn btn-sm custom-outline-btn ${
                            task.status === "Completed" ||
                            isTimerRunning(task._id)
                              ? "disabled opacity-50"
                              : ""
                          }`}
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            pointerEvents:
                              task.status === "Completed" ||
                              isTimerRunning(task._id)
                                ? "none"
                                : "auto",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task);
                          }}
                          disabled={
                            task.status === "Completed" ||
                            isTimerRunning(task._id)
                          }
                          title={
                            isTimerRunning(task._id)
                              ? "Timer already running"
                              : task.status === "Completed"
                                ? "Task completed"
                                : "Start task & timer"
                          }
                        >
                          Start
                        </button>

                        {/* rutuja code start*/}
                        <button
                          className={`btn btn-sm ${isTimerRunning(task._id) ? "btn-outline-danger" : "btn-outline-warning"}`}
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            width: "70px",
                            textAlign: "center",
                            opacity: task.status !== "In Progress" ? 0.5 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTimerRunning(task._id)) {
                              handleStopTimer(task._id);
                            } else {
                              handleStartTimer(task._id);
                            }
                          }}
                          disabled={task.status !== "In Progress"}
                          title={
                            isTimerRunning(task._id)
                              ? "Click to stop timer"
                              : "Click to restart timer"
                          }
                        >
                          {isTimerRunning(task._id) ? "Stop" : "Restart"}
                        </button>

                        {/* rutuja code end */}

                        {/* comp task button*/}
                        <button
                          className={`btn btn-sm btn-outline-success ${
                            task.status === "Completed" ||
                            task.status !== "In Progress"
                              ? "disabled opacity-50"
                              : ""
                          }`}
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            pointerEvents:
                              task.status === "Completed" ||
                              task.status !== "In Progress"
                                ? "none"
                                : "auto",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTask(task);
                          }}
                          disabled={
                            task.status === "Completed" ||
                            task.status !== "In Progress"
                          }
                          title={
                            task.status === "Completed"
                              ? "Already completed"
                              : task.status !== "In Progress"
                                ? "Please start the task first"
                                : "Complete task"
                          }
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                    {/* action buttons end */}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{
                          fontSize: "12px",
                          padding: "4px 12px",
                          borderRadius: "4px",
                        }}
                        onClick={(e) => handleAddComment(e, task)}
                      >
                        Comment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <span
              style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}
            >
              Rows per page:
            </span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", fontSize: "14px" }}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>

          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {filteredTasks.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${
                  filteredTasks.length
                }`}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring "
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              onMouseDown={(e) => e.preventDefault()}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          ref={taskPopupRef}
          tabIndex="-1"
          onKeyDown={(e) => trapFocus(e, taskPopupRef)}
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
            className="modal-dialog modal-dialog-centered" 
            style={{ maxWidth: "600px", width: "95%"}}
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
                  onClick={() => setSelectedTask(null)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  {/* <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task ID
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.id}
                    </div>
                  </div> */}

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task Name
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.taskName}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Task Type
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.taskType}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Description
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.description}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Assign Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedTask.assignDate)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Due Date
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {formatDate(selectedTask.dueDate)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Progress
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      {selectedTask.progress}%
                    </div>
                  </div>

                  {/* Dip current status code */}
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Current Status
                    </div>
                    <div className="col-7 col-sm-9">
                      <span className=" fw-semibold">
                        {selectedTask?.status}
                      </span>
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Time Spent
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{ color: "#212529" }}
                    >
                      <span>{getTotalTime(selectedTask)}</span>
                      {isTimerRunning(selectedTask._id)}
                    </div>
                  </div>

                  {/* Dipali code of status start*/}
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-3 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div className="col-7 col-sm-9">
                      <select
                        className={`form-select form-select-sm ${
                          selectedTask?.status === "Completed" ? "bg-light" : ""
                        }`}
                        value={updatedStatus}
                        onChange={(e) => setUpdatedStatus(e.target.value)}
                        disabled={selectedTask?.status === "Completed"}
                        style={{
                          width: "100%",
                          maxWidth: "200px",
                          opacity:
                            selectedTask?.status === "Completed" ? 0.6 : 1,
                        }}
                      >
                        <option value="">Select Status</option>
                        {statusList
                          .filter((status) => {
                            const currentStatus = selectedTask?.status;

                            //  COMPLETED tasks - NO changes allowed
                            if (currentStatus === "Completed") return false;

                            //  In Progress - only allow: Complete, Hold, Cancelled
                            if (currentStatus === "In Progress") {
                              return [
                                "Completed",
                                "Hold",
                                "On Hold",
                                "Cancelled",
                              ].includes(status.name);
                            }

                            if (currentStatus === "Assigned") {
                              return ["Hold", "Cancelled"].includes(
                                status.name,
                              );
                            }
                            //  Other statuses - normal workflow
                            return !["Assignment Pending"].includes(
                              status.name,
                            );
                          })
                          .map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                      </select>
                      {/* Show restriction message */}
                      {selectedTask?.status === "Completed" && (
                        <small className="text-success d-block mt-1 fw-semibold">
                          ✅ Task Completed - No status changes allowed
                        </small>
                      )}
                      {selectedTask?.status === "In Progress" && (
                        <small className="text-warning d-block mt-1">
                          ⚠️ Limited options: Complete, Hold, or Cancel only
                        </small>
                      )}
                    </div>
                  </div>
                  {/* Dipali code of status end*/}

                       {/* document upload code rutuja 30-01-2026 */}
                      {selectedTask.documents && (
                        <div className="row mb-3">
                          <div
                            className="col-5 col-sm-3 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Document 
                          </div>
                          <div
                            className="col-7 col-sm-9"
                            style={{ color: "#212529" }}
                          >
                            <div className="d-flex flex-column gap-2">
                              {(() => {
                                const documents = selectedTask.documents;
                                const fileName = getFileName(documents);
                                const fileUrl = getFileUrl(documents);

                                return (
                                  <div className="d-flex align-items-center justify-content-between p-2 border rounded">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-semibold">{fileName}</span>
                                    </div>
                                    
                                    <div className="ms-auto">
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={fileName}
                                        className="btn btn-sm btn-link text-decoration-none"
                                        title="Download"
                                      >
                                        <i className="bi bi-download fs-5"></i>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                  {selectedTask.comments &&
                    selectedTask.comments.length > 0 && (
                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-3 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Comments
                        </div>
                        <div className="col-7 col-sm-9">
                          <div
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                          >
                            {selectedTask.comments.map((comment, index) => {
                              const isCommentCreator =
                                comment.user?._id === currentUserId ||
                                comment.user?._id === user?._id ||
                                comment.userId === currentUserId;

                              const isEditing =
                                editingCommentId === comment._id;

                              const userName =
                                comment.user?.name ||
                                (comment.userId &&
                                currentUser?._id === comment.userId
                                  ? currentUser.name
                                  : null) ||
                                "Unknown";

                              const userRole =
                                comment.user?.role ||
                                (comment.userId &&
                                currentUser?._id === comment.userId
                                  ? currentUser.role
                                  : null) ||
                                "";

                              if (isEditing) {
                                return (
                                  <div
                                    key={comment._id || index}
                                    className="mb-2 p-2 border rounded"
                                  >
                                    <div className="mt-2">
                                      <textarea
                                        className="form-control form-control-sm"
                                        rows="2"
                                        value={editingCommentText}
                                        onChange={(e) =>
                                          setEditingCommentText(e.target.value)
                                        }
                                        maxLength={300}
                                      />
                                      <div className="d-flex justify-content-end gap-2 mt-2">
                                        <button
                                          type="button"
                                          className="btn custom-outline-btn"
                                          onClick={cancelEditing}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          className="btn custom-outline-btn"
                                          onClick={() =>
                                            handleEditComment(
                                              selectedTask._id,
                                              comment._id,
                                              editingCommentText,
                                            )
                                          }
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={comment._id || index}
                                  className="mb-2 p-2 border rounded"
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div>
                                      <strong>
                                        {userName}
                                        {userRole && (
                                          <span
                                            style={{
                                              fontWeight: "normal",
                                              marginLeft: "4px",
                                            }}
                                          >
                                            ({userRole})
                                          </span>
                                        )}
                                      </strong>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <small className="text-muted">
                                        {comment.createdAt
                                          ? new Date(
                                              comment.createdAt,
                                            ).toLocaleDateString("en-GB")
                                          : ""}
                                      </small>
                                      {isCommentCreator && (
                                        <div className="d-flex align-items-center gap-1">
                                          <button
                                            className="btn btn-sm custom-outline-btn p-0"
                                            style={{
                                              width: "20px",
                                              height: "20px",
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingComment(comment);
                                            }}
                                            title="Edit comment"
                                          >
                                            <i className="bi bi-pencil-square"></i>
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger p-0"
                                            style={{
                                              width: "20px",
                                              height: "20px",
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteComment(
                                                selectedTask._id,
                                                comment._id,
                                              );
                                            }}
                                            title="Delete comment"
                                          >
                                            <i className="bi bi-trash3"></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-1">
                                    {comment.text || comment.comment}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                {/* Dipali Code start */}
                <button
                  className={`btn btn-sm custom-outline-btn me-2 ${
                    selectedTask?.status === "Completed" || !updatedStatus
                      ? "disabled opacity-50"
                      : ""
                  }`}
                  onClick={handleStatusUpdate}
                  disabled={
                    selectedTask?.status === "Completed" || !updatedStatus
                  }
                >
                  Update Status
                </button>
                {/* Dipali Code end */}

                <button
                  className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {/* Comment Modal */}
      {commentModalTask && (
        <div
          ref={commentPopupRef}
          tabIndex="-1"
          onKeyDown={(e) => trapFocus(e, commentPopupRef)}
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
            style={{ maxWidth: "500px", width: "95%" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Add Comment</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCommentModalTask(null)}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Task: {commentModalTask.taskName}
                  </label>
                </div>

                <div className="mb-3">
                  <label htmlFor="commentText" className="form-label">
                    Comment
                  </label>
                  <textarea
                    id="commentText"
                    className="form-control"
                    rows="4"
                    maxLength={300}
                    placeholder="Enter your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div
                    className="char-count"
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      fontSize: "12px",
                      color: "#6c757d",
                      marginTop: "4px",
                    }}
                  >
                    {newComment.length}/300
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setCommentModalTask(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={handleSubmitComment}
                >
                  Submit Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default EmployeeTaskTMS;
