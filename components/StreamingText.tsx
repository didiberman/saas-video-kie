"use client";

import { useEffect, useRef } from "react";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming, className = "" }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom as text streams
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`${className} overflow-y-auto`}>
      <p className="whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span
            className="inline-block ml-0.5 text-violet-400"
            style={{
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            |
          </span>
        )}
      </p>
    </div>
  );
}
