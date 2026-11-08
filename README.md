# SDU Booking (sdu-booking-webapp)

React (Vite) frontend for the room booking system. Talks to [sdu-booking-backend](https://github.com/AbdDinmukhamed/sdu-booking-backend).

See [DATA_STRUCTURE.md](DATA_STRUCTURE.md) for the data shapes and the todo list.

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

## Logging in

Login goes to the backend (`POST /api/login`). The test accounts are in `sdu_api.py` in the
backend repo.

## Bookings are local for now

The backend can only list bookings. Reservations made in the app are saved in `localStorage` and
merged with the backend's list, so they aren't shared between browsers and the backend never sees
them. Backend bookings are read-only. Todo list is in DATA_STRUCTURE.md.

## Tests



```bash
npm test             # run everything once
npm run test:watch   # re-run on save
```

The live-backend half of `contract.test.js` runs only when the backend is up
(`python manage.py runserver`); otherwise those five tests are skipped, not failed, and the
test output says why (for example `ECONNREFUSED`, or a wrong `VITE_API_URL`). It tries both
`localhost` and `127.0.0.1`.

The suite passes on Node 18, 20, 22, 24 and 25.

TLDR: If youre on anything but the aformentioned node versions, vitests will fail because cthulhu.
