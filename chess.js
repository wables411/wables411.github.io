// Game modes and state
const GameMode = {
    AI: 'ai',
    ONLINE: 'online'
};

// Game initialization flags
let isGameInitialized = false;
let currentGameMode = GameMode.AI;
let multiplayerManager = null;
let isMultiplayerMode = false;
let playerColor = null;

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

// Make core game state globally available
window.initialBoard = initialBoard;
window.board = JSON.parse(JSON.stringify(initialBoard));
window.currentPlayer = 'blue';
window.isMultiplayerMode = false;
window.playerColor = null;

// Game state variables
let selectedPiece = null;
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

// Make piece images globally available
window.pieceImages = pieceImages;

// Core utility functions first
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

// Make core functions globally available
window.debug = debug;
window.updateStatusDisplay = updateStatusDisplay;

// Access Functions
function isWalletConnected() {
    return !!localStorage.getItem('currentPlayer');
}

function checkGameAccess() {
    if (!isWalletConnected()) {
        updateStatusDisplay("Connect to play");
        return false;
    }
    return true;
}

// Core game logic functions
function getPieceColor(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'red' : 'blue';
}

function getPieceName(piece) {
    const names = {
        'p': 'pawn', 'r': 'rook', 'n': 'knight',
        'b': 'bishop', 'q': 'queen', 'k': 'king'
    };
    return names[piece.toLowerCase()];
}

function isWithinBoard(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function coordsToAlgebraic(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function getPieceType(piece) {
    return piece.toLowerCase();
}

function getDistanceToFriendlyKing(row, col, color) {
    const kingPiece = color === 'blue' ? 'k' : 'K';
    let kingRow, kingCol;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (window.board[r][c] === kingPiece) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    return Math.max(Math.abs(kingRow - row), Math.abs(kingCol - col));
}

// Board analysis functions
function countDiagonalMoves(row, col) {
    let count = 0;
    const directions = [[1,1], [1,-1], [-1,1], [-1,-1]];
    
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            count++;
            if (window.board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

function countOrthogonalMoves(row, col) {
    let count = 0;
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            count++;
            if (window.board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

function isFileOpen(col) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        const piece = window.board[row][col];
        if (piece && piece.toLowerCase() === 'p') {
            return false;
        }
    }
    return true;
}

function countValidKnightMoves(row, col) {
    const moves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    let count = 0;
    for (const [dr, dc] of moves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isWithinBoard(newRow, newCol) && 
            (!window.board[newRow][newCol] || 
             getPieceColor(window.board[newRow][newCol]) !== 'red')) {
            count++;
        }
    }
    return count;
}

// Board display functions
function placePieces() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) {
        debug('Chessboard element not found');
        return;
    }
    
    try {
        chessboard.innerHTML = '';
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = window.board[row][col];
                if (piece) {
                    const pieceElement = createPieceElement(piece, row, col);
                    chessboard.appendChild(pieceElement);
                }
            }
        }
        debug('Pieces placed successfully');
    } catch (error) {
        console.error('Error in placePieces:', error);
        debug(`Error placing pieces: ${error.message}`);
    }
}

// Important: Make placePieces globally available immediately
window.placePieces = placePieces;

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
        debug(`Error creating board: ${error.message}`);
        throw error;
    }
}

function selectRandomChessboard() {
    const boardCount = 6;
    const boardNumber = Math.floor(Math.random() * boardCount) + 1;
    return `images/chessboard${boardNumber}.png`;
}

// Make core board functions globally available
window.createBoard = createBoard;
window.createPieceElement = createPieceElement;
window.selectRandomChessboard = selectRandomChessboard;
window.getPieceColor = getPieceColor;
window.getPieceName = getPieceName;
window.isWithinBoard = isWithinBoard;

