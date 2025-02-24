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

// Game state variables
let selectedPiece = null;
let moveHistory = [];
let gameState = 'active';
let lastMove = null;
let hoveredSquare = null;
let selectedDifficulty = null;
let gameDifficulty = 'easy';

// Make core game state globally available
window.initialBoard = initialBoard;
window.board = JSON.parse(JSON.stringify(initialBoard));
window.currentPlayer = 'blue';
window.isMultiplayerMode = false;
window.playerColor = null;

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

// AI evaluation constants
const PIECE_VALUES = {
    'p': 100,  // Pawn
    'n': 320,  // Knight
    'b': 330,  // Bishop
    'r': 500,  // Rook
    'q': 900,  // Queen
    'k': 20000 // King
};

const POSITION_WEIGHTS = {
    pawn: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5,  10, 25, 25, 10,  5,  5],
        [0,  0,  0,  20, 20,  0,  0,  0],
        [5, -5, -10,  0,  0, -10, -5,  5],
        [5, 10, 10, -20, -20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    knight: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20,  0,  0,  0,  0, -20, -40],
        [-30,  0, 10, 15, 15, 10,  0, -30],
        [-30,  5, 15, 20, 20, 15,  5, -30],
        [-30,  0, 15, 20, 20, 15,  0, -30],
        [-30,  5, 10, 15, 15, 10,  5, -30],
        [-40, -20,  0,  5,  5,  0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    bishop: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10,  0,  0,  0,  0,  0,  0, -10],
        [-10,  0,  5, 10, 10,  5,  0, -10],
        [-10,  5,  5, 10, 10,  5,  5, -10],
        [-10,  0, 10, 10, 10, 10,  0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10,  5,  0,  0,  0,  0,  5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    queen: [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10,  0,  0,  0,  0,  0,  0, -10],
        [-10,  0,  5,  5,  5,  5,  0, -10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0, -10],
        [-10,  0,  5,  0,  0,  0,  0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    king: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [20,  20,   0,   0,   0,   0,  20,  20],
        [20,  30,  10,   0,   0,  10,  30,  20]
    ]
};

// Make piece images globally available
window.pieceImages = pieceImages;

// Core utility functions
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

// Add new function for difficulty button management
function updateDifficultyButtons(difficultySelected) {
    const easyBtn = document.getElementById('easy-mode');
    const hardBtn = document.getElementById('hard-mode');
    const startBtn = document.getElementById('start-game');
    
    if (easyBtn && hardBtn && startBtn) {
        if (difficultySelected === 'easy') {
            easyBtn.classList.add('selected');
            hardBtn.classList.remove('selected');
        } else if (difficultySelected === 'hard') {
            hardBtn.classList.add('selected');
            easyBtn.classList.remove('selected');
        } else {
            easyBtn.classList.remove('selected');
            hardBtn.classList.remove('selected');
        }
        startBtn.disabled = !difficultySelected;
        
        // Force button styles
        startBtn.style.cssText = startBtn.disabled ? 
            'opacity: 0.5; cursor: not-allowed; pointer-events: none;' :
            'opacity: 1; cursor: pointer; pointer-events: auto;';
    }
}

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

// Make core functions globally available
window.getPieceColor = getPieceColor;
window.getPieceName = getPieceName;
window.isWithinBoard = isWithinBoard;
window.coordsToAlgebraic = coordsToAlgebraic;
window.updateDifficultyButtons = updateDifficultyButtons;

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

// Make placePieces globally available
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

function highlightSquare(row, col, isCapture = false) {
    const square = document.createElement('div');
    square.className = 'highlight' + (isCapture ? ' capture' : '');
    square.style.left = `${col * 12.5}%`;
    square.style.top = `${row * 12.5}%`;
    square.setAttribute('data-row', row);
    square.setAttribute('data-col', col);
    
    square.addEventListener('click', () => onSquareClick(row, col));
    
    document.getElementById('chessboard').appendChild(square);
}

function removeHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => highlight.remove());
}

window.removeHighlights = removeHighlights;
window.highlightSquare = highlightSquare;

// Board state helper functions
function getValidMoves(row, col) {
    const piece = window.board[row][col];
    if (!piece) return [];

    const moves = [];
    for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
        for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
            if (canPieceMove(piece, row, col, endRow, endCol)) {
                moves.push({ row: endRow, col: endCol });
            }
        }
    }
    return moves;
}

