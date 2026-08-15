import { env, validateEnv } from './config/env';
import app from './app';

validateEnv();

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`\n  🍽️  Smart Digital Menu API`);
  console.log(`  ─────────────────────────`);
  console.log(`  Environment : ${env.NODE_ENV}`);
  console.log(`  Port        : ${env.PORT}`);
  console.log(`  Health      : http://localhost:${env.PORT}/api/v1/health\n`);
});
