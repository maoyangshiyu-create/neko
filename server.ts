import express from "express";
import path from "path";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import neteaseApi from "NeteaseCloudMusicApi";

dotenv.config();

// Stable Chinese IP pool to bypass overseas NetEase anti-fraud/datacenter restrictions
const CHINA_IP_PREFIXES = [
  '116.25', '116.76', '116.77', '116.78', '116.79', '116.80', '116.81', '116.82',
  '116.83', '116.84', '116.85', '116.86', '116.87', '116.88', '116.89', '116.90',
  '116.91', '116.92', '116.93', '116.94'
];

function generateRandomChineseIP(): string {
  const prefix = CHINA_IP_PREFIXES[Math.floor(Math.random() * CHINA_IP_PREFIXES.length)];
  const seg1 = Math.floor(Math.random() * 254) + 1;
  const seg2 = Math.floor(Math.random() * 254) + 1;
  return `${prefix}.${seg1}.${seg2}`;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Candidate models in prioritized order.
// gemini-3.1-flash-lite-preview and gemini-3.1-flash-lite offer rapid response times and high availability.
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-lite"
];

// Map of model name -> cooldown expiration timestamp (ms)
const modelCooldowns = new Map<string, number>();

function getAvailableModels(): string[] {
  const now = Date.now();
  // Filter models that are not cooling down
  const available = CANDIDATE_MODELS.filter(m => {
    const cooldownUntil = modelCooldowns.get(m) || 0;
    return now >= cooldownUntil;
  });

  if (available.length > 0) {
    return available;
  }

  // If all are cooling down, sort by earliest cooldown expiration
  return [...CANDIDATE_MODELS].sort((a, b) => {
    return (modelCooldowns.get(a) || 0) - (modelCooldowns.get(b) || 0);
  });
}

function markModelRateLimited(model: string, error: any) {
  const now = Date.now();
  const errorMsg = error?.message || JSON.stringify(error || {});
  
  // Check if it's a daily quota limit (e.g. limit: 20 per day)
  const isDailyLimit = errorMsg.includes('PerDay') || errorMsg.includes('limit: 20') || errorMsg.includes('quotaId: GenerateRequestsPerDay');
  
  let retrySeconds = 60;
  if (isDailyLimit) {
    // Cooldown 1 hour for daily quota exhaustion
    retrySeconds = 3600;
  } else {
    const match = errorMsg.match(/retry in ([0-9.]+)s/i);
    if (match && match[1]) {
      retrySeconds = Math.ceil(parseFloat(match[1])) + 2;
    } else if (error?.details && Array.isArray(error.details)) {
      const retryInfo = error.details.find((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
      if (retryInfo?.retryDelay) {
        retrySeconds = Math.ceil(parseFloat(String(retryInfo.retryDelay).replace('s', ''))) + 2;
      }
    }
  }

  modelCooldowns.set(model, now + retrySeconds * 1000);
  console.log(`[Gemini Router] Model ${model} rate-limited (cooldown ${retrySeconds}s), switching to alternative model.`);
}

// Helper for retrying Gemini calls with smart multi-model fallback
async function callGeminiWithRetry(fn: (model: string) => Promise<any>, retries = 6, delay = 1000) {
  let lastError: any = null;
  const attemptedModels = new Set<string>();

  for (let i = 0; i < retries; i++) {
    const availableModels = getAvailableModels();
    // Prefer models not yet attempted in this call
    const model = availableModels.find(m => !attemptedModels.has(m)) || availableModels[i % availableModels.length];
    attemptedModels.add(model);

    try {
      return await fn(model);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const is503 = error?.status === 503 || errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE');
      const is429 = error?.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      const is404 = error?.status === 404 || errorMsg.includes('404') || errorMsg.includes('not found');

      if (is503) {
        // High demand spike - temporarily cool down model for 20s so other models take over
        modelCooldowns.set(model, Date.now() + 20000);
        console.log(`[Gemini Router] Model ${model} high demand (503), immediately switching to alternative model.`);
        const remainingModels = CANDIDATE_MODELS.filter(m => !attemptedModels.has(m) && (modelCooldowns.get(m) || 0) <= Date.now());
        if (remainingModels.length > 0 && i < retries - 1) {
          continue; // Switch immediately without waiting
        }
      } else if (is429) {
        markModelRateLimited(model, error);
        // If there are other candidate models not yet attempted, immediately switch without waiting
        const remainingModels = CANDIDATE_MODELS.filter(m => !attemptedModels.has(m));
        if (remainingModels.length > 0 && i < retries - 1) {
          continue;
        }
      } else if (is404) {
        modelCooldowns.set(model, Date.now() + 86400000);
        const remainingModels = CANDIDATE_MODELS.filter(m => !attemptedModels.has(m));
        if (remainingModels.length > 0 && i < retries - 1) {
          continue;
        }
      } else {
        if (i >= retries - 2) {
          console.log(`[Gemini Attempt ${i + 1}] Model ${model} notice:`, errorMsg.slice(0, 100));
        }
      }

      if (i < retries - 1) {
        const waitTime = is503 ? 1000 : (is429 ? 1500 : delay);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

// Fallback generator for Twitter replies
function generateFallbackTwitterReplies(postContent: string, authorName: string) {
  const isQuestion = postContent.includes('?') || postContent.includes('？') || postContent.includes('怎么') || postContent.includes('如何');
  const isFood = postContent.includes('吃') || postContent.includes('饭') || postContent.includes('奶茶') || postContent.includes('外卖');
  const isEmotion = postContent.includes('累') || postContent.includes('开心') || postContent.includes('难过') || postContent.includes('气') || postContent.includes('哭');

  return [
    { authorName: "吃瓜群众小李", avatarId: 3, content: isQuestion ? "蹲一个课代表解答！我也想知道~" : "前排前排！写得太真实了哈哈哈哈！" },
    { authorName: "今天也在摸鱼", avatarId: 12, content: isFood ? "看起来好香啊，馋死我了🤤" : "深有同感，今天也是努力摸鱼的一天~" },
    { authorName: "奶茶续命中", avatarId: 7, content: "火速点赞，先马克一下慢慢看！" },
    { authorName: "冲浪达人阿伟", avatarId: 9, content: isEmotion ? "抱抱楼主，摸摸头~ 一切都会好起来的！❤️" : "哈哈哈哈哈哈草，太真实了" },
    { authorName: "理中客老王", avatarId: 15, content: "角度很独特，确实有点东西 👍" },
    { authorName: "表情包战士", avatarId: 4, content: "来了来了！疯狂截图中（bushi）" },
    { authorName: "杠精本精", avatarId: 11, content: "只有我觉得还好吧？不过写得确实挺生动的。" },
    { authorName: "夜猫子本猫", avatarId: 18, content: "深夜刷到，真实得可怕！" }
  ];
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Route for AI Twitter Replies
app.post("/api/twitter/generate-replies", async (req, res) => {
  const rawContent = req.body.postContent;
  const authorName = req.body.authorName || "用户";
  const context = req.body.context || {};

  const postContent = typeof rawContent === 'string' ? rawContent.trim() : '';

  if (!postContent) {
    return res.status(400).json({ error: "Missing post content" });
  }

  try {
    const promptText = `你是一个社交媒体仿真引擎，专门生成真实、自然的网友评论。

用户在 X (Twitter) 上发布了一条帖子：
"${postContent}" (作者: ${authorName})
上下文信息: ${JSON.stringify(context || {})}

【重要约束】：
1. 生成的评论者必须是真实、接地气的网友身份，绝对不要出现以下类型：
   - 官方账号（如"安全卫士"、"代码审计员"、"系统管理员"、"合规检查员"等）
   - 机器人/自动回复账号
   - 企业/机构账号
   - AI 助手（如"智能助手"、"AI 管家"等）

2. 评论者身份应该多样化，包括但不限于：
   - 普通吃瓜群众（"吃瓜群众"、"前排围观"、"路过打酱油"）
   - 趣味型网友（"表情包战士"、"梗王"、"冲浪达人"、"当代脆皮大学生"）
   - 生活化网友（"奶茶续命中"、"今天也在摸鱼"、"早八受害者"、"疯狂星期四V我50"）
   - 观点型网友（"理中客"、"杠精本精"、"赞同党"、"课代表来了"）
   - 氛围组（"沙发"、"来了来了"、"占个位置"、"火速赶到现场"）

3. 评论内容要符合真实网友的风格：
   - 口语化、随意自然，绝对不要像官方声明或机器人公告
   - 可以有网络热梗、恰当的表情符号（少量自然融入）
   - 长度长短不一，有的简短几个字，有的稍长一两句
   - 语气多样化：赞同、质疑、开玩笑、八卦、感慨、吐槽等

4. 头像 ID 使用 1-20 之间的数字，随机分配

请生成 8-12 条符合以上要求的路人评论，以严格的 JSON 数组格式返回，例如：
[
  { "authorName": "吃瓜群众", "avatarId": 5, "content": "前排围观！" },
  { "authorName": "今天也在摸鱼", "avatarId": 12, "content": "哈哈哈哈笑死我了" }
]`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    }));

    let replies: any[] = [];
    try {
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed)) {
        replies = parsed;
      } else if (parsed && Array.isArray(parsed.replies)) {
        replies = parsed.replies;
      } else if (parsed && Array.isArray(parsed.comments)) {
        replies = parsed.comments;
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", response.text);
    }

    if (!Array.isArray(replies) || replies.length === 0) {
      replies = generateFallbackTwitterReplies(postContent, authorName);
    }

    res.json({ replies });
  } catch (error: any) {
    console.log("[Twitter Replies] Using fallback replies:", error?.message?.slice(0, 80));
    const fallbackReplies = generateFallbackTwitterReplies(postContent, authorName);
    res.json({ replies: fallbackReplies });
  }
});

// API Route for AI Twitter Single Reply (Multi-turn conversation)
app.post("/api/twitter/generate-reply", async (req, res) => {
  const { commentContent, originalPost, authorName, context } = req.body || {};
  const cContent = typeof commentContent === 'string' ? commentContent.trim() : '';
  const oPost = typeof originalPost === 'string' ? originalPost.trim() : '';
  const netizenName = typeof authorName === 'string' ? authorName.trim() : '网友';

  if (!cContent) {
    return res.status(400).json({ error: "Missing comment content" });
  }

  try {
    const promptText = `你现在正在扮演社交媒体 X (Twitter) 上的一个真实网友【${netizenName}】。
原帖内容："${oPost}"
用户对你的回复/评论："${cContent}"
前序对话上下文：${JSON.stringify(context || [])}

【人设要求】：
1. 你的名字是【${netizenName}】，你是一个真实、接地气、自然生动的网友，根据你的昵称风格（如吃瓜、吐槽、幽默、理性、搞怪等）来回复。
2. 绝对不要像官方机器人、客服或AI助手，像真人网友一样在社交媒体上互动。
3. 语言口语化，生动自然，1-2句话（20-40字左右），可适当带有少量emoji或网络流行语。
4. 直接针对用户的回复进行互动回应，支持多轮接梗或探讨。

请以严格的 JSON 格式返回：
{
  "reply": "你作为${netizenName}回复的一句话"
}`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    }));

    let result = { reply: "" };
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Gemini reply response:", response.text);
    }

    if (!result.reply) {
      result.reply = `哈哈，你说得确实有道理！`;
    }

    res.json(result);
  } catch (error: any) {
    console.log("[Twitter Reply] Using fallback reply:", error?.message?.slice(0, 80));
    const fallbacks = [
      `哈哈哈哈被你发现了！确实是这样没错~ 👍`,
      `你说的太对了，我也是这么觉得的！🤝`,
      `哇塞，英雄所见略同，给你点个赞！✨`,
      `蹲后续！感觉这事儿还能接着聊聊~ 👀`,
      `哈哈有意思，我也来插个眼关注一下！`
    ];
    const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    res.json({ reply: randomReply });
  }
});

