// SQL.js async loader for browser
if (typeof initSqlJs !== 'undefined') {
    initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` }).then(SQL => {
        window.SQL = SQL;
        document.dispatchEvent(new Event('sqljs-ready'));
    });
} else {
    document.dispatchEvent(new Event('sqljs-ready'));
}

// Database Management System for TUPV Math Challenge
// Using SQLite via SQL.js for web compatibility

class TUPVDatabase {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.initDatabase();
    }

    // Initialize the database
    async initDatabase() {
        try {
            if (typeof SQL === 'undefined') {
                console.log('SQL.js not available, using localStorage fallback');
                this.useLocalStorageFallback();
                return;
            }
            // Load from localStorage if available
            const backup = localStorage.getItem('tupvDatabaseBackup');
            if (backup) {
                const data = new Uint8Array(JSON.parse(backup));
                this.db = new SQL.Database(data);
                console.log('Database loaded from localStorage backup');
            } else {
                this.db = new SQL.Database();
                this.createTables();
                this.loadExistingData();
                // Ensure demo account exists
                this.ensureDemoAccount();
            }
            this.isInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.useLocalStorageFallback();
        }
    }

    // Create database tables
    createTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                isFirstLogin INTEGER DEFAULT 1,
                tupvID TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Scores table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                points INTEGER DEFAULT 0,
                problems_solved INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                total_points_earned INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        `);

        // Game sessions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_end DATETIME,
                problems_solved INTEGER DEFAULT 0,
                points_earned INTEGER DEFAULT 0,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        `);

        // Leaderboard cache table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS leaderboard_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                total_points INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Load existing data from localStorage
    loadExistingData() {
        const existingData = localStorage.getItem('tupvMathGame');
        if (existingData) {
            try {
                const data = JSON.parse(existingData);
                if (data.currentUser) {
                    this.importUserData(data);
                }
            } catch (error) {
                console.error('Error loading existing data:', error);
            }
        }

        // Import users from localStorage if database is empty
        const users = JSON.parse(localStorage.getItem('tupvUsers') || '[]');
        users.forEach(user => {
            this.importUserFromLocalStorage(user);
        });
    }

    // Import user from localStorage
    importUserFromLocalStorage(user) {
        try {
            this.db.run(`
                INSERT OR IGNORE INTO users (username, full_name, password_hash, created_at)
                VALUES (?, ?, ?, ?)
            `, [user.studentId, user.fullName || 'Unknown', user.password, user.createdAt]);

            // Initialize scores if not exists
            this.db.run(`
                INSERT OR IGNORE INTO scores (username, points, problems_solved, level)
                VALUES (?, 0, 0, 1)
            `, [user.studentId]);
        } catch (error) {
            console.error('Error importing user from localStorage:', error);
        }
    }

    // Import user data from localStorage
    importUserData(data) {
        const studentId = data.currentUser;
        const hashedPassword = this.hashPassword('EVANGELISTA'); // Demo password

        // Insert or update user
        this.db.run(`
            INSERT OR REPLACE INTO users (username, full_name, password_hash, last_login)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [studentId, 'Demo User', hashedPassword]);

        // Insert or update scores
        this.db.run(`
            INSERT OR REPLACE INTO scores 
            (username, points, problems_solved, level, total_points_earned, last_updated)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            studentId,
            data.points || 0,
            data.problemsSolved || 0,
            data.level || 1,
            data.totalPointsEarned || 0
        ]);

        // Update leaderboard cache
        this.updateLeaderboardCache(studentId, data.level || 1, data.points || 0);
    }

    // Hash password (simple implementation)
    hashPassword(password) {
        // In a real application, use proper hashing like bcrypt
        return btoa(password + 'TUPV_SALT');
    }

    // Verify password
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // Check if user exists
    userExists(username) {
        if (!this.isInitialized) return false;
        try {
            const result = this.db.exec(`
                SELECT COUNT(*) as count FROM users 
                WHERE username = ?
            `, [username]);
            return result.length > 0 && result[0].values.length > 0 && result[0].values[0][0] > 0;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

    // User authentication
    authenticateUser(username, password) {
        if (!this.isInitialized) return false;
        try {
            const result = this.db.exec(`
                SELECT password_hash FROM users 
                WHERE username = ?
            `, [username]);
            if (result.length > 0 && result[0].values.length > 0) {
                const storedHash = result[0].values[0][0];
                return this.verifyPassword(password, storedHash);
            }
            return false;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    }

    // Create new user account
    createUserAccount(userData) {
        if (!this.isInitialized) return false;
        try {
            const hashedPassword = this.hashPassword(userData.password);
            this.db.run(`
                INSERT INTO users (username, password_hash, isFirstLogin)
                VALUES (?, ?, 1)
            `, [userData.username, hashedPassword]);
            this.db.run(`
                INSERT INTO scores (username, points, problems_solved, level)
                VALUES (?, 0, 0, 1)
            `, [userData.username]);
            this.updateLeaderboardCache(userData.username, 1, 0);
            this.saveToLocalStorage();
            return true;
        } catch (error) {
            console.error('Error creating user account:', error);
            return false;
        }
    }

    // Create user in localStorage (fallback)
    createUserLocalStorage(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('tupvUsers') || '[]');
            const userExists = users.some(user => user.studentId === userData.studentId);
            
            if (userExists) {
                return false;
            }

            users.push({
                studentId: userData.studentId,
                fullName: userData.fullName,
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('tupvUsers', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error creating user in localStorage:', error);
            return false;
        }
    }

    // Create new user (legacy method)
    createUser(studentId, password) {
        return this.createUserAccount({
            studentId: studentId,
            fullName: 'Student',
            password: password
        });
    }

    // Save game state
    saveGameState(studentId, gameState) {
        if (!this.isInitialized) {
            localStorage.setItem('tupvMathGame', JSON.stringify(gameState));
            return;
        }
        try {
            this.db.run(`
                UPDATE scores 
                SET points = ?, problems_solved = ?, level = ?, 
                    total_points_earned = total_points_earned + ?, last_updated = CURRENT_TIMESTAMP
                WHERE username = ?
            `, [
                gameState.points,
                gameState.problemsSolved,
                gameState.level,
                gameState.points,
                studentId
            ]);
            this.updateLeaderboardCache(studentId, gameState.level, gameState.points);
            this.saveToLocalStorage();
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    // Load game state
    loadGameState(studentId) {
        if (!this.isInitialized) {
            // Fallback to localStorage
            const saved = localStorage.getItem('tupvMathGame');
            return saved ? JSON.parse(saved) : null;
        }

        try {
            const result = this.db.exec(`
                SELECT points, problems_solved, level, total_points_earned
                FROM scores 
                WHERE username = ?
            `, [studentId]);

            if (result.length > 0 && result[0].values.length > 0) {
                const row = result[0].values[0];
                return {
                    points: row[0],
                    problemsSolved: row[1],
                    level: row[2],
                    totalPointsEarned: row[3],
                    currentUser: studentId,
                    upgrades: {},
                    lastSave: Date.now()
                };
            }
            return null;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    // Get leaderboard data
    getLeaderboard() {
        if (!this.isInitialized) {
            // Fallback to localStorage data
            return this.getLocalStorageLeaderboard();
        }

        try {
            const result = this.db.exec(`
                SELECT username, level, total_points
                FROM leaderboard_cache 
                ORDER BY level DESC, total_points DESC
                LIMIT 10
            `);

            return result[0]?.values.map(row => ({
                name: row[0],
                level: row[1],
                totalPoints: row[2]
            })) || [];
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return this.getLocalStorageLeaderboard();
        }
    }

    // Update leaderboard cache
    updateLeaderboardCache(studentId, level, points) {
        if (!this.isInitialized) return;

        try {
            this.db.run(`
                INSERT OR REPLACE INTO leaderboard_cache 
                (username, level, total_points, last_updated)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [studentId, level, points]);
            this.saveToLocalStorage();
        } catch (error) {
            console.error('Error updating leaderboard cache:', error);
        }
    }

    // Get localStorage leaderboard (fallback)
    getLocalStorageLeaderboard() {
        const saved = localStorage.getItem('tupvMathGame');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                return [{
                    name: data.currentUser,
                    level: data.level || 1,
                    totalPoints: data.points || 0
                }];
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
            }
        }
        return [];
    }

    // Record game session
    recordGameSession(studentId, problemsSolved, pointsEarned) {
        if (!this.isInitialized) return;

        try {
            this.db.run(`
                INSERT INTO game_sessions 
                (username, problems_solved, points_earned, session_end)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `, [studentId, problemsSolved, pointsEarned]);
        } catch (error) {
            console.error('Error recording game session:', error);
        }
    }

    // Get user statistics
    getUserStats(studentId) {
        if (!this.isInitialized) return null;

        try {
            const result = this.db.exec(`
                SELECT 
                    s.points,
                    s.problems_solved,
                    s.level,
                    s.total_points_earned,
                    COUNT(gs.id) as total_sessions,
                    SUM(gs.problems_solved) as total_problems_solved,
                    SUM(gs.points_earned) as total_points_earned
                FROM scores s
                LEFT JOIN game_sessions gs ON s.username = gs.username
                WHERE s.username = ?
                GROUP BY s.username
            `, [studentId]);

            if (result.length > 0 && result[0].values.length > 0) {
                const row = result[0].values[0];
                return {
                    currentPoints: row[0],
                    problemsSolved: row[1],
                    level: row[2],
                    totalPointsEarned: row[3],
                    totalSessions: row[4] || 0,
                    totalProblemsSolved: row[5] || 0,
                    totalPointsEarned: row[6] || 0
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Export database to file
    exportDatabase() {
        if (!this.isInitialized || !this.db) return null;

        try {
            return this.db.export();
        } catch (error) {
            console.error('Error exporting database:', error);
            return null;
        }
    }

    // Import database from file
    importDatabase(data) {
        try {
            this.db = new SQL.Database(data);
            this.isInitialized = true;
            console.log('Database imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing database:', error);
            return false;
        }
    }

    // Use localStorage fallback
    useLocalStorageFallback() {
        console.log('Using localStorage fallback for data storage');
        this.isInitialized = false;
    }

    // Backup database to localStorage
    backupToLocalStorage() {
        if (!this.isInitialized) return;

        try {
            const data = this.exportDatabase();
            if (data) {
                localStorage.setItem('tupvDatabaseBackup', JSON.stringify(Array.from(data)));
            }
        } catch (error) {
            console.error('Error backing up database:', error);
        }
    }

    // Restore database from localStorage backup
    restoreFromLocalStorage() {
        try {
            const backup = localStorage.getItem('tupvDatabaseBackup');
            if (backup) {
                const data = new Uint8Array(JSON.parse(backup));
                return this.importDatabase(data);
            }
            return false;
        } catch (error) {
            console.error('Error restoring database:', error);
            return false;
        }
    }

    // Set TUPV ID after QR scan
    setTUPVID(username, tupvID) {
        if (!this.isInitialized) return false;
        try {
            this.db.run(`
                UPDATE users SET tupvID = ?, isFirstLogin = 0 WHERE username = ?
            `, [tupvID, username]);
            this.saveToLocalStorage();
            return true;
        } catch (error) {
            console.error('Error setting TUPV ID:', error);
            return false;
        }
    }

    // Check if first login
    isFirstLogin(username) {
        if (!this.isInitialized) return false;
        try {
            const result = this.db.exec(`
                SELECT isFirstLogin FROM users WHERE username = ?
            `, [username]);
            return result.length > 0 && result[0].values.length > 0 && result[0].values[0][0] === 1;
        } catch (error) {
            console.error('Error checking first login:', error);
            return false;
        }
    }

    // Ensure demo account exists
    ensureDemoAccount() {
        try {
            const result = this.db.exec(`SELECT COUNT(*) FROM users WHERE username = ?`, ['demo']);
            if (!result.length || !result[0].values[0][0]) {
                const demoPassword = this.hashPassword('demo123');
                this.db.run(`
                    INSERT INTO users (username, full_name, password_hash, isFirstLogin)
                    VALUES (?, ?, ?, 0)
                `, ['demo', 'Demo User', demoPassword]);
                this.db.run(`
                    INSERT INTO scores (username, points, problems_solved, level)
                    VALUES (?, 0, 0, 1)
                `, ['demo']);
                this.updateLeaderboardCache('demo', 1, 0);
            }
        } catch (error) {
            console.error('Error ensuring demo account:', error);
        }
    }

    // Save database to localStorage
    saveToLocalStorage() {
        if (!this.db) return;
        try {
            const data = this.db.export();
            localStorage.setItem('tupvDatabaseBackup', JSON.stringify(Array.from(data)));
        } catch (error) {
            console.error('Error saving database to localStorage:', error);
        }
    }
}

// Initialize database when SQL.js is ready
// (remove any previous DOMContentLoaded initialization)
document.addEventListener('sqljs-ready', () => {
    new TUPVDatabase();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TUPVDatabase;
} 