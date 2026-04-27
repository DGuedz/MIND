import { useMemo, useState } from "react";

type RealQrCodeProps = {
  path: string;
  label: string;
  className?: string;
};

function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function RealQrCode({ path, label, className }: RealQrCodeProps) {
  const [useFallback, setUseFallback] = useState(false);
  const targetUrl = useMemo(() => getAbsoluteUrl(path), [path]);
  const qrImageUrl = useMemo(() => {
    const data = encodeURIComponent(targetUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${data}`;
  }, [targetUrl]);

  return (
    <a
      href={targetUrl}
      aria-label={label}
      className={className}
    >
      <div className="rounded-2xl bg-white p-3 shadow-[0_20px_60px_rgba(255,255,255,0.08)]">
        <img
          src={useFallback ? "/the-garage-builder-flow-qr.svg" : qrImageUrl}
          alt={label}
          className="aspect-square h-full w-full"
          loading="lazy"
          onError={() => setUseFallback(true)}
        />
      </div>
      <div className="mt-3 break-all text-center font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
        {targetUrl}
      </div>
    </a>
  );
}
