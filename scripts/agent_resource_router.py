#!/usr/bin/env python3
import subprocess
import os
import sys
import json
from datetime import datetime

def get_system_memory():
    """Obtém o total de memória física do Mac em MB."""
    try:
        mem_bytes = subprocess.check_output(['sysctl', '-n', 'hw.memsize']).decode().strip()
        return int(mem_bytes) / (1024 * 1024)
    except:
        return 8192 # Fallback genérico

def get_target_processes():
    """Busca processos específicos de desenvolvimento e seu consumo."""
    targets = ['node', 'python', 'localtunnel', 'ngrok', 'docker', 'Trae', 'Code Helper']
    
    # ps command: pid, %cpu, %mem, rss (KB), command
    cmd = ["ps", "-A", "-c", "-o", "pid,pcpu,pmem,rss,comm"]
    output = subprocess.check_output(cmd).decode().splitlines()
    
    dev_processes = []
    total_dev_rss = 0 # em KB
    
    for line in output[1:]:
        parts = line.split(None, 4)
        if len(parts) < 5: continue
        pid, cpu, mem, rss, comm = parts
        
        for t in targets:
            if t.lower() in comm.lower():
                rss_mb = int(rss) / 1024
                total_dev_rss += int(rss)
                dev_processes.append({
                    "pid": pid,
                    "command": comm,
                    "cpu": float(cpu),
                    "mem_mb": round(rss_mb, 2)
                })
                break

    # Ordenar pelos que mais consomem memória
    dev_processes = sorted(dev_processes, key=lambda x: x['mem_mb'], reverse=True)
    return dev_processes, total_dev_rss / 1024

def save_audit_log(decision_block):
    """Salva a auditoria em JSON para integração com o core MIND."""
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'agent_router.json')
    
    # Anexa timestamp ao bloco
    import datetime as dt
    decision_block["timestamp"] = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    
    try:
        with open(log_file, 'w') as f:
            json.dump(decision_block, f, indent=2)
    except Exception as e:
        print(f"⚠️ Erro ao salvar log de auditoria: {e}")

def main():
    auto_mode = "--auto" in sys.argv

    print("============================================")
    print("🤖 MIND Node Operational Guardian (L0 Policy)")
    print("============================================\n")

    total_sys_mem = get_system_memory()
    dev_procs, dev_mem_mb = get_target_processes()
    
    # Calcula a % de memória gasta APENAS com o ambiente dev
    dev_mem_percent = (dev_mem_mb / total_sys_mem) * 100

    print(f"📊 Node System RAM: {total_sys_mem:,.0f} MB")
    print(f"🛠️  Settlement Layer RAM:  {dev_mem_mb:,.0f} MB ({dev_mem_percent:.1f}% do nó)")
    print(f"⚙️  Active Core Processes: {len(dev_procs)}\n")

    print("🔥 TOP 5 Consumidores do Nó (A2A/Gateway):")
    for p in dev_procs[:5]:
        print(f"   - [{p['pid']}] {p['command']}: {p['mem_mb']} MB (CPU: {p['cpu']}%)")
    
    print("\n--------------------------------------------")
    
    # Lógica de Decisão (Policy L0)
    decision = "ALLOW"
    action = "Nenhuma ação necessária. Recursos saudáveis."
    reason_codes = []

    if dev_mem_percent > 40.0:
        decision = "BLOCK_AND_OPTIMIZE"
        reason_codes.append("RC_OOM_RISK_ON_SETTLEMENT_NODE")
        action = "Risco de falha de execução de Intents por falta de recursos no nó. Executando Auto-healing."
    elif len(dev_procs) > 30:
        decision = "WARN_ZOMBIES"
        reason_codes.append("RC_UNTRACKED_ORPHAN_PROCESSES")
        action = "Processos órfãos detectados no nó. Risco à estabilidade do A2A Server."

    # Output JSON padrão MIND
    decision_block = {
        "agent": "MIND_Node_Operational_Guardian_L0",
        "decision": decision,
        "reason_codes": reason_codes,
        "confidence": 0.99,
        "assumptions": [
            "Monitoramento focado no uptime do A2A Server e Gateway",
            "Ignorando processos não essenciais para a liquidação atômica"
        ],
        "required_followups": [],
        "evidence": [
            f"node_memory_mb={round(dev_mem_mb, 2)}",
            f"active_processes_count={len(dev_procs)}"
        ]
    }

    if decision != "ALLOW" and not auto_mode:
        decision_block["required_followups"].append("Rodar cleanup manual: pnpm stop")
    elif decision != "ALLOW" and auto_mode:
        decision_block["required_followups"].append("Auto-cleanup executado pelo Guardian.")

    print(json.dumps(decision_block, indent=2))
    save_audit_log(decision_block)
    
    if decision != "ALLOW":
        if auto_mode:
            print(f"\n⚡️ [AUTO-HEALING] Executando contenção L0. Motivo: {action}")
            subprocess.run(["bash", "scripts/performance_mode.sh"])
            print("✅ Contenção concluída pelo MIND Node Operational Guardian.")
        else:
            print("\n⚠️ ALERTA: Deseja otimizar agora? Rode: pnpm stop")
            print("💡 Dica: Para eu fazer isso sozinho da próxima vez, rode: pnpm agent:router --auto")

if __name__ == "__main__":
    main()