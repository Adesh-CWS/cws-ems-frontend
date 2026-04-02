import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";

const EventCard = () => {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { role, username, id } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        const res = await authAxios.get("/events-for-employee");
        // setEvents(res.data || []);
        // Convert date string → Date object
        const formatted = res.data.map((e) => ({
          ...e,
          date: new Date(e.date),
        }));

        // ✨ FIX: Get today's date at start of day (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Keep only future events (today and onwards) & sort
        const future = formatted.filter((e) => {
          const eventDate = new Date(e.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today; // ✨ CHANGED: >= instead of > (includes today)
        });

        future.sort((a, b) => a.date - b.date);

        setEvents(future);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // if (loading) return <p>Loading events...</p>;

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
      Loading ...
    </p>
  </div>;

  if (error) return <p className="text-danger">{error}</p>;
  if (events.length === 0) return <p>No upcoming events.</p>;

  const currentEvent = events[currentIndex];

  return (
    <div
      className="card shadow-sm h-100 border-0 "
      style={{ borderRadius: "10px" }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center "
        style={{ backgroundColor: "#fff", borderRadius: "12px 12px 0 0" }}
      >
        <button
          className="btn btn-link p-0"
          style={{ color: "#3A5FBE", fontSize: "20px" }}
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === 0 ? events.length - 1 : prev - 1,
            )
          }
        >
          <ChevronLeft size={20} />
        </button>
        <span
          className="fw-semibold"
          style={{ color: "#3A5FBE", fontSize: "20px" }}
        >
          {" "}
          Upcoming Events{" "}
        </span>
        <button
          className="btn btn-link p-0"
          style={{ color: "#3A5FBE" }}
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === events.length - 1 ? 0 : prev + 1,
            )
          }
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="card-body text-center" style={{ color: "#3A5FBE" }}>
        {currentEvent.type === "Birthday" ? (
          <i className="bi bi-cake fs-2 " style={{ color: "#3A5FBE" }}></i>
        ) : (
          <i className="bi bi-building fs-2" style={{ color: "#3A5FBE" }}></i>
        )}

        <p className="mb-0 fw-semibold" style={{ textTransform: "capitalize" }}>
          {currentEvent.type} - {currentEvent.name}
        </p>

        <small className="text-muted">
          {currentEvent.date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            weekday: "short",
            year: "numeric",
          })}
        </small>

        <div className="mt-3 ">
          <style>
            {`
                      .custom-outline-btn {
                        color: #3A5FBE;
                        border-color: #3A5FBE;
                        background-color: transparent;
                        transition: background-color 0.3s, color 0.3s;
                      }
                      .custom-outline-btn:hover {
                        color: #fff !important;
                        background-color: #3A5FBE !important;
                        border-color: #3A5FBE !important;
                      }
                    `}
          </style>

          <button
            className="btn btn-sm custom-outline-btn me-2"
            // style={{
            //   whiteSpace: "nowrap",
            //   height: "31px",
            //   display: "flex",
            //   alignItems: "center",
            //   justifyContent: "center",
            // }}
            onClick={() =>
              navigate(
                `/dashboard/${role}/${username}/${id}/AllEventsandHolidays`,
                {
                  state: { events },
                },
              )
            }
          >
            View All Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
