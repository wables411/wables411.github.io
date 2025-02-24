// aiWorker.js
self.onmessage = (e) => {
    const { board, difficulty, currentPlayer } = e.data;

    function getPieceColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'red' : 'blue';
    }

    function isWithinBoard(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    function canPieceMove(piece, startRow, startCol, endRow, endCol, board, checkForCheck = true) {
        if (!piece) return false;
        const pieceType = piece.toLowerCase();
        const color = getPieceColor(piece);
        if (!isWithinBoard(endRow, endCol) || (startRow === endRow && startCol === endCol)) return false;
        const targetPiece = board[endRow][endCol];
        if (targetPiece && getPieceColor(targetPiece) === color) return false;

        let isValid = false;
        switch (pieceType) {
            case 'p': isValid = isValidPawnMove(color, startRow, startCol, endRow, endCol, board); break;
            case 'r': isValid = isValidRookMove(startRow, startCol, endRow, endCol, board); break;
            case 'n': isValid = isValidKnightMove(startRow, startCol, endRow, endCol); break;
            case 'b': isValid = isValidBishopMove(startRow, startCol, endRow, endCol, board); break;
            case 'q': isValid = isValidQueenMove(startRow, startCol, endRow, endCol, board); break;
            case 'k': isValid = isValidKingMove(color, startRow, startCol, endRow, endCol, board); break;
        }

        if (!isValid) return false;
        if (checkForCheck && wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color, board)) return false;
        return true;
    }

    function isValidPawnMove(color, startRow, startCol, endRow, endCol, board) {
        const direction = color === 'blue' ? -1 : 1;
        const startingRow = color === 'blue' ? 6 : 1;
        const rowDiff = endRow - startRow;
        const colDiff = endCol - startCol;

        if (Math.abs(colDiff) === 1 && rowDiff === direction) {
            return board[endRow][endCol] && getPieceColor(board[endRow][endCol]) !== color;
        }
        if (colDiff !== 0 || board[endRow][endCol]) return false;
        if (rowDiff === direction) return true;
        if (startRow === startingRow && rowDiff === 2 * direction && !board[startRow + direction][startCol]) return true;
        return false;
    }

    function isValidRookMove(startRow, startCol, endRow, endCol, board) {
        if (startRow !== endRow && startCol !== endCol) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidKnightMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    function isValidBishopMove(startRow, startCol, endRow, endCol, board) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        if (rowDiff !== colDiff) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidQueenMove(startRow, startCol, endRow, endCol, board) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        if (rowDiff !== colDiff && startRow !== endRow && startCol !== endCol) return false;
        return isPathClear(startRow, startCol, endRow, endCol, board);
    }

    function isValidKingMove(color, startRow, startCol, endRow, endCol, board) {
        const rowDiff = Math.abs(endRow - startRow);
        const colDiff = Math.abs(endCol - startCol);
        return rowDiff <= 1 && colDiff <= 1;
    }

    function isPathClear(startRow, startCol, endRow, endCol, board) {
        const rowStep = Math.sign(endRow - startRow) || 0;
        const colStep = Math.sign(endCol - startCol) || 0;
        let currentRow = startRow + rowStep;
        let currentCol = startCol + colStep;
        while (currentRow !== endRow || currentCol !== endCol) {
            if (board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }
        return true;
    }

    function wouldMoveExposeCheck(startRow, startCol, endRow, endCol, color, board) {
        const originalPiece = board[endRow][endCol];
        const movingPiece = board[startRow][startCol];
        board[endRow][endCol] = movingPiece;
        board[startRow][startCol] = null;
        const inCheck = isKingInCheck(color, board);
        board[startRow][startCol] = movingPiece;
        board[endRow][endCol] = originalPiece;
        return inCheck;
    }

    function isKingInCheck(color, board) {
        const kingPiece = color === 'blue' ? 'k' : 'K';
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === kingPiece) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }
        return isSquareUnderAttack(kingRow, kingCol, color === 'blue' ? 'red' : 'blue', board);
    }

    function isSquareUnderAttack(row, col, attackingColor, board) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && getPieceColor(piece) === attackingColor) {
                    if (canPieceMove(piece, r, c, row, col, board, false)) return true;
                }
            }
        }
        return false;
    }

    function getAllLegalMoves(color, board) {
        const moves = [];
        for (let startRow = 0; startRow < 8; startRow++) {
            for (let startCol = 0; startCol < 8; startCol++) {
                const piece = board[startRow][startCol];
                if (piece && getPieceColor(piece) === color) {
                    for (let endRow = 0; endRow < 8; endRow++) {
                        for (let endCol = 0; endCol < 8; endCol++) {
                            if (canPieceMove(piece, startRow, startCol, endRow, endCol, board)) {
                                moves.push({
                                    piece,
                                    startRow,
                                    startCol,
                                    endRow,
                                    endCol,
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

    const moves = getAllLegalMoves(currentPlayer, board);
    if (moves.length === 0) {
        self.postMessage(null);
        return;
    }

    let bestMove = null;
    if (difficulty === 'hard') {
        let bestScore = -Infinity;
        const pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };
        for (const move of moves) {
            let score = 0;
            if (move.isCapture) {
                score += pieceValues[board[move.endRow][move.endCol].toLowerCase()] || 0;
            }
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
    } else {
        bestMove = moves[Math.floor(Math.random() * moves.length)];
    }

    self.postMessage(bestMove || moves[0]);
};