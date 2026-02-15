import type { Principal } from '@icp-sdk/core/principal';
import type { MediaFile } from './backend';
import { ExternalBlob } from './backend';

export enum Role {
  admin = 'admin',
  user = 'user',
  guest = 'guest',
}

export enum Difficulty {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  video: MediaFile;
  creator: Principal;
  createdAt: bigint;
  isFree: boolean;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  media: MediaFile[];
  author: Principal;
  createdAt: bigint;
  likes: bigint;
}

export interface HeroSettings {
  headline: string;
  subheadline: string;
  heroImage?: ExternalBlob;
}

export interface PageSettings {
  title: string;
  subtitle: string;
  bannerImage?: ExternalBlob;
}

export interface AIRequest {
  tutorialId: string;
  videoTimestamp: number;
  userAnswers: string[];
}

export interface AIResponse {
  feedback: string;
  suggestions: string[];
}

export interface AIInteraction {
  tutorialId: string;
  timestamp: bigint;
  feedback: string;
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: bigint;
  isAI: boolean;
}

export interface TokenTransaction {
  from?: Principal;
  to?: Principal;
  amount: bigint;
  description: string;
  timestamp: bigint;
  transactionType: 'mint' | 'transfer' | 'spend' | 'earn';
}

export interface WorkWithUsApplication {
  name: string;
  email: string;
  message: string;
}
