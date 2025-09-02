import React from 'react';

function DataActions({ onExport, onClear }) {
  return (
    <div className="data-actions">
      <button 
        id="exportData" 
        className="secondary-btn"
        onClick={onExport}
      >
        export to csv
      </button>
      <button 
        id="clearData" 
        className="danger-btn"
        onClick={onClear}
      >
        clear all data {'>:('}
      </button>
    </div>
  );
}

export default DataActions;


