import React from "react";

const PrintableFvaDashboard = ({ combinedData, printDate, targets, lastMonthSummary }) => {
  if (!combinedData || combinedData.length === 0) {
    return <div className="p-4">Loading print data or no FVA data available...</div>;
  }

  const formatDateForPrint = (dateString) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPrintClass = (pct, target) => {
    if (isNaN(pct) || !target) return "";
    return pct > target ? "print-bg-red" : "print-bg-green";
  };

  const salesVariance = lastMonthSummary
    ? ((lastMonthSummary.total_actual_sales - lastMonthSummary.total_forecast_sales) / lastMonthSummary.total_forecast_sales) * 100
    : 0;

  return (
    <div className="printable-fva-dashboard-container p-4 font-sans">
      <style>
        {`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #fff !important;
            color: #000 !important;
            font-family: Arial, sans-serif;
            font-size: 9pt !important;
          }
          .printable-fva-dashboard-container {
            width: 100%;
          }
          .print-header-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .print-header-date {
            text-align: center;
            font-size: 8pt;
            margin-bottom: 15px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 9pt;
          }
          .summary-cell {
            flex: 1;
            margin-right: 10px;
            border: 1px solid #ccc;
            padding: 6px;
            background-color: #f9f9f9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          td.text-right, th.text-right {
            text-align: right;
          }
          .print-bg-red {
            background-color: #ffe0e0 !important;
          }
          .print-bg-green {
            background-color: #e0ffe0 !important;
          }
          .alert-icon {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 4px;
          }
          .alert-error {
            background-color: #ff4d4d !important;
          }
          .alert-success {
            background-color: #4caf50 !important;
          }
          .alert-no-data {
            color: #888;
            font-style: italic;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}
      </style>

      <div className="print-header-title">Forecast vs. Actual Performance</div>
      <div className="print-header-date">
        Report Generated:{" "}
        {new Date(printDate).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>

      {lastMonthSummary && (
        <div className="summary-row">
          <div className="summary-cell">
            <strong>Forecast Sales:</strong><br />
            ${lastMonthSummary.total_forecast_sales.toLocaleString()}
          </div>
          <div className="summary-cell">
            <strong>Actual Sales:</strong><br />
            ${lastMonthSummary.total_actual_sales.toLocaleString()}
          </div>
          <div className="summary-cell">
            <strong>Sales Variance %:</strong><br />
            {salesVariance.toFixed(1)}%
          </div>
          <div className="summary-cell">
            <strong>Avg Food Cost %:</strong><br />
            {(lastMonthSummary.avg_food_cost_pct * 100).toFixed(1)}%
          </div>
          <div className="summary-cell">
            <strong>Avg Labor Cost %:</strong><br />
            {(lastMonthSummary.avg_labor_cost_pct * 100).toFixed(1)}%
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th className="text-right">Forecasted Sales ($)</th>
            <th className="text-right">Actual Sales ($)</th>
            <th className="text-right">Food Cost (F / A / $)</th>
            <th className="text-right">Bev Cost (F / A / $)</th>
            <th className="text-right">Labor Cost (F / A / $)</th>
            <th>Alerts</th>
          </tr>
        </thead>
        <tbody>
          {combinedData.map((day, index) => {
            const alertsText = [];

            if (day.hasActuals) {
              if (day.foodPct > targets.foodTarget) alertsText.push({ text: "Food Over", type: "error" });
              if (day.bevPct > targets.bevTarget) alertsText.push({ text: "Bev Over", type: "error" });
              if (day.laborPct > targets.laborTarget) alertsText.push({ text: "Labor Over", type: "error" });
            }

            const renderPctLine = (forecast, actual, dollar, target) => {
              if (!day.hasActuals) return <span className="alert-no-data">N/A</span>;
              const className = getPrintClass(actual, target);
              return (
                <span className={`text-right ${className}`}>
                  {(forecast * 100).toFixed(1)}% / {(actual * 100).toFixed(1)}% / ${dollar.toFixed(2)}
                </span>
              );
            };

            return (
              <tr key={day.date + index}>
                <td>{formatDateForPrint(day.date)}</td>
                <td className="text-right">{day.forecastSales.toFixed(2)}</td>
                <td className="text-right">
                  {day.hasActuals ? day.actualSales.toFixed(2) : <span className="alert-no-data">N/A</span>}
                </td>
                <td>{renderPctLine(day.foodForecastPct, day.foodPct, day.foodDollar, targets.foodTarget)}</td>
                <td>{renderPctLine(day.bevForecastPct, day.bevPct, day.bevDollar, targets.bevTarget)}</td>
                <td>{renderPctLine(day.laborForecastPct, day.laborPct, day.laborDollar, targets.laborTarget)}</td>
                <td>
                  {!day.hasActuals ? (
                    <span className="alert-no-data">No Actuals</span>
                  ) : alertsText.length === 0 ? (
                    <span><span className="alert-icon alert-success"></span>On Target</span>
                  ) : (
                    alertsText.map((alert, i) => (
                      <span key={i} style={{ display: "block" }}>
                        <span className={`alert-icon ${alert.type === "error" ? "alert-error" : ""}`}></span>
                        {alert.text}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableFvaDashboard;
