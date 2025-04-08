// Game modes and state
const GameMode = {
    AI: 'ai',
    ONLINE: 'online'
};

// Game initialization flags
let isGameInitialized = false;
let hasInitialized = false;
let currentGameMode = GameMode.AI;
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
let selectedDifficulty = null;
let gameDifficulty = 'easy';

// Global game state
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
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
};

// Make piece images globally available
window.pieceImages = pieceImages;

// Core utility functions
let debugQueue = [];
let debugTimeout = null;

function debug(message) {
    console.log(message);
    debugQueue.push(message);
    if (!debugTimeout) {
        debugTimeout = setTimeout(() => {
            debugQueue = [];
            debugTimeout = null;
        }, 100);
    }
}

function updateStatusDisplay(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        debug(`Status updated: ${message}`);
    } else {
        debug('Status element not found');
    }
}

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
    } else {
        debug('Difficulty buttons not found');
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

window.debug = debug;
window.updateStatusDisplay = updateStatusDisplay;
window.updateDifficultyButtons = updateDifficultyButtons;

// Core game logic functions
function getPieceColor(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'red' : 'blue';
}

function getPieceName(piece) {
    const names = { 'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king' };
    return names[piece.toLowerCase()];
}

function isWithinBoard(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function coordsToAlgebraic(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

// Board display functions
function placePieces() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) {
        debug('Chessboard element not found');
        return;
    }

    const existingPieces = new Map();
    chessboard.querySelectorAll('.piece').forEach(piece => {
        const row = parseInt(piece.getAttribute('data-row'));
        const col = parseInt(piece.getAttribute('data-col'));
        existingPieces.set(`${row},${col}`, piece);
    });

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = window.board[row][col];
            const key = `${row},${col}`;
            const existing = existingPieces.get(key);

            if (piece && !existing) {
                const pieceElement = createPieceElement(piece, row, col);
                chessboard.appendChild(pieceElement);
            } else if (!piece && existing) {
                existing.remove();
            } else if (piece && existing && existing.style.backgroundImage !== `url("${pieceImages[piece]}")`) {
                existing.style.backgroundImage = `url("${pieceImages[piece]}")`;
            }
        }
    }
    debug('Pieces updated successfully');
}

function createPieceElement(piece, row, col) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    const imageUrl = pieceImages[piece] || 'images/default-piece.png';
    pieceElement.style.backgroundImage = `url('${imageUrl}')`;
    pieceElement.style.left = `${col * 12.5}%`;
    pieceElement.style.top = `${row * 12.5}%`;
    pieceElement.setAttribute('data-row', row);
    pieceElement.setAttribute('data-col', col);
    pieceElement.addEventListener('click', onPieceClick);
    debug(`Created piece ${piece} at [${row},${col}] with image ${imageUrl}`);
    return pieceElement;
}

function createBoard() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) {
        debug('Chessboard element not found');
        return;
    }
    const randomBoard = selectRandomChessboard();
    chessboard.style.backgroundImage = `url('${randomBoard}')`;
    debug(`Selected board: ${randomBoard}`);
}

function selectRandomChessboard() {
    const boardCount = 6;
    const boardNumber = Math.floor(Math.random() * boardCount) + 1;
    return `images/chessboard${boardNumber}.png`;
}

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

window.getPieceColor = getPieceColor;
window.getPieceName = getPieceName;
window.isWithinBoard = isWithinBoard;
window.coordsToAlgebraic = coordsToAlgebraic;
window.placePieces = placePieces;
window.createBoard = createBoard;
window.createPieceElement = createPieceElement;
window.selectRandomChessboard = selectRandomChessboard;
window.removeHighlights = removeHighlights;
window.highlightSquare = highlightSquare;

// Move validation functions
function canMakeMove(startRow, startCol, endRow, endCol) {
    const piece = window.board[startRow][startCol];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    if (color !== window.currentPlayer) return false;
    
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
}

