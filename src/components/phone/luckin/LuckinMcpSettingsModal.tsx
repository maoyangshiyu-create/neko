import React, { useState, useEffect, useMemo } from 'react';
import { 
  LuckinMcpConfig, 
  LuckinShopItem 
} from '../../../types/luckin';
import { 
  getStoredMcpConfig, 
  saveStoredMcpConfig, 
  testMcpConnection, 
  queryRealNearbyShops, 
  fetchRealMenu,
  DEFAULT_LUCKIN_MCP_ENDPOINT 
} from '../../../services/luckinMcpService';
import { 
  CHINA_LUCKIN_REGIONS, 
  getRegionDetails 
} from '../../../data/luckinRegionData';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  MapPin, 
  KeyRound, 
  Globe, 
  Store, 
  ExternalLink, 
  Check, 
  Compass, 
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LuckinMcpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: LuckinMcpConfig) => void;
  currentStoreName: string;
  onSelectStore: (storeName: string, shopId?: string) => void;
}

export const LuckinMcpSettingsModal: React.FC<LuckinMcpSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  currentStoreName,
  onSelectStore
}) => {
  const [config, setConfig] = useState<LuckinMcpConfig>(getStoredMcpConfig());
  const [tokenInput, setTokenInput] = useState(config.token || '');
  const [endpointInput, setEndpointInput] = useState(config.endpoint || DEFAULT_LUCKIN_MCP_ENDPOINT);
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasServerEnvToken, setHasServerEnvToken] = useState(false);

  useEffect(() => {
    fetch('/api/luckin/mcp/config')
      .then(res => res.json())
      .then(data => {
        if (data?.hasServerToken) {
          setHasServerEnvToken(true);
          if (!tokenInput) {
            setTokenInput('SERVER_CONFIGURED_TOKEN');
            setIsEnabled(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [shops, setShops] = useState<LuckinShopItem[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopKeyword, setShopKeyword] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number } | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<string>(
    config.selectedRegion?.province || CHINA_LUCKIN_REGIONS[0].province
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    config.selectedRegion?.city || CHINA_LUCKIN_REGIONS[0].cities[0].city
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    config.selectedRegion?.district || CHINA_LUCKIN_REGIONS[0].cities[0].districts[0]?.district || ''
  );
  const [selectedStreet, setSelectedStreet] = useState<string>(
    config.selectedRegion?.street || ''
  );

  // Get current cities and districts derived from selected province & city
  const currentProvData = useMemo(() => {
    return CHINA_LUCKIN_REGIONS.find(r => r.province === selectedProvince) || CHINA_LUCKIN_REGIONS[0];
  }, [selectedProvince]);

  const currentCities = useMemo(() => {
    return currentProvData.cities;
  }, [currentProvData]);

  const currentCityData = useMemo(() => {
    return currentCities.find(c => c.city === selectedCity) || currentCities[0];
  }, [currentCities, selectedCity]);

  const currentDistricts = useMemo(() => {
    return currentCityData.districts;
  }, [currentCityData]);

  // Load and apply shops for a given region
  const applyRegionAndLoadShops = (
    prov: string, 
    city: string, 
    dist?: string, 
    street?: string, 
    triggerLiveMcp: boolean = true
  ) => {
    const details = getRegionDetails(prov, city, dist);
    const loadedShops = details.shops;
    setShops(loadedShops);

    const firstShop = loadedShops[0];
    const updated = saveStoredMcpConfig({
      userLatitude: details.lat,
      userLongitude: details.lng,
      cachedShops: loadedShops,
      selectedRegion: {
        province: prov,
        city,
        district: dist || (currentDistricts[0]?.district ?? ''),
        street: street || ''
      },
      selectedShop: firstShop || config.selectedShop
    });
    setConfig(updated);
    onConfigSaved(updated);

    if (firstShop) {
      onSelectStore(firstShop.shopName, firstShop.shopId);
    }

    // If MCP is configured or server has token, concurrently attempt to query live MCP gateway
    if (triggerLiveMcp && (tokenInput.trim() || hasServerEnvToken)) {
      setIsLoadingShops(true);
      queryRealNearbyShops({
        latitude: details.lat,
        longitude: details.lng
      })
        .then(liveShops => {
          if (Array.isArray(liveShops) && liveShops.length > 0) {
            setShops(liveShops);
            const liveUpdated = saveStoredMcpConfig({
              cachedShops: liveShops,
              selectedShop: liveShops[0]
            });
            setConfig(liveUpdated);
            onConfigSaved(liveUpdated);
            onSelectStore(liveShops[0].shopName, liveShops[0].shopId);
          }
        })
        .catch(err => {
          console.log('[applyRegionAndLoadShops MCP live fetch note]', err?.message);
        })
        .finally(() => {
          setIsLoadingShops(false);
        });
    }
  };

  const handleProvinceChange = (provName: string) => {
    setSelectedProvince(provName);
    const prov = CHINA_LUCKIN_REGIONS.find(r => r.province === provName) || CHINA_LUCKIN_REGIONS[0];
    const firstCity = prov.cities[0];
    setSelectedCity(firstCity.city);
    const firstDist = firstCity.districts[0]?.district || '';
    setSelectedDistrict(firstDist);
    applyRegionAndLoadShops(provName, firstCity.city, firstDist, selectedStreet);
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const city = currentCities.find(c => c.city === cityName) || currentCities[0];
    const firstDist = city.districts[0]?.district || '';
    setSelectedDistrict(firstDist);
    applyRegionAndLoadShops(selectedProvince, cityName, firstDist, selectedStreet);
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    applyRegionAndLoadShops(selectedProvince, selectedCity, distName, selectedStreet);
  };

  // Sync state on modal open
  useEffect(() => {
    const cur = getStoredMcpConfig();
    setConfig(cur);
    setTokenInput(cur.token || '');
    setEndpointInput(cur.endpoint || DEFAULT_LUCKIN_MCP_ENDPOINT);
    setIsEnabled(cur.isEnabled);

    const initialProv = cur.selectedRegion?.province || CHINA_LUCKIN_REGIONS[0].province;
    const initialCity = cur.selectedRegion?.city || CHINA_LUCKIN_REGIONS[0].cities[0].city;
    const initialDist = cur.selectedRegion?.district || CHINA_LUCKIN_REGIONS[0].cities[0].districts[0]?.district || '';
    setSelectedProvince(initialProv);
    setSelectedCity(initialCity);
    setSelectedDistrict(initialDist);
    setSelectedStreet(cur.selectedRegion?.street || '');

    if (Array.isArray(cur.cachedShops) && cur.cachedShops.length > 0) {
      setShops(cur.cachedShops);
    } else {
      const details = getRegionDetails(initialProv, initialCity, initialDist);
      setShops(details.shops);
      if (details.shops.length > 0 && !cur.selectedShop) {
        saveStoredMcpConfig({
          cachedShops: details.shops,
          selectedShop: details.shops[0],
          userLatitude: details.lat,
          userLongitude: details.lng
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Testing MCP Connection
  const handleTestConnection = async () => {
    if (!tokenInput.trim()) {
      setTestResult({
        success: false,
        message: '请先填写瑞幸 MCP Bearer Token'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testMcpConnection(tokenInput.trim(), endpointInput.trim());
      if (res.isConnected) {
        setTestResult({
          success: true,
          message: res.message || '🎉 连接成功！瑞幸官方 MCP 真实下单已就绪'
        });
        if (res.shopList && res.shopList.length > 0) {
          setShops(res.shopList);
          saveStoredMcpConfig({ cachedShops: res.shopList });
        }
        // Auto update config
        const updated = saveStoredMcpConfig({
          token: tokenInput.trim(),
          endpoint: endpointInput.trim(),
          isConnected: true,
          isEnabled: true,
          lastTestedAt: Date.now()
        });
        setConfig(updated);
        setIsEnabled(true);
        onConfigSaved(updated);
      } else {
        setTestResult({
          success: false,
          message: res.message || '连接失败，请核对 Token 有效性'
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || '网络请求错误'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle GPS location & fetch nearby real shops
  const handleLocateAndFetchShops = async (presetLat?: number, presetLng?: number, presetCityName?: string) => {
    setIsLoadingShops(true);

    const fetchShopsWithCoords = async (lat?: number, lng?: number, note?: string) => {
      try {
        if (lat !== undefined && lng !== undefined) {
          setGpsLocation({ lat, lng });
          saveStoredMcpConfig({ userLatitude: lat, userLongitude: lng });
        }
        const list = await queryRealNearbyShops({
          latitude: lat,
          longitude: lng,
          keyword: shopKeyword ? shopKeyword.trim() : undefined
        });
        setShops(list);
        if (list.length > 0) {
          saveStoredMcpConfig({ cachedShops: list });
          setTestResult({
            success: true,
            message: note ? `已成功定位 (${note})，为您找到 ${list.length} 家周边瑞幸门店` : '已成功定位，为您找到周边瑞幸门店'
          });
        } else {
          setTestResult({
            success: false,
            message: `未找到周边瑞幸门店 (${note || '当前坐标'})，请尝试输入具体商圈或城市搜索`
          });
        }
      } catch (e: any) {
        console.error('Failed to query shops:', e);
        setTestResult({
          success: false,
          message: `瑞幸门店查询失败: ${e?.message || String(e)}`
        });
      } finally {
        setIsLoadingShops(false);
      }
    };

    if (presetLat !== undefined && presetLng !== undefined) {
      await fetchShopsWithCoords(presetLat, presetLng, presetCityName || '指定城市');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await fetchShopsWithCoords(position.coords.latitude, position.coords.longitude, '浏览器GPS');
        },
        async (err) => {
          console.warn('GPS geolocation failed, using region coordinates fallback:', err);
          const details = getRegionDetails(selectedProvince, selectedCity, selectedDistrict);
          await fetchShopsWithCoords(details.lat, details.lng, `${selectedCity} · ${selectedDistrict}`);
        },
        { timeout: 5000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } else {
      const details = getRegionDetails(selectedProvince, selectedCity, selectedDistrict);
      await fetchShopsWithCoords(details.lat, details.lng, `${selectedCity} · ${selectedDistrict}`);
    }
  };

  // Save all settings
  const handleSave = () => {
    const details = getRegionDetails(selectedProvince, selectedCity, selectedDistrict);
    const updated = saveStoredMcpConfig({
      token: tokenInput.trim(),
      endpoint: endpointInput.trim(),
      isEnabled,
      isConnected: testResult?.success ?? config.isConnected,
      selectedRegion: {
        province: selectedProvince,
        city: selectedCity,
        district: selectedDistrict,
        street: selectedStreet
      },
      cachedShops: shops.length > 0 ? shops : details.shops,
      userLatitude: details.lat,
      userLongitude: details.lng,
      selectedShop: config.selectedShop || shops[0] || details.shops[0]
    });
    setConfig(updated);
    onConfigSaved(updated);
    if (updated.selectedShop) {
      onSelectStore(updated.selectedShop.shopName, updated.selectedShop.shopId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0b2d64] via-[#113876] to-[#1e4e8c] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">瑞幸官方 MCP 真实下单设置</h3>
              <p className="text-[10.5px] text-blue-200">连接官方 Model Context Protocol 协议直连下单</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Real MCP Status Banner */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            config.isConnected && isEnabled
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-stone-50 border-stone-200 text-stone-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${config.isConnected && isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              <div>
                <span className="font-bold text-xs block">
                  {config.isConnected && isEnabled ? '瑞幸官方 MCP 真实点单：已就绪' : '官方 MCP 真实点单：未激活'}
                </span>
                <span className="text-[10px] text-stone-500">
                  {config.isConnected ? '下单将直接通过瑞幸官方系统出单并生成取餐码' : '请填入 MCP Token 即可连接真实收银台'}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0b2d64]"></div>
            </label>
          </div>

          {/* Token Input Section */}
          <div className="space-y-2 bg-stone-50/80 p-3 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0b2d64]" />
                <span>Luckin MCP Token (Bearer)</span>
              </label>
              <a
                href="https://open.lkcoffee.com/mcp"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] text-[#0b2d64] hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>获取官方 Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="例如: eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-white text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0b2d64] font-mono"
              />
            </div>

            <p className="text-[10px] text-stone-500 leading-relaxed">
              💡 登录瑞幸开放平台（open.lkcoffee.com/mcp）获取你的用户认证令牌，用于代表你的账号直接查询附近门店、智能比价并向瑞幸门店派单。
            </p>
          </div>

          {/* MCP Endpoint URL */}
          <div className="space-y-1.5 bg-stone-50/80 p-3 rounded-2xl border border-stone-200">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#0b2d64]" />
              <span>MCP 服务端点 Endpoint</span>
            </label>
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder={DEFAULT_LUCKIN_MCP_ENDPOINT}
              className="w-full bg-white text-[11px] px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0b2d64] font-mono text-stone-700"
            />
          </div>

          {/* Connection Test Action */}
          <div className="space-y-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !tokenInput.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] hover:from-[#113876] hover:to-[#22559c] disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>正在连接瑞幸 MCP 网关...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>测试连通性 & 同步门店</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs animate-in fade-in ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="flex-1">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Real Nearby Shops Selector */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#0b2d64]" />
                <span>实时附近瑞幸门店 (MCP 查询)</span>
              </label>
              <button
                onClick={handleLocateAndFetchShops}
                disabled={isLoadingShops}
                className="text-[11px] text-[#0b2d64] font-bold hover:bg-blue-50 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isLoadingShops ? (
                  <RotateCcw className="w-3 h-3 animate-spin" />
                ) : (
                  <Compass className="w-3 h-3" />
                )}
                <span>GPS 定位获取</span>
              </button>
            </div>

            {/* Keyword search input */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-stone-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border border-stone-200">
                <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={shopKeyword}
                  onChange={(e) => setShopKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocateAndFetchShops()}
                  placeholder="搜索店名 / 街道商圈..."
                  className="bg-transparent text-xs focus:outline-none flex-1"
                />
              </div>
              <button
                onClick={() => handleLocateAndFetchShops()}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 font-bold rounded-xl text-stone-700 text-xs cursor-pointer"
              >
                搜索
              </button>
            </div>

            {/* Region Selector (省/市/区) */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0b2d64]" />
                  <span>选择配送 / 自提地区</span>
                </span>
                <span className="text-[10px] text-stone-400">切换地区即时更新下方瑞幸门店</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[10px] text-stone-500 font-bold block mb-1">省份 / 直辖市</label>
                  <select
                    value={selectedProvince}
                    onChange={e => handleProvinceChange(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1.5 focus:ring-[#0b2d64] cursor-pointer"
                  >
                    {CHINA_LUCKIN_REGIONS.map(p => (
                      <option key={p.province} value={p.province}>{p.province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold block mb-1">城市</label>
                  <select
                    value={selectedCity}
                    onChange={e => handleCityChange(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1.5 focus:ring-[#0b2d64] cursor-pointer"
                  >
                    {currentCities.map(c => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold block mb-1">区 / 县</label>
                  <select
                    value={selectedDistrict}
                    onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1.5 focus:ring-[#0b2d64] cursor-pointer"
                  >
                    {currentDistricts.map(d => (
                      <option key={d.district} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={selectedStreet}
                  onChange={e => setSelectedStreet(e.target.value)}
                  placeholder="详细街道 / 写字楼 / 商圈（选填，如：科技园中区）"
                  className="flex-1 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-1.5 focus:ring-[#0b2d64]"
                />
              </div>
            </div>

            {/* Shops list */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-0.5">
                <span className="font-semibold text-stone-700">
                  {selectedCity} · {selectedDistrict} 瑞幸门店 ({shops.length} 家)
                </span>
                <span className="text-[10px] text-stone-400">点击选中作为当前下单门店</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                {shops.length === 0 ? (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-stone-400 text-xs">
                    该地区暂无门店数据，请在上方切换省市区或输入搜索
                  </div>
                ) : (
                  shops.map((shop) => {
                    const isSelected = currentStoreName === shop.shopName || config.selectedShop?.shopId === shop.shopId;
                    return (
                      <div
                        key={shop.shopId}
                        onClick={async () => {
                          onSelectStore(shop.shopName, shop.shopId);
                          const updated = saveStoredMcpConfig({ selectedShop: shop });
                          setConfig(updated);
                          onConfigSaved(updated);
                          try {
                            await fetchRealMenu(shop.shopId);
                          } catch (err: any) {
                            console.error('[LuckinMcpSettingsModal fetchRealMenu Error]', err);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#0b2d64] text-stone-900 shadow-sm ring-1 ring-[#0b2d64]/20'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-stone-900 leading-tight">
                              {shop.shopName}
                            </span>
                            {shop.distance && (
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-100/80 text-[#0b2d64] font-bold text-[9px] shrink-0">
                                {shop.distance}
                              </span>
                            )}
                            {shop.businessStatus && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 font-bold text-[9px] shrink-0">
                                {shop.businessStatus}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-stone-600 leading-snug break-words">
                            <span className="text-stone-400 mr-1">📍 地址:</span>
                            {shop.address}
                          </p>

                          {shop.businessHours && (
                            <p className="text-[10px] text-stone-400">
                              🕒 营业时间: {shop.businessHours}
                            </p>
                          )}
                        </div>

                        <div className="pt-0.5 shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#0b2d64] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-stone-300 text-transparent flex items-center justify-center hover:border-[#0b2d64]">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-[#0b2d64] hover:bg-[#1a427d] text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
          >
            保存并启用 MCP
          </button>
        </div>

      </div>
    </div>
  );
};
