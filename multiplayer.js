class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.initializeEventListeners();
        console.log('MultiplayerManager initialized');
    }

    initializeEventListeners() {
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = () => this.createGame();
        }

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
                positions: JSON.parse(JSON.stringify(initialBoard)),
                pieceState: pieceState
            };

            const { data, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: player,
                    board: boardState,
                    piece_state: pieceState,
                    game_state: 'waiting',
                    current_player: 'blue'
                })
                .select();

            if (error) throw error;

            console.log('Game created successfully:', data[0]);

            this.gameId = data[0].id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            this.showGame('blue');
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
                .select()
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

            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: player,
                    game_state: 'active'
                })
                .eq('id', data.id);

            if (error) throw error;

            console.log('Successfully joined game:', data.id);

            this.gameId = data.id;
            this.playerColor = 'red';
            this.subscribeToGame();
            this.showGame('red');

        } catch (error) {
            console.error('Join game error:', error);
            alert('Failed to join game');
        }
    }

    showGame(color) {
        document.querySelector('.multiplayer-menu').style.display = 'none';
        document.getElementById('chess-game').style.display = 'block';
        
        resetGame();
        isMultiplayerMode = true;
        playerColor = color;
        currentPlayer = 'blue'; // Game always starts with blue
        
        // Initialize board with the initial state
        board = JSON.parse(JSON.stringify(initialBoard));
        placePieces();

        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = color === currentPlayer ? 'auto' : 'none';
        }

        console.log(`Game started - Player: ${color}, Current turn: ${currentPlayer}`);
        updateStatusDisplay(color === currentPlayer ? "Your turn" : "Opponent's turn");
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
                filter: `id=eq.${this.gameId}`
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

            // Handle board update
            if (game.board && game.board.positions) {
                console.log('Received board update:', game.board.positions);
                board = JSON.parse(JSON.stringify(game.board.positions));
                
                if (game.board.pieceState) {
                    Object.assign(pieceState, game.board.pieceState);
                }
                
                // Force board redraw
                placePieces();
                console.log('Board updated:', board);
            }

            // Update current turn
            if (game.current_player) {
                currentPlayer = game.current_player;
                const isMyTurn = currentPlayer === this.playerColor;
                
                const chessboard = document.getElementById('chessboard');
                if (chessboard) {
                    chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
                }
                
                console.log(`Turn updated - Current: ${currentPlayer}, My color: ${this.playerColor}`);
                updateStatusDisplay(isMyTurn ? "Your turn" : "Opponent's turn");
            }

            // Handle game end
            if (game.game_state === 'ended') {
                const message = game.winner === 'draw' ? 
                    'Game Over - Draw!' : 
                    `Game Over - ${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`;
                updateStatusDisplay(message);

                // Update scores
                if (window.updateGameResult) {
                    if (game.winner === 'draw') {
                        window.updateGameResult('draw');
                    } else {
                        window.updateGameResult(game.winner === this.playerColor ? 'win' : 'loss');
                    }
                }

                // Refresh leaderboard
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
        if (!this.gameId || currentPlayer !== this.playerColor) {
            console.log('Move rejected - Not player\'s turn');
            return false;
        }

        try {
            console.log('Attempting move:', {startRow, startCol, endRow, endCol});

            // Make a deep copy of the current board
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            // Check for game ending conditions
            board = newBoard; // Temporarily update board to check game state
            const nextPlayer = this.playerColor === 'blue' ? 'red' : 'blue';
            let gameEndState = null;

            if (isCheckmate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: this.playerColor
                };
                console.log('Checkmate detected!');
            } else if (isStalemate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: 'draw'
                };
                console.log('Stalemate detected!');
            }

            // Create the new board state
            const boardState = {
                positions: newBoard,
                pieceState: pieceState
            };

            // Update game in database
            const updateData = {
                board: boardState,
                current_player: nextPlayer,
                last_move: {
                    startRow,
                    startCol,
                    endRow,
                    endCol,
                    piece: board[startRow][startCol],
                    promotion
                }
            };

            // Add game end state if game is over
            if (gameEndState) {
                Object.assign(updateData, gameEndState);
            }

            const { error } = await this.supabase
                .from('chess_games')
                .update(updateData)
                .eq('id', this.gameId);

            if (error) throw error;

            // Update local state
            board = newBoard;
            placePieces();
            
            // Handle game end
            if (gameEndState) {
                if (gameEndState.winner === 'draw') {
                    updateStatusDisplay('Game Over - Draw!');
                    if (window.updateGameResult) {
                        window.updateGameResult('draw');
                    }
                } else {
                    updateStatusDisplay(`Game Over - ${gameEndState.winner.charAt(0).toUpperCase() + gameEndState.winner.slice(1)} wins!`);
                    if (window.updateGameResult) {
                        window.updateGameResult(this.playerColor === gameEndState.winner ? 'win' : 'loss');
                    }
                }

                // Refresh leaderboard
                if (window.leaderboardManager) {
                    window.leaderboardManager.loadLeaderboard();
                }

                const chessboard = document.getElementById('chessboard');
                if (chessboard) {
                    chessboard.style.pointerEvents = 'none';
                }
            }

            console.log('Move executed successfully');
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
                        winner: this.playerColor === 'blue' ? 'red' : 'blue'
                    })
                    .eq('id', this.gameId);

                // Update scores for forfeit
                if (window.updateGameResult) {
                    window.updateGameResult('loss');
                }

                // Refresh leaderboard
                if (window.leaderboardManager) {
                    window.leaderboardManager.loadLeaderboard();
                }

                console.log('Left game successfully');
            } catch (error) {
                console.error('Leave game error:', error);
            }
        }

        this.gameId = null;
        this.playerColor = null;
        document.querySelector('.multiplayer-menu').style.display = 'block';
        document.getElementById('chess-game').style.display = 'none';
    }
}

// Initialize the multiplayer manager
window.multiplayerManager = new MultiplayerManager();
