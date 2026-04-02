import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function EmployeeProfileForAdmin({ employee: stateEmployee }) {
  const { empId } = useParams();
  const [employee, setEmployee] = useState(stateEmployee || null);
  const [formData, setFormData] = useState(
    stateEmployee
      ? {
          ...stateEmployee,
          currentAddress: stateEmployee.currentAddress || {},
          permanentAddress: stateEmployee.permanentAddress || {},
          bankDetails: stateEmployee.bankDetails || {},
        }
      : {},
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(!stateEmployee);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const { role, username, id } = useParams();

  const navigate = useNavigate();

  // Fetch employee data if not passed via props
  useEffect(() => {
    if (!stateEmployee) {
      const fetchEmployee = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const res = await axios.get(
            `http://localhost:8000/getEmployee/${empId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setEmployee(res.data);
          setFormData({
            ...res.data,
            currentAddress: res.data.currentAddress || {},
            permanentAddress: res.data.permanentAddress || {},
            bankDetails: res.data.bankDetails || {},
          });
        } catch (err) {
          console.error(err);
          setError("Failed to load employee data.");
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [empId, stateEmployee]);

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!/^[A-Za-z\s]+$/.test(value))
          error = "Name must contain only letters and spaces.";
        else if (value.trim() === "") error = "Name is required.";
        break;
      case "email":
        if (!value || value.trim() === "") {
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
        if (!value || value.trim() === "") {
          error = "Contact number is required.";
        } else if (!/^\d{10}$/.test(value)) {
          error = "Contact number must be exactly 10 digits.";
        }
        break;

      case "salary":
        if (value === "" || value == null) {
          error = "Salary is required.";
        } else if (!(Number(value) > 0)) {
          error = "Salary must be greater than 0.";
        }
        break;
      case "dob":
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 18);
        if (new Date(value) > minDate)
          error = "Employee must be at least 18 years old.";
        break;

      case "designation":
        if (value.trim() === "") error = "Designation is required.";
        break;

      case "department":
        if (value.trim() === "") error = "Department is required.";
        break;

      case "pfNumber":
        if (value && !/^\d{5,20}$/.test(value))
          error = "PF Number must be 5–20 digits.";
        break;

      case "uanNumber":
        if (value && !/^\d{12}$/.test(value))
          error = "UAN Number must be 12 digits.";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateBankField = (name, value) => {
    let error = "";

    switch (name) {
      case "bankName":
        if (!value) error = "Bank name is required.";
        else if (!/^[A-Za-z\s]+$/.test(value))
          error = "Bank name must contain only letters and spaces.";
        break;

      // case "accountNumber":
      //   if (!value) error = "Account number is required.";
      //   else if (!/^\d+$/.test(value))
      //     error = "Account number must contain only digits.";
      //   break;

      case "accountNumber":
        if (!value) error = "Account number is required.";
        else if (!/^\d+$/.test(value))
          error = "Account number must contain only digits.";
        else if (value.length < 9 || value.length > 18)
          error = "Account number must be between 9 and 18 digits.";
        else if (/^0/.test(value))
          error = "Account number should not start with zero.";
        break;

      case "ifsc":
        if (!value) error = "IFSC code is required.";
        break;

      default:
        break;
    }

    // Use full key path for errors
    setErrors((prev) => {
      const next = { ...prev };
      const key = `bankDetails.${name}`;
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });

    // Also return the error so callers can use it synchronously if needed
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

    // Set error for this file field
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Save file only if valid
    if (!error) {
      setFiles((prev) => ({ ...prev, [name]: file }));
    } else {
      setFiles((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // --- Live restrictions (prevent invalid typing) ---
    if (name === "name") {
      // ✅ Allow only letters and spaces (no numbers or symbols)
      if (!/^[A-Za-z\s]*$/.test(value)) return;
    }
    // --- Live restrictions (prevent invalid typing) ---

    // ✅ Contact number validation — only digits and max 10
    if (name === "contact") {
      if (!/^\d*$/.test(value)) return; // only numbers allowed
      if (value.length > 10) return; // limit to 10 digits
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    // ✅ Address restrictions for street, city, state, zip (both current & permanent)
    if (name.includes("Address.")) {
      const key = name.split(".")[1];
      if (["street", "city", "state"].includes(key)) {
        if (!/^[A-Za-z\s]*$/.test(value)) return; // allow only letters
      }
      if (key === "zip") {
        if (!/^\d*$/.test(value)) return; // only numbers
        if (value.length > 6) return; // max 6 digits
      }
    }
    // --- Bank Details restrictions ---
    if (name.startsWith("bankDetails.")) {
      const key = name.split(".")[1];
      if (key === "accountNumber") {
        // Allow only digits, and limit to 18 characters
        if (!/^\d*$/.test(value)) return;
        if (value.length > 18) return;
      }
    }
    // --- Live restrictions (prevent invalid typing) ---
    if (name === "bankName") {
      // ✅ Allow only letters and spaces (no numbers or symbols)
      if (!/^[A-Za-z\s]*$/.test(value)) return;
    }

    if (files && files[0]) {
      // File input
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name.startsWith("currentAddress.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        currentAddress: { ...prev.currentAddress, [key]: value },
      }));
      validateAddressField("currentAddress", key, value);
    } else if (name.startsWith("permanentAddress.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        permanentAddress: { ...prev.permanentAddress, [key]: value },
      }));
      validateAddressField("permanentAddress", key, value);
    } else if (name.startsWith("bankDetails.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [key]: value },
      }));

      validateBankField(key, value);
    } else {
      // Top-level fields
      setFormData((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  // Save updated data
  const handleSave = async () => {
    // 🧩 Contact validation — must be exactly 10 digits
    if (!/^\d{10}$/.test(formData.contact || "")) {
      alert("Contact number must be exactly 10 digits.");
      return;
    }

    // ✅ ZIP code validation — both current & permanent must be exactly 6 digits if present
    const currentZip = formData.currentAddress?.zip || "";
    const permanentZip = formData.permanentAddress?.zip || "";
    //new change
    if (formData.uanNumber && !/^\d{12}$/.test(formData.uanNumber)) {
      alert("UAN Number must be 12 digits.");
      return;
    }
    if (
      (currentZip && !/^\d{6}$/.test(currentZip)) ||
      (permanentZip && !/^\d{6}$/.test(permanentZip))
    ) {
      alert("ZIP code must be exactly 6 digits.");
      return;
    }

    const dob = formData.dob;
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18);

    if (new Date(dob) > minDate) {
      alert("Employee must be at least 18 years old.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (
          ["currentAddress", "permanentAddress", "bankDetails"].includes(key)
        ) {
          data.append(key, JSON.stringify(formData[key]));
        } else if (
          ["currentAddress", "permanentAddress", "bankDetails"].includes(key)
        ) {
          data.append(key, JSON.stringify(formData[key]));
        } else if (
          [
            "image",
            "panCardPdf",
            "aadharCardPdf",
            "appointmentLetter",
            "passbookPdf",
          ].includes(key)
        ) {
          if (formData[key] instanceof File) data.append(key, formData[key]);
        } else if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      await axios.put(
        `http://localhost:8000/employees/${employee._id || empId}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Employee profile updated successfully!");
      setIsEditing(false);

      const updated = await axios.get(
        `http://localhost:8000/getEmployee/${employee._id || empId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEmployee(updated.data);
      setFormData({
        ...updated.data,
        currentAddress: updated.data.currentAddress || {},
        permanentAddress: updated.data.permanentAddress || {},
        bankDetails: updated.data.bankDetails || {},
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update employee profile.");
    }
  };

  if (loading)
    return <p className="text-center mt-3">Loading employee data...</p>;
  if (error) return <p className="text-danger text-center mt-3">{error}</p>;
  if (!employee) return <p>No employee data available.</p>;
  const formatLabel = (label) => {
    const specialCases = {
      dob: "Date Of Birth",
      doj: "Date Of Joining",
      empId: "Employee ID",
      aadharCardPdf: "Aadhar Card",
      panCardPdf: "PAN Card",
      passbookPdf: "Bank Passbook",
      appointmentLetter: "Appointment Letter",
      casualLeaveBalance: "Casual Leave Balance",
      sickLeaveBalance: "Sick Leave Balance",
      probationMonths: "Probation Period",
      ifsc: "IFSC",
    };

    if (specialCases[label]) return specialCases[label];

    return label
      .replace(/([A-Z])/g, " $1") // space before capital letters
      .replace(/([a-z])([0-9])/g, "$1 $2") // space before numbers
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  //   // Detect file type
  // const getFileType = (fileName) => {
  //   if (!fileName) return null;
  //   const ext = fileName.split(".").pop().toLowerCase();

  //   if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "image";
  //   if (["pdf"].includes(ext)) return "pdf";
  //   return "unknown";
  // };

  const getFileType = (file) => {
    if (!file) return null;

    if (file instanceof File) {
      const mime = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
      if (mime.startsWith("image/")) return "image";
      return "other";
    }

    if (typeof file === "string") {
      const clean = file.toLowerCase();

      // Detect Cloudinary RAW PDF
      if (clean.includes("/raw/upload/")) return "pdf";

      if (clean.endsWith(".pdf")) return "pdf";
      if (/\.(jpg|jpeg|png|gif|webp)$/.test(clean)) return "image";
      return "other";
    }

    return null;
  };

  // Generate document preview
  const getDocumentPreview = (fileName, label) => {
    if (!fileName) return <span>-</span>;

    const url = fileName.startsWith("http")
      ? fileName
      : `http://localhost:8000/uploads/${fileName}`;

    const fileType = getFileType(fileName);

    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {fileType === "image" ? (
          <img
            src={url}
            alt={label}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />
        ) : (
          <img
            src="/pdfimg.png"
            alt={label}
            style={{ width: "60px", height: "60px" }}
          />
        )}
      </a>
    );
  };

  const handlePermanentDelete = async (id) => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to permanently delete this employee? This action cannot be undone.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.delete(
        `http://localhost:8000/deleteEmployee/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        alert("Employee permanently deleted!");
        // Redirect to employee list page
        navigate(`/dashboard/${role}/${username}/${id}/allemployeedetails`); // Redirect after delete
      } else {
        alert("Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Server error while deleting employee.");
    }
  };

  return (
    <div
      className="container-fluid p-3 p-md-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div
        className="card shadow-sm border-0 rounded"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <div className="d-flex  flex-md-row  align-items-center justify-content-between p-2 p-md-3 gap-3">
          <div className="d-flex  flex-md-row align-items-center gap-2 gap-md-3 w-100 w-md-auto">
            <div className="d-flex flex-column align-items-center text-center">
              <label className="form-label fw-semibold text-primary mb-2">
                Profile Image
              </label>

              {formData.image instanceof File ? (
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Profile Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "5px",
                  }}
                />
              ) : employee.image ? (
                <img
                  src={
                    employee?.image?.startsWith("http")
                      ? employee.image
                      : `http://localhost:8000/uploads/${employee.image}`
                  }
                  alt="Profile Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "5px",
                  }}
                />
              ) : (
                <img
                  src={"/myprofile.jpg"}
                  alt="Profile"
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "5px",
                  }}
                />
              )}

              {/* File input below the image */}
              {isEditing && (
                <>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="form-control form-control-sm bg-light border-0 mt-2"
                    style={{ maxWidth: "250px" }}
                  />

                  {/* Show selected file name */}
                  {formData.image instanceof File ? (
                    <p className="text-muted small mb-0 mt-1">
                      Selected: {formData.image.name}
                    </p>
                  ) : (
                    <p className="text-muted small mb-0 mt-1">
                      No image selected
                    </p>
                  )}
                </>
              )}
            </div>

            <h4 className="mb-0" style={{ textTransform: "capitalize" }}>
              {employee.name}
            </h4>
          </div>

          {/* <div className="d-flex justify-content-end" style={{ paddingRight: "10px" }}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn  btn-sm px-3 px-md-4" style={{ background: '#3A5FBE', borderColor: '#3A5FBE', color: "white" }}>
                Edit
              </button>
            ) : (
              <>
                <button onClick={handleSave} className="btn  btn-sm px-3 px-md-4" style={{ background: '#3A5FBE', borderColor: '#3A5FBE', color: "white" }}>
                  Save
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      ...employee,
                      currentAddress: employee.currentAddress || {},
                      permanentAddress: employee.permanentAddress || {},
                      bankDetails: employee.bankDetails || {},
                    });
                    setIsEditing(false);
                  }}
                  className="btn  btn-sm px-3 px-md-4" style={{ background: '#3A5FBE', borderColor: '#3A5FBE', color: "white", marginLeft: "5px" }}
                >
                  Cancel
                </button>
              </>
            )}
          </div> */}

          <div
            className="d-flex justify-content-end"
            style={{ paddingRight: "10px" }}
          >
            {/* IF EMPLOYEE IS DELETED */}
            {employee?.isDeleted ? (
              <>
                <button
                  className="btn btn-sm btn-outline-danger px-3 px-md-4"
                  onClick={() => handlePermanentDelete(employee._id)}
                >
                  Delete
                </button>

                {/* <button
        className="btn btn-success btn-sm px-3 px-md-4 ms-2"
        onClick={() => handleRestore(employee._id)}
      >
        Restore
      </button> */}
              </>
            ) : (
              /* IF NOT DELETED → SHOW EDIT / SAVE / CANCEL */
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setFormData({
                          ...employee,
                          currentAddress: employee.currentAddress || {},
                          permanentAddress: employee.permanentAddress || {},
                          bankDetails: employee.bankDetails || {},
                        });
                        setIsEditing(false);
                      }}
                      // className="btn btn-sm px-3 px-md-4 ms-2"
                      // style={{ background: '#3A5FBE', borderColor: '#3A5FBE', color: "white" }}
                      className="btn btn-sm custom-outline-btn px-3 px-md-4 ms-2"
                      style={{ minWidth: 90 }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <div className="card-body">
            <h6 className="fw-bold text-primary mb-3">Personal Details</h6>

            <div className="row g-3">
              {[
                "employeeId",
                "name",
                "email",
                "contact",
                "gender",
                "maritalStatus",
                "role",
                "designation",
                "department",
                "salary",
              ].map((field) => {
                // ✅ Convert "employeeId" → "Employee ID", "maritalStatus" → "Marital Status"
                const formatLabel = (text) =>
                  text
                    .replace(/([A-Z])/g, " $1") // insert space before capital letters
                    .replace(/^./, (str) => str.toUpperCase()) // capitalize first letter
                    .trim();

                return (
                  <div key={field} className="col-md-6">
                    <label className="form-label text-primary">
                      {formatLabel(field)}:
                    </label>

                    {isEditing ? (
                      <>
                        {field === "gender" ? (
                          <select
                            name="gender"
                            value={formData.gender || ""}
                            onChange={handleChange}
                            className="form-select bg-light border-0"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : field === "maritalStatus" ? (
                          <select
                            name="maritalStatus"
                            value={formData.maritalStatus || ""}
                            onChange={handleChange}
                            className="form-select bg-light border-0"
                          >
                            <option value="">Select Marital Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                          </select>
                        ) : field === "role" ? (
                          <select
                            name="role"
                            value={formData.role || ""}
                            onChange={handleChange}
                            className="form-select bg-light border-0"
                          >
                            <option value="">Select Role</option>
                            <option value="employee">Employee</option>
                            {/* <option value="admin">Admin</option> */}
                            <option value="hr">HR</option>
                            <option value="manager">Manager</option>
                            <option value="ceo">CEO</option>
                            <option value="md">MD</option>
                          </select>
                        ) : (
                          <input
                            type={field === "salary" ? "number" : "text"}
                            name={field}
                            value={formData[field] || ""}
                            onChange={handleChange}
                            // className="form-control bg-light border-0"
                            className={`form-control border-0 ${
                              field === "email"
                                ? "bg-secondary-subtle text-muted"
                                : "bg-light"
                            }`}
                            readOnly={field === "email"} // 👈 only email is read-only
                          />
                        )}

                        {errors[field] && (
                          <div className="text-danger small mt-1">
                            {errors[field]}
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="form-control bg-light border-0"
                        style={{
                          textTransform:
                            field === "email" ? "none" : "capitalize", // ✅ don't capitalize email
                        }}
                      >
                        {employee[field] || "-"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DOB & DOJ */}
            <div className="row g-3 mt-2">
              {/* <div className="col-md-6">
                <label className="form-label text-primary">Date Of Birth:</label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob ? formData.dob.split("T")[0] : ""}
                      onChange={handleChange}
                      className="form-control bg-light border-0"
                    />
                    {errors.dob && (
                      <div className="text-danger small mt-1">{errors.dob}</div>
                    )}
                  </>
                ) : employee.dob ? new Date(employee.dob).toLocaleDateString() : "-"}
              </div> */}

              {/* <div className="col-md-6">
                <label className="form-label text-primary">Date Of Birth:</label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob ? formData.dob.split("T")[0] : ""}
                      onChange={handleChange}
                      className="form-control bg-light border-0"
                    />
                    {errors.dob && (
                      <div className="text-danger small mt-1">{errors.dob}</div>
                    )}
                  </>
                ) : (
                  <div className="form-control bg-light border-0">
                    {employee.dob ? new Date(employee.dob).toLocaleDateString() : "-"}
                  </div>
                )}
              </div> */}

              <div className="col-md-6">
                <label className="form-label text-primary">
                  Date Of Birth:
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob ? formData.dob.split("T")[0] : ""}
                      onChange={handleChange}
                      className="form-control bg-light border-0"
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 18),
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                    />
                    {errors.dob && (
                      <div className="text-danger small mt-1">{errors.dob}</div>
                    )}
                  </>
                ) : (
                  <div className="form-control bg-light border-0">
                    {employee.dob
                      ? new Date(employee.dob).toLocaleDateString()
                      : "-"}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label text-primary">
                  Date Of Joining:
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      name="doj"
                      value={formData.doj ? formData.doj.split("T")[0] : ""}
                      onChange={handleChange}
                      // className="form-control bg-light border-0"
                      className="form-control border-0 bg-secondary-subtle text-muted"
                      readOnly
                    />
                    {errors.doj && (
                      <div className="text-danger small mt-1">{errors.doj}</div>
                    )}
                  </>
                ) : (
                  <div className="form-control bg-light border-0">
                    {employee.doj
                      ? new Date(employee.doj).toLocaleDateString()
                      : "-"}
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <h6 className="fw-bold text-primary mt-4">Current Address</h6>
            <div className="row g-3">
              {["street", "city", "state", "zip"].map((field) => (
                <div key={field} className="col-md-6">
                  {/* <label className="form-label text-primary">{field}</label> */}
                  <label className="form-label text-primary">
                    {formatLabel(field)}:
                  </label>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name={`currentAddress.${field}`}
                        value={formData.currentAddress?.[field] || ""}
                        onChange={handleChange}
                        className="form-control bg-light border-0"
                      />
                      {errors[`currentAddress.${field}`] && (
                        <small className="text-danger">
                          {errors[`currentAddress.${field}`]}
                        </small>
                      )}
                    </>
                  ) : (
                    <div
                      className="form-control bg-light border-0"
                      style={{ textTransform: "capitalize" }}
                    >
                      {employee.currentAddress?.[field] || "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h6 className="fw-bold text-primary mt-4">Permanent Address</h6>
            <div className="row g-3">
              {["street", "city", "state", "zip"].map((field) => (
                <div key={field} className="col-md-6">
                  {/* <label className="form-label text-primary">{field}</label> */}
                  <label className="form-label text-primary">
                    {formatLabel(field)}:
                  </label>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name={`permanentAddress.${field}`}
                        value={formData.permanentAddress?.[field] || ""}
                        onChange={handleChange}
                        className="form-control bg-light border-0"
                      />

                      {errors[`permanentAddress.${field}`] && (
                        <small className="text-danger">
                          {errors[`permanentAddress.${field}`]}
                        </small>
                      )}
                    </>
                  ) : (
                    <div
                      className="form-control bg-light border-0"
                      style={{ textTransform: "capitalize" }}
                    >
                      {employee.permanentAddress?.[field] || "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bank Details */}
            <h6 className="fw-bold text-primary mt-4">Bank Details</h6>
            <div className="row g-3">
              {["bankName", "accountNumber", "ifsc"].map((field) => (
                <div key={field} className="col-md-6">
                  {/* <label className="form-label text-primary">{field}</label> */}
                  <label className="form-label text-primary">
                    {formatLabel(field)}:
                  </label>

                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name={`bankDetails.${field}`}
                        value={formData.bankDetails?.[field] || ""}
                        onChange={handleChange}
                        className="form-control bg-light border-0"
                      />

                      {errors[`bankDetails.${field}`] && (
                        <div className="text-danger small mt-1">
                          {errors[`bankDetails.${field}`]}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="form-control bg-light border-0">
                      {employee.bankDetails?.[field] || "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* PF & UAN Details */}
            <h6 className="fw-bold text-primary mt-4">PF & UAN Details</h6>
            <div className="row g-3">
              {/* UAN Number */}
              <div className="col-md-6">
                <label className="form-label text-primary">UAN Number:</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="uanNumber"
                    value={formData.uanNumber || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) handleChange(e); // digits only
                    }}
                    className="form-control bg-light border-0"
                    maxLength="12"
                  />
                ) : (
                  <div className="form-control bg-light border-0">
                    {formData.uanNumber || "-"}
                  </div>
                )}
              </div>

              {/* PF Number */}
              <div className="col-md-6">
                <label className="form-label text-primary">PF Number:</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="pfNumber"
                    value={formData.pfNumber || ""}
                    onChange={handleChange}
                    className="form-control bg-light border-0"
                  />
                ) : (
                  <div className="form-control bg-light border-0">
                    {formData.pfNumber || "-"}
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {/* <h6 className="mt-3">Documents</h6>
            <div className="d-flex gap-3 flex-wrap">
              {["aadharCardPdf", "panCardPdf", "appointmentLetter"].map((field) => (
                <div key={field} className="d-flex flex-column align-items-start">
                  <label className="form-label text-primary">{formatLabel(field)}</label>

                  {isEditing ? (
                    <>
                      <input type="file" name={field} onChange={handleFileChange} />
                      {errors[field] && (
                        <div className="text-danger small mt-1">{errors[field]}</div>
                      )}
                    </>

                  ) : employee[field] ? (
                    <a
                      href={
                        employee[field]?.startsWith("http")
                          ? employee[field]
                          : `http://localhost:8000/uploads/${employee[field]}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/pdfimg.png"
                        className="companylogo"
                        style={{ width: "60px", height: "60px" }}
                      />
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              ))}

              <div className="d-flex flex-column align-items-start">

                <label className="form-label text-primary">Bank Passbook</label>{" "}
                {isEditing ? (
                  <>
                    <input type="file" name="passbookPdf" onChange={handleFileChange} />

                    {errors.passbookPdf && (
                      <div className="text-danger small mt-1">{errors.passbookPdf}</div>
                    )}
                  </>

                ) : employee.bankDetails?.passbookPdf ? (
                  <a
                    href={`http://localhost:8000/uploads/${employee.bankDetails.passbookPdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/pdfimg.png"
                      style={{ width: "60px", height: "60px" }} />
                  </a>
                ) : (
                  "-"
                )}

              </div>

            </div> */}

            {/* Documents */}
            <h6 className="fw-bold text-primary mt-4">Documents</h6>
            {/* <div className="d-flex gap-3 flex-wrap">

  {["aadharCardPdf", "panCardPdf", "appointmentLetter"].map((field) => (
    <div key={field} className="d-flex flex-column align-items-start">

      <label className="form-label text-primary">{formatLabel(field)}</label>

      {isEditing ? (
        <>
          <input type="file" name={field} onChange={handleFileChange} />
          {errors[field] && (
            <div className="text-danger small mt-1">{errors[field]}</div>
          )}
        </>
      ) : employee[field] ? (
        getDocumentPreview(employee[field], formatLabel(field))
      ) : (
        "-"
      )}
    </div>
  ))}

 
  <div className="d-flex flex-column align-items-start">
    <label className="form-label text-primary">Bank Passbook</label>

    {isEditing ? (
      <>
        <input type="file" name="passbookPdf" onChange={handleFileChange} />
        {errors.passbookPdf && (
          <div className="text-danger small mt-1">{errors.passbookPdf}</div>
        )}
      </>
    ) : employee.bankDetails?.passbookPdf ? (
      getDocumentPreview(employee.bankDetails.passbookPdf, "Passbook")
    ) : (
      "-"
    )}
  </div>

</div> */}

            <div className="d-flex gap-3 flex-wrap">
              {[
                { field: "aadharCardPdf", label: "Aadhar Card" },
                { field: "panCardPdf", label: "PAN Card" },
                { field: "appointmentLetter", label: "Appointment Letter" },
              ].map(({ field, label }) => {
                const file = employee[field];
                const fileType = getFileType(file);

                const href = file
                  ? file.startsWith("http")
                    ? file
                    : ` https://res.cloudinary.com/dfvumzr0q/raw/upload/${file}`
                  : null;

                return (
                  <div
                    key={field}
                    className="d-flex flex-column align-items-start"
                  >
                    <label className="form-label text-primary">{label}</label>

                    {isEditing ? (
                      <>
                        <input
                          type="file"
                          name={field}
                          accept=".jpg,.jpeg,.png,application/pdf"
                          onChange={handleFileChange}
                        />
                        {errors[field] && (
                          <div className="text-danger small mt-1">
                            {errors[field]}
                          </div>
                        )}
                      </>
                    ) : !file ? (
                      "-"
                    ) : (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {fileType === "pdf" && (
                          <img
                            src="/pdfimg.png"
                            style={{ width: "50px" }}
                            alt="PDF"
                          />
                        )}

                        {fileType === "image" && (
                          <img
                            src="/jpgimg.jpeg"
                            style={{ width: "50px" }}
                            alt="Image"
                          />
                        )}

                        {fileType === "other" && <span>File</span>}
                      </a>
                    )}
                  </div>
                );
              })}

              {/* Passbook */}
              <div className="d-flex flex-column align-items-start">
                <label className="form-label text-primary">Bank Passbook</label>

                {isEditing ? (
                  <>
                    <input
                      type="file"
                      name="passbookPdf"
                      accept=".jpg,.jpeg,.png,application/pdf"
                      onChange={handleFileChange}
                    />
                    {errors.passbookPdf && (
                      <div className="text-danger small mt-1">
                        {errors.passbookPdf}
                      </div>
                    )}
                  </>
                ) : employee.bankDetails?.passbookPdf ? (
                  (() => {
                    const file = employee.bankDetails.passbookPdf;
                    const fileType = getFileType(file);

                    const href = file.startsWith("http")
                      ? file
                      : ` https://res.cloudinary.com/dfvumzr0q/raw/upload/${file}`;

                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {fileType === "pdf" && (
                          <img
                            src="/pdfimg.png"
                            style={{ width: "50px" }}
                            alt="PDF"
                          />
                        )}
                        {fileType === "image" && (
                          <img
                            src="/jpgimg.jpeg"
                            style={{ width: "50px" }}
                            alt="Image"
                          />
                        )}
                      </a>
                    );
                  })()
                ) : (
                  "-"
                )}
              </div>
            </div>

            {/* Leaves & Salary */}
            <h6 className="fw-bold text-primary mt-4">Leaves & Salary</h6>
            <div className="row g-3">
              {[
                "casualLeaveBalance",
                "sickLeaveBalance",
                "salary",
                "probationMonths",
              ].map((field) => (
                <div key={field} className="col-md-6">
                  <label className="form-label text-primary">
                    {formatLabel(field)}:
                  </label>
                  {isEditing ? (
                    <input
                      type={field === "salary" ? "number" : "text"}
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      className="form-control bg-light border-0"
                    />
                  ) : (
                    <div className="form-control bg-light border-0">
                      {employee[field] ?? "-"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* <div className="d-flex justify-content-end mt-3">
   <button
      className="btn btn-primary mt-3"
      style={{ backgroundColor: "#3A5FBE", borderColor: "#3A5FBE" }}
      onClick={() => {
        window.location.href = `/dashboard/${role}/${username}/${id}/allemployeedetails`;
      }}
    >
      Back
    </button>
    </div> */}
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

export default EmployeeProfileForAdmin;
