// Backend (Django) lives at /api. Default matches `python manage.py runserver`.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Set VITE_USE_MOCK=true to run without the backend (uses src/mockData.js).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
