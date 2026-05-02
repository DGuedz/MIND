'use strict';

/**
 * CLINT — CNB Link Intelligence
 * MIND Protocol Agent Card · v1.0.0
 *
 * Verifica provas on-chain do DePIN CNB Mobile na Solana.
 * Calcula o Node Health Index (NHI, 0–100) e risco Sybil
 * a partir de Memo transactions e do UserAccount PDA (Anchor).
 *
 * Interface principal: execute(input) → ClintOutput
 * A MIND infra injeta MIND_RPC_URL via KMS em runtime.
 * Nunca requer chave privada — 100% read-only.
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const crypto = require('crypto');

// ─── Constantes ──────────────────────────────────────────────────────────────

const PROGRAM_ID   = new PublicKey('BoVj5VrUx4zzE9JWFrneGWyePNt4DYGP2AHb9ZUxXZmo');
const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

// RPC injetado pelo KMS da MIND em runtime; devnet como fallback de teste
const RPC_URL = process.env.MIND_RPC_URL || 'https://api.devnet.solana.com';

// ─── Utilitários ─────────────────────────────────────────────────────────────

/**
 * Deriva o UserAccount PDA a partir de uid_hash (hex, 64 chars).
 * Seeds: ["user", uid_hash_bytes[0..8]]
 */
function getPDA(uidHashHex) {
  const seed = Buffer.from(uidHashHex.slice(0, 16), 'hex'); // 8 bytes
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user'), seed],
    PROGRAM_ID,
  );
  return pda;
}

/**
 * Converte endereço Solana base58 em uid_hash fictício (para lookup por wallet).
 * Na prática, o CLINT varre as Memos do próprio endereço — o uid_hash está
 * embutido no payload da Memo e é extraído diretamente.
 */
function walletToSearchKey(wallet) {
  return new PublicKey(wallet);
}

/**
 * Tenta parsear o payload de uma Memo como SessionProof.
 * Retorna null se o payload não for um proof CNB válido.
 *
 * @typedef {{ event: 'session', uidHash: string, timestamp: number, duration: number, points: number }} SessionProof
 * @param {string} raw
 * @returns {SessionProof|null}
 */
