class MultiplayerManager {
    constructor() {
        if (!window.gameDatabase) {
            console.error('Game database not initialized');
            return;
        }
    
        this.supabase = window.gameDatabase;
        this.gameId = null;
        this.playerColor = null;
        this.subscription = null;
        this.currentGameState = null;
        this.isMultiplayerMode = true;
        this.isProcessingMove = false;
        this.selectedPiece = null;
    
        // Initialize create game button
        const createGameBtn = document.getElementById('create-game');
        if (createGameBtn) {
            createGameBtn.onclick = () => this.createGame();
        }
    
        // Initialize join game button
        const joinGameBtn = document.getElementById('join-game');
        if (joinGameBtn) {
            joinGameBtn.onclick = () => {
                const code = document.getElementById('game-code-input')?.value?.trim();
                if (code) {
                    this.joinGameByCode(code);
                } else {
                    alert('Please enter a game code');
                }
            };
        }
    
        // Initialize cancel button
        const cancelBtn = document.getElementById('cancel-matchmaking');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.leaveGame();
                const status = document.getElementById('matchmaking-status');
                if (status) status.style.display = 'none';
            };
        }
    
        // Initialize chessboard click handling
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.addEventListener('click', (e) => {
                console.log('Chessboard clicked');
                
                // Don't process clicks if it's not player's turn
                if (!this.isMyTurn() || this.isProcessingMove) {
                    console.log('Not player turn or processing move');
                    return;
                }
    
                const piece = e.target.closest('.piece');
                const square = e.target.closest('.highlight');
                
                if (piece) {
                    const row = parseInt(piece.getAttribute('data-row'));
                    const col = parseInt(piece.getAttribute('data-col'));
                    console.log('Piece clicked:', { row, col });
                    this.handlePieceClick(row, col);
                } else if (square && this.selectedPiece) {
                    const row = parseInt(square.getAttribute('data-row'));
                    const col = parseInt(square.getAttribute('data-col'));
                    console.log('Square clicked:', { row, col });
                    this.handleSquareClick(row, col);
                }
            });
        }
    
        console.log('MultiplayerManager initialized with config:', {
            isMultiplayerMode: this.isMultiplayerMode,
            database: !!this.supabase,
            chessboard: !!chessboard
        });
    }

    handlePieceClick(row, col) {
        try {
            console.log('Handling piece click:', { row, col, playerColor: this.playerColor });
            
            // Validate board state
            if (!window.board) {
                console.error('Board state is missing');
                window.resetGame();
                return;
            }
                
            // Validate coordinates
            if (row < 0 || row >= 8 || col < 0 || col >= 8) {
                console.error('Invalid coordinates:', {row, col});
                return;
            }
                
            const piece = window.board[row][col];
            console.log('Clicked position piece:', piece);
                
            if (!piece) {
                console.log('No piece at clicked position');
                return;
            }
    
            const pieceColor = window.getPieceColor(piece);
            console.log('Piece color:', pieceColor);
            
            if (pieceColor !== this.playerColor) {
                console.log('Not your piece');
                return;
            }
    
            if (!this.isMyTurn()) {
                console.log('Not your turn');
                return;
            }
    
            window.removeHighlights();
    
            if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                console.log('Deselecting piece');
                this.selectedPiece = null;
                return;
            }
    
            this.selectedPiece = { row, col };
            console.log('Selected piece:', this.selectedPiece);
            
            // Show valid moves
            for (let endRow = 0; endRow < 8; endRow++) {
                for (let endCol = 0; endCol < 8; endCol++) {
                    if (window.canPieceMove(piece, row, col, endRow, endCol)) {
                        const target = window.board[endRow][endCol];
                        window.highlightSquare(endRow, endCol, !!target);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error in handlePieceClick:', error);
            // Try to recover board state
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
                window.placePieces();
            }
            window.removeHighlights();
            this.selectedPiece = null;
        }
    }
    
    handleSquareClick(row, col) {
        try {
            console.log('Handling square click:', { row, col });
            
            if (!this.selectedPiece) {
                console.log('No piece selected');
                return;
            }
    
            if (!this.isMyTurn()) {
                console.log('Not your turn');
                return;
            }
    
            const startRow = this.selectedPiece.row;
            const startCol = this.selectedPiece.col;
            const piece = window.board[startRow][startCol];
    
            console.log('Attempting move:', {
                piece,
                from: { row: startRow, col: startCol },
                to: { row, col }
            });
    
            if (window.canPieceMove(piece, startRow, startCol, row, col)) {
                if (this.isPawnPromotion(piece, row)) {
                    this.handlePawnPromotion(startRow, startCol, row, col);
                } else {
                    this.makeMove(startRow, startCol, row, col);
                }
            } else {
                console.log('Invalid move');
            }
    
            this.selectedPiece = null;
            window.removeHighlights();
            
        } catch (error) {
            console.error('Error in handleSquareClick:', error);
        }
    }

    isPawnPromotion(piece, targetRow) {
        return (piece.toLowerCase() === 'p' && 
                ((this.playerColor === 'blue' && targetRow === 0) || 
                 (this.playerColor === 'red' && targetRow === 7)));
    }

    handlePawnPromotion() {
        return new Promise((resolve) => {
            const options = ['q', 'r', 'n', 'b'];
            const choice = window.prompt('Choose promotion piece (Q/R/N/B):', 'Q');
            if (!choice) {
                resolve(null);
                return;
            }
            const piece = choice.toLowerCase().charAt(0);
            resolve(options.includes(piece) ? piece : 'q');
        });
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
                    current_player: 'blue'
                })
                .select();

            if (error) throw error;

            this.gameId = gameId;
            this.playerColor = 'blue';
            this.currentGameState = data[0];
            await this.subscribeToGame();
            await this.showGame('blue');

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

    isMyTurn() {
        return this.currentGameState?.current_player === this.playerColor;
    }

    async joinGameByCode(code) {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }
    
            console.log('Attempting to join game:', code);
    
            const { data: games, error: queryError } = await this.supabase
                .from('chess_games')
                .select('*')
                .eq('game_id', code.toUpperCase());
    
            if (queryError || !games?.length) {
                alert('Game not found');
                return;
            }
    
            const game = games[0];
            console.log('Found game:', game);
    
            if (game.game_state !== 'waiting' && game.game_state !== 'active') {
                alert(`Game is ${game.game_state}`);
                return;
            }
    
            if (game.red_player === player || game.blue_player === player) {
                console.log('Rejoining existing game');
                this.gameId = game.game_id;
                this.playerColor = game.blue_player === player ? 'blue' : 'red';
                this.currentGameState = game;
                await this.subscribeToGame();
                await this.showGame(this.playerColor);
                return;
            }
    
            if (game.red_player) {
                alert('Game already has both players');
                return;
            }

            const { data: updateData, error: updateError } = await this.supabase
                .from('chess_games')
                .update({
                    red_player: player,
                    game_state: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', game.game_id)
                .select()
                .single();
    
            if (updateError) throw new Error('Failed to join game');
    
            console.log('Successfully joined game:', updateData);
    
            this.gameId = game.game_id;
            this.playerColor = 'red';
            this.currentGameState = updateData;
            await this.subscribeToGame();
            await this.showGame('red');
    
        } catch (error) {
            console.error('Join game error:', error);
            alert(`Failed to join game: ${error.message}`);
        }
    }

    showGame(color) {
        try {
            console.log('Showing game for color:', color, {
                gameId: this.gameId,
                isMultiplayerMode: true,
                currentGameState: this.currentGameState
            });
        
            const menuEl = document.querySelector('.multiplayer-menu');
            const gameEl = document.getElementById('chess-game');
            
            if (menuEl) menuEl.style.display = 'none';
            if (gameEl) gameEl.style.display = 'block';
            
            window.resetGame();
            window.isMultiplayerMode = true;
            window.playerColor = color;
            window.currentPlayer = this.currentGameState?.current_player || 'blue';
        
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
                console.log('Loaded board state:', window.board);
            }

            window.placePieces();
            this.updateBoardInteractivity();
            
            window.updateStatusDisplay(this.isMyTurn() ? "Your turn" : "Opponent's turn");
            
            console.log('Game setup complete:', {
                playerColor: color,
                currentPlayer: window.currentPlayer,
                board: window.board
            });
        
        } catch (error) {
            console.error('Error in showGame:', error);
            console.log('Debug state:', {
                board: window.board,
                pieceImages: window.pieceImages,
                currentGameState: this.currentGameState
            });
            window.updateStatusDisplay('Error initializing game board');
        }
    }

    updateBoardInteractivity() {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) return;

        const isMyTurn = this.isMyTurn();
        chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
        
        const pieces = chessboard.getElementsByClassName('piece');
        Array.from(pieces).forEach(piece => {
            const row = parseInt(piece.getAttribute('data-row'));
            const col = parseInt(piece.getAttribute('data-col'));
            const pieceType = window.board[row][col];
            if (pieceType) {
                const pieceColor = window.getPieceColor(pieceType);
                piece.style.cursor = (isMyTurn && pieceColor === this.playerColor) ? 'pointer' : 'default';
            }
        });
    }

    async subscribeToGame() {
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

    async handleUpdate(game) {
        if (!game) return;
    
        try {
            console.log('Processing game update:', game);
            this.currentGameState = game;
    
            if (game.board?.positions) {
                window.board = JSON.parse(JSON.stringify(game.board.positions));
                window.placePieces();
            }
    
            if (game.current_player) {
                window.currentPlayer = game.current_player;
                this.updateBoardInteractivity();
                
                if (game.game_state !== 'ended') {
                    window.updateStatusDisplay(this.isMyTurn() ? "Your turn" : "Opponent's turn");
                }
            }
    
            if (game.game_state === 'ended') {
                await this.handleGameEnd(game);
            }
    
        } catch (error) {
            console.error('Update error:', error);
            console.error('Error context:', {
                gameState: game?.game_state,
                winner: game?.winner,
                playerColor: this.playerColor,
                currentPlayer: game?.current_player
            });
        }
    }

    async handleGameEnd(game) {
        try {
            let gameResult;
            let displayMessage;

            if (game.winner === 'draw') {
                gameResult = 'draw';
                displayMessage = 'Game Over - Draw!';
            } else {
                gameResult = game.winner === this.playerColor ? 'win' : 'loss';
                displayMessage = `Game Over - ${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`;
            }

            window.updateStatusDisplay(displayMessage);

            if (window.updateGameResult) {
                window.updateGameResult(gameResult);
            }

            if (window.leaderboardManager) {
                await window.leaderboardManager.loadLeaderboard();
            }

            const chessboard = document.getElementById('chessboard');
            if (chessboard) {
                chessboard.style.pointerEvents = 'none';
            }
        } catch (error) {
            console.error('Error handling game end:', error);
        }
    }

    async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
        if (!this.gameId || this.isProcessingMove || !this.isMyTurn()) return false;
    
        try {
            this.isProcessingMove = true;
            
            // Validate basic parameters
            if (!window.board || !window.board[startRow] || !window.board[startRow][startCol]) {
                throw new Error('Invalid start position');
            }
    
            if (endRow < 0 || endRow >= 8 || endCol < 0 || endCol >= 8) {
                throw new Error('Invalid end position');
            }
            
            console.log('Processing move:', {
                startRow, 
                startCol, 
                endRow, 
                endCol,
                promotion,
                playerColor: this.playerColor,
                currentPlayer: window.currentPlayer
            });
    
            const movingPiece = window.board[startRow][startCol];
            
            if (!movingPiece) {
                throw new Error('No piece at start position');
            }
    
            // Validate chess rules before making the move
            if (!window.canPieceMove(movingPiece, startRow, startCol, endRow, endCol)) {
                console.error('Invalid move according to chess rules');
                return false;
            }
    
            // Create new board state after validating move
            const newBoard = JSON.parse(JSON.stringify(window.board));
            newBoard[endRow][endCol] = promotion || movingPiece;
            newBoard[startRow][startCol] = null;
    
            // Handle special moves like castling
            if (movingPiece.toLowerCase() === 'k' && Math.abs(endCol - startCol) === 2) {
                const row = this.playerColor === 'blue' ? 7 : 0;
                if (endCol === 6) { // Kingside
                    newBoard[row][5] = newBoard[row][7];
                    newBoard[row][7] = null;
                } else if (endCol === 2) { // Queenside
                    newBoard[row][3] = newBoard[row][0];
                    newBoard[row][0] = null;
                }
            }
    
            // Temporarily set board to check game end conditions
            const originalBoard = JSON.parse(JSON.stringify(window.board));
            window.board = newBoard;
            
            const nextPlayer = this.playerColor === 'blue' ? 'red' : 'blue';
            let gameEndState = null;
    
            // Check for checkmate/stalemate
            if (window.isCheckmate && window.isCheckmate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: this.playerColor
                };
            } else if (window.isStalemate && window.isStalemate(nextPlayer)) {
                gameEndState = {
                    game_state: 'ended',
                    winner: 'draw'
                };
            }
    
            // Prepare database update
            const updateData = {
                board: {
                    positions: newBoard,
                    pieceState: window.pieceState || {}
                },
                current_player: nextPlayer,
                last_move: {
                    startRow,
                    startCol,
                    endRow,
                    endCol,
                    piece: newBoard[endRow][endCol],
                    promotion
                },
                updated_at: new Date().toISOString()
            };
    
            if (gameEndState) {
                Object.assign(updateData, gameEndState);
            }
    
            // Update database
            const { error } = await this.supabase
                .from('chess_games')
                .update(updateData)
                .eq('game_id', this.gameId);
    
            if (error) {
                window.board = originalBoard; // Restore original board state
                throw error;
            }
    
            // Update local state
            window.board = newBoard;
            window.placePieces();
            window.updateStatusDisplay("Opponent's turn");
    
            return true;
    
        } catch (error) {
            console.error('Move error:', error);
            
            // Restore original board state
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
                window.placePieces();
            }
            
            return false;
        } finally {
            this.isProcessingMove = false;
            window.removeHighlights();
            this.selectedPiece = null;
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
        this.selectedPiece = null;
        
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