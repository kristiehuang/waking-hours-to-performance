import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function PerformanceToHrsAwakeBefore930Chart({ data, onDeleteEntry }) {
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  const tooltipRef = useRef({ data: null, position: { x: 0, y: 0 } });
  const hideTimeoutRef = useRef(null);
  const isTooltipHoveredRef = useRef(false);

  // Convert data to chart format
  const chartData = {
    datasets: [{
      label: 'Trading Performance',
      data: data.map(entry => ({
        x: entry.hoursAwake,
        y: entry.rating
      })),
      backgroundColor: 'rgba(26, 26, 26, 0.7)',
      borderColor: 'rgba(26, 26, 26, 1)',
      borderWidth: 1,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: 'rgba(255, 107, 107, 0.8)',
      pointHoverBorderColor: 'rgba(255, 107, 107, 1)',
      pointHoverBorderWidth: 2
    }]
  };

  const options = {
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
        enabled: false,
        external: function(context) {
          const tooltipModel = context.tooltip;
          
          if (tooltipModel.opacity === 0) {
            // Clear any existing timeout
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
            
            // Set a timeout to hide tooltip (unless hovering over it)
            hideTimeoutRef.current = setTimeout(() => {
              if (!isTooltipHoveredRef.current) {
                if (tooltipRef.current.data !== null) {
                  tooltipRef.current.data = null;
                  setTooltipData(null);
                }
              }
            }, 100);
            return;
          }
          
          // Clear hide timeout if showing tooltip
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }

          if (tooltipModel.body) {
            const dataIndex = tooltipModel.dataPoints[0].dataIndex;
            const dataPoint = data[dataIndex];
            
            const position = context.chart.canvas.getBoundingClientRect();
            const newX = position.left + tooltipModel.caretX;
            const newY = position.top + tooltipModel.caretY;
            
            // Only update if position has actually changed
            if (tooltipRef.current.position.x !== newX || tooltipRef.current.position.y !== newY) {
              tooltipRef.current.position = { x: newX, y: newY };
              setTooltipPosition({ x: newX, y: newY });
            }
            
            // Only update tooltip data if it's different
            if (!tooltipRef.current.data || 
                tooltipRef.current.data.dataIndex !== dataIndex) {
              tooltipRef.current.data = { dataPoint, dataIndex };
              setTooltipData({ dataPoint, dataIndex });
            }
          }
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
  };

  // Click outside to hide tooltip
  useEffect(() => {
    const handleClick = (e) => {
      if (tooltipData && !e.target.closest('.custom-tooltip-awake') && !e.target.closest('canvas')) {
        setTooltipData(null);
        isTooltipHoveredRef.current = false;
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [tooltipData]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const formatTimeString = (hoursAwake) => {
    const totalMinutes = Math.round(hoursAwake * 60);
    const isNegative = totalMinutes < 0;
    const absTotalMinutes = Math.abs(totalMinutes);
    const displayHours = Math.floor(absTotalMinutes / 60);
    const displayMinutes = absTotalMinutes % 60;
    
    if (isNegative) {
      return displayMinutes > 0 
        ? `-${displayHours}h ${displayMinutes}m (woke up late!)` 
        : `-${displayHours}h (woke up late!)`;
    } else {
      return displayMinutes > 0 
        ? `${displayHours}h ${displayMinutes}m` 
        : `${displayHours}h`;
    }
  };

  const formatSleepString = (hoursSlept) => {
    if (hoursSlept === null || hoursSlept === undefined) return '';
    
    const sleepTotalMinutes = Math.round(hoursSlept * 60);
    const sleepHours = Math.floor(sleepTotalMinutes / 60);
    const sleepMinutes = sleepTotalMinutes % 60;
    return sleepMinutes > 0 
      ? `${sleepHours}h ${sleepMinutes}m` 
      : `${sleepHours}h`;
  };

  return (
    <>
      <div className="chart-container">
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
      
      {tooltipData && (
        <div 
          className="custom-tooltip-awake"
          onMouseEnter={() => {
            isTooltipHoveredRef.current = true;
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isTooltipHoveredRef.current = false;
            // Hide tooltip after a small delay when mouse leaves
            hideTimeoutRef.current = setTimeout(() => {
              setTooltipData(null);
              tooltipRef.current.data = null;
            }, 300);
          }}
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 'px',
            top: tooltipPosition.y + 'px',
            pointerEvents: 'auto',
            zIndex: 1000,
            transition: 'opacity 0.2s ease',
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '13px',
            minWidth: '200px'
          }}>
            <div style={{ marginBottom: '6px' }}>
              <strong>Rating:</strong> {tooltipData.dataPoint.rating}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <strong>Time Awake:</strong> {formatTimeString(tooltipData.dataPoint.hoursAwake)}
            </div>
            {tooltipData.dataPoint.hoursSlept && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Sleep:</strong> {formatSleepString(tooltipData.dataPoint.hoursSlept)}
              </div>
            )}
            <div style={{ marginBottom: '6px' }}>
              <strong>Date:</strong> {tooltipData.dataPoint.date}
            </div>
            {tooltipData.dataPoint.notes && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Notes:</strong> {tooltipData.dataPoint.notes}
              </div>
            )}
            <button 
              onClick={() => {
                onDeleteEntry(tooltipData.dataIndex);
                setTooltipData(null);
              }}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '4px',
                width: '100%'
              }}
              onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.background = '#dc2626'}
            >
              Delete Entry
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PerformanceToHrsAwakeBefore930Chart;


