import React, { useState, useEffect, useMemo, useRef } from "react";
import "./ReportTMSGraph.css";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function EmployeeReportTMS({ employeeId }) {
  console.log("EmployeeReportTMS FUNCTION CALLED");

  useEffect(() => {
    console.log(" useEffect MOUNTED");
  }, []);

  const [showCardList, setShowCardList] = useState();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  //dynamic project
  const [projects, setProjects] = useState([]);
  const [projectCount, setProjectCount] = useState(0);

  const [loadingProjects, setLoadingProjects] = useState(false);
  // dynamic delayed tasks
  const [delayedTasks, setDelayedTasks] = useState([]);
  const [delayedCount, setDelayedCount] = useState(0);

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loadingUpcomingTasks, setLoadingUpcomingTasks] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [loadingDelayedTasks, setLoadingDelayedTasks] = useState(false);

  //graph --------------------------------------------------------------------
  const [allTasks, setAllTasks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const [donutStatus, setDonutStatus] = useState(null);
  const [donutTasks, setDonutTasks] = useState([]); // 15 jan--------------------
  useEffect(() => {
    if (!employeeId) return;

    axios
      .get(`http://localhost:8000/tasks/assigned/${employeeId}`)
      .then((res) => {
        const apiTasks = res.data.tasks.map((task) => ({
          _id: task._id,
          taskName: task.taskName,
          taskType: task.typeOfTask,
          assignDate: task.dateOfTaskAssignment,
          dueDate: task.dateOfExpectedCompletion,
          status:
            task.status?.name === "In progress"
              ? "In Progress"
              : task.status?.name || "Unknown",
        }));

        setAllTasks(apiTasks);
      })
      .catch((err) => console.error("Task fetch error:", err));
  }, [employeeId]);

  const handleDonutClick = (data) => {
    if (!data || !data.name) return;

    const filtered = allTasks.filter(
      (task) =>
        task.status === data.name &&
        (selectedMonth === "all" ||
          (() => {
            const d = new Date(task.assignDate);
            return `${d.getFullYear()}-${d.getMonth() + 1}` === selectedMonth;
          })()),
    );

    setDonutStatus(data.name);
    setDonutTasks(filtered);
    setModalTitle(`${data.name} Tasks`);
  };
  const TASK_COLORS = {
    Assigned: "#3A5FBE",
    Completed: "#198754",
    Delayed: "#dc3545",
    "In Progress": "#0d6efd",
    Hold: "#fd7e14",
    "Assignment Pending": "#ffc107",
    Cancelled: "#6c757d",
  };

  const employeeTaskDonutData = useMemo(() => {
    const counts = {
      Assigned: 0,
      Completed: 0,
      Delayed: 0,
      "In Progress": 0,
      Hold: 0,
      "Assignment Pending": 0,
      Cancelled: 0,
    };

    const filteredTasks =
      selectedMonth === "all"
        ? allTasks
        : allTasks.filter((task) => {
            if (!task.assignDate) return false;

            const taskDate = new Date(task.assignDate);
            const taskMonth = `${taskDate.getFullYear()}-${
              taskDate.getMonth() + 1
            }`;

            return taskMonth === selectedMonth;
          });

    filteredTasks.forEach((task) => {
      if (counts[task.status] !== undefined) {
        counts[task.status]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [allTasks, selectedMonth]);

  const totalTasks = employeeTaskDonutData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

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

    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const monthOptions = useMemo(() => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        label: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        value: `${date.getFullYear()}-${date.getMonth() + 1}`,
      });
    }

    return months;
  }, []);

  const employeeStatusBarData = useMemo(() => {
    const completed =
      employeeTaskDonutData.find((d) => d.name === "Completed")?.value || 0;

    const total = employeeTaskDonutData.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const performance = total > 0 ? Math.round((completed / total) * 100) : 0;

    return [
      {
        Completed: completed,
        Total: total,
        Performance: performance,
      },
    ];
  }, [employeeTaskDonutData]);

  ///add------------------------------------------------------
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);

      const res = await axios.get(
        `http://localhost:8000/projects/employee/${employeeId}`,
      );

      if (res.data.success) {
        setProjects(res.data.projects || []);
        setProjectCount(res.data.projects?.length || 0);
      } else {
        setProjects([]);
        setProjectCount(0);
      }
    } catch (err) {
      console.error("Project API error:", err);
      setProjects([]);
      setProjectCount(0);
    } finally {
      setLoadingProjects(false);
    }
  };
  //-------------------------------------------------------------
  const fetchDelayedTasks = async () => {
    try {
      setLoadingDelayedTasks(true);

      const res = await axios.get(
        `http://localhost:8000/api/tasks/employee/${employeeId}/delayed-tasks`,
      );

      if (res.data.success) {
        setDelayedTasks(res.data.tasks || []);
        setDelayedCount(res.data.count ?? res.data.tasks?.length ?? 0);
      } else {
        setDelayedTasks([]);
        setDelayedCount(0);
      }
    } catch (error) {
      console.error(" Delayed Task API error:", error);
      setDelayedTasks([]);
      setDelayedCount(0);
    } finally {
      setLoadingDelayedTasks(false);
    }
  };
  // 12 jan start--------------------------------------------------
  const fetchUpcomingTasks = async () => {
    try {
      setLoadingUpcomingTasks(true);

      const res = await axios.get(
        `http://localhost:8000/api/tasks/employee/${employeeId}/upcoming-tasks`,
      );

      if (res.data.success) {
        const filteredTasks = (res.data.tasks || []).filter((task) => {
          if (!task.startDate && !task.dueDate) return false;

          const taskDate = new Date(task.startDate || task.dueDate);
          taskDate.setHours(0, 0, 0, 0);

          return taskDate >= tomorrow && taskDate <= nextWeek;
        });

        setUpcomingTasks(filteredTasks);
        setUpcomingCount(filteredTasks.length);
      } else {
        setUpcomingTasks([]);
        setUpcomingCount(0);
      }
    } catch (error) {
      console.error(" Upcoming Task API error:", error);
      setUpcomingTasks([]);
      setUpcomingCount(0);
    } finally {
      setLoadingUpcomingTasks(false);
    }
  };
  // end-------------------------------------------------------------
  const fetchTeams = async () => {
    try {
      setLoadingTeam(true);

      const res = await axios.get(
        `http://localhost:8000/api/employee/${employeeId}/teams`,
      );

      if (res.data.success) {
        const teams = res.data.data.map((team) => ({
          id: team._id,
          teamName: team.name,
          projectName: team.project?.name || "N/A",
          employeeCount: team.assignToProject.length,
          members: team.assignToProject, // 👈 for popup
        }));

        setTeamMembers(teams); // reuse state
        setTeamCount(teams.length);
      } else {
        setTeamMembers([]);
        setTeamCount(0);
      }
    } catch (error) {
      console.error("Team API error:", error);
    } finally {
      setLoadingTeam(false);
    }
  };
  //
  const handleDownloadExcel = () => {
    if (!filteredListData || filteredListData.length === 0) {
      alert("No data to download");
      return;
    }

    let excelData = [];

    switch (showCardList) {
      case "teamMembers":
        excelData = filteredListData.map((item) => ({
          "Team Name": item.teamName,
          "Project Name": item.projectName,
          "Employees Assigned": item.employeeCount,
        }));
        break;

      case "myProjects":
        excelData = filteredListData.map((item) => ({
          "Project Name": item.name,
          Status: item.isDelayed ? "Delayed" : item.status,
          "Due Date": formatDate(item.dueDate),
        }));
        break;

      case "delayedTasks":
        excelData = filteredListData.map((item) => ({
          "Project Name": item.project,
          "Task Title": item.title,
          "Due Date": formatDate(item.dueDate),
        }));
        break;

      case "upcomingTasks":
        excelData = filteredListData.map((item) => ({
          "Project Name": item.project,
          "Task Title": item.title,
          "Start Date": formatDate(item.startDate),
          "Due Date": formatDate(item.dueDate),
          Status: item.status,
        }));
        break;

      default:
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `${getListTitle().replaceAll(" ", "_")}.xlsx`;
    saveAs(blob, fileName);
  };
  //
  useEffect(() => {
    if (!employeeId) return;

    console.log(" useEffect triggered with:", employeeId);

    fetchProjects();
    fetchDelayedTasks();
    fetchUpcomingTasks();
    fetchTeams();
  }, [employeeId]);

  //console.log("Projects from API:", projects);

  //Row Clickeble
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  ///focus pop-up
  const popupRef = useRef(null);
  useEffect(() => {
    if (selectedItem && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedItem]);

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
  ////
  const handleRowClick = (item) => {
    setSelectedItem(item);
    switch (showCardList) {
      case "teamMembers":
        setModalTitle("Team Member Details");
        break;
      case "myProjects":
        setModalTitle("Project Details");
        break;
      case "delayedTasks":
        setModalTitle("Delayed Task Details");
        break;
      case "upcomingTasks":
        setModalTitle("Upcoming Task Details");
    }
  };
  //12 jan start--------------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // next 7 days from tomorrow
  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(tomorrow.getDate() + 6);
  //------------------------------------------------------------------
  const todayStr = today.toISOString().slice(0, 10);
  const nextWeekStr = nextWeek.toISOString().slice(0, 10);

  const getCurrentListData = () => {
    switch (showCardList) {
      case "teamMembers":
        return teamMembers;

      case "myProjects":
        return projects;
      case "delayedTasks":
        return delayedTasks;

      case "upcomingTasks":
        return upcomingTasks;
      default:
        return [];
    }
  };
  ///12 jan--------------------------------------------------------------------------

  //formateDate is below move it above filterdate
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filterData = (data, type) => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();

    return data.filter((item) => {
      switch (type) {
        case "teamMembers":
          return (
            item.teamName?.toLowerCase().includes(q) ||
            item.projectName?.toLowerCase().includes(q) ||
            String(item.employeeCount).includes(q)
          );

       case "myProjects": {
  const statusText =
    item.isDelayed
      ? "delayed"
      : typeof item.status === "string"
      ? item.status.toLowerCase()
      : item.status?.name?.toLowerCase();
      

  return (
    item.name?.toLowerCase().includes(q) ||
    statusText?.includes(q) ||
     formatDate(item.dueDate).toLowerCase().includes(q)
  );
}
        case "delayedTasks":
          return (
            item.project?.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q) ||
            formatDate(item.dueDate).toLowerCase().includes(q)
          );

        case "upcomingTasks":
          return (
            item.project?.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q) ||
            formatDate(item.startDate).toLowerCase().includes(q) ||
            formatDate(item.dueDate).toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q)
          );

        default:
          return true;
      }
    });
  };
  const filteredTeamMembers = filterData(teamMembers, "teamMembers");
  const filteredProjects = filterData(projects, "myProjects");
  const filteredDelayedTasks = filterData(delayedTasks, "delayedTasks");
  const filteredUpcomingTasks = filterData(upcomingTasks, "upcomingTasks");
  //end-------------------------------------------------------------------------------------------

  // Pagination logic
  //10 jan -------------------------------------------------------------
  let filteredListData = [];

  if (showCardList === "teamMembers") filteredListData = filteredTeamMembers;
  if (showCardList === "myProjects") filteredListData = filteredProjects;
  if (showCardList === "delayedTasks") filteredListData = filteredDelayedTasks;
  if (showCardList === "upcomingTasks")
    filteredListData = filteredUpcomingTasks;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  //end -------------------------------------------------------------
  const totalPages = Math.ceil(filteredListData.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredListData.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredListData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [showCardList, itemsPerPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setSearchInput("");
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
    }
  };

  const isAnyPopupOpen = !!selectedItem || !!donutStatus;
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
  // function getStatusStyle(status) {
  //   if (status === "Completed") {
  //     return { backgroundColor: "#d1f2dd", color: "#0f5132" };
  //   } else if (status === "Assignment Pending") {
  //     return { backgroundColor: "#fff3cd", color: "#856404" };
  //   } else if (status === "Assigned") {
  //     return { backgroundColor: "#cfe2ff", color: "#084298" };
  //   } else if (status === "Delayed" || status === "Hold") {
  //     return { backgroundColor: "#f8d7da", color: "#842029" };
  //   } else if (status === "In Progress") {
  //     return { backgroundColor: "#d1e7ff", color: "#0d6efd" };
  //   } else if (status === "Approved") {
  //     return { backgroundColor: "#d1f2dd", color: "#0f5132" };
  //   } else if (status === "Rejected") {
  //     return { backgroundColor: "#f8d7da", color: "#842029" };
  //   } else if (status === "Pending") {
  //     return { backgroundColor: "#fff3cd", color: "#856404" };
  //   } else {
  //     return { backgroundColor: "#e2e3e5", color: "#495057" };
  //   }
  // }

  const getStatusStyle = () => ({});

  const handleCardClick = (listType) => {
    setShowCardList(listType);

    setCurrentPage(1);

    if (listType === "myProjects") {
      setLoadingProjects(true);
      fetchProjects();
    }

    if (listType === "delayedTasks") {
      setLoadingDelayedTasks(true);
      fetchDelayedTasks();
    }

    if (listType === "upcomingTasks") {
      fetchUpcomingTasks();
    }
  };

  // Get list title
  const getListTitle = () => {
    switch (showCardList) {
      case "teamMembers":
        return "My Team";
      case "myProjects":
        return "My Projects";
      case "delayedTasks":
        return "Delayed Tasks";
      case "upcomingTasks":
        return "Upcoming Tasks (Next 7 days)";
      default:
        return "";
    }
  };
  console.log("STATE projects:", projects);

  const renderFilterSection = () => {
    return (
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="searchQuery"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE", width: "60px" }}
              >
                Search
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                onClick={handleDownloadExcel}
              >
                Download Excel
              </button>
              <button
                type="submit"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={() => {
                  //add onclick-------------------------
                  setSearchQuery(searchInput);
                  setCurrentPage(1);
                }}
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
          </form>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!showCardList) return null;

    let tableHeaders = [];
    let tableRows = [];

    switch (showCardList) {
      case "teamMembers":
        tableHeaders = (
          <>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
            >
              Team Name
            </th>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
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
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
            >
              Employees Assigned
            </th>
          </>
        );
        tableRows = currentItems.map((team) => (
          <tr
            key={team.id}
            style={{ cursor: "pointer" }}
            onClick={() => handleRowClick(team)}
          >
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <h6 className="mb-0 fw-normal">{team.teamName}</h6>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal">{team.projectName}</span>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal">{team.employeeCount}</span>
            </td>
          </tr>
        ));
        break;
      case "myProjects":
        tableHeaders = (
          <>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
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
                whiteSpace: "nowrap",
                textAlign: "left",
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
                textAlign: "left",
              }}
            >
              Due Date
            </th>
          </>
        );
        tableRows = currentItems.map((proj) => (
          <tr
            key={proj._id}
            style={{ cursor: "pointer" }}
            onClick={() => handleRowClick(proj)}
          >
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              {proj.name}
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span>{proj.isDelayed ? "Delayed" : proj.status}</span>
            </td>

            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              {formatDate(proj.dueDate)}
            </td>
          </tr>
        ));

        break;

      case "delayedTasks":
        tableHeaders = (
          <>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
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
                whiteSpace: "nowrap",
                textAlign: "left",
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
                whiteSpace: "nowrap",
                textAlign: "left",
              }}
            >
              Due Date
            </th>
          </>
        );
        tableRows = currentItems.map((task, index) => (
          <tr
            key={task.id}
            style={{ cursor: "pointer" }}
            onClick={() => handleRowClick(task)}
          >
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <h6 className="mb-0 fw-normal">{task.project}</h6>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal">{task.title}</span>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal"> {formatDate(task.dueDate)}</span>
            </td>
          </tr>
        ));
        break;

      case "upcomingTasks":
        tableHeaders = (
          <>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
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
                whiteSpace: "nowrap",
                textAlign: "left",
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
                textAlign: "left",
              }}
            >
              Start Date
            </th>
            <th
              style={{
                fontWeight: "500",
                fontSize: "14px",
                color: "#6c757d",
                borderBottom: "2px solid #dee2e6",
                padding: "12px",
                whiteSpace: "nowrap",
                textAlign: "left",
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
                textAlign: "left",
              }}
            >
              Status
            </th>
          </>
        );
        tableRows = currentItems.map((task, index) => (
          <tr
            key={task.id}
            style={{ cursor: "pointer" }}
            onClick={() => handleRowClick(task)}
          >
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <h6 className="mb-0 fw-normal">{task.project}</h6>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal">{task.title}</span>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
                color: "#212529",
                textAlign: "left",
              }}
            >
              <span className="fw-normal">
                {formatDate(task.startDate || "N/A")}
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
                textAlign: "left",
              }}
            >
              <span className="fw-normal">{formatDate(task.dueDate)}</span>
            </td>
            <td
              style={{
                padding: "12px",
                verticalAlign: "middle",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                textAlign: "left",
              }}
            >
              <span>{task.status}</span>
            </td>
          </tr>
        ));
        break;

      default:
        return null;
    }

    return (
      <>
        <div className="card shadow-sm border-0">
          {/* <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            {/*add---------------------------------------------------------------------------- */}
          {/* <span
              className="fw-semibold"
              style={{ color: "#3A5FBE", fontSize: "20px" }}
            >
              {getListTitle()}
            </span>

            <button
              className="btn btn-sm custom-outline-btn"
              onClick={() => setShowCardList(null)}
            >
              Close
            </button>
          </div> */}
          {/*---------------------------------------------------------------------------- */}
          <div className="table-responsive bg-white">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#ffffffff" }}>
                <tr>{tableHeaders}</tr>
              </thead>
              <tbody>
                {showCardList === "myProjects" && loadingProjects && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      Loading projects...
                    </td>
                  </tr>
                )}

                {showCardList === "delayedTasks" && loadingDelayedTasks && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading delayed tasks...
                    </td>
                  </tr>
                )}

                {showCardList === "upcomingTasks" && loadingUpcomingTasks && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading upcoming tasks...
                    </td>
                  </tr>
                )}

                {showCardList === "teamMembers" && loadingTeam && (
                  <tr>
                    <td colSpan="2" className="text-center py-4">
                      Loading team members...
                    </td>
                  </tr>
                )}

                {/* Table rows */}
                {showCardList === "myProjects" &&
                  !loadingProjects &&
                  currentItems.length > 0 &&
                  tableRows}

                {showCardList === "delayedTasks" &&
                  !loadingDelayedTasks &&
                  filteredListData.length > 0 &&
                  tableRows}

                {showCardList === "upcomingTasks" &&
                  !loadingUpcomingTasks &&
                  currentItems.length > 0 &&
                  tableRows}

                {showCardList === "teamMembers" &&
                  !loadingTeam &&
                  currentItems.length > 0 &&
                  tableRows}

                {/* No data */}
                {showCardList === "myProjects" &&
                  !loadingProjects &&
                  currentItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  )}

                {showCardList === "delayedTasks" &&
                  !loadingDelayedTasks &&
                  filteredListData.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  )}

                {showCardList === "upcomingTasks" &&
                  !loadingUpcomingTasks &&
                  currentItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  )}

                {showCardList === "teamMembers" &&
                  !loadingTeam &&
                  currentItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No team members found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        <nav
          className="d-flex align-items-center justify-content-end mt-3 text-muted"
          style={{ userSelect: "none" }}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <span
                style={{
                  fontSize: "14px",
                  marginRight: "8px",
                  color: "#212529",
                }}
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
              {filteredListData.length === 0
                ? "0–0 of 0"
                : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${
                    filteredListData.length
                  }`}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm focus-ring"
                onClick={() => handlePageChange(currentPage - 1)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={currentPage === 1}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: currentPage === 1 ? "#ccc" : "#212529",
                }}
              >
                ‹
              </button>
              <button
                className="btn btn-sm focus-ring"
                onClick={() => handlePageChange(currentPage + 1)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={currentPage === totalPages}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: currentPage === totalPages ? "#ccc" : "#212529",
                }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      </>
    );
  };

  return (
    <div className="container-fluid">
      <h3 className="mb-4 " style={{ color: "#3A5FBE", fontSize: "25px" }}>
        My Reports
      </h3>

      <div className="row g-3 mb-4">
        {/* My Team Members */}
         <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => handleCardClick("teamMembers")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0 d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D1ECF1",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {loadingTeam ? "..." : teamCount}
              </h4>

              <div>
                <div
                  className="fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  My Team
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* My Projects */}
         <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => handleCardClick("myProjects")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0 d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFB3B3",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {loadingProjects ? "..." : projectCount}
              </h4>

              <div>
                <div
                  className="fw-semibold"
                  style={{ color: "#3A5FBE", fontSize: "18px" }}
                >
                  My Projects
                </div>
                <small style={{ color: "#9e9e9e", fontSize: "12px" }}>
                  Click to view list
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Delayed Tasks */}
         <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => handleCardClick("delayedTasks")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0 d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#FFE493",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {loadingDelayedTasks ? "..." : delayedCount}
              </h4>

              <div>
                <div
                  className="fw-semibold"
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

        {/* Upcoming Tasks */}
         <div className="col-12 col-md-6 col-lg-3">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ borderRadius: "7px", cursor: "pointer" }}
            onClick={() => handleCardClick("upcomingTasks")}
          >
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0 d-flex align-items-center justify-content-center"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#D7F5E4",
                  minWidth: "70px",
                  minHeight: "70px",
                  color: "#3A5FBE",
                }}
              >
                {loadingUpcomingTasks ? "..." : upcomingCount}
              </h4>

              <div>
                <div
                  className="fw-semibold"
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

      {/*  Title & Close button BELOW cards */}
      {showCardList && (
        <div className=" mb-3  border-0">
          <div className=" d-flex justify-content-between align-items-center">
            <span
              className="fw-semibold"
              style={{ color: "#3A5FBE", fontSize: "20px" }}
            >
              {getListTitle()}
            </span>

            <button
              className="btn btn-sm custom-outline-btn"
              style={{minWidth:"90px"}}
              onClick={() => setShowCardList(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* filter */}

      {showCardList && renderFilterSection()}

      {/* {showCardList && (
        <div className="mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-semibold" style={{ color: "#3A5FBE", fontSize: "20px" }}>
              {getListTitle()}
            </span>
            <button
              className="btn btn-sm custom-outline-btn"
              onClick={() => setShowCardList(null)}
            >
              Close
            </button>
          </div>
        </div>
      )} */}

      {showCardList && renderTable()}

      <div className="row mb-4 mt-4">
        <div className="col-lg-12">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0" style={{ color: "#3A5FBE" }}>
                  📊 My Task Status Report
                </h6>

                <div className="dropdown">
                  <button
                    className="form-select form-select-sm text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "100%",
                      maxWidth: "180px",
                      minWidth: "140px",
                    }}
                  >
                    {selectedMonth === "all"
                      ? "All Months"
                      : monthOptions.find((m) => m.value === selectedMonth)
                          ?.label}
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    style={{
                      minWidth: "180px",
                    }}
                  >
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => setSelectedMonth("all")}
                      >
                        All Months
                      </button>
                    </li>

                    {monthOptions.map((m) => (
                      <li key={m.value}>
                        <button
                          className="dropdown-item"
                          onClick={() => setSelectedMonth(m.value)}
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={employeeTaskDonutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    label={renderCustomizedLabel}
                    labelLine={false}
                    onClick={handleDonutClick} // add this line --
                    cursor="pointer"
                  >
                    {employeeTaskDonutData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={TASK_COLORS[entry.name] || "#adb5bd"}
                      />
                    ))}
                  </Pie>

                  {/* CENTER TOTAL */}
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

                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "20px",
                      display: "flex",
                      flexWrap: "wrap", // ✅ wraps legend items
                      justifyContent: "center",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h6 className="fw-semibold mb-2 text-primary">🎯 My Performance</h6>

        <div
          className="progress"
          style={{ height: "18px", borderRadius: "10px" }}
        >
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${employeeStatusBarData[0].Performance}%`,
              backgroundColor:
                employeeStatusBarData[0].Performance >= 80
                  ? "#198754"
                  : employeeStatusBarData[0].Performance >= 60
                    ? "#0d6efd"
                    : employeeStatusBarData[0].Performance >= 40
                      ? "#fd7e14"
                      : "#dc3545",
              fontWeight: "600",
            }}
          >
            {employeeStatusBarData[0].Performance}%
          </div>
        </div>
      </div>

      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
      {donutStatus && (
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
          onClick={() => {
            setDonutStatus(null);
            setDonutTasks([]);
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
             style={{maxWidth:"750px",width:"95%",maxHeight:"650px",marginTop:"100px"}}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">{modalTitle}</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setDonutStatus(null);
                    setDonutTasks([]);
                  }}
                />
              </div>

              <div className="modal-body">
                {donutTasks.length === 0 ? (
                  <div className="text-center py-3">No tasks found.</div>
                ) : (
                  donutTasks.map((task) => (
                    <div key={task._id} className="border rounded p-2 mb-2">
                      <div className="row mb-1">
                        <div className="col-4 fw-semibold">Task Name</div>
                        <div className="col-8">{task.taskName}</div>
                      </div>

                      <div className="row mb-1">
                        <div className="col-4 fw-semibold">Task Type</div>
                        <div className="col-8">{task.taskType}</div>
                      </div>

                      <div className="row mb-1">
                        <div className="col-4 fw-semibold">Assigned Date</div>
                        <div className="col-8">
                          {formatDate(task.assignDate)}
                        </div>
                      </div>

                      <div className="row mb-1">
                        <div className="col-4 fw-semibold">Due Date</div>
                        <div className="col-8">{formatDate(task.dueDate)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{minWidth:"90px"}}
                  onClick={() => {
                    setDonutStatus(null);
                    setDonutTasks([]);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedItem && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
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
          // onClick={() => setSelectedItem(null)} // backdrop click
        >
          <div
            className="modal-dialog modal-xl"
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()} // ✅ IMPORTANT
            >
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">{modalTitle}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedItem(null)}
                />
              </div>

              <div className="modal-body overflow-auto">
                <div className="container-fluid">
                  {showCardList === "teamMembers" &&
                    selectedItem?.members &&
                    selectedItem.members.map((emp, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="row mb-2">
                          <div className="col-5 col-sm-4 fw-semibold">Name</div>
                          <div className="col-7 col-sm-8">{emp.name}</div>
                          <div
                            className="col-5 col-sm-4 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Designation
                          </div>
                          <div
                            className="col-7 col-sm-8"
                            style={{ color: "#212529" }}
                          >
                            {emp.designation}
                          </div>
                          <div
                            className="col-5 col-sm-4 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Email
                          </div>
                          <div className="col-7 col-sm-8">
                            <div className="overflow-auto text-nowrap">
                              {emp.email}
                            </div>
                          </div>

                          <div
                            className="col-5 col-sm-4 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Contact
                          </div>
                          <div
                            className="col-7 col-sm-8"
                            style={{ color: "#212529" }}
                          >
                            {emp.contact}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/*----------------------------------------------------------------------- */}
                  {showCardList === "myProjects" && selectedItem && (
                    <>
                      <div className="row mb-2">
                        <div className="col-5 col-sm-4 fw-semibold">
                          Project Name
                        </div>
                        <div className="col-7 col-sm-8">
                          {selectedItem.name || "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-4 fw-semibold">
                          Due Date
                        </div>
                        <div className="col-7 col-sm-8">
                          {selectedItem.dueDate
                            ? new Date(selectedItem.dueDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-5 col-sm-4 fw-semibold">Status</div>
                        <div className="col-7 col-sm-8">
                          <span>
                            {selectedItem.isDelayed
                              ? "Delayed"
                              : selectedItem.status || "-"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {/*----------------------------------------------------------------------- */}

                  {(showCardList === "delayedTasks" ||
                    showCardList === "upcomingTasks") && (
                    <>
                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-4 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Project Name
                        </div>
                        <div
                          className="col-7 col-sm-8"
                          style={{ color: "#212529" }}
                        >
                          {selectedItem.project}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div
                          className="col-5 col-sm-4 fw-semibold"
                          style={{ color: "#212529" }}
                        >
                          Task Title
                        </div>
                        <div
                          className="col-7 col-sm-8"
                          style={{ color: "#212529" }}
                        >
                          {selectedItem.title}
                        </div>
                      </div>
                      {showCardList === "upcomingTasks" && (
                        <div className="row mb-2">
                          <div
                            className="col-5 col-sm-4 fw-semibold"
                            style={{ color: "#212529" }}
                          >
                            Start Date
                          </div>
                          <div
                            className="col-7 col-sm-8"
                            style={{ color: "#212529" }}
                          >
                            {formatDate(
                              selectedItem.startDate
                                ? selectedItem.startDate.slice(0, 10)
                                : "N/A",
                            )}
                          </div>
                        </div>
                      )}
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
                          {" "}
                          {formatDate(
                            selectedItem.dueDate
                              ? selectedItem.dueDate.slice(0, 10)
                              : "N/A",
                          )}
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
                          <span>{selectedItem.status}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{minWidth:"90px"}}
                  onClick={() => setSelectedItem(null)}
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

export default EmployeeReportTMS;
