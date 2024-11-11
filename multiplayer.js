// Multiplayer Manager Class
class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.gameState = null;
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        console.log('Initializing multiplayer event listeners');
        
        // Quick Match Button
        const quickMatchBtn = document.getElementById('quick-match');
        if (quickMatchBtn) {
            quickMatchBtn.onclick = async () => {
                const matchmakingStatus = document.getElementById('matchmaking-status');
                if (matchmakingStatus) matchmakingStatus.style.display = 'block';
                await this.findQuickMatch();
            };
        }

        // Create Game Button
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = async () => await this.createPrivateGame();
        }

        // Join Game Button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.onclick = async () => {
                const codeInput = document.getElementById('game-code-input');
                const code = codeInput?.value?.trim();
                if (!code) {
                    alert('Please enter a game code');
                    return;
                }
                await this.joinGameByCode(code);
            };
        }

        // Cancel Matchmaking Button
        const cancelMatchmakingBtn = document.getElementById('cancel-matchmaking');
        if (cancelMatchmakingBtn) {
            cancelMatchmakingBtn.onclick = () => {
                this.leaveGame();
                const matchmakingStatus = document.getElementById('matchmaking-status');
                if (matchmakingStatus) matchmakingStatus.style.display = 'none';
            };
        }
    }

    async findQuickMatch() {
        const currentPlayer = localStorage.getItem('currentPlayer');
        if (!currentPlayer) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            // First try to join an existing game
            const { data: availableGames } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_state', 'waiting')
                .is('red_player', null)
                .limit(1);

            if (availableGames && availableGames.length > 0) {
                await this.joinGameByCode(availableGames[0].game_id);
                return;
            }

            // If no games available, create a new one
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: newGame, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: currentPlayer,
                    current_player: 'blue',
                    game_state: 'waiting',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    created_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            this.gameId = newGame[0].id;
            this.playerColor = 'blue';
            this.subscribeToGame();

            // Show game board
            this.showGameBoard('blue');
            alert(`Waiting for opponent. Game code: ${gameId}`);

        } catch (error) {
            console.error('Error in findQuickMatch:', error);
            alert('Failed to create game. Please try again.');
        }
    }

    async createPrivateGame() {
        const currentPlayer = localStorage.getItem('currentPlayer');
        if (!currentPlayer) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: currentPlayer,
                    current_player: 'blue',
                    game_state: 'waiting',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    created_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            this.gameId = data[0].id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            
            // Show game board
            this.showGameBoard('blue');
            alert(`Game created! Share this code with your opponent: ${gameId}`);

        } catch (error) {
            console.error('Error creating private game:', error);
            alert('Failed to create game. Please try again.');
        }
    }

    showGameBoard(color) {
        const multiplayerMenu = document.querySelector('.multiplayer-menu');
        const chessGame = document.getElementById('chess-game');
        const chessboard = document.getElementById('chessboard');
        
        if (multiplayerMenu) multiplayerMenu.style.display = 'none';
        if (chessGame) chessGame.style.display = 'block';
        if (chessboard) {
            chessboard.style.pointerEvents = color === 'blue' ? 'auto' : 'none';
        }
        
        // Initialize game state
        resetGame();
        isMultiplayerMode = true;
        playerColor = color;
        currentPlayer = 'blue'; // Blue always moves first
        placePieces();
        updateStatusDisplay(color === 'blue' ? "Your turn" : "Opponent's turn");
    }

    async joinGameByCode(code) {
        const currentPlayer = localStorage.getItem('currentPlayer');
        if (!currentPlayer) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            // First get the game
            const { data: games, error: selectError } = await this.supabase
                .from('chess_games')
                .select()
                .eq('game_id', code.toUpperCase())
                .eq('game_state', 'waiting');

            if (selectError) throw selectError;
            if (!games || games.length === 0) {
                throw new Error('Game not found or already started');
            }

            const game = games[0];
            if (game.red_player || game.blue_player === currentPlayer) {
                throw new Error('Cannot join this game');
            }

            // Update the game with red player
            const { error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: currentPlayer,
                    game_state: 'active'
                })
                .eq('id', game.id);

            if (updateError) throw updateError;

            this.gameId = game.id;
            this.playerColor = 'red';
            this.subscribeToGame();

            // Show game board
            this.showGameBoard('red');

        } catch (error) {
            console.error('Error joining game:', error);
            alert(error.message || 'Failed to join game');
        }
    }

    subscribeToGame() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chess_games',
                filter: `id=eq.${this.gameId}`
            }, payload => {
                console.log('Game update received:', payload);
                this.handleGameUpdate(payload.new);
            })
            .subscribe();

        console.log('Subscribed to game updates:', this.gameId);
    }

    handleGameUpdate(gameData) {
        if (!gameData) return;
        
        this.gameState = gameData;
        
        // Update board state
        if (gameData.board) {
            board = JSON.parse(gameData.board);
            placePieces();
        }
        
        // Update current turn
        if (gameData.current_player) {
            currentPlayer = gameData.current_player;
            const isMyTurn = currentPlayer === this.playerColor;
            
            // Update board interactivity
            const chessboard = document.getElementById('chessboard');
            if (chessboard) {
                chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
            }
            
            updateStatusDisplay(isMyTurn ? "Your turn" : "Opponent's turn");
        }
        
        // Update piece state
        if (gameData.piece_state) {
            Object.assign(pieceState, JSON.parse(gameData.piece_state));
        }

        // Handle game end
        if (gameData.game_state === 'ended') {
            updateStatusDisplay(`Game Over - ${gameData.winner} wins!`);
            const chessboard = document.getElementById('chessboard');
            if (chessboard) {
                chessboard.style.pointerEvents = 'none';
            }
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
        if (!this.gameId || currentPlayer !== this.playerColor) {
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
                    }
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

        const multiplayerMenu = document.querySelector('.multiplayer-menu');
        const chessGame = document.getElementById('chess-game');
        
        if (multiplayerMenu) multiplayerMenu.style.display = 'block';
        if (chessGame) chessGame.style.display = 'none';
    }
}

// Initialize the multiplayer manager
window.multiplayerManager = new MultiplayerManager();
