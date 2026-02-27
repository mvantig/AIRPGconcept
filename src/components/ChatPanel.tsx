"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types/game";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in ${
              msg.role === "user" ? "flex justify-end" : ""
            }`}
          >
            {msg.role === "user" ? (
              <div
                className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                }}
              >
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ) : msg.role === "system" ? (
              <div className="text-center py-2">
                <span className="text-xs text-[var(--color-text-dim)] italic">
                  {msg.content}
                </span>
              </div>
            ) : (
              <div
                className="max-w-[95%] px-4 py-3 rounded-2xl rounded-bl-md border"
                style={{
                  background: "var(--color-surface-light)",
                  borderColor: "var(--color-border)",
                }}
              >
                <p className="text-[var(--color-text)] text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-1.5 px-4 py-3 animate-fade-in">
            <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex gap-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you do?"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl border text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 text-sm"
          style={{
            background: "var(--color-surface-light)",
            borderColor: "var(--color-border)",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background:
              input.trim() && !isLoading
                ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                : "var(--color-surface-light)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
