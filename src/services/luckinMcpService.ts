import { LuckinDrink, LuckinMcpConfig, LuckinOrderData, LuckinShopItem } from '../types/luckin';
import { Contact } from '../types/phone';
import { getRegionDetails } from '../data/luckinRegionData';

export const DEFAULT_LUCKIN_MCP_ENDPOINT = 'https://gwmcp.lkcoffee.com/order/user/mcp';
const STORAGE_KEY = 'luckin_mcp_config_v1';

/**
 * 判断是否为瑞幸真实线上门店 ID（而非本地演示数据的 100101 等）
 */
export function isRealLuckinShopId(id?: string | number): boolean {
  if (!id) return false;
  const num = Number(id);
  return !isNaN(num) && num > 0 && !(num >= 100100 && num <= 100999);
}

/**
 * 将瑞幸官方 MCP 返回的商品映射为标准 LuckinDrink 格式
 */
export function mapMcpProductToDrink(item: any, idx: number): LuckinDrink {
  const productName = item.productName || item.name || '瑞幸特调';

  let validCategory: LuckinDrink['category'] = '经典';
  if (item.category && ['拿铁', '美式', '瑞纳冰', '果咖', '茶饮', '经典'].includes(item.category)) {
    validCategory = item.category;
  } else if (productName.includes('拿铁')) {
    validCategory = '拿铁';
  } else if (
    productName.includes('美式') &&
    (productName.includes('果') || productName.includes('橙') || productName.includes('苹') || productName.includes('菌') || productName.includes('柚'))
  ) {
    validCategory = '果咖';
  } else if (productName.includes('美式')) {
    validCategory = '美式';
  } else if (productName.includes('瑞纳冰') || productName.includes('冰沙') || productName.includes('冷萃')) {
    validCategory = '瑞纳冰';
  } else if (productName.includes('果') || productName.includes('橙') || productName.includes('柠') || productName.includes('柚')) {
    validCategory = '果咖';
  } else if (productName.includes('茶') || productName.includes('茉莉') || productName.includes('乌龙')) {
    validCategory = '茶饮';
  }

  const desc = item.description || (Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.join(' · ') : '') || '瑞幸精选品质咖啡';
  const price = Number(item.estimatePrice || item.price || item.currentPrice || item.salePrice || 10.9);
  const originalPrice = Number(item.initialPrice || item.originalPrice || item.standPrice || 20.0);
  const image = item.pictureUrl || item.image || item.pic || item.picture || item.imageUrl || 'https://img04.luckincoffeecdn.com/group5/M00/B2/CF/Ct1qP2hrsF-AEzVYAAGXq_WH8UM393.png';

  // 提取默认规格
  let temp: '冰' | '热' | '温' = '冰';
  let sweetness: '不加糖' | '微糖' | '半糖' | '标准糖' = '不加糖';
  let size: '大杯' | '超大杯' = '大杯';

  if (Array.isArray(item.productAttrs)) {
    for (const attr of item.productAttrs) {
      if (attr.attributeName === '温度' && Array.isArray(attr.productSubAttrs)) {
        const sel = attr.productSubAttrs.find((s: any) => s.selected) || attr.productSubAttrs[0];
        if (sel?.attributeName === '热') temp = '热';
        else if (sel?.attributeName === '温') temp = '温';
      }
      if ((attr.attributeName === '糖度' || attr.attributeName === '糖') && Array.isArray(attr.productSubAttrs)) {
        const sel = attr.productSubAttrs.find((s: any) => s.selected) || attr.productSubAttrs[0];
        if (sel?.attributeName?.includes('不另外加糖') || sel?.attributeName?.includes('无糖')) sweetness = '不加糖';
        else if (sel?.attributeName?.includes('微')) sweetness = '微糖';
        else if (sel?.attributeName?.includes('半') || sel?.attributeName?.includes('少')) sweetness = '半糖';
        else if (sel?.attributeName?.includes('标') || sel?.attributeName?.includes('全')) sweetness = '标准糖';
      }
      if (attr.attributeName === '杯型' && Array.isArray(attr.productSubAttrs)) {
        const sel = attr.productSubAttrs.find((s: any) => s.selected) || attr.productSubAttrs[0];
        if (sel?.attributeName?.includes('超大') || sel?.attributeName?.includes('特大')) size = '超大杯';
      }
    }
  }

  return {
    id: String(item.productId || item.id || `real_${idx}`),
    name: productName,
    category: validCategory,
    price,
    originalPrice,
    image,
    description: desc,
    popularRank: item.popularRank || item.rank || (idx < 5 ? idx + 1 : undefined),
    defaultSpecs: {
      temperature: temp,
      sweetness,
      size,
      milkOption: item.milkOption
    }
  };
}

