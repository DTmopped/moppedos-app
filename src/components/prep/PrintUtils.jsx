mport ReactDOMServer from 'react-dom/server';

export const triggerPrint = (PrintableComponent, data, title) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const html = ReactDOMServer.renderToStaticMarkup(
    <PrintableComponent {...data} />
  );

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          html, body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: black;
            background: white;
            padding: 20px;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  doc.close();

  // 🧠 Print after iframe fully loads
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Clean up after print
    setTimeout(() => {
      document.body.removeChild(iframe);
      document.body.removeChild(container);
    }, 1000);
  };
};
