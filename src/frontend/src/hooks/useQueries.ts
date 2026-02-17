import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { 
  Product, 
  UserProfile, 
  MediaFile, 
  Branding, 
  StoreBanner,
  StripeConfiguration,
  ShoppingItem,
  EnhancedOrder,
  OrderedProduct,
  BuyerDetails,
  InternalStripeConfiguration,
  PublicStripeConfig,
  StripeMode,
  StripeSessionStatus
} from '../backend';
import { ExternalBlob, Variant_token_card } from '../backend';
import type { 
  Tutorial, 
  CommunityPost, 
  HeroSettings, 
  PageSettings,
  AIRequest,
  AIResponse,
  TokenTransaction,
  WorkWithUsApplication,
  ChatMessage
} from '../types';
import type { Principal } from '@icp-sdk/core/principal';

// ===== User Profile Queries =====

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ===== Access Control Queries =====

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===== Branding Queries =====

export function useGetBranding() {
  const { actor, isFetching } = useActor();

  return useQuery<Branding>({
    queryKey: ['branding'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBranding();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBranding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Branding) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBranding(branding);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
}

// ===== Store Banner Queries =====

export function useGetStoreBanner() {
  const { actor, isFetching } = useActor();

  return useQuery<StoreBanner>({
    queryKey: ['storeBanner'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStoreBanner();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateStoreBanner() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: StoreBanner) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStoreBanner(banner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeBanner'] });
    },
  });
}

// ===== Media File Queries =====

export function useUploadMediaFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: MediaFile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMediaFile(media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
    },
  });
}

export function useListMedia() {
  const { actor, isFetching } = useActor();

  return useQuery<MediaFile[]>({
    queryKey: ['mediaFiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMedia();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaName: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteMedia(mediaName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
    },
  });
}

// ===== Product Queries =====

export function useListProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ===== Stripe Queries =====

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useGetStripePublicConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicStripeConfig | null>({
    queryKey: ['stripePublicConfig'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStripePublicConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useGetStripeAdminConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<InternalStripeConfiguration | null>({
    queryKey: ['stripeAdminConfig'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getStripeAdminConfig();
      } catch (error) {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSetStripeSecretKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mode, secretKey }: { mode: StripeMode, secretKey: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeSecretKey(mode, secretKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
      queryClient.invalidateQueries({ queryKey: ['stripeAdminConfig'] });
      queryClient.invalidateQueries({ queryKey: ['stripePublicConfig'] });
    },
  });
}

export function useSetStripeActiveMode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: StripeMode) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeActiveMode(mode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
      queryClient.invalidateQueries({ queryKey: ['stripeAdminConfig'] });
      queryClient.invalidateQueries({ queryKey: ['stripePublicConfig'] });
    },
  });
}

// Legacy compatibility
export function useGetStripeConfigurationAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<StripeConfiguration | null>({
    queryKey: ['stripeConfigurationAdmin'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getStripeConfigurationAdmin();
      } catch (error) {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
      queryClient.invalidateQueries({ queryKey: ['stripeConfigurationAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['stripeAdminConfig'] });
      queryClient.invalidateQueries({ queryKey: ['stripePublicConfig'] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ items, successUrl, cancelUrl }: { items: ShoppingItem[], successUrl: string, cancelUrl: string }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      
      // JSON parsing is important!
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

// ===== Order Queries =====

export function useSavePurchaseOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      products, 
      total, 
      buyerDetails, 
      paymentType 
    }: { 
      products: OrderedProduct[], 
      total: bigint, 
      buyerDetails: BuyerDetails, 
      paymentType: Variant_token_card 
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.savePurchaseOrder(products, total, buyerDetails, paymentType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['userOrders'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllOrdersAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<EnhancedOrder[]>({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrdersAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<EnhancedOrder[]>({
    queryKey: ['userOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===== Token Queries =====

export function useGetBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['tokenBalance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return (actor as any).getBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSpendTokens() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ amount, description }: { amount: bigint, description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).spendTokens(amount, description);
    },
  });
}

export function useMintTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount, description }: { recipient: Principal, amount: bigint, description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).mintTokens(recipient, amount, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
  });
}

export function useTransferTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount, description }: { to: Principal, amount: bigint, description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).transferTokens(to, amount, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
  });
}

// ===== Tutorials (not yet in backend) =====

export function useListTutorials() {
  const { actor, isFetching } = useActor();

  return useQuery<Tutorial[]>({
    queryKey: ['tutorials'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listTutorials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTutorial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tutorial: Tutorial) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).addTutorial(tutorial);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}

export function useCompleteTutorial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tutorialId: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).completeTutorial(tutorialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
    },
  });
}

// ===== Community Posts (not yet in backend) =====

export function useListPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<CommunityPost[]>({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).listPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: CommunityPost) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).addPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });
}

// ===== Hero Settings (not yet in backend) =====

export function useGetHeroSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<HeroSettings>({
    queryKey: ['heroSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).getHeroSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateHeroSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: HeroSettings) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updateHeroSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroSettings'] });
    },
  });
}

// ===== Page Settings (not yet in backend) =====

export function useGetPageSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<{ community: PageSettings; learning: PageSettings; store: PageSettings }>({
    queryKey: ['pageSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).getPageSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePageSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { community: PageSettings; learning: PageSettings; store: PageSettings }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updatePageSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageSettings'] });
    },
  });
}

// ===== AI Assistant (not yet in backend) =====

export function useProvideAIResponse() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: AIRequest): Promise<AIResponse> => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).provideAIResponse(request);
    },
  });
}

// ===== AI Chat Tutor (not yet in backend) =====

export function useGetChatHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<ChatMessage[]>({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getChatHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).sendChatMessage(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
}

// ===== Work With Us Applications (not yet in backend) =====

export function useSubmitWorkWithUsApplication() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (application: WorkWithUsApplication) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).submitWorkWithUsApplication(application);
    },
  });
}