// Game end and state management
async function endGame(winner) {
    try {
        gameState = 'ended';
        const message = winner === 'draw' ? 
            "Game Over - Draw!" : 
            `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
        
        updateStatusDisplay(message);
        
        // Update multiplayer game status if in multiplayer mode
        if (window.isMultiplayerMode && window.multiplayerManager) {
            await window.multiplayerManager.updateGameStatus('completed', winner);
        }

        // Update leaderboard
        if (typeof window.updateGameResult === 'function') {
            window.updateGameResult(winner);
        }
        
        // Disable board interaction
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'none';
        }
    } catch (error) {
        console.error('Error in endGame:', error);
        updateStatusDisplay('Error ending game - please refresh');
    }
}

// Game initialization functions
function startGame() {
    try {
        console.log("Starting game...");
        if (!checkGameAccess()) {
            return;
        }
        
        if (!isGameInitialized) {
            resetGame();
            initGame();
            isGameInitialized = true;
        }
        
        if (window.isMultiplayerMode && window.multiplayerManager) {
            // Let multiplayer manager handle game start
            return;
        }
        
        // Reset game state
        window.board = JSON.parse(JSON.stringify(initialBoard));
        window.currentPlayer = 'blue';
        selectedPiece = null;
        moveHistory = [];
        gameState = 'active';
        lastMove = null;
        
        // Reset piece states
        Object.assign(pieceState, {
            blueKingMoved: false,
            redKingMoved: false,
            blueRooksMove: { left: false, right: false },
            redRooksMove: { left: false, right: false },
            lastPawnDoubleMove: null
        });

        // Update display
        createBoard();
        window.placePieces();
        updateStatusDisplay("Blue's turn");
        debug(`New game started - ${gameDifficulty} mode`);
        
        // Clear move history display
        const moveHistoryElement = document.getElementById('move-history');
        if (moveHistoryElement) {
            moveHistoryElement.innerHTML = '';
        }

        // Enable board interactions
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'auto';
        }

        debug('Game started successfully');
    } catch (error) {
        console.error("Error starting game:", error);
        debug(`Error starting game: ${error.message}`);
    }
}

function resetGame() {
    try {
        debug('\n----- Game Reset -----');
        
        window.board = JSON.parse(JSON.stringify(initialBoard));
        window.currentPlayer = 'blue';
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
        
        updateStatusDisplay("Connect to play");
        const moveHistoryElement = document.getElementById('move-history');
        if (moveHistoryElement) moveHistoryElement.innerHTML = '';
        
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'auto';
            chessboard.innerHTML = '';
        }
        
        debug('Game reset completed');
    } catch (error) {
        console.error("Error resetting game:", error);
        debug(`Error resetting game: ${error.message}`);
    }
}

function initGame() {
    try {
        debug('\n----- Game Initialization -----');
        createBoard();
        window.placePieces();
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && selectedPiece) {
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            }
        });
        
        // Initialize multiplayer if needed
        if (window.isMultiplayerMode && !window.multiplayerManager) {
            initializeMultiplayer();
        }
        
        debug('Game initialization completed successfully');
    } catch (error) {
        console.error("Error during game initialization:", error);
        debug(`Error during game initialization: ${error.message}`);
    }
}

// Make game state management functions globally available
window.endGame = endGame;
window.startGame = startGame;
window.resetGame = resetGame;
window.initGame = initGame;

// Game mode control functions
function initGameModeControls() {
    const aiModeBtn = document.getElementById('ai-mode');
    const multiplayerModeBtn = document.getElementById('multiplayer-mode');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const multiplayerMenu = document.querySelector('.multiplayer-menu');

    if (aiModeBtn && multiplayerModeBtn) {
        aiModeBtn.addEventListener('click', () => {
            currentGameMode = GameMode.AI;
            window.isMultiplayerMode = false;
            aiModeBtn.classList.add('selected');
            if (multiplayerModeBtn) multiplayerModeBtn.classList.remove('selected');
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (difficultyScreen) difficultyScreen.style.display = 'flex';
            if (window.multiplayerManager) {
                window.multiplayerManager.leaveGame();
            }
        });

        multiplayerModeBtn.addEventListener('click', () => {
            currentGameMode = GameMode.ONLINE;
            window.isMultiplayerMode = true;
            multiplayerModeBtn.classList.add('selected');
            if (aiModeBtn) aiModeBtn.classList.remove('selected');
            if (difficultyScreen) difficultyScreen.style.display = 'none';
            if (multiplayerMenu) multiplayerMenu.style.display = 'block';
            initializeMultiplayer();
        });
    }
}

function initializeMultiplayer() {
    if (!window.multiplayerManager) {
        window.multiplayerManager = new MultiplayerManager();
    }
}

function initDifficultySelection() {
    try {
        debug('\n----- Initializing Difficulty Selection -----');
        
        const elements = {
            easyBtn: document.getElementById('easy-mode'),
            hardBtn: document.getElementById('hard-mode'),
            startBtn: document.getElementById('start-game'),
            difficultyScreen: document.getElementById('difficulty-screen'),
            chessGame: document.getElementById('chess-game')
        };
        
        Object.entries(elements).forEach(([name, element]) => {
            debug(`${name} found: ${!!element}`);
            if (!element) throw new Error(`${name} not found`);
        });
        
        elements.startBtn.disabled = true;
        selectedDifficulty = null;

        elements.easyBtn.addEventListener('click', () => {
            debug('Easy mode clicked');
            gameDifficulty = 'easy';
            selectedDifficulty = 'easy';
            elements.easyBtn.classList.add('selected');
            elements.hardBtn.classList.remove('selected');
            elements.startBtn.disabled = false;
        });

        elements.hardBtn.addEventListener('click', () => {
            debug('Hard mode clicked');
            gameDifficulty = 'hard';
            selectedDifficulty = 'hard';
            elements.hardBtn.classList.add('selected');
            elements.easyBtn.classList.remove('selected');
            elements.startBtn.disabled = false;
        });

        elements.startBtn.addEventListener('click', () => {
            if (selectedDifficulty) {
                debug(`Starting game with ${selectedDifficulty} difficulty`);
                elements.difficultyScreen.style.display = 'none';
                elements.chessGame.style.display = 'block';
                startGame();
            }
        });
        
        debug('Difficulty selection initialized successfully');
    } catch (error) {
        console.error("Error in initDifficultySelection:", error);
        debug(`Error initializing difficulty selection: ${error.message}`);
    }
}

function initRestartButton() {
    const restartButton = document.getElementById('restart-game');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            console.log("Restart button clicked");
            
            // Handle multiplayer cleanup if needed
            if (window.isMultiplayerMode && window.multiplayerManager) {
                window.multiplayerManager.leaveGame();
            }
            
            const difficultyScreen = document.getElementById('difficulty-screen');
            const chessGame = document.getElementById('chess-game');
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            
            if (difficultyScreen && chessGame) {
                if (window.isMultiplayerMode) {
                    multiplayerMenu.style.display = 'block';
                    difficultyScreen.style.display = 'none';
                } else {
                    difficultyScreen.style.display = 'flex';
                    multiplayerMenu.style.display = 'none';
                }
                chessGame.style.display = 'none';
            }
            
            selectedDifficulty = null;
            const easyBtn = document.getElementById('easy-mode');
            const hardBtn = document.getElementById('hard-mode');
            const startBtn = document.getElementById('start-game');
            
            if (easyBtn && hardBtn && startBtn) {
                easyBtn.classList.remove('selected');
                hardBtn.classList.remove('selected');
                startBtn.disabled = true;
            }
            
            resetGame();
            debug("Game restarted");
        });
    }
}

// Initialize event listeners for the UI
window.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing chess game...");
        initGameModeControls();
        initDifficultySelection();
        initRestartButton();
        
        // Set initial game mode
        const aiModeBtn = document.getElementById('ai-mode');
        if (aiModeBtn) {
            aiModeBtn.classList.add('selected');
        }
        
        debug('Initial setup completed');
    } catch (error) {
        console.error("Error during initialization:", error);
        debug(`Initialization error: ${error.message}`);
    }
});

window.addEventListener('load', function() {
    try {
        debug('\n----- Page Load Initialization -----');
        
        if (isWalletConnected()) {
            const difficultyScreen = document.getElementById('difficulty-screen');
            if (difficultyScreen) {
                difficultyScreen.style.display = 'flex';
            }
        }
        
        initGame();
        debug('Page load initialization completed');
    } catch (error) {
        console.error("Error during page load initialization:", error);
        debug(`Page load error: ${error.message}`);
    }
});

window.addEventListener('beforeunload', function() {
    try {
        if (window.isMultiplayerMode && window.multiplayerManager) {
            window.multiplayerManager.leaveGame();
        }
        
        selectedPiece = null;
        gameState = 'ended';
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
});

// Make initialization functions globally available
window.initGameModeControls = initGameModeControls;
window.initializeMultiplayer = initializeMultiplayer;
window.initDifficultySelection = initDifficultySelection;
window.initRestartButton = initRestartButton;

// Move validation functions
function canMakeMove(startRow, startCol, endRow, endCol) {
    const piece = window.board[startRow][startCol];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    
    // First check if it's this player's turn
    if (color !== window.currentPlayer) return false;
    
    // Then check if it's their piece in multiplayer
    if (window.isMultiplayerMode) {
        if (color !== window.playerColor) return false;
        if (window.currentPlayer !== window.playerColor) return false;
    }
    
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
}

function isValidPawnMove(color, startRow, startCol, endRow, endCol) {
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;
    
    // Captures (including en passant)
    if (Math.abs(colDiff) === 1) {
        if (rowDiff !== direction) return false;
        
        const targetPiece = window.board[endRow][endCol];
        
        // Normal capture
        if (targetPiece && getPieceColor(targetPiece) !== color) {
            return true;
        }
        
        // En passant
        if (!targetPiece && lastMove && 
            lastMove.piece.toLowerCase() === 'p' &&
            lastMove.endRow === startRow &&
            lastMove.endCol === endCol &&
            Math.abs(lastMove.startRow - lastMove.endRow) === 2) {
            return true;
        }
        
        return false;
    }
    
    // Forward moves
    if (colDiff !== 0 || window.board[endRow][endCol]) return false;
    
    // Single square forward
    if (rowDiff === direction) {
        return true;
    }
    
    // Initial two-square move
    if (startRow === startingRow && 
        rowDiff === 2 * direction && 
        !window.board[startRow + direction][startCol]) {
        return true;
    }
    
    return false;
}

function isValidRookMove(startRow, startCol, endRow, endCol) {
    if (startRow !== endRow && startCol !== endCol) return false;
    return isPathClear(startRow, startCol, endRow, endCol);
}

function isValidKnightMove(startRow, startCol, endRow, endCol) {
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(startRow, startCol, endRow, endCol) {
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);
    if (rowDiff !== colDiff) return false;
    return isPathClear(startRow, startCol, endRow, endCol);
}

function isValidQueenMove(startRow, startCol, endRow, endCol) {
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);
    if (rowDiff !== colDiff && startRow !== endRow && startCol !== endCol) return false;
    return isPathClear(startRow, startCol, endRow, endCol);
}

function isValidKingMove(color, startRow, startCol, endRow, endCol) {
    const rowDiff = Math.abs(endRow - startRow);
    const colDiff = Math.abs(endCol - startCol);
    
    // Normal king move
    if (rowDiff <= 1 && colDiff <= 1) {
        return true;
    }
    
    // Castling
    if (rowDiff === 0 && colDiff === 2 && !isKingInCheck(color)) {
        const row = color === 'blue' ? 7 : 0;
        if (startRow !== row || startCol !== 4) return false;
        
        if (color === 'blue' && pieceState.blueKingMoved) return false;
        if (color === 'red' && pieceState.redKingMoved) return false;
        
        // Kingside castling
        if (endCol === 6) {
            if ((color === 'blue' && pieceState.blueRooksMove.right) ||
                (color === 'red' && pieceState.redRooksMove.right)) return false;
                
            if (!isPathClear(row, 4, row, 7) || 
                window.board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        // Queenside castling
        if (endCol === 2) {
            if ((color === 'blue' && pieceState.blueRooksMove.left) ||
                (color === 'red' && pieceState.redRooksMove.left)) return false;
                
            if (!isPathClear(row, 0, row, 4) || 
                window.board[row][0] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            return !isSquareUnderAttack(row, 2, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 3, color === 'blue' ? 'red' : 'blue');
        }
    }
    
    return false;
}

function isPathClear(startRow, startCol, endRow, endCol) {
    const rowStep = Math.sign(endRow - startRow);
    const colStep = Math.sign(endCol - startCol);
    
    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;
    
    while (currentRow !== endRow || currentCol !== endCol) {
        if (window.board[currentRow][currentCol]) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// Make move validation functions globally available
window.canMakeMove = canMakeMove;
window.isValidPawnMove = isValidPawnMove;
window.isValidRookMove = isValidRookMove;
window.isValidKnightMove = isValidKnightMove;
window.isValidBishopMove = isValidBishopMove;
window.isValidQueenMove = isValidQueenMove;
window.isValidKingMove = isValidKingMove;
window.isPathClear = isPathClear;

function canPieceMove(piece, startRow, startCol, endRow, endCol, checkForCheck = true) {
    if (!piece) return false;
    
    const pieceType = piece.toLowerCase();
    const color = getPieceColor(piece);
    
    // Basic validation
    if (!isWithinBoard(endRow, endCol)) return false;
    if (startRow === endRow && startCol === endCol) return false;
    
    const targetPiece = window.board[endRow][endCol];
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

// Check detection
let checkingAttack = false;

function isSquareUnderAttack(row, col, attackingColor) {
    if (checkingAttack) return false;
    checkingAttack = true;
    
    try {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = window.board[r][c];
                if (piece && getPieceColor(piece) === attackingColor) {
                    // Special case for kings to prevent recursion
                    if (piece.toLowerCase() === 'k') {
                        const rowDiff = Math.abs(row - r);
                        const colDiff = Math.abs(col - c);
                        if (rowDiff <= 1 && colDiff <= 1) {
                            return true;
                        }
                        continue;
                    }
                    
                    if (canPieceMove(piece, r, c, row, col, false)) {
                        return true;
                    }
                }
            }
        }
        return false;
    } finally {
        checkingAttack = false;
    }
}

function isKingInCheck(color) {
    const kingPiece = color === 'blue' ? 'k' : 'K';
    let kingRow, kingCol;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (window.board[row][col] === kingPiece) {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    return isSquareUnderAttack(kingRow, kingCol, color === 'blue' ? 'red' : 'blue');
}

function wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color) {
    // Make temporary move
    const originalPiece = window.board[endRow][endCol];
    const movingPiece = window.board[startRow][startCol];
    window.board[endRow][endCol] = movingPiece;
    window.board[startRow][startCol] = null;
    
    const inCheck = isKingInCheck(color);
    
    // Restore board
    window.board[startRow][startCol] = movingPiece;
    window.board[endRow][endCol] = originalPiece;
    
    return inCheck;
}

function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;
    return !hasLegalMoves(color);
}

function isStalemate(color) {
    if (isKingInCheck(color)) return false;
    return !hasLegalMoves(color);
}

function hasLegalMoves(color) {
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = window.board[startRow][startCol];
            if (piece && getPieceColor(piece) === color) {
                for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
                    for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
                        if (canPieceMove(piece, startRow, startCol, endRow, endCol)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function getAllLegalMoves(color) {
    const moves = [];
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = window.board[startRow][startCol];
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
                                isCapture: !!window.board[endRow][endCol]
                            });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

// Make check detection functions globally available
window.canPieceMove = canPieceMove;
window.isSquareUnderAttack = isSquareUnderAttack;
window.isKingInCheck = isKingInCheck;
window.wouldMoveExposeCheck = wouldMoveExposeCheck;
window.isCheckmate = isCheckmate;
window.isStalemate = isStalemate;
window.hasLegalMoves = hasLegalMoves;
window.getAllLegalMoves = getAllLegalMoves;

// UI Event Handlers
function onPieceClick(event) {
    try {
        if (!checkGameAccess()) return;
        
        // Log current state
        console.log('Click state:', {
            isMultiplayerMode: window.isMultiplayerMode,
            currentPlayer: window.currentPlayer,
            playerColor: window.playerColor,
            gameState: gameState
        });

        // Check game mode restrictions
        if (window.isMultiplayerMode) {
            if (window.currentPlayer !== window.playerColor) {
                console.log('Not your turn:', {
                    currentPlayer: window.currentPlayer,
                    playerColor: window.playerColor
                });
                return;
            }
        } else if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') {
            return;
        }
        
        if (gameState !== 'active' && gameState !== 'check') return;
        
        const clickedPiece = event.target;
        const row = parseInt(clickedPiece.getAttribute('data-row'));
        const col = parseInt(clickedPiece.getAttribute('data-col'));
        const pieceType = window.board[row][col];
        
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            removeHighlights();
        }
        
        const pieceColor = getPieceColor(pieceType);
        
        // Validate turn in multiplayer mode
        const validPlayer = window.isMultiplayerMode ? 
            (pieceColor === window.playerColor && window.currentPlayer === window.playerColor) : 
            pieceColor === window.currentPlayer;
            
        if (validPlayer) {
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
        debug(`Piece click error: ${error.message}`);
    }
}

function showLegalMoves(row, col) {
    removeHighlights();
    
    const piece = window.board[row][col];
    if (!piece) return;
    
    for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
        for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
            if (canPieceMove(piece, row, col, endRow, endCol)) {
                const target = window.board[endRow][endCol];
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

window.removeHighlights = removeHighlights;
window.clearHighlights = removeHighlights; 

function onSquareClick(row, col) {
    try {
        // Check game mode restrictions
        if (window.isMultiplayerMode) {
            if (window.currentPlayer !== window.playerColor) return;
        } else if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') {
            return;
        }
        
        if (gameState !== 'active' && gameState !== 'check') return;
        
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = window.board[startRow][startCol];
            
            if (canPieceMove(piece, startRow, startCol, row, col)) {
                if (window.isMultiplayerMode && window.multiplayerManager) {
                    // For multiplayer, use the multiplayer manager's move function
                    if (piece.toLowerCase() === 'p' && (row === 0 || row === 7)) {
                        promptPawnPromotion(startRow, startCol, row, col, true);
                    } else {
                        window.multiplayerManager.makeMove(startRow, startCol, row, col);
                    }
                } else {
                    // For single player, use the normal move execution
                    if (piece.toLowerCase() === 'p' && (row === 0 || row === 7)) {
                        promptPawnPromotion(startRow, startCol, row, col);
                    } else {
                        executeMove(startRow, startCol, row, col);
                    }
                }
            }
            
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
        }
    } catch (error) {
        console.error("Error in onSquareClick:", error);
        debug(`Square click error: ${error.message}`);
    }
}

function promptPawnPromotion(startRow, startCol, endRow, endCol, isMultiplayer = false) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = window.isMultiplayerMode ? window.playerColor : window.currentPlayer;
    
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    
    // Adjust position based on which side is promoting
    if (endRow === 0) { // Blue promoting at top
        dialog.style.top = '12.5%';
    } else { // Red promoting at bottom
        dialog.style.bottom = '12.5%';
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
            if (isMultiplayer && window.multiplayerManager) {
                window.multiplayerManager.makeMove(startRow, startCol, endRow, endCol, promotedPiece);
            } else {
                executeMove(startRow, startCol, endRow, endCol, promotedPiece);
            }
            dialog.remove();
        };
        
        dialog.appendChild(pieceButton);
    });
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.appendChild(dialog);
    }
}

function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    // Handle multiplayer moves
    if (window.isMultiplayerMode && window.multiplayerManager) {
        return window.multiplayerManager.makeMove(startRow, startCol, endRow, endCol, promotionPiece);
    }

    const piece = window.board[startRow][startCol];
    const color = getPieceColor(piece);
    const capturedPiece = window.board[endRow][endCol];
    
    // Update board state
    if (promotionPiece) {
        window.board[endRow][endCol] = promotionPiece;
    } else {
        window.board[endRow][endCol] = piece;
    }
    window.board[startRow][startCol] = null;

    // Handle castling
    if (piece.toLowerCase() === 'k' && Math.abs(endCol - startCol) === 2) {
        const row = color === 'blue' ? 7 : 0;
        if (endCol === 6) { // Kingside
            window.board[row][5] = window.board[row][7];
            window.board[row][7] = null;
        } else if (endCol === 2) { // Queenside
            window.board[row][3] = window.board[row][0];
            window.board[row][0] = null;
        }
    }

    // Save move for en passant detection
    lastMove = {
        piece,
        startRow,
        startCol,
        endRow,
        endCol
    };

    // Update move history and display
    addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece);
    window.placePieces();
    window.currentPlayer = window.currentPlayer === 'blue' ? 'red' : 'blue';
    
    // Check game end conditions and update display
    if (isCheckmate(window.currentPlayer)) {
        endGame(color);
    } else if (isStalemate(window.currentPlayer)) {
        endGame('draw');
    } else if (isKingInCheck(window.currentPlayer)) {
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)} is in check!`);
    } else {
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)}'s turn`);
    }

    // Make AI move if it's AI's turn
    if (currentGameMode === GameMode.AI && window.currentPlayer === 'red' && !window.isMultiplayerMode) {
        setTimeout(makeAIMove, 500);
    }

    return true;
}

