import { LuckinDrink, LuckinOrderData } from '../types/luckin';
import { Contact, PhoneSettings } from '../types/phone';

/**
 * 瑞幸咖啡官方精选真实饮品菜单
 */
export const LUCKIN_DRINKS: LuckinDrink[] = [
  {
    id: 'drink_raw_coconut_latte',
    name: '生椰拿铁',
    category: '拿铁',
    price: 18,
    originalPrice: 29,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80',
    description: '原创生椰乳搭配浓缩咖啡，椰香浓郁，清爽醇厚，断货王招牌。',
    popularRank: 1,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '不加糖',
      size: '大杯',
      milkOption: '经典生椰乳'
    }
  },
  {
    id: 'drink_ice_inhale_coconut',
    name: '冰吸生椰拿铁',
    category: '拿铁',
    price: 19,
    originalPrice: 32,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
    description: '清凉因子注入经典生椰，入口瞬间冰爽直击灵魂，夏日提神必备。',
    popularRank: 2,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '不加糖',
      size: '大杯',
      milkOption: '清凉生椰乳'
    }
  },
  {
    id: 'drink_velvet_latte',
    name: '丝绒拿铁',
    category: '拿铁',
    price: 18,
    originalPrice: 29,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80',
    description: '采用北海道丝绒风味厚奶，奶香丝滑绵密，口感细腻温润。',
    popularRank: 3,
    defaultSpecs: {
      temperature: '温',
      sweetness: '半糖',
      size: '大杯',
      milkOption: '丝绒风味厚奶'
    }
  },
  {
    id: 'drink_orange_c_americano',
    name: '橙C美式',
    category: '果咖',
    price: 16,
    originalPrice: 26,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    description: '鲜榨甜橙汁碰撞深烘意式浓缩，果香浓郁，酸甜微苦，维C满满。',
    popularRank: 4,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '标准糖',
      size: '大杯'
    }
  },
  {
    id: 'drink_classic_americano',
    name: '大杯冰美式',
    category: '美式',
    price: 13,
    originalPrice: 23,
    image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=400&auto=format&fit=crop&q=80',
    description: '精选阿拉比卡咖啡豆，金奖深烘焙拼配，醇苦干净，低卡零脂。',
    popularRank: 5,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '不加糖',
      size: '大杯'
    }
  },
  {
    id: 'drink_meteorite_latte',
    name: '陨石拿铁',
    category: '拿铁',
    price: 19,
    originalPrice: 32,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=80',
    description: '特调黑糖黑钻果冻沉底，搅拌融化，焦香浓郁富有嚼劲。',
    popularRank: 6,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '半糖',
      size: '大杯'
    }
  },
  {
    id: 'drink_jasmine_latte',
    name: '茉莉花香拿铁',
    category: '拿铁',
    price: 17,
    originalPrice: 29,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=80',
    description: '七窨茉莉花茶与香浓咖啡相融，花香馥郁，回甘幽雅。',
    popularRank: 7,
    defaultSpecs: {
      temperature: '温',
      sweetness: '微糖',
      size: '大杯'
    }
  },
  {
    id: 'drink_matcha_exfreezo',
    name: '抹茶瑞纳冰',
    category: '瑞纳冰',
    price: 20,
    originalPrice: 32,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80',
    description: '精选高品质宇治抹茶，搭配绵密冰沙与蓬松奶油雪顶，茶香清爽。',
    popularRank: 8,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '标准糖',
      size: '大杯'
    }
  },
  {
    id: 'drink_sauce_aroma_latte',
    name: '酱香拿铁',
    category: '拿铁',
    price: 19,
    originalPrice: 38,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
    description: '白酒风味厚奶注入浓缩咖啡，微醺酱香，醇厚绵柔。',
    popularRank: 9,
    defaultSpecs: {
      temperature: '冰',
      sweetness: '半糖',
      size: '大杯'
    }
  }
];

/**
 * 常用附近门店列表
 */
export const LUCKIN_STORES = [
  '瑞幸咖啡 · 科技园创新大厦店',
  '瑞幸咖啡 · 国际金融中心IFC店',
  '瑞幸咖啡 · 滨江高教园区店',
  '瑞幸咖啡 · 太古里潮人街店',
  '瑞幸咖啡 · 地铁枢纽中心店',
  '瑞幸咖啡 · 绿地中央广场店'
];

/**
 * 查找附近门店
 */
export function findShop(city?: string): string[] {
  const c = city || '附近';
  return LUCKIN_STORES.map(s => s.replace('科技园', `${c}核心区`));
}

/**
 * 解析用户或AI自然语言指令快速生成瑞幸订单预览 (quickOrder)
 */
