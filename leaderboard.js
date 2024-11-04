// leaderboard.js

// Leaderboard data structure
class LeaderboardManager {
    constructor() {
        this.storageKey = 'chessLeaderboard';
        this.data = this.loadLeaderboard();
    }

    // Load leaderboard data from localStorage
    loadLeaderboard() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
    }

    // Save leaderboard data to localStorage
    saveLeaderboard() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Add or update player score
    updateScore(username, gameResult) {
        if (!this.data[username]) {
            this.data[username] = {
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                points: 0
            };
        }

        const player = this.data[username];
        player.totalGames++;

        switch (gameResult) {
            case 'win':
                player.wins++;
                player.points += 3;
                break;
            case 'loss':
                player.losses++;
                player.points += 0;
                break;
            case 'draw':
                player.draws++;
                player.points += 1;
                break;
        }

        this.saveLeaderboard();
    }

    // Get top 10 players sorted by points
    getTopPlayers(limit = 10) {
        return Object.entries(this.data)
            .map(([username, stats]) => ({
                username,
                ...stats
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }
}

// Initialize leaderboard manager
const leaderboardManager = new LeaderboardManager();

// Create and add leaderboard UI components
function initializeLeaderboard() {
    // Create leaderboard container
    const leaderboardSection = document.createElement('div');
    leaderboardSection.className = 'leaderboard-section';
    leaderboardSection.innerHTML = `
        <div class="leaderboard-container">
            <h2 class="leaderboard-title">Top Players</h2>
            <div class="username-input" style="display: none;">
                <input type="text" id="username-input" placeholder="Enter your username" maxlength="20">
                <button id="username-submit">Start Playing</button>
            </div>
            <div class="leaderboard-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Points</th>
                            <th>W/L/D</th>
                            <th>Games</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body">
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Add leaderboard to the game section
    const gameSection = document.querySelector('.game-section');
    gameSection.appendChild(leaderboardSection);

    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .leaderboard-section {
            margin-top: 20px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 8px;
            border: 1px solid rgba(50, 205, 50, 0.3);
        }

        .leaderboard-container {
            max-width: 800px;
            margin: 0 auto;
        }

        .leaderboard-title {
            color: #fff;
            text-shadow: 0 0 5px #32CD32,
                         0 0 10px #32CD32,
                         0 0 15px #32CD32;
            margin-bottom: 20px;
        }

        .username-input {
            margin-bottom: 20px;
        }

        .username-input input {
            padding: 8px 12px;
            border: 1px solid rgba(50, 205, 50, 0.3);
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border-radius: 4px;
            margin-right: 10px;
        }

        .username-input button {
            padding: 8px 16px;
            background: rgba(50, 205, 50, 0.2);
            border: 1px solid rgba(50, 205, 50, 0.5);
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }

        .leaderboard-table {
            overflow-x: auto;
        }

        .leaderboard-table table {
            width: 100%;
            border-collapse: collapse;
            color: white;
        }

        .leaderboard-table th,
        .leaderboard-table td {
            padding: 10px;
            text-align: center;
            border: 1px solid rgba(50, 205, 50, 0.2);
        }

        .leaderboard-table th {
            background: rgba(50, 205, 50, 0.2);
        }

        .leaderboard-table tr:nth-child(even) {
            background: rgba(50, 205, 50, 0.1);
        }
    `;
    document.head.appendChild(styleSheet);
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    const tbody = document.getElementById('leaderboard-body');
    const topPlayers = leaderboardManager.getTopPlayers();
    
    tbody.innerHTML = topPlayers.map((player, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${player.username}</td>
            <td>${player.points}</td>
            <td>${player.wins}/${player.losses}/${player.draws}</td>
            <td>${player.totalGames}</td>
        </tr>
    `).join('');
}

// Initialize username prompt
function initializeUsernamePrompt() {
    const usernameInput = document.querySelector('.username-input');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const inputField = document.getElementById('username-input');
    const submitButton = document.getElementById('username-submit');

    // Show username input when difficulty is selected
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            usernameInput.style.display = 'block';
        });
    });

    // Handle username submission
    submitButton.addEventListener('click', () => {
        const username = inputField.value.trim();
        if (username) {
            localStorage.setItem('currentPlayer', username);
            usernameInput.style.display = 'none';
            document.getElementById('start-game').disabled = false;
        }
    });
}

// Modify the endGame function to update leaderboard
function updateGameResult(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) return;

    if (winner === 'draw') {
        leaderboardManager.updateScore(currentPlayer, 'draw');
    } else if (winner === 'blue') {
        leaderboardManager.updateScore(currentPlayer, 'win');
    } else {
        leaderboardManager.updateScore(currentPlayer, 'loss');
    }

    updateLeaderboardDisplay();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initializeLeaderboard();
    initializeUsernamePrompt();
    updateLeaderboardDisplay();
});

// Export functions to be used in the main chess.js file
export {
    updateGameResult,
    leaderboardManager
};
