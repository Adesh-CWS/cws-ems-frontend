import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

function EmployeeProjectTMS({ employeeId }) {
  // Popup State
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Project List -
  const [projectData, setProjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    ongoingProjects: 0,
    completedProjects: 0,
    delayedProjects: 0,
  });

  // start ------------------------------------------------------------------------------------------
  useEffect(() => {
    if (employeeId) {
      fetchProjects();
    } else {
      setError("Employee ID is required");
      setIsLoading(false);
    }
  }, [employeeId]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:8000/projects/employee/${employeeId}`,
      );

      if (response.data.success && response.data.projects) {
        const transformedProjects = response.data.projects.map((project) => ({
          projectCode:
            project.projectCode ||
            `PRJ${project._id?.slice(-4)?.toUpperCase() || "0000"}`,
          project: project.name || "Unnamed Project",
          desc: project.description || "No description available",
          // managers: project.managers?.map(m => m.name) || ["Not Assigned"],
          managers: (project.managers || []).join(", "),
          clientName: project.clientName || "No Client",
          startDate: project.startDate
            ? new Date(project.startDate).toISOString().split("T")[0]
            : "N/A",
          endDate: project.endDate
            ? new Date(project.endDate).toISOString().split("T")[0]
            : "N/A",
          assigned: project.assignedDate
            ? new Date(project.assignedDate).toISOString().split("T")[0]
            : "N/A",
          due: project.dueDate
            ? new Date(project.dueDate).toISOString().split("T")[0]
            : "N/A",
          // status: project.status?.name || getProjectStatus(project),
          status: project.status,
          priority: project.priority || "P3",
          progress: project.progress || 0,
          // myRole: getEmployeeRole(project, employeeId),
          myRole: project.myRole || "Team Member",

          _id: project._id,
          originalData: project,
        }));

        setProjectData(transformedProjects);
        calculateStats(transformedProjects);
      } else if (response.data.message === "No projects assigned.") {
        setProjectData([]);
        setProjectStats({
          totalProjects: 0,
          ongoingProjects: 0,
          completedProjects: 0,
          delayedProjects: 0,
        });
      } else {
        setError("No projects found");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectStatus = (project) => {
    if (project.status?.name) return project.status.name;

    const today = new Date();
    const endDate = new Date(project.endDate);

    if (project.progress >= 100) return "Completed";
    if (today > endDate && project.progress < 100) return "Delayed";
    return "In Progress";
  };

  // const getEmployeeRole = (project, empId) => {
  //   if (project.managers && project.managers.length > 0) {
  //     const isManager = project.managers.some(manager => {
  //       if (!manager) return false;
  //       return manager._id.toString() === empId.toString();
  //     });
  //     if (isManager) return "Project Manager";
  //   }

  //   if (project.assignedEmployees && project.assignedEmployees.length > 0) {
  //     const isAssigned = project.assignedEmployees.some(emp => {
  //       if (!emp) return false;
  //       return emp._id.toString() === empId.toString();
  //     });
  //     if (isAssigned) return "Team Member";
  //   }

  //   return "Team Member";
  // };
  // end --------------------------------------------------------

  useEffect(() => {
    calculateStats(projectData);
  }, [projectData]);

  // const calculateStats = (projects) => {
  //   const stats = {
  //     totalProjects: projects.length,
  //     ongoingProjects: projects.filter(p => p.status === 'In Progress').length,
  //     completedProjects: projects.filter(p => p.status === 'Completed').length,
  //     delayedProjects: projects.filter(p => p.status === 'Delayed').length
  //   };
  //   setProjectStats(stats);
  // };
  const calculateStats = (projects) => {
    setProjectStats({
      totalProjects: projects.length,
      completedProjects: projects.filter((p) => p.status === "Completed")
        .length,
      ongoingProjects: projects.filter((p) => p.status === "On Track").length,
      delayedProjects: projects.filter((p) => p.status === "Delayed").length,
      upcomingProject: projects.filter((p) => p.status === "Upcoming Project")
        .length,
      cancelledProjects: projects.filter((p) => p.status === "Cancelled")
        .length,
      todayProjects: projects.filter((p) => p.status === "Today is last date")
        .length,
      InProgressProjects: projects.filter(
        (p) => p.status === "On Track" || p.status === "Delayed",
      ).length,
    });
  };
  console.log("cancelled", projectStats);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Format date
  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T00:00:00");
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return d.toLocaleDateString("en-GB", options);
  };

  //filter
  const filteredData =
    searchQuery.trim() === ""
      ? projectData
      : projectData.filter((item) => {
          const query = searchQuery.toLowerCase();
          return (
            // Project Code
            (item.projectCode &&
              item.projectCode.toLowerCase().includes(query)) ||
            // Project Name
            (item.project && item.project.toLowerCase().includes(query)) ||
            // My Role
            (item.myRole && item.myRole.toLowerCase().includes(query)) ||
            // Managers
            (item.managers &&
              (Array.isArray(item.managers)
                ? item.managers.some((m) =>
                    (typeof m === "string" ? m : m?.name)
                      ?.trim()
                      .toLowerCase()
                      .includes(query),
                  )
                : item.managers.trim().toLowerCase().includes(query))) ||
            // Start Date (formatted)
            (item.startDate &&
              formatDateDisplay(item.startDate)
                .toLowerCase()
                .includes(query)) ||
            // End Date (formatted)
            (item.endDate &&
              formatDateDisplay(item.endDate).toLowerCase().includes(query)) ||
            // Progress
            (item.progress && item.progress.toString().includes(query)) ||
            // Status
            (item.status && item.status.toLowerCase().includes(query)) ||
            (item.priority && item.priority.toLowerCase().includes(query))
            // Priority
            // (item.priority && item.priority.toLowerCase().includes(query)) ||
            // // Description (FIXED - added || before this line)
            // (item.desc && item.desc.toLowerCase().includes(query)) ||
            // // Client Name (FIXED - added || before this line)
            // (item.clientName && item.clientName.toLowerCase().includes(query))
          );
        });

  // Open popup from row
  const openProjectDetails = (item) => {
    setSelectedProject(item);
    setShowPopup(true);
  };

  // const getStatusStyle = (status) => {
  //   switch (status) {
  //     case "Completed":
  //       return {
  //         backgroundColor: '#d1f2dd',
  //         border: 'none',
  //         padding: '6px 12px',
  //         borderRadius: '6px',
  //         color: '#0f5132',
  //         fontWeight: '500'
  //       };
  //     case "In Progress":
  //       return {
  //         backgroundColor: '#d1e7ff',
  //         border: 'none',
  //         padding: '6px 12px',
  //         borderRadius: '6px',
  //         color: '#0d6efd',
  //         fontWeight: '500'
  //       };
  //     case "Delayed":
  //       return {
  //         backgroundColor: '#f8d7da',
  //         border: 'none',
  //         padding: '6px 12px',
  //         borderRadius: '6px',
  //         color: '#842029',
  //         fontWeight: '500'
  //       };
  //     default:
  //       return {
  //         backgroundColor: '#e2e3e5',
  //         border: 'none',
  //         padding: '6px 12px',
  //         borderRadius: '6px',
  //         color: '#495057',
  //         fontWeight: '500'
  //       };
  //   }
  // };

  // Pagination

  // const getStatusStyle = (status) => {
  //   switch (status) {
  //     case "Completed":
  //       return {
  //         backgroundColor: "#d1f2dd",
  //         color: "#0f5132",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     case "Cancelled":
  //       return {
  //         backgroundColor: "#f8d7da",
  //         color: "#842029",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     case "Delayed":
  //       return {
  //         backgroundColor: "#f8d7da",
  //         color: "#842029",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     case "Today is last date":
  //       return {
  //         backgroundColor: "#fff3cd",
  //         color: "#664d03",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     case "Upcoming Project":
  //       return {
  //         backgroundColor: "#e2e3ff",
  //         color: "#383d7c",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     case "On Track":
  //       return {
  //         backgroundColor: "#d1e7ff",
  //         color: "#0d6efd",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };

  //     default:
  //       return {
  //         backgroundColor: "#e2e3e5",
  //         color: "#495057",
  //         padding: "6px 12px",
  //         borderRadius: "6px",
  //         fontWeight: "500",
  //       };
  //   }
  // };

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const indexOfLastItem = page * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;

  const paginatedData = useMemo(() => {
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredData, indexOfFirstItem, indexOfLastItem]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, searchQuery, totalItems]);

  console.log("paginated data", paginatedData);

  const isAnyPopupOpen = !!showPopup;
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
      className="container-fluid pt-1 px-3"
      style={{ minHeight: "100vh", backgroundColor: "#f5f7fb" }}
    >
      <h3 className="mb-4" style={{ color: "#3A5FBE", fontSize: "23px" }}>
        My Projects
      </h3>

      <div className="row g-3 mb-4">
        {/* Total Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.totalProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Total Projects
              </p>
            </div>
          </div>
        </div>

        {/* In progress Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.InProgressProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                In Progress
              </p>
            </div>
          </div>
        </div>

        {/* Ongoing Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.ongoingProjects}
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

        {/* Delayed Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.delayedProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Delayed Projects
              </p>
            </div>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.completedProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Completed Projects
              </p>
            </div>
          </div>
        </div>

        {/* cancelled Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#F8D7DA",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  color: "#3A5FBE",
                }}
              >
                {projectStats.cancelledProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Cancelled Projects
              </p>
            </div>
          </div>
        </div>

        {/* upcomming Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "32px",
                  backgroundColor: "#E7DDF7",
                  minWidth: "70px",
                  minHeight: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  color: "#3A5FBE",
                }}
              >
                {projectStats.upcomingProject}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Upcoming Projects
              </p>
            </div>
          </div>
        </div>
        {/* todday is last day Projects */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
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
                {projectStats.todayProjects}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "18px", color: "#3A5FBE" }}
              >
                Today is last day
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Search Section */}
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
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && setSearchQuery(searchInput)
              }
              placeholder="Search By Any Field..."
              className="form-control"
            />
          </div>

          <div className="d-flex gap-2 ms-auto mt-2">
            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={() => setSearchQuery(searchInput)}
            >
              Search
            </button>

            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Project Details Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
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
                    whiteSpace: "nowrap",
                  }}
                >
                  Project ID
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
                  }}
                >
                  My Role
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
                  Managers
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
                  Priority
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    style={{ cursor: "pointer" }}
                    onClick={() => openProjectDetails(item)}
                  >
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
                      <h6 className="mb-0 fw-normal">{item.projectCode}</h6>
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
                      <h6 className="mb-0 fw-normal">{item.project}</h6>
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
                      <span className="fw-normal">{item.myRole}</span>
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
                      <span className="fw-normal">{item.managers}</span>
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
                        {formatDateDisplay(item.startDate)}
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
                        {formatDateDisplay(item.due)}
                      </span>
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
                      {item.priority}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-4"
                    style={{ color: "#212529" }}
                  >
                    {projectData.length === 0
                      ? "No projects assigned."
                      : "No projects found matching your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {projectData.length > 0 && (
        <nav
          className="d-flex align-items-center justify-content-end mt-3 text-muted"
          style={{ userSelect: "none" }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* Rows per page */}
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
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
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
              {totalItems === 0
                ? "0-0 of 0"
                : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, totalItems)} of ${totalItems}`}
            </span>

            {/* Arrows */}
            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm border-0"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                onMouseDown={(e) => e.preventDefault()}
                disabled={page === 1}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color: page === 1 ? "#c0c4cc" : "#212529",
                }}
              >
                ‹
              </button>

              <button
                className="btn btn-sm border-0"
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                onMouseDown={(e) => e.preventDefault()}
                disabled={page === totalPages || totalItems === 0}
                style={{
                  fontSize: "18px",
                  padding: "2px 8px",
                  color:
                    page === totalPages || totalItems === 0
                      ? "#c0c4cc"
                      : "#212529",
                }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      )}

      {/*Popup*/}
      {showPopup && selectedProject && (
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
          onClick={() => setShowPopup(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%", marginTop: "100px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Project Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPopup(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Project ID
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedProject.projectCode}
                    </div>
                  </div>

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
                      {selectedProject.project}
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
                      {selectedProject.desc}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      My Role
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedProject.myRole}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Managers
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedProject.managers}
                    </div>
                  </div>

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
                      {formatDateDisplay(selectedProject.startDate)}
                    </div>
                  </div>

                  {/* <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      End Date
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {formatDateDisplay(selectedProject.endDate)}
                    </div>
                  </div> */}

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
                      {formatDateDisplay(selectedProject.due)}
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
                      {selectedProject.progress}%
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Status
                    </div>
                    <div className="col-7 col-sm-8">
                      <span>{selectedProject.status}</span>
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div
                      className="col-5 col-sm-4 fw-semibold"
                      style={{ color: "#212529" }}
                    >
                      Priority
                    </div>
                    <div
                      className="col-7 col-sm-8"
                      style={{ color: "#212529" }}
                    >
                      {selectedProject.priority}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn" style={{minWidth:"90px"}}
                  onClick={() => setShowPopup(false)}
                >
                  Close
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
}

export default EmployeeProjectTMS;
