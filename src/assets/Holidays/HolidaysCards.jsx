import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar3, ChevronLeft, ChevronRight } from "react-bootstrap-icons";

function HolidaysCard({}) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { role, username, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        const res = await authAxios.get("/getHolidays");

        // Convert date string → Date object
        const formatted = res.data.map((h) => ({
          ...h,
          date: new Date(h.date),
        }));

        // Keep only future holidays & sort
        const future = formatted.filter((h) => h.date >= new Date());
        future.sort((a, b) => a.date - b.date);

        setHolidays(future);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch holidays");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  // if (loading) return <p>Loading holidays...</p>;
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
  // if (holidays.length === 0) return <p>No upcoming holidays</p>;

  // When there are no holidays, display a card similar to the main card
  if (holidays.length === 0) {
    return (
      <div className="card shadow-sm h-100 border-0 bg-white">
        <div className="card-header d-flex justify-content-center align-items-center">
          <h2
            style={{ color: "#3A5FBE", fontSize: "20px", marginLeft: "15px" }}
          >
            Upcoming Holidays
          </h2>
        </div>

        <div className="card-body text-center">
          <Calendar3 className="fs-1 mb-2" style={{ color: "#3A5FBE" }} />
          <p className="mb-0 fw-semibold" style={{ color: "#3A5FBE" }}>
            No Upcoming Holidays
          </p>
          <small className="text-muted">
            There are no holidays scheduled at the moment
          </small>
        </div>
      </div>
    );
  }
  const holiday = holidays[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? holidays.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === holidays.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="card shadow-sm h-100 border-0"
      style={{ borderRadius: "10px" }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{ backgroundColor: "#fff", borderRadius: "12px 12px 0 0" }}
      >
        <button
          className="btn btn-link p-0"
          style={{ color: "#3A5FBE" }}
          onClick={handlePrev}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="fw-semibold" style={{ color: "#3A5FBE", fontSize: "20px"  }}>
          Upcoming Holidays
        </span>
        <button
          className="btn btn-link p-0"
          style={{ color: "#3A5FBE" }}
          onClick={handleNext}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="card-body text-center">
        <i className=" bi bi-calendar3 fs-2 " style={{ color: "#3A5FBE" }}></i>
        <p className="mb-0 fw-semibold" style={{ color: "#3A5FBE" }}>
          {holiday.name
            ? holiday.name
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase())
            : ""}
        </p>
        <small className="text-muted">
          {holiday.date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            weekday: "short",
          })}
        </small>

        <div className="mt-3">
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
                  state: { holidays },
                },
              )
            }
          >
            View All Holidays
          </button>
        </div>
      </div>
    </div>
  );
}

export default HolidaysCard;
