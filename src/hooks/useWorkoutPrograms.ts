import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  sessions_per_week: number;
  focus_areas: string[];
  equipment_needed: string[];
  estimated_time_minutes: number;
  calories_per_session: number;
  is_premium: boolean;
  image_url?: string;
  creator_id?: string;
  created_at: string;
  workout_program_weeks: WorkoutProgramWeek[];
  user_programs?: UserProgram[];
}

interface WorkoutProgramWeek {
  id: string;
  week_number: number;
  focus_description: string;
  rest_days: number[];
  workout_sessions: WorkoutSession[];
}

interface WorkoutSession {
  id: string;
  day_number: number;
  session_type: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'recovery';
  name: string;
  description: string;
  duration_minutes: number;
  exercises: WorkoutExercise[];
  warm_up: WorkoutExercise[];
  cool_down: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  name: string;
  exercise_type: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds: number;
  instructions: string[];
  muscle_groups: string[];
  equipment: string[];
  difficulty_level: number;
  calories_estimate: number;
  video_url?: string;
  image_url?: string;
}

interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  start_date: string;
  current_week: number;
  current_day: number;
  completed_sessions: number;
  total_sessions: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  progress_data: any;
  created_at: string;
  workout_program: WorkoutProgram;
}

interface WorkoutSessionLog {
  id: string;
  user_program_id: string;
  session_id: string;
  completed_at: string;
  duration_minutes: number;
  calories_burned: number;
  exercises_completed: number;
  total_exercises: number;
  notes?: string;
  difficulty_rating: number;
  enjoyment_rating: number;
}

