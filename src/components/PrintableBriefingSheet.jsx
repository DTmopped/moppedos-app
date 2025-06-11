
import React from 'react';

const cellStyle = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

const sectionTitleStyle = {
  backgroundColor: '#f2f2f2',
  padding: '6px 10px',
  fontWeight: 'bold',
  borderBottom: '1px solid #ccc',
};

const PrintableBriefingSheet = ({ data }) => {
  if (!data) return null;

  const { lunch, dinner, forecast, actual, variance, varianceNotes, manager, notes, shoutouts, callouts, date } = data;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', fontSize: '14px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>📋 Daily Briefing Sheet</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <tbody>
          <tr><td style={cellStyle}><strong>Date:</strong></td><td style={cellStyle}>{new Date(date).toLocaleDateString()}</td></tr>
          <tr><td style={cellStyle}><strong>Manager on Duty:</strong></td><td style={cellStyle}>{manager}</td></tr>
        </tbody>
      </table>

      <div style={sectionTitleStyle}>📊 Forecasted Volume</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <tbody>
          <tr><td style={cellStyle}>🌞 Lunch (AM)</td><td style={cellStyle}>{lunch} guests</td></tr>
          <tr><td style={cellStyle}>🌙 Dinner (PM)</td><td style={cellStyle}>{dinner} guests</td></tr>
        </tbody>
      </table>

      <div style={sectionTitleStyle}>💰 Yesterday's Forecast vs Actual</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <tbody>
          <tr><td style={cellStyle}>Forecasted Sales</td><td style={cellStyle}>{forecast}</td></tr>
          <tr><td style={cellStyle}>Actual Sales</td><td style={cellStyle}>{actual}</td></tr>
          <tr><td style={cellStyle}>Variance</td><td style={cellStyle}>{variance}</td></tr>
          <tr><td style={cellStyle}>Variance Notes</td><td style={cellStyle}>{varianceNotes}</td></tr>
        </tbody>
      </table>

      <div style={sectionTitleStyle}>🎉 Team Shout-Out</div>
      <p style={{ padding: '8px', border: '1px solid #ddd', marginBottom: '1.5rem' }}>{shoutouts}</p>

      <div style={sectionTitleStyle}>📣 Team Call-Out</div>
      <p style={{ padding: '8px', border: '1px solid #ddd', marginBottom: '1.5rem' }}>{callouts}</p>

      <div style={sectionTitleStyle}>📝 Notes to Team</div>
      <p style={{ padding: '8px', border: '1px solid #ddd' }}>{notes}</p>
    </div>
  );
};

export default PrintableBriefingSheet;
