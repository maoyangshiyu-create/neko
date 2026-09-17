import React, { useState, useEffect, useMemo } from 'react';
import { Contact, PhoneSettings, ChatMessage, ContactMemory } from '../../../types/phone';
import { LuckinDrink, LuckinOrderData, LuckinMcpConfig } from '../../../types/luckin';
import { 
  LUCKIN_DRINKS,
  quickOrder, 
  getInCharacterCoffeeMessage 
} from '../../../services/luckinService';
import { 
  getStoredMcpConfig, 
  saveStoredMcpConfig,
  previewRealMcpOrder, 
  submitRealMcpOrder, 
  queryRealMcpOrderStatus,
  queryRealNearbyShops,
  fetchRealMenu,
  mapMcpProductToDrink,
  isRealLuckinShopId
} from '../../../services/luckinMcpService';
import { LuckinMcpSettingsModal } from './LuckinMcpSettingsModal';
import { LuckinRealCashierModal } from './LuckinRealCashierModal';
import { LuckinPayRedirectionModal } from './LuckinPayRedirectionModal';
import { LuckinShopItem } from '../../../types/luckin';
import { 
  CHINA_LUCKIN_REGIONS, 
  getRegionDetails 
} from '../../../data/luckinRegionData';
import { 
  ArrowLeft, 
  Coffee, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Gift, 
  Heart, 
  Search, 
  Store, 
  Bike, 
  RotateCcw, 
  Flame, 
  Check, 
  X,
  CreditCard,
  MapPin,
  ChevronDown,
  Settings2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Avatar } from '../Avatar';

interface LuckinAppProps {
  settings: PhoneSettings;
  onUpdateSettings: (s: Partial<PhoneSettings>) => void;
  contacts: Contact[];
  onReturnToDesktop: () => void;
  onSendMessage?: (contactId: string, message: ChatMessage) => void;
  onUpdateContact?: (id: string, updates: Partial<Contact>) => void;
  onUpdateContactMemory?: (contactId: string, memory: ContactMemory) => void;
}

// Helper to strictly filter out tools, assistants, and non-character contacts
const isCharacterContact = (c: Contact | undefined | null): boolean => {
  if (!c) return false;
  if (c.isGroup) return false;
  if (c.isTool || c.isAssistant) return false;
  if (c.id === 'assistant' || c.id.startsWith('tool_')) return false;
  if (c.group === '工具' || c.group === '助手' || c.group === '开发工具') return false;
  if (c.groups && c.groups.some(g => g === '工具' || g === '助手' || g === '开发工具')) return false;
  const name = (c.name || '').trim();
  const remark = (c.remark || '').trim();
  if (name.includes('开发工具') || remark.includes('开发工具')) return false;
  if (name.includes('言言机助手') || remark.includes('言言机助手')) return false;
  if (name.includes('系统助手') || remark.includes('系统助手')) return false;
  return true;
};

