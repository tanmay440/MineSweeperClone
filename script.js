class PokerGame {
    constructor() {
        this.currentUser = null;
        this.currentGame = null;
        this.players = [];
        this.deck = [];
        this.playerCards = [];
        this.communityCards = [];
        this.balance = 1000;
        this.currentBet = 10;
        this.gameInProgress = false;
        this.initializeEventListeners();
        this.checkSession();
    }

    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Create game button
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.addEventListener('click', () => this.createGame());
        }

        // Join game button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.showGameList());
        }

        // Game action buttons
        const foldBtn = document.getElementById('fold');
        if (foldBtn) {
            foldBtn.addEventListener('click', () => this.fold());
        }

        const callBtn = document.getElementById('call');
        if (callBtn) {
            callBtn.addEventListener('click', () => this.call());
        }

        const raiseBtn = document.getElementById('raise');
        if (raiseBtn) {
            raiseBtn.addEventListener('click', () => this.raise());
        }

        const dealBtn = document.getElementById('deal');
        if (dealBtn) {
            dealBtn.addEventListener('click', () => this.startNewHand());
        }
    }

    switchTab(tab) {
        const loginForm = document.getElementById('login-form-container');
        const registerForm = document.getElementById('register-form-container');
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage.textContent = data.message;
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                // Redirect to lobby after successful login
                setTimeout(() => {
                    window.location.href = '/lobby';
                }, 1000);
            } else {
                errorMessage.textContent = data.error;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred during login';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    }

    async handleRegister() {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage.textContent = data.message;
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                // Redirect to login after successful registration
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            } else {
                errorMessage.textContent = data.error;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred during registration';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async createGame() {
        try {
            const response = await fetch('/api/game/create', {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = `/game/${data.game_id}`;
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Game creation failed:', error);
        }
    }

    async showGameList() {
        try {
            const response = await fetch('/api/games');
            const games = await response.json();
            const gamesContainer = document.getElementById('games-container');
            
            gamesContainer.innerHTML = '';
            games.forEach(game => {
                const gameElement = document.createElement('div');
                gameElement.className = 'game-item';
                gameElement.innerHTML = `
                    <h3>Game ${game.id}</h3>
                    <p>Status: ${game.status}</p>
                    <p>Players: ${game.players}</p>
                    <button onclick="pokerGame.joinGame(${game.id})" class="btn btn-primary">Join Game</button>
                `;
                gamesContainer.appendChild(gameElement);
            });
        } catch (error) {
            console.error('Failed to load games:', error);
        }
    }

    async joinGame(gameId) {
        try {
            const response = await fetch(`/api/game/${gameId}/join`, {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = `/game/${gameId}`;
            } else {
                const data = await response.json();
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Failed to join game:', error);
        }
    }

    async updateGameStatus() {
        if (!this.currentGame) return;

        try {
            const response = await fetch(`/api/game/${this.currentGame}`);
            if (response.ok) {
                const game = await response.json();
                this.updateGameBoard(game);
            }
        } catch (error) {
            console.error('Error updating game status:', error);
        }
    }

    updateGameBoard(game) {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = `
            <div class="game-info">
                <h2>Game ${game.id}</h2>
                <p>Status: ${game.status}</p>
            </div>
            <div class="players">
                ${game.players.map(player => `
                    <div class="player ${player.is_active ? 'active' : ''}">
                        <h3>${player.username}</h3>
                        <p>Balance: $${player.balance}</p>
                        <p>Bet: $${player.current_bet || 0}</p>
                    </div>
                `).join('')}
            </div>
            <div class="community-cards">
                ${game.community_cards.map(card => `
                    <div class="card ${card.suit}">
                        ${card.value}${card.suit}
                    </div>
                `).join('')}
            </div>
        `;
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

// Initialize the game when the page loads
let pokerGame;
document.addEventListener('DOMContentLoaded', () => {
    pokerGame = new PokerGame();
});

class Minesweeper {
    constructor() {
        // Use server-provided settings if available
        if (typeof gameSettings !== 'undefined') {
            this.difficulty = gameSettings.difficulty;
            this.size = gameSettings.size;
            this.mineCount = gameSettings.mineCount;
        } else {
            this.difficulty = 'medium';
            this.size = 10;
            this.mineCount = 20;
        }

        this.board = [];
        this.mines = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.firstClick = true;
        this.timer = null;
        this.time = 0;
        
        this.initializeEventListeners();
        this.initializeGame();
        this.loadHighScores(); // Load high scores on initialization
    }

    initializeEventListeners() {
        // New Game button listener
        document.getElementById('new-game').addEventListener('click', () => {
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            } else {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/new-game';
                
                const difficultyInput = document.createElement('input');
                difficultyInput.type = 'hidden';
                difficultyInput.name = 'difficulty';
                difficultyInput.value = document.getElementById('difficulty').value;
                
                form.appendChild(difficultyInput);
                document.body.appendChild(form);
                form.submit();
            }
        });

        // Save Score button listener
        const saveScoreBtn = document.getElementById('save-score');
        if (saveScoreBtn) {
            saveScoreBtn.addEventListener('click', () => {
                this.saveScore();
            });
        }

        // Return Home button listener
        const returnHomeBtn = document.getElementById('return-home');
        if (returnHomeBtn) {
            returnHomeBtn.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        // Escape key listener for showing mines
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameOver) {
                this.revealAllMines();
            }
        });

        // Difficulty change listener
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                this.loadHighScores();
            });
        }
    }

    initializeGame() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.mines = [];
        this.revealed = new Set();
        this.flagged = new Set();
        this.gameOver = false;
        this.firstClick = true;
        this.time = 0;
        this.updateTimer();
        this.updateMinesCount();
        this.renderBoard();
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.size);
            const col = Math.floor(Math.random() * this.size);
            
            if ((row !== firstClickRow || col !== firstClickCol) && !this.mines.some(m => m.row === row && m.col === col)) {
                this.mines.push({ row, col });
                this.board[row][col] = -1;
                minesPlaced++;
            }
        }
    }

    calculateNumbers() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== -1) {
                    let count = 0;
                    for (let r = Math.max(0, row - 1); r <= Math.min(this.size - 1, row + 1); r++) {
                        for (let c = Math.max(0, col - 1); c <= Math.min(this.size - 1, col + 1); c++) {
                            if (this.board[r][c] === -1) count++;
                        }
                    }
                    this.board[row][col] = count;
                }
            }
        }
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.style.setProperty('--size', this.size);
        gameBoard.innerHTML = '';

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                cell.addEventListener('click', () => this.handleClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });

                gameBoard.appendChild(cell);
            }
        }
    }

    handleClick(row, col) {
        if (this.gameOver || this.flagged.has(`${row},${col}`)) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.calculateNumbers();
            this.startTimer();
        }

        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.revealAllMines();
            this.showGameOverModal(false);
            return;
        }

        this.revealCell(row, col);
        this.checkWin();
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.revealed.has(`${row},${col}`)) return;

        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        
        if (this.flagged.has(`${row},${col}`)) {
            this.flagged.delete(`${row},${col}`);
            cell.classList.remove('flagged');
        } else {
            this.flagged.add(`${row},${col}`);
            cell.classList.add('flagged');
        }

        this.updateMinesCount();
    }

    revealCell(row, col) {
        if (this.revealed.has(`${row},${col}`) || this.flagged.has(`${row},${col}`)) return;

        this.revealed.add(`${row},${col}`);
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('revealed');

        if (this.board[row][col] > 0) {
            cell.textContent = this.board[row][col];
        } else if (this.board[row][col] === 0) {
            for (let r = Math.max(0, row - 1); r <= Math.min(this.size - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(this.size - 1, col + 1); c++) {
                    this.revealCell(r, c);
                }
            }
        }
    }

    revealAllMines() {
        this.mines.forEach(mine => {
            const cell = document.querySelector(`.cell[data-row="${mine.row}"][data-col="${mine.col}"]`);
            cell.classList.add('mine');
            cell.classList.add('revealed');
        });
    }

    checkWin() {
        const totalCells = this.size * this.size;
        if (this.revealed.size + this.mineCount === totalCells) {
            this.gameOver = true;
            this.showGameOverModal(true);
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.time;
    }

    updateMinesCount() {
        const remainingMines = this.mineCount - this.flagged.size;
        document.getElementById('mines-count').textContent = remainingMines;
    }

    showGameOverModal(won) {
        clearInterval(this.timer);
        const modal = document.getElementById('game-over-modal');
        const message = document.getElementById('game-over-message');
        const saveScoreBtn = document.getElementById('save-score');
        const playerNameInput = document.getElementById('player-name');
        const finalTimeDisplay = document.getElementById('final-time');
        
        message.textContent = won ? 'Congratulations! You won!' : 'Game Over! You hit a mine!';
        
        // Update final time display
        document.getElementById('final-time-value').textContent = this.time;
        
        // Show/hide elements based on win status
        if (saveScoreBtn) {
            saveScoreBtn.style.display = won ? 'block' : 'none';
        }
        if (playerNameInput) {
            playerNameInput.style.display = won ? 'block' : 'none';
        }
        if (finalTimeDisplay) {
            finalTimeDisplay.style.display = won ? 'block' : 'none';
        }
        
        // Show the modal
        modal.style.display = 'flex';
        
        // Add return to home button if it doesn't exist
        if (!document.getElementById('return-home')) {
            const returnButton = document.createElement('button');
            returnButton.id = 'return-home';
            returnButton.textContent = 'Return to Home';
            returnButton.className = 'return-home-btn';
            modal.querySelector('.modal-content').appendChild(returnButton);
            
            // Add event listener to the new button
            returnButton.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        // Re-initialize save score button listener
        if (saveScoreBtn) {
            saveScoreBtn.addEventListener('click', () => {
                this.saveScore();
            });
        }
    }

    async saveScore() {
        // Check if the game was won
        const totalCells = this.size * this.size;
        const isWon = this.revealed.size + this.mineCount === totalCells;
        
        if (!isWon) {
            alert('You can only save your score if you win the game!');
            return;
        }

        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Please enter your name to save your score');
            return;
        }

        try {
            const response = await fetch('/api/high-scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    time: this.time,
                    difficulty: this.difficulty
                })
            });

            if (response.ok) {
                document.getElementById('game-over-modal').style.display = 'none';
                this.loadHighScores();
                window.location.href = '/'; // Redirect to home after saving score
            } else {
                alert('Failed to save score. Please try again.');
            }
        } catch (error) {
            console.error('Error saving score:', error);
            alert('An error occurred while saving your score.');
        }
    }

    async loadHighScores() {
        try {
            const difficulty = document.getElementById('difficulty')?.value || this.difficulty;
            const response = await fetch(`/api/high-scores?difficulty=${difficulty}`);
            const scores = await response.json();
            
            const scoresContainer = document.getElementById('scores-container');
            if (!scoresContainer) return;
            
            scoresContainer.innerHTML = '';
            
            if (scores.length === 0) {
                const noScores = document.createElement('div');
                noScores.className = 'score-item';
                noScores.textContent = 'No high scores yet!';
                scoresContainer.appendChild(noScores);
                return;
            }
            
            scores.forEach((score, index) => {
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                
                const rank = document.createElement('span');
                rank.className = 'rank';
                rank.textContent = `${index + 1}.`;
                
                const name = document.createElement('span');
                name.className = 'name';
                name.textContent = score.player_name;
                
                const time = document.createElement('span');
                time.className = 'time';
                time.textContent = `${score.time}s`;
                
                scoreItem.appendChild(rank);
                scoreItem.appendChild(name);
                scoreItem.appendChild(time);
                scoresContainer.appendChild(scoreItem);
            });
        } catch (error) {
            console.error('Error loading high scores:', error);
            const scoresContainer = document.getElementById('scores-container');
            if (scoresContainer) {
                scoresContainer.innerHTML = '<div class="score-item">Error loading high scores</div>';
            }
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Minesweeper();
}); 