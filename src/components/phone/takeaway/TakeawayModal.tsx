import React, { useState, useMemo, useEffect } from 'react';
import { Contact, TakeawayOrder } from '../../../types/phone';
import { Avatar } from '../Avatar';
import { 
  X, 
  Bike, 
  Clock, 
  Sparkles, 
  Check, 
  Utensils, 
  Flame, 
  Heart,
  ChevronRight
} from 'lucide-react';

interface TakeawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onPlaceOrder: (order: TakeawayOrder) => void;
}

interface MenuItem {
  id: string;
  name: string;
  store: string;
  price: number;
  image: string;
  desc: string;
  tag: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'food_1',
    name: '伯牙绝弦 (大杯鲜奶茶)',
    store: '霸王茶姬 · 旗舰店',
    price: 20,
    image: 'https://images.unsplash.com/photo-1558857563-b37fe78a9c58?w=300&auto=format&fit=crop&q=80',
    desc: '茉莉雪芽原叶鲜茶，微糖温热，解乏回甘',
    tag: '销量王'
  },
  {
    id: 'food_2',
    name: '招牌金牌脆皮整鸡',
    store: '窑鸡王 · 现烤现撕',
    price: 39.9,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80',
    desc: '秘制腌料现烤爆汁，皮脆肉嫩，附送冰红茶',
    tag: '人气爆款'
  },
  {
    id: 'food_3',
    name: '焦糖玛奇朵 + 黄油可颂',
    store: '星巴克甄选咖啡',
    price: 42,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    desc: '经典意式浓缩，焦糖香浓郁，下午茶元气搭档',
    tag: '元气提神'
  },
  {
    id: 'food_4',
    name: '荤素大满足牛骨汤麻辣烫',
    store: '杨国福麻辣烫',
    price: 32.5,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80',
    desc: '浓郁牛骨高汤，原切肥牛+芝士鱼豆腐+鲜蔬菜',
    tag: '暖胃首选'
  },
  {
    id: 'food_5',
    name: '半熟芝士甜品礼盒(4枚入)',
    store: '好利来 · 经典烘焙',
    price: 38,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&auto=format&fit=crop&q=80',
    desc: '日式工艺低温慢烤，入口如冰淇淋般细腻',
    tag: '甜蜜治愈'
  },
  {
    id: 'food_6',
    name: '巨无霸汉堡三件套',
    store: '麦当劳 · 快捷餐厅',
    price: 29.9,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
    desc: '纯正双层牛肉饼，特调酱料，大份薯条+可乐',
    tag: '饱腹首选'
  }
];

