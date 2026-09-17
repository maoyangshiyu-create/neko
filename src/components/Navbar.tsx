import React, { useState } from 'react';
import { AestheticStyleId } from '../types';
import { STYLES, COMPONENTS_DATA } from '../data/manualData';
import { 
  Palette, 
  Sparkles, 
  Code, 
  BookOpen, 
  Smile, 
  Terminal, 
  ShieldAlert, 
  Scissors, 
  Layers, 
  ChevronDown, 
  Menu, 
  X,
  Search,
  Bot
} from 'lucide-react';

interface NavbarProps {
  currentStyle: AestheticStyleId;
  onSelectStyle: (style: AestheticStyleId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStyle,
  onSelectStyle,
  searchQuery,
  onSearchChange
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeStyle = STYLES[currentStyle];

  const navLinks = [
    { label: '美化风格', href: '#styles-section', icon: <Palette className="w-3.5 h-3.5" /> },
    { label: 'UI组件库', href: '#components-section', icon: <Code className="w-3.5 h-3.5" /> },
    { label: '果冻手感', href: '#jelly-section', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { label: '三层公式', href: '#threelayer-section', icon: <Layers className="w-3.5 h-3.5" /> },
    { label: 'API对接', href: '#api-section', icon: <Terminal className="w-3.5 h-3.5" /> },
    { label: '世界书', href: '#worldbook-section', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: '表情包', href: '#sticker-section', icon: <Smile className="w-3.5 h-3.5" /> },
    { label: '避雷清单', href: '#pitfalls-section', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> },
    { label: '精简原则', href: '#condense-section', icon: <Scissors className="w-3.5 h-3.5 text-amber-600" /> },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-stone-900 to-stone-700 text-white flex items-center justify-center text-lg shadow-sm">
              ✨
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                UI组件 × 果冻反馈 × 美化代码
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  参考手册
                </span>
              </h1>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                结构 · 反馈 · 美化 三层解耦交互手册与 AI 提示词库
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="hidden md:flex items-center relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索组件 / 规范 / 避雷条目..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-stone-100/80 border border-stone-200/80 text-xs focus:outline-none focus:ring-1 focus:ring-stone-700 focus:bg-white transition-all text-stone-800"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Style Switcher Selector in Nav */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-full text-xs">
              {(Object.keys(STYLES) as AestheticStyleId[]).map((key) => {
                const s = STYLES[key];
                const isActive = currentStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectStyle(key)}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                      isActive
                        ? 'bg-white font-bold text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Quick Nav Anchor Links */}
        <div className="hidden lg:flex items-center gap-1 py-1.5 border-t border-stone-100 text-xs overflow-x-auto scrollbar-none">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="px-2.5 py-1 rounded-md text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors whitespace-nowrap flex items-center gap-1 font-medium text-[11px]"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 py-3 space-y-3">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索组件或规范..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-100 text-xs"
            />
          </div>

          {/* Mobile Style Selection */}
          <div>
            <div className="text-[11px] font-bold text-stone-500 mb-1.5">
              切换美化风格:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(STYLES) as AestheticStyleId[]).map((key) => {
                const s = STYLES[key];
                const isActive = currentStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => { onSelectStyle(key); setMobileMenuOpen(false); }}
                    className={`p-2 rounded-xl text-xs flex items-center gap-1.5 text-left border ${
                      isActive ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Links */}
          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-stone-100 text-xs">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 text-center font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
