// Import from supabase-config
import { supabaseClient, TRADING_TABLE } from './supabase-config.js';

// Initialize data storage
let tradingData = [];

// Chart configuration
let performanceChart = null;

// Update connection status display
function updateConnectionStatus(connected, message = '') {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.innerHTML = '🟢 connected' + (message ? ` - ${message}` : '');
            statusElement.style.color = '#4ade80';
        } else {
            statusElement.innerHTML = '🔴 ' + (message || 'Not connected to database (using local storage)');
            statusElement.style.color = '#f87171';
        }
    }
}

// Load data from Supabase
async function loadDataFromSupabase() {
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
        tradingData = data.map(entry => ({
            rating: parseFloat(entry.rating),
            hoursAwake: parseFloat(entry.hours_awake),
            date: entry.date,
            notes: entry.notes,
            timestamp: entry.timestamp,
            id: entry.id // Keep the Supabase ID for updates/deletes
        }));
        
        updateChart();
        showNotification(`Loaded ${tradingData.length} entries from database`, 'success');
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        updateConnectionStatus(false, 'Error loading data');
        showNotification('Error loading data. Check your API key and connection.', 'error');
        
        // Try to load from localStorage as fallback
        const localData = localStorage.getItem('tradingData');
        if (localData) {
            tradingData = JSON.parse(localData);
            updateChart();
            showNotification('Loaded cached data from local storage', 'info');
        }
    }
}

// Set today's date as default
document.addEventListener('DOMContentLoaded', async function() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Add event listener for wake-up time input
    const wakeUpTimeInput = document.getElementById('wakeUpTime');
    const hoursInput = document.getElementById('hoursAwake');
    const minutesInput = document.getElementById('minutesAwake');
    
    // Function to update wake-up time from hours/minutes
    function updateWakeUpTime() {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
    
        if (hoursInput.value === '' && minutesInput.value === '') {
            // Re-add required to wake-up time when manual inputs are cleared
            wakeUpTimeInput.setAttribute('required', '');
        } else {
            // Calculate wake-up time by subtracting from 9:30 AM
            const targetMinutes = 9 * 60 + 30; // 9:30 AM in minutes
            const awakeMinutes = hours * 60 + minutes;
            const wakeMinutes = targetMinutes - awakeMinutes;
            
            if (wakeMinutes < 0) {
                const wakeHours = Math.ceil(wakeMinutes / 60);
                const wakeMins = wakeMinutes % 60;
                wakeUpTimeInput.value = `${String(wakeHours).padStart(2, '0')}:${String(wakeMins).padStart(2, '0')}`;
            } else {
                const wakeHours = Math.floor(wakeMinutes / 60);
                const wakeMins = wakeMinutes % 60;
                wakeUpTimeInput.value = `${String(wakeHours).padStart(2, '0')}:${String(wakeMins).padStart(2, '0')}`;
            }
            
            // Remove required from wake-up time when manual inputs are used
            wakeUpTimeInput.removeAttribute('required');
        }
 
    }
    
    wakeUpTimeInput.addEventListener('change', function() {
        if (this.value) {
            // Calculate difference between wake-up time and 9:30 AM
            const [wakeHours, wakeMinutes] = this.value.split(':').map(Number);
            const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
            const targetTimeMinutes = 9 * 60 + 30; // 9:30 AM in minutes
            
            let diffMinutes = targetTimeMinutes - wakeTimeMinutes;
            
            // Allow negative values for late wake-ups (after 9:30 AM)
            // diffMinutes will be negative if wake-up is after 9:30 AM
            
            // Convert to hours and minutes (handle negative values properly)
            let hours, minutes;
            if (diffMinutes >= 0) {
                hours = Math.floor(diffMinutes / 60);
                minutes = diffMinutes % 60;
            } else {
                // For negative values, we need to handle the math differently
                hours = Math.ceil(diffMinutes / 60);
                minutes = diffMinutes % 60;
            }
            
            // Update the manual input fields
            hoursInput.value = hours;
            minutesInput.value = minutes;
        }
    });
    
    // Update wake-up time when manual inputs change
    hoursInput.addEventListener('input', function() {
        updateWakeUpTime();
    });
    
    minutesInput.addEventListener('input', function() {
        updateWakeUpTime();
    });
    
    // Initialize chart
    initializeChart();
    
    // Check if Supabase is available
    if (supabaseClient) {
        // Load data from Supabase
        await loadDataFromSupabase();
        updateConnectionStatus(true);
    } else {
        updateConnectionStatus(false, 'No database connection (check .env file)');
        showNotification('No database connection. Data will be stored locally.', 'warning');
        
        // Try to load from localStorage as fallback
        const localData = localStorage.getItem('tradingData');
        if (localData) {
            tradingData = JSON.parse(localData);
            updateChart();
        }
    }
});

