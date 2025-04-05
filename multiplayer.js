if (typeof window.ethers === "undefined") {
  throw new Error("Ethers.js not loaded. Please include the CDN in your HTML.");
}

if (!window.chessGameABI) {
  window.chessGameABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "target",
          "type": "address"
        }
      ],
      "name": "AddressEmptyCode",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "implementation",
          "type": "address"
        }
      ],
      "name": "ERC1967InvalidImplementation",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ERC1967NonPayable",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "FailedCall",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidInitialization",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitializing",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "UUPSUnauthorizedCallContext",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "slot",
          "type": "bytes32"
        }
      ],
      "name": "UUPSUnsupportedProxiableUUID",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "player1",
          "type": "address"
        }
      ],
      "name": "GameCancelled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "player1",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "wagerAmount",
          "type": "uint256"
        }
      ],
      "name": "GameCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "houseFee",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "payoutOrRefund",
          "type": "uint256"
        }
      ],
      "name": "GameEnded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "player2",
          "type": "address"
        }
      ],
      "name": "GameJoined",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "version",
          "type": "uint64"
        }
      ],
      "name": "Initialized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "implementation",
          "type": "address"
        }
      ],
      "name": "Upgraded",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_WAGER",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_WAGER",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "UPGRADE_INTERFACE_VERSION",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        }
      ],
      "name": "cancelGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        }
      ],
      "name": "createGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "internalType": "address",
          "name": "winner",
          "type": "address"
        }
      ],
      "name": "endGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "",
          "type": "bytes6"
        }
      ],
      "name": "games",
      "outputs": [
        {
          "internalType": "address",
          "name": "player1",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "player2",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        },
        {
          "internalType": "uint256",
          "name": "wagerAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "house",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        }
      ],
      "name": "joinGame",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "leaderboard",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerToGame",
      "outputs": [
        {
          "internalType": "bytes6",
          "name": "",
          "type": "bytes6"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "proxiableUUID",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "resetPlayerGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newImplementation",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "upgradeToAndCall",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "withdrawFunds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
} else {
  console.log("chessGameABI already defined, reusing existing definition");
}

const contractAddress = "0x3112AF5728520F52FD1C6710dD7bD52285a68e47";
const sankoNetwork = { chainId: 1992, name: "Sanko Testnet" };

let isMultiplayerInitialized = false;

class MultiplayerManager {
  static hasGameBeenCreated = false;

  constructor() {
    if (!window.gameDatabase) throw new Error("Supabase not initialized.");
    this.supabase = window.gameDatabase;
    this.gameId = null;
    this.playerColor = null;
    this.subscription = null;
    this.currentGameState = null;
    this.isMultiplayerMode = false;
    this.isProcessingMove = false;
    this.selectedPiece = null;
    this.chessContract = null;
    this.lastCreateClick = 0;
    this.hasCreatedGame = false;
    this.initializeEventListeners();
    console.log("MultiplayerManager initialized");
  }

  async initWeb3() {
    if (!window.walletConnector) {
      console.error("WalletConnector not initialized");
      alert("Please connect via UI first.");
      return null;
    }
    try {
      const address = await window.walletConnector.connectEVMWallet();
      if (!address) throw new Error("No address returned.");
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      console.log("Web3 initialized with address:", address);
      return { provider, signer };
    } catch (error) {
      console.error("Wallet connection failed:", error.message);
      alert("Failed to connect wallet: " + error.message);
      return null;
    }
  }

  async connectToContract() {
    if (this.chessContract) return this.chessContract;
    const web3 = await this.initWeb3();
    if (!web3) return null;
    const { signer } = web3;
    this.chessContract = new window.ethers.Contract(contractAddress, window.chessGameABI, signer);
    console.log("Connected to contract at:", contractAddress);

    // Event listeners (only attach once)
    this.chessContract.on("GameCreated", (inviteCode, player1, wagerAmount) => {
      const inviteCodeStr = window.ethers.utils.toUtf8String(window.ethers.utils.hexDataSlice(inviteCode, 0, 6)).replace(/\0/g, "");
      console.log(`GameCreated: ${inviteCodeStr}, ${player1}, ${window.ethers.utils.formatEther(wagerAmount)} tDMT`);
      if (player1.toLowerCase() === localStorage.getItem("currentPlayer")?.toLowerCase()) {
        this.gameId = inviteCodeStr;
        this.playerColor = "blue";
        this.showGame("blue");
      }
    });

    this.chessContract.on("GameJoined", (inviteCode, player2) => {
      const inviteCodeStr = window.ethers.utils.toUtf8String(window.ethers.utils.hexDataSlice(inviteCode, 0, 6)).replace(/\0/g, "");
      console.log(`GameJoined: ${inviteCodeStr}, ${player2}`);
      if (this.gameId && inviteCodeStr === this.gameId) {
        this.playerColor = "red";
        this.showGame("red");
      }
    });

    this.chessContract.on("GameEnded", (inviteCode, winner, houseFee, payoutOrRefund) => {
      const inviteCodeStr = window.ethers.utils.toUtf8String(window.ethers.utils.hexDataSlice(inviteCode, 0, 6)).replace(/\0/g, "");
      console.log(`GameEnded: ${inviteCodeStr}, ${winner}, ${window.ethers.utils.formatEther(houseFee)} tDMT, ${window.ethers.utils.formatEther(payoutOrRefund)} tDMT`);
      if (this.gameId && inviteCodeStr === this.gameId) {
        this.handleGameEnd({ game_id: this.gameId, winner });
      }
    });

    this.chessContract.on("GameCancelled", (inviteCode, player1) => {
      const inviteCodeStr = window.ethers.utils.toUtf8String(window.ethers.utils.hexDataSlice(inviteCode, 0, 6)).replace(/\0/g, "");
      console.log(`GameCancelled: ${inviteCodeStr}, ${player1}`);
      if (this.gameId && inviteCodeStr === this.gameId) {
        this.handleGameEnd({ game_id: this.gameId, winner: window.ethers.constants.AddressZero });
      }
    });

    return this.chessContract;
  }

  initializeEventListeners() {
    if (isMultiplayerInitialized) return;
    isMultiplayerInitialized = true;

    const elements = {
      multiplayerBtn: document.getElementById("multiplayer-mode"),
      singlePlayerBtn: document.getElementById("ai-mode"),
      chessboard: document.getElementById("chessboard")
    };

    if (elements.multiplayerBtn) {
      elements.multiplayerBtn.addEventListener("click", () => {
        this.isMultiplayerMode = true;
        window.isMultiplayerMode = true;
        console.log("Switched to multiplayer mode");
      });
    }

    if (elements.singlePlayerBtn) {
      elements.singlePlayerBtn.addEventListener("click", () => {
        this.isMultiplayerMode = false;
        window.isMultiplayerMode = false;
        console.log("Switched to single player mode");
        this.leaveGame();
      });
    }

    if (elements.chessboard) {
      elements.chessboard.addEventListener("click", (e) => this.handleBoardClick(e));
    }
  }

  handleBoardClick(e) {
    if (!this.isMultiplayerMode || !this.isMyTurn() || this.isProcessingMove) return;

    const piece = e.target.closest(".piece");
    const square = e.target.closest(".highlight");

    if (piece) {
      const row = parseInt(piece.getAttribute("data-row"));
      const col = parseInt(piece.getAttribute("data-col"));
      this.handlePieceClick(row, col, piece);
    } else if (square && this.selectedPiece) {
      const row = parseInt(square.getAttribute("data-row"));
      const col = parseInt(square.getAttribute("data-col"));
      this.handleSquareClick(row, col);
    }
  }

  handlePieceClick(row, col, pieceElement) {
    if (!this.isMultiplayerMode || !this.isMyTurn()) return;

    const piece = window.board[row][col];
    if (!piece || window.getPieceColor(piece) !== this.playerColor) return;

    if (this.selectedPiece) {
      this.selectedPiece.element.style.opacity = "1";
      window.removeHighlights();
    }

    if (this.selectedPiece?.row === row && this.selectedPiece?.col === col) {
      this.selectedPiece = null;
      return;
    }

    this.selectedPiece = { row, col, element: pieceElement };
    pieceElement.style.opacity = "0.7";
    window.showLegalMoves(row, col);
  }

  async handleSquareClick(row, col) {
    if (!this.selectedPiece || !this.isMyTurn()) return;

    const startRow = this.selectedPiece.row;
    const startCol = this.selectedPiece.col;
    const piece = window.board[startRow][startCol];

    if (window.canMakeMove(startRow, startCol, row, col)) {
      let promotionPiece = null;
      if (this.isPawnPromotion(piece, row)) {
        window.promptPawnPromotion(startRow, startCol, row, col); // Delegate to chess.js
        return;
      }
      await this.makeMove(startRow, startCol, row, col, promotionPiece);
    }

    this.selectedPiece.element.style.opacity = "1";
    this.selectedPiece = null;
    window.removeHighlights();
  }

  isPawnPromotion(piece, targetRow) {
    return piece.toLowerCase() === "p" && 
           ((this.playerColor === "blue" && targetRow === 0) || 
            (this.playerColor === "red" && targetRow === 7));
  }

  async createGame(wagerAmount = 0.1) {
    if (this.hasCreatedGame) {
      console.log("Game already created this session");
      return;
    }
    this.hasCreatedGame = true;

    const createBtn = document.getElementById("create-game");
    if (createBtn) createBtn.disabled = true;

    try {
      const player = localStorage.getItem("currentPlayer");
      if (!player) throw new Error("No wallet connected");

      const web3 = await this.initWeb3();
      if (!web3) throw new Error("Failed to initialize Web3");
      const { signer } = web3;

      if (window.ethereum.chainId !== "0x7c8") {
        alert("Please switch to Sanko Testnet (chain ID 1992).");
        throw new Error("Wrong network");
      }

      const contract = await this.connectToContract();
      const minWager = parseFloat(window.ethers.utils.formatEther(await contract.MIN_WAGER()));
      const maxWager = parseFloat(window.ethers.utils.formatEther(await contract.MAX_WAGER()));

      if (wagerAmount < minWager || wagerAmount > maxWager) {
        alert(`Wager must be between ${minWager} and ${maxWager} tDMT`);
        throw new Error("Invalid wager amount");
      }

      const userAddress = await signer.getAddress();
      const existingGame = await contract.playerToGame(userAddress);
      if (existingGame !== "0x000000000000") {
        alert("You are already in a game. Leave or end it first.");
        throw new Error("Already in a game");
      }

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const inviteCodeBytes = window.ethers.utils.hexlify(window.ethers.utils.toUtf8Bytes(inviteCode)).slice(2, 14); // 6 bytes
      const wagerInWei = window.ethers.utils.parseEther(wagerAmount.toString());

      const tx = await contract.createGame(inviteCodeBytes, { value: wagerInWei });
      await tx.wait();
      console.log(`Game created: ${inviteCode}, wager: ${wagerAmount} tDMT`);

      const boardState = JSON.parse(JSON.stringify(window.initialBoard));
      const { data, error } = await this.supabase
        .from("chess_games")
        .insert({
          game_id: inviteCode,
          blue_player: player,
          board: { positions: boardState, piece_state: window.pieceState },
          current_player: "blue",
          game_state: "waiting",
          bet_amount: wagerAmount,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw new Error(`Supabase insert failed: ${error.message}`);

      this.gameId = inviteCode;
      this.playerColor = "blue";
      this.currentGameState = data[0];
      await this.subscribeToGame();
      await this.showGame("blue");

      const gameCodeDisplay = document.getElementById("gameCodeDisplay");
      const gameCode = document.getElementById("gameCode");
      if (gameCodeDisplay && gameCode) {
        gameCode.textContent = inviteCode;
        gameCodeDisplay.style.display = "block";
      }
      alert(`Game code: ${inviteCode} with wager ${wagerAmount} tDMT`);
    } catch (error) {
      console.error("Error creating game:", error.message);
      alert("Game creation failed: " + error.message);
      this.hasCreatedGame = false;
    } finally {
      if (createBtn) createBtn.disabled = false;
    }
  }

  async joinGameByCode(code) {
    const joinBtn = document.getElementById("join-game");
    if (joinBtn) joinBtn.disabled = true;

    try {
      const player = localStorage.getItem("currentPlayer");
      if (!player) throw new Error("Connect wallet first");

      const contract = await this.connectToContract();
      const inviteCodeBytes = window.ethers.utils.hexlify(window.ethers.utils.toUtf8Bytes(code.toUpperCase())).slice(2, 14); // 6 bytes
      const game = await contract.games(inviteCodeBytes);

      if (!game.isActive || game.player2 !== window.ethers.constants.AddressZero) {
        alert("Game not available or already joined");
        return;
      }

      const { data: games, error } = await this.supabase
        .from("chess_games")
        .select("*")
        .eq("game_id", code.toUpperCase())
        .single();

      if (error || !games) throw new Error("Game not found: " + error?.message);

      if (games.game_state !== "waiting" && games.game_state !== "active") {
        alert(`Game is ${games.game_state}`);
        return;
      }

      if (games.red_player === player || games.blue_player === player) {
        this.gameId = games.game_id;
        this.playerColor = games.blue_player === player ? "blue" : "red";
        this.currentGameState = games;
        await this.subscribeToGame();
        await this.showGame(this.playerColor);
        return;
      }

      if (games.red_player) {
        alert("Game already has both players");
        return;
      }

      const wagerInWei = game.wagerAmount;
      const tx = await contract.joinGame(inviteCodeBytes, { value: wagerInWei });
      await tx.wait();
      console.log(`Joined game: ${code}`);

      const { data: updateData, error: updateError } = await this.supabase
        .from("chess_games")
        .update({
          red_player: player,
          game_state: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", code.toUpperCase())
        .select()
        .single();

      if (updateError) throw new Error("Failed to join game: " + updateError.message);

      this.gameId = code;
      this.playerColor = "red";
      this.currentGameState = updateData;
      await this.subscribeToGame();
      await this.showGame("red");
    } catch (error) {
      console.error("Join game error:", error.message);
      alert(`Failed to join game: ${error.message}`);
    } finally {
      if (joinBtn) joinBtn.disabled = false;
    }
  }

  async endGame(inviteCode, winnerAddress) {
    try {
      const contract = await this.connectToContract();
      const inviteCodeBytes = window.ethers.utils.hexlify(window.ethers.utils.toUtf8Bytes(inviteCode)).slice(2, 14); // 6 bytes
      const game = await contract.games(inviteCodeBytes);
      if (!game.isActive) {
        alert("Game is not active.");
        return;
      }

      const tx = await contract.endGame(inviteCodeBytes, winnerAddress);
      await tx.wait();
      console.log(`Game ended: ${inviteCode}, winner: ${winnerAddress}`);

      await this.supabase
        .from("chess_games")
        .update({
          game_state: "completed",
          winner: winnerAddress === this.currentGameState.blue_player ? "blue" : "red",
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", inviteCode);

      this.handleGameEnd({ game_id: inviteCode, winner: winnerAddress });
    } catch (error) {
      console.error(`Error ending game ${inviteCode}:`, error.message);
      alert(`Failed to end game: ${error.message}`);
    }
  }

  async leaveGame() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      console.log("Unsubscribed from game channel");
    }

    try {
      if (this.gameId) {
        const web3 = await this.initWeb3();
        if (!web3) throw new Error("Failed to initialize Web3");
        const { signer } = web3;
        const contract = await this.connectToContract();
        const userAddress = await signer.getAddress();
        const inviteCode = await contract.playerToGame(userAddress);
        if (inviteCode !== "0x000000000000") {
          const game = await contract.games(inviteCode);
          if (game.player2 === window.ethers.constants.AddressZero) {
            const tx = await contract.cancelGame(inviteCode);
            await tx.wait();
            console.log(`Cancelled game ${this.gameId}`);
          } else {
            alert("Cannot leave an active game with two players.");
            return;
          }
        }

        const { error } = await this.supabase
          .from("chess_games")
          .update({
            game_state: "cancelled",
            winner: null,
            updated_at: new Date().toISOString(),
          })
          .eq("game_id", this.gameId);
        if (error) throw new Error("Supabase update failed: " + error.message);
      }

      this.resetGameState();
      console.log("Successfully left game");
    } catch (error) {
      console.error("Leave game error:", error.message);
      alert("Error leaving game: " + error.message);
      this.resetGameState(); // Reset even on error
    }
  }

  resetGameState() {
    this.gameId = null;
    this.playerColor = null;
    this.currentGameState = null;
    this.selectedPiece = null;
    this.hasCreatedGame = false;
    this.lastCreateClick = 0;

    const menuEl = document.querySelector(".multiplayer-menu");
    const gameEl = document.getElementById("chess-game");
    if (menuEl) menuEl.style.display = "block";
    if (gameEl) gameEl.style.display = "none";

    if (window.updateGameResult) window.updateGameResult({ winner: "loss", player: localStorage.getItem("currentPlayer"), mode: "online" });
    if (window.leaderboardManager) window.leaderboardManager.loadLeaderboard();
  }

  isMyTurn() {
    return this.currentGameState?.current_player === this.playerColor;
  }

  showGame(color) {
    try {
      const menuEl = document.querySelector(".multiplayer-menu");
      const gameEl = document.getElementById("chess-game");

      if (menuEl) menuEl.style.display = "none";
      if (gameEl) gameEl.style.display = "block";

      window.resetGame();
      window.isMultiplayerMode = true;
      this.isMultiplayerMode = true;
      window.playerColor = color;
      this.playerColor = color;
      window.currentPlayer = this.currentGameState?.current_player || "blue";

      if (this.currentGameState?.board?.positions) {
        window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
        window.pieceState = this.currentGameState.board.piece_state || window.pieceState;
      }

      window.placePieces();
      this.updateBoardInteractivity();
      window.updateStatusDisplay(this.isMyTurn() ? "Your turn" : "Opponent's turn");
    } catch (error) {
      console.error("Error in showGame:", error);
      window.updateStatusDisplay("Error initializing game board");
    }
  }

  updateBoardInteractivity() {
    const chessboard = document.getElementById("chessboard");
    if (!chessboard) return;

    const isMyTurn = this.isMyTurn();
    chessboard.style.pointerEvents = isMyTurn ? "auto" : "none";

    const pieces = chessboard.getElementsByClassName("piece");
    Array.from(pieces).forEach((piece) => {
      const row = parseInt(piece.getAttribute("data-row"));
      const col = parseInt(piece.getAttribute("data-col"));
      const pieceType = window.board[row][col];
      if (pieceType) {
        const pieceColor = window.getPieceColor(pieceType);
        piece.style.cursor = isMyTurn && pieceColor === this.playerColor ? "pointer" : "default";
      }
    });
  }

  async subscribeToGame() {
    if (this.subscription) this.subscription.unsubscribe();

    this.subscription = this.supabase
      .channel(`game_${this.gameId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chess_games",
        filter: `game_id=eq.${this.gameId}`,
      }, (payload) => this.handleUpdate(payload.new))
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.log("Subscription error, retrying...");
          setTimeout(() => this.subscribeToGame(), 1000);
        }
      });
  }

  async handleUpdate(game) {
    if (!game) return;
    try {
      this.currentGameState = game;
      if (game.board?.positions) {
        window.board = JSON.parse(JSON.stringify(game.board.positions));
        window.pieceState = game.board.piece_state || window.pieceState;
        window.placePieces();
      }
      if (game.current_player) {
        window.currentPlayer = game.current_player;
        this.updateBoardInteractivity();
        const baseStatus = this.isMyTurn() ? "Your turn" : "Opponent's turn";
        if (window.isKingInCheck(game.current_player)) {
          window.updateStatusDisplay(`Check! ${baseStatus}`);
        } else if (game.game_state !== "completed") {
          window.updateStatusDisplay(baseStatus);
        }
      }
      if (game.game_state === "completed") {
        await this.handleGameEnd(game);
      }
    } catch (error) {
      console.error("Update error:", error);
      window.updateStatusDisplay("Error syncing game state");
    }
  }

  async handleGameEnd(game) {
    try {
      let gameResult, displayMessage;

      if (game.winner === "draw") {
        gameResult = "draw";
        displayMessage = "Game Over - Draw!";
      } else if (game.winner === window.ethers.constants.AddressZero) {
        gameResult = "loss";
        displayMessage = "Game Cancelled!";
      } else {
        gameResult = game.winner === (this.playerColor === "blue" ? this.currentGameState.blue_player : this.currentGameState.red_player) ? "win" : "loss";
        displayMessage = `Game Over - ${game.winner === this.currentGameState.blue_player ? "Blue" : "Red"} wins!`;
      }

      if (game.bet_amount) {
        const wagerAmount = window.ethers.utils.parseEther(game.bet_amount.toString());
        const totalPot = wagerAmount.mul(2);
        const houseFee = totalPot.mul(5).div(100);
        const payout = totalPot.sub(houseFee);
        const payoutInTDMT = window.ethers.utils.formatEther(payout);
        const houseFeeInTDMT = window.ethers.utils.formatEther(houseFee);

        if (game.winner === "draw") {
          const refundPerPlayer = window.ethers.utils.formatEther(payout.div(2));
          displayMessage += `\nEach player refunded: ${refundPerPlayer} tDMT (after 5% house fee of ${houseFeeInTDMT} tDMT)`;
        } else if (game.winner !== window.ethers.constants.AddressZero) {
          displayMessage += `\nWinner payout: ${payoutInTDMT} tDMT (after 5% house fee of ${houseFeeInTDMT} tDMT)`;
        }
      }

      window.updateStatusDisplay(displayMessage);

      if (window.updateGameResult) {
        window.updateGameResult({ winner: gameResult, player: localStorage.getItem("currentPlayer"), mode: "online" });
      }

      if (window.leaderboardManager) {
        await window.leaderboardManager.loadLeaderboard();
      }

      const chessboard = document.getElementById("chessboard");
      if (chessboard) chessboard.style.pointerEvents = "none";
    } catch (error) {
      console.error("Error handling game end:", error);
    }
  }

  async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
    if (!this.gameId || this.isProcessingMove || !this.isMyTurn()) return false;
    this.isProcessingMove = true;

    try {
      const piece = window.board[startRow][startCol];
      const newBoard = JSON.parse(JSON.stringify(window.board));
      const capturedPiece = newBoard[endRow][endCol];
      newBoard[endRow][endCol] = promotion || piece;
      newBoard[startRow][startCol] = null;

      // Update pieceState for castling/en passant
      const color = window.getPieceColor(piece);
      if (piece.toLowerCase() === "k") {
        if (color === "blue") window.pieceState.blueKingMoved = true;
        else window.pieceState.redKingMoved = true;
        if (Math.abs(endCol - startCol) === 2) {
          const row = color === "blue" ? 7 : 0;
          if (endCol === 6) {
            newBoard[row][5] = newBoard[row][7];
            newBoard[row][7] = null;
          } else if (endCol === 2) {
            newBoard[row][3] = newBoard[row][0];
            newBoard[row][0] = null;
          }
        }
      }
      if (piece.toLowerCase() === "r") {
        if (color === "blue") {
          if (startCol === 0) window.pieceState.blueRooksMove.left = true;
          if (startCol === 7) window.pieceState.blueRooksMove.right = true;
        } else {
          if (startCol === 0) window.pieceState.redRooksMove.left = true;
          if (startCol === 7) window.pieceState.redRooksMove.right = true;
        }
      }
      if (piece.toLowerCase() === "p" && Math.abs(startRow - endRow) === 2) {
        window.pieceState.lastPawnDoubleMove = { row: endRow, col: endCol };
      } else {
        window.pieceState.lastPawnDoubleMove = null;
      }

      const nextPlayer = this.playerColor === "blue" ? "red" : "blue";
      let gameEndState = null;

      window.board = newBoard;

      if (window.isCheckmate(nextPlayer)) {
        gameEndState = { game_state: "completed", winner: this.playerColor };
        const winnerAddress = this.playerColor === "blue" ? this.currentGameState.blue_player : this.currentGameState.red_player;
        await this.endGame(this.gameId, winnerAddress);
      } else if (window.isStalemate(nextPlayer)) {
        gameEndState = { game_state: "completed", winner: "draw" };
      }

      const updateData = {
        board: { positions: newBoard, piece_state: window.pieceState },
        current_player: nextPlayer,
        last_move: { start_row: startRow, start_col: startCol, end_row: endRow, end_col: endCol, piece, promotion },
        updated_at: new Date().toISOString(),
        ...(gameEndState || {}),
      };

      const { error } = await this.supabase
        .from("chess_games")
        .update(updateData)
        .eq("game_id", this.gameId);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);

      window.board = newBoard;
      window.placePieces();
      return true;
    } catch (error) {
      console.error("Move error:", error.message);
      return false;
    } finally {
      this.isProcessingMove = false;
    }
  }
}

function initializeMultiplayerManager() {
  document.addEventListener('supabaseReady', () => {
    if (!window.multiplayerManager) {
      window.multiplayerManager = new MultiplayerManager();
      console.log("MultiplayerManager initialized successfully");
    }
  });
}

window.initializeMultiplayerManager = initializeMultiplayerManager;

// Trigger initialization after Supabase is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.gameDatabase) {
    document.dispatchEvent(new CustomEvent('supabaseReady'));
  }
});