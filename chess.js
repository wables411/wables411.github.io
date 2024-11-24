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

// Wallet and Access Functions
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

// Board initialization functions
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
        placePieces();
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && selectedPiece) {
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            }
        });
        
        // Initialize multiplayer if needed
        if (isMultiplayerMode && !multiplayerManager) {
            initializeMultiplayer();
        }
        
        debug('Game initialization completed successfully');
    } catch (error) {
        console.error("Error during game initialization:", error);
        debug(`Error during game initialization: ${error.message}`);
    }
}

// Core move counting functions
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
        if (!targetPiece && pieceState.lastPawnDoubleMove && 
            lastMove && lastMove.piece.toLowerCase() === 'p' &&
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
        
        const kingMoved = color === 'blue' ? pieceState.blueKingMoved : pieceState.redKingMoved;
        if (kingMoved) return false;
        
        const rooks = color === 'blue' ? pieceState.blueRooksMove : pieceState.redRooksMove;
        
        // Kingside castling
        if (endCol === 6) {
            if (rooks.right) return false;
            if (!isPathClear(row, 4, row, 7)) return false;
            if (board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
            
            // Check if squares are under attack
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        // Queenside castling
        if (endCol === 2) {
            if (rooks.left) return false;
            if (!isPathClear(row, 0, row, 4)) return false;
            if (board[row][0] !== (color === 'blue' ? 'r' : 'R')) return false;
            
            return !isSquareUnderAttack(row, 2, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 3, color === 'blue' ? 'red' : 'blue');
        }
    }
    
    return false;
}

// Path checking
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

// Check and threat detection
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

// Core move validation
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

function canMakeMove(startRow, startCol, endRow, endCol) {
    const piece = board[startRow][startCol];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    if (color !== currentPlayer) return false;
    
    if (isMultiplayerMode && color !== playerColor) return false;
    
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
}

// Game state checking
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

// AI Constants and Configuration
const PIECE_VALUES = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
};

// Main AI Move Generation
function makeAIMove() {
    if (currentGameMode !== GameMode.AI || currentPlayer !== 'red' || isMultiplayerMode) return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    const move = selectBestMove();
    if (move) {
        setTimeout(() => {
            executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
        }, 500);
    } else {
        debug("No valid moves found for AI");
    }
}

function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    const inCheck = isKingInCheck('red');

    // Evaluate each move
    legalMoves.forEach(move => {
        if (gameDifficulty === 'harder') {
            move.score = evaluateHardMove(move);
        } else {
            move.score = evaluateEasyMove(move);
        }

        // Bonus for getting out of check
        if (inCheck) {
            const tempBoard = simulateMove(move);
            if (!isKingInCheck('red')) {
                move.score += 1000;
            }
            restoreBoard(tempBoard);
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);

    // Move selection based on difficulty
    if (inCheck || gameDifficulty === 'harder') {
        // In check or hard mode: mostly choose best move
        return Math.random() < 0.9 ? legalMoves[0] : 
               legalMoves[1] || legalMoves[0];
    } else {
        // Easy mode: more randomness
        const topMoves = legalMoves.slice(0, Math.min(3, legalMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
}

// Board manipulation helpers for evaluation
function simulateMove(move) {
    const boardCopy = board.map(row => [...row]);
    board[move.endRow][move.endCol] = board[move.startRow][move.startCol];
    board[move.startRow][move.startCol] = null;
    return boardCopy;
}

function restoreBoard(boardCopy) {
    board = boardCopy.map(row => [...row]);
}

// Easy Mode Evaluation
function evaluateEasyMove(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol];
    const targetPiece = board[move.endRow][move.endCol];

    // Material value
    if (targetPiece) {
        score += PIECE_VALUES[targetPiece.toLowerCase()] * 1.5;
    }

    // Basic positional evaluation
    score += evaluateBasicPosition(move);

    // Add randomness for unpredictability
    score += Math.random() * 200;

    return score;
}

function evaluateBasicPosition(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol].toLowerCase();

    // Center control bonus
    if (move.endRow >= 2 && move.endRow <= 5 && move.endCol >= 2 && move.endCol <= 5) {
        score += 50;
    }

    // Piece-specific basic positioning
    switch (piece) {
        case 'p':
            score += move.endRow * 10; // Advance pawns
            break;
        case 'n':
        case 'b':
            if (move.endRow >= 2 && move.endRow <= 5) score += 30; // Develop pieces
            break;
        case 'r':
            if (isFileOpen(move.endCol)) score += 40; // Open files
            break;
        case 'q':
            if (move.endRow > 2) score -= 20; // Discourage early queen development
            break;
        case 'k':
            if (move.endRow > 1) score -= 30; // Keep king safe in early game
            break;
    }

    return score;
}

// Harder Mode Evaluation
function evaluateHardMove(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol];
    const targetPiece = board[move.endRow][move.endCol];

    // Simulate the move
    const boardCopy = simulateMove(move);

    // Material evaluation with piece-square tables
    score += evaluateMaterial(move);
    score += evaluatePosition(move);
    score += evaluatePieceActivity(move);
    score += evaluateKingSafety(move);
    score += evaluateThreats(move);

    // Restore the board
    restoreBoard(boardCopy);

    return score;
}

function evaluateMaterial(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol];
    const targetPiece = board[move.endRow][move.endCol];
    
    if (targetPiece) {
        // Capturing
        score += PIECE_VALUES[targetPiece.toLowerCase()] * 2;
        
        // Bonus for capturing with lesser pieces
        if (piece) {  // Add this check
            const attackingPieceValue = PIECE_VALUES[piece.toLowerCase()];
            const targetPieceValue = PIECE_VALUES[targetPiece.toLowerCase()];
            if (attackingPieceValue < targetPieceValue) {
                score += (targetPieceValue - attackingPieceValue) * 0.5;
            }
        }
    }

    return score;
}

