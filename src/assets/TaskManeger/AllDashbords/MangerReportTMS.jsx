import React, { useEffect, useMemo, useState, useRef } from "react";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalize = (value) => {
  if (!value) return "";
  return value.toString().toLowerCase();
};

// const handleClose = () => {
//   setShowCardList(null); // hide card list
//   setShowFilter(false); // hide filter
// };

//focus pop-up - MOVED INSIDE TableRowModal
function TableRowModal({ show, onClose, title, fields }) {
  const popupRef = useRef(null);

  useEffect(() => {
    if (show && popupRef.current) {
      popupRef.current.focus();
    }
  }, [show]);

  const trapFocus = (e) => {
    if (!popupRef.current) return;

    const focusableElements = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

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

  if (!show) return null;

 return (
    <div
      ref={popupRef}
      tabIndex="0"
      onKeyDown={trapFocus}
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
      onClick={onClose}
    >
      <div
        className="modal-dialog "
        style={{ maxWidth: "650px", width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {/* HEADER */}
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#3A5FBE" }}
          >
            <h5 className="modal-title mb-0">{title}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          {/* BODY */}
          <div className="modal-body">
            <div className="container-fluid">
            {fields.map(({ label, value }) => (
              <div className="row mb-2" key={label}>
                <div className="col-5 col-sm-3 fw-semibold">{label}</div>
                <div className="col-7 col-sm-8">{value || "-"}</div>
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-sm custom-outline-btn"  
            style={{ minWidth: 90 }} 
            onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );/////added by shivani 28-01-2026
  //   <div
  //     ref={popupRef}
  //     tabIndex="-1"
  //     onKeyDown={trapFocus}
  //     className="modal fade show"
  //     style={{
  //       display: "block",
  //       position: "fixed",
  //       inset: 0,
  //       zIndex: 1050,
  //       backgroundColor: "rgba(0, 0, 0, 0.5)",
  //     }}
  //     onClick={onClose}
  //   >
  //     <div
  //       className="modal-dialog modal-dialog-centered"
  //       style={{ maxWidth: "650px", width: "95%" }}
  //       onClick={(e) => e.stopPropagation()}
  //     >
  //       <div className="modal-content">
  //         {/* HEADER */}
  //         <div
  //           className="modal-header text-white"
  //           style={{ backgroundColor: "#3A5FBE" }}
  //         >
  //           <h5 className="modal-title mb-0">{title}</h5>
  //           <button
  //             type="button"
  //             className="btn-close btn-close-white"
  //             onClick={onClose}
  //           />
  //         </div>

  //         {/* BODY */}
  //         <div className="modal-body">
  //           {fields.map(({ label, value }) => (
  //             <div className="row mb-2" key={label}>
  //               <div className="col-4 fw-semibold">{label}</div>
  //               <div className="col-8">{value || "-"}</div>
  //             </div>
  //           ))}
  //         </div>

  //         {/* FOOTER */}
  //         <div className="modal-footer">
  //           <button className="btn btn-sm custom-outline-btn" onClick={onClose}>
  //             Close
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
// Mock data
const MOCK_TEAM_EMPLOYEES = [
  { id: 1, name: "Dipali", role: "Developer", managerId: 1 },
  { id: 2, name: "Harshda", role: "QA Engineer", managerId: 1 },
  { id: 3, name: "Adesh", role: "Junior Developer", managerId: 1 },
];

const DASHBOARD_CARD_BG = "#fff";
const DASHBOARD_CARD_TEXT = "#3A5FBE";
const DASHBOARD_CARD_HOVER = "rgba(58, 95, 190, 0.08)";

// Reusable footer (same design everywhere)
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

  const isPrevDisabled = currentPage <= 1 || totalItems === 0;
  const isNextDisabled = currentPage >= totalPages || totalItems === 0;

  return (
    <nav
      className="d-flex align-items-center justify-content-end text-muted"
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
          {from}-{to} of {totalItems}
        </span>

        <div
          className="d-flex align-items-center"
          style={{ marginLeft: "16px" }}
        >
          <button
            className="btn btn-sm focus-ring "
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={isPrevDisabled}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              fontSize: "18px",
              padding: "2px 8px",
              color: isPrevDisabled ? "#c0c4cc" : "#212529",
            }}
            aria-label="Previous page"
          >
            ‹
          </button>

          <button
            className="btn btn-sm focus-ring "
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={isNextDisabled}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              fontSize: "18px",
              padding: "2px 8px",
              color: isNextDisabled ? "#c0c4cc" : "#212529",
            }}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </nav>
  );
}

function ManagerReportTMS({ user }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  // const [showCardList, setShowCardList] = useState(null);
  //added by harshda
  const [showCardList, setShowCardList] = useState(null);

  const [teamEmployees, setTeamEmployees] = useState([]);
  const [employeesTasks, setEmployeesTasks] = useState([]);
  const [managerProjects, setManagerProjects] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [monthRange, setMonthRange] = useState(0);
  const [selectedTaskMonth, setSelectedTaskMonth] = useState("all");
  //shivani
  const [selectedDonutStatus, setSelectedDonutStatus] = useState(null);
  const [donutPopupTasks, setDonutPopupTasks] = useState([]);
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [selectedProjectMonth, setSelectedProjectMonth] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const totalProjects = projects.length;
  //popup
  const [showRowModal, setShowRowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalFields, setModalFields] = useState([]);
  const [linePopupProjects, setLinePopupProjects] = useState({
    Assigned: [],
    Completed: [],
    Delayed: [],
  });
  const isMainCardView = selectedEmployee === null;
  //added by harshda
  const handleClose = () => {
    setShowCardList(null);
    setShowFilter(false);
    setSelectedEmployee(null); // Reset employee selection when closing
  };

  const TASK_COLORS = {
    Completed: "#198754",
    Assigned: "#3A5FBE",
    "Assignment Pending": "#ffc107",
    "In Progress": "#0d6efd",
    Hold: "#fd7e14",
    Cancelled: "#adb5bd",
    Delayed: "#dc3545",
  };

  const STATUS_COLORS = {
    Assigned: "#0d6efd",
    Completed: "#198754",
    Delayed: "#dc3545",
  };

  //shivani
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
    today.setHours(0, 0, 0, 0);

    const result = {
      "In Progress": [],
      Completed: [],
      Delayed: [],
      Cancelled: [],
    };

    projects.forEach((p) => {
      const status =
        typeof p.status === "string"
          ? p.status.toLowerCase()
          : p.status?.name?.toLowerCase();

      if (!status) return;

      //  completed / cancelled
      if (status === "completed") {
        const d = p.deliveryDate || p.dueDate;
        if (!d) return;

        const date = new Date(d);
        if (date.getMonth() === month && date.getFullYear() === year) {
          result.Completed.push(p);
        }
        return;
      }

      if (status === "cancelled") {
        const d = p.dueDate;
        if (!d) return;

        const date = new Date(d);
        if (date.getMonth() === month && date.getFullYear() === year) {
          result.Cancelled.push(p);
        }
        return;
      }

      //  exclude upcoming project
      if (status === "upcoming project") return;

      if (!p.dueDate) return;

      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate.getMonth() !== month || dueDate.getFullYear() !== year)
        return;

      //  DELAYED
      if (dueDate < today) {
        result.Delayed.push(p);
        result["In Progress"].push(p); // Delayed ⊂ In Progress
        return;
      }

      //  ON TRACK (today or future)
      if (dueDate >= today) {
        result["In Progress"].push(p);
      }
    });

    return result;
  };

  const extractManagerIds = (managers) => {
    if (!Array.isArray(managers)) return [];
    return managers.map((m) => (typeof m === "string" ? m : m?._id || m?.id));
  };

  const getManagerNames = (managers) => {
    if (!Array.isArray(managers)) return [];
    const ids = [...new Set(extractManagerIds(managers))];

    return ids
      .map((id) => managerList.find((m) => m._id === id)?.name)
      .filter(Boolean);
  };
  const [managerList, setManagerList] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/managers/list")
      .then((res) => setManagerList(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  //End shivani

  const taskMonthOptions = useMemo(() => {
    const months = [];
    const today = new Date();

    // 1 future month + current + 4 past = 6 months
    for (let i = 1; i >= -4; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);

      months.push({
        label: d.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
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
            const dateStr = task.dateOfTaskAssignment; // ✅ FIX
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

  const TaskStatusTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const statusName = payload[0].name;

    const filteredTasks = allTasks.filter((task) => {
      const statusMatch =
        task?.status?.name?.trim().toLowerCase() ===
        statusName.trim().toLowerCase();

      if (!statusMatch) return false;

      //  month filter
      if (selectedTaskMonth === "all") return true;

      const dateStr = task.dateOfTaskAssignment;
      if (!dateStr) return false;

      const d = new Date(dateStr);
      if (isNaN(d)) return false;

      const taskMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      return taskMonth === selectedTaskMonth;
    });

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

  const getLatestMonthDate = (projects) => {
    return projects.reduce((latest, p) => {
      const status = p.status?.name?.toLowerCase();

      let dateForMonth = null;
      if (status === "completed") {
        dateForMonth = p.deliveryDate || p.dueDate;
      } else {
        dateForMonth = p.dueDate;
      }

      const d = dateForMonth ? new Date(dateForMonth) : null;
      if (!d || isNaN(d)) return latest;

      return !latest || d > latest ? d : latest;
    }, null);
  };

  const getProjectMonthDate = (project) => {
    const status = project.status?.name?.toLowerCase();

    if (status === "completed") {
      return project.deliveryDate
        ? new Date(project.deliveryDate)
        : project.dueDate
          ? new Date(project.dueDate)
          : null;
    }

    return project.dueDate ? new Date(project.dueDate) : null;
  };
  const getLastMonths = (projects, range) => {
    const latest = getLatestMonthDate(projects);
    if (!latest) return [];

    const total = !range || range === 0 ? 12 : Number(range);
    const months = [];

    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(latest.getFullYear(), latest.getMonth() - i, 1);

      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: d.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        sortDate: d,
        "In Progress": 0,
        Completed: 0,
        Delayed: 0,
        Cancelled: 0,
      });
    }

    return months;
  };
  const projectStatusLineData = useMemo(() => {
    if (!projects.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const months = getLastMonths(projects, monthRange);

    const monthMap = {};
    months.forEach((m) => {
      monthMap[m.key] = {
        ...m,
        "In Progress": 0,
        Completed: 0,
        Delayed: 0,
        Cancelled: 0,
      };
    });

    projects.forEach((p) => {
      const status = typeof p.status === "string" ? p.status : p.status?.name;

      if (!status) return;

      const statusLower = status.toLowerCase();

      // ❌ Exclude these
      if (statusLower === "completed" || statusLower === "cancelled") {
        const d = getProjectMonthDate(p);
        if (!d) return;

        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap[key]) return;

        if (statusLower === "completed") monthMap[key].Completed++;
        if (statusLower === "cancelled") monthMap[key].Cancelled++;
        return;
      }

      // ❌ Exclude Upcoming Projects from progress
      if (statusLower === "upcoming project") return;

      const dueDate = p.dueDate ? new Date(p.dueDate) : null;
      if (!dueDate) return;

      dueDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const key = `${dueDate.getFullYear()}-${dueDate.getMonth()}`;
      if (!monthMap[key]) return;

      //  DELAYED → crossed due date
      if (dueDate < today) {
        monthMap[key].Delayed++;
        monthMap[key]["In Progress"]++; // Delayed ⊂ In Progress
        return;
      }

      //  ON TRACK
      const isTodayLastDate = dueDate.getTime() === today.getTime();
      const isFutureDue = dueDate > today;

      if (isTodayLastDate || isFutureDue) {
        monthMap[key]["In Progress"]++;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.sortDate - b.sortDate);
  }, [projects, monthRange]);

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

  //graph api
  const managerId = user?._id;

  useEffect(() => {
    if (!managerId) return;

    const fetchTasks = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/tasks/${managerId}`);

        setAllTasks(res.data.tasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [managerId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        // get logged-in manager
        const userRes = await axios.get("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const managerId = userRes.data?._id;
        if (!managerId) return;

        // SAME API AS MANAGER PROJECT FILE
        const res = await axios.get(
          `http://localhost:8000/api/projects/manager/${managerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setProjects(res.data.data || []);
      } catch (err) {
        console.error("Project fetch error:", err);
      }
    };

    fetchProjects();
  }, []);

  async function fetchRequiredDetails() {
    try {
      const empResponse = await axios.get(
        `http://localhost:8000/employees/manager/${user._id}`,
      );
      const employeeList = empResponse.data.employees;
      const taskResponse = await axios.get("http://localhost:8000/task/getall");
      const tasks = taskResponse.data.map(
        ({
          _id,
          taskName,
          projectName,
          status,
          assignedTo,
          dateOfExpectedCompletion,
        }) => ({
          _id,
          taskName,
          projectName,
          status,
          assignedTo,
          dateOfExpectedCompletion,
        }),
      );
      const projectsResponse = await axios.get(
        `http://localhost:8000/api/projects/manager/${user._id}`,
      );
      const projects = projectsResponse.data.data;
      setEmployeesTasks(tasks);
      setTeamEmployees(employeeList);
      setManagerProjects(projects);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }
  useEffect(() => {
    fetchRequiredDetails();
  }, []);
  // const formatDate = (dateString) =>
  // new Intl.DateTimeFormat("en-GB", {
  //   day: "2-digit",
  //   month: "short",
  //   year: "numeric"
  // }).format(new Date(dateString));
  const managerProjectSet = useMemo(() => {
    return new Set(managerProjects.map((p) => p.name)); // or p.projectName if that’s what task uses
  }, [managerProjects]);
  const managerEmployeeSet = useMemo(() => {
    return new Set(teamEmployees.map((e) => e._id));
  }, [teamEmployees]);

  useEffect(() => {
    if (!managerProjects.length || !teamEmployees.length) return;

    const filtered = employeesTasks.filter(
      (t) =>
        managerProjectSet.has(t.projectName) &&
        managerEmployeeSet.has(t.assignedTo?._id || t.assignedTo),
    );

    setEmployeesTasks(filtered);
  }, [managerProjects, teamEmployees]);

  console.log("managerProjectSet", managerProjectSet);

  console.log("Teamemployees", teamEmployees);
  // Filter states
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Applied filter values
  const [appliedStatus, setAppliedStatus] = useState("All");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  // Calculate counts
  const teamCount = teamEmployees.length;

  const myProjects = managerProjects;
  const projectCount = managerProjects.length;
  // const activeProjectCount = myProjects.filter((p) => p.status === "Active").length;
  const activeProjectCount = myProjects.filter(
    (p) => p?.status?.name !== "Completed",
  ).length;

  const delayedTasks = employeesTasks.filter(
    (t) => t?.status?.name === "Delayed",
  );
  // const delayedTasks = useMemo(() => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   return employeesTasks.filter((t) => {
  //     if (!t.dateOfExpectedCompletion) return false;
  //     const due = new Date(t.dateOfExpectedCompletion);

  //     if (isNaN(due)) return false;
  //     due.setHours(0, 0, 0, 0);

  //     return today > due;
  //   });
  // }, [employeesTasks]);

  const delayedCount = delayedTasks.length;

  // Upcoming tasks (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const todayStr = today.toISOString().slice(0, 10);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  const upcomingTasks = employeesTasks.filter(
    (t) =>
      t.dateOfExpectedCompletion >= todayStr &&
      t.dateOfExpectedCompletion <= nextWeekStr,
  );
  const upcomingCount = upcomingTasks.length;

  // Get employee tasks with filters
  function getEmployeeTasks() {
    if (!selectedEmployee) return [];
    console.log("employeesTasks", employeesTasks);
    console.log("selectedEmployee", selectedEmployee);
    let tasks = employeesTasks.filter(
      (t) => t?.assignedTo?._id === selectedEmployee._id,
    );
    console.log("tasks", tasks);
    if (appliedStatus !== "All")
      tasks = tasks.filter((t) => t.status === appliedStatus);
    if (appliedFromDate)
      tasks = tasks.filter((t) => t.dueDate >= appliedFromDate);
    if (appliedToDate) tasks = tasks.filter((t) => t.dueDate <= appliedToDate);

    return tasks;
  }

  const employeeTasks = getEmployeeTasks();

  const filteredTeamEmployees = useMemo(() => {
    if (!appliedSearch) return teamEmployees;

    const search = appliedSearch.toLowerCase();

    return teamEmployees.filter((emp) => {
      const searchableText = Object.values(emp)
        .map((v) => normalize(v))
        .join(" ");

      return searchableText.includes(search);
    });
  }, [teamEmployees, appliedSearch]);

  const filteredProjects = useMemo(() => {
    if (!appliedSearch) return myProjects;

    const search = appliedSearch.toLowerCase();

    return myProjects.filter((p) => {
      const searchableText = `
      ${p.name}
      ${p.status?.name}
      ${formatDate(p.deliveryDate)}
      ${formatDate(p.dueDate)}
    `.toLowerCase();

      return searchableText.includes(search);
    });
  }, [myProjects, appliedSearch]);

  const filteredDelayedTasks = useMemo(() => {
    if (!appliedSearch) return delayedTasks;

    const search = appliedSearch.toLowerCase();

    return delayedTasks.filter((t) => {
      const searchableText = `
      ${t.taskName}
      ${t.assignedTo?.name}
      ${formatDate(t.dateOfExpectedCompletion)}
    `.toLowerCase();

      return searchableText.includes(search);
    });
  }, [delayedTasks, appliedSearch]);

  const filteredUpcomingTasks = useMemo(() => {
    if (!appliedSearch) return upcomingTasks;

    const search = appliedSearch.toString().toLowerCase();

    return upcomingTasks.filter((t) => {
      const searchableText = `
      ${t.taskName}
      ${t.assignedTo?.name}
      ${formatDate(t.dateOfExpectedCompletion)}
    `.toLowerCase();

      return searchableText.includes(search);
    });
  }, [upcomingTasks, appliedSearch]);

  const filteredEmployeeTasks = useMemo(() => {
    if (!appliedSearch) return employeeTasks;

    return employeeTasks.filter(
      (t) =>
        t.taskName?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        t.projectName?.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        t.status?.name?.toLowerCase().includes(appliedSearch.toLowerCase()),
    );
  }, [employeeTasks, appliedSearch]);

  function handleFilter() {
    setAppliedSearch(searchText); // 🔑 makes search work
  }

  function handleReset() {
    setSearchText("");
    setAppliedSearch("");
  }

  // function handleFilter() {
  //   setAppliedStatus(statusFilter);
  //   setAppliedFromDate(fromDate);
  //   setAppliedToDate(toDate);
  // }

  // function handleReset() {
  //   setStatusFilter("All");
  //   setFromDate("");
  //   setToDate("");
  //   setAppliedStatus("All");
  //   setAppliedFromDate("");
  //   setAppliedToDate("");
  // }

  function getStatusStyle() {}

  // ================= Pagination (ONLY ADDITION) =================
  const [teamPage, setTeamPage] = useState(1);
  const [teamRows, setTeamRows] = useState(5);

  const [projPage, setProjPage] = useState(1);
  const [projRows, setProjRows] = useState(5);

  const [delayedPage, setDelayedPage] = useState(1);
  const [delayedRows, setDelayedRows] = useState(5);

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingRows, setUpcomingRows] = useState(5);

  const [taskPage, setTaskPage] = useState(1);
  const [taskRows, setTaskRows] = useState(5);

  useEffect(() => {
    // reset page when switching cards
    setTeamPage(1);
    setProjPage(1);
    setDelayedPage(1);
    setUpcomingPage(1);
  }, [showCardList]);

  useEffect(() => {
    // reset page when changing selected employee or applying filters
    setTaskPage(1);
  }, [selectedEmployee, appliedStatus, appliedFromDate, appliedToDate]);

  const paginatedTeamEmployees = useMemo(() => {
    const start = (teamPage - 1) * teamRows;
    return filteredTeamEmployees.slice(start, start + teamRows);
  }, [filteredTeamEmployees, teamPage, teamRows]);

  const paginatedMyProjects = useMemo(() => {
    const start = (projPage - 1) * projRows;
    return filteredProjects.slice(start, start + projRows);
  }, [filteredProjects, projPage, projRows]);

  const paginatedDelayedTasks = useMemo(() => {
    const start = (delayedPage - 1) * delayedRows;
    return filteredDelayedTasks.slice(start, start + delayedRows);
  }, [filteredDelayedTasks, delayedPage, delayedRows]);

  const paginatedUpcomingTasks = useMemo(() => {
    const start = (upcomingPage - 1) * upcomingRows;
    return filteredUpcomingTasks.slice(start, start + upcomingRows);
  }, [filteredUpcomingTasks, upcomingPage, upcomingRows]);

  const paginatedEmployeeTasks = useMemo(() => {
    const start = (taskPage - 1) * taskRows;
    return filteredEmployeeTasks.slice(start, start + taskRows);
  }, [filteredEmployeeTasks, taskPage, taskRows]);

  useEffect(() => {
    setTeamPage(1);
    setProjPage(1);
    setDelayedPage(1);
    setUpcomingPage(1);
    setTaskPage(1);
  }, [appliedSearch, appliedStatus, appliedFromDate, appliedToDate]);
  // =============================================================
  //Date format

  const isAnyPopupOpen =
    !!selectedDonutStatus ||
    !!selectedProjectMonth ||
   
    showRowModal;
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
/////
//Rushikesh added
const downloadManagerProjectsExcel = (data, fileName = "My_Projects") => {
  if (!data || !data.length) {
    alert("No projects available");
    return;
  }
  const excelData = data.map((p, index) => ({
    "Sr No": index + 1,
    "Project Name": p.name || "-",
    Status: p.status?.name || p.status || "-",
    "Start Date": p.startDate
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(p.startDate))
      : "-",
    "Due Date": p.dueDate
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(p.dueDate))
      : "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "My Projects");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
};

const downloadExcel = (excelData, fileName, sheetName = "Sheet1") => {
  if (!excelData || !excelData.length) {
    alert("No data available");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
};

const exportMyTeamExcel = (data) => {
  const excelData = data.map((emp, index) => ({
    "Sr No": index + 1,
    Name: emp.name || "-",
    Role: emp.designation || emp.role || "-",
  }));

  downloadExcel(excelData, "My_Team", "My Team");
};



const exportMyProjectsExcel = (data) => {
  const excelData = data.map((p, index) => ({
    "Sr No": index + 1,
    "Project Name": p.name || "-",
    Status: p.status?.name || p.status || "-",
    "Delivery Date": formatDate(p.dueDate),
  }));

  downloadExcel(excelData, "My_Projects", "My Projects");
};

// const exportDelayedTasksExcel = (data) => {
//   const excelData = data.map((t, i) => ({
//     "Sr No": i + 1,
//     Task: t.taskName || "-",
//     Employee: t.assignedTo?.name || "-",
//     "Due Date": formatDate(t.dateOfExpectedCompletion),
//   }));

//   downloadExcel(excelData, "Delayed_Tasks", "Delayed Tasks");
// };
const exportDelayedTasksExcel = (data) => {
  const excelData = data.map((t, index) => ({
    "Sr No": index + 1,
    "Task Name": t.taskName || "-",
    Employee: t.assignedTo?.name || "-",
    "Due Date": formatDate(t.dateOfExpectedCompletion),
  }));

  downloadExcel(excelData, "Delayed_Tasks", "Delayed Tasks");
};



// const exportUpcomingTasksExcel = (data) => {
//   const excelData = data.map((t, i) => ({
//     "Sr No": i + 1,
//     Task: t.taskName || "-",
//     Employee: t.assignedTo?.name || "-",
//     "Due Date": formatDate(t.dateOfExpectedCompletion),
//   }));

//   downloadExcel(excelData, "Upcoming_Tasks", "Upcoming Tasks");
// };
const exportUpcomingTasksExcel = (data) => {
  const excelData = data.map((t, index) => ({
    "Sr No": index + 1,
    "Task Name": t.taskName || "-",
    Employee: t.assignedTo?.name || "-",
    "Due Date": formatDate(t.dateOfExpectedCompletion),
  }));

  downloadExcel(excelData, "Upcoming_Tasks", "Upcoming Tasks");
};

const handleDownloadExcel = () => {
  if (showCardList === "teamMembers") {
    exportMyTeamExcel(filteredTeamEmployees); //  FULL DATA
    return;
  }

  if (showCardList === "myProjects") {
    exportMyProjectsExcel(filteredProjects); //  FULL DATA
    return;
  }

  if (showCardList === "delayedTasks") {
    exportDelayedTasksExcel(filteredDelayedTasks); //  FULL DATA
    return;
  }

  if (showCardList === "upcomingTasks") {
    exportUpcomingTasksExcel(filteredUpcomingTasks); //  FULL DATA
    return;
  }

  alert("Please select a report");
};
//Rushikesh
/////
  return (
    <div className="container-fluid ">
      <h2 className="mb-4" style={{ color: "#3A5FBE", fontSize: "25px" }}>Reports</h2>

      {/* Top Cards */}
      <div className="row mb-4 g-3">
        {/* My Team Members */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null); // Reset employee selection
              setShowCardList("teamMembers"); // or "myProjects", "delayedTasks", "upcomingTasks"
            }}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <div
                className="fw-semibold d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {teamCount}
              </div>

              <div>
                <div
                  className="fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  My Team
                </div>
                <small style={{ color: "#9e9e9e" }}>Click to view list</small>
              </div>
            </div>
          </div>
        </div>

        {/* My Projects */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null); // Reset employee selection
              setShowCardList("myProjects"); // or "myProjects", "delayedTasks", "upcomingTasks"
            }}
            // onClick={() => setShowCardList("myProjects")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "16px" }}
            >
              <div
                className="fw-semibold d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFB3B3",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {projectCount}
              </div>

              <div>
                <div
                  className="fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  My Projects
                </div>
                <small style={{ color: "#9e9e9e" }}>Click to view list</small>
              </div>
            </div>
          </div>
        </div>

        {/* Delayed Tasks */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null); // Reset employee selection
              setShowCardList("delayedTasks"); // or "myProjects", "delayedTasks", "upcomingTasks"
            }}
            // onClick={() => setShowCardList("delayedTasks")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "18px" }}
            >
              <div
                className="fw-semibold d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFE493",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {delayedCount}
              </div>

              <div>
                <div
                  className="fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  Delayed Tasks
                </div>
                <small style={{ color: "#9e9e9e" }}>Click to view list</small>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm border-0 h-100"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => {
              setSelectedEmployee(null); // Reset employee selection
              setShowCardList("upcomingTasks"); // or "myProjects", "delayedTasks", "upcomingTasks"
            }}
            // onClick={() => setShowCardList("upcomingTasks")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "18px" }}
            >
              <div
                className="fw-semibold d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D7F5E4",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {upcomingCount}
              </div>

              <div>
                <div
                  className="fw-semibold"
                  style={{ fontSize: "18px", color: "#3A5FBE" }}
                >
                  Upcoming Tasks
                </div>
                <small style={{ color: "#9e9e9e" }}>Click to view list</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* {showCardList === "teamMembers" && (
        <div className="mb-3 border-0">
          <div className="d-flex justify-content-between align-items-center">
            <span
              className="fw-semibold"
              style={{ color: "#3A5FBE", fontSize: "20px" }}
            >
              My Team Members
            </span>

            <button
              className="btn btn-sm custom-outline-btn"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      )} */}

      {showCardList && (
        <>
          {/* ===== Title + Close ===== */}
          <div className="mb-3 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                {/* //added by harshada  23-01-2026*/}
                {showCardList === "teamMembers" &&
                  isMainCardView &&
                  "My Team Members"}
                {showCardList === "myProjects" &&
                  isMainCardView &&
                  "My Projects"}
                {showCardList === "delayedTasks" &&
                  isMainCardView &&
                  "Delayed Tasks"}
                {showCardList === "upcomingTasks" &&
                  isMainCardView &&
                  "Upcoming Tasks (Next 7 Days)"}
              </span>

              {/* //added by harshada  23-01-2026*/}
              {isMainCardView && (
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setShowCardList(null)}
                >
                  Close
                </button>
              )}
            </div>

            <>
              {/* Employee selected → Show employee details + back  23-01-2026*/}
              {selectedEmployee !== null && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div
                      className="fw-semibold"
                      style={{ fontSize: "20px", color: "#3A5FBE" }}
                    >
                      {selectedEmployee.name} - {selectedEmployee.role}
                    </div>

                    <button
                      className="btn btn-sm custom-outline-btn"
                      onClick={() => {
                        setSelectedEmployee(null);
                        handleReset();
                      }}
                    >
                      Back to List
                    </button>
                  </div>

                  {/* Subtitle */}
                  <small className="text-muted">
                    Task report for selected date range
                  </small>
                </div>
              )}
            </>
          </div>

          {/* ===== Filter ===== */}
          <div className="card bg-white shadow-sm p-3 mb-4 border-0">
            <div className="d-flex align-items-center justify-content-between flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
                <label
                  className="me-3 fw-bold mb-0"
                  style={{ color: "#3A5FBE", fontSize: "16px" }}
                >
                  Search
                </label>

                <input
                  className="form-control"
                  placeholder="Search By Any Field..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="col-auto ms-auto d-flex gap-2 mt-2">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={handleDownloadExcel}
                  disabled={!showCardList}
                >
                  Download Excel
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={handleFilter}
                >
                  Filter
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Employee Detail View */}
      {selectedEmployee && (
        <>
          <div className="card shadow-sm border-0 mb-3">
            {/* <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <div>
                <div
                  className="fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "20px" }}
                >
                  {selectedEmployee.name} - {selectedEmployee.role}
                </div>
                <small className="text-muted">
                  Task report for selected date range
                </small>
              </div>
              <button
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  setSelectedEmployee(null);
                  handleReset();
                }}
              >
                Back to List
              </button>
            </div> */}

            {/* <div className="card-body pt-3"> */}
            {/* <div className="card bg-white shadow-sm p-3 mb-4 border-0">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-3">
                    <label
                      className="form-label mb-1 fw-bold"
                      style={{ fontSize: 14, color: "#3A5FBE" }}
                    >
                      Status
                    </label>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Completed">Completed</option>
                      <option value="Assignment Pending">
                        Assignment Pending
                      </option>
                      <option value="Assigned">Assigned</option>
                      <option value="Delayed">Delayed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-3">
                    <label
                      className="form-label mb-1 fw-bold"
                      style={{ fontSize: 14, color: "#3A5FBE" }}
                    >
                      From
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label
                      className="form-label mb-1 fw-bold"
                      style={{ fontSize: 14, color: "#3A5FBE" }}
                    >
                      To
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3 d-flex gap-2">
                    <button
                      className="btn btn-sm custom-outline-btn flex-fill"
                      onClick={handleFilter}
                    >
                      Filter
                    </button>
                    <button
                      className="btn btn-sm custom-outline-btn flex-fill"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div> */}

            {/* Task Table */}
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Task
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
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
                      }}
                    >
                      Project
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Due Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employeeTasks.length > 0 ? (
                    paginatedEmployeeTasks.map((task) => (
                      <tr // change tr 10 jan--------------
                        key={task._id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setModalTitle("Employee Task Details");
                          setModalFields([
                            { label: "Task", value: task.taskName },

                            {
                              label: "Status",
                              value: <span>{task?.status?.name || "-"}</span>,
                            },

                            { label: "Project", value: task.projectName },
                            {
                              label: "Due Date",
                              value: formatDate(task.dateOfExpectedCompletion),
                            },
                          ]);
                          setShowRowModal(true);
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task.taskName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          <span>{task?.status?.name}</span>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task.projectName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {formatDate(task.dateOfExpectedCompletion)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-3 text-muted">
                        No tasks found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* </div> */}

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredEmployeeTasks.length}
              currentPage={taskPage}
              itemsPerPage={taskRows}
              setCurrentPage={setTaskPage}
              setItemsPerPage={setTaskRows}
            />
          </div>
        </>
      )}

      {/* Team Members List */}
      {/* {showCardList === "teamMembers" && !selectedEmployee && (
        <>
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                My Team Members
              </span>
              <button
                className="btn btn-sm custom-outline-btn"
                onClick={() => setShowCardList(null)}
              >
                Close
              </button>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeamEmployees.map((emp) => (
                    <tr key={emp._id}>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                        }}
                      >
                        {emp.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                        }}
                      >
                        {emp.designation}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        <button
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => {
                            setSelectedEmployee(emp);
                          }}
                        >
                          View Tasks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredTeamEmployees.length}
              currentPage={teamPage}
              itemsPerPage={teamRows}
              setCurrentPage={setTeamPage}
              setItemsPerPage={setTeamRows}
            />
          </div>
        </>
      )} */}

      {showCardList === "teamMembers" && !selectedEmployee && (
        <>
          {/* 1️⃣ TITLE + CLOSE IN ONE LINE */}

          {/* 2️⃣ FILTER SECTION
          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: "250px" }}
            />

            <button className="btn btn-sm custom-outline-btn" onClick={handleFilter}>
              Filter
            </button>

            <button className="btn btn-sm custom-outline-btn" onClick={handleReset}>
              Reset
            </button>
          </div> * */}

          {/* 3️⃣ TABLE / LIST */}
          <div
            className="card shadow-sm border-0 mb-3"
            style={{ marginTop: "10px" }}
          >
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#fff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        padding: "12px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        padding: "12px",
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        fontWeight: 500,
                        fontSize: "14px",
                        padding: "12px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedTeamEmployees.map((emp) => (
                    <tr key={emp._id}>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {emp.name}
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {emp.designation}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          View Tasks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4️⃣ PAGINATION (NO CHANGE) */}
          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredTeamEmployees.length}
              currentPage={teamPage}
              itemsPerPage={teamRows}
              setCurrentPage={setTeamPage}
              setItemsPerPage={setTeamRows}
            />
          </div>
        </>
      )}

      {/* My Projects List */}
      {showCardList === "myProjects" && (
        <>
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Project Name
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
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
                      }}
                    >
                      Delivery Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMyProjects.map((proj) => (
                    <tr
                      key={proj._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setModalTitle("Project Details");
                        setModalFields([
                          { label: "Project Name", value: proj.name },

                          {
                            label: "Status",
                            value: <span>{proj?.status || "-"}</span>,
                          },

                          {
                            label: "Delivery Date",
                            value: formatDate(proj.dueDate),
                          },
                        ]);
                        setShowRowModal(true);
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                        }}
                      >
                        {proj.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                        }}
                      >
                        <span>{proj?.status}</span>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                        }}
                      >
                        {formatDate(proj.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredProjects.length}
              currentPage={projPage}
              itemsPerPage={projRows}
              setCurrentPage={setProjPage}
              setItemsPerPage={setProjRows}
            />
          </div>
        </>
      )}

      {/* Delayed Tasks List */}
      {showCardList === "delayedTasks" && (
        <>
          <div className="card shadow-sm border-0 mb-3">
            {/* <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                Delayed Tasks
              </span> */}
            {/* <button
                className="btn btn-sm custom-outline-btn"
                onClick={() => setShowCardList(null)}
              >
                Close
              </button> */}
            {/* </div> */}
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Task
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDelayedTasks.map((task) => {
                    const emp = MOCK_TEAM_EMPLOYEES.find(
                      (e) => e.id === task.employeeId,
                    );
                    return (
                      <tr // change tr 10 jan--------------
                        key={task._id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setModalTitle("Delayed Task Details");
                          setModalFields([
                            { label: "Task", value: task.taskName },
                            {
                              label: "Employee",
                              value: task?.assignedTo?.name,
                            },
                            {
                              label: "Due Date",
                              value: formatDate(task.dateOfExpectedCompletion),
                            },
                          ]);
                          setShowRowModal(true);
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task.taskName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task?.assignedTo?.name || "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {formatDate(task.dateOfExpectedCompletion)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredDelayedTasks.length}
              currentPage={delayedPage}
              itemsPerPage={delayedRows}
              setCurrentPage={setDelayedPage}
              setItemsPerPage={setDelayedRows}
            />
          </div>
        </>
      )}

      {/* Upcoming Tasks List */}
      {showCardList === "upcomingTasks" && (
        <>
          <div className="card shadow-sm border-0 mb-3">
            {/* <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <span
                className="fw-semibold"
                style={{ color: "#3A5FBE", fontSize: "20px" }}
              >
                Upcoming Tasks (Next 7 days)
              </span>
            </div> */}
            <div className="card-body p-0">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Task
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                      }}
                    >
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUpcomingTasks.map((task) => {
                    return (
                      <tr // change tr 10 jan--------------
                        key={task._id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setModalTitle("Upcoming Task Details");
                          setModalFields([
                            { label: "Task", value: task.taskName },
                            {
                              label: "Employee",
                              value: task?.assignedTo?.name,
                            },
                            {
                              label: "Due Date",
                              value: formatDate(task.dateOfExpectedCompletion),
                            },
                          ]);
                          setShowRowModal(true);
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task.taskName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {task?.assignedTo?.name || "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            color: "#212529",
                          }}
                        >
                          {formatDate(task.dateOfExpectedCompletion)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <PaginationFooter
              totalItems={filteredUpcomingTasks.length}
              currentPage={upcomingPage}
              itemsPerPage={upcomingRows}
              setCurrentPage={setUpcomingPage}
              setItemsPerPage={setUpcomingRows}
            />
          </div>
        </>
      )}

      <div className="row g-4 mt-4 align-items-stretch">
        {/* TASK STATUS (DONUT) */}
        <div className="col-lg-4 col-md-5">
          <div className="card shadow border-0 h-100 rounded-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-4 " style={{color: "#3A5FBE"}}>
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
                      maxWidth: "140px",
                      minWidth: "110px",
                      whiteSpace: "nowrap",
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
                    style={{
                      minWidth: "160px",
                      maxWidth: "90vw",
                      overflowX: "hidden",
                    }}
                  >
                    <li>
                      <button
                        className="dropdown-item text-wrap"
                        onClick={() => setSelectedTaskMonth("all")}
                      >
                        All Months
                      </button>
                    </li>

                    {taskMonthOptions.map((m) => (
                      <li key={m.value}>
                        <button
                          className="dropdown-item text-wrap"
                          onClick={() => setSelectedTaskMonth(m.value)}
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={taskStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
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
                    {taskStatusChartData.map((entry, i) => (
                      <Cell key={i} fill={TASK_COLORS[entry.name]} />
                    ))}
                  </Pie>

                  {/*  CENTER TOTAL TASKS */}
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
                    style={{ fontSize: "13px", fill: "#6c757d" }}
                  >
                    Total Tasks
                  </text>

                  <Tooltip
                    content={<TaskStatusTooltip />}
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

        {/* PROJECT STATUS (LINE) */}
        <div className="col-lg-8 col-md-7">
          <div className="card shadow border-0 h-100 rounded-4">
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
                    ( Total Projects: {totalProjects})
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
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
                      {monthRange === 0
                        ? "All"
                        : monthRange === 3
                          ? "Last 3 Months"
                          : "Last 6 Months"}
                    </button>

                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      style={{
                        minWidth: "120px",
                      }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => setMonthRange(0)}
                        >
                          All
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => setMonthRange(3)}
                        >
                          Last 3 Months
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => setMonthRange(6)}
                        >
                          Last 6 Months
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={projectStatusLineData}
                  onClick={(e) => {
                    if (!e || !e.activeLabel) return;

                    const filtered = filterProjectsByMonth(e.activeLabel);

                    setSelectedProjectMonth(e.activeLabel);
                    setLinePopupProjects(filtered);
                  }}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid stroke="#e9ecef" strokeDasharray="4 4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "25px" }}
                  />

                  <Line
                    dataKey="In Progress"
                    stroke="#0d6efd"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    dataKey="Completed"
                    stroke="#198754"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    dataKey="Delayed"
                    stroke="#dc3545"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    dataKey="Cancelled"
                    stroke="#6c757d"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* shivani */}
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
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">{selectedDonutStatus} Tasks</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedDonutStatus(null)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
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
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
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
                <h5 className="modal-title mb-0">
                  Projects – {selectedProjectMonth}
                </h5>
                <button
                type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedProjectMonth(null)}
                />
              </div>

              <div className="modal-body">
                {["In Progress", "Completed", "Delayed", "Cancelled"].map(
                  (status) => (
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
                              <div className="col-4 fw-semibold">
                                Assigned To
                              </div>
                              <div className="col-8">
                                {getManagerNames(p.managers).join(", ") || "-"}
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

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setSelectedProjectMonth(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TableRowModal
        show={showRowModal}
        onClose={() => setShowRowModal(false)}
        title={modalTitle}
        fields={modalFields}
      />

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

export default ManagerReportTMS;
