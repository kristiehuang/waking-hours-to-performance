# Trading Day Performance Tracker

A simple web app to track the correlation between wake-up time and trading day performance. Built with vanilla JavaScript and Chart.js, with Supabase integration for cloud storage.

## Features

- **Easy Data Entry**: Simple form to rate your trading day (1-10) and track hours awake before 9:30 AM
- **Visual Analysis**: Interactive scatter plot showing the relationship between wake time and performance
- **Detailed Insights**: Hover over data points to see date and notes
- **Data Persistence**: Uses Supabase for cloud storage (with localStorage fallback)
- **Export Functionality**: Download your data as CSV for further analysis
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Sync**: Access your data from anywhere with Supabase

## Development Setup

### Prerequisites

- Node.js installed on your machine
- A Supabase account and project

### Installation

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_KEY=your-actual-supabase-api-key
   ```
4. Set up the Supabase database:

   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase-setup.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploying to GitHub Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages
3. Note: For production, consider using Supabase Auth instead of exposing API keys

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
- Uses Vite as the build tool for environment variable support
- Uses Chart.js for data visualization
- Data stored in Supabase (PostgreSQL) with localStorage fallback
- Supabase client for database operations

## Browser Support

Works on all modern browsers that support:

- ES6 JavaScript
- localStorage
- Chart.js

## Privacy

- Data is stored in your Supabase database (you control the database)
- Falls back to localStorage if Supabase is unavailable
- API keys are stored locally and never exposed in code

## License

MIT License - feel free to fork and customize!