function evaluatePosition(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol].toLowerCase();
    const gamePhase = calculateGamePhase();

    // Center control bonus with dynamic weightings
    const centerValue = gamePhase === 'opening' ? 80 : 
                       gamePhase === 'middlegame' ? 60 : 40;
    
    if (move.endRow >= 2 && move.endRow <= 5 && move.endCol >= 2 && move.endCol <= 5) {
        score += centerValue;
        if (move.endRow >= 3 && move.endRow <= 4 && move.endCol >= 3 && move.endCol <= 4) {
            score += centerValue * 0.5;
        }
    }

    // Piece-specific positional evaluation
    switch (piece) {
        case 'p':
            score += evaluatePawnPosition(move, gamePhase);
            break;
        case 'n':
            score += evaluateKnightPosition(move, gamePhase);
            break;
        case 'b':
            score += evaluateBishopPosition(move, gamePhase);
            break;
        case 'r':
            score += evaluateRookPosition(move, gamePhase);
            break;
        case 'q':
            score += evaluateQueenPosition(move, gamePhase);
            break;
        case 'k':
            score += evaluateKingPosition(move, gamePhase);
            break;
    }

    return score;
}

function evaluatePawnPosition(move, gamePhase) {
    let score = 0;
    const rank = 7 - move.endRow;  // Perspective from red's side

    // Passed pawn detection and bonus
    if (isPassedPawn(move.endRow, move.endCol, 'red')) {
        score += 100 + (rank * 20);
        if (gamePhase === 'endgame') score *= 1.5;
    }

    // Connected pawns bonus
    if (hasFriendlyPawnNeighbor(move.endRow, move.endCol)) {
        score += 50;
    }

    // Chain formation
    if (isPawnChain(move.endRow, move.endCol)) {
        score += 30;
    }

    // Isolated pawn penalty
    if (isIsolatedPawn(move.endCol)) {
        score -= 50;
    }

    // Doubled pawn penalty
    if (isDoubledPawn(move.endCol)) {
        score -= 40;
    }

    return score;
}

function evaluateKnightPosition(move, gamePhase) {
    let score = 0;

    // Outpost detection
    if (isKnightOutpost(move.endRow, move.endCol)) {
        score += 80;
        if (isPieceProtected(move.endRow, move.endCol, 'red')) {
            score += 20;
        }
    }

    // Mobility
    const mobilityCount = countKnightMobility(move.endRow, move.endCol);
    score += mobilityCount * 10;

    // Distance from enemy king in endgame
    if (gamePhase === 'endgame') {
        const kingDistance = getDistanceToEnemyKing(move.endRow, move.endCol, 'blue');
        score += (7 - kingDistance) * 15;
    }

    return score;
}

