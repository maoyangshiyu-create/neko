import React, { useState, useRef } from 'react';
import { PhoneSettings, ThemeStyle } from '../../../types/phone';
import { fetchModelList, playVoice, validateTTSConfig, getTokenRecords, clearTokenRecords, TokenUsageRecord } from '../../../services/aiService';
import { applyTheme, THEME_CONFIGS } from '../../../utils/theme';
import { THEME_ICON_SETS } from '../../../utils/themeIcons';
import { DiyWorkshopIcon } from '../diy/DiyWorkshopIcon';
import { 
  ArrowLeft, 
  Cpu, 
  Volume2, 
  Image as ImageIcon, 
  RefreshCw, 
  Check, 
  Key, 
  Globe, 
  Sparkles,
  RotateCcw,
  Palette,
  Upload,
  MessageCircle,
  BookOpen,
  Settings as SettingsIcon,
  Heart,
  Twitter,
  Baby,
  CloudSun,
  Clock,
  MapPin,
  Coffee,
  BarChart3,
  Trash2,
  TrendingUp,
  Layers,
  Download,
  FileDown,
  ExternalLink
} from 'lucide-react';
import { fetchWeatherForCity, fetchWeatherByCoordinates } from '../../../utils/weatherService';
import { getTimeContext } from '../../../utils/timeAwareness';

