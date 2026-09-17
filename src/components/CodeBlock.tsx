import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'css',
  title,
  maxHeight = 'max-h-72'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-2 rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-700/60 bg-[#1e1e24] text-stone-100 text-xs font-mono shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#17171c] border-b border-stone-800 text-[11px] text-stone-400">
        <span className="font-semibold text-stone-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400/80 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-amber-400/80 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 inline-block"></span>
          {title || language.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors text-[11px] cursor-pointer"
          title="复制全部代码"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">已复制!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>复制代码</span>
            </>
          )}
        </button>
      </div>
      <div className={`p-3.5 overflow-x-auto overflow-y-auto ${maxHeight} text-stone-200 leading-relaxed scrollbar-thin`}>
        <pre className="m-0 font-mono text-[12px]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
