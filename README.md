# SDU Booking (sdu-booking-webapp)

Simple React (Vite) frontend for the SDU booking project. It only displays data from the API and provides buttons/links to navigate between pages.

## Run

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend
npm run dev
```

Open http://localhost:5173

## Pages

| Route         | Page        | Data                                 |
| ------------- | ----------- | ------------------------------------ |
| `/`           | Home        | none                                 |
| `/rooms`      | Rooms list  | `GET /rooms`                         |
| `/rooms/:id`  | Room detail | `GET /rooms/:id`, `GET /rooms/:id/slots` |
| `/bookings`   | My bookings | `GET /bookings`                      |

## Structure

```
src/
  api.js          all HTTP calls in one place
  useFetch.js     small hook: { data, loading, error }
  components/     Navbar, RoomCard, Status
  pages/          one file per route
```

If the API can't be reached, the app logs a warning and shows mock data, so you
can demo the UI without a backend. Remove the fallback in `src/api.js` once the
real API is ready.

## Mock Data

Create a `mockData.js` file `src/` and follow the format below

```json
export const rooms = [
  {
    id: 0,
    name: "String",
    building: "String",
    floor: 0,
    capacity: 0,
    equipment: ["String", "String", "etc"],
    description: "String",
  }
];

export const slots = (roomId) => [
  { 
    id: `${roomId}-1`, 
    start: "ISO 8601 String", 
    end: "ISO 8601 String", 
    available: true
  }
];

export const bookings = [
  {
    id: 0,
    roomId: 0,
    roomName: "String",
    start: "ISO 8601 String",
    end: "ISO 8601 String",
    status: "String",
  }
];
```

## AI Disclosure
AI will be used to mass produce mock data and testing.