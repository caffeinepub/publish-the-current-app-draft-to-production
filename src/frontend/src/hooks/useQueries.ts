import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { 
  Tutorial, 
  CommunityPost, 
  Product, 
  UserProfile, 
  MediaFile,
  Difficulty,
  ShoppingItem,
  Order,
  TokenTransaction,
  AIRequest,
  AIResponse,
  AIInteraction,
  AIFeedback,
  ChatMessage
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor || !identity) throw new Error('Actor not available');
      const principal = identity.getPrincipal();
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

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

// Token System Queries
export function useGetBalance() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ['tokenBalance'],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      const principal = identity.getPrincipal();
      return actor.getBalance(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TokenTransaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getTransactionHistory(principal);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMintTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipient: Principal; amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.mintTokens(params.recipient, params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useTransferTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { to: Principal; amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.transferTokens(params.to, params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSpendTokens() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { amount: bigint; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.spendTokens(params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Tutorial Queries
export function useListTutorials() {
  const { actor, isFetching } = useActor();

  return useQuery<Tutorial[]>({
    queryKey: ['tutorials'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTutorials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterTutorialsByDifficulty(difficulty: Difficulty) {
  const { actor, isFetching } = useActor();

  return useQuery<Tutorial[]>({
    queryKey: ['tutorials', difficulty],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterTutorialsByDifficulty(difficulty);
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
      return actor.addTutorial(tutorial);
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
      await actor.completeTutorial(tutorialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useDeleteTutorial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tutorialId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteTutorial(tutorialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
    },
  });
}

export function useClearTutorials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.clearTutorials();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Community Post Queries
export function useListPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<CommunityPost[]>({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPosts();
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
      return actor.addPost(post);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
    },
  });
}

// Product Queries
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

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
    },
  });
}

// Media Queries
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
    mutationFn: async (mediaId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteMedia(mediaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaFiles'] });
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Stripe Queries
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: { secretKey: string; allowedCountries: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
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
    mutationFn: async (params: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(params.items, params.successUrl, params.cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      return session;
    },
  });
}

// AI Assistant Queries
export function useIsAIAssistantEnabled() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['aiAssistantEnabled'],
    queryFn: async () => {
      if (!actor || !identity) return false;
      const principal = identity.getPrincipal();
      return actor.isAIAssistantEnabled(principal);
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
      await actor.toggleAIAssistant(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiAssistantEnabled'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useProvideAIResponse() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: AIRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.provideAIResponse(request);
    },
  });
}

export function useGetAIFeedback(tutorialId: string, timestamp: bigint, enabled: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<AIFeedback | null>({
    queryKey: ['aiFeedback', tutorialId, timestamp.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAIFeedback(tutorialId, timestamp);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useGetAIHistory(tutorialId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AIInteraction[]>({
    queryKey: ['aiHistory', tutorialId],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      return actor.getAIHistory(principal, tutorialId);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUpdateAIHistory() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interaction: AIInteraction) => {
      if (!actor || !identity) throw new Error('Actor not available');
      const principal = identity.getPrincipal();
      await actor.updateAIHistory(principal, interaction);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aiHistory', variables.tutorialId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// AI Chat Tutor Queries
export function useGetChatHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ChatMessage[]>({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getChatHistory();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: false,
  });
}

export function useSendChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendChatMessage(message);
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
      await actor.sendAIChatResponse(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
}

export function useClearChatHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.clearChatHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
}
