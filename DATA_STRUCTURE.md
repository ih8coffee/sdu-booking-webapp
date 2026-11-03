# SDU Booking: Data Structure

Two kinds of data are described here:

1. **Backend data** returned by the team's Django API (`sdu-booking-backend`). The frontend
   does not change the backend; it works around what the backend provides.
2. **Frontend-only data** (users and reservations) that the backend cannot store yet.

The backend base URL is `VITE_API_URL` (default `http://localhost:8000/api`, see `.env.example`).

---

## 1. Backend API (read-only)

All four endpoints are `GET`, return JSON, and have no trailing slash. CORS is open, so the
frontend can call them from `localhost:5173`.

| Method | Path                | Returns                  | Notes                                                |
| ------ | ------------------- | ------------------------ | ---------------------------------------------------- |
| GET    | `/rooms`            | `Room[]`                 | Only rooms with `bookable = true`                    |
| GET    | `/rooms/:id`        | `Room`                   | `404 {"error": "Room not found"}` for unknown or non-bookable rooms |
| GET    | `/rooms/:id/slots`  | `Slot[]`                 | `404 {"error": "Room not found"}` as above           |
| GET    | `/bookings`         | `Booking[]`              | Everyone's bookings, no user information             |

### Room

| Field         | Type     | Example                       |
| ------------- | -------- | ----------------------------- |
| `id`          | number   | `71`                          |
| `name`        | string   | `"H102"`                      |
| `building`    | string   | `"Main Building"`             |
| `floor`       | number   | `1`                           |
| `capacity`    | number   | `80`                          |
| `equipment`   | string[] | `["Projector", "Whiteboard"]` |
| `description` | string   | `"Standard classroom."`       |

### Slot

| Field       | Type    | Example                | Notes                                                         |
| ----------- | ------- | ---------------------- | ------------------------------------------------------------- |
| `id`        | string  | `"71-1"`               | `<roomId>-<n>`                                                |
| `start`     | string  | `"2026-11-02T09:30"`   | Local time, no timezone, format `YYYY-MM-DDTHH:MM`            |
| `end`       | string  | `"2026-11-02T10:20"`   | Same format                                                   |
| `available` | boolean | `true`                 | Mirrors the room's `bookable` flag only; it does **not** reflect existing bookings |

### Booking

| Field      | Type   | Example                | Notes                                                       |
| ---------- | ------ | ---------------------- | ----------------------------------------------------------- |
| `id`       | number | `1`                    |                                                             |
| `roomId`   | number | `72`                   | References `Room.id`                                        |
| `roomName` | string | `"F303"`               |                                                             |
| `start`    | string | `"2026-11-02T09:30"`   | Copied from the booked slot                                 |
| `end`      | string | `"2026-11-02T10:20"`   |                                                             |
| `status`   | string | `"confirmed"`          | `pending`, `confirmed`, `rejected` or `cancelled`           |

The database also stores `userLogin` and the slot id on each booking, but the API does **not**
return them.

### Relationships

```
Room 1 ──── * Slot       a room has many time slots
Slot 1 ──── * Booking    (in the database) a booking belongs to one slot
```

The API exposes the link between a booking and a slot only indirectly: a booking matches a slot
when `roomId`, `start` and `end` are the same. The frontend uses exactly that rule.

---

## 2. Frontend-only data

### User (demo accounts)

Defined in `src/auth/demoUsers.js`, kept in the browser (`localStorage` key `sdu.user`).

| Field      | Type   | Example                |
| ---------- | ------ | ---------------------- |
| `login`    | string | `"240107001"`, `"staff01"` |
| `password` | string | `"student123"`         |
| `role`     | string | `"student"` or `"staff"` |
| `name`     | string | `"Student 240107001"`  |

Student IDs match the `userLogin` values in the backend's seed data.

### Local booking (reservations made in this app)

Stored in `localStorage` key `sdu.localBookings`. Same shape as a backend Booking, plus:

| Field       | Type   | Example                          |
| ----------- | ------ | -------------------------------- |
| `id`        | string | `"local-1730600000000-ab12c"`    |
| `source`    | string | `"local"` (backend ones are `"server"`) |
| `slotId`    | string | `"72-2"`                         |
| `userLogin` | string | `"240107001"`                    |
| `userName`  | string | `"Student 240107001"`            |
| `createdAt` | string | ISO timestamp                    |

Backend bookings are loaded into the same list with `source: "server"` and `userLogin: null`
(the API does not say who made them).

### Reservation rules in the frontend

- A student's request is created as `pending`; a staff booking is `confirmed` immediately.
- A slot is taken when any `pending` or `confirmed` booking (backend or local) has the same
  `roomId`, `start` and `end`.
- Students can cancel their own reservations. Staff can approve, reject or cancel local
  reservations. Backend bookings are read-only.

---

## 3. What the backend is missing (for the team)

These are the gaps the frontend works around today. Nothing here changes the backend; it is
a list of what would replace the frontend-only parts if the backend team adds it later.

| Frontend workaround                         | Backend feature that would replace it                    |
| ------------------------------------------- | -------------------------------------------------------- |
| Demo accounts and roles in `demoUsers.js`   | Login endpoint returning a user and role (`student`/`staff`) |
| Reservations stored in the browser          | `POST /bookings` (room, slot, user)                      |
| Approve / reject / cancel done locally      | `PATCH /bookings/:id` with a new `status`, staff only    |
| "My bookings" filtered in the browser       | `GET /bookings` returning `userLogin`, or a `?mine=true` filter |
| Slot availability computed from bookings    | `Slot.available` that accounts for existing bookings     |

`POST` requests to `/bookings` are currently rejected by Django's CSRF protection (HTTP 403), and
the view only handles `GET`, so the frontend does not attempt them.

## Where this lives in the code

- `src/api.js`: the four backend calls, with mock-data fallback when the backend is unreachable.
- `src/auth/`: demo accounts and login state.
- `src/bookings/BookingsContext.jsx`: merges backend and local bookings; `reserve()` and
  `setStatus()` are the only places to change when the backend gains write endpoints.
- `src/mockData.js`: sample data in the same shapes, used only when the backend is down.
