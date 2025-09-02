import React, { useState, useEffect } from 'react';

function TradingForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    rating: '',
    wakeUpTime: '',
    bedTime: '',
    date: '',
    notes: ''
  });

  // Set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const rating = parseFloat(formData.rating);
    
    // Validate input
    if (rating < 1 || rating > 10) {
      alert('Rating must be between 1 and 10');
      return;
    }
    
    // Calculate hours awake to validate
    const [wakeHours, wakeMinutes] = formData.wakeUpTime.split(':').map(Number);
    const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
    const targetTimeMinutes = 9 * 60 + 30; // 9:30 AM
    const diffMinutes = targetTimeMinutes - wakeTimeMinutes;
    const hoursAwake = diffMinutes / 60;
    
    if (hoursAwake < -24) {
      alert('Time awake cannot be less than -24 hours');
      return;
    }
    
    if (hoursAwake > 24) {
      alert('Time awake cannot exceed 24 hours');
      return;
    }
    
    onSubmit({
      ...formData,
      rating
    });
    
    // Reset form
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      rating: '',
      wakeUpTime: '',
      bedTime: '',
      date: today,
      notes: ''
    });
  };

  return (
    <form id="tradingForm" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="rating">trading day rating (1-10):</label>
        <input 
          type="number" 
          id="rating" 
          name="rating" 
          min="1" 
          max="10" 
          step="0.1" 
          required
          placeholder="e.g., 7.5"
          value={formData.rating}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="wakeUpTime">wake-up time:</label>
        <input 
          type="time" 
          id="wakeUpTime" 
          name="wakeUpTime"
          required
          value={formData.wakeUpTime}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="bedTime">bedtime (optional):</label>
        <input 
          type="time" 
          id="bedTime" 
          name="bedTime"
          value={formData.bedTime}
          onChange={handleChange}
        />
        <span style={{ fontSize: '0.85em', marginLeft: '10px', color: '#666' }}>
          previous night
        </span>
      </div>
      
      <div className="form-group">
        <label htmlFor="date">date:</label>
        <input 
          type="date" 
          id="date" 
          name="date" 
          required
          value={formData.date}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="notes">notes:</label>
        <textarea 
          id="notes" 
          name="notes" 
          rows="3"
          placeholder="notes n comments"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>
      
      <button type="submit">add entry</button>
    </form>
  );
}

export default TradingForm;


