class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.currentGameState = null;
        this.isMultiplayerMode = true;
        this.initializeEventListeners();
        console.log('MultiplayerManager initialized');
    }

    initializeEventListeners() {
        // Create game with bet
        const createGameWithBetBtn = document.getElementById('create-game-with-bet');
        if (createGameWithBetBtn) {
            createGameWithBetBtn.onclick = () => this.createGameWithBet();
        }

        // Create game without bet
        const createGameNoBetBtn = document.getElementById('create-game-no-bet');
        if (createGameNoBetBtn) {
            createGameNoBetBtn.onclick = () => this.createGame();
        }

        // Join game
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.onclick = () => {
                const code = document.getElementById('game-code-input')?.value?.trim();
                if (code) this.joinGameByCode(code);
                else alert('Please enter a game code');
            };
        }

        const cancelBtn = document.getElementById('cancel-matchmaking');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.leaveGame();
                const status = document.getElementById('matchmaking-status');
                if (status) status.style.display = 'none';
            };
        }
    }

    async createGameWithBet() {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            if (window.chessBetting) {
                await window.chessBetting.handleCreateGameWithBet();
            } else {
                alert('Betting system not initialized');
            }
        } catch (error) {
            console.error('Error creating game with bet:', error);
            alert('Failed to create game with bet');
        }
    }

    async createGame() {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('Creating new game:', gameId);

            // Create initial game state
            const boardState = {
                positions: JSON.parse(JSON.stringify(window.initialBoard)),
                pieceState: window.pieceState || {}
            };

            const { data, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: player,
                    board: boardState,
                    piece_state: window.pieceState || {},
                    game_state: 'waiting',
                    current_player: 'blue',
                    bet_amount: 0
                })
                .select();

            if (error) throw error;

            this.gameId = gameId;
            this.playerColor = 'blue';
            this.currentGameState = data[0];
            this.subscribeToGame();
            this.showGame('blue');

            // Show game code
            const gameCodeDisplay = document.getElementById('gameCodeDisplay');
            const gameCode = document.getElementById('gameCode');
            if (gameCodeDisplay && gameCode) {
                gameCode.textContent = gameId;
                gameCodeDisplay.style.display = 'block';
            }
            alert(`Game code: ${gameId}`);

        } catch (error) {
            console.error('Error creating game:', error);
            alert('Game creation failed');
        }
    }

    async joinGameByCode(code) {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            console.log('Attempting to join game:', code);

            const { data } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', code.toUpperCase())
                .eq('game_state', 'waiting')
                .single();

            if (!data) {
                alert('Game not found');
                return;
            }

            if (data.red_player || data.blue_player === player) {
                alert('Cannot join this game');
                return;
            }

            if (data.bet_amount > 0) {
                if (window.chessBetting) {
                    return await window.chessBetting.handleJoinGame(code);
                } else {
                    alert('Betting system not initialized');
                    return;
                }
            }

            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: player,
                    game_state: 'active'
                })
                .eq('game_id', data.game_id);

            if (error) throw error;

            this.gameId = data.game_id;
            this.playerColor = 'red';
            this.currentGameState = data;
            this.subscribeToGame();
            this.showGame('red');

        } catch (error) {
            console.error('Join game error:', error);
            alert('Failed to join game');
        }
    }

    showGame(color) {
        console.log('Showing game for color:', color, {
            gameId: this.gameId,
            isMultiplayerMode: true,
            currentGameState: this.currentGameState
        });
    
        try {
            const menuEl = document.querySelector('.multiplayer-menu');
            const gameEl = document.getElementById('chess-game');
            
            if (menuEl) menuEl.style.display = 'none';
            if (gameEl) gameEl.style.display = 'block';
            
            // Initialize game state
            window.resetGame();
            window.isMultiplayerMode = true;
            window.playerColor = color;
    
            // Set current player from game state if available
            window.currentPlayer = this.currentGameState?.current_player || 'blue';
    
            // Load board state if available
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
                if (this.currentGameState.board.pieceState) {
                    Object.assign(window.pieceState, this.currentGameState.board.pieceState);
                }
            } else {
                window.board = JSON.parse(JSON.stringify(window.initialBoard));
            }
    
            window.placePieces();
    
            // Enable piece clicking 
            const chessboard = document.getElementById('chessboard');
            if (chessboard) {
                const isMyTurn = color === window.currentPlayer;
                chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
                
                // Set up piece handlers
                const pieces = chessboard.getElementsByClassName('piece');
                Array.from(pieces).forEach(piece => {
                    const row = parseInt(piece.getAttribute('data-row'));
                    const col = parseInt(piece.getAttribute('data-col'));
                    const pieceType = window.board[row][col];
                    const pieceColor = window.getPieceColor(pieceType);
                    
                    if (pieceColor === color) {
                        piece.style.cursor = 'pointer';
                        piece.onclick = (e) => window.onPieceClick(e);
                    }
                });
            }
    
            window.updateStatusDisplay(color === window.currentPlayer ? "Your turn" : "Opponent's turn");
            
            console.log('Game initialized:', {
                playerColor: color,
                currentPlayer: window.currentPlayer,
                isMultiplayerMode: window.isMultiplayerMode,
                boardState: window.board,
                interactive: color === window.currentPlayer
            });
    
        } catch (error) {
            console.error('Error showing game:', error);
            window.updateStatusDisplay('Error initializing game board');
        }
    }

    subscribeToGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        console.log(`Subscribing to game: ${this.gameId}`);

        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chess_games',
                filter: `game_id=eq.${this.gameId}`
            }, 
            (payload) => {
                console.log('Received game update:', payload);
                this.handleUpdate(payload.new);
            })
            .subscribe();
    }

    handleUpdate(game) {
        if (!game) return;

        try {
            console.log('Processing game update:', game);
            this.currentGameState = game;

            if (game.board && game.board.positions) {
                window.board = JSON.parse(JSON.stringify(game.board.positions));
                
                if (game.board.pieceState) {
                    Object.assign(window.pieceState, game.board.pieceState);
                }
                
                window.placePieces();
            }

            if (game.current_player) {
                window.currentPlayer = game.current_player;
                const isMyTurn = game.current_player === this.playerColor;
                
                const chessboard = document.getElementById('chessboard');
                if (chessboard) {
                    chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
                }
                
                window.updateStatusDisplay(isMyTurn ? "Your turn" : "Opponent's turn");
            }

            if (game.game_state === 'ended') {
                const message = game.winner === 'draw' ? 
                    'Game Over - Draw!' : 
                    `Game Over - ${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`;
                window.updateStatusDisplay(message);

                if (window.updateGameResult) {
                    window.updateGameResult(game.winner === this.playerColor ? 'win' : 'loss');
                }

                if (window.chessBetting && game.bet_amount > 0) {
                    window.chessBetting.processWinner(game.winner);
                }

                if (window.leaderboardManager) {
                    window.leaderboardManager.loadLeaderboard();
                }

                const chessboard = document.getElementById('chessboard');
                if (chessboard) {
                    chessboard.style.pointerEvents = 'none';
                }
            }

        } catch (error) {
            console.error('Update error:', error);
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
        if (!this.gameId) return false;

        try {
            console.log('Attempting move:', {
                startRow, 
                startCol, 
                endRow, 
                endCol,
                playerColor: this.playerColor,
                currentPlayer: this.currentGameState?.current_player
            });

            // Verify it's player's turn
            if (this.currentGameState?.current_player !== this.playerColor) {
                console.log('Not player\'s turn');
                return false;
            }

            const newBoard = JSON.parse(JSON.stringify(window.board));
            newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            // Check for game ending conditions
            window.board = newBoard;
            const nextPlayer = this.playerColor === 'blue' ? 'red' : 'blue';
            let gameEndState = null;

            if (window.isCheckmate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: this.playerColor
                };
            } else if (window.isStalemate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: 'draw'
                };
            }

            const boardState = {
                positions: newBoard,
                pieceState: window.pieceState
            };

            const updateData = {
                board: boardState,
                current_player: nextPlayer,
                last_move: {
                    startRow,
                    startCol,
                    endRow,
                    endCol,
                    piece: window.board[startRow][startCol],
                    promotion
                },
                updated_at: new Date().toISOString()
            };

            if (gameEndState) {
                Object.assign(updateData, gameEndState);
            }

            const { error } = await this.supabase
                .from('chess_games')
                .update(updateData)
                .eq('game_id', this.gameId)
                .select();

            if (error) throw error;

            window.board = newBoard;
            window.placePieces();

            return true;

        } catch (error) {
            console.error('Move error:', error);
            return false;
        }
    }

    async leaveGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        if (this.gameId) {
            try {
                await this.supabase
                    .from('chess_games')
                    .update({
                        game_state: 'ended',
                        winner: this.playerColor === 'blue' ? 'red' : 'blue',
                        updated_at: new Date().toISOString()
                    })
                    .eq('game_id', this.gameId);

                if (window.updateGameResult) {
                    window.updateGameResult('loss');
                }

                if (window.leaderboardManager) {
                    window.leaderboardManager.loadLeaderboard();
                }

            } catch (error) {
                console.error('Leave game error:', error);
            }
        }

        this.gameId = null;
        this.playerColor = null;
        this.currentGameState = null;
        
        const menuEl = document.querySelector('.multiplayer-menu');
        const gameEl = document.getElementById('chess-game');
        if (menuEl) menuEl.style.display = 'block';
        if (gameEl) gameEl.style.display = 'none';
    }

    async updateGameStatus(status, winner = null) {
        if (!this.gameId) return;

        try {
            const updateData = {
                game_state: status,
                updated_at: new Date().toISOString()
            };
            if (winner) {
                updateData.winner = winner;
            }

            await this.supabase
                .from('chess_games')
                .update(updateData)
                .eq('game_id', this.gameId);

        } catch (error) {
            console.error('Error updating game status:', error);
        }
    }
}

// Initialize the multiplayer manager
window.multiplayerManager = new MultiplayerManager();