import React, { useState, useEffect } from "react";
import axios from "axios";

function MyProfile({ user, setUser }) {
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingImage, setRemovingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleRemoveImage = async (e) => {
    e?.preventDefault?.();

    const ok = window.confirm(
      "Are you sure you want to remove the profile image?",
    );
    if (!ok) return;

    try {
      setRemovingImage(true);

      const res = await axios.delete(
        `http://localhost:8000/employees/${user._id}/image`,
      );
      const updatedUser = res?.data?.employee
        ? res.data.employee
        : { ...user, image: null };

      setProfile(updatedUser);
      setUser(updatedUser);
      setFormData((prev) => ({ ...prev, image: null }));

      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to remove image:", err);
    } finally {
      setRemovingImage(false);
    }
  };

  // Fetch profile safely
  useEffect(() => {
    if (!user?._id) {
      setError("User ID is missing. Cannot fetch profile.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/employees/${user._id}`,
        );
        setProfile(res.data);
        setFormData({
          ...res.data,
          currentAddress: res.data.currentAddress || {},
          permanentAddress: res.data.permanentAddress || {},
          bankDetails: res.data.bankDetails || {},
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

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
        // Only numbers and max 6 digits while typing
        if (!/^\d*$/.test(value)) return;
        if (value.length > 6) return;
      }
    }

    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name.startsWith("currentAddress.")) {
      setFormData((prev) => ({
        ...prev,
        currentAddress: { ...prev.currentAddress, [name.split(".")[1]]: value },
      }));
    } else if (name.startsWith("permanentAddress.")) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: {
          ...prev.permanentAddress,
          [name.split(".")[1]]: value,
        },
      }));
    } else if (name.startsWith("bankDetails.")) {
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [name.split(".")[1]]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!user?._id) return alert("Invalid user ID");

    if (!/^\d{10}$/.test(formData.contact || "")) {
      alert("Contact number must be exactly 10 digits.");
      return;
    }

    const currentZip = formData.currentAddress?.zip || "";
    const permanentZip = formData.permanentAddress?.zip || "";

    if (
      (currentZip && !/^\d{6}$/.test(currentZip)) ||
      (permanentZip && !/^\d{6}$/.test(permanentZip))
    ) {
      alert("ZIP code must be exactly 6 digits.");
      return;
    }

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (
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

      setSaving(true);
      // ✅ Only wait for PUT
      await axios.put(`http://localhost:8000/employees/${user._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSaving(false);

      alert("Profile updated successfully!");
      setIsEditing(false);

      // 🔥 Fetch updated profile in background (no need to block UI)
      axios
        .get(`http://localhost:8000/employees/${user._id}`)
        .then((res) => {
          setProfile(res.data);
          setUser(res.data); // ✅ update dashboard user also
        })
        .catch((err) => console.error("Profile refresh failed", err));
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const renderFileLink = (file) => {
    if (!file) return "Not uploaded";
    if (file instanceof File) return file.name;
    return (
      <a
        href={`http://localhost:8000/uploads/${file}`}
        target="_blank"
        rel="noreferrer"
      >
        View PDF
      </a>
    );
  };

  // 🌀 Show loading spinner while fetching
  if (loading)
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading profile...
        </p>
      </div>
    );

  // ❌ Show error message
  if (error)
    return (
      <div className="text-danger text-center mt-5 fw-semibold">{error}</div>
    );

  // 🌀 Spinner if no profile found
  if (!profile)
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-border"
          role="status"
          style={{ width: "3rem", height: "3rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">No profile data available...</p>
      </div>
    );

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

  console.log("formdata", formData);

  return (
    <div
      className="container-fluid p-3 p-md-4 p-2"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <div
        className="card shadow-sm border-0 rounded"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* Header: Image + Name + Buttons */}
        <div className="d-flex  flex-md-row  align-items-center justify-content-between p-2 p-md-3 gap-3">
          <div className="d-flex  flex-md-row align-items-center gap-2 gap-md-3 w-100 w-md-auto">
            <div className="d-flex flex-column align-items-center text-center">
              <label className="form-label fw-semibold text-primary mb-2">
                Profile Image
              </label>

              {/* Show image first */}
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
                    objectPosition: "center 0%",
                  }}
                />
              ) : profile.image ? (
                <>
                  <img
                    src={
                      profile.image?.startsWith("http")
                        ? profile.image
                        : `http://localhost:8000/image/${profile.image}`
                    }
                    alt="Profile"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "5px",
                      objectPosition: "center 0%",
                    }}
                  />
                </>
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

              {/* File input below the image in edit mode */}
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

                  {/* Show selected file name or message */}
                  {formData.image instanceof File ? (
                    <p className="text-muted small mb-0 mt-1">
                      Selected: {formData.image.name}
                    </p>
                  ) : (
                    <p className="text-muted small mb-0 mt-1">
                      No image selected
                    </p>
                  )}

                  {profile?.image && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm mt-2"
                        onClick={handleRemoveImage}
                        disabled={removingImage}
                      >
                        {removingImage ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <h4 className="mb-0" style={{ textTransform: "capitalize" }}>
              {profile.name}
            </h4>
          </div>

          <div className="d-flex gap-2">
            {!isEditing ? (
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {" "}
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => {
                    setFormData(profile);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card-body">
          {/* Personal Details */}
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
              // ✅ Converts "employeeId" -> "Employee ID", "maritalStatus" -> "Marital Status"
              const formatLabel = (text) =>
                text
                  .replace(/([A-Z])/g, " $1") // insert space before capital letters
                  .replace(/^./, (str) => str.toUpperCase()) // capitalize first letter
                  .trim();

              return (
                <div key={field} className="col-md-6">
                  <label className="form-label" style={{ color: "#007BFF" }}>
                    {formatLabel(field)}:
                  </label>

                  {isEditing ? (
                    <input
                      type={field === "salary" ? "number" : "text"}
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      className={`form-control border-0 ${
                        [
                          "employeeId",
                          "name",
                          "email",
                          "gender",
                          "role",
                          "designation",
                          "department",
                          "salary",
                          "maritalStatus",
                        ].includes(field)
                          ? "bg-secondary-subtle text-muted"
                          : "bg-light"
                      }`}
                      placeholder={formatLabel(field)}
                      readOnly={[
                        "employeeId",
                        "name",
                        "email",
                        "gender",
                        "role",
                        "designation",
                        "department",
                        "salary",
                        "maritalStatus",
                      ].includes(field)}
                    />
                  ) : (
                    <div
                      className="form-control bg-light border-0"
                      // style={{ textTransform: "capitalize" }}
                      style={{
                        textTransform:
                          field === "email" ? "none" : "capitalize", // ✅ don't capitalize email
                      }}
                    >
                      {profile[field] || "-"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DOB & DOJ */}
          <div className="row g-3 mt-3">
            {["dob", "doj"].map((field) => (
              <div key={field} className="col-md-6">
                <label className="form-label" style={{ color: "#007BFF" }}>
                  {/* {field.toUpperCase()} */}
                  {formatLabel(field)}:
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name={field}
                    value={formData[field] ? formData[field].split("T")[0] : ""}
                    onChange={handleChange}
                    //className="form-control bg-light border-0"
                    className={`form-control border-0 ${
                      ["dob", "doj"].includes(field)
                        ? "bg-secondary-subtle text-muted"
                        : "bg-light"
                    }`}
                    readOnly={["dob", "doj"].includes(field)}
                  />
                ) : profile[field] ? (
                  <div className="form-control bg-light border-0">
                    {new Date(profile[field]).toLocaleDateString()}
                  </div>
                ) : (
                  "-"
                )}
              </div>
            ))}
          </div>

          {/* Current Address */}
          <h6 className="fw-bold text-primary mt-4">Current Address</h6>
          <div className="row g-3">
            {["street", "city", "state", "zip"].map((field) => (
              <div key={field} className="col-md-6">
                <label className="form-label text-primary">
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name={`currentAddress.${field}`}
                    value={formData.currentAddress?.[field] || ""}
                    onChange={handleChange}
                    className="form-control bg-light border-0"
                  />
                ) : (
                  <div
                    className="form-control bg-light border-0"
                    style={{ textTransform: "capitalize" }}
                  >
                    {profile.currentAddress?.[field] || "-"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Permanent Address */}
          <h6 className="fw-bold text-primary mt-4">Permanent Address</h6>
          <div className="row g-3">
            {["street", "city", "state", "zip"].map((field) => (
              <div key={field} className="col-md-6">
                <label className="form-label text-primary">
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name={`permanentAddress.${field}`}
                    value={formData.permanentAddress?.[field] || ""}
                    onChange={handleChange}
                    // className="form-control bg-light border-0"
                    className={`form-control border-0 ${
                      ["street", "city", "state", "zip"].includes(field)
                        ? "bg-secondary-subtle text-muted"
                        : "bg-light"
                    }`}
                    readOnly
                  />
                ) : (
                  <div
                    className="form-control bg-light border-0"
                    style={{ textTransform: "capitalize" }}
                  >
                    {profile.permanentAddress?.[field] || "-"}
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
                <label className="form-label text-primary">
                  {formatLabel(field)}:
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name={`bankDetails.${field}`}
                    value={formData.bankDetails?.[field] || ""}
                    onChange={handleChange}
                    //className="form-control bg-light border-0"
                    className="form-control bg-secondary-subtle text-muted border-0"
                    readOnly
                  />
                ) : (
                  <div className="form-control bg-light border-0">
                    {profile.bankDetails?.[field] || "-"}
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
                  onChange={handleChange}
                  className="form-control bg-secondary-subtle text-muted border-0"
                  readOnly
                />
              ) : (
                <div className="form-control bg-light border-0">
                  {profile.uanNumber || "-"}
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
                  className="form-control bg-secondary-subtle text-muted border-0"
                  readOnly
                />
              ) : (
                <div className="form-control bg-light border-0">
                  {profile.pfNumber || "-"}
                </div>
              )}
            </div>
          </div>

          <h6 className="fw-bold text-primary mt-4">Documents</h6>

          <div className="d-flex gap-4 flex-wrap">
            {[
              { field: "aadharCardPdf", label: "Aadhar Card" },
              { field: "panCardPdf", label: "PAN Card" },
              { field: "appointmentLetter", label: "Appointment Letter" },
            ].map(({ field, label }) => {
              const file = profile[field];
              const fileType = getFileType(file);

              const href = file
                ? file.startsWith("http")
                  ? file
                  : `https://res.cloudinary.com/dfvumzr0q/raw/upload/${file}`
                : null;

              return (
                <div key={field} className="d-flex flex-column">
                  <label className="form-label text-primary">{label}</label>

                  {isEditing ? (
                    <input
                      type="file"
                      name={field}
                      accept=".jpg,.jpeg,.png,application/pdf"
                      onChange={handleChange}
                    />
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
                    </a>
                  )}
                </div>
              );
            })}

            {/* Bank Passbook */}
            <div className="d-flex flex-column">
              <label className="form-label text-primary">Bank Passbook</label>

              {isEditing ? (
                <input
                  type="file"
                  name="passbookPdf"
                  accept=".jpg,.jpeg,.png,application/pdf"
                  onChange={handleChange}
                />
              ) : profile.bankDetails?.passbookPdf ? (
                (() => {
                  const file = profile.bankDetails.passbookPdf;
                  const fileType = getFileType(file);

                  const href = file.startsWith("http")
                    ? file
                    : `https://res.cloudinary.com/dfvumzr0q/raw/upload/${file}`;

                  return (
                    <a href={href} target="_blank">
                      {" "}
                      {/* rel="noopener noreferrer"*/}
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
                  {/* {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")} */}
                  {formatLabel(field)}:
                </label>
                {isEditing ? (
                  <input
                    type={field === "salary" ? "number" : "text"}
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    // className="form-control bg-light border-0"
                    className={`form-control border-0 ${
                      [
                        "casualLeaveBalance",
                        "sickLeaveBalance",
                        "salary",
                        "probationMonths",
                      ].includes(field)
                        ? "bg-secondary-subtle text-muted"
                        : "bg-light"
                    }`}
                    readOnly={[
                      "casualLeaveBalance",
                      "sickLeaveBalance",
                      "salary",
                      "probationMonths",
                    ].includes(field)}
                  />
                ) : (
                  <div className="form-control bg-light border-0">
                    {profile[field] ?? "-"}
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}

export default MyProfile;
