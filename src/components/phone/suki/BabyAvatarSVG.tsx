import React from 'react';

export type BabyExpression = 'happy' | 'normal' | 'hungry' | 'sleepy' | 'sad' | 'sick';
export type BabyStage = 'infant' | 'toddler' | 'child' | 'teen' | 'adult';

interface BabyAvatarSVGProps {
  expression?: BabyExpression;
  stage?: BabyStage;
  gender?: 'boy' | 'girl';
  actionEffect?: 'feed' | 'bath' | 'play' | 'pet' | null;
  className?: string;
  size?: number;
}

export const BabyAvatarSVG: React.FC<BabyAvatarSVGProps> = ({
  expression = 'normal',
  stage = 'infant',
  gender = 'boy',
  actionEffect = null,
  className = '',
  size = 200,
}) => {

  // 根据表达式决定动画样式
  let animationClass = 'animate-baby-bounce-normal';
  if (expression === 'happy') {
    animationClass = 'animate-baby-bounce-happy';
  } else if (expression === 'sleepy') {
    animationClass = 'animate-baby-breath-sleepy';
  } else if (expression === 'sick' || expression === 'sad') {
    animationClass = 'animate-baby-sway-sick';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 注入 CSS Keyframes 动画 */}
      <style>{`
        @keyframes babyFloatNormal {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes babyBounceHappy {
          0%, 100% { transform: translateY(0px) scale(1, 1); }
          30% { transform: translateY(-22px) scale(0.96, 1.05) rotate(-2deg); }
          60% { transform: translateY(-10px) scale(1.04, 0.95) rotate(2deg); }
          80% { transform: translateY(-4px) scale(0.98, 1.02); }
        }
        @keyframes babyBreathSleepy {
          0%, 100% { transform: translateY(2px) scale(1, 0.98); }
          50% { transform: translateY(-3px) scale(1.01, 1.02); }
        }
        @keyframes babySwaySick {
          0%, 100% { transform: translateY(4px) rotate(-1.5deg); }
          50% { transform: translateY(6px) rotate(1.5deg); }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0px) scale(0.6); opacity: 0; }
          20% { opacity: 1; transform: translateY(-15px) scale(1.1); }
          100% { transform: translateY(-60px) scale(1); opacity: 0; }
        }

        .animate-baby-bounce-normal { animation: babyFloatNormal 2.2s ease-in-out infinite; }
        .animate-baby-bounce-happy { animation: babyBounceHappy 0.75s ease-in-out infinite; }
        .animate-baby-breath-sleepy { animation: babyBreathSleepy 3.5s ease-in-out infinite; }
        .animate-baby-sway-sick { animation: babySwaySick 2.8s ease-in-out infinite; }
        .animate-particle { animation: floatParticle 1.5s ease-out forwards; }
      `}</style>

      {/* 阴影层 */}
      <div className="absolute -bottom-2 w-28 h-4 bg-black/10 rounded-full blur-sm transform transition-all duration-300" style={{
        transform: expression === 'happy' ? 'scale(0.8) translateY(4px)' : 'scale(1)',
        opacity: expression === 'happy' ? 0.4 : 0.6
      }} />

      {/* 浮动动作粒子特效（喂食、洗澡、玩耍、抚摸） */}
      {actionEffect === 'feed' && (
        <div className="absolute -top-6 flex gap-3 pointer-events-none z-20">
          <span className="text-2xl animate-particle" style={{ animationDelay: '0s' }}>🍼</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.2s' }}>🍰</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.4s' }}>✨</span>
        </div>
      )}
      {actionEffect === 'bath' && (
        <div className="absolute -top-6 flex gap-3 pointer-events-none z-20">
          <span className="text-2xl animate-particle" style={{ animationDelay: '0s' }}>🧼</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.2s' }}>🫧</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.4s' }}>💧</span>
        </div>
      )}
      {actionEffect === 'play' && (
        <div className="absolute -top-6 flex gap-3 pointer-events-none z-20">
          <span className="text-2xl animate-particle" style={{ animationDelay: '0s' }}>🎈</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.2s' }}>⭐</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.4s' }}>🎉</span>
        </div>
      )}
      {actionEffect === 'pet' && (
        <div className="absolute -top-6 flex gap-3 pointer-events-none z-20">
          <span className="text-2xl animate-particle" style={{ animationDelay: '0s' }}>💖</span>
          <span className="text-2xl animate-particle" style={{ animationDelay: '0.25s' }}>🌸</span>
        </div>
      )}

      {/* Zzz 困倦气泡 */}
      {expression === 'sleepy' && (
        <div className="absolute -top-5 right-2 flex flex-col items-center pointer-events-none z-20 animate-pulse">
          <span className="text-xs font-bold text-indigo-400 opacity-80" style={{ transform: 'translateY(-10px)' }}>z</span>
          <span className="text-sm font-bold text-indigo-500 opacity-90" style={{ transform: 'translateY(-5px)' }}>Z</span>
          <span className="text-lg font-bold text-indigo-600">Z</span>
        </div>
      )}

      {/* SVG 娃的画板 */}
      <div className={`transition-transform duration-300 ${animationClass}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 肤色渐变 */}
            <radialGradient id="skinGradient" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFF1EB" />
              <stop offset="100%" stopColor="#FDE2D4" />
            </radialGradient>

            {/* 脸颊腮红渐变 */}
            <radialGradient id="blushGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9999" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FF9999" stopOpacity="0" />
            </radialGradient>

            {/* 发色渐变 (男孩咖啡色 / 女孩粉棕色) */}
            <linearGradient id="hairGradientBoy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7C4A3A" />
              <stop offset="100%" stopColor="#4A2A20" />
            </linearGradient>

            <linearGradient id="hairGradientGirl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8829C" />
              <stop offset="100%" stopColor="#B34B68" />
            </linearGradient>

            {/* 衣服渐变 */}
            <linearGradient id="clothesGradientInfant" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            <linearGradient id="clothesGradientChild" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* 生病额头退热贴 */}
            <linearGradient id="coolPadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* ===== 1. 后发 (Girl Long Hair for toddler/child/teen) ===== */}
          {gender === 'girl' && stage !== 'infant' && (
            <g id="backHair">
              <path
                d="M 50 80 Q 40 140 45 170 Q 70 175 90 170 Q 80 120 70 80 Z"
                fill="url(#hairGradientGirl)"
              />
              <path
                d="M 150 80 Q 160 140 155 170 Q 130 175 110 170 Q 120 120 130 80 Z"
                fill="url(#hairGradientGirl)"
              />
            </g>
          )}

          {/* ===== 2. 身体 & 服饰 (Body & Clothing) ===== */}
          <g id="bodyGroup">
            {stage === 'infant' ? (
              /* 婴儿期：圆滚滚的包屁衣 + 围嘴 */
              <g>
                {/* 身体/包屁衣 */}
                <ellipse cx="100" cy="155" rx="36" ry="28" fill="url(#clothesGradientInfant)" />
                {/* 小手 */}
                <circle cx="62" cy="148" r="9" fill="#FDE2D4" />
                <circle cx="138" cy="148" r="9" fill="#FDE2D4" />
                {/* 小脚 */}
                <ellipse cx="80" cy="180" rx="9" ry="7" fill="#FDE2D4" />
                <ellipse cx="120" cy="180" rx="9" ry="7" fill="#FDE2D4" />
                {/* 可爱围嘴 */}
                <path d="M 80 135 Q 100 155 120 135 Q 110 128 100 130 Q 90 128 80 135 Z" fill="#FFF" stroke="#F472B6" strokeWidth="2" />
                <circle cx="100" cy="144" r="3" fill="#F472B6" />
              </g>
            ) : stage === 'toddler' ? (
              /* 幼儿期：小上衣 + 连体背带裤 */
              <g>
                <path d="M 72 135 L 128 135 L 132 175 L 68 175 Z" fill="#60A5FA" rx="6" />
                <rect x="80" y="132" width="8" height="20" fill="#3B82F6" />
                <rect x="112" y="132" width="8" height="20" fill="#3B82F6" />
                {/* 胳膊 */}
                <path d="M 68 138 Q 55 150 62 160" stroke="#FDE2D4" strokeWidth="12" strokeLinecap="round" />
                <path d="M 132 138 Q 145 150 138 160" stroke="#FDE2D4" strokeWidth="12" strokeLinecap="round" />
                {/* 鞋子 */}
                <ellipse cx="78" cy="180" rx="10" ry="6" fill="#1E40AF" />
                <ellipse cx="122" cy="180" rx="10" ry="6" fill="#1E40AF" />
              </g>
            ) : (
              /* 儿童期 & 少年期：时尚卫衣 / 裙子 */
              <g>
                <path d="M 68 132 Q 100 125 132 132 L 138 175 L 62 175 Z" fill="url(#clothesGradientChild)" />
                {/* 领口卡通徽章 */}
                <circle cx="100" cy="148" r="8" fill="#FFF" />
                <path d="M 97 148 L 100 143 L 103 148 L 100 153 Z" fill="#F59E0B" />
                {/* 胳膊 */}
                <path d="M 66 135 Q 52 148 58 162" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
                <path d="M 134 135 Q 148 148 142 162" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
                {/* 裤子 / 鞋 */ }
                <rect x="74" y="172" width="22" height="14" fill="#374151" rx="3" />
                <rect x="104" y="172" width="22" height="14" fill="#374151" rx="3" />
                <ellipse cx="85" cy="186" rx="12" ry="6" fill="#EF4444" />
                <ellipse cx="115" cy="186" rx="12" ry="6" fill="#EF4444" />
              </g>
            )}
          </g>

          {/* ===== 3. 大头部 (Big Round Head) ===== */}
          <g id="headGroup">
            {/* 脸蛋轮廓 */}
            <ellipse cx="100" cy="95" rx="52" ry="46" fill="url(#skinGradient)" />

            {/* 耳朵 */}
            <circle cx="47" cy="98" r="9" fill="#FDE2D4" />
            <circle cx="47" cy="98" r="5" fill="#FCC8B2" />
            <circle cx="153" cy="98" r="9" fill="#FDE2D4" />
            <circle cx="153" cy="98" r="5" fill="#FCC8B2" />

            {/* 腮红红晕 */}
            <ellipse cx="68" cy="106" rx="12" ry="7" fill="url(#blushGradient)" />
            <ellipse cx="132" cy="106" rx="12" ry="7" fill="url(#blushGradient)" />

            {/* 生病脸色偏紫/绿冷色调遮罩 */}
            {expression === 'sick' && (
              <ellipse cx="100" cy="85" rx="46" ry="20" fill="#10B981" opacity="0.18" />
            )}
          </g>

          {/* ===== 4. 发型 (Front Hair / Bangs) ===== */}
          <g id="hairFront">
            {stage === 'infant' ? (
              /* 婴儿期：头顶一缕软萌呆毛 (Sprout) */
              <g>
                <path d="M 100 50 Q 105 32 118 36 Q 108 42 101 49 Z" fill={gender === 'boy' ? '#7C4A3A' : '#E8829C'} />
                <path d="M 99 50 Q 90 34 82 40 Q 92 43 98 49 Z" fill={gender === 'boy' ? '#7C4A3A' : '#E8829C'} />
              </g>
            ) : gender === 'boy' ? (
              /* 男孩发型：帅气二次元刘海 */
              <g>
                <path
                  d="M 48 90 Q 48 50 100 48 Q 152 50 152 90 Q 140 65 125 72 Q 110 60 100 70 Q 90 58 75 72 Q 60 65 48 90 Z"
                  fill="url(#hairGradientBoy)"
                />
              </g>
            ) : (
              /* 女孩发型：萌系齐刘海 + 双马尾/小蝴蝶结 */
              <g>
                <path
                  d="M 48 92 Q 48 48 100 46 Q 152 48 152 92 Q 138 68 124 70 Q 112 66 100 68 Q 88 66 76 70 Q 62 68 48 92 Z"
                  fill="url(#hairGradientGirl)"
                />
                {/* 蝴蝶结发饰 */}
                <path d="M 52 58 L 64 52 L 60 64 Z M 52 58 L 40 52 L 44 64 Z" fill="#F472B6" />
                <circle cx="52" cy="58" r="4" fill="#FFF" />
              </g>
            )}
          </g>

          {/* ===== 5. 表情元素 (Eyes, Eyebrows, Mouth) ===== */}
          <g id="facialExpressions">
            {/* 5.1 眉毛 (Eyebrows) */}
            {expression === 'sad' || expression === 'hungry' ? (
              /* 八字皱眉 */
              <g stroke="#7C4A3A" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 68 76 Q 78 81 84 78" />
                <path d="M 132 76 Q 122 81 116 78" />
              </g>
            ) : expression === 'sick' ? (
              /* 紧绷低斜眉 */
              <g stroke="#7C4A3A" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 68 80 L 84 76" />
                <path d="M 132 80 L 116 76" />
              </g>
            ) : (
              /* 正常弯眉 */
              <g stroke="#7C4A3A" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M 68 75 Q 76 71 84 75" />
                <path d="M 116 75 Q 124 71 132 75" />
              </g>
            )}

            {/* 5.2 眼睛 (Eyes) */}
            {expression === 'happy' ? (
              /* 眯眼笑弯弯眼 (^ ^) */
              <g stroke="#374151" strokeWidth="3.5" strokeLinecap="round" fill="none">
                <path d="M 68 95 Q 76 84 84 95" />
                <path d="M 116 95 Q 124 84 132 95" />
              </g>
            ) : expression === 'sleepy' ? (
              /* 睡眼/半闭眼睛 (- -) */
              <g stroke="#374151" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 68 95 Q 76 98 84 95" />
                <path d="M 116 95 Q 124 98 132 95" />
              </g>
            ) : expression === 'sad' ? (
              /* 汪汪大水眼 + 掉眼泪 (Q Q) */
              <g>
                <circle cx="76" cy="94" r="10" fill="#1F2937" />
                <circle cx="124" cy="94" r="10" fill="#1F2937" />
                {/* 眼中大高光 */}
                <circle cx="73" cy="91" r="4" fill="#FFF" />
                <circle cx="121" cy="91" r="4" fill="#FFF" />
                {/* 晶莹泪珠 */}
                <path d="M 62 100 Q 58 112 63 116 Q 68 112 64 100 Z" fill="#60A5FA" opacity="0.85" />
                <path d="M 138 100 Q 142 112 137 116 Q 132 112 136 100 Z" fill="#60A5FA" opacity="0.85" />
              </g>
            ) : expression === 'hungry' ? (
              /* 委屈求喂食眼睛 */
              <g>
                <ellipse cx="76" cy="94" rx="9" ry="11" fill="#1F2937" />
                <ellipse cx="124" cy="94" rx="9" ry="11" fill="#1F2937" />
                <circle cx="74" cy="90" r="4" fill="#FFF" />
                <circle cx="122" cy="90" r="4" fill="#FFF" />
                <circle cx="78" cy="97" r="2" fill="#FFF" />
                <circle cx="126" cy="97" r="2" fill="#FFF" />
              </g>
            ) : expression === 'sick' ? (
              /* 眩晕/难受眼睛 (> <) */
              <g stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 68 88 L 82 98 L 68 102" />
                <path d="M 132 88 L 118 98 L 132 102" />
              </g>
            ) : (
              /* 正常 (Normal): 闪亮二次元大眼 */
              <g>
                <ellipse cx="76" cy="94" rx="10" ry="12" fill="#1F2937" />
                <ellipse cx="124" cy="94" rx="10" ry="12" fill="#1F2937" />
                {/* 瞳孔亮点 */}
                <circle cx="73" cy="90" r="4.5" fill="#FFF" />
                <circle cx="121" cy="90" r="4.5" fill="#FFF" />
                <circle cx="78" cy="97" r="2" fill="#FFF" opacity="0.8" />
                <circle cx="126" cy="97" r="2" fill="#FFF" opacity="0.8" />
              </g>
            )}

            {/* 5.3 嘴巴 (Mouth) */}
            {expression === 'happy' ? (
              /* 大笑嘴巴 */
              <path d="M 90 108 Q 100 122 110 108 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
            ) : expression === 'hungry' || expression === 'sad' ? (
              /* 嘟嘴 / 撇嘴 (向下弯曲) */
              <path d="M 91 114 Q 100 106 109 114" stroke="#374151" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : expression === 'sleepy' ? (
              /* 打哈欠 / 睡气泡小圆嘴 */
              <ellipse cx="100" cy="112" rx="4" ry="6" fill="#374151" />
            ) : expression === 'sick' ? (
              /* 波浪形难受嘴巴 */
              <path d="M 91 112 Q 95 108 100 112 Q 105 116 109 112" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              /* 正常小微笑 */
              <path d="M 92 110 Q 100 117 108 110" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
          </g>

          {/* ===== 6. 额外装饰件 (退热贴/汗珠/皇冠) ===== */}
          {expression === 'sick' && (
            <g id="feverPad">
              {/* 额头退热贴 */}
              <rect x="80" y="60" width="40" height="14" rx="4" fill="url(#coolPadGradient)" stroke="#3B82F6" strokeWidth="1" />
              <line x1="84" y1="67" x2="116" y2="67" stroke="#FFF" strokeWidth="1.5" strokeDasharray="2 2" />
              {/* 汗珠 */}
              <path d="M 142 75 Q 146 82 142 85 Q 138 82 142 75 Z" fill="#60A5FA" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