function makeAIMove() {
    if (currentGameMode !== GameMode.AI || window.currentPlayer !== 'red' || window.isMultiplayerMode) return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    console.log("Making AI move attempt");
    
    const move = selectBestMove();
    if (move) {
        setTimeout(() => {
            executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
        }, 500);
    } else {
        if (isCheckmate('red')) {
            endGame('blue');
        } else if (isStalemate('red')) {
            endGame('draw');
        }
        console.log("No valid moves found for AI");
    }
}

// Pawn structure analysis
function hasFriendlyPawnNeighbor(row, col) {
    const piece = window.board[row][col];
    if (!piece || piece.toLowerCase() !== 'p') return false;
    
    const color = getPieceColor(piece);
    const files = [col - 1, col + 1];
    
    return files.some(file => {
        if (file < 0 || file >= 8) return false;
        const neighbor = window.board[row][file];
        return neighbor && 
               neighbor.toLowerCase() === 'p' && 
               getPieceColor(neighbor) === color;
    });
}

function isPassedPawn(row, col, color) {
    const piece = window.board[row][col];
    if (!piece || piece.toLowerCase() !== 'p') return false;
    
    const direction = color === 'red' ? 1 : -1;
    const enemyColor = color === 'red' ? 'blue' : 'red';
    
    // Check if there are any enemy pawns in front of this pawn
    // (including diagonally) that could block its advance
    for (let r = row + direction; r >= 0 && r < 8; r += direction) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (c < 0 || c >= 8) continue;
            const square = window.board[r][c];
            if (square && 
                square.toLowerCase() === 'p' && 
                getPieceColor(square) === enemyColor) {
                return false;
            }
        }
    }
    return true;
}

