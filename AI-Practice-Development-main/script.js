// Game State
let gameState = {
    points: 0,
    problemsSolved: 0,
    level: 1,
    currentProblem: null,
    upgrades: {},
    lastSave: Date.now(),
    currentUser: null,
    problemStartTime: null
};

// Demo account
const DEMO_ACCOUNT = {
    username: 'TUPV-23-0463',
    password: 'EVANGELISTA'
};

// Math problem categories and difficulties
const PROBLEM_CATEGORIES = {
    easy: {
        arithmetic: {
            name: 'Basic Arithmetic',
            problems: [
                { question: '2 + 3 = ?', answer: '5', hint: 'Basic addition' },
                { question: '7 - 4 = ?', answer: '3', hint: 'Basic subtraction' },
                { question: '6 × 5 = ?', answer: '30', hint: 'Basic multiplication' },
                { question: '15 ÷ 3 = ?', answer: '5', hint: 'Basic division' },
                { question: '8 + 12 = ?', answer: '20', hint: 'Addition with larger numbers' },
                { question: '25 - 7 = ?', answer: '18', hint: 'Subtraction with larger numbers' },
                { question: '4 × 8 = ?', answer: '32', hint: 'Multiplication facts' },
                { question: '24 ÷ 6 = ?', answer: '4', hint: 'Division facts' }
            ]
        },
        fractions: {
            name: 'Simple Fractions',
            problems: [
                { question: '1/2 + 1/2 = ?', answer: '1', hint: 'Adding like fractions' },
                { question: '3/4 - 1/4 = ?', answer: '1/2', hint: 'Subtracting like fractions' },
                { question: '1/3 + 1/3 = ?', answer: '2/3', hint: 'Adding like fractions' },
                { question: '2/5 + 3/5 = ?', answer: '1', hint: 'Adding like fractions' }
            ]
        }
    },
    medium: {
        algebra: {
            name: 'Basic Algebra',
            problems: [
                { question: 'x + 5 = 12, x = ?', answer: '7', hint: 'Solve for x' },
                { question: '2x = 16, x = ?', answer: '8', hint: 'Divide both sides by 2' },
                { question: 'x - 3 = 8, x = ?', answer: '11', hint: 'Add 3 to both sides' },
                { question: '3x + 2 = 14, x = ?', answer: '4', hint: 'Subtract 2, then divide by 3' }
            ]
        },
        geometry: {
            name: 'Basic Geometry',
            problems: [
                { question: 'Area of rectangle: length=6, width=4', answer: '24', hint: 'Area = length × width' },
                { question: 'Perimeter of square with side=5', answer: '20', hint: 'Perimeter = 4 × side' },
                { question: 'Area of triangle: base=8, height=6', answer: '24', hint: 'Area = (base × height) ÷ 2' }
            ]
        }
    },
    hard: {
        advanced: {
            name: 'Advanced Math',
            problems: [
                { question: '√16 = ?', answer: '4', hint: 'Square root' },
                { question: '2² + 3² = ?', answer: '13', hint: 'Calculate squares first' },
                { question: 'Solve: 2x + 3 = 11', answer: '4', hint: 'Subtract 3, divide by 2' },
                { question: 'Area of circle: radius=5 (use π=3.14)', answer: '78.5', hint: 'Area = π × r²' }
            ]
        }
    }
};

// Math-themed upgrades
const upgrades = [
    {
        id: 'hint1',
        name: 'Better Hints',
        description: 'Get more detailed hints for problems',
        baseCost: 50,
        costMultiplier: 1.2,
        effect: { hintQuality: 1 }
    },
    {
        id: 'time1',
        name: 'Time Extension',
        description: 'Get more time to solve problems',
        baseCost: 100,
        costMultiplier: 1.3,
        effect: { timeBonus: 10 }
    },
    {
        id: 'points1',
        name: 'Point Multiplier',
        description: 'Earn 50% more points per correct answer',
        baseCost: 200,
        costMultiplier: 1.5,
        effect: { pointMultiplier: 1.5 }
    },
    {
        id: 'skip1',
        name: 'Problem Skip',
        description: 'Skip difficult problems (3 uses)',
        baseCost: 150,
        costMultiplier: 1.4,
        effect: { skips: 3 }
    },
    {
        id: 'difficulty1',
        name: 'Difficulty Control',
        description: 'Choose problem difficulty level',
        baseCost: 300,
        costMultiplier: 1.6,
        effect: { difficultyControl: true }
    }
];

