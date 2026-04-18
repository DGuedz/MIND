import { spawn } from "child_process";
import fs from "fs";
import { execSync } from "child_process";

console.log("Iniciando ssh túnel (localhost.run) na porta 3003...");
const tunnel = spawn("ssh", ["-R", "80:localhost:3003", "nokey@localhost.run", "-o", "StrictHostKeyChecking=no"]);

tunnel.stdout.on("data", data => {
  const output = data.toString();
  console.log(output);
  const match = output.match(/(https:\/\/[^\s]+\.lhr\.life)/);
  
  if (match) {
    const url = match[1];
    console.log(`\n✅ URL do Approval Gateway obtida: ${url}`);
    
    const envPath = ".env";
    let content = fs.readFileSync(envPath, "utf8");
    
    content = content.replace(/APPROVAL_GATEWAY_PUBLIC_URL=.*/g, `APPROVAL_GATEWAY_PUBLIC_URL=${url}`);
    
    if (!content.includes("APPROVAL_GATEWAY_PUBLIC_URL=")) {
      content += `\nAPPROVAL_GATEWAY_PUBLIC_URL=${url}\n`;
    }
    
    fs.writeFileSync(envPath, content);
    console.log("✅ .env atualizado com a URL pública.");
    
    console.log("Executando setup_telegram_webhook.ts...");
    try {
      execSync("npx tsx scripts/setup_telegram_webhook.ts", { stdio: "inherit" });
    } catch (e) {
      console.error("❌ Erro ao rodar setup do webhook");
    }
    
    console.log("\n⏳ Túnel rodando. Mantenha este script rodando para o webhook funcionar.");
  }
});

tunnel.stderr.on("data", data => {
  const output = data.toString();
  const match = output.match(/(https:\/\/[^\s]+\.lhr\.life)/);
  if (match) {
    const url = match[1];
    console.log(`\n✅ URL do Approval Gateway obtida: ${url}`);
    
    const envPath = ".env";
    let content = fs.readFileSync(envPath, "utf8");
    
    content = content.replace(/APPROVAL_GATEWAY_PUBLIC_URL=.*/g, `APPROVAL_GATEWAY_PUBLIC_URL=${url}`);
    
    if (!content.includes("APPROVAL_GATEWAY_PUBLIC_URL=")) {
      content += `\nAPPROVAL_GATEWAY_PUBLIC_URL=${url}\n`;
    }
    
    fs.writeFileSync(envPath, content);
    console.log("✅ .env atualizado com a URL pública.");
    
    console.log("Executando setup_telegram_webhook.ts...");
    try {
      execSync("npx tsx scripts/setup_telegram_webhook.ts", { stdio: "inherit" });
    } catch (e) {
      console.error("❌ Erro ao rodar setup do webhook");
    }
    
    console.log("\n⏳ Túnel rodando. Mantenha este script rodando para o webhook funcionar.");
  } else {
     // console.error(`SSH Tunnel stderr: ${data}`);
  }
});