// Additional positional evaluation helpers
function getPieceSquareValue(piece, row, col, isEndgame) {
    const tables = {
        'p': [ // Pawn
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'n': [ // Knight
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'b': [ // Bishop
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        'r': [ // Rook
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        'q': [ // Queen
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,   0,  5,  5,  5,  5,  0, -5],
            [0,    0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        'k': [ // King middlegame
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ],
        'k_endgame': [ // King endgame
            [-50,-40,-30,-20,-20,-30,-40,-50],
            [-30,-20,-10,  0,  0,-10,-20,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-30,  0,  0,  0,  0,-30,-30],
            [-50,-30,-30,-30,-30,-30,-30,-50]
        ]
    };

    const pieceType = piece.toLowerCase();
    let table = tables[pieceType];
    
    if (pieceType === 'k' && isEndgame) {
        table = tables.k_endgame;
    }

    if (!table) return 0;

    // For red pieces, flip the board perspective
    const adjustedRow = getPieceColor(piece) === 'red' ? row : 7 - row;
    return table[adjustedRow][col];
}

// Development and piece coordination
function isPieceTrapped(row, col) {
    const piece = window.board[row][col];
    if (!piece) return false;
    
    const moves = getAllLegalMoves(getPieceColor(piece)).filter(
        move => move.startRow === row && move.startCol === col
    );
    
    return moves.length === 0;
}

// Development scoring
function calculateDevelopmentScore(color) {
    let score = 0;
    const backRank = color === 'red' ? 0 : 7;
    
    // Check if minor pieces have moved from starting squares
    const minorPieces = color === 'red' ? ['N', 'B'] : ['n', 'b'];
    for (let col of [1, 2, 5, 6]) {
        if (window.board[backRank][col] !== minorPieces[col <= 2 ? 1 : 0]) {
            score += 10; // Bonus for developed minor pieces
        }
    }
    
    // Penalize undeveloped pieces in late game
    if (!isEarlyGame()) {
        for (let col = 0; col < 8; col++) {
            const piece = window.board[backRank][col];
            if (piece && piece.toLowerCase() !== 'k' && piece.toLowerCase() !== 'r') {
                score -= 20; // Penalty for pieces still on back rank
            }
        }
    }
    
    return score;
}

// Make these functions globally available
window.hasFriendlyPawnNeighbor = hasFriendlyPawnNeighbor;
window.isPassedPawn = isPassedPawn;
window.getPieceSquareValue = getPieceSquareValue;
window.isPieceTrapped = isPieceTrapped;
window.calculateDevelopmentScore = calculateDevelopmentScore;

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
        debug(`Move history error: ${error.message}`);
    }
}

// AI Move Selection
function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    const inCheck = isKingInCheck('red');

    // If in check, prioritize any move that gets out of check
    if (inCheck) {
        for (const move of legalMoves) {
            // Make temporary move
            const originalPiece = window.board[move.endRow][move.endCol];
            const movingPiece = window.board[move.startRow][move.startCol];
            window.board[move.endRow][move.endCol] = movingPiece;
            window.board[move.startRow][move.startCol] = null;

            // Check if this move escapes check
            const escapesCheck = !isKingInCheck('red');

            // Restore board
            window.board[move.startRow][move.startCol] = movingPiece;
            window.board[move.endRow][move.endCol] = originalPiece;

            if (escapesCheck) {
                return move;
            }
        }
    }

    // Normal move evaluation
    legalMoves.forEach(move => {
        if (gameDifficulty === 'hard') {
            move.score = evaluateHardMove(
                window.board[move.startRow][move.startCol],
                move.startRow, 
                move.startCol,
                move.endRow,
                move.endCol
            );
        } else {
            move.score = evaluateEasyMove(
                window.board[move.startRow][move.startCol],
                move.startRow,
                move.startCol,
                move.endRow,
                move.endCol
            );
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);

    // Select move based on difficulty and situation
    if (inCheck || gameDifficulty === 'hard') {
        // In check or hard mode: usually choose the best move
        return legalMoves[0];
    } else {
        // In easy mode: randomly select from top 3 moves
        const topMoves = legalMoves.slice(0, Math.min(3, legalMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
}

function evaluateEasyMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = window.board[endRow][endCol];
    window.board[endRow][endCol] = piece;
    window.board[startRow][startCol] = null;
    
    // Basic piece values for easy mode
    const pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 20000
    };
    
    // Strongly encourage capturing in easy mode
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()] * 2.0;
        if (piece.toLowerCase() === 'p') {
            score += 400; // Extra bonus for pawn captures
        }
    }
    
    // Simple positional bonuses
    if (piece.toLowerCase() === 'p') {
        score += endRow * 30; // Encourage pawn advancement
        if (endCol >= 3 && endCol <= 4) score += 50; // Center control
    } else if (piece.toLowerCase() !== 'k') {
        // Center control bonus for other pieces
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 40;
        }
    }
    
    // Restore board
    window.board[startRow][startCol] = piece;
    window.board[endRow][endCol] = originalPiece;
    
    // Add significant randomness for easy mode
    score += Math.random() * 150;
    
    return score;
}

function evaluateHardMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    const pieceValues = {
        'p': 100,  // Slightly increased pawn value
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 20000
    };
    
    // Evaluate captures more intelligently
    const originalPiece = window.board[endRow][endCol];
    if (originalPiece) {
        const captureValue = pieceValues[originalPiece.toLowerCase()];
        const attackerValue = pieceValues[piece.toLowerCase()];
        score += captureValue * 1.2; // Base capture value
        if (captureValue > attackerValue) {
            score += (captureValue - attackerValue) * 0.3; // Bonus for favorable trades
        }
    }
    
    // Add positional scores from piece-square tables
    const isEndgame = !isEarlyGame();
    score += getPieceSquareValue(piece, endRow, endCol, isEndgame) * 0.8;
    
    // Piece-specific evaluations
    switch (piece.toLowerCase()) {
        case 'p':
            if (isPassedPawn(endRow, endCol, 'red')) score += 60;
            if (hasFriendlyPawnNeighbor(endRow, endCol)) score += 20;
            score += (endRow - startRow) * 15; // Encourage forward movement
            break;
        case 'n':
            score += (8 - getDistanceToEnemyKing(endRow, endCol, 'blue')) * 10;
            score += countValidKnightMoves(endRow, endCol) * 8;
            break;
        case 'b':
            score += countDiagonalMoves(endRow, endCol) * 6;
            if (isOnLongDiagonal(endRow, endCol)) score += 30;
            break;
        case 'r':
            if (isFileOpen(endCol)) score += 40;
            if (endRow === 6) score += 30; // 7th rank bonus
            score += countOrthogonalMoves(endRow, endCol) * 5;
            break;
        case 'q':
            score += (countDiagonalMoves(endRow, endCol) + 
                     countOrthogonalMoves(endRow, endCol)) * 4;
            score += (8 - getDistanceToEnemyKing(endRow, endCol, 'blue')) * 5;
            break;
        case 'k':
            if (isEndgame) {
                score += (8 - getDistanceToEnemyKing(endRow, endCol, 'blue')) * 15;
            } else {
                score += evaluateKingSafety(endRow, endCol, 'red');
            }
            break;
    }
    
    // Strategic bonuses
    if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
        score += 25; // Control of extended center
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 15; // Extra bonus for central control
        }
    }
    
    // King safety consideration
    if (!isEndgame && !piece.toLowerCase() !== 'k') {
        if (getPieceType(piece) !== 'p') {
            const distanceToOwnKing = getDistanceToFriendlyKing(endRow, endCol, 'red');
            if (distanceToOwnKing <= 2) score += 10; // Bonus for pieces protecting king
        }
    }
    
    // Encourage development in early game
    if (isEarlyGame() && startRow === 0 || startRow === 1) {
        score += 20; // Bonus for moving pieces out
    }
    
    return score;
}

