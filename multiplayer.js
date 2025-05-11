const ethers = window.ethers;

if (!window.chessGameABI) {
    window.chessGameABI = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "name": "inviteCode", "type": "bytes6" },
                { "indexed": true, "name": "player1", "type": "address" },
                { "indexed": false, "name": "wagerAmount", "type": "uint256" }
            ],
            "name": "GameCreated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "name": "inviteCode", "type": "bytes6" },
                { "indexed": true, "name": "player2", "type": "address" }
            ],
            "name": "GameJoined",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "name": "inviteCode", "type": "bytes6" },
                { "indexed": true, "name": "winner", "type": "address" },
                { "indexed": false, "name": "houseFee", "type": "uint256" },
                { "indexed": false, "name": "payoutOrRefund", "type": "uint256" }
            ],
            "name": "GameEnded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "name": "inviteCode", "type": "bytes6" },
                { "indexed": true, "name": "player1", "type": "address" }
            ],
            "name": "GameCancelled",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "MAX_WAGER",
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "MIN_WAGER",
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "name": "inviteCode", "type": "bytes6" }],
            "name": "cancelGame",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "name": "inviteCode", "type": "bytes6" }],
            "name": "createGame",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                { "name": "inviteCode", "type": "bytes6" },
                { "name": "winner", "type": "address" }
            ],
            "name": "endGame",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "name": "", "type": "bytes6" }],
            "name": "games",
            "outputs": [
                { "name": "player1", "type": "address" },
                { "name": "player2", "type": "address" },
                { "name": "isActive", "type": "bool" },
                { "name": "winner", "type": "address" },
                { "name": "inviteCode", "type": "bytes6" },
                { "name": "wagerAmount", "type": "uint256" }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "name": "inviteCode", "type": "bytes6" }],
            "name": "joinGame",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{ "name": "", "type": "address" }],
            "name": "leaderboard",
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "name": "", "type": "address" }],
            "name": "playerToGame",
            "outputs": [{ "name": "", "type": "bytes6" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];
} else {
    console.log("chessGameABI already defined, reusing existing definition");
}

