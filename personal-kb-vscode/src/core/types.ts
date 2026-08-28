export const CARD_TYPES = [
  'thinking',
  'fundamentals',
  'idea',
  'pitfall',
  'life',
  'glossary'
] as const;

export type CardType = (typeof CARD_TYPES)[number];

export interface Card {
  id: string;
  title: string;
  type: CardType;
  tags: string[];
  created: string;
  source: string;
  reviewAfter: string;
  conclusion: string;
  why: string;
  how: string;
  pitfall: string;
  origin: string;
  filePath: string;
  relativePath: string;
}

export interface TypeCount {
  type: CardType;
  count: number;
}

export interface Stats {
  total: number;
  byType: TypeCount[];
  createdThisWeek: number;
  duePitfalls: number;
  tagCount: number;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  configured: boolean;
  linked: boolean;
  target?: string;
  detail?: string;
}

export const TYPE_LABEL: Record<CardType, string> = {
  thinking: '思考',
  fundamentals: '基本功',
  idea: 'Idea',
  pitfall: '易错点',
  life: '人生',
  glossary: '术语'
};
