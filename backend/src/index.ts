import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.listen(PORT, () => {
  console.log(`\n  API running at http://localhost:${PORT}`);
  console.log(`   GET    /users/:id     — fetch user (cached after first hit)`);
  console.log(`   POST   /users         — create user { name, email }`);
  console.log(`   DELETE /cache         — flush cache`);
  console.log(`   GET    /cache-status  — hits, misses, avg response time`);
  console.log(`   GET    /health        — uptime\n`);
});
