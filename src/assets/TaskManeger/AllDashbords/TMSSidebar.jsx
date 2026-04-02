import React, { useState, useRef, useEffect} from "react";
import { NavLink, useParams } from "react-router-dom";

import {
  HouseDoorFill,
  ListCheck,
  FolderFill,
  PeopleFill,
  BarChartFill,
  GearFill,
  ClipboardCheck,
  GraphUpArrow,
} from "react-bootstrap-icons";
import "./TMSSidebar.css";

function TMSSidebar() {
  const { role, username, id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
const sidebarRef = useRef(null);
  


useEffect(() => {
  if (window.innerWidth >= 768) {
    
  }
}, []);
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) setIsOpen(false);
  };
useEffect(() => {
  const handleOutsideClick = (event) => {
    if (
      isOpen &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  };

  document.addEventListener("mousedown", handleOutsideClick);
  document.addEventListener("touchstart", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("touchstart", handleOutsideClick);
  };
}, [isOpen]);
  return (
    <>
      {/* Toggle button for small screens (same as EMS) */}
      <button
        className="btn btn-primary d-md-none position-fixed m-2"
        style={{
          zIndex: 1100,
          backgroundColor: "#3A5FBE",
          borderColor: "#fcfcfcff",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div ref={sidebarRef} className={`sidebar text-white ${isOpen ? "open" : ""}`}>
        <ul className="nav flex-column text-center mt-4">
          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <HouseDoorFill size={20} />
              <h6 className="mt-1">Dashboard</h6>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}/task`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <ListCheck size={20} />
              <h6 className="mt-1">Task</h6>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}/tasklogs`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <ClipboardCheck size={20} />
              <h6 className="mt-1">Task Logs</h6>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}/project`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <FolderFill size={20} />
              <h6 className="mt-1">Projects</h6>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}/teams`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <PeopleFill size={20} />
              <h6 className="mt-1">Teams</h6>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to={`/tms-dashboard/${role}/${username}/${id}/report`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <GraphUpArrow size={20} />
              <h6 className="mt-1">Reports</h6>
            </NavLink>
          </li>
          {role === "admin" && (
            <li className="nav-item">
              <NavLink
                to={`/tms-dashboard/${role}/${username}/${id}/setting`}
                className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
                onClick={handleLinkClick}
                end
              >
                <GearFill size={20} />
                <h6 className="mt-1">Settings</h6>
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

export default TMSSidebar;
