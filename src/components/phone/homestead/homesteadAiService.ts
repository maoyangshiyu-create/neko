import { Contact, PhoneSettings, WorldBookItem } from '../../../types/phone';
import { CharacterState, Furniture, HomeType } from './homesteadTypes';
import { isFamilyContact } from './homesteadClassifier';

// URL 规范化
function normalizeUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

// 获取角色在家庭场景下的称谓/人设概要
function getCharacterRoleTag(contact: Contact, homeType: HomeType): string {
  const name = contact.remark || contact.name;
  if (contact.relationship === 'married') return '伴侣/爱人';
  if (contact.relationship === 'dating' || contact.relationship === 'engaged') return '恋人/对象';
  if (isFamilyContact(contact)) {
    if (name.includes('妈') || (contact.persona || '').includes('母亲') || (contact.persona || '').includes('妈妈')) return '妈妈/母亲';
    if (name.includes('爸') || (contact.persona || '').includes('父亲') || (contact.persona || '').includes('爸爸')) return '爸爸/父亲';
    if (name.includes('姐') || (contact.persona || '').includes('姐姐')) return '姐姐';
    if (name.includes('妹') || (contact.persona || '').includes('妹妹')) return '妹妹';
    if (name.includes('哥') || (contact.persona || '').includes('哥哥')) return '哥哥';
    if (name.includes('弟') || (contact.persona || '').includes('弟弟')) return '弟弟';
    if (name.includes('爷') || name.includes('姥爷') || (contact.persona || '').includes('爷爷') || (contact.persona || '').includes('外公')) return '长辈/爷爷';
    if (name.includes('奶') || name.includes('姥姥') || (contact.persona || '').includes('奶奶') || (contact.persona || '').includes('外婆')) return '长辈/奶奶';
    return '家人/亲属';
  }
  return homeType === 'marital' ? '好友/客人' : '亲友/好友';
}

