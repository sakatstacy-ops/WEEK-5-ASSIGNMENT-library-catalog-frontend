# Library Catalog, Reading List, and Space Booking

A small library app with a searchable catalog, a persistent reading list, API-backed account registration and login, protected booking access, and a local-only booking form.

## Persistence strategy

The reading list is stored in browser `localStorage` under `library-reading-list-v1`. This is appropriate for a personal, device-local shortlist because the assignment does not require syncing a reader's list between accounts or devices. The app validates the stored JSON before using it and keeps reading-list updates available immediately without a network request. Authentication tokens are separate and stored in `localStorage` so a refresh can restore a login; the Django API hashes passwords and issues DRF tokens. Booking details remain in React component state only and are not sent to the server, as required for this week's UI-only milestone.

## Run locally

Python 3.10+ is required. The frontend loads React and Babel from unpkg, so a network connection is needed when opening the app.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py test catalog
python manage.py runserver
```

Open <http://127.0.0.1:8000/>. Create an account from **Create account**, or sign in with an existing account. The catalog and authentication endpoints are served from the same Django origin.

## Demo recording checklist

1. Add a book to the reading list.
2. Refresh the page and show that it remains.
3. Remove the book from the list.
4. While logged out, enter `/booking` directly and show the redirect to `/login`.
5. Log in, open `/booking`, and fill in the space, date, start time, and end time.
6. Submit the form and show the local confirmation without a booking API request.

## API

- `GET /api/books/` returns the sample catalog.
- `POST /api/auth/register` accepts `{ "name", "email", "password" }`, creates an account, and returns a token.
- `POST /api/auth/login` accepts `{ "email", "password" }` and returns a token on success.
- `GET /api/auth/me` requires `Authorization: Token <token>`.

Registration rejects duplicate email addresses; login returns a visible `401` response for invalid credentials. The frontend shows these API errors beside the form.