// TUPV Leaderboard data (will be loaded from database)
let leaderboard = [];

// DOM Elements
const loginForm = document.getElementById('loginForm');
const gameContainer = document.getElementById('gameContainer');
const loginFormElement = document.getElementById('loginFormElement');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUserDisplay = document.getElementById('currentUser');
const logoutButton = document.getElementById('logoutButton');

const pointsDisplay = document.getElementById('points');
const problemsSolvedDisplay = document.getElementById('problemsSolved');
const levelDisplay = document.getElementById('level');
const problemText = document.getElementById('problemText');
const problemHint = document.getElementById('problemHint');
const difficultyBadge = document.getElementById('difficultyBadge');
const answerInput = document.getElementById('answerInput');
const submitAnswer = document.getElementById('submitAnswer');
const pointsPerProblem = document.getElementById('pointsPerProblem');
const timeBonus = document.getElementById('timeBonus');
const upgradesGrid = document.getElementById('upgradesGrid');
const rebirthButton = document.getElementById('rebirthButton');
const rebirthRequirement = document.getElementById('rebirthRequirement');
const leaderboardElement = document.getElementById('leaderboard');

// Add QR modal HTML
const qrModal = document.createElement('div');
qrModal.id = 'qrModal';
qrModal.style.display = 'none';
qrModal.innerHTML = `
  <div class="qr-modal-content">
    <h2>Scan Your TUPV ID</h2>
    <div id="qr-reader" style="width: 300px; margin: 0 auto;"></div>
    <button id="closeQrModal" class="login-button" style="margin-top: 20px;">Cancel</button>
  </div>
`;
document.body.appendChild(qrModal);

// Add QR modal styles
const style = document.createElement('style');
style.innerHTML = `
#qrModal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px 24px 24px;
  box-shadow: 0 8px 32px rgba(128,0,32,0.3);
  text-align: center;
  min-width: 340px;
  max-width: 95vw;
}
`;
document.head.appendChild(style);

// Initialize game
function initGame() {
    setupLoginEventListeners();
    checkLoginStatus();
    setupDatabaseIntegration();
}

// Setup database integration
function setupDatabaseIntegration() {
    // Wait for database to initialize
    const checkDatabase = setInterval(() => {
        if (window.tupvDatabase && window.tupvDatabase.isInitialized !== undefined) {
            clearInterval(checkDatabase);
            console.log('Database integration ready');
        }
    }, 100);
}

// Setup login event listeners
function setupLoginEventListeners() {
    loginFormElement.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // No TUPV ID format validation here
    if (!username || !password) {
        alert('Please enter your username and password.');
        return;
    }
    
    // Check if database is available
    if (window.tupvDatabase && window.tupvDatabase.isInitialized) {
        // Use database authentication
        if (window.tupvDatabase.authenticateUser(username, password)) {
            loginSuccess(username);
        } else {
            alert('Invalid username or password. Please check your credentials or sign up for a new account.');
        }
    } else {
        // Fallback to demo account only
        if (username === 'demo' && password === 'demo123') {
            loginSuccess(username);
        } else {
            alert('Invalid username or password. Please check your credentials or sign up for a new account.');
        }
    }
}

function loginSuccess(username) {
    gameState.currentUser = username;
    currentUserDisplay.textContent = username;
    loginForm.style.display = 'none';
    if (window.tupvDatabase && window.tupvDatabase.isInitialized && window.tupvDatabase.isFirstLogin(username)) {
        showQrModal(username);
    } else {
        showGame();
    }
    localStorage.setItem('tupvLoggedIn', 'true');
    localStorage.setItem('tupvCurrentUser', username);
}

