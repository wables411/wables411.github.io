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

// Wallet and Access Functions
function isWalletConnected() {
    return !!localStorage.getItem('currentPlayer');
}

function checkGameAccess() {
    if (!isWalletConnected()) {
        updateStatusDisplay("Connect to play");  // Changed from "Connect Phantom Wallet to play"
        return false;
    }
    return true;
}

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

// Game Mode Control Functions
function initializeGameModes() {
    const aiModeBtn = document.getElementById('ai-mode');
    const multiplayerModeBtn = document.getElementById('multiplayer-mode');
    const difficultyScreen = document.getElementById('difficulty-screen');
    const multiplayerMenu = document.querySelector('.multiplayer-menu');

    if (aiModeBtn && multiplayerModeBtn) {
        aiModeBtn.addEventListener('click', () => {
            isMultiplayerMode = false;
            currentGameMode = GameMode.AI;
            aiModeBtn.classList.add('selected');
            multiplayerModeBtn.classList.remove('selected');
            if (difficultyScreen) difficultyScreen.style.display = 'flex';
            if (multiplayerMenu) multiplayerMenu.style.display = 'none';
            if (multiplayerManager) {
                multiplayerManager.leaveGame();
            }
        });

        multiplayerModeBtn.addEventListener('click', () => {
            isMultiplayerMode = true;
            currentGameMode = GameMode.ONLINE;
            multiplayerModeBtn.classList.add('selected');
            aiModeBtn.classList.remove('selected');
            if (difficultyScreen) difficultyScreen.style.display = 'none';
            if (multiplayerMenu) multiplayerMenu.style.display = 'block';
            initializeMultiplayer();
        });
    }
}

function initializeMultiplayer() {
    if (!multiplayerManager) {
        multiplayerManager = new MultiplayerManager();
    }
}

// Move validation functions
function canMakeMove(startRow, startCol, endRow, endCol) {
    const piece = board[startRow][startCol];
    if (!piece) return false;
    
    const color = getPieceColor(piece);
    if (color !== currentPlayer) return false;
    
    // Check if it's a valid online move
    if (isMultiplayerMode && multiplayerManager) {
        if (color !== playerColor) return false;
    }
    
    return canPieceMove(piece, startRow, startCol, endRow, endCol);
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

// Add the function to check if a game move is valid in the current game context
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

// AI Move Generation and Evaluation
function makeAIMove() {
    if (currentGameMode !== GameMode.AI || currentPlayer !== 'red' || isMultiplayerMode) return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    // Add debug statement here
    console.log("Making AI move attempt");
    
    const move = selectBestMove();
    if (move) {
        setTimeout(() => {
            executeMove(move.startRow, move.startCol, move.endRow, move.endCol, move.promotionPiece);
        }, 500);
    } else {
        // Add debug statement here
        console.log("No valid moves found for AI");
    }
}

function selectBestMove() {
    const legalMoves = getAllLegalMoves('red');
    if (legalMoves.length === 0) return null;

    const inCheck = isKingInCheck('red');

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

        // If in check, prioritize moves that escape check
        if (inCheck) {
            // Make temporary move
            const originalPiece = board[move.endRow][move.endCol];
            const movingPiece = board[move.startRow][move.startCol];
            board[move.endRow][move.endCol] = movingPiece;
            board[move.startRow][move.startCol] = null;

            // Check if this move escapes check
            if (!isKingInCheck('red')) {
                move.score += 1000; // Heavy bonus for escaping check
            }

            // Restore board
            board[move.startRow][move.startCol] = movingPiece;
            board[move.endRow][move.endCol] = originalPiece;
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);

    // Select move based on difficulty and situation
    if (inCheck || gameDifficulty === 'hard') {
        // In check or hard mode: usually choose the best move
        return Math.random() < 0.9 ? legalMoves[0] : legalMoves[1];
    } else {
        // In easy mode: randomly select from top 3 moves
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
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Add significant randomness for easy mode
    score += Math.random() * 150;
    
    return score;
}

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

function hasFriendlyPawnNeighbor(row, col) {
    for (let c = col - 1; c <= col + 1; c += 2) {
        if (c >= 0 && c < 8) {
            const piece = board[row][c];
            if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) === getPieceColor(board[row][col])) {
                return true;
            }
        }
    }
    return false;
}

function isPieceProtected(row, col, color) {
    return isSquareUnderAttack(row, col, color);
}

function isIsolatedPawn(col) {
    for (let c = col - 1; c <= col + 1; c += 2) {
        if (c >= 0 && c < 8) {
            for (let r = 0; r < 8; r++) {
                const piece = board[r][c];
                if (piece && piece.toLowerCase() === 'p') {
                    return false;
                }
            }
        }
    }
    return true;
}

