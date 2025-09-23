import React from 'react';

const ForecastResultsTable = ({ forecastDataUI }) => {
  if (!forecastDataUI || forecastDataUI.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
        Generated Forecast
      </h3>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Day</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Pax</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Guests</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">AM/PM</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Sales</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Food</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Bev</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Labor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {forecastDataUI.map((row, index) => (
              <tr key={index} className={row.isTotal ? "bg-gray-100 font-bold" : "hover:bg-gray-50"}>
                <td className="px-4 py-2 font-medium">{row.day}</td>
                <td className="px-4 py-2 text-right">{row.pax?.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{row.guests?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-2 text-right">{row.isTotal ? '—' : `${row.amGuests}/${row.pmGuests}`}</td>
                <td className="px-4 py-2 text-right font-semibold text-green-600">${row.sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-2 text-right">${row.food?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-2 text-right">${row.bev?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-2 text-right">${row.labor?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastResultsTable;


