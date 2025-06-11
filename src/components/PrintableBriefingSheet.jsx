import React from 'react';

const PrintableBriefingSheet = ({
  lunch,
  dinner,
  forecast,
  actual,
  variance,
  varianceNotes,
  manager,
  notes,
  shoutouts,
  callouts,
  date
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '1.5rem', fontSize: '14px', lineHeight: '1.6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '20px' }}>📋 Daily Briefing Sheet</h1>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
          <p><strong>Manager:</strong> {manager}</p>
        </div>
      </div>

      <hr style={{ margin: '1rem 0' }} />

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '0.5rem' }}>📊 Forecasted Volume</h2>
        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
          <li><strong>🌞 Lunch:</strong> {lunch} guests</li>
          <li><strong>🌙 Dinner:</strong> {dinner} guests</li>
        </ul>
      </section>

      <hr style={{ margin: '1rem 0' }} />

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '0.5rem' }}>💰 Yesterday's Forecast vs Actual</h2>
        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
          <li><strong>Forecasted:</strong> {forecast}</li>
          <li><strong>Actual:</strong> {actual}</li>
          <li><strong>Variance:</strong> {variance}</li>
        </ul>
        <p><strong>Variance Notes:</strong> {varianceNotes}</p>
      </section>

      <hr style={{ margin: '1rem 0' }} />

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '0.5rem' }}>🎉 Team Shout-Out</h2>
        <p>{shoutouts || '—'}</p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '0.5rem' }}>📣 Team Call-Out</h2>
        <p>{callouts || '—'}</p>
      </section>

      <section>
        <h2 style={{ fontSize: '16px', marginBottom: '0.5rem' }}>📝 Notes to Team</h2>
        <p>{notes || '—'}</p>
      </section>
    </div>
  );
};

export default PrintableBriefingSheet;