function showGame() {
    gameContainer.style.display = 'block';
    loadGameFromDatabase(gameState.currentUser);
    generateNewProblem();
    renderUpgrades();
    updateDisplay();
    updateLeaderboard();
    setupGameEventListeners();
}

// Load game data from database
function loadGameFromDatabase(username) {
    if (window.tupvDatabase && window.tupvDatabase.isInitialized) {
        const savedState = window.tupvDatabase.loadGameState(username);
        if (savedState) {
            gameState = { ...gameState, ...savedState };
        }
    } else {
        // Fallback to localStorage
        loadGame();
    }
}

// Handle logout
function handleLogout() {
    // Save current game state to database
    saveGameToDatabase();
    
    // Reset game state
    gameState = {
        points: 0,
        problemsSolved: 0,
        level: 1,
        currentProblem: null,
        upgrades: {},
        lastSave: Date.now(),
        currentUser: null,
        problemStartTime: null
    };
    
    // Show login, hide game
    loginForm.style.display = 'flex';
    gameContainer.style.display = 'none';
    
    // Clear form
    usernameInput.value = '';
    passwordInput.value = '';
}

// Save game data to database
function saveGameToDatabase() {
    if (window.tupvDatabase && window.tupvDatabase.isInitialized && gameState.currentUser) {
        window.tupvDatabase.saveGameState(gameState.currentUser, gameState);
    } else {
        // Fallback to localStorage
        saveGame();
    }
}

// Check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('tupvLoggedIn');
    const currentUser = localStorage.getItem('tupvCurrentUser');
    
    if (isLoggedIn === 'true' && currentUser) {
        loginSuccess(currentUser);
    }
}

// Game Event Listeners
function setupGameEventListeners() {
    submitAnswer.addEventListener('click', handleAnswerSubmit);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAnswerSubmit();
        }
    });
    rebirthButton.addEventListener('click', handleAdvancement);
    
    // Auto-save every 30 seconds
    setInterval(saveGameToDatabase, 30000);
}

// Generate new math problem
function generateNewProblem() {
    const difficulty = getCurrentDifficulty();
    const categories = PROBLEM_CATEGORIES[difficulty];
    const categoryNames = Object.keys(categories);
    const randomCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    const category = categories[randomCategory];
    const problems = category.problems;
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    
    gameState.currentProblem = {
        ...randomProblem,
        category: randomCategory,
        difficulty: difficulty
    };
    
    gameState.problemStartTime = Date.now();
    
    // Update display
    problemText.textContent = gameState.currentProblem.question;
    problemHint.textContent = gameState.currentProblem.hint;
    difficultyBadge.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    // Clear answer input
    answerInput.value = '';
    answerInput.focus();
}

// Get current difficulty based on level
function getCurrentDifficulty() {
    if (gameState.level <= 5) return 'easy';
    if (gameState.level <= 10) return 'medium';
    return 'hard';
}

// Handle answer submission
function handleAnswerSubmit() {
    const userAnswer = answerInput.value.trim();
    const correctAnswer = gameState.currentProblem.answer;
    
    if (userAnswer === '') {
        alert('Please enter an answer!');
        return;
    }
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        // Correct answer
        handleCorrectAnswer();
    } else {
        // Wrong answer
        handleWrongAnswer();
    }
}

// Handle correct answer
function handleCorrectAnswer() {
    const timeTaken = Date.now() - gameState.problemStartTime;
    const basePoints = getBasePoints();
    const timeBonusPoints = timeTaken < 10000 ? 5 : 0; // Bonus for quick answers
    const totalPoints = basePoints + timeBonusPoints;
    
    gameState.points += totalPoints;
    gameState.problemsSolved++;
    
    // Visual feedback
    problemText.classList.add('correct-answer');
    setTimeout(() => problemText.classList.remove('correct-answer'), 500);
    
    // Show points earned
    showPointsEarned(totalPoints);
    
    // Record game session
    if (window.tupvDatabase && window.tupvDatabase.isInitialized) {
        window.tupvDatabase.recordGameSession(gameState.currentUser, 1, totalPoints);
    }
    
    // Generate new problem
    setTimeout(() => {
        generateNewProblem();
        updateDisplay();
        updateLeaderboard();
        saveGameToDatabase();
    }, 1000);
}

