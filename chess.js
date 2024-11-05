// Get reference to global updateGameResult and LeaderboardManager
const updateGameResult = window.updateGameResult;
const LeaderboardManager = window.LeaderboardManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing chess game...");
        const manager = new LeaderboardManager();
        manager.loadLeaderboard();
        initDifficultySelection();
        initRestartButton();
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

// Initialize restart button
function initRestartButton() {
    const restartButton = document.getElementById('restart-game');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            console.log("Restart button clicked");
            const difficultyScreen = document.getElementById('difficulty-screen');
            const chessGame = document.getElementById('chess-game');
            
            // Show difficulty screen and hide chess game
            if (difficultyScreen && chessGame) {
                difficultyScreen.style.display = 'flex';
                chessGame.style.display = 'none';
            }
            
            // Reset difficulty selection
            selectedDifficulty = null;
            const easyBtn = document.getElementById('easy-mode');
            const hardBtn = document.getElementById('hard-mode');
            const startBtn = document.getElementById('start-game');
            
            if (easyBtn && hardBtn && startBtn) {
                easyBtn.classList.remove('selected');
                hardBtn.classList.remove('selected');
                startBtn.disabled = true;
            }
            
            // Reset game state
            resetGame();
            debug("Game restarted");
        });
    }
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

function isPawnPromotion(piece, endRow) {
    return piece.toLowerCase() === 'p' && (endRow === 0 || endRow === 7);
}

// Difficulty selection and game initialization
function initDifficultySelection() {
    try {
        const easyBtn = document.getElementById('easy-mode');
        const hardBtn = document.getElementById('hard-mode');
        const startBtn = document.getElementById('start-game');
        const difficultyScreen = document.getElementById('difficulty-screen');
        const chessGame = document.getElementById('chess-game');

        if (!easyBtn || !hardBtn || !startBtn || !difficultyScreen || !chessGame) {
            console.error("Required elements not found");
            return;
        }

        function selectDifficulty(difficulty, button, otherButton) {
            selectedDifficulty = difficulty;
            gameDifficulty = difficulty; // Add this line
            button.classList.add('selected');
            otherButton.classList.remove('selected');
            startBtn.disabled = false;
            debug(`${difficulty} mode selected`);
        }

        easyBtn.addEventListener('click', () => selectDifficulty('easy', easyBtn, hardBtn));
        hardBtn.addEventListener('click', () => selectDifficulty('hard', hardBtn, easyBtn));

        startBtn.addEventListener('click', () => {
            if (selectedDifficulty) {
                difficultyScreen.style.display = 'none';
                chessGame.style.display = 'block';
                startGame();
            }
        });

        // Add these lines to make sure the start button is initially disabled
        startBtn.disabled = true;
        debug('Difficulty selection initialized');
    } catch (error) {
        console.error("Error initializing difficulty selection:", error);
    }
}

function startGame() {
    try {
        resetGame();
        initGame();
        updateStatusDisplay("Blue's turn");
        debug(`New game started - ${gameDifficulty} mode`);
    } catch (error) {
        console.error("Error starting game:", error);
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

// AI Evaluation Functions
function evaluateEasyMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Enhanced piece values
    const pieceValues = {
        'p': 150,  // Increased pawn value to encourage captures
        'n': 350,  // Slightly higher knight value
        'b': 350,  // Slightly higher bishop value
        'r': 525,  // Slightly higher rook value
        'q': 1000, // Higher queen value
        'k': 400   // Same king value
    };
    
    // Strongly encourage capturing moves in easy mode
    if (originalPiece) {
    score += pieceValues[originalPiece.toLowerCase()] * 2.0; // Increased from 1.5 to 2.0
    
    // Extra bonus for pawn captures
    if (piece.toLowerCase() === 'p') {
        score += 400; // Increased from 200 to 400
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
    
    // Add randomness for easy mode, but less than before
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
    
    // Piece-specific evaluation with enhanced values
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
    
    // Enhanced bonus for checking opponent
    if (isKingInCheck('blue')) {
        score += 200;
    }
    
    // Improved board control and mobility evaluation
    score += evaluateMobility('red') * 15;
    if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
        score += 40;
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 30;
        }
    }
    
    // Piece protection bonus
    score += evaluatePieceProtection(endRow, endCol, 'red') * 25;
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Smaller random factor
    score += Math.random() * 15;
    
    return score;
}

// Piece-specific evaluation helpers
function evaluatePawnPosition(row, col, color) {
    let score = 0;
    
    // Advancement bonus
    const advancement = color === 'red' ? row : (7 - row);
    score += advancement * 15;
    
    // Central control bonus
    if (col >= 2 && col <= 5) {
        score += 15;
    }
    
    // Passed pawn bonus
    if (isPawnPassed(row, col, color)) {
        score += 60;
    }
    
    return score;
}

function evaluateKnightPosition(row, col) {
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    let score = (7 - centerDistance) * 15;
    
    // Outpost bonus
    if (row >= 3 && row <= 4 && (col === 2 || col === 5)) {
        score += 30;
    }
    
    return score;
}

function evaluateBishopPosition(row, col) {
    let score = 0;
    
    // Mobility bonus
    score += countDiagonalMoves(row, col) * 8;
    
    // Long diagonal bonus
    if (Math.abs(row - col) === 0 || Math.abs(row - col) === 7) {
        score += 25;
    }
    
    return score;
}

function evaluateRookPosition(row, col, color) {
    let score = 0;
    
    // Open file bonus
    if (isFileOpen(col)) {
        score += 40;
    }
    
    // Seventh rank bonus
    if ((color === 'red' && row === 6) || (color === 'blue' && row === 1)) {
        score += 50;
    }
    
    return score;
}

function evaluateQueenPosition(row, col) {
    // Center distance penalty
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    let score = (7 - centerDistance) * 8;
    
    // Mobility bonus
    score += (countDiagonalMoves(row, col) + countOrthogonalMoves(row, col)) * 3;
    
    return score;
}

function evaluateKingPosition(row, col, color) {
    let score = 0;
    
    if (isEndgame()) {
        // In endgame, king should be more active
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        score -= centerDistance * 15;
    } else {
        // In middlegame, king should stay safe
        if (color === 'red') {
            score += (7 - row) * 15;
        } else {
            score += row * 15;
        }
    }
    
    return score;
}

// Evaluation utility functions
function isPawnPassed(row, col, color) {
    const direction = color === 'red' ? 1 : -1;
    const enemyPawn = color === 'red' ? 'p' : 'P';
    
    // Check for enemy pawns that could block or capture
    for (let r = row; r !== (color === 'red' ? 8 : -1); r += direction) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
            if (board[r][c] === enemyPawn) {
                return false;
            }
        }
    }
    return true;
}

