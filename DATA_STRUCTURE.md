# data structure

base url is `VITE_API_URL` (default `http://localhost:8000/api`), no trailing slash.

## what the backend has

- `GET /rooms` - bookable rooms only
- `GET /rooms/:id` - 404 `{"error": "Room not found"}` if it doesn't exist or isn't bookable
- `GET /rooms/:id/slots` - same 404
- `GET /bookings` - everyone's bookings
- `POST /login` - form data (not json): `login`, `password`, `role`

### Room
`id`, `name`, `building`, `floor`, `capacity`, `equipment` (list of strings), `description`

```json
{ "id": 71, "name": "H102", "building": "Main Building", "floor": 1, "capacity": 80,
  "equipment": ["Projector", "Whiteboard"], "description": "Standard classroom." }
```

### Slot
`id` ("71-1", roomId-n), `start`, `end`, `available`

times are `"2026-11-02T09:30"`, local time, no timezone.
`available` is just the room's bookable flag, it ignores existing bookings.

### Booking
`id`, `roomId`, `roomName`, `start`, `end`, `status`

status is `pending`, `confirmed`, `rejected` or `cancelled`. no user info in it. the db has
`userLogin` but it's not sent. a booking matches a slot when roomId + start + end are the same
(that's what the frontend does).

### Login
send `login`, `password`, `role` ("student" or "staff"), get back:

```json
{ "result": 0, "login": "240107001", "role": "student", "name": "Student 240107001" }
```

result: 0 ok, 1 wrong login/password (name is "ERROR"), 2 wrong role.
always http 200, even when it fails. no token or session, the frontend just keeps the user in
localStorage (`sdu.user`: login, name, role).

## frontend only (for now)

reservations are saved in localStorage (`sdu.localBookings`) and merged into the list with the
backend ones. same fields as a Booking plus `source` ("local", backend ones are "server"),
`slotId`, `userLogin`, `userName`, `createdAt`. backend ones get `userLogin: null`.

- student request -> `pending`, staff booking -> `confirmed`
- slot is taken if any pending/confirmed booking has the same roomId + start + end
- students cancel their own, staff approve / reject / cancel local ones
- backend bookings are read only

## todo

backend needs:
- `POST /bookings` (room, slot, user) so we can drop the localStorage bookings
- `PATCH /bookings/:id` to change status (approve / reject / cancel), staff only
- `userLogin` in `GET /bookings`, or `?mine=true`, so "my bookings" works
- `Slot.available` should count existing bookings
- login (and `POST /bookings` later) needs csrf_exempt or a csrf token flow, django blocks the
  POST from the browser (403) otherwise

frontend:
- once POST/PATCH exist, change `reserve()` and `setStatus()` in `src/bookings/BookingsContext.jsx`
- send the user with requests once the backend has some kind of session/token

code: `src/api.js` (calls), `src/auth/AuthContext.jsx` (login state), `src/bookings/BookingsContext.jsx`, `src/mockData.js` (sample data when the backend is down).