window.getValidMoves = getValidMoves;

function showLegalMoves(row, col) {
    const validMoves = getValidMoves(row, col);
    validMoves.forEach(move => {
        const isCapture = window.board[move.row][move.col] !== null;
        highlightSquare(move.row, move.col, isCapture);
    });
}

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    
    // Position dialog based on promotion square
    dialog.style.top = `${endRow * 12.5}%`;
    dialog.style.left = `${endCol * 12.5}%`;
    
    const pieces = ['q', 'r', 'n', 'b'];
    const currentColor = window.currentPlayer;
    
    pieces.forEach(piece => {
        const pieceButton = document.createElement('div');
        pieceButton.className = 'promotion-piece';
        const promotedPiece = currentColor === 'blue' ? piece : piece.toUpperCase();
        pieceButton.style.backgroundImage = `url('${pieceImages[promotedPiece]}')`;
        
        pieceButton.onclick = () => {
            executeMove(startRow, startCol, endRow, endCol, promotedPiece);
            dialog.remove();
        };
        
        dialog.appendChild(pieceButton);
    });
    
    document.getElementById('chessboard').appendChild(dialog);
}

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
            window.board[startRow][endCol] = null; // Remove captured pawn
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
    const rowStep = Math.sign(endRow - startRow) || 0;
    const colStep = Math.sign(endCol - startCol) || 0;
    
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
window.canPieceMove = canPieceMove;

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
    
    // Find king position
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
window.isSquareUnderAttack = isSquareUnderAttack;
window.isKingInCheck = isKingInCheck;
window.wouldMoveExposeCheck = wouldMoveExposeCheck;
window.isCheckmate = isCheckmate;
window.isStalemate = isStalemate;
window.hasLegalMoves = hasLegalMoves;
window.getAllLegalMoves = getAllLegalMoves;

// AI Move Selection and Evaluation
function makeAIMove() {
    debug('Making AI move...');
    if (currentGameMode !== GameMode.AI || window.currentPlayer !== 'red' || window.isMultiplayerMode) {
        debug('Conditions not met for AI move');
        return;
    }
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    const move = selectBestMove();
    if (move) {
        debug('AI selected move: ' + JSON.stringify(move));
        setTimeout(() => {
            executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
        }, 500);
    } else {
        debug('No legal moves available for AI');
        if (isCheckmate('red')) {
            endGame('blue');
        } else if (isStalemate('red')) {
            endGame('draw');
        }
    }
}

window.makeAIMove = makeAIMove;

