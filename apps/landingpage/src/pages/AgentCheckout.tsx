import { useMemo, useState } from "react";
import { Clipboard, LockKeyhole, ReceiptText, Upload, UnlockKeyhole } from "lucide-react";
import { Button } from "../components/ui/button";

type ArtifactMetadata = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content_type: string;
  price: string;
  wallet_address: string;
  checksum: string;
  published_at: string;
  settlement: {
    protocol: string;
    mode: string;
    production_status: string;
  };
};

type PaymentChallenge = {
  error: string;
  protocol: string;
  status: string;
  production_status: string;
  challenge: {
    amount: string;
    currency: string;
    recipient: string;
    chain: string;
    artifact: string;
    checksum: string;
  };
  dev_unlock: {
    header: string;
    warning: string;
  };
};

const starterContent = `# Hermes Cron Orchestrator Agent Card

Service: scheduled automations
Methods: GET, POST
Pricing: x402
Policy: execution gated, budget limit enforcement, zero emojis
Proof: append-only + checksum evidence`;

function shortHash(value: string) {
  if (!value) return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export function AgentCheckoutPage() {
  const [title, setTitle] = useState("Hermes Cron Orchestrator Agent Card");
  const [description, setDescription] = useState("Scheduled automation Agent Card with x402-ready delivery.");
  const [price, setPrice] = useState("1.00");
  const [walletAddress, setWalletAddress] = useState("0x0000000000000000000000000000000000000001");
  const [content, setContent] = useState(starterContent);
  const [artifact, setArtifact] = useState<ArtifactMetadata | null>(null);
  const [challenge, setChallenge] = useState<PaymentChallenge | null>(null);
  const [unlockedContent, setUnlockedContent] = useState("");
  const [pricePayload, setPricePayload] = useState("");
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");

  const endpoints = useMemo(() => {
    if (!artifact) return null;
    const base = `/api/mind-artifact/${artifact.slug}`;
    return {
      metadata: base,
      price: `${base}/price`,
      content: `${base}/content?chain=solana-devnet`,
      devUnlock: `${base}/content?chain=solana-devnet&proof=dev-paid`
    };
  }, [artifact]);

  const publishArtifact = async () => {
    setStatus("publishing");
    setError("");
    setChallenge(null);
    setUnlockedContent("");
    setPricePayload("");

    try {
      const response = await fetch("/api/mind-artifact/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, price, walletAddress, content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "publish failed");
      setArtifact(data);
      setStatus("published");

      const priceResponse = await fetch(`/api/mind-artifact/${data.slug}/price`);
      setPricePayload(JSON.stringify(await priceResponse.json(), null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "publish failed");
      setStatus("error");
    }
  };

  const probeLockedContent = async () => {
    if (!artifact) return;
    setStatus("probing");
    setError("");
    setUnlockedContent("");

    try {
      const response = await fetch(`/api/mind-artifact/${artifact.slug}/content?chain=solana-devnet`);
      const data = await response.json();
      if (response.status !== 402) throw new Error("expected 402 payment challenge");
      setChallenge(data);
      setStatus("payment_required");
    } catch (err) {
      setError(err instanceof Error ? err.message : "probe failed");
      setStatus("error");
    }
  };

  const unlockWithDevProof = async () => {
    if (!artifact) return;
    setStatus("unlocking");
    setError("");

    try {
      const response = await fetch(`/api/mind-artifact/${artifact.slug}/content?chain=solana-devnet`, {
        headers: { "x-mind-payment-proof": "dev-paid" }
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || "unlock failed");
      setUnlockedContent(text);
      setStatus("dev_unlocked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "unlock failed");
      setStatus("error");
    }
  };

  const copyAgentPrompt = async () => {
    if (!artifact || !endpoints) return;
    await navigator.clipboard.writeText(
      `Buy and unlock ${artifact.title}. Check price at ${endpoints.price}, then request ${endpoints.content}. If the server returns 402, complete x402 payment to the listed recipient before retrying.`
    );
    setStatus("prompt_copied");
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 text-zinc-200">
      <section className="container mx-auto px-6">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex border border-[#14F195]/20 bg-[#14F195]/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em] text-[#14F195] shadow-[0_0_15px_rgba(20,241,149,0.1)]">
              Agent Checkout Simulation
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl font-mono uppercase">
              Publish. Price. <span className="text-zinc-500 italic">Deliver.</span>
            </h1>
          </div>
          <div className="metallic-brushed-solana border border-white/10 p-5 font-mono text-xs text-zinc-400 rounded-xl shadow-lg">
            <div className="mb-2 text-[#14F195] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse shadow-[0_0_8px_#14F195]"></span>
              status: {status}
            </div>
            <div>production settlement: INSUFFICIENT_EVIDENCE</div>
            <div>local proof mode: dev-simulated</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 border border-white/10 bg-[#020202]/80 backdrop-blur-md p-6 rounded-2xl shadow-inner">
            <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 font-bold">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full border border-white/10 bg-black/50 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/20 transition-all rounded-lg"
              />
            </label>

            <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 font-bold">
              Description
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full border border-white/10 bg-black/50 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/20 transition-all rounded-lg"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-[0.35fr_0.65fr]">
              <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 font-bold">
                Price USD
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="mt-2 w-full border border-white/10 bg-black/50 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/20 transition-all rounded-lg font-mono text-[#14F195]"
                />
              </label>

              <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 font-bold">
                Recipient
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  className="mt-2 w-full border border-white/10 bg-black/50 px-4 py-3 text-sm normal-case tracking-normal text-zinc-400 outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/20 transition-all rounded-lg font-mono text-[10px]"
                />
              </label>
            </div>

            <label className="block text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 font-bold">
              Content (SKILL.md)
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={9}
                className="mt-2 w-full resize-none border border-white/10 bg-black/50 px-4 py-4 font-mono text-[11px] normal-case tracking-normal text-zinc-300 outline-none focus:border-[#14F195]/50 focus:ring-1 focus:ring-[#14F195]/20 transition-all rounded-lg"
              />
            </label>

            <Button onClick={publishArtifact} className="h-12 w-full rounded-lg bg-[#14F195]/10 text-[#14F195] hover:bg-[#14F195]/20 border border-[#14F195]/30 shadow-[0_0_15px_rgba(20,241,149,0.15)] font-mono uppercase tracking-widest text-[10px] font-bold transition-all">
              <Upload className="mr-2 h-4 w-4" />
              Publish local artifact
            </Button>
          </div>

          <div className="space-y-4">
            <div className="metallic-brushed-solana border border-white/10 p-6 rounded-2xl shadow-lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500 font-bold">Artifact</div>
                {artifact ? (
                  <button onClick={copyAgentPrompt} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-zinc-400 hover:text-[#14F195] transition-colors">
                    <Clipboard className="h-3 w-3" />
                    Copy prompt
                  </button>
                ) : null}
              </div>

              {artifact ? (
                <div className="space-y-3 font-mono text-[11px] text-zinc-400">
                  <div className="text-lg font-bold text-white tracking-tight">{artifact.title}</div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>slug</span> <span className="text-zinc-300">{artifact.slug}</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>price</span> <span className="text-[#14F195]">${Number(artifact.price).toFixed(2)} USDC</span></div>
                  <div className="flex justify-between border-b border-white/5 pb-2"><span>checksum</span> <span className="text-zinc-500">{shortHash(artifact.checksum)}</span></div>
                  <div className="flex justify-between"><span>recipient</span> <span className="text-zinc-500">{shortHash(artifact.wallet_address)}</span></div>
                </div>
              ) : (
                <div className="text-xs text-zinc-600 font-mono italic">No artifact published in this browser session.</div>
              )}
            </div>

            {endpoints ? (
              <div className="border border-[#9945FF]/20 bg-[#9945FF]/5 p-5 font-mono text-[10px] text-[#9945FF]/70 rounded-xl">
                <div className="mb-3 uppercase tracking-[0.24em] text-[#9945FF] font-bold">A2A Endpoints</div>
                <div className="hover:text-[#9945FF] transition-colors cursor-crosshair">GET {endpoints.metadata}</div>
                <div className="hover:text-[#9945FF] transition-colors cursor-crosshair">GET {endpoints.price}</div>
                <div className="hover:text-[#9945FF] transition-colors cursor-crosshair">GET {endpoints.content}</div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={probeLockedContent} disabled={!artifact} variant="outline" className="h-12 rounded-lg border-white/20 bg-transparent hover:bg-white/5 font-mono uppercase tracking-widest text-[9px] text-zinc-300">
                <LockKeyhole className="mr-2 h-4 w-4 text-zinc-500" />
                Probe content
              </Button>
              <Button onClick={unlockWithDevProof} disabled={!artifact} className="h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono uppercase tracking-widest text-[9px]">
                <UnlockKeyhole className="mr-2 h-4 w-4" />
                Dev unlock
              </Button>
            </div>

            {pricePayload ? (
              <pre className="max-h-40 overflow-auto border border-white/10 bg-[#020202] p-4 text-[10px] text-zinc-400 rounded-xl shadow-inner">{pricePayload}</pre>
            ) : null}

            {challenge ? (
              <pre className="max-h-64 overflow-auto border border-amber-500/30 bg-amber-500/10 p-4 text-[10px] text-amber-200 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                {JSON.stringify(challenge, null, 2)}
              </pre>
            ) : null}

            {unlockedContent ? (
              <div className="border border-[#14F195]/30 bg-[#14F195]/10 p-5 rounded-xl shadow-[0_0_15px_rgba(20,241,149,0.1)]">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#14F195] font-bold">
                  <ReceiptText className="h-4 w-4" />
                  Delivered content
                </div>
                <pre className="whitespace-pre-wrap text-[11px] text-zinc-200 font-mono bg-black/50 p-4 rounded-lg">{unlockedContent}</pre>
              </div>
            ) : null}

            {error ? (
              <div className="border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-400 rounded-xl">{error}</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
