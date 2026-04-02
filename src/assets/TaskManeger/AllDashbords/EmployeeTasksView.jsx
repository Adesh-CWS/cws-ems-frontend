import React, { useEffect, useMemo, useState } from "react";

function getStatusStyle(status) {
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
  //   } else {
  //     return { backgroundColor: "#e2e3e5", color: "#495057" }
  //   }
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EmployeeTasksView({ selectedEmployee, allTasks, onBack }) {
  // const [statusFilter, setStatusFilter] = useState("All");
  // const [fromDate, setFromDate] = useState("");
  // const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [taskRows, setTaskRows] = useState(5);

  useEffect(() => setTaskPage(1), [selectedEmployee, appliedSearchQuery]);

  const employeeTasks = useMemo(() => {
    let tasks = allTasks.filter((t) => t.employeeId === selectedEmployee.id);

    //   if (statusFilter !== "All") {
    //     tasks = tasks.filter((t) => t.status === statusFilter);
    //   }
    //   if (fromDate) {
    //     tasks = tasks.filter((t) => t.dueDate >= fromDate);
    //   }
    //   if (toDate) {
    //     tasks = tasks.filter((t) => t.dueDate <= toDate);
    //   }

    //   return tasks;
    // }, [allTasks, selectedEmployee, statusFilter, fromDate, toDate]);

    // Apply search filter
    if (appliedSearchQuery.trim() !== "") {
      const query = appliedSearchQuery.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.status.toLowerCase().includes(query) ||
          task.project.toLowerCase().includes(query) ||
          formatDate(task.dueDate).toLowerCase().includes(query),
      );
    }

    return tasks;
  }, [allTasks, selectedEmployee, appliedSearchQuery]);

  ////
  const paginatedEmployeeTasks = useMemo(() => {
    const start = (taskPage - 1) * taskRows;
    return employeeTasks.slice(start, start + taskRows);
  }, [employeeTasks, taskPage, taskRows]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(employeeTasks.length / taskRows));
  const indexOfLastItem = taskPage * taskRows;
  const indexOfFirstItem = indexOfLastItem - taskRows;
  const from = employeeTasks.length === 0 ? 0 : indexOfFirstItem + 1;
  const to = Math.min(indexOfLastItem, employeeTasks.length);
  const goTo = (p) => setTaskPage(Math.min(Math.max(p, 1), totalPages));
  const isPrevDisabled = taskPage <= 1 || employeeTasks.length === 0;
  const isNextDisabled = taskPage >= totalPages || employeeTasks.length === 0;

  function handleFilter() {
    setAppliedSearchQuery(searchQuery);
    setTaskPage(1);
  }
  function handleReset() {
    setStatusFilter("All");
    setAppliedSearchQuery("");
    setTaskPage(1);
  }

  return (
    <>
      {/* Title and Back Button outside card */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5
            className="mb-1 fw-semibold"
            style={{ color: "#3A5FBE", fontSize: "20px" }}
          >
            {selectedEmployee.name} - {selectedEmployee.role}
          </h5>
          <small className="text-muted">
            Department: {selectedEmployee.department} | Manager:{" "}
            {selectedEmployee.managerName}
          </small>
        </div>
        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            onBack();
            handleReset();
          }}
        >
          Back to List
        </button>
      </div>

      {/* Filter Section Card */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Search Filter */}
            <div
              className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100"
              style={{ minWidth: "300px" }}
            >
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 14, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by any field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter and Reset buttons */}
            <div className="d-flex gap-2 ms-auto">
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
      </div>

      {/* Table Card */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-0">
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
                {paginatedEmployeeTasks.length > 0 ? (
                  paginatedEmployeeTasks.map((task) => (
                    <tr key={task.id}>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.title}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                        //   style={{
                        //     ...getStatusStyle(task.status),
                        //     padding: "6px 12px",
                        //     borderRadius: "6px",
                        //     fontSize: "13px",
                        //     fontWeight: "500",
                        //     display: "inline-block",
                        //   }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.project}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          color: "#212529",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(task.dueDate)}
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
      </div>

      {/* Inline Pagination */}
      <div className="d-flex justify-content-end mt-3">
        <nav
          className="d-flex align-items-center justify-content-end text-muted"
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
                value={taskRows}
                onChange={(e) => {
                  setTaskRows(Number(e.target.value));
                  setTaskPage(1);
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
              {from}-{to} of {employeeTasks.length}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm border-0"
                type="button"
                onClick={() => goTo(taskPage - 1)}
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
                className="btn btn-sm border-0"
                type="button"
                onClick={() => goTo(taskPage + 1)}
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
      </div>
    </>
  );
}

export default EmployeeTasksView;