function evaluateBishopPosition(move, gamePhase) {
    let score = 0;

    // Mobility on diagonals
    const mobilityScore = countDiagonalMoves(move.endRow, move.endCol) * 8;
    score += mobilityScore;

    // Bishop pair bonus
    if (hasBishopPair('red')) {
        score += 50;
    }

    // Control of long diagonals
    if (isOnLongDiagonal(move.endRow, move.endCol)) {
        score += 35;
    }

    // Fianchetto formation bonus
    if ((move.endCol === 1 || move.endCol === 6) && move.endRow === 1) {
        score += 40;
    }

    return score;
}

function evaluateRookPosition(move, gamePhase) {
    let score = 0;

    // Open file bonus
    if (isFileOpen(move.endCol)) {
        score += 60;
    } else if (isSemiOpenFile(move.endCol, 'red')) {
        score += 30;
    }

    // Seventh rank control
    if (move.endRow === 6) {
        score += 60;
    }

    // Connected rooks
    if (hasConnectedRook(move.endRow, move.endCol)) {
        score += 40;
    }

    // Mobility
    score += countOrthogonalMoves(move.endRow, move.endCol) * 5;

    return score;
}

function evaluateQueenPosition(move, gamePhase) {
    let score = 0;

    // Early development penalty
    if (gamePhase === 'opening' && move.endRow < 2) {
        score -= 60;
    }

    // Mobility
    const mobilityScore = (countDiagonalMoves(move.endRow, move.endCol) + 
                          countOrthogonalMoves(move.endRow, move.endCol)) * 4;
    score += mobilityScore;

    // King proximity in endgame
    if (gamePhase === 'endgame') {
        const kingDistance = getDistanceToEnemyKing(move.endRow, move.endCol, 'blue');
        score += (7 - kingDistance) * 10;
    }

    return score;
}

function evaluateKingPosition(move, gamePhase) {
    let score = 0;

    if (gamePhase === 'opening' || gamePhase === 'middlegame') {
        // King safety in early/middle game
        if (move.endRow < 2) {
            score += 60;
        }
        // Castling possibility preservation
        if (!pieceState.redKingMoved) {
            score += 40;
        }
        // Pawn shield
        score += evaluatePawnShield(move.endRow, move.endCol);
    } else {
        // King activity in endgame
        const centerDistance = Math.max(
            Math.abs(3.5 - move.endRow),
            Math.abs(3.5 - move.endCol)
        );
        score += (4 - centerDistance) * 20;
        
        // Proximity to enemy pawns
        score += evaluateKingPawnProximity(move.endRow, move.endCol);
    }

    return score;
}

function evaluatePieceActivity(move) {
    let score = 0;
    const piece = board[move.startRow][move.startCol];

    // Control of key squares
    if (isControllingCenter(move.endRow, move.endCol)) {
        score += 40;
    }

    // Piece coordination
    if (isPieceProtected(move.endRow, move.endCol, 'red')) {
        score += 30;
    }

    // Development in opening
    if (isEarlyGame() && move.endRow > move.startRow && piece.toLowerCase() !== 'k') {
        score += 25;
    }

    return score;
}

function evaluateKingSafety(move) {
    let score = 0;

    // Pawn shield integrity
    score += evaluatePawnShield(move.endRow, move.endCol);

    // King exposure
    const attackingSquares = countAttackingSquaresNearKing('blue');
    score -= attackingSquares * 10;

    // Open files near king
    for (let c = Math.max(0, move.endCol - 1); c <= Math.min(7, move.endCol + 1); c++) {
        if (isFileOpen(c)) {
            score -= 30;
        }
    }

    return score;
}

function evaluateThreats(move) {
    let score = 0;
    const boardCopy = simulateMove(move);

    // Attacking enemy pieces
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const targetPiece = board[r][c];
            if (targetPiece && getPieceColor(targetPiece) === 'blue') {
                if (isSquareUnderAttack(r, c, 'red')) {
                    score += PIECE_VALUES[targetPiece.toLowerCase()] * 0.1;
                }
            }
        }
    }

    // Control of key squares
    for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 5; c++) {
            if (isSquareUnderAttack(r, c, 'red')) {
                score += 10;
            }
        }
    }

    restoreBoard(boardCopy);
    return score;
}

