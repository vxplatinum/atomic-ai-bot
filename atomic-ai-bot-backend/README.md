# This is the part of Atomic AI Bot project.

### Main Information
The project is built on a service-oriented architecture; this component serves as the backend for the web service, handling user registration, bot management, and verification of bot connections to websites.

### Email provider
- Feel free to ask any questions about the project if you have any.
```bash
vxxplatinum@gmail.com
```

### Technologies
- Python 3.12.13 - runtime
- FastAPI - API framework
- Uvicorn - ASGI server
- Pydantic - request/response schemas
- SQLAlchemy - ORM and DB layer
- asyncpg - async PostgreSQL driver
- PostgreSQL (Neon) - main database
- Redis - active session stats
- python-jose - JWT tokens
- passlib + bcrypt - password hashing
- fastapi-mail - verification and reset emails
- python-dotenv - .env config loading

### Commands
1. Create virtual environment
```bash
uv venv .venv
```

2. Install dependencies
```bash
uv pip install -r requirements.txt
```

3. Add `.env` file with the same variables as in `.env.example`

4. Run backend project
- development mode
```bash
uvicorn server.main:app --reload --port 8000
```
- production mode
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --workers 1 --limit-concurrency 80 --backlog 128 --timeout-keep-alive 5
```
