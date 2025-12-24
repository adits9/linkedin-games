class SudokuGame {
    constructor() {
        this.grid = [];
        this.originalGrid = [];
        this.solution = [];
        this.selectedCell = null;
        this.startTime = null;
        this.timerInterval = null;
        this.puzzleData = null;
        this.gridSize = 6; // LinkedIn Mini Sudoku is 6x6
        this.boxRows = 2;  // 2 rows in each box
        this.boxCols = 3;  // 3 columns in each box
        
        this.init();
    }
    
    init() {
        this.loadPuzzle();
        this.setupEventListeners();
    }
    
    async loadPuzzle() {
        try {
            const response = await fetch('puzzles/current.json');
            if (!response.ok) {
                throw new Error('Puzzle file not found');
            }
            
            this.puzzleData = await response.json();
            
            // Update info
            document.getElementById('puzzle-date').textContent = this.puzzleData.date;
            document.getElementById('puzzle-difficulty').textContent = 
                this.puzzleData.difficulty || 'Medium';
            
            // Load the grid
            this.grid = JSON.parse(JSON.stringify(this.puzzleData.puzzle));
            this.originalGrid = JSON.parse(JSON.stringify(this.puzzleData.puzzle));
            
            this.renderGrid();
            this.startTimer();
            
            this.showMessage('Sudoku loaded successfully!', 'info');
            
            if (this.puzzleData.note) {
                console.log('Note:', this.puzzleData.note);
            }
            
        } catch (error) {
            console.error('Error loading puzzle:', error);
            this.showMessage('Could not load puzzle. Run scraper.py first!', 'error');
        }
    }
    
    renderGrid() {
        const gridElement = document.getElementById('sudoku-grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.grid[row][col];
                
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.originalGrid[row][col] !== 0) {
                        cell.classList.add('fixed');
                    }
                }
                
                cell.addEventListener('click', () => this.selectCell(row, col));
                
                gridElement.appendChild(cell);
            }
        }
    }
    
    selectCell(row, col) {
        // Don't allow selecting fixed cells
        if (this.originalGrid[row][col] !== 0) {
            return;
        }
        
        this.selectedCell = { row, col };
        
        // Update UI
        document.querySelectorAll('#sudoku-grid .cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const cellElement = document.querySelector(
            `#sudoku-grid [data-row="${row}"][data-col="${col}"]`
        );
        cellElement.classList.add('selected');
    }
    
    placeNumber(num) {
        if (!this.selectedCell) {
            this.showMessage('Please select a cell first!', 'info');
            return;
        }
        
        const { row, col } = this.selectedCell;
        
        // Don't allow changing fixed cells
        if (this.originalGrid[row][col] !== 0) {
            return;
        }
        
        this.grid[row][col] = num;
        this.renderGrid();
        
        // Reselect the cell
        if (num !== 0) {
            this.selectCell(row, col);
        }
    }
    
    setupEventListeners() {
        // Number pad buttons
        document.querySelectorAll('#sudoku-section .num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.dataset.num);
                this.placeNumber(num);
            });
        });
        
        // Keyboard input
        const keydownHandler = (e) => {
            if (!document.getElementById('sudoku-section').classList.contains('active')) {
                return;
            }
            
            if (e.key >= '1' && e.key <= '6') {
                this.placeNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.placeNumber(0);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                       e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.handleArrowKey(e.key);
            }
        };
        document.addEventListener('keydown', keydownHandler);
        
        // Control buttons
        document.getElementById('check-btn').addEventListener('click', () => {
            this.checkSolution();
        });
        
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.getHint();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetPuzzle();
        });
        
        document.getElementById('new-puzzle-btn').addEventListener('click', () => {
            this.stopTimer();
            this.loadPuzzle();
        });
    }
    
    handleArrowKey(key) {
        if (!this.selectedCell) {
            this.selectCell(0, 0);
            return;
        }
        
        let { row, col } = this.selectedCell;
        
        switch (key) {
            case 'ArrowUp':
                row = (row - 1 + this.gridSize) % this.gridSize;
                break;
            case 'ArrowDown':
                row = (row + 1) % this.gridSize;
                break;
            case 'ArrowLeft':
                col = (col - 1 + this.gridSize) % this.gridSize;
                break;
            case 'ArrowRight':
                col = (col + 1) % this.gridSize;
                break;
        }
        
        this.selectCell(row, col);
    }
    
    checkSolution() {
        let hasErrors = false;
        let isEmpty = false;
        
        // Remove previous error/correct classes
        document.querySelectorAll('#sudoku-grid .cell').forEach(cell => {
            cell.classList.remove('error', 'correct');
        });
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                
                if (value === 0) {
                    isEmpty = true;
                    continue;
                }
                
                if (!this.isValidPlacement(row, col, value)) {
                    hasErrors = true;
                    const cellElement = document.querySelector(
                        `#sudoku-grid [data-row="${row}"][data-col="${col}"]`
                    );
                    cellElement.classList.add('error');
                }
            }
        }
        
        if (isEmpty) {
            this.showMessage('Puzzle is not complete yet!', 'info');
        } else if (hasErrors) {
            this.showMessage('There are errors in your solution!', 'error');
        } else {
            this.showMessage('🎉 Congratulations! You solved it!', 'success');
            this.stopTimer();
            this.highlightCorrect();
        }
    }
    
    isValidPlacement(row, col, num) {
        // Check row
        for (let c = 0; c < this.gridSize; c++) {
            if (c !== col && this.grid[row][c] === num) {
                return false;
            }
        }
        
        // Check column
        for (let r = 0; r < this.gridSize; r++) {
            if (r !== row && this.grid[r][col] === num) {
                return false;
            }
        }
        
        // Check 2x3 box
        const boxRow = Math.floor(row / this.boxRows) * this.boxRows;
        const boxCol = Math.floor(col / this.boxCols) * this.boxCols;
        
        for (let r = boxRow; r < boxRow + this.boxRows; r++) {
            for (let c = boxCol; c < boxCol + this.boxCols; c++) {
                if ((r !== row || c !== col) && this.grid[r][c] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    highlightCorrect() {
        document.querySelectorAll('#sudoku-grid .cell').forEach(cell => {
            if (!cell.classList.contains('fixed')) {
                cell.classList.add('correct');
            }
        });
    }
    
    getHint() {
        // Find an empty cell and fill it with the correct value
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    // Try to find valid number (1-6 for Mini Sudoku)
                    for (let num = 1; num <= this.gridSize; num++) {
                        if (this.isValidPlacement(row, col, num)) {
                            this.grid[row][col] = num;
                            this.renderGrid();
                            this.selectCell(row, col);
                            this.showMessage(`Hint: Added ${num} at row ${row + 1}, col ${col + 1}`, 'info');
                            return;
                        }
                    }
                }
            }
        }
        
        this.showMessage('No hints available!', 'info');
    }
    
    resetPuzzle() {
        if (confirm('Are you sure you want to reset the puzzle?')) {
            this.grid = JSON.parse(JSON.stringify(this.originalGrid));
            this.renderGrid();
            this.showMessage('Puzzle reset!', 'info');
            
            // Reset timer
            this.stopTimer();
            this.startTimer();
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message show ${type}`;
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }
}

class QueensGame {
    constructor() {
        this.boardSize = 5;
        this.hintQueens = [];
        this.placedQueens = [];
        this.markedCells = [];  // Cells marked with X
        this.startTime = null;
        this.timerInterval = null;
        
        // Define color regions for 5x5 board (5 regions, one per row/column)
        this.regions = [
            [[0,0], [0,1], [1,0], [1,1], [2,0]],
            [[0,2], [0,3], [0,4], [1,2], [1,3]],
            [[1,4], [2,1], [2,2], [2,3], [2,4]],
            [[3,0], [3,1], [4,0], [4,1], [3,2]],
            [[3,3], [3,4], [4,2], [4,3], [4,4]]
        ];
        
        this.init();
    }
    
    init() {
        this.generatePuzzle();
        this.renderGrid();
        this.setupEventListeners();
        this.startTimer();
    }
    
    generatePuzzle() {
        const solution = this.generateValidSolution();
        const hintsToKeep = Math.floor(Math.random() * 2) + 1;
        const shuffled = solution.sort(() => Math.random() - 0.5);
        
        this.hintQueens = shuffled.slice(0, hintsToKeep);
        this.placedQueens = JSON.parse(JSON.stringify(this.hintQueens));
        this.markedCells = [];
    }
    
    generateValidSolution() {
        const solution = [];
        const cols = new Set();
        const diag1 = new Set();
        const diag2 = new Set();
        const regionsUsed = new Set();
        
        const backtrack = (row) => {
            if (row === this.boardSize) {
                return true;
            }
            
            for (let col = 0; col < this.boardSize; col++) {
                const d1 = row - col;
                const d2 = row + col;
                const region = this.getRegionIndex(row, col);
                
                if (!cols.has(col) && !diag1.has(d1) && !diag2.has(d2) && !regionsUsed.has(region)) {
                    solution.push([row, col]);
                    cols.add(col);
                    diag1.add(d1);
                    diag2.add(d2);
                    regionsUsed.add(region);
                    
                    if (backtrack(row + 1)) {
                        return true;
                    }
                    
                    solution.pop();
                    cols.delete(col);
                    diag1.delete(d1);
                    diag2.delete(d2);
                    regionsUsed.delete(region);
                }
            }
            
            return false;
        };
        
        backtrack(0);
        return solution;
    }
    
    getRegionIndex(row, col) {
        for (let i = 0; i < this.regions.length; i++) {
            if (this.regions[i].some(cell => cell[0] === row && cell[1] === col)) {
                return i;
            }
        }
        return -1;
    }
    
    renderGrid() {
        const gridElement = document.getElementById('queens-grid');
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        
        const colors = ['#e8f5e9', '#fff3e0', '#e3f2fd', '#fce4ec', '#f3e5f5'];
        
        // Find all conflicting queens
        const conflictingQueens = this.findConflictingQueens();
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'queen-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const regionIndex = this.getRegionIndex(row, col);
                cell.style.backgroundColor = colors[regionIndex];
                
                const hasQueen = this.placedQueens.some(q => q[0] === row && q[1] === col);
                const isMarked = this.markedCells.some(c => c[0] === row && c[1] === col);
                const isHint = this.hintQueens.some(q => q[0] === row && q[1] === col);
                const isConflicting = conflictingQueens.some(q => q[0] === row && q[1] === col);
                
                if (hasQueen) {
                    cell.classList.add('queen');
                    if (isHint) {
                        cell.classList.add('hint');
                    }
                    if (isConflicting) {
                        cell.classList.add('conflict');
                    }
                    cell.textContent = '♛';
                } else if (isMarked) {
                    cell.classList.add('marked');
                    cell.textContent = '✕';
                }
                
                cell.addEventListener('click', () => this.toggleCell(row, col));
                
                gridElement.appendChild(cell);
            }
        }
        
        this.updateQueensCount();
    }
    
    findConflictingQueens() {
        const conflicting = [];
        
        for (let i = 0; i < this.placedQueens.length; i++) {
            for (let j = i + 1; j < this.placedQueens.length; j++) {
                const [r1, c1] = this.placedQueens[i];
                const [r2, c2] = this.placedQueens[j];
                const region1 = this.getRegionIndex(r1, c1);
                const region2 = this.getRegionIndex(r2, c2);
                
                // Check for any conflict
                if (r1 === r2 || c1 === c2 || region1 === region2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
                    if (!conflicting.some(q => q[0] === r1 && q[1] === c1)) {
                        conflicting.push([r1, c1]);
                    }
                    if (!conflicting.some(q => q[0] === r2 && q[1] === c2)) {
                        conflicting.push([r2, c2]);
                    }
                }
            }
        }
        
        return conflicting;
    }
    
    toggleCell(row, col) {
        const isHint = this.hintQueens.some(q => q[0] === row && q[1] === col);
        if (isHint) {
            return;
        }
        
        const queenIndex = this.placedQueens.findIndex(q => q[0] === row && q[1] === col);
        const markedIndex = this.markedCells.findIndex(c => c[0] === row && c[1] === col);
        
        if (queenIndex > -1) {
            // Remove queen
            this.placedQueens.splice(queenIndex, 1);
        } else if (markedIndex > -1) {
            // Remove mark, add queen
            this.markedCells.splice(markedIndex, 1);
            this.placedQueens.push([row, col]);
        } else {
            // Add mark first
            this.markedCells.push([row, col]);
        }
        
        this.renderGrid();
    }
    
    updateQueensCount() {
        const remaining = this.boardSize - this.placedQueens.length;
        document.getElementById('queens-remaining').textContent = Math.max(0, remaining);
    }
    
    setupEventListeners() {
        document.getElementById('queens-check-btn').addEventListener('click', () => {
            this.checkSolution();
        });
        
        document.getElementById('queens-reset-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the puzzle?')) {
                this.stopTimer();
                this.placedQueens = JSON.parse(JSON.stringify(this.hintQueens));
                this.markedCells = [];
                this.renderGrid();
                this.startTimer();
                this.showMessage('Puzzle reset!', 'info');
            }
        });
        
        document.getElementById('queens-new-btn').addEventListener('click', () => {
            this.stopTimer();
            this.generatePuzzle();
            this.renderGrid();
            this.startTimer();
            this.showMessage('New puzzle generated!', 'info');
        });
    }
    
    checkSolution() {
        if (this.placedQueens.length !== this.boardSize) {
            this.showMessage(`You need to place exactly ${this.boardSize} queens!`, 'error');
            return;
        }
        
        const conflicts = this.checkConflicts();
        
        if (conflicts.length > 0) {
            this.showMessage('There are conflicts in your solution!', 'error');
            this.highlightConflicts(conflicts);
            return;
        }
        
        // Check if each region has exactly one queen
        const regionCheck = this.checkRegions();
        if (!regionCheck) {
            this.showMessage('Each color region must have exactly one queen!', 'error');
            return;
        }
        
        this.showMessage('🎉 Congratulations! You solved the puzzle!', 'success');
        this.stopTimer();
        this.highlightCorrect();
    }
    
    checkConflicts() {
        const conflicts = [];
        
        for (let i = 0; i < this.placedQueens.length; i++) {
            for (let j = i + 1; j < this.placedQueens.length; j++) {
                const [r1, c1] = this.placedQueens[i];
                const [r2, c2] = this.placedQueens[j];
                
                if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
                    if (!conflicts.includes(i)) conflicts.push(i);
                    if (!conflicts.includes(j)) conflicts.push(j);
                }
            }
        }
        
        return conflicts;
    }
    
    checkRegions() {
        const regionQueenCount = new Array(this.regions.length).fill(0);
        
        for (const [row, col] of this.placedQueens) {
            const regionIndex = this.getRegionIndex(row, col);
            regionQueenCount[regionIndex]++;
        }
        
        // Each region should have exactly 1 queen
        return regionQueenCount.every(count => count === 1);
    }
    
    highlightConflicts(conflicts) {
        document.querySelectorAll('#queens-grid .queen-cell').forEach(cell => {
            cell.classList.remove('threat', 'safe');
        });
        
        conflicts.forEach(idx => {
            const [row, col] = this.placedQueens[idx];
            const cell = document.querySelector(
                `#queens-grid [data-row="${row}"][data-col="${col}"]`
            );
            if (cell) {
                cell.classList.add('threat');
            }
        });
    }
    
    highlightCorrect() {
        document.querySelectorAll('#queens-grid .queen-cell.queen').forEach(cell => {
            cell.classList.add('safe');
        });
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('queens-timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message show ${type}`;
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }
}