// Handle wrong answer
function handleWrongAnswer() {
    // Visual feedback
    answerInput.classList.add('wrong-answer');
    setTimeout(() => answerInput.classList.remove('wrong-answer'), 300);
    
    // Show correct answer briefly
    const originalText = problemText.textContent;
    problemText.textContent = `Correct answer: ${gameState.currentProblem.answer}`;
    problemText.style.color = '#d32f2f';
    
    setTimeout(() => {
        problemText.textContent = originalText;
        problemText.style.color = '#800020';
        generateNewProblem();
    }, 2000);
}

// Show points earned animation
function showPointsEarned(points) {
    const pointsDisplay = document.createElement('div');
    pointsDisplay.textContent = `+${points} points!`;
    pointsDisplay.style.cssText = `
        position: absolute;
        color: #a00030;
        font-weight: 700;
        font-size: 1.2rem;
        text-shadow: none;
        pointer-events: none;
        z-index: 1000;
        animation: float 1s ease-out forwards;
    `;
    
    const rect = problemText.getBoundingClientRect();
    pointsDisplay.style.left = rect.left + rect.width / 2 + 'px';
    pointsDisplay.style.top = rect.top + rect.height / 2 + 'px';
    
    document.body.appendChild(pointsDisplay);
    
    setTimeout(() => {
        document.body.removeChild(pointsDisplay);
    }, 1000);
}

// Get base points for current difficulty
function getBasePoints() {
    const difficulty = getCurrentDifficulty();
    switch (difficulty) {
        case 'easy': return 10;
        case 'medium': return 20;
        case 'hard': return 30;
        default: return 10;
    }
}

// Upgrade handling
function purchaseUpgrade(upgradeId) {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const owned = gameState.upgrades[upgradeId] || 0;
    const cost = calculateUpgradeCost(upgrade, owned);
    
    if (gameState.points >= cost) {
        gameState.points -= cost;
        gameState.upgrades[upgradeId] = (gameState.upgrades[upgradeId] || 0) + 1;
        
        // Add purchase effect
        const upgradeElement = document.querySelector(`[data-upgrade-id="${upgradeId}"]`);
        if (upgradeElement) {
            upgradeElement.classList.add('bounce');
            setTimeout(() => upgradeElement.classList.remove('bounce'), 1000);
        }
        
        updateDisplay();
        renderUpgrades();
        saveGameToDatabase();
    }
}

// Calculate upgrade cost
function calculateUpgradeCost(upgrade, owned) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
}

// Render upgrades
function renderUpgrades() {
    upgradesGrid.innerHTML = '';
    
    upgrades.forEach(upgrade => {
        const owned = gameState.upgrades[upgrade.id] || 0;
        const cost = calculateUpgradeCost(upgrade, owned);
        const canAfford = gameState.points >= cost;
        
        const upgradeElement = document.createElement('div');
        upgradeElement.className = `upgrade-item ${canAfford ? 'affordable' : 'unaffordable'}`;
        upgradeElement.setAttribute('data-upgrade-id', upgrade.id);
        upgradeElement.onclick = () => canAfford && purchaseUpgrade(upgrade.id);
        
        upgradeElement.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-cost">Cost: ${formatNumber(cost)} points</div>
            <div class="upgrade-owned">Owned: ${owned}</div>
        `;
        
        upgradesGrid.appendChild(upgradeElement);
    });
}

// Handle advancement (rebirth)
function handleAdvancement() {
    const advancementRequirement = 1000 * Math.pow(1.5, gameState.level - 1);
    
    if (gameState.points >= advancementRequirement) {
        gameState.level++;
        gameState.points = 0;
        gameState.upgrades = {};
        
        // Update leaderboard
        updateLeaderboard();
        
        updateDisplay();
        renderUpgrades();
        generateNewProblem();
        saveGameToDatabase();
        
        // Show advancement effect
        rebirthButton.classList.add('glow');
        setTimeout(() => rebirthButton.classList.remove('glow'), 2000);
        
        // Add advancement celebration effect
        createAdvancementEffect();
    }
}

// Create advancement celebration effect
function createAdvancementEffect() {
    const celebration = document.createElement('div');
    celebration.innerHTML = 'LEVEL UP!';
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2.5rem;
        font-weight: 700;
        color: #a00030;
        text-shadow: none;
        z-index: 1000;
        animation: bounce 1.5s ease-in-out;
        pointer-events: none;
    `;
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        document.body.removeChild(celebration);
    }, 1500);
}