function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    const inCheck = isKingInCheck('red');
    if (inCheck) {
        for (const move of legalMoves) {
            if (doesMoveEscapeCheck(move)) return move;
        }
    }

    // Move ordering
    legalMoves.sort((a, b) => {
        const aScore = (a.isCapture ? PIECE_VALUES[window.board[a.endRow][a.endCol]?.toLowerCase() || 0] : 0) + 
                       (wouldMovePutInCheck(a, 'blue') ? 100 : 0);
        const bScore = (b.isCapture ? PIECE_VALUES[window.board[b.endRow][b.endCol]?.toLowerCase() || 0] : 0) + 
                       (wouldMovePutInCheck(b, 'blue') ? 100 : 0);
        return bScore - aScore;
    });

    if (gameDifficulty === 'hard') {
        let bestMove = null;
        let bestScore = -Infinity;
        const alpha = -Infinity, beta = Infinity;

        for (const move of legalMoves) {
            const score = minimax(move, 2, false, alpha, beta); // Depth 2 (3-ply)
            debug(`Evaluated move ${move.piece}${coordsToAlgebraic(move.startRow, move.startCol)}-${coordsToAlgebraic(move.endRow, move.endCol)}: score=${score}`);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
                bestMove.score = score; // Store the score in the move object
            }
        }
        return bestMove;
    } else {
        legalMoves.forEach(move => {
            move.score = evaluateEasyMove(move);
        });
        legalMoves.sort((a, b) => b.score - a.score);
        const topMoves = legalMoves.slice(0, Math.min(3, legalMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
}

function minimax(move, depth, isMaximizing, alpha, beta) {
    const originalPiece = window.board[move.endRow][move.endCol];
    window.board[move.endRow][move.endCol] = move.piece;
    window.board[move.startRow][move.startCol] = null;

    let score;
    if (depth === 0 || isCheckmate(isMaximizing ? 'blue' : 'red')) {
        score = evaluateBoard('red');
    } else {
        const moves = getAllLegalMoves(isMaximizing ? 'blue' : 'red');
        if (moves.length === 0) {
            score = isKingInCheck(isMaximizing ? 'blue' : 'red') ? 
                    (isMaximizing ? -10000 : 10000) : 0;
        } else if (isMaximizing) {
            score = -Infinity;
            for (const nextMove of moves) {
                score = Math.max(score, minimax(nextMove, depth - 1, false, alpha, beta));
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
        } else {
            score = Infinity;
            for (const nextMove of moves) {
                score = Math.min(score, minimax(nextMove, depth - 1, true, alpha, beta));
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
        }
    }

    window.board[move.startRow][move.startCol] = move.piece;
    window.board[move.endRow][move.endCol] = originalPiece;
    return score;
}

function evaluateBoard(color) {
    let score = 0;
    const opponentColor = color === 'red' ? 'blue' : 'red';

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = window.board[r][c];
            if (piece) {
                const move = { piece, startRow: r, startCol: c, endRow: r, endCol: c, isCapture: false };
                const value = evaluateHardMove(move);
                score += (getPieceColor(piece) === color) ? value : -value;
            }
        }
    }

    // Penalize opponent pawn promotion threats
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (window.board[1][c] === 'p') score -= 100; // Blue pawn on 7th rank
        if (window.board[6][c] === 'P') score += 100; // Red pawn on 2nd rank
    }

    // Adjust for check/checkmate
    if (isKingInCheck(color)) score -= 50;
    if (isKingInCheck(opponentColor)) score += 50;

    // Endgame king activity
    if (isInEndgame()) {
        const kingPos = findKing(color);
        score += (4 - Math.abs(kingPos.row - 3.5)) * 20 + (4 - Math.abs(kingPos.col - 3.5)) * 20;
    }

    return score;
}

// Helper to find king position
function findKing(color) {
    const kingPiece = color === 'blue' ? 'k' : 'K';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (window.board[r][c] === kingPiece) return { row: r, col: c };
        }
    }
    return { row: 0, col: 0 }; // Fallback (shouldn’t happen)
}

function doesMoveEscapeCheck(move) {
    const originalPiece = window.board[move.endRow][move.endCol];
    const movingPiece = window.board[move.startRow][move.startCol];
    window.board[move.endRow][move.endCol] = movingPiece;
    window.board[move.startRow][move.startCol] = null;
    const stillInCheck = isKingInCheck('red');
    window.board[move.startRow][move.startCol] = movingPiece;
    window.board[move.endRow][move.endCol] = originalPiece;
    return !stillInCheck;
}

function evaluateEasyMove(move) {
    let score = 0;
    
    if (move.isCapture) {
        const capturedPiece = window.board[move.endRow][move.endCol];
        score += PIECE_VALUES[capturedPiece.toLowerCase()] * 2;
    }
    
    if (move.piece.toLowerCase() === 'p') {
        score += (7 - move.endRow) * 10;
        if (move.endCol >= 3 && move.endCol <= 4) {
            score += 20;
        }
    }
    
    if (move.startRow <= 1 && move.endRow > 1) {
        score += 15;
    }
    
    score += Math.random() * 50;
    
    return score;
}

function evaluateHardMove(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();
    const color = getPieceColor(move.piece);
    
    // Material evaluation
    if (move.isCapture) {
        const capturedPiece = window.board[move.endRow][move.endCol].toLowerCase();
        score += PIECE_VALUES[capturedPiece] * 1.5;
        if (PIECE_VALUES[piece] < PIECE_VALUES[capturedPiece]) {
            score += (PIECE_VALUES[capturedPiece] - PIECE_VALUES[piece]);
        }
    }

    // Position evaluation
    const pieceType = piece === 'k' ? 'king' : piece === 'q' ? 'queen' : 
                     piece === 'b' ? 'bishop' : piece === 'n' ? 'knight' : 
                     piece === 'p' ? 'pawn' : null;
    if (pieceType && POSITION_WEIGHTS[pieceType]) {
        score += POSITION_WEIGHTS[pieceType][move.endRow][move.endCol];
    }

    // Enhanced strategy evaluations
    score += evaluatePieceStrategy(move);
    score += evaluatePositionalStrategy(move);
    score += evaluateKingSafety(move);
    score += evaluateThreats(move); // New: Reward threats to opponent pieces

    if (isInEndgame()) {
        score += evaluateEndgameStrategy(move);
    }

    return score;
}

