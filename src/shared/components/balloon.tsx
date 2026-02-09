"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BalloonProps {
  open: boolean;
  className?: string;
  positionClassName?: string;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
}

export function Balloon({
  open,
  className,
  positionClassName,
  align = "right",
  children
}: BalloonProps) {
  const [isVisible, setIsVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);

  if (!isVisible) return null;

  const tailPosition =
    align === "left"
      ? "left-4"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "right-4";

  return (
    <div
      className={cn(
        "absolute z-50",
        positionClassName,
        isClosing
          ? "opacity-0 scale-95 translate-y-1"
          : "opacity-100 scale-100 translate-y-0",
        "transition-[opacity,transform] duration-200 ease-out"
      )}
    >
      <div
        className={cn(
          "relative rounded-md border border-muted-foreground/20 bg-popover p-3 text-xs text-foreground shadow-lg",
          className
        )}
        style={{ borderWidth: "0.75px" }}
      >
        <svg
          className={cn("absolute -top-2 h-2 w-4 text-muted-foreground/20", tailPosition)}
          viewBox="0 0 16 8"
          aria-hidden="true"
        >
          <path
            d="M0,8 L8,0 L16,8 Z"
            className="fill-popover"
            stroke="currentColor"
            strokeWidth="0.75"
          />
        </svg>
        {children}
      </div>
    </div>
  );
}
