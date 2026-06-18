"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

function normalizeLatexDelimiters(content: string) {
  return content
    // Convierte \[ ... \] a $$ ... $$
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, equation) => {
      return `\n$$\n${equation.trim()}\n$$\n`;
    })

    // Convierte \( ... \) a $ ... $
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, equation) => {
      return `$${equation.trim()}$`;
    })

    // Caso de rescate:
    // Si quedó guardado como [ 3 \cdot 2 = 6 ],
    // lo tratamos como bloque matemático SOLO si contiene comandos LaTeX.
    .replace(
      /^\s*\[\s*([^\]]*\\(?:cdot|frac|sqrt|angle|triangle|overline|text|sum|prod|leq|geq|neq|times|div|pi|theta|alpha|beta|gamma)[^\]]*)\s*\]\s*$/gm,
      (_, equation) => {
        return `\n$$\n${equation.trim()}\n$$\n`;
      }
    );
}

export function MarkdownMath({ content }: { content: string }) {
  const normalizedContent = normalizeLatexDelimiters(content);

  return (
    <div className="max-w-none text-sm leading-7 text-slate-700 [&_p]:mb-3 [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&_strong]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-950 [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:rounded-xl [&_.katex-display]:bg-white [&_.katex-display]:p-3">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}