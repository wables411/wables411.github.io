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

// Add these variables to track game state
let movesSincePawnOrCapture = 0;
let positionHistory = [];

// Add this function to check for threefold repetition
function getPositionString() {
    let position = '';
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            position += board[row][col] || '-';
        }
    }
    return position + '_' + currentPlayer;
}

// Piece movement tracking for castling and en passant
const pieceState = {
    blueKingMoved: false,
    redKingMoved: false,
    blueRooksMove: { left: false, right: false },
    redRooksMove: { left: false, right: false },
    lastPawnDoubleMove: null // For en passant
};

// Game state
let board = JSON.parse(JSON.stringify(initialBoard));
let selectedPiece = null;
let currentPlayer = 'blue';
let moveHistory = [];
let gameState = 'active';
let lastMove = null;
let hoveredSquare = null;

// Constants
const pieceImages = {
    'R': 'images/redRook.png', 
    'N': 'images/redKnight.png', 
    'B': 'images/redBishop.png',
    'Q': 'images/redQueen.png', 
    'K': 'images/redKing.png', 
    'P': 'images/redPawn.png',
    'r': 'images/blueRook.png', 
    'n': 'images/blueKnight.png', 
    'b': 'images/blueBishop.png',
    'q': 'images/blueQueen.png', 
    'k': 'images/blueKing.png', 
    'p': 'images/bluePawn.png'
};

function updateStatusDisplay(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        debug(`Status updated: ${message}`);
    }
}

