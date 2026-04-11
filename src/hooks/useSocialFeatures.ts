import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  subscription_status?: string;
}

interface SocialPost {
  id: string;
  content: string;
  image_url?: string;
  meal_data?: any;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: UserProfile;
  is_liked?: boolean;
}

interface SocialComment {
  id: string;
  content: string;
  created_at: string;
  user: UserProfile;
}

interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  participants_count: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  is_joined?: boolean;
  creator: UserProfile;
}

export const useSocialFeed = (userId?: string, limit = 20) => {
  return useQuery({
    queryKey: ['social_feed', userId, limit],
    queryFn: async () => {
      let query = supabase
        .from('social_posts')
        .select(`
          *,
          user:profiles(id, first_name, last_name, avatar_url, subscription_status),
          social_likes(id, user_id),
          social_comments(id, content, created_at, user:profiles(id, first_name, last_name, avatar_url))
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.in('user_id', [
          userId,
          // Add friends' IDs when we implement friendships
        ]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to include like status and comment count
      return data.map((post: any) => ({
        ...post,
        is_liked: post.social_likes.some((like: any) => like.user_id === userId),
        likes_count: post.social_likes.length,
        comments_count: post.social_comments.length,
        social_comments: post.social_comments,
      })) as SocialPost[];
    },
    enabled: true,
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      // First check if already liked
      const { data: existingLike } = await supabase
        .from('social_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('social_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;
        return { action: 'unliked' };
      } else {
        // Like
        const { error } = await supabase
          .from('social_likes')
          .insert({
            post_id: postId,
            user_id: userId,
          });

        if (error) throw error;
        return { action: 'liked' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_feed'] });
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      content, 
      imageUrl, 
      mealData 
    }: { 
      userId: string; 
      content: string; 
      imageUrl?: string; 
      mealData?: any;
    }) => {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          meal_data: mealData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_feed'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      userId, 
      content 
    }: { 
      postId: string; 
      userId: string; 
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('social_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
        })
        .select(`
          *,
          user:profiles(id, first_name, last_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as SocialComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_feed'] });
    },
  });
};

export const useSocialChallenges = (userId?: string) => {
  return useQuery({
    queryKey: ['social_challenges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenges')
        .select(`
          *,
          creator:profiles(id, first_name, last_name, avatar_url),
          challenge_participants(id, user_id, joined_at)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((challenge: any) => ({
        ...challenge,
        participants_count: challenge.challenge_participants.length,
        is_joined: userId ? challenge.challenge_participants.some((p: any) => p.user_id === userId) : false,
      })) as SocialChallenge[];
    },
    enabled: true,
  });
};

export const useJoinSocialChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_challenges'] });
    },
  });
};

export const useCreateSocialChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      title, 
      description, 
      durationDays,
      imageUrl 
    }: { 
      userId: string; 
      title: string; 
      description: string; 
      durationDays: number;
      imageUrl?: string;
    }) => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('social_challenges')
        .insert({
          creator_id: userId,
          title,
          description,
          image_url: imageUrl,
          duration_days: durationDays,
          start_date: startDate,
          end_date: endDate,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_challenges'] });
    },
  });
};

export const useUserFriends = (userId: string) => {
  return useQuery({
    queryKey: ['user_friends', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles(id, first_name, last_name, avatar_url, subscription_status)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`, { foreignTable: 'friendships' })
        .eq('status', 'accepted');

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, friendId }: { userId: string; friendId: string }) => {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_friends'] });
    },
  });
};
