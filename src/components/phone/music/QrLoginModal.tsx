import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  AlertCircle,
  QrCode,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Info
} from 'lucide-react';
import { 
  fetchQrKey, 
  fetchQrCreate, 
  checkQrStatus, 
  fetchUserAccount, 
  loginWithCookie,
  loginAsVisitor,
  saveCookie, 
  saveUser, 
  NeteaseUserProfile 
} from '../../../services/neteaseService';

interface QrLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: NeteaseUserProfile) => void;
}

type LoginTab = 'qr' | 'cookie' | 'visitor';

export const QrLoginModal: React.FC<QrLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<LoginTab>('qr');
  const [unikey, setUnikey] = useState<string>('');
  const [qrImg, setQrImg] = useState<string>('');
  const [statusCode, setStatusCode] = useState<number>(801);
  const [statusMsg, setStatusMsg] = useState<string>('正在生成二维码...');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const pollTimerRef = useRef<any>(null);

  // Cookie 登录相关状态
  const [cookieInput, setCookieInput] = useState<string>('');
  const [cookieSubmitting, setCookieSubmitting] = useState<boolean>(false);
  const [cookieError, setCookieError] = useState<string>('');

  // 游客登录状态
  const [visitorLoading, setVisitorLoading] = useState<boolean>(false);

  // 初始化获取二维码
  const initQr = async () => {
    try {
      setLoading(true);
      setStatusCode(801);
      setStatusMsg('请使用网易云音乐手机 App 扫码登录');
      setIsSuccess(false);

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }

      const key = await fetchQrKey();
      setUnikey(key);

      const { qrimg } = await fetchQrCreate(key);
      setQrImg(qrimg);
      setLoading(false);

      // 开始轮询，每 3 秒一次 (符合官方网易云推荐间隔，降低风控判定)
      startPolling(key);
    } catch (err: any) {
      setLoading(false);
      setStatusCode(500);
      setStatusMsg(err?.message || '获取二维码失败，请重试');
    }
  };

  const startPolling = (key: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await checkQrStatus(key);
        setStatusCode(res.code);

        if (res.code === 800) {
          // 二维码已过期
          setStatusMsg('二维码已过期，请点击刷新');
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        } else if (res.code === 801) {
          // 等待扫码
          setStatusMsg('请使用网易云音乐手机 App 扫码');
        } else if (res.code === 802) {
          // 待确认
          setStatusMsg('手机已扫码，请在手机上点击确认授权');
        } else if (res.code === 803) {
          // 登录成功
          setStatusMsg('登录成功！正在同步账号资料...');
          setIsSuccess(true);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
          }

          const cookie = res.cookie || '';
          if (cookie) {
            saveCookie(cookie);
          }

          // 立即获取网易云用户信息与昵称
          try {
            const profile = await fetchUserAccount(cookie);
            if (profile) {
              saveUser(profile);
              onLoginSuccess(profile);
            } else {
              const fallbackUser: NeteaseUserProfile = {
                userId: 0,
                nickname: '网易云音乐用户',
                avatarUrl: 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'
              };
              saveUser(fallbackUser);
              onLoginSuccess(fallbackUser);
            }
          } catch (profileErr) {
            console.warn('获取用户信息异常:', profileErr);
            const fallbackUser: NeteaseUserProfile = {
              userId: 0,
              nickname: '网易云音乐用户',
              avatarUrl: 'https://p1.music.126.net/SUeqMM8JaH4HootrmkrEVA==/109951165647004069.jpg'
            };
            saveUser(fallbackUser);
            onLoginSuccess(fallbackUser);
          }

          setTimeout(() => {
            onClose();
          }, 400);
        }
      } catch (err) {
        console.warn('轮询二维码状态异常:', err);
      }
    }, 2000);
  };

  // 处理 Cookie 登录
  const handleCookieSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cookieInput.trim()) {
      setCookieError('请输入有效的 Cookie 或 MUSIC_U');
      return;
    }

    try {
      setCookieSubmitting(true);
      setCookieError('');
      const { profile } = await loginWithCookie(cookieInput.trim());
      saveUser(profile);
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      setCookieError(err?.message || 'Cookie 验证失败，请检查是否完整');
    } finally {
      setCookieSubmitting(false);
    }
  };

  // 处理游客快速登录
  const handleVisitorLogin = async () => {
    try {
      setVisitorLoading(true);
      const { profile } = await loginAsVisitor();
      saveUser(profile);
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      alert(err?.message || '游客登录失败，请使用扫码或 Cookie 登录');
    } finally {
      setVisitorLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'qr') {
        initQr();
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      setCookieError('');
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="w-full max-w-[340px] rounded-3xl p-5 shadow-2xl flex flex-col items-center relative overflow-hidden border animate-scaleUp"
        style={{
          backgroundColor: 'var(--app-card, #fffaf5)',
          borderColor: 'var(--app-card-border, #f0dfe0)',
          color: 'var(--app-text, #6b4a52)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-stone-200/50"
          style={{ color: 'var(--app-text-soft, #b398a0)' }}
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab 导航切换 */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/50 rounded-full mb-3 w-full max-w-[280px]">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'qr' ? 'bg-white shadow-xs text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>扫码登录</span>
          </button>
          <button
            onClick={() => setActiveTab('cookie')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'cookie' ? 'bg-white shadow-xs text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cookie</span>
          </button>
          <button
            onClick={() => setActiveTab('visitor')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'visitor' ? 'bg-white shadow-xs text-stone-800' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>免登试听</span>
          </button>
        </div>

        {/* ================= 选项卡 1：扫码登录 ================= */}
        {activeTab === 'qr' && (
          <>
            <p className="text-[11px] mb-3 text-center px-2" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
              使用网易云音乐 App 扫码 · 同步歌单与黑胶特权
            </p>

            {/* 二维码展示区用白色背景 */}
            <div className="w-[190px] h-[190px] bg-white rounded-2xl p-3 shadow-inner border border-stone-200/80 flex flex-col items-center justify-center relative group">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <RefreshCw className="w-7 h-7 animate-spin text-rose-400" />
                  <span className="text-[11px]">正在安全生成...</span>
                </div>
              ) : qrImg ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={qrImg}
                    alt="网易云登录二维码"
                    className={`w-full h-full object-contain rounded-lg transition-all duration-300 ${
                      statusCode === 800 ? 'blur-xs opacity-30' : statusCode === 802 ? 'scale-95 opacity-80' : ''
                    }`}
                  />

                  {/* 800: 过期蒙层 */}
                  {statusCode === 800 && (
                    <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center gap-2 p-2 text-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <span className="text-[11px] font-medium text-stone-700">二维码已过期失效</span>
                      <button
                        onClick={initQr}
                        className="px-3 py-1 bg-stone-900 text-white text-[10px] font-semibold rounded-full hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>重新生成二维码</span>
                      </button>
                    </div>
                  )}

                  {/* 802: 扫描成功，等待确认 */}
                  {statusCode === 802 && (
                    <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center gap-2 text-blue-600 animate-fadeIn p-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-blue-500 animate-bounce" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">已成功扫码！</span>
                      <span className="text-[10px] text-blue-600 font-medium leading-tight">请在手机上网易云 App<br/>点击「确认登录」</span>
                    </div>
                  )}

                  {/* 803: 登录成功 */}
                  {isSuccess && (
                    <div className="absolute inset-0 bg-white rounded-lg flex flex-col items-center justify-center gap-2 text-emerald-600 animate-fadeIn">
                      <CheckCircle2 className="w-9 h-9" />
                      <span className="text-xs font-bold text-emerald-700">授权登录成功！</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                  <span className="text-[11px]">加载失败</span>
                  <button
                    onClick={initQr}
                    className="text-[10px] text-rose-500 underline cursor-pointer"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>

            {/* 状态提示 */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-center px-2 font-medium">
              {statusCode === 802 ? (
                <Smartphone className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              ) : statusCode === 800 ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span 
                className="truncate max-w-[240px]"
                style={{ 
                  color: statusCode === 802 
                    ? '#2563eb' 
                    : statusCode === 800 
                    ? '#ef4444' 
                    : isSuccess 
                    ? '#10b981' 
                    : 'var(--app-text, #6b4a52)' 
                }}
              >
                {statusMsg}
              </span>
            </div>

            {/* 底部按钮与刷新 */}
            <div 
              className="mt-3 pt-2.5 w-full border-t flex items-center justify-between text-[10px]"
              style={{ 
                borderColor: 'var(--app-divider, #f0dfe0)',
                color: 'var(--app-text-soft, #b398a0)'
              }}
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                网易云官方授权
              </span>
              <button
                onClick={initQr}
                className="flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--app-btn-bg, #e89aab)' }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                刷新二维码
              </button>
            </div>
          </>
        )}

        {/* ================= 选项卡 2：Cookie 登录 ================= */}
        {activeTab === 'cookie' && (
          <form onSubmit={handleCookieSubmit} className="w-full flex flex-col items-center mt-1">
            <p className="text-[11px] mb-2.5 text-center px-1" style={{ color: 'var(--app-text-soft, #b398a0)' }}>
              可直接粘贴网易云 <span className="font-semibold text-stone-700">MUSIC_U</span> 凭证或完整 Cookie
            </p>

            <div className="w-full bg-stone-50 rounded-2xl p-3 border border-stone-200/80 mb-2">
              <textarea
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="粘贴 MUSIC_U=xxxx 或完整 Cookie 内容..."
                className="w-full h-24 bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none resize-none"
              />
            </div>

            {cookieError && (
              <div className="w-full mb-2 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{cookieError}</span>
              </div>
            )}

            <div className="w-full flex items-center gap-1 text-[10px] text-stone-400 mb-3 px-1">
              <Info className="w-3 h-3 shrink-0" />
              <span>登录网页版 music.163.com，在 F12 Cookie 中复制 MUSIC_U 即可</span>
            </div>

            <button
              type="submit"
              disabled={cookieSubmitting}
              className="w-full py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98 transition-all"
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            >
              {cookieSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>校验登录中...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>验证并登录</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= 选项卡 3：游客快速试听 ================= */}
        {activeTab === 'visitor' && (
          <div className="w-full flex flex-col items-center py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-3">
              <UserCheck className="w-7 h-7 text-rose-400" />
            </div>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--app-text, #6b4a52)' }}>
              网易云游客即刻畅听
            </h4>
            <p className="text-[11px] mb-5 px-4 text-stone-500 leading-relaxed">
              无需任何扫码或输入，一键获取网易云官方游客访问身份，可搜索全部单曲、试听播放高品质音乐。
            </p>

            <button
              onClick={handleVisitorLogin}
              disabled={visitorLoading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98 transition-all"
              style={{ backgroundColor: 'var(--app-btn-bg, #e89aab)' }}
            >
              {visitorLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>正在开启游客身份...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>一键免登体验</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
