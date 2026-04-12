import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const useCoachMessages = (userId: string) => {
  return useQuery({
    queryKey: ['coach_messages', userId],
    queryFn: async () => {
      // Force fresh fetch with dedup by content+role+timestamp
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      
      // Enhanced deduplication: content + role + time window (5s)
      const uniqueMessages: any[] = [];
      const messages = data || [];
      
      for (let i = 0; i < messages.length; i++) {
        const current = messages[i];
        let isDuplicate = false;
        
        // Compare with next few messages (since they are ordered by created_at desc)
        for (let j = i + 1; j < Math.min(i + 5, messages.length); j++) {
          const next = messages[j];
          const timeDiff = Math.abs(new Date(current.created_at).getTime() - new Date(next.created_at).getTime());
          
          if (current.role === next.role && 
              current.content === next.content && 
              timeDiff < 5000) { // 5 second window
            isDuplicate = true;
            break;
          }
        }
        
        if (!isDuplicate) {
          uniqueMessages.push(current);
        }
      }
      
      // Reverse to show oldest first (ascending)
      return uniqueMessages.reverse();
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      content, 
      role = 'user',
      metadata 
    }: { 
    content: string; 
    role?: 'user' | 'assistant'; 
    metadata?: any;
  }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // First add user message
      const { data: userMessage, error: userError } = await supabase
        .from('coach_messages')
        .insert({
          user_id: user.id,
          role: 'user',
          content,
          metadata,
        })
        .select()
        .maybeSingle();

      if (userError) throw userError;

      try {
        // Then call AI to get response using process-prompt
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('process-prompt', {
          body: { 
            message: content,
            userId: user.id,
            userProfile: {
              first_name: user.user_metadata?.first_name,
              diet_type: user.user_metadata?.diet_type,
              nutrition_goal: user.user_metadata?.nutrition_goal,
            }
          }
        });

        if (aiError) throw aiError;
        if (!aiResponse) throw new Error('No AI response received');

        // Save AI response
        const { data: assistantMessage, error: assistantError } = await supabase
          .from('coach_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: aiResponse.response || 'Lo siento, no pude procesar eso.',
            metadata: {
              type: aiResponse.type || 'chat',
              model: 'gemini-2.5-flash',
              processing_time: Date.now(),
              recipeData: aiResponse.recipeData || null,
            },
          })
          .select()
          .maybeSingle();

        if (assistantError) throw assistantError;

        return { userMessage, assistantMessage };
      } catch (aiError: any) {
        console.error('AI Error:', aiError);
        
        // Save fallback response
        const { data: assistantMessage, error: assistantError } = await supabase
          .from('coach_messages')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: 'Lo siento, estoy teniendo dificultades para responder. Por favor intenta de nuevo en unos momentos.',
            metadata: {
              type: 'chat',
              model: 'fallback',
              error: aiError.message,
            },
          })
          .select()
          .maybeSingle();

        if (assistantError) throw assistantError;

        return { userMessage, assistantMessage };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_messages'] });
    },
  });
};

export const useCoachInsights = (userId: string) => {
  return useQuery({
    queryKey: ['coach_insights', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useClearChatHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Delete all messages for this user
      const { error } = await supabase
        .from('coach_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_messages'] });
    },
  });
};

export const useGenerateInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId: user.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_insights'] });
    },
  });
};

export const useDailyTips = () => {
  return useQuery({
    queryKey: ['daily_tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tips')
        .select('*')
        .order('id', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useMarkTipAsUsed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tipId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('daily_tips_used')
        .insert({
          user_id: user.id,
          tip_id: tipId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tips_used'] });
    },
  });
};
