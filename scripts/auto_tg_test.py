#!/usr/bin/env python3
import os
import sys
import time
import json
import re
import signal
import subprocess
import urllib.request
import urllib.error

def load_env(filepath):
    """Lê as variáveis de ambiente manualmente para não exigir pip install python-dotenv."""
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip('"').strip("'")
    return env_vars

def update_env(filepath, key, value):
    """Atualiza ou insere uma variável de ambiente no arquivo .env."""
    lines = []
    found = False
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            lines = f.readlines()
    
    with open(filepath, 'w') as f:
        for line in lines:
            if line.startswith(f"{key}="):
                f.write(f"{key}={value}\n")
                found = True
            else:
                f.write(line)
        if not found:
            f.write(f"{key}={value}\n")

def main():
    print("============================================")
    print("🚀 Iniciando Automação do Teste Telegram HITL (Python)")
    print("============================================\n")

    env_path = os.path.join(os.getcwd(), '.env')
    env_vars = load_env(env_path)
    token = env_vars.get('TELEGRAM_BOT_TOKEN')

    if not token:
        print("❌ ERRO: TELEGRAM_BOT_TOKEN não encontrado no .env")
        sys.exit(1)

    # 1. Pegar o Chat ID
    chat_id = "913039626" # Hardcoded based on your previous valid fetch

    if not chat_id:
        print("❌ Não consegui achar seu Chat ID. Mande um 'Oi' para o bot e rode de novo.")
        sys.exit(1)
    
    print(f"✅ [1/5] Chat ID encontrado: {chat_id}")

    # 2. Iniciar Localtunnel novamente com Bypass Header
    print("🌐 [2/5] Iniciando túnel público (localtunnel)...")
    lt_process = subprocess.Popen(
        ["npx", "localtunnel", "--port", "3003", "--local-host", "127.0.0.1", "--local-https", "false", "--allow-invalid-cert"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True
    )

    public_url = ""
    while True:
        line = lt_process.stdout.readline()
        if not line:
            break
        match = re.search(r"your url is: (https://[^\s]+)", line)
        if match:
            public_url = match.group(1)
            break

    if not public_url:
        print("❌ Falha ao obter URL do localtunnel.")
        lt_process.kill()
        sys.exit(1)

    print(f"✅ Túnel ativo! URL: {public_url}")

    # 3. Atualizar .env
    update_env(env_path, "APPROVAL_GATEWAY_PUBLIC_URL", public_url)

    # 4. Configurar Webhook no Telegram
    try:
        webhook_url = f"{public_url}/v1/approvals/telegram/webhook"
        print(f"🔗 Registrando webhook no Telegram: {webhook_url}")
        req = urllib.request.Request(f"https://api.telegram.org/bot{token}/setWebhook?url={webhook_url}")
        with urllib.request.urlopen(req, timeout=10) as response:
            hook_data = json.loads(response.read().decode())
            if hook_data.get("ok"):
                print("✅ [3/5] Webhook configurado no Telegram!")
            else:
                print("❌ Erro ao configurar Webhook:", hook_data)
    except Exception as e:
        print("❌ Erro de rede ao configurar Webhook:", e)

    # 5. Reiniciar Serviços
    print("⚙️  [4/5] Reiniciando serviços de backend...")
    subprocess.run(["killall", "node"], stderr=subprocess.DEVNULL)
    time.sleep(2)

    # Inicia os serviços em um novo grupo de processos para facilitar o kill depois
    services_process = subprocess.Popen(
        ["pnpm", "run", "dev:services"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        preexec_fn=os.setsid 
    )

    print("⏳ Aguardando serviços subirem (15 segundos)...")
    time.sleep(15)

    # 6. Rodar script E2E
    print("\n🎬 [5/5] Executando fluxo E2E...")
    env_copy = os.environ.copy()
    env_copy["TEST_TG_CHAT_ID"] = str(chat_id)
    env_copy["APPROVAL_GATEWAY_PUBLIC_URL"] = public_url

    try:
        subprocess.run(
            ["pnpm", "exec", "tsx", "scripts/e2e_real_telegram.ts"],
            env=env_copy,
            check=True
        )
    except subprocess.CalledProcessError:
        print("\n❌ Fluxo E2E falhou.")
    except KeyboardInterrupt:
        print("\n⏹️  Interrompido pelo usuário.")

    print("\n🛑 Teste finalizado. Desligando tudo de forma limpa...")
    lt_process.kill()
    try:
        os.killpg(os.getpgid(services_process.pid), signal.SIGTERM)
    except:
        pass
    subprocess.run(["killall", "node"], stderr=subprocess.DEVNULL)
    print("✅ Ambiente limpo. Serviços e túneis encerrados.")

if __name__ == "__main__":
    main()