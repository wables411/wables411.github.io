// Multiplayer game handling
class MultiplayerManager {
    constructor() {
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.gameState = null;
    }

    // Quick Match
    async findQuickMatch() {
        try {
            // First look for an available game
            const { data: existingGame } = await supabase
                .from('chess_games')
                .select('*')
                .eq('game_state', 'waiting')
                .eq('red_player', null)
                .limit(1)
                .single();

            if (existingGame) {
                // Join existing game as red player
                await this.joinGame(existingGame.id, 'red');
                return existingGame.id;
            }

            // If no game available, create new one
            const { data: newGame } = await supabase
                .from('chess_games')
                .insert({
                    blue_player: localStorage.getItem('currentPlayer'),
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState)
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

    // Create Private Game
    async createPrivateGame() {
        try {
            const { data: game } = await supabase
                .from('chess_games')
                .insert({
                    blue_player: localStorage.getItem('currentPlayer'),
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    game_id: Math.random().toString(36).substring(2, 8) // Create readable game code
                })
                .select()
                .single();

            this.gameId = game.id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            return game.game_id; // Return readable game code
        } catch (error) {
            console.error('Error creating private game:', error);
            throw error;
        }
    }

    // Join Game by Code
    async joinGameByCode(code) {
        try {
            const { data: game } = await supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', code)
                .eq('game_state', 'waiting')
                .single();

            if (!game) {
                throw new Error('Game not found or already started');
            }

            await this.joinGame(game.id, 'red');
            return game.id;
        } catch (error) {
            console.error('Error joining game:', error);
            throw error;
        }
    }

    // Join existing game
    async joinGame(gameId, color) {
        try {
            const { error } = await supabase
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
        } catch (error) {
            console.error('Error joining game:', error);
            throw error;
        }
    }

    // Subscribe to game updates
    subscribeToGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.subscription = supabase
            .from(`chess_games:id=eq.${this.gameId}`)
            .on('UPDATE', payload => {
                this.handleGameUpdate(payload.new);
            })
            .subscribe();
    }

    // Handle game updates
    handleGameUpdate(gameData) {
        this.gameState = gameData;
        
        // Update the game board
        board = JSON.parse(gameData.board);
        currentPlayer = gameData.current_player;
        pieceState = JSON.parse(gameData.piece_state);
        
        // Update UI
        placePieces();
        
        // Update game status
        if (gameData.game_state === 'check') {
            updateStatusDisplay(`${gameData.current_player.charAt(0).toUpperCase() + gameData.current_player.slice(1)} is in check!`);
        } else if (gameData.game_state === 'ended') {
            if (gameData.winner === 'draw') {
                updateStatusDisplay("Game Over - Draw!");
            } else {
                updateStatusDisplay(`Game Over - ${gameData.winner.charAt(0).toUpperCase() + gameData.winner.slice(1)} wins!`);
            }
        } else {
            updateStatusDisplay(`${gameData.current_player.charAt(0).toUpperCase() + gameData.current_player.slice(1)}'s turn`);
        }
    }

    // Make a move in multiplayer game
    async makeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
        try {
            if (this.gameState.current_player !== this.playerColor) {
                return false;
            }

            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[endRow][endCol] = promotionPiece || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;

            const { error } = await supabase
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

    // Leave current game
    async leaveGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        if (this.gameId) {
            try {
                await supabase
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
    }
}

// Export for use in chess.js
window.MultiplayerManager = MultiplayerManager;