function canPieceMove(piece, startRow, startCol, endRow, endCol, checkForCheck = true) {
    if (!piece) return false;
    
    const pieceType = piece.toLowerCase();
    const color = getPieceColor(piece);
    
    if (!isWithinBoard(endRow, endCol) || (startRow === endRow && startCol === endCol)) return false;
    
    const targetPiece = window.board[endRow][endCol];
    if (targetPiece && getPieceColor(targetPiece) === color) return false;

    let isValid = false;
    switch (pieceType) {
        case 'p': isValid = isValidPawnMove(color, startRow, startCol, endRow, endCol); break;
        case 'r': isValid = isValidRookMove(startRow, startCol, endRow, endCol); break;
        case 'n': isValid = isValidKnightMove(startRow, startCol, endRow, endCol); break;
        case 'b': isValid = isValidBishopMove(startRow, startCol, endRow, endCol); break;
        case 'q': isValid = isValidQueenMove(startRow, startCol, endRow, endCol); break;
        case 'k': isValid = isValidKingMove(color, startRow, startCol, endRow, endCol); break;
    }

    if (!isValid) return false;
    if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color)) return false;

    return true;
}

function isValidPawnMove(color, startRow, startCol, endRow, endCol) {
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;
    
    if (Math.abs(colDiff) === 1) {
        if (rowDiff !== direction) return false;
        const targetPiece = window.board[endRow][endCol];
        if (targetPiece && getPieceColor(targetPiece) !== color) return true;
        if (!targetPiece && lastMove && 
            lastMove.piece.toLowerCase() === 'p' &&
            lastMove.endRow === startRow &&
            lastMove.endCol === endCol &&
            Math.abs(lastMove.startRow - lastMove.endRow) === 2) {
            window.board[startRow][endCol] = null;
            return true;
        }
        return false;
    }
    
    if (colDiff !== 0 || window.board[endRow][endCol]) return false;
    if (rowDiff === direction) return true;
    if (startRow === startingRow && rowDiff === 2 * direction && !window.board[startRow + direction][startCol]) return true;
    
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
    
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    if (rowDiff === 0 && colDiff === 2 && !isKingInCheck(color)) {
        const row = color === 'blue' ? 7 : 0;
        if (startRow !== row || startCol !== 4) return false;
        
        if (color === 'blue' && pieceState.blueKingMoved) return false;
        if (color === 'red' && pieceState.redKingMoved) return false;
        
        if (endCol === 6) {
            if ((color === 'blue' && pieceState.blueRooksMove.right) ||
                (color === 'red' && pieceState.redRooksMove.right)) return false;
            if (!isPathClear(row, 4, row, 7) || window.board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        if (endCol === 2) {
            if ((color === 'blue' && pieceState.blueRooksMove.left) ||
                (color === 'red' && pieceState.redRooksMove.left)) return false;
            if (!isPathClear(row, 0, row, 4) || window.board[row][0] !== (color === 'blue' ? 'r' : 'R')) return false;
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
                    if (piece.toLowerCase() === 'k') {
                        const rowDiff = Math.abs(row - r);
                        const colDiff = Math.abs(col - c);
                        if (rowDiff <= 1 && colDiff <= 1) return true;
                        continue;
                    }
                    if (canPieceMove(piece, r, c, row, col, false)) return true;
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
    const originalPiece = window.board[endRow][endCol];
    const movingPiece = window.board[startRow][startCol];
    window.board[endRow][endCol] = movingPiece;
    window.board[startRow][startCol] = null;
    const inCheck = isKingInCheck(color);
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
                        if (canPieceMove(piece, startRow, startCol, endRow, endCol)) return true;
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

// AI Move Selection
function makeAIMove() {
    debug('Making AI move...');
    if (currentGameMode !== GameMode.AI || window.currentPlayer !== 'red' || window.isMultiplayerMode) {
        debug('Conditions not met for AI move');
        return;
    }

    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);

    const worker = new Worker('aiWorker.js');
    worker.postMessage({
        board: JSON.parse(JSON.stringify(window.board)),
        difficulty: gameDifficulty,
        currentPlayer: 'red'
    });

    worker.onmessage = (e) => {
        const move = e.data;
        if (move) {
            debug('AI selected move: ' + JSON.stringify(move));
            setTimeout(() => {
                executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
            }, 500);
        } else {
            debug('No legal moves available for AI');
            if (isCheckmate('red')) endGame('blue');
            else if (isStalemate('red')) endGame('draw');
        }
        worker.terminate();
    };

    worker.onerror = (error) => {
        debug('AI Worker error: ' + error.message);
        console.error('Worker error:', error);
    };
}

window.isSquareUnderAttack = isSquareUnderAttack;
window.isKingInCheck = isKingInCheck;
window.wouldMoveExposeCheck = wouldMoveExposeCheck;
window.isCheckmate = isCheckmate;
window.isStalemate = isStalemate;
window.hasLegalMoves = hasLegalMoves;
window.getAllLegalMoves = getAllLegalMoves;
window.makeAIMove = makeAIMove;

// UI Event Handlers
function onPieceClick(event) {
    if (!checkGameAccess()) return;
    if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') return;
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
            const validMoves = getAllLegalMoves(pieceColor).filter(m => m.startRow === row && m.startCol === col);
            validMoves.forEach(move => highlightSquare(move.endRow, move.endCol, move.isCapture));
        }
    }
}

function onSquareClick(row, col) {
    if (!checkGameAccess()) return;
    if (currentGameMode === GameMode.AI && window.currentPlayer !== 'blue') return;
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
}

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
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

// Touch Event Handlers
function setupTouchEvents() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) return;

    chessboard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('piece')) {
            onPieceClick({ target });
        }
    }, { passive: false });

    chessboard.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const boardRect = chessboard.getBoundingClientRect();
        const squareSize = boardRect.width / 8;
        const endCol = Math.floor((touch.clientX - boardRect.left) / squareSize);
        const endRow = Math.floor((touch.clientY - boardRect.top) / squareSize);
        if (isWithinBoard(endRow, endCol)) {
            onSquareClick(endRow, endCol);
        }
    }, { passive: false });
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