function evaluatePieceStrategy(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();

    switch (piece) {
        case 'p':
            if (isPawnPassed(move.endRow, move.endCol)) score += 50;
            if (hasConnectedPawn(move.endRow, move.endCol)) score += 30;
            if (hasPawnInFile(move.endCol)) score -= 30;
            break;
        case 'n':
            score += (4 - Math.abs(move.endRow - 3.5)) * 10;
            score += (4 - Math.abs(move.endCol - 3.5)) * 10;
            if (isKnightOutpost(move.endRow, move.endCol)) score += 40;
            break;
        case 'b':
            if (Math.abs(move.endRow - move.endCol) === 7 || 
                Math.abs(move.endRow - (7 - move.endCol)) === 7) score += 30;
            if (hasBishopPair()) score += 50;
            break;
        case 'r':
            if (isFileOpen(move.endCol)) score += 40;
            if (move.endRow === 1) score += 50;
            break;
        case 'q':
            score += countQueenMobility(move.endRow, move.endCol) * 4;
            if (getMoveCount() < 10) score -= 30;
            break;
        case 'k':
            if (!isInEndgame()) score -= Math.min(distanceFromEdge(move.endRow, move.endCol) * 10, 50);
            break;
    }
    return score;
}

function evaluatePositionalStrategy(move) {
    let score = 0;
    if (move.endRow >= 2 && move.endRow <= 5 && move.endCol >= 2 && move.endCol <= 5) score += 30;
    if (move.startRow <= 1 && move.endRow > 1) score += 20;
    if (isKeySquare(move.endRow, move.endCol)) score += 25;
    return score;
}

function evaluateEndgameStrategy(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();
    if (piece === 'k') {
        score += (4 - Math.abs(move.endRow - 3.5)) * 10;
        score += (4 - Math.abs(move.endCol - 3.5)) * 10;
    }
    if (piece === 'p' && isPawnPassed(move.endRow, move.endCol)) {
        score += (7 - move.endRow) * 20;
    }
    return score;
}

function evaluateKingSafety(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();
    const color = getPieceColor(move.piece);
    
    if (piece === 'k') {
        if (!isInEndgame()) {
            const distance = distanceFromEdge(move.endRow, move.endCol);
            score -= distance * 10;
        }
        if (isSquareUnderAttack(move.endRow, move.endCol, color === 'blue' ? 'red' : 'blue')) {
            score -= 20;
        }
    }
    return score;
}

function evaluateThreats(move) {
    let score = 0;
    const color = getPieceColor(move.piece);
    const opponentColor = color === 'blue' ? 'red' : 'blue';
    const endRow = move.endRow, endCol = move.endCol;

    // Simulate move temporarily
    const originalPiece = window.board[endRow][endCol];
    window.board[endRow][endCol] = move.piece;
    window.board[move.startRow][move.startCol] = null;

    // Check threats to opponent pieces
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const target = window.board[r][c];
            if (target && getPieceColor(target) === opponentColor && 
                canPieceMove(move.piece, endRow, endCol, r, c, false)) {
                score += PIECE_VALUES[target.toLowerCase()] * 0.5; // Half value for threat
            }
        }
    }

    // Restore board
    window.board[move.startRow][move.startCol] = move.piece;
    window.board[endRow][endCol] = originalPiece;

    return score;
}

// AI Helper Functions
function isPawnPassed(row, col) {
    const color = getPieceColor(window.board[row][col]);
    const direction = color === 'blue' ? -1 : 1;
    for (let r = row + direction; r >= 0 && r < BOARD_SIZE; r += direction) {
        if (window.board[r][col] && getPieceColor(window.board[r][col]) !== color) {
            return false;
        }
    }
    return true;
}

function hasConnectedPawn(row, col) {
    const color = getPieceColor(window.board[row][col]);
    const adjacentCols = [col - 1, col + 1];
    for (let c of adjacentCols) {
        if (isWithinBoard(row, c) && window.board[row][c] === (color === 'blue' ? 'p' : 'P')) {
            return true;
        }
    }
    return false;
}

function hasPawnInFile(col) {
    const color = window.currentPlayer;
    let pawnCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (window.board[r][col] === (color === 'blue' ? 'p' : 'P')) {
            pawnCount++;
            if (pawnCount > 1) return true;
        }
    }
    return false;
}

