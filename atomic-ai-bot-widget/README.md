# This is the part of Atomic AI Bot project.

### Main Information
The project is built on a service-oriented architecture; this component is a service for the AI chatbot, designed to manage bots, store users' chat histories, and send requests to the AI.

### Technologies
- Python 3.12.x
- FastAPI + Jinja2
- uv
- OpenRouter (OpenAI-compatible API)
- Redis
- HTML, CSS, JavaScript

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
uvicorn bot.src.main:app --reload --port 8080
```
- production mode
```bash
uvicorn bot.src.main:app --host 0.0.0.0 --port 8080
```