import Fastify from "fastify";
import "dotenv/config";

const fastify = Fastify({ logger: true });

const PORT = Number(process.env.HERMES_PORT || 8001);
const HOST = process.env.HERMES_HOST || "0.0.0.0";

fastify.post("/hermes/events", async (request, reply) => {
  // Read forwarded headers set by Traefik + ForwardAuth
  const subject = request.headers["x-auth-subject"];
  const issuer = request.headers["x-auth-issuer"];
  const audience = request.headers["x-auth-audience"];

  fastify.log.info({ subject, issuer, audience, body: request.body }, "Received protected hermes event");

  return {
    status: "hermes-accepted",
    identity: { subject, issuer, audience },
    receivedAt: new Date().toISOString()
  };
});

fastify.get("/health", async (request, reply) => {
  return { status: "hermes-backend-ok" };
});

fastify.get("/hermes/health", async (request, reply) => {
  return { status: "hermes-backend-ok" };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Hermes Backend listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
