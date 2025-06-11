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
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>📋 Daily Briefing Sheet</h1>

      <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
      <p><strong>Manager on Duty:</strong> {manager}</p>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>📊 Today's Forecasted Volume</h2>
        <p><strong>🌞 Lunch (AM):</strong> {lunch} guests</p>
        <p><strong>🌙 Dinner (PM):</strong> {dinner} guests</p>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>💰 Yesterday's Forecast vs Actual</h2>
        <p><strong>Forecasted:</strong> {forecast}</p>
        <p><strong>Actual:</strong> {actual}</p>
        <p><strong>Variance:</strong> {variance}</p>
        <p><strong>Variance Notes:</strong> {varianceNotes}</p>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>📣 Team Shout-outs</h2>
        <p>{shoutouts}</p>
      </section>

      <section>
        <h2>🚨 Daily Callouts</h2>
        <p>{callouts}</p>
      </section>

      <section>
        <h2>📝 Notes to Team</h2>
        <p>{notes}</p>
      </section>
    </div>
  );
};

export default PrintableBriefingSheet;
