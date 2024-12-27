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

function findKing(color) {
    const kingPiece = color === 'blue' ? 'k' : 'K';
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (window.board[row][col] === kingPiece) {
                return { row, col };
            }
        }
    }
    return null;
}

function isInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false; // Should never happen in a valid game
    return isSquareUnderAttack(kingPos.row, kingPos.col, color === 'blue' ? 'red' : 'blue');
}

function getAttackingPieces(targetRow, targetCol, attackingColor) {
    const attackers = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = window.board[row][col];
            if (piece && getPieceColor(piece) === attackingColor) {
                if (canPieceMove(piece, row, col, targetRow, targetCol, false)) {
                    attackers.push({ piece, row, col });
                }
            }
        }
    }
    return attackers;
}

function isPinned(row, col) {
    const piece = window.board[row][col];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    const kingPos = findKing(color);
    if (!kingPos) return false;
    
    // Remove the piece temporarily
    const originalPiece = window.board[row][col];
    window.board[row][col] = null;
    
    // Check if the king is now under attack through this square
    const isPinned = isInCheck(color);
    
    // Restore the piece
    window.board[row][col] = originalPiece;
    
    return isPinned;
}

// Make check detection functions globally available
window.isSquareUnderAttack = isSquareUnderAttack;
window.isKingInCheck = isKingInCheck;
window.wouldMoveExposeCheck = wouldMoveExposeCheck;
window.isCheckmate = isCheckmate;
window.isStalemate = isStalemate;
window.hasLegalMoves = hasLegalMoves;
window.getAllLegalMoves = getAllLegalMoves;
window.findKing = findKing;
window.isInCheck = isInCheck;
window.getAttackingPieces = getAttackingPieces;
window.isPinned = isPinned;

// AI Move Selection and Evaluation
function makeAIMove() {
    if (currentGameMode !== GameMode.AI || window.currentPlayer !== 'red' || window.isMultiplayerMode) return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
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
    }
}

window.makeAIMove = makeAIMove;

