import React, { useState, useEffect,useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AddHolidayForm from "../Holidays/AddHolidaysForms";
import AddEventForm from "./AddEventForm";
import "./EventAndHolidays.css";
import AddAnnouncements from "./AddAnnouncements";
import EditAnnouncementForm from "./EditAnnouncementForm";
import EditEventForm from "./EditEventForm";
import EditHolidayForm from "../Holidays/EditHolidayForm";

function EventsAndHolidaysDashboard() {
  const [holidayList, setHolidayList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [announcementList, setAnnouncementList] = useState([]);
  const { role } = useParams();
  const isAdmin = role === "admin";
  const currentYear = new Date().getFullYear();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingHolidays = holidayList.filter((h) => {
    const holidayDate = new Date(h.date);
    holidayDate.setHours(0, 0, 0, 0); // normalize
    return holidayDate >= today;
  });

  today.setHours(0, 0, 0, 0);
  const upcomingEvents = eventsList.filter((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0); // normalize
    return eventDate >= today;
  });

  //snehal code
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  //snehal code
  //aditya

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState([]); // Add state

  // Add Announcement handler
  const handleAddAnnouncement = (newAnnouncement) => {
    setAnnouncementsList((prev) => [newAnnouncement, ...prev]);
  };
  
  //snehal code editicon popup 11-02-2026
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  //Added by samiksha
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    alert("Announcement delete successfully!");
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`https://ems-cws-test.vercel.app/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // UI update
      setAnnouncementsList((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(
        "Failed to delete announcement:",
        err.response || err.message,
      );
      alert("Failed to delete announcement.");
    }
  };
const modalRef = useRef(null);

  useEffect(() => {
  const isAnyModalOpen = 
    selectedEvent || 
    selectedHoliday || 
    selectedAnnouncement || 
    editingEvent || 
    editingHoliday || 
    editingAnnouncement;

  if (isAnyModalOpen) {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = 'unset';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
  }

  return () => {
    document.body.style.overflow = 'unset';
    document.body.style.height = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
  };
}, [
  selectedEvent, 
  selectedHoliday, 
  selectedAnnouncement, 
  editingEvent, 
  editingHoliday, 
  editingAnnouncement
]);

useEffect(() => {
  const isAnyModalOpen = 
    selectedEvent || 
    selectedHoliday || 
    selectedAnnouncement || 
    editingEvent || 
    editingHoliday || 
    editingAnnouncement;

  if (!isAnyModalOpen || !modalRef.current) return;

  const modal = modalRef.current;

  const focusableSelectors =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const getFocusableElements = () =>
    modal.querySelectorAll(focusableSelectors);

  const focusFirst = () => {
    const elements = getFocusableElements();
    if (elements.length) elements[0].focus();
  };


  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (selectedEvent) setSelectedEvent(null);
      if (selectedHoliday) setSelectedHoliday(null);
      if (selectedAnnouncement) setSelectedAnnouncement(null);
      if (editingEvent) setEditingEvent(null);
      if (editingHoliday) setEditingHoliday(null);
      if (editingAnnouncement) setEditingAnnouncement(null);
    }
  
    if (e.key === "Tab") {
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;
  
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];
  
      if (e.shiftKey) {
        if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [
  selectedEvent, 
  selectedHoliday, 
  selectedAnnouncement, 
  editingEvent, 
  editingHoliday, 
  editingAnnouncement
]);
  //replace by shivani
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get("https://ems-cws-test.vercel.app/announcements/");
        const data = res.data.data || [];
  
        //  KEEP API ORDER (LIFO)
        setAnnouncementsList(data);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };
  
    fetchAnnouncements();
  }, []);


  // gitanjali
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await axios.get("https://ems-cws-test.vercel.app/getHolidays");

        // Sort by date and store all holidays
        const sorted = res.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        setHolidayList(sorted);
      } catch (err) {
        console.error("Failed to fetch holidays:", err.response || err.message);
      }
    };

    fetchHolidays();
  }, []);

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?"))
      return;
    alert("Holiday delete successfully!");
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`https://ems-cws-test.vercel.app/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHolidayList((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error("Failed to delete holiday:", err.response || err.message);
      alert("Failed to delete holiday.");
    }
  };

  // ------------------ EVENTS ------------------

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(
          "https://ems-cws-test.vercel.app/events-for-employee",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        console.log("Events response:", res.data); // 👀 check shape
        const sortedEvents = res.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        setEventsList(sortedEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err.response || err.message);
      }
    };

    fetchEvents();
  }, []);

  const handleDeleteEvent = async (id) => {
    console.log(id);
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    alert("Event delete successfully!");
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`https://ems-cws-test.vercel.app/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventsList((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error("Failed to delete event:", err.response || err.message);
      alert("Failed to delete event.");
    }
  };

  const handleAddEvent = (newEvent) => {
    console.log("🧩 New event received in handleAddEvent:", newEvent);
    setEventsList((prev) => {
      const updated = [...prev, newEvent];
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  // ✨ NEW — when AddHolidayForm adds a holiday
  const handleAddHoliday = (newHoliday) => {
    setHolidayList((prev) => {
      const updated = [...prev, newHoliday];
      return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  return (
    <div className="container events-holidays-container">
      <div className="row" style={{ marginTop: "-40px" }}>
        {/* ------------------ EVENTS ------------------ */}
        <div className="col-md-4 mb-4">
          <div className="section-header">
            <h5 className="section-title">Upcoming Events</h5>
            {isAdmin && <AddEventForm onAdd={handleAddEvent} />}
          </div>

          {eventsList.length === 0 ? (
            <div className="alert alert-info no-data-alert">
              No upcoming events
            </div>
          ) : (
            <div className="scrollable-list">
              {upcomingEvents.map((event, idx) => (
                //snehal code
                <div
                  key={idx}
                  className="card shadow-sm border-0 event-holiday-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {/* //snehal code */}
                  <div className="card-body">
                    <h6 className="card-title">{event.type}</h6>
                    <hr className="card-divider" />
                    <i
                      className={`event-icon me-2 fs-4 ${
                        event.type === "Birthday"
                          ? "bi bi-cake"
                          : event.type === "Team Outing"
                            ? "bi bi-geo-alt"
                            : "bi bi-calendar-event"
                      }`}
                    ></i>

                    <div className="card-content-center">
                      <div>
                        <div
                          className="event-name"
                          style={{ textTransform: "capitalize" }}
                        >
                          {event.name}
                        </div>
                        <div className="event-details">
                          {new Date(event.date).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-sm custom-outline-btn edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                        >
                          <i className="bi bi-pencil-square edit-icon"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event._id || event.id);
                          }}
                        >
                          <i className="bi bi-trash delete-icon"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* //snehal code */}
        {selectedEvent && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            ref={modalRef}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered"
            style={{ width: 500,marginLeft:550  }}>
              <div className="modal-content shadow-lg">
                <div
                  className="modal-header text-white"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title">Event Details</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedEvent(null)}
                  />
                </div>

                <div className="modal-body text-center">
                  <i
                    className={`event-icon me-2 fs-4 ${
                      selectedEvent.type === "Birthday"
                        ? "bi bi-cake"
                        : selectedEvent.type === "Team Outing"
                          ? "bi bi-geo-alt"
                          : "bi bi-calendar-event"
                    }`}
                  ></i>

                  <h5 style={{ textTransform: "capitalize" }}>
                    {selectedEvent.name}
                  </h5>

                  <p className="fw-semibold">{selectedEvent.type}</p>

                  <p className="text-muted mt-2">
                    {new Date(selectedEvent.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      weekday: "long",
                    })}
                  </p>
                </div>

                <div className="modal-footer border-0 pt-0 justify-content-end">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => setSelectedEvent(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* //snehal code */}
        {editingEvent && (
          <EditEventForm
            eventData={editingEvent}
            onClose={() => setEditingEvent(null)}
            onUpdate={(updatedEvent) => {
              setEventsList((prev) =>
                prev.map((ev) =>
                  ev._id === updatedEvent._id ? updatedEvent : ev,
                ),
              );
            }}
          />
        )}
        {/* ------------------ HOLIDAYS ------------------ */}
        <div className="col-md-4 mb-4">
          <div className="section-header">
            <h5 className="section-title">Upcoming Holidays</h5>
            {isAdmin && <AddHolidayForm onAdd={handleAddHoliday} />}
          </div>

          {holidayList.length > 0 ? (
            <div className="scrollable-list">
              {upcomingHolidays.map((h) => (
                //snehal code
                <div
                  key={h._id}
                  className="card shadow-sm border-0 event-holiday-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedHoliday(h)}
                >
                  {/* //snehal code */}
                  <div className="card-body">
                    <h6 className="card-title">Holiday</h6>
                    <hr className="card-divider" />
                    <i className="bi bi-star me-2 holiday-icon"></i>

                    <div className="card-content-center">
                      <div>
                        <div
                          className="holiday-name"
                          style={{ textTransform: "capitalize" }}
                        >
                          {h.name}
                        </div>
                        <div className="holiday-details">
                          {new Date(h.date).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <>
                        <button
                          className="btn btn-sm custom-outline-btn edit-btn"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            setEditingHoliday(h);
                          }}
                        >
                          <i className="bi bi-pencil-square edit-icon"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHoliday(h._id);
                          }}
                        >
                          <i className="bi bi-trash delete-icon"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info no-data-alert">
              No holidays found for {currentYear}.
            </div>
          )}
        </div>
        {/* //snehal code */}
        {selectedHoliday && (
          <div
            className="modal fade show d-block"
            ref={modalRef}
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered"
          style={{ width: 500,marginLeft:550  }}>
              <div className="modal-content shadow-lg">
                <div
                  className="modal-header text-white"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title">Holiday Details</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedHoliday(null)}
                  />
                </div>

                <div className="modal-body text-center">
                  <i className="bi bi-star-fill text-warning fs-1 mb-3"></i>

                  <h5 style={{ textTransform: "capitalize" }}>
                    {selectedHoliday.name}
                  </h5>

                  <p className="text-muted mt-2">
                    {new Date(selectedHoliday.date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        weekday: "long",
                      },
                    )}
                  </p>
                </div>

                <div className="modal-footer border-0 pt-0 justify-content-end">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => setSelectedHoliday(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {editingHoliday && (
          <EditHolidayForm
            holidayData={editingHoliday}
            onClose={() => setEditingHoliday(null)}
            onUpdate={(updated) => {
              setHolidayList((prev) =>
                prev.map((h) => (h._id === updated._id ? updated : h)),
              );
            }}
          />
        )}
        {editingAnnouncement && (
          <EditAnnouncementForm
            data={editingAnnouncement}
            onClose={() => setEditingAnnouncement(null)}
            onUpdate={(updated) => {
              setAnnouncementsList((prev) =>
                prev.map((a) => (a._id === updated._id ? updated : a)),
              );
            }}
          />
        )}

        {/* ------------------ ANNOUNCEMENTS ------------------ */}
        <div className="col-md-4 mb-4">
          <div className="section-header">
            <h5 className="section-title">Announcements</h5>
            {isAdmin && <AddAnnouncements onAdd={handleAddAnnouncement} />}
          </div>
          {announcementsList.length === 0 ? (
            <div className="alert alert-info no-data-alert">
              No upcoming announcements
            </div>
          ) : (
            <div className="scrollable-list">
              {announcementsList
                .filter((announcement) => {
                  if (!announcement.expirationDate) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const expiryDate = new Date(announcement.expirationDate);
                  expiryDate.setHours(0, 0, 0, 0);
                  return expiryDate >= today;
                })
                .map((announcement, idx) => (
                  //snehal code
                  <div
                    key={idx}
                    className="card shadow-sm border-0 event-holiday-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    {/* //snehal code */}
                    <div className="card-body">
                      <h6 className="card-title">{announcement.name}</h6>
                      <hr className="card-divider" />
                      <img
                        src={announcement.image}
                        alt={announcement.name}
                        style={{
                          width: "60px",
                          height: "36px", //added by mahesh
                          objectFit: "cover",
                        }}
                      />

                      <div className="card-content-center">
                        <div>
                          <div
                            className="event-name"
                            style={{ textTransform: "capitalize" }}
                          >
                            {announcement.name}
                          </div>
                          <div className="event-details">
                            {new Date(
                              announcement.publishDate,
                            ).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            })}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <>
                          <button
                            className="btn btn-sm custom-outline-btn edit-btn"
                           onClick={(e) => {
                              e.stopPropagation();
                              setEditingAnnouncement(announcement);
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger delete-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // 👈 popup open hou naye mhanun
                              handleDeleteAnnouncement(
                                announcement._id || announcement.id,
                              );
                            }}
                          >
                            <i className="bi bi-trash delete-icon"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* //snehal code */}
        {selectedAnnouncement && (
          <div
            className="modal fade show d-block"
            ref={modalRef}
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered"
       style={{ width: 500,marginLeft:550  }}>
              <div className="modal-content shadow-lg">
                {/* Header */}
                <div
                  className="modal-header text-white"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title">{selectedAnnouncement.name}</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedAnnouncement(null)}
                  />
                </div>

                {/* Body */}
                <div className="modal-body px-3">
                  {selectedAnnouncement.image && (
                    <div className="text-center mb-3">
                      <img
                        src={selectedAnnouncement.image}
                        alt={selectedAnnouncement.name}
                        className="img-fluid rounded"
                        style={{
                          maxHeight: "250px",
                          width: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <div className="container-fluid">
                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Description</div>
                      <div className="col-8">
                        {selectedAnnouncement.description || "-"}
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Publish Date</div>
                      <div className="col-8">
                        {new Date(
                          selectedAnnouncement.publishDate,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Expiry Date</div>
                      <div className="col-8">
                        {new Date(
                          selectedAnnouncement.expirationDate,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Footer with ONLY Close Button */}
                <div className="modal-footer border-0 pt-0 justify-content-end">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: "90px" }}
                    onClick={() => setSelectedAnnouncement(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BACK BUTTON */}
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

export default EventsAndHolidaysDashboard;
