import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    inventory: bigint;
    name: string;
    description: string;
    price: bigint;
    images: Array<MediaFile>;
}
export interface StoreBanner {
    title: string;
    bannerImage?: ExternalBlob;
    subtitle: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface MediaFile {
    contentType: string;
    blob: ExternalBlob;
    name: string;
    uploader: Principal;
}
export interface TokenTransaction {
    to?: Principal;
    transactionType: Variant_earn_mint_spend_transfer;
    from?: Principal;
    description: string;
    timestamp: Time;
    amount: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface AIInteraction {
    feedback: string;
    timestamp: Time;
    tutorialId: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Branding {
    icon?: ExternalBlob;
    logo?: ExternalBlob;
    slogan: string;
    siteName: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    purchasedContent: Array<string>;
    createdAt: Time;
    role: Role;
    aiInteractionHistory: Array<AIInteraction>;
    uploadedContent: Array<MediaFile>;
    tokenBalance: bigint;
    aiAssistantEnabled: boolean;
    transactionHistory: Array<TokenTransaction>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_earn_mint_spend_transfer {
    earn = "earn",
    mint = "mint",
    spend = "spend",
    transfer = "transfer"
}
export interface backendInterface {
    addProduct(product: Product): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getBlobById(id: string): Promise<MediaFile>;
    getBranding(): Promise<Branding>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getStoreBanner(): Promise<StoreBanner>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listMedia(): Promise<Array<MediaFile>>;
    listProducts(): Promise<Array<Product>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBranding(newBranding: Branding): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateStoreBanner(newStoreBanner: StoreBanner): Promise<void>;
    uploadMediaFile(media: MediaFile): Promise<string>;
}
