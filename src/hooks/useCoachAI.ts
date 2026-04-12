import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  audio_url?: string;
  metadata?: any;
  created_at: string;
}

interface CoachInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'nutrition' | 'fitness' | 'lifestyle' | 'mental_health';
  data?: any;
  expires_at: string;
}

interface CoachRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence_score: number;
  reasoning: string;
  action_steps: string[];
  created_at: string;
}

export const useCoachChat = (userId: string) => {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: any }) => {
      // Save user message
      await supabase
        .from('coach_messages')
        .insert({
          user_id: userId,
          role: 'user',
          content: message,
          metadata: context,
        });

      // ✅ FIX #3: Reemplazado fetch() sin auth por supabase.functions.invoke()
      // que inyecta automáticamente el JWT de sesión del usuario.
      const { data: aiResponse, error: fnError } = await supabase.functions.invoke('coach-chat', {
        body: { userId, message, context },
      });

      if (fnError) throw fnError;
      if (!aiResponse) throw new Error('Failed to get coach response');

      // Save AI response
      await supabase
        .from('coach_messages')
        .insert({
          user_id: userId,
          role: 'coach',
          content: aiResponse.message,
          metadata: aiResponse.metadata,
        });

      return aiResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_messages'] });
      queryClient.invalidateQueries({ queryKey: ['coach_insights'] });
    },
  });

  return { sendMessage };
};

export const useCoachMessages = (userId: string, limit = 50) => {
  return useQuery({
    queryKey: ['coach_messages', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CoachMessage[];
    },
    enabled: !!userId,
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
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CoachInsight[];
    },
    enabled: !!userId,
  });
};

export const useGenerateCoachInsights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (profileError) throw new Error('Error fetching profile');
      const profile = profiles?.[0] || null;

      const { data: recentMeals, error: mealsError } = await supabase
        .from('meals')
        .select(`
          *,
          food_items(*)
        `)
        .eq('user_id', userId)
        .gte('meal_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('meal_at', { ascending: false })
        .limit(20);

      if (mealsError) throw new Error('Error fetching meals');

      const { data: healthData } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      // ✅ FIX #3: supabase.functions.invoke() para autenticación automática
      const { data: insights, error: fnError } = await supabase.functions.invoke('generate-coach-insights', {
        body: { userId, profile, recentMeals, healthData },
      });

      if (fnError) throw fnError;
      if (!insights) throw new Error('Failed to generate insights');

      // Save insights to database
      const insightPromises = insights.map((insight: any) => 
        supabase
          .from('coach_insights')
          .insert({
            user_id: userId,
            ...insight,
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
          })
      );

      await Promise.all(insightPromises);

      return insights;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_insights'] });
    },
  });
};

export const useCoachRecommendations = (userId: string) => {
  return useQuery({
    queryKey: ['coach_recommendations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CoachRecommendation[];
    },
    enabled: !!userId,
  });
};

export const useGenerateCoachRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      category 
    }: { 
      userId: string; 
      category?: 'nutrition' | 'fitness' | 'lifestyle' | 'mental_health';
    }) => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (profileError) throw new Error('Error fetching profile');
      const profile = profiles?.[0] || null;

      const { data: nutritionGoals, error: goalsError } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const nutritionGoal = nutritionGoals?.[0] || null;
      // It's OK if goals don't exist, continue without them
      const { data: recentActivity } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      // ✅ FIX #3: supabase.functions.invoke() con auth automática
      const { data: recommendations, error: fnError } = await supabase.functions.invoke('generate-coach-recommendations', {
        body: { userId, category, profile, nutritionGoals: nutritionGoal, recentActivity },
      });

      if (fnError) throw fnError;
      if (!recommendations) throw new Error('Failed to generate recommendations');

      // Save recommendations
      const recommendationPromises = recommendations.map((rec: any) => 
        supabase
          .from('coach_recommendations')
          .insert({
            user_id: userId,
            ...rec,
          })
      );

      await Promise.all(recommendationPromises);

      return recommendations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_recommendations'] });
    },
  });
};

