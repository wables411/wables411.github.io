// Console initialization
console.log("Enhanced Chess game script is running");

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
let movesSincePawnOrCapture = 0;
let positionHistory = [];
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

// Basic utility functions
function updateStatusDisplay(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        debug(`Status updated: ${message}`);
    }
}

function debug(message) {
    console.log(message);
    const debugElement = document.getElementById('debug');
    if (debugElement) {
        debugElement.innerHTML += message + '<br>';
        debugElement.scrollTop = debugElement.scrollHeight;
    }
}

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

function algebraicToCoords(algebraic) {
    const col = algebraic.charCodeAt(0) - 97;
    const row = 8 - parseInt(algebraic[1]);
    return { row, col };
}

// Difficulty selection initialization
function initDifficultySelection() {
    const easyBtn = document.getElementById('easy-mode');
    const hardBtn = document.getElementById('hard-mode');
    const startBtn = document.getElementById('start-game');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const chessGame = document.getElementById('chess-game');

    function selectDifficulty(difficulty, button, otherButton) {
        selectedDifficulty = difficulty;
        button.classList.add('selected');
        otherButton.classList.remove('selected');
        startBtn.disabled = false;
    }

    easyBtn.addEventListener('click', () => {
        selectDifficulty('easy', easyBtn, hardBtn);
        gameDifficulty = 'easy';
        debug('Easy mode selected');
    });

    hardBtn.addEventListener('click', () => {
        selectDifficulty('hard', hardBtn, easyBtn);
        gameDifficulty = 'hard';
        debug('Hard mode selected');
    });

    startBtn.addEventListener('click', () => {
        if (selectedDifficulty) {
            difficultyScreen.style.display = 'none';
            chessGame.style.display = 'block';
            startGame();
        }
    });

    document.getElementById('restart-game').addEventListener('click', () => {
        resetGame();
        chessGame.style.display = 'none';
        difficultyScreen.style.display = 'flex';
        selectedDifficulty = null;
        startBtn.disabled = true;
        easyBtn.classList.remove('selected');
        hardBtn.classList.remove('selected');
        debug('Game reset - selecting difficulty');
    });
}

// Game start function
function startGame() {
    resetGame();
    initGame();
    updateStatusDisplay("Blue's turn");
    debug(`New game started - ${gameDifficulty} mode`);
}

// AI Evaluation Functions
function evaluateEasyMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Basic piece values
    const pieceValues = {
        'p': 100,  // pawn
        'n': 300,  // knight
        'b': 300,  // bishop
        'r': 500,  // rook
        'q': 900,  // queen
        'k': 400   // king - lower value to avoid unnecessary movement
    };
    
    // Capturing pieces
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()];
    }
    
    // Simple positional bonuses
    if (piece.toLowerCase() !== 'k') {
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 10;
        }
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Add randomness for easy mode
    score += Math.random() * 200;
    
    return score;
}

function evaluateHardMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    const pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 2000
    };
    
    // Capturing bonus
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()] * 1.2;
    }
    
    // Piece-specific evaluation
    switch (piece.toLowerCase()) {
        case 'p':
            score += evaluatePawnPosition(endRow, endCol, 'red');
            break;
        case 'n':
            score += evaluateKnightPosition(endRow, endCol);
            break;
        case 'b':
            score += evaluateBishopPosition(endRow, endCol);
            break;
        case 'r':
            score += evaluateRookPosition(endRow, endCol, 'red');
            break;
        case 'q':
            score += evaluateQueenPosition(endRow, endCol);
            break;
        case 'k':
            score += evaluateKingPosition(endRow, endCol, 'red');
            break;
    }
    
    // Check bonus
    if (isKingInCheck('blue')) {
        score += 150;
    }
    
    // Mobility and control
    score += evaluateMobility('red') * 10;
    if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
        score += 30;
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 20;
        }
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Small random factor
    score += Math.random() * 20;
    
    return score;
}

// Piece-specific evaluation helpers
function evaluatePawnPosition(row, col, color) {
    let score = 0;
    const advancement = color === 'red' ? row : (7 - row);
    
    score += advancement * 10;
    if (col >= 2 && col <= 5) score += 10;
    if (isPawnPassed(row, col, color)) score += 50;
    
    return score;
}

function evaluateKnightPosition(row, col) {
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    let score = (7 - centerDistance) * 10;
    
    if (row >= 3 && row <= 4 && (col === 2 || col === 5)) {
        score += 20;
    }
    
    return score;
}

