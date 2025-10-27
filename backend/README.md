Django backend for Lichess Analysis Starter.

Quick start:
1. python -m venv venv
2. source venv/bin/activate  (or venv\Scripts\activate on Windows)
3. pip install -r requirements.txt
4. export LICHESS_TOKEN=your_token_here
5. python manage.py migrate
6. python manage.py runserver 0.0.0.0:8000

Endpoints:
- GET /api/health/
- GET /api/account/?token=...
- GET /api/games/<username>/?max=10&token=...
- GET /api/game/<id>/export/?token=...
