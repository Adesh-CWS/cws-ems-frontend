import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";

function isWeeklyOff(date, weeklyOffs = { saturdays: [], sundayOff: true }) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  const saturdays = weeklyOffs.saturdays || [];
  const sundayOff = weeklyOffs.sundayOff ?? true;

  // Sunday
  if (day === 0 && sundayOff) {
    return "Sunday";
  }

  // Saturday (from backend config)
  if (day === 6 && saturdays.length) {
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    if (saturdays.includes(weekOfMonth)) {
      return `${weekOfMonth} Saturday`;
    }
  }

  return null;
}

const TLTaskTMS = ({ role }) => {
  const userRole = role || localStorage.getItem("role");
  const [department, setDepartment] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [taskType, setTaskType] = useState([]);
  const [project, setProject] = useState([]); // For dropdown - project names
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [assignDateFromFilter, setAssignDateFromFilter] = useState("");
  const [assignDateToFilter, setAssignDateToFilter] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  
  const uniqueProjects = [
    "All",
    ...new Set(allTasks.map((task) => task.projectName)),
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedTask, setSelectedTask] = useState(null);
  const [uniqueStatus, setUniqueStatus] = useState([]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskErrors, setTaskErrors] = useState({});
  const [projectEmployees, setProjectEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMode, setPopupMode] = useState("view"); // view | edit
  const [searchInput, setSearchInput] = useState("");
  const [commentModalTask, setCommentModalTask] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [taskComments, setTaskComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [existingTaskNames, setExistingTaskNames] = useState([]);
  const [activeTimers, setActiveTimers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [teamLeadProjects, setTeamLeadProjects] = useState([]); 
  
  const currentUserId =
    currentUser?._id || JSON.parse(localStorage.getItem("activeUser"))?._id;

  const viewEditRef = useRef(null);
  const commentRef = useRef(null);
  const addTaskRef = useRef(null);

  const useFocusTrap = (ref, active) => {
    useEffect(() => {
      if (!active || !ref.current) return;
  
      const container = ref.current;
      
      const previouslyFocused = document.activeElement;
      
      container.focus();
  
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
  
  
      const handleKeyDown = (e) => {
        if (e.key !== "Tab" || focusable.length === 0) return;
  
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === container) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || document.activeElement === container) {
            e.preventDefault();
            first.focus();
          }
        }
      };
  
      const handleFocusOut = (e) => {
        if (!container.contains(e.relatedTarget)) {
          container.focus();
        }
      };
  
      container.addEventListener("keydown", handleKeyDown);
      container.addEventListener("focusout", handleFocusOut);
  
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
        container.removeEventListener("focusout", handleFocusOut);
        if (previouslyFocused && previouslyFocused.focus) {
          previouslyFocused.focus();
        }
      };
    }, [active, ref]);
  };  
  useFocusTrap(viewEditRef, !!selectedTask);
  useFocusTrap(commentRef, !!commentModalTask);
  useFocusTrap(addTaskRef, showAddTask);

  //New Task form
  const [newTask, setNewTask] = useState({
    taskName: "",
    projectName: "",
    assignedTo: "",
    department: "",
    taskDescription: "",
    typeOfTask: "Bug",
    dateOfTaskAssignment: "",
    dateOfExpectedCompletion: "",
    progressPercentage: "0",
    estimatedHours: "",
    comments: "",
    status: "",
  });

  const formatTimeClock = (totalSeconds) => {
    if (!totalSeconds) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const updatedTimers = { ...timerSeconds };
      let hasChanges = false;

      Object.keys(activeTimers).forEach((taskId) => {
        const timer = activeTimers[taskId];
        if (timer) {
          const elapsedSeconds = Math.floor(
            (now - new Date(timer.startTime)) / 1000,
          );
          const newSeconds = timer.totalSeconds + elapsedSeconds;

          if (updatedTimers[taskId] !== newSeconds) {
            updatedTimers[taskId] = newSeconds;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setTimerSeconds(updatedTimers);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers, timerSeconds]);

  const fetchTaskComments = async (taskId) => {
    setCommentLoading(true);
    try {
      const response = await axios.get(
        `https://ems-cws-test.vercel.app/task/${taskId}/comments`,
      );
      setTaskComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddCommentClick = (e, task) => {
    e.stopPropagation();
    setCommentModalTask(task);
    setNewComment("");
    fetchTaskComments(task._id);
  };

  const handleSubmitComment = async () => {
    if (isCommentSubmitting) return;
    setIsCommentSubmitting(true);
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
        `https://ems-cws-test.vercel.app/task/${commentModalTask._id}/comment`,
        { comment: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        await fetchTaskComments(commentModalTask._id);
        setNewComment("");
        alert("Comment added successfully");
        setCommentModalTask(null);
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert(error?.response?.data?.message || "Failed to add comment");
    }
    finally {
      setIsCommentSubmitting(false); 
    }
  };

  const handleDeleteComment = async (commentId, taskId) => {
    if (!commentId || !taskId) {
      alert("Cannot delete comment: Missing ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(
        `https://ems-cws-test.vercel.app/task/${taskId}/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        await fetchTaskComments(taskId);
        alert("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      alert(error?.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleEditComment = async (commentId, taskId, newText) => {
    if (!commentId || !taskId || !newText.trim()) {
      alert("Cannot edit comment");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `https://ems-cws-test.vercel.app/task/${taskId}/comment/${commentId}`,
        { comment: newText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        await fetchTaskComments(taskId);
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
    setEditingCommentText(comment.comment || comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const normalizeDepartment = (value) => {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();

    if (v.startsWith("it")) return "IT";
    if (v.includes("finance")) return "Finance";
    if (v.includes("qa") || v.includes("test")) return "QA";
    if (v.includes("ui")) return "UI/UX";

    return value.trim();
  };
  
  async function fetchUser() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("https://ems-cws-test.vercel.app/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const response = await axios.get("https://ems-cws-test.vercel.app/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchTeamLeaderProjects = async (teamLeadId) => {
    try {
      const response = await axios.get(`https://ems-cws-test.vercel.app/${teamLeadId}/projects`);
      
      if (response.data.success) {
        const projectNames = response.data.projects.map(p => p.project.name);
        setTeamLeadProjects(response.data.projects);
        setProject(projectNames);
        console.log("Team Leader Projects:", response.data.projects);
      }
    } catch (error) {
      console.error("Error fetching team leader projects:", error);
      setError("Failed to fetch your assigned projects");
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const user = await fetchUser();
      const teamLeadId = user._id;

      await fetchTeamLeaderProjects(teamLeadId);

      const res = await axios.get(`https://ems-cws-test.vercel.app/tasks/${teamLeadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const processedTasks = (res.data.tasks || []).map((task) => ({
        ...task,
        time: task.timeTracking
          ? formatTimeClock(task.timeTracking.totalSeconds || 0)
          : "00:00:00",
      }));

      setAllTasks(processedTasks);
      console.log("all tasks", processedTasks);

      const newActiveTimers = {};
      processedTasks.forEach((task) => {
        if (
          task.status?.name === "In Progress" &&
          task.timeTracking?.isRunning &&
          task.timeTracking?.startTime
        ) {
          const startTime = new Date(task.timeTracking.startTime);
          const now = new Date();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const totalSeconds =
            (task.timeTracking.totalSeconds || 0) + elapsedSeconds;

          newActiveTimers[task._id] = {
            startTime: startTime,
            totalSeconds: task.timeTracking.totalSeconds || 0,
          };

          setTimerSeconds((prev) => ({
            ...prev,
            [task._id]: totalSeconds,
          }));
        }
      });

      setActiveTimers(newActiveTimers);
      console.log("all tasks", res.data.tasks);
    } catch (error) {
      const errData = error.response?.data || {};
      console.error("ERROR FETCHING TASKS:", errData);
      alert(JSON.stringify(errData, null, 2) || "Failed to load tasks");
    }
  };

  useEffect(() => {
    if (allTasks.length > 0) {
      const names = allTasks.map((task) => task.taskName?.trim().toLowerCase());
      setExistingTaskNames(names);
    }
  }, [allTasks]);

  const checkTaskName = (taskName, currentTaskId = null) => {
    if (!taskName?.trim()) return { available: false, message: "" };

    const name = taskName.trim().toLowerCase();
    const tasksToCheck = currentTaskId
      ? allTasks.filter((t) => t._id !== currentTaskId)
      : allTasks;

    const existingNames = tasksToCheck
      .map((t) => t.taskName?.trim().toLowerCase())
      .filter((n) => n);

    const isDuplicate = existingNames.includes(name);

    return {
      available: !isDuplicate,
      message: isDuplicate ? "Task name already exists." : "",
    };
  };

  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`https://ems-cws-test.vercel.app/unique`);
      if (res.data.success) {
        const normalized = res.data.data.map(s => ({
          _id: s._id || s.id,
          name: s.name,
        }));
        setUniqueStatus(normalized);
      }
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    }
  };

  const fetchEmployeesForProject = async (projectName) => {
    if (!projectName) {
      setProjectEmployees([]);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      
      const projectsRes = await axios.get("https://ems-cws-test.vercel.app/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allProjects = projectsRes.data || [];
      const selectedProject = allProjects.find((p) => p.name === projectName);

      if (selectedProject && selectedProject._id) {
        const empRes = await axios.get(
          `https://ems-cws-test.vercel.app/projects/employees/${selectedProject._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (empRes.data.success) {
          setProjectEmployees(empRes.data.data || []);
        } else {
          setProjectEmployees([]);
        }
      } else {
        setProjectEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching project employees:", error);
      setProjectEmployees([]);
    }
  };

  useEffect(() => {
    if (newTask.projectName && showAddTask) {
      fetchEmployeesForProject(newTask.projectName);
    } else {
      setProjectEmployees([]);
    }
  }, [newTask.projectName, showAddTask]);

  const statusCounts = allTasks.reduce((acc, task) => {
    const statusName = task.status?.name || "Unknown";
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {});
  console.log("status", statusCounts);
  console.log("alltasks", allTasks);

  function handleFileChange(e) {
    const file = e.target.files[0];
    setDocumentFile(file || null);
  }
  
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
    };

    if (commentModalTask) {
      // Lock scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      // Block wheel & touch scroll
      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";

      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [commentModalTask]);
  
  useEffect(() => {
    const fetchAddTaskRequiredDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        console.log("token is " + token);
        const user = await fetchUser();
        const teamLeadId = user._id;
        
        const res = await axios.get("https://ems-cws-test.vercel.app/getAllDepartments");
        const empRes = await axios.get(
          `https://ems-cws-test.vercel.app/employees/manager/${teamLeadId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const taskTypeRes = await axios.get(
          `https://ems-cws-test.vercel.app/api/task-types/unique-names`,
        );
        
        await fetchTeamLeaderProjects(teamLeadId);
        
        const departments = res.data.departments;
        const employeesNames = empRes.data.employees;
        const taskTypeNames = taskTypeRes.data.taskTypes;
        
        const normalizedDepartments = departments.map((d) =>
          normalizeDepartment(d),
        );
        const uniqueDepartments = [...new Set(normalizedDepartments)];

        setDepartment(uniqueDepartments);
        setTaskType(taskTypeNames);
        setEmployees(employeesNames);
        console.log("unique status: " + uniqueStatus);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch employees.");
      }
    };

    fetchAddTaskRequiredDetails();
    fetchTasks();
    fetchStatuses();
  }, []);

  useEffect(() => {
    setFilteredTasks(allTasks);
  }, [allTasks]);

  const validateTaskForm = () => {
    const errors = {};

    if (!newTask.taskName?.trim()) {
      errors.taskName = "Task name is required";
    } else {
      const { available, message } = checkTaskName(
        newTask.taskName,
        newTask._id,
      );

      if (!available) {
        errors.taskName = message;
      }
    }

    if (!newTask.projectName) errors.projectName = "Project is required";

    if (!newTask.department) errors.department = "Department is required";

    if (!newTask.typeOfTask) errors.typeOfTask = "Task type is required";

    if (!newTask.taskDescription?.trim())
      errors.taskDescription = "Description is required";

    if (!newTask.dateOfTaskAssignment)
      errors.dateOfTaskAssignment = "Assign date is required";

    if (!newTask.dateOfExpectedCompletion)
      errors.dateOfExpectedCompletion = "Due date is required";

    if (
      newTask.dateOfTaskAssignment &&
      newTask.dateOfExpectedCompletion &&
      new Date(newTask.dateOfExpectedCompletion) <
      new Date(newTask.dateOfTaskAssignment)
    ) {
      errors.dateOfExpectedCompletion = "Due date must be after assign date";
    }

    if (!newTask.status) errors.status = "Status is required";

    if (!newTask.estimatedHours) errors.estimatedHours = "Estimated hours is required";

    if (newTask.progressPercentage < 0 || newTask.progressPercentage > 100) {
      errors.progressPercentage = "Progress must be between 0 and 100";
    }

    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const resetTaskForm = () => {
    setTaskErrors({}); // ✅ clear all errors
    setNewTask({
      taskName: "",
      projectName: "",
      department: "",
      typeOfTask: "",
      assignedTo: "",
      taskDescription: "",
      dateOfTaskAssignment: "",
      dateOfExpectedCompletion: "",
      status: "",
      estimatedHours: "",
      progressPercentage: "",
      comments: "",
    });
    setProjectEmployees([]);
    setEditTaskId(null);
  };

  const [weeklyOffs, setWeeklyOffs] = useState({
    saturdays: [],
    sundayOff: true,
  });

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `https://ems-cws-test.vercel.app/admin/weeklyoff/${new Date().getFullYear()}`,
        );

        const weeklyData = res.data?.data || {};
        const saturdayOffs = weeklyData.saturdays || [];

        setWeeklyOffs({
          saturdays: saturdayOffs,
          sundayOff: true,
        });

        console.log("✅ Weekly offs fetched:", {
          saturdays: saturdayOffs,
          sundayOff: true,
        });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);

        // fallback
        setWeeklyOffs({ saturdays: [], sundayOff: true });
      }
    };

    fetchWeeklyOffs();
  }, []);

  async function handleAddTask(e) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    e.preventDefault();
    const formData = new FormData();

    try {
      const user = await fetchUser();
      if (!user || !user._id) {
        alert("User not found. Please login again.");
        return;
      }

      if (
        !newTask.assignedTo ||
        !newTask.dateOfTaskAssignment ||
        !newTask.dateOfExpectedCompletion
      ) {
        alert("Employee and assignment date are required");
        return;
      }

      const selectedDate = new Date(newTask.dateOfTaskAssignment);
      selectedDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(newTask.dateOfExpectedCompletion);
      expectedDate.setHours(0, 0, 0, 0);

      // Fetch employee leave
      const leaveRes = await axios.get(
        `https://ems-cws-test.vercel.app/leave/manager/${user._id}`,
      );

      const leaves = leaveRes.data.data || [];

      // Filter leaves for selected employee
      const employeeLeaves = leaves.filter(
        (leave) => leave.employee?._id === newTask.assignedTo,
      );

      // ------ Assignment Date Validations ------

      const isLeaveDay = employeeLeaves.some((leave) => {
        if (leave.status === "rejected") return false;

        const from = new Date(leave.dateFrom);
        const to = new Date(leave.dateTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return selectedDate >= from && selectedDate <= to;
      });

      if (isLeaveDay) {
        alert("❌ Task cannot be assigned. Employee is on leave.");
        return;
      }

      const holidaysRes = await axios.get("https://ems-cws-test.vercel.app/getHolidays");
      const holidays = holidaysRes.data || [];

      const isHoliday = holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === selectedDate.getTime();
      });

      if (isHoliday) {
        alert("❌ Task cannot be assigned on a holiday.");
        return;
      }

      const weeklyOffReason = isWeeklyOff(selectedDate, weeklyOffs);
      if (weeklyOffReason) {
        alert("❌ Task cannot be assigned on weekly off.");
        return;
      }

      const normalize = (d) => {
        const nd = new Date(d);
        nd.setHours(0, 0, 0, 0);
        return nd.getTime();
      };

      // Expected must be >= selected
      if (normalize(expectedDate) < normalize(selectedDate)) {
        alert("❌ Due date must be after assignment date.");
        return;
      }

      // Weekly off
      const expectedWeeklyOffReason = isWeeklyOff(expectedDate, weeklyOffs);
      if (expectedWeeklyOffReason) {
        alert("❌ Due date cannot be on a weekly off.");
        return;
      }

      // Leave check
      const isExpectedLeaveDay = employeeLeaves.some((leave) => {
        if (leave.status === "rejected") return false;

        return (
          normalize(expectedDate) >= normalize(leave.dateFrom) &&
          normalize(expectedDate) <= normalize(leave.dateTo)
        );
      });

      if (isExpectedLeaveDay) {
        alert("❌ Due date cannot be during employee leave.");
        return;
      }

      // Holiday check
      const isExpectedHoliday = holidays.some((holiday) => {
        return normalize(holiday.date) === normalize(expectedDate);
      });

      if (isExpectedHoliday) {
        alert("❌ Due date cannot be on a holiday.");
        return;
      }

      // ------ Form Submission Logic ------

      Object.entries(newTask).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });

      if (documentFile) {
        formData.append("documents", documentFile);
      }

      const token = localStorage.getItem("accessToken");

      if (editTaskId) {
        await axios.put(
          `https://ems-cws-test.vercel.app/task/${editTaskId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          "https://ems-cws-test.vercel.app/task/create",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      await fetchTasks();

      // Clean Up UI
      setShowAddTask(false);
      setEditTaskId(null);
      setAssignDateFromFilter("");
      setAssignDateToFilter("");
      setDocumentFile(null);

      setNewTask({
        taskName: "",
        projectName: "",
        assignedTo: "",
        department: "",
        taskDescription: "",
        typeOfTask: "Bug",
        dateOfTaskAssignment: "",
        dateOfExpectedCompletion: "",
        estimatedHours: "",
        progressPercentage: "0",
        comments: "",
        status: "",
      });

      alert(
        editTaskId ? "Task updated successfully" : "Task created successfully",
      );
    } catch (error) {
      console.error("Submit failed:", error.response?.data || error.message);
      alert("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const applyFilters = () => {
    let temp = [...allTasks];

    if (searchInput.trim() !== "") {
      const query = searchInput.toLowerCase();
      temp = temp.filter((task) => {
        const searchableFields = [
          task.taskId,
          task.taskName,
          task.projectName,
          task.assignedTo?.name,
          task.department,
          task.typeOfTask,
          task.status?.name,
          task.progressPercentage,
          task.taskDescription,
        ];
        const searchString = searchableFields.join(" ").toLowerCase();
        return searchString.includes(query);
      });
    }

    if (assignDateFromFilter || assignDateToFilter) {
      temp = temp.filter((task) => {
        if (!task.dateOfTaskAssignment) return false;
        const taskDateStr = new Date(task.dateOfTaskAssignment)
          .toISOString()
          .split("T")[0];
        return (
          (!assignDateFromFilter || taskDateStr >= assignDateFromFilter) &&
          (!assignDateToFilter || taskDateStr <= assignDateToFilter)
        );
      });
    }

    setFilteredTasks(temp);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setAssignDateFromFilter("");
    setAssignDateToFilter("");
    setFilteredTasks([...allTasks]);
    setCurrentPage(1);
  };

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

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axios.delete(`https://ems-cws-test.vercel.app/task/${id}`);
      setAllTasks((prev) => prev.filter((t) => t._id !== id));
      setFilteredTasks((prev) => prev.filter((t) => t._id !== id));
      alert("Task deleted Successfuly!");
    } catch (error) {
      alert("Failed to delete task");
      console.log("error", error.message);
    }
  };

  console.log("newTask.status:", newTask.status);
  console.log("Status object:", uniqueStatus.find(s => s.id === newTask.status));

  const today = new Date().toISOString().split("T")[0];

  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const maxDate = oneMonthLater.toISOString().split("T")[0];

  const handleDownloadExcel = () => {
    if (filteredTasks.length === 0) {
      alert("No data available to download");
      return;
    }

    const excelData = filteredTasks.map((task, index) => ({
      "Sr No": index + 1,
      "Task Name": task.taskName || "-",
      Project: task.projectName || "-",
      "Assigned To": task.assignedTo?.name || "-",
      Department: task.department || "-",
      "Task Type": task.typeOfTask || "-",
      "Assigned Date": task.dateOfTaskAssignment
        ? new Date(task.dateOfTaskAssignment).toLocaleDateString("en-GB")
        : "-",
      "Due Date": task.dateOfExpectedCompletion
        ? new Date(task.dateOfExpectedCompletion).toLocaleDateString("en-GB")
        : "-",
      "Progress (%)": task.progressPercentage ?? 0,
      Status: task.status?.name || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Lead Tasks");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `Team_Lead_Tasks_${assignDateFromFilter || "ALL"}_to_${assignDateToFilter || "ALL"
      }.xlsx`;

    saveAs(data, fileName);
  };

  const isAnyPopupOpen = !!commentModalTask || !!selectedTask || showAddTask;
  
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

  const getDerivedStatus = (task) => {
    const statusName = task.status?.name || task.status || "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignDate = task.dateOfTaskAssignment
      ? new Date(task.dateOfTaskAssignment)
      : null;

    const dueDate = task.dateOfExpectedCompletion
      ? new Date(task.dateOfExpectedCompletion)
      : null;

    const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;

    if (assignDate) assignDate.setHours(0, 0, 0, 0);
    if (dueDate) dueDate.setHours(0, 0, 0, 0);
    if (updatedAt) updatedAt.setHours(0, 0, 0, 0);

    /* ✅ COMPLETED */
    if (statusName === "Completed") {
      if (dueDate && updatedAt && updatedAt > dueDate) {
        const diffTime = updatedAt - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Completed (Delayed by ${diffDays} days)`;
      }
      return "Completed";
    }

    /* ✅ IN PROGRESS */
    if (statusName === "In Progress") {
      if (dueDate && today > dueDate) {
        return "Delayed (In Progress)";
      }
      return "In Progress";
    }

    /* ✅ ASSIGNED → AUTO CHECK */
    if (statusName === "Assigned" && assignDate) {
      // same day or past, but not started
      if (today >= assignDate) {
        return "Assigned";
      }
      return "Assigned";
    }

    return statusName || "-";
  };

  const handleEditSave = async (task) => {
    try {
      const formData = new FormData();

      formData.append("taskName", task.taskName || "");
      formData.append("department", task.department || "");
      formData.append("typeOfTask", task.typeOfTask || "");
      formData.append("taskDescription", task.taskDescription || "");

      if (task.assignedTo) {
        const assignedToId = task.assignedTo._id || task.assignedTo;
        formData.append("assignedTo", assignedToId);
      }

      if (task.dateOfTaskAssignment) {
        formData.append("dateOfTaskAssignment", task.dateOfTaskAssignment);
      }

      if (task.dateOfExpectedCompletion) {
        formData.append(
          "dateOfExpectedCompletion",
          task.dateOfExpectedCompletion,
        );
      }
      formData.append("estimatedHours", task.estimatedHours || "");

      if (
        task.progressPercentage !== undefined &&
        task.progressPercentage !== null
      ) {
        formData.append("progressPercentage", task.progressPercentage);
      }
      if (task.status) {
        let statusId;
        if (typeof task.status === "object" && task.status._id) {
          statusId = task.status._id;
        } else if (
          typeof task.status === "string" &&
          task.status.trim() !== ""
        ) {
          statusId = task.status;
        }
        if (statusId && statusId.trim() !== "") {
          formData.append("status", statusId);
        } else {
          formData.append("status", "");
        }
      } else {
        formData.append("status", "");
      }
      if (task.document && task.document instanceof File) {
        formData.append("documents", task.document);
      } else if (task.document && typeof task.document === "string") {
        console.log("Document already exists:", task.document);
      }

      const token = localStorage.getItem("accessToken");

      await axios.put(`https://ems-cws-test.vercel.app/task/${task._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchTasks();

      setSelectedTask(null);
      setPopupMode("view");

      alert("Task updated successfully");
    } catch (error) {
      console.error(
        "Error updating task:",
        error.response?.data || error.message,
      );
      alert(
        "Update failed: " + (error.response?.data?.message || error.message),
      );
    }
  };

  return (
    <div className="container-fluid ">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px" }}>Tasks</h2>
        <div className="d-flex gap-2">
          {/* Download Excel Button */}
          <button
            type="button"
            className="btn btn-sm custom-outline-btn"
            onClick={handleDownloadExcel}
          >
            Download Excel
          </button>

          {/* Add Task only for Team_Leader */}
          {userRole === "Team_Leader" && (
            <button
              className="btn btn-sm custom-outline-btn"
              onClick={() => {
                setEditTaskId(null); // ✅ RESET edit mode
                setNewTask({
                  // ✅ CLEAR form
                  taskName: "",
                  projectName: "",
                  assignedTo: "",
                  department: "",
                  taskDescription: "",
                  typeOfTask: "Bug",
                  dateOfTaskAssignment: "",
                  dateOfExpectedCompletion: "",
                  progressPercentage: "0",
                  estimatedHours: "",
                  comments: "",
                  status: "",
                });
                setProjectEmployees([]);
                setShowAddTask(true);
              }}
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row  mb-4">
        {[
          { title: "Total Tasks", count: allTasks.length ?? 0, bg: "#D1ECF1" },
          {
            title: "Completed Tasks",
            count: statusCounts.Completed ?? 0,
            bg: "#D7F5E4",
          },
          {
            title: "Assigned Tasks",
            count: statusCounts.Assigned ?? 0,
            bg: "#FFE493",
          },
          {
            title: "Unassigned Tasks",
            count: statusCounts["Assignment Pending"] ?? 0,
            bg: "#F1F3F5",
          },
          {
            title: "In Progress",
            count: statusCounts["In Progress"] ?? 0,
            bg: "#D1E7FF",
          },
          {
            title: "Tasks On Hold",
            count: statusCounts.Hold ?? 0,
            bg: "#FFF1CC",
          },
          {
            title: "Cancelled Tasks",
            count: statusCounts.Cancelled ?? 0,
            bg: "#F2C2C2",
          },
          {
            title: "Delayed Tasks",
            count: statusCounts.Delayed ?? 0,
            bg: "#FFB3B3",
          },
        ].map((task, idx) => (
  <div className="col-12 col-md-6 col-lg-3 " key={idx}>
      <div className="card shadow-sm h-100 border-0">
        <div className="card-body d-flex align-items-center" style={{ gap: "20px" }}>
          <h4
            className="mb-0"
            style={{
              fontSize: "32px",
              backgroundColor: task.bg,
              padding: "15px",
              textAlign: "center",
              minWidth: "70px",
              minHeight: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3A5FBE",
            }}
          >
            {task.count}
          </h4>

          <p
            className="mb-0 fw-semibold"
            style={{ fontSize: "18px", color: "#3A5FBE" }}
          >
            {task.title}
          </p>
        </div>
      </div>
    </div>
        ))}
      </div>
      
      {/* Filter section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by any field..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={assignDateFromFilter}
                onChange={(e) => setAssignDateFromFilter(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={assignDateToFilter}
                onChange={(e) => setAssignDateToFilter(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  // Apply search filter logic here
                  applyFilters();
                }}
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  setSearchInput("");
                  resetFilters();
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mt-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={thStyle}>Task Name</th>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Assigned To</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Assigned Date</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Progress</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Comments</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-4"
                    style={{ color: "#6c757d" }}
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((t, index) => (
                  <tr
                    key={t._id || index}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedTask({ ...t }); // clone object
                      setPopupMode("view");
                      fetchTaskComments(t._id);
                    }}
                  >
                    <td style={tdStyle}>{t.title || t.taskName || "-"}</td>
                    <td style={tdStyle}>{t.projectName || "-"}</td>
                    <td style={tdStyle}>{t.assignedTo?.name || "-"}</td>{" "}
                    <td style={tdStyle}>{t.typeOfTask || "-"}</td>
                    <td style={tdStyle}>
                      {t.dateOfTaskAssignment
                        ? new Date(t.dateOfTaskAssignment).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {t.dateOfExpectedCompletion
                        ? new Date(
                          t.dateOfExpectedCompletion,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "-"}
                    </td>
                    <td style={tdStyle}>{t.progressPercentage ?? 0}%</td>
                    <td style={tdStyle}>
                      {t.status?.name === "In Progress" &&
                        t.timeTracking?.isRunning ? (
                        <div className="d-flex align-items-center">
                          <span className="text-success fw-bold">
                            {formatTimeClock(
                              timerSeconds[t._id] ||
                              t.timeTracking.totalSeconds ||
                              0,
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="fw-normal">
                          {t.time || "00:00:00"}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span>{getDerivedStatus(t)}</span>
                    </td>
                    <td style={tdStyle}>
                      {currentUser && (
                        <button
                          className="btn btn-sm custom-outline-btn"
                          style={{
                            fontSize: "12px",
                            padding: "4px 12px",
                            borderRadius: "4px",
                          }}
                          onClick={(e) => handleAddCommentClick(e, t)}
                        >
                          Add Comment
                        </button>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {userRole === "Team_Leader" && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm custom-outline-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask({ ...t });
                              setPopupMode("edit");
                              if (t.projectName) {
                                fetchEmployeesForProject(t.projectName);
                              }
                              fetchTaskComments(t._id);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(t._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add task popup start */}
      {showAddTask && (
        <div
          ref={addTaskRef}
          tabIndex="-1"
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
          <div className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validateTaskForm()) return;
                  handleAddTask(e);
                }}
              >
                <div
                  className="modal-header"
                  style={{ background: "#3A5FBE", color: "#fff" }}
                >
                  <h5 className="modal-title">
                    {editTaskId ? "Edit Task" : "Add Task"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowAddTask(false);
                      setProjectEmployees([]);
                      resetTaskForm();
                      checkTaskName();
                    }}
                  />
                </div>

                <div
                  className="modal-body"
                  style={{
                    maxHeight: "70vh", // controls popup height
                    overflowY: "auto", // enables scroll
                  }}
                >
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Task Name</label>
                      <input
                        name="taskName"
                        className="form-control"
                        placeholder="Enter task Name"
                        value={newTask.taskName}
                        disabled={userRole !== "Team_Leader"}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewTask({ ...newTask, taskName: value });

                          const check = checkTaskName(value, editTaskId);
                          if (check.available) {
                            setTaskErrors({ ...taskErrors, taskName: "" });
                          } else {
                            setTaskErrors({
                              ...taskErrors,
                              taskName: check.message,
                            });
                          }
                        }}
                      />

                      {taskErrors.taskName && (
                        <small className="text-danger">
                          {taskErrors.taskName}
                        </small>
                      )}

                      {editTaskId &&
                        newTask.taskName?.trim() &&
                        !taskErrors.taskName && (
                          <small className="text-muted">
                            Editing existing task
                          </small>
                        )}
                    </div>

                    {/* Project - Only shows Team Leader's projects */}
                    <div className="col-md-6">
                      <label className="form-label">Project</label>
                      <select
                        name="projectName"
                        className="form-select"
                        value={newTask.projectName}
                        onChange={(e) => {
                          const selectedProject = e.target.value;
                          setNewTask({
                            ...newTask,
                            projectName: selectedProject,
                            assignedTo: "", // Reset employee when project changes
                          });

                          if (taskErrors.projectName) {
                            setTaskErrors({ ...taskErrors, projectName: "" });
                          }
                          fetchEmployeesForProject(selectedProject);
                        }}
                      >
                        <option value="">Select Project</option>
                        {project.map((pro, index) => (
                          <option key={index} value={pro}>
                            {pro}
                          </option>
                        ))}
                      </select>
                      {project.length === 0 && (
                        <small className="text-warning">
                          No projects assigned to you
                        </small>
                      )}
                      {taskErrors.projectName && (
                        <small className="text-danger">
                          {taskErrors.projectName}
                        </small>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <select
                        name="department"
                        className="form-select"
                        value={newTask.department}
                        onChange={(e) => {
                          setNewTask({
                            ...newTask,
                            department: e.target.value,
                          });
                          if (taskErrors.department) {
                            setTaskErrors({ ...taskErrors, department: "" });
                          }
                        }}
                      >
                        <option value="">Select Department</option>
                        {department.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {taskErrors.department && (
                        <small className="text-danger">
                          {taskErrors.department}
                        </small>
                      )}
                    </div>
                    
                    {/* Task Type */}
                    <div className="col-md-6">
                      <label className="form-label">Task Type</label>
                      <select
                        className="form-select"
                        name="typeOfTask"
                        value={newTask.typeOfTask}
                        onChange={(e) => {
                          setNewTask({
                            ...newTask,
                            typeOfTask: e.target.value,
                          });
                          if (taskErrors.typeOfTask) {
                            setTaskErrors({ ...taskErrors, typeOfTask: "" });
                          }
                        }}
                      >
                        <option value="">Select Task Type</option>
                        {taskType.map((tastype, index) => (
                          <option key={index} value={tastype}>
                            {tastype}
                          </option>
                        ))}
                      </select>
                      {taskErrors.typeOfTask && (
                        <small className="text-danger">
                          {taskErrors.typeOfTask}
                        </small>
                      )}
                    </div>
                    
                    {/* assign to --------------------- */}
                    <div className="col-md-6">
                      <label className="form-label">Assign To</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={newTask.assignedTo}
                        onChange={(e) => {
                          setNewTask({
                            ...newTask,
                            assignedTo: e.target.value,
                          });
                          if (taskErrors.assignedTo) {
                            setTaskErrors({ ...taskErrors, assignedTo: "" });
                          }
                        }}
                        disabled={!newTask.projectName}
                      >
                        <option value="">Select Employee</option>
                        {projectEmployees.length > 0 ? (
                          projectEmployees.map((emp) => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name}
                            </option>
                          ))
                        ) : newTask.projectName ? (
                          <option value="" disabled>
                            No employees assigned to this project
                          </option>
                        ) : (
                          <option value="" disabled>
                            Select a project first
                          </option>
                        )}
                      </select>
                      {taskErrors.assignedTo && (
                        <small className="text-danger">
                          {taskErrors.assignedTo}
                        </small>
                      )}
                    </div>
                    
                    {/* ------------------------------------------------- */}
          <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  name="taskDescription"
                  className="form-control"
                  rows={2}
                  maxLength={500}
                  value={newTask.taskDescription}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      taskDescription: e.target.value,
                    })
                  }
                />
                <small className="text-muted">
                  {newTask.taskDescription?.length || 0}/500 characters
                </small>
              </div>

                    <div className="col-md-6">
                      <label className="form-label">Assign Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dateOfTaskAssignment"
                        min={today}
                        max={maxDate}
                        value={newTask.dateOfTaskAssignment}
                        onChange={(e) => {
                          setNewTask({
                            ...newTask,
                            dateOfTaskAssignment: e.target.value,
                          });
                          setTaskErrors({
                            ...taskErrors,
                            dateOfTaskAssignment: "",
                          });
                        }}
                      />
                      {taskErrors.dateOfTaskAssignment && (
                        <small className="text-danger">
                          {taskErrors.dateOfTaskAssignment}
                        </small>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Due Date</label>
                      <input
                        name="dateOfExpectedCompletion"
                        type="date"
                        className="form-control"
                        min={today}
                        max={maxDate}
                        value={newTask.dateOfExpectedCompletion}
                        onChange={(e) => {
                          setNewTask({
                            ...newTask,
                            dateOfExpectedCompletion: e.target.value,
                          });
                          setTaskErrors({
                            ...taskErrors,
                            dateOfExpectedCompletion: "",
                          });
                        }}
                      />
                      {taskErrors.dateOfExpectedCompletion && (
                        <small className="text-danger">
                          {taskErrors.dateOfExpectedCompletion}
                        </small>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={newTask.status}
                        onChange={(e) => {
                          setNewTask({ ...newTask, status: e.target.value });
                          if (taskErrors.status) {
                            setTaskErrors({ ...taskErrors, status: "" });
                          }
                        }}
                      >
                        <option value="">Select Status</option>
                        {!newTask.assignedTo || newTask.assignedTo.trim() === ""
                          ? uniqueStatus
                            .filter(
                              (status) =>
                                status.name === "Assignment Pending",
                            )
                            .map((status) => (
                              <option key={status._id} value={status._id}>
                                {status.name === "Assignment Pending"
                                  ? "Unassigned"
                                  : status.name}
                              </option>
                            ))
                          : uniqueStatus
                            .filter((status) => status.name !== "Cancelled")
                            .map((status) => (
                              <option key={status._id} value={status._id}> 
                                {status.name === "Assignment Pending"
                                  ? "Unassigned"
                                  : status.name}
                              </option>
                            ))}
                      </select>
                      {taskErrors.status && (
                        <small className="text-danger">
                          {taskErrors.status}
                        </small>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-md-4">
                      <label className="form-label">Progress %</label>
                      <input
                        type="number"
                        name="progressPercentage"
                        className="form-control"
                        min="0"
                        max="100"
                        value={newTask.progressPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === "" ||
                            (Number(value) >= 0 && Number(value) <= 100)
                          ) {
                            setNewTask({
                              ...newTask,
                              progressPercentage: value,
                            });

                            if (taskErrors.progressPercentage) {
                              setTaskErrors({
                                ...taskErrors,
                                progressPercentage: "",
                              });
                            }
                          }
                        }}
                      />

                      {taskErrors.progressPercentage && (
                        <small className="text-danger">
                          {taskErrors.progressPercentage}
                        </small>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Estimated Hours</label>
                      <input
                        type="number"
                        name="estimatedHours"
                        className="form-control"
                        min="0"
                        value={newTask.estimatedHours}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || Number(value) >= 0) {
                            setNewTask({
                              ...newTask,
                              estimatedHours: value,
                            });

                            if (taskErrors.estimatedHours) {
                              setTaskErrors({
                                ...taskErrors,
                                estimatedHours: "",
                              });
                            }
                          }
                        }}
                      />

                      {taskErrors.estimatedHours && (
                        <small className="text-danger">
                          {taskErrors.estimatedHours}
                        </small>
                      )}
                    </div>

                    {/* Document Upload */}
                    <div className="col-12">
                      <label className="form-label">Document</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      />
                    </div>
                  </div>

                  
                </div>
                <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      onClick={() => {
                        setShowAddTask(false);
                        setEditTaskId(null);
                        resetTaskForm();
                        setProjectEmployees([]);
                      }}
                    >
                      Cancel
                    </button>

                    {userRole === "Team_Leader" && (
                      <button
                        type="submit"
                        className="btn btn-sm custom-outline-btn"
                      >
                        {editTaskId ? "Save Changes" : "Save Task"}
                      </button>
                    )}
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Add task popu end */}

      <nav
        className="d-flex align-items-center justify-content-end mt-3 text-muted"
        style={{ userSelect: "none" }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Rows per page */}
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
          {/* Range display */}
          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {filteredTasks.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredTasks.length
              }`}
          </span>

          {/* Arrows */}
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
              onMouseDown={(e) => e.preventDefault()}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* comment model start */}
      {commentModalTask && (
        <div
          ref={commentRef}
          tabIndex="-1"
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
           className="modal-dialog modal-lg modal-dialog-centered"
           style={{ width: "600px" }}
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

      {/* Row clickable popup */}
      {selectedTask && (
        <div
          ref={viewEditRef}
          tabIndex="-1"
          className="modal fade show"
          role="dialog"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            overflow: "hidden",
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  {popupMode === "view" ? "Task Details" : "Edit Task"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setSelectedTask(null);
                    setPopupMode("view");
                  }}
                />
              </div>

              {/* BODY */}
              <div
                className="modal-body"
                style={{ maxHeight: "60vh", overflowY: "auto" }}
              >
                <div className="container-fluid">
                  {/* Task Name */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Task Name</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.taskName || "-"
                      ) : (
                        <>
                          <input
                            className="form-control"
                            value={selectedTask.taskName || ""}
                            disabled={userRole !== "Team_Leader"}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSelectedTask({
                                ...selectedTask,
                                taskName: value,
                              });

                              const otherTasks = allTasks.filter(
                                (t) => t._id !== selectedTask._id,
                              );
                              const otherTaskNames = otherTasks.map((t) =>
                                t.taskName?.trim().toLowerCase(),
                              );

                              if (
                                otherTaskNames.includes(
                                  value.trim().toLowerCase(),
                                )
                              ) {
                                alert("Task name already exists!");
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Name */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Project</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.projectName || "-"
                      ) : (
                        <select
                          className="form-select"
                          value={selectedTask.projectName || ""}
                          onChange={(e) => {
                            setSelectedTask({
                              ...selectedTask,
                              projectName: e.target.value,
                              assignedTo: "",
                            });
                            fetchEmployeesForProject(e.target.value);
                          }}
                        >
                          <option value="">Select Project</option>
                          {project.map((p, i) => (
                            <option key={i} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* department */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Department</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.department || "-"
                      ) : (
                        <select
                          className="form-select"
                          value={selectedTask.department || ""}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              department: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Department</option>
                          {department.map((d, i) => (
                            <option key={i} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Task Type */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Task Type</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.typeOfTask || "-"
                      ) : (
                        <select
                          className="form-select"
                          value={selectedTask.typeOfTask || ""}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              typeOfTask: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Task Type</option>
                          {taskType.map((t, i) => (
                            <option key={i} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Assigned to  */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Assign To</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.assignedTo?.name || "-"
                      ) : (
                        <select
                          className="form-select"
                          value={selectedTask.assignedTo?._id || ""}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              assignedTo: projectEmployees.find(
                                (emp) => emp._id === e.target.value,
                              ),
                            })
                          }
                          disabled={!selectedTask.projectName}
                        >
                          <option value="">Select Employee</option>
                          {projectEmployees.length > 0 ? (
                            projectEmployees.map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.name}
                              </option>
                            ))
                          ) : selectedTask.projectName ? (
                            <option value="" disabled>
                              No employees assigned to this project
                            </option>
                          ) : (
                            <option value="" disabled>
                              Select a project first
                            </option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Description
                    </div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.taskDescription ||
                        selectedTask.description ||
                        "-"
                      ) : (
                        <textarea
                          className="form-control"
                          rows="3"
                          value={
                            selectedTask.taskDescription ||
                            selectedTask.description ||
                            "-"
                          }
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              taskDescription: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Assign Date */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Assign Date
                    </div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.dateOfTaskAssignment ? (
                          new Date(
                            selectedTask.dateOfTaskAssignment,
                          ).toLocaleDateString("en-GB")
                        ) : (
                          "-"
                        )
                      ) : (
                        <input
                          type="date"
                          className="form-control"
                          value={selectedTask.dateOfTaskAssignment?.slice(
                            0,
                            10,
                          )}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              dateOfTaskAssignment: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Expected Date */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Due Date</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.dateOfExpectedCompletion ? (
                          new Date(
                            selectedTask.dateOfExpectedCompletion,
                          ).toLocaleDateString("en-GB")
                        ) : (
                          "-"
                        )
                      ) : (
                        <input
                          type="date"
                          className="form-control"
                          value={selectedTask.dateOfExpectedCompletion?.slice(
                            0,
                            10,
                          )}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              dateOfExpectedCompletion: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Status</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        <span>
                          {selectedTask.status?.name === "Assignment Pending"
                            ? "Unassigned"
                            : selectedTask.status?.name}
                        </span>
                      ) : (
                        <select
                          className="form-control"
                          value={selectedTask.status?._id || ""}
                          onChange={(e) => {
                            const statusId = e.target.value;
                            const selectedStatus = uniqueStatus.find(
                              (s) => s._id === statusId
                            );
                            setSelectedTask({
                              ...selectedTask,
                              status: selectedStatus,
                            });
                          }}
                          disabled={
                            !selectedTask.assignedTo ||
                            !selectedTask.assignedTo._id ||
                            selectedTask.status?.name === "In Progress"
                          }
                        >
                          <option value="" disabled>Select Status</option>
                          {!selectedTask.assignedTo ||
                            !selectedTask.assignedTo._id
                            ? uniqueStatus
                              .filter(
                                (status) =>
                                  status.name === "Assignment Pending",
                              )
                              .map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name === "Assignment Pending"
                                    ? "Unassigned"
                                    : s.name}
                                </option>
                              ))
                            : uniqueStatus.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name === "Assignment Pending"
                                  ? "Unassigned"
                                  : s.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {popupMode === "view" && (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-3 fw-semibold">
                        Time Spent
                      </div>
                      <div className="col-7 col-sm-9">
                        {selectedTask.status?.name === "In Progress" &&
                          selectedTask.timeTracking?.isRunning ? (
                          <div className="d-flex align-items-center">
                            <span className="text-success fw-bold">
                              {formatTimeClock(
                                timerSeconds[selectedTask._id] ||
                                selectedTask.timeTracking.totalSeconds ||
                                0,
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="fw-normal">
                            {selectedTask.time || "00:00:00"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* progress */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Progress</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ||
                        selectedTask.status?.name === "Assigned" ? (
                        `${selectedTask.progressPercentage || 0}%`
                      ) : (
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          disabled={
                            selectedTask.status?.name === "Assigned" ||
                            selectedTask.status?.name === "Assignment Pending"
                          }
                          value={selectedTask.progressPercentage || ""}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              progressPercentage: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* est hours */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Estimated Hours</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view"
                        ? (
                          `${selectedTask.estimatedHours || 0}`
                        ) : (
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            value={selectedTask.estimatedHours || ""}
                            onChange={(e) =>
                              setSelectedTask({
                                ...selectedTask,
                                estimatedHours: e.target.value,
                              })
                            }
                          />
                        )}
                    </div>
                  </div>

                  {/* Document */}
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Document</div>
                    <div className="col-7 col-sm-9">
                      {popupMode === "view" ? (
                        selectedTask.documentPath || selectedTask.document || selectedTask.documents ? (
                          <div className="d-flex flex-column gap-2">
                            {(() => {
                              const doc = selectedTask.documentPath || selectedTask.document || selectedTask.documents;

                              let documentToShow = doc;
                              if (Array.isArray(doc) && doc.length > 0) {
                                documentToShow = doc[0];
                              }

                              const fileName = getFileName(documentToShow);
                              const fileUrl = getFileUrl(documentToShow);

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
                        ) : (
                          "-"
                        )
                      ) : (
                        <div>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedTask({
                                  ...selectedTask,
                                  document: e.target.files[0],
                                });
                              }
                            }}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          />
                          <small className="text-muted">
                            {selectedTask.documentPath || selectedTask.document
                              ? "Upload a new file to replace the current document"
                              : "Upload a document"}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {popupMode === "view" && (
                    <div className="row mb-2">
                      <div
                        className="col-5 col-sm-3 fw-semibold"
                        style={{ color: "#212529" }}
                      >
                        Comments
                      </div>
                      <div className="col-7 col-sm-9">
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {taskComments && taskComments.length > 0 ? (
                            taskComments.map((comment, index) => {
                              const isCommentCreator =
                                comment.user?._id === currentUserId;
                              const isEditing =
                                editingCommentId === comment._id;

                              if (isEditing) {
                                return (
                                  <div
                                    key={index}
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
                                              comment._id,
                                              selectedTask._id,
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
                                  key={index}
                                  className="mb-2 p-2 border rounded"
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div>
                                      <strong>
                                        {comment.user?.name || "Unknown"}
                                        {comment.user?.role && (
                                          <span
                                            style={{
                                              fontWeight: "normal",
                                              marginLeft: "4px",
                                            }}
                                          >
                                            ({comment.user.role})
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
                                            className="btn btn-sm btn custom-outline-btn p-0"
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
                                                comment._id,
                                                selectedTask._id,
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
                            })
                          ) : (
                            <div className="text-muted">No comments</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer border-0 pt-0 d-flex gap-2">
                {popupMode === "view" && userRole === "Team_Leader" && (
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => {
                      setSelectedTask({ ...selectedTask });
                      setPopupMode("edit");
                      setTaskComments([]);
                      if (selectedTask.projectName) {
                        fetchEmployeesForProject(selectedTask.projectName);
                      }
                    }}
                  >
                    Edit
                  </button>
                )}

                {popupMode === "edit" && userRole === "Team_Leader" && (
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => handleEditSave(selectedTask)}
                  >
                    Save Changes
                  </button>
                )}

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => {
                    setSelectedTask(null);
                    setPopupMode("view");
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

const thStyle = {
  fontWeight: "500",
  fontSize: "14px",
  color: "#6c757d",
  borderBottom: "2px solid #dee2e6",
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  verticalAlign: "middle",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  whiteSpace: "nowrap",
  textTransform: "capitalize"
};

export default TLTaskTMS;