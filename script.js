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
            hoursSlept: entry.hours_slept ? parseFloat(entry.hours_slept) : null,
            date: entry.date,
            notes: entry.notes,
            timestamp: entry.timestamp,
            id: entry.id // Keep the Supabase ID for updates/deletes
        }));
        
        updateChart();
        console.log(tradingData);
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
    
    // Initialize chart
    initializeChart();
    
    // Add event listener to hide tooltip when clicking outside
    document.addEventListener('click', function(e) {
        const tooltipEl = document.getElementById('chartjs-tooltip');
        if (tooltipEl && !tooltipEl.contains(e.target) && !e.target.closest('canvas')) {
            tooltipEl.style.opacity = 0;
        }
    });
    
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
    const bedTime = document.getElementById('bedTime').value;
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value;
    
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
        
        // Calculate sleep duration
        // If wake up time is after bedtime (i.e. 9:30am is after 1:00am), it means they slept past minute. Just subtract
        // If wake up time is before bedtime (i.e. 23:00 is after 9:30am), it means they slept before midnight
        let sleepMinutes;
        if (wakeTimeMinutes >= bedTimeMinutes) {
            sleepMinutes = wakeTimeMinutes - bedTimeMinutes;
        } else {
            // Slept before midnight
            sleepMinutes = (24 * 60 - bedTimeMinutes) + wakeTimeMinutes;
        }
        hoursSlept = sleepMinutes / 60;
    }
    
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
            tradingData.push(entry);
            
            // Update chart
            updateChart();
            
            // Reset form
            this.reset();
            // Set date back to today
            document.getElementById('date').value = new Date().toISOString().split('T')[0];

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
            hoursSlept: hoursSlept,
            date: date,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        tradingData.push(entry);
        localStorage.setItem('tradingData', JSON.stringify(tradingData));
        updateChart();
        this.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
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
                    enabled: false, // Disable default tooltip
                    external: function(context) {
                        // Custom HTML tooltip
                        let tooltipEl = document.getElementById('chartjs-tooltip');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
                            tooltipEl.innerHTML = '<div></div>';
                            document.body.appendChild(tooltipEl);
                        }

                        // Hide if no tooltip
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            // Add a small delay before hiding to allow hovering over tooltip
                            setTimeout(() => {
                                if (!tooltipEl.matches(':hover')) {
                                    tooltipEl.style.opacity = 0;
                                }
                            }, 100);
                            return;
                        }

                        // Set caret Position
                        tooltipEl.classList.remove('above', 'below', 'no-transform');
                        if (tooltipModel.yAlign) {
                            tooltipEl.classList.add(tooltipModel.yAlign);
                        } else {
                            tooltipEl.classList.add('no-transform');
                        }

                        // Set content
                        if (tooltipModel.body) {
                            const dataIndex = tooltipModel.dataPoints[0].dataIndex;
                            const dataPoint = tradingData[dataIndex];
                            
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

                            // Escape HTML to prevent XSS
                            const escapeHtml = (text) => {
                                const div = document.createElement('div');
                                div.textContent = text;
                                return div.innerHTML;
                            };
                            
                            // Format sleep hours if available
                            let sleepString = '';
                            if (dataPoint.hoursSlept !== null && dataPoint.hoursSlept !== undefined) {
                                const sleepTotalMinutes = Math.round(dataPoint.hoursSlept * 60);
                                const sleepHours = Math.floor(sleepTotalMinutes / 60);
                                const sleepMinutes = sleepTotalMinutes % 60;
                                sleepString = sleepMinutes > 0 
                                    ? `${sleepHours}h ${sleepMinutes}m` 
                                    : `${sleepHours}h`;
                            }
                            
                            const innerHtml = `
                                <div style="background: rgba(0, 0, 0, 0.9); color: white; padding: 12px; border-radius: 4px; font-size: 13px; min-width: 200px;">
                                    <div style="margin-bottom: 6px"><strong>Rating:</strong> ${dataPoint.rating}</div>
                                    <div style="margin-bottom: 6px"><strong>Time Awake:</strong> ${timeString}</div>
                                    ${sleepString ? `<div style="margin-bottom: 6px"><strong>Sleep:</strong> ${sleepString}</div>` : ''}
                                    <div style="margin-bottom: 6px"><strong>Date:</strong> ${dataPoint.date}</div>
                                    ${dataPoint.notes ? `<div style="margin-bottom: 8px"><strong>Notes:</strong> ${escapeHtml(dataPoint.notes)}</div>` : ''}
                                    <button onclick="deleteDataPoint(${dataIndex})" style="
                                        background: #dc2626;
                                        color: white;
                                        border: none;
                                        padding: 4px 12px;
                                        border-radius: 3px;
                                        cursor: pointer;
                                        font-size: 12px;
                                        margin-top: 4px;
                                        width: 100%;
                                    ">Delete Entry</button>
                                </div>
                            `;

                            tooltipEl.innerHTML = innerHtml;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

                        // Display, position, and set styles for font
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                        tooltipEl.style.font = bodyFont.string;
                        tooltipEl.style.pointerEvents = 'auto';
                        tooltipEl.style.zIndex = '1000';
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
                    suggestedMin: -1,
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

// Delete data point function (global for tooltip access)
window.deleteDataPoint = async function(index) {
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
            tradingData.splice(index, 1);
            updateChart();
            showNotification('Entry deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
            showNotification('Error deleting entry. Please try again.', 'error');
        }
    } else {
        // Delete from localStorage
        tradingData.splice(index, 1);
        localStorage.setItem('tradingData', JSON.stringify(tradingData));
        updateChart();
        showNotification('Entry deleted from local storage!', 'info');
    }
    
    // Hide tooltip
    const tooltipEl = document.getElementById('chartjs-tooltip');
    if (tooltipEl) {
        tooltipEl.style.opacity = 0;
    }
};

// Export data functionality
document.getElementById('exportData').addEventListener('click', function() {
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
