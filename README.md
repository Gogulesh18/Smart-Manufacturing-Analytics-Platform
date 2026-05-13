# Smart Manufacturing Project

This project now includes:

- `api/` - FastAPI backend exposing KPI and prediction endpoints.
- `frontend/` - React + Vite dashboard UI.
- `dashboard/` - legacy Streamlit app (kept for reference).

## Run backend API

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Run React frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## API endpoints

- `GET /health`
- `GET /summary`
- `GET /data/sample?limit=20`
- `POST /predict`