function isFileOpen(col) {
    for (let row = 0; row < 8; row++) {
        if (board[row][col]?.toLowerCase() === 'p') {
            return false;
        }
    }
    return true;
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

function evaluateMobility(color) {
    let mobility = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === color) {
                for (let endRow = 0; endRow < 8; endRow++) {
                    for (let endCol = 0; endCol < 8; endCol++) {
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

function evaluatePieceProtection(row, col, color) {
    let protectionCount = 0;
    const attackingColor = color === 'red' ? 'blue' : 'red';
    
    // Check how many friendly pieces protect this square
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

function isEndgame() {
    let totalPieceValue = 0;
    const values = { 'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1 };
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.toLowerCase() !== 'k') {
                totalPieceValue += values[piece.toLowerCase()];
            }
        }
    }
    
    return totalPieceValue <= 12;
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
                            // Test if move exposes king to check
                            const originalPiece = board[endRow][endCol];
                            board[endRow][endCol] = piece;
                            board[startRow][startCol] = null;
                            
                            const inCheck = isKingInCheck(color);
                            
                            // Restore board
                            board[startRow][startCol] = piece;
                            board[endRow][endCol] = originalPiece;
                            
                            if (!inCheck) return true;
                        }
                    }
                }
            }
        }
    }
    return false;
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

// AI Move Selection and Execution
function makeAIMove() {
    if (currentPlayer !== 'red') return;
    
    const inCheck = isKingInCheck('red');
    debug(`AI thinking... (in check: ${inCheck}, difficulty: ${gameDifficulty})`);
    
    let legalMoves = [];
    // Get all legal moves
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
                                    score: 0,
                                    isCapture: !!originalPiece
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

    // Evaluate moves with new scoring
    legalMoves.forEach(move => {
        if (gameDifficulty === 'hard') {
            move.score = evaluateHardMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
        } else {
            move.score = evaluateEasyMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
            
            // Extra bonus for captures in easy mode
            if (move.isCapture && move.piece.toLowerCase() === 'p') {
                move.score += 400; // Increased bonus for pawn captures in easy mode
            }
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);
    
    // Select move based on difficulty
    let selectedMove;
    if (gameDifficulty === 'hard') {
        // In hard mode, usually choose the best move
        if (Math.random() < 0.8) { // 80% chance to pick the best move
            selectedMove = legalMoves[0];
        } else {
            // 20% chance to pick from top 2 moves
            const topMoves = legalMoves.slice(0, 2);
            selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
        }
    } else {
        // In easy mode, strongly bias towards captures
        if (legalMoves.some(move => move.isCapture)) {
            const captureMoves = legalMoves.filter(move => move.isCapture);
            // Prioritize pawn captures
            const pawnCaptures = captureMoves.filter(move => move.piece.toLowerCase() === 'p');
            if (pawnCaptures.length > 0) {
                selectedMove = pawnCaptures[Math.floor(Math.random() * pawnCaptures.length)];
            } else {
                selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            }
        } else {
            // If no captures available, choose from top 3 moves
            const topMoves = legalMoves.slice(0, 3);
            selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
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
            
            // Update king movement state
            if (color === 'blue') {
                pieceState.blueKingMoved = true;
            } else {
                pieceState.redKingMoved = true;
            }
            
            // Handle rook movement for castling
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
        
        // Update rook movement state for future castling
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
    
    // Switch players
    currentPlayer = enemyColor;
    
    if (isKingInCheck(currentPlayer)) {
        gameState = 'check';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
        debug(`${currentPlayer} is in check`);
    } else {
        gameState = 'active';
        updateStatusDisplay(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`);
    }
    
    // Trigger AI move if it's red's turn
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
    
    // Update leaderboard
    try {
        updateGameResult(winner);
        debug('Leaderboard updated');
    } catch (error) {
        debug('Error updating leaderboard: ' + error.message);
    }
    
    const chessboard = document.getElementById('chessboard');
    if (chessboard) {
        chessboard.style.pointerEvents = 'none';
    }
}

// UI Functions
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
            }
            
            selectedPiece.style.opacity = '1';
            selectedPiece = null;
            removeHighlights();
        }
    } catch (error) {
        console.error("Error in onSquareClick:", error);
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

// Make necessary functions accessible globally
window.updateGameResult = updateGameResult;
