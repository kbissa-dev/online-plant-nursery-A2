// src/components/CommunityEvents.js
import React, { useEffect, useState } from "react";
import { getEvents, rsvpEvent } from "../api/events";

const CommunityEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRSVP = async (id) => {
    try {
      const token = localStorage.getItem("token"); // example auth
      const updated = await rsvpEvent(id, token);
      setEvents(events.map(ev => ev.id === id ? updated : ev));
    } catch (err) {
      console.error("RSVP failed:", err);
    }
  };

  if (loading) return <p>Loading community events...</p>;

  return (
    <div>
      <h2>Community Events</h2>
      <ul>
        {events.map(ev => (
          <li key={ev.id}>
            <strong>{ev.title}</strong> ({ev.date}) at {ev.location}
            {ev.isFeatured && <span style={{ color: "red" }}> Featured</span>}
            <button onClick={() => handleRSVP(ev.id)}>RSVP</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityEvents;
