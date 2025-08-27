// Initialize data storage
let tradingData = JSON.parse(localStorage.getItem('tradingData')) || [];

// Chart configuration
let performanceChart = null;

// Set today's date as default
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Initialize chart
    initializeChart();
    updateChart();
});

// Form submission handler
document.getElementById('tradingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const rating = parseFloat(document.getElementById('rating').value);
    const hoursAwake = parseFloat(document.getElementById('hoursAwake').value);
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value;
    
    // Validate input
    if (rating < 1 || rating > 10) {
        alert('Rating must be between 1 and 10');
        return;
    }
    
    if (hoursAwake < 0 || hoursAwake > 24) {
        alert('Hours awake must be between 0 and 24');
        return;
    }
    
    // Create data entry
    const entry = {
        rating: rating,
        hoursAwake: hoursAwake,
        date: date,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Add to data array
    tradingData.push(entry);
    
    // Save to localStorage
    localStorage.setItem('tradingData', JSON.stringify(tradingData));
    
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

                            const lines = [
                                `Rating: ${dataPoint.rating}`,
                                `Hours Awake: ${dataPoint.hoursAwake}`,
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
                        text: 'Hours Awake Before 9:30 AM',
                        font: {
                            size: 13,
                            weight: 400
                        },
                        color: '#666'
                    },
                    min: 0,
                    suggestedMax: 3,
                    ticks: {
                        stepSize: 0.2,
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
document.getElementById('clearData').addEventListener('click', function() {
    if (tradingData.length === 0) {
        alert('No data to clear');
        return;
    }
    
    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
        tradingData = [];
        localStorage.removeItem('tradingData');
        updateChart();
        showNotification('All data cleared!', 'info');
    }
});

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
