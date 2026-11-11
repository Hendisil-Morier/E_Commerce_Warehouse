import React from "react";

export interface SkeletonProps {
  variant?: "text" | "rect" | "circle";
  width?: string | number;
  height?: string | number;
  lines?: number;
  gap?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "text",
  width = "100%",
  height,
  lines = 1,
  gap = 10,
  className = "",
}) => {
  const resolvedHeight =
    height ?? (variant === "circle" ? width : variant === "rect" ? 40 : 14);

  if (lines > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={`ew-skeleton ${className}`.trim()}
            style={{
              width: index === lines - 1 ? "72%" : width,
              height: resolvedHeight,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`ew-skeleton ${variant === "circle" ? "ew-skeleton--circle" : ""} ${className}`.trim()}
      style={{ width, height: resolvedHeight }}
    />
  );
};

