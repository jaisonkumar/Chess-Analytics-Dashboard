import os
import requests

LICHESS_API = 'https://lichess.org/api'

def get_headers(token=None):
    token = token or os.environ.get('LICHESS_TOKEN')
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    return headers

def fetch_account(token=None):
    headers = get_headers(token)
    resp = requests.get(f'{LICHESS_API}/account', headers=headers, timeout=15)
    resp.raise_for_status()
    return resp.json()

def fetch_user_games(username, token=None, max_games=10):
    headers = get_headers(token)
    params = {'max': max_games, 'pgnInJson': True}
    resp = requests.get(f'{LICHESS_API}/games/user/{username}', headers=headers, params=params, timeout=30)
    # The endpoint can stream; here we return text for simplicity
    if resp.headers.get('content-type','').startswith('application/x-ndjson') or resp.text.startswith('[') or resp.text.startswith('{'):
        try:
            return resp.json()
        except Exception:
            return resp.text
    return resp.text

def export_game(game_id, token=None):
    headers = get_headers(token)
    resp = requests.get(f'{LICHESS_API}/game/export/{game_id}', headers=headers, timeout=20)
    resp.raise_for_status()
    return resp.text

def fetch_rating_history(username):
    url = f'{LICHESS_API}/user/{username}/rating-history'
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()

def fetch_user_profile(username):
    url = f'{LICHESS_API}/user/{username}'
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp.json()

