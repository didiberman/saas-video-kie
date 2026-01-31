"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming, className = "" }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`${className} overflow-y-auto`}>
      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      {isStreaming && (
        <span className="inline-block text-violet-400 animate-pulse">|</span>
      )}
    </div>
  );
}
