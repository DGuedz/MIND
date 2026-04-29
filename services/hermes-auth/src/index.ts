import Fastify from "fastify";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import "dotenv/config";

const fastify = Fastify({ logger: true });

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const JWKS_URI = requireEnv("AUTH_JWKS_URL");
const ISSUER = requireEnv("AUTH_ISSUER");
const AUDIENCE = requireEnv("AUTH_AUDIENCE");
const VERIFY_PATH = process.env.AUTH_VERIFY_PATH || "/verify";

function getBindConfig() {
  const bindAddr = process.env.AUTH_BIND_ADDR;

  if (bindAddr) {
    const [host, port] = bindAddr.split(":");
    return {
      host: host || "0.0.0.0",
      port: Number(port || 9000)
    };
  }

  return {
    host: process.env.AUTH_HOST || "0.0.0.0",
    port: Number(process.env.AUTH_PORT || process.env.HERMES_AUTH_PORT || 9000)
  };
}

const { host: HOST, port: PORT } = getBindConfig();

const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  rateLimit: true
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error("JWT missing kid"));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      return callback(err || new Error("Key not found"));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

fastify.all(VERIFY_PATH, (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    fastify.log.warn("Missing or invalid Authorization header");
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    fastify.log.warn("Empty Bearer token");
    return reply.code(401).send({ error: "Unauthorized" });
  }

  jwt.verify(
    token,
    getKey,
    {
      issuer: ISSUER,
      audience: AUDIENCE,
    },
    (err, decoded) => {
      if (err) {
        fastify.log.error({ err: err.message }, "JWT validation failed");
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const payload = decoded as jwt.JwtPayload;
      
      reply
        .header("X-Auth-Subject", payload.sub || "")
        .header("X-Auth-Issuer", payload.iss || "")
        .header("X-Auth-Audience", Array.isArray(payload.aud) ? payload.aud.join(",") : payload.aud || "")
        .code(200)
        .send();
    }
  );
});

fastify.get("/health", async (request, reply) => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Hermes Auth (ForwardAuth) listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