export const useCoachVoiceAssistant = () => {
  const queryClient = useQueryClient();

  const processVoiceCommand = useMutation({
    mutationFn: async ({ 
      userId, 
      audioBlob 
    }: { 
      userId: string; 
      audioBlob: Blob;
    }) => {
      // Convert audio to base64
      const audioBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      // ✅ FIX #3: supabase.functions.invoke() con auth automática
      const { data: result, error: fnError } = await supabase.functions.invoke('coach-voice-assistant', {
        body: { userId, audioData: audioBase64 },
      });

      if (fnError) throw fnError;
      if (!result) throw new Error('Failed to process voice command');

      // Save the conversation
      await supabase
        .from('coach_messages')
        .insert({
          user_id: userId,
          role: 'user',
          content: result.transcript,
          metadata: { audio_url: result.audio_url },
        });

      await supabase
        .from('coach_messages')
        .insert({
          user_id: userId,
          role: 'coach',
          content: result.response,
          metadata: { audio_url: result.response_audio_url },
        });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_messages'] });
      queryClient.invalidateQueries({ queryKey: ['coach_insights'] });
    },
  });

  return { processVoiceCommand };
};

export const useCoachProgressTracking = (userId: string) => {
  return useQuery({
    queryKey: ['coach_progress_tracking', userId],
    queryFn: async () => {
      // Get comprehensive progress data
      const [profileResult, mealsResult, healthResult, goalsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).limit(1),
        supabase
          .from('meals')
          .select('meal_at, status, food_items(calories, protein, carbs, fat)')
          .eq('user_id', userId)
          .gte('meal_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('health_daily_snapshots')
          .select('*')
          .eq('user_id', userId)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from('nutrition_goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (profileResult.error || mealsResult.error || healthResult.error || goalsResult.error) {
        throw new Error('Failed to fetch progress data');
      }

      // Calculate progress metrics
      const totalMeals = mealsResult.data?.length || 0;
      const completedMeals = mealsResult.data?.filter(m => m.status === 'complete').length || 0;
      const mealCompletionRate = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;

      const avgDailyCalories = mealsResult.data?.reduce((sum: number, meal: any) => {
        const mealCalories = meal.food_items?.reduce((mealSum: number, item: any) => mealSum + (item.calories || 0), 0) || 0;
        return sum + mealCalories;
      }, 0) / Math.max(30, 1);

      const avgSteps = healthResult.data?.reduce((sum: number, day: any) => sum + (day.steps || 0), 0) / Math.max(30, 1);

      return {
        profile: profileResult.data?.[0] || null,
        mealCompletionRate,
        avgDailyCalories,
        avgSteps,
        totalMeals,
        completedMeals,
        goals: goalsResult.data?.[0] || null,
        healthData: healthResult.data,
        mealsData: mealsResult.data,
      };
    },
    enabled: !!userId,
  });
};

export const useCoachPersonalization = (userId: string) => {
  return useMutation({
    mutationFn: async ({ 
      preferences, 
      goals 
    }: { 
      preferences: {
        communication_style: 'friendly' | 'professional' | 'motivational';
        focus_areas: string[];
        reminder_frequency: 'daily' | 'weekly' | 'as_needed';
        voice_enabled: boolean;
      };
      goals: {
        primary_goal: string;
        secondary_goals: string[];
        timeline: string;
        motivation_level: number;
      };
    }) => {
      // Update user's coach preferences
      const { data, error } = await supabase
        .from('coach_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .limit(1);

      if (error) throw error;

      // Update goals
      await supabase
        .from('coach_goals')
        .upsert({
          user_id: userId,
          ...goals,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      return data?.[0];
    },
  });
};

export const useCoachFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      messageId, 
      feedback, 
      rating 
    }: { 
      userId: string; 
      messageId: string; 
      feedback: string; 
      rating: number;
    }) => {
      const { data, error } = await supabase
        .from('coach_feedback')
        .insert({
          user_id: userId,
          message_id: messageId,
          feedback,
          rating,
          created_at: new Date().toISOString(),
        })
        .select()
        .limit(1);

      if (error) throw error;
      const feedbackData = data?.[0];

      // ✅ FIX #3: supabase.functions.invoke() con auth automática
      await supabase.functions.invoke('update-coach-model', {
        body: { userId, messageId, feedback, rating },
      });

      return feedbackData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach_feedback'] });
    },
  });
};