/**
 * 获取本地存储的瑞幸 MCP 配置
 */
export function getStoredMcpConfig(): LuckinMcpConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        endpoint: parsed.endpoint || DEFAULT_LUCKIN_MCP_ENDPOINT,
        token: parsed.token || '',
        isEnabled: parsed.isEnabled ?? Boolean(parsed.token),
        isConnected: parsed.isConnected ?? false,
        userNickname: parsed.userNickname || '',
        selectedShop: parsed.selectedShop,
        cachedShops: Array.isArray(parsed.cachedShops) ? parsed.cachedShops : [],
        selectedRegion: parsed.selectedRegion,
        userLatitude: parsed.userLatitude,
        userLongitude: parsed.userLongitude,
        lastTestedAt: parsed.lastTestedAt
      };
    }
  } catch (e) {
    console.error('Failed to load Luckin MCP config from storage:', e);
  }

  return {
    endpoint: DEFAULT_LUCKIN_MCP_ENDPOINT,
    token: '',
    isEnabled: false,
    isConnected: false,
    cachedShops: []
  };
}

/**
 * 保存瑞幸 MCP 配置到本地存储
 */
export function saveStoredMcpConfig(config: Partial<LuckinMcpConfig>): LuckinMcpConfig {
  const current = getStoredMcpConfig();
  const updated: LuckinMcpConfig = {
    ...current,
    ...config
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save Luckin MCP config:', e);
  }
  return updated;
}

/**
 * 调用后端 Luckin MCP 代理接口
 */