function endGame(winner) {
    const message = winner === 'draw' ? 
        "Game Over - It's a draw!" : 
        `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    
    updateStatusDisplay(message);
    debug(`Game ended: ${message}`);
    
    // Disable board interactions
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// Utility functions
function isWithinBoard(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
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

// Board coordinate conversion
function algebraicToCoords(algebraic) {
    const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(algebraic[1]);
    return { row, col };
}

function coordsToAlgebraic(row, col) {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
}

let checkingAttack = false;

// Game state checks
function isSquareUnderAttack(row, col, attackingColor) {
    // Prevent recursive checking
    if (checkingAttack) return false;
    checkingAttack = true;
    
    try {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === attackingColor) {
                    // Simplify attack checking for kings to prevent recursion
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
    // Find king's position
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
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    const movingPiece = board[startRow][startCol];
    board[endRow][endCol] = movingPiece;
    board[startRow][startCol] = null;
    
    // Check if king is in check
    const inCheck = isKingInCheck(color);
    
    // Undo move
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

// Move validation functions
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
    
    // Check if move would expose king to check
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
        
        // Check if king or rooks have moved
        if (color === 'blue' && pieceState.blueKingMoved) return false;
        if (color === 'red' && pieceState.redKingMoved) return false;
        
        // Kingside castling
        if (endCol === 6) {
            if ((color === 'blue' && pieceState.blueRooksMove.right) ||
                (color === 'red' && pieceState.redRooksMove.right)) return false;
                
            if (!isPathClear(row, 4, row, 7) || 
                board[row][7] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            // Check if squares are under attack
            return !isSquareUnderAttack(row, 5, color === 'blue' ? 'red' : 'blue') &&
                   !isSquareUnderAttack(row, 6, color === 'blue' ? 'red' : 'blue');
        }
        
        // Queenside castling
        if (endCol === 2) {
            if ((color === 'blue' && pieceState.blueRooksMove.left) ||
                (color === 'red' && pieceState.redRooksMove.left)) return false;
                
            if (!isPathClear(row, 0, row, 4) || 
                board[row][0] !== (color === 'blue' ? 'r' : 'R')) return false;
                
            // Check if squares are under attack
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

function isPawnPromotion(piece, endRow) {
    return piece.toLowerCase() === 'p' && (endRow === 0 || endRow === 7);
}

// Move execution and game state update
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
            
            // Update king movement state
            if (color === 'blue') {
                pieceState.blueKingMoved = true;
            } else {
                pieceState.redKingMoved = true;
            }
            
            // Kingside castling
            if (endCol === 6) {
                board[row][5] = board[row][7]; // Move rook
                board[row][7] = null;
                if (color === 'blue') {
                    pieceState.blueRooksMove.right = true;
                } else {
                    pieceState.redRooksMove.right = true;
                }
            }
            // Queenside castling
            else if (endCol === 2) {
                board[row][3] = board[row][0]; // Move rook
                board[row][0] = null;
                if (color === 'blue') {
                    pieceState.blueRooksMove.left = true;
                } else {
                    pieceState.redRooksMove.left = true;
                }
            }
        }
        
        // Update rook movement state for castling
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
        // Handle en passant capture
        else if (pieceType === 'p' && startCol !== endCol && !capturedPiece) {
            board[startRow][endCol] = null; // Remove captured pawn
            board[endRow][endCol] = piece;
            board[startRow][startCol] = null;
            debug('En passant capture executed');
        }
        // Normal move
        else {
            board[endRow][endCol] = piece;
            board[startRow][startCol] = null;
        }
        
        // Update last move for en passant
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
        
        // Check game state
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
    
    // Check for checkmate or stalemate first
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
    
    // Switch players
    currentPlayer = enemyColor;
    
    // Check for check after switching players
    if (isKingInCheck(currentPlayer)) {
        gameState = 'check';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
        debug(`${currentPlayer} is in check`);
    } else {
        gameState = 'active';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
    }
    
    // Always trigger AI move if it's red's turn, regardless of check state
    if (currentPlayer === 'red') {
        debug('Triggering AI move...');
        setTimeout(makeAIMove, 500);
    }
}

// Improved AI with piece movement and captures
function makeAIMove() {
    if (currentPlayer !== 'red') return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck})`);
    
    // Get all legal moves
    let legalMoves = [];
    for (let startRow = 0; startRow < BOARD_SIZE; startRow++) {
        for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
            const piece = board[startRow][startCol];
            if (piece && getPieceColor(piece) === 'red') {
                for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
                    for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
                        if (canPieceMove(piece, startRow, startCol, endRow, endCol)) {
                            // Test move to see if it leaves us in check
                            const originalPiece = board[endRow][endCol];
                            board[endRow][endCol] = piece;
                            board[startRow][startCol] = null;
                            
                            const stillInCheck = isKingInCheck('red');
                            
                            // Restore board
                            board[startRow][startCol] = piece;
                            board[endRow][endCol] = originalPiece;
                            
                            if (!stillInCheck) {
                                legalMoves.push({
                                    piece,
                                    startRow,
                                    startCol,
                                    endRow,
                                    endCol
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    debug(`Found ${legalMoves.length} legal moves`);
    
    if (legalMoves.length === 0) {
        if (inCheck) {
            debug('Checkmate - no legal moves while in check');
            gameState = 'checkmate';
            endGame('blue');
        } else {
            debug('Stalemate - no legal moves');
            gameState = 'stalemate';
            endGame('draw');
        }
        return;
    }
    
    // Evaluate and select the best move
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of legalMoves) {
        let score;
        if (inCheck) {
            // If in check, use special evaluation
            score = 10000; // Base score for any legal move when in check
            
            // Add bonus for capturing pieces
            if (board[move.endRow][move.endCol]) {
                const pieceValues = {
                    'p': 100, 'n': 300, 'b': 300, 'r': 500, 'q': 900, 'k': 0
                };
                score += pieceValues[board[move.endRow][move.endCol].toLowerCase()];
            }
        } else {
            score = evaluateMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    if (bestMove) {
        debug(`AI executing move with score: ${bestScore}`);
        executeMove(bestMove.startRow, bestMove.startCol, bestMove.endRow, bestMove.endCol);
    }
}

function evaluateMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Heavily prioritize moves that get out of check
    const wasInCheck = isKingInCheck('red');
    if (wasInCheck && !isKingInCheck('red')) {
        score += 10000; // Very high priority for escaping check
    }
    
    // Heavily penalize moves that leave us in check
    if (isKingInCheck('red')) {
        score -= 20000; // Even higher penalty for staying in check
    }
    
    // Basic piece values
    const pieceValues = {
        'p': 100, 'n': 300, 'b': 300, 'r': 500, 'q': 900, 'k': 10000
    };
    
    // Capturing pieces (increased values)
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()];
    }
    
    // King safety and movement penalties
    if (piece.toLowerCase() === 'k') {
        if (endRow === 0 || endRow === 7) {
            score += 50; // Prefer back rank
        }
        
        // Add strong penalty for repetitive king moves
        if (!wasInCheck) {
            score -= 150; // Increased penalty for unnecessary king movement
            
            // Additional penalty if the king is moving back to a recently visited square
            const position = `${endRow},${endCol}`;
            if (moveHistory.slice(-6).some(move => 
                move.includes(`K${coordsToAlgebraic(endRow, endCol)}`))) {
                score -= 500; // Heavy penalty for revisiting same squares
            }
        }
    }
    
    // Center control (reduced priority for endgame)
    if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
        score += 20;
    }
    
    // Protect king area
    const kingRow = piece === 'K' ? 0 : 7;
    if (Math.abs(endRow - kingRow) <= 1) {
        score += 10;
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    return score;
}

function evaluateCheckEscapeMove(piece, startRow, startCol, endRow, endCol, kingRow, kingCol) {
    let score = 20000; // Base score for any move that escapes check
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Bonus for capturing a piece that gives check
    if (originalPiece) {
        score += 5000;
        
        const pieceValues = {
            'p': 100, 'n': 300, 'b': 300, 'r': 500, 'q': 900, 'k': 0
        };
        score += pieceValues[originalPiece.toLowerCase()];
    }
    
    // Bonus for moves that defend the king
    if (!piece === 'K') {
        const distanceToKing = Math.max(
            Math.abs(endRow - kingRow),
            Math.abs(endCol - kingCol)
        );
        score += (8 - distanceToKing) * 100;
    }
    
    // King safety bonus
    if (piece === 'K') {
        // Prefer corners and edges when escaping
        if (endRow === 0 || endRow === 7 || endCol === 0 || endCol === 7) {
            score += 300;
        }
        // Avoid center squares when escaping
        if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
            score -= 200;
        }
    }
    
    // Bonus if the move puts opponent in check
    if (isKingInCheck('blue')) {
        score += 1000;
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    return score;
}

function addMoveToHistory(piece, startRow, startCol, endRow, endCol, capturedPiece) {
    try {
        const notation = generateMoveNotation(piece, startRow, startCol, endRow, endCol, capturedPiece);
        moveHistory.push(notation);
        
        const historyElement = document.getElementById('move-history');
        if (historyElement) {
            const moveNumber = Math.floor(moveHistory.length / 2) + 1;
            const newMove = document.createElement('div');
            newMove.textContent = `${moveNumber}. ${notation}`;
            
            // Highlight captures in red
            if (capturedPiece) {
                newMove.style.color = '#ff6b6b';
            }
            
            historyElement.appendChild(newMove);
            historyElement.scrollTop = historyElement.scrollHeight;
        }
        
        debug(`Move recorded: ${notation}`);
    } catch (error) {
        debug(`Error adding move to history: ${error.message}`);
        console.error(error);
    }
}

function generateMoveNotation(piece, startRow, startCol, endRow, endCol, capturedPiece) {
    try {
        const pieceSymbol = piece.toLowerCase() === 'p' ? '' : 
                           piece.toLowerCase() === 'n' ? 'N' : 
                           piece.toUpperCase();
        
        const startSquare = coordsToAlgebraic(startRow, startCol);
        const endSquare = coordsToAlgebraic(endRow, endCol);
        const captureSymbol = capturedPiece ? 'x' : '';
        
        // Special notation for castling
        if (piece.toLowerCase() === 'k' && Math.abs(endCol - startCol) === 2) {
            return endCol > startCol ? 'O-O' : 'O-O-O';
        }
        
        let notation = `${pieceSymbol}${startSquare}${captureSymbol}${endSquare}`;
        
        // Add check/checkmate symbols if applicable
        const enemyColor = getPieceColor(piece) === 'blue' ? 'red' : 'blue';
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[endRow][endCol] = piece;
        tempBoard[startRow][startCol] = null;
        
        if (isCheckmate(enemyColor)) {
            notation += '#';
        } else if (isKingInCheck(enemyColor)) {
            notation += '+';
        }
        
        return notation;
    } catch (error) {
        debug(`Error generating notation: ${error.message}`);
        console.error(error);
        return 'error';
    }
}

function coordsToAlgebraic(row, col) {
    return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function algebraicToCoords(algebraic) {
    const col = algebraic.charCodeAt(0) - 97;
    const row = 8 - parseInt(algebraic[1]);
    return { row, col };
}

// UI Event Handlers
function onSquareClick(row, col) {
    try {
        if (gameState !== 'active' && gameState !== 'check') return;
        if (currentPlayer !== 'blue') return;
        
        // If we have a selected piece
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = board[startRow][startCol];
            
            // Check if this is a valid move
            if (canPieceMove(piece, startRow, startCol, row, col)) {
                // Test if move gets us out of check
                const originalPiece = board[row][col];
                board[row][col] = piece;
                board[startRow][startCol] = null;
                
                const stillInCheck = isKingInCheck('blue');
                
                // Undo test move
                board[startRow][startCol] = piece;
                board[row][col] = originalPiece;
                
                if (!stillInCheck) {
                    debug(`Attempting move from (${startRow},${startCol}) to (${row},${col})`);
                    if (isPawnPromotion(piece, row)) {
                        promptPawnPromotion(startRow, startCol, row, col);
                    } else {
                        executeMove(startRow, startCol, row, col);
                    }
                } else {
                    debug(`Move would leave king in check`);
                }
            } else {
                debug(`Invalid move attempted from (${startRow},${startCol}) to (${row},${col})`);
            }
            
            // Clear selection
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
            return;
        }
        
        // If no piece is selected, try to select a piece
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
        
        // If a piece is already selected and we click on an enemy piece
        if (selectedPiece && getPieceColor(pieceType) === 'red') {
            // Check if this is a valid capture that escapes check
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const movingPiece = board[startRow][startCol];
            
            if (canPieceMove(movingPiece, startRow, startCol, row, col)) {
                // Test if capture escapes check
                const originalPiece = board[row][col];
                board[row][col] = movingPiece;
                board[startRow][startCol] = null;
                
                const escapesCheck = !isKingInCheck('blue');
                
                // Undo test move
                board[startRow][startCol] = movingPiece;
                board[row][col] = originalPiece;
                
                if (escapesCheck) {
                    executeMove(startRow, startCol, row, col);
                    selectedPiece.style.opacity = '1';
                    selectedPiece = null;
                    removeHighlights();
                    return;
                }
            }
        }
        
        // Regular piece selection logic
        if (getPieceColor(pieceType) === 'blue') {
            // Clear previous selection
            if (selectedPiece) {
                selectedPiece.style.opacity = '1';
                removeHighlights();
            }
            
            // Toggle selection
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
    
    const inCheck = isKingInCheck('blue');
    
    // Show all legal moves for the piece
    for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
        for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
            if (canPieceMove(piece, row, col, endRow, endCol)) {
                // If in check, only show moves that escape check
                if (inCheck) {
                    // Test move
                    const originalPiece = board[endRow][endCol];
                    board[endRow][endCol] = piece;
                    board[row][col] = null;
                    
                    const escapesCheck = !isKingInCheck('blue');
                    
                    // Undo test move
                    board[row][col] = piece;
                    board[endRow][endCol] = originalPiece;
                    
                    if (escapesCheck) {
                        const target = board[endRow][endCol];
                        highlightSquare(endRow, endCol, !!target);
                    }
                } else {
                    // If not in check, show all legal moves
                    const target = board[endRow][endCol];
                    highlightSquare(endRow, endCol, !!target);
                }
            }
        }
    }
}

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = currentPlayer === 'blue' ? 'blue' : 'red';
    
    // Create promotion dialog
    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';
    dialog.style.position = 'absolute';
    dialog.style.left = `${endCol * 12.5}%`;
    dialog.style.top = `${endRow * 12.5}%`;
    dialog.style.zIndex = 1000;
    
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

// Board visualization
function placePieces() {
    try {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) return;
        
        // Clear existing pieces
        chessboard.innerHTML = '';
        
        // Place new pieces
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceElement = createPieceElement(piece, row, col);
                    chessboard.appendChild(pieceElement);
                }
            }
        }
    } catch (error) {
        debug(`Error in placePieces: ${error.message}`);
        console.error(error);
    }
}

