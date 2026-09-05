import { createNestApp } from './bootstrap-app';

async function bootstrap() {
  const { app } = await createNestApp();
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
