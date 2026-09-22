import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Safely renders LaTeX mathematical formulas inside text.
 * Parses $$...$$ for display formulas and $...$ for inline formulas.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';
    return parseAndRenderMath(content);
  }, [content]);

  if (inline) {
    return (
      <span
        className={`math-rendered-inline inline-block font-sans ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`math-rendered-block font-sans leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

/**
 * Parses markdown text and LaTeX syntax ($...$ and $$...$$) and converts to HTML
 */
export function parseAndRenderMath(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Process block math $$ ... $$ or \[ ... \]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-display-wrapper my-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-700/50 overflow-x-auto text-center shadow-inner">${rendered}</div>`;
    } catch {
      return `<div class="katex-error text-rose-400 font-mono text-xs my-1">[Matematik Formülü: ${escapeHtml(math)}]</div>`;
    }
  });

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="katex-display-wrapper my-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-700/50 overflow-x-auto text-center shadow-inner">${rendered}</div>`;
    } catch {
      return `<div class="katex-error text-rose-400 font-mono text-xs my-1">[Matematik Formülü: ${escapeHtml(math)}]</div>`;
    }
  });

  // 2. Process inline math $ ... $ or \( ... \) (avoid matching escaped \$)
  text = text.replace(/(?<!\\)\$([^\$\n\r]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<span class="katex-inline-error text-rose-400 font-mono text-[11px]">${escapeHtml(math)}</span>`;
    }
  });

  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<span class="katex-inline-error text-rose-400 font-mono text-[11px]">${escapeHtml(math)}</span>`;
    }
  });

  // 3. Process common Markdown formatting
  // Headers
  text = text.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-amber-300 mt-2 mb-1">$1</h4>');
  text = text.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-indigo-300 mt-2.5 mb-1.5">$1</h3>');
  text = text.replace(/^# (.*$)/gim, '<h2 class="text-lg font-black text-white mt-3 mb-2">$1</h2>');

  // Bold & Italic
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-amber-200/90">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

  // Newlines to br where appropriate (if not already inside tags)
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-1 pl-1">');
        inList = true;
      }
      processedLines.push(`<li class="text-slate-200">${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        processedLines.push('<div class="h-1.5"></div>');
      } else {
        processedLines.push(`<div>${line}</div>`);
      }
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ParsedStep {
  number: number;
  title: string;
  content: string[];
}

export interface ParsedSolutionData {
  title?: string;
  givens: string[];
  rules: string[];
  steps: ParsedStep[];
  answer?: string;
  otherLines: string[];
}

/**
 * Deconstructs a question solution text into clear pedagogical visual sections
 */
export function parseStructuredSolution(solutionText: string): ParsedSolutionData {
  const result: ParsedSolutionData = {
    givens: [],
    rules: [],
    steps: [],
    otherLines: [],
  };

  if (!solutionText) return result;

  const lines = solutionText.split('\n');
  let currentSection: 'none' | 'givens' | 'rules' | 'steps' | 'other' = 'none';
  let currentStep: ParsedStep | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Detect Answer
    if (/^(Cevap|Doğru Cevap|Sonuç|Yanıt)\s*[:=]/i.test(trimmed) || /\*\*Cevap\s*[:=]/i.test(trimmed)) {
      result.answer = trimmed.replace(/^\*\*|\*\*$/g, '');
      currentSection = 'other';
      continue;
    }

    // Detect Header
    if (trimmed.startsWith('#') || /^(### Çözüm|Çözüm:|Soru Çözümü)/i.test(trimmed)) {
      result.title = trimmed.replace(/^[#\s]+/, '').replace(/:$/, '');
      continue;
    }

    // Detect Given / Verilenler
    if (/^(Verilenler|Soruda Verilenler|Tanım)\s*[:=]/i.test(trimmed) || /\*\*Verilenler\*\*/i.test(trimmed)) {
      currentSection = 'givens';
      const clean = trimmed.replace(/^(\*\*Verilenler\*\*|Verilenler\s*[:=])/, '').trim();
      if (clean) result.givens.push(clean.replace(/^[-*]\s*/, ''));
      continue;
    }

    // Detect Rules / Formüller
    if (/^(Kural|Formül|Formüller|Kazanım Kuralı)\s*[:=]/i.test(trimmed) || /\*\*(Kural|Formül)\*\*/i.test(trimmed)) {
      currentSection = 'rules';
      const clean = trimmed.replace(/^(\*\*(Kural|Formül)\*\*|(Kural|Formül)\s*[:=])/, '').trim();
      if (clean) result.rules.push(clean.replace(/^[-*]\s*/, ''));
      continue;
    }

    // Detect Steps section header
    if (/^(Adımlar|Çözüm Adımları)\s*[:=]/i.test(trimmed) || /\*\*Adımlar\*\*/i.test(trimmed)) {
      currentSection = 'steps';
      continue;
    }

    // Detect Numbered Step (e.g., "1. Bölge Analizi:" or "1) ...")
    const stepMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)/);
    if (stepMatch && (currentSection === 'steps' || currentSection === 'none' || currentSection === 'givens')) {
      currentSection = 'steps';
      if (currentStep) {
        result.steps.push(currentStep);
      }
      currentStep = {
        number: parseInt(stepMatch[1], 10),
        title: stepMatch[2].replace(/^\*\*|\*\*$/g, '').trim(),
        content: [],
      };
      continue;
    }

    // Content lines depending on section
    if (currentSection === 'givens') {
      result.givens.push(trimmed.replace(/^[-*]\s*/, ''));
    } else if (currentSection === 'rules') {
      result.rules.push(trimmed.replace(/^[-*]\s*/, ''));
    } else if (currentSection === 'steps' && currentStep) {
      currentStep.content.push(trimmed.replace(/^[-*]\s*/, ''));
    } else {
      result.otherLines.push(trimmed);
    }
  }

  if (currentStep) {
    result.steps.push(currentStep);
  }

  return result;
}
