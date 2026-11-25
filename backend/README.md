# ApplicationBoard

A job application tracker. It starts as a simple CRUD app, then tracks applications automatically from Gmail, then helps you prepare for online assessments (OAs) and interviews.

**Current status:** Priority 1, backend. The FastAPI app, settings, DB session and models exist. Routes and authentication do not exist yet.

## Roadmap

### Priority 1: MVP (in progress)

A CRUD app for job applications, backed by MySQL and deployed.

- Log in with email and password
- Create, view, update and delete your own applications
- Deploy the app

### Priority 2: Automatic tracking from Gmail

- Replace email and password login with Google OAuth, requesting Gmail read-only access
- Read incoming emails and classify each one as related to an application or not
- Extract details such as role, company and status, and store them in the DB

Things to plan for:

- **Google verification:** `gmail.readonly` is a restricted scope. Opening the app to the public requires Google's verification and may require a security assessment. While the OAuth app is in testing mode, it's limited to listed test users and refresh tokens expire after 7 days.
- **Data use rules:** Check Google's API Services User Data Policy before sending email content to an LLM.
- **Token storage:** Refresh tokens need to be encrypted at rest.
- **Schema changes:** `Users.hashed_password` has to become nullable, or be removed, for OAuth users.
- **Duplicate emails:** Store each processed Gmail message ID so an email is never handled twice.
- **Fetching email:** Choose between polling and Gmail push notifications.
- **Matching:** Decide how an email is matched to an existing application, so a status update doesn't create a duplicate.

### Priority 3: AI preparation agent

When a user receives an OA or interview, an agent will:

- Research what is likely to be asked, using the details in the email and any prior rounds
- Use only reputable sources from a list we define (still to be decided)
- Suggest what to practice, along with tips and practice ideas

Answers should cite their sources, so users can judge how far to trust them.

## Tech stack

| Area | Choice |
| --- | --- |
| Language | Python 3.12, managed with [uv](https://docs.astral.sh/uv/) |
| API | FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | MySQL (SQLite file for now, until MySQL is installed locally) |
| Password hashing | pwdlib with Argon2 |

## Project structure

```text
backend/
├── main.py              # FastAPI app and CORS setup
├── core/config.py       # Settings loaded from .env
├── db/database.py       # Engine, session factory, Base, get_db dependency
└── models/
    ├── users.py         # User
    └── applications.py  # Application
```

## Data model

One user has many applications. Deleting a user is meant to delete their applications too.

**`Users`**

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | int | Primary key |
| `name` | varchar(255) | Required |
| `email` | varchar(255) | Required, unique |
| `hashed_password` | varchar(255) | Required |
| `created_at` | datetime | Set by the DB |

**`Applications`**

| Column | Type | Notes |
| --- | --- | --- |
| `application_id` | int | Primary key |
| `user_id` | int | Required, foreign key to `Users.user_id`, `ON DELETE CASCADE` |
| `role` | varchar(255) | Required |
| `company` | varchar(255) | Required |
| `status` | varchar(255) | Required, free text for now |
| `portal_url` | varchar(2048) | Optional |
| `notes` | text | Optional |
| `created_at` | datetime | Set by the DB |

## Local setup

Run these from `backend/`:

```bash
uv sync
uv run fastapi dev main.py
```

The API runs at <http://localhost:8000>, with interactive docs at <http://localhost:8000/docs>.

There are no migrations or table creation yet, so the tables must be created before any route can use the DB.

### Environment variables

Create a `.env` file in `backend/`. It is ignored by git, so never commit it.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLAlchemy connection URL. Currently a local SQLite file |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of CORS origins |
| `SECRET_KEY` | Yes | Application secret key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. Not used until Priority 2, but the app won't start without it |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. Same as above |
| `API_PREFIX` | No | Defaults to `/api`. Not applied to any routes yet |
| `DEBUG` | No | Turns on SQL logging. Set it explicitly (see known issues) |
| `APP_BASE_URL` | No | Defaults to `http://localhost:8000` |

## Known issues

### Fix before or while building routes

- **Tables and models aren't wired up:** Nothing imports the models or creates the tables. Importing only `models/users.py` also makes SQLAlchemy fail with `InvalidRequestError`, because `User` can't find `Application`. Both model modules need to be imported together, for example from `models/__init__.py`.
- **`DEBUG` defaults to on:** The default is the string `"False"`, which Python treats as true. If `DEBUG` is missing from the environment, SQL logging turns on, and logs can include emails and password hashes. The default should be the boolean `False`.
- **Cascading deletes don't work on SQLite:** SQLite doesn't enforce foreign keys unless `PRAGMA foreign_keys=ON` is set, so deleting a user currently leaves their applications behind. MySQL with InnoDB enforces them.

### Fix before deploying

- **No MySQL driver:** Add one, such as PyMySQL.
- **No migrations:** Add a migration tool, such as Alembic.
- **Table name case:** MySQL table names are usually case-sensitive on Linux but not on macOS. `Users` and `Applications` must be spelled consistently, or renamed to lowercase before the first migration.

### Smaller cleanups

- `status` accepts any text. Limiting it to a fixed set of values would keep the data consistent and make Priority 2 classification easier.
- `Applications` has no `updated_at` column, so there's no record of when a status last changed.
- `ALLOWED_ORIGINS` is annotated as `str` but holds a list after validation.
- `pydantic-settings` is imported directly but only installed through `fastapi[standard]`. It should be listed in `pyproject.toml`.
- There are no tests yet.
- There's no `.env.example` yet.
