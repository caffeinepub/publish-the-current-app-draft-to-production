import type { Principal } from "@icp-sdk/core/principal";
import type { Time, MediaFile, ExternalBlob } from './backend';

// Additional types needed by frontend (backend implementation pending)
export enum Role {
    admin = "admin",
    user = "user",
    guest = "guest"
}

export enum Difficulty {
    beginner = "beginner",
    intermediate = "intermediate",
    advanced = "advanced"
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    video: MediaFile;
    creator: Principal;
    createdAt: Time;
    isFree: boolean;
}

export interface CommunityPost {
    id: string;
    title: string;
    content: string;
    media: Array<MediaFile>;
    author: Principal;
    createdAt: Time;
    likes: bigint;
}

export interface HeroSettings {
    heroHeadline: string;
    heroSubheadline: string;
    heroImage?: ExternalBlob;
}

export interface HeroBanner {
    title: string;
    subtitle: string;
    heroImage?: ExternalBlob;
}

export interface PageSettings {
    title: string;
    subtitle: string;
    heroBanner: HeroBanner;
}

export enum PageSettingsKey {
    community = "community",
    learning = "learning"
}

export interface AIRequest {
    tutorialId: string;
    videoTimestamp: number;
    userAnswers: Array<string>;
}

export interface AIResponse {
    feedback: string;
    suggestions: Array<string>;
}

export interface AIInteraction {
    feedback: string;
    timestamp: Time;
    tutorialId: string;
}

export interface ChatMessage {
    sender: string;
    message: string;
    timestamp: Time;
    isAI: boolean;
}