export async function invokeLuckinMcpTool(
  toolName: string,
  args: Record<string, any> = {},
  overrideConfig?: { token?: string; endpoint?: string }
): Promise<{ success: boolean; data?: any; error?: string; raw?: any }> {
  const config = getStoredMcpConfig();
  const token = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;
  const endpoint = overrideConfig?.endpoint || config.endpoint || DEFAULT_LUCKIN_MCP_ENDPOINT;

  try {
    const res = await fetch('/api/luckin/mcp/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolName,
        arguments: args,
        token: token ? token.trim() : '',
        endpoint: endpoint.trim()
      })
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}: 请求 MCP 失败`,
        raw: json
      };
    }

    return {
      success: true,
      data: json.data || json.result || json,
      raw: json
    };
  } catch (err: any) {
    console.error('[invokeLuckinMcpTool Error]', err);
    return {
      success: false,
      error: err.message || '网络请求失败，请检查网络连接',
    };
  }
}

/**
 * 测试与瑞幸官方 MCP 的连通性
 */
export async function testMcpConnection(
  token: string,
  endpoint: string = DEFAULT_LUCKIN_MCP_ENDPOINT
): Promise<{ isConnected: boolean; message: string; shopList?: LuckinShopItem[]; user?: any }> {
  try {
    if (!token || !token.trim()) {
      return {
        isConnected: false,
        message: '请填写 Luckin MCP Bearer Token（可在 open.lkcoffee.com/mcp 登录获取）'
      };
    }

    const testRes = await invokeLuckinMcpTool('queryShopList', {
      latitude: 39.9042,
      longitude: 116.4074
    }, { token, endpoint });

    if (testRes.success) {
      const shops = parseMcpShopList(testRes.data);
      return {
        isConnected: true,
        message: '已成功连通瑞幸官方 MCP 服务！',
        shopList: shops,
        user: testRes.data?.user
      };
    }

    return {
      isConnected: false,
      message: testRes.error || '连接瑞幸 MCP 服务失败，请检查 Token 与网络'
    };
  } catch (err: any) {
    console.error('[testMcpConnection Error]', err);
    return {
      isConnected: false,
      message: `连通性测试异常: ${err?.message || String(err)}`
    };
  }
}

/**
 * 获取官方支持的所有 MCP 工具列表
 */
export async function listMcpTools(): Promise<{ success: boolean; tools?: any[]; error?: string }> {
  try {
    const res = await fetch('/api/luckin/mcp/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'tools/list' })
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { success: false, error: json.error || `HTTP ${res.status}: 获取工具列表失败` };
    }
    return { success: true, tools: json.data?.tools || [] };
  } catch (err: any) {
    console.error('[listMcpTools Error]', err);
    return { success: false, error: err.message || '网络异常' };
  }
}

/**
 * 获取真实商品菜单（通过 searchProductForMcp 搜索当前门店商品）
 */
export async function fetchRealMenu(
  shopId?: string,
  options?: { customQuery?: string; forceRefresh?: boolean }
): Promise<{
  success: boolean;
  drinks?: any[];
  mappedDrinks?: LuckinDrink[];
  shopId?: string;
  error?: string;
  diagnostics?: { isRealShop: boolean; searchedKeywords: string[]; lastFallbackError?: string };
}> {
  try {
    let deptId = Number(shopId);

    // If shopId is missing or is mock ID (like 100101), attempt to resolve to nearest real shop
    if (!isRealLuckinShopId(shopId)) {
      const config = getStoredMcpConfig();
      const cachedRealShop = config.cachedShops?.find(s => isRealLuckinShopId(s.shopId));
      if (cachedRealShop) {
        deptId = Number(cachedRealShop.shopId);
      } else {
        const liveShops = await queryRealNearbyShops({
          latitude: config.userLatitude,
          longitude: config.userLongitude
        });
        const firstReal = liveShops.find(s => isRealLuckinShopId(s.shopId));
        if (firstReal) {
          deptId = Number(firstReal.shopId);
        }
      }
    }

    const isRealShop = isRealLuckinShopId(String(deptId));

    if (isNaN(deptId) || deptId <= 0) {
      return { 
        success: false, 
        error: '未找到有效的瑞幸门店，请先选择或切换附近门店',
        diagnostics: { isRealShop: false, searchedKeywords: [] }
      };
    }

    // Check local cache if not forcing refresh and no custom query
    const cacheKey = `luckin_real_menu_${deptId}`;
    if (!options?.forceRefresh && !options?.customQuery) {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          // 15 minutes TTL
          if (cached && Array.isArray(cached.mappedDrinks) && cached.mappedDrinks.length > 0 && Date.now() - (cached.timestamp || 0) < 15 * 60 * 1000) {
            return {
              success: true,
              drinks: cached.drinks || [],
              mappedDrinks: cached.mappedDrinks,
              shopId: String(deptId),
              diagnostics: { isRealShop, searchedKeywords: [] }
            };
          }
        }
      } catch {}
    }

    // Prepare search queries: if custom query provided, search that; otherwise search comprehensive product categories
    const queries = options?.customQuery ? [options.customQuery.trim()] : ["拿铁", "美式", "果咖", "茶", "新品"];

    const rawMap = new Map<number | string, any>();
    let lastFallbackError = '';

    const searchPromises = queries.map(async (kw) => {
      try {
        const res = await invokeLuckinMcpTool('searchProductForMcp', { deptId, query: kw });
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
          console.log(`[searchProductForMcp] Keyword "${kw}" hit count: ${items.length}`);
          for (const item of items) {
            const key = item.productId || item.skuCode || item.productName;
            if (key && !rawMap.has(key)) {
              rawMap.set(key, item);
            }
          }
        } else if (res.error) {
          lastFallbackError = res.error;
          console.warn(`[searchProductForMcp] Failed keyword "${kw}": ${res.error}`);
        }
      } catch (err: any) {
        lastFallbackError = err?.message || String(err);
        console.warn(`[searchProductForMcp] Failed keyword "${kw}":`, err);
      }
    });

    await Promise.allSettled(searchPromises);

    const allItems = Array.from(rawMap.values());

    if (allItems.length > 0) {
      const mappedDrinks = allItems.map(mapMcpProductToDrink);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          drinks: allItems,
          mappedDrinks
        }));
      } catch {}

      return {
        success: true,
        drinks: allItems,
        mappedDrinks,
        shopId: String(deptId),
        diagnostics: { isRealShop, searchedKeywords: queries, lastFallbackError }
      };
    }

    // If multi-query returned empty, try generic query
    const fallbackRes = await invokeLuckinMcpTool('searchProductForMcp', { deptId, query: '咖啡' });
    if (fallbackRes.success && fallbackRes.data) {
      const items = Array.isArray(fallbackRes.data) ? fallbackRes.data : (Array.isArray(fallbackRes.data.data) ? fallbackRes.data.data : []);
      if (items.length > 0) {
        const mappedDrinks = items.map(mapMcpProductToDrink);
        return {
          success: true,
          drinks: items,
          mappedDrinks,
          shopId: String(deptId),
          diagnostics: { isRealShop, searchedKeywords: [...queries, '咖啡'], lastFallbackError }
        };
      }
    } else if (fallbackRes.error) {
      lastFallbackError = fallbackRes.error;
    }

    return {
      success: false,
      shopId: String(deptId),
      error: fallbackRes.error || '当前门店暂无可售商品，请尝试重新选择其他门店',
      diagnostics: { isRealShop, searchedKeywords: queries, lastFallbackError }
    };
  } catch (err: any) {
    console.error('[fetchRealMenu Error]', err);
    return { 
      success: false, 
      error: `获取门店菜单异常: ${err?.message || String(err)}`,
      diagnostics: { isRealShop: false, searchedKeywords: [], lastFallbackError: err?.message }
    };
  }
}

/**
 * 解析 MCP 返回的门店列表
 */
export function parseMcpShopList(rawData: any): LuckinShopItem[] {
  if (!rawData) return [];
  
  let list: any[] = [];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (Array.isArray(rawData.shops)) {
    list = rawData.shops;
  } else if (Array.isArray(rawData.shopList)) {
    list = rawData.shopList;
  } else if (Array.isArray(rawData.data)) {
    list = rawData.data;
  } else if (rawData.data && typeof rawData.data === 'object') {
    if (Array.isArray(rawData.data.shops)) list = rawData.data.shops;
    else if (Array.isArray(rawData.data.shopList)) list = rawData.data.shopList;
    else if (Array.isArray(rawData.data.list)) list = rawData.data.list;
    else if (Array.isArray(rawData.data.data)) list = rawData.data.data;
  } else if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      return parseMcpShopList(parsed);
    } catch {
      return [];
    }
  }

  return list.map((item: any) => {
    const rawDist = item.distance ?? item.dist ?? item.distanceMeter;
    let distStr: string | undefined = undefined;
    if (typeof rawDist === 'number') {
      if (rawDist < 1) {
        distStr = `${Math.round(rawDist * 1000)}m`;
      } else if (rawDist <= 50) {
        distStr = `${rawDist.toFixed(1)}km`;
      } else {
        distStr = `${Math.round(rawDist)}m`;
      }
    } else if (typeof rawDist === 'string') {
      distStr = rawDist;
    }

    const deptName = item.deptName || item.shopName || item.name || item.storeName || '瑞幸咖啡门店';
    const cleanDeptName = String(deptName).trim();
    const fullShopName = cleanDeptName.startsWith('瑞幸') ? cleanDeptName : `瑞幸咖啡 (${cleanDeptName})`;

    let hours = item.businessHours || item.hours;
    if (!hours && item.workTimeStart && item.workTimeEnd) {
      hours = `${item.workTimeStart} - ${item.workTimeEnd}`;
    }

    return {
      shopId: String(item.deptId || item.shopId || item.id || item.storeId),
      shopName: fullShopName,
      address: item.address || item.shopAddress || item.location || '地址详见店内',
      distance: distStr,
      businessStatus: item.workStatus || item.businessStatus || item.status || '营业中',
      businessHours: hours || '07:30 - 21:30',
      latitude: typeof item.latitude === 'number' ? item.latitude : (typeof item.lat === 'number' ? item.lat : undefined),
      longitude: typeof item.longitude === 'number' ? item.longitude : (typeof item.lng === 'number' ? item.lng : undefined)
    };
  }).filter(shop => shop.shopId && shop.shopId !== 'undefined' && shop.shopId !== 'null');
}

/**
 * 查询真实附近门店 (支持 GPS 定位与地区经纬度)
 */
export async function queryRealNearbyShops(params: {
  latitude?: number;
  longitude?: number;
  keyword?: string;
}): Promise<LuckinShopItem[] & { source?: 'live' | 'cache' | 'fallback-demo' }> {
  const config = getStoredMcpConfig();
  const lat = typeof params.latitude === 'number' && !isNaN(params.latitude)
    ? params.latitude
    : (config.userLatitude ?? 39.9042);
  const lng = typeof params.longitude === 'number' && !isNaN(params.longitude)
    ? params.longitude
    : (config.userLongitude ?? 116.4074);

  try {
    const queryArgs: Record<string, any> = {
      latitude: lat,
      longitude: lng
    };
    if (params.keyword && params.keyword.trim() && !params.keyword.includes('瑞幸')) {
      queryArgs.deptName = params.keyword.trim();
    }

    const res = await invokeLuckinMcpTool('queryShopList', queryArgs);

    if (res.success && res.data) {
      const shops = parseMcpShopList(res.data);
      if (shops.length > 0) {
        saveStoredMcpConfig({ cachedShops: shops, userLatitude: lat, userLongitude: lng });
        return Object.assign(shops, { source: 'live' as const });
      }
    }

    // If live query returned empty or failed, gracefully fallback to region or cached stores
    if (Array.isArray(config.cachedShops) && config.cachedShops.length > 0) {
      return Object.assign(config.cachedShops, { source: 'cache' as const });
    }

    const fallbackRegion = getRegionDetails(
      config.selectedRegion?.province || '北京市',
      config.selectedRegion?.city || '北京市',
      config.selectedRegion?.district || '朝阳区'
    );
    return Object.assign(fallbackRegion.shops, { source: 'fallback-demo' as const });
  } catch (err: any) {
    console.warn('[queryRealNearbyShops Notice] Live query skipped, using region fallback:', err?.message || String(err));
    if (Array.isArray(config.cachedShops) && config.cachedShops.length > 0) {
      return Object.assign(config.cachedShops, { source: 'cache' as const });
    }
    const fallbackRegion = getRegionDetails(
      config.selectedRegion?.province || '北京市',
      config.selectedRegion?.city || '北京市',
      config.selectedRegion?.district || '朝阳区'
    );
    return Object.assign(fallbackRegion.shops, { source: 'fallback-demo' as const });
  }
}

/**
 * 真实 MCP 下单流程：创建订单预览并获取优惠计算
 */
export async function previewRealMcpOrder(params: {
  drinkName: string;
  shopId?: string;
  specs?: string;
  temperature?: string;
  sweetness?: string;
  size?: string;
  quantity?: number;
}): Promise<{
  success: boolean;
  draftId?: string;
  payPrice?: number;
  originalPrice?: number;
  discountPrice?: number;
  shopName?: string;
  shopAddress?: string;
  specsText?: string;
  error?: string;
  rawData?: any;
  productId?: number;
  skuCode?: string;
  couponCodeList?: string[];
}> {
  try {
    let deptId = Number(params.shopId);
    if (!isRealLuckinShopId(params.shopId)) {
      const config = getStoredMcpConfig();
      const realShop = config.cachedShops?.find(s => isRealLuckinShopId(s.shopId));
      if (realShop) {
        deptId = Number(realShop.shopId);
      }
    }
    if (isNaN(deptId) || deptId <= 0) {
      return { success: false, error: `请先选择有效的取餐门店` };
    }

    // Clean product search name to increase match accuracy with Luckin MCP product list
    const cleanDrinkName = params.drinkName
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/(大杯|超大杯|标准杯)/g, '')
      .replace(/(标准冰|少冰|微冰|去冰|温饮|标准热|温|热|冰)/g, '')
      .replace(/(不加糖|无糖|微糖|半糖|少少甜|少甜|标准糖|半糖)/g, '')
      .trim();

    // 1. Search for product to get productId and skuCode
    let searchRes = await invokeLuckinMcpTool('searchProductForMcp', {
      deptId,
      query: cleanDrinkName || params.drinkName
    });

    if (!searchRes.success || !searchRes.data) {
      // Fallback search with original name or general coffee query
      searchRes = await invokeLuckinMcpTool('searchProductForMcp', {
        deptId,
        query: params.drinkName
      });
    }

    if (!searchRes.success) {
      return { success: false, error: `搜索商品失败(searchProductForMcp): ${searchRes.error}` };
    }

    // Fallback checking multiple possible response shapes from MCP
    let item: any = null;
    const list = Array.isArray(searchRes.data) 
      ? searchRes.data 
      : (searchRes.data?.products || searchRes.data?.items || searchRes.data?.productList || searchRes.data?.list || searchRes.data?.data);
    
    if (Array.isArray(list) && list.length > 0) {
      item = list.find((p: any) => {
        const pName = p.productName || p.name || '';
        return pName.includes(cleanDrinkName) || cleanDrinkName.includes(pName);
      }) || list[0];
    } else {
      item = searchRes.data?.product || searchRes.data;
    }

    const productId = item?.productId || item?.id || item?.spuId;
    let skuCode = item?.skuCode || item?.code || item?.defaultSkuCode;

    // If item has skuList, choose matching sku based on size/temperature or first available
    if (Array.isArray(item?.skuList) && item.skuList.length > 0) {
      const matchedSku = item.skuList.find((s: any) => {
        const sName = s.skuName || s.name || s.specs || '';
        return (params.size && sName.includes(params.size)) || (params.temperature && sName.includes(params.temperature));
      });
      skuCode = matchedSku?.skuCode || matchedSku?.code || item.skuList[0].skuCode || item.skuList[0].code || skuCode;
    }

    if (!productId || !skuCode) {
      return { success: false, error: `搜索商品成功，但未解析出 productId/skuCode: ${JSON.stringify(searchRes.data).substring(0, 100)}` };
    }

    // 2. Preview Order
    const previewToolName = 'previewOrder';
    const args = {
      deptId,
      productList: [
        {
          amount: params.quantity || 1,
          productId: Number(productId),
          skuCode: String(skuCode)
        }
      ]
    };

    const res = await invokeLuckinMcpTool(previewToolName, args);
    console.log('[Luckin MCP] preview raw data:', res.data);

    if (!res.success) {
      return {
        success: false,
        error: `预览订单失败 (${previewToolName}): ${res.error}`
      };
    }

    const data = res.data || {};
    const shopInfo = data.shopInfo || {};
    const productInfoList = Array.isArray(data.productInfoList) ? data.productInfoList : [];
    const firstProduct = productInfoList[0] || {};

    return {
      success: true,
      draftId: JSON.stringify({
        draftId: data.draftId || data.previewId || data.orderId || 'REAL_PREVIEW',
        productId,
        skuCode,
        couponCodeList: data.couponCodeList || []
      }),
      payPrice: Number(data.discountPrice ?? data.payPrice ?? data.totalAmount ?? firstProduct.estimatePrice ?? 0),
      originalPrice: Number(data.totalInitialPrice ?? data.originalPrice ?? firstProduct.initPrice ?? 0),
      discountPrice: Number(data.privilegeMoney ?? data.discountPrice ?? 0),
      shopName: shopInfo.deptName || data.shopName,
      shopAddress: shopInfo.address || data.shopAddress,
      specsText: firstProduct.additionDesc || params.specs,
      rawData: data,
      productId,
      skuCode,
      couponCodeList: data.couponCodeList || []
    };
  } catch (err: any) {
    console.error('[previewRealMcpOrder Error]', err);
    return { success: false, error: `订单预览异常: ${err?.message || String(err)}` };
  }
}

/**
 * 解析并分类瑞幸官方支付链接 (网页 HTTP / 手机 Deep Link Scheme)
 */
export interface ParsedLuckinPayUrl {
  rawUrl: string;
  isHttps: boolean;
  isDeepLink: boolean;
  isWeChat: boolean;
  isAlipay: boolean;
  isSimulated: boolean;
  qrCodeUrl: string;
  suggestedActionName: string;
}

export function parseLuckinPayUrl(url?: string, isRealMcpOrder?: boolean): ParsedLuckinPayUrl | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const isHttps = trimmed.startsWith('http://') || trimmed.startsWith('https://');
  const isDeepLink =
    trimmed.startsWith('alipays://') ||
    trimmed.startsWith('weixin://') ||
    trimmed.startsWith('luckin://') ||
    trimmed.startsWith('intent://') ||
    trimmed.startsWith('mqq://');

  const isWeChat = trimmed.includes('weixin') || trimmed.includes('wx.tenpay.com') || trimmed.includes('weixin.qq.com');
  const isAlipay = trimmed.includes('alipay') || trimmed.includes('alipays');

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(trimmed)}`;

  let actionName = '前往官方收银台支付';
  if (isWeChat) actionName = '拉起微信 App / 小程序支付';
  else if (isAlipay) actionName = '拉起支付宝 App 支付';

  return {
    rawUrl: trimmed,
    isHttps,
    isDeepLink,
    isWeChat,
    isAlipay,
    isSimulated: false,
    qrCodeUrl,
    suggestedActionName: actionName
  };
}