export const useWorkoutPrograms = (filters?: {
  difficulty?: string;
  focus_areas?: string[];
  equipment?: string[];
  duration_weeks?: number;
}) => {
  return useQuery({
    queryKey: ['workout_programs', filters],
    queryFn: async () => {
      let query = supabase
        .from('workout_programs')
        .select(`
          *,
          workout_program_weeks(
            workout_sessions(
              exercises(*),
              warm_up(*),
              cool_down(*)
            )
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.focus_areas && filters.focus_areas.length > 0) {
        query = query.contains('focus_areas', filters.focus_areas);
      }

      if (filters?.equipment && filters.equipment.length > 0) {
        query = query.contains('equipment_needed', filters.equipment);
      }

      if (filters?.duration_weeks) {
        query = query.eq('duration_weeks', filters.duration_weeks);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WorkoutProgram[];
    },
  });
};

export const useWorkoutProgram = (programId: string) => {
  return useQuery({
    queryKey: ['workout_program', programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_programs')
        .select(`
          *,
          workout_program_weeks(
            *,
            workout_sessions(
              *,
              exercises(*),
              warm_up(*),
              cool_down(*)
            )
          )
        `)
        .eq('id', programId)
        .single();

      if (error) throw error;
      return data as WorkoutProgram;
    },
    enabled: !!programId,
  });
};

export const useUserPrograms = (userId: string) => {
  return useQuery({
    queryKey: ['user_programs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_programs')
        .select(`
          *,
          workout_program(
            *,
            workout_program_weeks(
              workout_sessions(
                exercises(*),
                warm_up(*),
                cool_down(*)
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProgram[];
    },
    enabled: !!userId,
  });
};

export const useActiveUserProgram = (userId: string) => {
  return useQuery({
    queryKey: ['active_user_program', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_programs')
        .select(`
          *,
          workout_program(
            *,
            workout_program_weeks(
              workout_sessions(
                exercises(*),
                warm_up(*),
                cool_down(*)
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserProgram;
    },
    enabled: !!userId,
  });
};

export const useStartProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      programId 
    }: { 
      userId: string; 
      programId: string;
    }) => {
      // Get program details to calculate total sessions
      const { data: program } = await supabase
        .from('workout_programs')
        .select('duration_weeks, sessions_per_week')
        .eq('id', programId)
        .single();

      if (!program) throw new Error('Program not found');

      const totalSessions = program.duration_weeks * program.sessions_per_week;
      const startDate = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_programs')
        .insert({
          user_id: userId,
          program_id: programId,
          start_date: startDate,
          current_week: 1,
          current_day: 1,
          completed_sessions: 0,
          total_sessions: totalSessions,
          status: 'active',
          progress_data: {},
        })
        .select(`
          *,
          workout_program(
            *,
            workout_program_weeks(
              workout_sessions(
                exercises(*),
                warm_up(*),
                cool_down(*)
              )
            )
          )
        `)
        .single();

      if (error) throw error;
      return data as UserProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_programs'] });
      queryClient.invalidateQueries({ queryKey: ['active_user_program'] });
    },
  });
};

export const useUpdateProgramProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userProgramId, 
      updates 
    }: { 
      userProgramId: string; 
      updates: Partial<UserProgram>;
    }) => {
      const { data, error } = await supabase
        .from('user_programs')
        .update(updates)
        .eq('id', userProgramId)
        .select()
        .single();

      if (error) throw error;
      return data as UserProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_programs'] });
      queryClient.invalidateQueries({ queryKey: ['active_user_program'] });
    },
  });
};

export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userProgramId, 
      sessionId, 
      sessionLog 
    }: { 
      userProgramId: string; 
      sessionId: string;
      sessionLog: Omit<WorkoutSessionLog, 'id' | 'user_program_id' | 'session_id'>;
    }) => {
      // Get current user program to update progress
      const { data: currentProgram } = await supabase
        .from('user_programs')
        .select('completed_sessions, total_sessions, current_week, current_day')
        .eq('id', userProgramId)
        .single();

      if (!currentProgram) throw new Error('User program not found');

      // Log the completed session
      const { data: logData, error: logError } = await supabase
        .from('workout_session_logs')
        .insert({
          user_program_id: userProgramId,
          session_id: sessionId,
          ...sessionLog,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Update program progress
      const newCompletedSessions = currentProgram.completed_sessions + 1;
      const isCompleted = newCompletedSessions >= currentProgram.total_sessions;

      // Calculate next day/week
      let nextWeek = currentProgram.current_week;
      let nextDay = currentProgram.current_day + 1;

      // This would need to be calculated based on the program structure
      // For now, simple increment
      if (nextDay > 7) {
        nextWeek += 1;
        nextDay = 1;
      }

      await supabase
        .from('user_programs')
        .update({
          completed_sessions: newCompletedSessions,
          current_week: nextWeek,
          current_day: nextDay,
          status: isCompleted ? 'completed' : 'active',
        })
        .eq('id', userProgramId);

      return logData as WorkoutSessionLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_programs'] });
      queryClient.invalidateQueries({ queryKey: ['active_user_program'] });
      queryClient.invalidateQueries({ queryKey: ['workout_session_logs'] });
    },
  });
};

export const useWorkoutSessionLogs = (userProgramId?: string) => {
  return useQuery({
    queryKey: ['workout_session_logs', userProgramId],
    queryFn: async () => {
      let query = supabase
        .from('workout_session_logs')
        .select('*')
        .order('completed_at', { ascending: false });

      if (userProgramId) {
        query = query.eq('user_program_id', userProgramId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WorkoutSessionLog[];
    },
    enabled: true,
  });
};

export const useCreateWorkoutProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      programData, 
      weeks 
    }: { 
      programData: Omit<WorkoutProgram, 'id' | 'created_at' | 'workout_program_weeks'>;
      weeks: Array<{
        week_number: number;
        focus_description: string;
        rest_days: number[];
        sessions: Array<{
          day_number: number;
          session_type: string;
          name: string;
          description: string;
          duration_minutes: number;
          exercises: Array<{
            name: string;
            exercise_type: string;
            sets: number;
            reps: number;
            rest_seconds: number;
            instructions: string[];
            muscle_groups: string[];
            equipment: string[];
            difficulty_level: number;
            calories_estimate: number;
          }>;
        }>;
      }>;
    }) => {
      // Create the program
      const { data: program, error: programError } = await supabase
        .from('workout_programs')
        .insert({
          ...programData,
          is_public: false,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Create weeks and sessions
      for (const weekData of weeks) {
        const { data: week, error: weekError } = await supabase
          .from('workout_program_weeks')
          .insert({
            program_id: program.id,
            week_number: weekData.week_number,
            focus_description: weekData.focus_description,
            rest_days: weekData.rest_days,
          })
          .select()
          .single();

        if (weekError) throw weekError;

        // Create sessions for this week
        for (const sessionData of weekData.sessions) {
          const { data: session, error: sessionError } = await supabase
            .from('workout_sessions')
            .insert({
              week_id: week.id,
              day_number: sessionData.day_number,
              session_type: sessionData.session_type,
              name: sessionData.name,
              description: sessionData.description,
              duration_minutes: sessionData.duration_minutes,
            })
            .select()
            .single();

          if (sessionError) throw sessionError;

          // Create exercises for this session
          const exercises = sessionData.exercises.map(exercise => ({
            session_id: session.id,
            ...exercise,
          }));

          if (exercises.length > 0) {
            const { error: exercisesError } = await supabase
              .from('workout_exercises')
              .insert(exercises);

            if (exercisesError) throw exercisesError;
          }
        }
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_programs'] });
    },
  });
};

export const useWorkoutRecommendations = (userId: string) => {
  return useQuery({
    queryKey: ['workout_recommendations', userId],
    queryFn: async () => {
      // Get user profile and preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('workout_frequency, fitness_level, goals, equipment_available')
        .eq('id', userId)
        .single();

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('manual_workouts')
        .select('sport_type, duration_minutes, estimated_calories')
        .eq('user_id', userId)
        .gte('workout_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('workout_date', { ascending: false })
        .limit(10);

      // Get health data
      const { data: healthData } = await supabase
        .from('health_daily_snapshots')
        .select('steps, workout_minutes, workout_count')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Call AI service for recommendations
      const response = await fetch('https://jcfezqakxulmtdvioxbc.supabase.co/functions/v1/recommend-workout-programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          profile,
          recentActivity,
          healthData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get workout recommendations');
      }

      const recommendations = await response.json();
      return recommendations;
    },
    enabled: !!userId,
  });
};

export const useWorkoutAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ['workout_analytics', userId],
    queryFn: async () => {
      const { data: sessionLogs } = await supabase
        .from('workout_session_logs')
        .select(`
          *,
          user_programs(
            workout_programs(
              name,
              difficulty,
              focus_areas
            )
          )
        `)
        .eq('user_programs.user_id', userId)
        .order('completed_at', { ascending: false });

      if (!sessionLogs || sessionLogs.length === 0) {
        return {
          totalSessions: 0,
          totalMinutes: 0,
          totalCalories: 0,
          averageDifficulty: 0,
          averageEnjoyment: 0,
          favoritePrograms: [],
          progressByWeek: [],
        };
      }

      const totalSessions = sessionLogs.length;
      const totalMinutes = sessionLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
      const totalCalories = sessionLogs.reduce((sum, log) => sum + log.calories_burned, 0);
      const averageDifficulty = sessionLogs.reduce((sum, log) => sum + (log.difficulty_rating || 0), 0) / totalSessions;
      const averageEnjoyment = sessionLogs.reduce((sum, log) => sum + (log.enjoyment_rating || 0), 0) / totalSessions;

      // Group by program
      const programStats: Record<string, { count: number; name: string }> = {};
      sessionLogs.forEach(log => {
        const programId = log.user_programs?.workout_programs?.name || 'Unknown';
        programStats[programId] = {
          count: (programStats[programId]?.count || 0) + 1,
          name: programId,
        };
      });

      const favoritePrograms = Object.entries(programStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)
        .map(([name, stats]) => ({ name, count: stats.count }));

      // Group by week for progress tracking
      const progressByWeek: Record<string, { sessions: number; minutes: number; calories: number }> = {};
      sessionLogs.forEach(log => {
        const week = log.completed_at.split('T')[0];
        if (!progressByWeek[week]) {
          progressByWeek[week] = { sessions: 0, minutes: 0, calories: 0 };
        }
        progressByWeek[week].sessions += 1;
        progressByWeek[week].minutes += log.duration_minutes;
        progressByWeek[week].calories += log.calories_burned;
      });

      return {
        totalSessions,
        totalMinutes,
        totalCalories,
        averageDifficulty,
        averageEnjoyment,
        favoritePrograms,
        progressByWeek: Object.entries(progressByWeek)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 12)
          .map(([week, stats]) => ({ week, ...stats })),
      };
    },
    enabled: !!userId,
  });
};