function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    const inCheck = isKingInCheck('red');

    // If in check, prioritize escaping
    if (inCheck) {
        for (const move of legalMoves) {
            const escapes = doesMoveEscapeCheck(move);
            if (escapes) return move;
        }
    }

    // Evaluate moves based on difficulty
    legalMoves.forEach(move => {
        move.score = gameDifficulty === 'hard' ? 
            evaluateHardMove(move) : 
            evaluateEasyMove(move);
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);

    // Select move based on difficulty
    if (inCheck || gameDifficulty === 'hard') {
        return legalMoves[0]; // Best move
    } else {
        // Random selection from top 3 moves for easy mode
        const topMoves = legalMoves.slice(0, Math.min(3, legalMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
}

function doesMoveEscapeCheck(move) {
    // Make temporary move
    const originalPiece = window.board[move.endRow][move.endCol];
    const movingPiece = window.board[move.startRow][move.startCol];
    window.board[move.endRow][move.endCol] = movingPiece;
    window.board[move.startRow][move.startCol] = null;

    // Check if still in check
    const stillInCheck = isKingInCheck('red');

    // Restore board
    window.board[move.startRow][move.startCol] = movingPiece;
    window.board[move.endRow][move.endCol] = originalPiece;

    return !stillInCheck;
}

function evaluateEasyMove(move) {
    let score = 0;
    
    // Capture value (primary consideration in easy mode)
    if (move.isCapture) {
        const capturedPiece = window.board[move.endRow][move.endCol];
        score += PIECE_VALUES[capturedPiece.toLowerCase()] * 2;
    }
    
    // Simple positional bonuses
    if (move.piece.toLowerCase() === 'p') {
        // Encourage pawn advancement
        score += (7 - move.endRow) * 10;
        
        // Bonus for center control
        if (move.endCol >= 3 && move.endCol <= 4) {
            score += 20;
        }
    }
    
    // Piece development bonus
    if (move.startRow <= 1 && move.endRow > 1) {
        score += 15;
    }
    
    // Add randomness for unpredictability
    score += Math.random() * 50;
    
    return score;
}

function evaluateHardMove(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();
    
    // Material evaluation
    if (move.isCapture) {
        const capturedPiece = window.board[move.endRow][move.endCol].toLowerCase();
        score += PIECE_VALUES[capturedPiece] * 1.5;
        
        // Extra bonus for favorable trades
        if (PIECE_VALUES[piece] < PIECE_VALUES[capturedPiece]) {
            score += (PIECE_VALUES[capturedPiece] - PIECE_VALUES[piece]);
        }
    }

    // Position evaluation
    const pieceType = piece === 'k' ? 'king' : 
                     piece === 'q' ? 'queen' :
                     piece === 'b' ? 'bishop' :
                     piece === 'n' ? 'knight' :
                     piece === 'p' ? 'pawn' : null;
                     
    if (pieceType && POSITION_WEIGHTS[pieceType]) {
        score += POSITION_WEIGHTS[pieceType][move.endRow][move.endCol];
    }

    // Piece-specific strategy
    score += evaluatePieceStrategy(move);
    
    // Development and control
    score += evaluatePositionalStrategy(move);
    
    // King safety
    score += evaluateKingSafety(move);

    // Endgame considerations
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
            // Passed pawn
            if (isPawnPassed(move.endRow, move.endCol)) {
                score += 50;
            }
            // Connected pawns
            if (hasConnectedPawn(move.endRow, move.endCol)) {
                score += 30;
            }
            // Double pawns penalty
            if (hasPawnInFile(move.endCol)) {
                score -= 30;
            }
            break;

        case 'n':
            // Knights near center
            score += (4 - Math.abs(move.endRow - 3.5)) * 10;
            score += (4 - Math.abs(move.endCol - 3.5)) * 10;
            // Outpost positions
            if (isKnightOutpost(move.endRow, move.endCol)) {
                score += 40;
            }
            break;

        case 'b':
            // Bishops on long diagonals
            if (Math.abs(move.endRow - move.endCol) === 7 ||
                Math.abs(move.endRow - (7 - move.endCol)) === 7) {
                score += 30;
            }
            // Bishop pair bonus
            if (hasBishopPair()) {
                score += 50;
            }
            break;

        case 'r':
            // Rooks on open files
            if (isFileOpen(move.endCol)) {
                score += 40;
            }
            // Rooks on seventh rank
            if (move.endRow === 1) {
                score += 50;
            }
            break;

        case 'q':
            // Queen mobility
            score += countQueenMobility(move.endRow, move.endCol) * 4;
            // Penalize early queen development
            if (getMoveCount() < 10) {
                score -= 30;
            }
            break;

        case 'k':
            // King safety in opening/middlegame
            if (!isInEndgame()) {
                score -= Math.min(distanceFromEdge(move.endRow, move.endCol) * 10, 50);
            }
            break;
    }

    return score;
}

function evaluatePositionalStrategy(move) {
    let score = 0;

    // Center control
    if (move.endRow >= 2 && move.endRow <= 5 && move.endCol >= 2 && move.endCol <= 5) {
        score += 30;
    }

    // Development bonus
    if (move.startRow <= 1 && move.endRow > 1) {
        score += 20;
    }

    // Control of key squares
    if (isKeySquare(move.endRow, move.endCol)) {
        score += 25;
    }

    return score;
}

function evaluateKingSafety(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();

    // King position
    const kingPos = findKing('red');
    if (!kingPos) return 0;

    // Pieces defending king
    if (piece !== 'k' && isNearKing(move.endRow, move.endCol, kingPos)) {
        score += 20;
    }

    // Pawn shield
    if (hasKingPawnShield(move.endRow, move.endCol)) {
        score += 30;
    }

    // King exposure
    if (piece === 'k') {
        score -= countAttackingSquares(move.endRow, move.endCol) * 10;
    }

    return score;
}

function evaluateEndgameStrategy(move) {
    let score = 0;
    const piece = move.piece.toLowerCase();

    // King centralization in endgame
    if (piece === 'k') {
        score += (4 - Math.abs(move.endRow - 3.5)) * 10;
        score += (4 - Math.abs(move.endCol - 3.5)) * 10;
    }

    // Passed pawn advancement
    if (piece === 'p' && isPawnPassed(move.endRow, move.endCol)) {
        score += (7 - move.endRow) * 20;
    }

    return score;
}

// Helper functions for evaluation
function getMoveCount() {
    return moveHistory.length;
}

function isInEndgame() {
    let materialCount = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = window.board[row][col];
            if (piece && piece.toLowerCase() !== 'k') {
                materialCount += PIECE_VALUES[piece.toLowerCase()];
            }
        }
    }
    return materialCount < 3000; // Arbitrary threshold for endgame
}