/**
 * 真实 MCP 下单流程：提交真实订单并获取取餐码与收银台支付链接 (createOrder / confirmOrder)
 */
export async function submitRealMcpOrder(params: {
  draftId: string; // This is now a JSON string containing draftId, productId, skuCode, couponCodeList
  shopId?: string;
  paymentMethod?: 'wechat' | 'alipay';
  orderData: Partial<LuckinOrderData>;
}): Promise<{
  success: boolean;
  orderId?: string;
  pickupCode?: string;
  payUrl?: string;
  status?: string;
  error?: string;
  rawData?: any;
}> {
  try {
    const toolName = 'createOrder';
    const deptId = Number(params.shopId || params.orderData.storeId);
    if (isNaN(deptId) || deptId <= 0) {
      return { success: false, error: '请先选择有效的门店' };
    }
    
    let draftPayload: any = {};
    try {
      draftPayload = JSON.parse(params.draftId);
    } catch (e) {
      return { success: false, error: '草稿ID数据异常' };
    }

    const config = getStoredMcpConfig();
    const lat = config.userLatitude || 39.9042;
    const lng = config.userLongitude || 116.4074;

    // Primary attempt with createOrder tool
    const res = await invokeLuckinMcpTool(toolName, {
      deptId,
      productList: [
        {
          amount: 1,
          productId: Number(draftPayload.productId),
          skuCode: String(draftPayload.skuCode)
        }
      ],
      longitude: lng,
      latitude: lat,
      couponCodeList: draftPayload.couponCodeList || [],
      remark: ''
    });
    console.log('[Luckin MCP] raw data:', res.data);

    if (res.success && res.data) {
      const d = res.data;
      const orderId = d.orderId || d.orderNo || d.outOrderNo || d.mcpOrderId || d.id;
      const payUrl = d.payUrl || d.paymentUrl || d.cashierUrl || d.schemeUrl || d.payLink || d.url || d.wxPayUrl || d.aliPayUrl || d.payOrderUrl || d.payOrderQrCodeUrl || d.pay_order_url || d.pay_order_qr_code_url;
      const pickupCode = d.pickupCode || d.takeCode || d.fetchCode;

      if (!orderId && !payUrl) {
        return {
          success: false,
          error: `提交订单成功但未返回有效订单ID或支付链接 (工具: ${toolName})`
        };
      }

      return {
        success: true,
        orderId: orderId ? String(orderId) : undefined,
        pickupCode,
        payUrl,
        status: d.status || 'AWAITING_PAYMENT',
        rawData: d
      };
    }

    return {
      success: false,
      error: `真实下单提交失败 (工具: ${toolName}): ${res.error}`
    };
  } catch (err: any) {
    console.error('[submitRealMcpOrder Error]', err);
    return { success: false, error: `真实下单提交异常: ${err?.message || String(err)}` };
  }
}

