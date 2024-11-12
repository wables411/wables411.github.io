class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.initializeEventListeners();
        console.log('MultiplayerManager initialized'); // Debug log
    }

    initializeEventListeners() {
        // Quick Match Button
        const quickMatchBtn = document.getElementById('quick-match');
        if (quickMatchBtn) {
            quickMatchBtn.onclick = () => this.findQuickMatch();
        }

        // Create Game Button
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = () => this.createPrivateGame();
        }

        // Join Game Button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.onclick = () => {
                const code = document.getElementById('game-code-input')?.value?.trim();
                if (code) this.joinGameByCode(code);
                else alert('Please enter a game code');
            };
        }

        // Cancel Button
        const cancelBtn = document.getElementById('cancel-matchmaking');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.leaveGame();
                const status = document.getElementById('matchmaking-status');
                if (status) status.style.display = 'none';
            };
        }
    }

    async findQuickMatch() {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            console.log('Looking for quick match...'); // Debug log

            const { data } = await this.supabase
                .from('chess_games')
                .select()
                .eq('game_state', 'waiting')
                .is('red_player', null)
                .single();

            if (data) {
                console.log('Found existing game:', data); // Debug log
                await this.joinGameByCode(data.game_id);
                return;
            }

            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await this.createGame(gameId, player);
            
        } catch (error) {
            console.error('Quick match error:', error);
            alert('Match creation failed');
        }
    }

    async createPrivateGame() {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await this.createGame(gameId, player);
            
        } catch (error) {
            console.error('Create game error:', error);
            alert('Game creation failed');
        }
    }

    async createGame(gameId, player) {
        try {
            console.log('Creating new game:', gameId); // Debug log

            const { data, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: player,
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState)
                })
                .select();

            if (error) throw error;

            console.log('Game created successfully:', data[0]); // Debug log

            this.gameId = data[0].id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            this.showGame('blue');
            alert(`Game code: ${gameId}`);

        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    async joinGameByCode(code) {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            console.log('Attempting to join game:', code); // Debug log

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

            console.log('Successfully joined game:', data.id); // Debug log

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
        
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = color === 'blue' ? 'auto' : 'none';
        }
        
        resetGame();
        isMultiplayerMode = true;
        playerColor = color;
        currentPlayer = 'blue'; // Blue always starts
        placePieces();

        console.log(`Game started - Player: ${color}, Current turn: ${currentPlayer}`); // Debug log
        updateStatusDisplay(color === 'blue' ? "Your turn" : "Opponent's turn");
    }

    subscribeToGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        console.log(`Subscribing to game: ${this.gameId}`); // Debug log

        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chess_games',
                filter: `id=eq.${this.gameId}`
            }, 
            (payload) => {
                console.log('Received game update:', payload); // Debug log
                this.handleUpdate(payload.new);
            })
            .subscribe();
    }

    handleUpdate(game) {
        if (!game) return;

        try {
            console.log('Processing game update:', game); // Debug log

            // Update board state
            if (game.board) {
                const boardData = JSON.parse(game.board);
                if (Array.isArray(boardData)) {
                    board = boardData;
                    console.log('Updated board:', board); // Debug log
                    placePieces();
                }
            }

            // Update piece state
            if (game.piece_state) {
                const newPieceState = JSON.parse(game.piece_state);
                if (newPieceState) {
                    Object.assign(pieceState, newPieceState);
                }
            }

            // Update current turn
            if (game.current_player) {
                currentPlayer = game.current_player;
                const isMyTurn = currentPlayer === this.playerColor;
                
                const chessboard = document.getElementById('chessboard');
                if (chessboard) {
                    chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
                }
                
                console.log(`Turn updated - Current: ${currentPlayer}, My color: ${this.playerColor}`); // Debug log
                updateStatusDisplay(isMyTurn ? "Your turn" : "Opponent's turn");
            }

            // Handle game end
            if (game.game_state === 'ended') {
                updateStatusDisplay(`Game Over - ${game.winner} wins!`);
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
            console.log('Move rejected - Not player\'s turn'); // Debug log
            return false;
        }

        try {
            console.log('Attempting move:', {startRow, startCol, endRow, endCol}); // Debug log

            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    board: JSON.stringify(newBoard),
                    current_player: this.playerColor === 'blue' ? 'red' : 'blue',
                    piece_state: JSON.stringify(pieceState),
                    last_move: JSON.stringify({
                        startRow,
                        startCol,
                        endRow,
                        endCol,
                        piece: board[startRow][startCol],
                        promotion
                    })
                })
                .eq('id', this.gameId);

            if (error) throw error;

            console.log('Move executed successfully'); // Debug log
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

                console.log('Left game successfully'); // Debug log
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
