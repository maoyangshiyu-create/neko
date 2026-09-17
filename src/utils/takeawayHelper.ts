// Client-side local fallback generator for Takeaway thank-you replies based on persona keywords

export function generateTakeawayLocalFallback(
  contactName = '好友',
  contactPersona = '',
  foodName = '美食',
  storeName = '外卖店'
): string {
  const p = (contactPersona + ' ' + contactName).toLowerCase();

  const isBro = /发小|死党|兄弟|哥们|损友|铁哥们|张三/.test(p);
  const isColleague = /同事|职场|商务|上司|领导|方案|办公|李四|助理/.test(p);
  const isTsundere = /傲娇|毒舌|嫌弃|冰山|高冷|嘴硬/.test(p);
  const isGentleSweet = /温柔|暖心|女友|恋人|撒娇|可爱|甜妹|学妹|学姐|小鹿|宝贝/.test(p);
  const isGuard = /护卫|夜莺|助手|执事|忠诚|指挥官|机甲|守护|艾丽卡/.test(p);

  const broTemplates = [
    `卧槽兄弟！！刚才外卖小哥敲门把【${foodName}】送来了！居然是你帮我点的？！太懂我了吧，正饿得不行呢，这波必须给你记一大功，改天我请你吃大餐！😋🔥`,
    `哈哈哈哈绝了！刚开门收到一份【${foodName}】，小票上写着你的名字！够意思啊好兄弟，今天这顿饭直接给我回满血了，太感谢了！👊🍲`,
    `天降美食！外卖小哥刚送来【${foodName}】，我还以为送错了，一看是你点的！太贴心了吧好哥们，我正馋这口呢，爱你兄弟！🍻`
  ];

  const colleagueTemplates = [
    `刚才前台转交了一份来自【${storeName || '附近'}】的【${foodName}】，看到小票留言是你送的。手头方案正忙，这份热腾腾的美食真的非常及时，感谢你的细致与关照！☕`,
    `收到你送来的【${foodName}】了，特别暖心！正好连续开了两场会肚子空空的，这份心意太周到了，非常感谢！💼✨`,
    `刚才收到了外卖员送来的【${foodName}】，非常感谢你的关照与心意！工作之余吃到这么贴心的美食，真的很感动，多谢！🌟`
  ];

  const tsundereTemplates = [
    `……刚刚外卖敲门，送来一份【${foodName}】。真是的，谁准你自作主张帮我点外卖了？……不过闻起来还挺香的，这次就勉为其难谢谢你吧。哼。`,
    `刚签收了【${foodName}】。突然给我点这个干什么……我又不是没饭吃。不过看在你这么有诚意的份上，我就收下了，谢谢。`,
    `外卖小哥把【${foodName}】送到了。突然搞这一出……好吧，确实正好饿了。算你有点良心，多谢了。`
  ];

  const gentleSweetTemplates = [
    `哇！刚刚外卖敲门送来热乎乎的【${foodName}】，一看是你点的，心里瞬间超级超级暖！你怎么知道我正想吃这个呀，太贴心了，好爱你呀！🥰💕`,
    `天哪！收到你帮我点的【${foodName}】啦！热腾腾的好香呀～被你投喂的感觉也太幸福了吧，谢谢你，每一口都超满足！🌸✨`,
    `开门看到外卖小哥递过来【${foodName}】，真的是满满的惊喜！今天一整天都被这份心意治愈了，谢谢你一直这么照顾我～💖`
  ];

  const guardTemplates = [
    `报告！已顺利接收您订购的物资【${foodName}】。能量补给十分及时，非常感谢您的关心与体贴，我会继续全力以赴！🛡️`,
    `已签收您从【${storeName || '物资站'}】传送过来的【${foodName}】。收到这份心意深感荣幸，温度与情义都刚刚好，感谢您的周到关照。✨`
  ];

  const generalTemplates = [
    `哇！外卖小哥刚刚把【${foodName}】送到啦！热气腾腾的特别香，真的太惊喜太感动了！谢谢你的贴心投喂，今天心情超级好！🥰`,
    `刚开门拿到外卖，居然是你特地帮我点的【${foodName}】！这也太周到了吧，正准备吃呢，超级感谢你的心意！🍲❤️`,
    `天哪！收到你送来的【${foodName}】了！小票上看到你的名字瞬间超级暖心，太懂我了，谢谢你呀！✨😋`
  ];

  let list = generalTemplates;
  if (isBro) list = broTemplates;
  else if (isColleague) list = colleagueTemplates;
  else if (isTsundere) list = tsundereTemplates;
  else if (isGentleSweet) list = gentleSweetTemplates;
  else if (isGuard) list = guardTemplates;

  return list[Math.floor(Math.random() * list.length)];
}