/**
 * 真实 MCP 查询订单详情与实时制作状态
 */
export async function queryRealMcpOrderStatus(orderId: string): Promise<{
  success: boolean;
  orderId?: string;
  pickupCode?: string;
  status?: string;
  statusText?: string;
  makeProgress?: number; // 0-100
  estimatedMinutes?: number;
  error?: string;
  rawData?: any;
}> {
  const toolName = 'queryOrderDetailInfo';
  const res = await invokeLuckinMcpTool(toolName, {
    orderId,
    orderNo: orderId
  });

  if (res.success && res.data) {
    const d = res.data;
    const statusCode = d.statusCode || d.status || 'MAKING';
    let statusText = '咖啡制作中';
    let progress = d.progress ?? 50;

    if (statusCode === 'PAID' || statusCode === 'WAIT_MAKE') {
      statusText = '已支付，排队制作中';
      progress = d.progress ?? 25;
    } else if (statusCode === 'MAKING' || statusCode === 'IN_PROGRESS') {
      statusText = '咖啡师精心调制中';
      progress = d.progress ?? 65;
    } else if (statusCode === 'READY' || statusCode === 'WAIT_FETCH') {
      statusText = '制作完成，请凭取餐码取餐';
      progress = 100;
    } else if (statusCode === 'COMPLETED' || statusCode === 'FINISHED') {
      statusText = '已完成取餐';
      progress = 100;
    } else if (statusCode === 'CANCELLED') {
      statusText = '订单已取消';
      progress = 0;
    }

    return {
      success: true,
      orderId: String(d.orderId || orderId),
      pickupCode: d.pickupCode || d.takeCode || d.fetchCode,
      status: statusCode,
      statusText,
      makeProgress: progress,
      estimatedMinutes: d.estimatedMinutes || d.waitTime,
      rawData: d
    };
  }

  return {
    success: false,
    error: res.error || `查询订单状态失败 (工具: ${toolName})`
  };
}
