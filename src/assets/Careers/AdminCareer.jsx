import React, { useState, useEffect, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import "./AdminCareer.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";


function AdminCareer({ user }) {
  const [formErrors, setFormErrors] = useState({}); //Added by Rutuja
  const userRole = user.role || localStorage.getItem("role");

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("inhouse");
  const modalRef = useRef(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  // View popup tabs
  const [activeViewTab, setActiveViewTab] = useState("details");
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);

  // Filters
  //added by rushikesh
  const navigate = useNavigate();
  const { role, username, id } = useParams();
  // 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignDateFromFilter, setAssignDateFromFilter] = useState("");
  const [assignDateToFilter, setAssignDateToFilter] = useState("");
  const [newJob, setNewJob] = useState({
    jobTitle: "",
    department: "",
    grade: "",
    location: "",
    hiringType: "",
    jobType: "",
    noOfOpenings: 1,
    dueOn: "",
    jobDescription: "",
    ctc: {
      min: "",
      max: "",
    },
    experience: {
      min: "",
      max: "",
    },
    importantSkills: [],
    status: "Active",
  });
  const [expandedJobId, setExpandedJobId] = useState(null); //Added bu samiksha


  
  useEffect(() => {
    fetchJobs();
    setFilteredJobs(jobs);
  }, []);
  useEffect(() => {
    applyFilters();
  }, [activeTab, jobs]);




  const fetchJobs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/jobs/");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
    }
  };

  // useEffect(() => {
  //   const temp = jobs.filter(
  //     (j) => j.jobType === activeTab || j.jobType === "both",
  //   );
  //   setFilteredJobs(temp);
  // }, [activeTab, jobs]);
  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

  //Addeed by Rutuja
  const validateForm = () => {
    const errors = {};

    if (!newJob.jobTitle.trim()) {
      errors.jobTitle = "Job Title is required";
    }

    if (!newJob.location) {
      errors.location = "Location is required";
    }

    if (!newJob.hiringType) {
      errors.hiringType = "Hiring Type is required";
    }

    if (!newJob.jobType) {
      errors.jobType = "Job Type is required";
    }

    if (!newJob.noOfOpenings || newJob.noOfOpenings < 1) {
      errors.noOfOpenings = "Number of openings must be at least 1";
    }

    if (!newJob.jobDescription || newJob.jobDescription.trim() === "") {
      errors.jobDescription = "Job Description is required";
    } else {
      const plainText = newJob.jobDescription.replace(/<[^>]+>/g, '');
      if (plainText.length > 300) {
        errors.jobDescription = "Job Description cannot exceed 300 characters";
      }
    }

    if (
      !newJob.importantSkills ||
      newJob.importantSkills.length === 0 ||
      (Array.isArray(newJob.importantSkills) &&
        newJob.importantSkills.length === 0) ||
      (typeof newJob.importantSkills === "string" &&
        newJob.importantSkills.trim() === "")
    ) {
      errors.importantSkills = "Important Skills are required";
    }

    if (!newJob.dueOn) {
      errors.dueOn = "Due date is required";
    } else {
      const dueDate = new Date(newJob.dueOn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        errors.dueOn = "Due date cannot be in the past";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSaveJob(e) {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fill all required fields correctly");
      return;
    }
    try {
      let processedSkills = [];
      if (Array.isArray(newJob.importantSkills)) {
        processedSkills = newJob.importantSkills;
      } else if (typeof newJob.importantSkills === "string") {
        processedSkills = newJob.importantSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "");
      }
      const payload = {
        jobTitle: newJob.jobTitle,
        department: newJob.department,
        grade: newJob.grade,
        location: newJob.location,
        hiringType: newJob.hiringType,
        jobType: newJob.jobType,
        // noOfOpenings: newJob.noOfOpenings,
        // dueOn: newJob.dueOn,
        // jobDescription: newJob.jobDescription,
        // ctc: {
        //   min: newJob.ctc.min,
        //   max: newJob.ctc.max,
        // },
        // experience: {
        //   min: newJob.experience.min,
        //   max: newJob.experience.max,
        // },
        // importantSkills: newJob.importantSkills,
        // status: "Active",
        //Added by Samiksha
        noOfOpenings: Number(newJob.noOfOpenings),

        dueOn: newJob.dueOn,
        jobDescription: newJob.jobDescription,

        ctc: {
          min: Number(newJob.ctc.min),
          max: Number(newJob.ctc.max),
        },

        experience: {
          min: Number(newJob.experience.min),
          max: Number(newJob.experience.max),
        },

        importantSkills: Array.isArray(newJob.importantSkills)
          ? newJob.importantSkills
          : [],

        status: "Active",
      };
      console.log("payload", payload);
      let res;
      if (editJobId) {
        res = await axios.put(
          `http://localhost:8000/api/jobs/${editJobId}`,
          payload,
          { headers: { "Content-Type": "application/json" } },
        );
        await fetchJobs();
      } else {
        const res = await axios.post(
          "http://localhost:8000/api/jobs/",
          payload,
          { headers: { "Content-Type": "application/json" } },
        );
        await fetchJobs();
      }
      setFilteredJobs(jobs);
      setShowAddJob(false);

      if (!editJobId) {
        const lastPage = Math.ceil(jobs.length / itemsPerPage);
        setCurrentPage(lastPage);
      }

      setShowAddJob(false);
      setNewJob({
        jobTitle: "",
        department: "",
        grade: "",
        location: "",
        hiringType: "",
        jobType: "",
        noOfOpenings: 1,
        dueOn: "",
        jobDescription: "",
        ctc: {
          min: "",
          max: "",
        },
        experience: {
          min: "",
          max: "",
        },
        importantSkills: [],
        status: "",
      });
      alert(editJobId ? "Job updated" : "Job created");
      setEditJobId(null);
    } catch (error) {
      console.error("Submit failed:", error.response?.data || error.message);
      // alert("Operation failed");
      alert(error.response?.data?.error || "Operation failed"); //Added by Samiksha
    }
  }

  const handleEdit = (job) => {
    console.log("jobs from handle edit", job);
    setEditJobId(job._id);
    setShowAddJob(true);
    setEditMode(true);
    setNewJob({
      jobTitle: job?.jobTitle || "",
      department: job?.department || "",
      grade: job?.grade || "",
      location: job?.location || "",
      hiringType: job?.hiringType || "",
      jobType: job?.jobType || "",
      noOfOpenings: job?.noOfOpenings || "",
      dueOn: job?.dueOn ? new Date(job.dueOn).toISOString().split("T")[0] : "",
      jobDescription: job?.jobDescription || "",
      ctc: {
        min: job?.ctc?.min || "",
        max: job?.ctc?.max || "",
      },
      experience: {
        min: job?.experience?.min || "",
        max: job?.experience?.max || "",
      },
      importantSkills: Array.isArray(job?.importantSkills)
        ? job.importantSkills
        : typeof job?.importantSkills === "string"
          ? job.importantSkills.split(",").map((s) => s.trim())
          : [],
      status: job?.status || "",
    });
    setFormErrors({});
    console.log("new Job from edit", newJob);
  };

  async function handleDelete(id, e) {
    if (e) e.stopPropagation(); //Added by Rutuja
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/jobs/${id}`);
      setJobs((prev) => prev.filter((t) => t._id !== id));
      setFilteredJobs((prev) => prev.filter((t) => t._id !== id));

      alert("Job deleted Successfully!!"); //Added by Rutuja
    } catch (error) {
      alert("Failed to delete job");
      console.log("error", error.message);
    }
  }

  //   const applyFilters = () => {
  //   let temp = [...jobs];

  //   if (statusFilter !== "All") {
  //     temp = temp.filter(job => job?.status === statusFilter);
  //   }

  //   if (assignDateFromFilter) {
  //     temp = temp.filter(job => new Date(job?.createdAt));
  //   }

  //   if (assignDateToFilter) {
  //     temp = temp.filter(job => new Date(job?.dueOn));
  //   }

  //   // temp.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  //   setFilteredJobs(temp);
  //   setCurrentPage(1);
  // };
  const applyFilters = () => {
    let temp = jobs.filter(
      (job) => job.jobType === activeTab || job.jobType === "both",
    );

    // Status Filter
    if (statusFilter !== "All") {
      temp = temp.filter((job) => job.status === statusFilter);
    }

    // Created Date Filter
    if (assignDateFromFilter) {
      const fromDate = new Date(assignDateFromFilter);
      fromDate.setHours(0, 0, 0, 0);

      temp = temp.filter((job) => {
        const created = new Date(job.createdAt);
        created.setHours(0, 0, 0, 0);
        return created >= fromDate;
      });
    }

    // Due Date Filter
    if (assignDateToFilter) {
      const toDate = new Date(assignDateToFilter);
      toDate.setHours(23, 59, 59, 999);

      temp = temp.filter((job) => {
        const due = new Date(job.dueOn);
        due.setHours(0, 0, 0, 0);
        return due <= toDate;
      });
    }

    // ✅ LIFO SORT (LATEST FIRST)
    temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredJobs(temp);
    setCurrentPage(1);
  };
  const getApplicantsInfo = async (jobId) => {
    try {
      setLoadingApplicants(true);
      const res = await fetch(`http://localhost:8000/api/apply/job/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch applicants");
      }

      const data = await res.json();
      setApplicants(data);
    } catch (err) {
      console.error("Error fetching applicants:", err.message);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // const resetFilters = () => {
  //   setStatusFilter("All");
  //   setAssignDateFromFilter("");
  //   setAssignDateToFilter("");
  //   setFilteredJobs([...jobs]);
  //   setCurrentPage(1);
  // };
  const resetFilters = () => {
    setStatusFilter("All");
    setAssignDateFromFilter("");
    setAssignDateToFilter("");

    const temp = jobs.filter(
      (job) => job.jobType === activeTab || job.jobType === "both",
    );

    setFilteredJobs(temp);
    setCurrentPage(1);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };


  



  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredJobs.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  console.log("applicants ", applicants);
  async function handleStatusChange(applicationId, newStatus) {
    try {
      await axios.put(`http://localhost:8000/api/apply/${applicationId}`, {
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (err) {
      alert("Failed to update status");
    }

    // popup close
    setOpenStatusId(null);
  }

  //Added by Tanvi
  // tanvi
  const isAnyPopupOpen = !!showViewPopup || viewJob || showAddJob;
  useEffect(() => {
    if (isAnyPopupOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; // 🔑 important
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyPopupOpen]);

  const isAnyModalOpen = showViewPopup || viewJob || showAddJob;

  useEffect(() => {

    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];


    modal.focus();


    const handleKeyDown = (e) => {

      if (e.key === "Escape") {
        e.preventDefault();
        setShowViewPopup(false);
        setViewJob(false);
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        }
        else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };

  }, [isAnyModalOpen]);
  // mahesh code
  const isExpired = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return due <= today;
  };
  // mahesh code

  //snehal code
  const handleRepost = (job) => {
  setNewJob({
    jobTitle: job.jobTitle || "",
    department: job.department || "",
    grade: job.grade || "",
    location: job.location || "",
    hiringType: job.hiringType || "",
    jobType: job.jobType || "",
    noOfOpenings: job.noOfOpenings || 1,
    dueOn: "",
    jobDescription: job.jobDescription || "",
    ctc: {
      min: job?.ctc?.min || "",
      max: job?.ctc?.max || "",
    },
    experience: {
      min: job?.experience?.min || "",
      max: job?.experience?.max || "",
    },
    importantSkills: job.importantSkills || [],
    status: "Active",
  });

  setEditMode(true);
  setEditJobId(job._id);
  setShowViewPopup(false);
  setShowAddJob(true);
};
const handleRowClick = (job) => {
  const today = new Date();
  const dueDate = new Date(job.dueOn);

  if (dueDate < today) {
    setViewJob(job);
    setShowViewPopup(true);
  }
};
//snehal code
  return (
    <div className="container-fluid ">
      <div className="d-flex justify-content-between mb-3">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px", marginLeft: "15px" }}>
          Jobs
        </h2>
        {["hr", "admin"].includes(userRole) && (
          <button
            className="btn btn-sm custom-outline-btn"
            onClick={() => {
              setNewJob({
                jobTitle: "",
                department: "",
                grade: "",
                location: "",
                hiringType: "",
                jobType: "",
                noOfOpenings: 1,
                dueOn: "",
                jobDescription: "",
                ctc: {
                  min: "",
                  max: "",
                },
                experience: {
                  min: "",
                  max: "",
                },
                importantSkills: [],
                status: "",
              });
              setShowAddJob(true);
            }}
            style={{ minWidth: 90, height: 30 }}
          >
            + Add Job
          </button>
        )}
      </div>

      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1  ms-2">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "2px",
                }}
              >
                Search
              </label>
              <input
                id="employeeNameFilter"
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by any feild"
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="assignDateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                Date
              </label>
              <input
                type="date"
                id="assignDateFromFilter"
                value={assignDateFromFilter}
                onChange={(e) => setAssignDateFromFilter(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="form-control"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
              />
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="submit"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
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

      <div className="d-flex flex-row justify-content-start justify-content-md-center gap-2 mb-3 list-unstyled flex-wrap">
        <button
          className={`btn btn-sm job-tab-btn ${activeTab === "inhouse" ? "active" : ""
            }`}
          onClick={() => setActiveTab("inhouse")}
        >
          {" "}
          In-House Jobs
        </button>
        <button
          className={`btn btn-sm job-tab-btn ${activeTab === "referral" ? "active" : ""
            }`}
          onClick={() => setActiveTab("referral")}
        >
          {" "}
          Open for Referral
        </button>
      </div>

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
                  Job Title
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
                  Location
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
                  Openings
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
                  Description
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
                  Created
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
                  Due On
                </th>
                {/* {["hr", "admin"].includes(userRole) && (
                    <>  */}
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
                {/* </>
              )} */}
              </tr>
            </thead>
            <tbody>
              {" "}
              {currentJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-4"
                    style={{ color: "#212529" }}
                  >
                    No jobs found.
                  </td>
                </tr>
              ) : (
                currentJobs.map((job) => (
                  // mahesh tr code
                  <tr
                    key={job._id}
                    style={{
                      cursor: isExpired(job.dueOn) ? "not-allowed" : "pointer",
                      backgroundColor: isExpired(job.dueOn) ? "#f5f5f5" : "",
                      opacity: isExpired(job.dueOn) ? 0.6 : 1,
                    }}
                    onClick={() => {
                      setApplicants([]);
                      setViewJob(job);
                      setActiveViewTab("details");
                      setShowViewPopup(true);
                      getApplicantsInfo(job._id);
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        maxWidth: "200px",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                        title={job.jobTitle}
                      >
                        {job.jobTitle.length > 50
                          ? job.jobTitle.substring(0, 50) + "..."
                          : job.jobTitle}
                      </div>
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
                      {job.department}
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
                      {job.location}
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
                      {job.noOfOpenings}
                    </td>
                    {/* //Added by Samiksha */}

                    {/* mahesh code */}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        color: "#212529",
                        cursor: isExpired(job) ? "not-allowed" : "pointer",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        maxWidth: "250px",
                      }}
                      onClick={() => {
                        if (isExpired(job)) return;
                        e.stopPropagation();
                        setExpandedJobId(
                          expandedJobId === job._id ? null : job._id,
                        );
                      }}
                    >
                      <div
                        style={{
                          maxHeight:
                            expandedJobId === job._id ? "150px" : "20px",
                          overflowY:
                            expandedJobId === job._id ? "auto" : "hidden",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {job.jobDescription
                          ? expandedJobId === job._id
                            ? job.jobDescription.replace(/<[^>]+>/g, "")
                            : job.jobDescription
                              .replace(/<[^>]+>/g, "")
                              .substring(0, 50) +
                            (job.jobDescription.length > 50 ? "..." : "")
                          : "-"}
                      </div>
                    </td>
                    {/* mahesh code */}
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
                      {formatDate(job.createdAt)}
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
                      {formatDate(job.dueOn)}
                    </td>



                    <td>
                      {/* <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ marginRight: "10px" }}
                        onClick={() => {
                          // console.log("VIEW CLICKED", job);
                          // setViewJob(job);
                          // getApplicantsInfo(job._id);
                          // setShowViewPopup(true);
                          setApplicants([]);
                          setViewJob(job);
                          setActiveViewTab("details");
                          setShowViewPopup(true);
                          getApplicantsInfo(job._id);
                        }}
                      >
                        View
                      </button> */}
                      {["hr", "admin"].includes(userRole) && (
                        <>

                          {/* added by rushikesh */}
                          <div className="d-flex flex-nowrap align-items-center gap-2">

                            <button
                              className="btn btn-sm custom-outline-btn"
                              style={{ minWidth: 120 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/${role}/${username}/${id}/job-candidates/${job._id}`);
                              }}
                            >
                              View Candidates
                            </button>

                            {/* mahesh code */}
                            <button
                              className="btn btn-sm custom-outline-btn me-2"
                              disabled={isExpired(job.dueOn)}
                              style={{
                                opacity: isExpired(job.dueOn) ? 0.5 : 1,
                                cursor: isExpired(job.dueOn)
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isExpired(job.dueOn)) return;
                                handleEdit(job);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={isExpired(job.dueOn)}
                              style={{
                                opacity: isExpired(job.dueOn) ? 0.5 : 1,
                                cursor: isExpired(job.dueOn)
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isExpired(job.dueOn)) return;
                                handleDelete(job._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>

                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
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
            {filteredJobs.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredJobs.length
              }`}
          </span>

          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
             className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
                 className="btn btn-sm focus-ring"

              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* //added by Mahesh*/}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>

      {/* //added by Rushikesh */}
      {showAddJob && (
        <div
          ref={modalRef}
          tabIndex="-1"
          className="modal fade show d-block"

          style={{ background: "#00000080" }}
        >
          <div  className="modal-dialog modal-dialog-centered"
            style={{ width: "600px" }}
            >
            <div className="modal-content shadow-lg"
            ref={modalRef}
            tabIndex="-1" 
              >
              <div className="modal-header-custom">
                {editJobId ? "Edit Job" : "Add Job"}

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => {
                    setShowAddJob(false);
                    setEditJobId(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSaveJob}>
                  <h5 className="section-title">Basic Information</h5>

                  {/* Location */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Location *</div>
                    <div className="col-12 col-md-8">
                      <input
                        className="form-control"
                        value={newJob.location}
                        onChange={(e) =>
                          setNewJob({ ...newJob, location: e.target.value })
                        }
                      >

                      </input>
                    </div>
                  </div>

                  {/* Hiring Type */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Hiring Type *</div>
                    <div className="col-12 col-md-8">
                      <select
                        className="form-select"
                        value={newJob.hiringType}
                        onChange={(e) =>
                          setNewJob({ ...newJob, hiringType: e.target.value })
                        }
                      >
                        <option value="">Select Type</option>
                        <option>Full-Time</option>
                        <option>Contract</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Job Type *</div>
                    <div className="col-12 col-md-8">
                      <select
                        className="form-select"
                        value={newJob.jobType}
                        onChange={(e) =>
                          setNewJob({ ...newJob, jobType: e.target.value })
                        }
                      >
                        <option value="">Select Job Type</option>
                        <option value="inhouse">In-House</option>
                        <option value="referral">Open for Referral</option>
                      </select>
                    </div>
                  </div>

                  {/* Openings */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">No of Openings *</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="number"
                        className="form-control"
                        value={newJob.noOfOpenings}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            noOfOpenings: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="row mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Job Description *</div>
                    <div className="col-12 col-md-8">
                      <RichTextEditor
                        value={newJob.jobDescription}
                        onChange={(value) =>
                          setNewJob((prev) => ({
                            ...prev,
                            jobDescription: value,
                          }))
                        }
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
                        {newJob.jobDescription.replace(/<[^>]+>/g, '').length}/300 characters
                      </div>
                    </div>
                  </div>
                  

                  <h5 className="section-title">CTC Details (₹)</h5>


                  <div className="row mb-3">

                    <div className="col-12 col-md-4 fw-semibold">Min CTC</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="number"
                        className="form-control"
                        value={newJob.ctc?.min || ""}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            ctc: {
                              ...newJob.ctc,
                              min: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                  </div>


                  <div className="row align-items-center">
                    <div className="col-12 col-md-4 fw-semibold">Max CTC</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="number"
                        className="form-control"
                        value={newJob.ctc?.max || ""}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            ctc: {
                              ...newJob.ctc,
                              max: e.target.value,
                            },
                          })
                        }
                      />

                    </div>
                  </div>


                  <h5 className="section-title">Experience & Skills</h5>



                  <div className="row mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Min Experience(Years)</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="number"
                        className="form-control"
                        value={newJob.experience?.min || ""}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            experience: {
                              ...newJob.experience,
                              min: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>



                  <div className="row mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Max Experience(Years)</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="number"
                        className="form-control"
                        value={newJob.experience?.max || ""}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            experience: {
                              ...newJob.experience,
                              max: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                  </div>


                  {/* Skills */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Important Skills *</div>
                    <div className="col-12 col-md-8">
                      <input
                        className="form-control"
                        value={newJob.importantSkills.join(", ") || ""}
                        onChange={(e) =>
                          setNewJob({
                            ...newJob,
                            importantSkills: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="row align-items-center mb-3">
                    <div className="col-12 col-md-4 fw-semibold">Due On *</div>
                    <div className="col-12 col-md-8">
                      <input
                        type="date"
                        className="form-control"
                        value={newJob.dueOn || ""}
                        onChange={(e) =>
                          setNewJob({ ...newJob, dueOn: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn "
                      style={{ minWidth: 90 }}
                      onClick={() => {
                        setShowAddJob(false);
                        setEditJobId(null);
                      }}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="btn btn-sm custom-outline-btn" style={{ minWidth: 90 }}>

                      {editJobId ? "Save Changes" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}



      {showViewPopup && viewJob && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">{viewJob.jobTitle}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewPopup(false)}
                ></button>
              </div>




              <h5 className="section-title" style={{ marginLeft: 15 }}>Job Details</h5>

              <div className="modal-body">

                <div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Job ID</div>
                    <div className="col-9">{viewJob._id?.slice(-4)}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Location</div>
                    <div className="col-9">{viewJob.location}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Department</div>
                    <div className="col-9">{viewJob.department}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Job Type</div>
                    <div className="col-9">{viewJob.hiringType}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Experience</div>
                    <div className="col-9">
                      {viewJob.experience?.min} – {viewJob.experience?.max} Years
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-3 fw-semibold">Posted</div>
                    <div className="col-9">{formatDate(viewJob.createdAt)}</div>
                  </div>

                  {/* Key Skills */}
                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Key Skills</div>
                    <div className="col-9">
                      <ul className="mb-0 list-unstyled ps-0">
                        {viewJob.importantSkills?.map((skill, i) => (
                          <li key={i} style={{ marginBottom: "2px" }}>
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Other Skills */}
                  {viewJob.otherSkills?.length > 0 && (
                    <div className="row mb-2">
                      <div className="col-3 fw-semibold">Other Skills</div>
                      <div className="col-9">
                        <ul className="mb-0 list-unstyled ps-0">
                          {viewJob.otherSkills.map((skill, i) => (
                            <li key={i} style={{ marginBottom: "2px" }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Description</div>
                    <div className="col-9">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: viewJob.jobDescription,
                        }}
                      />
                    </div>
                  </div>

                </div>


              </div>

             {/* // snehal code              */}
              <div className="modal-footer">

  <button
    className="btn btn-sm custom-outline-btn"
    onClick={() => setShowViewPopup(false)}
  >
    Close
  </button>

  {isExpired(viewJob?.dueOn) && (
    <button
      className="btn btn-sm custom-outline-btn"
      onClick={() => handleRepost(viewJob)}
    >
      Repost
    </button>
  )}

</div>
 {/* // snehal code              */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminCareer;
