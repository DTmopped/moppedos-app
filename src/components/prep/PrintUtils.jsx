import React from 'react';
import { createRoot } from 'react-dom/client';

export const triggerPrint = async (Component, props, title) => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    doc.close();

    const mountNode = doc.getElementById('print-root');

    if (!mountNode) {
      reject(new Error("Could not find print root node."));
      return;
    }

    const root = createRoot(mountNode);
    root.render(<Component {...props} />);

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 1000);
    }, 500);
  });
};
