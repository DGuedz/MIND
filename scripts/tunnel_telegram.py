import subprocess
import re
import time
import os

def start_tunnel():
    print("Iniciando túnel para o Approval Gateway (Porta 3003)...")
    p = subprocess.Popen(
        ["ssh", "-p", "443", "-R0:localhost:3003", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "a.pinggy.io"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    url = ""
    while True:
        line = p.stdout.readline()
        if not line:
            line = p.stderr.readline()
            if not line:
                continue
        
        match = re.search(r"(https://[a-zA-Z0-9-]+\.a\.pinggy\.link)", line)
        if match:
            url = match.group(1)
            break
        
    if url:
        print(f"✅ URL do Approval Gateway obtida: {url}")
        
        with open(".env", "r") as f:
            content = f.read()
        
        content = re.sub(r"APPROVAL_GATEWAY_PUBLIC_URL=.*", f"APPROVAL_GATEWAY_PUBLIC_URL={url}", content)
        
        if "APPROVAL_GATEWAY_PUBLIC_URL" not in content:
            content += f"\nAPPROVAL_GATEWAY_PUBLIC_URL={url}\n"
            
        with open(".env", "w") as f:
            f.write(content)
        print("✅ .env atualizado com a URL pública.")
        
        # Run webhook setup
        print("Executando setup_telegram_webhook.ts...")
        os.system("npx tsx scripts/setup_telegram_webhook.ts")
        
        print("\n⏳ Túnel rodando. Mantenha este terminal aberto.")
        while True:
            time.sleep(10)
    else:
        print("❌ Falha ao obter a URL do túnel.")

if __name__ == "__main__":
    start_tunnel()