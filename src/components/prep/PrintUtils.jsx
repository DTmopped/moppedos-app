import React from 'react';
import ReactDOMServer from 'react-dom/server';

export const triggerPrint = (Component, props, title) => {
  const html = ReactDOMServer.renderToStaticMarkup(<Component {...props} />);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

 const doc = iframe.contentWindow.document;
doc.open();
doc.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>${title}</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @media print {
          html, body {
            background: white;
            color: black;
          }
        }
      </style>
    </head>
    <body class="p-4">
      ${printableComponentHtml}
    </body>
  </html>
`);
doc.close();

  // Delay ensures iframe content is ready before print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
};
