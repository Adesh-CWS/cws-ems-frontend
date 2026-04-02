import React, { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function UpcomingTasksTable({ upcomingTasks, allEmployees, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingRows, setUpcomingRows] = useState(5);

  //popup code dip
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUpcomingTasks, setSelectedUpcomingTasks] = useState(null);

  useEffect(() => setUpcomingPage(1), [appliedSearchQuery]);

  const filteredTasks = useMemo(() => {
    let result = upcomingTasks;

    // Apply search filter only after Filter button is clicked
    if (appliedSearchQuery.trim() !== "") {
      const query = appliedSearchQuery.toLowerCase();
      result = result.filter((task) => {
        const emp = allEmployees.find((e) => e.id === task.employeeId);
        const employeeName = emp ? emp.name.toLowerCase() : "";

        return (
          task.title.toLowerCase().includes(query) ||
          employeeName.includes(query) ||
          task.project.toLowerCase().includes(query) ||
          formatDate(task.dueDate).toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [upcomingTasks, appliedSearchQuery, allEmployees]);

  const paginatedUpcomingTasks = useMemo(() => {
    const start = (upcomingPage - 1) * upcomingRows;
    return filteredTasks.slice(start, start + upcomingRows);
  }, [filteredTasks, upcomingPage, upcomingRows]);

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / upcomingRows),
  );
  const indexOfLastItem = upcomingPage * upcomingRows;
  const indexOfFirstItem = indexOfLastItem - upcomingRows;
  const from = filteredTasks.length === 0 ? 0 : indexOfFirstItem + 1;
  const to = Math.min(indexOfLastItem, filteredTasks.length);
  const goTo = (p) => setUpcomingPage(Math.min(Math.max(p, 1), totalPages));
  const isPrevDisabled = upcomingPage <= 1 || filteredTasks.length === 0;
  const isNextDisabled =
    upcomingPage >= totalPages || filteredTasks.length === 0;

  const handleFilter = () => {
    setAppliedSearchQuery(searchQuery);
    setUpcomingPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setAppliedSearchQuery("");
    setUpcomingPage(1);
  };

  // gitanjali
  const handleExcelDownload = () => {
    if (!filteredTasks || filteredTasks.length === 0) return;

    const excelData = filteredTasks.map((task, index) => {
      const emp = allEmployees.find((e) => e.id === task.employeeId);

      return {
        "Sr No": index + 1,
        "Task Title": task.title,
        "Employee Name": emp ? emp.name : "-",
        Project: task.project,
        "Due Date": formatDate(task.dueDate),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Upcoming Tasks");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "Upcoming_Tasks.xlsx");
  };

  ///row clickable
  const handleRowClick = (upcomingTasks) => {
    setSelectedUpcomingTasks(upcomingTasks);
    setShowPopup(true);
  };

  const selectedEmployee = allEmployees.find(
    (e) => e.id === selectedUpcomingTasks?.employeeId,
  );
  ///focus pop-up
  const popupRef = useRef(null);
  useEffect(() => {
    if (selectedUpcomingTasks && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedUpcomingTasks]);

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
    <>
      {/* Title outside table with Close button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5
          className="mb-0 fw-semibold"
          style={{ color: "#3A5FBE", fontSize: "20px" }}
        >
          Upcoming Tasks (Next 7 days)
        </h5>
        <button className="btn btn-sm custom-outline-btn" style={{ minWidth: 90 }} onClick={onClose}>
          Close
        </button>
      </div>

      {/* Filter Section with inline layout */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Search Label and Input inline */}
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
                placeholder="Search By Any Field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFilter();
                  }
                }}
              />
            </div>

            {/* Filter and Reset buttons at the end */}
            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                onClick={handleExcelDownload}
                disabled={filteredTasks.length === 0}
              >
                Download Excel
              </button>
              <button
                className="btn btn-sm custom-outline-btn"
                 style={{minWidth:"90px"}}
                onClick={handleFilter}
              >
                Filter
              </button>
              <button
                className="btn btn-sm custom-outline-btn"  style={{minWidth:"90px"}}
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card without header */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-0">
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
                      whiteSpace: "nowrap",
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
                    }}
                  >
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUpcomingTasks.length > 0 ? (
                  paginatedUpcomingTasks.map((task) => {
                    const emp = allEmployees.find(
                      (e) => e.id === task.employeeId,
                    );
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task)}
                        style={{ cursor: "pointer" }}
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
                          {task.title}
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
                          {emp ? emp.name : "-"}
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
                          {task.project}
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
                          {formatDate(task.dueDate)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      No upcoming tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPopup && selectedUpcomingTasks && (
        <div
          ref={popupRef}
          tabIndex="0"
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
        >
          
          <div
            className="modal-dialog"
            style={{ maxWidth: "650px", width: "95%" }}
          >
          <div
            className="modal-content"
            
          >
            {/* HEADER */}
            <div
              className="modal-header text-white"
              style={{ backgroundColor: "#3A5FBE" }}
            >
              <h5 className="modal-title mb-0">Upcoming Tasks Details</h5>
              <button
                className="btn-close btn-close-white"
                onClick={() => setShowPopup(false)}
              />
            </div>

            {/* DETAILS (VIEW ONLY) */}
            <div className="modal-body">
                <div className="container-fluid">
            <div className="row mb-2">
              <div  className="col-5 col-sm-3 fw-semibold">Task</div>
              <div  className="col-7 col-sm-9">{selectedUpcomingTasks.title}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Employee Name</div>
              <div className="col-7 col-sm-9"> {selectedEmployee?.name ?? "-"}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Project</div>
              <div className="col-7 col-sm-9">{selectedUpcomingTasks.project}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Due Date</div>
              <div className="col-7 col-sm-9">
{formatDate(selectedUpcomingTasks.dueDate)}
              </div>
            </div>
</div>
</div>
            {/* CLOSE BUTTON */}
            <div className="modal-footer border-0 pt-0">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Inline Pagination */}
      <div className="d-flex justify-content-end mt-3">
        <nav className="d-flex align-items-center justify-content-end text-muted">
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
                value={upcomingRows}
                onChange={(e) => {
                  setUpcomingRows(Number(e.target.value));
                  setUpcomingPage(1);
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
              {from}-{to} of {filteredTasks.length}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                cclassName="btn btn-sm focus-ring"
                type="button"
                onClick={() => goTo(upcomingPage - 1)}
                disabled={isPrevDisabled}
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
                className="btn btn-sm focus-ring"
                type="button"
                onClick={() => goTo(upcomingPage + 1)}
                disabled={isNextDisabled}
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

export default UpcomingTasksTable;
