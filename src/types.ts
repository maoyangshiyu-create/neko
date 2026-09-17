export type AestheticStyleId = 'morandi' | 'macaron' | 'glass' | 'mono';

export interface StyleConfig {
  id: AestheticStyleId;
  name: string;
  badge: string;
  icon: string;
  description: string;
  characteristics: string[];
  vars: {
    bg: string;
    paper: string;
    ink: string;
    inkSoft: string;
    line: string;
    accent: string;
    accentDeep: string;
    secondary: string;
    danger: string;
    radius: string;
    shadow: string;
  };
  cardClass: string;
  buttonClass: string;
  cssSnippet: string;
}

export type CodeTab = 'preview' | 'structure' | 'feedback' | 'aesthetics' | 'combined' | 'prompt';

export interface ComponentItem {
  id: string;
  title: string;
  nameEn: string;
  icon: string;
  prompt: string;
  description: string;
  structureHtml: string;
  structureCss?: string;
  structureJs?: string;
  feedbackCss: string;
  aestheticsCss: Record<AestheticStyleId, string>;
  combinedCode: string;
}

export interface JellyFeedbackType {
  id: string;
  name: string;
  icon: string;
  desc: string;
  pressScale: string;
  releaseBezier: string;
  cssCode: string;
}

export interface WorldBookEntry {
  id: string;
  name: string;
  content: string;
  scope: 'global' | 'local';
  folderId?: string | null;
}

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  emoji: string;
  isGlobal: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
