FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/hermes-auth ./services/hermes-auth

RUN pnpm install --filter @mind/hermes-auth...

EXPOSE 9000

CMD ["pnpm", "--filter", "@mind/hermes-auth", "run", "start"]
