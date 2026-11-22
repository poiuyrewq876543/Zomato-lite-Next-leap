import type { CSSProperties } from "react";

const STAR_PATH =
  "M12 2.4l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.46l-5.9 3.11 1.13-6.57L2.45 9.34l6.6-.96L12 2.4z";

function StarRow() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" focusable="false">
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      ))}
    </>
  );
}

type StarsProps = {
  value: number;
  size?: number;
  className?: string;
};

/** Five stars with a fractional fill, so 4.3 reads as 4.3 stars. */
export function Stars({ value, size = 16, className = "" }: StarsProps) {
  const clamped = Math.min(5, Math.max(0, value));
  const width = (clamped / 5) * 100;

  return (
    <span
      className={`stars ${className}`.trim()}
      style={{ "--star-size": `${size}px` } as CSSProperties}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      <span className="stars__row stars__base" aria-hidden="true">
        <StarRow />
      </span>
      <span
        className="stars__row stars__fill"
        style={{ width: `${width}%` }}
        aria-hidden="true"
      >
        <StarRow />
      </span>
    </span>
  );
}