const contractAddress = "0x3112AF5728520F52FD1C6710dD7bD52285a68e47";
const edgeFunctionUrl = "https://roxwocgknkiqnsgiojgz.supabase.co/functions/v1/dynamic-task";
const sankoNetwork = { chainId: 1992, name: "Sanko Testnet" };
let isMultiplayerInitialized = false;
let isInitializingMultiplayer = false;

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
        this.currentAddress = null;
        this.isCheckingGameState = false;
        this.initializeEventListeners();
        console.log("MultiplayerManager initialized");
    }

    async initWeb3(attempt = 1, maxAttempts = 3) {
        debug(`initWeb3 called, attempt ${attempt}`);
        if (attempt > maxAttempts) {
            console.error("initWeb3 max retries reached");
            return null;
        }
        if (!window.walletConnector) {
            console.error("WalletConnector not initialized");
            alert("Please-connect-via-UI-first.");
            return null;
        }
        try {
            const address = await window.walletConnector.connectEVMWallet(true);
            if (!address) throw new Error("No-address-returned.");
            this.currentAddress = address.toLowerCase();
            // Set current player for RLS with retry
            let setPlayerAttempts = 0;
            const maxSetPlayerAttempts = 3;
            while (setPlayerAttempts < maxSetPlayerAttempts) {
                const { error } = await this.supabase.rpc('set_current_player', { player_address: this.currentAddress });
                if (error) {
                    console.error(`set_current_player attempt ${setPlayerAttempts + 1} failed: ${error.message}, code: ${error.code}`);
                    debug(`set_current_player failed for address ${this.currentAddress}: ${error.message}`);
                    if (setPlayerAttempts + 1 === maxSetPlayerAttempts) {
                        throw new Error(`Failed to set current player after ${maxSetPlayerAttempts} attempts: ${error.message}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setPlayerAttempts++;
                } else {
                    debug(`set_current_player called successfully for address: ${this.currentAddress}`);
                    break;
                }
            }
            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            this.web3 = { provider, signer };
            debug("Web3 initialized with address: " + address);
            return { provider, signer };
        } catch (error) {
            console.error("Wallet connection failed:", error.message, error.stack);
            debug(`initWeb3 failed: ${error.message}`);
            alert("Failed-to-connect-wallet: " + error.message);
            return null;
        }
    }

    async checkPlayerGameState(attempt = 1, maxAttempts = 4) {
        if (this.isCheckingGameState) {
            console.log("checkPlayerGameState already in progress, skipping...");
            return;
        }
        this.isCheckingGameState = true;
        console.log(`checkPlayerGameState started, attempt ${attempt}`);
        let gameIdStr = 'unknown';
    
        try {
            if (!this.web3 || !this.currentAddress) {
                await this.initWeb3();
            }
            if (!this.web3 || !this.currentAddress) throw new Error("Web3-initialization-failed");
    
            const address = this.currentAddress;
            console.log(`Checking game for address: ${address}`);
    
            // Query contract for game ID
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Contract-connection-failed");
            const gameId = await contract.playerToGame(address);
            gameIdStr = ethers.utils.toUtf8String(gameId).toUpperCase();
            console.log(`Contract returned gameId: ${gameIdStr}`);
    
            if (gameIdStr === '000000000000') {
                console.log('No active game found for player');
                window.updateStatusDisplay('No-active-game-found.-Create-or-join-a-game.');
                await this.updateMultiplayerMenu(null);
                return;
            }
    
            // Query Supabase for the game
            const { data: gameData, error: gameError } = await this.supabase
                .from('chess_games')
                .select('id,game_id,blue_player,red_player,board,current_player,game_state,piece_state,last_move,bet_amount')
                .eq('game_id', gameIdStr)
                .single();
    
            if (gameError) {
                throw new Error(`Supabase-query-failed: ${gameError.message}`);
            }
            console.log(`Supabase returned:`, gameData);
    
            if (!gameData) {
                console.error(`No game found in Supabase for ID: ${gameIdStr}`);
                const inviteCodeBytes = ethers.utils.hexZeroPad(
                    ethers.utils.toUtf8Bytes(gameIdStr).slice(0, 6), 6
                );
                try {
                    const game = await contract.games(inviteCodeBytes);
                    if (game.player1.toLowerCase() === address && game.player2 === ethers.constants.AddressZero) {
                        const gasLimit = await contract.estimateGas.cancelGame(inviteCodeBytes);
                        const tx = await contract.cancelGame(inviteCodeBytes, { gasLimit });
                        await tx.wait();
                        console.log(`Game ${gameIdStr} cancelled in contract, tx hash: ${tx.hash}`);
                        window.updateStatusDisplay('Game-not-found-in-database.-Cancelled-the-game-on-chain.-Please-create-or-join-a-new-game.');
                        await this.updateMultiplayerMenu(null);
                    } else {
                        console.warn(`Cannot cancel game ${gameIdStr}: Either not the creator or game already has two players.`);
                        this.resetGameState();
                        window.updateStatusDisplay(`Game-${gameIdStr}-not-found-in-database-and-cannot-be-cancelled-on-chain-(you-may-not-be-the-creator,-or-the-game-has-two-players).-Local-state-reset.-You-can-now-create-or-join-a-new-game.`);
                        await this.updateMultiplayerMenu(null);
                    }
                } catch (cancelError) {
                    throw new Error(`No-game-found-in-Supabase-for-ID:-${gameIdStr}.-Failed-to-cancel-on-chain: ${cancelError.message}`);
                }
                return;
            }
    
            console.log(`Game found:`, gameData);
    
            if (gameData.game_state !== 'active' && gameData.game_state !== 'waiting') {
                throw new Error(`No-active-game-found-in-Supabase-for-ID:-${gameIdStr}.-Game-state:-${gameData.game_state}`);
            }
    
            // Clear any existing subscription
            if (this.subscription) {
                this.supabase.removeChannel(this.subscription);
                console.log("Cleared existing subscription before loading new game");
                this.subscription = null;
            }
    
            // Load game state
            this.gameId = gameData.game_id;
            this.playerColor = address === gameData.blue_player.toLowerCase() ? 'blue' : 'red';
            this.currentGameState = gameData;
            window.playerColor = this.playerColor;
            window.currentPlayer = gameData.current_player;
            window.board = JSON.parse(JSON.stringify(gameData.board.positions));
            window.pieceState = gameData.piece_state || window.pieceState;
            window.lastMove = gameData.last_move;
            window.moveHistory = [];
            window.isMultiplayerMode = true;
            this.isMultiplayerMode = true;
            window.currentGameMode = 'online';
    
            // Load game state into chess.js
            if (window.loadGameState) { // Use window.loadGameState directly
                window.loadGameState({
                    board: gameData.board.positions,
                    currentPlayer: gameData.current_player,
                    pieceState: gameData.piece_state,
                    lastMove: gameData.last_move,
                    playerColor: this.playerColor
                });
            } else {
                console.warn('window.loadGameState not available, falling back to manual board setup');
                window.placePieces && window.placePieces();
            }
    
            // Update UI
            await this.showGame(this.playerColor);
            await this.subscribeToGame();
            await this.updateMultiplayerMenu(gameData);
    
        } catch (error) {
            console.error(`checkPlayerGameState error: ${error.message}`, error.stack);
            if (attempt < maxAttempts) {
                console.log(`Retrying checkPlayerGameState in 1000ms (attempt ${attempt + 1})`);
                setTimeout(() => {
                    this.isCheckingGameState = false;
                    this.checkPlayerGameState(attempt + 1, maxAttempts);
                }, 1000);
            } else {
                console.error('checkPlayerGameState failed after max retries');
                window.updateStatusDisplay(`Failed-to-load-game-state.-You-may-be-in-an-active-game-(ID:-${gameIdStr}).-Please-try-refreshing-the-page-or-contact-support.`);
                await this.updateMultiplayerMenu(null);
            }
        } finally {
            this.isCheckingGameState = false;
        }
    }

    async updateMultiplayerMenu(gameData) {
        const activeGameInfo = document.getElementById('active-game-info');
        const activeGameIdSpan = document.getElementById('active-game-id');
        const multiplayerOptions = document.getElementById('multiplayer-options');
        const resumeGameBtn = document.getElementById('resume-game-btn');

        if (gameData && activeGameInfo && activeGameIdSpan && multiplayerOptions && resumeGameBtn) {
            activeGameInfo.style.display = 'block';
            activeGameIdSpan.textContent = gameData.game_id;
            multiplayerOptions.style.display = 'none';
            resumeGameBtn.onclick = () => this.showGame(this.playerColor);
        } else if (activeGameInfo && multiplayerOptions) {
            activeGameInfo.style.display = 'none';
            multiplayerOptions.style.display = 'block';
            const multiplayerMenu = document.querySelector(".multiplayer-menu");
            const chessGame = document.getElementById("chess-game");
            if (multiplayerMenu && chessGame) {
                multiplayerMenu.style.display = "flex";
                chessGame.style.display = "none";
            }
        }
    }

    async connectToContract() {
        if (this.chessContract) return this.chessContract;
        const web3 = await this.initWeb3();
        if (!web3) return null;
        const { signer } = web3;
        this.chessContract = new window.ethers.Contract(contractAddress, window.chessGameABI, signer);
        console.log("Connected to contract at:", contractAddress);

        const attachEventListeners = () => {
            this.chessContract.on("GameCreated", (inviteCode, player1, wagerAmount) => {
                const inviteCodeStr = ethers.utils.hexlify(inviteCode).slice(2).padStart(12, '0').toUpperCase();
                console.log(`GameCreated: ${inviteCodeStr}, ${player1}, ${ethers.utils.formatEther(wagerAmount)} tDMT`);
                if (player1.toLowerCase() === this.currentAddress) {
                    this.gameId = inviteCodeStr;
                    this.playerColor = "blue";
                    this.showGame("blue");
                }
            });

            this.chessContract.on("GameJoined", (inviteCode, player2) => {
                const inviteCodeStr = ethers.utils.hexlify(inviteCode).slice(2).padStart(12, '0').toUpperCase();
                console.log(`GameJoined: ${inviteCodeStr}, ${player2}`);
                if (this.gameId === inviteCodeStr && player2.toLowerCase() === this.currentAddress) {
                    this.playerColor = "red";
                    this.showGame("red");
                }
            });

            this.chessContract.on("GameEnded", (inviteCode, winner, houseFee, payoutOrRefund) => {
                const inviteCodeStr = ethers.utils.hexlify(inviteCode).slice(2).padStart(12, '0').toUpperCase();
                console.log(`GameEnded: ${inviteCodeStr}, ${winner}, ${ethers.utils.formatEther(houseFee)} tDMT, ${ethers.utils.formatEther(payoutOrRefund)} tDMT`);
                if (this.gameId === inviteCodeStr) {
                    this.handleGameEnd({ game_id: this.gameId, winner });
                }
            });

            this.chessContract.on("GameCancelled", (inviteCode, player1) => {
                const inviteCodeStr = ethers.utils.hexlify(inviteCode).slice(2).padStart(12, '0').toUpperCase();
                console.log(`GameCancelled: ${inviteCodeStr}, ${player1}`);
                if (this.gameId === inviteCodeStr) {
                    this.handleGameEnd({ game_id: this.gameId, winner: ethers.constants.AddressZero });
                }
            });
        };

        if (!this.chessContract.listenerCount("GameCreated")) {
            attachEventListeners();
        }

        return this.chessContract;
    }

    initializeEventListeners() {
        if (isMultiplayerInitialized) return;
        isMultiplayerInitialized = true;

        const processedAddresses = new Set();

        document.addEventListener('walletConnected', (event) => {
            const { address } = event.detail;
            const addressLower = address.toLowerCase();
            if (processedAddresses.has(addressLower)) {
                console.log(`walletConnected event already processed for address: ${addressLower}, skipping...`);
                return;
            }
            processedAddresses.add(addressLower);
            console.log(`walletConnected event received for address: ${addressLower}`);
            this.currentAddress = addressLower;
            localStorage.setItem("currentPlayer", addressLower);
            // Only check game state in multiplayer mode
            if (window.currentGameMode === 'online') {
                this.checkPlayerGameState().catch(err => console.error("checkPlayerGameState failed:", err));
            } else {
                console.log(`Skipping checkPlayerGameState in single-player mode`);
            }
        });

        const elements = {
            singlePlayerBtn: document.getElementById("ai-mode"),
            multiplayerBtn: document.getElementById("multiplayer-mode"),
            chessboard: document.getElementById("chessboard"),
            createGameBtn: document.getElementById("create-game"),
            joinGameBtn: document.getElementById("join-game"),
            leaveGameBtn: document.getElementById("leave-game"),
            cancelMatchmakingBtn: document.getElementById("cancel-matchmaking"),
            forceLeaveGameBtn: document.getElementById("force-leave-game")
        };

        if (elements.singlePlayerBtn) {
            elements.singlePlayerBtn.addEventListener("click", () => {
                this.isMultiplayerMode = false;
                window.isMultiplayerMode = false;
                console.log("Switched to single player mode");
                this.leaveGame();
            });
        }

        if (elements.multiplayerBtn) {
            elements.multiplayerBtn.addEventListener("click", () => {
                this.isMultiplayerMode = true;
                window.isMultiplayerMode = true;
                console.log("Switched to multiplayer mode");
                const multiplayerMenu = document.querySelector(".multiplayer-menu");
                const difficultyScreen = document.getElementById("difficulty-screen");
                if (multiplayerMenu && difficultyScreen) {
                    multiplayerMenu.style.display = "flex";
                    difficultyScreen.style.display = "none";
                }
                this.checkPlayerGameState().catch(err => console.error("checkPlayerGameState failed:", err));
            });
        }

        if (elements.chessboard) {
            elements.chessboard.addEventListener("click", (e) => this.handleBoardClick(e));
        }

        if (elements.createGameBtn) {
            elements.createGameBtn.addEventListener("click", async () => {
                const wagerInput = document.getElementById("wagerAmount");
                const wagerAmount = parseFloat(wagerInput?.value) || 0.1;
                if (isNaN(wagerAmount) || wagerAmount <= 0) {
                    alert("Please-enter-a-valid-wager-amount");
                    return;
                }
                await this.createGame(wagerAmount);
            });
        }

        if (elements.joinGameBtn) {
            elements.joinGameBtn.addEventListener("click", async () => {
                const codeInput = document.getElementById("game-code-input");
                const code = codeInput?.value.trim().toUpperCase();
                if (!code) {
                    alert("Please-enter-a-game-code");
                    return;
                }
                await this.joinGameByCode(code);
            });
        }

        if (elements.leaveGameBtn) {
            elements.leaveGameBtn.addEventListener("click", async () => {
                await this.leaveGame();
            });
        }

        if (elements.cancelMatchmakingBtn) {
            elements.cancelMatchmakingBtn.addEventListener("click", async () => {
                await this.leaveGame();
                const matchmakingStatus = document.getElementById("matchmaking-status");
                if (matchmakingStatus) matchmakingStatus.style.display = "none";
            });
        }

        if (elements.forceLeaveGameBtn) {
            elements.forceLeaveGameBtn.addEventListener("click", async () => {
                await this.leaveGame();
                alert("Attempted-to-leave-game.-Please-try-joining-again.");
            });
        }

        console.log("Event listeners initialized");
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
            if (!this.currentAddress) throw new Error("No-wallet-connected");

            const web3 = await this.initWeb3();
            if (!web3) throw new Error("Failed-to-initialize-Web3");
            const { signer } = web3;

            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== "0x7c8") {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x7c8' }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x7c8',
                                chainName: 'Sanko Testnet',
                                rpcUrls: ['https://sanko-arb-sepolia.rpc.caldera.xyz/http'],
                                nativeCurrency: { name: 'tDMT', symbol: 'tDMT', decimals: 18 },
                                blockExplorerUrls: ['https://explorer.testnet.sanko.xyz'],
                            }],
                        });
                    } else {
                        throw new Error("Please-switch-to-Sanko-Testnet-(chain-ID-1992)");
                    }
                }
            }

            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed-to-connect-to-contract");

            const minWagerWei = await contract.MIN_WAGER();
            const maxWagerWei = await contract.MAX_WAGER();
            const minWager = parseFloat(ethers.utils.formatEther(minWagerWei));
            const maxWager = parseFloat(ethers.utils.formatEther(maxWagerWei));
            console.log(`Wager limits: MIN=${minWager} tDMT, MAX=${maxWager} tDMT`);

            if (isNaN(wagerAmount) || wagerAmount < minWager || wagerAmount > maxWager) {
                throw new Error(`Wager-must-be-between-${minWager}-and-${maxWager}-tDMT`);
            }

            const existingGame = await contract.playerToGame(this.currentAddress);
            if (existingGame !== "0x000000000000") {
                throw new Error("You-are-already-in-a-game.-Leave-or-end-it-first");
            }

            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const inviteCodeBytes = ethers.utils.hexZeroPad(
                ethers.utils.toUtf8Bytes(inviteCode).slice(0, 6), 6
            );
            const wagerInWei = ethers.utils.parseEther(wagerAmount.toString());
            console.log(`Creating game with inviteCode: ${inviteCode}, bytes: ${inviteCodeBytes}, wager: ${wagerAmount} tDMT`);

            const gasLimit = await contract.estimateGas.createGame(inviteCodeBytes, { value: wagerInWei });
            const tx = await contract.createGame(inviteCodeBytes, {
                value: wagerInWei,
                gasLimit
            });
            await tx.wait();
            console.log(`Game created: ${inviteCode}, wager: ${wagerAmount} tDMT, tx hash: ${tx.hash}`);

            const { data, error } = await this.supabase
                .from("chess_games")
                .insert({
                    game_id: inviteCode,
                    blue_player: this.currentAddress,
                    red_player: null,
                    board: { positions: JSON.parse(JSON.stringify(window.initialBoard)), piece_state: window.pieceState },
                    current_player: "blue",
                    game_state: "waiting",
                    bet_amount: wagerAmount,
                    escrow_account: null,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            if (error) throw new Error(`Supabase-insert-failed: ${error.message}`);

            this.gameId = inviteCode;
            this.playerColor = "blue";
            this.currentGameState = data;
            await this.subscribeToGame();
            await this.showGame("blue");
            await this.updateMultiplayerMenu(data);

            const gameCodeDisplay = document.getElementById("gameCodeDisplay");
            const gameCode = document.getElementById("gameCode");
            if (gameCodeDisplay && gameCode) {
                gameCode.textContent = inviteCode;
                gameCodeDisplay.style.display = "block";
            }
            const matchmakingStatus = document.getElementById("matchmaking-status");
            if (matchmakingStatus) matchmakingStatus.style.display = "block";
            alert(`Game-code:-${inviteCode}-with-wager-${wagerAmount}-tDMT`);
        } catch (error) {
            console.error("Error creating game:", error.message);
            alert("Game-creation-failed: " + error.message);
            this.hasCreatedGame = false;
        } finally {
            if (createBtn) createBtn.disabled = false;
        }
    }

    async joinGameByCode(code, retries = 3, delay = 2000) {
        const joinBtn = document.getElementById("join-game");
        if (joinBtn) joinBtn.disabled = true;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (!this.currentAddress) throw new Error("Connect-wallet-first");

                const contract = await this.connectToContract();
                if (!contract) throw new Error("Failed-to-connect-to-contract");

                const existingGame = await contract.playerToGame(this.currentAddress);
                if (existingGame !== "0x000000000000") {
                    throw new Error("You-are-already-in-a-game.-Leave-or-end-it-first");
                }

                const inviteCodeBytes = ethers.utils.hexZeroPad(
                    ethers.utils.toUtf8Bytes(code.toUpperCase()).slice(0, 6), 6
                );
                console.log("Joining game with inviteCode:", code, "bytes:", inviteCodeBytes);
                const game = await contract.games(inviteCodeBytes);

                if (game.player1 === ethers.constants.AddressZero || 
                    game.player2 !== ethers.constants.AddressZero) {
                    throw new Error("Game-not-available-or-already-joined");
                }

                const { data: games, error } = await this.supabase
                    .from("chess_games")
                    .select("id,game_id,blue_player,red_player,game_state,board,piece_state,current_player")
                    .eq("game_id", code.toUpperCase())
                    .single();

                if (error || !games) throw new Error("Game-not-found: " + (error?.message || "Not-found"));
                if (games.red_player) throw new Error("Game-already-has-both-players");
                if (games.blue_player.toLowerCase() === this.currentAddress) {
                    this.gameId = games.game_id;
                    this.playerColor = "blue";
                    this.currentGameState = games;
                    await this.subscribeToGame();
                    await this.showGame("blue");
                    await this.updateMultiplayerMenu(games);
                    return;
                }

                const wagerInWei = game.wagerAmount;
                console.log(`Joining game with wager: ${ethers.utils.formatEther(wagerInWei)} tDMT`);
                const gasLimit = await contract.estimateGas.joinGame(inviteCodeBytes, { value: wagerInWei });
                const tx = await contract.joinGame(inviteCodeBytes, {
                    value: wagerInWei,
                    gasLimit
                });
                await tx.wait();
                console.log(`Joined game: ${code}, tx hash: ${tx.hash}`);

                const { data: updateData, error: updateError } = await this.supabase
                    .from("chess_games")
                    .update({
                        red_player: this.currentAddress,
                        game_state: "active",
                        updated_at: new Date().toISOString()
                    })
                    .eq("game_id", code.toUpperCase())
                    .select()
                    .single();
                if (updateError) throw new Error("Failed-to-join-game: " + updateError.message);

                this.gameId = code;
                this.playerColor = "red";
                this.currentGameState = updateData;
                await this.subscribeToGame();
                await this.showGame("red");
                await this.updateMultiplayerMenu(updateData);
                return;
            } catch (error) {
                console.error(`Join game attempt ${attempt} failed:`, error.message);
                if (attempt < retries) {
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    alert(`Failed-to-join-game: ${error.message}`);
                }
            } finally {
                if (joinBtn) joinBtn.disabled = false;
            }
        }
    }

    async endGame(inviteCode, winnerAddress) {
        try {
            const contract = await this.connectToContract();
            if (!contract) throw new Error("Failed-to-connect-to-contract");

            const inviteCodeBytes = ethers.utils.hexZeroPad(
                ethers.utils.toUtf8Bytes(inviteCode.toUpperCase()).slice(0, 6), 6
            );
            const game = await contract.games(inviteCodeBytes);
            if (!game.isActive) {
                throw new Error("Game-is-not-active");
            }

            const gasLimit = await contract.estimateGas.endGame(inviteCodeBytes, winnerAddress);
            const tx = await contract.endGame(inviteCodeBytes, winnerAddress, { gasLimit });
            await tx.wait();
            console.log(`Game ended: ${inviteCode}, winner: ${winnerAddress}`);

            await this.supabase
                .from("chess_games")
                .update({
                    game_state: "completed",
                    winner: winnerAddress === this.currentGameState.blue_player ? "blue" : winnerAddress === this.currentGameState.red_player ? "red" : "draw",
                    updated_at: new Date().toISOString()
                })
                .eq("game_id", inviteCode);

            this.handleGameEnd({ game_id: inviteCode, winner: winnerAddress });
        } catch (error) {
            console.error(`Error ending game ${inviteCode}:`, error.message);
            alert(`Failed-to-end-game: ${error.message}`);
        }
    }

    async leaveGame(retries = 3, delay = 2000) {
        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
            console.log("Unsubscribed from game channel");
            this.subscription = null;
        }

        try {
            if (this.gameId) {
                const web3 = await this.initWeb3();
                if (!web3) throw new Error("Failed-to-initialize-Web3");
                const { signer } = web3;
                const contract = await this.connectToContract();
                if (!contract) throw new Error("Failed-to-connect-to-contract");

                const userAddress = await signer.getAddress();
                const inviteCode = await contract.playerToGame(userAddress);
                if (inviteCode !== "0x000000000000") {
                    const game = await contract.games(inviteCode);
                    if (game.player2 === ethers.constants.AddressZero) {
                        for (let attempt = 1; attempt <= retries; attempt++) {
                            try {
                                const gasLimit = await contract.estimateGas.cancelGame(inviteCode);
                                const tx = await contract.cancelGame(inviteCode, { gasLimit });
                                await tx.wait();
                                console.log(`Cancelled game ${this.gameId}, tx hash: ${tx.hash}`);
                                break;
                            } catch (error) {
                                console.error(`Cancel game attempt ${attempt} failed:`, error.message);
                                if (attempt < retries) {
                                    console.log(`Retrying in ${delay}ms...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                } else {
                                    throw new Error(`Failed-to-cancel-game: ${error.message}`);
                                }
                            }
                        }
                    } else {
                        throw new Error("Cannot-leave-an-active-game-with-two-players");
                    }
                }

                await this.supabase
                    .from("chess_games")
                    .update({
                        game_state: "cancelled",
                        winner: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("game_id", this.gameId);
            }

            this.resetGameState();
            console.log("Successfully left game");
            await this.updateMultiplayerMenu(null);
        } catch (error) {
            console.error("Leave game error:", error.message);
            alert("Error-leaving-game: " + error.message);
            this.resetGameState();
            await this.updateMultiplayerMenu(null);
        }
    }

    resetGameState() {
        if (!this.gameId) return;
        this.gameId = null;
        this.playerColor = null;
        this.currentGameState = null;
        this.selectedPiece = null;
        this.hasCreatedGame = false;
        this.lastCreateClick = 0;

        const menuEl = document.querySelector(".multiplayer-menu");
        const gameEl = document.getElementById("chess-game");
        const difficultyScreen = document.getElementById("difficulty-screen");
        if (menuEl) {
            menuEl.style.display = "block";
        }
        if (gameEl) gameEl.style.display = "none";
        if (difficultyScreen) difficultyScreen.style.display = "none";

        if (window.updateGameResult) window.updateGameResult({ winner: "loss", player: this.currentAddress, mode: "online" });
        if (window.leaderboardManager) window.leaderboardManager.loadLeaderboard();
    }

    isMyTurn() {
        return this.currentGameState?.current_player === this.playerColor;
    }

    showGame(color) {
        console.log(`showGame called with color: ${color}, isMultiplayerMode: ${this.isMultiplayerMode}`);
        try {
            const menuEl = document.querySelector(".multiplayer-menu");
            const gameEl = document.getElementById("chess-game");
            const difficultyScreen = document.getElementById("difficulty-screen");
    
            if (menuEl) menuEl.style.display = "none";
            if (gameEl) {
                gameEl.style.display = "block";
                console.log("Set chess-game display to block");
            } else {
                console.error("chess-game element not found");
            }
            if (difficultyScreen) difficultyScreen.style.display = "none";
    
            window.isMultiplayerMode = true;
            this.isMultiplayerMode = true;
            window.currentGameMode = 'online'; // Match GameMode.ONLINE in chess.js
            debug(`showGame: Set currentGameMode to ${window.currentGameMode}`); // Debug log
            window.playerColor = color;
            this.playerColor = color;
            window.currentPlayer = this.currentGameState?.current_player || "blue";
    
            if (this.currentGameState?.board?.positions) {
                window.board = JSON.parse(JSON.stringify(this.currentGameState.board.positions));
                window.pieceState = this.currentGameState.piece_state || window.pieceState;
            }
    
            window.placePieces && window.placePieces();
            this.updateBoardInteractivity();
            window.updateStatusDisplay(this.isMyTurn() ? "Your-turn" : "Opponent's-turn");
        } catch (error) {
            console.error("Error in showGame:", error);
            window.updateStatusDisplay("Error-initializing-game-board");
        }
    }

    updateBoardInteractivity() {
        const chessboard = document.getElementById("chessboard");
        if (!chessboard) {
            console.error("chessboard element not found");
            return;
        }

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

    async subscribeToGame(maxRetries = 5, baseDelay = 1000) {
        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
            console.log("Previous subscription removed");
            this.subscription = null;
        }

        let retries = 0;
        const trySubscribe = async () => {
            console.log(`Subscribing to game channel: game_${this.gameId}, attempt ${retries + 1}`);
            this.subscription = this.supabase
                .channel(`game_${this.gameId}`)
                .on("postgres_changes", {
                    event: "*",
                    schema: "public",
                    table: "chess_games",
                    filter: `game_id=eq.${this.gameId}`
                }, (payload) => {
                    console.log("Received Supabase update:", payload);
                    this.handleUpdate(payload.new);
                })
                .subscribe((status) => {
                    console.log(`Game channel subscription status: ${status}`);
                    if (status === "CHANNEL_ERROR" || status === "CLOSED") {
                        console.error(`Game channel subscription error (${status}), retrying...`);
                        if (retries < maxRetries) {
                            retries++;
                            const delay = baseDelay * Math.pow(2, retries);
                            setTimeout(trySubscribe, delay);
                        } else {
                            console.error("Max retries reached for subscription");
                            window.updateStatusDisplay("Failed to connect to game updates. Please refresh.");
                        }
                    }
                });
        };
        await trySubscribe();
    }

    async handleUpdate(game) {
        console.log("handleUpdate called with game:", game);
        if (!game) {
            console.error("No game data received in handleUpdate");
            return;
        }
        try {
            this.currentGameState = game;
            if (game.board?.positions) {
                console.log("Updating window.board with:", game.board.positions);
                window.board = JSON.parse(JSON.stringify(game.board.positions));
                window.pieceState = game.piece_state || window.pieceState;
                if (typeof window.placePieces !== "function") {
                    console.error("window.placePieces not defined");
                    return;
                }
                window.placePieces();
                console.log("placePieces called");
            }
            if (game.last_move && typeof window.updateMoveLog === "function") {
                window.updateMoveLog(game.last_move);
                console.log("updateMoveLog called with last_move:", game.last_move);
            }
            if (game.current_player) {
                window.currentPlayer = game.current_player;
                this.updateBoardInteractivity();
                const baseStatus = this.isMyTurn() ? "Your-turn" : "Opponent's-turn";
                if (window.isKingInCheck && window.isKingInCheck(game.current_player)) {
                    window.updateStatusDisplay(`Check!-${baseStatus}`);
                } else if (game.game_state !== "completed") {
                    window.updateStatusDisplay(baseStatus);
                }
            }
            if (game.game_state === "completed") {
                await this.handleGameEnd(game);
            }
        } catch (error) {
            console.error("Error in handleUpdate:", error);
            window.updateStatusDisplay("Error-syncing-game-state");
        }
    }

    async handleGameEnd(game) {
        try {
            let gameResult, displayMessage;
    
            if (!game.winner || game.winner === "draw") {
                gameResult = "draw";
                displayMessage = "Game-Over---Draw!";
            } else if (game.winner === ethers.constants.AddressZero) {
                gameResult = "loss";
                displayMessage = "Game-Cancelled!";
            } else {
                gameResult = game.winner === (this.playerColor === "blue" ? this.currentGameState.blue_player : this.currentGameState.red_player) ? "win" : "loss";
                displayMessage = `Game-Over---${game.winner === this.currentGameState.blue_player ? "Blue" : "Red"}-wins!`;
            }
    
            if (game.bet_amount) {
                const wagerAmount = ethers.utils.parseEther(game.bet_amount.toString());
                const totalPot = wagerAmount.mul(2);
                const houseFee = totalPot.mul(5).div(100);
                const payout = totalPot.sub(houseFee);
                const payoutInTDMT = ethers.utils.formatEther(payout);
                const houseFeeInTDMT = ethers.utils.formatEther(houseFee);
    
                if (game.winner === "draw" || !game.winner) {
                    const refundPerPlayer = ethers.utils.formatEther(payout.div(2));
                    displayMessage += `\nEach-player-refunded:-${refundPerPlayer}-tDMT-(after-5%-house-fee-of-${houseFeeInTDMT}-tDMT)`;
                } else if (game.winner !== ethers.constants.AddressZero) {
                    displayMessage += `\nWinner-payout:-${payoutInTDMT}-tDMT-(after-5%-house-fee-of-${houseFeeInTDMT}-tDMT)`;
                }
            }
    
            window.updateStatusDisplay(displayMessage);
    
            if (window.updateGameResult) {
                window.updateGameResult({ winner: gameResult, player: this.currentAddress, mode: "online" });
            }
    
            if (window.leaderboardManager) {
                await window.leaderboardManager.loadLeaderboard();
            }
    
            const chessboard = document.getElementById("chessboard");
            if (chessboard) chessboard.style.pointerEvents = "none";
            await this.updateMultiplayerMenu(null);
        } catch (error) {
            console.error("Error handling game end:", error.message, error.stack);
            window.updateStatusDisplay("Error-processing-game-end");
        }
    }

    handleBoardClick(e) {
        if (!this.isMultiplayerMode || !this.isMyTurn() || this.isProcessingMove) {
            window.updateStatusDisplay("It's-not-your-turn!");
            return;
        }

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
            window.removeHighlights && window.removeHighlights();
        }

        if (this.selectedPiece?.row === row && this.selectedPiece?.col === col) {
            this.selectedPiece = null;
            return;
        }

        this.selectedPiece = { row, col, element: pieceElement };
        pieceElement.style.opacity = "0.7";
        if (typeof window.showLegalMoves !== "function") {
            console.warn("window.showLegalMoves not defined, using fallback");
            window.showLegalMoves = (row, col) => {
                console.log(`Fallback: Showing legal moves for piece at [${row},${col}]`);
            };
        }
        window.showLegalMoves(row, col);
    }

    handleSquareClick(row, col) {
        if (!this.selectedPiece || !this.isMyTurn()) {
            console.log(`handleSquareClick: Blocked - selectedPiece=${!!this.selectedPiece}, isMyTurn=${this.isMyTurn()}`);
            return;
        }
    
        const startRow = this.selectedPiece.row;
        const startCol = this.selectedPiece.col;
        const piece = window.board[startRow][startCol];
    
        console.log(`handleSquareClick: Attempting move from [${startRow},${startCol}] (${piece}) to [${row},${col}]`);
    
        if (this.isPawnPromotion(piece, row)) {
            window.promptPawnPromotion(startRow, startCol, row, col);
        } else {
            this.makeMove(startRow, startCol, row, col);
        }
    
        this.selectedPiece.element.style.opacity = "1";
        this.selectedPiece = null;
        window.removeHighlights && window.removeHighlights();
    }

    isPawnPromotion(piece, targetRow) {
        return piece.toLowerCase() === "p" &&
               ((this.playerColor === "blue" && targetRow === 0) ||
                (this.playerColor === "red" && targetRow === 7));
    }

    async handleMove({ startRow, startCol, endRow, endCol, promotionPiece }) {
        console.log(`handleMove called with move: [${startRow},${startCol}] to [${endRow},${endCol}]`);
        const targetPiece = window.board[endRow][endCol];
        if (targetPiece) {
            debug(`handleMove: Capturing piece ${targetPiece} at [${endRow},${endCol}]`);
        } else {
            debug(`handleMove: Non-capture move to [${endRow},${endCol}]`);
        }
        return await this.makeMove(startRow, startCol, endRow, endCol, promotionPiece);
    }

    async makeMove(startRow, startCol, endRow, endCol, promotion = null) {
        if (!this.gameId || this.isProcessingMove || !this.isMyTurn()) {
            console.log(`makeMove blocked: gameId=${this.gameId}, isProcessingMove=${this.isProcessingMove}, isMyTurn=${this.isMyTurn()}`);
            return false;
        }
        this.isProcessingMove = true;
    
        try {
            const piece = window.board[startRow][startCol];
            const targetPiece = window.board[endRow][endCol];
            console.log(`makeMove: Moving ${piece} from [${startRow},${startCol}] to [${endRow},${endCol}], capturing=${targetPiece}, promotion=${promotion}`);
    
            // Create new board state
            const newBoard = JSON.parse(JSON.stringify(window.board));
            const capturedPiece = newBoard[endRow][endCol];
            newBoard[endRow][endCol] = promotion || piece;
            newBoard[startRow][startCol] = null;
    
            // Update piece state (castling, en passant)
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
    
            // Update local board for immediate feedback
            window.board = newBoard;
    
            // Check for game end
            if (window.isCheckmate && window.isCheckmate(nextPlayer)) {
                gameEndState = { game_state: "completed", winner: this.playerColor };
                const winnerAddress = this.playerColor === "blue" ? this.currentGameState.blue_player : this.currentGameState.red_player;
                await this.endGame(this.gameId, winnerAddress);
            } else if (window.isStalemate && window.isStalemate(nextPlayer)) {
                gameEndState = { game_state: "completed", winner: "draw" };
            }
    
            // Prepare Supabase update
            const updateData = {
                board: { positions: newBoard, piece_state: window.pieceState },
                current_player: nextPlayer,
                last_move: {
                    start_row: startRow,
                    start_col: startCol,
                    end_row: endRow,
                    end_col: endCol,
                    piece,
                    promotion,
                    captured_piece: capturedPiece
                },
                updated_at: new Date().toISOString(),
                ...(gameEndState || {})
            };
    
            console.log(`makeMove: Updating Supabase for game ${this.gameId}, move: [${startRow},${startCol}] -> [${endRow},${endCol}], data:`, JSON.stringify(updateData, null, 2));
            const { data, error } = await this.supabase
                .from("chess_games")
                .update(updateData)
                .eq("game_id", this.gameId)
                .select()
                .single();
    
            if (error) {
                console.error("Supabase update failed:", error.message, error.details, error.stack);
                throw new Error(`Supabase-update-failed: ${error.message}`);
            }
            console.log("Supabase update successful, returned data:", data);
    
            // Update move log locally
            if (typeof window.updateMoveLog === "function") {
                window.updateMoveLog(updateData.last_move);
                console.log("updateMoveLog called with last_move:", updateData.last_move);
            } else {
                console.warn("window.updateMoveLog not defined");
            }
    
            // Ensure board is updated and pieces are placed
            window.board = newBoard;
            window.placePieces();
            console.log("placePieces called after move");
            return true;
        } catch (error) {
            console.error("Move error:", error.message, error.stack);
            window.updateStatusDisplay("Error-processing-move");
            return false;
        } finally {
            this.isProcessingMove = false;
        }
    }
}

