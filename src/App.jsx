import React, { useState, useEffect } from 'react';
import TradingForm from './components/TradingForm';
import PerformanceToHrsAwakeBefore930Chart from './components/PerformanceToHoursAwakeBefore930Chart';
import DataActions from './components/DataActions';
import NotificationProvider from './components/NotificationProvider';
import CatRain from './components/CatRain';
import { supabaseClient, TRADING_TABLE } from './utils/supabase-config';
import { useNotification } from './hooks/useNotification';
import PerformanceToHrsSleptChart from './components/PerformanceToHoursSleptChart';

function AppContent() {
  const [tradingData, setTradingData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showCatRain, setShowCatRain] = useState(false);
  const [catRainRating, setCatRainRating] = useState(5);
  const { showNotification } = useNotification();

  // Load data from Supabase
  const loadDataFromSupabase = async () => {
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TRADING_TABLE)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Convert Supabase data to our format
      const formattedData = data.map(entry => ({
        rating: parseFloat(entry.rating),
        hoursAwake: parseFloat(entry.hours_awake),
        hoursSlept: entry.hours_slept ? parseFloat(entry.hours_slept) : null,
        date: entry.date,
        notes: entry.notes,
        timestamp: entry.timestamp,
        id: entry.id
      }));
      
      setTradingData(formattedData);
      console.log(formattedData);
      showNotification(`Loaded ${formattedData.length} entries from database`, 'success');
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      setIsConnected(false);
      setConnectionMessage('Error loading data');
      showNotification('Error loading data. Check your API key and connection.', 'error');
      
      // Try to load from localStorage as fallback
      const localData = localStorage.getItem('tradingData');
      if (localData) {
        setTradingData(JSON.parse(localData));
        showNotification('Loaded cached data from local storage', 'info');
      }
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initializeApp = async () => {
      if (supabaseClient) {
        await loadDataFromSupabase();
        setIsConnected(true);
        setConnectionMessage('');
      } else {
        setIsConnected(false);
        setConnectionMessage('No database connection (check .env file)');
        showNotification('No database connection.', 'warning');
      }
    };

    initializeApp();
  }, []);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    const { rating, wakeUpTime, bedTime, date, notes } = formData;
    
    // Calculate hours awake before 9:30 AM
    const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
    const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
    const targetTimeMinutes = 9 * 60 + 30; // 9:30 AM
    const diffMinutes = targetTimeMinutes - wakeTimeMinutes;
    const hoursAwake = diffMinutes / 60;
    
    // Calculate hours of sleep if bedtime is provided
    let hoursSlept = null;
    if (bedTime) {
      console.log('bedTime', bedTime);
      const [bedHours, bedMinutes] = bedTime.split(':').map(Number);
      const bedTimeMinutes = bedHours * 60 + bedMinutes;
      
      let sleepMinutes;
      if (wakeTimeMinutes >= bedTimeMinutes) {
        sleepMinutes = wakeTimeMinutes - bedTimeMinutes;
      } else {
        // Slept before midnight
        sleepMinutes = (24 * 60 - bedTimeMinutes) + wakeTimeMinutes;
      }
      hoursSlept = sleepMinutes / 60;
    }
    
    // Create data entry for Supabase
    const supabaseEntry = {
      rating: rating,
      hours_awake: hoursAwake,
      hours_slept: hoursSlept,
      date: date,
      notes: notes || null,
      timestamp: new Date().toISOString()
    };

    console.log(supabaseEntry);
    
    // Save to Supabase
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from(TRADING_TABLE)
          .insert([supabaseEntry])
          .select();
        
        if (error) throw error;
        
        // Add to local data array with Supabase ID
        const entry = {
          rating: rating,
          hoursAwake: hoursAwake,
          hoursSlept: hoursSlept,
          date: date,
          notes: notes,
          timestamp: data[0].timestamp,
          id: data[0].id
        };
        setTradingData(prev => [...prev, entry]);
        
        showNotification('Entry added successfully!', 'success');
        
        // Rain down cat emojis based on rating!
        setCatRainRating(rating);
        setShowCatRain(true);
        setTimeout(() => setShowCatRain(false), 5000);
      } catch (error) {
        console.error('Error saving to Supabase:', error);
        showNotification('Error saving entry. Please try again.', 'error');
      }
    } 
  };

  // Delete data point
  const handleDeleteEntry = async (index) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    const dataPoint = tradingData[index];
    
    if (supabaseClient && dataPoint.id) {
      try {
        // Delete from Supabase
        const { error } = await supabaseClient
          .from(TRADING_TABLE)
          .delete()
          .eq('id', dataPoint.id);
        
        if (error) throw error;
        
        // Remove from local array
        setTradingData(prev => prev.filter((_, i) => i !== index));
        showNotification('Entry deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting from Supabase:', error);
        showNotification('Error deleting entry. Please try again.', 'error');
      }
    } else {
      // Delete from localStorage
      const newData = tradingData.filter((_, i) => i !== index);
      setTradingData(newData);
      localStorage.setItem('tradingData', JSON.stringify(newData));
      showNotification('Entry deleted from local storage!', 'info');
    }
  };

  // Export data
  const handleExportData = () => {
    if (tradingData.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Convert to CSV
    const headers = ['Date', 'Rating', 'Hours Awake', 'Hours Slept', 'Notes'];
    const rows = tradingData.map(entry => [
      entry.date,
      entry.rating,
      entry.hoursAwake,
      entry.hoursSlept !== null ? entry.hoursSlept : '',
      entry.notes || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `trading_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Data exported successfully!', 'success');
  };

  // Clear all data
  const handleClearData = async () => {
    if (tradingData.length === 0) {
      alert('No data to clear');
      return;
    }
    
    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      if (supabaseClient) {
        try {
          // Delete all records from Supabase
          const { error } = await supabaseClient
            .from(TRADING_TABLE)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
          
          if (error) throw error;
          
          setTradingData([]);
          showNotification('All data cleared from database!', 'info');
        } catch (error) {
          console.error('Error clearing data from Supabase:', error);
          showNotification('Error clearing data. Please try again.', 'error');
        }
      } else {
        // Fallback to localStorage
        setTradingData([]);
        localStorage.removeItem('tradingData');
        showNotification('All local data cleared!', 'info');
      }
    }
  };

  return (
    <div className="container">
      <h1>trading day performance tracker ❤️</h1>
      
      <div className="content-wrapper">
        <div className="form-section">
          <h2>how was your day?</h2>
          <TradingForm onSubmit={handleFormSubmit} />
          <DataActions 
            onExport={handleExportData}
            onClear={handleClearData}
          />
          <div 
            id="connectionStatus" 
            style={{ 
              fontSize: '0.9em', 
              marginTop: '1rem',
              color: isConnected ? '#4ade80' : '#f87171' 
            }}
          >
            {isConnected ? '🟢 connected' : '🔴 ' + (connectionMessage || 'Not connected to database (using local storage)')}
          </div>
        </div>
        
        <div className="chart-section">
          <h2>in two charts:</h2>
          <p className="chart-info">performance x hours awake before 9:30 AM</p>
          <PerformanceToHrsAwakeBefore930Chart 
            data={tradingData}
            onDeleteEntry={handleDeleteEntry}
          />
          <p className="chart-info">performance x hours slept</p>
          <PerformanceToHrsSleptChart 
            data={tradingData}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>
      </div>
      
      {showCatRain && <CatRain rating={catRainRating} />}
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;


