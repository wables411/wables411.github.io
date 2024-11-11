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

    async findQuickMatch() {
        const currentPlayer = localStorage.getItem('currentPlayer');
        if (!currentPlayer) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            // First try to join an existing game
            const { data: availableGames, error: searchError } = await this.supabase
                .from('chess_games')
                .select()
                .eq('game_state', 'waiting')
                .is('red_player', null);

            if (searchError) throw searchError;

            if (availableGames && availableGames.length > 0) {
                await this.joinGame(availableGames[0].id, 'red');
                return;
            }

            // If no games available, create a new one
            const { data: newGame, error: createError } = await this.supabase
                .from('chess_games')
                .insert({
                    blue_player: currentPlayer,
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState)
                })
                .select()
                .single();

            if (createError) throw createError;

            this.gameId = newGame.id;
            this.playerColor = 'blue';
            this.subscribeToGame();

            alert('Waiting for opponent to join...');
        } catch (error) {
            console.error('Error in findQuickMatch:', error);
            throw error;
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
                .insert({
                    blue_player: currentPlayer,
                    game_state: 'waiting',
                    current_player: 'blue',
                    board: JSON.stringify(initialBoard),
                    piece_state: JSON.stringify(pieceState),
                    game_id: gameCode
                })
                .select()
                .single();

            if (error) throw error;

            this.gameId = game.id;
            this.playerColor = 'blue';
            this.subscribeToGame();
            
            alert(`Game created! Share this code with your opponent: ${gameCode}`);
        } catch (error) {
            console.error('Error creating private game:', error);
            throw error;
        }
    }

    async joinGameByCode(code) {
        try {
            const { data: games, error } = await this.supabase
                .from('chess_games')
                .select()
                .eq('game_id', code.toUpperCase())
                .eq('game_state', 'waiting');

            if (error) throw error;
            
            if (!games || games.length === 0) {
                throw new Error('Game not found or already started');
            }

            await this.joinGame(games[0].id, 'red');
        } catch (error) {
            console.error('Error joining game:', error);
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
                .eq('id', gameId)
                .select();

            if (error) throw error;

            this.gameId = gameId;
            this.playerColor = color;
            this.subscribeToGame();
            
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
                    event: '*',
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