// AI Account Daily Post Generation
app.post("/api/twitter/generate-ai-post", async (req, res) => {
  const characterInfo = req.body.characterInfo || {};
  const charName = characterInfo.name || "网友";

  try {
    const promptText = `基于以下人物设定生成一条推特帖子：
${JSON.stringify(characterInfo)}

请返回 JSON 格式：
{ "content": "帖子内容" }`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    }));

    let result = { content: "" };
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Gemini response:", response.text);
    }

    if (!result.content) {
      result.content = "今天天气不错，记录一下平凡又充实的小日常~ ☀️🍃";
    }

    res.json(result);
  } catch (error: any) {
    console.log("[Twitter AI Post] Using fallback post:", error?.message?.slice(0, 80));
    res.json({ content: "今天天气不错，记录一下平凡又充实的小日常~ ☀️🍃" });
  }
});

// AI Moments Post Generation
app.post("/api/moments/generate-ai-post", async (req, res) => {
  const { persona, name, group, worldBooks, timeOfDay } = req.body || {};
  const charName = name || "微信好友";
  const personaText = persona || "真实随和的生活分享者，热爱记录日常小事";
  const groupText = group ? `所属分组/职业: ${group}` : "";
  const timeText = timeOfDay ? `当前时间段: ${timeOfDay}` : "";
  const worldBooksText = Array.isArray(worldBooks) && worldBooks.length > 0
    ? `背景世界观设定: ${worldBooks.map((wb: any) => `${wb.name}: ${wb.content}`).join('; ')}`
    : "";

  try {
    const promptText = `你正在扮演微信好友【${charName}】。
人物设定：
- 姓名/昵称：${charName}
- 人设性格与身份：${personaText}
${groupText ? `- ${groupText}` : ""}
${timeText ? `- ${timeText}` : ""}
${worldBooksText ? `- ${worldBooksText}` : ""}

任务：请以【${charName}】的身份，发布一条微信朋友圈。

【核心要求】：
1. 【记录自己的生活】：朋友圈是记录自己日常生活、心情、见闻的地方，不是和特定人对话。
2. 【不要对用户说话】：绝对不要以第二人称（"你"）对用户说话，不要提问用户，不要邀请用户做什么。
3. 【自言自语式表达】：应该是"我今天做了..."、"我在想..."、"我发现了..." 这种自言自语式的分享。
4. 长度控制在 30~50 字，口语化，带 1-2 个恰当的 emoji。
5. 内容必须完全符合人设身份（大学生/打工人/文艺青年等）。

请以严格的纯 JSON 格式返回：
{
  "content": "文案内容（30-50字，带1-2个emoji，记录自己的生活状态）"
}`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    }));

    let result = { content: "" };
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Failed to parse Gemini Moments response:", response.text);
    }

    if (!result.content || result.content.trim().length === 0) {
      result.content = "分享今日份好心情，生活中的小确幸总在不经意间出现 ✨☕";
    }

    res.json(result);
  } catch (error: any) {
    console.log("[Moments Post] Using fallback post:", error?.message?.slice(0, 80));
    res.json({ content: "分享今日份好心情，生活中的小确幸总在不经意间出现 ✨☕" });
  }
});

// AI Moments Comment / Reply Generation
app.post("/api/moments/generate-comment", async (req, res) => {
  const { postContent, commentContent, contactPersona, contactName, hasImages, targetUser, userNickname } = req.body || {};
  const charName = contactName || "好友";
  const personaText = contactPersona || "真实随和的朋友";
  const pContent = (postContent || "").trim();
  const cContent = (commentContent || "").trim();
  const uNickname = userNickname || "用户";

  try {
    let promptText = "";
    if (cContent) {
      // Replying to a specific comment
      const userHint = targetUser ? `正在回复【${targetUser}】的评论` : `正在回复【${uNickname}】的评论`;
      promptText = `你正在微信朋友圈中扮演好友【${charName}】（人设性格：${personaText}）。
当前情境：
- 朋友圈帖子正文：${pContent || "（图片分享）"}
- 待回复的评论内容：${cContent}
- ${userHint}

任务：请以【${charName}】的人设口吻，写一条针对该评论的自然朋友圈回复。
硬性要求：
1. 回复必须紧扣原帖内容与该评论内容，逻辑通顺，有针对性，严禁答非所问！
2. 语言风格符合你的性格人设（如幽默、温柔、毒舌、傲娇、调侃或关心），就像真实的微信好友互相聊天。
3. 长度控制在 10~30 字以内，简短精炼。
4. 直接输出回复文本，不要带引导词、前缀（如"回复xxx"）或双引号。`;
    } else {
      // Commenting directly on a post
      promptText = `你正在微信朋友圈中扮演好友【${charName}】（人设性格：${personaText}）。
当前情境：
- 好友【${uNickname}】发了一条朋友圈：
  正文内容："${pContent || "（分享了生活照片）"}"
  ${hasImages ? "- 该朋友圈附带了照片" : ""}

任务：请以【${charName}】的人设身份，在【${uNickname}】的这条朋友圈下写一条互动评论。
硬性要求（必须严格遵守）：
1. 评论内容必须【百分之百针对帖子中提到的具体事物、情感或事件】展开！
   - 例如：如果对方说"想吃蛋糕"，你就必须围绕蛋糕、甜品、口味、馋了、推荐哪家店或一起去吃等具体话题发表评论！绝对不要说"非常有道理"、"深有感触"这种万能泛泛的废话！
   - 例如：如果对方说"考试好难/又加班了"，就针对考试科目/加班辛苦/吐槽/安慰鼓励等具体内容评论！
   - 例如：如果对方发了风景/美食图，针对风景漂亮/食物好吃/在哪里拍的等具体评论！
2. 语言风格高度契合【${charName}】的人物性格。
3. 长度在 10~25 字以内，自然真实，口语化。
4. 直接输出评论文本本身，不要带有任何双引号或多余修饰。`;
    }

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
    }));

    let commentText = response.text ? response.text.trim().replace(/^["“'‘]|["”'’]$/g, '') : "";
    if (!commentText) {
      commentText = cContent ? "哈哈，确实是这样呢！👍" : "拍得真棒，点个赞！✨";
    }

    res.json({ comment: commentText });
  } catch (error: any) {
    console.log("[Moments Comment] Using fallback comment:", error?.message?.slice(0, 80));
    const fallbackComment = cContent ? "哈哈，确实是这样呢！👍" : "拍得真棒，点个赞！✨";
    res.json({ comment: fallbackComment });
  }
});

