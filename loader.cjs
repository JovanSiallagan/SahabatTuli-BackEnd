// CommonJS wrapper for Hostinger LiteSpeed (lsnode.js)
import('./server.js').catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