// 离线高保真全员多角色智能台词生成器（保障在断网或无API额度时，所有在场家人/客人都能说出符合各自人设的台词）
function generateFallbackGroupDialogue(
  furniture: Furniture,
  homeType: HomeType,
  characters: CharacterState[],
  userName: string
): string {
  const charLines: string[] = [];

  const getSceneHeader = () => {
    switch (furniture.type) {
      case 'tea_table':
        return `大家围坐在客厅实木八仙大圆桌旁，泡上一壶热气腾腾的清茶，茶香弥漫，欢声笑语不断：`;
      case 'tv_cabinet':
        return `客厅彩色电视机里正播放着热闹的合家欢节目，屏幕的光晕映照在大家脸上，大家围坐在一起乐呵呵地讨论着：`;
      case 'kitchen_stove':
        return `厨房灶台上慢火炖着浓郁的鲜美靓汤，咕嘟咕嘟翻滚着香气，大家在厨房周围忙前忙后、准备开饭：`;
      case 'family_photo':
        return `墙上的金色相框里定格着大家最灿烂的合影，一家人驻足在相框前，端详着相片里温暖的点滴：`;
      case 'sofa':
        return `大家在宽敞柔软的布艺沙发上并肩坐下，室内洋溢着轻松惬意的温情：`;
      case 'bookshelf':
        return `书架前散发着淡淡的书卷香气，大家一起翻看着书页和珍藏的旧相册：`;
      case 'dining_table':
        return `餐桌上摆满了热气腾腾的美味家常菜肴，烛光与灯光交相辉映，大家欢聚一堂：`;
      case 'coffee_machine':
        return `咖啡机萃取着香醇浓郁的咖啡，香气飘满了整个屋子，大家围在吧台旁品尝：`;
      case 'crib':
        return `小婴儿床里的宝宝正挥着小手，大家轻轻围在床边，眼神里满是宠溺与呵护：`;
      default:
        return `大家在温馨的家中聚在一起，分享着当下的美好时光：`;
    }
  };

  characters.forEach(char => {
    const name = char.name;
    const persona = char.contact?.persona || '';
    const isMom = name.includes('妈') || persona.includes('母亲') || persona.includes('妈妈');
    const isDad = name.includes('爸') || persona.includes('父亲') || persona.includes('爸爸');
    const isSister = name.includes('姐') || name.includes('妹') || persona.includes('姐') || persona.includes('妹');
    const isBrother = name.includes('哥') || name.includes('弟') || persona.includes('哥') || persona.includes('弟');
    const isSpouse = char.relationship === 'married' || char.relationship === 'dating';

    let line = '';

    switch (furniture.type) {
      case 'tea_table':
        if (isMom) line = `“热茶刚沏好，慢点喝别烫着，我还特地洗了新鲜水果，快尝尝～”`;
        else if (isDad) line = `“一家人齐齐整整坐在一起喝杯茶、聊聊天，心里比什么都踏实。”`;
        else if (isSister) line = `“好香的清茶呀！我还拿了瓜子和点心，今天谁也别急着走，多聊会儿！”`;
        else if (isBrother) line = `“给我也倒一杯～最近大家都在忙，难得聚得这么齐整！”`;
        else if (isSpouse) line = `“和你还有大家坐在一起喝茶慢度时光，感觉特别温馨舒心。”`;
        else line = `“这里的气氛太好太温暖了，和大家在一起喝茶真是一件美事！”`;
        break;

      case 'tv_cabinet':
        if (isMom) line = `“这个家庭剧演得真逗乐，快坐过来，给你留了最好的沙发位置！”`;
        else if (isDad) line = `“把声音稍微调大一点点，这个小品当年可是经典，快看那个包袱！”`;
        else if (isSister) line = `“哈哈哈哈这也太搞笑了！来来来，爆米花和零食分你一半，边吃边看～”`;
        else if (isBrother) line = `“精彩镜头要来了！大家别眨眼，等会儿还有好看的球赛集锦呢！”`;
        else if (isSpouse) line = `“靠在我身边看吧，只要和你们在一起，看什么节目都觉得特别有意思。”`;
        else line = `“哈哈有大家一起陪着看电视，比一个人看有意思多了，好热闹！”`;
        break;

      case 'kitchen_stove':
        if (isMom) line = `“排骨玉米靓汤慢火炖了足足两个小时，汤浓味鲜，我先给你盛一小碗尝尝咸淡！”`;
        else if (isDad) line = `“菜马上炒好，我来帮着端菜盛饭，大家快去洗手，准备开饭啦！”`;
        else if (isSister) line = `“闻到厨房飘出来的香味我都快流口水啦，今天的手艺绝对是一绝！”`;
        else if (isBrother) line = `“我把餐具和筷子都摆好了，今天我负责帮大家盛饭盛汤！”`;
        else if (isSpouse) line = `“厨房里热气腾腾的真有烟火气，尝尝看合不合你的胃口～”`;
        else line = `“哇！大厨这手艺简直太绝了，今天真是大饱口福啦！”`;
        break;

      case 'family_photo':
        if (isMom) line = `“看看这张合影，大家笑得多开心呀。不管走多远，家永远是最温暖的地方。”`;
        else if (isDad) line = `“时光过得真快啊，看着相框里大家的面孔，心里满是欣慰。”`;
        else if (isSister) line = `“哈哈看我那时候的发型，当年拍照还争抢着站在中间呢，满满的珍贵回忆！”`;
        else if (isBrother) line = `“等过几天天气好，咱们全家人再去院子里拍一张最新的全家福合影！”`;
        else if (isSpouse) line = `“相框里记录着一路走来的温暖点滴，有大家在身边，就是最大的幸福。”`;
        else line = `“相片里大家洋溢着幸福的笑容，真让人羡慕这样温暖有爱的一家人！”`;
        break;

      case 'sofa':
        if (isMom) line = `“在外忙碌辛苦了，快靠在沙发上多歇会儿，抱枕给你垫着后背。”`;
        else if (isDad) line = `“坐下歇歇脚，回到家里就彻底放松，什么烦恼都抛到脑后。”`;
        else if (isSister) line = `“大家挤在一排沙发上聊天最舒服了，咱们聊聊最近发生的趣事呗！”`;
        else if (isBrother) line = `“舒舒服服地靠一会儿，今天谁也别站着，好好享受家庭时光。”`;
        else if (isSpouse) line = `“靠在我的肩头休息一下吧，把一天的疲惫都安心放下。”`;
        else line = `“这大沙发又软又舒服，和大家坐在一起聊天真是太惬意了！”`;
        break;

      case 'bookshelf':
        if (isMom) line = `“这里还收着大家以前的书卷和相册呢，每本我都擦得干干净净。”`;
        else if (isDad) line = `“多读读书、多翻翻旧相册，静得下心来，心里自有一方天地。”`;
        else if (isSister) line = `“你看这本经典老相册，小时候好多好玩的黑历史都在里面呢，快看这张！”`;
        else if (isBrother) line = `“这里居然有这本藏书！大家有空真该一起读读，特别有启发。”`;
        else if (isSpouse) line = `“午后微光洒在书架前，和大家一起翻阅书页，时光静好如诗。”`;
        else line = `“书架上的藏书真丰富，伴着淡淡书香和大家畅谈，感觉真棒！”`;
        break;

      case 'dining_table':
        if (isMom) line = `“大家快动筷子！专门做了你们爱吃的几样家常菜，在家里一定要吃得饱饱的！”`;
        else if (isDad) line = `“来，大家举杯祝愿！一家人团圆和睦，日子越过越红火！”`;
        else if (isSister) line = `“哇～全是我最爱吃的菜，那我就不客气先开动啦，大家都多吃点！”`;
        else if (isBrother) line = `“这桌菜太丰盛了，辛苦各位大厨啦，今天大家都要吃得开开心心！”`;
        else if (isSpouse) line = `“给你夹了你最喜欢的菜肴，多尝尝这个，味道特别好。”`;
        else line = `“大家聚在一起吃饭的气氛太赞了，干杯干杯！”`;
        break;

      default:
        line = `“大家聚在一起就是最开心的时刻，真好！”`;
        break;
    }

    charLines.push(`【${name}】：${line}`);
  });

  return `${getSceneHeader()}\n\n${charLines.join('\n')}`;
}