function createPieceElement(piece, row, col) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.style.backgroundImage = `url('${pieceImages[piece]}')`;
    pieceElement.style.left = `${col * 12.5}%`;
    pieceElement.style.top = `${row * 12.5}%`;
    pieceElement.style.zIndex = '10'; // Ensure pieces are above highlights
    pieceElement.setAttribute('data-row', row);
    pieceElement.setAttribute('data-col', col);
    pieceElement.addEventListener('click', onPieceClick);
    return pieceElement;
}

function highlightSquare(row, col, isCapture = false) {
    try {
        const square = document.createElement('div');
        square.className = 'highlight' + (isCapture ? ' capture' : '');
        square.style.position = 'absolute';
        square.style.left = `${col * 12.5}%`;
        square.style.top = `${row * 12.5}%`;
        square.style.width = '12.5%';
        square.style.height = '12.5%';
        square.style.cursor = 'pointer';
        square.style.zIndex = '5';
        
        if (isCapture) {
            square.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            square.style.border = '2px solid rgba(255, 0, 0, 0.5)';
        } else {
            square.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            square.style.border = '2px solid rgba(0, 255, 0, 0.5)';
        }
        
        square.setAttribute('data-row', row);
        square.setAttribute('data-col', col);
        
        // Add click handler for the square
        square.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            onSquareClick(row, col);
        });
        
        document.getElementById('chessboard').appendChild(square);
    } catch (error) {
        debug(`Error in highlightSquare: ${error.message}`);
        console.error(error);
    }
}

