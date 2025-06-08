import ReactDOMServer from 'react-dom/server';

export const triggerPrint = (PrintableComponent, data, title) => {
  const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
    <PrintableComponent {...data} />
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
    }, 60000); // 1 minute timeout for print dialog

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
    
    // Fallback for browsers that don't robustly support afterprint
    const attemptPrint = () => {
      try {
        const result = iframe.contentWindow.print();
        if (result && typeof result.then === 'function') {
          result.then(afterPrintHandler).catch(err => {
             // If user cancels print dialog, it might throw error or resolve/reject promise.
            console.warn("Print dialog promise rejected or error:", err);
            afterPrintHandler(); // Assume done, clean up.
          });
        } else {
           // For browsers where print() is synchronous or doesn't return a promise
           // Rely on timeout or manual afterprint event.
        }
      } catch (error) {
        console.error("Error calling print:", error);
        cleanup(); // Critical to cleanup if print() itself throws
        reject(error);
      }
    };

    // Delay slightly to ensure content is fully rendered in iframe
    setTimeout(attemptPrint, 500); 
  });

  return printPromise;
};