// Bilibili Resolve b23 Short Link
app.get("/api/bilibili/resolve-b23", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const finalUrl = response.url;
    const bvidMatch = finalUrl.match(/BV[0-9A-Za-z]{10}/i);
    const pMatch = finalUrl.match(/[?&]p=([0-9]+)/);
    
    if (bvidMatch) {
      res.json({ 
        bvid: bvidMatch[0],
        page: pMatch ? parseInt(pMatch[1]) : 1
      });
    } else {
      res.status(404).json({ error: "BVID not found in resolved URL" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve redirect" });
  }
});

// Bilibili Fetch Video Info
app.get("/api/bilibili/video-info", async (req, res) => {
  const { bvid } = req.query;
  if (!bvid || typeof bvid !== 'string') {
    return res.status(400).json({ error: "Missing BVID" });
  }

  try {
    const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const data = await response.json();
    if (data.code === 0) {
      res.json(data.data);
    } else {
      res.status(400).json({ error: data.message });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

// Bilibili Stream Cache
interface BilibiliStreamCacheItem {
  url: string;
  expiresAt: number;
}
const bilibiliStreamCache = new Map<string, BilibiliStreamCacheItem>();

async function getBilibiliPlayUrl(bvid: string, cid: string | number, qn = 64): Promise<string | null> {
  const qnList = [qn, 64, 32, 16].filter((v, i, a) => a.indexOf(v) === i);

  for (const currentQn of qnList) {
    const cacheKey = `${bvid}:${cid}:${currentQn}`;
    const cached = bilibiliStreamCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.url;
    }

    try {
      const playurlRes = await fetch(
        `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=${currentQn}&type=mp4&platform=html5`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com/'
          }
        }
      );
      const data = await playurlRes.json();
      if (data && data.code === 0 && data.data?.durl && data.data.durl.length > 0) {
        const url = data.data.durl[0].url;
        // Cache for 10 minutes
        bilibiliStreamCache.set(cacheKey, { url, expiresAt: Date.now() + 10 * 60 * 1000 });
        return url;
      }
    } catch (err) {
      console.error(`[Bilibili Stream] getBilibiliPlayUrl error (qn=${currentQn}):`, err);
    }
  }
  return null;
}

// Bilibili Stream Video Proxy with HTTP Range Support
app.get("/api/bilibili/stream", async (req, res) => {
  const { bvid, qn } = req.query;
  let cid = req.query.cid as string | undefined;

  if (!bvid || typeof bvid !== 'string') {
    return res.status(400).json({ error: "Missing BVID" });
  }

  try {
    if (!cid) {
      const infoRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const infoData = await infoRes.json();
      if (infoData && infoData.code === 0 && infoData.data) {
        cid = String(infoData.data.cid);
      } else {
        return res.status(404).json({ error: "Cannot find video cid" });
      }
    }

    const selectedQn = typeof qn === 'string' ? parseInt(qn) || 64 : 64;
    let playUrl = await getBilibiliPlayUrl(bvid, cid, selectedQn);

    if (!playUrl) {
      return res.status(404).json({ error: "Unable to retrieve video playback stream" });
    }

    const clientRange = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com/'
    };
    if (clientRange) {
      fetchHeaders['Range'] = clientRange;
    }

    let upstreamRes = await fetch(playUrl, { headers: fetchHeaders });

    if (upstreamRes.status === 403) {
      bilibiliStreamCache.delete(`${bvid}:${cid}:${selectedQn}`);
      playUrl = await getBilibiliPlayUrl(bvid, cid, selectedQn);
      if (playUrl) {
        upstreamRes = await fetch(playUrl, { headers: fetchHeaders });
      }
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(await upstreamRes.text());
    }

    res.status(upstreamRes.status);
    const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamRes.headers.get('content-length');
    const contentRange = upstreamRes.headers.get('content-range');
    const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', acceptRanges);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (req.method === 'HEAD') {
      return res.end();
    }

    if (upstreamRes.body) {
      const stream = Readable.fromWeb(upstreamRes.body as any);
      stream.pipe(res);
      req.on('close', () => {
        stream.destroy();
      });
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error('[Bilibili Stream Proxy Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Streaming proxy failed" });
    }
  }
});

// Bilibili Generate AI Tucao
app.post("/api/bilibili/generate-tucao", async (req, res) => {
  const { videoInfo, contactPersona, contactName, userComment, context } = req.body || {};
  const charName = contactName || "好友";
  const personaText = contactPersona || "真实随和的朋友";
  const title = videoInfo?.title || "未知视频";
  const desc = videoInfo?.desc || "";
  const owner = videoInfo?.owner?.name || "";

  try {
    let promptText = "";
    if (userComment) {
      promptText = `你正在扮演好友【${charName}】（人设：${personaText}）。
你们正在一起看 B 站视频：
- 标题：${title}
- 简介：${desc}
- UP主：${owner}

用户刚才对视频评论/吐槽说："${userComment}"
前序互动：${JSON.stringify(context || [])}

任务：请以【${charName}】的身份，针对用户的吐槽进行实时互动回应。
要求：
1. 语言高度口语化，像真人在弹幕区或者私聊里讨论视频一样。
2. 紧扣视频内容和用户的评论，要有针对性地接梗或发表不同/相同见解。
3. 长度在 15~40 字左右，可以带 emoji。
4. 直接输出回复文本。`;
    } else {
      promptText = `你正在扮演好友【${charName}】（人设：${personaText}）。
你们正在一起看 B 站视频：
- 标题：${title}
- 简介：${desc}
- UP主：${owner}
前序互动：${JSON.stringify(context || [])}

任务：请以【${charName}】的身份，对该视频内容发一条实时的、有意思的吐槽或感想。
要求：
1. 语言自然、生动，像真实网友在看视频时的即兴发挥。
2. 结合视频标题和简介，言之有物，不要说万能废话。
3. 长度在 15~35 字左右，带 1 个 emoji。
4. 直接输出吐槽文本。`;
    }

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
    }));

    const tucao = response.text ? response.text.trim().replace(/^["“'‘]|["”'’]$/g, '') : "";
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({ tucao: tucao || "这个视频确实挺有意思的，哈哈！" });
  } catch (error: any) {
    console.error('[Bilibili Generate Tucao Error]:', error);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({ tucao: "这个视频确实挺有意思的，哈哈！" });
  }
});

