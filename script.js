// Constants
const PLAYER_X = 'X';
const PLAYER_O = 'O';
const MODE_PVP = 'pvp';
const MODE_PVC = 'pvc';

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// DOM Elements
const cells = document.querySelectorAll('.cell');
const boardElement = document.getElementById('game-board');
const messageDisplay = document.getElementById('message-display');
const scoreXElement = document.getElementById('score-x');
const scoreOElement = document.getElementById('score-o');
const scoreCardX = document.querySelector('.score-card.player-x');
const scoreCardO = document.querySelector('.score-card.player-o');
const btnRestart = document.getElementById('btn-restart');
const btnResetScores = document.getElementById('btn-reset-scores');
const btnPvP = document.getElementById('btn-pvp');
const btnPvC = document.getElementById('btn-pvc');
const themeToggleBtn = document.getElementById('theme-toggle');

// Game State
let board = Array(9).fill(null);
let currentPlayer = PLAYER_X;
let gameActive = true;
let gameMode = MODE_PVP; // pvp or pvc
let scores = { X: 0, O: 0 };

// Initialize Game
function init() {
    initTheme();
    loadScores();
    setupEventListeners();
    resetBoard();
}

function initTheme() {
    const savedTheme = localStorage.getItem('tictactoe_theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    }
}

function setupEventListeners() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    btnRestart.addEventListener('click', resetBoard);
    btnResetScores.addEventListener('click', handleResetScores);

    btnPvP.addEventListener('click', () => setGameMode(MODE_PVP));
    btnPvC.addEventListener('click', () => setGameMode(MODE_PVC));

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('tictactoe_theme', 'light');
            themeToggleBtn.textContent = '🌙';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('tictactoe_theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        }
    });
}

function setGameMode(mode) {
    if (gameMode === mode) return;

    gameMode = mode;
    btnPvP.classList.toggle('active', mode === MODE_PVP);
    btnPvC.classList.toggle('active', mode === MODE_PVC);

    // Reset scores when changing modes
    handleResetScores();
    resetBoard();
}

// Handle Player Move
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);

    if (board[index] || !gameActive) return;

    // Player makes a move
    makeMove(index, currentPlayer);

    if (gameActive && gameMode === MODE_PVC && currentPlayer === PLAYER_O) {
        // Computer's turn
        setTimeout(makeComputerMove, 300); // Slight delay for realism
    }
}

function makeMove(index, player) {
    board[index] = player;

    // Update UI
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = player;
    cell.setAttribute('data-mark', player);
    cell.classList.add('taken');

    // Check for win/draw
    checkGameStatus();
}

// Game Logic
function checkGameStatus() {
    const winnerData = checkWin(board);

    if (winnerData) {
        handleWin(winnerData.player, winnerData.combo);
    } else if (isBoardFull(board)) {
        handleDraw();
    } else {
        // Switch turns
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
        updateTurnDisplay();
    }
}

function checkWin(currentBoard) {
    for (let combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
            return { player: currentBoard[a], combo: combo };
        }
    }
    return null;
}

function isBoardFull(currentBoard) {
    return currentBoard.every(cell => cell !== null);
}

// Handlers for End of Game
function handleWin(winner, winningCombo) {
    gameActive = false;

    // Update message
    messageDisplay.textContent = `Player ${winner} Wins!`;
    messageDisplay.className = `message-area win-${winner.toLowerCase()}`;

    // Highlight winning cells
    winningCombo.forEach(index => {
        cells[index].classList.add('winning-cell');
    });

    // Update Scores
    scores[winner]++;
    saveScores();
    updateScoreDisplay();
}

function handleDraw() {
    gameActive = false;
    messageDisplay.textContent = `It's a Draw!`;
    messageDisplay.className = `message-area draw`;

    // Remove active turn indicators
    scoreCardX.classList.remove('active-turn');
    scoreCardO.classList.remove('active-turn');
}

// UI Updates
function updateTurnDisplay() {
    messageDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    messageDisplay.className = 'message-area';

    if (currentPlayer === PLAYER_X) {
        scoreCardX.classList.add('active-turn');
        scoreCardO.classList.remove('active-turn');
    } else {
        scoreCardO.classList.add('active-turn');
        scoreCardX.classList.remove('active-turn');
    }
}

function updateScoreDisplay() {
    scoreXElement.textContent = scores.X;
    scoreOElement.textContent = scores.O;
}

// Reset Functions
function resetBoard() {
    board = Array(9).fill(null);
    currentPlayer = PLAYER_X;
    gameActive = true;

    // Reset UI
    cells.forEach(cell => {
        cell.textContent = '';
        cell.removeAttribute('data-mark');
        cell.classList.remove('taken', 'winning-cell');
    });

    messageDisplay.className = 'message-area';
    updateTurnDisplay();
}

function handleResetScores() {
    scores = { X: 0, O: 0 };
    saveScores();
    updateScoreDisplay();
}

// Local Storage
function loadScores() {
    const savedScores = localStorage.getItem('tictactoe_scores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
    updateScoreDisplay();
}

function saveScores() {
    localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
}

// --- MINIMAX AI IMPLEMENTATION ---

function makeComputerMove() {
    if (!gameActive) return;

    messageDisplay.textContent = "Computer is thinking...";

    // Using minimax to find the best move
    let bestScore = -Infinity;
    let bestMove = -1;

    // If board is empty, take a corner or center to save time
    const availableSpots = getAvailableSpots(board);
    if (availableSpots.length === 9) {
        const openers = [0, 2, 4, 6, 8];
        bestMove = openers[Math.floor(Math.random() * openers.length)];
    } else {
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = PLAYER_O; // Make temp move
                let score = minimax(board, 0, false);
                board[i] = null; // Undo temp move

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
    }

    // The computer makes its move
    if (bestMove !== -1) {
        makeMove(bestMove, PLAYER_O);
    }
}

// Minimax algorithm core
const scoresMap = {
    'X': -10, // Human wins (bad for AI)
    'O': 10,  // AI wins (good for AI)
    'tie': 0
};

function minimax(boardState, depth, isMaximizing) {
    const winResult = checkWin(boardState);
    if (winResult) return scoresMap[winResult.player] - (isMaximizing ? depth : -depth); // Prefer faster wins/losses
    if (isBoardFull(boardState)) return scoresMap['tie'];

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === null) {
                boardState[i] = PLAYER_O;
                let score = minimax(boardState, depth + 1, false);
                boardState[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === null) {
                boardState[i] = PLAYER_X;
                let score = minimax(boardState, depth + 1, true);
                boardState[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function getAvailableSpots(boardState) {
    let spots = [];
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) spots.push(i);
    }
    return spots;
}

// Start the game
init();
