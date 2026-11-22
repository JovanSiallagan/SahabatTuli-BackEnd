import 'tsx';

async function start() {
  await import('./src/server.ts');
}

start().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
