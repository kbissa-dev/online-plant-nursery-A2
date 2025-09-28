// src/api/events.js
import axios from "axios";

const API_URL = "http://localhost:5001/api/events";

export const getEvents = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getEvent = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createEvent = async (eventData, token) => {
  const res = await axios.post(API_URL, eventData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateEvent = async (id, eventData, token) => {
  const res = await axios.put(`${API_URL}/${id}`, eventData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteEvent = async (id, token) => {
  const res = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const rsvpEvent = async (id, token) => {
  const res = await axios.post(`${API_URL}/${id}/rsvp`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
