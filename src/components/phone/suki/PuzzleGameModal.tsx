import React, { useState } from 'react';
import { Sparkles, Trophy, Brain, Heart, Smile, X, ArrowRight, Star, RefreshCw } from 'lucide-react';
import { Contact, PhoneSettings } from '../../../types/phone';
import { LifeSimChildData } from '../../../types/lifeSim';
import { getWeddingRoles } from '../../../utils/genderHelper';

interface PuzzleGameModalProps {
  child: LifeSimChildData;
  contact: Contact;
  settings: PhoneSettings;
  onClose: () => void;
  onGameComplete: (score: number, logMessage: string, statsGained: { intelligence: number; eq: number; happiness: number }) => void;
}

interface Question {
  category: string;
  word: string;
  babyClue: string;
  kidClue: string;
  teenClue: string;
  partnerHints: {
    tsundere: string; // 傲娇/高冷
    humorous: string; // 幽默/逗比
    gentle: string;   // 温柔/细腻
  };
  options: string[];
}

const PUZZLE_WORDS: Question[] = [
  // 动物世界
  {
    category: '动物世界',
    word: '企鹅',
    babyClue: '“呼呼——冰冰！小翅膀，啪嗒啪嗒摇摇晃晃走！”（张开双手扭了扭小屁股）',
    kidClue: '“它生活在南极，身上穿着黑白燕尾服，走路的时候一摇一摆，虽然是鸟但是不会飞，只会游泳！”',
    teenClue: '“这是一种群居的非飞行类海洋鸟类，主要分布在南半球高纬度地区，被戏称为‘穿着燕尾服的绅士’。”',
    partnerHints: {
      tsundere: '“喂，看孩子模仿得手舞足蹈的，像个摇晃的小团子。这么明显的‘燕尾服绅士’，你不会猜不出来吧？”',
      humorous: '“哈哈这走姿简直得到了神髓！快快快，这是南极特产，肚子白白、走路极具喜感的是哪位？”',
      gentle: '“看宝宝把双手贴在身侧摇来摆去，好可爱呀……是那个在冰天雪地里聚在一起取暖的小动物对不对？”'
    },
    options: ['企鹅', '海鸥', '大熊猫', '鸭子']
  },
  {
    category: '动物世界',
    word: '大象',
    babyClue: '“长长的！呜——叭——！”（把胳膊当成大鼻子甩了甩，发出响亮的拟音）',
    kidClue: '“它有像扇子一样的蒲扇大耳朵，还有两根尖尖的白牙齿。它的鼻子超级长，还会用鼻子吸水给自己洗澡！”',
    teenClue: '“这是现存陆地上最大的哺乳动物，拥有极高的智力和复杂的社会结构，其标志性特征是长鼻和两颗长牙。”',
    partnerHints: {
      tsundere: '“小家伙正在用他的手臂扮演‘长鼻子’呢。既然这么卖力，你就赶紧给出正确答案吧。”',
      humorous: '“大鼻子甩呀甩！如果答错了，今天洗澡时就罚你用鼻子喷水给娃洗，快猜！”',
      gentle: '“用小小的胳膊当大鼻子，瞧 TA 认真的样子……是森林里脾气温和、体型最大的那个好朋友吧？”'
    },
    options: ['大象', '长颈鹿', '河马', '恐龙']
  },
  {
    category: '动物世界',
    word: '兔子',
    babyClue: '“耳朵长长！蹦蹦跳！”（双手在头上做出剪刀手的耳朵样子，在垫子上跳了跳）',
    kidClue: '“它的眼睛红红的，像两颗红宝石！它最喜欢吃甜甜的胡萝卜，走起路来一蹦一跳的，尾巴像个小毛球！”',
    teenClue: '“一种草食性脊椎动物，听觉和跳跃能力极强。在各种寓言中常作为敏捷却有些骄傲的代表。”',
    partnerHints: {
      tsundere: '“头上比划着两只长耳朵，还跟着蹦了几下。哼……虽然有点傻乎乎的，但确实挺萌。还不快选？”',
      humorous: '“蹦蹦跳跳真可爱，爱吃萝卜爱吃菜！来，选择题就在眼前，展现你智慧的时候到了！”',
      gentle: '“红眼睛、长耳朵……宝宝蹦到你怀里了呢。快抱住这只香喷喷的‘小兔子’吧。”'
    },
    options: ['兔子', '袋鼠', '松鼠', '小狗']
  },
  // 美味食物
  {
    category: '美味食物',
    word: '西瓜',
    babyClue: '“大圆圆！绿绿的，敲敲砰砰！甜甜红红，吐籽籽呸呸！”（假装咬了一大口，发出滋溜声）',
    kidClue: '“夏天最离不开的水果！外面穿着深浅相间的绿条纹衣服，切开里面是红红的果肉，敲起来砰砰响，吃完还要吐黑色的籽！”',
    teenClue: '“属于葫芦科双子叶植物，汁多质脆，是解暑的佳品。含糖量较高，外皮一般具有明显的墨绿色条纹。”',
    partnerHints: {
      tsundere: '“敲一敲有空洞的回音，切开是一片通红。夏天在空调房里抱着用勺子舀着吃的东西，这要是猜错，今天买瓜的任务交给你。”',
      humorous: '“大绿皮、大红瓤，吃完西瓜不吐西瓜子！哈哈，娃都在吐‘呸呸呸’的小隐形子了，快猜！”',
      gentle: '“一到夏天我们最喜欢买一大个冰在冰箱里，然后切成爱心形状分给宝宝吃。你想起来是哪个水果了吗？”'
    },
    options: ['西瓜', '哈密瓜', '苹果', '草莓']
  },
  {
    category: '美味食物',
    word: '冰淇淋',
    babyClue: '“冰冰！甜甜！伸舌头，舔一舔，哇融化啦！”（捂着脸咯咯直笑）',
    kidClue: '“装在脆皮筒或者小盒子里，有草莓味、巧克力味和香草味。它是冰冰凉凉的，夏天吃最爽，但是吃慢了会流得满手都是！”',
    teenClue: '“一种半固体的冷冻乳制品，含有乳脂、香料和甜味剂。在室温下极易由于相变而软化塌陷。”',
    partnerHints: {
      tsundere: '“平时限制 TA 每天只能吃一个的冰凉甜点。看 TA 做出舔脆皮的动作，眼睛都放光了，真拿你们这群贪吃鬼没办法。”',
      humorous: '“甜甜的，吃一口冰凉直冲天灵盖！小舌头舔呀舔……这可是宝宝平时写完作业最想得到的至尊奖励！”',
      gentle: '“冰冰凉凉、五彩缤纷的甜品……宝宝总是吃得嘴巴一圈都是白胡子呢，真让人忍不住想擦擦。”'
    },
    options: ['冰淇淋', '生日蛋糕', '棒棒糖', '果汁']
  },
  // 生活用品
  {
    category: '生活用品',
    word: '雨伞',
    babyClue: '“哗啦啦！下雨啦！撑开大蘑菇，不淋湿！”（假装把双手在头顶撑开一片天）',
    kidClue: '“下雨天必备！只要按一下按钮，它就会像一朵五彩斑斓的大蘑菇一样打开，把雨水都挡在外面，可以跟妈妈一起踩水玩！”',
    teenClue: '“用于遮蔽雨雪或烈日的便携式器具，通过连动骨架将防水布料或涂层撑开，呈抛物线曲面阻挡上方坠落物。”',
    partnerHints: {
      tsundere: '“下雨天两个人撑一把，肩膀会被淋湿的那种老土场景的主角。啧，虽然挺老套，但撑开的一瞬间确实遮风避雨。”',
      humorous: '“撑起一朵大蘑菇，雨里走，不湿鞋！要是猜不中，今天拖地洗衣服的工作就全部包在你身上了哈！”',
      gentle: '“下雨天的时候，我们一左一右牵着宝宝，在下面踩小水坑……那个能为我们遮风挡雨、暖融融的避难所是什么？”'
    },
    options: ['雨伞', '帽子', '雨靴', '帐篷']
  },
  {
    category: '生活用品',
    word: '牙刷',
    babyClue: '“刷刷刷，起泡泡，呼噜噜吐水呸！”（用手指在嘴边横着摩擦，做出好笑的鼓腮帮子表情）',
    kidClue: '“每天早晚都要用的小刷子。挤上香甜的水果牙膏，把牙齿刷得白花花的，这样就再也不怕蛀牙虫啦！”',
    teenClue: '“一种专门用于清洁牙齿的日常卫生物品，由刷柄和刷毛组成。建议每三个月更换一次以确保洁净度。”',
    partnerHints: {
      tsundere: '“早晚都在卫生间里，你催着 TA 做的清洁仪式。那沾上泡沫刷着‘刷刷刷’的小工具，千万别认错。”',
      humorous: '“满嘴白色胡子，漱口咕噜咕噜！每天叫娃起床最艰巨的任务，就是哄 TA 拿起这根小魔法棒！”',
      gentle: '“每次看 TA 闭着眼睛一边打哈欠一边刷牙，小屁股还跟着节奏摇晃……是每天早晚陪伴牙齿洗澡的伙伴吧？”'
    },
    options: ['牙刷', '毛巾', '梳子', '镜子']
  }
];

