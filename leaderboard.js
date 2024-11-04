// leaderboard.js

class LeaderboardManager {
    constructor() {
        this.dbName = 'ChessLeaderboard';
        this.dbVersion = 1;
        this.storeName = 'scores';
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error("Error opening DB");
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.displayLeaderboard();
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'username' });
                }
            };
        });
    }

    async loadLeaderboard() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.log('Database not initialized');
                resolve({});
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const data = {};
                request.result.forEach(record => {
                    data[record.username] = record;
                });
                resolve(data);
            };

            request.onerror = () => {
                console.error('Error loading leaderboard:', request.error);
                reject(request.error);
            };
        });
    }

    async updateScore(username, gameResult) {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }

        console.log(`Updating score for ${username} with result: ${gameResult}`);

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Get existing record or create new one
        const getRequest = store.get(username);
        
        getRequest.onsuccess = () => {
            let record = getRequest.result || {
                username,
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
                points: 0
            };

            record.totalGames++;
            
            switch (gameResult) {
                case 'win':
                    record.wins++;
                    record.points += 3;
                    break;
                case 'loss':
                    record.losses++;
                    break;
                case 'draw':
                    record.draws++;
                    record.points += 1;
                    break;
            }

            store.put(record);
            this.displayLeaderboard();
        };

        getRequest.onerror = () => {
            console.error('Error updating score:', getRequest.error);
        };
    }

    async getTopPlayers(limit = 10) {
        try {
            const data = await this.loadLeaderboard();
            return Object.values(data)
                .sort((a, b) => b.points - a.points)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
        }
    }

    async displayLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;

        try {
            const topPlayers = await this.getTopPlayers();
            tbody.innerHTML = topPlayers.map((player, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.username}</td>
                    <td>${player.points}</td>
                    <td>${player.wins}/${player.losses}/${player.draws}</td>
                    <td>${player.totalGames}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error displaying leaderboard:', error);
        }
    }
}

// Create and add leaderboard UI components
function initializeLeaderboard() {
    // Create leaderboard container
    const leaderboardSection = document.createElement('div');
    leaderboardSection.className = 'leaderboard-section';
    leaderboardSection.innerHTML = `
        <div class="leaderboard-container">
            <h2 class="leaderboard-title">Top Players</h2>
            <div class="username-input">
                <input type="text" id="username-input" placeholder="Enter your username" maxlength="20">
                <button id="username-submit" class="difficulty-btn">Set Username</button>
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
    if (gameSection) {
        gameSection.insertBefore(leaderboardSection, gameSection.firstChild);
    }

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

    // Initialize username handling
    initializeUsernameHandling();
}

// Initialize username handling
function initializeUsernameHandling() {
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const difficultyScreen = document.getElementById('difficulty-screen');
    
    // Hide difficulty screen initially
    if (difficultyScreen) {
        difficultyScreen.style.display = 'none';
    }

    // Handle username submission
    if (usernameSubmit) {
        usernameSubmit.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username) {
                localStorage.setItem('currentPlayer', username);
                usernameInput.disabled = true;
                usernameSubmit.disabled = true;
                
                // Show difficulty screen after username is set
                if (difficultyScreen) {
                    difficultyScreen.style.display = 'flex';
                }
            }
        });
    }
}

// Initialize leaderboard manager
const leaderboardManager = new LeaderboardManager();

// Update game result and leaderboard
function updateGameResult(winner) {
    const currentPlayer = localStorage.getItem('currentPlayer');
    if (!currentPlayer) {
        console.warn('No player username found');
        return;
    }

    console.log(`Game ended with winner: ${winner}, current player: ${currentPlayer}`);

    if (winner === 'draw') {
        leaderboardManager.updateScore(currentPlayer, 'draw');
    } else if (winner === 'blue') {
        leaderboardManager.updateScore(currentPlayer, 'win');
    } else {
        leaderboardManager.updateScore(currentPlayer, 'loss');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeLeaderboard();
});

export {
    updateGameResult,
    leaderboardManager
};
