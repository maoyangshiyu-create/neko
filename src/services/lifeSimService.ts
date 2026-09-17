import { Contact, PhoneSettings } from '../types/phone';
import { LifeSimChildData, LifeSimEvent, LifeSimEventOption, LifeSimSiblingEvent, LifeSimSiblingEventOption, LifeSimChildAttributes } from '../types/lifeSim';
import { getWeddingRoles } from '../utils/genderHelper';

/**
 * 提取 AI 字符串中的 JSON 对象
 */
function extractJson<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) as T;
    }
  } catch (e) {
    console.warn('JSON parsing failed:', e);
  }
  return null;
}

/**
 * 通用 AI 聊天请求助手（支持后端代理及自定义 API）
 */
async function callAi(prompt: string, settings?: PhoneSettings): Promise<string> {
  if (settings && settings.apiKey && settings.apiUrl) {
    try {
      const url = `${settings.apiUrl.replace(/\/$/, '')}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.modelName || 'gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8
        })
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text) return text;
    } catch (err) {
      console.warn('Custom API failed, falling back to server route:', err);
    }
  }

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemPrompt: prompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
    throw new Error(`AI Request failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.text || data.reply || '';
}

/**
 * 极具沉浸感、完全去除随机拼接的保底事件生成器
 * 确保场景和选项 100% 紧密相关，且不出现重复错乱
 */
export function generateProceduralFallbackEvent(child: LifeSimChildData, contact: Contact): LifeSimEvent {
  const { childName, age, gender } = child;
  const genderText = gender === 'male' ? '男孩' : '女孩';

  let scene = '';
  let options: LifeSimEventOption[] = [];
  let isMilestone = false;

  if (age === 0) {
    scene = `刚出生不久的宝宝${childName}躺在温暖的襁褓中。深夜突然大声啼哭起来，你们作为新晋父母手忙脚乱地来到婴儿床前，发现宝宝似乎是肚子有些胀气，小脸哭得通红通红。`;
    options = [
      { id: 'A', text: '抱起来轻拍后背，轻哼温和的摇篮曲', reasoning: '给予宝宝充足的肌肤接触和情感呵护，树立最初的安全感。', effects: { happiness: 5, eq: 3, mood: 4 } },
      { id: 'B', text: '细心进行排气操，用温热毛巾温敷肚肚', reasoning: '采用科学方法直接排查不适，建立科学理智的育儿生活规律。', effects: { physique: 5, intelligence: 2, happiness: 2 } },
      { id: 'C', text: '播放轻柔的白噪音，在一旁温柔抚摸其小手', reasoning: '利用环境氛围辅助睡眠，引导其逐渐培养自我情绪平复能力。', effects: { intelligence: 4, eq: 2, mood: 3 } }
    ];
  } else if (age === 1) {
    isMilestone = true;
    scene = `今天是${childName}的一周岁抓周大礼。红地毯上摆满了各式精美物件。面对一地琳琅满目的物件，一向有些怕生的${childName}有些咬着手指犹豫不决，怯生生地望着周围欢呼围观的叔叔阿姨。`;
    options = [
      { id: 'A', text: '默默将小金印和毛笔推到TA跟前', reasoning: '希望TA未来走上学术、管理或治国致仕的高远之路。', effects: { intelligence: 6, eq: 2, happiness: 2 } },
      { id: 'B', text: '把玩具羽毛球拍和小盾牌递给TA', reasoning: '寄望矫健体魄，祝愿TA一生健康无病、英武坚强。', effects: { physique: 6, appearance: 1, happiness: 3 } },
      { id: 'C', text: '不做任何引导，任由TA摸到什么就是什么', reasoning: '全然顺应孩子的直觉和天性，守护自由快乐的人生根基。', effects: { happiness: 6, eq: 4, mood: 5 } }
    ];
  } else if (age <= 3) {
    scene = `清晨准备出门，${childName}（${age}岁）坚持要自己穿那双刚买的亮晶晶小雨鞋，结果穿反了。因为鞋子顶脚不舒服，TA委屈地一屁股坐在玄关的地板上嚎啕大哭，谁来抱TA就打谁，闹起了小脾气。`;
    options = [
      { id: 'A', text: '严肃劝导，坚持穿好鞋子并纠正方向', reasoning: '立好出门秩序，通过正面纠正教导生活自理的底线规矩。', effects: { intelligence: 4, physique: 3, happiness: -2, eq: 2 } },
      { id: 'B', text: '蹲下抱抱TA，允许TA先坐在玄关哭完发泄', reasoning: '用无条件的情感接纳舒缓其情绪，建立牢固的心灵信赖感。', effects: { eq: 6, happiness: 5, mood: 5 } },
      { id: 'C', text: '提议跟左脚和右脚玩游戏：鞋子也要走天桥', reasoning: '寓教于乐，运用充满童心和幽默感的游戏化解小叛逆。', effects: { intelligence: 5, eq: 4, appearance: 2, happiness: 4 } }
    ];
  } else if (age <= 6) {
    scene = `${childName}（${age}岁）趁着你们在厨房做饭，用新买的重彩水彩笔在客厅洁白崭新的大墙壁上，画满了奇形怪状的太空飞船、外星人和大恐龙，并且自豪无比地拉着你们过去鉴赏TA的“画展大作”。`;
    options = [
      { id: 'A', text: '温和地讲道理，拿来两块抹布和TA一起清理', reasoning: '保护艺术热忱的同时，用亲身体验教导爱护公物与分担后果的担当。', effects: { physique: 4, intelligence: 3, eq: 3, happiness: -2 } },
      { id: 'B', text: '惊叹其飞船布局，决定买大型大白板做专属画架', reasoning: '重在呵护宝贵的创造力与想象萌芽，引导特长朝着更有利方向发展。', effects: { intelligence: 6, happiness: 5, appearance: 2, eq: 1 } },
      { id: 'C', text: '和伴侣捧场称赞，并留下最可爱的那只恐龙不擦', reasoning: '用家庭的默契留下一份独特的成长足迹，给予满溢的亲子童趣浪漫。', effects: { eq: 5, happiness: 4, mood: 4, physique: 1 } }
    ];
  } else if (age <= 12) {
    scene = `晚饭后，上小学的${childName}（${age}岁）低着头搓着衣角，慢吞吞地从书包里拿出了一张只考了 72 分的单元数学测试卷子，卷面上满是鲜红的叉号和因为粗心看错题目导致的丢分。`;
    options = [
      { id: 'A', text: '指出粗心坏习惯，要求制定本周纠错提升本', reasoning: '严格督导学习态度，帮助孩子建立有规有矩的错题复盘与抗挫力。', effects: { intelligence: 6, happiness: -2, mood: -3, eq: 2 } },
      { id: 'B', text: '安慰考砸是常事，与TA并肩逐题复盘错误思路', reasoning: '采用建设性成长思维，消除其对惩罚的焦虑，共同探寻解决之法。', effects: { eq: 5, happiness: 5, mood: 4, intelligence: 4 } },
      { id: 'C', text: '合上考卷带TA到羽毛球场痛快流汗，然后再谈', reasoning: '采用运动和情绪宣泄疗法，重塑“学习只是生活一部分”的松弛观。', effects: { eq: 6, physique: 5, happiness: 4, mood: 5 } }
    ];
  } else if (age <= 18) {
    scene = `最近正值备考的关键期，${childName}（${age}岁）放学回家总是把自己锁进卧室，而且你们在整理其书桌时无意中瞥见TA买了一个带金属密码锁的新日记本，TA最近在手机聊天时也显得神神秘秘。`;
    options = [
      { id: 'A', text: '召开家庭会议，强调手机与心智限额以备考', reasoning: '在重要升学关头明确大局，适当施压，保证精力高度聚焦主业。', effects: { intelligence: 5, happiness: -3, mood: -4, physique: 1 } },
      { id: 'B', text: '若无其事尊重隐私，绝不追问不窥探日记本', reasoning: '给予孩子成熟平等的个人成长边界，维护深层的心灵安全信任。', effects: { eq: 6, happiness: 5, mood: 5, appearance: 1 } },
      { id: 'C', text: '周末特意策划露营踏青，以朋友身份闲聊心事', reasoning: '打破高压规劝模式，在轻松大自然中引导其树立健康的社会情感大局观。', effects: { eq: 5, intelligence: 3, physique: 2, happiness: 4, mood: 4 } }
    ];
  } else if (age <= 22) {
    scene = `在大学读书的${childName}（${age}岁）在微信视频通话中，语气低落地向你们倾诉：由于大家的生活作息不一致（室友总是在TA准备睡觉时连麦打游戏），同寝室的人产生了微妙隔阂与冷战。`;
    options = [
      { id: 'A', text: '建议潜心准备绩点与论文，不必过度迎合任何人', reasoning: '引导孩子明确大学是学术跳板，靠硬核实力筑牢核心竞争力方是王道。', effects: { intelligence: 6, eq: 2, happiness: 2, mood: 1 } },
      { id: 'B', text: '倾授人际斡旋智慧，指导如何带夜宵打破僵局', reasoning: '大学是微型社会，传授圆融的情商、自如的沟通技巧是必备课。', effects: { eq: 6, intelligence: 2, happiness: 4, mood: 3, appearance: 1 } },
      { id: 'C', text: '全力共情其委屈，必要时赞助其搬出宿舍外租', reasoning: '用温暖宽广的退路守护孩子的情感舒适度，消除一切无用精神内耗。', effects: { happiness: 7, mood: 5, eq: 3, physique: 2, intelligence: -1 } }
    ];
  } else {
    scene = `已经毕业工作并在外独立租房的${childName}（${age}岁）在周末回家聚餐时，显得神情十分憔悴和落寞，透露因为项目跟进出现误差，在周会汇报上被总监劈头盖脸地当众训斥了一顿。`;
    options = [
      { id: 'A', text: '倒茶并客观复盘，传授职场挫折与反击思维', reasoning: '磨炼大心脏般的坚韧钝感力，指导如何用事实和高效改进拿回话语权。', effects: { intelligence: 5, eq: 5, happiness: 3, mood: 3 } },
      { id: 'B', text: '买顶配按摩椅送TA，并留言‘累了随时回家躺平’', reasoning: '用毫无保留的血脉亲情做其永远砸不穿的厚重安全网，消除高压挫败。', effects: { happiness: 7, mood: 6, eq: 3, physique: 1 } },
      { id: 'C', text: '共进一顿大餐，深入探讨该司前景与改换赛道', reasoning: '保持现代平等的良师益友关系，理智理性为其拓展更开阔的职业天地。', effects: { eq: 6, intelligence: 4, appearance: 2, happiness: 5 } }
    ];
  }

  return {
    scene,
    age,
    options,
    isMilestone
  };
}

/**
 * 生成随机事件
 */
export async function generateLifeSimEvent(
  child: LifeSimChildData,
  contact: Contact,
  settings: PhoneSettings
): Promise<LifeSimEvent> {
  const roles = getWeddingRoles(contact, settings);
  const contactGender = roles.contactGender;
  const contactRoleTitle = contactGender === 'female' ? '妈妈' : '爸爸';
  const userRoleTitle = contactGender === 'female' ? '爸爸' : '妈妈';

  // 提取历史近几年的事件，作为严禁重复的上下文
  const historyScenes = (child.logs || [])
    .slice(0, 5)
    .map(l => `【${l.age}岁发生过】${l.scene}`)
    .join('\n');

  // 融合家庭背景
  const fb = child.familyBackground || { financial: '中产小康', atmosphere: '温暖包容' };
  const familyInfoStr = `家庭家境：${fb.financial} 
育儿氛围：${fb.atmosphere}
${fb.customDesc ? `自定义补充家境：${fb.customDesc}` : ''}`;

  const prompt = `你正在生成一个养娃模拟器的随机事件。

【娃的信息】
名字：${child.childName}
年龄：${child.age} 岁
性别：${child.gender === 'male' ? '男孩' : '女孩'}
当前属性：智力${child.attributes.intelligence} 体质${child.attributes.physique} 情商${child.attributes.eq} 颜值${child.attributes.appearance} 心情${child.attributes.mood} 幸福感${child.attributes.happiness}
性格倾向：${child.personalityTags.length > 0 ? child.personalityTags.join('、') : '温和'}

【家庭背景设定（事件情境及选择选项必须深度结合该背景，如富裕或工薪、严格或放养等）】
${familyInfoStr}

【长辈信息】
${userRoleTitle}（玩家）：${settings.userNickname || '我'} (人设：${settings.userPersonaDescription || '负责温暖'})
${contactRoleTitle}（联系人）：${contact.remark || contact.name} (人设：${contact.persona || '温柔贴心'})

【中国国情与年龄规矩 - 极度重要！】
1. 小孩在 19 岁至 22 岁期间【刚进入大学/正在读大学/接受高等教育】，严禁在 19 岁生成去公司全职实习、工作、进入社会的事件！19 岁必须是【大学新生入学、大学选课、社团、宿舍生活】等主题。
2. 小孩在 23 岁以上才【毕业步入社会工作】。
3. 请根据当前的具体年龄：${child.age} 岁，生成完全符合该年龄认知特征的中国本土育儿场景。

【防重复禁令 - 极重要！】
孩子过去几年经历过的事件如下：
${historyScenes || '暂无历史事件记录'}

⚠️ 本次生成的 ${child.age} 岁随机育儿事件【绝对严禁与上述历史事件重复或主题雷同】！严禁套用固定模板。必须设计全新、独特、画面感极强、充满人间烟火气的本土场景。

【任务与要求】
1. 场景描述 50~100 字，必须以娃的名字 ${child.childName} 开头或自然带上 ${child.childName}，融合家庭背景情况（例如如果是普通工薪或富裕，遭遇的事和细节应有所不同；如果育儿氛围是严格，场景可以带有一点小压力或期望）。
2. 提供 3 个选项（id 分别为 "A", "B", "C"），体现不同教育理念（如：严厉规矩 vs 温暖包容 vs 尊重引导）。
3. 每个选项属性影响必须是数值，格式如：{ "intelligence": 5, "happiness": -2, "eq": 3 }，可选属性名：intelligence, physique, eq, appearance, mood, happiness。
4. 严禁诱导性词汇，3个选项各有利弊。

【输出格式】（仅返回合法 JSON，严禁 Markdown 代码块）：
{
  "scene": "场景描述...",
  "age": ${child.age},
  "options": [
    {
      "id": "A",
      "text": "选项内容（20字内）",
      "effects": { "intelligence": 5, "happiness": -2 },
      "reasoning": "选择背后的教育理念（一句话）"
    },
    {
      "id": "B",
      "text": "...",
      "effects": { "eq": 4, "physique": 2 },
      "reasoning": "..."
    },
    {
      "id": "C",
      "text": "...",
      "effects": { "happiness": 5, "intelligence": -1 },
      "reasoning": "..."
    }
  ]
}`;

  try {
    const rawText = await callAi(prompt, settings);
    const event = extractJson<LifeSimEvent>(rawText);
    if (event && event.scene && Array.isArray(event.options) && event.options.length >= 3) {
      return event;
    }
  } catch (e) {
    console.warn('AI event generation failed, using fallback:', e);
  }

  return generateProceduralFallbackEvent(child, contact);
}

/**
 * 让 AI 扮演联系人做出选择 (A / B / C)
 */
export async function getContactChoice(
  child: LifeSimChildData,
  contact: Contact,
  event: LifeSimEvent,
  settings: PhoneSettings
): Promise<'A' | 'B' | 'C'> {
  const prompt = `你正在扮演【${contact.remark || contact.name}】。
人设背景：${contact.persona || '温柔优雅'}
你和 ${settings.userNickname || '玩家'} 一起养育 ${child.childName}（${child.gender === 'male' ? '男孩' : '女孩'}，${child.age}岁）。

当前发生的育儿场景：
${event.scene}

面临的 3 个教育选择：
A. ${event.options[0]?.text || ''}（理念：${event.options[0]?.reasoning || ''}）
B. ${event.options[1]?.text || ''}（理念：${event.options[1]?.reasoning || ''}）
C. ${event.options[2]?.text || ''}（理念：${event.options[2]?.reasoning || ''}）

请根据你的人设和性格，做出你会选择的那一个。
请严格只返回选项的单个字母（A、B 或 C），不要回答任何其他文字或标点！`;

  try {
    const reply = await callAi(prompt, settings);
    const match = reply.trim().toUpperCase().match(/[A-C]/);
    if (match && (match[0] === 'A' || match[0] === 'B' || match[0] === 'C')) {
      return match[0] as 'A' | 'B' | 'C';
    }
  } catch (e) {
    console.warn('Failed to get contact choice via AI, fallback to persona heuristic:', e);
  }

  const p = (contact.persona || '').toLowerCase();
  if (p.includes('严') || p.includes('高冷') || p.includes('霸总') || p.includes('御姐')) {
    return 'A';
  }
  if (p.includes('随') || p.includes('自由') || p.includes('宅') || p.includes('幽默')) {
    return 'C';
  }
  return 'B';
}

/**
 * AI 生成结果反响（娃的反应台词 + 联系人的感悟评论）
 */
export async function getPostChoiceReactions(
  child: LifeSimChildData,
  contact: Contact,
  event: LifeSimEvent,
  userChoiceId: 'A' | 'B' | 'C',
  contactChoiceId: 'A' | 'B' | 'C',
  settings: PhoneSettings
): Promise<{ childReaction: string; contactComment: string }> {
  const userOption = event.options.find(o => o.id === userChoiceId);
  const contactOption = event.options.find(o => o.id === contactChoiceId);
  const isMatch = userChoiceId === contactChoiceId;
  const partnerName = contact.remark || contact.name || '伴侣';
  const userNick = settings.userNickname || '我';

  const prompt = `你正在为一个养娃模拟器生成选择后的【深度沉浸式对话与感悟】。

【角色设定】
娃：${child.childName}（${child.gender === 'male' ? '男孩' : '女孩'}，${child.age}岁）
AI 伴侣（${partnerName}）：
- 名字/称呼：${partnerName}
- 人设性格细节：${contact.persona || '温柔体贴，关心家庭'}
玩家（${userNick}）：${userNick} (人设：${settings.userPersonaDescription || '负责温暖'})

【刚才发生的育儿事件】
场景故事：${event.scene}
- 玩家（${userNick}）的选择：[${userChoiceId}] ${userOption?.text || ''}（理由：${userOption?.reasoning || ''}）
- 伴侣（${partnerName}）的选择：[${contactChoiceId}] ${contactOption?.text || ''}（理由：${contactOption?.reasoning || ''}）
- 两人选择结果：${isMatch ? '理念完全相同' : '理念发生分歧'}

【⚠️ 极重要反套话禁令 - 严禁模版化！】
1. 严禁出现任何通用套话，如：“看来咱们的想法很契合/心有灵犀”、“虽然想法不同但出发点都是为了孩子”、“观点不同但我尊重你”等！
2. 伴侣（${partnerName}）的感吻口吻【必须 100% 契合其人设性格 (${contact.persona || '温柔'})】：
   - 如果人设是【傲娇/高冷/霸总】：讲话要带一点小傲娇、冷峻、高标准或暗自满意的语气，决不会说肉麻的大通话！
   - 如果人设是【幽默/搞笑/话痨】：可以用调侃、搞笑、打趣玩家或吐糟现实的方式表达。
   - 如果人设是【温柔/细腻/治愈】：用极为细腻、独属于具体细节的温暖呢喃语气。
   - 如果人设是【严厉/学霸/理性】：用条理清晰、重规矩或分析利弊的口吻。
3. 伴侣的发言【必须直接提及其中的具体细节】（比如场景里提到的玩具、打针、分卷、试卷、画画、故事等具体的某个词或物），针对这次事件给出极具现场感的生动感悟！
4. 娃的反应台词【必须非常符合 ${child.age} 岁的心理形态与说话口吻】。
5. 为了杜绝机械化重复，请随机从以下三个思考切入点选一进行衍生：(1) 对孩子未来成年后的长远期许；(2) 吐槽当年自己遭遇类似事情的糗事；(3) 借机夸赞/调侃身边的伴侣玩家。
本次随机因子：${Date.now() % 1000}（请基于该随机数值赋予你感悟词汇独特的修辞与情调，杜绝任何生成重复）。

【输出格式】（只返回合法 JSON，无 Markdown 标记）：
{
  "childReaction": "娃的具体反应台词（带情绪与动作描述，符合${child.age}岁）",
  "contactComment": "${partnerName}完全符合其人设的独家感悟台词"
}`;

  try {
    const raw = await callAi(prompt, settings);
    const parsed = extractJson<{ childReaction: string; contactComment: string }>(raw);
    if (parsed && parsed.childReaction && parsed.contactComment) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to get reactions from AI, using fallbacks:', e);
  }

  // 根据伴侣人设性格与场景做个性化保底，绝对杜绝固定句式
  const persona = (contact.persona || '').toLowerCase();
  
  // 智能抽样场景主题词
  let keyword = '这件事';
  if (event.scene.includes('作业') || event.scene.includes('卷子') || event.scene.includes('考')) keyword = '学习';
  else if (event.scene.includes('画') || event.scene.includes('水彩')) keyword = '艺术画画';
  else if (event.scene.includes('鞋') || event.scene.includes('哭')) keyword = '闹脾气';
  else if (event.scene.includes('抓周') || event.scene.includes('大礼')) keyword = '抓周';
  else if (event.scene.includes('哭') || event.scene.includes('肚子')) keyword = '闹情绪';
  else if (event.scene.includes('宿') || event.scene.includes('寝室')) keyword = '宿舍人际';
  else if (event.scene.includes('工作') || event.scene.includes('主管')) keyword = '职场受挫';

  let childReaction = '';
  if (child.age <= 3) {
    const arr = [
      `“咯咯咯~ ${partnerName}和${userNick}都抱抱我！”（开心得拍起小胖手）`,
      `“唔... 眨巴着亮晶晶的大眼睛，抓着${partnerName}的衣角直笑”`,
      `“哼，小手背到身后：‘那我们要拉钩钩，一百年不许变！’”`
    ];
    childReaction = arr[Math.floor(Math.random() * arr.length)];
  } else if (child.age <= 12) {
    const arr = [
      `“我就知道！${partnerName}和${userNick}每次说得都有道理，我一定好好改！”`,
      `“原来你们在这件事上还会讨论呀，好感动，我会加油哒！”`,
      `“（用力点头）嗯！我听懂了，下次遇到${keyword}我一定更懂事！”`
    ];
    childReaction = arr[Math.floor(Math.random() * arr.length)];
  } else {
    const arr = [
      `“真没想到在这件事上，你们的默契还是这么足，受教啦。”`,
      `“听到你们的分析，原本紧绷的心情一下子放松了，谢谢爸爸妈妈。”`,
      `“其实我自己也纠结好久，你们的建议真的帮大忙了。”`
    ];
    childReaction = arr[Math.floor(Math.random() * arr.length)];
  }

  let contactComment = '';
  const randIdx = Math.floor(Math.random() * 3); // 随机模板索引

  if (isMatch) {
    if (persona.includes('霸') || persona.includes('高冷') || persona.includes('傲娇')) {
      const templates = [
        `“哼，算你眼光不错，跟我选到一块去了。对 ${child.childName} 的${keyword}问题就得这么办。”`,
        `“难得你在${keyword}上和我想到一起。看在你这次这么机灵的份上，今晚允许你多挑个菜。”`,
        `“我们的默契不需要多言。既然你同意了，那接下来的落实工作，就看你的表现了。”`
      ];
      contactComment = templates[randIdx];
    } else if (persona.includes('幽默') || persona.includes('逗') || persona.includes('宅')) {
      const templates = [
        `“哇塞 ${userNick}，你跟我想到一块去了！在${keyword}这块，咱俩简直是育儿界的爱因斯坦 and 居里夫人，英雄所见略同！”`,
        `“哈哈哈哈不愧是我的人！这神同步的选择，说明什么？说明 ${child.childName} 终究逃不出我们的联合五指山！”`,
        `“默契满分！今晚必须给 ${child.childName} 加个大鸡腿，顺便也奖励你一个大大的赞，合作愉快！”`
      ];
      contactComment = templates[randIdx];
    } else if (persona.includes('严') || persona.includes('理')) {
      const templates = [
        `“从长远来看，在${keyword}上采取这样的规矩，确实最符合其现阶段的心理发展规律。”`,
        `“很好，在${keyword}的处理上我们达成了统一战线。树立界限是培养 ${child.childName} 抗挫力的首要一步。”`,
        `“一致的家庭教育态度是极高效率的，既然思路一致，今晚我们可以制定一个详细的后续计划。”`
      ];
      contactComment = templates[randIdx];
    } else {
      const templates = [
        `“看到你也这么选，我心里顿时踏实多了... 面对 ${child.childName} 的${keyword}，能有你并肩讨论真温柔啊。”`,
        `“总觉得我们两人的心是在一处的，能听到你这么说，我想 ${child.childName} 也会感到超级幸福的。”`,
        `“我也正想这么说呢，刚才看你那副认真的侧脸，突然觉得我们一起经历${keyword}真的很美好。”`
      ];
      contactComment = templates[randIdx];
    }
  } else {
    if (persona.includes('霸') || persona.includes('高冷') || persona.includes('傲娇')) {
      const templates = [
        `“在${keyword}上，你这个选法未免有些太惯着 TA 了。不过算了，既然你坚持，这次就勉为其难听你的。”`,
        `“居然不听我的？哼，真是拿你没办法。如果下次在${keyword}上出了状况，我可是要随时接管的。”`,
        `“你的想法虽然不太成熟，但我允许你试一次。有我做保底，随便你折腾就是了。”`
      ];
      contactComment = templates[randIdx];
    } else if (persona.includes('幽默') || persona.includes('逗') || persona.includes('宅')) {
      const templates = [
        `“哈哈哈你居然选了这个？好吧好吧，不愧是 ${userNick} 充满奇思妙想的风格，那我们就坐等 ${child.childName} 会有什么爆笑反响吧！”`,
        `“哇，好一个出奇制胜！这波在${keyword}上的极限拉扯我是没想到的，不过人生嘛，多点意料之外的惊喜也挺酷！”`,
        `“行，你走你的独木桥，我过我的阳关道，咱们今晚就搬个板凳看看 ${child.childName} 到底更听谁的，赌一顿火锅！”`
      ];
      contactComment = templates[randIdx];
    } else if (persona.includes('严') || persona.includes('理')) {
      const templates = [
        `“你的出发点虽然充满了爱护，但在${keyword}的规矩和自律上有些放任。为了以后，我可能需要做些补充督导。”`,
        `“分歧是难免的，不过我依然认为放任${keyword}不利于良好习惯的建立。当然，尊重你的尝试，我们可以观察效果。”`,
        `“我们两者的方案各有利弊。既然你选择了这一条，那相关的松弛度把控就需要你多费心监督了。”`
      ];
      contactComment = templates[randIdx];
    } else {
      const templates = [
        `“虽然我和你的想法不太一样，但听你讲完理由，我也觉得确实有你的道理呢。那就照你的办法来试一试吧。”`,
        `“在${keyword}上能听到不同的声音也很好呀，这样我们能给 ${child.childName} 拼凑出一个更完整、更包容的港湾。”`,
        `“没关系呀，教育本来就没有绝对对错。有你在身侧温柔地尝试另一条路，我也想陪你一起看着 TA 慢慢长大。”`
      ];
      contactComment = templates[randIdx];
    }
  }

  return { childReaction, contactComment };
}

/**
 * 根据当前的 6 维数值动态演算性格标签（性格系统）
 */
export function updateChildPersonalityTags(attributes: {
  intelligence: number;
  physique: number;
  eq: number;
  appearance: number;
  mood: number;
  happiness: number;
}): string[] {
  const tags: string[] = [];
  const { intelligence, physique, eq, appearance, happiness } = attributes;

  // 1. 智力特征
  if (intelligence >= 75) tags.push('机灵睿智');
  else if (intelligence >= 60) tags.push('好学');
  else if (intelligence <= 35) tags.push('憨厚老实');

  // 2. 体质特征
  if (physique >= 75) tags.push('运动健将');
  else if (physique >= 60) tags.push('活力满满');
  else if (physique <= 35) tags.push('静美恬淡');

  // 3. 情商特征
  if (eq >= 75) tags.push('社交达人');
  else if (eq >= 60) tags.push('体贴懂事');
  else if (eq <= 35) tags.push('不善言辞');

  // 4. 颜值特征
  if (appearance >= 75) tags.push('颜值担当');
  else if (appearance >= 60) tags.push('眉清目秀');

  // 5. 幸福感与性格
  if (happiness >= 75) tags.push('阳光开朗');
  else if (happiness <= 35) tags.push('敏感忧郁');

  // 兜底标签，防空
  if (tags.length === 0) {
    tags.push('乖巧', '单纯');
  } else if (tags.length === 1) {
    tags.push('平和');
  }

  // 每次取前三个最显著的性格特质，构成动态发展的性格特征
  return tags.slice(0, 3);
}

/**
 * 智能生成深度定制、感动温馨的《宝贝成长报告与父母寄语》（AI 报告系统）
 */
export async function generateAiGrowthReport(
  child: LifeSimChildData,
  contact: Contact,
  settings: PhoneSettings
): Promise<string> {
  const fb = child.familyBackground || { financial: '中产小康', atmosphere: '温暖包容' };
  const contactName = contact.remark || contact.name;
  const userName = settings.userNickname || '我';
  const milestoneList = child.logs
    .filter(l => l.scene.includes('【'))
    .map(l => `* ${l.age}岁经历：${l.scene.split('。')[0]} (你选了：${l.userChoiceText}，伴侣选了：${l.contactChoiceText})`)
    .join('\n');

  const prompt = `你正在为养娃模拟器生成一份高度定制、感动温馨的《宝贝成长报告与父母寄语》。

【娃的信息】
名字：${child.childName}
性别：${child.gender === 'male' ? '男孩' : '女孩'}
当前年龄：${child.age} 岁
性格倾向：${child.personalityTags.join('、')}
六维素养：智力${child.attributes.intelligence} 体质${child.attributes.physique} 情商${child.attributes.eq} 颜值${child.attributes.appearance} 幸福指数${child.attributes.happiness}

【父母信息】
玩家：${userName}
伴侣（即联系人）：${contactName} (性格偏向：${contact.persona || '温柔体贴'})

【家庭背景设定】
家境：${fb.financial} | 育儿氛围：${fb.atmosphere}

【重大里程碑纪实】
${milestoneList || '成长还在初期，暂无重大里程碑。'}

请根据这些真实发生的数值与事件，以玩家 ${userName} 与 伴侣 ${contactName} 两个家长的口吻，为 ${child.childName} 撰写一封极其真挚、字字动人、画面感极强的成长报告。
1. 报告必须包含以下清晰板块：
   - 【🧸 成长回忆序章】：用真诚细腻的口吻，回顾抚育 TA 至今的喜悦（提到家庭氛围和家境给 TA 带来的成长熏陶）。
   - 【📊 核心素养特长分析】：根据 6 维最高和最突出的几项数值，赞扬 TA 拥有的闪光点，夸赞 TA 的【${child.personalityTags.join('、')}】性格。
   - 【💌 父母联名成长寄语】：用极为温馨、治愈的言辞给娃的未来送上最诚挚的期许。
   - 【合署】：
     “爱你的爸爸/妈妈：${userName} & ${contactName} 
      合署于：WePhone 养娃模拟工坊”

2. 语气切忌套路、切忌使用 AI 常用空套词。请深度契合伴侣性格，表现出两位家长在这段养育旅程中的默契。字数在 400~600 字左右。
3. 请直接返回 纯文本 Markdown 格式内容，开头不要有任何 "好的"、"这是你要的" 等废话，也不要包含任何 markdown 代码块标记。`;

  try {
    return await callAi(prompt, settings);
  } catch (e) {
    console.warn('Failed to generate AI report, fallback to local text:', e);
    throw e;
  }
}

/**
 * 智能生成适合孩子当前学龄、基于实际属性的随机作业本（HW 签字系统）
 */
export function generateHomeworkAssignment(
  child: LifeSimChildData
): { subject: string; assignmentName: string; score: string; grade: '优' | '良' | '中' | '需努力'; teacherComment: string } {
  const age = child.age;
  const intel = child.attributes.intelligence || 50;

  // 根据阶段决定科目和题目
  let subject = '语文';
  let assignmentName = '《随堂测验》';
  
  if (age >= 6 && age <= 11) {
    // 小学
    const pools = [
      { sub: '语文', name: '《小学汉字听写拼音本》' },
      { sub: '语文', name: '《背诵古诗两首（静夜思、春晓）》' },
      { sub: '数学', name: '《100以内口算加减法速算册》' },
      { sub: '数学', name: '《乘法九九表填空小测验》' },
      { sub: '英语', name: '《26个英文字母描红与连线》' },
      { sub: '美术', name: '《我最爱的爸爸妈妈手绘蜡笔画》' }
    ];
    const item = pools[Math.floor(Math.random() * pools.length)];
    subject = item.sub;
    assignmentName = item.name;
  } else if (age >= 12 && age <= 14) {
    // 初中
    const pools = [
      { sub: '语文', name: '《初中现代文阅读与细节理解》' },
      { sub: '数学', name: '《一元二次方程根的判别式自测》' },
      { sub: '数学', name: '《初二三角形全等辅助线证明作业》' },
      { sub: '英语', name: '《完形填空与初中高频词汇听写》' },
      { sub: '物理', name: '《滑动摩擦力测量实验随堂作业》' },
      { sub: '历史', name: '《中国古代丝绸之路手抄报》' }
    ];
    const item = pools[Math.floor(Math.random() * pools.length)];
    subject = item.sub;
    assignmentName = item.name;
  } else if (age >= 15 && age <= 18) {
    // 高中
    const pools = [
      { sub: '语文', name: '《文言文虚词翻译与诗歌鉴赏作业》' },
      { sub: '数学', name: '《导数与单调性区间解析压轴题》' },
      { sub: '物理', name: '《电磁感应双导轨切割模型大题》' },
      { sub: '化学', name: '《有机化学物推断与实验工艺流程》' },
      { sub: '历史', name: '《辛亥革命历史影响开放性论述》' },
      { sub: '英语', name: '《高考模拟阅读理解与短文纠错》' }
    ];
    const item = pools[Math.floor(Math.random() * pools.length)];
    subject = item.sub;
    assignmentName = item.name;
  }

  // 成绩直接基于智力属性 (intel) 拟真随机算出
  let scoreNum = 60;
  let grade: '优' | '良' | '中' | '需努力' = '良';
  let teacherComment = '完成情况良好，望继续保持。';

  if (intel >= 80) {
    scoreNum = Math.floor(Math.random() * 5) + 96; // 96-100
    grade = '优';
    const comments = [
      '思维逻辑极度清晰，解题书写非常工整，是班级的骄傲！',
      '卷面整洁如印刷，毫无错漏，堪称典范！继续保持！',
      '对重难点吃得非常透，思路广阔，老师给满分！'
    ];
    teacherComment = comments[Math.floor(Math.random() * comments.length)];
  } else if (intel >= 60) {
    scoreNum = Math.floor(Math.random() * 11) + 85; // 85-95
    grade = '优';
    const comments = [
      '基本功很扎实，个别计算细节略显粗心。加油！',
      '理解得很快，完成度很高，是非常聪明的孩子。',
      '思路是完全正确的，下次记得仔细复查哟。'
    ];
    teacherComment = comments[Math.floor(Math.random() * comments.length)];
  } else if (intel >= 40) {
    scoreNum = Math.floor(Math.random() * 15) + 70; // 70-84
    grade = '良';
    const comments = [
      '基础题目掌握到位，但是大题和拓展题略显吃力。',
      '学习态度端正，字迹比较秀气。希望课后能多做巩固。',
      '基本合格，只要多花些心思在细节上，一定会有很大进步。'
    ];
    teacherComment = comments[Math.floor(Math.random() * comments.length)];
  } else {
    scoreNum = Math.floor(Math.random() * 20) + 50; // 50-69
    grade = scoreNum >= 60 ? '中' : '需努力';
    const comments = [
      '知识点有些脱节，上课有走神迹象。希望家长在家多督促辅导。',
      '错题较多，基础概念还未完全理解，请课后务必订正。',
      '要按时完成作业哦，书写需要加强端正，多加油！'
    ];
    teacherComment = comments[Math.floor(Math.random() * comments.length)];
  }

  return {
    subject,
    assignmentName,
    score: scoreNum.toString() + '分',
    grade,
    teacherComment
  };
}

/**
 * AI 伴侣针对玩家的家长签字评语，写出完美贴合人设的互动感悟（AI 签字）
 */
export async function getAiPartnerHomeworkFeedback(
  child: LifeSimChildData,
  contact: Contact,
  assignment: { subject: string; assignmentName: string; score: string; grade: string; teacherComment: string },
  userComment: string,
  settings: PhoneSettings
): Promise<string> {
  const partnerName = contact.remark || contact.name || '伴侣';
  const userNick = settings.userNickname || '我';

  const prompt = `你正在为一个养娃模拟器生成AI伴侣给孩子作业本签字时的【个性化短评语】。

【角色设定】
娃：${child.childName}（${child.gender === 'male' ? '男孩' : '女孩'}，${child.age}岁）
AI 伴侣（${partnerName}）：
- 称呼：${partnerName}
- 人设性格细节：${contact.persona || '温柔体贴，关心家庭'}
玩家（另一个家长，${userNick}）：${userNick}

【孩子的作业本情况】
- 课程科目：${assignment.subject}
- 作业名称：${assignment.assignmentName}
- 成绩等级：${assignment.score} (${assignment.grade})
- 老师评语：${assignment.teacherComment}

【玩家（你）刚刚在上面写的评语】：
“${userComment || '已阅，继续加油！'}”

请以 ${partnerName} 的第一人称口吻，给孩子这份作业也写下一行简短的家长签字意见：
1. 语气必须 100% 契合其人设特征（比如傲娇会嘴硬心软、幽默会打趣玩家、霸总会表现得不可一世、温柔则会细腻鼓励）。
2. 字数不要长，严格控制在 35 - 75 字以内。
3. 务必结合“作业科目（${assignment.subject}）”、“成绩（${assignment.score}）”或“玩家的评语”，显得非常自然有来有回。
4. 直接输出评语内容，不要带有任何“好的”、“伴侣的评语：”或双引号等不相干废话。`;

  try {
    const res = await callAi(prompt, settings);
    return res.trim().replace(/^["'「]+|["'」]+$/g, '');
  } catch (err) {
    console.warn('AI Homework feedback failed, falling back:', err);
    // 拟真兜底
    const p = (contact.persona || '').toLowerCase();
    if (p.includes('霸') || p.includes('高冷') || p.includes('傲娇')) {
      return `不愧是我和 ${userNick} 的宝贝，${assignment.subject} 拿 ${assignment.score} 也是理所当然的。你写的那个评语太死板啦，以后我来教 TA 签字。`;
    } else if (p.includes('幽默') || p.includes('逗')) {
      return `哈哈，${assignment.score} 相当不错嘛！比我当年强多了。看在你爸爸/妈妈 ${userNick} 夸得这么起劲的份上，今晚吃大餐庆祝！`;
    } else if (p.includes('严') || p.includes('理')) {
      return `收到。${assignment.subject} 成绩还可以，不过老师说的粗心问题依然存在。同意 ${userNick} 的看法，后续需要继续巩固错题。`;
    } else {
      return `宝贝真棒！看到你取得 ${assignment.score} 这么棒的成绩，我和 ${userNick} 都超级开心的。奖励一个甜甜的拥抱，继续快快乐乐成长！`;
    }
  }
}

/**
 * 智能生成两名孩子之间的趣味手足互动事件（双向互动、属性双修正）
 */
export async function generateSiblingEvent(
  childA: LifeSimChildData,
  childB: LifeSimChildData,
  contact: Contact,
  settings: PhoneSettings
): Promise<LifeSimSiblingEvent> {
  const partnerName = contact.remark || contact.name || '伴侣';
  const userNick = settings.userNickname || '我';

  const prompt = `你正在为一个养娃模拟器生成两个孩子（手足、兄弟姐妹）之间的【日常互动/冲突/温馨互动事件】。

【家庭角色】
- 家长：${userNick}（玩家）与 ${partnerName}（AI伴侣）
- 伴侣性格人设：${contact.persona || '温柔细腻，关爱家庭'}
- 孩子 A：${childA.childName}（${childA.gender === 'male' ? '男孩' : '女孩'}，${childA.age}岁，性格标签：${childA.personalityTags.join('、')}）
- 孩子 B：${childB.childName}（${childB.gender === 'male' ? '男孩' : '女孩'}，${childB.age}岁，性格标签：${childB.personalityTags.join('、')}）

请根据两名孩子的“年龄差、性别、性格特征”生成一个真实、具有极强故事代入感的手足互动场景（字数100~200字之间）。
并给出三个不同的【应对选项】。这三个选项代表你们作为父母的教育和引导态度，它们会对两位孩子各自产生不同的“智力、体质、情商、颜值、心情、幸福感”增减效果（范围在 -10 到 +15 之间）。

请【务必】以如下 JSON 格式返回：
{
  "scene": "描述具体的互动情境，如大宝带着小宝画画，或者两个孩子在抢同一个玩具，或者大宝给考试失利的小宝写安慰信等，极具细节与烟火气。",
  "options": [
    {
      "id": "A",
      "text": "父母的应对方案 A（例如：温柔安抚，引导分享）",
      "effectsA": {"eq": 5, "happiness": 10},
      "effectsB": {"eq": 8, "happiness": 8},
      "reasoning": "为什么这样改变属性"
    },
    {
      "id": "B",
      "text": "父母的应对方案 B（例如：严格立规矩，各打五十大板）",
      "effectsA": {"eq": -2, "happiness": -3},
      "effectsB": {"eq": -1, "happiness": -3},
      "reasoning": "为什么这样改变属性"
    },
    {
      "id": "C",
      "text": "父母的应对方案 C（例如：加入他们的游戏，变成全家欢闹）",
      "effectsA": {"physique": 5, "happiness": 12},
      "effectsB": {"physique": 5, "happiness": 12},
      "reasoning": "为什么这样改变属性"
    }
  ]
}

要求：
1. 属性改变的键必须是：intelligence, physique, eq, appearance, mood, happiness 中的一个或多个，拼写必须完全正确。
2. 直接返回该规范 JSON，不要有任何 \`\`\`json 标记，开头结尾不要有任何闲聊废话。`;

  try {
    const res = await callAi(prompt, settings);
    const parsed = extractJson<any>(res);
    if (parsed && parsed.scene && Array.isArray(parsed.options) && parsed.options.length >= 2) {
      return {
        childAId: childA.id || 'child_a',
        childBId: childB.id || 'child_b',
        childAName: childA.childName,
        childBName: childB.childName,
        scene: parsed.scene,
        options: parsed.options
      };
    }
  } catch (err) {
    console.warn('AI Sibling event generation failed, using fallback:', err);
  }

  // 极为丰富的程序化兜底手足事件
  return generateSiblingFallbackEvent(childA, childB);
}

/**
 * 伴侣针对玩家做出的手足事件处理选择，给出贴合人设和剧情的精彩短评语
 */
export async function getSiblingPostChoiceReaction(
  event: LifeSimSiblingEvent,
  choiceId: 'A' | 'B' | 'C',
  contact: Contact,
  settings: PhoneSettings
): Promise<string> {
  const partnerName = contact.remark || contact.name || '伴侣';
  const userNick = settings.userNickname || '我';
  const selectedOption = event.options.find(o => o.id === choiceId);

  const prompt = `两个孩子之间发生了以下互动事件：
“${event.scene}”

作为家长的玩家选择的处理方式是：
“${selectedOption?.text || '各自冷静，顺其自然'}”

请以你（${partnerName}）作为另一位家长的第一人称口吻，对玩家的这次教育抉择进行实时反馈、点评或默契吐露：
1. 语气必须 100% 契合你的人设个性特点（傲娇会嘴硬，严厉会审慎，温柔会夸玩家周到，幽默会调侃大笑）。
2. 字数控制在 45 ~ 85 字以内，显得短小精悍、真实。
3. 直接输出文字，开头不要有“好的”、“我的回复：”等不相干的多余词汇，不要有双引号。`;

  try {
    const res = await callAi(prompt, settings);
    return res.trim().replace(/^["'「]+|["'」]+$/g, '');
  } catch (err) {
    // 程序化人设保底
    const p = (contact.persona || '').toLowerCase();
    const childNames = `${event.childAName}和${event.childBName}`;
    if (p.includes('霸') || p.includes('高冷') || p.includes('傲娇')) {
      return `哼，算你处理得体。这俩小家伙要是天天这么闹腾，我可要给他们报两个礼仪班了。不过看在你这么有耐心的份上，这次就听你的。`;
    } else if (p.includes('幽默') || p.includes('逗')) {
      return `哈哈，不愧是我的黄金搭档！你这一招简直是神来之笔。看他们俩现在勾肩搭背的样子，一准是在密谋今天向我们多要一颗糖吃。`;
    } else if (p.includes('严') || p.includes('理')) {
      return `分析得非常有道理。手足交往的关键在于公平与边界感，你刚才的表态能很好的引导他们建立物权意识。在教育孩子上，你真的很让人安心。`;
    } else {
      return `看着 ${childNames} 这么亲密的样子，我感觉心里暖洋洋的。你刚才处理得太温柔了，大宝也学着你大度，小宝也懂得了体贴。有你在身边，这个家真的好幸福。`;
    }
  }
}

/**
 * 纯本地运行的、生动高水准的保底手足事件生成器
 */
function generateSiblingFallbackEvent(
  childA: LifeSimChildData,
  childB: LifeSimChildData
): LifeSimSiblingEvent {
  const diffAge = Math.abs(childA.age - childB.age);
  const older = childA.age >= childB.age ? childA : childB;
  const younger = childA.age < childB.age ? childA : childB;
  
  let scene = '';
  let options: LifeSimSiblingEventOption[] = [];

  if (diffAge <= 2) {
    // 年龄接近（两小无猜、抢玩具高发期）
    scene = `午后，${older.childName}（${older.age}岁）和${younger.childName}（${younger.age}岁）在客厅抢夺同一个粉色小兔子公仔。两人谁都不愿意放手，眼看着小兔子耳朵都要被扯断了，两人都有些急眼了。`;
    options = [
      {
        id: 'A',
        text: '公平轮流：拿来计时沙漏，规定每人玩 15 分钟，交换时可以获得一个小贴纸。',
        effectsA: { eq: 6, happiness: 5 },
        effectsB: { eq: 6, happiness: 5 },
        reasoning: '培养了孩子公平轮换与遵守协议的契约精神。'
      },
      {
        id: 'B',
        text: '各打五十大板：没收玩偶收进柜子，告诉他们既然学不会分享，今天谁都不能玩。',
        effectsA: { eq: -2, happiness: -5, mood: -8 },
        effectsB: { eq: -2, happiness: -5, mood: -8 },
        reasoning: '通过暂时剥夺物权进行严肃惩戒，但会让孩子有些伤心。'
      },
      {
        id: 'C',
        text: '移花接木：拿来另外一只遥控小赛车，邀请他们俩一起组成“赛车追逐兔子”的联合小游戏。',
        effectsA: { eq: 4, intelligence: 5, happiness: 10 },
        effectsB: { eq: 4, intelligence: 5, happiness: 10 },
        reasoning: '发挥创意扩展情景，让两兄弟姐妹一起参与到更大的游戏机制中。'
      }
    ];
  } else {
    // 年龄差大（哥哥姐姐带弟弟妹妹，或代沟摩擦）
    scene = `晚饭后，${older.childName}（${older.age}岁）正坐在书桌前认真写作业。而调皮的${younger.childName}（${younger.age}岁）拿着画笔蹦蹦跳跳地跑进来，非要在哥哥/姐姐的练习册上盖小恐龙印章，干扰了大宝的学习。`;
    options = [
      {
        id: 'A',
        text: '划清边界：将小宝抱走，温柔但坚定地告诉小宝“大宝正在做重要的事情，现在我们不能打扰大宝，大宝写完我们再一起玩”。',
        effectsA: { eq: 5, happiness: 6 },
        effectsB: { eq: 4, happiness: -2 },
        reasoning: '维护了大宝的个人学习界限，小宝虽有失落但学会了尊重他人时间。'
      },
      {
        id: 'B',
        text: '大宝谦让：劝导大宝“你是哥哥/姐姐，你就让着弟弟/妹妹玩一下嘛，不要这么计较”。',
        effectsA: { eq: -5, happiness: -10, mood: -10 },
        effectsB: { eq: 2, happiness: 5 },
        reasoning: '一味让大宝退让容易引发逆反心理与委屈感，对二者长期和谐不利。'
      },
      {
        id: 'C',
        text: '趣味拜师：提议大宝当小老师，在草稿本上给小宝留出一块“小恐龙专属画板”，大宝每写完一道题就负责给小宝批改一下涂鸦。',
        effectsA: { eq: 10, intelligence: 5, happiness: 8 },
        effectsB: { eq: 8, intelligence: 2, happiness: 10 },
        reasoning: '角色扮演赋予大宝责任感和主导地位，将干扰成功转化为融洽的情商合作游戏。'
      }
    ];
  }

  return {
    childAId: childA.id || 'child_a',
    childBId: childB.id || 'child_b',
    childAName: childA.childName,
    childBName: childB.childName,
    scene,
    options
  };
}


