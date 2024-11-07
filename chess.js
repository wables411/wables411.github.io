// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://roxwocgknkiqnsgiojgz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveHdvY2drbmtpcW5zZ2lvamd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjMxMTIsImV4cCI6MjA0NjMzOTExMn0.NbLMZom-gk7XYGdV4MtXYcgR8R1s8xthrIQ0hpQfx9Y'
);

// Game modes and state
const GameMode = {
    AI: 'ai',
    ONLINE: 'online'
};

let currentGameMode = GameMode.AI;
let onlineGame = null;
let onlineGameId = null;
let onlineGameSubscription = null;
let playerColor = null;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing chess game...");
        initGameModeControls();
        initDifficultySelection();
        initRestartButton();
        initOnlineControls();
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

// Game mode initialization
function initGameModeControls() {
    const aiModeBtn = document.getElementById('ai-mode');
    const onlineModeBtn = document.getElementById('online-mode');
    const onlineControls = document.querySelector('.online-controls');
    const difficultyScreen = document.getElementById('difficulty-screen');

    aiModeBtn.addEventListener('click', () => {
        currentGameMode = GameMode.AI;
        aiModeBtn.classList.add('selected');
        onlineModeBtn.classList.remove('selected');
        onlineControls.style.display = 'none';
        difficultyScreen.style.display = 'flex';
        leaveOnlineGame();
    });

    onlineModeBtn.addEventListener('click', () => {
        currentGameMode = GameMode.ONLINE;
        onlineModeBtn.classList.add('selected');
        aiModeBtn.classList.remove('selected');
        onlineControls.style.display = 'flex';
        difficultyScreen.style.display = 'none';
    });
}

// Online game controls initialization
function initOnlineControls() {
    const createGameBtn = document.getElementById('create-game');
    const joinGameBtn = document.getElementById('join-game');
    const joinGameInput = document.getElementById('join-game-input');
    const connectionStatus = document.getElementById('connection-status');

    createGameBtn.addEventListener('click', createOnlineGame);
    joinGameBtn.addEventListener('click', () => joinOnlineGame(joinGameInput.value));
}

// Online game creation
async function createOnlineGame() {
    try {
        const gameId = generateGameId();
        const { data, error } = await supabase
            .from('chess_games')
            .insert({
                game_id: gameId,
                current_board: JSON.stringify(initialBoard),
                current_turn: 'blue',
                game_status: 'waiting',
                blue_player: localStorage.getItem('currentPlayer')
            })
            .select()
            .single();

        if (error) throw error;

        onlineGameId = gameId;
        playerColor = 'blue';
        subscribeToGame(gameId);
        
        const gameIdDisplay = document.getElementById('game-id');
        gameIdDisplay.textContent = `Game ID: ${gameId}`;
        
        updateConnectionStatus('Waiting for opponent...');
    } catch (error) {
        console.error('Error creating game:', error);
        updateConnectionStatus('Error creating game');
    }
}

// Online game joining
async function joinOnlineGame(gameId) {
    try {
        const { data, error } = await supabase
            .from('chess_games')
            .update({
                red_player: localStorage.getItem('currentPlayer'),
                game_status: 'active'
            })
            .eq('game_id', gameId)
            .eq('game_status', 'waiting')
            .select()
            .single();

        if (error) throw error;

        onlineGameId = gameId;
        playerColor = 'red';
        subscribeToGame(gameId);
        
        updateConnectionStatus('Connected - Game starting...');
    } catch (error) {
        console.error('Error joining game:', error);
        updateConnectionStatus('Error joining game');
    }
}