function hasCapturableHighlight(row, col) {
    const highlight = document.querySelector(`.highlight.capture[data-row="${row}"][data-col="${col}"]`);
    return highlight !== null;
}

function removeHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => highlight.remove());
}

// Game initialization and reset
function resetGame() {
    try {
        debug('\n----- Game Reset -----');
        
        // Reset game state
        board = JSON.parse(JSON.stringify(initialBoard));
        currentPlayer = 'blue';
        selectedPiece = null;
        moveHistory = [];
        gameState = 'active';
        lastMove = null;
        
        // Reset piece movement tracking
        Object.assign(pieceState, {
            blueKingMoved: false,
            redKingMoved: false,
            blueRooksMove: { left: false, right: false },
            redRooksMove: { left: false, right: false },
            lastPawnDoubleMove: null
        });
        
        // Reset UI
        updateStatusDisplay("Blue's turn");
        document.getElementById('move-history').innerHTML = '';
        document.getElementById('debug').innerHTML = '';
        
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'auto';
            createBoard();
            placePieces();
        }
        
        debug('Game reset completed');
    } catch (error) {
        debug(`Error in resetGame: ${error.message}`);
        console.error(error);
    }
}

// Add this CSS to your existing styles
const promotionStyles = `
    .promotion-dialog {
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        padding: 4px;
    }
    
    .promotion-piece {
        width: 50px;
        height: 50px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        cursor: pointer;
        transition: transform 0.2s;
    }
    
    .promotion-piece:hover {
        transform: scale(1.1);
    }
`;