function isKnightOutpost(row, col) {
    const color = getPieceColor(window.board[row][col]);
    const pawnColor = color === 'blue' ? 'P' : 'p';
    const direction = color === 'blue' ? 1 : -1;
    
    const supportingPawn = isWithinBoard(row + direction, col) && 
        window.board[row + direction][col] === (color === 'blue' ? 'p' : 'P');
    const enemyPawnAttack = 
        (isWithinBoard(row - direction, col - 1) && window.board[row - direction][col - 1] === pawnColor) ||
        (isWithinBoard(row - direction, col + 1) && window.board[row - direction][col + 1] === pawnColor);
    
    return supportingPawn && !enemyPawnAttack;
}

function hasBishopPair() {
    let blueBishops = 0, redBishops = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (window.board[r][c] === 'b') blueBishops++;
            if (window.board[r][c] === 'B') redBishops++;
        }
    }
    return (window.currentPlayer === 'blue' && blueBishops >= 2) || 
           (window.currentPlayer === 'red' && redBishops >= 2);
}

function isFileOpen(col) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (window.board[r][col] === 'p' || window.board[r][col] === 'P') {
            return false;
        }
    }
    return true;
}

function countQueenMobility(row, col) {
    let moves = 0;
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1], // Rook-like
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop-like
    ];
    
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        while (isWithinBoard(r, c)) {
            moves++;
            if (window.board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return moves;
}

function getMoveCount() {
    return moveHistory.length;
}

function isKeySquare(row, col) {
    const keySquares = [
        [3, 3], [3, 4], [4, 3], [4, 4] // d4, d5, e4, e5
    ];
    return keySquares.some(([r, c]) => r === row && c === col);
}

function distanceFromEdge(row, col) {
    const rowDist = Math.min(row, BOARD_SIZE - 1 - row);
    const colDist = Math.min(col, BOARD_SIZE - 1 - col);
    return Math.min(rowDist, colDist);
}

function isInEndgame() {
    let pieceCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = window.board[r][c];
            if (piece && piece.toLowerCase() !== 'k' && piece.toLowerCase() !== 'p') {
                pieceCount++;
            }
        }
    }
    return pieceCount <= 6;
}

function wouldMovePutInCheck(move, opponentColor) {
    const originalPiece = window.board[move.endRow][move.endCol];
    window.board[move.endRow][move.endCol] = move.piece;
    window.board[move.startRow][move.startCol] = null;
    const inCheck = isKingInCheck(opponentColor);
    window.board[move.startRow][move.startCol] = move.piece;
    window.board[move.endRow][move.endCol] = originalPiece;
    return inCheck;
}

// UI Event Handlers
function onPieceClick(event) {
    try {
        if (!checkGameAccess()) return;
        
        if (window.isMultiplayerMode && window.multiplayerManager) {
            return; // Let multiplayer manager handle the click
        } else if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') {
            return;
        }
        
        if (gameState !== 'active' && gameState !== 'check') return;
        
        const clickedPiece = event.target;
        const row = parseInt(clickedPiece.getAttribute('data-row'));
        const col = parseInt(clickedPiece.getAttribute('data-col'));
        const piece = window.board[row][col];
        const pieceColor = getPieceColor(piece);

        if (selectedPiece && pieceColor !== window.currentPlayer) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            if (canPieceMove(window.board[startRow][startCol], startRow, startCol, row, col)) {
                executeMove(startRow, startCol, row, col);
            }
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
            return;
        }
        
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            removeHighlights();
        }
        
        if (pieceColor === window.currentPlayer) {
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

function onSquareClick(row, col) {
    try {
        if (window.isMultiplayerMode && window.multiplayerManager) {
            return; // Let multiplayer manager handle clicks
        } else if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') {
            return;
        }
        
        if (gameState !== 'active' && gameState !== 'check') return;
        
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = window.board[startRow][startCol];
            
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
        debug(`Square click error: ${error.message}`);
    }
}

function addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece) {
    const move = {
        piece,
        startRow,
        startCol,
        endRow,
        endCol,
        capturedPiece,
        notation: `${getPieceName(piece)}${coordsToAlgebraic(startRow, startCol)}${capturedPiece ? 'x' : '-'}${coordsToAlgebraic(endRow, endCol)}`
    };
    moveHistory.push(move);
    lastMove = move;
    debug(`Move recorded: ${move.notation}`);
}