// Realtime subscription
function subscribeToGame(gameId) {
    if (onlineGameSubscription) {
        onlineGameSubscription.unsubscribe();
    }

    onlineGameSubscription = supabase
        .channel(`game:${gameId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'chess_games',
            filter: `game_id=eq.${gameId}`
        }, handleGameUpdate)
        .subscribe();
}

// Update UI elements
function updateConnectionStatus(message) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Utility functions
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function leaveOnlineGame() {
    if (onlineGameSubscription) {
        onlineGameSubscription.unsubscribe();
    }
    onlineGameId = null;
    playerColor = null;
    updateConnectionStatus('');
    document.getElementById('game-id').textContent = '';
}

// Game constants and initial state
const BOARD_SIZE = 8;
const initialBoard = [
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
];

// Game state variables
let board = JSON.parse(JSON.stringify(initialBoard));
let selectedPiece = null;
let currentPlayer = 'blue';
let moveHistory = [];
let gameState = 'active';
let lastMove = null;
let hoveredSquare = null;
let selectedDifficulty = null;
let gameDifficulty = 'easy';

// Piece movement tracking
const pieceState = {
    blueKingMoved: false,
    redKingMoved: false,
    blueRooksMove: { left: false, right: false },
    redRooksMove: { left: false, right: false },
    lastPawnDoubleMove: null
};

// Piece images mapping
const pieceImages = {
    'R': 'images/redrook.png', 
    'N': 'images/redknight.png', 
    'B': 'images/redbishop.png',
    'Q': 'images/redqueen.png', 
    'K': 'images/redking.png', 
    'P': 'images/redpawn.png',
    'r': 'images/bluerook.png', 
    'n': 'images/blueknight.png', 
    'b': 'images/bluebishop.png',
    'q': 'images/bluequeen.png', 
    'k': 'images/blueking.png', 
    'p': 'images/bluepawn.png'
};

// Game initialization functions
function initGame() {
    try {
        debug('\n----- Game Initialization -----');
        createBoard();
        placePieces();
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && selectedPiece) {
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            }
        });
        
        debug('Game initialization completed successfully');
    } catch (error) {
        console.error("Error during game initialization:", error);
    }
}

function resetGame() {
    try {
        debug('\n----- Game Reset -----');
        
        board = JSON.parse(JSON.stringify(initialBoard));
        currentPlayer = 'blue';
        selectedPiece = null;
        moveHistory = [];
        gameState = 'active';
        lastMove = null;
        
        Object.assign(pieceState, {
            blueKingMoved: false,
            redKingMoved: false,
            blueRooksMove: { left: false, right: false },
            redRooksMove: { left: false, right: false },
            lastPawnDoubleMove: null
        });
        
        updateStatusDisplay("Select Difficulty");
        const moveHistoryElement = document.getElementById('move-history');
        const debugElement = document.getElementById('debug');
        if (moveHistoryElement) moveHistoryElement.innerHTML = '';
        if (debugElement) debugElement.innerHTML = '';
        
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'auto';
            createBoard();
            placePieces();
        }
        
        debug('Game reset completed');
    } catch (error) {
        console.error("Error resetting game:", error);
    }
}

// Game state management for online mode
async function handleGameUpdate(payload) {
    if (!payload.new || !onlineGameId) return;

    const gameData = payload.new;
    
    // Update local game state
    if (gameData.current_board) {
        board = JSON.parse(gameData.current_board);
        currentPlayer = gameData.current_turn;
        placePieces();
    }

    // Update game status
    if (gameData.game_status === 'active') {
        if (gameData.current_turn === playerColor) {
            updateStatusDisplay("Your turn");
        } else {
            updateStatusDisplay("Opponent's turn");
        }
    } else if (gameData.game_status === 'completed') {
        updateStatusDisplay(`Game Over - ${gameData.winner} wins!`);
        endGame(gameData.winner);
    }

    // Update player information
    updatePlayerInfo(gameData.blue_player, gameData.red_player);
}

function updatePlayerInfo(bluePlayer, redPlayer) {
    const bluePlayerName = document.querySelector('#blue-player .player-name');
    const redPlayerName = document.querySelector('#red-player .player-name');
    
    if (bluePlayerName) bluePlayerName.textContent = bluePlayer || 'Waiting...';
    if (redPlayerName) redPlayerName.textContent = redPlayer || 'Waiting...';
}

// Move validation for both modes
function canMakeMove(startRow, startCol, endRow, endCol) {
    if (currentGameMode === GameMode.ONLINE) {
        // Online mode checks
        if (currentPlayer !== playerColor) return false;
        if (gameState !== 'active') return false;
    } else {
        // AI mode checks
        if (currentPlayer !== 'blue') return false;
        if (gameState !== 'active' && gameState !== 'check') return false;
    }

    const piece = board[startRow][startCol];
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
}

// Execute move for both modes
async function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    const piece = board[startRow][startCol];
    const capturedPiece = board[endRow][endCol];
    
    // Execute the move locally
    makeMove(startRow, startCol, endRow, endCol, promotionPiece);

    if (currentGameMode === GameMode.ONLINE) {
        // Sync move with online game
        await updateOnlineGame(startRow, startCol, endRow, endCol, promotionPiece);
    } else {
        // Handle AI response
        updateGameState();
        if (currentPlayer === 'red') {
            setTimeout(makeAIMove, 500);
        }
    }

    return true;
}

async function updateOnlineGame(startRow, startCol, endRow, endCol, promotionPiece) {
    try {
        const { error } = await supabase
            .from('chess_games')
            .update({
                current_board: JSON.stringify(board),
                current_turn: currentPlayer === 'blue' ? 'red' : 'blue',
                last_move: {
                    from: { row: startRow, col: startCol },
                    to: { row: endRow, col: endCol },
                    promotion: promotionPiece
                }
            })
            .eq('game_id', onlineGameId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating game:', error);
        updateConnectionStatus('Error updating game');
    }
}

// Utility functions
function debug(message) {
    console.log(message);
    const debugElement = document.getElementById('debug');
    if (debugElement) {
        debugElement.innerHTML += message + '<br>';
        debugElement.scrollTop = debugElement.scrollHeight;
    }
}

function updateStatusDisplay(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        debug(`Status updated: ${message}`);
    }
}

// UI Management and Event Handlers
function createBoard() {
    try {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) {
            throw new Error("Chessboard element not found");
        }
        const randomBoard = selectRandomChessboard();
        chessboard.style.backgroundImage = `url('${randomBoard}')`;
        debug(`Selected board: ${randomBoard}`);
    } catch (error) {
        console.error("Error creating board:", error);
        throw error;
    }
}

function selectRandomChessboard() {
    const boardCount = 6;
    const boardNumber = Math.floor(Math.random() * boardCount) + 1;
    return `images/chessboard${boardNumber}.png`;
}

function placePieces() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) return;
    
    chessboard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece) {
                const pieceElement = createPieceElement(piece, row, col);
                chessboard.appendChild(pieceElement);
            }
        }
    }
}

function createPieceElement(piece, row, col) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.style.backgroundImage = `url('${pieceImages[piece]}')`;
    pieceElement.style.left = `${col * 12.5}%`;
    pieceElement.style.top = `${row * 12.5}%`;
    pieceElement.setAttribute('data-row', row);
    pieceElement.setAttribute('data-col', col);
    pieceElement.addEventListener('click', onPieceClick);
    return pieceElement;
}

function onPieceClick(event) {
    try {
        // Check if it's player's turn based on game mode
        if (currentGameMode === GameMode.ONLINE) {
            if (currentPlayer !== playerColor) return;
        } else {
            if (currentPlayer !== 'blue') return;
        }

        if (gameState !== 'active' && gameState !== 'check') return;
        
        const clickedPiece = event.target;
        const row = parseInt(clickedPiece.getAttribute('data-row'));
        const col = parseInt(clickedPiece.getAttribute('data-col'));
        const pieceType = board[row][col];
        
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            removeHighlights();
        }
        
        const pieceColor = getPieceColor(pieceType);
        if ((currentGameMode === GameMode.ONLINE && pieceColor === playerColor) ||
            (currentGameMode === GameMode.AI && pieceColor === 'blue')) {
            if (selectedPiece === clickedPiece) {
                selectedPiece = null;
            } else {
                selectedPiece = clickedPiece;
                clickedPiece.style.opacity = '0.7';
                showLegalMoves(row, col);
            }
        }
    } catch (error) {
        console.error("Error in onPieceClick:", error);
    }
}

function showLegalMoves(row, col) {
    removeHighlights();
    
    const piece = board[row][col];
    if (!piece) return;
    
    for (let endRow = 0; row < BOARD_SIZE; endRow++) {
        for (let endCol = 0; col < BOARD_SIZE; endCol++) {
            if (canPieceMove(piece, row, col, endRow, endCol)) {
                const target = board[endRow][endCol];
                highlightSquare(endRow, endCol, !!target);
            }
        }
    }
}

function highlightSquare(row, col, isCapture = false) {
    const square = document.createElement('div');
    square.className = 'highlight' + (isCapture ? ' capture' : '');
    square.style.position = 'absolute';
    square.style.left = `${col * 12.5}%`;
    square.style.top = `${row * 12.5}%`;
    square.style.width = '12.5%';
    square.style.height = '12.5%';
    square.style.zIndex = '5';
    
    square.setAttribute('data-row', row);
    square.setAttribute('data-col', col);
    
    square.addEventListener('click', function(e) {
        e.stopPropagation();
        onSquareClick(row, col);
    });
    
    document.getElementById('chessboard').appendChild(square);
}

function removeHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => highlight.remove());
}

function onSquareClick(row, col) {
    try {
        if (currentGameMode === GameMode.ONLINE && currentPlayer !== playerColor) return;
        if (currentGameMode === GameMode.AI && currentPlayer !== 'blue') return;
        
        if (gameState !== 'active' && gameState !== 'check') return;
        
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = board[startRow][startCol];
            
            if (canPieceMove(piece, startRow, startCol, row, col)) {
                if (piece.toLowerCase() === 'p' && (row === 0 || row === 7)) {
                    promptPawnPromotion(startRow, startCol, row, col);
                } else {
                    executeMove(startRow, startCol, row, col);
                }
            }
            
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
        }
    } catch (error) {
        console.error("Error in onSquareClick:", error);
    }
}

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = currentGameMode === GameMode.ONLINE ? playerColor : currentPlayer;
    
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    
    // Adjust position based on which side is promoting
    if (endRow === 0) { // Blue promoting at top
        dialog.style.top = '12.5%';  // Position below the promotion square
    } else { // Red promoting at bottom
        dialog.style.bottom = '12.5%';  // Position above the promotion square
    }
    
    dialog.style.left = `${endCol * 12.5}%`;
    dialog.style.zIndex = '1000';
    
    promotionPieces.forEach(piece => {
        const pieceButton = document.createElement('div');
        pieceButton.className = 'promotion-piece';
        const promotedPiece = color === 'blue' ? piece : piece.toUpperCase();
        pieceButton.style.backgroundImage = `url('${pieceImages[promotedPiece]}')`;
        pieceButton.style.cursor = 'pointer';
        
        pieceButton.onclick = () => {
            executeMove(startRow, startCol, endRow, endCol, promotedPiece);
            dialog.remove();
        };
        
        dialog.appendChild(pieceButton);
    });
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.appendChild(dialog);
    }
}

function addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece) {
    try {
        const moveText = `${getPieceName(piece)} ${coordsToAlgebraic(startRow, startCol)} to ${coordsToAlgebraic(endRow, endCol)}${capturedPiece ? ' captures ' + getPieceName(capturedPiece) : ''}`;
        moveHistory.push(moveText);
        
        const historyElement = document.getElementById('move-history');
        if (historyElement) {
            const moveNumber = Math.floor(moveHistory.length / 2) + 1;
            const newMove = document.createElement('div');
            newMove.textContent = `${moveNumber}. ${moveText}`;
            if (capturedPiece) {
                newMove.style.color = '#ff6b6b';
            }
            historyElement.appendChild(newMove);
            historyElement.scrollTop = historyElement.scrollHeight;
        }
    } catch (error) {
        console.error("Error adding move to history:", error);
    }
}

// Move validation and game mechanics
function canPieceMove(piece, startRow, startCol, endRow, endCol, checkForCheck = true) {
    if (!piece) return false;
    
    const pieceType = piece.toLowerCase();
    const color = getPieceColor(piece);
    
    // Basic validation
    if (!isWithinBoard(endRow, endCol)) return false;
    if (startRow === endRow && startCol === endCol) return false;
    
    const targetPiece = board[endRow][endCol];
    if (targetPiece && getPieceColor(targetPiece) === color) return false;

    let isValid = false;
    switch (pieceType) {
        case 'p':
            isValid = isValidPawnMove(color, startRow, startCol, endRow, endCol);
            break;
        case 'r':
            isValid = isValidRookMove(startRow, startCol, endRow, endCol);
            break;
        case 'n':
            isValid = isValidKnightMove(startRow, startCol, endRow, endCol);
            break;
        case 'b':
            isValid = isValidBishopMove(startRow, startCol, endRow, endCol);
            break;
        case 'q':
            isValid = isValidQueenMove(startRow, startCol, endRow, endCol);
            break;
        case 'k':
            isValid = isValidKingMove(color, startRow, startCol, endRow, endCol);
            break;
    }

    if (!isValid) return false;
    
    if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color)) {
        return false;
    }

    return true;
}

function makeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    const piece = board[startRow][startCol];
    const color = getPieceColor(piece);
    const pieceType = piece.toLowerCase();
    const capturedPiece = board[endRow][endCol];

    // Handle castling
    if (pieceType === 'k' && Math.abs(endCol - startCol) === 2) {
        const row = color === 'blue' ? 7 : 0;
        if (endCol === 6) { // Kingside
            board[row][5] = board[row][7];
            board[row][7] = null;
        } else if (endCol === 2) { // Queenside
            board[row][3] = board[row][0];
            board[row][0] = null;
        }
    }

    // Handle pawn promotion
    if (pieceType === 'p' && (endRow === 0 || endRow === 7)) {
        board[endRow][endCol] = promotionPiece || (color === 'blue' ? 'q' : 'Q');
    } else {
        board[endRow][endCol] = piece;
    }
    
    board[startRow][startCol] = null;
    
    // Update move history and display
    addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece);
    placePieces();
    
    // Update game state
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    
    // Check for game end conditions
    if (isCheckmate(currentPlayer)) {
        gameState = 'checkmate';
        endGame(color);
    } else if (isStalemate(currentPlayer)) {
        gameState = 'stalemate';
        endGame('draw');
    } else if (isKingInCheck(currentPlayer)) {
        gameState = 'check';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
    }
}

function endGame(winner) {
    gameState = 'ended';
    const message = winner === 'draw' ? 
        "Game Over - It's a draw!" : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);
    debug(`Game ended: ${message}`);
    
    if (currentGameMode === GameMode.ONLINE) {
        // Update online game status
        updateOnlineGameStatus('completed', winner);
    } else {
        // Update local leaderboard
        try {
            updateGameResult(winner);
            debug('Leaderboard updated');
        } catch (error) {
            debug('Error updating leaderboard: ' + error.message);
        }
    }
}

async function updateOnlineGameStatus(status, winner = null) {
    try {
        const { error } = await supabase
            .from('chess_games')
            .update({
                game_status: status,
                winner: winner
            })
            .eq('game_id', onlineGameId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating game status:', error);
    }
}

// AI Move Generation (for single-player mode)
function makeAIMove() {
    if (currentGameMode !== GameMode.AI || currentPlayer !== 'red') return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    const move = selectBestMove();
    if (move) {
        executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
    }
}

function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    // Evaluate each move
    legalMoves.forEach(move => {
        if (gameDifficulty === 'hard') {
            move.score = evaluateHardMove(
                board[move.startRow][move.startCol],
                move.startRow, 
                move.startCol,
                move.endRow,
                move.endCol
            );
        } else {
            move.score = evaluateEasyMove(
                board[move.startRow][move.startCol],
                move.startRow,
                move.startCol,
                move.endRow,
                move.endCol
            );
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);

    // Select move based on difficulty
    if (gameDifficulty === 'hard') {
        // Usually choose the best move in hard mode
        return Math.random() < 0.8 ? legalMoves[0] : legalMoves[1];
    } else {
        // In easy mode, randomly select from top 3 moves
        const topMoves = legalMoves.slice(0, 3);
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
}

function getAllLegalMoves(color) {
    const moves = [];
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = board[startRow][startCol];
            if (piece && getPieceColor(piece) === color) {
                for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
                    for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
                        if (canPieceMove(piece, startRow, startCol, endRow, endCol)) {
                            moves.push({
                                piece,
                                startRow,
                                startCol,
                                endRow,
                                endCol,
                                score: 0,
                                isCapture: !!board[endRow][endCol]
                            });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

// Initialize difficulty selection
function initDifficultySelection() {
    const easyBtn = document.getElementById('easy-mode');
    const hardBtn = document.getElementById('hard-mode');
    const startBtn = document.getElementById('start-game');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const chessGame = document.getElementById('chess-game');

    easyBtn.addEventListener('click', () => {
        gameDifficulty = 'easy';
        selectedDifficulty = 'easy';
        easyBtn.classList.add('selected');
        hardBtn.classList.remove('selected');
        startBtn.disabled = false;
    });

    hardBtn.addEventListener('click', () => {
        gameDifficulty = 'hard';
        selectedDifficulty = 'hard';
        hardBtn.classList.add('selected');
        easyBtn.classList.remove('selected');
        startBtn.disabled = false;
    });

    startBtn.addEventListener('click', () => {
        if (selectedDifficulty) {
            difficultyScreen.style.display = 'none';
            chessGame.style.display = 'block';
            startGame();
        }
    });
}

// Export necessary functions
window.updateGameResult = updateGameResult;
