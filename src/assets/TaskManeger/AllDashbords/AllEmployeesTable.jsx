import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const DEPARTMENTS = [
  "All",
  "Development",
  "Quality Assurance",
  "Design",
  "Operations",
];

function AllEmployeesTable({ employees, onClose, onViewTasks }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(""); // Applied filter new dip

  const [empPage, setEmpPage] = useState(1);
  const [empRows, setEmpRows] = useState(5);

  // useEffect(() => setEmpPage(1), [departmentFilter, searchQuery]);

  //  Create a lookup map for manager names
  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => {
      map.set(emp.id, emp.name);
    });
    return map;
  }, [employees]);

  //  Enrich employees with actual manager names
  const enrichedEmployees = useMemo(() => {
    return employees.map((emp) => ({
      ...emp,
      managerName: emp.managerId
        ? employeeMap.get(emp.managerId) || "N/A"
        : "N/A",
    }));
  }, [employees, employeeMap]);

  const filteredEmployees = useMemo(() => {
    let result = enrichedEmployees;

    // // Apply department filter
    // if (departmentFilter !== "All") {
    //   result = result.filter((emp) => emp.department === departmentFilter);
    // }

    // Apply search filter
    if (appliedSearchQuery.trim() !== "") {
      const query = appliedSearchQuery.toLowerCase();
      result = result.filter(
        (emp) =>
          (emp.name || "").toLowerCase().includes(query) ||
          (emp.role || "").toLowerCase().includes(query) ||
          (emp.department || "").toLowerCase().includes(query) ||
          (emp.managerName || "").toLowerCase().includes(query) ||
          (emp.designation || "").toLowerCase().includes(query) ||
          (emp.email || "").toLowerCase().includes(query) ||
          (emp.contact || "").toLowerCase().includes(query),
      );
    }

    return result;
  }, [enrichedEmployees, appliedSearchQuery]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empRows;
    return filteredEmployees.slice(start, start + empRows);
  }, [filteredEmployees, empPage, empRows]);

  //  pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / empRows));
  const indexOfLastItem = empPage * empRows;
  const indexOfFirstItem = indexOfLastItem - empRows;
  const from = filteredEmployees.length === 0 ? 0 : indexOfFirstItem + 1;
  const to = Math.min(indexOfLastItem, filteredEmployees.length);
  const goTo = (p) => setEmpPage(Math.min(Math.max(p, 1), totalPages));
  const isPrevDisabled = empPage <= 1 || filteredEmployees.length === 0;
  const isNextDisabled =
    empPage >= totalPages || filteredEmployees.length === 0;

  //dip code
  const handleFilter = () => {
    setAppliedSearchQuery(searchQuery);
    setEmpPage(1);
  };
  const handleReset = () => {
    setSearchQuery("");
    setAppliedSearchQuery(""); //change
    setEmpPage(1);
  };

  // gitanjali
  const downloadEmployeesExcel = (data) => {
    if (!data || data.length === 0) {
      alert("No employees available to download");
      return;
    }

    const excelData = data.map((emp, index) => ({
      "Sr No": index + 1,
      "Employee Name": emp.name || "-",
      Role: emp.role || "-",
      Department: emp.department || "-",
      Manager: emp.managerName || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "All Employees");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "All_Employees.xlsx");
  };

  return (
    <>
      {/* Title outside table with Close button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5
          className="mb-0 fw-semibold"
          style={{ color: "#3A5FBE", fontSize: "20px" }}
        >
          All Employees
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

            {/* Department Label and Select inline
            <div
              className="d-flex align-items-center gap-2"
              style={{ minWidth: "250px" }}
            >
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 14, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Department
              </label>
              <select
                className="form-select form-select-sm"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ flex: 1 }}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div> */}

            {/* Filter and Reset buttons at the end */}
            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                onClick={() => downloadEmployeesExcel(filteredEmployees)}
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
                    Name
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
                    Role
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
                    Department
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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.id}>
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
                        {emp.name}
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
                        {emp.role}
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
                        {emp.department}
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
                        {emp.managerName}
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
                        <button
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => onViewTasks(emp)}
                        >
                          View Tasks
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-3 text-muted">
                      No employees found.
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
                value={empRows}
                onChange={(e) => {
                  setEmpRows(Number(e.target.value));
                  setEmpPage(1);
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
              {from}-{to} of {filteredEmployees.length}
            </span>

            <div
              className="d-flex align-items-center"
              style={{ marginLeft: "16px" }}
            >
              <button
                className="btn btn-sm focus-ring "
                type="button"
                onClick={() => goTo(empPage - 1)}
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
                onClick={() => goTo(empPage + 1)}
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

export default AllEmployeesTable;