function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    const piece = window.board[startRow][startCol];
    const color = getPieceColor(piece);
    const capturedPiece = window.board[endRow][endCol];
    
    if (promotionPiece) {
        window.board[endRow][endCol] = promotionPiece;
    } else {
        window.board[endRow][endCol] = piece;
    }
    window.board[startRow][startCol] = null;

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

    if (piece.toLowerCase() === 'k') {
        if (color === 'blue') pieceState.blueKingMoved = true;
        else pieceState.redKingMoved = true;
    }
    if (piece.toLowerCase() === 'r') {
        if (color === 'blue') {
            if (startCol === 0) pieceState.blueRooksMove.left = true;
            if (startCol === 7) pieceState.blueRooksMove.right = true;
        } else {
            if (startCol === 0) pieceState.redRooksMove.left = true;
            if (startCol === 7) pieceState.redRooksMove.right = true;
        }
    }

    addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece);
    window.placePieces();
    window.currentPlayer = window.currentPlayer === 'blue' ? 'red' : 'blue';
    
    if (isCheckmate(window.currentPlayer)) {
        endGame(color);
    } else if (isStalemate(window.currentPlayer)) {
        endGame('draw');
    } else if (isKingInCheck(window.currentPlayer)) {
        gameState = 'check';
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)} is in check!`);
    } else {
        gameState = 'active';
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)}'s turn`);
    }

    if (currentGameMode === GameMode.AI && window.currentPlayer === 'red' && !window.isMultiplayerMode) {
        setTimeout(makeAIMove, 500);
    }

    return true;
}

function endGame(winner) {
    gameState = 'ended';
    const message = winner === 'draw' ? "Game ended in a draw" : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    updateStatusDisplay(message);
    debug(`Game ended: ${message}`);
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
    
    debug(`Notifying leaderboard: winner=${winner}, mode=${currentGameMode}, difficulty=${gameDifficulty}`);
    if (typeof window.updateGameResult === 'function') {
        window.updateGameResult({
            winner: winner,
            player: window.currentPlayer === 'blue' ? 'red' : 'blue',
            mode: currentGameMode,
            difficulty: gameDifficulty
        });
        debug('updateGameResult called successfully');
    } else {
        debug('Error: window.updateGameResult not defined');
    }
}

// Event Handlers and Game State Management
function initializeElements() {
    const easyBtn = document.getElementById('easy-mode');
    const hardBtn = document.getElementById('hard-mode');
    const startBtn = document.getElementById('start-game');
    const restartBtn = document.getElementById('restart-game');
    const aiModeBtn = document.getElementById('ai-mode');
    const multiplayerModeBtn = document.getElementById('multiplayer-mode');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const multiplayerMenu = document.querySelector('.multiplayer-menu');
    const chessGame = document.getElementById('chess-game');

    return {
        buttons: { easyBtn, hardBtn, startBtn, restartBtn, aiModeBtn, multiplayerModeBtn },
        screens: { difficultyScreen, multiplayerMenu, chessGame }
    };
}

