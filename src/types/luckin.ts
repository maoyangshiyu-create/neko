export interface LuckinDrink {
  id: string;
  name: string;
  category: '拿铁' | '美式' | '瑞纳冰' | '果咖' | '茶饮' | '经典';
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  popularRank?: number;
  defaultSpecs: {
    temperature: '冰' | '热' | '温';
    sweetness: '不加糖' | '微糖' | '半糖' | '标准糖';
    size: '大杯' | '超大杯';
    milkOption?: string;
  };
}

export interface LuckinShopItem {
  shopId: string;
  shopName: string;
  address: string;
  distance?: string | number;
  businessStatus?: string;
  businessHours?: string;
  latitude?: number;
  longitude?: number;
}

export interface LuckinMcpConfig {
  endpoint: string; // e.g. 'https://gwmcp.lkcoffee.com/order/user/mcp'
  token: string; // Bearer token from open.lkcoffee.com/mcp
  isEnabled: boolean; // whether MCP real order mode is active
  isConnected?: boolean;
  userNickname?: string;
  selectedShop?: LuckinShopItem;
  cachedShops?: LuckinShopItem[];
  selectedRegion?: {
    province: string;
    city: string;
    district: string;
    street?: string;
  };
  userLatitude?: number;
  userLongitude?: number;
  lastTestedAt?: number;
}

export interface LuckinOrderData {
  orderId: string;
  drinkId?: string;
  drinkName: string;
  drinkImage: string;
  price: number;
  originalPrice?: number;
  storeName: string;
  storeAddress?: string;
  storeId?: string;
  specs: string; // e.g. "大杯 · 推荐冰 · 不另外加糖"
  temperature?: '冰' | '热' | '温';
  sweetness?: '不加糖' | '微糖' | '半糖' | '标准糖';
  size?: '大杯' | '超大杯';
  status: 'preview' | 'awaiting_payment' | 'paid' | 'delivering' | 'completed' | 'cancelled';
  isTreat?: boolean; // true if AI proactively treats player (AI请客)
  isRealMcpOrder?: boolean; // true if placed via official Luckin MCP
  mcpDraftId?: string;
  mcpOrderId?: string;
  pickupCode?: string; // real pick-up code (e.g. "B12" / "8042")
  paymentUrl?: string; // real cashier pay url or mini-program scheme
  orderTime: number;
  paidTime?: number;
  riderName?: string;
  riderPhone?: string;
  aiContactId: string;
  aiContactName: string;
  aiContactAvatar?: string;
  aiPersonaNote?: string;
  confirmReplyMsg?: string; // AI confirmation message after payment
  rawMcpResult?: any;
}

