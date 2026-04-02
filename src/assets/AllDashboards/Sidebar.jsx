import React, { useState, useRef, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  HouseDoorFill,
  PersonLinesFill,
  CalendarCheckFill,
  FileEarmarkTextFill,
  CalendarEventFill,
  BarChartFill,
  GearFill,
  TreeFill,
  ChatLeftTextFill,
  BriefcaseFill,
  ClipboardCheckFill,
  Images,
} from "react-bootstrap-icons";
import "./Sidebar.css";

function Sidebar({ handleLogout }) {
  const { role, username, id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);
  // Close sidebar when link is clicked (mobile)
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle button for small screens */}
      <button
        className="btn btn-primary d-md-none position-fixed m-2"
        style={{
          zIndex: 1100,
          backgroundColor: "#3A5FBE",
          borderColor: "#fcfcfcff",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>

      <div
        ref={sidebarRef}
        className={`sidebar text-white ${isOpen ? "open" : ""}`}
      >
        <ul className="nav flex-column text-center mt-4">
          {/* Dashboard */}
          <li className="nav-item ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}`}
              className="nav-link text-white d-flex flex-column align-items-center justify-content-center"
              onClick={handleLinkClick}
              end
            >
              <HouseDoorFill size={20} />
              <h6 className="mt-1">Dashboard</h6>
            </NavLink>
          </li>

          {/* hr Dashboard */}
          {role === "hr" && (
            <li className="nav-item ">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/hr-core-dashboard`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <HouseDoorFill size={20} />
                <h6 className="mt-1">HR Core Dashboard</h6>
              </NavLink>
            </li>
          )}
          {/* hr Dashboard */}
          {/* {role === "hr" && (
            <li className="nav-item ">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/hr-Recruitment`}
                className="nav-link text-white d-flex flex-column align-items-center"
              >
                <HouseDoorFill size={20} />
                <h6 className="mt-1">Recruitment</h6>
              </NavLink>
            </li>
          )} */}
          {/* {role === "hr" && (
            <li className="nav-item ">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/hr-Performance`}
                className="nav-link text-white d-flex flex-column align-items-center"
              >
                <HouseDoorFill size={20} />
                <h6 className="mt-1">Performance</h6>
              </NavLink>
            </li>
          )} */}

          {/* manager role */}
          {/* hr Dashboard */}
          {role === "manager" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/manager-core-dashboard`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <HouseDoorFill size={20} />
                <h6 className="mt-1">Manager Core Dashboard</h6>
              </NavLink>
            </li>
          )}

{role === "Team_Leader" && (
                      <li className="nav-item">
                        <NavLink
                          to={`/dashboard/${role}/${username}/${id}/tl-dashboard`}
                          className="nav-link text-white d-flex flex-column align-items-center"
                          onClick={handleLinkClick}
                          end
                        >
                          <HouseDoorFill size={20} />
                          <h6 className="mt-1">TL Core Dashboard</h6>
                        </NavLink>
                      </li>
                    )}

          {/* {role === "manager" && (
            <li className="nav-item ">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/my-training`}
                className="nav-link text-white d-flex flex-column align-items-center"
              >
                <HouseDoorFill size={20} />
                <h6 className="mt-1">My Training</h6>
              </NavLink>
            </li>
          )} */}

          {/* Leaves */}
          <li className="nav-item ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/leavebalance`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <TreeFill size={20} />
              {/* geetanjali code */}
              <h6 className="mt-1">
                {role === "admin" ||
                role === "ceo" ||
                role === "coo" ||
                role === "md"
                  ? "Employee Leaves"
                  : "Leaves"}
              </h6>
            </NavLink>
          </li>

          {/* Employee Registration - only for admin */}
          {role === "admin" && (
            <li className="nav-item ">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/allemployeedetails`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <PersonLinesFill size={20} />
                <h6 className="mt-1">Employee Registration</h6>
              </NavLink>
            </li>
          )}

          {/* My Attendance */}
          <li className="nav-item ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/employee`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <ClipboardCheckFill size={20} />
              {/* <h6 className="mt-1">My Attendance</h6> */}
              <h6 className="mt-1">
                {role === "admin" ||
                role === "ceo" ||
                role === "coo" ||
                role === "md"
                  ? "Employee Attendance"
                  : "My Attendance"}
              </h6>
            </NavLink>
          </li>

          {role === "manager" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/TeamAttendance`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <PersonLinesFill size={20} />
                <h6 className="mt-1">My Team Attendance</h6>
              </NavLink>
            </li>
          )}

          {/* rutuja code  */}
          {role === "Team_Leader" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/TLTeamMemberAttendance`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <PersonLinesFill size={20} />
                <h6 className="mt-1">My Team Attendance</h6>
              </NavLink>
            </li>
          )}
          

          {/* Regularization */}
          <li className="nav-item ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/regularization`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <CalendarCheckFill size={20} />
              {/* geetanjali code */}
              <h6 className="mt-1">
                {role === "admin" ||
                role === "ceo" ||
                role === "coo" ||
                role === "md"
                  ? "Employee Regularization"
                  : "Regularization"}
              </h6>
            </NavLink>
          </li>

          {/* Events */}
          <li className="nav-item  ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/AllEventsandHolidays`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <FileEarmarkTextFill size={20} />
              {/* <h6 className="mt-1"> {role === "admin" ? "Add Events" : "Events"}</h6> */}
              {/* <h6 className="mt-1"> {role === "admin" ? "Events/Holidays" : "Events"}</h6> */}
              <h6 className="mt-1">Events & Holidays</h6>
            </NavLink>
          </li>

          <li className="nav-item ">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/careers`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <BriefcaseFill size={20} />
              <h6 className="mt-1">Careers</h6>
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/gallery`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <Images size={20} />
              <h6 className="mt-1">Gallery</h6>
            </NavLink>
          </li>

          {/* jayashree */}
          {(role === "employee" ||
            role === "IT_Support" ||
            role === "Team_Leader"||   //rutuja
            role === "manager") && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/teams`}
                className="nav-link text-white d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <PersonLinesFill size={20} />
                <h6 className="mt-1">Teams</h6>
              </NavLink>
            </li>
          )}

          {role === "IT_Support" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/ITSupportDashboard`}
                className={({ isActive }) =>
                  `nav-link text-white d-flex flex-column align-items-center ${
                    isActive ? "active" : ""
                  }`
                }
                onClick={handleLinkClick}
              >
                <FileEarmarkTextFill size={20} />
                <h6 className="mt-1 mb-0">IT Support</h6>
              </NavLink>
            </li>
          )}

          {(role === "hr" ||
            role === "admin" ||
            role === "ceo" ||
            role === "coo" ||
            role === "md") && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/hr-policy`}
                className="nav-link sidebar-link d-flex flex-column align-items-center"
                onClick={handleLinkClick}
                end
              >
                <FileEarmarkTextFill size={20} className="sidebar-icon" />
                <h6 className="mt-1 sidebar-text">HR Policy</h6>
              </NavLink>
            </li>
          )}

          {role === "hr" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/feedback`}
                className="nav-link d-flex flex-column align-items-center"
              >
                <ChatLeftTextFill size={20} />
                <h6 className="mt-1">HR Feedback</h6>
              </NavLink>
            </li>
          )}

          {role === "admin" && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/feedback`}
                className="nav-link d-flex flex-column align-items-center"
              >
                <ChatLeftTextFill size={20} />
                <h6 className="mt-1">Feedback</h6>
              </NavLink>
            </li>
          )}

          {(role === "employee" || role === "manager" || role === "Team_Leader") && (
            <li className="nav-item">
              <NavLink
                to={`/dashboard/${role}/${username}/${id}/employee-feedback`}
                className="nav-link d-flex flex-column align-items-center"
                onClick={handleLinkClick}//rutuja
              >
                <ChatLeftTextFill size={20} />
                <h6 className="mt-1">Employee Feedback</h6>
              </NavLink>
            </li>
          )}

                   {/* added jayashree */}
            {(role === "hr" ||
              role === "admin" ||
              role === "ceo" ||
              role === "coo" ||
              role === "md") && (
                <li className="nav-item">
                   <NavLink
                         to={`/dashboard/${role}/${username}/${id}/schedule-interview`}
                         className="nav-link text-white d-flex flex-column align-items-center"
                    >
                    <CalendarCheckFill size={20} />
                    <h6 className="mt-1">Schedule Interview</h6>
                    </NavLink>
                </li>
              )}
        

          {(role === "employee" || role === "IT_Support"|| role === "Team_Leader") && (
                    <li className="nav-item">
                      <NavLink
                        to={`/dashboard/${role}/${username}/${id}/interviews`}
                        className="nav-link text-white d-flex flex-column align-items-center"
                      >
                        <CalendarCheckFill size={20} />
                        <h6 className="mt-1">Schedule Interviews</h6>
                      </NavLink>
                    </li>
                  )}
        
                  {(role === "manager") && (
                    <li className="nav-item">
                      <NavLink
                        to={`/dashboard/${role}/${username}/${id}/manager/interviews`}
                        className="nav-link text-white d-flex flex-column align-items-center"
                      >
                        <CalendarCheckFill size={20} />
                        <h6 className="mt-1">Schedule Interviews</h6>
                      </NavLink>
                    </li>
                  )}
                </ul>

        {/* //Added by Rushikesh */}
        {(role === "employee" || role === "IT_Support"|| role === "Team_Leader"|| role === "manager") && (
          <li className="nav-item">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/employee-policy`}
              className="nav-link sidebar-link d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <FileEarmarkTextFill size={20} className="sidebar-icon" />
              <h6 className="mt-1 sidebar-text">Company Policy</h6>
            </NavLink>
          </li>
        )}

        {(role === "admin") && (
          <li className="nav-item">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/resignation`}
              className="nav-link sidebar-link d-flex flex-column align-items-center"
            >
              <i className="bi bi-box-arrow-right fs-5 mb-1"></i>
              <span style={{ fontSize: "12px" }}>Resignation</span>
            </NavLink>
          </li>
        )}

        {(role === "employee" || role === "IT_Support") && (
          <li className="nav-item">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/employee-resignation`}
              className="nav-link d-flex flex-column align-items-center"
            >
              {/* Bootstrap box-arrow-right icon */}
              <i className="bi bi-box-arrow-right fs-5"></i>

              <h6 className="mt-1">My Resignation</h6>
            </NavLink>
          </li>
        )}

          {role === "Team_Leader" && (
                    <li className="nav-item">
                      <NavLink
                        to={`/dashboard/${role}/${username}/${id}/TL-Resignation`}
                        className="nav-link d-flex flex-column align-items-center"
                        onClick={handleLinkClick}
                      >
                        <i className="bi bi-box-arrow-right fs-5"></i>
                        <h6 className="mt-1">TL Resignation</h6>
                      </NavLink>
                    </li>
                  )}

      {(role === "manager" || role === "hr") && (
        <li className="nav-item">
          <NavLink
            to={`/dashboard/${role}/${username}/${id}/${
              role === "hr" ? "Hr-Resignation" : "Manager-Resignation"
            }`}
            className="nav-link d-flex flex-column align-items-center"
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            <h6 className="mt-1">Resignation</h6>
          </NavLink>
        </li>
      )}

        {/* //Added by Tanvi for Performance Dashboard */}
        {/* Performance (HR + Manager ONLY) */}
        {(role === "hr" ||
          role === "manager" ||
          role === "employee" ||
          role === "admin" ||
          role === "ceo" ||
          role === "Team_Leader"||
          role === "coo") && (
          <li className="nav-item">
            <NavLink
              to={`/dashboard/${role}/${username}/${id}/performance`}
              className="nav-link text-white d-flex flex-column align-items-center"
              onClick={handleLinkClick}
              end
            >
              <BarChartFill size={20} />
              <h6 className="mt-1">Performance</h6>
            </NavLink>
          </li>
        )}

        {/* Settings */}
        <li className="nav-item ">
          <NavLink
            to={`/dashboard/${role}/${username}/${id}/settings`}
            className="nav-link text-white d-flex flex-column align-items-center"
            onClick={handleLinkClick}
            end
          >
            <GearFill size={20} />
            <h6 className="mt-1">Settings</h6>
          </NavLink>
        </li>
      </div>
    </>
  );
}

export default Sidebar;