// Positional evaluation helper functions
function evaluatePawnPosition(row, col, color) {
    let score = 0;
    const pawnAdvancement = color === 'red' ? row : 7 - row;
    
    // Reward pawn advancement
    score += pawnAdvancement * 10;
    
    // Center control bonus
    if (col >= 3 && col <= 4) {
        score += 20;
    }
    
    return score;
}

function evaluateKnightPosition(row, col) {
    let score = 0;
    
    // Center control bonus
    const distanceFromCenter = Math.max(Math.abs(3.5 - row), Math.abs(3.5 - col));
    score += (4 - distanceFromCenter) * 10;
    
    // Mobility bonus
    let mobilityCount = 0;
    const moves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of moves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isWithinBoard(newRow, newCol)) mobilityCount++;
    }
    score += mobilityCount * 5;
    
    return score;
}

function getDistanceToEnemyKing(row, col, enemyColor) {
    const kingPiece = enemyColor === 'blue' ? 'k' : 'K';
    let kingRow, kingCol;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (window.board[r][c] === kingPiece) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    return Math.max(Math.abs(kingRow - row), Math.abs(kingCol - col));
}

function evaluateBishopPosition(row, col) {
    return countDiagonalMoves(row, col) * 5;
}

function isOnLongDiagonal(row, col) {
    return Math.abs(row - col) === 0 || Math.abs(row - (7 - col)) === 0;
}