function parseMemoPayload(raw) {
  try {
    const obj = JSON.parse(raw);
    if (
      obj.event === 'session' &&
      typeof obj.uidHash    === 'string' &&
      typeof obj.timestamp  === 'number' &&
      typeof obj.duration   === 'number' &&
      typeof obj.points     === 'number'
    ) {
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Leitura on-chain ─────────────────────────────────────────────────────────

/**
 * Busca as últimas `limit` transações de Memo do endereço e filtra
 * dentro da janela temporal [fromTs, toTs] (timestamps unix em ms).
 *
 * @param {Connection} conn
 * @param {PublicKey} address
 * @param {number} fromTs
 * @param {number} toTs
 * @param {number} limit  — número de signatures a buscar (batch)
 * @returns {Promise<Array<{ proof: SessionProof, signature: string }>>}
 */
async function fetchSessionProofs(conn, address, fromTs, toTs, limit = 200) {
  const sigs = await conn.getSignaturesForAddress(address, { limit });

  // Filtra por janela antes de buscar o corpo completo (economiza RPC calls)
  const inWindow = sigs.filter(s => {
    const blockTs = (s.blockTime || 0) * 1000; // blockTime é unix segundos
    return blockTs >= fromTs && blockTs <= toTs && !s.err;
  });

  const results = [];

  // Busca em lotes de 10 para respeitar rate limits do RPC público
  for (let i = 0; i < inWindow.length; i += 10) {
    const batch = inWindow.slice(i, i + 10);
    const txs = await Promise.all(
      batch.map(s =>
        conn.getParsedTransaction(s.signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        }).catch(() => null)
      )
    );

    for (let j = 0; j < txs.length; j++) {
      const tx = txs[j];
      if (!tx) continue;

      const instructions = tx.transaction?.message?.instructions || [];
      for (const ix of instructions) {
        if (ix.programId?.toString() !== MEMO_PROGRAM) continue;
        const raw = ix.parsed || ix.data;
        if (!raw || typeof raw !== 'string') continue;

        const proof = parseMemoPayload(raw);
        if (proof) {
          results.push({ proof, signature: batch[j].signature });
        }
      }
    }
  }

  return results;
}

/**
 * Lê o UserAccount PDA e retorna { pontos, resgates } ou null se não existir.
 *
 * O layout binário do PDA (UserAccount, 55 bytes):
 *   [0..8]   discriminator (Anchor)
 *   [8..24]  uid_hash: [u8; 16]
 *   [24..32] pontos: i64 (little-endian)
 *   [32..36] resgates: u32 (little-endian)
 *   [36..53] referrer: Option<[u8; 16]> (1 byte flag + 16 bytes)
 *   [53]     bump: u8
 *
 * @param {Connection} conn
 * @param {PublicKey} pda
 * @returns {Promise<{ pontos: number, resgates: number }|null>}
 */
async function readPDA(conn, pda) {
  const info = await conn.getAccountInfo(pda, 'confirmed');
  if (!info || info.data.length < 36) return null;

  const data = info.data;
  // pontos: bytes [24..32], i64 little-endian
  const pontosLo = data.readUInt32LE(24);
  const pontosHi = data.readInt32LE(28);
  const pontos = pontosHi * 0x100000000 + pontosLo;

  // resgates: bytes [32..36], u32 little-endian
  const resgates = data.readUInt32LE(32);

  return { pontos, resgates };
}

// ─── Cálculo do NHI ──────────────────────────────────────────────────────────

/** Soma total de minutos verificados nas provas. */
function totalMinutes(proofs) {
  return proofs.reduce((acc, { proof }) => acc + proof.duration, 0);
}

/**
 * Consistência temporal: quanto mais uniforme a distribuição das sessões
 * dentro da janela, mais próximo de 1.0.
 * Usa o coeficiente de Gini invertido dos gaps entre sessões.
 */
function calcConsistency(proofs) {
  if (proofs.length < 2) return proofs.length > 0 ? 0.5 : 0;

  const ts = proofs.map(p => p.proof.timestamp).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < ts.length; i++) gaps.push(ts[i] - ts[i - 1]);

  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean === 0) return 0;

  // Coeficiente de variação (CV): desvio padrão / média
  const variance = gaps.reduce((acc, g) => acc + (g - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;

  // CV alto → inconsistência → score baixo; mapeia [0, 3] → [1, 0]
  return Math.max(0, 1 - cv / 3);
}

/**
 * Longest streak em horas contínuas de atividade.
 * Duas sessões são "contínuas" se o gap entre elas for < 4 horas.
 */
function calcLongestStreak(proofs) {
  if (proofs.length === 0) return 0;

  const sorted = [...proofs].sort((a, b) => a.proof.timestamp - b.proof.timestamp);
  const GAP_LIMIT = 4 * 60 * 60 * 1000; // 4 horas em ms

  let maxMs  = 0;
  let streakStart = sorted[0].proof.timestamp;
  let prev        = sorted[0].proof.timestamp + sorted[0].proof.duration * 60_000;

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i].proof.timestamp;
    if (cur - prev > GAP_LIMIT) {
      maxMs = Math.max(maxMs, prev - streakStart);
      streakStart = cur;
    }
    prev = cur + sorted[i].proof.duration * 60_000;
  }
  maxMs = Math.max(maxMs, prev - streakStart);

  return maxMs / 3_600_000; // → horas
}

/**
 * Entropia anti-Sybil: variância da duração das sessões.
 * Humanos reais têm sessões de duração variável; bots repetem durações fixas.
 * Retorna score [0, 1].
 */
function calcEntropy(proofs) {
  if (proofs.length < 3) return 0.5;

  const durations = proofs.map(p => p.proof.duration);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const stddev = Math.sqrt(
    durations.reduce((acc, d) => acc + (d - mean) ** 2, 0) / durations.length
  );

  // stddev > 8 min → comportamento humano → score alto
  return Math.min(stddev / 10, 1);
}

/**
 * Heurística de gaps noturnos.
 * Uma pessoa real dorme; há ao menos um gap > 5 horas por dia de atividade.
 */
