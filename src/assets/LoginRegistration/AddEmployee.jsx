import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./AddEmployee.css";

const AddEmployee = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    employeeId: "",
    gender: "Male",
    dob: "",
    maritalStatus: "Single",
    designation: "",
    department: "",
    salary: "",
    salaryType: "monthly",
    role: "employee",
    doj: "",
    currentAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
    },
    permanentAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
    },

    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifsc: "",
    },
    pfNumber: "",
    uanNumber: "",
  });
  const modalRef = useRef(null);
  const [files, setFiles] = useState({
    image: null,
    panCardPdf: null,
    aadharCardPdf: null,
    appointmentLetter: null,
    passbookPdf: null,
    certificatePdf: null,
  });

  //Add validation function - adesh
  // const validateField = (name, value) => {
  //   let error = "";

  //   switch (name) {

  //     case "name":
  //       if (!/^[A-Za-z\s]+$/.test(value)) error = "Name must contain only letters and spaces.";
  //       else if (value.trim() === "") error = "Name is required.";
  //       break;

  //     case "email":
  //       if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|creativewebsolution\.in)$/.test(value))
  //         error = "Please enter a valid email address.";
  //       break;

  //     case "contact":
  //       if (!/^\d{10}$/.test(value)) error = "Contact number must be exactly 10 digits.";
  //       break;

  //     case "salary":
  //       if (value <= 0) error = "Salary must be greater than 0.";
  //       break;

  //     case "dob":
  //       const minDate = new Date();
  //       minDate.setFullYear(minDate.getFullYear() - 18);
  //       if (new Date(value) > minDate)
  //         error = "Employee must be at least 18 years old.";
  //       break;

  //     case "designation":
  //       if (value.trim() === "") error = "Designation is required.";
  //       break;

  //     case "department":
  //       if (value.trim() === "") error = "Department is required.";
  //       break;

  //     default:
  //       break;
  //   }

  //   setErrors((prev) => ({ ...prev, [name]: error }));

  //   return error;
  // }

  useEffect(() => {
    if (!showModal || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(null);
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
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
  }, [showModal]);
  useEffect(() => {
    const isModalOpen = showModal;

    if (isModalOpen) {
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
  }, [showModal]);
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Name is required.";
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = "Name must contain only letters and spaces.";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required.";
        } else if (
          !/^[a-zA-Z0-9._%+-]+@(gmail\.com|creativewebsolution\.in)$/.test(
            value,
          )
        ) {
          error = "Please enter a valid email address.";
        }
        break;

      case "contact":
        if (!value.trim()) {
          error = "Contact number is required.";
        } else if (!/^\d{10}$/.test(value)) {
          error = "Contact number must be exactly 10 digits.";
        }
        break;

      case "employeeId":
        if (!value.trim()) {
          error = "Employee ID is required.";
        }
        break;

      case "salary":
        if (!value) {
          error = "Salary is required.";
        } else if (Number(value) <= 0) {
          error = "Salary must be greater than 0.";
        }
        break;

      case "dob":
        if (!value) {
          error = "Date of birth is required.";
        } else {
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - 18);
          if (new Date(value) > minDate) {
            error = "Employee must be at least 18 years old.";
          }
        }
        break;

      case "designation":
        if (!value.trim()) {
          error = "Designation is required.";
        }
        break;

      case "department":
        if (!value.trim()) {
          error = "Department is required.";
        }
        break;

      case "pfNumber":
        // if (!value.trim()) error = "PF Number is required.";
        // else
        if (!/^[A-Za-z0-9]+$/.test(value))
          error = "PF Number must be alphanumeric.";
        break;

      case "uanNumber":
        // if (!value.trim()) error = "UAN Number is required.";
        // else
        if (!/^\d{12}$/.test(value))
          error = "UAN Number must be exactly 12 digits.";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));

    return error;
  };

  const validateBankField = (name, value) => {
    let error = "";

    switch (name) {
      case "bankName":
        if (!value) error = "Bank name is required.";
        else if (!/^[A-Za-z\s]+$/.test(value))
          error = "Bank name must contain only letters and spaces.";
        break;

      case "accountNumber":
        if (!value) error = "Account number is required.";
        else if (!/^\d+$/.test(value))
          error = "Account number must contain only digits.";
        break;

      case "ifsc":
        if (!value) error = "IFSC code is required.";
        break;

      default:
        break;
    }

    setErrors((prev) => {
      const next = { ...prev };
      const key = `bankDetails.${name}`;
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });

    return error;
  };

  const validateAddressField = (addressKey, name, value) => {
    let error = "";

    switch (name) {
      case "street":
        if (value && value.trim().length < 3) error = "Street looks too short.";
        break;

      case "city":
        if (value && !/^[A-Za-z\s]+$/.test(value))
          error = "City must contain only letters and spaces.";
        break;

      case "state":
        if (value && !/^[A-Za-z\s]+$/.test(value))
          error = "State must contain only letters and spaces.";
        break;

      case "zip":
        if (value && !/^\d{6}$/.test(value))
          error = "PIN must be exactly 6 digits.";
        break;

      default:
        break;
    }

    const key = `${addressKey}.${name}`;
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });

    return error;
  };

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target;

    if (fieldName.startsWith("bankDetails.")) {
      const key = fieldName.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [key]: value },
      }));
      validateBankField(key, value);
    } else if (
      fieldName.startsWith("currentAddress.") ||
      fieldName.startsWith("permanentAddress.")
    ) {
      const [addressKey, key] = fieldName.split(".");

      setFormData((prev) => ({
        ...prev,
        [addressKey]: {
          ...prev[addressKey],
          [key]: value,
        },
      }));

      validateAddressField(addressKey, key, value);
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      validateField(fieldName, value);
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];
    let error = "";

    if (!file) {
      error = "This file is required.";
    } else {
      const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      const allowedDocTypes = [...allowedImageTypes, "application/pdf"];

      if (name === "image") {
        if (!allowedImageTypes.includes(file.type)) {
          error = "Profile image must be JPG or PNG format.";
        }
      } else {
        if (!allowedDocTypes.includes(file.type)) {
          error = "Only PDF or image formats are allowed.";
        }
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));

    if (!error) {
      setFiles((prev) => ({ ...prev, [name]: file }));
    } else {
      setFiles((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!/^\d{10}$/.test(formData.contact))
      newErrors.contact = "Contact must be 10 digits.";
    if (!formData.employeeId) newErrors.employeeId = "Employee ID is required.";
    if (!formData.salary || formData.salary <= 0)
      newErrors.salary = "Salary must be greater than 0.";
    if (!formData.dob) newErrors.dob = "Date of birth is required.";
    if (!formData.designation.trim())
      newErrors.designation = "Designation is required.";
    if (!formData.department.trim())
      newErrors.department = "Department is required.";

    // if (!formData.pfNumber) newErrors.pfNumber = "PF Number is required.";
    // if (!formData.uanNumber) newErrors.uanNumber = "UAN Number is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = gatherAllErrors();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const lines = Object.entries(newErrors).map(([key, msg]) => {
        const label = FIELD_LABELS[key] || key;
        return `• ${label}: ${msg}`;
      });

      window.alert(["Please fix the following errors:", ...lines].join("\n"));

      const firstKey = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }

      setLoading(false);
      return;
    }

    const isValid = validateForm();
    validateBankField("accountNumber", formData.bankDetails.accountNumber);
    validateBankField("ifsc", formData.bankDetails.ifsc);
    validateBankField("bankName", formData.bankDetails.bankName);

    Object.entries(formData.currentAddress).forEach(([field, value]) => {
      validateAddressField("currentAddress", field, value);
    });

    Object.entries(formData.permanentAddress).forEach(([field, value]) => {
      validateAddressField("permanentAddress", field, value);
    });

    const allErrors = { ...errors };

    if (!isValid || Object.keys(allErrors).length > 0) {
      const firstErrorField = Object.keys(allErrors)[0];
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = new FormData();

      // Append text fields
      Object.keys(formData).forEach((key) => {
        if (typeof formData[key] === "object") {
          payload.append(key, JSON.stringify(formData[key]));
        } else {
          payload.append(key, formData[key]);
        }
      });

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) payload.append(key, files[key]);
      });

      const res = await axios.post(
        "https://ems-cws-test.vercel.app/admin/add-employee",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      // ✅ Show success alert after submission
      alert(res.data.message || "Employee added and email sent successfully!");

      // ✅ Update message for UI
      setMessage(res.data.message);
      // setMessage(res.data.message);
      setFormData({
        name: "",
        email: "",
        contact: "",
        employeeId: "",
        gender: "Male",
        dob: "",
        maritalStatus: "Single",
        designation: "",
        department: "",
        salary: "",
        role: "employee",
        doj: "",
        currentAddress: { street: "", city: "", state: "", zip: "" },
        permanentAddress: { street: "", city: "", state: "", zip: "" },
        bankDetails: { accountNumber: "", bankName: "", ifsc: "" },
      });
      setFiles({
        image: null,
        panCardPdf: null,
        aadharCardPdf: null,
        appointmentLetter: null,
        passbookPdf: null,
        certificatePdf: null,
      });
    } catch (err) {
      setMessage(err.response?.data?.error || "Server error");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const FIELD_LABELS = {
    name: "Name",
    email: "Email",
    contact: "Contact",
    employeeId: "Employee ID",
    salary: "Salary",
    dob: "Date of Birth",
    designation: "Designation",
    department: "Department",
    "bankDetails.bankName": "Bank Name",
    "bankDetails.accountNumber": "Account Number",
    "bankDetails.ifsc": "IFSC Code",
    "currentAddress.street": "Current Street",
    "currentAddress.city": "Current City",
    "currentAddress.state": "Current State",
    "currentAddress.zip": "Current PIN",
    "permanentAddress.street": "Permanent Street",
    "permanentAddress.city": "Permanent City",
    "permanentAddress.state": "Permanent State",
    "permanentAddress.zip": "Permanent PIN",
  };

  function gatherAllErrors() {
    const newErrors = {};

    // top-level fields
    const topFields = [
      "name",
      "email",
      "contact",
      "employeeId",
      "salary",
      "dob",
      "designation",
      "department",
    ];
    topFields.forEach((k) => {
      const v = formData?.[k] ?? "";
      // use field validator when we have rules
      if (
        [
          "name",
          "email",
          "contact",
          "salary",
          "dob",
          "designation",
          "department",
        ].includes(k)
      ) {
        const msg = validateField(k, v);
        if (msg) newErrors[k] = msg;
      } else {
        if (!v) newErrors[k] = `${FIELD_LABELS[k] || k} is required.`;
      }
    });

    // bank
    const b = formData.bankDetails || {};
    [
      ["bankName", b.bankName],
      ["accountNumber", b.accountNumber],
      ["ifsc", b.ifsc],
    ].forEach(([k, v]) => {
      const msg = validateBankField(k, v);
      if (msg) newErrors[`bankDetails.${k}`] = msg;
    });

    // addresses
    const addGroup = (addrKey, obj = {}) => {
      Object.entries(obj).forEach(([k, v]) => {
        const msg = validateAddressField(addrKey, k, v);
        if (msg) newErrors[`${addrKey}.${k}`] = msg;
      });
    };
    addGroup("currentAddress", formData.currentAddress);
    addGroup("permanentAddress", formData.permanentAddress);

    return newErrors;
  }

  return (
    <>
      <button
        className="btn btn-sm custom-outline-btn"
        style={{ minWidth: 90 }}
        onClick={() => setShowModal(true)}
      >
        Add Employee
      </button>
      {showModal && (
        <div
          className="modal fade show"
          tabIndex="-1"
          ref={modalRef}
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
          className="modal-dialog modal-lg modal-dialog-centered"  //Added jayshree
            style={{ maxWidth: "700px" }}
          >
            <div className="modal-content">
              <div className="custom-modal-header">
                <span className="custom-modal-title">Add Employee</span>
               <button
                  type="button" 
                  className="btn-close btn-close-white"
                  aria-label="Close"  //Added Jayshree
                  onClick={() => {
                    setShowModal(false);
                    setMessage("");
                    setErrors({});
                    setFormData(initialFormData);
                    setFiles(initialFiles);
                  }}
                >
                </button>
              </div>
              {message && (
                <p
                  className={`mb-3 text-center fw-medium ${
                    message.includes("successfully")
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="custom-modal-body">
                <form className="formModel" onSubmit={handleSubmit}>
                  {/* Step 1: Personal Details */}
                  {step === 1 && (
                    <>
                      <h5 className="mb-3">Personal Details</h5>
                      <div className="row mb-4 ">
                        <div className="col-md-6 mb-0">
                          <label>Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            //onChange={handleChange}
                            onChange={handleChange}
                          />
                          {errors.name && (
                            <small className="text-danger">{errors.name}</small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Email:</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                          {errors.email && (
                            <small className="text-danger">
                              {errors.email}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Contact:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="contact"
                            value={formData.contact}
                            // onChange={handleChange}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only digits
                              if (/^\d*$/.test(value)) {
                                handleChange(e);
                              }
                            }}
                            required
                            maxLength="10"
                          />
                          {errors.contact && (
                            <small className="text-danger">
                              {errors.contact}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Employee ID:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            required
                          />
                          {errors.employeeId && (
                            <small className="text-danger">
                              {errors.employeeId}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Gender:</label>
                          <select
                            className="form-select"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Date of Birth:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            max={
                              new Date(
                                new Date().setFullYear(
                                  new Date().getFullYear() - 18,
                                ),
                              )
                                .toISOString()
                                .split("T")[0]
                            } // 👈 disables underage dates
                          />
                          {errors.dob && (
                            <small className="text-danger">{errors.dob}</small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Marital Status:</label>
                          <select
                            className="form-select"
                            name="maritalStatus"
                            value={formData.maritalStatus}
                            onChange={handleChange}
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Designation:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            required
                          />
                          {errors.designation && (
                            <small className="text-danger">
                              {errors.designation}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Department:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                          />
                          {errors.department && (
                            <small className="text-danger">
                              {errors.department}
                            </small>
                          )}
                        </div>

                        <div className="col-md-6 mb-0">
                          <label>Role:</label>
                          <select
                            className="form-select"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                          >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="hr">HR</option>
                            <option value="manager">Manager</option>
                            <option value="ceo">CEO</option>
                            <option value="md">MD</option>
                            <option value ="Team_Leader">Team_Leader</option>
                            <option value="IT_Support">IT_Support</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-0">
                          {/* <div className="mb-3">
                            <label>Salary (in ₹/year):</label>
                            <input type="number" className="form-control" name="salary" value={formData.salary} onChange={handleChange}
                              min="1"
                              step="1"
                              required

                            />
                            {errors.salary && <small className="text-danger">{errors.salary}</small>}
                          </div> */}
                          {/* <div className="mb-3">
  <label>Salary:</label>
  <div className="input-group">
    <span className="input-group-text">₹</span>
    <input
      type="number"
      className="form-control"
      name="salary"
      value={formData.salary}
      onChange={handleChange}
      min="1"
      step="1"
      placeholder="Enter salary amount"
      required
    />
    <select
      className="form-select"
      name="salaryType"
      maxWidth="100"
      value={formData.salaryType || "monthly"}
      onChange={handleChange}
    >
      <option value="monthly">Per Month</option>
      <option value="yearly">Per Year</option>
    </select>
  </div>
  {errors.salary && (
    <small className="text-danger">{errors.salary}</small>
  )}
</div> */}

                          {/* <div className="mb-3 salary-field">
                            <label className="form-label salary-label">Salary:</label>
                            <div className="input-group salary-input-group">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                //className="form-control salary-input"
                                className="input-group-text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                min="1"
                                step="1"
                                placeholder="Enter salary amount"
                                required
                              />
                              <select
                                className="input-group-text"
                                name="salaryType"
                                value={formData.salaryType || "monthly"}
                                onChange={handleChange}
                              >
                                <option value="monthly">Per Month</option>
                                <option value="yearly">Per Year</option>
                              </select>
                            </div>
                            {errors.salary && (
                              <small className="text-danger salary-error">{errors.salary}</small>
                            )}
                          </div> */}

                          <div className="mb-3 salary-field">
                            <label className="form-label salary-label">
                              Salary:
                            </label>
                            <div className="input-group salary-input-group">
                              <span
                                className="form-control"
                                style={{ height: "50px", width: "100%" }}
                              >
                                ₹
                              </span>
                              <input
                                type="number"
                                //className="form-control salary-input"
                                className="form-control"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                min="20"
                                step="20"
                                placeholder="Enter salary amount"
                                required
                                style={{ height: "50px", width: "100%" }}
                              />
                              <select
                                className="form-select"
                                name="salaryType"
                                value={formData.salaryType || "monthly"}
                                onChange={handleChange}
                                style={{ height: "50px", width: "100%" }}
                              >
                                <option value="monthly">Per Month</option>
                                <option value="yearly">Per Year</option>
                              </select>
                            </div>
                            {errors.salary && (
                              <small className="text-danger salary-error">
                                {errors.salary}
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Date of Joining:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="doj"
                            value={formData.doj}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Address */}
                  {step === 2 && (
                    <>
                      <h5 className="mb-3"> Current Address</h5>

                      <div className="mb-4">
                        <div className="row less-gap">
                          <div className="col-md-6 mb-0">
                            <label>Street:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currentAddress.street"
                              value={formData.currentAddress.street}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.street"] && (
                              <small className="text-danger">
                                {errors["currentAddress.street"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>City:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currentAddress.city"
                              value={formData.currentAddress.city}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.city"] && (
                              <small className="text-danger">
                                {errors["currentAddress.city"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>State:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currentAddress.state"
                              value={formData.currentAddress.state}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.state"] && (
                              <small className="text-danger">
                                {errors["currentAddress.state"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>ZIP:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currentAddress.zip"
                              value={formData.currentAddress.zip}
                              // onChange={handleChange}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and limit to 6 digits
                                if (/^\d{0,6}$/.test(value)) {
                                  handleChange(e);
                                }
                              }}
                            />
                            {errors["currentAddress.zip"] && (
                              <small className="text-danger">
                                {errors["currentAddress.zip"]}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>

                      <h5 className="mb-3">Permanent Address</h5>
                      <div className="mb-4" style={{ marginbo: "-30px" }}>
                        <div className="row mb-3">
                          <div className="col-md-6 mb-0">
                            <label>Street:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.street"
                              value={formData.permanentAddress.street}
                              onChange={handleChange}
                            />
                            {errors["permanentAddress.street"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.street"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>City:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.city"
                              value={formData.permanentAddress.city}
                              onChange={handleChange}
                            />
                            {errors["permanentAddress.city"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.city"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>State:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.state"
                              value={formData.permanentAddress.state}
                              onChange={handleChange}
                            />

                            {errors["permanentAddress.state"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.state"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>ZIP:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.zip"
                              value={formData.permanentAddress.zip}
                              // onChange={handleChange}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and limit to 6 digits
                                if (/^\d{0,6}$/.test(value)) {
                                  handleChange(e);
                                }
                              }}
                            />
                            {errors["permanentAddress.zip"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.zip"]}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Bank + Files */}
                  {step === 3 && (
                    <>
                      <h5 className="mb-3">Bank Details</h5>
                      <div className="row less-gap">
                        {/* Account Number */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Account Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Account Number"
                            name="bankDetails.accountNumber"
                            value={formData.bankDetails.accountNumber}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.accountNumber"] && (
                            <small className="text-danger">
                              {errors["bankDetails.accountNumber"]}
                            </small>
                          )}
                        </div>

                        {/* Bank Name */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Bank Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Bank Name"
                            name="bankDetails.bankName"
                            value={formData.bankDetails.bankName}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.bankName"] && (
                            <small className="text-danger">
                              {errors["bankDetails.bankName"]}
                            </small>
                          )}
                        </div>

                        {/* IFSC */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">IFSC Code:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="IFSC Code"
                            name="bankDetails.ifsc"
                            value={formData.bankDetails.ifsc}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.ifsc"] && (
                            <small className="text-danger">
                              {errors["bankDetails.ifsc"]}
                            </small>
                          )}
                        </div>

                        <h5>PF Details</h5>

                        <div className="col-md-6 mb-0">
                          <label>UAN Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="uanNumber"
                            value={formData.uanNumber}
                            maxLength="12"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) handleChange(e); // digits only
                            }}
                          />
                          {errors.uanNumber && (
                            <small className="text-danger">
                              {errors.uanNumber}
                            </small>
                          )}
                        </div>
                        {/* pf and uan number */}
                        <div className="col-md-6 mb-0">
                          <label>PF Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="pfNumber"
                            value={formData.pfNumber}
                            onChange={handleChange}
                          />
                          {errors.pfNumber && (
                            <small className="text-danger">
                              {errors.pfNumber}
                            </small>
                          )}
                        </div>

                        {/* Profile Image */}
                        <h5>File Uploads</h5>
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Profile Image:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="image"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                          />
                          {errors.image && (
                            <small className="text-danger">
                              {errors.image}
                            </small>
                          )}
                        </div>

                        {/* PAN Card */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">PAN Card:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="panCardPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />
                          {errors.panCardPdf && (
                            <small className="text-danger">
                              {errors.panCardPdf}
                            </small>
                          )}
                        </div>

                        {/* Aadhar Card */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Aadhar Card:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="aadharCardPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />

                          {errors.aadharCardPdf && (
                            <small className="text-danger">
                              {errors.aadharCardPdf}
                            </small>
                          )}
                        </div>

                        {/* Appointment Letter */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">
                            Appointment Letter:
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            name="appointmentLetter"
                            onChange={handleFileChange}
                            accept="application/pdf"
                          />
                          {errors.appointmentLetter && (
                            <small className="text-danger">
                              {errors.appointmentLetter}
                            </small>
                          )}
                        </div>

                        {/* Passbook PDF */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Passbook PDF:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="passbookPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />
                          {errors.passbookPdf && (
                            <small className="text-danger">
                              {errors.passbookPdf}
                            </small>
                          )}
                        </div>

                        <div className="col-md-6 mb-0">
                          <label>Certificate (PDF / Image):</label>
                          <input
                            type="file"
                            className="form-control"
                            name="certificatePdf"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                          />
                          {errors.certificatePdf && (
                            <small className="text-danger">
                              {errors.certificatePdf}
                            </small>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-end mt-4 gap-2">
                    <hr style={{ marginTop: "20px" }} />
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={handleBack}
                      >
                        <span>&larr;</span> Previous
                      </button>
                    )}

                    {/* Next or Submit Button */}
                    {step < 3 ? (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNext();
                        }}
                      >
                        Next →
                      </button>
                    ) : (
                      // <button type="submit" className="btn btn-primary" disabled={loading}>
                      //   {loading ? "Adding..." : "Add Employee"}
                      // </button>
                      <button
                        type="submit"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Adding...
                          </>
                        ) : (
                          "Add Employee"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddEmployee;