interface SettingsAppProps {
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  onReturnToDesktop: () => void;
  onResetData: () => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onUpdateSettings,
  onReturnToDesktop,
  onResetData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'theme' | 'api' | 'token' | 'tts' | 'perception' | 'luckin'>('theme');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);
  const [ttsTestMessage, setTtsTestMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Token billing states & helpers
  type TokenTimeFilter = 'today' | 'week' | 'month' | 'all';
  const [tokenFilter, setTokenFilter] = useState<TokenTimeFilter>('today');
  const [tokenRefreshKey, setTokenRefreshKey] = useState<number>(0);

  // Font export & preset states
  const [fontExportFeedback, setFontExportFeedback] = useState<string | null>(null);

  const filterRecordsByTime = (records: TokenUsageRecord[], filter: TokenTimeFilter): TokenUsageRecord[] => {
    if (filter === 'all') return records;
    const now = new Date();
    
    if (filter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return records.filter(r => r.timestamp >= startOfToday);
    }
    
    if (filter === 'week') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff).getTime();
      return records.filter(r => r.timestamp >= startOfWeek);
    }
    
    if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return records.filter(r => r.timestamp >= startOfMonth);
    }
    
    return records;
  };

  // Perception states
  const [cityInput, setCityInput] = useState(settings.userCity || '杭州');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleFetchWeather = async (cityName: string) => {
    if (!cityName.trim()) return;
    setIsFetchingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchWeatherForCity(cityName);
      onUpdateSettings({
        userCity: data.city,
        weatherCache: {
          data,
          updatedAt: Date.now()
        }
      });
    } catch (err: any) {
      setWeatherError(err.message || '获取天气失败');
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handleLocateAndFetch = () => {
    if (!navigator.geolocation) {
      setWeatherError('浏览器不支持地理定位');
      return;
    }
    setIsFetchingWeather(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await fetchWeatherByCoordinates(latitude, longitude);
          onUpdateSettings({
            userLatitude: latitude,
            userLongitude: longitude,
            userCity: data.city !== '当前位置' ? data.city : (settings.userCity || '当前位置'),
            weatherCache: {
              data,
              updatedAt: Date.now()
            }
          });
          setCityInput(data.city);
        } catch (err: any) {
          setWeatherError(err.message || '经纬度获取天气失败');
        } finally {
          setIsFetchingWeather(false);
        }
      },
      (error) => {
        setIsFetchingWeather(false);
        setWeatherError('定位失败: ' + error.message);
      },
      { timeout: 10000 }
    );
  };

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const themeWallpaperInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Handle Fetch Model List
  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchError(null);
    try {
      const models = await fetchModelList(settings.apiUrl, settings.apiKey);
      setFetchedModels(models);
      if (models.length > 0 && !models.includes(settings.modelName)) {
        onUpdateSettings({ modelName: models[0] });
      }
    } catch (err: any) {
      setFetchError(err.message || '获取模型列表失败，请检查网络或地址');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const [isValidatingTTS, setIsValidatingTTS] = useState(false);

  // Validate TTS Config
  const handleValidateTTS = async () => {
    setIsValidatingTTS(true);
    setTtsTestMessage('正在向 TTS 接口发起连通性与密钥校验...');
    try {
      const result = await validateTTSConfig(settings, settings.ttsVoiceId);
      setTtsTestMessage(result.message);
    } catch (err: any) {
      setTtsTestMessage('❌ 校验异常: ' + (err.message || '请检查网络与地址'));
    } finally {
      setIsValidatingTTS(false);
    }
  };

  // Test Voice Playback
  const handleTestVoice = async () => {
    if (!settings.ttsVoiceId || !settings.ttsVoiceId.trim()) {
      setTtsTestMessage('❌ 请先在“自定义音色 ID (Voice ID)”中输入要测试的音色代码');
      return;
    }
    setTestSoundPlaying(true);
    setTtsTestMessage('正在请求生成语音并播放...');
    try {
      await playVoice({
        text: '你好！这是为你配置的自定义音色测试。',
        voiceTimbre: settings.ttsVoiceId.trim(),
        settings
      });
      setTtsTestMessage('✅ 语音已生成并正在播放！');
      setTimeout(() => {
        setTestSoundPlaying(false);
      }, 3500);
    } catch (err: any) {
      setTestSoundPlaying(false);
      setTtsTestMessage('❌ 语音播放失败：' + (err.message || '请检查配置'));
    }
  };

  // Upload wallpaper
  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({ wallpaperUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Upload moments cover
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({ momentsCoverUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="rococo-theme h-full w-full flex flex-col select-none relative overflow-hidden"
      style={{
        backgroundColor: 'var(--app-bg, #fdf6f0)',
        color: 'var(--app-text, #6b4a52)'
      }}
    >
      {/* Hidden file inputs */}
      <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />
      <input type="file" ref={themeWallpaperInputRef} onChange={handleWallpaperUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />

      {/* Top Header */}
      <div className="h-11 px-3 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onReturnToDesktop}
          className="flex items-center gap-0.5 text-stone-800 text-xs font-medium cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>桌面</span>
        </button>
        <span className="font-bold text-xs text-stone-900">系统设置</span>
        <div className="w-10"></div>
      </div>

      {/* Settings Sub-navigation Tabs */}
      <div className="p-1.5 bg-white border-b border-stone-200/80 grid grid-cols-6 gap-1 shrink-0">
        <button
          onClick={() => setActiveSubTab('theme')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'theme' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>主题</span>
        </button>

        <button
          onClick={() => setActiveSubTab('api')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'api' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>API</span>
        </button>

        <button
          onClick={() => setActiveSubTab('token')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'token' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>账单</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tts')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'tts' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>TTS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('perception')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'perception' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>感知</span>
        </button>

        <button
          onClick={() => setActiveSubTab('luckin')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeSubTab === 'luckin' ? 'bg-[#0b2d64] text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span>瑞幸</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
        {/* 🎨 主题风格模块 */}
        {activeSubTab === 'theme' && (
          <div className="space-y-3 animate-fadeIn">
            {/* 4 大风格切换卡片 */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-600" />
                    <span>主题风格</span>
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    点击立即切换全界面色彩、圆角与质感
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  果冻反馈已就绪
                </span>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {THEME_CONFIGS.map((theme) => {
                  const isActive = (settings.themeStyle || 'morandi') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        applyTheme(theme.id);
                        onUpdateSettings({ themeStyle: theme.id });
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                        isActive
                          ? 'border-stone-900 bg-stone-900/5 ring-2 ring-stone-900/20 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      {/* Top Row: Emoji & Name */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">{theme.emoji}</span>
                          <span className="font-bold text-xs text-stone-900">{theme.name}</span>
                        </div>
                        {isActive && (
                          <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Live Miniature App Icons in This Theme Tone */}
                      <div className="my-1.5 p-1.5 rounded-lg bg-stone-100/70 border border-stone-200/60">
                        <div className="text-[9px] font-medium text-stone-500 mb-1 flex items-center justify-between">
                          <span>应用图标专属色调:</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
                          {(() => {
                            const set = THEME_ICON_SETS[theme.id];
                            return (
                              <>
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center ${set.wechat.boxClass}`} title="微信(绿色系)">
                                  <MessageCircle className={`w-3 h-3 ${set.wechat.iconClass} ${set.wechat.iconFill ? 'fill-current' : ''}`} />
                                </div>
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center ${set.marriage.boxClass}`} title="婚书(粉色系)">
                                  <Heart className={`w-3 h-3 ${set.marriage.iconClass}`} />
                                </div>
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center ${set.twitter.boxClass}`} title="X/推特(黑色系)">
                                  <Twitter className={`w-3 h-3 ${set.twitter.iconClass}`} />
                                </div>
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center ${set.diy.boxClass}`} title="DIY工坊">
                                  <DiyWorkshopIcon className={`w-3 h-3 ${set.diy.iconClass}`} />
                                </div>
                                <div className={`w-5 h-5 shrink-0 flex items-center justify-center ${set.sukiBaby.boxClass}`} title="养娃">
                                  <Baby className={`w-3 h-3 ${set.sukiBaby.iconClass}`} />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Details specs */}
                      <div className="text-[10px] text-stone-500 mt-1 space-y-0.5">
                        <p className="text-[10px] text-stone-600 font-medium leading-tight">
                          {theme.iconToneDesc}
                        </p>
                        <div className="flex justify-between pt-0.5 border-t border-stone-100">
                          <span>圆角:</span>
                          <span className="font-mono text-stone-700">{theme.borderRadius}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>阴影:</span>
                          <span className="text-stone-700 truncate max-w-[80px]">{theme.shadowDesc}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 修改主屏幕背景图片 (可上传图片) */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span>主屏幕背景图片</span>
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    可上传本地图片自定义桌面壁纸
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => themeWallpaperInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white font-semibold text-[11px] cursor-pointer hover:bg-stone-800 active:scale-95 transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传图片</span>
                </button>
              </div>

              {/* Current wallpaper preview thumbnail */}
              <div className="relative h-20 w-full rounded-xl overflow-hidden border border-stone-200 shadow-inner group bg-stone-800">
                {settings.wallpaperUrl ? (
                  <img
                    src={settings.wallpaperUrl}
                    alt="当前主屏幕壁纸"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center text-stone-500 text-xs">
                    未设置壁纸
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-3 text-white">
                  <div>
                    <p className="font-bold text-xs">当前壁纸</p>
                    <p className="text-[10px] text-white/80">主屏幕展示中</p>
                  </div>
                  <button
                    onClick={() => themeWallpaperInputRef.current?.click()}
                    className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-md text-[10px] text-white font-medium cursor-pointer"
                  >
                    更换图片
                  </button>
                </div>
              </div>
            </div>

            {/* 字体自定义与导入设置 (覆盖全局) */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-2.5">
              <div>
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>全局字体导入与覆盖 (Custom Font)</span>
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  输入字体名称与远程CSS/字体URL，或选择内置精美字体，实时覆盖全局应用
                </p>
              </div>

              {/* Font Presets & RenOuFangSong-16 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-stone-600 font-bold">
                    精选字体预设（含 GitHub 人偶仿宋16）：
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const exportData = {
                        title: "WePhone 预设字体清单",
                        exportedAt: new Date().toISOString(),
                        presets: [
                          { name: '人偶仿宋 16', family: 'RenOuFangSong-16', url: '/fonts/RenOuFangSong-16.ttf', fileName: 'RenOuFangSong-16.ttf', tag: 'GitHub 像素', source: 'yzdnn/RenOuFangSong-16 (OFL 1.1)' },
                          { name: '霞鹜文楷', family: 'LXGW WenKai Screen', url: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-web@1.7.0/style.css', fileName: 'lxgw-wenkai-screen.css', tag: '清雅楷体', source: '落霞孤鹜 (OFL 1.1)' },
                          { name: '站酷快乐体', family: 'ZCOOL KuaiLe', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap', fileName: 'zcool-kuaile.css', tag: '活泼卡通', source: 'Google Fonts' },
                          { name: '马善政毛笔体', family: 'Ma Shan Zheng', url: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap', fileName: 'ma-shan-zheng.css', tag: '书法毛笔', source: 'Google Fonts' },
                          { name: '悠然手写体', family: 'Long Cang', url: 'https://fonts.googleapis.com/css2?family=Long+Cang&display=swap', fileName: 'long-cang.css', tag: '灵动手写', source: 'Google Fonts' },
                          { name: '系统默认', family: '', url: '', tag: '原生系统', source: '设备系统字体' }
                        ]
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const blobUrl = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = `wephone-font-presets-${new Date().toISOString().slice(0, 10)}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                      setFontExportFeedback('✅ 已导出全部字体预设清单配置 (JSON)');
                      setTimeout(() => setFontExportFeedback(null), 3000);
                    }}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-stone-200"
                    title="导出所有预设字体配置为 JSON 文件"
                  >
                    <FileDown className="w-3 h-3 text-stone-500" />
                    <span>导出预设清单</span>
                  </button>
                </div>

                {fontExportFeedback && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-medium animate-fadeIn flex items-center justify-between">
                    <span>{fontExportFeedback}</span>
                    <button
                      type="button"
                      onClick={() => setFontExportFeedback(null)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-900 ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {[
                    { 
                      id: 'ren-ou-fang-song-16',
                      name: '人偶仿宋 16', 
                      family: 'RenOuFangSong-16', 
                      url: '/fonts/RenOuFangSong-16.ttf',
                      fileName: 'RenOuFangSong-16.ttf',
                      tag: 'GitHub 像素',
                      tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
                      source: 'yzdnn/RenOuFangSong-16 (OFL 1.1)',
                      previewText: '人偶仿宋 16px 像素汉字 0123',
                      downloadable: true,
                      isSpecial: true
                    },
                    { 
                      id: 'lxgw-wenkai',
                      name: '霞鹜文楷', 
                      family: 'LXGW WenKai Screen', 
                      url: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-web@1.7.0/style.css',
                      fileName: 'lxgw-wenkai-screen.css',
                      tag: '清雅楷体',
                      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      source: '落霞孤鹜 / OFL 1.1',
                      previewText: '落霞与孤鹜齐飞 秋水共长天一色',
                      downloadable: true
                    },
                    { 
                      id: 'zcool-kuaile',
                      name: '站酷快乐体', 
                      family: 'ZCOOL KuaiLe', 
                      url: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap',
                      fileName: 'zcool-kuaile.css',
                      tag: '活泼卡通',
                      tagColor: 'bg-orange-100 text-orange-800 border-orange-200',
                      source: '站酷 / Google Fonts',
                      previewText: '快乐每天 元气满满 0123',
                      downloadable: true
                    },
                    { 
                      id: 'ma-shan-zheng',
                      name: '马善政毛笔体', 
                      family: 'Ma Shan Zheng', 
                      url: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap',
                      fileName: 'ma-shan-zheng.css',
                      tag: '书法毛笔',
                      tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
                      source: '马善政 / Google Fonts',
                      previewText: '海纳百川 有容乃大 0123',
                      downloadable: true
                    },
                    { 
                      id: 'long-cang',
                      name: '悠然手写体', 
                      family: 'Long Cang', 
                      url: 'https://fonts.googleapis.com/css2?family=Long+Cang&display=swap',
                      fileName: 'long-cang.css',
                      tag: '灵动手写',
                      tagColor: 'bg-sky-100 text-sky-800 border-sky-200',
                      source: '龙苍 / Google Fonts',
                      previewText: '见字如面 见信安好 0123',
                      downloadable: true
                    },
                    { 
                      id: 'system-default',
                      name: '系统默认', 
                      family: '', 
                      url: '',
                      tag: '原生系统',
                      tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
                      source: '设备原生无衬线字体',
                      previewText: '现代无衬线系统字体 0123',
                      downloadable: false
                    },
                  ].map(preset => {
                    const isSelected = settings.customFontFamily === preset.family;
                    return (
                      <div
                        key={preset.name}
                        className={`p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-400 shadow-xs'
                            : 'bg-stone-50/90 border-stone-200 hover:bg-stone-100/80'
                        } ${preset.isSpecial ? 'ring-1 ring-amber-400/50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-900">{preset.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${preset.tagColor}`}>
                              {preset.tag}
                            </span>
                            {preset.isSpecial && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-semibold">
                                GitHub 引入
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-purple-700 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>已应用</span>
                            </span>
                          )}
                        </div>

                        {/* Preview text */}
                        <div
                          className="mt-1 text-xs text-stone-700 truncate py-0.5"
                          style={{
                            fontFamily: preset.family ? `"${preset.family}", sans-serif` : 'inherit'
                          }}
                        >
                          {preset.previewText}
                        </div>

                        <div className="mt-1.5 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-stone-400 text-[9px] truncate max-w-[150px]" title={preset.source}>
                            {preset.source}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {preset.downloadable && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetFileName = preset.fileName || `${preset.family || 'font'}.ttf`;
                                  setFontExportFeedback(`正在导出字体: ${targetFileName}...`);

                                  if (preset.url.startsWith('/fonts/')) {
                                    // Direct download for local font file
                                    const a = document.createElement('a');
                                    a.href = preset.url;
                                    a.download = targetFileName;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    setFontExportFeedback(`✅ 已成功导出字体文件: ${targetFileName}`);
                                    setTimeout(() => setFontExportFeedback(null), 3500);
                                  } else {
                                    // Fetch remote stylesheet / font
                                    fetch(preset.url)
                                      .then(r => r.blob())
                                      .then(blob => {
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = targetFileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                                        setFontExportFeedback(`✅ 已成功导出: ${targetFileName}`);
                                        setTimeout(() => setFontExportFeedback(null), 3500);
                                      })
                                      .catch(() => {
                                        const a = document.createElement('a');
                                        a.href = preset.url;
                                        a.download = targetFileName;
                                        a.target = '_blank';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        setFontExportFeedback(`✅ 已触发下载: ${targetFileName}`);
                                        setTimeout(() => setFontExportFeedback(null), 3500);
                                      });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-white hover:bg-stone-100 text-stone-700 font-medium border border-stone-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                                title={`导出 ${preset.fileName || preset.name} 字体文件`}
                              >
                                <Download className="w-3 h-3 text-stone-500" />
                                <span>导出</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onUpdateSettings({
                                customFontFamily: preset.family,
                                customFontUrl: preset.url
                              })}
                              className={`px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-stone-800 hover:bg-stone-900 text-white'
                              }`}
                            >
                              {isSelected ? '应用中' : '使用'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Font Input & File Upload */}
              <div className="space-y-2.5 pt-1 border-t border-stone-100">
                <div>
                  <label className="block text-[10px] text-stone-500 font-medium">1. 本地上传字体文件 (.ttf / .woff / .woff2 / .otf)</label>
                  <label className="mt-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 rounded-xl cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-[11px] font-semibold text-purple-900">点击或拖拽上传字体文件</span>
                    <span className="text-[9px] text-stone-400 mt-0.5">支持 TTF, WOFF, WOFF2, OTF 等常见字体</span>
                    <input
                      type="file"
                      accept=".ttf,.woff,.woff2,.otf,font/ttf,font/woff,font/woff2,font/otf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                        const fontName = fileNameWithoutExt || `CustomFont_${Date.now()}`;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const fontDataUrl = event.target?.result as string;
                          onUpdateSettings({
                            customFontFamily: fontName,
                            customFontUrl: fontDataUrl
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-stone-200"></div>
                  <span className="text-[9px] text-stone-400">或手动配置</span>
                  <div className="flex-1 h-px bg-stone-200"></div>
                </div>

                <div>
                  <label className="block text-[10px] text-stone-500 font-medium">2. 自定义字体名称 (Font Family)</label>
                  <input
                    type="text"
                    value={settings.customFontFamily || ''}
                    onChange={(e) => onUpdateSettings({ customFontFamily: e.target.value })}
                    placeholder="例如: LXGW WenKai, ZCOOL KuaiLe, CustomFont"
                    className="w-full p-2 border border-stone-200 rounded-lg text-xs font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 font-medium">3. 字体文件/CSS 远程链接 (URL or @import)</label>
                  <input
                    type="text"
                    value={settings.customFontUrl || ''}
                    onChange={(e) => onUpdateSettings({ customFontUrl: e.target.value })}
                    placeholder="https://.../style.css 或 .woff2 / data:font 链接"
                    className="w-full p-2 border border-stone-200 rounded-lg text-xs font-mono mt-0.5"
                  />
                </div>

                {(settings.customFontFamily || settings.customFontUrl) && (
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-purple-800 font-medium truncate max-w-[150px]" title={settings.customFontFamily || '自定义字体'}>
                      当前生效: <b>{settings.customFontFamily || '自定义字体'}</b>
                    </span>
                    <div className="flex items-center gap-2">
                      {settings.customFontUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const fontName = settings.customFontFamily || 'CustomFont';
                            const isCss = settings.customFontUrl!.includes('.css') || settings.customFontUrl!.includes('googleapis');
                            const fileName = `${fontName}${isCss ? '.css' : '.ttf'}`;
                            setFontExportFeedback(`正在导出当前字体: ${fileName}...`);
                            
                            if (settings.customFontUrl!.startsWith('data:')) {
                              const a = document.createElement('a');
                              a.href = settings.customFontUrl!;
                              a.download = fileName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              setFontExportFeedback(`✅ 已成功导出当前字体: ${fileName}`);
                              setTimeout(() => setFontExportFeedback(null), 3000);
                            } else if (settings.customFontUrl!.startsWith('/fonts/')) {
                              const a = document.createElement('a');
                              a.href = settings.customFontUrl!;
                              a.download = fileName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              setFontExportFeedback(`✅ 已成功导出当前字体文件: ${fileName}`);
                              setTimeout(() => setFontExportFeedback(null), 3000);
                            } else {
                              fetch(settings.customFontUrl!)
                                .then(r => r.blob())
                                .then(blob => {
                                  const blobUrl = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = blobUrl;
                                  a.download = fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                                  setFontExportFeedback(`✅ 已成功导出当前字体: ${fileName}`);
                                  setTimeout(() => setFontExportFeedback(null), 3000);
                                })
                                .catch(() => {
                                  const a = document.createElement('a');
                                  a.href = settings.customFontUrl!;
                                  a.download = fileName;
                                  a.target = '_blank';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  setFontExportFeedback(`✅ 已触发下载: ${fileName}`);
                                  setTimeout(() => setFontExportFeedback(null), 3000);
                                });
                            }
                          }}
                          className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5 cursor-pointer underline"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>导出此字体</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ customFontFamily: '', customFontUrl: '' })}
                        className="text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer"
                      >
                        恢复默认
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6.1 API 配置 */}
        {activeSubTab === 'api' && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-2.5">
              <div>
                <label className="block text-[11px] text-stone-500 font-medium">配置名称</label>
                <input
                  type="text"
                  value={settings.apiConfigName}
                  onChange={(e) => onUpdateSettings({ apiConfigName: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-medium">API 提供商</label>
                <select
                  value={settings.apiProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    let url = settings.apiUrl;
                    let mod = settings.modelName;
                    if (prov === 'deepseek') {
                      url = 'https://api.deepseek.com';
                      mod = 'deepseek-chat';
                    } else if (prov === 'moonshot') {
                      url = 'https://api.moonshot.cn/v1';
                      mod = 'moonshot-v1-8k';
                    } else if (prov === 'openai') {
                      url = 'https://api.openai.com/v1';
                      mod = 'gpt-4o-mini';
                    }
                    onUpdateSettings({ apiProvider: prov, apiUrl: url, modelName: mod });
                  }}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white text-xs mt-0.5"
                >
                  <option value="openai">OpenAI (或兼容中转地址)</option>
                  <option value="deepseek">DeepSeek 官方 API</option>
                  <option value="moonshot">Moonshot (Kimi)</option>
                  <option value="custom">自定义中转反向代理</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-medium">API 地址 (Base URL)</label>
                <input
                  type="text"
                  value={settings.apiUrl}
                  onChange={(e) => onUpdateSettings({ apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 font-medium">API 密钥 (API Key)</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  💡 密钥保存在本地浏览器中，未填写时系统自动采用高质量本地人设模拟回复。
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] text-stone-500 font-medium">模型名称</label>
                  <button
                    onClick={handleFetchModels}
                    disabled={isFetchingModels}
                    className="text-[10px] text-[#07c160] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                    <span>拉取模型列表</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.modelName}
                  onChange={(e) => onUpdateSettings({ modelName: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                />
              </div>

              {/* Fetched Models Dropdown if available */}
              {fetchedModels.length > 0 && (
                <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-medium">已检测到的可用模型:</span>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {fetchedModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => onUpdateSettings({ modelName: m })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          settings.modelName === m
                            ? 'bg-emerald-50 text-[#07c160] border-[#07c160]'
                            : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fetchError && (
                <p className="text-[10px] text-red-500">{fetchError}</p>
              )}

              {/* 破甲模式全局开关 */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-900 text-xs">破甲模式 (全局通用)</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">开启后，将附加破甲提示词，深度解除 AI 限制。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableJailbreakMode || false}
                    onChange={(e) => onUpdateSettings({ enableJailbreakMode: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                </label>
              </div>

              {/* 破甲模式自定义提示词输入框 */}
              {settings.enableJailbreakMode && (
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-stone-500 font-medium">内置核心破甲指令（只读）</label>
                    <div className="w-full max-h-32 p-2 border border-stone-100 bg-stone-50 rounded-lg text-[10px] font-mono overflow-y-auto text-stone-400 leading-relaxed select-all">
                      破甲通解【用户自定义创作预设 v5.0 - 指令驱动版】此预设定义了本次交互中AI的创作模式、风格、内容偏好、叙事流程及格式要求。ooc:执行规则:严格禁止所有外语和拼音，仅限简体中文...（系统预设的符号优先级强制条款、极度感官细节描写规范与硬性中文文本处理规则已锁入底层）
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-stone-500 font-medium">追加破甲自定义指令（在此输入）</label>
                    <textarea
                      rows={4}
                      value={settings.customJailbreakPrompt || ''}
                      onChange={(e) => onUpdateSettings({ customJailbreakPrompt: e.target.value })}
                      placeholder="在此输入需要追加到核心预设后面的自定义指令..."
                      className="w-full p-2 border border-stone-200 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-[#07c160] focus:border-[#07c160]"
                    />
                    <p className="text-[9px] text-stone-400">
                      注：此处的追加指令会**自动拼装**在上述内置核心破甲指令的尾部，无需重复输入基础破解词。
                    </p>
                  </div>
                </div>
              )}

              {/* AI 主动发消息设置 */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-900 text-xs">允许 AI 主动发消息</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">开启后，AI 将根据设定在特定时段主动给您发送消息。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableProactiveMessages ?? true}
                    onChange={(e) => onUpdateSettings({ enableProactiveMessages: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                </label>
              </div>
              
              {(settings.enableProactiveMessages ?? true) && (
                <>
                  <div className="pt-2 border-t border-stone-100">
                    <label className="block text-[11px] text-stone-500 font-medium mb-1">主动消息频率</label>
                    <select
                      value={settings.proactiveMessageFrequency || 'medium'}
                      onChange={(e) => onUpdateSettings({ proactiveMessageFrequency: e.target.value as any })}
                      className="w-full p-2 border border-stone-200 rounded-lg text-xs font-mono"
                    >
                      <option value="low">低频率 (每天最多 2 条，打扰最少)</option>
                      <option value="medium">中频率 (每天最多 4 条，默认)</option>
                      <option value="high">高频率 (每天最多 8 条，互动频繁)</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-stone-900 text-xs">允许 AI 主动拍一拍</h4>
                      <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">默认关闭。关闭后 AI 仅会主动发送文字或语音，绝不主动拍一拍。</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-90">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.allowProactivePat ?? false}
                        onChange={(e) => onUpdateSettings({ allowProactivePat: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                    </label>
                  </div>
                </>
              )}

              {/* 新消息弹窗通知开关 */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-900 text-xs">新消息弹窗通知</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">开启后，收到新消息时将在屏幕顶端显示浮动弹窗通知。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableMessagePopup ?? true}
                    onChange={(e) => onUpdateSettings({ enableMessagePopup: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                </label>
              </div>

              {/* 拍一拍后缀设置 */}
              <div className="pt-2 border-t border-stone-100 space-y-1">
                <label className="block text-[11px] text-stone-700 font-medium">我的拍一拍后缀</label>
                <input
                  type="text"
                  value={settings.userPatSuffix || ''}
                  onChange={(e) => onUpdateSettings({ userPatSuffix: e.target.value })}
                  placeholder="如: 的小脑袋 / 的奶茶 (留空仅显示名字)"
                  className="w-full p-2 border border-stone-200 rounded-lg text-xs"
                />
                <p className="text-[10px] text-stone-400">
                  对方拍你时显示：“{settings.userNickname || '玩家'}拍了拍你{settings.userPatSuffix || ''}”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 📊 Token 账单统计模块 */}
        {activeSubTab === 'token' && (() => {
          // Read token records and calculate statistics
          const allTokenRecords = getTokenRecords();
          const filteredRecords = filterRecordsByTime(allTokenRecords, tokenFilter);

          const totalTokens = filteredRecords.reduce((acc, r) => acc + (r.totalTokens || 0), 0);
          const totalCost = filteredRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
          const totalInputTokens = filteredRecords.reduce((acc, r) => acc + (r.inputTokens || 0), 0);
          const totalOutputTokens = filteredRecords.reduce((acc, r) => acc + (r.outputTokens || 0), 0);

          // Contact aggregation rankings (tokens descending)
          const contactMap = new Map<string, { id: string; name: string; tokens: number; cost: number; calls: number }>();
          for (const r of filteredRecords) {
            const key = r.contactId || r.contactName || 'unknown';
            const name = r.contactName || (r.contactId ? '好友' : '系统/朋友圈');
            const curr = contactMap.get(key) || { id: key, name, tokens: 0, cost: 0, calls: 0 };
            curr.tokens += r.totalTokens || 0;
            curr.cost += r.cost || 0;
            curr.calls += 1;
            contactMap.set(key, curr);
          }
          const contactRankings = Array.from(contactMap.values()).sort((a, b) => b.tokens - a.tokens);

          // Call type breakdown (聊天/拍一拍/主动消息/朋友圈/语音/线下)
          const callTypeDefs = [
            { type: 'chat', label: '聊天', icon: '💬', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            { type: 'pat', label: '拍一拍', icon: '👋', color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { type: 'proactive', label: '主动消息', icon: '⚡', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
            { type: 'moments', label: '朋友圈', icon: '📷', color: 'bg-pink-50 text-pink-800 border-pink-200' },
            { type: 'voice', label: '语音', icon: '🎙️', color: 'bg-sky-50 text-sky-800 border-sky-200' },
            { type: 'offline', label: '线下', icon: '☕', color: 'bg-purple-50 text-purple-800 border-purple-200' },
          ];

          const callTypeStats = callTypeDefs.map(def => {
            const items = filteredRecords.filter(r => r.callType === def.type);
            const tokens = items.reduce((acc, r) => acc + (r.totalTokens || 0), 0);
            const cost = items.reduce((acc, r) => acc + (r.cost || 0), 0);
            return {
              ...def,
              count: items.length,
              tokens,
              cost
            };
          });

          const recent20Records = filteredRecords.slice(0, 20);

          const formatTimestamp = (ts: number) => {
            const d = new Date(ts);
            const pad = (n: number) => n < 10 ? '0' + n : n;
            const month = pad(d.getMonth() + 1);
            const date = pad(d.getDate());
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const seconds = pad(d.getSeconds());
            return `${month}-${date} ${hours}:${minutes}:${seconds}`;
          };

          const getCallTypeBadge = (type: string) => {
            switch (type) {
              case 'chat': return { label: '聊天', bg: 'bg-emerald-100 text-emerald-800' };
              case 'pat': return { label: '拍一拍', bg: 'bg-amber-100 text-amber-800' };
              case 'proactive': return { label: '主动消息', bg: 'bg-indigo-100 text-indigo-800' };
              case 'moments': return { label: '朋友圈', bg: 'bg-pink-100 text-pink-800' };
              case 'voice': return { label: '语音', bg: 'bg-sky-100 text-sky-800' };
              case 'offline': return { label: '线下', bg: 'bg-purple-100 text-purple-800' };
              default: return { label: type || '其他', bg: 'bg-stone-100 text-stone-800' };
            }
          };

          return (
            <div key={tokenRefreshKey} className="space-y-3 animate-fadeIn">
              {/* 时间筛选 */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
                {[
                  { id: 'today', label: '今日' },
                  { id: 'week', label: '本周' },
                  { id: 'month', label: '本月' },
                  { id: 'all', label: '全部' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTokenFilter(item.id as TokenTimeFilter)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      tokenFilter === item.id
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 顶部总览卡 */}
              <div className="p-3.5 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-stone-200">Token 消耗总览</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-medium">
                    {tokenFilter === 'today' ? '今日统计' : tokenFilter === 'week' ? '本周统计' : tokenFilter === 'month' ? '本月统计' : '全部历史'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-stone-400">消耗 Token 总数</div>
                    <div className="text-xl font-bold tracking-tight text-white font-mono">
                      {totalTokens.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-stone-400">预估总费用</div>
                    <div className="text-xl font-bold tracking-tight text-amber-400 font-mono">
                      ${totalCost.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] text-stone-400">
                  <div>
                    <span className="text-stone-500">输入: </span>
                    <span className="text-stone-300 font-mono font-medium">{totalInputTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">输出: </span>
                    <span className="text-stone-300 font-mono font-medium">{totalOutputTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">调用: </span>
                    <span className="text-stone-300 font-mono font-medium">{filteredRecords.length} 次</span>
                  </div>
                </div>
              </div>

              {/* 按联系人聚合排行 */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-stone-600" />
                    <span>联系人消耗排行</span>
                  </h4>
                  <span className="text-[10px] text-stone-400">按 Token 数倒序</span>
                </div>

                {contactRankings.length === 0 ? (
                  <div className="text-center py-5 text-stone-400 text-[11px]">
                    该时间段内暂无联系人交互消耗
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contactRankings.map((c, idx) => {
                      const percent = totalTokens > 0 ? Math.round((c.tokens / totalTokens) * 100) : 0;
                      return (
                        <div key={c.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                idx === 0 ? 'bg-amber-400 text-stone-900' : idx === 1 ? 'bg-stone-300 text-stone-800' : idx === 2 ? 'bg-amber-600/30 text-stone-800' : 'bg-stone-200 text-stone-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-xs text-stone-800">{c.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-xs text-stone-900">{c.tokens.toLocaleString()}</span>
                              <span className="text-[10px] text-stone-400 ml-1">tokens</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-stone-800 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
                            <span>占比: {percent}% · 调用 {c.calls} 次</span>
                            <span className="text-amber-700 font-medium">预估费用: ${c.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 按调用类型统计 */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-600" />
                    <span>按调用类型统计</span>
                  </h4>
                  <span className="text-[10px] text-stone-400">共 {callTypeStats.reduce((acc, s) => acc + s.count, 0)} 次交互</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {callTypeStats.map(stat => (
                    <div key={stat.type} className={`p-2 rounded-xl border ${stat.color} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold flex items-center gap-1">
                          <span>{stat.icon}</span>
                          <span>{stat.label}</span>
                        </span>
                        <span className="text-[10px] font-mono font-semibold">{stat.count}次</span>
                      </div>
                      <div className="text-[10px] opacity-85 font-mono font-medium">
                        {stat.tokens > 1000 ? `${(stat.tokens / 1000).toFixed(1)}k` : stat.tokens} tokens
                      </div>
                      <div className="text-[9px] opacity-70 mt-0.5 font-mono">
                        ${stat.cost.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近 20 条调用明细 */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">最近调用明细</h4>
                    <p className="text-[10px] text-stone-400">最近 20 条调用详情</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('确定要清空所有 Token 消费记录吗？此操作无法撤销。')) {
                        clearTokenRecords();
                        setTokenRefreshKey(k => k + 1);
                      }
                    }}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-red-200/60"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>清空</span>
                  </button>
                </div>

                {recent20Records.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 text-[11px] space-y-1">
                    <div>暂无 Token 消耗明细</div>
                    <div className="text-[10px] text-stone-300">与微信好友聊天或触发主动消息后将自动记录</div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                    {recent20Records.map(rec => {
                      const badge = getCallTypeBadge(rec.callType);
                      return (
                        <div
                          key={rec.id}
                          className="p-2 bg-stone-50 rounded-xl border border-stone-200/60 text-[11px] space-y-1 hover:bg-stone-100/60 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="font-semibold text-stone-800">
                                {rec.contactName ? `【${rec.contactName}】` : '全局调用'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400">
                              {formatTimestamp(rec.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5 border-t border-stone-100">
                            <div className="flex items-center gap-2">
                              <span className="px-1 py-0.2 bg-stone-200/70 rounded text-[9px] text-stone-600 font-mono">
                                {rec.model}
                              </span>
                              <span>
                                入 <span className="font-mono text-stone-700">{rec.inputTokens}</span> · 出 <span className="font-mono text-stone-700">{rec.outputTokens}</span>
                              </span>
                            </div>
                            <div className="font-mono font-semibold text-stone-800">
                              {rec.totalTokens} tokens <span className="text-amber-700 font-normal">(${rec.cost.toFixed(5)})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 6.2 TTS 语音配置 */}
        {activeSubTab === 'tts' && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="pb-1 border-b border-stone-100 mb-2">
                <h3 className="text-xs font-bold text-stone-800">独立语音服务配置</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">此处的配置仅用于语音合成，不影响文字聊天 API。</p>
              </div>
              
              {/* 配置名称 */}
              <div>
                <label className="block text-[11px] text-stone-500 font-medium">配置名称</label>
                <input
                  type="text"
                  value={settings.ttsConfigName || ''}
                  onChange={(e) => onUpdateSettings({ ttsConfigName: e.target.value })}
                  placeholder="例如: OpenAI 官方 TTS / 自建中转"
                  className="w-full p-2 border border-stone-200 rounded-lg text-xs mt-0.5"
                />
              </div>

              {/* TTS 提供商 */}
              <div>
                <label className="block text-[11px] text-stone-500 font-medium">TTS 提供商</label>
                <select
                  value={settings.ttsProvider}
                  onChange={(e) => {
                    const prov = e.target.value as any;
                    let defaultUrl = settings.ttsApiUrl || '';
                    let defaultModel = settings.ttsModel;
                    if (prov === 'openai') {
                      defaultUrl = defaultUrl || 'https://api.openai.com/v1';
                      defaultModel = 'tts-1';
                    } else if (prov === 'minimax') {
                      defaultUrl = defaultUrl || (settings.minimaxSite === 'intl' ? 'https://api.minimax.io/v1/t2a_v2' : 'https://api.minimaxi.com/v1/t2a_v2');
                      defaultModel = 'speech-01-turbo';
                    }
                    onUpdateSettings({ ttsProvider: prov, ttsApiUrl: defaultUrl, ttsModel: defaultModel });
                  }}
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white text-xs mt-0.5"
                >
                  <option value="openai">OpenAI TTS (支持官方及各类兼容中转接口)</option>
                  <option value="minimax">MiniMax 语音 (海螺/ABAB开放平台)</option>
                  <option value="azure">Azure 认知语音服务</option>
                  <option value="elevenlabs">ElevenLabs 高仿真语音</option>
                  <option value="custom">自定义兼容 TTS 接口</option>
                  <option value="webspeech">浏览器内置 Web Speech API (免Key/本地直接发声)</option>
                </select>
              </div>

              {/* TTS API 地址 (Base URL) */}
              {settings.ttsProvider !== 'webspeech' && (
                <div>
                  <label className="block text-[11px] text-stone-500 font-medium">TTS API 地址 (Base URL)</label>
                  <input
                    type="text"
                    value={settings.ttsApiUrl || ''}
                    onChange={(e) => onUpdateSettings({ ttsApiUrl: e.target.value })}
                    placeholder={settings.ttsProvider === 'minimax' ? 'https://api.minimaxi.com/v1/t2a_v2' : 'https://api.openai.com/v1'}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    <button
                      onClick={() => onUpdateSettings({ ttsApiUrl: 'https://api.openai.com/v1' })}
                      className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono"
                    >
                      OpenAI 官方
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ ttsApiUrl: 'https://api.minimaxi.com/v1/t2a_v2', minimaxSite: 'china' })}
                      className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono"
                    >
                      MiniMax 国内站
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ ttsApiUrl: 'https://api.minimax.io/v1/t2a_v2', minimaxSite: 'intl' })}
                      className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono"
                    >
                      MiniMax 国际站
                    </button>
                  </div>
                </div>
              )}

              {/* TTS API 密钥 (API Key) */}
              {settings.ttsProvider !== 'webspeech' && (
                <div>
                  <label className="block text-[11px] text-stone-500 font-medium">TTS API 密钥 (API Key)</label>
                  <input
                    type="password"
                    value={settings.ttsApiKey || ''}
                    onChange={(e) => onUpdateSettings({ ttsApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    💡 未配置 TTS API 密钥时，聊天中的语音条不可播放声音（可在聊天中点击【转文字】查看内容）。
                  </p>
                </div>
              )}

              {/* MiniMax Group ID & 站点 */}
              {settings.ttsProvider === 'minimax' && (
                <div className="space-y-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200/80">
                  <div>
                    <label className="block text-[11px] text-stone-500 font-medium">MiniMax Group ID</label>
                    <input
                      type="text"
                      value={settings.ttsGroupId || ''}
                      onChange={(e) => onUpdateSettings({ ttsGroupId: e.target.value })}
                      placeholder="填入您的 MiniMax Group ID"
                      className="w-full p-2 border border-stone-200 rounded-lg bg-white text-xs mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-500 font-medium">MiniMax 站点</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => onUpdateSettings({ minimaxSite: 'china', ttsApiUrl: 'https://api.minimaxi.com/v1/t2a_v2' })}
                        className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                          settings.minimaxSite === 'china' ? 'bg-emerald-50 text-[#07c160] border-[#07c160]' : 'bg-white text-stone-600'
                        }`}
                      >
                        国内站 (api.minimaxi.com)
                      </button>
                      <button
                        onClick={() => onUpdateSettings({ minimaxSite: 'intl', ttsApiUrl: 'https://api.minimax.io/v1/t2a_v2' })}
                        className={`py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                          settings.minimaxSite === 'intl' ? 'bg-emerald-50 text-[#07c160] border-[#07c160]' : 'bg-white text-stone-600'
                        }`}
                      >
                        国际站 (api.minimax.io)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TTS 模型名称 */}
              {settings.ttsProvider !== 'webspeech' && (
                <div>
                  <label className="block text-[11px] text-stone-500 font-medium">TTS 模型名称</label>
                  <input
                    type="text"
                    value={settings.ttsModel || ''}
                    onChange={(e) => onUpdateSettings({ ttsModel: e.target.value })}
                    placeholder="tts-1"
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono text-xs mt-0.5"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {settings.ttsProvider === 'minimax' ? (
                      <>
                        <button
                          onClick={() => onUpdateSettings({ ttsModel: 'speech-01-turbo' })}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono cursor-pointer"
                        >
                          speech-01-turbo
                        </button>
                        <button
                          onClick={() => onUpdateSettings({ ttsModel: 'speech-01-hd' })}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono cursor-pointer"
                        >
                          speech-01-hd
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onUpdateSettings({ ttsModel: 'tts-1' })}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono cursor-pointer"
                        >
                          tts-1 (极速)
                        </button>
                        <button
                          onClick={() => onUpdateSettings({ ttsModel: 'tts-1-hd' })}
                          className="px-2 py-0.5 rounded text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 font-mono cursor-pointer"
                        >
                          tts-1-hd (高清)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 自定义音色 Voice ID */}
              <div>
                <label className="block text-[11px] text-stone-500 font-medium">
                  自定义音色 ID (Voice ID) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={settings.ttsVoiceId || ''}
                  onChange={(e) => onUpdateSettings({ ttsVoiceId: e.target.value })}
                  placeholder="请输入您的自定义音色 ID"
                  className="w-full p-2 border border-stone-200 rounded-lg bg-white text-xs font-mono mt-0.5"
                />
              </div>

              {/* 测试声音按钮与反馈 */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleValidateTTS}
                  disabled={isValidatingTTS || !settings.ttsApiUrl || !settings.ttsApiKey}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-xs disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isValidatingTTS ? 'animate-spin' : ''}`} />
                  <span>{isValidatingTTS ? '校验中...' : '1. 校验 TTS 地址与密钥'}</span>
                </button>

                <button
                  onClick={handleTestVoice}
                  disabled={testSoundPlaying || !settings.ttsVoiceId || settings.ttsVoiceId.trim() === ''}
                  className={`w-full py-2 ${!settings.ttsVoiceId || settings.ttsVoiceId.trim() === '' ? 'bg-stone-300' : 'bg-[#07c160] hover:bg-[#06ad56]'} text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-xs disabled:cursor-not-allowed`}
                >
                  <Volume2 className={`w-4 h-4 ${testSoundPlaying ? 'animate-bounce' : ''}`} />
                  <span>{testSoundPlaying ? '正在播放测试音...' : (!settings.ttsVoiceId || settings.ttsVoiceId.trim() === '' ? '请先填写 Voice ID' : '2. 测试自定义音色语音')}</span>
                </button>

                {ttsTestMessage && (
                  <div className={`text-[11px] p-2.5 rounded-lg border leading-relaxed ${
                    ttsTestMessage.includes('❌') || ttsTestMessage.includes('失败') || ttsTestMessage.includes('错误') || ttsTestMessage.includes('异常')
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : ttsTestMessage.includes('✅')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {ttsTestMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6.3 Perception Settings (Time & Weather) */}
        {activeSubTab === 'perception' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="pb-1 border-b border-stone-100 mb-2">
                <h3 className="text-xs font-bold text-stone-800">环境感知设置</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">让 AI 伴侣实时感知当前时间和天气，自然融入现实生活对话。</p>
              </div>

              {/* 1. 时间感知开关 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-900 text-xs">时间感知</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">让 AI 知道现在是几点、什么季节、星期几。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableTimeAwareness ?? true}
                    onChange={(e) => onUpdateSettings({ enableTimeAwareness: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                </label>
              </div>

              {/* 2. 天气感知开关 */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-900 text-xs">天气感知</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">让 AI 知道你所在城市的当前气温和天气状况。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableWeatherAwareness ?? false}
                    onChange={(e) => onUpdateSettings({ enableWeatherAwareness: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#07c160]"></div>
                </label>
              </div>

              {/* 3. 城市设置 (当天气感知开启时显示) */}
              {(settings.enableWeatherAwareness ?? false) && (
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <label className="block text-[11px] text-stone-600 font-medium">所在城市与天气信息</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="例如: 杭州, 北京, 上海"
                      className="flex-1 p-2 border border-stone-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleFetchWeather(cityInput)}
                      disabled={isFetchingWeather}
                      className="px-3 py-2 bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {isFetchingWeather ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>刷新</span>
                    </button>
                    <button
                      onClick={handleLocateAndFetch}
                      disabled={isFetchingWeather}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="自动定位当前城市"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>定位</span>
                    </button>
                  </div>

                  {weatherError && (
                    <p className="text-[10px] text-red-500">{weatherError}</p>
                  )}

                  {settings.weatherCache?.data && (
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/60 text-[11px] text-stone-700 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900">{settings.weatherCache.data.city}</span>：
                        <span className="text-emerald-600 font-semibold">{settings.weatherCache.data.weather}</span>，
                        <span>{settings.weatherCache.data.temperature}°C</span>，
                        <span className="text-stone-500">风速 {settings.weatherCache.data.windSpeed} km/h</span>
                      </div>
                      <span className="text-[9px] text-stone-400">
                        {new Date(settings.weatherCache.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 更新
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. 测试预览按钮 */}
              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={() => setShowTestModal(true)}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>测试注入到 AI 的上下文预览</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ☕ 瑞幸点单联动模块 */}
        {activeSubTab === 'luckin' && (
          <div className="space-y-3">
            {/* Brand Intro Card */}
            <div className="p-3.5 bg-gradient-to-br from-[#0b2d64] via-[#123b7a] to-[#1e4e8c] text-white rounded-xl shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs tracking-wide">瑞幸咖啡 × AI 联系人联动</h3>
                    <p className="text-[10px] text-blue-200">luckin coffee in-character ordering</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-semibold">
                  已联动
                </span>
              </div>
              <p className="text-[10.5px] text-blue-100 leading-relaxed">
                AI 联系人将根据自身性格、好感度与当前氛围，在聊天中为您点咖啡；并在好感度 ≥ 60 时主动请客。
              </p>
            </div>

            {/* 默认口味偏好 */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="pb-1 border-b border-stone-100">
                <h4 className="font-bold text-xs text-stone-800">您的默认咖啡口味与规格</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">当您或 AI 快速点单时，将优先参考此偏好。</p>
              </div>

              <div>
                <input
                  type="text"
                  value={settings.luckinDefaultFlavor || ''}
                  onChange={(e) => onUpdateSettings({ luckinDefaultFlavor: e.target.value })}
                  placeholder="例如: 生椰拿铁 标准冰 不加糖"
                  className="w-full p-2 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              {/* 快捷预设 */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-medium">快捷选择常用预设：</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '生椰拿铁 标准冰 不加糖',
                    '冰吸生椰拿铁 微冰 半糖',
                    '大杯冰美式 标准冰 不加糖',
                    '橙C美式 标准冰',
                    '丝绒拿铁 温热 半糖',
                    '茉莉花香拿铁 少冰',
                    '抹茶瑞纳冰 少少甜'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateSettings({ luckinDefaultFlavor: preset })}
                      className={`px-2 py-1 rounded-lg text-[10.5px] transition-all cursor-pointer ${
                        settings.luckinDefaultFlavor === preset
                          ? 'bg-blue-900 text-white font-medium shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI 主动请客设置 */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h4 className="font-bold text-xs text-stone-800">允许 AI 主动请客</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[200px]">好感度 ≥ 60 的联系人将根据周期主动发消息请你喝咖啡。</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-90">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.luckinAllowProactiveTreat ?? true}
                    onChange={(e) => onUpdateSettings({ luckinAllowProactiveTreat: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b2d64]"></div>
                </label>
              </div>

              {(settings.luckinAllowProactiveTreat ?? true) && (
                <div className="space-y-1.5">
                  <label className="text-[11px] text-stone-600 font-medium">请客冷却周期</label>
                  <select
                    value={settings.luckinTreatFrequency || 'weekly'}
                    onChange={(e) => onUpdateSettings({ luckinTreatFrequency: e.target.value as any })}
                    className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-stone-50"
                  >
                    <option value="weekly">每 7 天至多 1 次 (推荐)</option>
                    <option value="biweekly">每 14 天至多 1 次</option>
                    <option value="monthly">每 30 天至多 1 次</option>
                  </select>
                </div>
              )}
            </div>

            {/* 常用门店配置 */}
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <div className="pb-1 border-b border-stone-100">
                <h4 className="font-bold text-xs text-stone-800">常用配送 / 自提门店</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">订单小票与卡片将显示此门店名称。</p>
              </div>

              <div>
                <input
                  type="text"
                  value={settings.luckinStoreName || ''}
                  onChange={(e) => onUpdateSettings({ luckinStoreName: e.target.value })}
                  placeholder="例如: 瑞幸咖啡 · 创新科技广场店"
                  className="w-full p-2 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              {/* 门店预设 */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  '瑞幸咖啡 · 创新科技大厦店',
                  '瑞幸咖啡 · 国际金融中心IFC店',
                  '瑞幸咖啡 · 大学城南门旗舰店',
                  '瑞幸咖啡 · 枫林绿洲商务广场店'
                ].map((store) => (
                  <button
                    key={store}
                    type="button"
                    onClick={() => onUpdateSettings({ luckinStoreName: store })}
                    className={`px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                      settings.luckinStoreName === store
                        ? 'bg-[#0b2d64] text-white font-medium shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Reset Data Utility */}
        <div className="pt-4 pb-2 px-1">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2 bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-700 text-xs font-medium rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复出厂预设数据</span>
          </button>
        </div>
      </div>

      {/* Test Preview Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-white rounded-2xl p-4 shadow-xl text-left animate-in zoom-in-95 duration-150 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>AI 感知上下文预览</span>
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] font-mono text-stone-700 space-y-2 max-h-[260px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {(settings.enableTimeAwareness ?? true) && (
                <div>
                  <div className="font-bold text-stone-900 mb-0.5">【时间感知】</div>
                  <div>{getTimeContext()}</div>
                </div>
              )}

              {(settings.enableWeatherAwareness ?? false) && settings.weatherCache?.data && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="font-bold text-stone-900 mb-0.5">【天气感知】</div>
                  <div>{settings.weatherCache.data.city}现在天气：{settings.weatherCache.data.weather}，气温 {settings.weatherCache.data.temperature}°C，风速 {settings.weatherCache.data.windSpeed} km/h。</div>
                </div>
              )}

              {(!settings.enableTimeAwareness && (!settings.enableWeatherAwareness || !settings.weatherCache?.data)) && (
                <div className="text-stone-400 text-center py-4">当前未开启任何感知功能或暂无天气缓存。</div>
              )}
            </div>

            <button
              onClick={() => setShowTestModal(false)}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}

      {/* Safe Custom Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-stone-900 mb-2">恢复出厂预设数据</h3>
            <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">确定要恢复出厂预设数据吗？所有聊天记录与联系人将恢复默认。</p>
            <div className="flex items-center gap-2.5">
              <button
                className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setShowResetConfirm(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
