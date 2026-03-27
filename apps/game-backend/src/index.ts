import fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { getUser, createUser, addXP, getLeaderboard } from './db.js';

const server = fastify({ logger: true });

await server.register(cors, {
  origin: '*', // For the hackathon, allow all origins (Telegram Web Apps)
});

// Schemas
const InitSchema = z.object({
  telegram_id: z.string(),
  username: z.string().optional().nullable(),
});

const SyncXPSchema = z.object({
  telegram_id: z.string(),
  xp_gained: z.number().int().min(0).max(1000), // Max 1000 per batch to prevent abuse
  mevs_destroyed: z.number().int().min(0).max(100),
});

// Routes
server.get('/health', async () => {
  return { status: 'ok', service: 'game-backend' };
});

server.post('/v1/game/init', async (request, reply) => {
  const parsed = InitSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const { telegram_id, username } = parsed.data;
  let user = getUser(telegram_id);
  
  if (!user) {
    user = createUser(telegram_id, username ?? null);
  }

  return reply.send({ user });
});

server.post('/v1/game/sync-xp', async (request, reply) => {
  const parsed = SyncXPSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_payload', details: parsed.error.flatten() });
  }

  const { telegram_id, xp_gained, mevs_destroyed } = parsed.data;
  
  const user = getUser(telegram_id);
  if (!user) {
    return reply.code(404).send({ error: 'user_not_found' });
  }

  // Basic anti-cheat: if they send 0, just return current state
  if (xp_gained > 0 || mevs_destroyed > 0) {
    addXP(telegram_id, xp_gained, mevs_destroyed);
  }

  const updatedUser = getUser(telegram_id);
  return reply.send({ user: updatedUser });
});

server.get('/v1/game/leaderboard', async (request, reply) => {
  const limitStr = (request.query as any).limit;
  const limit = limitStr ? parseInt(limitStr, 10) : 10;
  
  const leaders = getLeaderboard(limit);
  return reply.send({ leaderboard: leaders });
});

const start = async () => {
  try {
    const port = Number(process.env.PORT || 3010);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🎮 Game Backend running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
