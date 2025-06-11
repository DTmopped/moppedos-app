import ReactDOMServer from 'react-dom/server';

export const triggerPrint = (PrintableComponent, data, title) => {
  // Normalize component: wrap with props if it’s not already a function receiving them
  const ResolvedComponent =
    typeof PrintableComponent === 'function'
      ? (props) => <PrintableComponent {...props} />
      : PrintableComponent;

  const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
    <ResolvedComponent {...data} />
  );

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
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
          }
          h1, h2 {
            margin-bottom: 0.5rem;
          }
          p {
            margin: 0.25rem 0;
          }
        </style>
      </head>
      <body>
        ${printableComponentHtml}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();

  const printPromise = new Promise((resolve, reject) => {
    let printed = false;
    const printTimeout = setTimeout(() => {
      if (!printed) {
        cleanup();
        reject(new Error("Print dialog timed out or was cancelled."));
      }
    }, 60000); // 1 min timeout

    const afterPrintHandler = () => {
      printed = true;
      clearTimeout(printTimeout);
      cleanup();
      resolve();
    };

    const cleanup = () => {
      iframe.contentWindow.removeEventListener('afterprint', afterPrintHandler);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.contentWindow.addEventListener('afterprint', afterPrintHandler);

    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (error) {
        console.error("Error triggering print:", error);
        cleanup();
        reject(error);
      }
    }, 500);
  });

  return printPromise;
};
