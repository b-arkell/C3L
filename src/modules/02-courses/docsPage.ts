// The spec is served by the route in index.ts that returns it as a file.
// Swagger UI fetches it as JSON/YAML at page load time.
export function docsPage(base: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Module 2 API — Swagger UI</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      body { margin: 0; padding: 0; }
      .topbar { display: none; }   /* hide the Swagger "Explore" bar */
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '${base}/openapi.yaml',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
          ],
          layout: 'BaseLayout',
        })
      }
    </script>
  </body>
</html>`
}