function updateMoveHistory() {
    const moveHistoryElement = document.getElementById('move-history');
    if (!moveHistoryElement) {
        debug('Move history element not found');
        return;
    }
    const historyText = moveHistory.map((move, index) => `${index + 1}. ${move.notation}`).join('\n');
    moveHistoryElement.textContent = historyText || 'No moves yet';
    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
    debug(`Move history updated with ${moveHistory.length} moves: ${historyText}`);
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
        if (endCol === 6) {
            window.board[row][5] = window.board[row][7];
            window.board[row][7] = null;
        } else if (endCol === 2) {
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
    updateMoveHistory();
    
    requestAnimationFrame(() => {
        window.placePieces();
        window.currentPlayer = window.currentPlayer === 'blue' ? 'red' : 'blue';
        
        if (isCheckmate(window.currentPlayer)) {
            endGame(color);
        } else if (isStalemate(window.currentPlayer)) {
            endGame('draw');
        } else if (isKingInCheck(window.currentPlayer)) {
            gameState = 'check';
            updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)} is in check!`);
            if (currentGameMode === GameMode.AI && window.currentPlayer === 'red') {
                setTimeout(makeAIMove, 500);
            }
        } else {
            gameState = 'active';
            updateStatusDisplay(`${window.currentPlayer.charAt(0).toUpperCase() + window.currentPlayer.slice(1)}'s turn`);
            if (currentGameMode === GameMode.AI && window.currentPlayer === 'red') {
                setTimeout(makeAIMove, 500);
            }
        }
    });

    return true;
}

function endGame(winner) {
    gameState = 'ended';
    const message = winner === 'draw' ? "Game ended in a draw" : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    updateStatusDisplay(message);
    const chessboard = document.getElementById('chessboard');
    if (chessboard) chessboard.style.pointerEvents = 'none';
    
    if (typeof window.updateGameResult === 'function') {
        window.updateGameResult({
            winner,
            player: window.currentPlayer === 'blue' ? 'red' : 'blue',
            mode: currentGameMode,
            difficulty: gameDifficulty
        });
    }
}

