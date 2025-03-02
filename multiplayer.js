// multiplayer.js

// Ensure Ethers.js is loaded from CDN (e.g., in lawbstation.html)
if (typeof window.ethers === "undefined") {
  throw new Error("Ethers.js not loaded. Please include the CDN in your HTML.");
}

// ChessGame Contract ABI
if (!window.chessGameABI) {
  const chessGameABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
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
          "name": "wagerPayout",
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
      "inputs": [
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
      "name": "createGame",
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
      "inputs": [
        {
          "internalType": "bytes6",
          "name": "inviteCode",
          "type": "bytes6"
        }
      ],
      "name": "joinGame",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lawbToken",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
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
      "inputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        }
      ],
      "name": "withdrawTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  window.chessGameABI = chessGameABI;
} else {
  console.log("chessGameABI already defined, reusing existing definition");
}

// LAWb Token ABI (standard ERC-20, verified via Parsec.fi)
const lawbTokenABI = [
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Contract address for ChessGame
const contractAddress = "0x6aa574B21212C6E7436Eb26A27542F1AEFfFad87";

// Sanko network configuration
const sankoNetwork = {
  chainId: 1996,
  name: "Sanko",
};

let isMultiplayerInitialized = false;
let lastGlobalCreateClick = 0;

class MultiplayerManager {
  static hasGameBeenCreated = false;

  constructor() {
    if (!window.gameDatabase) {
      throw new Error("Supabase not initialized. Please wait for gameDatabase.");
    }
    this.supabase = window.gameDatabase;
    this.gameId = null;
    this.playerColor = null;
    this.subscription = null;
    this.currentGameState = null;
    this.isMultiplayerMode = false;
    this.isProcessingMove = false;
    this.selectedPiece = null;
    this.handleCreateGame = null;
    this.lastCreateClick = 0;
    this.hasCreatedGame = false;
    this.chessContract = null;
    this.initializeEventListeners();
    console.log("MultiplayerManager initialized");
  }

  async initWeb3() {
    console.log("Entering initWeb3");
    if (!window.walletConnector) {
      console.error("WalletConnector not initialized");
      alert("Wallet system not initialized. Please connect via UI first.");
      return null;
    }
    try {
      console.log("Attempting to connect EVM wallet");
      const address = await window.walletConnector.connectEVMWallet();
      if (!address) {
        throw new Error("No address returned from wallet connection.");
      }
      console.log("Wallet connected, address:", address);
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
    console.log("Entering connectToContract");
    const web3 = await this.initWeb3();
    if (!web3) {
      console.error("Web3 not initialized, cannot connect to contract");
      return null;
    }
    const { signer } = web3;
    this.chessContract = new window.ethers.Contract(contractAddress, window.chessGameABI, signer);
    console.log("Connected to ChessGame contract at:", contractAddress);
    return this.chessContract;
  }

  initializeEventListeners() {
    if (isMultiplayerInitialized) {
      console.log("Event listeners already initialized, skipping");
      return;
    }
    isMultiplayerInitialized = true;

    const multiplayerBtn = document.getElementById("multiplayer-mode");
    const singlePlayerBtn = document.getElementById("ai-mode");
    const createGameBtn = document.getElementById("create-game");
    const joinGameBtn = document.getElementById("join-game");
    const cancelBtn = document.getElementById("cancel-matchmaking");
    const leaveGameBtn = document.getElementById("leave-game");

    let isCreatingGame = false;

    if (multiplayerBtn) {
      multiplayerBtn.addEventListener("click", () => {
        this.isMultiplayerMode = true;
        window.isMultiplayerMode = true;
        console.log("Switched to multiplayer mode");
      });
    }

    if (singlePlayerBtn) {
      singlePlayerBtn.addEventListener("click", () => {
        this.isMultiplayerMode = false;
        window.isMultiplayerMode = false;
        console.log("Switched to single player mode");
        this.leaveGame();
      });
    }

    if (createGameBtn) {
      createGameBtn.removeEventListener("click", this.handleCreateGame);
      this.handleCreateGame = async () => {
        createGameBtn.disabled = true;
        const now = Date.now();
        if (isCreatingGame || this.gameId || now - lastGlobalCreateClick < 1000) {
          console.log("Game creation blocked: in progress, active, or too soon");
          createGameBtn.disabled = false;
          return;
        }
        this.lastCreateClick = now;
        lastGlobalCreateClick = now;
        isCreatingGame = true;
        try {
          console.log("Triggering createGame from handleCreateGame");
          await this.createGame();
        } finally {
          isCreatingGame = false;
          createGameBtn.disabled = false;
        }
      };
      createGameBtn.addEventListener("click", this.handleCreateGame);
    }

    if (joinGameBtn) {
      joinGameBtn.onclick = () => {
        const code = document.getElementById("game-code-input")?.value?.trim();
        if (code) {
          this.joinGameByCode(code);
        } else {
          alert("Please enter a game code");
        }
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        this.leaveGame();
        const status = document.getElementById("matchmaking-status");
        if (status) status.style.display = "none";
      };
    }

    if (leaveGameBtn) {
      leaveGameBtn.onclick = () => this.leaveGame();
    }

    const chessboard = document.getElementById("chessboard");
    if (chessboard) {
      chessboard.addEventListener("click", (e) => this.handleBoardClick(e));
    }
  }

  handleBoardClick(e) {
    if (!this.isMultiplayerMode) return;
    if (!this.isMyTurn() || this.isProcessingMove) {
      console.log("Not player turn or processing move");
      return;
    }

    const piece = e.target.closest(".piece");
    const square = e.target.closest(".highlight");

    if (piece) {
      const row = parseInt(piece.getAttribute("data-row"));
      const col = parseInt(piece.getAttribute("data-col"));
      if (this.selectedPiece) {
        const targetPiece = window.board[row][col];
        if (targetPiece && window.getPieceColor(targetPiece) !== this.playerColor) {
          const startRow = this.selectedPiece.row;
          const startCol = this.selectedPiece.col;
          if (window.canMakeMove(startRow, startCol, row, col)) {
            this.makeMove(startRow, startCol, row, col);
            this.selectedPiece = null;
            window.removeHighlights();
            return;
          }
        }
      }
      this.handlePieceClick(row, col);
    } else if (square && this.selectedPiece) {
      const row = parseInt(square.getAttribute("data-row"));
      const col = parseInt(square.getAttribute("data-col"));
      this.handleSquareClick(row, col);
    }
  }

  handlePieceClick(row, col) {
    if (!this.isMultiplayerMode || !this.isMyTurn()) return;

    const piece = window.board[row][col];
    if (!piece) return;

    const pieceColor = window.getPieceColor(piece);
    if (pieceColor !== this.playerColor) return;

    window.removeHighlights();

    if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
      this.selectedPiece = null;
      return;
    }

    this.selectedPiece = { row, col };
    const validMoves = window.getValidMoves(row, col);
    validMoves.forEach(move => {
      const isCapture = window.board[move.row][move.col] !== null;
      window.highlightSquare(move.row, move.col, isCapture);
    });
  }

  async handleSquareClick(row, col) {
    if (!this.selectedPiece || !this.isMyTurn()) return;

    const startRow = this.selectedPiece.row;
    const startCol = this.selectedPiece.col;
    const piece = window.board[startRow][startCol];

    if (this.isPawnPromotion(piece, row)) {
      const promotionPiece = await this.handlePawnPromotion();
      if (!promotionPiece) return;
      await this.makeMove(startRow, startCol, row, col, promotionPiece);
    } else {
      await this.makeMove(startRow, startCol, row, col);
    }

    this.selectedPiece = null;
    window.removeHighlights();
  }

  isPawnPromotion(piece, targetRow) {
    return (piece.toLowerCase() === "p" && 
            ((this.playerColor === "blue" && targetRow === 0) || 
             (this.playerColor === "red" && targetRow === 7)));
  }

  handlePawnPromotion() {
    return new Promise((resolve) => {
      const options = ["q", "r", "n", "b"];
      const choice = window.prompt("Choose promotion piece (Q/R/N/B):", "Q");
      if (!choice) {
        resolve(null);
        return;
      }
      const piece = choice.toLowerCase().charAt(0);
      resolve(options.includes(piece) ? piece : "q");
    });
  }

  async createGame() {
    console.log("Entering createGame");
    if (MultiplayerManager.hasGameBeenCreated || this.hasCreatedGame) {
      console.log("Game already created this session, ignoring additional call");
      return;
    }
    MultiplayerManager.hasGameBeenCreated = true;
    this.hasCreatedGame = true;

    try {
      const player = localStorage.getItem("currentPlayer");
      if (!player) {
        alert("Please connect your wallet first via the UI.");
        throw new Error("No wallet connected");
      }

      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        console.log("Current chainId:", chainId);
        if (chainId.toLowerCase() !== "0x7cc") {
          alert("Please switch to the Sanko network in MetaMask (chain ID 1996).");
          throw new Error("Wrong network");
        }
      } else {
        alert("Ethereum provider not detected. Please ensure MetaMask is installed.");
        throw new Error("No Ethereum provider");
      }

      const web3 = await this.initWeb3();
      if (!web3 || !web3.signer) {
        throw new Error("Failed to initialize Web3");
      }
      const { signer } = web3;

      const wagerInput = document.getElementById("wagerAmount");
      const wagerAmount = parseFloat(wagerInput?.value) || 1000;
      const minWager = 100;
      const maxWager = 10000000;

      if (wagerAmount < minWager || wagerAmount > maxWager) {
        alert(`Wager must be between ${minWager} and ${maxWager} $LAWB`);
        throw new Error("Invalid wager amount");
      }

      const contract = await this.connectToContract();
      if (!contract) {
        throw new Error("Failed to connect to contract");
      }

      const userAddress = await signer.getAddress();
      const existingGame = await contract.playerToGame(userAddress);
      if (existingGame !== "0x000000000000") {
        const { data: activeGames, error } = await this.supabase
          .from("chess_games")
          .select("game_id")
          .eq("blue_player", userAddress)
          .or("red_player.eq." + userAddress)
          .eq("game_state", "active");
        const gameIds = activeGames?.map(game => game.game_id).join(", ") || "unknown game";
        alert(`You are already in active games (${gameIds}). Please use 'Leave Game' or end them before creating a new one.`);
        throw new Error("Already in a game");
      }

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const inviteCodeBytes = window.ethers.utils.formatBytes32String(inviteCode).slice(0, 14);
      console.log("inviteCode:", inviteCode, "as bytes6:", inviteCodeBytes);
      const wagerInWei = window.ethers.utils.parseUnits(wagerAmount.toString(), 6);

      const lawbAddress = "0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F";
      const lawbContract = new window.ethers.Contract(lawbAddress, lawbTokenABI, signer);

      const allowance = await lawbContract.allowance(userAddress, contractAddress);
      if (allowance.lt(wagerInWei)) {
        const approveTx = await lawbContract.approve(contractAddress, wagerInWei);
        await approveTx.wait();
        console.log("Token approval successful");
      }

      const tx = await contract.createGame(inviteCodeBytes, wagerInWei);
      await tx.wait();
      console.log(`Blockchain game created with invite code ${inviteCode} and wager ${wagerAmount} $LAWB`);

      const boardState = JSON.parse(JSON.stringify(window.initialBoard));
      const { data, error } = await this.supabase
        .from("chess_games")
        .insert({
          game_id: inviteCode,
          blue_player: player,
          board: {
            positions: boardState,
            piece_state: window.pieceState || {},
          },
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
      alert(`Game code: ${inviteCode} with wager ${wagerAmount} $LAWB`);
    } catch (error) {
      console.error("Error creating game:", error.message);
      alert("Game creation failed: " + error.message);
      MultiplayerManager.hasGameBeenCreated = false;
      this.hasCreatedGame = false;
    }
  }

  async joinGameByCode(code) {
    try {
      const player = localStorage.getItem("currentPlayer");
      if (!player) {
        alert("Connect wallet first");
        return;
      }

      const { data: games, error: queryError } = await this.supabase
        .from("chess_games")
        .select("*")
        .eq("game_id", code.toUpperCase());

      if (queryError || !games?.length) {
        alert("Game not found");
        return;
      }

      const game = games[0];
      console.log("Found game:", game);

      if (game.game_state !== "waiting" && game.game_state !== "active") {
        alert(`Game is ${game.game_state}`);
        return;
      }

      if (game.red_player === player || game.blue_player === player) {
        console.log("Rejoining existing game");
        this.gameId = game.game_id;
        this.playerColor = game.blue_player === player ? "blue" : "red";
        this.currentGameState = game;
        await this.subscribeToGame();
        await this.showGame(this.playerColor);
        return;
      }

      if (game.red_player) {
        alert("Game already has both players");
        return;
      }

      const web3 = await this.initWeb3();
      if (!web3 || !web3.signer) {
        throw new Error("Failed to initialize Web3");
      }
      const { signer } = web3;

      const contract = await this.connectToContract();
      if (!contract) throw new Error("Failed to connect to contract");

      const wagerInWei = window.ethers.utils.parseUnits(game.bet_amount.toString(), 6);

      const lawbAddress = "0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F";
      const userAddress = await signer.getAddress();
      const lawbContract = new window.ethers.Contract(lawbAddress, lawbTokenABI, signer);

      const allowance = await lawbContract.allowance(userAddress, contractAddress);
      if (allowance.lt(wagerInWei)) {
        const approveTx = await lawbContract.approve(contractAddress, wagerInWei);
        await approveTx.wait();
        console.log("Token approval successful");
      }

      const tx = await contract.joinGame(game.game_id);
      await tx.wait();
      console.log(`Blockchain game joined with invite code ${game.game_id}`);

      const { data: updateData, error: updateError } = await this.supabase
        .from("chess_games")
        .update({
          red_player: player,
          game_state: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", game.game_id)
        .select()
        .single();

      if (updateError) throw new Error("Failed to join game");

      this.gameId = game.game_id;
      this.playerColor = "red";
      this.currentGameState = updateData;
      await this.subscribeToGame();
      await this.showGame("red");
    } catch (error) {
      console.error("Join game error:", error);
      alert(`Failed to join game: ${error.message}`);
    }
  }

  async endGame(inviteCode, winnerAddress) {
    console.log("Entering endGame");
    try {
      const contract = await this.connectToContract();
      if (!contract) throw new Error("Failed to connect to contract");

      console.log(`Attempting to end game ${inviteCode} with winner ${winnerAddress}`);
      const tx = await contract.endGame(inviteCode, winnerAddress);
      console.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`Blockchain game ended with invite code ${inviteCode}, winner ${winnerAddress}`);

      await this.supabase
        .from("chess_games")
        .update({
          game_state: "completed",
          winner: this.playerColor === "blue" ? "blue" : "red",
          updated_at: new Date().toISOString(),
        })
        .eq("game_id", inviteCode);

      const game = this.currentGameState;
      const wagerAmount = window.ethers.utils.parseUnits(game.bet_amount.toString(), 6);
      const totalPot = window.ethers.BigNumber.from(wagerAmount).mul(2);
      const houseFee = totalPot.mul(5).div(100);
      const payout = totalPot.sub(houseFee);
      const payoutInLAWB = window.ethers.utils.formatUnits(payout, 6);

      alert(`Game ended! Winner payout: ${payoutInLAWB} $LAWB (after 5% house fee of ${window.ethers.utils.formatUnits(houseFee, 6)} $LAWB)`);

      this.handleGameEnd({ game_id: inviteCode, winner: winnerAddress });
    } catch (error) {
      console.error(`Error ending game ${inviteCode}:`, error.message);
      alert(`Failed to end game ${inviteCode}: ${error.message}`);
      throw error;
    }
  }

  async endActiveGames() {
    console.log("Entering endActiveGames");
    try {
      console.log("Initializing Web3");
      const web3 = await this.initWeb3();
      if (!web3) {
        console.error("Web3 initialization failed in endActiveGames");
        throw new Error("Failed to initialize Web3");
      }
      const userAddress = await web3.signer.getAddress();
      console.log("User address:", userAddress);
  
      console.log("Connecting to contract");
      const contract = await this.connectToContract();
      if (!contract) {
        console.error("Contract connection failed in endActiveGames");
        throw new Error("Failed to connect to contract");
      }
  
      console.log("Checking playerToGame for address:", userAddress);
      const inviteCodeBytes = await contract.playerToGame(userAddress);
      console.log("playerToGame result:", inviteCodeBytes);
      if (inviteCodeBytes === "0x000000000000") {
        console.log("No active games found on-chain for address:", userAddress);
        return;
      }
  
      // Fix: Directly use bytes6 as is (no need to parse as bytes32)
      const inviteCode = inviteCodeBytes; // Keep as hex string for contract call
      console.log(`Found active game on-chain: ${inviteCode}`);
  
      console.log("Fetching game data from Supabase for game:", inviteCode);
      const { data: gameData, error: fetchError } = await this.supabase
        .from("chess_games")
        .select("*")
        .eq("game_id", inviteCode.slice(2, 8)) // Convert bytes6 to 6-char string for Supabase
        .single();
  
      if (fetchError || !gameData) {
        console.error(`Supabase fetch error for game ${inviteCode}:`, fetchError?.message || "No game data");
        // Proceed anyway since blockchain state is the priority
      } else {
        const game = gameData;
        const opponent = game.blue_player === userAddress ? game.red_player : game.blue_player;
        const winnerAddress = opponent || "0x0000000000000000000000000000000000000000";
        console.log(`Determined winner address: ${winnerAddress}`);
        console.log("Calling endGame for:", inviteCode);
        await this.endGame(inviteCode, winnerAddress);
      }
  
      // If no Supabase data, still attempt to end with default winner
      if (!gameData) {
        console.log("No Supabase data found, ending game with default winner");
        await this.endGame(inviteCode, "0x0000000000000000000000000000000000000000");
      }
  
      console.log(`Successfully ended game ${inviteCode}`);
    } catch (error) {
      console.error("Error in endActiveGames:", error.message);
      alert("Failed to end active games: " + error.message);
    }
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
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.supabase
      .channel(`game_${this.gameId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chess_games",
        filter: `game_id=eq.${this.gameId}`,
      },
      (payload) => {
        this.handleUpdate(payload.new);
      })
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
        window.placePieces();
      }
      if (game.current_player) {
        window.currentPlayer = game.current_player;
        this.updateBoardInteractivity();
        const baseStatus = this.isMyTurn() ? "Your turn" : "Opponent's turn";
        console.log(
          `Checking ${game.current_player}'s king: inCheck=${window.isKingInCheck(game.current_player)}, checkmate=${window.isCheckmate(game.current_player)}`
        );
        if (window.isKingInCheck && window.isKingInCheck(game.current_player)) {
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
      let gameResult;
      let displayMessage;

      if (game.winner === "draw") {
        gameResult = "draw";
        displayMessage = "Game Over - Draw!";
      } else {
        gameResult = game.winner === this.playerColor ? "win" : "loss";
        displayMessage = `Game Over - ${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`;
      }

      if (game.bet_amount) {
        const wagerInWei = window.ethers.utils.parseUnits(game.bet_amount.toString(), 6);
        const totalPot = window.ethers.BigNumber.from(wagerInWei).mul(2);
        const houseFee = totalPot.mul(5).div(100);
        const payout = totalPot.sub(houseFee);
        const payoutInLAWB = window.ethers.utils.formatUnits(payout, 6);
        displayMessage += `\nWinner payout: ${payoutInLAWB} $LAWB (after 5% house fee of ${window.ethers.utils.formatUnits(houseFee, 6)} $LAWB)`;
      }

      window.updateStatusDisplay(displayMessage);

      if (window.updateGameResult) {
        window.updateGameResult(gameResult);
      }

      if (window.leaderboardManager) {
        await window.leaderboardManager.loadLeaderboard();
      }

      const chessboard = document.getElementById("chessboard");
      if (chessboard) {
        chessboard.style.pointerEvents = "none";
      }
    } catch (error) {
      console.error("Error handling game end:", error);
    }
  }

  async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
    if (!this.gameId || this.isProcessingMove || !this.isMyTurn()) return false;
    try {
      this.isProcessingMove = true;
      const newBoard = JSON.parse(JSON.stringify(window.board));
      newBoard[endRow][endCol] = promotion || newBoard[startRow][startCol];
      newBoard[startRow][startCol] = null;
      const nextPlayer = this.playerColor === "blue" ? "red" : "blue";
      let gameEndState = null;

      window.board = newBoard;

      if (window.isCheckmate && window.isCheckmate(nextPlayer)) {
        gameEndState = { game_state: "completed", winner: this.playerColor };
      } else if (window.isStalemate && window.isStalemate(nextPlayer)) {
        gameEndState = { game_state: "completed", winner: "draw" };
      }

      const updateData = {
        board: { positions: newBoard, piece_state: window.pieceState || {} },
        current_player: nextPlayer,
        last_move: {
          start_row: startRow,
          start_col: startCol,
          end_row: endRow,
          end_col: endCol,
          piece: newBoard[endRow][endCol],
          promotion,
        },
        updated_at: new Date().toISOString(),
        ...(gameEndState || {}),
      };

      console.log("Updating game with payload:", JSON.stringify(updateData, null, 2));

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

  async leaveGame() {
    console.log("Entering leaveGame");
    if (this.subscription) {
      this.subscription.unsubscribe();
      console.log("Unsubscribed from game channel");
    }
  
    console.log(`Current gameId: ${this.gameId}`);
    try {
      console.log("Calling endActiveGames regardless of gameId");
      await this.endActiveGames(); // Always try to clear blockchain state
  
      if (this.gameId) {
        console.log(`Updating Supabase for gameId: ${this.gameId}`);
        const { error: updateError } = await this.supabase
          .from("chess_games")
          .update({
            game_state: "cancelled",
            winner: null,
            updated_at: new Date().toISOString(),
          })
          .eq("game_id", this.gameId);
  
        if (updateError) {
          console.error("Supabase update error:", updateError.message);
          throw new Error("Failed to update game state in Supabase: " + updateError.message);
        }
        console.log(`Game ${this.gameId} marked as cancelled in Supabase`);
      } else {
        console.log("No gameId set, skipping Supabase update");
      }
  
      if (window.updateGameResult) {
        window.updateGameResult("loss");
        console.log("Updated game result to loss");
      }
  
      if (window.leaderboardManager) {
        await window.leaderboardManager.loadLeaderboard();
        console.log("Leaderboard updated after leaving game");
      }
    } catch (error) {
      console.error("Leave game error:", error.message);
      alert("Error leaving game: " + error.message);
    }
  
    this.gameId = null;
    this.playerColor = null;
    this.currentGameState = null;
    this.selectedPiece = null;
    this.hasCreatedGame = false;
    MultiplayerManager.hasGameBeenCreated = false;
  
    const menuEl = document.querySelector(".multiplayer-menu");
    const gameEl = document.getElementById("chess-game");
    if (menuEl) menuEl.style.display = "block";
    if (gameEl) gameEl.style.display = "none";
    console.log("Reset to multiplayer menu");
  }

  async updateGameStatus(status, winner = null) {
    if (!this.gameId) return;

    if (!['waiting', 'active', 'completed', 'cancelled', 'payout_failed'].includes(status)) {
      throw new Error(`Invalid game_state: ${status}. Must be 'waiting', 'active', 'completed', 'cancelled', or 'payout_failed'.`);
    }

    try {
      const updateData = {
        game_state: status,
        updated_at: new Date().toISOString(),
      };
      if (winner) {
        updateData.winner = winner;
      }

      const { error } = await this.supabase
        .from("chess_games")
        .update(updateData)
        .eq("game_id", this.gameId);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);
      console.log(`Game ${this.gameId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating game status:", error);
    }
  }
}

function initializeMultiplayerManager() {
  if (!window.gameDatabase) {
    console.log("Waiting for gameDatabase to initialize...");
    setTimeout(initializeMultiplayerManager, 500);
    return;
  }
  if (!window.multiplayerManager) {
    window.multiplayerManager = new MultiplayerManager();
    console.log("MultiplayerManager initialized successfully");
  } else {
    console.log("MultiplayerManager already initialized, reusing instance");
  }
}

initializeMultiplayerManager();

window.initializeMultiplayerManager = initializeMultiplayerManager;