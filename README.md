# Trading Day Performance Tracker

A simple web app to track the correlation between wake-up time and trading day performance. Built with vanilla JavaScript and Chart.js, hosted on GitHub Pages.

## Features

- **Easy Data Entry**: Simple form to rate your trading day (1-10) and track hours awake before 9:30 AM
- **Visual Analysis**: Interactive scatter plot showing the relationship between wake time and performance
- **Detailed Insights**: Hover over data points to see date and notes
- **Data Persistence**: Uses browser localStorage to save your data
- **Export Functionality**: Download your data as CSV for further analysis
- **Responsive Design**: Works on desktop and mobile devices

## Setup for GitHub Pages

1. Push this repository to GitHub
2. Go to your repository settings on GitHub
3. Scroll down to the "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Your site will be available at `https://[your-username].github.io/felix-trading-day-to-waking-hours/`

## How to Use

1. **Rate Your Trading Day**: Enter a rating from 1-10 (decimals allowed)
2. **Track Wake Time**: Enter how many hours you were awake before 9:30 AM
3. **Add Date**: Defaults to today, but you can change it
4. **Add Notes**: Optional field for any observations about the day
5. **Submit**: Click "Add Entry" to save and see it on the graph

## Features Explained

### The Graph
- **X-axis**: Hours awake before 9:30 AM
- **Y-axis**: Trading day rating (1-10)
- **Hover**: See date and notes for each data point

### Data Management
- **Export Data**: Download all your entries as a CSV file
- **Clear All Data**: Remove all stored data (use with caution!)

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses Chart.js for data visualization
- Data stored in browser localStorage
- No backend required - fully static site

## Browser Support

Works on all modern browsers that support:
- ES6 JavaScript
- localStorage
- Chart.js

## Privacy

All data is stored locally in your browser. No data is sent to any server.

## License

MIT License - feel free to fork and customize!
