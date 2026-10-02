import { useState } from "react";
import { ImageOff } from "lucide-react";

export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-ink-faint)] ${className}`}
        role="img"
        aria-label={`${alt} — image unavailable`}
      >
        <ImageOff className="h-8 w-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