function setupDifficultyButtons() {
    debug('Setting up difficulty buttons...');
    const elements = initializeElements();
    const { easyBtn, hardBtn, startBtn } = elements.buttons;
    
    if (easyBtn && hardBtn && startBtn) {
        startBtn.disabled = true;
        easyBtn.classList.remove('selected');
        hardBtn.classList.remove('selected');
        easyBtn.style.cssText = `
            display: inline-block !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        hardBtn.style.cssText = easyBtn.style.cssText;
        easyBtn.replaceWith(easyBtn.cloneNode(true));
        hardBtn.replaceWith(hardBtn.cloneNode(true));
        startBtn.replaceWith(startBtn.cloneNode(true));
        const newEasyBtn = document.getElementById('easy-mode');
        const newHardBtn = document.getElementById('hard-mode');
        const newStartBtn = document.getElementById('start-game');

        newEasyBtn.onclick = () => {
            debug('Easy mode selected');
            gameDifficulty = 'easy';
            selectedDifficulty = 'easy';
            newEasyBtn.classList.add('selected');
            newHardBtn.classList.remove('selected');
            newStartBtn.disabled = false;
            newStartBtn.style.cssText = 'opacity: 1; cursor: pointer; pointer-events: auto;';
            debug(`Difficulty set to: ${gameDifficulty}`);
        };

        newHardBtn.onclick = () => {
            debug('Hard mode selected');
            gameDifficulty = 'hard';
            selectedDifficulty = 'hard';
            newHardBtn.classList.add('selected');
            newEasyBtn.classList.remove('selected');
            newStartBtn.disabled = false;
            newStartBtn.style.cssText = 'opacity: 1; cursor: pointer; pointer-events: auto;';
            debug(`Difficulty set to: ${gameDifficulty}`);
        };

        newStartBtn.onclick = () => {
            if (selectedDifficulty) {
                debug(`Starting game with ${selectedDifficulty} difficulty`);
                elements.screens.difficultyScreen.style.display = 'none';
                elements.screens.chessGame.style.display = 'block';
                startGame();
            }
        };

        debug('Difficulty buttons setup complete');
    } else {
        debug('Error: Could not find all difficulty buttons');
    }
}

function setupModeButtons() {
    debug('Setting up mode buttons...');
    const elements = initializeElements();
    const { aiModeBtn, multiplayerModeBtn } = elements.buttons;
    const { difficultyScreen, multiplayerMenu, chessGame } = elements.screens;

    if (aiModeBtn && multiplayerModeBtn) {
        aiModeBtn.onclick = () => {
            debug('Switching to AI mode');
            currentGameMode = GameMode.AI;
            window.isMultiplayerMode = false;
            aiModeBtn.classList.add('selected');
            multiplayerModeBtn.classList.remove('selected');
            if (difficultyScreen) {
                difficultyScreen.style.display = 'flex';
                setupDifficultyButtons();
            }
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (chessGame) chessGame.style.display = 'none';
        };

        multiplayerModeBtn.onclick = () => {
            debug('Switching to multiplayer mode');
            currentGameMode = GameMode.ONLINE;
            window.isMultiplayerMode = true;
            multiplayerModeBtn.classList.add('selected');
            aiModeBtn.classList.remove('selected');
            if (difficultyScreen) difficultyScreen.style.display = 'none';
            if (multiplayerMenu) multiplayerMenu.style.display = 'block';
            if (chessGame) chessGame.style.display = 'none';
        };

        debug('Mode buttons setup complete');
    } else {
        debug('Error: Could not find mode buttons');
    }
}

function startGame() {
    try {
        debug("\n----- Starting new game -----");
        if (!checkGameAccess()) {
            return;
        }
        
        if (!isGameInitialized) {
            resetGame();
            initGame();
            isGameInitialized = true;
        }
        
        if (window.isMultiplayerMode) {
            return;
        }
        
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

        createBoard();
        window.placePieces();
        updateStatusDisplay("Blue's turn");
        debug(`New game started - ${gameDifficulty} mode`);
        
        const moveHistoryElement = document.getElementById('move-history');
        if (moveHistoryElement) {
            moveHistoryElement.innerHTML = '';
        }

        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'auto';
        }
        
        const elements = initializeElements();
        if (elements.buttons.startBtn) {
            elements.buttons.startBtn.style.cssText = 'opacity: 1; cursor: pointer; pointer-events: auto;';
        }
        
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
        setupDifficultyButtons();
        
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
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && selectedPiece) {
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            }
        });

        setupModeButtons();
        setupDifficultyButtons();
        
        const elements = initializeElements();
        if (elements.buttons.restartBtn) {
            elements.buttons.restartBtn.onclick = () => {
                if (currentGameMode === GameMode.AI) {
                    startGame();
                }
            };
        }
        
        const style = document.createElement('style');
        style.textContent = `
            .difficulty-btn {
                display: inline-block !important;
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
            .difficulty-btn.selected {
                background: rgba(153, 69, 255, 0.4) !important;
                transform: scale(1.05) !important;
                box-shadow: 0 0 25px rgba(153, 69, 255, 0.5) !important;
            }
            #start-game:not(:disabled) {
                opacity: 1 !important;
                cursor: pointer !important;
                pointer-events: auto !important;
            }
            #start-game:disabled {
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);
        
        debug('Game initialization completed successfully');
    } catch (error) {
        console.error("Error during game initialization:", error);
        debug(`Error during game initialization: ${error.message}`);
    }
}

// Make initialization functions globally available
window.startGame = startGame;
window.initGame = initGame;
window.resetGame = resetGame;

// Initialize game when window loads
window.addEventListener('DOMContentLoaded', () => {
    debug('DOM Content Loaded - Initializing game...');
    initGame();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debug('Document already loaded - Running backup initialization...');
    initGame();
}