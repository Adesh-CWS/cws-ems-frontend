import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import AddEventForm from "./AddEventForm";

function AllEventsCards() {
  const location = useLocation();
  const { role } = useParams();
  const employees = location.state?.employees || [];
  const [eventsList, setEventsList] = useState([]);

  // ✅ check if role is admin
  const isAdmin = role === "admin";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Auth token if required
        const res = await axios.get(
          "http://localhost:8000/events-for-employee",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Sort events by date
        const sortedEvents = res.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );

        setEventsList(sortedEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err.response || err.message);
      }
    };
    fetchEvents();
  }, []); // empty dependency array = run once on mount

  //console.log("upcomingEvents", eventsList);

  return (
    <div className="container mt-4">
      <h5 className="mb-4 fw-bold text-center">Upcoming Events</h5>
      {/* Show Add Event Form only if role is admin */}
      {isAdmin && <AddEventForm />}
      {eventsList.length === 0 ? (
        <div className="alert alert-info text-center">No upcoming events</div>
      ) : (
        <div className="row g-3">
          {eventsList.map((event, idx) => (
            <div key={idx} className="col-md-4">
              <div
                className={`card shadow-sm border-0 text-center ${
                  event.isToday ? "border-success" : ""
                }`}
              >
                <div className="card-body">
                  <h6
                    className={`card-title fw-bold ${
                      event.isToday ? "text-success" : ""
                    }`}
                  >
                    {event.isToday
                      ? `🎉 ${event.type} Today: ${event.name}`
                      : `${event.name}'s ${event.type}`}
                  </h6>
                  <p className="card-text text-muted mb-0">
                    {new Date(event.date).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllEventsCards;
