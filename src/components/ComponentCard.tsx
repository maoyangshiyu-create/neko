import React, { useState, useEffect, useRef } from 'react';
import { ComponentItem, AestheticStyleId, CodeTab } from '../types';
import { STYLES } from '../data/manualData';
import { CodeBlock } from './CodeBlock';
import { 
  Play, 
  Code, 
  Sparkles, 
  Layers, 
  Bot, 
  Copy, 
  Check, 
  ChevronDown, 
  X, 
  Plus, 
  Minus,
  RotateCcw,
  Download,
  FileCode,
  FileDown
} from 'lucide-react';

interface ComponentCardProps {
  component: ComponentItem;
  currentStyle: AestheticStyleId;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  currentStyle
}) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('preview');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [downloadedCss, setDownloadedCss] = useState(false);
  const [includeHtmlInBundle, setIncludeHtmlInBundle] = useState(false);

  // Component-specific interactive states:
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [splitMenuOpen, setSplitMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('已删除 1 条消息');
  const [toggleOn, setToggleOn] = useState(true);
  const [badgeCount, setBadgeCount] = useState(12);
  const [spinnerSpeed, setSpinnerSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');

  const popoverRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const snackTimerRef = useRef<any>(null);

  const styleConfig = STYLES[currentStyle];

  // Outside click listener for popover and split menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
      if (splitRef.current && !splitRef.current.contains(e.target as Node)) {
        setSplitMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerSnackbar = (msg = '已删除 1 条消息') => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    snackTimerRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, 3200);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(component.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // Current aesthetic css
  const currentAestheticCss = component.aestheticsCss[currentStyle] || component.aestheticsCss.morandi;

  // Pure CSS bundle (Structure + Jelly Feedback + Aesthetic CSS + Theme Variables)
  const pureCssBundle = `/**
 * ==============================================================================
 * 组件名称: ${component.title} (${component.nameEn})
 * 美化风格: ${styleConfig.name} (${currentStyle})
 * 架构规范: 结构层基础 + 果冻反馈 (只碰 transform/transition) + 视觉美化
 * 来源: UI 组件 × 果冻反馈 × 美化代码 参考手册
 * ==============================================================================
 */

/* --- 0. 主题变量定义 (:root) --- */
:root {
  --bg: ${styleConfig.vars.bg};
  --paper: ${styleConfig.vars.paper};
  --ink: ${styleConfig.vars.ink};
  --ink-soft: ${styleConfig.vars.inkSoft};
  --line: ${styleConfig.vars.line};
  --accent: ${styleConfig.vars.accent};
  --accent-deep: ${styleConfig.vars.accentDeep};
  --secondary: ${styleConfig.vars.secondary};
  --danger: ${styleConfig.vars.danger};
  --radius: ${styleConfig.vars.radius};
  --shadow: ${styleConfig.vars.shadow};
}

/* --- 1. 结构定位层 (Structure CSS) --- */
${component.structureCss ? component.structureCss : '/* 采用默认流式布局，无额外定位规则 */'}

/* --- 2. 果冻反馈层 (Jelly Feedback CSS: 只碰 transform 与 transition) --- */
${component.feedbackCss}

/* --- 3. 视觉美化层 (Aesthetic CSS: 色彩、圆角、阴影) --- */
${currentAestheticCss}
`;

  // Full bundle with HTML markup
  const fullBundleWithHtml = `/* ==============================================================================
 * HTML 结构代码 (Structure Markup)
 * ============================================================================== */
/*
${component.structureHtml}
*/

${pureCssBundle}`;

  const currentExportCode = includeHtmlInBundle ? fullBundleWithHtml : pureCssBundle;

  // Handle CSS File Download
  const handleDownloadCss = () => {
    try {
      const blob = new Blob([pureCssBundle], { type: 'text/css;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${component.id}-${currentStyle}.css`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadedCss(true);
      setTimeout(() => setDownloadedCss(false), 2200);
    } catch {
      // Fallback: copy to clipboard
      handleCopyCss();
    }
  };

  // Handle Copy Combined CSS
  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(currentExportCode);
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = currentExportCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 2000);
    }
  };

  return (
    <div
      id={`comp-${component.id}`}
      className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs scroll-mt-24 transition-all duration-200"
    >
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 rounded-xl bg-stone-100/80 border border-stone-200/50">
            {component.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-stone-800">
                {component.title}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                {component.nameEn}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {component.description}
            </p>
          </div>
        </div>

        {/* Action Buttons: Download CSS, Copy CSS & Copy Prompt */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export / Download .css button */}
          <button
            onClick={handleDownloadCss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95 border border-stone-200"
            title={`下载 ${component.id}-${currentStyle}.css 单文件`}
          >
            {downloadedCss ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">已下载 .css!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>导出 .css</span>
              </>
            )}
          </button>

          {/* Copy Combined CSS button */}
          <button
            onClick={handleCopyCss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95 border border-stone-200"
            title="复制结构+反馈+美化合并 CSS"
          >
            {copiedCss ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">CSS 已复制!</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span>复制合并 CSS</span>
              </>
            )}
          </button>

          {/* Prompt copy pill */}
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95"
            title="复制直接喂给 AI 的 Prompt"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI 指令已复制!</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>复制 AI 指令</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>交互试玩</span>
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'structure'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>结构代码</span>
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>果冻反馈代码</span>
        </button>
        <button
          onClick={() => setActiveTab('aesthetics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'aesthetics'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <span>{styleConfig.icon}</span>
          <span>美化代码 ({styleConfig.name})</span>
        </button>
        <button
          onClick={() => setActiveTab('combined')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'combined'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>三层融合代码</span>
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'prompt'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-blue-500" />
          <span>AI 提示词详情</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-1">
        {/* TAB 1: PREVIEW INTERACTION */}
        {activeTab === 'preview' && (
          <div className="relative min-h-[200px] p-6 rounded-2xl bg-stone-50/70 border border-stone-200/60 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-2.5 right-3 text-[11px] text-stone-400 font-mono">
              实时风格: {styleConfig.name}
            </div>

            {/* Component 1: Drawer */}
            {component.id === 'drawer' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className={`px-5 py-2.5 font-medium text-sm transition-all duration-300 cursor-pointer active:scale-90 ${styleConfig.buttonClass}`}
                  style={{
                    transition: 'transform 0.65s cubic-bezier(0.34, 1.9, 0.4, 1)'
                  }}
                >
                  打开抽屉面板
                </button>
                <span className="text-xs text-stone-400">
                  点击滑出右侧侧边栏，支持点击遮罩退出
                </span>

                {/* Sliding Drawer Simulation */}
                {drawerOpen && (
                  <div
                    className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs transition-opacity duration-300"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-80 max-w-[85vw] h-full p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 transform translate-x-0"
                      style={{
                        backgroundColor: currentStyle === 'glass' ? 'rgba(255,255,255,0.85)' : styleConfig.vars.paper,
                        backdropFilter: currentStyle === 'glass' ? 'blur(20px)' : 'none',
                        color: styleConfig.vars.ink,
                        borderLeft: `1px solid ${styleConfig.vars.line}`,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: styleConfig.vars.line }}>
                          <h4 className="font-bold text-base flex items-center gap-2">
                            <span>🗂️</span> 筛选设置面板
                          </h4>
                          <button
                            onClick={() => setDrawerOpen(false)}
                            className="p-1 rounded-full hover:bg-stone-200/50 cursor-pointer transition-transform active:scale-85"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="py-4 space-y-3 text-sm">
                          <div className="p-3 rounded-xl bg-stone-100/50 hover:bg-stone-100 flex items-center justify-between cursor-pointer">
                            <span>全部消息</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200">128</span>
                          </div>
                          <div className="p-3 rounded-xl bg-stone-100/50 hover:bg-stone-100 flex items-center justify-between cursor-pointer">
                            <span>未读消息优先</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          </div>
                          <div className="p-3 rounded-xl bg-stone-100/50 hover:bg-stone-100 flex items-center justify-between cursor-pointer">
                            <span>只看带表情包</span>
                            <span className="text-xs">🖼️</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t" style={{ borderColor: styleConfig.vars.line }}>
                        <button
                          onClick={() => setDrawerOpen(false)}
                          className={`w-full py-2.5 text-xs font-semibold ${styleConfig.buttonClass}`}
                        >
                          确认并关闭
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Component 2: Popover */}
            {component.id === 'popover' && (
              <div className="relative" ref={popoverRef}>
                <button
                  onClick={() => setPopoverOpen(!popoverOpen)}
                  className={`px-5 py-2.5 font-medium text-sm transition-all duration-300 cursor-pointer active:scale-90 ${styleConfig.buttonClass}`}
                  style={{
                    transition: 'transform 0.65s cubic-bezier(0.34, 1.9, 0.4, 1)'
                  }}
                >
                  批量操作 ▾
                </button>

                {popoverOpen && (
                  <div
                    className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-48 p-2 z-30 transition-all duration-200"
                    style={{
                      backgroundColor: currentStyle === 'glass' ? 'rgba(255,255,255,0.85)' : styleConfig.vars.paper,
                      backdropFilter: currentStyle === 'glass' ? 'blur(18px)' : 'none',
                      color: styleConfig.vars.ink,
                      border: `1px solid ${styleConfig.vars.line}`,
                      borderRadius: styleConfig.vars.radius,
                      boxShadow: styleConfig.vars.shadow,
                      transform: 'translate(-50%, 0) scale(1)',
                      transition: 'transform 0.45s cubic-bezier(0.34, 1.8, 0.4, 1)'
                    }}
                  >
                    {/* Arrow pointer */}
                    <div
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                      style={{
                        backgroundColor: currentStyle === 'glass' ? 'rgba(255,255,255,0.85)' : styleConfig.vars.paper,
                        borderLeft: `1px solid ${styleConfig.vars.line}`,
                        borderTop: `1px solid ${styleConfig.vars.line}`,
                      }}
                    />
                    <div className="space-y-1 text-xs">
                      <button
                        onClick={() => { triggerSnackbar('已执行：重命名'); setPopoverOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-200/40 cursor-pointer transition-colors"
                      >
                        ✏️ 重命名
                      </button>
                      <button
                        onClick={() => { triggerSnackbar('已执行：置顶对话'); setPopoverOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-200/40 cursor-pointer transition-colors"
                      >
                        📌 置顶
                      </button>
                      <button
                        onClick={() => { triggerSnackbar('已执行：删除项目'); setPopoverOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Component 3: Split Button */}
            {component.id === 'split' && (
              <div className="relative inline-flex items-center" ref={splitRef}>
                <div className="inline-flex shadow-sm">
                  <button
                    onClick={() => triggerSnackbar('已执行默认导出: PDF 文件')}
                    className="px-4 py-2.5 font-medium text-xs sm:text-sm text-white transition-all duration-200 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: styleConfig.vars.accent,
                      borderRadius: `${styleConfig.vars.radius} 0 0 ${styleConfig.vars.radius}`,
                    }}
                  >
                    导出文件
                  </button>
                  <button
                    onClick={() => setSplitMenuOpen(!splitMenuOpen)}
                    className="px-3 py-2.5 text-xs text-white border-l border-white/20 transition-all duration-200 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: styleConfig.vars.accent,
                      borderRadius: `0 ${styleConfig.vars.radius} ${styleConfig.vars.radius} 0`,
                    }}
                  >
                    ▾
                  </button>
                </div>

                {splitMenuOpen && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 w-36 p-1.5 z-20 shadow-lg transition-all"
                    style={{
                      backgroundColor: styleConfig.vars.paper,
                      borderRadius: styleConfig.vars.radius,
                      border: `1px solid ${styleConfig.vars.line}`,
                      color: styleConfig.vars.ink,
                      boxShadow: styleConfig.vars.shadow,
                    }}
                  >
                    <button
                      onClick={() => { triggerSnackbar('开始导出为 PDF...'); setSplitMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-stone-100 cursor-pointer"
                    >
                      📄 导出为 PDF
                    </button>
                    <button
                      onClick={() => { triggerSnackbar('开始导出为 Excel...'); setSplitMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-stone-100 cursor-pointer"
                    >
                      📊 导出为 Excel
                    </button>
                    <button
                      onClick={() => { triggerSnackbar('开始导出为 Markdown...'); setSplitMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-stone-100 cursor-pointer"
                    >
                      📝 导出为 Markdown
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Component 4: Accordion */}
            {component.id === 'accordion' && (
              <div className="w-full max-w-md space-y-2">
                {[
                  { title: '如何创建新角色卡？', content: '在主界面点击右下角的"+"浮动按钮，填写角色名字、人设设定与世界书绑定即可。' },
                  { title: '世界书全局与局部有什么区别？', content: '全局世界书所有角色自动生效（如时代大背景），局部世界书仅对勾选绑定的角色生效（如个人秘密档案）。' },
                  { title: '表情包为什么建议存 Base64？', content: 'blob: 临时地址在浏览器刷新后会立即失效导致裂图，Base64 转码后可持久保存在 localStorage 或 IndexedDB 中。' }
                ].map((item, idx) => {
                  const isOpen = activeAccordion === idx;
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden border-b transition-colors"
                      style={{ borderColor: styleConfig.vars.line }}
                    >
                      <button
                        onClick={() => setActiveAccordion(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between py-3 text-left font-medium text-xs sm:text-sm cursor-pointer transition-all active:scale-98"
                        style={{ color: styleConfig.vars.ink }}
                      >
                        <span>{item.title}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-600' : 'text-stone-400'}`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out text-xs overflow-hidden leading-relaxed ${
                          isOpen ? 'max-h-28 opacity-100 pb-3' : 'max-h-0 opacity-0'
                        }`}
                        style={{ color: styleConfig.vars.inkSoft }}
                      >
                        {item.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Component 5: Snackbar */}
            {component.id === 'snackbar' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerSnackbar('已删除 1 条对话记录')}
                    className={`px-4 py-2 text-xs font-medium ${styleConfig.buttonClass} active:scale-90`}
                  >
                    删除一条消息
                  </button>
                  <button
                    onClick={() => triggerSnackbar('已成功更新世界书绑定状态')}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer active:scale-90"
                  >
                    保存设定提示
                  </button>
                </div>
                <span className="text-xs text-stone-400">
                  点击按钮触发底部悬浮轻提示，支持撤销与 3 秒倒计时自动消除
                </span>

                {snackbarVisible && (
                  <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-4 py-2.5 shadow-2xl text-xs sm:text-sm transition-all duration-300"
                    style={{
                      backgroundColor: currentStyle === 'mono' ? '#111111' : currentStyle === 'macaron' ? '#ff8fab' : '#4d4640',
                      color: '#fbf8f5',
                      borderRadius: styleConfig.vars.radius,
                      boxShadow: '0 16px 40px -10px rgba(0,0,0,0.35)',
                      animation: 'jellyPop 0.5s cubic-bezier(0.34, 1.8, 0.4, 1)'
                    }}
                  >
                    <span>{snackbarMsg}</span>
                    <button
                      onClick={() => { setSnackbarVisible(false); triggerSnackbar('已撤销刚才的操作!'); }}
                      className="font-bold underline cursor-pointer text-amber-300 hover:text-amber-200"
                    >
                      撤销
                    </button>
                    <button
                      onClick={() => setSnackbarVisible(false)}
                      className="text-stone-300 hover:text-white cursor-pointer ml-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Component 6: Spinner */}
            {component.id === 'spinner' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-6">
                  {/* The Spinner */}
                  <div
                    className="rounded-full border-3 animate-spin"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderColor: styleConfig.vars.line,
                      borderTopColor: styleConfig.vars.accent,
                      animationDuration: spinnerSpeed === 'fast' ? '0.45s' : spinnerSpeed === 'slow' ? '1.8s' : '0.9s'
                    }}
                  />
                  <div className="text-xs" style={{ color: styleConfig.vars.ink }}>
                    <div className="font-semibold">加载中...</div>
                    <div className="text-[11px] text-stone-400">正在与模型建立通信</div>
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl text-xs">
                  <button
                    onClick={() => setSpinnerSpeed('fast')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      spinnerSpeed === 'fast' ? 'bg-white font-semibold text-stone-800 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    快速 (0.45s)
                  </button>
                  <button
                    onClick={() => setSpinnerSpeed('normal')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      spinnerSpeed === 'normal' ? 'bg-white font-semibold text-stone-800 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    常规 (0.9s)
                  </button>
                  <button
                    onClick={() => setSpinnerSpeed('slow')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      spinnerSpeed === 'slow' ? 'bg-white font-semibold text-stone-800 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    慢速 (1.8s)
                  </button>
                </div>
              </div>
            )}

            {/* Component 7: Toggle */}
            {component.id === 'toggle' && (
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => setToggleOn(!toggleOn)}
                  className="relative h-7 w-12 rounded-full cursor-pointer transition-colors duration-300 p-0.5 shadow-inner"
                  style={{
                    backgroundColor: toggleOn ? styleConfig.vars.accent : styleConfig.vars.line
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-500 active:scale-80"
                    style={{
                      transform: toggleOn ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.55s cubic-bezier(0.3, 2.2, 0.4, 1)'
                    }}
                  />
                </div>

                <div className="text-xs font-mono" style={{ color: styleConfig.vars.ink }}>
                  当前状态: <span className="font-bold">{toggleOn ? '开启 (ON)' : '关闭 (OFF)'}</span>
                </div>
                <span className="text-[11px] text-stone-400">
                  长按圆块试一试果冻压扁手感
                </span>
              </div>
            )}

            {/* Component 8: Badge */}
            {component.id === 'badge' && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative inline-flex">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-inner transition-transform active:scale-95"
                    style={{
                      backgroundColor: styleConfig.vars.paper,
                      borderColor: styleConfig.vars.line,
                      color: styleConfig.vars.ink
                    }}
                  >
                    🔔
                  </div>

                  {/* Red/Theme Badge */}
                  {badgeCount > 0 && (
                    <span
                      key={badgeCount}
                      className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: styleConfig.vars.danger,
                        animation: 'badgePop 0.55s cubic-bezier(0.34, 2.2, 0.4, 1)'
                      }}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBadgeCount((prev) => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
                    title="减少未读"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono px-2 text-stone-600">
                    未读计数: {badgeCount}
                  </span>
                  <button
                    onClick={() => setBadgeCount((prev) => prev + 1)}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
                    title="增加未读"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBadgeCount(0)}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer text-xs"
                    title="全部已读"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STRUCTURE CODE */}
        {activeTab === 'structure' && (
          <div className="space-y-2">
            <div className="text-xs text-stone-500 mb-1">
              <strong>结构层核心</strong>：只管功能逻辑与骨架标签，完全不管好不好看。
            </div>
            <CodeBlock code={component.structureHtml} language="html" title="HTML 骨架结构" />
            {component.structureCss && (
              <CodeBlock code={component.structureCss} language="css" title="定位与状态基础 CSS" />
            )}
            {component.structureJs && (
              <CodeBlock code={component.structureJs} language="javascript" title="交互监听 JS 脚本" />
            )}
          </div>
        )}

        {/* TAB 3: JELLY FEEDBACK CODE */}
        {activeTab === 'feedback' && (
          <div className="space-y-2">
            <div className="text-xs text-stone-500 mb-1">
              <strong>反馈层核心</strong>：只加 <code>transform</code> 与 <code>transition</code>，按下短延时压缩、松手过冲慢弹。
            </div>
            <CodeBlock code={component.feedbackCss} language="css" title="果冻物理曲线 CSS" />
          </div>
        )}

        {/* TAB 4: AESTHETICS CODE */}
        {activeTab === 'aesthetics' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>
                <strong>美化层核心</strong>：当前展示【{styleConfig.name}】，只管颜色、边框、圆角与阴影。
              </span>
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                在顶部风格库可随时切换其他3套
              </span>
            </div>
            <CodeBlock code={currentAestheticCss} language="css" title={`${styleConfig.name} 美化样式`} />
          </div>
        )}

        {/* TAB 5: COMBINED CODE & EXPORT */}
        {activeTab === 'combined' && (
          <div className="space-y-3">
            {/* Export Toolbar Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800">
                    一键导出为独立 CSS 样式文件 ({component.id}-{currentStyle}.css)
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  结构、果冻反馈与【{styleConfig.name}】美化三层已完成整合，附带主题变量声明，可直接移入你的项目中。
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Format toggle: pure CSS vs With HTML */}
                <button
                  onClick={() => setIncludeHtmlInBundle(!includeHtmlInBundle)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                    includeHtmlInBundle
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                  title="切换是否在代码顶部附带 HTML 骨架注释"
                >
                  {includeHtmlInBundle ? '✓ 已包含 HTML 骨架' : '+ 包含 HTML 骨架'}
                </button>

                {/* Download .css file */}
                <button
                  onClick={handleDownloadCss}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-95 transition-all"
                  title="下载单文件 CSS"
                >
                  {downloadedCss ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已下载!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>下载 .css 文件</span>
                    </>
                  )}
                </button>

                {/* Copy pure CSS */}
                <button
                  onClick={handleCopyCss}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold cursor-pointer border border-stone-200 shadow-xs active:scale-95 transition-all"
                  title="复制代码"
                >
                  {copiedCss ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">已复制!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <CodeBlock 
              code={currentExportCode} 
              language="css" 
              title={`${component.id}-${currentStyle}.css (${includeHtmlInBundle ? 'HTML + CSS' : '纯 CSS 样式表'})`} 
              maxHeight="max-h-96" 
            />
          </div>
        )}

        {/* TAB 6: AI PROMPT */}
        {activeTab === 'prompt' && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-amber-700" />
                可直接喂给 AI 的生成指令：
              </span>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 font-medium text-amber-900 cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? '已复制' : '复制整句指令'}</span>
              </button>
            </div>
            <div className="p-3 bg-white rounded-lg border border-amber-200 font-sans text-stone-800 leading-relaxed select-all">
              "{component.prompt}"
            </div>
            <p className="text-[11px] text-amber-800">
              💡 技巧：丢给 AI 时，可以在后面追加一句："美化按【{styleConfig.name}】风格，代码尽量精简，能合并的选择器合并写，避免无用防御代码。"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