function isPassedPawn(row, col, color) {
    const direction = color === 'red' ? 1 : -1;
    const endRow = color === 'red' ? 7 : 0;
    
    for (let r = row; r !== endRow; r += direction) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (c >= 0 && c < 8) {
                const piece = board[r][c];
                if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) !== color) {
                    return false;
                }
            }
        }
    }
    return true;
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
            if (board[r][c] === kingPiece) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    return Math.max(Math.abs(kingRow - row), Math.abs(kingCol - col));
}

function isKnightOutpost(row, col, color) {
    if (color === 'red' && row < 4) return false;
    if (color === 'blue' && row > 3) return false;
    
    return !canBePawnAttacked(row, col, color);
}

function evaluateBishopPosition(row, col) {
    return countDiagonalMoves(row, col) * 5;
}

function hasBishopPair(color) {
    let bishopCount = 0;
    const bishopChar = color === 'red' ? 'B' : 'b';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === bishopChar) bishopCount++;
            if (bishopCount >= 2) return true;
        }
    }
    return false;
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

function hasConnectedRook(row, col) {
    const color = getPieceColor(board[row][col]);
    const rookChar = color === 'red' ? 'R' : 'r';
    
    for (let r = 0; r < 8; r++) {
        if (r !== row && board[r][col] === rookChar) return true;
    }
    for (let c = 0; c < 8; c++) {
        if (c !== col && board[row][c] === rookChar) return true;
    }
    return false;
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
                const piece = board[pawnRow][c];
                if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) === color) {
                    score += 30;
                }
            }
        }
    }
    
    // Count attacking pieces
    const enemyColor = color === 'red' ? 'blue' : 'red';
    let attackCount = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && getPieceColor(piece) === enemyColor) {
                if (canPieceMove(piece, r, c, row, col)) {
                    attackCount++;
                }
            }
        }
    }
    score -= attackCount * 20;
    
    return score;
}

function evaluateControlOfCenter(row, col) {
    if (row >= 2 && row <= 5 && col >= 2 && col <= 5) {
        return (row >= 3 && row <= 4 && col >= 3 && col <= 4) ? 30 : 15;
    }
    return 0;
}

function evaluatePieceActivity(row, col) {
    return countDiagonalMoves(row, col) + countOrthogonalMoves(row, col);
}

function evaluateKingAttackPotential(color) {
    const enemyColor = color === 'red' ? 'blue' : 'red';
    let score = 0;
    
    // Find enemy king
    const kingPiece = enemyColor === 'blue' ? 'k' : 'K';
    let kingRow, kingCol;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingPiece) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    // Count pieces attacking squares near king
    for (let r = kingRow - 1; r <= kingRow + 1; r++) {
        for (let c = kingCol - 1; c <= kingCol + 1; c++) {
            if (isWithinBoard(r, c)) {
                if (isSquareUnderAttack(r, c, color)) {
                    score += 10;
                }
            }
        }
    }
    
    return score;
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

function isEndGame() {
    let pieceCount = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col]) pieceCount++;
        }
    }
    return pieceCount <= 12;
}

function evaluateEarlyGameBonus(piece, row, col) {
    let score = 0;
    const pieceType = piece.toLowerCase();
    
    switch (pieceType) {
        case 'p':
            // Central pawns are good in early game
            if (col >= 2 && col <= 5) score += 20;
            break;
        case 'n':
        case 'b':
            // Development bonus
            if ((piece === 'N' && row > 0) || (piece === 'n' && row < 7)) score += 30;
            break;
        case 'k':
            // Penalize early king movement
            if ((piece === 'K' && row > 0) || (piece === 'k' && row < 7)) score -= 50;
            break;
    }
    
    return score;
}

function evaluateEndGameBonus(piece, row, col) {
    let score = 0;
    const pieceType = piece.toLowerCase();
    
    switch (pieceType) {
        case 'p':
            // Passed pawns are more valuable in endgame
            if (isPassedPawn(row, col, getPieceColor(piece))) score += 60;
            break;
        case 'k':
            // King should be active in endgame
            score += (4 - Math.max(Math.abs(3.5 - row), Math.abs(3.5 - col))) * 20;
            break;
    }
    
    return score;
}

function canBePawnAttacked(row, col, color) {
    const enemyColor = color === 'red' ? 'blue' : 'red';
    const attackRow = color === 'red' ? row + 1 : row - 1;
    
    if (attackRow >= 0 && attackRow < 8) {
        for (let c = col - 1; c <= col + 1; c += 2) {
            if (c >= 0 && c < 8) {
                const piece = board[attackRow][c];
                if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) === enemyColor) {
                    return true;
                }
            }
        }
    }
    return false;
}

function evaluateHardMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Enhanced piece values for hard mode
    const pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 20000
    };
    
    // Capturing evaluation
    if (originalPiece) {
        // Higher bonus for capturing with lower value pieces
        const captureBonus = pieceValues[originalPiece.toLowerCase()] * 
            (1 + (pieceValues[originalPiece.toLowerCase()] - pieceValues[piece.toLowerCase()]) / 1000);
        score += captureBonus;
    }
    
    // Piece-specific evaluation
    switch (piece.toLowerCase()) {
        case 'p':
            score += evaluatePawnPosition(endRow, endCol, 'red') * 1.5;
            if (hasFriendlyPawnNeighbor(endRow, endCol)) score += 15;
            if (isPieceProtected(endRow, endCol, 'red')) score += 20;
            if (isIsolatedPawn(endCol)) score -= 30;
            if (isPassedPawn(endRow, endCol, 'red')) score += 50;
            break;

        case 'n':
            score += evaluateKnightPosition(endRow, endCol) * 1.5;
            score += getDistanceToEnemyKing(endRow, endCol, 'blue') * -15;
            if (isKnightOutpost(endRow, endCol, 'red')) score += 40;
            break;

        case 'b':
            score += evaluateBishopPosition(endRow, endCol) * 1.5;
            if (hasBishopPair('red')) score += 50;
            if (isOnLongDiagonal(endRow, endCol)) score += 25;
            break;

        case 'r':
            score += evaluateRookPosition(endRow, endCol, 'red') * 1.5;
            if (isFileOpen(endCol)) score += 35;
            if (endRow === 6) score += 40;
            if (hasConnectedRook(endRow, endCol)) score += 30;
            break;

        case 'q':
            score += evaluateQueenPosition(endRow, endCol) * 1.2;
            if (isEarlyGame() && endRow > 2) score -= 30;
            score += getDistanceToEnemyKing(endRow, endCol, 'blue') * -10;
            break;

        case 'k':
            score += evaluateKingPosition(endRow, endCol, 'red') * 2;
            score += evaluateKingSafety(endRow, endCol, 'red');
            if (isEarlyGame() && !pieceState.redKingMoved) {
                score -= 50;
            }
            break;
    }
    
    // Strategic bonuses
    score += evaluateControlOfCenter(endRow, endCol) * 2;
    score += evaluatePieceActivity(endRow, endCol) * 1.5;
    score += evaluateKingAttackPotential('red') * 2;

    // Game phase specific evaluation
    if (isEarlyGame()) {
        score += evaluateEarlyGameBonus(piece, endRow, endCol);
    } else if (isEndGame()) {
        score += evaluateEndGameBonus(piece, endRow, endCol);
    }

    // Check bonus
    if (isKingInCheck('blue')) {
        score += 200;
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Small random factor for variety
    score += Math.random() * 15;
    
    return score;
}

// UI and Game Control Functions
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
            // Let multiplayer manager handle game start
            return;
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
        
        updateStatusDisplay("Connect to play");  // Changed from "Connect Phantom Wallet to play"
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
        if (!checkGameAccess()) return;
        
        // Check game mode restrictions
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
        // Check game mode restrictions
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

function promptPawnPromotion(startRow, startCol, endRow, endCol) {
    const promotionPieces = ['q', 'r', 'n', 'b'];
    const color = isMultiplayerMode ? playerColor : currentPlayer;
    
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

function executeMove(startRow, startCol, endRow, endCol, promotionPiece = null) {
    if (!canMakeMove(startRow, startCol, endRow, endCol)) return false;

    // Handle multiplayer moves
    if (isMultiplayerMode && multiplayerManager) {
        return multiplayerManager.makeMove(startRow, startCol, endRow, endCol, promotionPiece);
    }

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
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    
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
    if (currentGameMode === GameMode.AI && currentPlayer === 'red' && !isMultiplayerMode) {
        setTimeout(makeAIMove, 500);
    }

    return true;
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

// Main event listeners
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing chess game...");
        // Initialize both game modes
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

// Initialize everything when page loads
window.addEventListener('load', function() {
    try {
        debug('\n----- Page Load Initialization -----');
        
        // Check for existing wallet connection
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

// Cleanup function for when leaving the page
window.addEventListener('beforeunload', function() {
    try {
        // Cleanup multiplayer if active
        if (isMultiplayerMode && multiplayerManager) {
            multiplayerManager.leaveGame();
        }
        
        // Clear any game state that shouldn't persist
        selectedPiece = null;
        gameState = 'ended';
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
});