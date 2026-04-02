import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import axios from "axios";

function HolidaysCalendar() {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await axios.get("http://localhost:8000/holidays");
        // Map holidays to FullCalendar event format
        const events = res.data.map(h => ({
          title: h.name,
          start: h.date,
          description: h.description,
        }));
        setHolidays(events);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
      }
    };

    fetchHolidays();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Holiday Calendar</h3>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={holidays}
        eventContent={renderEventContent}
      />
    </div>
  );
}

// Custom event renderer
function renderEventContent(eventInfo) {
  return (
    <div>
      <b>{eventInfo.event.title}</b>
      <i style={{ display: "block", fontSize: "0.75rem" }}>
        {eventInfo.event.extendedProps.description}
      </i>
    </div>
  );
}

export default HolidaysCalendar;