function hasNocturnalGaps(proofs, windowHours) {
  if (proofs.length < 4 || windowHours < 24) return true; // sem dados suficientes, benefit of doubt

  const ts = proofs.map(p => p.proof.timestamp).sort((a, b) => a - b);
  const days = Math.max(1, Math.round(windowHours / 24));
  const GAP_5H = 5 * 60 * 60 * 1000;
  let nightsFound = 0;

  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - ts[i - 1] >= GAP_5H) nightsFound++;
  }

  return nightsFound >= days * 0.5; // ao menos 50% dos dias têm gap noturno
}

/**
 * Calcula o Node Health Index (NHI) de 0–100.
 *
 * Componentes:
 *   A. Volume         30 pts — minutos verificados / janela
 *   B. Consistência   25 pts — uniformidade temporal
 *   C. PDA fidelity   20 pts — pontos no contrato vs. somatório dos Memos
 *   D. Streak         15 pts — maior bloco contínuo
 *   E. Entropia       10 pts — variância de duração (anti-bot)
 */
function calcNHI(proofs, pdaData, windowHours) {
  const mins = totalMinutes(proofs);

  // A. Volume: 4 min/h de atividade = pontuação máxima
  const scoreA = Math.min(mins / (windowHours * 4), 1) * 30;

  // B. Consistência
  const scoreB = calcConsistency(proofs) * 25;

  // C. PDA fidelity (só se o PDA existir)
  let scoreC = 10; // neutro se PDA inexistente
  if (pdaData) {
    const expectedPts = proofs.reduce((acc, { proof }) => acc + proof.points, 0);
    const ratio = expectedPts > 0 ? pdaData.pontos / expectedPts : 0;
    scoreC = Math.min(Math.max(ratio, 0), 1.1) * (1 / 1.1) * 20;
  }

  // D. Streak
  const streakH = calcLongestStreak(proofs);
  const scoreD = Math.min(streakH / (windowHours * 0.75), 1) * 15;

  // E. Entropia
  const scoreE = calcEntropy(proofs) * 10;

  return Math.round(scoreA + scoreB + scoreC + scoreD + scoreE);
}

/**
 * Classifica o risco Sybil em três categorias.
 */
function classifySybil(proofs, windowHours) {
  if (proofs.length === 0) return 'medium';

  const durations = proofs.map(p => p.proof.duration);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const stddev = Math.sqrt(
    durations.reduce((acc, d) => acc + (d - mean) ** 2, 0) / durations.length
  );

  // Clustering de timestamps: sessões simultâneas (gap < 30 s)
  const ts = proofs.map(p => p.proof.timestamp).sort((a, b) => a - b);
  let clusterHits = 0;
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - ts[i - 1] < 30_000) clusterHits++;
  }
  const clusterRatio = clusterHits / Math.max(ts.length - 1, 1);

  const hasGaps = hasNocturnalGaps(proofs, windowHours);

  const highRisk = stddev < 2 || clusterRatio > 0.2 || !hasGaps;
  const lowRisk  = stddev > 8 && clusterRatio < 0.05 && hasGaps;

  return highRisk ? 'high' : lowRisk ? 'low' : 'medium';
}

/**
 * Gera o verdict textual — legível por humanos e por outros agentes.
 */
function buildVerdict(nhi, proofs, sybilRisk, windowHours) {
  const hours = Math.round(totalMinutes(proofs) / 60);
  const tier   = nhi >= 80 ? 'tier-3 (premium)'
               : nhi >= 70 ? 'tier-2 (padrão)'
               : nhi >= 50 ? 'tier-1 (básico)'
               : 'inelegível para staking';

  const sybilLabel = {
    low:    'Padrão humano confirmado. Risco Sybil baixo.',
    medium: 'Padrão ambíguo. Revisão manual recomendada antes de operações de alto valor.',
    high:   'ALERTA: padrão de automação detectado. Risco Sybil elevado.',
  }[sybilRisk];

  return (
    `Nó ativo com ${hours}h verificadas em ${windowHours}h de janela ` +
    `(${proofs.length} sessões). ${sybilLabel} NHI ${nhi}/100 — ${tier}.`
  );
}

// ─── Handler principal ────────────────────────────────────────────────────────