export const LuckinApp: React.FC<LuckinAppProps> = ({
  settings,
  onUpdateSettings,
  contacts,
  onReturnToDesktop,
  onSendMessage,
  onUpdateContact,
  onUpdateContactMemory
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'ai_order' | 'menu' | 'orders' | 'privilege'>('ai_order');
  
  // Selected contact for AI ordering - strictly exclude tool and assistant contacts
  const validContacts = useMemo(() => contacts.filter(isCharacterContact), [contacts]);
  const [selectedContactId, setSelectedContactId] = useState<string>(validContacts[0]?.id || '');
  const activeContact = useMemo(() => validContacts.find(c => c.id === selectedContactId) || validContacts[0], [validContacts, selectedContactId]);

  // MCP Configuration State
  const [mcpConfig, setMcpConfig] = useState<LuckinMcpConfig>(getStoredMcpConfig());
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncDiagnostics, setSyncDiagnostics] = useState<any>(null);

  // Region fallback shops
  const defaultRegionShops = useMemo(() => {
    const prov = mcpConfig.selectedRegion?.province || CHINA_LUCKIN_REGIONS[0].province;
    const city = mcpConfig.selectedRegion?.city || CHINA_LUCKIN_REGIONS[0].cities[0].city;
    const dist = mcpConfig.selectedRegion?.district || CHINA_LUCKIN_REGIONS[0].cities[0].districts[0]?.district;
    return getRegionDetails(prov, city, dist).shops;
  }, [mcpConfig.selectedRegion]);

  // Store selection
  const [realShops, setRealShops] = useState<LuckinShopItem[]>(() => {
    if (Array.isArray(mcpConfig.cachedShops) && mcpConfig.cachedShops.length > 0) {
      return mcpConfig.cachedShops;
    }
    return defaultRegionShops;
  });

  const [selectedStore, setSelectedStore] = useState<string>(() => {
    return mcpConfig.selectedShop?.shopName || mcpConfig.cachedShops?.[0]?.shopName || defaultRegionShops[0]?.shopName || settings.luckinStoreName || '瑞幸咖啡';
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(() => {
    return mcpConfig.selectedShop?.shopId || mcpConfig.cachedShops?.[0]?.shopId || defaultRegionShops[0]?.shopId;
  });
  const [showStorePicker, setShowStorePicker] = useState(false);

  // Keep realShops in sync with mcpConfig.cachedShops and defaultRegionShops
  useEffect(() => {
    if (Array.isArray(mcpConfig.cachedShops) && mcpConfig.cachedShops.length > 0) {
      setRealShops(mcpConfig.cachedShops);
      if (!selectedStoreId || !mcpConfig.cachedShops.some(s => s.shopId === selectedStoreId)) {
        const target = mcpConfig.selectedShop || mcpConfig.cachedShops[0];
        setSelectedStore(target.shopName);
        setSelectedStoreId(target.shopId);
      }
    } else if (defaultRegionShops.length > 0) {
      setRealShops(defaultRegionShops);
      if (!selectedStoreId) {
        setSelectedStore(defaultRegionShops[0].shopName);
        setSelectedStoreId(defaultRegionShops[0].shopId);
      }
    }
  }, [mcpConfig.cachedShops, defaultRegionShops]);

  // Sync selectedStore and selectedStoreId when mcpConfig.selectedShop changes
  useEffect(() => {
    if (mcpConfig.selectedShop) {
      if (mcpConfig.selectedShop.shopName) {
        setSelectedStore(mcpConfig.selectedShop.shopName);
      }
      if (mcpConfig.selectedShop.shopId) {
        setSelectedStoreId(mcpConfig.selectedShop.shopId);
      }
      setRealShops(prev => {
        if (!mcpConfig.selectedShop) return prev;
        if (prev.some(s => s.shopId === mcpConfig.selectedShop?.shopId)) {
          return prev;
        }
        return [mcpConfig.selectedShop, ...prev];
      });
    }
  }, [mcpConfig.selectedShop]);

  // Real Menu state
  const [realMenu, setRealMenu] = useState<LuckinDrink[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Check server-side Luckin MCP config on mount
  useEffect(() => {
    fetch('/api/luckin/mcp/config')
      .then(res => res.json())
      .then(data => {
        if (data?.hasServerToken) {
          setMcpConfig(prev => {
            const updated = {
              ...prev,
              isEnabled: true,
              isConnected: true,
              token: prev.token || 'SERVER_ENV_TOKEN'
            };
            saveStoredMcpConfig(updated);
            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Load actual shops from live MCP when configured
  useEffect(() => {
    if (mcpConfig.isEnabled && (mcpConfig.token || mcpConfig.isConnected)) {
      queryRealNearbyShops({
        latitude: mcpConfig.userLatitude,
        longitude: mcpConfig.userLongitude
      })
      .then(shops => {
        if (Array.isArray(shops) && shops.length > 0) {
          setRealShops(shops);
          const isMock = !selectedStoreId || !isRealLuckinShopId(selectedStoreId);
          if (isMock || !shops.some(s => s.shopId === selectedStoreId)) {
            const first = (mcpConfig.selectedShop && isRealLuckinShopId(mcpConfig.selectedShop.shopId)) ? mcpConfig.selectedShop : shops[0];
            setSelectedStore(first.shopName);
            setSelectedStoreId(first.shopId);
          }
        }
      })
      .catch(err => {
        console.warn('Note: Live MCP shops fetch completed with fallback:', err?.message);
      });
    }
  }, [mcpConfig.isEnabled, mcpConfig.token, mcpConfig.isConnected, mcpConfig.userLatitude, mcpConfig.userLongitude]);

  // Synchronize real products from official Luckin MCP
  const handleSyncRealMenu = async (storeId?: string, forceRefresh = false) => {
    const targetStoreId = storeId || selectedStoreId || mcpConfig.selectedShop?.shopId || realShops[0]?.shopId;
    if (!(mcpConfig.isEnabled && (mcpConfig.token || mcpConfig.isConnected))) return;

    setIsLoadingMenu(true);
    setSyncError(null);
    try {
      const res = await fetchRealMenu(targetStoreId, { forceRefresh });
      setSyncDiagnostics(res.diagnostics || null);
      if (res.success && Array.isArray(res.mappedDrinks) && res.mappedDrinks.length > 0) {
        setRealMenu(res.mappedDrinks);
        if (res.shopId && res.shopId !== selectedStoreId) {
          setSelectedStoreId(res.shopId);
          const matchedShop = realShops.find(s => s.shopId === res.shopId);
          if (matchedShop) setSelectedStore(matchedShop.shopName);
        }
      } else if (res.success && Array.isArray(res.drinks) && res.drinks.length > 0) {
        const mapped = res.drinks.map(mapMcpProductToDrink);
        setRealMenu(mapped);
      } else {
        const errorMsg = res.error || '暂未检索到商品';
        setSyncError(errorMsg);
        console.warn('Real menu sync warning:', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      setSyncError(errorMsg);
      console.error('Failed to sync real menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Load real menu when selectedStoreId or MCP connection changes
  useEffect(() => {
    if (selectedStoreId && mcpConfig.isEnabled && (mcpConfig.token || mcpConfig.isConnected)) {
      handleSyncRealMenu(selectedStoreId, false);
    } else {
      setRealMenu([]);
    }
  }, [selectedStoreId, mcpConfig.isEnabled, mcpConfig.token, mcpConfig.isConnected]);

  // AI Order States
  const [userDemandInput, setUserDemandInput] = useState('');
  const [currentAiOrder, setCurrentAiOrder] = useState<LuckinOrderData | null>(null);
  const [isGeneratingAiOrder, setIsGeneratingAiOrder] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState<string>('');

  // Menu States
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [menuSearch, setMenuSearch] = useState('');
  const [customizingDrink, setCustomizingDrink] = useState<LuckinDrink | null>(null);
  const [customSpecs, setCustomSpecs] = useState<{
    size: '大杯' | '超大杯';
    temperature: '冰' | '温' | '热';
    sweetness: '不加糖' | '微糖' | '半糖' | '标准糖';
  }>({
    size: '大杯',
    temperature: '冰',
    sweetness: '不加糖'
  });

  // Orders State (loaded from settings or local fallback)
  const [orders, setOrders] = useState<LuckinOrderData[]>(() => {
    return (settings && Array.isArray(settings.luckinOrders)) ? settings.luckinOrders : [];
  });
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Cashier Modal State
  const [cashierOrder, setCashierOrder] = useState<LuckinOrderData | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccessModal, setPaySuccessModal] = useState<LuckinOrderData | null>(null);
  const [payRedirectionOrder, setPayRedirectionOrder] = useState<LuckinOrderData | null>(null);
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);

  // Filter orders by tab in orders view
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'delivering' | 'treats'>('all');

  // Sync orders with settings when orders change
  useEffect(() => {
    onUpdateSettings({ luckinOrders: orders });
  }, [orders]);

  // Set initial speech for active contact
  useEffect(() => {
    if (activeContact) {
      const intimacy = activeContact.intimacyScore || 50;
      if (mcpConfig.isEnabled && mcpConfig.isConnected) {
        setAiSpeechText(`“已连接瑞幸官方 MCP 真机下单通道！想喝什么直接告诉我，我来帮你向附近门店派单～”`);
      } else if (intimacy >= 80) {
        setAiSpeechText(`“今天想喝什么？随时告诉我，我来帮你点，或者我请客也行哦～”`);
      } else if (intimacy >= 60) {
        setAiSpeechText(`“下午工作辛苦啦，要来一杯提神的瑞幸咖啡吗？”`);
      } else {
        setAiSpeechText(`“需要帮你点杯咖啡吗？告诉我你喜欢的口味和冰度吧。”`);
      }
    }
  }, [selectedContactId, mcpConfig.isEnabled, mcpConfig.isConnected]);

  // Handle requesting AI to help order (supports both real MCP and virtual fallback)
  const handleRequestAiOrder = async (demand: string) => {
    if (!activeContact) return;
    setIsGeneratingAiOrder(true);
    setUserDemandInput('');

    // If MCP is enabled and token provided, call real MCP preview
    if (mcpConfig.isEnabled && mcpConfig.token) {
      const activeStoreId = selectedStoreId || mcpConfig.selectedShop?.shopId || realShops[0]?.shopId;
      if (!activeStoreId) {
        setIsGeneratingAiOrder(false);
        setShowMcpModal(true);
        return;
      }
      try {
        const baseOrder = quickOrder({
          text: demand,
          contact: activeContact,
          defaultFlavor: settings.luckinDefaultFlavor,
          storeName: selectedStore,
          isTreat: false
        });

        const mcpPreview = await previewRealMcpOrder({
          drinkName: baseOrder.drinkName,
          shopId: activeStoreId,
          specs: baseOrder.specs,
          temperature: baseOrder.temperature,
          sweetness: baseOrder.sweetness,
          size: baseOrder.size
        });

        if (mcpPreview.success) {
          const realOrder: LuckinOrderData = {
            ...baseOrder,
            isRealMcpOrder: true,
            mcpDraftId: mcpPreview.draftId,
            price: mcpPreview.payPrice || baseOrder.price,
            originalPrice: mcpPreview.originalPrice || baseOrder.originalPrice,
            storeName: mcpPreview.shopName || selectedStore,
            storeAddress: mcpPreview.shopAddress,
            specs: mcpPreview.specsText || baseOrder.specs
          };

          setAiSpeechText(`“已通过瑞幸官方 MCP 匹配到【${realOrder.drinkName}】，实时优惠计算已就绪，确认后即可出单！”`);
          setCurrentAiOrder(realOrder);
          setIsGeneratingAiOrder(false);
          return;
        } else {
          setIsGeneratingAiOrder(false);
          alert(`真实瑞幸 MCP 下单预览失败: ${mcpPreview.error || '未知错误'}`);
          return;
        }
      } catch (err: any) {
        console.warn('MCP preview failed:', err);
        setIsGeneratingAiOrder(false);
        alert(`真实瑞幸 MCP 下单预览异常: ${err.message || String(err)}`);
        return;
      }
    }

    setIsGeneratingAiOrder(false);
    setShowMcpModal(true);
  };

  // Open specs customization dialog
  const handleOpenSpecsModal = (drink: LuckinDrink) => {
    setCustomizingDrink(drink);
    setCustomSpecs({
      size: '大杯',
      temperature: drink.defaultSpecs.temperature,
      sweetness: drink.defaultSpecs.sweetness
    });
  };

  // Confirm specs and create order from menu
  const handleConfirmMenuSpecs = async (isDirectPay: boolean = false) => {
    if (!customizingDrink || !activeContact) return;

    if (!mcpConfig.isEnabled || !mcpConfig.token) {
      setShowMcpModal(true);
      return;
    }

    const activeStoreId = selectedStoreId || mcpConfig.selectedShop?.shopId || realShops[0]?.shopId;
    if (!activeStoreId) {
      setShowMcpModal(true);
      return;
    }

    const specsStr = `${customSpecs.size} · ${customSpecs.temperature === '冰' ? '标准冰' : customSpecs.temperature === '热' ? '标准热' : '温饮'} · ${customSpecs.sweetness}`;
    const orderId = `lk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    let basePrice = customizingDrink.price + (customSpecs.size === '超大杯' ? 3 : 0);
    let originalPrice = customizingDrink.originalPrice + (customSpecs.size === '超大杯' ? 3 : 0);
    let isRealMcp = false;
    let mcpDraftId: string | undefined = undefined;

    try {
      const mcpPreview = await previewRealMcpOrder({
        drinkName: customizingDrink.name,
        shopId: activeStoreId,
        specs: specsStr,
        temperature: customSpecs.temperature,
        sweetness: customSpecs.sweetness,
        size: customSpecs.size
      });
      if (mcpPreview.success) {
        isRealMcp = true;
        mcpDraftId = mcpPreview.draftId;
        if (mcpPreview.payPrice) basePrice = mcpPreview.payPrice;
        if (mcpPreview.originalPrice) originalPrice = mcpPreview.originalPrice;
      } else {
        alert(`真实瑞幸 MCP 确认菜单预览失败: ${mcpPreview.error || '未知错误'}`);
        return;
      }
    } catch (e: any) {
      console.warn('Menu MCP preview error:', e);
      alert(`真实瑞幸 MCP 确认菜单预览异常: ${e.message || String(e)}`);
      return;
    }

    const newOrder: LuckinOrderData = {
      orderId,
      drinkId: customizingDrink.id,
      drinkName: customizingDrink.name,
      drinkImage: customizingDrink.image,
      price: basePrice,
      originalPrice,
      storeName: selectedStore,
      storeId: selectedStoreId,
      specs: specsStr,
      temperature: customSpecs.temperature,
      sweetness: customSpecs.sweetness,
      size: customSpecs.size,
      status: 'preview',
      isTreat: false,
      isRealMcpOrder: isRealMcp,
      mcpDraftId,
      orderTime: Date.now(),
      aiContactId: activeContact.id,
      aiContactName: activeContact.remark || activeContact.name,
      aiContactAvatar: activeContact.avatar
    };

    setCustomizingDrink(null);

    if (isDirectPay) {
      setCashierOrder({ ...newOrder, status: 'awaiting_payment' });
    } else {
      setCurrentAiOrder(newOrder);
      setActiveTab('ai_order');
      setAiSpeechText(`“已为你选择了【${newOrder.drinkName}】，确认后即可出单！”`);
    }
  };

  // Handle payment completion (real MCP submission)
  const handleCompletePayment = async (order: LuckinOrderData, paymentMethod: 'wechat' | 'alipay' = 'alipay') => {
    setIsPaying(true);

    let completedOrder = { ...order };

    if (order.isRealMcpOrder && order.mcpDraftId) {
      try {
        const submitRes = await submitRealMcpOrder({
          draftId: order.mcpDraftId,
          shopId: order.storeId || selectedStoreId,
          paymentMethod,
          orderData: order
        });

        if (submitRes.success) {
          completedOrder = {
            ...completedOrder,
            orderTime: Date.now(),
            mcpOrderId: submitRes.orderId,
            pickupCode: submitRes.pickupCode,
            paymentUrl: submitRes.payUrl || completedOrder.paymentUrl,
            status: submitRes.status === 'PAID' ? 'delivering' : 'awaiting_payment'
          };
          
          if (submitRes.payUrl) {
            // Open redirection modal with QR code & mobile deep link handling
            setPayRedirectionOrder(completedOrder);
          }
        } else {
          setIsPaying(false);
          alert(`真实瑞幸 MCP 提交订单失败: ${submitRes.error || '未知错误'}`);
          return;
        }
      } catch (e: any) {
        setIsPaying(false);
        alert(`真实瑞幸 MCP 提交订单异常: ${e.message || String(e)}`);
        return;
      }
    } else {
      setIsPaying(false);
      alert('订单无效：非真实 MCP 订单，已禁止模拟支付。请确保已连接 MCP 并重试。');
      return;
    }

    setTimeout(() => {
      setIsPaying(false);
      setCashierOrder(null);
      setPaySuccessModal(completedOrder);

      // Add to orders list
      setOrders(prev => [completedOrder, ...prev]);
      setCurrentAiOrder(null);

      // Update contact intimacy +3 & memory
      if (activeContact && onUpdateContact) {
        const curIntimacy = activeContact.intimacyScore || 50;
        onUpdateContact(activeContact.id, {
          intimacyScore: Math.min(100, curIntimacy + 3),
          lastLuckinOrderTime: Date.now()
        });
      }

      // Add memory fact
      if (activeContact && onUpdateContactMemory) {
        const fact = `在瑞幸咖啡为我点了【${completedOrder.drinkName}（${completedOrder.specs}）】${completedOrder.isRealMcpOrder ? '（瑞幸官方 MCP 真实出单）' : ''}，非常贴心。`;
        onUpdateContactMemory(activeContact.id, {
          contactId: activeContact.id,
          facts: [{ id: `mem_${Date.now()}`, content: fact, timestamp: Date.now() }]
        });
      }

      // Send in-character sync message to WeChat chat with pickup code
      if (activeContact && onSendMessage) {
        let speech = getInCharacterCoffeeMessage(activeContact, 'paid_confirm', completedOrder.drinkName, completedOrder.isTreat);
        if (completedOrder.pickupCode) {
          speech += ` 取餐码是【${completedOrder.pickupCode}】，门店：【${completedOrder.storeName}】☕`;
        }

        onSendMessage(activeContact.id, {
          sender: 'contact',
          type: completedOrder.isTreat ? 'luckin_treat' : 'luckin_payment',
          content: speech,
          luckinOrder: completedOrder,
          timestamp: Date.now()
        });
      }
    }, 1000);
  };

  // Handle refreshing real barista order status
  const handleRefreshOrderStatus = async (order: LuckinOrderData) => {
    if (!order.mcpOrderId && !order.orderId) return;
    setRefreshingOrderId(order.orderId);

    try {
      const res = await queryRealMcpOrderStatus(order.mcpOrderId || order.orderId);
      if (res.success && res.pickupCode) {
        setOrders(prev => prev.map(o => {
          if (o.orderId === order.orderId) {
            let nextStatus = o.status;
            if (res.status === 'READY' || res.status === 'COMPLETED') {
              nextStatus = 'completed';
            } else if (res.status === 'PAID' || res.status === 'WAIT_MAKE' || res.status === 'MAKING') {
              nextStatus = 'delivering';
            } else if (res.status === 'AWAITING_PAYMENT') {
              nextStatus = 'awaiting_payment';
            }

            return {
              ...o,
              pickupCode: res.pickupCode || o.pickupCode,
              status: nextStatus
            };
          }
          return o;
        }));
      }
    } catch (e) {
      console.warn('Failed to query order status:', e);
    } finally {
      setTimeout(() => setRefreshingOrderId(null), 600);
    }
  };

  // Determine active menu drinks: when MCP is enabled and server is connected, ONLY use realMenu (never fallback to LUCKIN_DRINKS)
  const isMcpActive = Boolean(mcpConfig.isEnabled && mcpConfig.isConnected);
  const activeMenuDrinks = isMcpActive ? realMenu : LUCKIN_DRINKS;

  // Filtered drinks for menu tab
  const filteredDrinks = useMemo(() => {
    return activeMenuDrinks.filter(d => {
      const matchesCat = selectedCategory === '全部' || d.category === selectedCategory;
      const matchesSearch = !menuSearch.trim() || d.name.includes(menuSearch.trim()) || d.description.includes(menuSearch.trim());
      return matchesCat && matchesSearch;
    });
  }, [activeMenuDrinks, selectedCategory, menuSearch]);

  // Categories list for the sidebar
  const categories = useMemo(() => {
    if (activeMenuDrinks.length === 0) return ['全部'];
    const cats = new Set(activeMenuDrinks.map(d => d.category));
    return ['全部', ...Array.from(cats)];
  }, [activeMenuDrinks]);

  return (
    <div className="h-full w-full bg-[#f4f6f9] flex flex-col justify-between overflow-hidden text-stone-800 select-none font-sans relative">
      {/* 1. TOP BRAND HEADER */}
      <div className="bg-gradient-to-r from-[#0b2d64] via-[#113876] to-[#1e4e8c] text-white px-3.5 pt-3 pb-2.5 shadow-md shrink-0 relative z-20 space-y-2">
        <div className="flex items-center justify-between">
          {/* Back & Brand logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={onReturnToDesktop}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors active:scale-95 cursor-pointer text-white"
              title="返回桌面"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                <Coffee className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="font-extrabold text-sm tracking-wide text-white drop-shadow-xs">
                luckin coffee
              </span>
            </div>
          </div>

          {/* MCP Status & Settings Button */}
          <button
            onClick={() => setShowMcpModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold transition-all active:scale-95 cursor-pointer shadow-xs ${
              mcpConfig.isEnabled && mcpConfig.token
                ? 'bg-emerald-500/25 border-emerald-300/40 text-emerald-200 hover:bg-emerald-500/35'
                : 'bg-amber-400/20 border-amber-300/30 text-amber-200 hover:bg-amber-400/30'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{mcpConfig.isEnabled && mcpConfig.token ? '⚡ 官方 MCP 真实下单' : '配置瑞幸 MCP'}</span>
            <Settings2 className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Store picker bar */}
        <div 
          onClick={() => setShowStorePicker(true)}
          className="flex items-center justify-between bg-black/20 hover:bg-black/30 border border-white/15 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-semibold text-white/95 text-[11px] truncate">{selectedStore}</span>
            <span className="text-[9.5px] text-blue-200 shrink-0">
              {mcpConfig.selectedShop?.distance ? `· 距您 ${mcpConfig.selectedShop.distance}` : '· 距您 320m'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
        </div>
      </div>

      {/* 2. MAIN APP CONTENT (Tab based) */}
      <div className="flex-1 overflow-y-auto relative">
        {/* ================= TAB 1: AI 帮我点 ================= */}
        {activeTab === 'ai_order' && (
          <div className="p-3 space-y-3 animate-in fade-in duration-200">
            {/* Contact Selector Banner */}
            <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  <span>选择帮我点单的 AI 联系人</span>
                </span>
                <span className="text-[10px] text-stone-400 font-medium">智能为你挑选最搭配的咖啡</span>
              </div>

              {/* Contacts Avatar Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {validContacts.map((c) => {
                  const isSelected = c.id === selectedContactId;
                  const intimacy = c.intimacyScore || 50;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-2 border-[#0b2d64] shadow-xs scale-105'
                          : 'bg-stone-50 border border-stone-200/80 hover:bg-stone-100 opacity-80'
                      }`}
                    >
                      <div className="relative">
                        <Avatar
                          src={c.avatar}
                          name={c.remark || c.name}
                          className="w-10 h-10 rounded-full border border-white shadow-xs"
                          size={18}
                        />
                        {intimacy >= 60 && (
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-extrabold px-1 rounded-full border border-white">
                            请客
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium max-w-[50px] truncate ${isSelected ? 'text-[#0b2d64] font-bold' : 'text-stone-600'}`}>
                        {c.remark || c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Contact Speech Bubble Card */}
            {activeContact && (
              <div className="bg-gradient-to-br from-[#0b2d64] to-[#1a427d] text-white rounded-2xl p-3.5 shadow-md relative overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={activeContact.avatar}
                      name={activeContact.remark || activeContact.name}
                      className="w-8 h-8 rounded-full border border-white/30"
                      size={14}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{activeContact.remark || activeContact.name}</span>
                        <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[9px] text-blue-100 font-medium">
                          好感度 {activeContact.intimacyScore || 50}
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-200">
                        {mcpConfig.isEnabled && mcpConfig.token ? '⚡ 瑞幸官方 MCP 真机模式' : '在线 · 随时为你贴心点单'}
                      </span>
                    </div>
                  </div>
                  {activeContact.intimacyScore && activeContact.intimacyScore >= 60 ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 font-bold flex items-center gap-0.5 shadow-xs">
                      <Gift className="w-2.5 h-2.5" />
                      已解锁专属请客
                    </span>
                  ) : null}
                </div>

                {/* AI Dialogue quote */}
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 text-[11.5px] text-blue-50 leading-relaxed border border-white/10">
                  {aiSpeechText}
                </div>
              </div>
            )}

            {/* Quick Demand Bubbles */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700">快捷告诉 TA 你的需求：</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '☀️ 困了，帮我挑杯提神的',
                  '🥥 帮我点杯生椰拿铁，少冰微糖',
                  '🍊 来杯橙C美式清爽一下',
                  '🍧 想喝杯抹茶瑞纳冰',
                  '☕ 大杯冰美式不加糖',
                  '🎁 今天辛苦了，请我喝杯咖啡嘛～'
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleRequestAiOrder(promptText)}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50/80 border border-stone-200 hover:border-blue-400 rounded-xl text-[10.5px] text-stone-700 hover:text-blue-900 transition-all active:scale-95 shadow-2xs font-medium cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Box */}
            <div className="bg-white rounded-2xl p-2.5 border border-stone-200/80 shadow-xs flex items-center gap-2">
              <input
                type="text"
                value={userDemandInput}
                onChange={(e) => setUserDemandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userDemandInput.trim()) {
                    handleRequestAiOrder(userDemandInput.trim());
                  }
                }}
                placeholder="输入口味需求（如：来杯少甜热拿铁）..."
                className="flex-1 bg-stone-50 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#0b2d64] focus:bg-white"
              />
              <button
                onClick={() => {
                  if (userDemandInput.trim()) handleRequestAiOrder(userDemandInput.trim());
                }}
                disabled={isGeneratingAiOrder || !userDemandInput.trim()}
                className="px-3.5 py-2 bg-[#0b2d64] hover:bg-[#1a427d] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {isGeneratingAiOrder ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>呼叫点单</span>
              </button>
            </div>

            {/* AI Generated Order Card Preview */}
            {currentAiOrder && (
              <div className="bg-white rounded-2xl border-2 border-blue-600/60 shadow-lg p-3.5 space-y-3 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#0b2d64] text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentAiOrder.isRealMcpOrder ? '⚡ 瑞幸 MCP 官方出单' : 'TA 为您精心挑选'}</span>
                </div>

                <div className="flex gap-3 items-start pt-1">
                  <img
                    src={currentAiOrder.drinkImage}
                    alt={currentAiOrder.drinkName}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="font-extrabold text-sm text-stone-900">{currentAiOrder.drinkName}</h4>
                    <p className="text-[11px] text-stone-500">{currentAiOrder.specs}</p>
                    <p className="text-[10px] text-stone-400 truncate">{currentAiOrder.storeName}</p>
                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="font-extrabold text-base text-[#0b2d64]">¥{currentAiOrder.price}</span>
                      {currentAiOrder.originalPrice && (
                        <span className="text-xs text-stone-400 line-through">¥{currentAiOrder.originalPrice}</span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                        立省 ¥{(currentAiOrder.originalPrice || currentAiOrder.price) - currentAiOrder.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => handleRequestAiOrder('换一杯别的口味推荐')}
                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    换一杯推荐
                  </button>
                  <button
                    onClick={() => setCashierOrder({ ...currentAiOrder, status: 'awaiting_payment' })}
                    className="flex-1 py-2 bg-[#0b2d64] hover:bg-[#1a427d] text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                    <span>去收银台 (¥{currentAiOrder.price})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: 经典菜单 ================= */}
        {activeTab === 'menu' && (
          <div className="flex flex-col h-full animate-in fade-in duration-200 bg-white">
            {/* Search Bar (Top Fixed) */}
            <div className="bg-white p-2 border-b border-stone-100 z-10 shrink-0 space-y-1.5">
              <div className="bg-stone-50 rounded-xl p-2 border border-stone-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-stone-400 ml-1 shrink-0" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="搜索生椰拿铁、美式、瑞纳冰..."
                  className="flex-1 text-xs bg-transparent focus:outline-none text-stone-800"
                />
                {menuSearch && (
                  <button onClick={() => setMenuSearch('')} className="p-1 text-stone-400 hover:text-stone-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Real vs Demo Menu Status Indicator */}
              <div className="flex items-center justify-between px-1 text-[10px]">
                {isLoadingMenu ? (
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>正在同步瑞幸官方实时商品...</span>
                  </div>
                ) : (isMcpActive && realMenu.length > 0) ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>已同步官方商品 ({realMenu.length} 款)</span>
                    <button
                      onClick={() => handleSyncRealMenu(selectedStoreId, true)}
                      disabled={isLoadingMenu}
                      className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 ml-1 cursor-pointer font-bold"
                      title="刷新商品"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isLoadingMenu ? 'animate-spin' : ''}`} />
                      <span>刷新</span>
                    </button>
                  </div>
                ) : isMcpActive ? (
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>已连接官方通道</span>
                    <button
                      onClick={() => handleSyncRealMenu(selectedStoreId, true)}
                      disabled={isLoadingMenu}
                      className="px-1.5 py-0.5 bg-[#0b2d64] text-white rounded text-[10px] hover:bg-[#113876] ml-1 cursor-pointer font-bold flex items-center gap-1 shadow-xs"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isLoadingMenu ? 'animate-spin' : ''}`} />
                      <span>同步商品</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>当前为本地演示菜单</span>
                  </div>
                )}
                <span className="text-stone-400 truncate max-w-[120px]">{selectedStore}</span>
              </div>
            </div>

            {/* Main Menu Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Column: Categories */}
              <div className="w-[85px] bg-[#f4f6f9] overflow-y-auto scrollbar-none flex flex-col shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative py-4 px-2 text-center text-xs transition-colors ${
                      selectedCategory === cat
                        ? 'bg-white font-extrabold text-stone-900'
                        : 'text-stone-500 font-medium hover:bg-stone-100'
                    }`}
                  >
                    {selectedCategory === cat && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#0b2d64] rounded-r-full" />
                    )}
                    {cat}
                  </button>
                ))}
              </div>

              {/* Right Column: Drink List */}
              <div className="flex-1 bg-white overflow-y-auto p-3 space-y-4">
                {isMcpActive && realMenu.length === 0 ? (
                  <div className="text-center py-12 px-4 text-stone-500 text-xs space-y-3">
                    {isLoadingMenu ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0b2d64] border-t-transparent rounded-full animate-spin" />
                        <p className="text-stone-800 font-bold">正在拉取瑞幸官方实时商品库...</p>
                        <p className="text-[11px] text-stone-400">正在获取拿铁、美式、果咖、茶饮等官方规格与实时售价</p>
                      </div>
                    ) : syncError ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-1">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <p className="text-stone-800 font-bold text-sm">商品同步失败</p>
                        <div className="bg-red-50 text-red-600 p-2 rounded text-[10px] w-full text-left break-words">
                          <p className="font-semibold mb-1">错误信息：</p>
                          <p>{syncError}</p>
                          {syncDiagnostics && (
                            <div className="mt-2 space-y-1 opacity-80 border-t border-red-200 pt-2">
                              <p>• 门店ID: {selectedStoreId}</p>
                              <p>• 是否真实门店: {syncDiagnostics.isRealShop ? '是' : '否 (演示门店)'}</p>
                              <p>• 检索关键词: {syncDiagnostics.searchedKeywords?.join(', ')}</p>
                              {syncDiagnostics.lastFallbackError && (
                                <p>• 诊断反馈: {syncDiagnostics.lastFallbackError}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSyncRealMenu(selectedStoreId, true)}
                          className="mt-2 px-5 py-2.5 bg-[#0b2d64] hover:bg-[#113876] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>重试同步商品</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0b2d64] flex items-center justify-center mb-1">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <p className="text-stone-800 font-bold text-sm">暂未拉取到当前门店商品</p>
                        <p className="text-[11px] text-stone-400 max-w-[200px] leading-relaxed">
                          点击下方按钮立即连接瑞幸官方 MCP 工具检索商品
                        </p>
                        {syncDiagnostics && !syncDiagnostics.isRealShop && (
                           <p className="text-red-500 text-[10px] bg-red-50 p-1.5 rounded">提示: 当前选择的是演示门店，可能无法查询真实商品。请在上方切换真实附近门店。</p>
                        )}
                        <button
                          onClick={() => handleSyncRealMenu(selectedStoreId, true)}
                          className="mt-2 px-5 py-2.5 bg-[#0b2d64] hover:bg-[#113876] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>一键同步官方商品</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : filteredDrinks.length === 0 ? (
                  <div className="text-center py-10 text-stone-400 text-xs">
                    没有找到该类目的饮品
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredDrinks.map((drink) => (
                      <div
                        key={drink.id}
                        className="flex items-start gap-3 group relative"
                      >
                        <img
                          src={drink.image}
                          alt={drink.name}
                          className="w-20 h-20 rounded-xl object-cover border border-stone-100 shrink-0 bg-stone-50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1 flex flex-col justify-between h-20">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-xs text-stone-900 truncate">{drink.name}</h4>
                              {drink.popularRank && drink.popularRank <= 3 && (
                                <span className="px-1 py-0.2 rounded-sm bg-[#0b2d64] text-white text-[8px] font-extrabold flex items-center shrink-0">
                                  TOP {drink.popularRank}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{drink.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-[15px] text-[#0b2d64]">¥{drink.price}</span>
                              <span className="text-[10px] text-stone-400 line-through">¥{drink.originalPrice}</span>
                            </div>
                            {/* Choose specs button (Icon only or small text for real layout) */}
                            <button
                              onClick={() => handleOpenSpecsModal(drink)}
                              className="w-6 h-6 bg-[#0b2d64] active:bg-[#1a427d] text-white rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm cursor-pointer"
                            >
                              <span className="text-lg leading-none font-light -mt-0.5">+</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: 订单 & 配送 ================= */}
        {activeTab === 'orders' && (
          <div className="p-3 space-y-3 animate-in fade-in duration-200">
            {/* Orders Sub-filter */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200/80 shadow-2xs">
              <button
                onClick={() => setOrdersFilter('all')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  ordersFilter === 'all' ? 'bg-[#0b2d64] text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                全部订单 ({safeOrders.length})
              </button>
              <button
                onClick={() => setOrdersFilter('delivering')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  ordersFilter === 'delivering' ? 'bg-[#0b2d64] text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                制作/待付 ({safeOrders.filter(o => o.status === 'paid' || o.status === 'delivering' || o.status === 'awaiting_payment').length})
              </button>
              <button
                onClick={() => setOrdersFilter('treats')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  ordersFilter === 'treats' ? 'bg-[#0b2d64] text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                AI 请客 ({safeOrders.filter(o => o.isTreat).length})
              </button>
            </div>

            {/* Orders List */}
            {safeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200/80 space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#0b2d64]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-xs text-stone-800">暂无咖啡订单记录</h4>
                <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                  快让你的 AI 联系人为你点一杯美味的瑞幸咖啡吧！
                </p>
                <button
                  onClick={() => setActiveTab('ai_order')}
                  className="px-4 py-1.5 bg-[#0b2d64] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  去呼叫 AI 点单
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {safeOrders
                  .filter(o => {
                    if (ordersFilter === 'delivering') return o.status === 'paid' || o.status === 'delivering' || o.status === 'awaiting_payment';
                    if (ordersFilter === 'treats') return o.isTreat;
                    return true;
                  })
                  .map((ord) => (
                    <div
                      key={ord.orderId}
                      className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#0b2d64]" />
                          <span className="font-bold text-xs text-stone-900 truncate max-w-[170px]">{ord.storeName}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.isRealMcpOrder
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ord.isTreat 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {ord.isRealMcpOrder ? '⚡ 瑞幸官方 MCP' : ord.isTreat ? '🎁 AI 请客免单' : '🛵 瑞幸专送'}
                        </span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <img
                          src={ord.drinkImage}
                          alt={ord.drinkName}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-stone-900">{ord.drinkName}</h4>
                          <p className="text-[10.5px] text-stone-500 truncate">{ord.specs}</p>
                          <p className="text-[9.5px] text-stone-400 mt-0.5">
                            由 <span className="font-semibold text-stone-700">{ord.aiContactName}</span> 帮点 · {new Date(ord.orderTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-[#0b2d64]">
                            {ord.isTreat ? '免单' : `¥${ord.price}`}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Pickup Code or Payment Button for real/paid orders */}
                      {ord.status === 'awaiting_payment' ? (
                        <div className="bg-amber-50 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between border border-amber-200/80 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-amber-800">订单已提交，待支付</span>
                            <span className="text-[9.5px] text-amber-700/80">超过15分钟未支付将自动取消</span>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            {ord.isRealMcpOrder && (
                              <button
                                onClick={() => handleRefreshOrderStatus(ord)}
                                disabled={refreshingOrderId === ord.orderId}
                                className="px-2 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-colors"
                              >
                                <RotateCcw className={`w-3 h-3 ${refreshingOrderId === ord.orderId ? 'animate-spin text-amber-600' : ''}`} />
                                <span>已支付?</span>
                              </button>
                            )}
                            {ord.paymentUrl && (
                              <button
                                onClick={() => setPayRedirectionOrder(ord)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer flex-1 sm:flex-none justify-center transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> 去官方支付
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        ord.pickupCode && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 rounded-xl p-2.5 flex items-center justify-between border border-blue-200/80">
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-[#0b2d64] text-white rounded-lg font-mono font-extrabold text-sm shadow-2xs">
                                {ord.pickupCode}
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-500 block">门店取餐码</span>
                                <span className="text-[11px] font-bold text-stone-800">凭码前往柜台或自提柜取餐</span>
                              </div>
                            </div>
  
                            {ord.isRealMcpOrder && (
                              <button
                                onClick={() => handleRefreshOrderStatus(ord)}
                                disabled={refreshingOrderId === ord.orderId}
                                className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                              >
                                <RotateCcw className={`w-3 h-3 ${refreshingOrderId === ord.orderId ? 'animate-spin text-[#0b2d64]' : ''}`} />
                                <span>刷新进度</span>
                              </button>
                            )}
                          </div>
                        )
                      )}

                      {/* Rider & delivery tracking */}
                      {ord.riderName && (
                        <div className="bg-blue-50/70 rounded-xl p-2 flex items-center justify-between text-[10.5px] border border-blue-100 text-blue-950">
                          <div className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-blue-700" />
                            <span>{ord.riderName}</span>
                          </div>
                          <span className="font-mono text-blue-800 font-semibold">正在飞速送达 🛵</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: 福利 & 特权 ================= */}
        {activeTab === 'privilege' && (
          <div className="p-3 space-y-3 animate-in fade-in duration-200">
            {/* Brand VIP Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-2xl p-3.5 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="font-extrabold text-xs tracking-wide">AI 联系人专属请客特权</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-[9.5px] font-bold border border-white/20">
                  好感度 $\ge$ 60 触发
                </span>
              </div>
              <p className="text-[11px] text-amber-100 leading-relaxed">
                当与 AI 联系人好感度达到 60 及以上，TA 将会在日常问候中主动发消息请你喝咖啡～
              </p>
            </div>

            {/* Contacts Privileges Status */}
            <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs space-y-2.5">
              <h4 className="font-bold text-xs text-stone-800">各联系人请客状态看板</h4>
              <div className="space-y-2">
                {validContacts.map((c) => {
                  const intimacy = c.intimacyScore || 50;
                  const canTreat = intimacy >= 60;
                  return (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={c.avatar}
                          name={c.remark || c.name}
                          className="w-9 h-9 rounded-full border border-stone-200"
                          size={14}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-900 truncate">{c.remark || c.name}</span>
                            <span className="text-[9.5px] text-stone-400 font-medium">好感度 {intimacy}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 block truncate">
                            {canTreat ? '已激活请客特权 (随时可能主动请客)' : '好感度未满 60，多聊天可解锁'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        canTreat ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {canTreat ? '已就绪' : '升级中'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Coffee Flavor Preferences */}
            <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-stone-800">我的默认偏好设置</h4>
                <span className="text-[9.5px] text-stone-400">AI 点单时自动参考</span>
              </div>
              <input
                type="text"
                value={settings.luckinDefaultFlavor || ''}
                onChange={(e) => onUpdateSettings({ luckinDefaultFlavor: e.target.value })}
                placeholder="例如: 生椰拿铁 标准冰 不加糖"
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b2d64] focus:bg-white"
              />
              <div className="flex flex-wrap gap-1">
                {['生椰拿铁 标准冰 不加糖', '大杯冰美式 不加糖', '橙C美式 标准冰', '丝绒拿铁 温热 半糖'].map((pre) => (
                  <button
                    key={pre}
                    onClick={() => onUpdateSettings({ luckinDefaultFlavor: pre })}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] text-stone-700 cursor-pointer"
                  >
                    {pre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM TAB BAR */}
      <div className="bg-white border-t border-stone-200/80 px-2 py-1.5 flex items-center justify-around shrink-0 z-20 shadow-md">
        <button
          onClick={() => setActiveTab('ai_order')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-3 rounded-xl transition-all ${
            activeTab === 'ai_order' ? 'text-[#0b2d64] font-bold scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">AI 帮我点</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-3 rounded-xl transition-all ${
            activeTab === 'menu' ? 'text-[#0b2d64] font-bold scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[10px]">经典菜单</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'orders' ? 'text-[#0b2d64] font-bold scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px]">订单动态</span>
          {safeOrders.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-blue-600"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('privilege')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-3 rounded-xl transition-all ${
            activeTab === 'privilege' ? 'text-[#0b2d64] font-bold scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="text-[10px]">好感特权</span>
        </button>
      </div>

      {/* 4. SPECS CUSTOMIZATION MODAL */}
      {customizingDrink && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-3.5 bg-gradient-to-r from-[#0b2d64] to-[#1a427d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={customizingDrink.image}
                  alt={customizingDrink.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-extrabold text-xs">{customizingDrink.name}</h3>
                  <p className="text-[10px] text-blue-200">¥{customizingDrink.price + (customSpecs.size === '超大杯' ? 3 : 0)}</p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingDrink(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Specs Options */}
            <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Size */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700">杯型规格</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['大杯', '超大杯'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setCustomSpecs(prev => ({ ...prev, size: sz }))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        customSpecs.size === sz
                          ? 'bg-blue-50 border-[#0b2d64] text-[#0b2d64] font-bold shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {sz} {sz === '超大杯' ? '(+¥3)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700">温度</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['冰', '温', '热'] as const).map((temp) => (
                    <button
                      key={temp}
                      onClick={() => setCustomSpecs(prev => ({ ...prev, temperature: temp }))}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        customSpecs.temperature === temp
                          ? 'bg-blue-50 border-[#0b2d64] text-[#0b2d64] font-bold shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {temp === '冰' ? '标准冰' : temp === '热' ? '标准热' : '温饮'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700">糖度</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['不加糖', '微糖', '半糖', '标准糖'] as const).map((sw) => (
                    <button
                      key={sw}
                      onClick={() => setCustomSpecs(prev => ({ ...prev, sweetness: sw }))}
                      className={`py-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                        customSpecs.sweetness === sw
                          ? 'bg-blue-50 border-[#0b2d64] text-[#0b2d64] font-bold shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2">
              <button
                onClick={() => handleConfirmMenuSpecs(false)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                请 TA 帮我点
              </button>
              <button
                onClick={() => handleConfirmMenuSpecs(true)}
                className="flex-1 py-2.5 bg-[#0b2d64] hover:bg-[#1a427d] text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
              >
                去收银台支付
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STORE PICKER MODAL (地址与门店下拉选择) */}
      {showStorePicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-xl flex flex-col max-h-[85vh] overflow-hidden space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#0b2d64]" />
                <h3 className="font-bold text-sm text-stone-900">选择瑞幸下单门店</h3>
              </div>
              <button 
                onClick={() => setShowStorePicker(false)} 
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {realShops.length > 0 && realShops.every(s => !isRealLuckinShopId(s.shopId)) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
                <div className="text-[10px] text-red-600 space-y-0.5 leading-tight">
                  <p className="font-bold text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> 未定位到真实门店</p>
                  <p>当前列表均为演示门店，无法同步真实商品数据。请检查配置或定位。</p>
                </div>
                <button
                  onClick={() => setShowMcpModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  立即诊断
                </button>
              </div>
            )}

            {/* Current Region Info & Quick Switcher */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#0b2d64] shrink-0" />
                <span className="text-stone-500 shrink-0">当前地区:</span>
                <span className="font-bold text-stone-800 truncate">
                  {mcpConfig.selectedRegion?.province || '北京市'} · {mcpConfig.selectedRegion?.city || '北京市'} · {mcpConfig.selectedRegion?.district || '朝阳区'}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowStorePicker(false);
                  setShowMcpModal(true);
                }}
                className="px-2 py-1 rounded-lg bg-blue-100/80 hover:bg-blue-200/80 text-[#0b2d64] text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
              >
                切换地区
              </button>
            </div>

            {/* Shop List: strictly non-empty, clearly showing each shop name & address */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {realShops.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs space-y-2">
                  <Store className="w-8 h-8 mx-auto opacity-30 text-[#0b2d64]" />
                  <p>暂无可用门店，请点击上方“切换地区”选择或配置 MCP</p>
                </div>
              ) : (
                realShops.map((st) => {
                  const isSelected = selectedStoreId === st.shopId || selectedStore === st.shopName;
                  return (
                    <div
                      key={st.shopId}
                      onClick={() => {
                        setSelectedStore(st.shopName);
                        setSelectedStoreId(st.shopId);
                        saveStoredMcpConfig({ selectedShop: st });
                        onUpdateSettings({ luckinStoreName: st.shopName });
                        setShowStorePicker(false);
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 border ${
                        isSelected
                          ? 'bg-blue-50/90 border-[#0b2d64] text-stone-900 shadow-sm ring-1 ring-[#0b2d64]/20'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200/80 text-stone-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-stone-900 leading-tight">
                            {st.shopName}
                          </span>
                          {st.distance && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100/80 text-[#0b2d64] font-bold text-[9px] shrink-0">
                              {st.distance}
                            </span>
                          )}
                          {st.businessStatus && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 font-bold text-[9px] shrink-0">
                              {st.businessStatus}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-stone-600 leading-snug break-words">
                          <span className="text-stone-400 mr-1">📍 门店地址:</span>
                          {st.address}
                        </p>

                        {st.businessHours && (
                          <p className="text-[10px] text-stone-400">
                            🕒 营业时间: {st.businessHours}
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

            {/* Bottom button */}
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  setShowStorePicker(false);
                  setShowMcpModal(true);
                }}
                className="w-full py-2.5 bg-[#0b2d64] hover:bg-[#1a427d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>配置更多省市区 / 官方 MCP 连接</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REAL CASHIER MODAL (收银台) */}
      {cashierOrder && (
        <LuckinRealCashierModal
          order={cashierOrder}
          isOpen={Boolean(cashierOrder)}
          onClose={() => setCashierOrder(null)}
          onConfirmPayment={(ord, pMethod) => handleCompletePayment(ord, pMethod)}
          isPaying={isPaying}
        />
      )}

      {/* 7. PAYMENT SUCCESS MODAL */}
      {paySuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${paySuccessModal.status === 'awaiting_payment' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              {paySuccessModal.status === 'awaiting_payment' 
                ? '出单申请已提交，请完成支付！'
                : (paySuccessModal.isRealMcpOrder ? '🎉 瑞幸官方真实出单成功！' : '支付成功！')}
            </h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              {paySuccessModal.status === 'awaiting_payment' 
                ? '已尝试为您打开瑞幸官方支付页面。请在新标签页中完成支付。'
                : (paySuccessModal.isRealMcpOrder
                  ? '已成功接入瑞幸 MCP 门店工单系统，正在新鲜现磨制作中。'
                  : '商家已接单，咖啡正在新鲜现磨制作中。')}
            </p>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">商品</span>
                <span className="font-bold text-stone-800">{paySuccessModal.drinkName}</span>
              </div>
              {paySuccessModal.pickupCode && paySuccessModal.status !== 'awaiting_payment' && (
                <div className="flex justify-between items-center bg-blue-50/80 p-1.5 rounded-xl border border-blue-100">
                  <span className="text-stone-600 font-medium">取餐码</span>
                  <span className="font-mono font-extrabold text-sm text-[#0b2d64]">
                    {paySuccessModal.pickupCode}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">门店</span>
                <span className="font-medium text-stone-800 truncate max-w-[150px]">{paySuccessModal.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">好感度提升</span>
                <span className="font-extrabold text-red-500">+3 亲密度</span>
              </div>
            </div>

            <div className="space-y-2">
              {paySuccessModal.status === 'awaiting_payment' && paySuccessModal.paymentUrl && (
                <button
                  onClick={() => setPayRedirectionOrder(paySuccessModal)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 扫码 / 唤醒官方支付
                </button>
              )}
              <button
                onClick={() => {
                  setPaySuccessModal(null);
                  setActiveTab('orders');
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
                  paySuccessModal.status === 'awaiting_payment'
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' 
                    : 'bg-[#0b2d64] hover:bg-[#1a427d] text-white'
                }`}
              >
                {paySuccessModal.status === 'awaiting_payment' ? '稍后查看订单' : '查看制作与配送进度'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. LUCKIN MCP REAL ORDER SETTINGS MODAL */}
      <LuckinMcpSettingsModal
        isOpen={showMcpModal}
        onClose={() => setShowMcpModal(false)}
        onConfigSaved={(updated) => {
          setMcpConfig(updated);
          if (Array.isArray(updated.cachedShops) && updated.cachedShops.length > 0) {
            setRealShops(updated.cachedShops);
          }
          if (updated.selectedShop) {
            setSelectedStore(updated.selectedShop.shopName);
            setSelectedStoreId(updated.selectedShop.shopId);
          }
        }}
        currentStoreName={selectedStore}
        onSelectStore={(stName, sId) => {
          setSelectedStore(stName);
          setSelectedStoreId(sId);
          onUpdateSettings({ luckinStoreName: stName });
        }}
      />

      {/* 9. LUCKIN PAY REDIRECTION / QR CODE MODAL */}
      {payRedirectionOrder && (
        <LuckinPayRedirectionModal
          order={payRedirectionOrder}
          isOpen={Boolean(payRedirectionOrder)}
          onClose={() => setPayRedirectionOrder(null)}
          onRefreshStatus={() => handleRefreshOrderStatus(payRedirectionOrder)}
          onOpenSettings={() => {
            setPayRedirectionOrder(null);
            setShowMcpModal(true);
          }}
          isRefreshing={refreshingOrderId === payRedirectionOrder.orderId}
        />
      )}
    </div>
  );
};