// Update display
function updateDisplay() {
    pointsDisplay.textContent = formatNumber(gameState.points);
    problemsSolvedDisplay.textContent = gameState.problemsSolved;
    levelDisplay.textContent = gameState.level;
    
    // Update advancement button
    const advancementRequirement = 1000 * Math.pow(1.5, gameState.level - 1);
    rebirthRequirement.textContent = formatNumber(advancementRequirement);
    
    const canAdvance = gameState.points >= advancementRequirement;
    rebirthButton.disabled = !canAdvance;
    rebirthButton.textContent = `Advance (${gameState.level + 1})`;
    
    if (canAdvance) {
        rebirthButton.classList.add('glow');
    } else {
        rebirthButton.classList.remove('glow');
    }
    
    // Update problem stats
    pointsPerProblem.textContent = getBasePoints();
    timeBonus.textContent = '+5';
}

// Update leaderboard
function updateLeaderboard() {
    // Get leaderboard from database
    if (window.tupvDatabase && window.tupvDatabase.isInitialized) {
        leaderboard = window.tupvDatabase.getLeaderboard();
    } else {
        // Fallback to localStorage
        const currentPlayer = { name: gameState.currentUser, level: gameState.level };
        leaderboard = [currentPlayer];
    }
    
    // Render leaderboard
    leaderboardElement.innerHTML = '';
    leaderboard.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${player.name === gameState.currentUser ? 'current-user' : ''}`;
        
        item.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div class="leaderboard-name">${player.name}</div>
            <div class="leaderboard-rebirths">Level ${player.level}</div>
        `;
        
        leaderboardElement.appendChild(item);
    });
}

// Format numbers
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// Save/Load game (fallback methods)
function saveGame() {
    gameState.lastSave = Date.now();
    localStorage.setItem('tupvMathGame', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('tupvMathGame');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameState = { ...gameState, ...loaded };
        } catch (e) {
            console.log('Failed to load saved game');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Save before page unload
window.addEventListener('beforeunload', saveGameToDatabase);

// QR Modal logic
function showQrModal(username) {
    qrModal.style.display = 'flex';
    let qrScanner = null;
    // Load html5-qrcode if not loaded
    if (!window.Html5Qrcode) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = () => startQrScanner(username);
        document.body.appendChild(script);
    } else {
        startQrScanner(username);
    }
    document.getElementById('closeQrModal').onclick = () => {
        if (qrScanner) qrScanner.stop();
        qrModal.style.display = 'none';
        // Optionally, log out or block further access
        loginForm.style.display = 'flex';
        gameContainer.style.display = 'none';
    };
    function startQrScanner(username) {
        qrScanner = new Html5Qrcode('qr-reader');
        qrScanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                // Validate TUPV ID format (optional)
                const tupvPattern = /^TUPV-\d{2}-\d{4}$/;
                if (tupvPattern.test(decodedText)) {
                    if (window.tupvDatabase.setTUPVID(username, decodedText)) {
                        qrScanner.stop();
                        qrModal.style.display = 'none';
                        showGame();
                        alert('TUPV ID registered successfully!');
                    } else {
                        alert('Failed to save TUPV ID. Please try again.');
                    }
                } else {
                    alert('Invalid TUPV ID format. Please scan a valid TUPV ID QR.');
                }
            },
            (errorMsg) => {
                // Ignore scan errors
            }
        );
    }
} 