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

function showLegalMoves(row, col) {
    removeHighlights();
    
    const piece = window.board[row][col];
    if (!piece) return;
    
    for (let endRow = 0; endRow < BOARD_SIZE; endRow++) {
        for (let endCol = 0; endCol < BOARD_SIZE; endCol++) {
            if (canPieceMove(piece, row, col, endRow, endCol)) {
                const target = window.board[endRow][endCol];
                highlightSquare(endRow, endCol, !!target);
            }
        }
    }
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

window.removeHighlights = removeHighlights;
window.highlightSquare = highlightSquare;

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

// Move execution and game state management
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

// Game end and state management
async function endGame(winner) {
    try {
        gameState = 'ended';
        const message = winner === 'draw' ? 
            "Game Over - Draw!" : 
            `Game Over - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
        
        updateStatusDisplay(message);
        
        // Update multiplayer game status if in multiplayer mode
        if (window.isMultiplayerMode && window.multiplayerManager) {
            await window.multiplayerManager.updateGameStatus('ended', winner);
        }

        // Update leaderboard
        if (typeof window.updateGameResult === 'function') {
            window.updateGameResult(winner);
        }
        
        // Disable board interaction
        const chessboard = document.getElementById('chessboard');
        if (chessboard) {
            chessboard.style.pointerEvents = 'none';
        }
    } catch (error) {
        console.error('Error in endGame:', error);
        updateStatusDisplay('Error ending game - please refresh');
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
        debug(`Move history error: ${error.message}`);
    }
}

// Game initialization functions
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

window.startGame = startGame;

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

window.resetGame = resetGame;

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

// Piece values for AI evaluation
const PIECE_VALUES = {
    'p': 100,  // Pawn
    'n': 320,  // Knight
    'b': 330,  // Bishop
    'r': 500,  // Rook
    'q': 900,  // Queen
    'k': 20000 // King
};

// AI Move Selection
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
    
    // Material value of captures
    if (move.isCapture) {
        const capturedPiece = window.board[move.endRow][move.endCol].toLowerCase();
        score += PIECE_VALUES[capturedPiece];
        
        // Extra bonus for favorable trades
        if (PIECE_VALUES[piece] < PIECE_VALUES[capturedPiece]) {
            score += (PIECE_VALUES[capturedPiece] - PIECE_VALUES[piece]) / 2;
        }
    }
    
    // Positional evaluation
    score += evaluatePosition(piece, move.endRow, move.endCol);
    
    // Center control
    if (move.endRow >= 3 && move.endRow <= 4 && move.endCol >= 3 && move.endCol <= 4) {
        score += 30;
    }
    
    // Piece-specific evaluations
    switch (piece) {
        case 'p':
            score += evaluatePawnMove(move);
            break;
        case 'n':
            score += evaluateKnightMove(move);
            break;
        case 'b':
            score += evaluateBishopMove(move);
            break;
        case 'r':
            score += evaluateRookMove(move);
            break;
        case 'q':
            score += evaluateQueenMove(move);
            break;
        case 'k':
            score += evaluateKingMove(move);
            break;
    }
    
    // Safety evaluation
    if (!doesMoveExposeWeakness(move)) {
        score += 20;
    }
    
    return score;
}

function evaluatePosition(piece, row, col) {
    let score = 0;
    
    // General positional bonuses
    const centerDistance = Math.max(Math.abs(3.5 - row), Math.abs(3.5 - col));
    score -= centerDistance * 5; // Prefer central positions
    
    // Avoid edge of board except for rooks
    if (piece !== 'r' && (row === 0 || row === 7 || col === 0 || col === 7)) {
        score -= 20;
    }
    
    return score;
}

function evaluatePawnMove(move) {
    let score = 0;
    
    // Advancement bonus
    score += (7 - move.endRow) * 10;
    
    // Passed pawn bonus
    if (isPawnPassed(move.endRow, move.endCol)) {
        score += 50;
    }
    
    // Connected pawns bonus
    if (hasConnectedPawn(move.endRow, move.endCol)) {
        score += 20;
    }
    
    return score;
}

function evaluateKnightMove(move) {
    let score = 0;
    
    // Outpost bonus
    if (isKnightOutpost(move.endRow, move.endCol)) {
        score += 30;
    }
    
    // Mobility bonus
    score += countKnightMoves(move.endRow, move.endCol) * 5;
    
    return score;
}

function evaluateBishopMove(move) {
    let score = 0;
    
    // Diagonal control
    score += countDiagonalMoves(move.endRow, move.endCol) * 5;
    
    // Bishop pair bonus
    if (hasBishopPair()) {
        score += 30;
    }
    
    return score;
}

function evaluateRookMove(move) {
    let score = 0;
    
    // Open file bonus
    if (isFileOpen(move.endCol)) {
        score += 40;
    }
    
    // Seventh rank bonus
    if (move.endRow === 1) {
        score += 30;
    }
    
    return score;
}

function evaluateQueenMove(move) {
    let score = 0;
    
    // Mobility
    score += (countDiagonalMoves(move.endRow, move.endCol) + 
              countOrthogonalMoves(move.endRow, move.endCol)) * 3;
    
    // Safety penalty for early development
    if (getMoveNumber() < 10) {
        score -= 30;
    }
    
    return score;
}

function evaluateKingMove(move) {
    let score = 0;
    
    // Safety
    score -= countAttackingSquares(move.endRow, move.endCol) * 10;
    
    // Castling bonus
    if (Math.abs(move.endCol - move.startCol) === 2) {
        score += 50;
    }
    
    return score;
}

// Helper functions for evaluation
function doesMoveExposeWeakness(move) {
    // Make temporary move
    const originalPiece = window.board[move.endRow][move.endCol];
    const movingPiece = window.board[move.startRow][move.startCol];
    window.board[move.endRow][move.endCol] = movingPiece;
    window.board[move.startRow][move.startCol] = null;
    
    // Check for weaknesses
    const exposesWeakness = isSquareUnderAttack(move.endRow, move.endCol, 'blue');
    
    // Restore board
    window.board[move.startRow][move.startCol] = movingPiece;
    window.board[move.endRow][move.endCol] = originalPiece;
    
    return exposesWeakness;
}

function getMoveNumber() {
    return Math.floor(moveHistory.length / 2) + 1;
}

function isPawnPassed(row, col) {
    // Check if there are any enemy pawns that could block or capture
    for (let r = row - 1; r >= 0; r--) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (c >= 0 && c < 8 && window.board[r][c] === 'p') {
                return false;
            }
        }
    }
    return true;
}

function hasConnectedPawn(row, col) {
    // Check adjacent files for friendly pawns
    for (let c = col - 1; c <= col + 1; c += 2) {
        if (c >= 0 && c < 8 && window.board[row][c] === 'P') {
            return true;
        }
    }
    return false;
}

function isKnightOutpost(row, col) {
    // An outpost is a square that cannot be attacked by enemy pawns
    return row < 6 && !canBeAttackedByEnemyPawns(row, col);
}

function canBeAttackedByEnemyPawns(row, col) {
    for (let c = col - 1; c <= col + 1; c += 2) {
        if (c >= 0 && c < 8 && row > 0 && window.board[row - 1][c] === 'p') {
            return true;
        }
    }
    return false;
}

function hasBishopPair() {
    let bishops = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (window.board[row][col] === 'B') bishops++;
        }
    }
    return bishops >= 2;
}

function countAttackingSquares(row, col) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isSquareUnderAttack(r, c, 'blue')) count++;
        }
    }
    return count;
}

// AI helper functions
function countKnightMoves(row, col) {
    const possibleMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    let count = 0;
    for (const [dr, dc] of possibleMoves) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isWithinBoard(newRow, newCol)) {
            count++;
        }
    }
    return count;
}

function countDiagonalMoves(row, col) {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    let count = 0;
    
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (isWithinBoard(r, c)) {
            count++;
            if (window.board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

function countOrthogonalMoves(row, col) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let count = 0;
    
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        while (isWithinBoard(r, c)) {
            count++;
            if (window.board[r][c]) break;
            r += dr;
            c += dc;
        }
    }
    return count;
}

function isFileOpen(col) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        const piece = window.board[row][col];
        if (piece && piece.toLowerCase() === 'p') {
            return false;
        }
    }
    return true;
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
                    difficultyScreen.style.display = 'none';
                    document.getElementById('chess-game').style.display = 'block';
                    startGame();
                }
            });
        }

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
            });

            multiplayerModeBtn.addEventListener('click', () => {
                currentGameMode = GameMode.ONLINE;
                window.isMultiplayerMode = true;
                multiplayerModeBtn.classList.add('selected');
                aiModeBtn?.classList.remove('selected');
                if (difficultyScreen) difficultyScreen.style.display = 'none';
                if (multiplayerMenu) multiplayerMenu.style.display = 'block';
            });
        }
        
        debug('Game initialization completed successfully');
    } catch (error) {
        console.error("Error during game initialization:", error);
        debug(`Error during game initialization: ${error.message}`);
    }
}

// Make initialization function globally available
window.initGame = initGame;

window.makeAIMove = makeAIMove;

