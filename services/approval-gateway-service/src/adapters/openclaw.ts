import { getEnv } from "../../../shared/env.js";

export interface OpenClawPayload {
  intent_hash: string;
  risk_profile: any;
  chat_id: string;
  action: "AUDIT_NOTIFICATION";
}

/**
 * Adapter para o OpenClaw (Governança e Interface).
 * Exige aprovação de Soberania Humana no Telegram apenas como Definidor de Política (Policy Setter).
 * Para liquidação, atua de forma assíncrona notificando o humano da auditoria programática.
 */
export class OpenClawAdapter {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = getEnv("OPENCLAW_WEBHOOK_URL");
    if (!this.webhookUrl) {
      console.warn("⚠️ [OpenClawAdapter] OPENCLAW_WEBHOOK_URL ausente. Usando simulação CLI (Auditoria Async Automática).");
    }
  }

  /**
   * Envia o payload da intenção para o webhook do Telegram do cliente para fins de auditoria.
   * Não trava a thread de liquidação; apenas despacha o evento.
   */
  async sendAuditNotification(intentHash: string, riskData: any, telegramChatId: string): Promise<string> {
    console.log(`[OpenClawAdapter] Disparando notificação de auditoria (Async) para o Telegram (ChatID: ${telegramChatId})...`);

    if (!this.webhookUrl) {
      // Sem o webhook real, assumimos o mock do flow de demonstração (E2E)
      return `oc_audit_${Date.now()}`;
    }

    const payload: OpenClawPayload = {
      intent_hash: intentHash,
      risk_profile: riskData,
      chat_id: telegramChatId,
      action: "AUDIT_NOTIFICATION"
    };

    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Erro Webhook OpenClaw [${res.status}]`);
      }

      const data = await res.json() as any;
      
      // OpenClaw devolve um Audit ID para rastrear a notificação despachada
      return data.audit_id || `oc_audit_${Date.now()}`;
    } catch (error) {
      console.error("[OpenClawAdapter] Falha ao contatar OpenClaw webhook:", error instanceof Error ? error.message : String(error));
      // Não trava a execução da transação se a notificação falhar (Programmatic Autonomy)
      return `oc_audit_fallback_${Date.now()}`;
    }
  }
}
