class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.gameState = null;
    }

    async findQuickMatch() {
        try {
            const { data: existingGame } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_state', 'waiting')
                .eq('red_player', null)
                .limit(1)
                .single();

            if (existingGame) {
                await this.joinGame(existingGame.id, 'red');
                return existingGame.id;
            }

            const { data: newGame } = await this.supabase
                .from('chess_games')
                .insert({
                    blue_player: localStorage.getItem('currentPlayer'),
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    game_id: Math.random().toString(36).substring(2, 8)
                })
                .select()
                .single();

            this.gameId = newGame.id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            return newGame.id;
        } catch (error) {
            console.error('Error in findQuickMatch:', error);
            throw error;
        }
    }

    async createPrivateGame() {
        try {
            const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: game } = await this.supabase
                .from('chess_games')
                .insert({
                    blue_player: localStorage.getItem('currentPlayer'),
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    game_id: gameCode
                })
                .select()
                .single();

            this.gameId = game.id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            
            // Show game code to player
            alert(`Your game code is: ${gameCode}`);
            return gameCode;
        } catch (error) {
            console.error('Error creating private game:', error);
            throw error;
        }
    }

    async joinGameByCode(code) {
        try {
            const { data: game } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', code.toUpperCase())
                .eq('game_state', 'waiting')
                .single();

            if (!game) {
                throw new Error('Game not found or already started');
            }

            await this.joinGame(game.id, 'red');
            return game.id;
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Game not found or already started');
            throw error;
        }
    }

    async joinGame(gameId, color) {
        try {
            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    [`${color}_player`]: localStorage.getItem('currentPlayer'),
                    game_state: 'active'
                })
                .eq('id', gameId);

            if (error) throw error;

            this.gameId = gameId;
            this.playerColor = color;
            this.subscribeToGame();
            
            // Update UI for game start
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            const chessGame = document.getElementById('chess-game');
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (chessGame) chessGame.style.display = 'block';
            
            resetGame();
            startGame();
        } catch (error) {
            console.error('Error joining game:', error);
            throw error;
        }
    }

    subscribeToGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chess_games',
                    filter: `id=eq.${this.gameId}`
                },
                payload => this.handleGameUpdate(payload.new)
            )
            .subscribe();
    }

    handleGameUpdate(gameData) {
        if (!gameData) return;
        
        this.gameState = gameData;
        
        // Update game state
        board = JSON.parse(gameData.board);
        currentPlayer = gameData.current_player;
        if (gameData.piece_state) {
            pieceState = JSON.parse(gameData.piece_state);
        }
        
        // Update UI
        placePieces();
        
        // Handle different game states
        switch (gameData.game_state) {
            case 'check':
                updateStatusDisplay(`${gameData.current_player.charAt(0).toUpperCase() + gameData.current_player.slice(1)} is in check!`);
                break;
            case 'ended':
                if (gameData.winner === 'draw') {
                    endGame('draw');
                } else {
                    endGame(gameData.winner);
                }
                break;
            default:
                updateStatusDisplay(`${gameData.current_player.charAt(0).toUpperCase() + gameData.current_player.slice(1)}'s turn`);
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
        if (!this.gameId || !this.gameState || this.gameState.current_player !== this.playerColor) {
            return false;
        }

        try {
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[endRow][endCol] = promotionPiece || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            const { error } = await this.supabase
                .from('chess_games')
                .update({
                    board: JSON.stringify(newBoard),
                    current_player: this.playerColor === 'blue' ? 'red' : 'blue',
                    piece_state: JSON.stringify(pieceState),
                    last_move: {
                        startRow,
                        startCol,
                        endRow,
                        endCol,
                        piece: board[startRow][startCol],
                        promotion: promotionPiece
                    },
                    game_state: isKingInCheck(this.playerColor === 'blue' ? 'red' : 'blue') ? 'check' : 'active'
                })
                .eq('id', this.gameId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error making move:', error);
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
            } catch (error) {
                console.error('Error leaving game:', error);
            }
        }

        this.gameId = null;
        this.playerColor = null;
        this.gameState = null;
        
        // Reset UI
        const multiplayerMenu = document.querySelector('.multiplayer-menu');
        const chessGame = document.getElementById('chess-game');
        if (multiplayerMenu) multiplayerMenu.style.display = 'block';
        if (chessGame) chessGame.style.display = 'none';
    }
}

// Create global instance
window.MultiplayerManager = MultiplayerManager;
