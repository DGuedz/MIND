FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build from monorepo root context.
COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 3016

CMD ["pnpm", "exec", "tsx", "scripts/event_router_service.ts"]