function distanceFromEdge(row, col) {
    return Math.min(row, 7 - row, col, 7 - col);
}

function isKeySquare(row, col) {
    return (row >= 2 && row <= 5 && col >= 2 && col <= 5);
}

function isNearKing(row, col, kingPos) {
    return Math.abs(row - kingPos.row) <= 2 && Math.abs(col - kingPos.col) <= 2;
}

function hasKingPawnShield(row, col) {
    // Check if there are pawns protecting the king
    const direction = -1; // For red pieces
    for (let c = col - 1; c <= col + 1; c++) {
        if (c >= 0 && c < 8 && row + direction >= 0) {
            if (window.board[row + direction][c]?.toLowerCase() === 'p') {
                return true;
            }
        }
    }
    return false;
}

function countQueenMobility(row, col) {
    return countDiagonalMoves(row, col) + countOrthogonalMoves(row, col);
}

function countDiagonalMoves(row, col) {
    const directions = [[-1,-1], [-1,1], [1,-1], [1,1]];
    return countMovesInDirections(row, col, directions);
}

function countOrthogonalMoves(row, col) {
    const directions = [[-1,0], [1,0], [0,-1], [0,1]];
    return countMovesInDirections(row, col, directions);
}

function countMovesInDirections(row, col, directions) {
    let count = 0;
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (!window.board[r][c]) count++;
            else break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

// Add these helper functions after the existing evaluation helpers

function isPawnPassed(row, col) {
    // For red pieces (uppercase) moving down
    const enemyPawn = 'p';  // Look for blue pawns
    
    // Check if there are any enemy pawns that could block
    for (let r = row + 1; r < 8; r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
            if (window.board[r][c] === enemyPawn) {
                return false;
            }
        }
    }
    return true;
}

function hasConnectedPawn(row, col) {
    // For red pieces
    const friendlyPawn = 'P';
    
    // Check adjacent files for friendly pawns
    for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        if (c !== col && window.board[row][c] === friendlyPawn) {
            return true;
        }
    }
    return false;
}

function hasPawnInFile(col) {
    let count = 0;
    for (let row = 0; row < 8; row++) {
        if (window.board[row][col] === 'P') {
            count++;
        }
    }
    return count > 1; // Return true if there are doubled pawns
}

function isKnightOutpost(row, col) {
    // Check if the knight is protected by a pawn
    const supportingRow = row + 1;
    if (supportingRow < 8) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c += 2) {
            if (window.board[supportingRow][c] === 'P') {
                return true;
            }
        }
    }
    return false;
}

function hasBishopPair() {
    let lightSquareBishop = false;
    let darkSquareBishop = false;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (window.board[row][col] === 'B') {
                // Check bishop's square color
                if ((row + col) % 2 === 0) {
                    lightSquareBishop = true;
                } else {
                    darkSquareBishop = true;
                }
            }
            if (lightSquareBishop && darkSquareBishop) {
                return true;
            }
        }
    }
    return false;
}

