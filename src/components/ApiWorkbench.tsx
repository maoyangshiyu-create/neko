import React, { useState } from 'react';
import { Terminal, Check, Globe, RefreshCw, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export const ApiWorkbench: React.FC = () => {
  // URL Normalizer interactive testing
  const [inputUrl, setInputUrl] = useState('https://api.openai-proxy.com/v1///  ');
  const [simulatedKey, setSimulatedKey] = useState('sk-proj-xxxx...xxxx');
  const [selectedErrorSnippet, setSelectedErrorSnippet] = useState('Failed to fetch');

  // Interactive URL normalizer logic from Part 4:
  function normalizeUrl(raw: string) {
    return (raw || '').trim().replace(/\/+$/, '');
  }

  function getCandidates(rawUrl: string) {
    const base = normalizeUrl(rawUrl);
    return base.endsWith('/v1') ? [base] : [base, `${base}/v1`];
  }

  // Friendly error logic from Part 4:
  function friendlyError(msg: string) {
    if (msg.includes('Failed to fetch')) return '连不上，检查网络或者接口地址是否正确';
    if (msg.includes('401') || msg.includes('403')) return '密钥不对，或者密钥没有这个模型的权限';
    if (msg.includes('429')) return '请求太快了，被限流了，稍等再试';
    if (msg.includes('返回结果为空')) return '接口通了，但没返回模型列表，可能是地址填错了';
    return `出错了：${msg}`;
  }

  const normalizedBase = normalizeUrl(inputUrl);
  const candidates = getCandidates(inputUrl);

  return (
    <section id="api-section" className="mb-14 scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-stone-800">
            <Terminal className="w-5 h-5 text-stone-700" />
            Part 4 接入 AI 对话的 API 对接层
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            "什么中转站、什么格式甩进来都能用"：双候选地址兜底与人话报错翻译。
          </p>
        </div>
      </div>

      {/* Philosophy Card */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">
              为什么需要候选地址双路兜底？
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              有人填 <code>https://xxx.com</code>，有人填 <code>https://xxx.com/v1</code>，还有人尾部带空格或连续多斜杠。<strong>不要要求用户填对格式，而是代码自己去自动生成候选地址并顺序重试，谁先通就用谁。</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive URL Normalizer Testbench */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs mb-6">
        <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
          <span>🧭</span> 实时地址纠错与候选地址生成器
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              测试输入任意杂乱的 API 基础地址（带空格、多斜杠或末尾 /v1）：
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="例如: https://api.xxx.com/v1///"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setInputUrl('https://api.openai.com/')}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700 cursor-pointer"
                >
                  示例1: 根地址带斜杠
                </button>
                <button
                  onClick={() => setInputUrl('https://myproxy.io/v1// ')}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700 cursor-pointer"
                >
                  示例2: /v1 带双斜杠
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="font-semibold text-stone-500 text-[11px] mb-1 font-sans">
                第一步：去掉首尾空格与末尾多余斜杠
              </div>
              <div className="text-stone-800 font-bold bg-white p-2 rounded border border-stone-200 break-all">
                {normalizedBase || '(空)'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="font-semibold text-emerald-800 text-[11px] mb-1 font-sans">
                第二步：生成的候选请求地址队列 (按顺序尝试)
              </div>
              <div className="space-y-1">
                {candidates.map((cand, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-1.5 px-2 rounded border border-emerald-200 text-emerald-950 break-all">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{cand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Code Block for normalize and getCandidates */}
        <div className="mt-4">
          <CodeBlock
            code={`// 第一步：去掉首尾空格、去掉结尾多余的斜杠\nfunction normalizeUrl(raw) {\n  return (raw || '').trim().replace(/\\/+$/, '');\n}\n\n// 第二步：根据地址是否已经带 /v1，生成"候选地址"列表\n// 不确定用户填的是不是标准格式，就两种都试一遍，谁先成功用谁\nfunction getCandidates(rawUrl) {\n  const base = normalizeUrl(rawUrl);\n  return base.endsWith('/v1') ? [base] : [base, \`\${base}/v1\`];\n}`}
            language="javascript"
            title="地址兼容核心函数"
          />
        </div>
      </div>

      {/* Friendly Error Translator */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
        <h3 className="text-sm font-bold text-stone-800 mb-2 flex items-center gap-2">
          <span>🩹</span> 报错翻译机 (Friendly Error Translator)
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          别直接把原始报错抛给用户！测试下方真实报错，查看翻译后的清晰中文指引：
        </p>

        {/* Error simulation buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '网络断开 / 跨域', raw: 'TypeError: Failed to fetch' },
            { label: '密钥失效 401', raw: 'API错误 401: Incorrect API key provided' },
            { label: '权限拒绝 403', raw: 'API错误 403: Model access denied' },
            { label: '频率限流 429', raw: 'API错误 429: Rate limit reached' },
            { label: '空模型列表', raw: 'Error: 返回结果为空' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedErrorSnippet(item.raw)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                selectedErrorSnippet === item.raw
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Translation Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
            <div className="font-semibold text-rose-800 text-[11px] mb-1 font-sans">
              ❌ 原始程序异常 (直接抛给用户看不懂):
            </div>
            <div className="bg-white p-2.5 rounded border border-rose-200 text-rose-900 break-all">
              {selectedErrorSnippet}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="font-semibold text-emerald-800 text-[11px] mb-1 font-sans">
              ✅ 翻译后的人话弹窗提示 (用户一眼就知道怎么改):
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200 text-emerald-950 font-sans font-medium">
              “{friendlyError(selectedErrorSnippet)}”
            </div>
          </div>
        </div>

        <CodeBlock
          code={`function friendlyError(e) {\n  const msg = e?.message || '';\n  if (msg.includes('Failed to fetch')) return '连不上，检查网络或者接口地址是否正确';\n  if (msg.includes('401') || msg.includes('403')) return '密钥不对，或者密钥没有这个模型的权限';\n  if (msg.includes('429')) return '请求太快了，被限流了，稍等再试';\n  if (msg.includes('返回结果为空')) return '接口通了，但没返回模型列表，可能是地址填错了';\n  return \`出错了：\${msg}\`;\n}`}
          language="javascript"
          title="报错转人话函数 (friendlyError)"
        />
      </div>
    </section>
  );
};