// Game Manager
class GameManager {
    constructor() {
        this.sudokuGame = null;
        this.queensGame = null;
        this.currentGame = 'sudoku';
        
        this.init();
    }
    
    init() {
        this.setupGameTabs();
        this.startGame('sudoku');
    }
    
    setupGameTabs() {
        document.querySelectorAll('.game-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const game = tab.dataset.game;
                this.switchGame(game);
            });
        });
    }
    
    switchGame(game) {
        // Stop current game timers
        if (this.sudokuGame) {
            this.sudokuGame.stopTimer();
        }
        if (this.queensGame) {
            this.queensGame.stopTimer();
        }
        
        // Update UI
        document.querySelectorAll('.game-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.game === game);
        });
        
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const sectionId = game === 'sudoku' ? 'sudoku-section' : 'queens-section';
        document.getElementById(sectionId).classList.add('active');
        
        // Update header
        if (game === 'sudoku') {
            document.getElementById('game-title').textContent = '🧩 LinkedIn Mini Sudoku';
            document.getElementById('game-subtitle').textContent = 'Daily Puzzle - Local Version (6x6)';
        } else {
            document.getElementById('game-title').textContent = '♛ LinkedIn Queens';
            document.getElementById('game-subtitle').textContent = '5x5 Placement Puzzle';
        }
        
        this.currentGame = game;
        this.startGame(game);
    }
    
    startGame(game) {
        if (game === 'sudoku') {
            if (!this.sudokuGame) {
                this.sudokuGame = new SudokuGame();
            }
        } else {
            if (!this.queensGame) {
                this.queensGame = new QueensGame();
            } else {
                this.queensGame.startTimer();
            }
        }
    }
}

// Initialize the game manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});
