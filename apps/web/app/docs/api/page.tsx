/**
 * API Documentation Page
 *
 * Swagger UI for ProcureFlow API
 */

'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically load Swagger UI from CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle is loaded from CDN
      if (window.SwaggerUIBundle) {
        // @ts-expect-error SwaggerUIBundle is loaded from CDN
        window.SwaggerUIBundle({
          url: '/api/openapi',
          dom_id: '#swagger-ui',
          presets: [
            // @ts-expect-error Preset is loaded from CDN
            window.SwaggerUIBundle.presets.apis,
            // @ts-expect-error Preset is loaded from CDN
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
        });
      }
    };
    document.body.appendChild(script);

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ProcureFlow API Documentation
          </h1>
          <p className="mt-2 text-gray-600">
            Interactive API documentation powered by Swagger UI
          </p>
        </div>
        <div id="swagger-ui" />
      </div>
    </div>
  );
}
