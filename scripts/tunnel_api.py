import subprocess
import re
import time
import os

def start_tunnel():
    print("Iniciando túnel para o API Gateway (Porta 3000)...")
    p = subprocess.Popen(
        ["ssh", "-p", "443", "-R0:localhost:3000", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "a.pinggy.io"],
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
                break
        
        match = re.search(r"(https://[a-zA-Z0-9-]+\.a\.pinggy\.link)", line)
        if match:
            url = match.group(1)
            break
        
    if url:
        print(f"✅ URL do API Gateway obtida: {url}")
        filepath = "apps/landingpage/src/pages/App.tsx"
        with open(filepath, "r") as f:
            content = f.read()
        
        # Substitui o localhost pela URL pública do túnel
        content = re.sub(r"http://127\.0\.0\.1:3000", url, content)
        
        with open(filepath, "w") as f:
            f.write(content)
        print("✅ App.tsx atualizado com a URL pública.")
    else:
        print("❌ Falha ao obter a URL do túnel.")

if __name__ == "__main__":
    start_tunnel()