class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const quickMatchBtn = document.getElementById('quick-match');
        if (quickMatchBtn) {
            quickMatchBtn.onclick = () => this.findQuickMatch();
        }

        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = () => this.createPrivateGame();
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

    async findQuickMatch() {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

            const { data } = await this.supabase
                .from('chess_games')
                .select()
                .eq('game_state', 'waiting')
                .is('red_player', null)
                .single();

            if (data) {
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
        const initialState = {
            board: initialBoard,
            state: {
                currentPlayer: 'blue',
                gameState: 'waiting',
                pieceState: pieceState
            }
        };

        const { data, error } = await this.supabase
            .from('chess_games')
            .insert({
                game_id: gameId,
                blue_player: player,
                game_state: 'waiting',
                current_player: 'blue',
                board: JSON.stringify(initialState),
                piece_state: JSON.stringify(pieceState)
            })
            .select();

        if (error) throw error;

        this.gameId = data[0].id;
        this.playerColor = 'blue';
        this.subscribeToGame();
        this.showGame('blue');
        alert(`Game code: ${gameId}`);
    }

    async joinGameByCode(code) {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

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
        
        const board = document.getElementById('chessboard');
        if (board) {
            board.style.pointerEvents = color === 'blue' ? 'auto' : 'none';
        }
        
        resetGame();
        isMultiplayerMode = true;
        playerColor = color;
        currentPlayer = 'blue';
        placePieces();
        updateStatusDisplay(color === 'blue' ? "Your turn" : "Opponent's turn");
    }

    subscribeToGame() {
        if (this.subscription) this.subscription.unsubscribe();

        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chess_games',
                filter: `id=eq.${this.gameId}`
            }, 
            payload => this.handleUpdate(payload.new))
            .subscribe();
    }

    handleUpdate(game) {
        if (!game) return;

        try {
            if (game.board) {
                const gameState = JSON.parse(game.board);
                if (gameState && gameState.board) {
                    board = gameState.board;
                    placePieces();
                }
            }

            if (game.current_player) {
                currentPlayer = game.current_player;
                const myTurn = currentPlayer === this.playerColor;
                
                const board = document.getElementById('chessboard');
                if (board) board.style.pointerEvents = myTurn ? 'auto' : 'none';
                
                updateStatusDisplay(myTurn ? "Your turn" : "Opponent's turn");
            }

            if (game.game_state === 'ended') {
                updateStatusDisplay(`Game Over - ${game.winner} wins!`);
                document.getElementById('chessboard').style.pointerEvents = 'none';
            }

        } catch (error) {
            console.error('Update error:', error);
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
        if (!this.gameId || currentPlayer !== this.playerColor) return false;

        try {
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            const gameState = {
                board: newBoard,
                state: {
                    currentPlayer: this.playerColor === 'blue' ? 'red' : 'blue',
                    pieceState: pieceState,
                    lastMove: {
                        startRow,
                        startCol,
                        endRow,
                        endCol,
                        piece: board[startRow][startCol],
                        promotion
                    }
                }
            };

            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    board: JSON.stringify(gameState),
                    current_player: this.playerColor === 'blue' ? 'red' : 'blue',
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
            return true;

        } catch (error) {
            console.error('Move error:', error);
            return false;
        }
    }

    async leaveGame() {
        if (this.subscription) this.subscription.unsubscribe();

        if (this.gameId) {
            try {
                await this.supabase
                    .from('chess_games')
                    .update({
                        game_state: 'ended',
                        winner: this.playerColor === 'blue' ? 'red' : 'blue'
                    })
                    .eq('id', this.gameId);
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

window.multiplayerManager = new MultiplayerManager();
