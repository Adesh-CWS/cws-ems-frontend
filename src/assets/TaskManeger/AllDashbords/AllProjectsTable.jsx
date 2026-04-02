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

function AllProjectsTable({ projects, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(""); // New state for applied search
  const [projPage, setProjPage] = useState(1);
  const [projRows, setProjRows] = useState(5);
  //popup code dip
  const [showPopup, setShowPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // useEffect(() => setProjPage(1), [searchQuery, statusFilter]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    // Apply search filter new code dip
    if (appliedSearchQuery.trim() !== "") {
      const query = appliedSearchQuery.toLowerCase();
      result = result.filter(
        (proj) =>
          proj.name.toLowerCase().includes(query) ||
          proj.managerName.toLowerCase().includes(query) ||
          proj.status.toLowerCase().includes(query) ||
          formatDate(proj.deliveryDate).toLowerCase().includes(query),
      );
    }

    return result;
  }, [projects, appliedSearchQuery]);

  const paginatedProjects = useMemo(() => {
    const start = (projPage - 1) * projRows;
    return filteredProjects.slice(start, start + projRows);
  }, [filteredProjects, projPage, projRows]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projRows));
  const indexOfLastItem = projPage * projRows;
  const indexOfFirstItem = indexOfLastItem - projRows;
  const from = filteredProjects.length === 0 ? 0 : indexOfFirstItem + 1;
  const to = Math.min(indexOfLastItem, filteredProjects.length);
  const goTo = (p) => setProjPage(Math.min(Math.max(p, 1), totalPages));
  const isPrevDisabled = projPage <= 1 || filteredProjects.length === 0;
  const isNextDisabled =
    projPage >= totalPages || filteredProjects.length === 0;

  //new code dip
  const handleFilter = () => {
    setAppliedSearchQuery(searchQuery);
    setProjPage(1);
  };
  const handleReset = () => {
    setSearchQuery("");
    setAppliedSearchQuery(""); //change
    setProjPage(1);
  };
  const handleRowClick = (project) => {
    setSelectedProject(project);
    setShowPopup(true);
  };
  ///focus pop-up
  const popupRef = useRef(null);
  useEffect(() => {
    if (selectedProject && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedProject]);

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

  //gitanjali
  const handleDownloadExcel = () => {
    if (!Array.isArray(filteredProjects) || filteredProjects.length === 0) {
      alert("No projects available to download");
      return;
    }

    const excelData = filteredProjects.map((proj, index) => ({
      "Sr No": index + 1,
      "Project Name": proj?.name ?? "-",
      Status: proj?.status ?? "-",
      "Manager Name": proj?.managerName ?? "-",
      "Delivery Date": proj?.deliveryDate ? formatDate(proj.deliveryDate) : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Projects");

    XLSX.writeFile(workbook, "All_Projects.xlsx");
  };

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
      {/* Title  */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5
          className="mb-0 fw-semibold"
          style={{ color: "#3A5FBE", fontSize: "20px" }}
        >
          All Projects
        </h5>
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: "90px" }}
          onClick={onClose}
        >
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
              />
            </div>

            {/* Status Label and Select inline
            <div
              className="d-flex align-items-center gap-2"
              style={{ minWidth: "250px" }}
            >
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 14, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Status
              </label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div> */}

            {/* Filter and Reset buttons at the end */}
            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                onClick={handleDownloadExcel}
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
                    Manager
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
                    Delivery Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => handleRowClick(proj)}
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
                        }}
                      >
                        <span
                        // style={{
                        //   ...getStatusStyle(proj.status),
                        //   padding: "6px 12px",
                        //   borderRadius: "6px",
                        //   fontSize: "13px",
                        //   fontWeight: "500",
                        // }}
                        >
                          {proj.status}
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
                        {proj.managerName}
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
                        {formatDate(proj.deliveryDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    {showPopup && selectedProject && (
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
              <h5 className="modal-title mb-0">Project Details</h5>
              <button
                className="btn-close btn-close-white"
                onClick={() => setShowPopup(false)}
              />
            </div>

            {/* DETAILS (VIEW ONLY) */}
            <div className="modal-body">
                <div className="container-fluid">
            <div className="row mb-2">
              <div  className="col-5 col-sm-3 fw-semibold">Project Name</div>
              <div  className="col-7 col-sm-9">{selectedProject.name}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Status</div>
              <div className="col-7 col-sm-9">{selectedProject.status}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Manager</div>
              <div className="col-7 col-sm-9">{selectedProject.managerName}</div>
            </div>

            <div className="row mb-2">
              <div className="col-5 col-sm-3 fw-semibold">Delivery Date</div>
              <div className="col-7 col-sm-9">
                {formatDate(selectedProject.deliveryDate)}
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
                value={projRows}
                onChange={(e) => {
                  setProjRows(Number(e.target.value));
                  setProjPage(1);
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
              {from}-{to} of {filteredProjects.length}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm focus-ring " ////change
                type="button"
                onClick={() => goTo(projPage - 1)}
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
                className="btn btn-sm focus-ring " ////change
                type="button"
                onClick={() => goTo(projPage + 1)}
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

export default AllProjectsTable;
