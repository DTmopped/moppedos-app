import React from 'react';

const PrintableBriefingSheet = (props) => {
  const {
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
    date,
  } = props;

  const displayValue = (val, suffix = '') =>
    val && val.toString().trim() !== '' ? `${val}${suffix}` : '—';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>📋 Daily Briefing Sheet</h1>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p><strong>Date:</strong> {date || '—'}</p>
        <p><strong>Manager on Duty:</strong> {manager || '—'}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <section style={{ width: '48%' }}>
          <h2>📊 Forecasted Volume</h2>
          <p><strong>🌞 Lunch (AM):</strong> {displayValue(lunch, ' guests')}</p>
          <p><strong>🌙 Dinner (PM):</strong> {displayValue(dinner, ' guests')}</p>
        </section>

        <section style={{ width: '48%' }}>
          <h2>💰 Forecast vs Actual</h2>
          <p><strong>Forecasted Sales:</strong> {displayValue(forecast, '$')}</p>
          <p><strong>Actual Sales:</strong> {displayValue(actual, '$')}</p>
          <p><strong>Variance:</strong> {variance || 'N/A'}</p>
          <p><strong>Variance Notes:</strong> {varianceNotes || '—'}</p>
        </section>
      </div>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>🎉 Team Shout-Out</h2>
        <p><strong>Shout-Out:</strong> {shoutouts || '—'}</p>
      </section>

      <section>
        <h2>📣 Team Call-Out</h2>
        <p><strong>Call-Out:</strong> {callouts || '—'}</p>
      </section>

      <section>
        <h2>📝 Notes to Team</h2>
        <p><strong>Notes:</strong> {notes || '—'}</p>
      </section>
    </div>
  );
};

export default PrintableBriefingSheet;
