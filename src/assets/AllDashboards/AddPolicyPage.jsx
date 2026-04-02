import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const STORAGE_KEY = "hr_policies";
import axios from "axios";

function AddPolicyPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [hoverSave, setHoverSave] = useState(false);
  const [hoverCancel, setHoverCancel] = useState(false);

  const handleSave = async () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      if (file) {
        formData.append("image", file); // optional
      }

      await axios.post("http://localhost:8000/policy/create", formData);

      alert("Policy created successfully");
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create policy");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          width: "500px",
          borderRadius: "12px",
          padding: "24px",
          position: "relative",
        }}
      >
        {/* 🔹 HEADER */}
        <div
          style={{
            background: "#3A5FBE",
            padding: "12px 20px",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "-24px -24px 20px -24px",
          }}
        >
          <h3
            style={{
              color: "#ffffff",
              margin: 0,
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Add New Policy
          </h3>

          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {/* 🔹 FORM */}
        <label
          style={{
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "6px",
            display: "block",
            color: "#374151",
          }}
        >
          Policy Title
        </label>

        <input
          type="text"
          placeholder="Policy Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
        />
        <label
          style={{
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "6px",
            display: "block",
            color: "#374151",
          }}
        >
          Policy Description
        </label>

        <textarea
          placeholder="Policy Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={300}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
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
          {description.length}/300
        </div>
        <label
          style={{
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "6px",
            display: "block",
            color: "#374151",
          }}
        >
          Upload Policy PDF (optional)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "16px" }}
        />

        {/* 🔹 ACTIONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button className="custom-outline-btn" onClick={() => navigate(-1)}>
            Cancel
          </button>

          <button className="custom-outline-btn" onClick={handleSave}>
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddPolicyPage;
