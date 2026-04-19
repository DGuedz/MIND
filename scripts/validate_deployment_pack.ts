import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type CheckResult = {
  name: string;
  pass: boolean;
  details?: unknown;
};

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const readIfExists = async (filePath: string) => {
  if (!existsSync(filePath)) return null;
  return fs.readFile(filePath, "utf8");
};

const hasAll = (content: string, patterns: Array<string | RegExp>) => {
  return patterns.every((pattern) =>
    typeof pattern === "string" ? content.includes(pattern) : pattern.test(content)
  );
};

async function main() {
  const repoRoot = process.cwd();
  const stamp = nowStamp();
  const artifactDir = path.join(repoRoot, "artifacts", `deployment-pack-validation-${stamp}`);
  const reportFile = path.join(artifactDir, "report.json");

  const files = {
    dockerfile: path.join(repoRoot, "services/event-router-service/deploy/Dockerfile"),
    compose: path.join(repoRoot, "services/event-router-service/deploy/docker-compose.yml"),
    pm2: path.join(repoRoot, "services/event-router-service/deploy/pm2/ecosystem.config.cjs"),
    systemd: path.join(repoRoot, "services/event-router-service/deploy/systemd/mind-event-router.service"),
    nginx: path.join(repoRoot, "services/event-router-service/deploy/nginx/event-router.conf"),
    alerts: path.join(repoRoot, "services/event-router-service/alerts_config.md"),
    runbook: path.join(repoRoot, "services/event-router-service/live_demo_runbook.md")
  };

  const results: CheckResult[] = [];

  for (const [name, filePath] of Object.entries(files)) {
    results.push({
      name: `file_exists_${name}`,
      pass: existsSync(filePath),
      details: { filePath }
    });
  }

  const dockerfile = await readIfExists(files.dockerfile);
  if (dockerfile) {
    results.push({
      name: "dockerfile_contract",
      pass: hasAll(dockerfile, ["FROM node:", "pnpm install --frozen-lockfile", "scripts/event_router_service.ts"]),
      details: { file: files.dockerfile }
    });
  }

  const compose = await readIfExists(files.compose);
  if (compose) {
    results.push({
      name: "compose_contract",
      pass: hasAll(compose, [
        "event-router-service",
        "EVENT_ROUTER_SERVICE_TOKEN",
        "healthcheck",
        "/v1/health",
        "3016:3016"
      ]),
      details: { file: files.compose }
    });
  }

  const pm2 = await readIfExists(files.pm2);
  if (pm2) {
    results.push({
      name: "pm2_contract",
      pass: hasAll(pm2, ["mind-event-router-service", "scripts/event_router_service.ts", "EVENT_ROUTER_SERVICE_PORT"]),
      details: { file: files.pm2 }
    });
  }

  const systemd = await readIfExists(files.systemd);
  if (systemd) {
    results.push({
      name: "systemd_contract",
      pass: hasAll(systemd, ["Description=MIND Event Router Service", "EnvironmentFile=", "ExecStart=", "Restart=always"]),
      details: { file: files.systemd }
    });
  }

  const nginx = await readIfExists(files.nginx);
  if (nginx) {
    results.push({
      name: "nginx_contract",
      pass: hasAll(nginx, ["location /v1/events", "proxy_pass", "x-event-router-token"]),
      details: { file: files.nginx }
    });
  }

  const alerts = await readIfExists(files.alerts);
  if (alerts) {
    results.push({
      name: "alerts_contract",
      pass: hasAll(alerts, [
        "alert_dispatch_failed_spike",
        "alert_circuit_open",
        "alert_proof_verification_drop",
        "Notification Targets"
      ]),
      details: { file: files.alerts }
    });
  }

  const runbook = await readIfExists(files.runbook);
  if (runbook) {
    results.push({
      name: "runbook_contract",
      pass: hasAll(runbook, [
        "pnpm spec:test-event-router-service",
        "pnpm spec:test-service-router-integration",
        "pnpm --filter @mind/event-router-service run test:e2e-live-flow",
        "GO / NO_GO Gate"
      ]),
      details: { file: files.runbook }
    });
  }

  let dockerComposeLint: CheckResult = {
    name: "docker_compose_config_lint",
    pass: true,
    details: { skipped: true, reason: "docker_not_available" }
  };
  try {
    await execFileAsync("docker", ["compose", "-f", files.compose, "config"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        EVENT_ROUTER_SERVICE_TOKEN: process.env.EVENT_ROUTER_SERVICE_TOKEN ?? "validate-token"
      },
      maxBuffer: 1024 * 1024 * 4
    });
    dockerComposeLint = {
      name: "docker_compose_config_lint",
      pass: true,
      details: { skipped: false }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const missingDocker = /ENOENT|not found/i.test(message);
    dockerComposeLint = {
      name: "docker_compose_config_lint",
      pass: missingDocker ? true : false,
      details: { skipped: missingDocker, reason: message }
    };
  }
  results.push(dockerComposeLint);

  const failed = results.filter((result) => !result.pass);
  const report = {
    status: failed.length === 0 ? "pass" : "fail",
    generated_at: new Date().toISOString(),
    artifact_dir: artifactDir,
    total: results.length,
    failed: failed.length,
    results
  };

  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("[validate_deployment_pack] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
