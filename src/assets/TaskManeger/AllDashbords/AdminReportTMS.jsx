import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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

const STATUS_COLORS = {
  Completed: "#16a34a",
  "In Progress": "#0d6efd",
  Delayed: "#dc3545",
  Assigned: "#fd7e14",
};

const DASHBOARD_CARD_BG = "#fff";
const DASHBOARD_CARD_TEXT = "#3A5FBE";
const DASHBOARD_CARD_HOVER = "rgba(58, 95, 190, 0.08)";

function PaginationFooter({
  totalItems,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const from = totalItems === 0 ? 0 : indexOfFirstItem + 1;
  const to = Math.min(indexOfLastItem, totalItems);

  const goTo = (p) => setCurrentPage(Math.min(Math.max(p, 1), totalPages));
  // gitanjali
  const downloadEmployeesExcel = (data, fileName = "Employees_Report") => {
    if (!data || !data.length) {
      alert("No data available to download");
      return;
    }

    const excelData = data.map((emp, index) => ({
      "Sr No": index + 1,
      Name: emp.name || "-",
      Role: emp.role || "-",
      Designation: emp.designation || "-",
      Department: emp.department || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  };

  const downloadDelayedProjectsExcel = (
    data,
    fileName = "Delayed_Projects",
  ) => {
    if (!data || !data.length) {
      alert("No delayed projects available");
      return;
    }

    const excelData = data.map((p, index) => ({
      "Sr No": index + 1,
      "Project Name": p.name || "-",
      Status: p.status?.name || "Delayed",
      "Delivery Date": p.dueDate
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(p.dueDate))
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Delayed Projects");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  };

  const downloadDeliverableProjectsExcel = (
    data,
    fileName = "Deliverable_Projects_Next_7_Days",
  ) => {
    if (!data || !data.length) {
      alert("No deliverable projects available");
      return;
    }

    const excelData = data.map((p, index) => ({
      "Sr No": index + 1,
      "Project Name": p.name || "-",
      Status: p.status?.name || "-",
      "Start Date": p.startDate
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(p.startDate))
        : "-",
      "Delivery Date": p.dueDate
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(p.dueDate))
        : "-",
      "End Date": p.endDate
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(p.endDate))
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Deliverable Projects");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  };

  const downloadDeliverableTasksExcel = (
    data,
    fileName = "Deliverable_Tasks_Next_7_Days",
  ) => {
    if (!data || !data.length) {
      alert("No deliverable tasks available");
      return;
    }

    const excelData = data.map((t, index) => ({
      "Sr No": index + 1,
      "Task Name": t.taskName || "-",
      "Employee Name": t.assignedTo?.name || "Not Assigned",
      "Task Status": t.status?.name || "-",
      "Assigned Date": t.dateOfTaskAssignment
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(t.dateOfTaskAssignment))
        : "-",
      "Expected Completion Date": t.dateOfExpectedCompletion
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(t.dateOfExpectedCompletion))
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Deliverable Tasks");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  };

  return (
    <div className="d-flex align-items-center gap-3 text-muted">
      <div className="d-flex align-items-center">
        <span style={{ fontSize: "14px", marginRight: "8px" }}>
          Rows per page:
        </span>
        <select
          className="form-select form-select-sm"
          style={{ width: "auto" }}
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

      <span style={{ fontSize: "14px" }}>
        {from}-{to} of {totalItems}
      </span>

      <div>
        <button
          className="btn btn-sm"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1 || totalItems === 0}
          type="button"
        >
          ‹
        </button>
        <button
          className="btn btn-sm"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages || totalItems === 0}
          type="button"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function AdminReportTMS() {
  const [employeeViewStart, setEmployeeViewStart] = useState("");
  const [employeeViewEnd, setEmployeeViewEnd] = useState("");
  const [allEmployees, setAllEmployees] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  // const [search, setSearch] = useState("");

  //  const [searchInput, setSearchInput] = useState("");
  //const [searchText, setSearchText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDeliverableProjects, setSelectedDeliverableProjects] =
    useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectRange, setProjectRange] = useState("all");
  //const [allTasks, setAllTasks] = useState([]);
  const [selectedTaskMonth, setSelectedTaskMonth] = useState("all");
  //shivani
  const [selectedDonutStatus, setSelectedDonutStatus] = useState(null); //15 jan---
  const [donutPopupTasks, setDonutPopupTasks] = useState([]); //15 jan---
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  //const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [selectedProjectMonth, setSelectedProjectMonth] = useState(null);
  const [linePopupProjects, setLinePopupProjects] = useState({
    Assigned: [],
    Completed: [],
    Delayed: [],
  });
  const totalProjects = projects.length;

  const TASK_COLORS = {
    Completed: "#198754",
    Assigned: "#3A5FBE",
    "Assignment Pending": "#ffc107",
    "In Progress": "#0d6efd",
    Hold: "#6c757d",
    Cancelled: "#adb5bd",
    Delayed: "#dc3545",
  };

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

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await axios.get("http://localhost:8000/task/getall");
      setAllTasks(res.data || []);
    };

    fetchTasks();
  }, []);

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

  const getLatestMonthDate = (projects) => {
    return projects.reduce((latest, p) => {
      const status = p.status?.name?.toLowerCase();

      let dateStr = null;

      if (status === "assigned") {
        dateStr = p.startDate;
      } else if (status === "completed" || status === "delayed") {
        dateStr = p.dueDate;
      }

      if (!dateStr) return latest;

      const date = new Date(dateStr);
      if (isNaN(date)) return latest;

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

    const statusKeyMap = {
      assigned: "Assigned",
      completed: "Completed",
      delayed: "Delayed",
    };

    // ✅ Generate months FIRST
    const baseMonths =
      projectRange === "all"
        ? getLastMonths(projects, 12)
        : getLastMonths(projects, projectRange);

    const monthMap = {};
    baseMonths.forEach((m) => {
      monthMap[m.key] = m;
    });

    // ✅ Fill data
    projects.forEach((project) => {
      const rawStatus = project.status?.name?.toLowerCase();
      const statusName = statusKeyMap[rawStatus];
      if (!statusName) return;

      let dateToUse = null;

      if (statusName === "Assigned") {
        dateToUse = project.startDate || project.createdAt;
      } else {
        dateToUse = project.dueDate;
      }

      if (!dateToUse) return;

      const d = new Date(dateToUse);
      if (isNaN(d)) return;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[key]) return;

      monthMap[key][statusName]++;
    });

    return Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
  }, [projects, projectRange]);

  async function fetchEmployees() {
    try {
      const token = localStorage.getItem("accessToken");
      console.log("token", token);
      const EmpResponse = await axios.get(
        "http://localhost:8000/getAllEmployees",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const projectResponse = await axios.get(
        "http://localhost:8000/api/projects/",
      );
      const taskResponse = await axios.get("http://localhost:8000/task/getall");
      const tasks = taskResponse.data.map(
        ({ _id, taskName, assignedTo, dateOfExpectedCompletion }) => ({
          _id,
          taskName,
          assignedTo,
          dateOfExpectedCompletion,
        }),
      );
      const projects = projectResponse.data.map(
        ({ _id, status, name, endDate, dueDate }) => ({
          _id,
          name,
          status,
          dueDate,
          endDate,
        }),
      );
      const employees = EmpResponse.data.map(
        ({ _id, name, role, department, designation }) => ({
          _id,
          name,
          role,
          department,
          designation,
        }),
      );
      setAllEmployees(employees);
      setAllProjects(projects);
      // setAllTasks(tasks);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }
  useEffect(() => {
    fetchEmployees();
  }, []);
  console.log("all employees", allEmployees);
  const [showCardList, setShowCardList] = useState("null");

  // const activeProjects = useMemo(() => allProjects.filter((p) => p.status === "Active"), []);
  // const delayedProjects = useMemo(() => activeProjects.filter((p) => p.isDelayed), [activeProjects]);
  const activeProjects = allProjects;
  // const delayedProjects = useMemo(() => activeProjects.filter(p => p.status?.name === "Delayed"), [activeProjects]);
  const delayedProjects = useMemo(() => {
    return activeProjects.filter((p) => p.status?.name === "Delayed");
  }, [activeProjects]);

  //added harshada

  const filteredDelayedProjects = useMemo(() => {
    if (!searchQuery) return delayedProjects;

    const q = searchQuery.toLowerCase();
    return delayedProjects.filter((p) => p.name?.toLowerCase().includes(q));
  }, [delayedProjects, searchQuery]);

  const nextWeekRange = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const toISO = (d) => d.toISOString().slice(0, 10);
    console.log(" start:", toISO(today));
    console.log("end", toISO(nextWeek));
    return { start: toISO(today), end: toISO(nextWeek) };
  }, []);
  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

  const deliverableProjectsNextWeek = useMemo(() => {
    const { start, end } = nextWeekRange;
    const toISO = (date) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };
    const filteredProjects = activeProjects.filter((p) => {
      const due = toISO(p.dueDate);
      return due >= start && due <= end;
    });

    return filteredProjects;
  }, [activeProjects, nextWeekRange]);

  //added harshada
  const filteredDeliverableProjects = useMemo(() => {
    if (!searchQuery) return deliverableProjectsNextWeek;

    const q = searchQuery.toLowerCase();
    return deliverableProjectsNextWeek.filter((p) =>
      p.name?.toLowerCase().includes(q),
    );
  }, [deliverableProjectsNextWeek, searchQuery]);

  const deliverableTasksNextWeek = useMemo(() => {
    const { start, end } = nextWeekRange;
    const toISO = (date) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };
    const filteredTasks = allTasks.filter((t) => {
      const due = toISO(t.dateOfExpectedCompletion);
      return due >= start && due <= end;
    });
    console.log("filteredTasks", filteredTasks);
    return filteredTasks;
  }, [allTasks, nextWeekRange]);

  //added harshada
  const filteredDeliverableTasks = useMemo(() => {
    if (!searchQuery) return deliverableTasksNextWeek;

    const q = searchQuery.toLowerCase();
    return deliverableTasksNextWeek.filter(
      (t) =>
        t.taskName?.toLowerCase().includes(q) ||
        t.assignedTo?.name?.toLowerCase().includes(q),
    );
  }, [deliverableTasksNextWeek, searchQuery]);

  const filteredEmployeeTasks = useMemo(() => {
    if (!selectedEmployee) return [];
    return MOCK_TASKS.filter((t) => {
      if (t.employeeId !== selectedEmployee.id) return false;
      if (employeeViewStart && t.dueDate < employeeViewStart) return false;
      if (employeeViewEnd && t.dueDate > employeeViewEnd) return false;
      return true;
    });
  }, [selectedEmployee, employeeViewStart, employeeViewEnd]);

  const statusAnalytics = useMemo(() => {
    const total = filteredEmployeeTasks.length;
    if (!total) return [];
    const counts = filteredEmployeeTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([status, count]) => ({
      status,
      percent: Math.round((count / total) * 100),
    }));
  }, [filteredEmployeeTasks]);

  //Shivani
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

  // ===== Pagination states =====
  const [empPage, setEmpPage] = useState(1);
  const [empRows, setEmpRows] = useState(5);

  const [delayedPage, setDelayedPage] = useState(1);
  const [delayedRows, setDelayedRows] = useState(5);

  const [deliverProjPage, setDeliverProjPage] = useState(1);
  const [deliverProjRows, setDeliverProjRows] = useState(5);

  const [deliverTaskPage, setDeliverTaskPage] = useState(1);
  const [deliverTaskRows, setDeliverTaskRows] = useState(5);

  const [empTaskPage, setEmpTaskPage] = useState(1);
  const [empTaskRows, setEmpTaskRows] = useState(5);
  const capitalizeFirst = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  // Optional resets (only pagination-related)
  useEffect(() => {
    if (showCardList === "allEmployees") setEmpPage(1);
    if (showCardList === "delayedProjects") setDelayedPage(1);
    if (showCardList === "deliverableProjects") setDeliverProjPage(1);
    if (showCardList === "deliverableTasks") setDeliverTaskPage(1);
  }, [showCardList]);

  useEffect(() => {
    setEmpTaskPage(1);
  }, [selectedEmployee, employeeViewStart, employeeViewEnd]);

  // ===== Paginated arrays =====
  // const paginatedEmployees = useMemo(() => {
  //   const start = (empPage - 1) * empRows;
  //   return allEmployees.slice(start, start + empRows);
  // }, [empPage, empRows, allEmployees]);
  // console.log("paginated Employees",paginatedEmployees)

  //added harshada
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return allEmployees;

    const q = searchQuery.toLowerCase();
    return allEmployees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q),
    );
  }, [allEmployees, searchQuery]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empRows;
    return filteredEmployees.slice(start, start + empRows);
  }, [filteredEmployees, empPage, empRows]);

  //   const paginatedDelayedProjects = useMemo(() => {
  //     const start = (delayedPage - 1) * delayedRows;
  //     return delayedProjects.slice(start, start + delayedRows);
  //   }, [delayedPage, delayedRows, delayedProjects]);
  //  console.log("paginatedDelayedProjects",paginatedDelayedProjects)
  //added harshada
  const paginatedDelayedProjects = useMemo(() => {
    const start = (delayedPage - 1) * delayedRows;
    return filteredDelayedProjects.slice(start, start + delayedRows);
  }, [delayedPage, delayedRows, filteredDelayedProjects]);

  // const paginatedDeliverableProjects = useMemo(() => {
  //   const start = (deliverProjPage - 1) * deliverProjRows;
  //   return deliverableProjectsNextWeek.slice(start, start + deliverProjRows);
  // }, [deliverProjPage, deliverProjRows, deliverableProjectsNextWeek]);

  //added harshada
  const paginatedDeliverableProjects = useMemo(() => {
    const start = (deliverProjPage - 1) * deliverProjRows;
    return filteredDeliverableProjects.slice(start, start + deliverProjRows);
  }, [deliverProjPage, deliverProjRows, filteredDeliverableProjects]);

  // const paginatedDeliverableTasks = useMemo(() => {
  //   const start = (deliverTaskPage - 1) * deliverTaskRows;
  //   return deliverableTasksNextWeek.slice(start, start + deliverTaskRows);
  // }, [deliverTaskPage, deliverTaskRows, deliverableTasksNextWeek]);
  //  console.log("paginatedDeliverableTasks",paginatedDeliverableTasks )

  //added harshada
  const paginatedDeliverableTasks = useMemo(() => {
    const start = (deliverTaskPage - 1) * deliverTaskRows;
    return filteredDeliverableTasks.slice(start, start + deliverTaskRows);
  }, [deliverTaskPage, deliverTaskRows, filteredDeliverableTasks]);

  const paginatedEmployeeTasks = useMemo(() => {
    const start = (empTaskPage - 1) * empTaskRows;
    return filteredEmployeeTasks.slice(start, start + empTaskRows);
  }, [empTaskPage, empTaskRows, filteredEmployeeTasks]);

  const headTh = {
    fontWeight: 500,
    fontSize: 14,
    color: "#6c757d",
    borderBottom: "2px solid #dee2e6",
    padding: 12,
    whiteSpace: "nowrap",
  };

  const cellTd = {
    padding: 12,
    verticalAlign: "middle",
    fontSize: 14,
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  };

  console.log("selectedDeliverableProjects =>", selectedDeliverableProjects);

  return (
    <div className="container-fluid ">
      <h2 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>Reports</h2>

      {/* Top cards row */}
      <div className="row g-3 mb-4">
        {/* All Employees */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{
              cursor: "pointer",
              backgroundColor:
                hoveredCard === "employees"
                  ? DASHBOARD_CARD_HOVER
                  : DASHBOARD_CARD_BG,
              border: "1px solid rgba(58, 95, 190, 0.15)",
              transition: "all 0.18s ease-in-out",
            }}
            // onMouseEnter = {() => setHoveredCard("employees")}
            // onMouseLeave = {() => setHoveredCard(null)}

            onClick={() => {
              setSelectedEmployee(null);
              setShowCardList("allEmployees");
            }}
          >
            <div className="card-body">
              <div
                className="mb-1 fw-semibold"
                style={{ fontSize: "16px", color: DASHBOARD_CARD_TEXT }}
              >
                All Employees
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div
                    className="h4 mb-0 "
                    style={{ color: DASHBOARD_CARD_TEXT }}
                  >
                    {allEmployees.length}
                  </div>
                  <small style={{ color: "rgba(58, 95, 190, 0.7)" }}>
                    Click to view list
                  </small>
                </div>

                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontSize: 18,
                  }}
                >
                  👥
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delayed Projects */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{
              cursor: "pointer",
              backgroundColor:
                hoveredCard === "delayedProjects"
                  ? DASHBOARD_CARD_HOVER
                  : DASHBOARD_CARD_BG,
              border: "1px solid rgba(58, 95, 190, 0.15)",
              transition: "all 0.18s ease-in-out",
            }}
            onClick={() => setShowCardList("delayedProjects")}
          >
            <div className="card-body">
              <div
                className="mb-1 fw-semibold"
                style={{ fontSize: "16px", color: DASHBOARD_CARD_TEXT }}
              >
                Delayed Projects
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div
                    className="h4 mb-0"
                    style={{ color: DASHBOARD_CARD_TEXT }}
                  >
                    {delayedProjects.length}
                  </div>
                  <small style={{ color: "rgba(58, 95, 190, 0.7)" }}>
                    Out of {activeProjects.length} active
                  </small>
                </div>

                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontSize: 18,
                  }}
                >
                  !
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverable Projects */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{
              cursor: "pointer",
              backgroundColor:
                hoveredCard === "deliverableProjects"
                  ? DASHBOARD_CARD_HOVER
                  : DASHBOARD_CARD_BG,
              border: "1px solid rgba(58, 95, 190, 0.15)",
              transition: "all 0.18s ease-in-out",
            }}
            onClick={() => setShowCardList("deliverableProjects")}
          >
            <div className="card-body">
              <div
                className="mb-1 fw-semibold"
                style={{ fontSize: "16px", color: DASHBOARD_CARD_TEXT }}
              >
                Deliverable Projects (Next 7 days)
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div
                    className="h4 mb-0"
                    style={{ color: DASHBOARD_CARD_TEXT }}
                  >
                    {deliverableProjectsNextWeek.length}
                  </div>
                  <small style={{ color: "rgba(58, 95, 190, 0.7)" }}>
                    Click to view list
                  </small>
                </div>

                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontSize: 18,
                  }}
                >
                  📁
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverable Tasks */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{
              cursor: "pointer",
              backgroundColor:
                hoveredCard === "employees"
                  ? DASHBOARD_CARD_HOVER
                  : DASHBOARD_CARD_BG,
              border: "1px solid rgba(58, 95, 190, 0.15)",
              transition: "all 0.18s ease-in-out",
            }}
            onClick={() => setShowCardList("deliverableTasks")}
          >
            <div className="card-body">
              <div
                className="mb-1 fw-semibold"
                style={{ fontSize: "16px", color: DASHBOARD_CARD_TEXT }}
              >
                Deliverable Tasks (Next 7 days)
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div
                    className="h4 mb-0"
                    style={{ color: DASHBOARD_CARD_TEXT }}
                  >
                    {deliverableTasksNextWeek.length}
                  </div>
                  <small style={{ color: "rgba(58, 95, 190, 0.7)" }}>
                    Click to view list
                  </small>
                </div>

                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontSize: 18,
                  }}
                >
                  ✅
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* //added  harshada */}
      {/* Search Filter */}
      <div className="card bg-white shadow-sm p-3 mb-4 border-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <div className="d-flex align-items-center me-3 mb-2">
            <label
              className="me-3 fw-bold mb-0"
              style={{ color: "#3A5FBE", fontSize: "16px" }}
            >
              Search
            </label>

            <input
              type="text"
              placeholder="Search any filed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-sm custom-outline-btn">Search</button>

            <button
              className="btn btn-sm custom-outline-btn"
              onClick={() => {
                setSearchQuery("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Card click detail lists */}
      {showCardList === "allEmployees" && (
        <>
          <div className="card shadow-sm border-0 mb-0">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                All Employees
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    downloadEmployeesExcel(filteredEmployees, "All_Employees")
                  }
                >
                  Download Excel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowCardList(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body p-0 table-responsive bg-white">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th style={headTh}>Name</th>
                    <th style={headTh}>Role</th>
                    <th style={headTh}>Designation</th>
                    <th style={headTh}>Department</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{emp.designation}</td>
                      <td>{emp.department}</td>
                    </tr>
                  ))}

                  {allEmployees.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-muted">
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={allEmployees.length}
              currentPage={empPage}
              itemsPerPage={empRows}
              setCurrentPage={setEmpPage}
              setItemsPerPage={setEmpRows}
            />
          </div>
        </>
      )}

      {showCardList === "delayedProjects" && !selectedEmployee && (
        <>
          <div className="card shadow-sm border-0 mb-0">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                Delayed Projects
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    downloadDelayedProjectsExcel(
                      filteredDelayedProjects, // 🔑 all delayed projects
                      "Delayed_Projects",
                    )
                  }
                >
                  Download Excel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  type="button"
                  onClick={() => setShowCardList(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body p-0 table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={headTh}>Name</th>
                    <th style={headTh}>Delivery Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDelayedProjects.map((p) => (
                    <tr
                      key={p._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedProject(p)} // ✅ THIS LINE
                    >
                      <td style={cellTd}>{p.name}</td>
                      <td style={cellTd}>{formatDate(p.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={delayedProjects.length}
              currentPage={delayedPage}
              itemsPerPage={delayedRows}
              setCurrentPage={setDelayedPage}
              setItemsPerPage={setDelayedRows}
            />
          </div>
        </>
      )}

      {showCardList === "deliverableProjects" && !selectedEmployee && (
        <>
          <div className="card shadow-sm border-0 mb-0">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                Deliverable Projects (Next 7 days)
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    downloadDeliverableProjectsExcel(
                      filteredDeliverableProjects, // 🔑 search applied data
                      "Deliverable_Projects_Next_7_Days",
                    )
                  }
                >
                  Download Excel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  type="button"
                  onClick={() => setShowCardList(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body p-0 table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={headTh}>Name</th>
                    <th style={headTh}>Delivery Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliverableProjects.map((p) => (
                    <tr
                      key={p._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedDeliverableProjects(p)}
                    >
                      <td style={cellTd}>{p.name}</td>
                      <td style={cellTd}>{formatDate(p.dueDate)}</td>
                    </tr>
                  ))}
                  {deliverableProjectsNextWeek.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-3 text-muted">
                        No projects due in next 7 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={deliverableProjectsNextWeek.length}
              currentPage={deliverProjPage}
              itemsPerPage={deliverProjRows}
              setCurrentPage={setDeliverProjPage}
              setItemsPerPage={setDeliverProjRows}
            />
          </div>
        </>
      )}

      {showCardList === "deliverableTasks" && !selectedEmployee && (
        <>
          <div className="card shadow-sm border-0 mb-0">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                Deliverable Tasks (Next 7 days)
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() =>
                    downloadDeliverableTasksExcel(
                      filteredDeliverableTasks,
                      "Deliverable_Tasks_Next_7_Days",
                    )
                  }
                >
                  Download Excel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  type="button"
                  onClick={() => setShowCardList(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body p-0 table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={headTh}>Task</th>
                    <th style={headTh}>Employee</th>
                    <th style={headTh}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliverableTasks.map((t) => (
                    <tr
                      key={t._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedTask(t)} // ✅ CLICK HANDLER
                    >
                      <td style={cellTd}>{t.taskName}</td>
                      <td style={cellTd}>
                        {t.assignedTo?.name || "Not Assigned"}
                      </td>
                      <td style={cellTd}>
                        {formatDate(t.dateOfExpectedCompletion)}
                      </td>
                    </tr>
                  ))}

                  {deliverableTasksNextWeek.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-muted">
                        No tasks due in next 7 days.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={deliverableTasksNextWeek.length}
              currentPage={deliverTaskPage}
              itemsPerPage={deliverTaskRows}
              setCurrentPage={setDeliverTaskPage}
              setItemsPerPage={setDeliverTaskRows}
            />
          </div>
        </>
      )}

      <div className="row g-4 mt-4 align-items-stretch">
        <div className="col-lg-4 col-md-5">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body d-flex flex-column justify-content-center">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0 text-primary">
                  📊 Task Status Overview
                </h6>

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
                    onMouseEnter={() => setIsTooltipActive(true)} // add below all line 15 jan-----------------
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
                    y="58%"
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
                    active={isTooltipActive} //16 jan  --------------------------------
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

        <div className="col-lg-8 col-md-7">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold text-primary mb-0">
                  📈 Project Status Trend
                </h6>
                <small className="text-muted">Month-wise overview</small>

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
                  <Legend iconType="circle" />

                  <Line
                    dataKey="Assigned"
                    stroke="#0d6efd"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="Completed"
                    stroke="#198754"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="Delayed"
                    stroke="#dc3545"
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

      {/* shivani? */}
      {selectedDonutStatus && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          onClick={() => {
            setSelectedDonutStatus(null);
            setHideDonutTooltip(false);
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
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
                  className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}
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
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setSelectedProjectMonth(null)}
        >
          <div
            className="modal-dialog modal-lg "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
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
                {["Completed", "Assigned", "Delayed"].map((status) => (
                  <div key={status} className="mb-4">
                    <h6 style={{ color: STATUS_COLORS[status] }}>
                      {status} ({linePopupProjects[status].length})
                    </h6>

                    {linePopupProjects[status].length ? (
                      linePopupProjects[status].map((p) => (
                        <div key={p._id} className="border rounded p-2 mb-2">
                          <div className="row mb-1">
                            <div className="col-4 fw-semibold">
                              Project Name
                            </div>
                            <div className="col-8">{p.name}</div>
                          </div>

                          <div className="row mb-1">
                            <div className="col-4 fw-semibold">Assigned To</div>
                            <div className="col-8">
                              {p.managers?.map((m) => m.name).join(", ") ||
                                "N/A"}
                            </div>
                          </div>

                          <div className="row mb-1">
                            <div className="col-4 fw-semibold">Start Date</div>
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
                ))}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}
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

      {selectedEmployee && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: "650px",
              width: "95%",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Employee Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  sty
                  onClick={() => setSelectedEmployee(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Name</div>
                  <div className="col-8">{selectedEmployee?.name}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Role</div>
                  <div className="col-8">{selectedEmployee?.role}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Designation</div>
                  <div className="col-8">{selectedEmployee?.designation}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Department</div>
                  <div className="col-8">{selectedEmployee?.department}</div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setSelectedEmployee(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            //pointerEvents: "none",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: "600px",
              width: "95%",
              // pointerEvents: "auto",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Delayed Project Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedProject(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Project Name</div>
                  <div className="col-8">{selectedProject?.name}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Delivery Date</div>
                  <div className="col-8">
                    {formatDate(selectedProject?.dueDate)}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            //pointerEvents: "none",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered "
            style={{
              maxWidth: "600px",
              width: "95%",
              //  pointerEvents: "auto",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Deliverable Task Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedTask(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Task Name</div>
                  <div className="col-8">{selectedTask.taskName}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Assigned To</div>
                  <div className="col-8">
                    {selectedTask.assignedTo?.name || "Not Assigned"}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Due Date</div>
                  <div className="col-8">
                    {formatDate(selectedTask.dateOfExpectedCompletion)}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeliverableProjects && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            //pointerEvents: "none",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{
              maxWidth: "600px",
              width: "95%",
              // pointerEvents: "auto",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Deliverable project Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedDeliverableProjects(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 fw-semibold"> Name</div>
                  <div className="col-8">
                    {selectedDeliverableProjects?.name}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-4 fw-semibold">Date</div>
                  <div className="col-8">
                    {selectedDeliverableProjects?.dueDate
                      ? formatDate(selectedDeliverableProjects.dueDate)
                      : "-"}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setSelectedTask(null)}
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

export default AdminReportTMS;
