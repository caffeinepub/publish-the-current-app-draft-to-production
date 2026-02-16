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
export interface EnhancedOrder {
    id: string;
    status: OrderStatus;
    total: bigint;
    buyerDetails: BuyerDetails;
    createdAt: Time;
    user: Principal;
    paymentType: Variant_token_card;
    products: Array<OrderedProduct>;
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
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface OrderedProduct {
    id: string;
    name: string;
    quantity: bigint;
    price: bigint;
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
export interface StoreBanner {
    title: string;
    bannerImage?: ExternalBlob;
    subtitle: string;
}
export interface MediaFile {
    contentType: string;
    blob: ExternalBlob;
    name: string;
    uploader: Principal;
}
export interface PublicStripeConfig {
    hasLiveKey: boolean;
    hasTestKey: boolean;
    allowedCountries: Array<string>;
    activeMode: StripeMode;
}
export interface TokenTransaction {
    to?: Principal;
    transactionType: Variant_earn_mint_spend_transfer;
    from?: Principal;
    description: string;
    timestamp: Time;
    amount: bigint;
}
export interface BuyerDetails {
    name: string;
    notes: string;
    phoneNumber: string;
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
export interface InternalStripeConfiguration {
    allowedCountries: Array<string>;
    testSecretKey: string;
    liveSecretKey: string;
    activeMode: StripeMode;
}
export interface Branding {
    icon?: ExternalBlob;
    logo?: ExternalBlob;
    slogan: string;
    siteName: string;
}
export interface Product {
    id: string;
    inventory: bigint;
    name: string;
    description: string;
    price: bigint;
    images: Array<MediaFile>;
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed"
}
export enum Role {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum StripeMode {
    live = "live",
    test = "test"
}
export enum Variant_earn_mint_spend_transfer {
    earn = "earn",
    mint = "mint",
    spend = "spend",
    transfer = "transfer"
}
export enum Variant_token_card {
    token = "token",
    card = "card"
}
export interface backendInterface {
    addProduct(product: Product): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getAllOrdersAdmin(): Promise<Array<EnhancedOrder>>;
    getBlobById(id: string): Promise<MediaFile>;
    getBranding(): Promise<Branding>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getStoreBanner(): Promise<StoreBanner>;
    getStripeAdminConfig(): Promise<InternalStripeConfiguration>;
    getStripeConfigurationAdmin(): Promise<StripeConfiguration>;
    getStripePublicConfig(): Promise<PublicStripeConfig | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserOrders(): Promise<Array<EnhancedOrder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listMedia(): Promise<Array<MediaFile>>;
    listProducts(): Promise<Array<Product>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePurchaseOrder(products: Array<OrderedProduct>, total: bigint, buyerDetails: BuyerDetails, paymentType: Variant_token_card): Promise<string>;
    setStripeActiveMode(mode: StripeMode): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setStripeSecretKey(mode: StripeMode, secretKey: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBranding(newBranding: Branding): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateStoreBanner(newStoreBanner: StoreBanner): Promise<void>;
    uploadMediaFile(media: MediaFile): Promise<string>;
}