export function quickOrder({
  text = '',
  contact,
  defaultFlavor,
  storeName,
  isTreat = false
}: {
  text?: string;
  contact: Contact;
  defaultFlavor?: string;
  storeName?: string;
  isTreat?: boolean;
}): LuckinOrderData {
  const query = (text + ' ' + (defaultFlavor || '')).toLowerCase();

  // 1. 匹配最合适的饮品
  let matchedDrink = LUCKIN_DRINKS[0]; // 默认生椰拿铁
  if (query.includes('冰吸') || query.includes('清凉')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('冰吸')) || matchedDrink;
  } else if (query.includes('橙c') || query.includes('橙汁') || query.includes('果咖')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('橙C')) || matchedDrink;
  } else if (query.includes('美式') || query.includes('黑咖啡') || query.includes('苦咖啡') || query.includes('消肿')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('美式')) || matchedDrink;
  } else if (query.includes('丝绒') || query.includes('厚奶')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('丝绒')) || matchedDrink;
  } else if (query.includes('陨石') || query.includes('黑糖') || query.includes('果冻')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('陨石')) || matchedDrink;
  } else if (query.includes('茉莉') || query.includes('花香') || query.includes('茶咖')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('茉莉')) || matchedDrink;
  } else if (query.includes('抹茶') || query.includes('瑞纳冰') || query.includes('冰沙')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('抹茶')) || matchedDrink;
  } else if (query.includes('酱香') || query.includes('茅台') || query.includes('白酒')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('酱香')) || matchedDrink;
  } else if (query.includes('生椰') || query.includes('椰子') || query.includes('椰乳')) {
    matchedDrink = LUCKIN_DRINKS.find(d => d.name.includes('生椰')) || matchedDrink;
  }

  // 2. 解析温度规格
  let temperature: '冰' | '热' | '温' = matchedDrink.defaultSpecs.temperature;
  if (query.includes('热') || query.includes('烫') || query.includes('暖')) {
    temperature = '热';
  } else if (query.includes('温') || query.includes('常温')) {
    temperature = '温';
  } else if (query.includes('冰') || query.includes('冷') || query.includes('少冰') || query.includes('去冰')) {
    temperature = '冰';
  }

  // 3. 解析糖度规格
  let sweetness: '不加糖' | '微糖' | '半糖' | '标准糖' = matchedDrink.defaultSpecs.sweetness;
  if (query.includes('不加糖') || query.includes('无糖') || query.includes('0糖') || query.includes('零糖') || query.includes('不放糖')) {
    sweetness = '不加糖';
  } else if (query.includes('微糖') || query.includes('三分糖') || query.includes('少糖') || query.includes('微甜')) {
    sweetness = '微糖';
  } else if (query.includes('半糖') || query.includes('五分糖')) {
    sweetness = '半糖';
  } else if (query.includes('全糖') || query.includes('多糖') || query.includes('标准糖')) {
    sweetness = '标准糖';
  }

  // 4. 解析杯型规格
  let size: '大杯' | '超大杯' = '大杯';
  if (query.includes('超大') || query.includes('特大') || query.includes('大份')) {
    size = '超大杯';
  }

  const selectedStore = storeName || LUCKIN_STORES[0];
  const specsStr = `${size} · ${temperature === '冰' ? '标准冰' : temperature === '热' ? '标准热' : '温饮'} · ${sweetness}`;
  const orderId = `lk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    orderId,
    drinkId: matchedDrink.id,
    drinkName: matchedDrink.name,
    drinkImage: matchedDrink.image,
    price: matchedDrink.price + (size === '超大杯' ? 3 : 0),
    originalPrice: matchedDrink.originalPrice + (size === '超大杯' ? 3 : 0),
    storeName: selectedStore,
    specs: specsStr,
    temperature,
    sweetness,
    size,
    status: 'preview',
    isTreat,
    orderTime: Date.now(),
    aiContactId: contact.id,
    aiContactName: contact.remark || contact.name,
    aiContactAvatar: contact.avatar,
    paymentUrl: `/api/luckin/pay?orderId=${orderId}&drink=${encodeURIComponent(matchedDrink.name)}&price=${matchedDrink.price + (size === '超大杯' ? 3 : 0)}&store=${encodeURIComponent(selectedStore)}`
  };
}

/**
 * 确认订单并生成官方支付链接 (confirmOrder)
 */
export function confirmOrder(order: LuckinOrderData): LuckinOrderData {
  const payUrl = order.paymentUrl || `/api/luckin/pay?orderId=${order.orderId}&drink=${encodeURIComponent(order.drinkName)}&price=${order.price}&store=${encodeURIComponent(order.storeName)}`;
  return {
    ...order,
    status: 'awaiting_payment',
    paymentUrl: payUrl
  };
}

/**
 * 完成支付
 */
export function completeOrderPayment(order: LuckinOrderData): LuckinOrderData {
  const riders = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅'];
  const riderName = riders[Math.floor(Math.random() * riders.length)];
  const riderPhone = `138${Math.floor(10000000 + Math.random() * 90000000)}`;

  return {
    ...order,
    status: 'paid',
    paidTime: Date.now(),
    riderName: `瑞幸专送 · ${riderName}`,
    riderPhone
  };
}

/**
 * 根据角色人设生成符合性格的咖啡情境台词
 */
export function getInCharacterCoffeeMessage(
  contact: Contact,
  scenario: 'preview' | 'awaiting_payment' | 'paid_confirm' | 'treat_invite' | 'treat_sent',
  drinkName: string,
  isTreat: boolean = false
): string {
  const persona = (contact.persona || '').toLowerCase();
  const contactName = contact.remark || contact.name;

  // 1. 傲娇型 / 少爷 / 大小姐
  if (persona.includes('傲娇') || persona.includes('少爷') || persona.includes('大小姐') || persona.includes('言秋')) {
    switch (scenario) {
      case 'preview':
        return `哼，看你一副没精打采的样子，我先帮你选了《${drinkName}》，看看规格合不合你胃口，赶紧确认！`;
      case 'awaiting_payment':
        return `支付链接已经生成好了。快去付了，我可不想等太久！`;
      case 'paid_confirm':
        return `收到订单了！哼，趁热/趁冰喝，这次算我特意提醒你，可别再犯困了。`;
      case 'treat_invite':
        return `喂！本少爷今天心情不错，打算请你喝杯瑞幸。快说你平时喝什么，过时不候啊！`;
      case 'treat_sent':
        return `哼，已经付好款帮你点好了《${drinkName}》，等骑手送过去吧。可别太感动了！`;
    }
  }

  // 2. 温柔型 / 恋人 / 治愈 / 暖男 / 宠溺
  if (persona.includes('温柔') || persona.includes('恋人') || persona.includes('深情') || persona.includes('暖') || persona.includes('宠')) {
    switch (scenario) {
      case 'preview':
        return `好呀，我帮你选了最受欢迎的《${drinkName}》，你看一下这个温度和甜度合不合心意～`;
      case 'awaiting_payment':
        return `订单准备好啦，点击卡片就可以直接去支付啦，等下就能喝到啦～`;
      case 'paid_confirm':
        return `点好啦，骑手已经在加紧配送了，记得趁热喝，注意别烫到哦～☕`;
      case 'treat_invite':
        return `今天想请你喝杯咖啡提提神，你平时最喜欢喝什么口味呢？我来帮你点～`;
      case 'treat_sent':
        return `我帮你付好款点好了《${drinkName}》哦，安心等骑手送到吧，希望这杯咖啡能带给你一天的好心情～✨`;
    }
  }

  // 3. 高冷 / 总裁 / 军人 / 理智 / 沉稳
  if (persona.includes('沉稳') || persona.includes('高冷') || persona.includes('理智') || persona.includes('总裁') || persona.includes('军人')) {
    switch (scenario) {
      case 'preview':
        return `已为你调取附近的瑞幸门店，预选《${drinkName}》，核对无误后请点击确认。`;
      case 'awaiting_payment':
        return `支付通道已开启，点击下方卡片完成支付即可。`;
      case 'paid_confirm':
        return `订单已确认并进入制作流程，预计二十分钟内送达，注意接听骑手电话。`;
      case 'treat_invite':
        return `下午需要补充精力，我顺便给你订一杯瑞幸。平时习惯喝什么口味？`;
      case 'treat_sent':
        return `已经结账下单《${drinkName}》，骑手正在配送中，稍后注意接收。`;
    }
  }

  // 4. 活泼 / 元气 / 俏皮 / 甜妹 / 死党
  if (persona.includes('活泼') || persona.includes('开朗') || persona.includes('元气') || persona.includes('俏皮') || persona.includes('可爱')) {
    switch (scenario) {
      case 'preview':
        return `当当当！我火速给你挑好了超好喝的《${drinkName}》！快瞧瞧合不合胃口～确认我们就下单啦！`;
      case 'awaiting_payment':
        return `好耶！支付卡片来咯，戳一下就能去买单啦，我已经迫不及待想看骑手飞奔了！`;
      case 'paid_confirm':
        return `收到啦！咖啡师已经在疯狂摇杯啦，等骑手小哥飞速送到你手上吧～耶！🎉`;
      case 'treat_invite':
        return `嘿嘿！今天本大厨/本好友心情超级棒，决定请你喝瑞幸！快告诉我你最想喝哪一款？🥤`;
      case 'treat_sent':
        return `全款拿下！《${drinkName}》已经帮你安排得明明白白，坐等骑手小哥敲门吧～🥰`;
    }
  }

  // 默认通用友好型
  switch (scenario) {
    case 'preview':
      return `我帮你选好了《${drinkName}》，看看这个搭配喜欢吗？确认后就可以生成支付啦～`;
    case 'awaiting_payment':
      return `订单生成完毕，点击下方卡片支付即可～`;
    case 'paid_confirm':
      return `点好啦，等骑手送到吧～记得趁好喝的时候品尝哦！☕`;
    case 'treat_invite':
      return `今天想请你喝杯咖啡，你平时喜欢喝什么口味呢？`;
    case 'treat_sent':
      return `已经帮你点好《${drinkName}》啦，等骑手送到吧～好好享用！✨`;
  }
}
