import React from 'react';

const PrintableBriefingSheet = ({
  lunch = '—',
  dinner = '—',
  forecast = '—',
  actual = '—',
  variance = 'N/A',
  varianceNotes = '',
  manager = '',
  notes = '',
  shoutouts = '',
  callouts = '',
  date = ''
}) => {

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>📋 Daily Briefing Sheet</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td><strong>Date:</strong></td>
            <td>{date}</td>
          </tr>
          <tr>
            <td><strong>Manager on Duty:</strong></td>
            <td>{manager}</td>
          </tr>
        </tbody>
      </table>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>📊 Forecasted Volume</h2>
        <p><strong>🌞 Lunch:</strong> {lunch} guests</p>
        <p><strong>🌙 Dinner:</strong> {dinner} guests</p>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>💰 Forecast vs Actual</h2>
        <p><strong>Forecasted Sales:</strong> ${forecast}</p>
        <p><strong>Actual Sales:</strong> ${actual}</p>
        <p><strong>Variance:</strong> {variance}</p>
        <p><strong>Variance Notes:</strong> {varianceNotes}</p>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

    <section>
       <h2>🎉 Team Shout-Out</h2>
       <p><strong>Shout-Out:</strong> {shoutouts}</p>
    </section>

    <section>
       <h2>📣 Team Call-Out</h2>
       <p><strong>Call-Out:</strong> {callouts}</p>
   </section>

   <section>
       <h2>📝 Notes to Team</h2>
       <p><strong>Notes:</strong> {notes}</p>
   </section>
    </div>
  );
};

export default PrintableBriefingSheet;
