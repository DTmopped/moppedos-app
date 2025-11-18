import jsPDF from 'jspdf';

// Format currency
const fmt = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Format percentage
const pct = (value) => `${value.toFixed(1)}%`;

// Executive Summary (1-page) PDF Export
export const exportExecutiveSummary = (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header - MoppedOS Branding
  doc.setFillColor(139, 92, 246); // Purple gradient start
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('🧹 MoppedOS', margin, 25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Restaurant Financial Proforma - Executive Summary', margin, 33);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 60, 33);
  
  y = 50;
  
  // Key Metrics Cards
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY METRICS', margin, y);
  y += 8;
  
  // Profit Margin Card
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, 55, 20, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Profit Margin', margin + 3, y + 6);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Green
  doc.text(pct(data.profitMargin), margin + 3, y + 15);
  
  // Annual Revenue Card
  doc.setTextColor(0, 0, 0);
  doc.roundedRect(margin + 60, y, 55, 20, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual Revenue', margin + 63, y + 6);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Blue
  doc.text(fmt(data.totalRevenue), margin + 63, y + 15);
  
  // Net Profit Card
  doc.setTextColor(0, 0, 0);
  doc.roundedRect(margin + 120, y, 55, 20, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Net Profit', margin + 123, y + 6);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Green
  doc.text(fmt(data.netProfit), margin + 123, y + 15);
  
  y += 30;
  
  // Restaurant P&L Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESTAURANT P&L SUMMARY', margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const restaurantPL = [
    ['Revenue', fmt(data.restaurantRevenue), pct(100)],
    ['Cost of Sales', `-${fmt(data.restaurantCOGS)}`, pct(data.restaurantCOGS / data.restaurantRevenue * 100)],
    ['Payroll', `-${fmt(data.restaurantLabor)}`, pct(data.restaurantLabor / data.restaurantRevenue * 100)],
    ['Operating Expenses', `-${fmt(data.restaurantOpEx)}`, pct(data.restaurantOpEx / data.restaurantRevenue * 100)],
  ];
  
  restaurantPL.forEach(([label, amount, percent]) => {
    doc.text(label, margin, y);
    doc.text(amount, margin + 100, y, { align: 'right' });
    doc.text(percent, margin + 140, y, { align: 'right' });
    y += 6;
  });
  
  // Net Profit line
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y - 2, margin + 140, y - 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text('Net Profit', margin, y + 4);
  doc.text(fmt(data.restaurantNetProfit), margin + 100, y + 4, { align: 'right' });
  doc.text(pct(data.restaurantNetProfit / data.restaurantRevenue * 100), margin + 140, y + 4, { align: 'right' });
  
  y += 15;
  
  // Club P&L Summary (if enabled)
  if (data.clubEnabled) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLUB P&L SUMMARY', margin, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clubPL = [
      ['Revenue', fmt(data.clubRevenue), pct(100)],
      ['Cost of Sales', `-${fmt(data.clubCOGS)}`, pct(data.clubCOGS / data.clubRevenue * 100)],
      ['Payroll', `-${fmt(data.clubLabor)}`, pct(data.clubLabor / data.clubRevenue * 100)],
      ['Operating Expenses', `-${fmt(data.clubOpEx)}`, pct(data.clubOpEx / data.clubRevenue * 100)],
    ];
    
    clubPL.forEach(([label, amount, percent]) => {
      doc.text(label, margin, y);
      doc.text(amount, margin + 100, y, { align: 'right' });
      doc.text(percent, margin + 140, y, { align: 'right' });
      y += 6;
    });
    
    // Net Profit line
    doc.line(margin, y - 2, margin + 140, y - 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Net Profit', margin, y + 4);
    doc.text(fmt(data.clubNetProfit), margin + 100, y + 4, { align: 'right' });
    doc.text(pct(data.clubNetProfit / data.clubRevenue * 100), margin + 140, y + 4, { align: 'right' });
    
    y += 15;
  }
  
  // 5-Year Forecast Table
  if (y > 200) {
    doc.addPage();
    y = 20;
  }
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('5-YEAR FINANCIAL FORECAST', margin, y);
  y += 8;
  
  // Table Header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Category', margin, y);
  doc.text('Year 1', margin + 70, y, { align: 'right' });
  doc.text('Year 2', margin + 100, y, { align: 'right' });
  doc.text('Year 3', margin + 130, y, { align: 'right' });
  doc.text('Year 4', margin + 160, y, { align: 'right' });
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  const forecastRows = [
    ['Revenue', data.forecast.revenue[0], data.forecast.revenue[1], data.forecast.revenue[2], data.forecast.revenue[3]],
    ['COGS', data.forecast.cogs[0], data.forecast.cogs[1], data.forecast.cogs[2], data.forecast.cogs[3]],
    ['Labor', data.forecast.labor[0], data.forecast.labor[1], data.forecast.labor[2], data.forecast.labor[3]],
    ['OpEx', data.forecast.opex[0], data.forecast.opex[1], data.forecast.opex[2], data.forecast.opex[3]],
    ['Net Profit', data.forecast.netProfit[0], data.forecast.netProfit[1], data.forecast.netProfit[2], data.forecast.netProfit[3]],
  ];
  
  forecastRows.forEach(([label, y1, y2, y3, y4]) => {
    doc.text(label, margin, y);
    doc.text(fmt(y1), margin + 70, y, { align: 'right' });
    doc.text(fmt(y2), margin + 100, y, { align: 'right' });
    doc.text(fmt(y3), margin + 130, y, { align: 'right' });
    doc.text(fmt(y4), margin + 160, y, { align: 'right' });
    y += 6;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by MoppedOS Financial Planning Tool', pageWidth / 2, 285, { align: 'center' });
  
  // Save PDF
  doc.save(`MoppedOS_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Detailed Report (Multi-page) PDF Export
export const exportDetailedReport = (data) => {
  // TODO: Implement detailed multi-page report
  alert('Detailed Report export coming soon!');
};

// Restaurant Only PDF Export
export const exportRestaurantOnly = (data) => {
  // TODO: Implement restaurant-only export
  alert('Restaurant Only export coming soon!');
};

// Club Only PDF Export
export const exportClubOnly = (data) => {
  // TODO: Implement club-only export
  alert('Club Only export coming soon!');
};

// Combined PDF Export
export const exportCombined = (data) => {
  // TODO: Implement combined export
  alert('Combined export coming soon!');
};
