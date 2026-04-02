import React, { useEffect, useState, useMemo } from "react";
import AllEmployeesTable from "./AllEmployeesTable";
import AllProjectsTable from "./AllProjectsTable";
import DelayedTasksTable from "./DelayedTasksTable";
import UpcomingTasksTable from "./UpcomingTasksTable";
import EmployeeTasksView from "./EmployeeTasksView";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./ReportTMSGraph.css";
function HRReportTMS() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCardList, setShowCardList] = useState(null);

  // State for API data
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //shivani report
  const [projects, setProjects] = useState([]);
  const [tableProjects, setTableProjects] = useState([]);
  const [projectRange, setProjectRange] = useState("all");
  const [allTasks, setAllTasks] = useState([]);
  const [selectedTaskMonth, setSelectedTaskMonth] = useState("all");
  const [selectedDonutStatus, setSelectedDonutStatus] = useState(null);
  const [donutPopupTasks, setDonutPopupTasks] = useState([]);
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [selectedProjectMonth, setSelectedProjectMonth] = useState(null);
  const [linePopupProjects, setLinePopupProjects] = useState({
    "In Progress": [],
    Completed: [],
    Delayed: [],
    Cancelled: [],
  });
  const totalProjects = projects.length;
  const TASK_COLORS = {
    Completed: "#198754",
    Assigned: "#3A5FBE",
    "Assignment Pending": "#ffc107",
    "In Progress": "#0d6efd",
    Hold: "#adb5bd",
    Cancelled: "#6c757d",
    Delayed: "#dc3545",
  };

  const PROJECT_STATUS_COLORS = {
    "In Progress": "#0d6efd",
    Completed: "#198754",
    Delayed: "#dc3545",
    Cancelled: "#6c757d",
  };

  const getProjectStatus = (project) =>
    typeof project.status === "string"
      ? project.status.toLowerCase()
      : project.status?.name?.toLowerCase();

  const taskMonthOptions = useMemo(() => {
    const months = [];
    const today = new Date();

    // include next month + past 5 months
    for (let i = -1; i < 5; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

      months.push({
        label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0",
        )}`,
      });
    }

    return months;
  }, []);

  const taskStatusChartData = useMemo(() => {
    const counts = {
      Completed: 0,
      Assigned: 0,
      "Assignment Pending": 0,
      "In Progress": 0,
      Hold: 0,
      Cancelled: 0,
      Delayed: 0,
    };

    const filteredTasks =
      selectedTaskMonth === "all"
        ? allTasks
        : allTasks.filter((task) => {
            const dateStr = task.dateOfTaskAssignment; // ✅ correct field
            if (!dateStr) return false;

            const d = new Date(dateStr);
            if (isNaN(d)) return false;

            const taskMonth = `${d.getFullYear()}-${String(
              d.getMonth() + 1,
            ).padStart(2, "0")}`;

            return taskMonth === selectedTaskMonth;
          });

    filteredTasks.forEach((task) => {
      const statusName = task?.status?.name;
      if (counts[statusName] !== undefined) {
        counts[statusName]++;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [allTasks, selectedTaskMonth]);

  const totalTasks = useMemo(() => {
    return taskStatusChartData.reduce((sum, item) => sum + item.value, 0);
  }, [taskStatusChartData]);

  // shivani
  const handleDonutClick = (statusName) => {
    setSelectedDonutStatus(statusName);

    const filtered = allTasks.filter((task) => {
      // status match
      const statusMatch =
        task?.status?.name?.toLowerCase() === statusName.toLowerCase();

      if (!statusMatch) return false;

      // month filter
      if (selectedTaskMonth === "all") return true;

      const d = new Date(task.dateOfTaskAssignment);
      if (isNaN(d)) return false;

      const taskMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      return taskMonth === selectedTaskMonth;
    });

    setDonutPopupTasks(filtered);
  };
  const donutTasksByEmployee = useMemo(() => {
    const map = {};

    donutPopupTasks.forEach((task) => {
      const empName = task?.assignedTo?.name || "Unassigned";

      if (!map[empName]) map[empName] = [];

      map[empName].push({
        taskName: task.taskName,
        taskType: task.typeOfTask,
        assignDate: task.dateOfTaskAssignment,
        dueDate: task.dateOfExpectedCompletion,
      });
    });

    return map;
  }, [donutPopupTasks]);

  const filterProjectsByMonth = (monthLabel) => {
    const [monthStr, yearStr] = monthLabel.split(" ");
    const d = new Date(`${monthStr} 1, ${yearStr}`);

    const month = d.getMonth();
    const year = d.getFullYear();
    const today = new Date();

    const result = {
      "In Progress": [],
      Completed: [],
      Delayed: [],
      Cancelled: [],
    };

    projects.forEach((p) => {
      const status = getProjectStatus(p);
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      const startDate = p.startDate ? new Date(p.startDate) : null;

      if (!dueDate) return;
      if (dueDate.getMonth() !== month || dueDate.getFullYear() !== year)
        return;

      if (status === "completed") result.Completed.push(p);
      else if (status === "cancelled") result.Cancelled.push(p);
      else if (status === "delayed") {
        result.Delayed.push(p);
        result["In Progress"].push(p); //  delayed is part of in-progress
      } else {
        //  exclude upcoming
        if (startDate && startDate > today) return;

        //  active → in progress
        result["In Progress"].push(p);
      }
    });

    return result;
  };

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

  const STATUS_COLORS = {
    "In Progress": "#0d6efd",
    Completed: "#198754",
    Delayed: "#dc3545",
    Cancelled: "#6c757d",
  };
  {
    /* 
  useEffect(() => {
    const fetchTasks = async () => {
      const res = await axios.get("http://localhost:8000/task/getall");
      setAllTasks(res.data || []);
    };

    fetchTasks();
  }, []);
*/
  }
  const TaskStatusTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const statusName = payload[0].name;

    const filteredTasks = allTasks.filter((task) => {
      // ✅ Status match
      const statusMatch =
        task?.status?.name?.trim().toLowerCase() ===
        statusName.trim().toLowerCase();

      if (!statusMatch) return false;

      // ✅ Month filter
      if (selectedTaskMonth === "all") return true;

      const dateStr = task.dateOfTaskAssignment; // ✅ correct field
      if (!dateStr) return false;

      const d = new Date(dateStr);
      if (isNaN(d)) return false;

      const taskMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      return taskMonth === selectedTaskMonth;
    });

    // ✅ Employee-wise task count
    const employeeTaskCountMap = {};

    filteredTasks.forEach((task) => {
      const empName = task?.assignedTo?.name || "Unassigned";
      employeeTaskCountMap[empName] = (employeeTaskCountMap[empName] || 0) + 1;
    });

    const employeeEntries = Object.entries(employeeTaskCountMap);

    return (
      <div
        style={{
          background: "#fff",
          padding: "10px 12px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "13px",
          minWidth: "260px",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "6px" }}>
          {statusName} Tasks
        </div>

        <div style={{ marginBottom: "6px" }}>
          <strong>Total:</strong> {payload[0].value}
        </div>

        <div>
          <strong>Employees:</strong>
          {employeeEntries.length ? (
            <ul style={{ paddingLeft: "16px", margin: "4px 0 0" }}>
              {employeeEntries.map(([name, count]) => (
                <li key={name}>
                  {name} <span style={{ color: "#6c757d" }}>({count})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted">No tasks</div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "12px", fontWeight: 600 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  {
    /*
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/projects");
        setProjects(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Project fetch error:", err);
      }
    };

    fetchProjects();
  }, []);
 */
  }
  const getLatestMonthDate = (projects) => {
    return projects.reduce((latest, p) => {
      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      const startDate = p.startDate ? new Date(p.startDate) : null;

      const date = dueDate || startDate;
      if (!date || isNaN(date)) return latest;

      return !latest || date > latest ? date : latest;
    }, null);
  };

  const getLastMonths = (projects, range) => {
    const latest = getLatestMonthDate(projects);
    if (!latest) return [];

    const months = [];
    const total = range === "all" ? 12 : Number(range);

    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(latest.getFullYear(), latest.getMonth() - i, 1);

      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        sortDate: d,
        Assigned: 0,
        Completed: 0,
        Delayed: 0,
      });
    }

    return months;
  };

  const projectStatusLineData = useMemo(() => {
    if (!projects.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseMonths =
      projectRange === "all"
        ? getLastMonths(projects, 12)
        : getLastMonths(projects, projectRange);

    const monthMap = {};
    baseMonths.forEach((m) => {
      monthMap[m.key] = {
        ...m,
        "In Progress": 0,
        Completed: 0,
        Delayed: 0,
        Cancelled: 0,
      };
    });

    projects.forEach((project) => {
      const status = getProjectStatus(project);
      let dateForMonth = null;

      if (status === "completed") {
        dateForMonth = project.deliveryDate || project.dueDate;
      } else {
        dateForMonth = project.dueDate || project.deliveryDate;
      }

      const dueDate = dateForMonth ? new Date(dateForMonth) : null;
      const startDate = project.startDate ? new Date(project.startDate) : null;

      if (!dueDate || isNaN(dueDate)) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      startDate?.setHours(0, 0, 0, 0);

      const key = `${dueDate.getFullYear()}-${dueDate.getMonth()}`;
      if (!monthMap[key]) return;

      //  Completed
      if (status === "completed") {
        monthMap[key].Completed++;
        return;
      }

      //  Cancelled
      if (status === "cancelled") {
        monthMap[key].Cancelled++;
        return;
      }

      //  Delayed → crossed due date
      if (status === "delayed") {
        monthMap[key].Delayed++;
        monthMap[key]["In Progress"]++; // delayed is part of in-progress
        return;
      }

      //  In Progress (same logic as popup)
      if (status !== "completed" && status !== "cancelled") {
        // exclude upcoming
        if (startDate && startDate > today) return;

        // delayed already handled above
        if (status !== "delayed") {
          monthMap[key]["In Progress"]++;
        }
      }
    });

    return Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
  }, [projects, projectRange]);
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Fetch all data using your existing APIs change dip
        const [employeesRes, tasksRes, projectsRes] = await Promise.all([
          axios.get("http://localhost:8000/getAllEmployees", { headers }),
          axios.get("http://localhost:8000/task/getall", { headers }),
          axios.get("http://localhost:8000/api/projects", { headers }),
        ]);

        // if (!employeesRes.ok || !tasksRes.ok || !projectsRes.ok) {
        //   throw new Error("Failed to fetch data from server");
        // }

        const employeesData = employeesRes.data;
        const tasksData = tasksRes.data;
        setAllTasks(tasksData);
        const projectsData = projectsRes.data;
        //dip code
        // Filter to match getEmployeeCount logic:
        // 1. Only non-deleted employees (isDeleted: false)
        // 2. Only roles: hr, manager, employee, it_support
        const allowedRoles = ["hr", "manager", "employee", "it_support"];

        const filteredEmployees = employeesData.filter((emp) => {
          // Check if not deleted
          if (emp.isDeleted === true) {
            return false;
          }

          // Check if role is in allowed list (case-insensitive)
          const role = (emp.role || "").toLowerCase().trim();
          return allowedRoles.includes(role);
        });

        // console.log("Total from API:", employeesData.length);
        // console.log("Filtered employees (matching getEmployeeCount):", filteredEmployees.length);
        //code end
        // Transform employee data to match your component structure
        const formattedEmployees = filteredEmployees.map((emp) => ({
          //dip change
          id: emp._id,
          name: emp.name,
          role: emp.role,
          managerId: emp.reportingManager,
          managerName: emp.reportingManager?.name || "N/A",
          department: emp.department,
          designation: emp.designation,
          email: emp.email,
          contact: emp.contact,
        }));

        // Transform task data
        const formattedTasks = tasksData.map((task) => ({
          id: task._id,
          title: task.taskName,
          employeeId: task.assignedTo?._id,
          employeeName: task.assignedTo?.name || task.assignedTo?.username,
          status: task.status?.name || "Unknown",
          project: task.projectName?.name || task.projectName,
          dueDate: task.dateOfExpectedCompletion,
        }));
        setTasks(formattedTasks);
        // Transform project data
        const formattedProjects = projectsData.map((proj) => ({
          id: proj._id,
          name: proj.name,
          status: proj.status || "Unknown",
          managerId: proj.managers?.[0]?._id,
          managerName: proj.managers?.[0]?.name || "N/A",
          deliveryDate: proj.dueDate,
        }));

        setEmployees(formattedEmployees);
        setTasks(formattedTasks);
        setProjects(projectsData?.data || projectsData);
        setTableProjects(formattedProjects);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate counts
  const totalEmployees = employees.length;
  const projectCount = projects.length;
  const activeProjectCount = projects.filter(
    (p) =>
      p.status === "Active" ||
      p.status === "In Progress" ||
      p.status === "Ongoing",
  ).length;

  // Fixed delayed tasks calculation
  // const delayedTasks = tasks.filter((task) => {
  //   // Check if dueDate exists and is valid
  //   // if (!task.dueDate) return false;
  //   // Normalize dates for comparison (remove time part)
  //   const taskDueDate = new Date(task.dueDate).toISOString().slice(0, 10);

  //   // Task is delayed if due date is before today
  //   const isPastDue = taskDueDate < today;

  //   // Check if task is NOT completed or cancelled
  //   const statusLower = (task.status || "").toLowerCase();
  //   const isNotCompleted =
  //     statusLower !== "completed" &&
  //     statusLower !== "cancelled" &&
  //     statusLower !== "done" &&
  //     statusLower !== "closed";

  //   return isPastDue && isNotCompleted;
  // });

  //Dip
  // Define today and tomorrow dip code
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Delayed tasks - based on status
  const delayedTasks = tasks.filter((task) => {
    const statusLower = (task.status || "").toLowerCase().trim();
    return statusLower === "delayed";
  });
  //Dip

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  // Upcoming task
  const upcomingTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const taskDueDate = new Date(t.dueDate).toISOString().slice(0, 10);
    return taskDueDate >= tomorrowStr && taskDueDate <= nextWeekStr; //dip chnage
  });

  const isAnyPopupOpen = !!selectedDonutStatus || !!selectedProjectMonth;
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

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid p-4" style={{ marginTop: "-25px" }}>
        <h3
          className="mb-4 fw-bold"
          style={{ color: "#3A5FBE", fontSize: "25px" }}
        >
          Organization Reports
        </h3>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid p-4" style={{ marginTop: "-25px" }}>
        <h3
          className="mb-4 fw-bold"
          style={{ color: "#3A5FBE", fontSize: "25px" }}
        >
          Organization Reports
        </h3>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error loading data</h5>
          <p>{error}</p>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h3 className="mb-4 " style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Organization Reports
      </h3>

      {/* Top Cards */}
      <div className="row g-3 mb-4">
       <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null);
              setShowCardList("allEmployees");
            }}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0  d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                  fontWeight: "600px",
                }}
              >
                {totalEmployees}
              </h4>
              <div>
                <div
                  className="mb-0 fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  All Employees
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null);
              setShowCardList("allProjects");
            }}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0  d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFB3B3",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                  fontWeight: "600px",
                }}
              >
                {projectCount}
              </h4>
              <div>
                <div
                  className="mb-0 fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  All Projects
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null);
              setShowCardList("delayedTasks");
            }}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0  d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFE493",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                  fontWeight: "600px",
                }}
              >
                {delayedTasks.length}
              </h4>
              <div>
                <div
                  className="mb-0 fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  Delayed Tasks
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>

       <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null);
              setShowCardList("upcomingTasks");
            }}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0  d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D7F5E4",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                  fontWeight: "600px",
                }}
              >
                {upcomingTasks.length}
              </h4>
              <div>
                <div
                  className="mb-0 fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  Upcoming Tasks
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Rendering */}
      {selectedEmployee && (
        <EmployeeTasksView
          selectedEmployee={selectedEmployee}
          allTasks={tasks}
          onBack={() => setSelectedEmployee(null)}
        />
      )}

      {showCardList === "allEmployees" && !selectedEmployee && (
        <AllEmployeesTable
          employees={employees}
          onClose={() => setShowCardList(null)}
          onViewTasks={(emp) => setSelectedEmployee(emp)}
        />
      )}

      {showCardList === "allProjects" && (
        <AllProjectsTable
          projects={tableProjects}
          onClose={() => setShowCardList(null)}
        />
      )}

      {showCardList === "delayedTasks" && (
        <DelayedTasksTable
          delayedTasks={delayedTasks}
          allEmployees={employees}
          onClose={() => setShowCardList(null)}
        />
      )}

      {showCardList === "upcomingTasks" && (
        <UpcomingTasksTable
          upcomingTasks={upcomingTasks}
          allEmployees={employees}
          onClose={() => setShowCardList(null)}
        />
      )}

      <div className="row g-4 mt-4 align-items-stretch">
        {/* TASK STATUS DONUT */}
        <div className="col-lg-4 col-md-5">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex flex-column align-items-start">
                <h6 className="fw-semibold mb-4 " style={{color: "#3A5FBE"}}>
                  📊 Task Status Overview
                </h6>
              </div>
                <div className="dropdown">
                  <button
                    className="form-select form-select-sm text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "100%",
                      maxWidth: "120px",
                      minWidth: "100px",
                    }}
                  >
                    {selectedTaskMonth === "all"
                      ? "All Months"
                      : taskMonthOptions.find(
                          (m) => m.value === selectedTaskMonth,
                        )?.label}
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    style={{ minWidth: "120px" }}
                  >
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSelectedTaskMonth("all")}
                      >
                        All Months
                      </button>
                    </li>

                    {taskMonthOptions.map((m) => (
                      <li key={m.value}>
                        <button
                          className="dropdown-item"
                          onClick={() => setSelectedTaskMonth(m.value)}
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ResponsiveContainer
                width="100%"
                height={300}
                style={{ outline: "none" }}
              >
                <PieChart tabIndex={-1}>
                  <Pie
                    data={taskStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    stroke="none"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    label={renderCustomizedLabel}
                    labelLine={false}
                    onMouseEnter={() => setIsTooltipActive(true)}
                    onMouseLeave={() => setIsTooltipActive(false)}
                    onClick={(data) => {
                      setIsTooltipActive(false);
                      handleDonutClick(data.name);
                    }}
                    isAnimationActive={false}
                  >
                    {taskStatusChartData.map((entry) => (
                      <Cell
                        stroke="none"
                        key={entry.name}
                        fill={TASK_COLORS[entry.name] || "#adb5bd"}
                      />
                    ))}
                  </Pie>

                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      fill: "#212529",
                    }}
                  >
                    {totalTasks}
                  </text>

                  <text
                    x="50%"
                    y="43%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "13px",
                      fill: "#6c757d",
                    }}
                  >
                    Total Tasks
                  </text>

                  <Tooltip
                    content={<TaskStatusTooltip />}
                    cursor={{ fill: "transparent" }}
                    active={isTooltipActive}
                    wrapperStyle={{ pointerEvents: "none" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PROJECT STATUS LINE */}
        <div className="col-lg-8 col-md-7">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex flex-column align-items-start">
                  <h6 className="fw-semibold  mb-1" style={{color: "#3A5FBE"}}>
                    📈 Project Status Trend
                  </h6>
                  <span
                    className="text-muted fs-6"
                    style={{ paddingLeft: "25px" }}
                  >
                    (Total Projects: {totalProjects})
                  </span>
                </div>

                <div className="dropdown">
                  <button
                    className="form-select form-select-sm text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "100%",
                      maxWidth: "140px",
                      minWidth: "110px",
                    }}
                  >
                    {projectRange === "all"
                      ? "All"
                      : projectRange === "3"
                        ? "Last 3 Months"
                        : "Last 6 Months"}
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    style={{ minWidth: "140px" }}
                  >
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setProjectRange("all")}
                      >
                        All
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setProjectRange("3")}
                      >
                        Last 3 Months
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setProjectRange("6")}
                      >
                        Last 6 Months
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart //change full linechart 15 jan------------------------------
                  data={projectStatusLineData}
                  onClick={(e) => {
                    if (!e || !e.activeLabel) return;

                    const filtered = filterProjectsByMonth(e.activeLabel);

                    setSelectedProjectMonth(e.activeLabel);
                    setLinePopupProjects(filtered);
                  }}
                >
                  <CartesianGrid stroke="#e9ecef" strokeDasharray="4 4" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "25px" }}
                  />

                  <Line
                    dataKey="In Progress"
                    stroke={PROJECT_STATUS_COLORS["In Progress"]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    dataKey="Completed"
                    stroke={PROJECT_STATUS_COLORS.Completed}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    dataKey="Delayed"
                    stroke={PROJECT_STATUS_COLORS.Delayed}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    dataKey="Cancelled"
                    stroke={PROJECT_STATUS_COLORS.Cancelled}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Shivani */}
     {selectedDonutStatus && (
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
          onClick={() => setSelectedDonutStatus(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%" , marginTop:"40px"}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content"
             style={{
              maxHeight: "75vh",     
              display: "flex",
              flexDirection: "column",
            }}>
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">{selectedDonutStatus} Tasks</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedDonutStatus(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                {Object.entries(donutTasksByEmployee).length > 0 ? (
                  Object.entries(donutTasksByEmployee).map(
                    ([empName, tasks]) => (
                      <div key={empName} className="mb-4">
                        {/* Employee Header */}
                        <div
                          className="mb-3 p-2 rounded"
                          style={{
                            backgroundColor: "#E8F0FE",
                            color: "#3A5FBE",
                            fontWeight: "600",
                          }}
                        >
                          👤 {empName} ({tasks.length} Tasks)
                        </div>

                        {/* Task Cards */}
                        <div className="row g-3">
                          {tasks.map((task, index) => (
                            <div key={index} className="col-12 col-md-6">
                              <div
                                className="border rounded p-3 h-100"
                                style={{ backgroundColor: "#ffffff" }}
                              >
                                <div className="row mb-1">
                                  <div className="col-4 fw-semibold">
                                    Task Name
                                  </div>
                                  <div className="col-8">{task.taskName}</div>
                                </div>

                                <div className="row mb-1">
                                  <div className="col-4 fw-semibold">
                                    Task Type
                                  </div>
                                  <div className="col-8">
                                    {task.taskType || "N/A"}
                                  </div>
                                </div>

                                <div className="row mb-1">
                                  <div className="col-4 fw-semibold">
                                    Assign Date
                                  </div>
                                  <div className="col-8">
                                    {formatDate(task.assignDate)}
                                  </div>
                                </div>

                                <div className="row mb-0">
                                  <div className="col-4 fw-semibold">
                                    Due Date
                                  </div>
                                  <div className="col-8">
                                    {formatDate(task.dueDate)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="text-center text-muted py-4">
                    No tasks found
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn" style={{ minWidth: 90 }}
                  onClick={() => setSelectedDonutStatus(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


     {selectedProjectMonth && (
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
          onClick={() => setSelectedProjectMonth(null)}
        >
          <div
            className="modal-dialog "
            style={{ maxWidth: "650px", width: "95%" , marginTop:"40px"}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content"
             style={{
              maxHeight: "75vh",     
              display: "flex",
              flexDirection: "column",
            }}>
              <div
                className="modal-header text-white"
                style={{ background: "#3A5FBE" }}
              >
                <h5 className="modal-title">
                  Projects – {selectedProjectMonth}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedProjectMonth(null)}
                />
              </div>

              <div className="modal-body">
                {["In Progress", "Completed", "Delayed", "Cancelled"].map(
                  (status) => (
                    <div key={status} className="mb-4">
                      <h6 style={{ color: STATUS_COLORS[status] }}>
                        {status} ({linePopupProjects[status]?.length || 0})
                      </h6>

                      {linePopupProjects[status]?.length ? (
                        linePopupProjects[status].map((p) => (
                          <div key={p._id} className="border rounded p-2 mb-2">
                            <div className="row mb-1">
                              <div className="col-4 fw-semibold">
                                Project Name
                              </div>
                              <div className="col-8">{p.name}</div>
                            </div>

                            <div className="row mb-1">
                              <div className="col-4 fw-semibold">
                                Assigned To
                              </div>
                              <div className="col-8">
                                {p.managers?.map((m) => m.name).join(", ") ||
                                  "N/A"}
                              </div>
                            </div>

                            <div className="row mb-1">
                              <div className="col-4 fw-semibold">
                                Start Date
                              </div>
                              <div className="col-8">
                                {p.startDate ? formatDate(p.startDate) : "—"}
                              </div>
                            </div>

                            <div className="row mb-1">
                              <div className="col-4 fw-semibold">Due Date</div>
                              <div className="col-8">
                                {p.dueDate ? formatDate(p.dueDate) : "—"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted">No projects</div>
                      )}
                    </div>
                  ),
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn" style={{ minWidth: 90 }}
                  onClick={() => setSelectedProjectMonth(null)}
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
}

export default HRReportTMS;