function calculateGamePhase() {
    let material = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            switch (piece.toLowerCase()) {
                case 'q': material += 4; break;
                case 'r': material += 2; break;
                case 'n':
                case 'b': material += 1; break;
            }
        }
    }
    if (material >= 12) return 'opening';
    if (material >= 8) return 'middlegame';
    return 'endgame';
}

function isEarlyGame() {
    let pieceCount = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col]) pieceCount++;
        }
    }
    return pieceCount >= 24;
}

function isPawnChain(row, col) {
    const color = getPieceColor(board[row][col]);
    const direction = color === 'red' ? 1 : -1;
    
    return (isWithinBoard(row + direction, col - 1) && 
            board[row + direction][col - 1]?.toLowerCase() === 'p' && 
            getPieceColor(board[row + direction][col - 1]) === color) ||
           (isWithinBoard(row + direction, col + 1) && 
            board[row + direction][col + 1]?.toLowerCase() === 'p' && 
            getPieceColor(board[row + direction][col + 1]) === color);
}

function evaluatePawnShield(row, col) {
    let score = 0;
    const pawnRows = [row + 1, row + 2];
    
    for (const r of pawnRows) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
            if (isWithinBoard(r, c) && board[r][c]?.toLowerCase() === 'p' && 
                getPieceColor(board[r][c]) === 'red') {
                score += 20 - (Math.abs(c - col) * 5);
            }
        }
    }
    
    return score;
}

function evaluateKingPawnProximity(row, col) {
    let score = 0;
    for (let r = Math.max(0, row - 2); r <= Math.min(7, row + 2); r++) {
        for (let c = Math.max(0, col - 2); c <= Math.min(7, col + 2); c++) {
            const piece = board[r][c];
            if (piece?.toLowerCase() === 'p' && getPieceColor(piece) === 'blue') {
                score += 15 - (Math.abs(r - row) + Math.abs(c - col)) * 3;
            }
        }
    }
    return score;
}

function countKnightMobility(row, col) {
    const moves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    let count = 0;
    
    for (const [dr, dc] of moves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isWithinBoard(newRow, newCol) && 
            (!board[newRow][newCol] || getPieceColor(board[newRow][newCol]) === 'blue')) {
            count++;
        }
    }
    
    return count;
}

function countAttackingSquaresNearKing(color) {
    const kingPos = findKing(color);
    if (!kingPos) return 0;
    
    let count = 0;
    for (let r = Math.max(0, kingPos.row - 1); r <= Math.min(7, kingPos.row + 1); r++) {
        for (let c = Math.max(0, kingPos.col - 1); c <= Math.min(7, kingPos.col + 1); c++) {
            if (isSquareUnderAttack(r, c, color === 'red' ? 'blue' : 'red')) {
                count++;
            }
        }
    }
    return count;
}

function findKing(color) {
    const kingPiece = color === 'blue' ? 'k' : 'K';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === kingPiece) {
                return { row, col };
            }
        }
    }
    return null;
}

function isDoubledPawn(col) {
    let pawnCount = 0;
    for (let row = 0; row < 8; row++) {
        if (board[row][col]?.toLowerCase() === 'p') {
            pawnCount++;
        }
    }
    return pawnCount > 1;
}

function isSemiOpenFile(col, color) {
    let hasOwnPawn = false;
    let hasEnemyPawn = false;
    
    for (let row = 0; row < 8; row++) {
        const piece = board[row][col];
        if (piece?.toLowerCase() === 'p') {
            if (getPieceColor(piece) === color) {
                hasOwnPawn = true;
            } else {
                hasEnemyPawn = true;
            }
        }
    }
    
    return !hasOwnPawn && hasEnemyPawn;
}

function isControllingCenter(row, col) {
    const centerSquares = [
        [3,3], [3,4], [4,3], [4,4]
    ];
    
    for (const [r, c] of centerSquares) {
        if (canPieceMove(board[row][col], row, col, r, c)) {
            return true;
        }
    }
    return false;
}

// UI initialization functions
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

// Game initialization and control
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
        
        if (isMultiplayerMode && multiplayerManager) {
            return;
        }
        
        // Reset game state
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

        createBoard();
        placePieces();
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

        debug('Game started successfully');
    } catch (error) {
        console.error("Error starting game:", error);
        debug(`Error starting game: ${error.message}`);
    }
}

