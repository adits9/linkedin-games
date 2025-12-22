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
            
            this.showMessage('Puzzle loaded successfully!', 'info');
            
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
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const cellElement = document.querySelector(
            `[data-row="${row}"][data-col="${col}"]`
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
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = parseInt(btn.dataset.num);
                this.placeNumber(num);
            });
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '6') {
                this.placeNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.placeNumber(0);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                       e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.handleArrowKey(e.key);
            }
        });
        
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
        document.querySelectorAll('.cell').forEach(cell => {
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
                        `[data-row="${row}"][data-col="${col}"]`
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
        document.querySelectorAll('.cell').forEach(cell => {
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

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