// Form submission handler
document.getElementById('tradingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const rating = parseFloat(document.getElementById('rating').value);
    const wakeUpTime = document.getElementById('wakeUpTime').value;
    let hoursAwake;
    
    // Check if wake-up time is provided
    if (wakeUpTime) {
        // Calculate from wake-up time
        const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
        const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
        const targetTimeMinutes = 9 * 60 + 30; // 9:30 AM
        const diffMinutes = targetTimeMinutes - wakeTimeMinutes;
        hoursAwake = diffMinutes / 60;
    } else {
        // Use manual hours/minutes
        const hours = parseInt(document.getElementById('hoursAwake').value) || 0;
        const minutes = parseInt(document.getElementById('minutesAwake').value) || 0;
        hoursAwake = hours + (minutes / 60);
    }
    
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value;
    
    // Validate input
    if (rating < 1 || rating > 10) {
        alert('Rating must be between 1 and 10');
        return;
    }
    
    if (hoursAwake < -24) {
        alert('Time awake cannot be less than -24 hours');
        return;
    }
    
    if (hoursAwake > 24) {
        alert('Time awake cannot exceed 24 hours');
        return;
    }
    
    // Create data entry for Supabase
    const supabaseEntry = {
        rating: rating,
        hours_awake: hoursAwake,
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
                date: date,
                notes: notes,
                timestamp: data[0].timestamp,
                id: data[0].id
            };
            tradingData.push(entry);
            
            // Update chart
            updateChart();
            
            // Reset form
            this.reset();
            // Set date back to today
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            // Clear all time inputs
            document.getElementById('hoursAwake').value = '';
            document.getElementById('minutesAwake').value = '';
            document.getElementById('wakeUpTime').value = '';
            // Wake-up time is required by default
            document.getElementById('wakeUpTime').setAttribute('required', '');
            
            // Show success message
            showNotification('Entry added successfully!', 'success');
            
            // Rain down cat emojis based on rating!
            rainCatEmoji(rating);
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            showNotification('Error saving entry. Please try again.', 'error');
        }
    } else {
        // Fallback to localStorage if Supabase is not configured
        const entry = {
            rating: rating,
            hoursAwake: hoursAwake,
            date: date,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        tradingData.push(entry);
        localStorage.setItem('tradingData', JSON.stringify(tradingData));
        updateChart();
        this.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('hoursAwake').value = '';
        document.getElementById('minutesAwake').value = '';
        document.getElementById('wakeUpTime').value = '';
        document.getElementById('wakeUpTime').setAttribute('required', '');
        showNotification('Entry saved locally (no database connection)', 'warning');
        rainCatEmoji(rating);
    }
});

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    performanceChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Trading Performance',
                data: [],
                backgroundColor: 'rgba(26, 26, 26, 0.7)',
                borderColor: 'rgba(26, 26, 26, 1)',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: 'rgba(255, 107, 107, 0.8)',
                pointHoverBorderColor: 'rgba(255, 107, 107, 1)',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = tradingData[context.dataIndex];
                            
                            // Convert decimal hours back to hours and minutes for display
                            const totalMinutes = Math.round(dataPoint.hoursAwake * 60);
                            const isNegative = totalMinutes < 0;
                            const absTotalMinutes = Math.abs(totalMinutes);
                            const displayHours = Math.floor(absTotalMinutes / 60);
                            const displayMinutes = absTotalMinutes % 60;
                            let timeString;
                            
                            if (isNegative) {
                                timeString = displayMinutes > 0 
                                    ? `-${displayHours}h ${displayMinutes}m (woke up late!)` 
                                    : `-${displayHours}h (woke up late!)`;
                            } else {
                                timeString = displayMinutes > 0 
                                    ? `${displayHours}h ${displayMinutes}m` 
                                    : `${displayHours}h`;
                            }

                            const lines = [
                                `Rating: ${dataPoint.rating}`,
                                `Time Awake: ${timeString}`,
                                `Date: ${formatDate(dataPoint.date)}`,
                            ];
                            if (dataPoint.notes) {
                                lines.push(`Notes: ${dataPoint.notes}`);
                            }
                            return lines;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    padding: 12,
                    displayColors: false,
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hours Awake Before 9:30 AM (negative = woke up late)',
                        font: {
                            size: 13,
                            weight: 400
                        },
                        color: '#666'
                    },
                    min: -1,
                    suggestedMax: 3,
                    ticks: {
                        stepSize: 0.5,
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0',
                        borderColor: '#e0e0e0'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Trading Day Rating',
                        font: {
                            size: 13,
                            weight: 400
                        },
                        color: '#666'
                    },
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 1,
                        color: '#666'
                    },
                    grid: {
                        color: '#f0f0f0',
                        borderColor: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Update chart with data
function updateChart() {
    if (!performanceChart) return;
    
    // Convert data to chart format
    const chartData = tradingData.map(entry => ({
        x: entry.hoursAwake,
        y: entry.rating
    }));
    
    performanceChart.data.datasets[0].data = chartData;
    performanceChart.update();
}

// Export data functionality
document.getElementById('exportData').addEventListener('click', function() {
    if (tradingData.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Convert to CSV
    const headers = ['Date', 'Rating', 'Hours Awake', 'Notes'];
    const rows = tradingData.map(entry => [
        entry.date,
        entry.rating,
        entry.hoursAwake,
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
});

// Clear data functionality
document.getElementById('clearData').addEventListener('click', async function() {
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
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
                
                if (error) throw error;
                
                tradingData = [];
                updateChart();
                showNotification('All data cleared from database!', 'info');
            } catch (error) {
                console.error('Error clearing data from Supabase:', error);
                showNotification('Error clearing data. Please try again.', 'error');
            }
        } else {
            // Fallback to localStorage
            tradingData = [];
            localStorage.removeItem('tradingData');
            updateChart();
            showNotification('All local data cleared!', 'info');
        }
    }
});

// Note: API key is now managed through .env file with Vite

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Style based on type
    const colors = {
        success: '#1a1a1a',
        info: '#666666',
        warning: '#ff6b6b',
        error: '#ff6b6b'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${colors[type] || colors.info};
        color: white;
        padding: 12px 18px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Cat emoji rain function
function rainCatEmoji(rating) {
    // Select cat emojis based on trading day rating
    let catEmojis;
    
    if (rating > 6.5) {
        // Great day! Happy cats
        catEmojis = ['😹', '😻', '😼'];
    } else if (rating < 5) {
        // Tough day... sad/surprised cats
        catEmojis = ['🙀', '😿', '😽'];
    } else {
        // Average day, neutral cats
        catEmojis = ['😺', '😸'];
    }
    
    // Add the animation keyframes if not already added
    if (!document.getElementById('catRainAnimation')) {
        const style = document.createElement('style');
        style.id = 'catRainAnimation';
        style.textContent = `
            @keyframes catFall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(${window.innerHeight + 200}px) rotate(720deg);
                    opacity: 0;
                }
            }
            
            @keyframes catFallSwaying {
                0% {
                    transform: translateY(0) translateX(0) rotate(0deg);
                    opacity: 1;
                }
                25% {
                    transform: translateY(${window.innerHeight * 0.25}px) translateX(30px) rotate(180deg);
                }
                50% {
                    transform: translateY(${window.innerHeight * 0.5}px) translateX(-30px) rotate(360deg);
                }
                75% {
                    transform: translateY(${window.innerHeight * 0.75}px) translateX(20px) rotate(540deg);
                }
                100% {
                    transform: translateY(${window.innerHeight + 200}px) translateX(-20px) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create multiple cats for confetti effect
    const numberOfCats = 20; // Always maximum cats!
    
    for (let i = 0; i < numberOfCats; i++) {
        setTimeout(() => {
            // Pick a random cat emoji
            const randomCat = catEmojis[Math.floor(Math.random() * catEmojis.length)];
            
            // Create the emoji element
            const catDiv = document.createElement('div');
            catDiv.textContent = randomCat;
            
            // Random properties for variety
            const size = 2 + Math.random() * 2; // Size between 2-4rem
            const duration = 2.5 + Math.random() * 2; // Duration between 2.5-4.5s
            const delay = Math.random() * 0.3; // Small random delay
            const animation = Math.random() > 0.5 ? 'catFall' : 'catFallSwaying'; // Mix of animations
            
            catDiv.style.cssText = `
                position: fixed;
                font-size: ${size}rem;
                top: -100px;
                left: ${Math.random() * window.innerWidth}px;
                z-index: 9999;
                animation: ${animation} ${duration}s ease-in ${delay}s forwards;
                pointer-events: none;
            `;
            
            // Add the cat to the page
            document.body.appendChild(catDiv);
            
            // Remove the cat after animation completes
            setTimeout(() => {
                if (catDiv.parentNode) {
                    document.body.removeChild(catDiv);
                }
            }, (duration + delay) * 1000 + 100);
        }, i * 50); // Stagger the creation for a cascade effect
    }
}
