self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });

// Safe fetch handler: try network, fall back to a null response to avoid unhandled promise rejections
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch((err) => {
      // Return a minimal 204 response on failure
      return new Response(null, { status: 204, statusText: 'No Content' });
    })
  );
});
