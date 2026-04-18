module.exports = {
  apps: [
    {
      name: "mind-event-router-service",
      cwd: "/opt/mind",
      script: "pnpm",
      args: "exec tsx scripts/event_router_service.ts",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      kill_timeout: 5000,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        EVENT_ROUTER_SERVICE_HOST: "0.0.0.0",
        EVENT_ROUTER_SERVICE_PORT: "3016",
        EVENT_ROUTER_SPEC_DIR: "/opt/mind/governance/spec_runtime",
        EVENT_ROUTER_LOG_DIR: "/opt/mind/logs/event-router",
        EVENT_ROUTER_GUARDRAILS_FILE: "/opt/mind/governance/spec_runtime/runtime_guardrails.yaml",
        EVENT_ROUTER_REVIEW_QUEUE_FILE: "/opt/mind/governance/spec_runtime/review_queue.json"
      }
    }
  ]
};