function initializeMultiplayerManager() {
    if (isInitializingMultiplayer) return;
    isInitializingMultiplayer = true;
    console.log("initializeMultiplayerManager called");

    const initManager = () => {
        console.log("initManager running, gameDatabase:", !!window.gameDatabase);
        if (!window.gameDatabase) {
            console.warn("Supabase not ready, waiting for supabaseReady event");
            document.addEventListener('supabaseReady', () => {
                console.log("supabaseReady event received, running initManager");
                initManager();
            }, { once: true });
            return;
        }
        if (!window.multiplayerManager) {
            window.multiplayerManager = new MultiplayerManager();
            console.log("MultiplayerManager initialized successfully");
            if (window.walletConnector && localStorage.getItem("currentPlayer")) {
                console.log("Forcing checkPlayerGameState after init");
                window.multiplayerManager.checkPlayerGameState().catch(err => console.error("Post-init checkPlayerGameState failed:", err));
            }
        }
        isInitializingMultiplayer = false;
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        console.log("Document ready, running initManager");
        initManager();
    } else {
        console.log("Adding DOMContentLoaded listener");
        document.addEventListener('DOMContentLoaded', initManager, { once: true });
    }
}

window.initializeMultiplayerManager = initializeMultiplayerManager;
console.log("Triggering initializeMultiplayerManager");
initializeMultiplayerManager();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded, checking Supabase");
    if (window.gameDatabase) {
        console.log("Supabase ready, dispatching supabaseReady");
        document.dispatchEvent(new CustomEvent('supabaseReady'));
    }
}, { once: true });