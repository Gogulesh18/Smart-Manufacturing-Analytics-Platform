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

## Deploy on Render

This repo includes `render.yaml` to deploy both services from GitHub.

### Steps

1. Push latest code to GitHub.
2. In Render, create a new **Blueprint** and select this repository.
3. Render reads `render.yaml` and creates:
   - `smart-manufacturing-api` (FastAPI service)
   - `smart-manufacturing-frontend` (static React site)
4. After API deploy is live, copy its public URL.
5. In Render frontend service settings, set:
   - `VITE_API_BASE_URL=https://<your-api-service>.onrender.com`
6. In Render API service settings, set:
   - `CORS_ORIGINS=https://<your-frontend-service>.onrender.com`
7. Redeploy frontend once after env var update.

### Production notes

- Keep `models/predictive_model.pkl` and `data/cleaned_data_supabase_final.csv` in repo for API startup.
- If frontend shows CORS errors, verify exact HTTPS URLs in both env vars.

