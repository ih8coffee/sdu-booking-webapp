# SDU Booking (sdu-booking-webapp)

React (Vite) frontend for a university room-booking system. It talks to the team's Django
backend (`sdu-booking-backend`), which we do not modify.

See [DATA_STRUCTURE.md](DATA_STRUCTURE.md) for the data shapes and the list of backend gaps.

## Run

Start the backend (in its own repo/folder):

```bash
pip install -r requirements.txt
python manage.py runserver      # serves http://localhost:8000/api
```

Then the frontend:

```bash
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000/api
npm run dev                     # http://localhost:5173
```

If the backend can't be reached, the app shows demo data and a yellow banner.

## Demo logins

The backend has no login yet, so accounts live in `src/auth/demoUsers.js` (not secure).

| Role    | ID          | Password     |
| ------- | ----------- | ------------ |
| Student | `240107001` (also `...002`, `...003`) | `student123` |
| Staff   | `staff01`, `staff02` | `staff123`   |

## What each role can do

| Page                | Student                                   | Staff                                      |
| ------------------- | ----------------------------------------- | ------------------------------------------ |
| `/login`            | Student tab                               | Staff tab                                  |
| `/` Home            | Stats, my upcoming reservations           | Stats, all upcoming reservations, pending count |
| `/rooms`            | Search, building, capacity, equipment filters | same                                   |
| `/rooms/:id`        | Request a slot (becomes `pending`), cancel own | Book a slot (confirmed immediately)   |
| `/my-bookings`      | Own reservations, cancel                  | Own reservations, cancel                   |
| `/manage`           | not allowed                               | All bookings, approve / reject / cancel    |

## Important limitation

The backend can only **list** bookings. Reservations made in the app are stored in the browser
(`localStorage`) and merged with the backend's list, so they are not shared between browsers
or visible to the backend. Backend bookings are shown read-only. See section 3 of
DATA_STRUCTURE.md for what the backend would need to add.

## Structure

```
src/
  api.js                      the four backend GET calls + mock fallback
  auth/                       demo accounts, AuthContext (login state, roles)
  bookings/BookingsContext    backend + local bookings, reserve(), setStatus()
  components/                 Navbar, RoomCard, RequireAuth, Skeleton, StatusBadge, ...
  pages/                      Login, Home, Rooms, RoomDetail, MyBookings, Manage
  mockData.js                 fallback data when the backend is down
```

## Loading and entrance animations

- While data loads, translucent skeleton placeholders fade in one after another and shimmer out
  of phase (`src/components/Skeleton.jsx`).
- When data arrives, cards, stat tiles, list rows and table rows fade up one after another
  (`src/components/Reveal.jsx`). Wrap any new list item in `<Reveal index={i}>`.
- The timing lives in `src/stagger.js`: the gap between items shrinks as a list grows, with a few
  milliseconds of fixed jitter so it doesn't feel mechanical, and the total is capped at 520ms.
  Tweak `STEP_MS`, `EXPONENT` and `MAX_MS` there.
- Items already on screen never replay when you filter, reserve or approve; only new items animate.
- Everything is switched off for people who enable "reduce motion" in their OS.
