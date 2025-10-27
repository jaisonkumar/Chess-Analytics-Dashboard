import requests
import json
import io
import chess.pgn
from collections import defaultdict

def fetch_last_100_games(username):
    """
    Stream last 100 games PGNs for a user from Lichess public API
    """
    url = f"https://lichess.org/api/games/user/{username}"
    params = {
        "max": 100,
        "moves": False,
        "pgnInJson": True,
        "opening": True,  # Request opening in PGN headers
        "clocks": False,
        "evals": False,
        "perfType": "all"
    }
    headers = {
        "Accept": "application/x-ndjson"
    }
    response = requests.get(url, params=params, headers=headers, stream=True)
    response.raise_for_status()

    for line in response.iter_lines():
        if line:
            yield json.loads(line.decode('utf-8'))

def analyze_openings(username):
    """
    Analyze opening statistics for last 100 games of the user
    Returns dict: {color: {opening_name: {games, wins, losses, draws}}}
    """
    opening_stats = {
        "white": defaultdict(lambda: {"games":0, "wins":0, "losses":0, "draws":0}),
        "black": defaultdict(lambda: {"games":0, "wins":0, "losses":0, "draws":0}),
    }

    for game_json in fetch_last_100_games(username):
        pgn_text = game_json.get("pgn")
        game = chess.pgn.read_game(io.StringIO(pgn_text))
        headers = game.headers
        eco = headers.get("ECO", "Unknown")
        opening_name = headers.get("Opening", "Unknown Opening")
        result = headers.get("Result", "*")
        white_player = headers.get("White", "").lower()
        black_player = headers.get("Black", "").lower()
        username_lower = username.lower()

        # Determine color played
        if username_lower == white_player:
            color = "white"
        elif username_lower == black_player:
            color = "black"
        else:
            # Game does not involve the user? Skip
            continue

        opening_key = f"{eco} - {opening_name}"
        opening_stats[color][opening_key]["games"] += 1

        # Determine result from player's perspective
        if result == "1-0":
            if color == "white":
                opening_stats[color][opening_key]["wins"] += 1
            else:
                opening_stats[color][opening_key]["losses"] += 1
        elif result == "0-1":
            if color == "black":
                opening_stats[color][opening_key]["wins"] += 1
            else:
                opening_stats[color][opening_key]["losses"] += 1
        elif result == "1/2-1/2":
            opening_stats[color][opening_key]["draws"] += 1
        else:
            # Unknown or ongoing result, skip counting win/loss/draw
            pass

    return opening_stats

def print_opening_stats(opening_stats):
    for color in ["white", "black"]:
        print(f"\nOpening statistics for {color} games:")
        stats = opening_stats[color]
        sorted_openings = sorted(stats.items(), key=lambda x: x[1]["games"], reverse=True)
        for opening, data in sorted_openings:
            total = data["games"]
            wins = data["wins"]
            losses = data["losses"]
            draws = data["draws"]
            win_rate = (wins / total * 100) if total > 0 else 0
            print(f"{opening}: Games={total}, Wins={wins}, Losses={losses}, Draws={draws}, WinRate={win_rate:.1f}%")

if __name__ == "__main__":
    username = input("Enter Lichess username: ").strip()
    stats = analyze_openings(username)
    print_opening_stats(stats)