function evaluateBishopPosition(row, col) {
    let score = countDiagonalMoves(row, col) * 5;
    
    if (Math.abs(row - col) === 0 || Math.abs(row - col) === 7) {
        score += 15;
    }
    
    return score;
}

function evaluateRookPosition(row, col, color) {
    let score = 0;
    
    if (isFileOpen(col)) {
        score += 30;
    }
    
    if ((color === 'red' && row === 6) || (color === 'blue' && row === 1)) {
        score += 40;
    }
    
    return score;
}

function evaluateQueenPosition(row, col) {
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    let score = (7 - centerDistance) * 5;
    
    score += (countDiagonalMoves(row, col) + countOrthogonalMoves(row, col)) * 2;
    
    return score;
}

function evaluateKingPosition(row, col, color) {
    let score = 0;
    
    if (isEndgame()) {
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        score -= centerDistance * 10;
    } else {
        if (color === 'red') {
            score += (7 - row) * 10;
        } else {
            score += row * 10;
        }
    }
    
    return score;
}

// Game state check functions
let checkingAttack = false;

function isSquareUnderAttack(row, col, attackingColor) {
    if (checkingAttack) return false;
    checkingAttack = true;
    
    try {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === attackingColor) {
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
            if (board[row][col] === kingPiece) {
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
    const originalPiece = board[endRow][endCol];
    const movingPiece = board[startRow][startCol];
    board[endRow][endCol] = movingPiece;
    board[startRow][startCol] = null;
    
    const inCheck = isKingInCheck(color);
    
    board[startRow][startCol] = movingPiece;
    board[endRow][endCol] = originalPiece;
    
    return inCheck;
}

function isStalemate(color) {
    if (isKingInCheck(color)) return false;
    return !hasLegalMoves(color);
}

function isCheckmate(color) {
    return isKingInCheck(color) && !hasLegalMoves(color);
}

function hasLegalMoves(color) {
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = board[startRow][startCol];
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

// Movement validation functions
function canPieceMove(piece, startRow, startCol, endRow, endCol, checkForCheck = true) {
    if (!piece) return false;
    
    const pieceType = piece.toLowerCase();
    const color = getPieceColor(piece);
    
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

function isValidPawnMove(color, startRow, startCol, endRow, endCol) {
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    
    const rowDiff = endRow - startRow;
    const colDiff = Math.abs(endCol - startCol);
    
    // Captures (including en passant)
    if (colDiff === 1 && rowDiff === direction) {
        const targetPiece = board[endRow][endCol];
        
        if (targetPiece && getPieceColor(targetPiece) !== color) {
            return true;
        }
        
        if (!targetPiece && lastMove && 
            lastMove.piece.toLowerCase() === 'p' &&
            lastMove.endRow === startRow &&
            lastMove.endCol === endCol &&
            Math.abs(lastMove.startRow - lastMove.endRow) === 2) {
            return true;
        }
    }
    
    // Forward moves
    if (colDiff === 0 && !board[endRow][endCol]) {
        if (rowDiff === direction) {
            return true;
        }
        if (startRow === startingRow && 
            rowDiff === 2 * direction && 
            !board[startRow + direction][startCol]) {
            return true;
        }
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
        
        if (endCol === 6) { // Kingside
            if ((color === 'blue' && pieceState.blueRooksMove.right) ||
                (color === 'red' && pieceState.redRooksMove.right)) return false;
                
            if (!isPathClear(row, 4, row, 7) || 
                board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        if (endCol === 2) { // Queenside
            if ((color === 'blue' && pieceState.blueRooksMove.left) ||
                (color === 'red' && pieceState.redRooksMove.left)) return false;
                
            if (!isPathClear(row, 0, row, 4) || 
                board[row][0] !== (color === 'blue' ? 'r' : 'R')) return false;
                
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
        if (board[currentRow][currentCol]) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// AI Move Selection and Game State Updates
function makeAIMove() {
    if (currentPlayer !== 'red') return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    // Get all legal moves
    let legalMoves = [];
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = board[startRow][startCol];
            if (piece && getPieceColor(piece) === 'red') {
                for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
                    for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
                        if (canPieceMove(piece, startRow, startCol, endRow, endCol)) {
                            const originalPiece = board[endRow][endCol];
                            board[endRow][endCol] = piece;
                            board[startRow][startCol] = null;
                            
                            const stillInCheck = isKingInCheck('red');
                            
                            board[startRow][startCol] = piece;
                            board[endRow][endCol] = originalPiece;
                            
                            if (!stillInCheck) {
                                legalMoves.push({
                                    piece,
                                    startRow,
                                    startCol,
                                    endRow,
                                    endCol,
                                    score: 0
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (legalMoves.length === 0) {
        if (inCheck) {
            gameState = 'checkmate';
            endGame('blue');
        } else {
            gameState = 'stalemate';
            endGame('draw');
        }
        return;
    }

    // Evaluate moves based on difficulty
    legalMoves.forEach(move => {
        move.score = gameDifficulty === 'hard' 
            ? evaluateHardMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol)
            : evaluateEasyMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);
    
    // Select move based on difficulty
    let selectedMove;
    if (gameDifficulty === 'hard') {
        // Choose one of the top 3 moves in hard mode
        const topMoves = legalMoves.slice(0, 3);
        selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    } else {
        // In easy mode, sometimes choose a suboptimal move
        if (Math.random() < 0.3) { // 30% chance of random move
            selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        } else {
            selectedMove = legalMoves[0];
        }
    }

    if (selectedMove) {
        debug(`AI executing move with score: ${selectedMove.score}`);
        executeMove(selectedMove.startRow, selectedMove.startCol, selectedMove.endRow, selectedMove.endCol);
    }
}

function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    try {
        const piece = board[startRow][startCol];
        if (!piece) return false;
        
        const color = getPieceColor(piece);
        const pieceType = piece.toLowerCase();
        const capturedPiece = board[endRow][endCol];
        
        debug(`\nExecuting move for ${color} ${getPieceName(piece)}`);
        debug(`From ${coordsToAlgebraic(startRow, startCol)} to ${coordsToAlgebraic(endRow, endCol)}`);
        
        // Handle castling
        if (pieceType === 'k' && Math.abs(endCol - startCol) === 2) {
            const row = color === 'blue' ? 7 : 0;
            
            if (color === 'blue') {
                pieceState.blueKingMoved = true;
            } else {
                pieceState.redKingMoved = true;
            }
            
            if (endCol === 6) { // Kingside
                board[row][5] = board[row][7];
                board[row][7] = null;
                if (color === 'blue') {
                    pieceState.blueRooksMove.right = true;
                } else {
                    pieceState.redRooksMove.right = true;
                }
            } else if (endCol === 2) { // Queenside
                board[row][3] = board[row][0];
                board[row][0] = null;
                if (color === 'blue') {
                    pieceState.blueRooksMove.left = true;
                } else {
                    pieceState.redRooksMove.left = true;
                }
            }
        }
        
        // Update rook movement state
        if (pieceType === 'r') {
            if (color === 'blue') {
                if (startCol === 0) pieceState.blueRooksMove.left = true;
                if (startCol === 7) pieceState.blueRooksMove.right = true;
            } else {
                if (startCol === 0) pieceState.redRooksMove.left = true;
                if (startCol === 7) pieceState.redRooksMove.right = true;
            }
        }
        
        // Handle pawn promotion
        if (isPawnPromotion(piece, endRow)) {
            const newPiece = promotionPiece || (color === 'blue' ? 'q' : 'Q');
            board[endRow][endCol] = newPiece;
            board[startRow][startCol] = null;
            debug(`Pawn promoted to ${getPieceName(newPiece)}`);
        }
        // Handle en passant
        else if (pieceType === 'p' && startCol !== endCol && !capturedPiece) {
            board[startRow][endCol] = null;
            board[endRow][endCol] = piece;
            board[startRow][startCol] = null;
            debug('En passant capture executed');
        }
        // Normal move
        else {
            board[endRow][endCol] = piece;
            board[startRow][startCol] = null;
        }
        
        // Update last move
        lastMove = {
            piece,
            startRow,
            startCol,
            endRow,
            endCol,
            wasCapture: !!capturedPiece
        };
        
        // Update display and history
        placePieces();
        addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece);
        updateGameState();
        
        return true;
    } catch (error) {
        debug(`Error executing move: ${error.message}`);
        console.error(error);
        return false;
    }
}

function updateGameState() {
    const enemyColor = currentPlayer === 'blue' ? 'red' : 'blue';
    
    if (isCheckmate(enemyColor)) {
        gameState = 'checkmate';
        endGame(currentPlayer);
        return;
    }
    
    if (isStalemate(enemyColor)) {
        gameState = 'stalemate';
        endGame('draw');
        return;
    }
    
    currentPlayer = enemyColor;
    
    if (isKingInCheck(currentPlayer)) {
        gameState = 'check';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
        debug(`${currentPlayer} is in check`);
    } else {
        gameState = 'active';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
    }
    
    if (currentPlayer === 'red') {
        debug('Triggering AI move...');
        setTimeout(makeAIMove, 500);
    }
}

function endGame(winner) {
    const message = winner === 'draw' ? 
        "Game Over - It's a draw!" : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);
    debug(`Game ended: ${message}`);
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// UI Event Handlers and Game Initialization
function onSquareClick(row, col) {
    try {
        if (gameState !== 'active' && gameState !== 'check') return;
        if (currentPlayer !== 'blue') return;
        
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = board[startRow][startCol];
            
            if (canPieceMove(piece, startRow, startCol, row, col)) {
                if (isPawnPromotion(piece, row)) {
                    promptPawnPromotion(startRow, startCol, row, col);
                } else {
                    executeMove(startRow, startCol, row, col);
                }
            } else {
                debug(`Invalid move attempted`);
            }
            
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
            return;
        }
        
        const piece = board[row][col];
        if (piece && getPieceColor(piece) === 'blue') {
            const pieceElement = document.querySelector(`.piece[data-row="${row}"][data-col="${col}"]`);
            if (pieceElement) {
                onPieceClick({ target: pieceElement });
            }
        }
    } catch (error) {
        debug(`Error in onSquareClick: ${error.message}`);
        console.error(error);
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
        }
    }
}

function onPieceClick(event) {
    try {
        if (gameState !== 'active' && gameState !== 'check') return;
        if (currentPlayer !== 'blue') return;
        
        const clickedPiece = event.target;
        const row = parseInt(clickedPiece.getAttribute('data-row'));
        const col = parseInt(clickedPiece.getAttribute('data-col'));
        const pieceType = board[row][col];
        
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            removeHighlights();
        }
        
        if (getPieceColor(pieceType) === 'blue') {
            if (selectedPiece === clickedPiece) {
                selectedPiece = null;
            } else {
                selectedPiece = clickedPiece;
                clickedPiece.style.opacity = '0.7';
                showLegalMoves(row, col);
            }
        }
    } catch (error) {
        debug(`Error in onPieceClick: ${error.message}`);
        console.error(error);
        if (selectedPiece) {
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
        }
    }
}

function showLegalMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return;
    
    removeHighlights();
    
    for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
        for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
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

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = currentPlayer;
    
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    dialog.style.left = `${endCol * 12.5}%`;
    dialog.style.top = `${endRow * 12.5}%`;
    dialog.style.zIndex = '1000';
    
    promotionPieces.forEach(piece => {
        const pieceButton = document.createElement('div');
        pieceButton.className = 'promotion-piece';
        const promotedPiece = color === 'blue' ? piece : piece.toUpperCase();
        pieceButton.style.backgroundImage = `url('${pieceImages[promotedPiece]}')`;
        pieceButton.onclick = () => {
            executeMove(startRow, startCol, endRow, endCol, promotedPiece);
            dialog.remove();
        };
        dialog.appendChild(pieceButton);
    });
    
    document.getElementById('chessboard').appendChild(dialog);
}

function createBoard() {
    try {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) {
            console.error("Chessboard element not found");
            return;
        }
        const randomBoard = selectRandomChessboard();
        chessboard.style.backgroundImage = `url('${randomBoard}')`;
        debug(`Selected board: ${randomBoard}`);
    } catch (error) {
        debug(`Error creating board: ${error.message}`);
        console.error(error);
    }
}

function selectRandomChessboard() {
    const boardCount = 6;
    const boardNumber = Math.floor(Math.random() * boardCount) + 1;
    return `images/chessboard${boardNumber}.png`;
}

function resetGame() {
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
    document.getElementById('move-history').innerHTML = '';
    document.getElementById('debug').innerHTML = '';
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'auto';
        createBoard();
        placePieces();
    }
    
    debug('Game reset completed');
}

function initGame() {
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
}

// Start game when window loads
window.onload = initDifficultySelection;