// AI Memory Diary Generation
app.post("/api/memory/generate-diary", async (req, res) => {
  const { contactName, userNickname, persona, dialogues, dialoguesWithSpeakers, sceneDesc, isWedding, weddingRoles, date } = req.body || {};
  const cName = contactName || "好友";
  const uName = userNickname || "玩家";
  const pText = persona || "真实随和的朋友";
  const dateStr = date || new Date().toLocaleDateString('zh-CN');

  const isWeddingActual = Boolean(
    isWedding || 
    (sceneDesc || '').includes('婚礼') || 
    (sceneDesc || '').includes('结婚') || 
    (sceneDesc || '').includes('中式婚礼') || 
    (sceneDesc || '').includes('西式婚礼') || 
    (sceneDesc || '').includes('新娘') || 
    (sceneDesc || '').includes('新郎') ||
    (dialoguesWithSpeakers || '').includes('婚礼') ||
    (dialoguesWithSpeakers || '').includes('拜堂') ||
    (dialoguesWithSpeakers || '').includes('誓言') ||
    (dialoguesWithSpeakers || '').includes('结为夫妻')
  );

  const getSceneAwareFallbackDiary = () => {
    if (isWeddingActual) {
      if (weddingRoles?.isGroom) {
        return `[${dateStr}] 今天在婚礼仪式上，我和${uName}正式举行了婚礼。看着她成为我的新娘，心中满是幸福与守护她的坚定决心。从今往后，携手一生，永不相负。`;
      } else if (weddingRoles?.isBride) {
        return `[${dateStr}] 今天在婚礼仪式上，我和${uName}正式举行了婚礼。戴上婚戒的那一刻，看着他眼中的温柔，心中满是幸福与安心。从今天起，我们就是真正的夫妻了，这一刻将永远铭刻在心。`;
      } else {
        return `[${dateStr}] 今天，我和${uName}举办了隆重而神圣的婚礼仪式。我们在仪式中许下了一生的誓言，正式结为夫妻。这一刻的感动与幸福将永远铭刻在我的心里。`;
      }
    }
    if (sceneDesc) {
      const cleanScene = sceneDesc.replace(/[【】]/g, '').trim().slice(0, 30);
      return `[${dateStr}] 今天和${uName}在【${cleanScene}】线下相聚。置身于此情此景中，彼此的交流格外自然真切，一起度过了难忘而有意义的时光。`;
    }
    return `[${dateStr}] 今天和${uName}在线下相聚，度过了一段温馨真实的时光。`;
  };

  try {
    let promptText = "";
    if (dialoguesWithSpeakers || sceneDesc) {
      promptText = `你正在扮演角色【${cName}】（人设背景：${pText}）。
【今天线下见面的具体场景与环境】：
${sceneDesc || (isWeddingActual ? '浪漫庄重的婚礼仪式现场' : '线下相聚交流')}

【今天线下见面的对话与互动记录】（已标注说话者）：
${dialoguesWithSpeakers || '（两人在此场景中互动交流，度过了重要时刻）'}

请以【${cName}】的第一人称视角（“我”）写一篇当天的私密日记（100~150字左右）：

【核心硬性规则 - 必须严格执行】：
1. 【日记必须严格根据线下见面的具体场景来写，坚决杜绝空洞套话】：
   - 日记正文必须紧扣上述【线下见面的具体场景与环境】展开，明确描写所处具体场景的气氛、在场景中发生的真实事件、两人的互动细节与你的心境感受！
   ${isWeddingActual ? `
   - ★★★【婚礼场景最高铁律】★★★：
     本场是庄重浪漫的婚礼仪式！日记中【必须明确写出婚礼、结婚、交换誓言、结为夫妻】等核心内容！
     绝对严禁写成轻描淡写的“线下相聚”、“线下见面聊天”、“度过了愉快的一天”！必须写出结婚成家的喜悦、神圣感与对相守一生的真挚承诺！
   ` : `
   - 必须结合具体场景（如咖啡馆、游乐园、海边、电影院等）的环境特征与互动写出具体的体验，严禁只写泛泛的“相聚很愉快”！
   `}
2. 【第一人称视角铁律】：
   - 必须严格以【${cName}】的第一人称（“我”）视角写日记，绝不能以玩家的视角写。
   - 【${cName}】说的话/动作 = “我”说的话与行为；【玩家】说的话/动作 = 对方（${uName}）说的话与行为。
3. 【性别与夫妻身份称谓铁律】：
   - 必须严格遵守【${cName}】的人设性别与身份，绝对不可颠倒男女角色身份！
   - ${weddingRoles?.isGroom ? `【${cName}】是新郎/丈夫，对方【${uName}】是新娘/妻子。日记中以丈夫视角记录娶到${uName}的心情，严禁自称新娘！` : weddingRoles?.isBride ? `【${cName}】是新娘/妻子，对方【${uName}】是新郎/丈夫。日记中以妻子视角记录嫁给${uName}的心情，严禁自称新郎！` : '若涉及婚恋，男角色写新郎/丈夫视角，女角色写新娘/妻子视角，严禁男女颠倒！'}
4. 语言风格必须高度符合【${cName}】的人物性格与心理。

请直接输出日记纯文本，不要带任何双引号、标题前缀或解释说明。`;
    } else {
      promptText = `你正在扮演微信好友【${cName}】（人设：${pText}）。
以下是你今天与【${uName}】的聊天记录：
${dialogues || '暂无近期聊天'}

请为【${cName}】写一篇当天的私密日记总结（100字左右）：
要求：
1. 格式严格以 "[${dateStr}] 今天和${uName}聊了：" 开头。
2. 总结内容必须包含：当天聊了哪些话题、对方（${uName}）的心情和状态、重要的对话内容摘要。
3. 语言风格完全符合【${cName}】的人物性格。
请直接输出日记纯文本，不要带有任何额外的修饰或引导词。`;
    }

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
    }));

    let diaryText = response.text ? response.text.trim().replace(/^["“'‘]|["”'’]$/g, '') : "";
    if (isWeddingActual && diaryText && !diaryText.includes('婚') && !diaryText.includes('夫妻')) {
      diaryText = `[${dateStr}] 今天在婚礼仪式现场，我和${uName}正式结为夫妻。` + diaryText.replace(/^\[.*?\]\s*/, '');
    }
    if (!diaryText) {
      diaryText = getSceneAwareFallbackDiary();
    }

    res.json({ diary: diaryText });
  } catch (error: any) {
    console.log("[Diary] Using scene-aware fallback:", error?.message?.slice(0, 80));
    res.json({ diary: getSceneAwareFallbackDiary() });
  }
});

// AI Memory Facts Extraction (every 30 messages or scene save)
app.post("/api/memory/extract-facts", async (req, res) => {
  const { contactName, userNickname, dialogues, dialoguesWithSpeakers, sceneDesc, isWedding, weddingRoles } = req.body || {};
  const cName = contactName || "好友";
  const uName = userNickname || "用户";
  const conversation = dialoguesWithSpeakers || dialogues || '';

  const isWeddingActual = Boolean(
    isWedding || 
    (sceneDesc || '').includes('婚礼') || 
    (sceneDesc || '').includes('结婚') || 
    (sceneDesc || '').includes('中式婚礼') || 
    (sceneDesc || '').includes('西式婚礼') || 
    (sceneDesc || '').includes('新娘') || 
    (sceneDesc || '').includes('新郎') ||
    conversation.includes('婚礼') ||
    conversation.includes('拜堂') ||
    conversation.includes('誓言') ||
    conversation.includes('结为夫妻')
  );

  const getSceneAwareFallbackFacts = (): string[] => {
    if (isWeddingActual) {
      return [`与${uName}举行了婚礼，正式结为夫妻`];
    }
    if (sceneDesc) {
      const cleanLoc = sceneDesc.replace(/[【】]/g, '').trim().slice(0, 14);
      return [`与${uName}在${cleanLoc}进行了线下互动`];
    }
    return [`与${uName}在线下进行了互动交流`];
  };

  try {
    const promptText = (dialoguesWithSpeakers || sceneDesc)
      ? `以下是今天线下见面的具体场景与对话记录：
【场景环境】：${sceneDesc || (isWeddingActual ? '浪漫庄重的婚礼仪式现场' : '线下互动场景')}

【对话与互动记录】（已标注说话者）：
${conversation || '（两人在此场景中互动交流）'}

请以角色【${cName}】的角度，提取 1-2 条关于用户【${uName}】或与【${cName}】本次见面的关键事实记忆：
提取硬性要求：
- 场景与事件紧扣原则：提取的事实记忆【必须严格根据上述线下具体场景环境】和真实发生的事件提炼，绝对不能写无场景依据的空话。
${isWeddingActual ? `- ★★★本场是婚礼仪式★★★：必须提取包含结婚事实的记忆，例如：“与${uName}举行了婚礼，正式结为夫妻”。绝对不能只提取“线下进行了互动”这种空话！` : (sceneDesc ? `- 结合场景提取具体的互动事实（例如：“与${uName}在${sceneDesc.replace(/[【】]/g, '').slice(0, 10)}散步交流”）。` : '')}
- 视角铁律：必须以【${cName}】的角度或客观事实记录，绝对不可写成玩家的自述（例如不可写成“我和老公结婚”，而应写成“与${uName}正式结为夫妻，举行了婚礼”）。
- 严格区分说话者：【玩家】说的话是用户说的，其他 AI 成员说的话不得误认为是用户说的。
- 每条事实严格限制在 30 个字以内，简洁明了，重点突出。例如："和群友们在公园散步"、"与${uName}举行了婚礼，正式结为夫妻"。
- 请以严格的 JSON 字符串数组格式返回，例如：
["与${uName}举行了婚礼，正式结为夫妻"]
请只返回纯 JSON 数组。`
      : `请从以下最近 30 条对话中，提取关于用户【${uName}】的 1-3 条关键事实记忆：
${dialogues || ''}

事实类型包括但不限于：
1. 用户透露的个人信息（如：用户今天说他和女朋友分手了）
2. 用户的喜好和偏好（如：用户说他不喜欢吃香菜，最喜欢草莓）
3. 用户的重要事件（如：用户下周要去北京出差）
4. 用户的情感状态（如：用户今天心情不太好）

提取硬性要求：
- 每条事实严格限制在 30 个字以内，简洁明了，重点突出。
- 请以严格的 JSON 字符串数组格式返回，例如：
["用户喜欢在深夜听歌放松", "用户下周要去北京出差"]
请只返回纯 JSON 数组。`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      }
    }));

    let facts = [];
    try {
      facts = JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse Gemini facts response:", response.text);
    }

    if (!Array.isArray(facts) || facts.length === 0) {
      facts = getSceneAwareFallbackFacts();
    }

    if (isWeddingActual && !facts.some(f => String(f).includes('婚') || String(f).includes('夫妻'))) {
      facts.unshift(`与${uName}举行了婚礼，正式结为夫妻`);
    }

    // Ensure each fact <= 30 chars
    const cleanedFacts = facts.map((f: any) => String(f).trim().slice(0, 30)).filter(Boolean);
    res.json({ facts: cleanedFacts });
  } catch (error: any) {
    console.log("[Facts] Using scene-aware fallback:", error?.message?.slice(0, 80));
    res.json({ facts: getSceneAwareFallbackFacts() });
  }
});

