import { startEventRouterService } from "../services/event-router-service/src/index.js";

startEventRouterService().catch((error) => {
  console.error("[event_router_service] failed:", error);
  process.exit(1);
});
