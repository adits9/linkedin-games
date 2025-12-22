# LinkedIn Mini Sudoku Scraper & Game

A complete solution to scrape LinkedIn's daily Mini Sudoku puzzle (6x6 grid) and play it locally in your browser.

## 🎯 Features

- **Daily Scraping**: Automatically scrapes LinkedIn's Mini Sudoku puzzle
- **2x3 Grid**: Proper Mini Sudoku format with 2x3 boxes using numbers 1-6
- **Local Gameplay**: Beautiful, responsive web interface to play the puzzle
- **Full Game Features**: 
  - Timer to track solving time
  - Check solution for errors
  - Get hints when stuck
  - Reset puzzle
  - Keyboard & mouse support
  - Mobile-friendly design

## 📋 Prerequisites

- Python 3.7+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt
```

### 2. Run the Scraper

```bash
python3 scraper.py
```

This will:
- Scrape (or generate a sample) LinkedIn Mini Sudoku puzzle (6x6 grid)
- Save it to `puzzles/current.json`
- Create a dated file like `puzzles/sudoku_2025-12-21.json`

### 3. Start the Local Web Server

**Important**: You need to run a web server to avoid browser security restrictions:

```bash
python3 -m http.server 8000
```

### 4. Play the Game

Open your browser and navigate to:
```
http://localhost:8000
```
6) below the grid
   - Or use keyboard keys 1-6
   - Press Backspace/Delete to erase
3. **Navigate**: Use arrow keys to move between cells
4. **Check your work**: Click "Check Solution" to validate
5. **Need help?**: Click "Get Hint" for assistance
6. **Start over**: Click "Reset" to clear your entries

## ℹ️ About LinkedIn Mini Sudoku

LinkedIn's Mini Sudoku is a **6x6 grid** variant of traditional Sudoku:
- Uses numbers **1-6** (instead of 1-9)
- Divided into **2x3 boxes** (instead of 3x3)
- Same rules: each row, column, and box must contain all numbers 1-6 exactly once
   - Press Backspace/Delete to erase
3. **Navigate**: Use arrow keys to move between cells
4. **Check your work**: Click "Check Solution" to validate
5. **Need help?**: Click "Get Hint" for assistance
6. **Start over**: Click "Reset" to clear your entries

## ⚙️ Automated Daily Scraping

### Using Cron (macOS/Linux)

1. Make the script executable:
```bash
chmod +x run_daily.sh
```

2. Edit your crontab:
```bash
crontab -e
```

3. Add this line to run daily at 6 AM:
```bash
0 6 * * * /Users/adit/Documents/linkedinGames/linkedin-games/run_daily.sh >> /Users/adit/Documents/linkedinGames/linkedin-games/scraper.log 2>&1
```

### Using macOS Launchd (Alternative)

Create a file at `~/Library/LaunchAgents/com.linkedin.sudoku.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.linkedin.sudoku</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/adit/Documents/linkedinGames/linkedin-games/run_daily.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

Then load it:
```bash
launchctl load ~/Library/LaunchAgents/com.linkedin.sudoku.plist
```

## 📁 Project Structure

```
linkedin-games/
├── index.html          # Main game interface
├── style.css           # Game styling
├── game.js             # Game logic
├── scraper.py          # LinkedIn scraper6x6 Mini Sudoku puzzles for testing purposes.

**Note**: To scrape actual LinkedIn puzzles, you would need to:
- Add authentication (cookies/session)
- Handle LinkedIn's API or HTML structure  
- Comply with LinkedIn's terms of service

### Game Engine
The JavaScript game engine:
- Loads puzzle from JSON files
- Supports 6x6 Mini Sudoku format with 2x3 box

### Scraper
The Python scraper attempts to fetch puzzle data from LinkedIn's game page. Since LinkedIn requires authentication, the scraper includes a fallback that generates valid sample Sudoku puzzles for testing purposes.

**Note**: To scrape actual LinkedIn puzzles, you would need to:
- Add authentication (cookies/session)
- Handle LinkedIn's API or HTML structure
- Comply with LinkedIn's terms of service

### Game Engine
The JavaScript game engine:
- Loads puzzle from JSON files
- Validates moves in real-time
- Checks Sudoku rules (no duplicates in rows/columns/boxes)
- Provides hints by solving cells algorithmically
- Tracks completion time

## 🛠️ Customization

### Change Difficulty
Edit the sample puzzle in `scraper.py` to create easier or harder puzzles.

### Styling
Modify `style.css` to change colors, fonts, or layout.

### Game Features
Extend `game.js` to add features like:
- Pencil marks (notes)
- Undo/Redo
- Multiple difficulty levels
- Statistics tracking

## ⚠️ Important Notes

- **LinkedIn Terms**: Be mindful of LinkedIn's terms of service regarding scraping
- **Authentication**: Real scraping requires LinkedIn login credentials
- **Rate Limiting**: Don't scrape too frequently to avoid being blocked
- **Sample Data**: The scraper generates sample puzzles if it can't access LinkedIn

## 📝 License

This project is for educational purposes. Please respect LinkedIn's terms of service.

## 🤝 Contributing

Feel free to open issues or submit pull requests with improvements!

## 🎉 Enjoy!

Have fun solving daily Sudoku puzzles!