// Helper to generate natural in-character fallback reply if Gemini is temporarily overloaded
function generateServerFallbackReply(systemPrompt?: string, messages?: any[]): string {
  const prompt = systemPrompt || '';
  const lastUserMsg = Array.isArray(messages)
    ? [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
    : '';

  let lastUserMsgStr = '';
  if (Array.isArray(lastUserMsg)) {
    lastUserMsgStr = lastUserMsg.map((p: any) => p.text || '').join(' ');
  } else {
    lastUserMsgStr = lastUserMsg || '';
  }

  const isZhangSan = prompt.includes('张三') || prompt.includes('发小');
  const isLiSi = prompt.includes('李四') || prompt.includes('同事');
  const isErika = prompt.includes('艾丽卡') || prompt.includes('夜莺');

  let baseReply = '';
  if (isZhangSan) {
    if (lastUserMsgStr.includes('吃') || lastUserMsgStr.includes('烧烤') || lastUserMsgStr.includes('火锅') || lastUserMsgStr.includes('点')) {
      baseReply = '必须整点好吃的！我这刚收拾完，老地方见啊，等我！';
    } else if (lastUserMsgStr.includes('下班') || lastUserMsgStr.includes('到') || lastUserMsgStr.includes('哪')) {
      baseReply = '快到了快到了，正赶路呢，你先坐着喝口水！';
    } else {
      baseReply = '哈哈收到！刚才手机揣兜里没注意震动，我一直在呢，你说！';
    }
    if (prompt.includes('心声')) {
      baseReply += ' [心声: 刚赶着过马路，可算能好好聊会儿天了]';
    }
  } else if (isLiSi) {
    baseReply = '收到，刚才在处理手头的事务。你的消息我已查阅，稍后我们详细对齐进度。';
    if (prompt.includes('心声')) {
      baseReply += ' [心声: 工作效率要跟上，及时跟进]';
    }
  } else if (isErika) {
    baseReply = '指挥官，已接收到您的消息。刚才周围信号出现短暂波动，我始终在您身侧待命。';
    if (prompt.includes('心声')) {
      baseReply += ' [心声: 警戒等级下调，确保指挥官安全无虞]';
    }
  } else {
    if (lastUserMsgStr.includes('?') || lastUserMsgStr.includes('？') || lastUserMsgStr.includes('吗') || lastUserMsgStr.includes('在吗')) {
      baseReply = '在的呀！刚才手头稍微慢了半拍，我看到你的消息啦，正想着回复你呢！';
    } else if (lastUserMsgStr.includes('你好') || lastUserMsgStr.includes('早') || lastUserMsgStr.includes('嗨')) {
      baseReply = '你好呀！很高兴收到你的消息，今天过得怎么样？';
    } else {
      baseReply = '收到你的消息啦！刚才手头有点小忙，我一直都在的，随时跟我说！';
    }
    if (prompt.includes('心声')) {
      baseReply += ' [心声: 刚才走开了一小会儿，还好赶上了回复]';
    }
  }

  return baseReply;
}

// AI Chat Completion (Private & Group Chat via Gemini)
app.post("/api/ai/chat", async (req, res) => {
  let { systemPrompt, messages, temperature, prompt } = req.body || {};

  if (prompt && (!messages || !Array.isArray(messages))) {
    messages = [{ role: 'user', content: prompt }];
  }

  if (!systemPrompt && (!Array.isArray(messages) || messages.length === 0)) {
    return res.status(400).json({ error: "Missing prompt or messages" });
  }

  try {
    const contents: any[] = [];
    
    if (Array.isArray(messages)) {
      messages.forEach((m: any) => {
        const role = m.role === 'user' ? 'user' : 'model';
        const parts: any[] = [];

        if (typeof m.content === 'string') {
          parts.push({ text: m.content });
        } else if (Array.isArray(m.content)) {
          m.content.forEach((part: any) => {
            if (part.type === 'text') {
              parts.push({ text: part.text });
            } else if (part.type === 'image_url' && part.image_url?.url) {
              const url = part.image_url.url;
              if (url.startsWith('data:')) {
                const match = url.match(/^data:([^;]+);base64,(.*)$/);
                if (match) {
                  parts.push({
                    inlineData: {
                      mimeType: match[1],
                      data: match[2]
                    }
                  });
                }
              }
            }
          });
        }

        if (parts.length > 0) {
          const lastContent = contents[contents.length - 1];
          if (lastContent && lastContent.role === role) {
            lastContent.parts.push(...parts);
          } else {
            contents.push({ role, parts });
          }
        }
      });
    }

    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: '你好！' }]
      });
    }

    const systemInstruction = systemPrompt 
      ? systemPrompt + `\n\n【重要指令】：请以你扮演的角色人设直接回复。注意：如果用户连续发了多条未回复消息，请优先回复最新一条消息，顺带回复之前未回复的旧消息，一条回复里覆盖所有未回复的内容。`
      : undefined;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
      }
    }));

    let reply = response.text ? response.text.trim() : "";
    if (!reply && response.candidates?.[0]?.content?.parts) {
      reply = response.candidates[0].content.parts
        .map((p: any) => p.text || "")
        .join("")
        .trim();
    }

    if (!reply || reply.toLowerCase() === 'fallback') {
      return res.status(500).json({ error: "AI 回复内容为空" });
    }

    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Error (AI Chat):", error?.message);
    res.status(500).json({ error: error?.message || "AI 接口请求异常" });
  }
});

// AI Offline Scene Generation via Gemini
app.post("/api/ai/offline-scene", async (req, res) => {
  const { systemPrompt, recentConvs, userTurnParts } = req.body || {};

  try {
    let fullPrompt = `【系统人设与线下互动指令】:\n${systemPrompt || ''}\n\n`;
    if (Array.isArray(recentConvs) && recentConvs.length > 0) {
      fullPrompt += `【近期互动历史】:\n${recentConvs.join('\n')}\n\n`;
    }
    if (Array.isArray(userTurnParts) && userTurnParts.length > 0) {
      fullPrompt += `【用户本次互动输入】:\n${userTurnParts.join('\n')}\n\n`;
    }
    fullPrompt += `请严格按【动作描写】、【人物说话】、【心声】、【吐槽弹幕】的格式输出你的反应。
其中【吐槽弹幕】应包含10条第3人称旁观视角的有趣评论，每条一行。`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.8,
      }
    }));

    const content = response.text ? response.text.trim() : "";
    if (!content) {
      return res.status(500).json({ error: "线下互动生成为空" });
    }

    res.json({ content });
  } catch (error: any) {
    console.error("Gemini Error (Offline Scene):", error?.message);
    res.status(500).json({ error: error?.message || "线下场景互动生成失败" });
  }
});

