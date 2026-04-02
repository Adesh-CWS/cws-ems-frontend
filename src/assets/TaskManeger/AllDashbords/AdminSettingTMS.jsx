import React, { useState } from "react";

import AdminTypeOfTask from "./AdminTypeOfTask";
import AdminTypeOfStatus from "./AdminTypeOfStatus";
//import Status from "./Status";

function AdminSettingTMS() {
    const [activeTab, setActiveTab] = useState("typeOfTask");

    return (
    
    //      <div className="p-3 d-flex justify-content-between align-items-center" style={{ color: "#3A5FBE",boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}>
    //     <div className="d-flex align-items-center gap-3">
    //       <img 
    //         src="/myprofile.jpg"
    //         alt="User" 
    //         className="rounded-circle"
    //         style={{ width: '40px', height: '40px' }}
    //       />
    //       <div>
    //         <div style={{ fontSize: '16px',fontWeight:"bold" }}>Welcome back!</div>
    //         <div style={{ fontSize: '14px', opacity: 0.9 }}>Komal Kude</div>
    //       </div>
    //     </div>
        
    //     <div className="d-flex gap-5 align-items-center">
    //          <input 
    //       type="text" 
    //       className="form-control" 
    //       placeholder="tasks, projects, users..."
    //       style={{ maxWidth: '300px', borderRadius: '8px' }}
          
    //     />
    //      <i className="bi bi-search" style={{ fontSize: '20px', cursor: 'pointer' }}></i>
    //       <i className="bi bi-bell" style={{ fontSize: '20px', cursor: 'pointer' }}></i>
    //       <i className="bi bi-plus-circle" style={{ fontSize: '20px', cursor: 'pointer' }}></i>
    //       <img 
    //         src="/myprofile.jpg" 
    //         alt="Profile" 
    //         className="rounded-circle"
    //         style={{ width: '35px', height: '35px', cursor: 'pointer' }}
    //       />
    //     </div>
    //   </div>

      <div
        className="container-fluid p-3 p-md-4 p-2"
        style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
      >
        
        {/* Tab buttons */}
        <div className="d-flex justify-content-center mb-3 gap-2">
          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "typeOfTask" ? "btn-primary" : "btn-outline-primary"
            }`}
            style={{
              minWidth: 140,
              backgroundColor:
                activeTab === "typeOfTask" ? "#3A5FBE" : "transparent",
              borderColor: "#3A5FBE",
              color: activeTab === "typeOfTask" ? "white" : "#3A5FBE",
            }}
            onClick={() => setActiveTab("typeOfTask")}
          >
            Type of Task
          </button>

          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "status" ? "btn-primary" : "btn-outline-primary"
            }`}
            style={{
              minWidth: 140,
              backgroundColor:
                activeTab === "status" ? "#3A5FBE" : "transparent",
              borderColor: "#3A5FBE",
              color: activeTab === "status" ? "white" : "#3A5FBE",
            }}
            onClick={() => setActiveTab("status")}
          >
            Status
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "typeOfTask" && <AdminTypeOfTask />}


        {activeTab === "status" && <AdminTypeOfStatus />}  
      </div>

    );
}

export default AdminSettingTMS;
