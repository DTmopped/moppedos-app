import React from 'react';
import ReactDOM from 'react-dom';

export const triggerPrint = (ComponentFn, props = {}, title = "Print") => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const PrintWrapper = () => (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <ComponentFn {...props} />
    </div>
  );

  const printWindow = window.open('', title, 'width=800,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);

  printWindow.document.close();

  const interval = setInterval(() => {
    const root = printWindow.document.getElementById('print-root');
    if (root) {
      ReactDOM.render(<PrintWrapper />, root);
      clearInterval(interval);

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }, 100);
};
