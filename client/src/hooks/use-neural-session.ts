import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface NeuralSessionAvailability {
  canGenerate: boolean;
  reason: string | null;
}

export function useNeuralSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery<NeuralSessionAvailability>({
    queryKey: ["/api/neural-session/availability"],
    queryFn: async () => {
      const response = await fetch("/api/neural-session/availability", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          return { canGenerate: false, reason: "Please log in to access this feature" };
        }
        throw new Error("Failed to check neural session availability");
      }
      return response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const generateMutation = useMutation({
    mutationFn: async (frequencyType: 'Confidence' | 'Opportunity' | 'Abundance' | 'Action') => {
      const response = await fetch("/api/neural-session/generate", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ frequencyType }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate neural session");
      }
      
      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/neural-session/availability"] });
    },
    onSuccess: () => {
      toast({
        title: "Neural Session Generated",
        description: "Your neural optimization track has been generated successfully.",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/neural-session/availability"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      // Refetch to ensure we're in sync
      queryClient.invalidateQueries({ queryKey: ["/api/neural-session/availability"] });
    },
  });

  return {
    canGenerate: availability?.canGenerate ?? false,
    reason: availability?.reason ?? "Checking availability...",
    isLoading,
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
