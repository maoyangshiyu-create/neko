export function getTimeContext(): string {
  const now = new Date();
  const hour = now.getHours();
  
  // 时段判断
  let timeOfDay = '';
  if (hour >= 5 && hour < 9) timeOfDay = '清晨';
  else if (hour >= 9 && hour < 12) timeOfDay = '上午';
  else if (hour >= 12 && hour < 14) timeOfDay = '中午';
  else if (hour >= 14 && hour < 18) timeOfDay = '下午';
  else if (hour >= 18 && hour < 22) timeOfDay = '晚上';
  else timeOfDay = '深夜';
  
  // 季节判断
  const month = now.getMonth() + 1;
  let season = '';
  if (month >= 3 && month <= 5) season = '春天';
  else if (month >= 6 && month <= 8) season = '夏天';
  else if (month >= 9 && month <= 11) season = '秋天';
  else season = '冬天';
  
  // 星期
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = `星期${weekdays[now.getDay()]}`;
  
  return `当前时间：${now.getFullYear()}年${month}月${now.getDate()}日 ${weekday} ${hour}点${now.getMinutes()}分（${timeOfDay}，${season}）`;
}
