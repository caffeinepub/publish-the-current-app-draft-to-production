import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  Product,
  MediaFile,
  Branding,
  UserProfile,
  TokenTransaction,
  StripeConfiguration,
  ShoppingItem,
  StoreBanner,
} from '../backend';
import type {
  Tutorial,
  CommunityPost,
  HeroSettings,
  PageSettings,
  PageSettingsKey,
  AIRequest,
  AIResponse,
  AIInteraction,
  ChatMessage,
} from '../types';
import { ExternalBlob } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// Branding queries
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

// Hero Settings queries
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

// Store Banner queries
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

// Page Settings queries
export function useGetPageSettings(page: PageSettingsKey) {
  const { actor, isFetching } = useActor();

  return useQuery<PageSettings | null>({
    queryKey: ['pageSettings', page],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getPageSettings(page);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePageSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ page, settings }: { page: PageSettingsKey; settings: PageSettings }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updatePageSettings(page, settings);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pageSettings', variables.page] });
    },
  });
}

// Media queries
export function useUploadMediaFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: MediaFile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadMediaFile(media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useListMedia() {
  const { actor, isFetching } = useActor();

  return useQuery<MediaFile[]>({
    queryKey: ['media'],
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
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteMedia(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

// Tutorial queries
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

export function useDeleteTutorial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteTutorial(id);
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
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Community queries
export function useListPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<CommunityPost[]>({
    queryKey: ['posts'],
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deletePost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Product queries
export function useListProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// User profile queries
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

// Token queries
export function useGetBalance(userPrincipal?: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['balance', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return BigInt(0);
      return (actor as any).getBalance(userPrincipal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useGetTransactionHistory(userPrincipal?: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<TokenTransaction[]>({
    queryKey: ['transactions', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return (actor as any).getTransactionHistory(userPrincipal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal,
  });
}

export function useTransferTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount, description }: { to: Principal; amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).transferTokens(to, amount, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useMintTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount, description }: { recipient: Principal; amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).mintTokens(recipient, amount, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useSpendTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, description }: { amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).spendTokens(amount, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stripe queries
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0, // Always refetch to ensure fresh state
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
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ items, successUrl, cancelUrl }: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

// Admin queries
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

export function useClearTutorials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).clearTutorials();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

// AI Assistant queries
export function useIsAIAssistantEnabled() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['aiAssistantEnabled'],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return (actor as any).isAIAssistantEnabled(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useToggleAIAssistant() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).toggleAIAssistant(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiAssistantEnabled'] });
    },
  });
}

export function useProvideAIResponse() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: AIRequest): Promise<AIResponse> => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).provideAIResponse(request);
    },
  });
}

export function useUpdateAIHistory() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (interaction: AIInteraction) => {
      if (!actor || !identity) throw new Error('Actor not available');
      return (actor as any).updateAIHistory(identity.getPrincipal(), interaction);
    },
  });
}

// Chat queries
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
    mutationFn: async (message: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).sendChatMessage(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
}

export function useSendAIChatResponse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).sendAIChatResponse(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
}
