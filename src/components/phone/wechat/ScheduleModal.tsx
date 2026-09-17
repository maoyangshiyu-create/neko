import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Sparkles, RefreshCw, X, Sun, Moon, Coffee, Briefcase, Smile, CheckCircle2, Loader2 } from 'lucide-react';
import { Contact, DailyScheduleItem, PhoneSettings, DIYTheme } from '../../../types/phone';
import { Avatar } from '../Avatar';
import { getBubbleBgStyle } from '../../../utils/bubbleStyle';
import { getTodayDateString, getWeekDayString } from '../../../utils/dateHelper';

interface ScheduleModalProps {
  contact: Contact;
  settings: PhoneSettings;
  activeTheme?: DIYTheme | null;
  onClose: () => void;
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
}

// 默认各时段配置
interface DefaultPeriodTemplate {
  timeRange: string;
  startHour: number;
  endHour: number;
  periodName: string;
  icon: React.ReactNode;
}

const PERIOD_TEMPLATES: DefaultPeriodTemplate[] = [
  { timeRange: '06:30 - 08:30', startHour: 6, endHour: 8, periodName: '清晨唤醒', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
  { timeRange: '08:30 - 12:00', startHour: 8, endHour: 12, periodName: '上午日程', icon: <Briefcase className="w-3.5 h-3.5 text-blue-500" /> },
  { timeRange: '12:00 - 14:00', startHour: 12, endHour: 14, periodName: '午餐小憩', icon: <Coffee className="w-3.5 h-3.5 text-emerald-500" /> },
  { timeRange: '14:00 - 18:00', startHour: 14, endHour: 18, periodName: '午后活动', icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" /> },
  { timeRange: '18:00 - 20:30', startHour: 18, endHour: 20, periodName: '黄昏晚餐', icon: <Smile className="w-3.5 h-3.5 text-rose-500" /> },
  { timeRange: '20:30 - 23:30', startHour: 20, endHour: 23, periodName: '晚间时光', icon: <Moon className="w-3.5 h-3.5 text-indigo-500" /> },
  { timeRange: '23:30 - 06:30', startHour: 23, endHour: 6, periodName: '深夜安歇', icon: <Moon className="w-3.5 h-3.5 text-stone-400" /> },
];

export function generateDefaultSchedule(contact: Contact, dateStr: string = getTodayDateString()): DailyScheduleItem[] {
  const p = (contact.persona || '').toLowerCase();
  const name = contact.name || 'TA';

  // 根据 id/名字 + 日期哈希，使每天的行程都随机变化
  const seedStr = (contact.id || name) + '_' + dateStr;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const dayIndex = Math.abs(hash);

  const isStudent = p.includes('学生') || p.includes('大学') || p.includes('学弟') || p.includes('学长') || p.includes('学姐') || p.includes('高三') || p.includes('校园');
  const isDoctor = p.includes('医') || p.includes('护士') || p.includes('诊所') || p.includes('医院');
  const isArtist = p.includes('画') || p.includes('设计') || p.includes('音乐') || p.includes('偶像') || p.includes('歌手') || p.includes('摄影') || p.includes('艺术');
  const isAncient = p.includes('古风') || p.includes('修仙') || p.includes('侠') || p.includes('王') || p.includes('侍卫') || p.includes('宗门') || p.includes('师尊');
  const isExecutive = (p.includes('总裁') || p.includes('集团') || p.includes('首席执行官')) && !p.includes('打工人');
  const isOtaku = p.includes('宅') || p.includes('游戏') || p.includes('电竞') || p.includes('二次元') || p.includes('动漫');

  if (isAncient) {
    return [
      { id: 'sch_1', timeRange: '06:00 - 08:00', startHour: 6, endHour: 8, periodName: '晨光吐纳', activity: `${name}在庭院晨起练剑修心，吸纳清晨天地灵气`, location: '王府庭院 / 幽静竹林', mood: '沉静宁和' },
      { id: 'sch_2', timeRange: '08:00 - 11:30', startHour: 8, endHour: 11, periodName: '书阁研案', activity: `${name}批阅密函信件，翻阅宗门古籍案卷`, location: '藏书阁 / 府邸内阁', mood: '严谨专注' },
      { id: 'sch_3', timeRange: '11:30 - 13:30', startHour: 11, endHour: 13, periodName: '清雅茶膳', activity: `${name}品用灵泉新茶与精细点心，稍作歇息`, location: '水榭亭台', mood: '怡然自得' },
      { id: 'sch_4', timeRange: '13:30 - 17:30', startHour: 13, endHour: 17, periodName: '巡视督务', activity: `${name}出巡城郊商铺与哨岗，处理宗内要务`, location: '城中街巷 / 演武场', mood: '威严沉稳' },
      { id: 'sch_5', timeRange: '17:30 - 20:00', startHour: 17, endHour: 20, periodName: '晚膳对酌', activity: `${name}享用晚膳，若你在身侧则偏好与你对饮闲叙`, location: '内苑花厅', mood: '温柔期盼' },
      { id: 'sch_6', timeRange: '20:00 - 23:00', startHour: 20, endHour: 23, periodName: '静夜琴韵', activity: `${name}倚窗抚琴，沉思近来际遇，心中念及某人`, location: '暖阁卧榻', mood: '情愫暗涌' },
      { id: 'sch_7', timeRange: '23:00 - 06:00', startHour: 23, endHour: 6, periodName: '冥息安歇', activity: `${name}运功调息，就寝安然入眠`, location: '寝居深房', mood: '平和静谧' },
    ];
  }

  if (isStudent) {
    return [
      { id: 'sch_1', timeRange: '07:00 - 08:30', startHour: 7, endHour: 8, periodName: '起床洗漱', activity: `${name}闹钟响后稍微赖床，匆匆抓起书包去食堂买早餐`, location: '学生宿舍 / 食堂', mood: '略带困意' },
      { id: 'sch_2', timeRange: '08:30 - 11:50', startHour: 8, endHour: 11, periodName: '上午课程', activity: `${name}在阶梯教室听讲，偶尔偷瞄手机想等你的消息`, location: '教学楼阶梯教室', mood: '认真走神' },
      { id: 'sch_3', timeRange: '11:50 - 13:30', startHour: 11, endHour: 13, periodName: '午饭闲聊', activity: `${name}和同学在食堂吃盖浇饭，刷刷动态与朋友圈`, location: '学苑餐厅', mood: '轻松饱腹' },
      { id: 'sch_4', timeRange: '13:30 - 17:30', startHour: 13, endHour: 17, periodName: '自习与复习', activity: `${name}在图书馆靠窗座位自习写报告，插着耳机听歌`, location: '校图书馆', mood: '静心充实' },
      { id: 'sch_5', timeRange: '17:30 - 19:30', startHour: 17, endHour: 19, periodName: '操场傍晚', activity: `${name}在操场散步吹晚风，看夕阳染红云霞`, location: '学校田径场', mood: '青春惬意' },
      { id: 'sch_6', timeRange: '19:30 - 23:00', startHour: 19, endHour: 23, periodName: '夜间自由', activity: `${name}回寝室洗澡换衣服，开着台灯玩手机跟你聊天`, location: '学生公寓宿舍', mood: '欢欣期待' },
      { id: 'sch_7', timeRange: '23:00 - 07:00', startHour: 23, endHour: 7, periodName: '熄灯好梦', activity: `${name}宿舍熄灯，在被窝里发完晚安后沉沉睡去`, location: '宿舍小床', mood: '香甜梦乡' },
    ];
  }

  if (isArtist) {
    return [
      { id: 'sch_1', timeRange: '08:30 - 10:00', startHour: 8, endHour: 10, periodName: '灵感苏醒', activity: `${name}在阳光洒进窗台时醒来，冲一杯香浓手冲咖啡`, location: '居家艺术工作室', mood: '惬意悠闲' },
      { id: 'sch_2', timeRange: '10:00 - 12:30', startHour: 10, endHour: 12, periodName: '作品创作', activity: `${name}戴上耳机播放古典乐，沉浸在画板/设计图前构思`, location: '个人画室 / 创作角', mood: '极度专注' },
      { id: 'sch_3', timeRange: '12:30 - 14:00', startHour: 12, endHour: 14, periodName: '惬意午餐', activity: `${name}享用精致简餐，顺便整理刚才迸发的新灵感草图`, location: '街角轻食咖啡馆', mood: '充实满足' },
      { id: 'sch_4', timeRange: '14:00 - 18:00', startHour: 14, endHour: 18, periodName: '外出会展', activity: `${name}前往艺术展观展采风，记录身边生动细节`, location: '当代美术馆 / 街头展览', mood: '灵感爆发' },
      { id: 'sch_5', timeRange: '18:00 - 20:30', startHour: 18, endHour: 20, periodName: '晚间聚会', activity: `${name}与好友在露天餐馆聚餐，聊聊最近的心得与见闻`, location: '露天景观餐厅', mood: '轻松欢愉' },
      { id: 'sch_6', timeRange: '20:30 - 23:30', startHour: 20, endHour: 23, periodName: '独处夜记', activity: `${name}点燃香薰蜡烛，挑选好看的照片，想找你分享`, location: '暖光客厅沙发', mood: '温柔依恋' },
      { id: 'sch_7', timeRange: '23:30 - 08:30', startHour: 23, endHour: 8, periodName: '灵感梦境', activity: `${name}伴着轻柔爵士乐入睡，希望梦里能遇见美妙画面`, location: '柔软大床', mood: '宁静安详' },
    ];
  }

  if (isDoctor) {
    return [
      { id: 'sch_1', timeRange: '06:30 - 08:00', startHour: 6, endHour: 8, periodName: '晨起交接', activity: `${name}换上利落衣服吃早饭，仔细查看今日出诊日程表`, location: '家中厨房 / 途经早点摊', mood: '精神抖擞' },
      { id: 'sch_2', timeRange: '08:00 - 12:00', startHour: 8, endHour: 12, periodName: '门诊看诊', activity: `${name}穿上白大褂在科室坐诊，耐心地为患者解答疑惑`, location: '医院门诊科室', mood: '严谨专业' },
      { id: 'sch_3', timeRange: '12:00 - 13:30', startHour: 12, endHour: 13, periodName: '工作间隙', activity: `${name}在医生休息室吃工作餐，抓紧时间小憩 20 分钟`, location: '科室休息区', mood: '略带疲惫' },
      { id: 'sch_4', timeRange: '13:30 - 17:30', startHour: 13, endHour: 17, periodName: '病房查房', activity: `${name}带领实习生病房查房，记录病历与用药反馈`, location: '住院部病房区', mood: '专注认真' },
      { id: 'sch_5', timeRange: '17:30 - 19:30', startHour: 17, endHour: 19, periodName: '下班放松', activity: `${name}脱下白大褂下班，去便利店买冰饮呼吸新鲜空气`, location: '医院附近街区', mood: '轻松释怀' },
      { id: 'sch_6', timeRange: '19:30 - 23:00', startHour: 19, endHour: 23, periodName: '夜间私人', activity: `${name}回到家中做晚餐、洗个烫水澡，看着手机等你的消息`, location: '温馨居所', mood: '温柔期待' },
      { id: 'sch_7', timeRange: '23:00 - 06:30', startHour: 23, endHour: 6, periodName: '沉睡充能', activity: `${name}进入沉睡状态，让疲惫了一天的身体好好休养`, location: '卧室大床', mood: '沉静安稳' },
    ];
  }

  if (isOtaku) {
    return [
      { id: 'sch_1', timeRange: '09:00 - 11:00', startHour: 9, endHour: 11, periodName: '自然醒', activity: `${name}在被窝里伸懒腰醒来，抱着抱枕刷手机看动漫`, location: '卧室大床', mood: '慵懒惬意' },
      { id: 'sch_2', timeRange: '11:00 - 13:30', startHour: 11, endHour: 13, periodName: '外卖早午餐', activity: `${name}点了一份丰盛的外卖，边看游戏直播边享用`, location: '电脑桌前', mood: '满足快乐' },
      { id: 'sch_3', timeRange: '13:30 - 18:00', startHour: 13, endHour: 18, periodName: '游戏开黑', activity: `${name}戴上耳机和朋友语音开黑打游戏，战况激烈`, location: '电竞椅 / 游戏房间', mood: '情绪高涨' },
      { id: 'sch_4', timeRange: '18:00 - 20:00', startHour: 18, endHour: 20, periodName: '零食小憩', activity: `${name}拆开薯片和冰汽水，给你发刚遇到的搞笑游戏梗图`, location: '客厅沙发', mood: '欢脱分享' },
      { id: 'sch_5', timeRange: '20:00 - 23:30', startHour: 20, endHour: 23, periodName: '追剧看漫', activity: `${name}关上大灯只留台灯，看新出的新番剧集`, location: '温馨小房间', mood: '沉浸陶醉' },
      { id: 'sch_6', timeRange: '23:30 - 02:00', startHour: 23, endHour: 2, periodName: '深夜夜猫', activity: `${name}深夜躺在床上跟你微信连麦聊天、分享日常`, location: '被窝里', mood: '依赖黏人' },
      { id: 'sch_7', timeRange: '02:00 - 09:00', startHour: 2, endHour: 9, periodName: '深夜深睡', activity: `${name}把手机放在枕头边，抱紧毛绒玩偶沉沉入睡`, location: '柔软被窝', mood: '香甜梦乡' },
    ];
  }

  if (isExecutive) {
    return [
      { id: 'sch_1', timeRange: '06:30 - 08:30', startHour: 6, endHour: 8, periodName: '晨起自律', activity: `${name}早晨晨跑锻炼，享用现磨咖啡与营养早餐`, location: '公寓 / 健身房', mood: '利落自律' },
      { id: 'sch_2', timeRange: '08:30 - 12:00', startHour: 8, endHour: 12, periodName: '集团晨会', activity: `${name}听取各部门汇报，签署审批核心规划`, location: '总部大厦会议室', mood: '敏锐决断' },
      { id: 'sch_3', timeRange: '12:00 - 13:30', startHour: 12, endHour: 13, periodName: '商务午餐', activity: `${name}在私人餐厅用餐，眺望落地窗外城市景色`, location: '专享餐厅', mood: '沉静内敛' },
      { id: 'sch_4', timeRange: '13:30 - 18:00', startHour: 13, endHour: 18, periodName: '项目谈判', activity: `${name}接见合作方，处理关键决策，日程充实`, location: '办公室', mood: '运筹帷幄' },
      { id: 'sch_5', timeRange: '18:00 - 20:30', startHour: 18, endHour: 20, periodName: '晚宴归途', activity: `${name}乘车返回居所，享受远离喧嚣的宁静`, location: '返程车内', mood: '卸下防备' },
      { id: 'sch_6', timeRange: '20:30 - 23:30', startHour: 20, endHour: 23, periodName: '私属时光', activity: `${name}换上居家服，翻看微信特别关心消息`, location: '家中书房', mood: '温和缱绻' },
      { id: 'sch_7', timeRange: '23:30 - 06:30', startHour: 23, endHour: 6, periodName: '静夜休养', activity: `${name}在安静舒适的卧室安歇充能`, location: '主卧大床', mood: '深沉安心' },
    ];
  }

  // 多样化日常角色（根据 dayIndex 轮换 3 组完全不一样的日常生活模板）
  const variation = dayIndex % 3;

  if (variation === 0) {
    return [
      { id: 'sch_1', timeRange: '07:30 - 09:00', startHour: 7, endHour: 9, periodName: '早起出门', activity: `${name}在清晨阳光中伸个懒腰，吃美味早餐`, location: '温暖家中 / 早餐铺', mood: '元气满满' },
      { id: 'sch_2', timeRange: '09:00 - 12:00', startHour: 9, endHour: 12, periodName: '专注处理', activity: `${name}处理手头日常事务，偶尔喝水放松`, location: '工作室 / 工位', mood: '井井有条' },
      { id: 'sch_3', timeRange: '12:00 - 14:00', startHour: 12, endHour: 14, periodName: '午饭闲歇', activity: `${name}享用热气腾腾的午饭，闭目养神 20 分钟`, location: '附近餐馆 / 休息区', mood: '惬意放松' },
      { id: 'sch_4', timeRange: '14:00 - 18:00', startHour: 14, endHour: 18, periodName: '午后灵感', activity: `${name}点了一杯喜欢的饮品，灵感满满推进进度`, location: '工作间 / 灵感角落', mood: '投入专注' },
      { id: 'sch_5', timeRange: '18:00 - 20:00', startHour: 18, endHour: 20, periodName: '日落晚饭', activity: `${name}结束白天的忙碌，去吃喜欢的街头小吃`, location: '美食街 / 温馨厨房', mood: '心满意足' },
      { id: 'sch_6', timeRange: '20:00 - 23:00', startHour: 20, endHour: 23, periodName: '夜晚时光', activity: `${name}听歌、看剧刷动态，满脑子想找你聊天`, location: '柔软沙发 / 飘窗', mood: '温柔依恋' },
      { id: 'sch_7', timeRange: '23:00 - 07:30', startHour: 23, endHour: 7, periodName: '晚安好梦', activity: `${name}抱着软绵绵的抱枕沉入梦乡`, location: '舒适卧室', mood: '甜蜜恬静' },
    ];
  } else if (variation === 1) {
    return [
      { id: 'sch_1', timeRange: '08:00 - 09:30', startHour: 8, endHour: 9, periodName: '悠闲醒来', activity: `${name}听着窗外鸟鸣醒来，给窗台绿植浇水`, location: '阳台小花园', mood: '心情舒畅' },
      { id: 'sch_2', timeRange: '09:30 - 12:00', startHour: 9, endHour: 12, periodName: '充实上午', activity: `${name}阅读感兴趣的书籍，学习记录笔记`, location: '书房木桌', mood: '平静专注' },
      { id: 'sch_3', timeRange: '12:00 - 14:00', startHour: 12, endHour: 14, periodName: '美味午餐', activity: `${name}和朋友视频点美味外卖，边吃边聊梗`, location: '客厅餐桌', mood: '欢快轻松' },
      { id: 'sch_4', timeRange: '14:00 - 18:00', startHour: 14, endHour: 18, periodName: '户外漫步', activity: `${name}出门去附近公园漫步，去喜欢的咖啡馆打卡`, location: '街角公园 / 咖啡馆', mood: '惬意自在' },
      { id: 'sch_5', timeRange: '18:00 - 20:30', startHour: 18, endHour: 20, periodName: '亲自下厨', activity: `${name}去超市买新鲜食材，亲自下厨做晚餐`, location: '超市 / 家中厨房', mood: '满满成就感' },
      { id: 'sch_6', timeRange: '20:30 - 23:30', startHour: 20, endHour: 23, periodName: '音乐陪伴', activity: `${name}戴耳机听歌选歌，给你发今天拍的好看照片`, location: '卧室榻榻米', mood: '期待回复' },
      { id: 'sch_7', timeRange: '23:30 - 08:00', startHour: 23, endHour: 8, periodName: '安然入睡', activity: `${name}盖好暖和的被子，怀着美妙心情睡觉`, location: '柔软大床', mood: '安稳平和' },
    ];
  } else {
    return [
      { id: 'sch_1', timeRange: '07:00 - 08:30', startHour: 7, endHour: 8, periodName: '晨起运动', activity: `${name}早起晨跑打卡，顺路买热豆浆煎饼`, location: '公园跑道 / 街边早点摊', mood: '充满活力' },
      { id: 'sch_2', timeRange: '08:30 - 12:00', startHour: 8, endHour: 12, periodName: '高效规划', activity: `${name}梳理今日待办计划，逐一高效推进`, location: '工位 / 书桌', mood: '干劲十足' },
      { id: 'sch_3', timeRange: '12:00 - 13:30', startHour: 12, endHour: 13, periodName: '午间充能', activity: `${name}简单享用美味便当，听轻音乐闭目养神`, location: '休息区', mood: '放松恢复' },
      { id: 'sch_4', timeRange: '13:30 - 17:30', startHour: 13, endHour: 17, periodName: '专注攻坚', activity: `${name}打起十二分精神处理重点任务，效率奇高`, location: '工作室', mood: '沉浸敏锐' },
      { id: 'sch_5', timeRange: '17:30 - 20:00', startHour: 17, endHour: 20, periodName: '傍晚晚风', activity: `${name}吹着晚风散步回家，顺路买水果甜点`, location: '沿街路段 / 水果店', mood: '轻松从容' },
      { id: 'sch_6', timeRange: '20:00 - 23:00', startHour: 20, endHour: 23, periodName: '居家放松', activity: `${name}泡个香香的热水澡，躺在被窝里刷朋友圈`, location: '浴室 / 被窝', mood: '惬意依赖' },
      { id: 'sch_7', timeRange: '23:00 - 07:00', startHour: 23, endHour: 7, periodName: '深睡休养', activity: `${name}关上台灯沉沉睡去，享受宁静夜晚`, location: '舒适卧室', mood: '甜蜜梦乡' },
    ];
  }
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  contact,
  settings,
  activeTheme,
  onClose,
  onUpdateContact,
}) => {
  const todayStr = getTodayDateString();

  const [scheduleList, setScheduleList] = useState<DailyScheduleItem[]>(() => {
    return contact.customSchedule && contact.customSchedule.length > 0 && contact.scheduleDate === todayStr
      ? contact.customSchedule
      : []; // 初始设为空，等待 AI 生成或自动触发 handleRefreshSchedule
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const currentHour = new Date().getHours();

  // 更新当前时间与高亮
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const weekDay = getWeekDayString();
      setCurrentTimeStr(`${now.getMonth() + 1}月${now.getDate()}日 ${weekDay} ${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // 如果该联系人没有今天的自定义行程（或者日期跨天了），首次打开弹窗时自动触发 AI 生成新一天行程
  useEffect(() => {
    const currentToday = getTodayDateString();
    if (!contact.customSchedule || contact.customSchedule.length === 0 || contact.scheduleDate !== currentToday) {
      handleRefreshSchedule();
    }
  }, [contact.id]);

  // 判定是否是当前时段
  const isItemCurrent = (item: DailyScheduleItem) => {
    if (item.startHour <= item.endHour) {
      return currentHour >= item.startHour && currentHour < item.endHour;
    } else {
      // 跨午夜，如 23:00 - 06:00
      return currentHour >= item.startHour || currentHour < item.endHour;
    }
  };

  const currentItem = scheduleList.find(isItemCurrent) || scheduleList[0] || null;

  // AI 智能重算 / 突发日程生成
  const handleRefreshSchedule = async () => {
    setIsRefreshing(true);
    const curToday = getTodayDateString();
    const curWeekDay = getWeekDayString();

    const systemPrompt = `你现在扮演角色【${contact.name}】。
人设背景：${contact.persona}
今日日期：${curToday} (${curWeekDay})。

请根据你的【独特人设与身份背景】推算你【今天各个时段的真实日常生活作息与专属行程】。
特别提醒：
1. 严禁所有人都生成总裁/霸总/集团会议日程！只有当人设明确是总裁/老板时才生成商务日程；如果是学生就要上课，艺术家就要创作/摄影，社畜打工人就要挤公交/工位摸鱼，宅家就要看剧打游戏，古风就要修炼/茶会等。
2. 结合今天的日期（${curToday} ${curWeekDay}），确保行程极具真实生活气息与该角色独特的性格语言！

严格以 JSON 格式输出一个数组，包含 5-7 个时段（按时间前后从早到晚排序）。
每个对象包含属性：
- "timeRange": string（如 "07:30 - 09:00"）
- "startHour": number（如 7）
- "endHour": number（如 9）
- "periodName": string（如 "清晨唤醒", "上午课程", "午饭闲聊", "午后创作", "晚饭散步", "夜间聊天", "深夜安歇"）
- "activity": string（20字以内，极具角色个性生动的生活动作）
- "location": string（地点，如 "学生宿舍", "个人画室", "咖啡馆", "公园"）
- "mood": string（当前心情或状态，如 "专注期待", "微困温柔"）
请直接输出严格合法的纯 JSON 数组，绝不要添加任何 Markdown 反引号或额外废话。`;

    let reply = '';

    try {
      // 1. 如果用户配置了自定义 API Key，优先走用户自定义 API
      if (settings.apiKey && settings.apiKey.trim().length > 0) {
        const base = (settings.apiUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
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
              { role: 'user', content: `请推算你今天 (${curToday} ${curWeekDay}) 的专属日常生活行程，必须极其贴合你的人设风格。` }
            ],
            temperature: 0.85
          })
        });

        if (res.ok) {
          const data = await res.json();
          reply = data?.choices?.[0]?.message?.content?.trim() || '';
        }
      }

      // 2. 如果没有配置自定义 Key，或者用户 API 未拿到结果，走内置后端代理 /api/ai/chat
      if (!reply) {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt,
            messages: [
              { role: 'user', content: `请推算你今天 (${curToday} ${curWeekDay}) 的专属日常生活行程，必须极其贴合你的人设风格。` }
            ],
            temperature: 0.85
          })
        });

        if (res.ok) {
          const data = await res.json();
          reply = data?.reply || '';
        }
      }

      if (reply) {
        let cleanReply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
        // 尝试匹配 JSON 数组
        const match = cleanReply.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          cleanReply = match[0];
        }
        const parsed = JSON.parse(cleanReply);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: DailyScheduleItem[] = parsed.map((it, idx) => ({
            id: 'sch_ai_' + Date.now() + '_' + idx,
            timeRange: it.timeRange || '12:00 - 14:00',
            startHour: typeof it.startHour === 'number' ? it.startHour : 12,
            endHour: typeof it.endHour === 'number' ? it.endHour : 14,
            periodName: it.periodName || '日常时段',
            activity: it.activity || '正在处理生活琐事',
            location: it.location || '居所附近',
            mood: it.mood || '轻松惬意'
          }));
          setScheduleList(formatted);
          onUpdateContact(contact.id, {
            customSchedule: formatted,
            scheduleLastUpdated: Date.now(),
            scheduleDate: curToday
          });
          setIsRefreshing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI 行程推算失败，使用本地人设生成:', e);
    }

    // 3. 回退到本地多样化人设生成
    const newItems = generateDefaultSchedule(contact, curToday).map(item => ({
      ...item,
      id: 'sch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    }));
    setScheduleList(newItems);
    onUpdateContact(contact.id, {
      customSchedule: newItems,
      scheduleLastUpdated: Date.now(),
      scheduleDate: curToday
    });
    setIsRefreshing(false);
  };

  const isInitialLoading = scheduleList.length === 0 && isRefreshing;

  // 主题样式提取
  const modalBgImg = activeTheme?.assets?.scheduleModalBg;
  const modalBgColor = activeTheme?.css?.['--gg-schedule-modal-bg'] || 'var(--app-card, #fffaf5)';
  const modalTextColor = activeTheme?.css?.['--gg-schedule-modal-text'] || 'var(--app-text, #6b4a52)';
  const modalBorder = activeTheme?.css?.['--gg-schedule-modal-border'] || '1px solid var(--app-card-border, #f0dfe0)';
  const modalRadius = activeTheme?.css?.['--gg-schedule-modal-radius'] || '20px';
  const itemBgColor = activeTheme?.css?.['--gg-schedule-item-bg'] || 'var(--app-bg, #fdf6f0)';
  const itemBorder = activeTheme?.css?.['--gg-schedule-item-border'] || '1px solid var(--app-card-border, #f0dfe0)';
  const currentBadgeBg = activeTheme?.css?.['--gg-schedule-current-badge-bg'] || 'var(--app-btn-bg, #e89aab)';
  const currentBadgeText = activeTheme?.css?.['--gg-schedule-current-badge-text'] || '#ffffff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className="rococo-theme w-full max-w-[340px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        style={{
          backgroundColor: modalBgImg ? 'transparent' : modalBgColor,
          color: modalTextColor,
          border: modalBorder,
          borderRadius: modalRadius,
        }}
      >
        {/* 背景贴图 */}
        {modalBgImg && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={getBubbleBgStyle({
              isUser: false,
              prefix: 'scheduleModal',
              editingTheme: activeTheme,
              bubbleBgUrl: modalBgImg,
              isDot9: activeTheme?.css?.['--gg-is-dot9-scheduleModalBg'] !== 'false',
            })}
          />
        )}

        {/* 顶部标题栏 */}
        <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-black/10 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={contact.avatar} className="w-8 h-8 rounded-full shrink-0 shadow-xs" size={16} />
            <div className="min-w-0">
              <div className="font-bold text-xs flex items-center gap-1 leading-tight truncate">
                <span>{contact.remark || contact.name} 的今日行程</span>
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              </div>
              <div className="text-[10px] opacity-70 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{currentTimeStr || '实时日程'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRefreshSchedule}
              disabled={isRefreshing}
              className={`p-1.5 rounded-full hover:bg-black/5 active:scale-95 transition-transform cursor-pointer ${isRefreshing ? 'animate-spin text-amber-500' : 'opacity-70 hover:opacity-100'}`}
              title="根据人设推算/刷新今日行程"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 active:scale-95 transition-transform cursor-pointer opacity-70 hover:opacity-100"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 当前正在进行的日程高亮卡片 */}
        <div className="p-3 pb-1 relative z-10">
          {!currentItem ? (
            <div 
              className="p-8 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 animate-pulse"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
              <div className="text-[11px] text-stone-400 font-medium">正在推算 TA 的今日行程...</div>
            </div>
          ) : (
            <div
              className="p-2.5 rounded-xl border relative overflow-hidden transition-all shadow-xs"
              style={{
                backgroundColor: activeTheme?.css?.['--gg-schedule-current-card-bg'] || 'rgba(245, 158, 11, 0.08)',
                borderColor: activeTheme?.css?.['--gg-schedule-current-card-border'] || 'rgba(245, 158, 11, 0.35)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wide flex items-center gap-1 animate-pulse"
                  style={{
                    backgroundColor: currentBadgeBg,
                    color: currentBadgeText,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>此时此刻 · 进行中</span>
                </span>
                <span className="text-[10px] font-mono opacity-85 font-semibold">
                  {currentItem.timeRange}
                </span>
              </div>

              <div className="text-xs font-bold leading-snug my-1">
                {currentItem.activity}
              </div>

              <div className="flex items-center justify-between text-[9.5px] opacity-80 mt-1.5 pt-1.5 border-t border-black/5">
                <div className="flex items-center gap-1 truncate max-w-[65%]">
                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate">{currentItem.location}</span>
                </div>
                {currentItem.mood && (
                  <span className="px-1.5 py-0.5 rounded bg-black/5 text-[9px] font-medium shrink-0">
                    {currentItem.mood}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 24 小时全天时段列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 relative z-10 scrollbar-none">
          {scheduleList.length === 0 ? (
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-xl border border-stone-100 bg-stone-50/50 animate-pulse flex flex-col gap-2">
                  <div className="h-3 w-20 bg-stone-200 rounded" />
                  <div className="h-4 w-full bg-stone-200 rounded" />
                  <div className="h-2 w-32 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="text-[10px] font-bold opacity-60 px-0.5 flex items-center justify-between">
                <span>全天作息时刻表</span>
                <span className="text-[9px] font-normal">共 {scheduleList.length} 个时段</span>
              </div>

              {scheduleList.map((item, index) => {
                const isCurrent = isItemCurrent(item);
                return (
                  <div
                    key={item.id || index}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isCurrent ? 'ring-2 ring-amber-400/70 shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isCurrent ? 'rgba(254, 243, 199, 0.35)' : itemBgColor,
                      border: isCurrent ? '1px solid #f59e0b' : itemBorder,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-[11px] leading-tight truncate">
                          {item.periodName}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-[8.5px] px-1.5 py-0.2 rounded font-bold shrink-0"
                            style={{ backgroundColor: currentBadgeBg, color: currentBadgeText }}
                          >
                            当前
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-mono opacity-75 shrink-0 font-medium">
                        {item.timeRange}
                      </span>
                    </div>

                    <div className="text-[11px] leading-relaxed break-words opacity-90 my-0.5">
                      {item.activity}
                    </div>

                    <div className="flex items-center justify-between text-[9px] opacity-75 mt-1.5 pt-1 border-t border-black/5">
                      <div className="flex items-center gap-1 truncate max-w-[68%]">
                        <MapPin className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      {item.mood && (
                        <span className="opacity-80 truncate text-[8.5px]">
                          状态：{item.mood}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="p-2.5 border-t border-black/10 flex items-center justify-between bg-black/5 relative z-10">
          <span className="text-[9px] opacity-60 truncate">
            * 行程由【{contact.name}】人设智能生成
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            style={{
              backgroundColor: activeTheme?.css?.['--gg-schedule-btn-bg'] || '#a8b39c',
              color: activeTheme?.css?.['--gg-schedule-btn-text'] || '#ffffff',
            }}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
