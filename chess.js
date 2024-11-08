// Initialize Supabase client
const supabase = window.gameDatabase;

// Game modes and state
const GameMode = {
    AI: 'ai',
    ONLINE: 'online'
};

// Game initialization flags
let isGameInitialized = false;
let currentGameMode = GameMode.AI;
let onlineGame = null;
let onlineGameId = null;
let onlineGameSubscription = null;
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

console.log('Chess game variables initialized:', {
    currentGameMode,
    isGameInitialized
});

// Core utility functions
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
function countDiagonalMoves(row, col) {
    let count = 0;
    const directions = [[1,1], [1,-1], [-1,1], [-1,-1]];
    
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            count++;
            if (board[r][c]) break;
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
            if (board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

function isFileOpen(col) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        const piece = board[row][col];
        if (piece && piece.toLowerCase() === 'p') {
            return false;
        }
    }
    return true;
}

function canMakeMove(startRow, startCol, endRow, endCol) {
    const piece = board[startRow][startCol];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    if (color !== currentPlayer) return false;
    
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
}

// Move validation functions
function isValidPawnMove(color, startRow, startCol, endRow, endCol) {
    const direction = color === 'blue' ? -1 : 1;
    const startingRow = color === 'blue' ? 6 : 1;
    
    const rowDiff = endRow - startRow;
    const colDiff = Math.abs(endCol - startCol);
    
    // Captures (including en passant)
    if (colDiff === 1 && rowDiff === direction) {
        const targetPiece = board[endRow][endCol];
        
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
    }
    
    // Forward moves
    if (colDiff === 0 && !board[endRow][endCol]) {
        // Single square forward
        if (rowDiff === direction) {
            return true;
        }
        // Initial two-square move
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
        
        // Kingside castling
        if (endCol === 6) {
            if ((color === 'blue' && pieceState.blueRooksMove.right) ||
                (color === 'red' && pieceState.redRooksMove.right)) return false;
                
            if (!isPathClear(row, 4, row, 7) || 
                board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        // Queenside castling
        if (endCol === 2) {
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

// Check detection and game state functions
let checkingAttack = false;

function isSquareUnderAttack(row, col, attackingColor) {
    if (checkingAttack) return false;
    checkingAttack = true;
    
    try {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = board[r][c];
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
    
    // Find king's position
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
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    const movingPiece = board[startRow][startCol];
    board[endRow][endCol] = movingPiece;
    board[startRow][startCol] = null;
    
    const inCheck = isKingInCheck(color);
    
    // Restore board
    board[startRow][startCol] = movingPiece;
    board[endRow][endCol] = originalPiece;
    
    return inCheck;
}

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

// After hasLegalMoves and before makeAIMove...

function endGame(winner) {
    gameState = 'ended';
    const message = winner === 'draw' ? 
        "Game Over - Draw!" : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);
    
    // Update leaderboard if available
    if (typeof updateGameResult === 'function') {
        updateGameResult(winner);
    }
    
    // Disable board interaction
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// AI Move Generation and Evaluation
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

function evaluateEasyMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Enhanced piece values
    const pieceValues = {
        'p': 150,  // Increased pawn value
        'n': 350,  // Knight value
        'b': 350,  // Bishop value
        'r': 525,  // Rook value
        'q': 1000, // Queen value
        'k': 400   // King value
    };
    
    // Strongly encourage capturing moves in easy mode
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()] * 2.0;
        
        // Extra bonus for pawn captures
        if (piece.toLowerCase() === 'p') {
            score += 400;
        }
    }
    
    // Positional bonuses
    if (piece.toLowerCase() === 'p') {
        // Encourage pawn advancement
        const advancement = endRow - startRow;
        score += advancement * 30;
        
        // Encourage pawns to control center
        if (endCol >= 3 && endCol <= 4) {
            score += 50;
        }
    } else if (piece.toLowerCase() !== 'k') {
        // Center control bonus for other pieces
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 40;
        }
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Add randomness for easy mode
    score += Math.random() * 150;
    
    return score;
}

function evaluateHardMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Enhanced piece values
    const pieceValues = {
        'p': 150,
        'n': 375,
        'b': 385,
        'r': 600,
        'q': 1200,
        'k': 2000
    };
    
    // Capturing bonus with 30% additional value
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()] * 1.3;
    }
    
    // Piece-specific evaluation
    switch (piece.toLowerCase()) {
        case 'p':
            score += evaluatePawnPosition(endRow, endCol, 'red') * 1.5;
            break;
        case 'n':
            score += evaluateKnightPosition(endRow, endCol) * 1.2;
            break;
        case 'b':
            score += evaluateBishopPosition(endRow, endCol) * 1.2;
            break;
        case 'r':
            score += evaluateRookPosition(endRow, endCol, 'red') * 1.3;
            break;
        case 'q':
            score += evaluateQueenPosition(endRow, endCol) * 1.2;
            break;
        case 'k':
            score += evaluateKingPosition(endRow, endCol, 'red') * 1.1;
            break;
    }
    
    // Check bonus
    if (isKingInCheck('blue')) {
        score += 200;
    }
    
    // Center control and mobility
    score += evaluateMobility('red') * 15;
    if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
        score += 40;
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 30;
        }
    }
    
    // Piece protection
    score += evaluatePieceProtection(endRow, endCol, 'red') * 25;
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Small random factor
    score += Math.random() * 15;
    
    return score;
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