// 统一的家园全员/多人多角色互动生成入口
export async function callHouseholdGroupInteractionAI({
  furniture,
  homeType,
  characters,
  settings,
  worldBooks = []
}: {
  furniture: Furniture;
  homeType: HomeType;
  characters: CharacterState[];
  settings: PhoneSettings;
  worldBooks?: WorldBookItem[];
}): Promise<string> {
  const userName = settings.userNickname || '我';
  const presentNpcs = characters.filter(c => !!c.contact);

  // 如果没有人在场，输出 solo 悠闲描写
  if (presentNpcs.length === 0) {
    switch (furniture.type) {
      case 'sofa':
        return `你静静坐到了柔软的沙发上，窗外微风徐徐，在温暖的客厅里独享片刻的安宁与舒适。`;
      case 'tea_table':
        return `你坐在实木八仙大圆桌旁，为自己沏上一壶清冽的热茶，茶香四溢，满室温馨。`;
      case 'tv_cabinet':
        return `你打开彩色电视机，屏幕上映出经典的节目画面，客厅里回荡着热闹的声音。`;
      case 'kitchen_stove':
        return `厨房灶台上小火煨着热汤，香气扑鼻，满屋子都是家的烟火气。`;
      case 'family_photo':
        return `墙上的金色相框里定格着大家最灿烂纯真的笑脸，凝视着过去的温馨回忆，心里暖洋洋的。`;
      case 'bookshelf':
        return `你轻轻抽出一本精装书卷，在书架旁静静品读，享受静谧悠闲的独处时光。`;
      case 'dining_table':
        return `餐桌已摆好精致餐具，烛光与灯影在桌前摇曳，等待着下一次欢聚。`;
      case 'coffee_machine':
        return `意式咖啡机萃取出一杯浓醇的咖啡，香气四溢。`;
      case 'crib':
        return `小婴儿床静静地摆在房间一隅，轻摇摇篮，满室安宁。`;
      default:
        return `你在家中享受着温馨惬意的时光。`;
    }
  }

  // 构建在场全员的人设与身份清单
  const charactersDesc = presentNpcs.map((n, i) => {
    const c = n.contact!;
    const roleTag = getCharacterRoleTag(c, homeType);
    return `${i + 1}. 【${n.name}】（身份关系：${roleTag}；性格人设：${c.persona || '性格温和善良'}）`;
  }).join('\n');

  const furnitureName = furniture.name;
  const activityDesc = furniture.interactLabel;

  const systemPrompt = `你正在为一个治愈系像素家园系统生成一段【全家/全员在场共同互动的情景对话】。
场景地点：【${homeType === 'family' ? '亲人小筑（家庭大宅）' : '婚后爱巢（温馨小家）'}】
当前互动的家具/活动：【${furnitureName}】（${activityDesc}）
当前参与互动的玩家：【${userName}】

当前在场并一同参与本次活动的所有家庭成员/同住人名单（共 ${presentNpcs.length} 位）：
${charactersDesc}

【极其重要的核心要求 - 违反即严重错误】：
1. 【全员参与原则】：当前在场的【每一位角色（共 ${presentNpcs.length} 人）】必须全部参与本次互动！绝对不允许只挑选其中一个人说话，必须让所有在场人员依次发言互动！
2. 【人设与身份契合】：每位角色必须严格契合自己的长辈/晚辈/伴侣/好友身份与性格特质。妈妈关切细致、爸爸沉稳慈爱、兄弟姐妹活泼亲昵、伴侣深情体贴、朋友热情开朗。
3. 【输出格式规范】：
   - 第一段：用 1~2 句话生动描绘大家围聚在【${furnitureName}】前一起活动的温馨画面与动作氛围（例如大家围坐倒茶、端菜洗手、挤在沙发、看电视笑语等）。
   - 空一行后，依次输出在场【每一位角色】的一句生动台词，每人占一行，格式必须严格为：
     【角色名】：“台词内容”
4. 语言风格：充满家庭温情、烟火气与生活趣味，口语自然，严禁任何 AI 助手腔或机械重复。`;

  // 1. 如果配置了自定义 API Key
  if (settings.apiKey && settings.apiKey.trim().length > 0) {
    try {
      const base = normalizeUrl(settings.apiUrl);
      const endpoint = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: settings.modelName || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `玩家【${userName}】与在场的所有人（${presentNpcs.map(n => n.name).join('、')}）一起走到了【${furnitureName}】前触发了【${activityDesc}】，请立即生成大家所有人一起热闹温馨互动的场景与全员台词。` }
          ],
          temperature: 0.85
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || '';
        if (content.trim()) {
          return content.trim();
        }
      }
    } catch (e) {
      console.warn('Custom API household interaction failed, switching to proxy/fallback:', e);
    }
  }

  // 2. 如果未配置自定义 Key 或自定义 Key 失败，调用服务端代理 `/api/ai/chat`
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        messages: [
          { role: 'user', content: `玩家【${userName}】与在场的所有人（${presentNpcs.map(n => n.name).join('、')}）一起走到了【${furnitureName}】前触发了【${activityDesc}】，请立即生成大家所有人一起热闹温馨互动的场景与全员台词。` }
        ],
        temperature: 0.85
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.reply || '';
      if (content.trim()) {
        return content.trim();
      }
    }
  } catch (e) {
    console.warn('Proxy API household interaction failed, switching to fallback generator:', e);
  }

  // 3. 高保真本地智能降级生成器（确保 100% 每个人都发言）
  return generateFallbackGroupDialogue(furniture, homeType, presentNpcs, userName);
}