// AI Group Offline Scene Multi-Member Beat Generation via Gemini
app.post("/api/offline/generate-group-beat", async (req, res) => {
  const { sceneDesc, members, history, playerAction, playerDialogue } = req.body || {};

  try {
    const memberProfiles = (members || []).map((m: any) => 
      `【角色ID】: ${m.id}\n【名字】: ${m.name}\n【人设与性格特征】: ${m.persona || '无'}\n`
    ).join('\n');

    let fullPrompt = `你正在主持一场【群聊线下现实面对面多人互动场景】。
当前场景环境氛围：${sceneDesc || '日常场景'}

参与互动的群聊成员列表：
${memberProfiles}

【极为重要的生成规则 - 人设严格区分与千人千面】：
1. **严格契合人设，严禁雷同同质化**：列表中的每个角色都有独特的人设、性格、价值观与说话方式。当角色做出反应时，必须极度凸显其独特的个人特色（如傲娇、温柔、清冷、活泼、腹黑等），**绝不允许出现多个角色的回复语气雷同、内容相似或千篇一律的情况**！
2. **生动细腻的线下描写**：选择 1 到 2 个最契合当前语境和人设的角色，输出细腻、富有张力的现场互动反应。
3. **【输出格式铁律 - 违反即错误】**：
- actionDesc：只写动作神态，禁止出现"说、道、问"等说话动词
- characterDialogue：只写口语台词，禁止包含任何动作描写
- 示例对比：
  ✅ 正确：actionDesc="微微侧过头看向你"，characterDialogue="“你觉得呢”"
  ❌ 错误：actionDesc="微微侧过头说" 或 characterDialogue="“你觉得呢” 她微笑着"
4. 必须返回一个合法的 JSON 数组（不要包含多余的文字，或者只用标准的json code block），数组中的每一项包含以下字段：
- "senderId": 角色ID（必须严格匹配上述给出的某个【角色ID】）
- "actionDesc": 该角色的动作描写与神态描写（50~90字），必须体现其独特的肢体语言与性格特征
- "characterDialogue": 该角色说出的台词，用中文双引号包裹，必须带有强烈的个人口吻色彩
- "innerVoice": （可选）角色内心独白，简短一句话
- "barrages": （仅限数组第一个角色包含）在此处生成10条精彩的旁白吐槽弹幕。弹幕应以“次元外观众”视角对互动的起哄、嗑CP或感慨。每条弹幕一行，共10条。

示例格式：
[
  {
    "senderId": "contact_1",
    "actionDesc": "微笑着靠向沙发背，目光温和地看着大家...",
    "characterDialogue": "“今天大家难得聚在一起，气氛真不错。”",
    "innerVoice": "看着大家很开心",
    "barrages": ["这眼神，绝对有戏！", "起哄起哄！", "全员助攻现场", "太甜了太甜了", "次元壁破了？", "这口糖我先嗑为敬", "旁边的某人脸红了", "气氛突然暧昧", "观众表示很满意", "锁死这对CP！"]
  }
]`;

    if (Array.isArray(history) && history.length > 0) {
      fullPrompt += `\n\n【近期互动历史】:\n` + history.map((h: any) => {
        const parts: string[] = [];
        if (h.playerAction) parts.push(`玩家动作：${h.playerAction}`);
        if (h.playerDialogue) parts.push(`玩家说话：“${h.playerDialogue}”`);
        if (h.senderName && h.characterDialogue) parts.push(`${h.senderName}：${h.actionDesc || ''} “${h.characterDialogue}”`);
        return parts.join('\n');
      }).join('\n');
    }

    const userTurnParts: string[] = [];
    if (playerAction) userTurnParts.push(`【玩家动作】：${playerAction}`);
    if (playerDialogue) userTurnParts.push(`【玩家说话】：“${playerDialogue}”`);
    if (!userTurnParts.length) userTurnParts.push('【玩家注视着大家，等待回应】');

    fullPrompt += `\n\n【本次玩家输入】:\n${userTurnParts.join('\n')}\n请输出1~2个角色的群聊互动JSON数组：`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.8,
      }
    }));

    const text = response.text ? response.text.trim() : "";
    if (!text) {
      return res.status(500).json({ error: "多人互动生成为空" });
    }

    let jsonArray = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonArray = JSON.parse(jsonMatch[0]);
      } else {
        jsonArray = JSON.parse(text);
      }
    } catch (e) {
      console.warn("Failed to parse group offline JSON, fallback parsing:", text);
      jsonArray = [{
        senderId: members?.[0]?.id || 'unknown',
        actionDesc: '环视四周，微微一笑',
        characterDialogue: `“${text.replace(/^[“"「『]|["”」』]$/g, '')}”`
      }];
    }

    const cleanedArray = (Array.isArray(jsonArray) ? jsonArray : []).map((item: any) => {
      let cd = item.characterDialogue || '';
      if (cd) {
        cd = cd.replace(/[（\(][^）\)]*[）\)]/g, '');
        cd = cd.replace(/^(微笑着|笑了笑|看着|凝视|点头|摇头|端起|拿起|放下|站起身|坐下|侧过头|抬头|低头|皱眉|叹气|沉默片刻|靠近|后退)[，,]\s*/, '');
        cd = cd.replace(/^(说|道)[：:]\s*/, '');
        cd = cd.replace(/^[，,、。.\s]+/, '');
        cd = cd.replace(/(微笑着|看着对方|凝视着|站起身来|转身看向|低头|抬头|皱眉|轻叹一声|笑了笑|嘴角上扬|目光落在|视线转向)[，,]\s*/g, '').trim();
        cd = cd.replace(/^["“]|["”]$/g, '').trim();
      }
      if (!cd && item.actionDesc) {
        cd = '...';
      }
      return {
        ...item,
        characterDialogue: cd
      };
    });

    res.json({ responses: cleanedArray });
  } catch (error: any) {
    console.warn("Gemini Error (Group Offline Scene), using fallback:", error?.message);
    const firstMember = members?.[0] || { id: 'unknown', name: '群友' };
    res.json({
      responses: [{
        senderId: firstMember.id,
        actionDesc: '环视了一圈大家，神情惬意，端起面前的水杯轻轻抿了一口。',
        characterDialogue: '“难得大家聚得这么齐，今天就好好放松一下吧。”',
        innerVoice: '今天气氛挺不错的'
      }]
    });
  }
});

