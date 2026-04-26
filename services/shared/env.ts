/**
 * Encapsulamento simples para pegar variáveis de ambiente
 * Evita import cycles na raiz
 */
import * as dotenv from "dotenv";

dotenv.config();

export function getEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}