export const TakeawayModal: React.FC<TakeawayModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onPlaceOrder
}) => {
  // 外卖只可以送给好友，不可以送给群聊，也不可以送给开发工具（言言机助手）
  const validContacts = useMemo(() => {
    const safeContacts = Array.isArray(contacts) ? contacts : [];
    return safeContacts.filter(c => 
      c &&
      !c.isGroup && 
      c.group !== '群聊' && 
      !c.id.startsWith('group_') && 
      !c.isAssistant && 
      c.id !== 'assistant' && 
      c.remark !== '开发工具' &&
      c.name !== '开发工具'
    );
  }, [contacts]);

  const [selectedContactId, setSelectedContactId] = useState<string>(
    validContacts[0]?.id || ''
  );
  const [selectedFoodId, setSelectedFoodId] = useState<string>(MENU_ITEMS[0].id);
  const [deliverySpeed, setDeliverySpeed] = useState<number>(15); // seconds
  const [customNote, setCustomNote] = useState<string>('趁热吃呀，工作/生活辛苦了！☕');

  // 当有效好友列表更新时，若当前选中的不是有效好友，自动切换到第一个有效好友
  React.useEffect(() => {
    if (validContacts.length > 0 && !validContacts.some(c => c.id === selectedContactId)) {
      setSelectedContactId(validContacts[0].id);
    }
  }, [validContacts, selectedContactId]);

  if (!isOpen) return null;

  const selectedContact = validContacts.find(c => c.id === selectedContactId) || validContacts[0];
  const selectedFood = MENU_ITEMS.find(f => f.id === selectedFoodId) || MENU_ITEMS[0];

  const handleConfirmOrder = () => {
    if (!selectedContact) return;

    const riders = ['李强师傅 (金牌骑手)', '张伟师傅 (美团专送)', '刘洋师傅 (准时达先锋)'];
    const randomRider = riders[Math.floor(Math.random() * riders.length)];

    const newOrder: TakeawayOrder = {
      id: `order_${Date.now()}`,
      foodName: selectedFood.name,
      storeName: selectedFood.store,
      price: selectedFood.price,
      image: selectedFood.image,
      aiContactId: selectedContact.id,
      aiContactName: selectedContact.remark || selectedContact.name,
      aiContactAvatar: selectedContact.avatar,
      status: 'delivering',
      orderTime: Date.now(),
      durationSeconds: deliverySpeed,
      riderName: randomRider,
      riderPhone: '138****' + Math.floor(1000 + Math.random() * 9000),
      customNote: customNote.trim(),
      hasNotifiedArrival: false
    };

    onPlaceOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div 
        className="w-[340px] max-h-[85vh] bg-[#fdfbf7] rounded-[24px] overflow-hidden shadow-2xl flex flex-col border border-[#ebdccb] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Rococo Gilded Champagne Honey Style */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#f2d9aa] via-[#ebcb8f] to-[#e0b973] border-b border-[#d6af66] flex items-center justify-between text-[#3d2711] shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#593916] text-[#fff8ea] flex items-center justify-center shadow-xs">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 text-[#3d2711] font-serif">
                <span>美团外卖</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#593916]/15 border border-[#593916]/30 text-[#472c0e] font-bold">
                  AI 心意送
                </span>
              </h3>
              <p className="text-[10px] text-[#634928] font-medium">给你的 AI 好友点一份暖心外卖</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 text-[#3d2711] cursor-pointer active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content (Warm Rococo Ivory background) */}
        <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs bg-[#fdfbf7]">
          {/* Step 1: Select AI Friend */}
          <div>
            <label className="font-bold text-[#45311c] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-[#c99542] fill-[#c99542]" />
                <span>1. 选择送给哪位 AI 好友</span>
              </span>
              <span className="text-[10px] text-[#8c745e] font-normal">点击切换</span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {validContacts.length === 0 ? (
                <div className="text-[#9e8774] text-xs py-2 px-1">
                  暂无可选的 AI 好友，请先在微信添加好友
                </div>
              ) : (
                validContacts.map((c) => {
                  const isSelected = c.id === selectedContactId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#d4a24f] bg-[#fcf4e4] shadow-xs ring-1 ring-[#d4a24f]/40'
                          : 'border-[#ebded0] bg-white hover:border-[#d4a24f]'
                      }`}
                    >
                      <Avatar
                        src={c.avatar}
                        name={c.name}
                        className="w-7 h-7 rounded-lg shrink-0"
                        size={14}
                      />
                      <div className="text-left">
                        <p className={`text-[11px] font-bold truncate max-w-[65px] ${
                          isSelected ? 'text-[#3d2711]' : 'text-[#543d28]'
                        }`}>
                          {c.remark || c.name}
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#c99542]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Select Food */}
          <div>
            <label className="font-bold text-[#45311c] mb-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-[#c99542]" />
              <span>2. 挑选暖心餐品</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MENU_ITEMS.map((item) => {
                const isSelected = item.id === selectedFoodId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFoodId(item.id)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#d4a24f] bg-[#fcf5e7] shadow-sm ring-2 ring-[#d4a24f]/35'
                        : 'border-[#ebded0] bg-white hover:border-[#d4a24f]'
                    }`}
                  >
                    <div className="relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-16 rounded-lg object-cover mb-1.5"
                        />
                      ) : (
                        <div className="w-full h-16 rounded-lg bg-[#f7f0e6] mb-1.5 flex items-center justify-center text-[#9c846f] text-xs">
                          餐品
                        </div>
                      )}
                      <span className="absolute top-1 right-1 text-[9px] px-1 py-0.2 bg-[#593916]/85 text-[#fdfbf7] rounded font-medium">
                        {item.tag}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-[#3d2711] line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[#8c745e] line-clamp-1">{item.store}</p>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#ebdcc7]">
                        <span className="font-bold text-[#ab6f1d] text-xs font-mono">
                          ¥{item.price}
                        </span>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-[#d4a24f] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9c846f]">选择</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Delivery Speed (Wait time) */}
          <div>
            <label className="font-bold text-[#45311c] mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#c99542]" />
              <span>3. 配送等待时间 (送达后AI会主动发微信)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDeliverySpeed(15)}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  deliverySpeed === 15
                    ? 'border-[#d4a24f] bg-[#fcf5e7] text-[#3d2711] font-bold shadow-xs'
                    : 'border-[#ebded0] bg-white text-[#66503b] hover:border-[#d4a24f]'
                }`}
              >
                <div className="text-[11px]">⚡ 15秒</div>
                <div className="text-[9px] text-[#9c846f]">快速体验</div>
              </button>
              <button
                type="button"
                onClick={() => setDeliverySpeed(35)}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  deliverySpeed === 35
                    ? 'border-[#d4a24f] bg-[#fcf5e7] text-[#3d2711] font-bold shadow-xs'
                    : 'border-[#ebded0] bg-white text-[#66503b] hover:border-[#d4a24f]'
                }`}
              >
                <div className="text-[11px]">🛵 35秒</div>
                <div className="text-[9px] text-[#9c846f]">逼真流速</div>
              </button>
              <button
                type="button"
                onClick={() => setDeliverySpeed(90)}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  deliverySpeed === 90
                    ? 'border-[#d4a24f] bg-[#fcf5e7] text-[#3d2711] font-bold shadow-xs'
                    : 'border-[#ebded0] bg-white text-[#66503b] hover:border-[#d4a24f]'
                }`}
              >
                <div className="text-[11px]">⏱️ 90秒</div>
                <div className="text-[9px] text-[#9c846f]">真实沉浸</div>
              </button>
            </div>
          </div>

          {/* Step 4: Custom Note */}
          <div>
            <label className="block font-bold text-[#45311c] mb-1">外卖小票留言：</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="写一句关照TA的贴心话..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#ebded0] bg-white text-xs text-[#3d2711] focus:outline-hidden focus:border-[#d4a24f]"
            />
          </div>
        </div>

        {/* Footer Payment Bar */}
        <div className="p-3 bg-[#f9f3e9] border-t border-[#ebded0] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] text-[#8c745e]">外卖心意小计: </span>
            <span className="text-base font-extrabold text-[#ab6f1d] font-mono">
              ¥{selectedFood.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={!selectedContact || validContacts.length === 0}
            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all ${
              !selectedContact || validContacts.length === 0
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#e5c07b] to-[#cf9842] hover:from-[#dbae5e] hover:to-[#bd842f] active:scale-95 text-[#3b240e] cursor-pointer'
            }`}
          >
            <span>{selectedContact ? `立即送给 ${selectedContact.remark || selectedContact.name}` : '请先选择好友'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
