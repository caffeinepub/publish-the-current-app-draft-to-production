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
export interface AIFeedback {
    feedback: string;
    videoTimestamp: bigint;
    tutorialId: string;
}
export interface Tutorial {
    id: string;
    title: string;
    creator: Principal;
    video: MediaFile;
    difficulty: Difficulty;
    createdAt: Time;
    description: string;
    isFree: boolean;
}
export interface CommunityPost {
    id: string;
    media: Array<MediaFile>;
    title: string;
    content: string;
    createdAt: Time;
    author: Principal;
    likes: bigint;
}
export interface OrderedProduct {
    id: string;
    name: string;
    quantity: bigint;
    price: bigint;
}
export interface AIResponse {
    suggestions: Array<string>;
    feedback: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface AIRequest {
    userAnswers: Array<string>;
    videoTimestamp: bigint;
    tutorialId: string;
}
export interface AIInteraction {
    feedback: string;
    timestamp: Time;
    tutorialId: string;
}
export interface ChatMessage {
    isAI: boolean;
    sender: string;
    message: string;
    timestamp: Time;
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
export interface Order {
    id: string;
    status: OrderStatus;
    total: bigint;
    createdAt: Time;
    user: Principal;
    products: Array<OrderedProduct>;
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
export interface StreamedContent {
    id: string;
    media: MediaFile;
    title: string;
    creator: Principal;
    createdAt: Time;
    category: string;
}
export interface Product {
    id: string;
    inventory: bigint;
    name: string;
    description: string;
    price: bigint;
    images: Array<MediaFile>;
}
export enum Difficulty {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced"
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
export enum Variant_earn_mint_spend_transfer {
    earn = "earn",
    mint = "mint",
    spend = "spend",
    transfer = "transfer"
}
export interface backendInterface {
    addPost(post: CommunityPost): Promise<string>;
    addProduct(product: Product): Promise<string>;
    addStream(content: StreamedContent): Promise<string>;
    addTutorial(tutorial: Tutorial): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearChatHistory(): Promise<void>;
    clearMedia(): Promise<void>;
    clearTutorials(): Promise<void>;
    completeTutorial(tutorialId: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteMedia(id: string): Promise<void>;
    deletePost(id: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    deleteStream(id: string): Promise<void>;
    deleteTutorial(id: string): Promise<void>;
    filterTutorialsByDifficulty(difficulty: Difficulty): Promise<Array<Tutorial>>;
    getAIFeedback(tutorialId: string, timestamp: bigint): Promise<AIFeedback | null>;
    getAIHistory(user: Principal, tutorialId: string): Promise<Array<AIInteraction>>;
    getBalance(user: Principal): Promise<bigint>;
    getBlobById(id: string): Promise<MediaFile>;
    getCallerAddress(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatHistory(): Promise<Array<ChatMessage>>;
    getOrder(orderId: string): Promise<Order | null>;
    getStripeConfiguration(): Promise<StripeConfiguration>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTransactionHistory(user: Principal): Promise<Array<TokenTransaction>>;
    getTutorial(tutorialId: string): Promise<Tutorial | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfiles(): Promise<Array<UserProfile>>;
    initializeAccessControl(): Promise<void>;
    isAIAssistantEnabled(user: Principal): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listMedia(): Promise<Array<MediaFile>>;
    listPosts(): Promise<Array<CommunityPost>>;
    listProducts(): Promise<Array<Product>>;
    listStreams(): Promise<Array<StreamedContent>>;
    listTutorials(): Promise<Array<Tutorial>>;
    mintTokens(recipient: Principal, amount: bigint, description: string): Promise<void>;
    placeOrder(order: Order): Promise<string>;
    provideAIResponse(request: AIRequest): Promise<AIResponse>;
    recordEarning(user: Principal, amount: bigint, description: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendAIChatResponse(message: string): Promise<void>;
    sendChatMessage(message: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    spendTokens(amount: bigint, description: string): Promise<void>;
    toggleAIAssistant(enabled: boolean): Promise<void>;
    transferTokens(to: Principal, amount: bigint, description: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAIFeedback(tutorialId: string, feedback: string, timestamp: bigint): Promise<void>;
    updateAIHistory(user: Principal, interaction: AIInteraction): Promise<void>;
    updateProfile(profile: UserProfile): Promise<string>;
    uploadMediaFile(media: MediaFile): Promise<string>;
}