export const PuzzleGameModal: React.FC<PuzzleGameModalProps> = ({
  child,
  contact,
  settings,
  onClose,
  onGameComplete
}) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'round_result' | 'end'>('start');
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  const contactName = contact.remark || contact.name;
  const persona = (contact.persona || '').toLowerCase();

  // 根据人设判断伴侣的语音风格
  const getPartnerHint = (q: Question) => {
    if (persona.includes('霸') || persona.includes('高冷') || persona.includes('傲娇')) {
      return q.partnerHints.tsundere;
    } else if (persona.includes('幽默') || persona.includes('逗') || persona.includes('宅') || persona.includes('活泼')) {
      return q.partnerHints.humorous;
    }
    return q.partnerHints.gentle;
  };

  // 游戏初始化：随机选取 3 道不同的题目
  const startGame = () => {
    const shuffled = [...PUZZLE_WORDS].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 3));
    setCurrentRound(0);
    setScore(0);
    setSelectedAns(null);
    setGameState('playing');
  };

  // 选择答案
  const handleAnswer = (ans: string) => {
    if (selectedAns) return; // 已经选过了，防止双击
    setSelectedAns(ans);
    const correct = ans === gameQuestions[currentRound].word;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
    setGameState('round_result');
  };

  // 下一轮或结束
  const handleNext = () => {
    if (currentRound < 2) {
      setCurrentRound(r => r + 1);
      setSelectedAns(null);
      setGameState('playing');
    } else {
      // 游戏结束：核算数值并反馈
      let finalInt = 0;
      let finalEq = 0;
      let finalHap = 0;
      let scoreText = '';

      if (score === 3) {
        finalInt = 4;
        finalEq = 4;
        finalHap = 5;
        scoreText = `获得了默契大满贯！在客厅的猜词游戏里心有灵犀，宝贝开心地在你们两人的怀里打滚，欢声笑语充满整个屋子。`;
      } else if (score >= 1) {
        finalInt = 2;
        finalEq = 2;
        finalHap = 3;
        scoreText = `成功答对了其中的 ${score} 道题。虽然中间偶有笑料百出的误会，但在你与 ${contactName} 的巧妙提示下，家庭默契值飙升。`;
      } else {
        finalInt = 1;
        finalEq = 1;
        finalHap = 2;
        scoreText = `虽然一道都没答对（脑回路清奇！），但全家人在客厅里笑得合不拢嘴，宝贝大赞“爸爸妈妈真是一对活宝！”。`;
      }

      const logMessage = `【亲子猜词益智游戏】与 ${contactName}、宝贝 ${child.childName} 一起开展客厅猜词挑战，${scoreText}`;
      
      onGameComplete(score, logMessage, {
        intelligence: finalInt,
        eq: finalEq,
        happiness: finalHap
      });
      setGameState('end');
    }
  };

  // 获取根据孩子年龄生成的线索
  const getChildClue = (q: Question) => {
    if (child.age <= 3) return q.babyClue;
    if (child.age <= 11) return q.kidClue;
    return q.teenClue;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn select-none">
      <div
        className="w-full max-w-md mx-auto rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative transition-all my-auto"
        style={{
          backgroundColor: 'var(--pet-card, #fffaf5)',
          color: 'var(--pet-text, #6b4a52)',
          border: '1px solid var(--pet-card-border, #f0dfe0)',
        }}
      >
        {/* 顶部标题及关闭 */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-pink-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs">客厅趣味小游戏</span>
              <span className="text-[9px] opacity-75">AI伴侣 & 亲子益智猜词</span>
            </div>
          </div>
          {gameState !== 'playing' && gameState !== 'round_result' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#fdf0ec] transition-colors"
            >
              <X className="w-4 h-4 text-[#b398a0]" />
            </button>
          )}
        </div>

        {/* 1. 游戏起始状态 */}
        {gameState === 'start' && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-20 h-20 rounded-full bg-pink-50 border-4 border-pink-100 flex items-center justify-center shadow-inner relative">
              <span className="text-4xl animate-bounce">💬</span>
              <div className="absolute -right-2 -bottom-1 bg-yellow-400 text-white rounded-full p-1 border-2 border-white">
                <Star className="w-3 h-3 fill-current" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-black text-sm">亲子猜词大作战！</h3>
              <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                在温暖明亮的客厅里，你、<span className="font-bold">{contactName}</span> 与宝贝 <span className="font-bold">{child.childName}</span> 围坐在一起玩。宝贝身体力行描述，{contactName} 旁敲侧击，由你给出终极答案！
              </p>
            </div>

            <div className="w-full p-3.5 rounded-2xl text-left text-[11px] leading-relaxed flex flex-col gap-1 border" style={{ backgroundColor: 'var(--pet-bg, #fdf6f0)', borderColor: 'var(--pet-card-border, #f0dfe0)' }}>
              <div className="font-bold flex items-center gap-1 text-pink-500">
                <Trophy className="w-3.5 h-3.5" />
                <span>完成奖励：</span>
              </div>
              <div>• 答对 3 题：宝贝 <span className="font-bold text-pink-600">智力+4 / 情商+4 / 幸福度+5</span></div>
              <div>• 答对 1-2 题：宝贝 <span className="font-bold text-pink-600">智力+2 / 情商+2 / 幸福度+3</span></div>
              <div>• 答对 0 题：宝贝 <span className="font-bold text-pink-600">智力+1 / 幸福度+2</span>（重在参与！）</div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl font-black text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-2"
              style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>开始家庭游戏</span>
            </button>
          </div>
        )}

        {/* 2. 游戏答题中 / 单轮结算中 */}
        {(gameState === 'playing' || gameState === 'round_result') && gameQuestions.length > 0 && (
          <div className="flex flex-col gap-4 py-2">
            {/* 进度显示 */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-pink-500">
                ROUND {currentRound + 1} / 3
              </span>
              <span className="font-bold opacity-75">
                当前得分：{score} / {currentRound + 1}
              </span>
            </div>

            {/* 线索气泡区 */}
            <div className="flex flex-col gap-3">
              {/* 宝贝的精彩描述 */}
              <div className="flex gap-2.5 items-start">
                <div className="w-10 h-10 rounded-full bg-[#fdf0ec] border-2 border-[#f0dfe0] flex items-center justify-center text-lg shadow-sm">
                  {child.gender === 'male' ? '👦' : '👧'}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                    宝贝 {child.childName} ({child.age}岁) 的灵魂手势：
                  </span>
                  <div
                    className="p-3.5 rounded-2xl text-xs font-semibold leading-relaxed relative animate-slide-up"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid var(--pet-btn-bg, #e89aab)',
                      color: 'var(--pet-text, #6b4a52)',
                    }}
                  >
                    {/* 小气泡尖角 */}
                    <div className="absolute top-4 -left-1.5 w-3 h-3 rotate-45 border-l-1.5 border-b-1.5" style={{ backgroundColor: '#ffffff', borderColor: 'var(--pet-btn-bg, #e89aab)' }} />
                    {getChildClue(gameQuestions[currentRound])}
                  </div>
                </div>
              </div>

              {/* 伴侣的助攻/碎碎念 */}
              <div className="flex gap-2.5 items-start">
                <div className="w-10 h-10 rounded-full bg-pink-100 border-2 border-[#f0dfe0] flex items-center justify-center text-lg overflow-hidden shadow-sm">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contactName} className="w-full h-full object-cover" />
                  ) : (
                    <span>🌸</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--pet-text-soft, #b398a0)' }}>
                    伴侣 {contactName} 的悄悄话：
                  </span>
                  <div
                    className="p-3.5 rounded-2xl text-[11px] leading-normal italic relative"
                    style={{
                      backgroundColor: 'var(--pet-bg, #fdf6f0)',
                      border: '1px solid var(--pet-card-border, #f0dfe0)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    <div className="absolute top-4 -left-1.5 w-3 h-3 rotate-45 bg-[var(--pet-bg)] border-l border-b" style={{ borderColor: 'var(--pet-card-border, #f0dfe0)' }} />
                    {getPartnerHint(gameQuestions[currentRound])}
                  </div>
                </div>
              </div>
            </div>

            {/* 四个备选选项 */}
            {gameState === 'playing' ? (
              <div className="grid grid-cols-2 gap-2.5 mt-3 animate-fadeIn">
                {gameQuestions[currentRound].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="p-3 rounded-2xl font-bold text-xs flex items-center justify-center border transition-all active:scale-95 bg-white hover:bg-pink-50/40"
                    style={{
                      borderColor: 'var(--pet-card-border, #f0dfe0)',
                      color: 'var(--pet-text, #6b4a52)'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              /* 单轮答案结算 */
              <div className="flex flex-col gap-3 p-4 rounded-2xl mt-2 animate-fadeIn border" style={{
                backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2',
                borderColor: isCorrect ? '#bbf7d0' : '#fecaca',
                color: isCorrect ? '#166534' : '#991b1b'
              }}>
                <div className="flex items-center gap-2 font-black text-xs">
                  <span className="text-lg">{isCorrect ? '🎉' : '💡'}</span>
                  <span>{isCorrect ? '答对啦！心有灵犀！' : '哎呀，猜错啦！'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  正确答案是：<span className="font-extrabold underline">{gameQuestions[currentRound].word}</span>。
                  你的选择是：<span className="font-bold opacity-90">{selectedAns}</span>。
                </p>

                <button
                  onClick={handleNext}
                  className="w-full mt-1.5 py-2 rounded-xl text-[11px] font-black text-white flex items-center justify-center gap-1 shadow-xs active:scale-98 transition-all"
                  style={{
                    backgroundColor: isCorrect ? '#22c55e' : '#ef4444'
                  }}
                >
                  <span>{currentRound < 2 ? '下一关挑战' : '查看结算报告'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. 游戏结算最终页 */}
        {gameState === 'end' && (
          <div className="flex flex-col items-center text-center py-4 gap-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-yellow-50 border-4 border-yellow-200 flex items-center justify-center shadow-lg animate-pulse">
              <Trophy className="w-8 h-8 text-yellow-500 fill-current" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-black text-sm">挑战成功结案！</h3>
              <span className="text-2xl font-black text-pink-500 font-mono tracking-wider">
                得分 {score} / 3
              </span>
            </div>

            {/* 暖心的结算文案 */}
            <p className="text-xs px-2.5 py-3.5 rounded-2xl leading-relaxed text-left border" style={{
              backgroundColor: 'var(--pet-bg, #fdf6f0)',
              borderColor: 'var(--pet-card-border, #f0dfe0)',
              color: 'var(--pet-text, #6b4a52)'
            }}>
              {score === 3 ? (
                <span>🌟 <b>【默契百分百】</b>：你和 {contactName}、宝贝简直是天造地设的一家人！在这次益智猜词里，宝贝的手势和提示刚比划完，你就瞬间作答。宝贝抱着你们两人直亲，幸福值与情商都飞速飙升！</span>
              ) : score >= 1 ? (
                <span>🍀 <b>【温馨小港湾】</b>：虽然中间错了几道（把大象猜成恐龙也太搞笑了！），但全家其乐融融、探讨答案的样子特别有爱。在玩闹中，宝贝的头脑和情商也得到了很好地磨练哦。</span>
              ) : (
                <span>💡 <b>【开心果家庭】</b>：脑洞大开！一个都没答对。但看着你抓耳挠腮、{contactName}在一旁笑得扶额叹息、娃在地上打滚的可爱画面，这也许就是最平凡而珍贵的家庭幸福吧。</span>
              )}
            </p>

            {/* 属性上涨展示 */}
            <div className="grid grid-cols-3 gap-2 w-full mt-1">
              <div className="p-2 rounded-xl bg-cyan-50/50 text-cyan-700 text-[10px] font-bold border border-cyan-100">
                <div className="flex items-center justify-center gap-0.5">🧠 智力</div>
                <div className="text-sm font-black mt-0.5">+{score === 3 ? 4 : score >= 1 ? 2 : 1}</div>
              </div>
              <div className="p-2 rounded-xl bg-pink-50/50 text-pink-700 text-[10px] font-bold border border-pink-100">
                <div className="flex items-center justify-center gap-0.5">❤️ 情商</div>
                <div className="text-sm font-black mt-0.5">+{score === 3 ? 4 : score >= 1 ? 2 : 1}</div>
              </div>
              <div className="p-2 rounded-xl bg-yellow-50/50 text-yellow-700 text-[10px] font-bold border border-yellow-100">
                <div className="flex items-center justify-center gap-0.5">🍀 幸福度</div>
                <div className="text-sm font-black mt-0.5">+{score === 3 ? 5 : score >= 1 ? 3 : 2}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-black text-xs text-white shadow-md transition-all active:scale-95"
              style={{ backgroundColor: 'var(--pet-btn-bg, #e89aab)' }}
            >
              盖章保存成长印记
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
