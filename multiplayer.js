class MultiplayerManager {
    constructor() {
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.gameState = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        console.log('Initializing multiplayer event listeners');
        
        // Quick Match Button
        const quickMatchBtn = document.getElementById('quick-match');
        if (quickMatchBtn) {
            quickMatchBtn.onclick = async () => {
                console.log('Quick match clicked');
                try {
                    const matchmakingStatus = document.getElementById('matchmaking-status');
                    if (matchmakingStatus) matchmakingStatus.style.display = 'block';
                    await this.findQuickMatch();
                } catch (err) {
                    console.error('Quick match error:', err);
                    alert('Failed to start quick match. Please try again.');
                }
            };
        }

        // Create Game Button
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = async () => {
                console.log('Create game clicked');
                try {
                    await this.createPrivateGame();
                } catch (err) {
                    console.error('Create game error:', err);
                    alert('Failed to create game. Please try again.');
                }
            };
        }

        // Join Game Button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.onclick = async () => {
                console.log('Join game clicked');
                const codeInput = document.getElementById('game-code-input');
                const code = codeInput?.value?.trim();
                if (!code) {
                    alert('Please enter a game code');
                    return;
                }
                try {
                    await this.joinGameByCode(code);
                } catch (err) {
                    console.error('Join game error:', err);
                    alert(err.message || 'Failed to join game. Please check the code and try again.');
                }
            };
        }

        // Multiplayer Mode Button
        const multiplayerModeBtn = document.getElementById('multiplayer-mode');
        if (multiplayerModeBtn) {
            multiplayerModeBtn.onclick = () => {
                console.log('Multiplayer mode clicked');
                if (!localStorage.getItem('currentPlayer')) {
                    alert('Please connect your wallet first');
                    return;
                }
                
                const aiModeBtn = document.getElementById('ai-mode');
                const multiplayerMenu = document.querySelector('.multiplayer-menu');
                const difficultyScreen = document.getElementById('difficulty-screen');
                const chessGame = document.getElementById('chess-game');
                
                if (aiModeBtn) aiModeBtn.classList.remove('selected');
                multiplayerModeBtn.classList.add('selected');
                if (difficultyScreen) difficultyScreen.style.display = 'none';
                if (multiplayerMenu) multiplayerMenu.style.display = 'block';
                if (chessGame) chessGame.style.display = 'none';
                
                isMultiplayerMode = true;
                currentGameMode = GameMode.ONLINE;
            };
        }
    }

    async createPrivateGame() {
        const currentPlayer = localStorage.getItem('currentPlayer');
        if (!currentPlayer) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const { data: game, error } = await this.supabase
                .from('chess_games')
                .insert([{
                    blue_player: currentPlayer,
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    game_id: gameCode
                }])
                .select();

            if (error) throw error;

            this.gameId = game[0].id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            
            // Show game board for creator
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            const chessGame = document.getElementById('chess-game');
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (chessGame) chessGame.style.display = 'block';
            
            // Reset and start game
            resetGame();
            startGame();
            
            alert(`Game created! Share this code with your opponent: ${gameCode}`);
        } catch (error) {
            console.error('Error creating private game:', error);
            throw error;
        }
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
                .select('*')
                .eq('game_id', code.toUpperCase());

            if (selectError) throw selectError;
            if (!games || games.length === 0) {
                throw new Error('Game not found');
            }

            const game = games[0];
            if (game.game_state !== 'waiting') {
                throw new Error('Game already started');
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
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            const chessGame = document.getElementById('chess-game');
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (chessGame) chessGame.style.display = 'block';

            // Reset and start game
            resetGame();
            startGame();
            
            // Set player color globally
            playerColor = 'red';
            
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
                    event: '*',
                    schema: 'public',
                    table: 'chess_games',
                    filter: `id=eq.${this.gameId}`
                },
                payload => {
                    console.log('Game update received:', payload);
                    this.handleGameUpdate(payload.new);
                }
            )
            .subscribe();
    }

    handleGameUpdate(gameData) {
        if (!gameData) return;
        
        console.log('Processing game update:', gameData);
        
        this.gameState = gameData;
        
        if (gameData.board) {
            board = JSON.parse(gameData.board);
            placePieces();
        }
        
        if (gameData.current_player) {
            currentPlayer = gameData.current_player;
            updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
        }
        
        if (gameData.piece_state) {
            pieceState = JSON.parse(gameData.piece_state);
        }

        // Enable/disable board based on whose turn it is
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = currentPlayer === this.playerColor ? 'auto' : 'none';
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
        if (!this.gameId || this.gameState?.current_player !== this.playerColor) {
            console.log('Invalid move attempt:', {
                gameId: this.gameId,
                currentPlayer: this.gameState?.current_player,
                playerColor: this.playerColor
            });
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

// Create global instance
window.multiplayerManager = new MultiplayerManager();
