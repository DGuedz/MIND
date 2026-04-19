import { startEventRouterService } from "../services/event-router-service/src/index.js";

startEventRouterService().catch((error) => {
  console.error("[event_router_service] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
