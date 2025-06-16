import React from "react";
import ReactDOMServer from "react-dom/server";

export const triggerPrint = (ComponentFn, props = {}, title = "Print") => {
  const html = ReactDOMServer.renderToStaticMarkup(ComponentFn(props));

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
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
          body {
            font-family: Arial, sans-serif;
            padding: 2rem;
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  doc.close();
};
