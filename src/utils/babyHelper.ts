import { BabyRecord } from '../types/phone';
import { BabyExpression, BabyStage } from '../components/phone/suki/BabyAvatarSVG';

export function getBabyStage(growth: number = 0, level: number = 1): BabyStage {
  if (growth >= 1000 || level >= 15) return 'adult';
  if (growth >= 600 || level >= 10) return 'teen';
  if (growth >= 300 || level >= 6) return 'child';
  if (growth >= 100 || level >= 3) return 'toddler';
  return 'infant';
}

export function getBabyStageName(stage: BabyStage): string {
  switch (stage) {
    case 'infant': return '婴儿期';
    case 'toddler': return '幼儿期';
    case 'child': return '儿童期';
    case 'teen': return '少年期';
    case 'adult': return '成年期';
    default: return '婴儿期';
  }
}

export function getBabyExpression(baby: BabyRecord): BabyExpression {
  if (baby.health < 40) return 'sick';
  if (baby.hunger < 30) return 'hungry';
  if (baby.cleanliness < 30) return 'sad';
  if (baby.energy < 25) return 'sleepy';
  if (baby.mood < 30) return 'sad';
  if (baby.mood >= 70 && baby.hunger >= 60) return 'happy';
  return 'normal';
}

/**
 * 离线真实时间结算计算
 * 每 30 分钟为 1 个基本周期
 */
export function calculateRealtimeDecay(baby: BabyRecord): BabyRecord {
  const now = Date.now();
  const lastUpdated = baby.lastUpdated || now;
  const elapsedMs = now - lastUpdated;
  
  if (elapsedMs < 60 * 1000) { // 少于 1 分钟不重复结算
    return baby;
  }

  const elapsed30MinBlocks = Math.floor(elapsedMs / (1000 * 60 * 30));

  if (elapsed30MinBlocks <= 0) {
    return { ...baby, lastUpdated: now };
  }

  // 计算多周期衰减（限制最大离线 48 小时，即 96 个周期，避免离线太久直接死掉）
  const cycles = Math.min(96, elapsed30MinBlocks);

  let hunger = Math.max(0, (baby.hunger ?? 60) - cycles * 5);
  let cleanliness = Math.max(0, (baby.cleanliness ?? 60) - cycles * 5);
  let mood = Math.max(0, (baby.mood ?? 60) - cycles * 4);
  let energy = Math.min(100, Math.max(0, (baby.energy ?? 70) - cycles * 3));
  let health = baby.health ?? 90;

  // 如果状态差，健康值扣除
  if (hunger < 20 || cleanliness < 20) {
    health = Math.max(0, health - cycles * 8);
  } else if (hunger > 50 && cleanliness > 50 && health < 100) {
    health = Math.min(100, health + cycles * 2);
  }

  const updatedGrowth = baby.growth ?? baby.exp ?? 0;
  const stage = getBabyStage(updatedGrowth, baby.level);

  return {
    ...baby,
    hunger,
    cleanliness,
    mood,
    energy,
    health,
    growth: updatedGrowth,
    stage,
    lastUpdated: now
  };
}

export function createNewBabyRecord(partnerId: string, partnerName: string, partnerAvatar?: string): BabyRecord {
  const now = Date.now();
  return {
    id: `baby_${now}_${Math.random().toString(36).substring(2, 6)}`,
    name: '小宝宝',
    partnerId,
    partnerName,
    partnerAvatar,
    birthDate: now,
    level: 1,
    exp: 0,
    hunger: 80,
    cleanliness: 80,
    mood: 80,
    energy: 90,
    health: 100,
    growth: 0,
    stage: 'infant',
    lastUpdated: now,
    gender: Math.random() > 0.5 ? 'boy' : 'girl'
  };
}