// Add these functions to your chess.js file

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

// Add visual effects function if not already present
function addVisualEffects() {
    const style = document.createElement('style');
    style.textContent = `
        .piece {
            transition: all 0.3s ease;
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
            cursor: pointer !important;
            pointer-events: auto !important;
            z-index: 10;
        }
        
        .piece:hover {
            transform: scale(1.1);
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            z-index: 20;
        }
        
        .highlight {
            animation: pulse 2s infinite;
            border-radius: 50%;
            pointer-events: auto !important;
            cursor: pointer !important;
        }
        
        .highlight.capture {
            animation: capturePulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 0.4; transform: scale(0.95); }
            50% { opacity: 0.6; transform: scale(1); }
            100% { opacity: 0.4; transform: scale(0.95); }
        }
        
        @keyframes capturePulse {
            0% { opacity: 0.5; transform: scale(0.95); }
            50% { opacity: 0.8; transform: scale(1); }
            100% { opacity: 0.5; transform: scale(0.95); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize game
function initGame() {
    try {
        debug('\n----- Game Initialization -----');
        
        // Add promotion styles
        const style = document.createElement('style');
        style.textContent = promotionStyles;
        document.head.appendChild(style);
        
        // Initialize board
        createBoard();
        placePieces();
        addVisualEffects();
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (selectedPiece) {
                    selectedPiece.style.opacity = '1';
                    selectedPiece = null;
                    removeHighlights();
                }
            }
        });
        
        // Set up restart button
        const restartButton = document.querySelector('button');
        if (restartButton) {
            restartButton.addEventListener('click', resetGame);
        }
        
        debug('Game initialization completed successfully');
    } catch (error) {
        debug(`Error during game initialization: ${error.message}`);
        console.error(error);
    }
}

// Start game when window loads
window.onload = initGame;