// Event Handlers and Game State Management
function initializeElements() {
    return {
        buttons: {
            easyBtn: document.getElementById('easy-mode'),
            hardBtn: document.getElementById('hard-mode'),
            startBtn: document.getElementById('start-game'),
            restartBtn: document.getElementById('restart-game'),
            aiModeBtn: document.getElementById('ai-mode'),
            multiplayerModeBtn: document.getElementById('multiplayer-mode')
        },
        screens: {
            difficultyScreen: document.getElementById('difficulty-screen'),
            multiplayerMenu: document.querySelector('.multiplayer-menu'),
            chessGame: document.getElementById('chess-game')
        }
    };
}

function setupDifficultyButtons() {
    debug('Setting up difficulty buttons...');
    const { buttons } = initializeElements();
    const { easyBtn, hardBtn, startBtn } = buttons;
    
    if (easyBtn && hardBtn && startBtn) {
        startBtn.disabled = true;
        easyBtn.onclick = () => {
            gameDifficulty = 'easy';
            selectedDifficulty = 'easy';
            updateDifficultyButtons('easy');
            debug(`Difficulty set to: ${gameDifficulty}`);
        };
        hardBtn.onclick = () => {
            gameDifficulty = 'hard';
            selectedDifficulty = 'hard';
            updateDifficultyButtons('hard');
            debug(`Difficulty set to: ${gameDifficulty}`);
        };
        startBtn.onclick = () => {
            if (selectedDifficulty) {
                debug(`Starting game with ${selectedDifficulty} difficulty`);
                startGame();
            }
        };
        debug('Difficulty buttons setup complete');
    } else {
        debug('Error: Could not find difficulty buttons');
    }
}

function setupModeButtons() {
    debug('Setting up mode buttons...');
    const { buttons } = initializeElements();
    const { aiModeBtn, multiplayerModeBtn } = buttons;
    
    if (aiModeBtn && multiplayerModeBtn) {
        aiModeBtn.onclick = () => {
            currentGameMode = GameMode.AI;
            window.isMultiplayerMode = false;
            aiModeBtn.classList.add('selected');
            multiplayerModeBtn.classList.remove('selected');
            resetGame();
            setupDifficultyButtons();
            debug('Switched to AI mode');
        };
        multiplayerModeBtn.onclick = () => {
            currentGameMode = GameMode.ONLINE;
            window.isMultiplayerMode = true;
            multiplayerModeBtn.classList.add('selected');
            aiModeBtn.classList.remove('selected');
            resetGame();
            debug('Switched to multiplayer mode');
        };
        debug('Mode buttons setup complete');
    } else {
        debug('Error: Could not find mode buttons');
    }
}

function startGame() {
    debug("\n----- Starting new game -----");
    if (!checkGameAccess()) return;
    
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
    document.getElementById('chess-game').style.display = 'block';
    document.getElementById('difficulty-screen').style.display = 'none';
    document.querySelector('.multiplayer-menu').style.display = 'none';
    updateStatusDisplay("Blue's turn");
    debug(`New game started - ${gameDifficulty} mode`);
    
    const moveHistoryElement = document.getElementById('move-history');
    if (moveHistoryElement) {
        moveHistoryElement.textContent = 'No moves yet';
        debug('Move history cleared');
    }
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) chessboard.style.pointerEvents = 'auto';
}

function resetGame() {
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
    if (moveHistoryElement) {
        moveHistoryElement.textContent = 'No moves yet';
        debug('Move history cleared');
    }
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'auto';
        const pieces = chessboard.querySelectorAll('.piece, .highlight');
        pieces.forEach(piece => piece.remove());
    }
    
    debug('Game reset completed');
}

function initGame() {
    if (hasInitialized) {
        debug('Game already initialized, skipping...');
        return;
    }
    hasInitialized = true;
    
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
    setupTouchEvents();
    
    const { buttons } = initializeElements();
    if (buttons.restartBtn) {
        buttons.restartBtn.onclick = () => {
            if (currentGameMode === GameMode.AI) startGame();
        };
    }
    
    debug('Game initialization completed successfully');
}

window.startGame = startGame;
window.initGame = initGame;
window.resetGame = resetGame;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    debug('DOM Content Loaded - Initializing game...');
    initGame();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debug('Document already loaded - Running backup initialization...');
    initGame();
}