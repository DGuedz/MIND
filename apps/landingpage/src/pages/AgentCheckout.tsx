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
            <div className="mb-5 inline-flex border border-white/15 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
              Agent Checkout
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Publish. Price. Deliver after proof.
            </h1>
          </div>
          <div className="border border-white/10 bg-white/[0.02] p-5 font-mono text-xs text-zinc-400">
            <div className="mb-2 text-zinc-200">status: {status}</div>
            <div>production settlement: INSUFFICIENT_EVIDENCE</div>
            <div>local proof mode: dev-simulated</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 border border-white/10 bg-black p-5">
            <label className="block text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full border border-white/10 bg-white/[0.03] px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/30"
              />
            </label>

            <label className="block text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
              Description
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full border border-white/10 bg-white/[0.03] px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/30"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-[0.35fr_0.65fr]">
              <label className="block text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
                Price USD
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="mt-2 w-full border border-white/10 bg-white/[0.03] px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/30"
                />
              </label>

              <label className="block text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
                Recipient
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  className="mt-2 w-full border border-white/10 bg-white/[0.03] px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/30"
                />
              </label>
            </div>

            <label className="block text-xs font-mono uppercase tracking-[0.24em] text-zinc-500">
              Content
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={9}
                className="mt-2 w-full resize-none border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-sm normal-case tracking-normal text-zinc-200 outline-none focus:border-white/30"
              />
            </label>

            <Button onClick={publishArtifact} className="h-11 w-full rounded-none">
              <Upload className="mr-2 h-4 w-4" />
              Publish local artifact
            </Button>
          </div>

          <div className="space-y-4">
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">Artifact</div>
                {artifact ? (
                  <button onClick={copyAgentPrompt} className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white">
                    <Clipboard className="h-4 w-4" />
                    Copy agent prompt
                  </button>
                ) : null}
              </div>

              {artifact ? (
                <div className="space-y-3 font-mono text-xs text-zinc-400">
                  <div className="text-base font-sans text-white">{artifact.title}</div>
                  <div>slug: {artifact.slug}</div>
                  <div>price: ${Number(artifact.price).toFixed(2)} USDC</div>
                  <div>checksum: {shortHash(artifact.checksum)}</div>
                  <div>recipient: {shortHash(artifact.wallet_address)}</div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">No artifact published in this browser session.</div>
              )}
            </div>

            {endpoints ? (
              <div className="border border-white/10 bg-black p-5 font-mono text-xs text-zinc-400">
                <div className="mb-3 uppercase tracking-[0.24em] text-zinc-500">Endpoints</div>
                <div>GET {endpoints.metadata}</div>
                <div>GET {endpoints.price}</div>
                <div>GET {endpoints.content}</div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={probeLockedContent} disabled={!artifact} variant="outline" className="h-11 rounded-none">
                <LockKeyhole className="mr-2 h-4 w-4" />
                Probe content
              </Button>
              <Button onClick={unlockWithDevProof} disabled={!artifact} variant="secondary" className="h-11 rounded-none">
                <UnlockKeyhole className="mr-2 h-4 w-4" />
                Dev unlock
              </Button>
            </div>

            {pricePayload ? (
              <pre className="max-h-40 overflow-auto border border-white/10 bg-black p-4 text-xs text-zinc-300">{pricePayload}</pre>
            ) : null}

            {challenge ? (
              <pre className="max-h-64 overflow-auto border border-amber-400/30 bg-amber-400/[0.04] p-4 text-xs text-amber-100">
                {JSON.stringify(challenge, null, 2)}
              </pre>
            ) : null}

            {unlockedContent ? (
              <div className="border border-emerald-400/30 bg-emerald-400/[0.04] p-5">
                <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-emerald-200">
                  <ReceiptText className="h-4 w-4" />
                  Delivered content
                </div>
                <pre className="whitespace-pre-wrap text-sm text-zinc-100">{unlockedContent}</pre>
              </div>
            ) : null}

            {error ? (
              <div className="border border-red-400/30 bg-red-400/[0.04] p-4 text-sm text-red-100">{error}</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