function evaluateRookPosition(row, col, color) {
    let score = 0;
    
    // Open file bonus
    if (isFileOpen(col)) score += 30;
    
    // Seventh rank bonus
    if ((color === 'red' && row === 6) || (color === 'blue' && row === 1)) {
        score += 40;
    }
    
    return score + countOrthogonalMoves(row, col) * 5;
}

function evaluateQueenPosition(row, col) {
    return (countDiagonalMoves(row, col) + countOrthogonalMoves(row, col)) * 5;
}

function evaluateKingPosition(row, col, color) {
    let score = 0;
    
    // Early game: prefer the back rank
    if (isEarlyGame()) {
        score += (color === 'red' ? row : 7 - row) * -20;
    } else {
        // Late game: king should be more active
        const distanceFromCenter = Math.max(Math.abs(3.5 - row), Math.abs(3.5 - col));
        score += (4 - distanceFromCenter) * 10;
    }
    
    return score;
}

function evaluateKingSafety(row, col, color) {
    let score = 0;
    
    // Pawn shield
    const pawnRow = color === 'red' ? row + 1 : row - 1;
    if (pawnRow >= 0 && pawnRow < 8) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (c >= 0 && c < 8) {
                const piece = window.board[pawnRow][c];
                if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) === color) {
                    score += 30;
                }
            }
        }
    }
    
    return score;
}

function evaluateControlOfCenter(row, col) {
    if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
        return (row >= 3 && row <= 4 && col >= 3 && col <= 4) ? 30 : 15;
    }
    return 0;
}

function isEarlyGame() {
    let pieceCount = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (window.board[row][col]) pieceCount++;
        }
    }
    return pieceCount >= 24;
}

// Make positional evaluation functions globally available
window.evaluatePawnPosition = evaluatePawnPosition;
window.evaluateKnightPosition = evaluateKnightPosition;
window.getDistanceToEnemyKing = getDistanceToEnemyKing;
window.evaluateBishopPosition = evaluateBishopPosition;
window.isOnLongDiagonal = isOnLongDiagonal;
window.evaluateRookPosition = evaluateRookPosition;
window.evaluateQueenPosition = evaluateQueenPosition;
window.evaluateKingPosition = evaluateKingPosition;
window.evaluateKingSafety = evaluateKingSafety;
window.evaluateControlOfCenter = evaluateControlOfCenter;
window.isEarlyGame = isEarlyGame;