function initGameModeControls() {
    const aiModeBtn = document.getElementById('ai-mode');
    const multiplayerModeBtn = document.getElementById('multiplayer-mode');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const multiplayerMenu = document.querySelector('.multiplayer-menu');

    if (aiModeBtn) {
        aiModeBtn.addEventListener('click', () => {
            currentGameMode = GameMode.AI;
            isMultiplayerMode = false;
            aiModeBtn.classList.add('selected');
            if (multiplayerModeBtn) multiplayerModeBtn.classList.remove('selected');
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (difficultyScreen) difficultyScreen.style.display = 'flex';
            if (multiplayerManager) multiplayerManager.leaveGame();
        });
    }

    if (multiplayerModeBtn) {
        multiplayerModeBtn.addEventListener('click', () => {
            currentGameMode = GameMode.ONLINE;
            isMultiplayerMode = true;
            multiplayerModeBtn.classList.add('selected');
            if (aiModeBtn) aiModeBtn.classList.remove('selected');
            if (difficultyScreen) difficultyScreen.style.display = 'none';
            if (multiplayerMenu) multiplayerMenu.style.display = 'block';
            initializeMultiplayer();
        });
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
            debug('Harder mode clicked');
            gameDifficulty = 'harder';
            selectedDifficulty = 'harder';
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
            if (isMultiplayerMode && multiplayerManager) {
                multiplayerManager.leaveGame();
            }
            
            const difficultyScreen = document.getElementById('difficulty-screen');
            const chessGame = document.getElementById('chess-game');
            const multiplayerMenu = document.querySelector('.multiplayer-menu');
            
            if (difficultyScreen && chessGame) {
                if (isMultiplayerMode) {
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

// Piece movement handlers
function onPieceClick(event) {
    try {
        if (!checkGameAccess()) return;
        
        if (isMultiplayerMode) {
            if (currentPlayer !== playerColor) return;
        } else if (currentGameMode === GameMode.AI && currentPlayer !== 'blue') {
            return;
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
        const validPlayer = isMultiplayerMode ? 
            pieceColor === playerColor : 
            pieceColor === currentPlayer;
            
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
        if (isMultiplayerMode) {
            if (currentPlayer !== playerColor) return;
        } else if (currentGameMode === GameMode.AI && currentPlayer !== 'blue') {
            return;
        }
        
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
        debug(`Square click error: ${error.message}`);
    }
}

// Move execution and history
function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    if (isMultiplayerMode && multiplayerManager) {
        return multiplayerManager.makeMove(startRow, startCol, endRow, endCol, promotionPiece);
    }

    const piece = board[startRow][startCol];
    const color = getPieceColor(piece);
    const capturedPiece = board[endRow][endCol];
    
    if (promotionPiece) {
        board[endRow][endCol] = promotionPiece;
    } else {
        board[endRow][endCol] = piece;
    }
    board[startRow][startCol] = null;

    // Handle castling
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
    
    // Update game state and current player
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    
    // Check for endgame conditions
    if (isCheckmate(currentPlayer)) {
        endGame(color);
    } else if (isStalemate(currentPlayer)) {
        endGame('draw');
    } else if (isKingInCheck(currentPlayer)) {
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
    } else {
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
    }

    // Make AI move if appropriate
    if (currentGameMode === GameMode.AI && currentPlayer === 'red' && !isMultiplayerMode) {
        setTimeout(makeAIMove, 500);
    }

    return true;
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
        debug(`Move history error: ${error.message}`);
    }
}

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = isMultiplayerMode ? playerColor : currentPlayer;
    
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    
    if (endRow === 0) {
        dialog.style.top = '12.5%';
    } else {
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

// Game end handling
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

    // Process winner payout if betting is active
    if (window.chessBetting && isMultiplayerMode) {
        window.chessBetting.processWinner(winner);
    }
    
    // Update online game status if in multiplayer mode
    if (isMultiplayerMode && multiplayerManager) {
        multiplayerManager.updateGameStatus('completed', winner);
    }
    
    // Disable board interaction
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing chess game...");
        initGameModeControls();
        initDifficultySelection();
        initRestartButton();
        
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
        if (isMultiplayerMode && multiplayerManager) {
            multiplayerManager.leaveGame();
        }
        
        selectedPiece = null;
        gameState = 'ended';
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
});

// Multiplayer initialization
function initializeMultiplayer() {
    if (!multiplayerManager) {
        multiplayerManager = new MultiplayerManager();
    }
}

// Game integration with multiplayer
function isValidGameMove(piece, startRow, startCol, endRow, endCol) {
    const color = getPieceColor(piece);
    
    // Check if it's the correct player's turn
    if (color !== currentPlayer) return false;
    
    // In multiplayer mode, check if it's the player's piece
    if (isMultiplayerMode) {
        if (color !== playerColor) return false;
    }
    
    // Check if the move is valid according to chess rules
    if (!canPieceMove(piece, startRow, startCol, endRow, endCol)) return false;
    
    return true;
}

// Betting system hooks
function initializeBetting() {
    try {
        if (window.chessBetting && !window.chessBetting.initialized) {
            window.chessBetting.init().catch(error => {
                console.error('Betting initialization failed:', error);
                debug('Betting system initialization failed');
            });
        }
    } catch (error) {
        console.error('Error initializing betting system:', error);
        debug('Error initializing betting system');
    }
}

// Multiplayer game state updates
function updateGameState(gameData) {
    try {
        if (!gameData) return;

        // Update board state
        if (gameData.board && gameData.board.positions) {
            board = JSON.parse(JSON.stringify(gameData.board.positions));
            
            if (gameData.board.pieceState) {
                Object.assign(pieceState, gameData.board.pieceState);
            }
            
            placePieces();
            debug('Board updated from multiplayer data');
        }

        // Update current turn
        if (gameData.current_player) {
            currentPlayer = gameData.current_player;
            const isMyTurn = currentPlayer === playerColor;
            
            const chessboard = document.getElementById('chessboard');
            if (chessboard) {
                chessboard.style.pointerEvents = isMyTurn ? 'auto' : 'none';
            }
            
            updateStatusDisplay(isMyTurn ? "Your turn" : "Opponent's turn");
        }

        // Handle game end states
        if (gameData.game_state === 'ended') {
            handleGameEnd(gameData.winner);
        }
    } catch (error) {
        console.error('Error updating game state:', error);
        debug('Error updating multiplayer game state');
    }
}

function handleGameEnd(winner) {
    const message = winner === 'draw' ? 
        'Game Over - Draw!' : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);

    // Handle betting outcome
    if (window.chessBetting && gameData.bet_amount > 0) {
        window.chessBetting.processWinner(winner);
    }

    // Update leaderboard
    if (window.updateGameResult) {
        if (winner === 'draw') {
            window.updateGameResult('draw');
        } else {
            window.updateGameResult(winner === playerColor ? 'win' : 'loss');
        }
    }

    // Refresh leaderboard display
    if (window.leaderboardManager) {
        window.leaderboardManager.loadLeaderboard();
    }

    // Disable board interaction
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// Wallet connection status checks
function handleWalletConnection(walletAddress) {
    if (!walletAddress) return;
    
    localStorage.setItem('currentPlayer', walletAddress);
    debug(`Wallet connected: ${walletAddress}`);
    
    // Initialize betting system if needed
    if (window.chessBetting) {
        initializeBetting();
    }
    
    // Show appropriate game screen
    const difficultyScreen = document.getElementById('difficulty-screen');
    if (difficultyScreen) {
        difficultyScreen.style.display = 'flex';
    }
}

function handleWalletDisconnect() {
    localStorage.removeItem('currentPlayer');
    localStorage.removeItem('walletType');
    
    // Reset game state
    resetGame();
    
    // Update UI
    updateStatusDisplay("Connect to play");
    
    // Hide game screens
    const difficultyScreen = document.getElementById('difficulty-screen');
    const chessGame = document.getElementById('chess-game');
    if (difficultyScreen) difficultyScreen.style.display = 'none';
    if (chessGame) chessGame.style.display = 'none';
    
    debug('Wallet disconnected');
}

// Cleanup functions
function cleanupMultiplayerGame() {
    if (multiplayerManager) {
        multiplayerManager.leaveGame();
    }
    
    if (window.chessBetting) {
        window.chessBetting.cleanup();
    }
    
    playerColor = null;
    isMultiplayerMode = false;
    resetGame();
}

// Export necessary functions for external use
window.chess = {
    initializeMultiplayer,
    handleWalletConnection,
    handleWalletDisconnect,
    updateGameState,
    cleanupMultiplayerGame
};