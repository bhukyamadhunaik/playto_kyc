# Playto KYC Pipeline

This is a full-stack evaluated repository representing the structured KYC onboarding flow for merchants, and a management application for reviewers. Strict constraints limit illegal action behaviors and natively manage SLA timeout reporting.

## Tech Stack
- **Backend:** Django 6.0.4 + Django REST Framework + SQLite (Easily swappable to PostgreSQL)
- **Frontend:** React (SPA) + Vite + TailwindCSS 

## Prerequisites
- Python 3.10+
- Node.js 18+

## Getting Started

### 1. Initialize Backend

Setup your virtual environment wrapper inside the root directory and install constraints:

```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Prepare database migrations and establish baseline tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Seed Test Environments

A custom management hook creates ready-to-test objects allowing evaluation of the internal SLA tracking metric triggers natively.
```bash
python manage.py seed_data
```
**Identities created:**
- **Evaluator**: `reviewer` / `password123`
- **Draft Merchant**: `merchant_draft` / `password123` 
- **Under Review Merchant**: `merchant_review` / `password123` (Spawned deliberately 25 hours ago to trigger dashboard 'At Risk' SLA notifications)

Run the backend host loop:
```bash
python manage.py runserver
```

### 3. Start Frontend Dashboard

The analytical web layout is managed completely inside `playto_frontend`. Utilizing a secondary terminal interface:

```bash
cd playto_frontend
npm install
npm run dev
```

Reach the frontend layout application normally at `http://localhost:5173`. Axios automatically parses out dispatch triggers towards Django running on port `8000`.

## Testing the State Machine Matrix

Constraints verifying the core logic module behavior are completely written. Run utilizing:

```bash
pytest kyc/
```

## Review Specifics (The EXPLAINER)

Head over to `EXPLAINER.md` on the root of this structure to view detailed responses matching security principles against AI audit hallucinations, architecture designs for validations, and queries resolving SLA parameters dynamically. 
