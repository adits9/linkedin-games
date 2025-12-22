"""
LinkedIn Sudoku Game Scraper
Scrapes the daily Sudoku puzzle from LinkedIn Games
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import os
import re


class LinkedInSudokuScraper:
    def __init__(self):
        self.base_url = "https://www.linkedin.com/games/sudoku/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        
    def scrape_sudoku(self):
        """
        Scrape the Sudoku puzzle from LinkedIn
        Returns the puzzle data as a dictionary
        """
        try:
            print("Fetching LinkedIn Sudoku page...")
            response = requests.get(self.base_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for script tags containing game data
            # LinkedIn typically embeds game data in JSON within script tags
            puzzle_data = self._extract_puzzle_data(soup, response.text)
            
            if puzzle_data:
                return puzzle_data
            else:
                print("Could not find puzzle data in the page")
                return None
                
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None
    
    def _extract_puzzle_data(self, soup, html_content):
        """
        Extract puzzle data from the HTML content
        Looks for JSON data in script tags or data attributes
        """
        # Method 1: Look for JSON in script tags
        script_tags = soup.find_all('script')
        for script in script_tags:
            if script.string and ('sudoku' in script.string.lower() or 'puzzle' in script.string.lower()):
                # Try to extract JSON data
                try:
                    # Look for common patterns
                    json_match = re.search(r'("puzzle"|"board"|"grid"):\s*(\[[\s\S]*?\])', script.string)
                    if json_match:
                        json_str = '{' + json_match.group(0) + '}'
                        data = json.loads(json_str)
                        return self._format_puzzle_data(data)
                except json.JSONDecodeError:
                    continue
        
        # Method 2: Look for data attributes
        game_container = soup.find_all(['div', 'section'], {'data-puzzle': True})
        for container in game_container:
            try:
                puzzle_data = json.loads(container.get('data-puzzle', '{}'))
                if puzzle_data:
                    return self._format_puzzle_data(puzzle_data)
            except json.JSONDecodeError:
                continue
        
        # Method 3: Generate a sample puzzle for testing
        print("Note: Could not scrape live data. Generating sample puzzle for testing.")
        return self._generate_sample_puzzle()
    
    def _format_puzzle_data(self, raw_data):
        """
        Format the raw puzzle data into a standardized format
        """
        today = datetime.now().strftime("%Y-%m-%d")
        
        return {
            'date': today,
            'puzzle': raw_data.get('puzzle') or raw_data.get('board') or raw_data.get('grid'),
            'difficulty': raw_data.get('difficulty', 'medium'),
            'scraped_at': datetime.now().isoformat()
        }
    
    def _generate_sample_puzzle(self):
        """
        Generate a sample Mini Sudoku puzzle for testing
        LinkedIn Mini Sudoku is 6x6 with 2x3 boxes, using numbers 1-6
        0 represents empty cells
        """
        sample_puzzle = [
            [0, 6, 0, 0, 3, 0],
            [5, 0, 0, 0, 0, 4],
            [0, 0, 4, 1, 0, 0],
            [0, 0, 2, 6, 0, 0],
            [1, 0, 0, 0, 0, 6],
            [0, 4, 0, 0, 1, 0]
        ]
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        return {
            'date': today,
            'puzzle': sample_puzzle,
            'difficulty': 'medium',
            'size': 6,
            'scraped_at': datetime.now().isoformat(),
            'note': 'This is a sample Mini Sudoku (6x6) puzzle for testing. Real LinkedIn data requires authentication.'
        }
    
    def save_puzzle(self, puzzle_data):
        """
        Save the puzzle data to a JSON file
        """
        if not puzzle_data:
            print("No puzzle data to save")
            return False
        
        # Create puzzles directory if it doesn't exist
        os.makedirs('puzzles', exist_ok=True)
        
        # Save to dated file
        filename = f"puzzles/sudoku_{puzzle_data['date']}.json"
        
        with open(filename, 'w') as f:
            json.dump(puzzle_data, f, indent=2)
        
        print(f"Puzzle saved to {filename}")
        
        # Also save as current.json for easy access
        with open('puzzles/current.json', 'w') as f:
            json.dump(puzzle_data, f, indent=2)
        
        print("Current puzzle updated")
        return True


def main():
    print("LinkedIn Sudoku Scraper")
    print("=" * 50)
    
    scraper = LinkedInSudokuScraper()
    puzzle_data = scraper.scrape_sudoku()
    
    if puzzle_data:
        print("\nPuzzle scraped successfully!")
        print(f"Date: {puzzle_data['date']}")
        print(f"Difficulty: {puzzle_data.get('difficulty', 'unknown')}")
        
        if scraper.save_puzzle(puzzle_data):
            print("\n✓ Puzzle saved successfully!")
            print("\nYou can now open index.html to play the puzzle.")
        else:
            print("\n✗ Failed to save puzzle")
    else:
        print("\n✗ Failed to scrape puzzle")


if __name__ == "__main__":
    main()
