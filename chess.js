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

// Difficulty settings
let selectedDifficulty = null;
let gameDifficulty = 'easy'; // 'easy' or 'hard'

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
    });

    hardBtn.addEventListener('click', () => {
        selectDifficulty('hard', hardBtn, easyBtn);
        gameDifficulty = 'hard';
    });

    startBtn.addEventListener('click', () => {
        if (selectedDifficulty) {
            difficultyScreen.style.display = 'none';
            chessGame.style.display = 'block';
            initGame();
        }
    });

    // Reset difficulty selection when game is restarted
    document.getElementById('restart-game').addEventListener('click', () => {
        resetGame();
        chessGame.style.display = 'none';
        difficultyScreen.style.display = 'flex';
        selectedDifficulty = null;
        startBtn.disabled = true;
        easyBtn.classList.remove('selected');
        hardBtn.classList.remove('selected');
    });
}

// Evaluation functions for different difficulty levels
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
    if (piece.toLowerCase() !== 'k') { // Non-king pieces
        // Bonus for controlling center squares
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 10;
        }
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Add randomness for easy mode
    score += Math.random() * 200; // Significant random factor
    
    return score;
}

function evaluateHardMove(piece, startRow, startCol, endRow, endCol) {
    let score = 0;
    
    // Make temporary move
    const originalPiece = board[endRow][endCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;
    
    // Advanced piece values
    const pieceValues = {
        'p': 100,
        'n': 320,
        'b': 330,
        'r': 500,
        'q': 900,
        'k': 2000
    };
    
    // Capturing
    if (originalPiece) {
        score += pieceValues[originalPiece.toLowerCase()] * 1.2; // 20% bonus for captures
    }
    
    // Piece-specific evaluation
    switch (piece.toLowerCase()) {
        case 'p': // Pawns
            score += evaluatePawnPosition(endRow, endCol, 'red');
            break;
        case 'n': // Knights
            score += evaluateKnightPosition(endRow, endCol);
            break;
        case 'b': // Bishops
            score += evaluateBishopPosition(endRow, endCol);
            break;
        case 'r': // Rooks
            score += evaluateRookPosition(endRow, endCol, 'red');
            break;
        case 'q': // Queen
            score += evaluateQueenPosition(endRow, endCol);
            break;
        case 'k': // King
            score += evaluateKingPosition(endRow, endCol, 'red');
            break;
    }
    
    // Check if move puts opponent in check
    if (isKingInCheck('blue')) {
        score += 150;
    }
    
    // Mobility - count possible moves after this move
    score += evaluateMobility('red') * 10;
    
    // Control of center
    if (endRow >= 2 && endRow <= 5 && endCol >= 2 && endCol <= 5) {
        score += 30;
        if (endRow >= 3 && endRow <= 4 && endCol >= 3 && endCol <= 4) {
            score += 20; // Additional bonus for inner center
        }
    }
    
    // Restore board
    board[startRow][startCol] = piece;
    board[endRow][endCol] = originalPiece;
    
    // Add small random factor to avoid predictability
    score += Math.random() * 20;
    
    return score;
}

// Helper evaluation functions for pieces in hard mode
function evaluatePawnPosition(row, col, color) {
    let score = 0;
    const advancement = color === 'red' ? row : (7 - row);
    
    // Advancement bonus
    score += advancement * 10;
    
    // Center control bonus
    if (col >= 2 && col <= 5) {
        score += 10;
    }
    
    // Passed pawn bonus
    if (isPawnPassed(row, col, color)) {
        score += 50;
    }
    
    return score;
}

function evaluateKnightPosition(row, col) {
    let score = 0;
    
    // Center control
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    score += (7 - centerDistance) * 10;
    
    // Outpost positions
    if (row >= 3 && row <= 4 && (col === 2 || col === 5)) {
        score += 20;
    }
    
    return score;
}

function evaluateBishopPosition(row, col) {
    let score = 0;
    
    // Diagonal control
    score += countDiagonalMoves(row, col) * 5;
    
    // Bonus for controlling long diagonals
    if (Math.abs(row - col) === 0 || Math.abs(row - col) === 7) {
        score += 15;
    }
    
    return score;
}

function evaluateRookPosition(row, col, color) {
    let score = 0;
    
    // Open file bonus
    if (isFileOpen(col)) {
        score += 30;
    }
    
    // Seventh rank bonus (second rank for red)
    if ((color === 'red' && row === 6) || (color === 'blue' && row === 1)) {
        score += 40;
    }
    
    return score;
}

function evaluateQueenPosition(row, col) {
    let score = 0;
    
    // Center control
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
    score += (7 - centerDistance) * 5;
    
    // Mobility
    score += (countDiagonalMoves(row, col) + countOrthogonalMoves(row, col)) * 2;
    
    return score;
}

function evaluateKingPosition(row, col, color) {
    let score = 0;
    
    // King safety
    if (isEndgame()) {
        // In endgame, king should be more active
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        score -= centerDistance * 10;
    } else {
        // In middlegame, king should stay safe
        if (color === 'red') {
            score += (7 - row) * 10; // Prefer back rank
        } else {
            score += row * 10;
        }
    }
    
    return score;
}

// Utility functions for evaluation
function isPawnPassed(row, col, color) {
    const direction = color === 'red' ? 1 : -1;
    const enemyPawn = color === 'red' ? 'p' : 'P';
    
    // Check if there are any enemy pawns that could block or capture
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
    
    return totalPieceValue <= 12; // Endgame if total piece value is 12 or less
}

// Enhanced AI move selection
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
                                    score: 0 // Will be set during evaluation
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
        if (gameDifficulty === 'hard') {
            move.score = evaluateHardMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
        } else {
            move.score = evaluateEasyMove(move.piece, move.startRow, move.startCol, move.endRow, move.endCol);
        }
    });

    // Sort moves by score
    legalMoves.sort((a, b) => b.score - a.score);
    
    // Select move based on difficulty
    let selectedMove;
    if (gameDifficulty === 'hard') {
        // In hard mode, choose one of the top 3 moves
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

// Game initialization and UI event handlers
function initGame() {
    try {
        debug('\n----- Game Initialization -----');
        
        // Initialize difficulty selection
        initDifficultySelection();
        
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
        
        debug('Game initialization completed successfully');
    } catch (error) {
        debug(`Error during game initialization: ${error.message}`);
        console.error(error);
    }
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
        
        // Show difficulty selection screen
        const difficultyScreen = document.getElementById('difficulty-screen');
        const chessGame = document.getElementById('chess-game');
        if (difficultyScreen && chessGame) {
            difficultyScreen.style.display = 'flex';
            chessGame.style.display = 'none';
        }
        
        // Reset UI
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
    } catch (error) {
        debug(`Error in resetGame: ${error.message}`);
        console.error(error);
    }
}

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
        
        .difficulty-btn {
            transition: all 0.3s ease;
        }
        
        .difficulty-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(50, 205, 50, 0.5);
        }
        
        .difficulty-btn.selected {
            background: rgba(50, 205, 50, 0.2);
            box-shadow: 0 0 20px rgba(50, 205, 50, 0.6);
        }
    `;
    document.head.appendChild(style);
}

// Event handlers for piece movement
function onSquareClick(row, col) {
    try {
        if (gameState !== 'active' && gameState !== 'check') return;
        if (currentPlayer !== 'blue') return;
        
        // Handle piece selection and movement
        if (selectedPiece) {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const piece = board[startRow][startCol];
            
            if (canPieceMove(piece, startRow, startCol, row, col)) {
                executeMove(startRow, startCol, row, col);
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            } else {
                debug(`Invalid move attempted`);
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
            }
        } else {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === 'blue') {
                const pieceElement = document.querySelector(`.piece[data-row="${row}"][data-col="${col}"]`);
                if (pieceElement) {
                    selectedPiece = pieceElement;
                    selectedPiece.style.opacity = '0.7';
                    showLegalMoves(row, col);
                }
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
        
        // Handle piece selection and capturing
        if (selectedPiece && getPieceColor(pieceType) === 'red') {
            const startRow = parseInt(selectedPiece.getAttribute('data-row'));
            const startCol = parseInt(selectedPiece.getAttribute('data-col'));
            const movingPiece = board[startRow][startCol];
            
            if (canPieceMove(movingPiece, startRow, startCol, row, col)) {
                executeMove(startRow, startCol, row, col);
                selectedPiece.style.opacity = '1';
                selectedPiece = null;
                removeHighlights();
                return;
            }
        }
        
        // Regular piece selection
        if (getPieceColor(pieceType) === 'blue') {
            if (selectedPiece) {
                selectedPiece.style.opacity = '1';
                removeHighlights();
            }
            
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
    
    // Show possible moves
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

// Initialize game when window loads
window.onload = function() {
    initDifficultySelection();
};
