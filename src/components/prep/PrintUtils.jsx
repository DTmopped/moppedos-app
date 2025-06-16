import ReactDOMServer from 'react-dom/server';

export const triggerPrint = (PrintableComponent, data, title) => {
  const htmlString = ReactDOMServer.renderToStaticMarkup(
    <PrintableComponent {...data} />
  );

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 2rem;
            background: white;
            color: black;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>${htmlString}</body>
    </html>
  `);
  doc.close();

  const print = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  setTimeout(print, 500); // allow time for iframe to render
};