/**
 * Ponto de entrada do Agent Card MIND.
 *
 * @param {Object} input
 * @param {string} [input.wallet]       — endereço Solana base58
 * @param {string} [input.uid_hash]     — sha256(uid) hex 64 chars
 * @param {number} [input.window_hours] — default 24, máx 720
 * @param {'quick'|'full'|'sybil_check'} [input.mode] — default 'full'
 * @returns {Promise<Object>} ClintOutput
 */
async function execute(input = {}) {
  const {
    wallet,
    uid_hash,
    window_hours = 24,
    mode         = 'full',
  } = input;

  if (!wallet && !uid_hash) {
    throw new Error('CLINT: forneça `wallet` (base58) ou `uid_hash` (hex).');
  }
  if (window_hours < 1 || window_hours > 720) {
    throw new Error('CLINT: window_hours deve estar entre 1 e 720.');
  }

  const conn  = new Connection(RPC_URL, 'confirmed');
  const now   = Date.now();
  const fromTs = now - window_hours * 3_600_000;

  // ── Resolve endereço de busca ─────────────────────────────────────────────
  let searchAddress;
  let pdaAddress;

  if (wallet) {
    searchAddress = walletToSearchKey(wallet);
    // Sem uid_hash explícito: tenta ler o PDA a partir do payload das Memos
    pdaAddress = null; // resolvido após extrair uid_hash das Memos
  } else {
    pdaAddress    = getPDA(uid_hash);
    searchAddress = pdaAddress;
  }

  // ── Fetch de provas ───────────────────────────────────────────────────────
  const memoLimit = mode === 'quick' ? 10 : 200;
  const rawProofs = await fetchSessionProofs(conn, searchAddress, fromTs, now, memoLimit);

  // ── Resolve PDA a partir do uid_hash da primeira Memo (se veio por wallet) ─
  if (wallet && rawProofs.length > 0 && !pdaAddress) {
    const inferredHash = rawProofs[0].proof.uidHash;
    if (inferredHash) {
      pdaAddress = getPDA(inferredHash);
    }
  }

  // ── Leitura do PDA ────────────────────────────────────────────────────────
  const pdaData = pdaAddress ? await readPDA(conn, pdaAddress) : null;

  // ── Cálculo ───────────────────────────────────────────────────────────────
  const nhi       = calcNHI(rawProofs, pdaData, window_hours);
  const sybilRisk = classifySybil(rawProofs, window_hours);
  const streak    = calcLongestStreak(rawProofs);
  const verified  = totalMinutes(rawProofs);

  // ── Monta output ──────────────────────────────────────────────────────────
  return {
    node_health_index:    nhi,
    verified_minutes:     verified,
    total_sessions:       rawProofs.length,
    longest_streak_hours: Math.round(streak * 10) / 10,
    points_accumulated:   pdaData?.pontos    ?? 0,
    tokens_redeemed:      pdaData?.resgates  ?? 0,
    sybil_risk:           sybilRisk,
    proof_hashes:         rawProofs.map(p => p.signature),
    anchor_pda:           pdaAddress?.toString() ?? null,
    analysis_window: {
      from: new Date(fromTs).toISOString(),
      to:   new Date(now).toISOString(),
    },
    verdict: buildVerdict(nhi, rawProofs, sybilRisk, window_hours),
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { execute };

// ─── CLI de teste rápido ──────────────────────────────────────────────────────
// Uso: node index.js <wallet_ou_uid_hash> [window_hours] [mode]
//
if (require.main === module) {
  const [,, target, wh, m] = process.argv;
  if (!target) {
    console.error('Uso: node index.js <wallet|uid_hash> [window_hours=24] [mode=full]');
    process.exit(1);
  }

  const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(target);
  const inp = {
    [isBase58 ? 'wallet' : 'uid_hash']: target,
    window_hours: parseInt(wh, 10) || 24,
    mode: m || 'full',
  };

  console.log(`\n[CLINT] RPC: ${RPC_URL}`);
  console.log(`[CLINT] Input:`, JSON.stringify(inp, null, 2));

  execute(inp)
    .then(out => {
      console.log('\n[CLINT] Output:');
      console.log(JSON.stringify(out, null, 2));
    })
    .catch(err => {
      console.error('[CLINT] Erro:', err.message);
      process.exit(1);
    });
}