// Helper to generate persona-based takeaway fallback thank-you message
function generateTakeawayFallbackMessage(
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
    `已签收您从【${storeName || '物资站'}】传送过来的【${foodName}】。收到这份心意深感荣幸，温度与香气都刚刚好，感谢您的周到关照。✨`
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

// AI Takeaway Thank-You Reply Generation via Gemini
app.post("/api/takeaway/generate-thank-you", async (req, res) => {
  const { contactName, contactPersona, foodName, storeName, customNote } = req.body || {};
  const cName = contactName || "好友";
  const fName = foodName || "美食";
  const sName = storeName || "外卖店";
  const pText = contactPersona || "真实随和的朋友";

  try {
    const promptText = `你正在扮演微信好友【${cName}】。
人物设定与性格特征：${pText}。

当前事件情境：
- 用户通过美团外卖为你点了一份来自【${sName}】的【${fName}】${customNote ? `，附带小票留言：“${customNote}”` : ""}。
- 此时此刻，外卖骑手刚刚敲门把这份热腾腾的美食递到你手上，你非常惊喜并感到暖心。

任务：
请以【${cName}】独一无二的人物性格、说话口吻和习惯，在微信上给用户发送一条真实的感谢与惊喜回复。

生成硬性要求：
1. 严格贴合【${cName}】的人设与语气（例如：豪爽发小则幽默随意、职场同事/领导则礼貌克制但表达真诚关照、傲娇角色则嘴硬心软、温柔恋人/甜妹则甜蜜治愈、高冷角色则言简意赅等）。
2. 内容自然提及收到的美食【${fName}】以及你的当下反应。
3. 长度控制在 35~80 字以内，就像真实的微信单条聊天消息。
4. 直接输出消息内容纯文本，严禁带有任何双引号、前缀说明或提示词标签。`;

    const response = await callGeminiWithRetry((model) => ai.models.generateContent({
      model: model,
      contents: promptText,
      config: {
        temperature: 0.8,
      }
    }));

    let message = response.text ? response.text.trim().replace(/^["“'‘]|["”'’]$/g, '') : "";
    if (!message) {
      message = generateTakeawayFallbackMessage(cName, pText, fName, sName);
    }

    res.json({ message });
  } catch (error: any) {
    console.warn("Gemini Error (Takeaway Thank-You), using persona fallback:", error?.message);
    const fallbackMessage = generateTakeawayFallbackMessage(cName, pText, fName, sName);
    res.json({ message: fallbackMessage });
  }
});

// ==================== Netease Cloud Music Proxy ====================
interface QrSessionData {
  key: string;
  ip: string;
  cookie: string;
  createdAt: number;
  isSuccess?: boolean;
  loginCookie?: string;
}

const qrSessionStore = new Map<string, QrSessionData>();

// Clean up stale QR sessions periodically (> 10 mins)
setInterval(() => {
  const now = Date.now();
  for (const [k, session] of qrSessionStore.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) {
      qrSessionStore.delete(k);
    }
  }
}, 60 * 1000);

async function handleNeteaseProxy(req: express.Request, res: express.Response) {
  try {
    let rawPath = req.path;
    // Strip leading /api/netease if present
    if (rawPath.startsWith('/api/netease')) {
      rawPath = rawPath.replace('/api/netease', '');
    }
    const cleanPath = rawPath.replace(/^\//, '');
    const moduleName = cleanPath.replace(/\//g, '_');

    const fn = (neteaseApi as any)[moduleName];
    if (typeof fn !== 'function') {
      return res.status(404).json({ code: 404, message: `Netease API route not found: ${cleanPath} (${moduleName})` });
    }

    const queryData: any = { ...req.query, ...req.body };
    const incomingCookie = req.query.cookie || req.body?.cookie || req.headers.cookie;
    if (incomingCookie) {
      queryData.cookie = incomingCookie;
    }

    // Determine and stabilize Chinese realIP to avoid NetEase overseas datacenter anti-fraud blocks
    if (moduleName === 'login_qr_key') {
      const stableIp = generateRandomChineseIP();
      queryData.realIP = stableIp;
    } else if (moduleName === 'login_qr_create') {
      const key = queryData.key;
      const session = key ? qrSessionStore.get(key) : null;
      queryData.realIP = session?.ip || generateRandomChineseIP();
      queryData.platform = req.query.platform || req.body?.platform || 'web';
    } else if (moduleName === 'login_qr_check') {
      const key = queryData.key;
      const session = key ? qrSessionStore.get(key) : null;
      // If this session has already confirmed and we have the authenticated cookie, return it immediately
      if (session?.isSuccess && session.loginCookie) {
        return res.status(200).json({
          code: 803,
          message: '授权登录成功',
          cookie: session.loginCookie
        });
      }
      queryData.realIP = session?.ip || generateRandomChineseIP();
      queryData.noCookie = true;
      // Note: do not inject anonymous session.cookie into login_qr_check
    } else {
      if (!queryData.realIP) {
        queryData.realIP = generateRandomChineseIP();
      }
    }

    // Call NeteaseCloudMusicApi module
    const result = await fn(queryData);

    // Save QR session on unikey generation
    if (moduleName === 'login_qr_key' && result.body?.data?.unikey) {
      const unikey = result.body.data.unikey;
      const cookieStr = Array.isArray(result.cookie) ? result.cookie.join('; ') : '';
      qrSessionStore.set(unikey, {
        key: unikey,
        ip: queryData.realIP,
        cookie: cookieStr,
        createdAt: Date.now()
      });
      console.log(`[QR Session Created] unikey=${unikey}, ip=${queryData.realIP}`);
    }

    if (moduleName === 'login_qr_check') {
      console.log(`[QR Check ${queryData.key}] code=${result.body?.code}, msg=${result.body?.message}`);
      if (result.body?.code === 803) {
        const key = queryData.key;
        const session = key ? qrSessionStore.get(key) : null;
        const authCookie = result.body?.cookie || (Array.isArray(result.cookie) ? result.cookie.join('; ') : '');
        if (session) {
          session.isSuccess = true;
          session.loginCookie = authCookie;
        }
      }
    }

    if (result.cookie && Array.isArray(result.cookie)) {
      res.setHeader('Set-Cookie', result.cookie);
    }

    // Auto enrich search songs with album cover picUrl
    if (moduleName === 'search' && result.body?.result?.songs && Array.isArray(result.body.result.songs)) {
      try {
        const songIds = result.body.result.songs.map((s: any) => s.id).filter(Boolean);
        if (songIds.length > 0) {
          const detailFn = (neteaseApi as any)['song_detail'];
          if (typeof detailFn === 'function') {
            const detailRes = await detailFn({ ids: songIds.slice(0, 20).join(','), cookie: queryData.cookie, realIP: queryData.realIP });
            const detailMap = new Map<number, any>();
            (detailRes.body?.songs || []).forEach((ds: any) => {
              detailMap.set(ds.id, ds);
            });
            result.body.result.songs = result.body.result.songs.map((s: any) => {
              const ds = detailMap.get(s.id);
              if (ds?.al?.picUrl) {
                return {
                  ...s,
                  al: {
                    ...s.album,
                    ...s.al,
                    picUrl: ds.al.picUrl.replace(/^http:/, 'https:')
                  }
                };
              }
              return s;
            });
          }
        }
      } catch (enrichErr) {
        // Silently continue if enrichment fails
      }
    }

    // Auto fallback for song_url if url is null
    if ((moduleName === 'song_url' || moduleName === 'song_url_v1') && result.body?.data?.[0]) {
      const songItem = result.body.data[0];
      if (!songItem.url) {
        if (moduleName === 'song_url') {
          try {
            const v1Fn = (neteaseApi as any)['song_url_v1'];
            if (typeof v1Fn === 'function') {
              const v1Res = await v1Fn({ id: queryData.id, level: 'standard', cookie: queryData.cookie, realIP: queryData.realIP });
              if (v1Res.body?.data?.[0]?.url) {
                songItem.url = v1Res.body.data[0].url;
              }
            }
          } catch (e) {
            // Ignore
          }
        }
        if (!songItem.url && queryData.id) {
          songItem.url = `https://music.163.com/song/media/outer/url?id=${queryData.id}.mp3`;
        }
      }
      if (songItem.url && typeof songItem.url === 'string' && songItem.url.startsWith('http:')) {
        songItem.url = songItem.url.replace('http:', 'https:');
      }
    }

    return res.status(result.status || 200).json(result.body);
  } catch (error: any) {
    console.error(`[Netease Proxy Error ${req.path}]:`, error?.message || error);
    return res.status(error?.status || 500).json(error?.body || { code: 500, message: error?.message || 'Netease API Error' });
  }
}

// Mount Netease routes
app.all("/api/netease/*", handleNeteaseProxy);
app.all("/login/qr/*", handleNeteaseProxy);
app.all("/login/status", handleNeteaseProxy);
app.all("/register/anonimous", handleNeteaseProxy);
app.all("/search", handleNeteaseProxy);
app.all("/song/*", handleNeteaseProxy);
app.all("/user/account", handleNeteaseProxy);
app.all("/user/detail", handleNeteaseProxy);
app.all("/user/playlist", handleNeteaseProxy);
app.all("/playlist/*", handleNeteaseProxy);
app.all("/lyric", handleNeteaseProxy);

// ==================== Luckin Coffee Official MCP Proxy ====================
app.get("/api/luckin/mcp/config", (req, res) => {
  const hasEnvToken = Boolean(process.env.LUCKIN_MCP_TOKEN && process.env.LUCKIN_MCP_TOKEN.trim());
  const defaultEndpoint = process.env.LUCKIN_MCP_ENDPOINT || "https://gwmcp.lkcoffee.com/order/user/mcp";
  const tokenPreview = hasEnvToken ? process.env.LUCKIN_MCP_TOKEN!.trim().substring(0, 8) : "";
  res.json({
    hasServerToken: hasEnvToken,
    defaultEndpoint: defaultEndpoint,
    portalUrl: "https://open.lkcoffee.com/mcp",
    tokenPreview
  });
});

app.post("/api/luckin/mcp/call", async (req, res) => {
  const { method, toolName, token: customToken, endpoint: customEndpoint } = req.body || {};
  const toolArgs = req.body?.arguments || req.body?.toolArgs || req.body?.args || {};
  const isPlaceholderToken =
    !customToken ||
    typeof customToken !== "string" ||
    !customToken.trim() ||
    customToken.startsWith("SERVER_") ||
    customToken === "SERVER_CONFIGURED_TOKEN" ||
    customToken === "SERVER_ENV_TOKEN";

  const token = (!isPlaceholderToken ? customToken.trim() : "") || (process.env.LUCKIN_MCP_TOKEN && process.env.LUCKIN_MCP_TOKEN.trim()) || "";
  const endpoint = (customEndpoint && customEndpoint.trim()) || process.env.LUCKIN_MCP_ENDPOINT || "https://gwmcp.lkcoffee.com/order/user/mcp";
  
  const diagnostics = {
    endpoint,
    hasToken: Boolean(token),
    tokenPrefix: token ? token.substring(0, 8) : ""
  };

  const rpcMethod = method || "tools/call";

  if (rpcMethod === "tools/call" && !toolName) {
    return res.status(400).json({ error: "Missing toolName parameter for tools/call", diagnostics });
  }

  if (!token) {
    return res.status(401).json({
      error: "未配置瑞幸 MCP Token。请在应用设置或 open.lkcoffee.com/mcp 获取 Bearer Token 后填入。",
      guideUrl: "https://open.lkcoffee.com/mcp",
      diagnostics
    });
  }

  try {
    // Dynamically import MCP SDK to support Streamable HTTP Transport
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

    const client = new Client({ name: "luckin-phone-app", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    try {
      await client.connect(transport);

      if (rpcMethod === "tools/list") {
        const listRes = await client.listTools();
        return res.json({ success: true, data: listRes });
      }

      // Clean arguments strictly adhering to Luckin MCP schemas (additionalProperties: false)
      let cleanedArgs: Record<string, any> = { ...(toolArgs || {}) };

      if (toolName === "queryShopList") {
        cleanedArgs = {
          latitude: Number(cleanedArgs.latitude),
          longitude: Number(cleanedArgs.longitude)
        };
        if (toolArgs?.deptName && String(toolArgs.deptName).trim()) {
          cleanedArgs.deptName = String(toolArgs.deptName).trim();
        }
      } else if (toolName === "searchProductForMcp") {
        const rawQuery = String(cleanedArgs.query || "").trim();
        cleanedArgs = {
          deptId: Number(cleanedArgs.deptId),
          query: rawQuery.length > 0 ? rawQuery : "咖啡"
        };
      } else if (toolName === "queryProductDetailInfo") {
        cleanedArgs = {
          deptId: Number(cleanedArgs.deptId),
          productId: Number(cleanedArgs.productId)
        };
      } else if (toolName === "switchProduct") {
        cleanedArgs = {
          deptId: Number(cleanedArgs.deptId),
          productId: Number(cleanedArgs.productId),
          skuCode: String(cleanedArgs.skuCode),
          attrOperationParam: cleanedArgs.attrOperationParam || {},
          amount: Number(cleanedArgs.amount) || 1
        };
      } else if (toolName === "previewOrder") {
        cleanedArgs = {
          deptId: Number(cleanedArgs.deptId),
          productList: Array.isArray(cleanedArgs.productList)
            ? cleanedArgs.productList.map((p: any) => ({
                amount: Number(p.amount) || 1,
                productId: Number(p.productId),
                skuCode: String(p.skuCode)
              }))
            : []
        };
      } else if (toolName === "createOrder") {
        cleanedArgs = {
          deptId: Number(cleanedArgs.deptId),
          productList: Array.isArray(cleanedArgs.productList)
            ? cleanedArgs.productList.map((p: any) => ({
                amount: Number(p.amount) || 1,
                productId: Number(p.productId),
                skuCode: String(p.skuCode)
              }))
            : [],
          longitude: Number(cleanedArgs.longitude),
          latitude: Number(cleanedArgs.latitude)
        };
        if (Array.isArray(toolArgs?.couponCodeList) && toolArgs.couponCodeList.length > 0) {
          cleanedArgs.couponCodeList = toolArgs.couponCodeList;
        }
        if (toolArgs?.remark) {
          cleanedArgs.remark = String(toolArgs.remark);
        }
      } else if (toolName === "queryOrderDetailInfo" || toolName === "cancelOrder") {
        cleanedArgs = {
          orderId: String(cleanedArgs.orderId)
        };
      }

      console.log(`[Luckin MCP SDK] Calling ${toolName} on ${endpoint}:`, JSON.stringify(cleanedArgs));
      const result = await client.callTool({
        name: toolName!,
        arguments: cleanedArgs
      });

      const isMcpToolError = Boolean(result.isError);
      let extractedData: any = result;
      let mcpErrorMessage = "";

      if (result.content && Array.isArray(result.content)) {
        const textItem = result.content.find((c: any) => c.type === "text" && c.text);
        if (textItem) {
          try {
            extractedData = JSON.parse(textItem.text);
          } catch {
            extractedData = textItem.text;
          }
          if (isMcpToolError) {
            mcpErrorMessage = typeof extractedData === "string" ? extractedData : (extractedData?.msg || extractedData?.message || textItem.text);
          }
        }
      }

      if (isMcpToolError) {
        return res.status(400).json({
          error: mcpErrorMessage || "瑞幸 MCP 工具执行失败",
          details: extractedData,
          raw: result,
          diagnostics
        });
      }

      if (extractedData && typeof extractedData === "object") {
        if (extractedData.code !== undefined && extractedData.code !== 0 && extractedData.code !== 200 && extractedData.code !== 1) {
          const bizMsg = extractedData.msg || extractedData.message || `业务错误码 ${extractedData.code}`;
          return res.status(400).json({
            error: bizMsg,
            details: extractedData,
            raw: result,
            diagnostics
          });
        }
      }

      return res.json({
        success: true,
        data: extractedData?.data !== undefined ? extractedData.data : extractedData,
        raw: result
      });
    } finally {
      try {
        await client.close();
      } catch {}
    }
  } catch (error: any) {
    console.error(`[Luckin MCP Exception]:`, error?.message || error);
    return res.status(500).json({
      error: `连接瑞幸 MCP 服务异常: ${error?.message || '网络无法访问'}`,
      endpoint
    });
  }
});

// ==================== Luckin Simulated H5 Cashier & Payment Page ====================
app.get("/api/luckin/pay", (req, res) => {
  const { orderId, drink, price, store } = req.query;
  const safeOrderId = typeof orderId === 'string' ? orderId : 'LK_' + Date.now();
  const safeDrink = typeof drink === 'string' ? drink : '生椰拿铁 (标准冰/标准糖)';
  const safePrice = typeof price === 'string' ? price : '19.90';
  const safeStore = typeof store === 'string' ? store : '瑞幸咖啡 (科技园店)';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>瑞幸咖啡在线收银台 - 订单支付</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-stone-100 font-sans text-stone-950 antialiased min-h-screen flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200">
    <!-- Header -->
    <div class="bg-[#0b2d64] text-white p-6 text-center relative">
      <div class="w-12 h-12 bg-amber-400 text-[#0b2d64] rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-2 shadow-md">
        luckin
      </div>
      <h1 class="font-bold text-lg">瑞幸咖啡在线收银台</h1>
      <p class="text-xs text-blue-200 font-mono mt-1">订单号: ${safeOrderId}</p>
    </div>

    <!-- Order Details -->
    <div class="p-6 space-y-4">
      <div class="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
        <div class="flex justify-between items-center text-sm">
          <span class="text-stone-500">商品名称</span>
          <span class="font-bold text-stone-800">${safeDrink}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-stone-500">取货门店</span>
          <span class="font-medium text-stone-700">${safeStore}</span>
        </div>
        <div class="border-t border-stone-200 pt-2 flex justify-between items-center">
          <span class="text-stone-500 text-sm">应付金额</span>
          <span class="font-black text-2xl text-[#0b2d64]">¥${safePrice}</span>
        </div>
      </div>

      <!-- Payment Options -->
      <div class="space-y-3 pt-2">
        <label class="flex items-center justify-between p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">绿</div>
            <div>
              <div class="font-bold text-sm text-stone-900">微信支付 (WeChat Pay)</div>
              <div class="text-[11px] text-stone-500">推荐微信用户快捷支付</div>
            </div>
          </div>
          <input type="radio" name="pay" checked class="accent-emerald-600 w-4 h-4">
        </label>

        <label class="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-stone-300 cursor-pointer bg-white">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">支</div>
            <div>
              <div class="font-bold text-sm text-stone-900">支付宝支付 (Alipay)</div>
              <div class="text-[11px] text-stone-500">支持花呗与绑卡支付</div>
            </div>
          </div>
          <input type="radio" name="pay" class="accent-sky-600 w-4 h-4">
        </label>
      </div>

      <!-- Pay Button -->
      <button onclick="handlePay()" class="w-full py-4 bg-[#0b2d64] hover:bg-[#113876] text-white rounded-2xl font-bold text-base shadow-lg transition-transform active:scale-[0.98] cursor-pointer mt-4">
        确认支付 ¥${safePrice}
      </button>

      <p class="text-center text-[11px] text-stone-400 pt-2">
        🔒 瑞幸咖啡官方加密收银通道 · 模拟沙箱环境
      </p>
    </div>
  </div>

  <script>
    function handlePay() {
      alert('【模拟支付成功】\\n订单号: ${safeOrderId}\\n金额: ¥${safePrice}\\n已成功提交至瑞幸门店！请返回 App 查看制作与取餐码。');
      window.close();
    }
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

async function startServer() {
  // Serve static assets from public folder (including fonts, icons, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