function isFileOpen(col) {
    // Check if there are any pawns in the file
    for (let row = 0; row < 8; row++) {
        const piece = window.board[row][col];
        if (piece === 'P' || piece === 'p') {
            return false;
        }
    }
    return true;
}

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
        if (window.isMultiplayerMode && window.multiplayerManager) {
            // Let multiplayer manager handle the click
            return;
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
        // Check game mode restrictions
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

function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

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

    // Update piece movement tracking
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

    // Save move for en passant detection
    lastMove = {
        piece,
        startRow,
        startCol,
        endRow,
        endCol,
        promotion: promotionPiece
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
        gameState = 'check';
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)} is in check!`);
    } else {
        gameState = 'active';
        updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)}'s turn`);
    }

    // Make AI move if it's AI's turn
    if (currentGameMode === GameMode.AI && window.currentPlayer === 'red' && !window.isMultiplayerMode) {
        setTimeout(makeAIMove, 500);
    }

    return true;
}

function endGame(winner) {
    gameState = 'ended';
    const message = winner === 'draw' ? 
        "Game Over - Draw!" : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);
    
    // Disable board interaction
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

function addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece) {
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
}

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
        
        if (window.isMultiplayerMode) {
            return; // Let multiplayer manager handle game start
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
        
        // Initialize game mode controls
        const aiModeBtn = document.getElementById('ai-mode');
        const multiplayerModeBtn = document.getElementById('multiplayer-mode');
        const difficultyScreen = document.getElementById('difficulty-screen');
        const multiplayerMenu = document.querySelector('.multiplayer-menu');
        const easyBtn = document.getElementById('easy-mode');
        const hardBtn = document.getElementById('hard-mode');
        const startBtn = document.getElementById('start-game');
        const chessGame = document.getElementById('chess-game');

        // Initialize difficulty selection
        if (easyBtn && hardBtn && startBtn) {
            startBtn.disabled = true;
            selectedDifficulty = null;

            easyBtn.addEventListener('click', () => {
                debug('Easy mode clicked');
                gameDifficulty = 'easy';
                selectedDifficulty = 'easy';
                easyBtn.classList.add('selected');
                hardBtn.classList.remove('selected');
                startBtn.disabled = false;
            });

            hardBtn.addEventListener('click', () => {
                debug('Hard mode clicked');
                gameDifficulty = 'hard';
                selectedDifficulty = 'hard';
                hardBtn.classList.add('selected');
                easyBtn.classList.remove('selected');
                startBtn.disabled = false;
            });

            startBtn.addEventListener('click', () => {
                if (selectedDifficulty) {
                    debug(`Starting game with ${selectedDifficulty} difficulty`);
                    if (difficultyScreen) difficultyScreen.style.display = 'none';
                    if (chessGame) chessGame.style.display = 'block';
                    startGame();
                }
            });
        }

        // Initialize mode switching
        if (aiModeBtn && multiplayerModeBtn) {
            aiModeBtn.addEventListener('click', () => {
                currentGameMode = GameMode.AI;
                window.isMultiplayerMode = false;
                aiModeBtn.classList.add('selected');
                multiplayerModeBtn?.classList.remove('selected');
                if (difficultyScreen) {
                    difficultyScreen.style.display = 'flex';
                    selectedDifficulty = null;
                    if (startBtn) startBtn.disabled = true;
                    if (easyBtn) easyBtn.classList.remove('selected');
                    if (hardBtn) hardBtn.classList.remove('selected');
                }
                if (multiplayerMenu) multiplayerMenu.style.display = 'none';
                if (chessGame) chessGame.style.display = 'none';
            });

            multiplayerModeBtn.addEventListener('click', () => {
                currentGameMode = GameMode.ONLINE;
                window.isMultiplayerMode = true;
                multiplayerModeBtn.classList.add('selected');
                aiModeBtn?.classList.remove('selected');
                if (difficultyScreen) difficultyScreen.style.display = 'none';
                if (multiplayerMenu) multiplayerMenu.style.display = 'block';
                if (chessGame) chessGame.style.display = 'none';
            });
        }

        // Initialize restart button
        const restartBtn = document.getElementById('restart-game');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (currentGameMode === GameMode.AI) {
                    startGame();
                }
            });
        }
        
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
window.onload = initGame;