// Position evaluation helpers
function evaluatePawnPosition(row, col, color) {
    let score = 0;
    const advancement = color === 'red' ? row : (7 - row);
    score += advancement * 15;
    
    if (col >= 2 && col <= 5) {
        score += 15;
    }
    
    return score;
}

function evaluateKnightPosition(row, col) {
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    return (7 - centerDistance) * 15;
}

function evaluateBishopPosition(row, col) {
    return countDiagonalMoves(row, col) * 8;
}

function evaluateRookPosition(row, col, color) {
    let score = 0;
    if (isFileOpen(col)) score += 40;
    return score;
}

function evaluateQueenPosition(row, col) {
    return (countDiagonalMoves(row, col) + countOrthogonalMoves(row, col)) * 3;
}

function evaluateKingPosition(row, col, color) {
    let score = 0;
    const backRank = color === 'red' ? 0 : 7;
    return row === backRank ? score + 50 : score;
}

function evaluatePieceProtection(row, col, color) {
    let protectionCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && getPieceColor(piece) === color) {
                if (canPieceMove(piece, r, c, row, col)) {
                    protectionCount++;
                }
            }
        }
    }
    return protectionCount;
}

function evaluateMobility(color) {
    let mobility = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === color) {
                for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
                    for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
                        if (canPieceMove(piece, row, col, endRow, endCol)) {
                            mobility++;
                        }
                    }
                }
            }
        }
    }
    return mobility;
}

// Game initialization and event handling
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
        
        // Debug each element
        Object.entries(elements).forEach(([name, element]) => {
            debug(`${name} found: ${!!element}`);
            if (!element) throw new Error(`${name} not found`);
        });
        
        // Rest of your initDifficultySelection code...
        elements.difficultyScreen.style.display = 'flex';
        elements.chessGame.style.display = 'none';
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
            const difficultyScreen = document.getElementById('difficulty-screen');
            const chessGame = document.getElementById('chess-game');
            
            if (difficultyScreen && chessGame) {
                difficultyScreen.style.display = 'flex';
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

function startGame() {
    try {
        console.log("Starting game...");
        if (!isGameInitialized) {
            resetGame();
            initGame();
            isGameInitialized = true;
        }
        
        // Reset game state
        board = JSON.parse(JSON.stringify(initialBoard));
        currentPlayer = 'blue';
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
        placePieces();
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

// Board creation and piece movement
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

// Online game functionality
function initOnlineControls() {
    const createGameBtn = document.getElementById('create-game');
    const joinGameBtn = document.getElementById('join-game');
    const joinGameInput = document.getElementById('join-game-input');
    const connectionStatus = document.getElementById('connection-status');

    createGameBtn.addEventListener('click', createOnlineGame);
    joinGameBtn.addEventListener('click', () => joinOnlineGame(joinGameInput.value));
}

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

// Move history functions
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

// Execute move for both modes
async function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    const piece = board[startRow][startCol];
    const color = getPieceColor(piece);
    const capturedPiece = board[endRow][endCol];
    
    // Update board state
    if (promotionPiece) {
        board[endRow][endCol] = promotionPiece;
    } else {
        board[endRow][endCol] = piece;
    }
    board[startRow][startCol] = null;

    // Handle special moves like castling
    if (piece.toLowerCase() === 'k' && Math.abs(endCol - startCol) === 2) {
        const row = color === 'blue' ? 7 : 0;
        if (endCol === 6) { // Kingside
            board[row][5] = board[row][7];
            board[row][7] = null;
        } else if (endCol === 2) { // Queenside
            board[row][3] = board[row][0];
            board[row][0] = null;
        }
    }

    // Update move history and display
    addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece);
    placePieces();
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';

    // Handle online game sync
    if (currentGameMode === GameMode.ONLINE) {
        await updateOnlineGame(startRow, startCol, endRow, endCol, promotionPiece);
    }
    
    // Check game end conditions and update display
    if (isCheckmate(currentPlayer)) {
        endGame(color);
    } else if (isStalemate(currentPlayer)) {
        endGame('draw');
    } else if (isKingInCheck(currentPlayer)) {
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
    } else {
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
    }

    // Make AI move if it's AI's turn
    if (currentGameMode === GameMode.AI && currentPlayer === 'red') {
        setTimeout(makeAIMove, 500);
    }

    return true;
}

// Export necessary functions
window.updateGameResult = updateGameResult;
