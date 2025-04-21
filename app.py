from flask import Flask, render_template, jsonify, request, redirect, url_for
import sqlite3
from datetime import datetime

app = Flask(__name__)


def init_db():
    conn = sqlite3.connect("minesweeper.db")
    c = conn.cursor()

    # Create high scores table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS high_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            time INTEGER NOT NULL,
            difficulty TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/new-game", methods=["POST"])
def new_game():
    difficulty = request.form.get("difficulty", "medium")

    # Set game parameters based on difficulty
    if difficulty == "easy":
        size = 8
        mine_count = 10
    elif difficulty == "hard":
        size = 12
        mine_count = 30
    else:  # medium
        size = 10
        mine_count = 20

    return render_template(
        "game.html", difficulty=difficulty, size=size, mine_count=mine_count
    )


@app.route("/api/high-scores", methods=["GET"])
def get_high_scores():
    difficulty = request.args.get("difficulty", "easy")

    conn = sqlite3.connect("minesweeper.db")
    c = conn.cursor()

    c.execute(
        """
        SELECT player_name, time, difficulty, created_at
        FROM high_scores
        WHERE difficulty = ?
        ORDER BY time ASC
        LIMIT 10
    """,
        (difficulty,),
    )

    scores = [
        {
            "player_name": row[0],
            "time": row[1],
            "difficulty": row[2],
            "created_at": row[3],
        }
        for row in c.fetchall()
    ]

    conn.close()
    return jsonify(scores)


@app.route("/api/high-scores", methods=["POST"])
def add_high_score():
    data = request.json
    player_name = data.get("player_name")
    time = data.get("time")
    difficulty = data.get("difficulty")

    if not all([player_name, time, difficulty]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = sqlite3.connect("minesweeper.db")
    c = conn.cursor()

    c.execute(
        """
        INSERT INTO high_scores (player_name, time, difficulty)
        VALUES (?, ?, ?)
    """,
        (player_name, time, difficulty),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "High score added successfully"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
