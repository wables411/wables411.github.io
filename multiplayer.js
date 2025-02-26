let isMultiplayerInitialized = false;
let lastGlobalCreateClick = 0;

class MultiplayerManager {
    static hasGameBeenCreated = false; // Static guard

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
        this.isMultiplayerMode = false;
        this.isProcessingMove = false;
        this.selectedPiece = null;
        this.handleCreateGame = null;
        this.lastCreateClick = 0;
        this.hasCreatedGame = false; // Instance-level for safety
        this.initializeEventListeners();
        console.log('MultiplayerManager initialized');
    }

    initializeEventListeners() {
        if (isMultiplayerInitialized) {
            console.log('Event listeners already initialized, skipping');
            return;
        }
        isMultiplayerInitialized = true;

        const multiplayerBtn = document.getElementById('multiplayer-mode');
        const singlePlayerBtn = document.getElementById('ai-mode');
        const createGameBtn = document.getElementById('create-game');
        const joinGameBtn = document.getElementById('join-game');
        const cancelBtn = document.getElementById('cancel-matchmaking');
    
        let isCreatingGame = false;
    
        if (multiplayerBtn) {
            multiplayerBtn.addEventListener('click', () => {
                this.isMultiplayerMode = true;
                window.isMultiplayerMode = true;
                console.log('Switched to multiplayer mode');
            });
        }
    
        if (singlePlayerBtn) {
            singlePlayerBtn.addEventListener('click', () => {
                this.isMultiplayerMode = false;
                window.isMultiplayerMode = false;
                console.log('Switched to single player mode');
                this.leaveGame();
            });
        }
    
        if (createGameBtn) {
            createGameBtn.removeEventListener('click', this.handleCreateGame);
            this.handleCreateGame = async () => {
                createGameBtn.disabled = true;
                const now = Date.now();
                if (isCreatingGame || this.gameId || (now - lastGlobalCreateClick < 1000)) {
                    console.log('Game creation blocked: in progress, active, or too soon');
                    createGameBtn.disabled = false;
                    return;
                }
                this.lastCreateClick = now;
                lastGlobalCreateClick = now;
                isCreatingGame = true;
                try {
                    console.log('Triggering createGame from handleCreateGame');
                    await this.createGame();
                } finally {
                    isCreatingGame = false;
                    createGameBtn.disabled = false;
                }
            };
            createGameBtn.addEventListener('click', this.handleCreateGame);
        }
    
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
    
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.leaveGame();
                const status = document.getElementById('matchmaking-status');
                if (status) status.style.display = 'none';
            };
        }
    
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.addEventListener('click', (e) => this.handleBoardClick(e));
        }
    }

    handleBoardClick(e) {
        if (!this.isMultiplayerMode) return;
        if (!this.isMyTurn() || this.isProcessingMove) {
            console.log('Not player turn or processing move');
            return;
        }
    
        const piece = e.target.closest('.piece');
        const square = e.target.closest('.highlight');
        
        if (piece) {
            const row = parseInt(piece.getAttribute('data-row'));
            const col = parseInt(piece.getAttribute('data-col'));
            if (this.selectedPiece) {
                const targetPiece = window.board[row][col];
                if (targetPiece && window.getPieceColor(targetPiece) !== this.playerColor) {
                    const startRow = this.selectedPiece.row;
                    const startCol = this.selectedPiece.col;
                    if (window.canMakeMove(startRow, startCol, row, col)) {
                        this.makeMove(startRow, startCol, row, col);
                        this.selectedPiece = null;
                        window.removeHighlights();
                        return;
                    }
                }
            }
            this.handlePieceClick(row, col);
        } else if (square && this.selectedPiece) {
            const row = parseInt(square.getAttribute('data-row'));
            const col = parseInt(square.getAttribute('data-col'));
            this.handleSquareClick(row, col);
        }
    }

    handlePieceClick(row, col) {
        if (!this.isMultiplayerMode || !this.isMyTurn()) return;

        const piece = window.board[row][col];
        if (!piece) return;

        const pieceColor = window.getPieceColor(piece);
        if (pieceColor !== this.playerColor) return;

        window.removeHighlights();

        if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
            this.selectedPiece = null;
            return;
        }

        this.selectedPiece = { row, col };
        const validMoves = window.getValidMoves(row, col);
        validMoves.forEach(move => {
            const isCapture = window.board[move.row][move.col] !== null;
            window.highlightSquare(move.row, move.col, isCapture);
        });
    }

    async handleSquareClick(row, col) {
        if (!this.selectedPiece || !this.isMyTurn()) return;

        const startRow = this.selectedPiece.row;
        const startCol = this.selectedPiece.col;
        const piece = window.board[startRow][startCol];

        if (this.isPawnPromotion(piece, row)) {
            const promotionPiece = await this.handlePawnPromotion();
            if (!promotionPiece) return;
            await this.makeMove(startRow, startCol, row, col, promotionPiece);
        } else {
            await this.makeMove(startRow, startCol, row, col);
        }

        this.selectedPiece = null;
        window.removeHighlights();
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
        console.log('Entering createGame');
        if (MultiplayerManager.hasGameBeenCreated || this.hasCreatedGame) {
            console.log('Game already created this session, ignoring additional call');
            return;
        }
        MultiplayerManager.hasGameBeenCreated = true;
        this.hasCreatedGame = true;

        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }
    
            const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            console.log('Creating new game:', gameId);
    
            const boardState = JSON.parse(JSON.stringify(window.initialBoard));
    
            const { data, error } = await this.supabase
                .from('chess_games')
                .insert({
                    game_id: gameId,
                    blue_player: player,
                    board: { 
                        positions: boardState, 
                        piece_state: window.pieceState || {} 
                    },
                    current_player: 'blue',
                    game_state: 'waiting',
                    updated_at: new Date().toISOString()
                })
                .select();
    
            if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    
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
            console.error('Error creating game:', error.message);
            alert('Game creation failed');
            MultiplayerManager.hasGameBeenCreated = false;
            this.hasCreatedGame = false;
        }
    }

    async joinGameByCode(code) {
        try {
            const player = localStorage.getItem('currentPlayer');
            if (!player) {
                alert('Connect wallet first');
                return;
            }

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

    isMyTurn() {
        return this.currentGameState?.current_player === this.playerColor;
    }

    showGame(color) {
        try {
            const menuEl = document.querySelector('.multiplayer-menu');
            const gameEl = document.getElementById('chess-game');
            
            if (menuEl) menuEl.style.display = 'none';
            if (gameEl) gameEl.style.display = 'block';
            
            window.resetGame();
            window.isMultiplayerMode = true;
            this.isMultiplayerMode = true;
            window.playerColor = color;
            this.playerColor = color;
            window.currentPlayer = this.currentGameState?.current_player || 'blue';
    
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
            }
    
            window.placePieces();
            this.updateBoardInteractivity();
            window.updateStatusDisplay(this.isMyTurn() ? "Your turn" : "Opponent's turn");
    
        } catch (error) {
            console.error('Error in showGame:', error);
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
    
        this.subscription = this.supabase
            .channel(`game_${this.gameId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chess_games',
                filter: `game_id=eq.${this.gameId}`
            }, 
            (payload) => {
                this.handleUpdate(payload.new);
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.log('Subscription error, retrying...');
                    setTimeout(() => this.subscribeToGame(), 1000);
                }
            });
    }

    async handleUpdate(game) {
        if (!game) return;
        try {
            this.currentGameState = game;
            if (game.board?.positions) {
                window.board = JSON.parse(JSON.stringify(game.board.positions));
                window.placePieces();
            }
            if (game.current_player) {
                window.currentPlayer = game.current_player;
                this.updateBoardInteractivity();
                const baseStatus = this.isMyTurn() ? "Your turn" : "Opponent's turn";
                console.log(`Checking ${game.current_player}'s king: inCheck=${window.isKingInCheck(game.current_player)}, checkmate=${window.isCheckmate(game.current_player)}`);
                if (window.isKingInCheck && window.isKingInCheck(game.current_player)) {
                    window.updateStatusDisplay(`Check! ${baseStatus}`);
                } else if (game.game_state !== 'completed') {
                    window.updateStatusDisplay(baseStatus);
                }
            }
            if (game.game_state === 'completed') {
                await this.handleGameEnd(game);
            }
        } catch (error) {
            console.error('Update error:', error);
            window.updateStatusDisplay('Error syncing game state');
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
            const newBoard = JSON.parse(JSON.stringify(window.board));
            newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
            newBoard[startRow][startCol] = null;
            const nextPlayer = this.playerColor === 'blue' ? 'red' : 'blue';
            let gameEndState = null;
    
            window.board = newBoard;
    
            if (window.isCheckmate && window.isCheckmate(nextPlayer)) {
                gameEndState = { game_state: 'completed', winner: this.playerColor };
            } else if (window.isStalemate && window.isStalemate(nextPlayer)) {
                gameEndState = { game_state: 'completed', winner: 'draw' };
            }
    
            const updateData = {
                board: { positions: newBoard, piece_state: window.pieceState || {} },
                current_player: nextPlayer,
                last_move: { start_row: startRow, start_col: startCol, end_row: endRow, end_col: endCol, piece: newBoard[endRow][endCol], promotion },
                updated_at: new Date().toISOString(),
                ...(gameEndState || {})
            };
    
            console.log('Updating game with payload:', JSON.stringify(updateData, null, 2));
    
            const { error } = await this.supabase
                .from('chess_games')
                .update(updateData)
                .eq('game_id', this.gameId);
    
            if (error) throw new Error(`Supabase update failed: ${error.message} - Details: ${JSON.stringify(error.details || {})}`);
    
            window.board = newBoard;
            window.placePieces();
    
            return true;
        } catch (error) {
            console.error('Move error:', error.message, error.details);
            return false;
        } finally {
            this.isProcessingMove = false;
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
                    await window.leaderboardManager.loadLeaderboard();
                }

            } catch (error) {
                console.error('Leave game error:', error);
            }
        }

        this.gameId = null;
        this.playerColor = null;
        this.currentGameState = null;
        this.selectedPiece = null;
        this.hasCreatedGame = false;
        MultiplayerManager.hasGameBeenCreated = false;
        
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

if (!window.multiplayerManager) {
    window.multiplayerManager = new MultiplayerManager();
} else {
    console.log('MultiplayerManager already initialized, reusing instance');
}