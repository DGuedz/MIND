FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/hermes-backend ./services/hermes-backend

RUN pnpm install --filter @mind/hermes-backend...

EXPOSE 8001

CMD ["pnpm", "--filter", "@mind/hermes-backend", "run", "start"]
