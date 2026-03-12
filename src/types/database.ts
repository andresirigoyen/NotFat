export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          first_name: string | null;
          avatar_url: string | null;
          diet_type: string | null;
          last_name: string | null;
          birth_date: string | null;
          gender: 'male' | 'female' | 'non_binary' | 'other';
          email: string;
          onboarding_completed: boolean | null;
          workout_frequency: string | null;
          height_value: number | null;
          weight_value: number | null;
          height_unit: 'cm' | 'm' | 'in';
          weight_unit: 'kg' | 'lb';
          timezone: string | null;
          nutrition_goal: string | null;
          achievement_goal: string | null;
          subscription_status: string | null;
          subscription_ends_at: string | null;
          expo_push_token: string | null;
          platform: string | null;
          preferred_bottle_size: number;
          preferred_bottle_unit: 'ml' | 'oz';
          show_calories: boolean;
          show_hydration: boolean;
          onboarding_step: string | null;
          role: 'user' | 'creator' | 'admin' | 'superadmin';
          steps_goal: number;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      meals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string | null;
          image_url: string | null;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
          meal_at: string;
          status: 'analyzing' | 'complete' | 'error' | 'no_nutritional_info' | 'not_found' | 'contributed' | 'pending_lookup' | 'queued';
          source_type: 'camera' | 'gallery' | 'text' | 'scanner' | 'unknown' | 'voice';
          recorded_timezone: string | null;
          llm_used: 'gemini-2.0-flash' | 'gpt-4.1-mini' | 'open-food-facts' | 'gemini-2.5-flash' | 'gpt-4.1' | 'gemini-2.5-pro' | null;
          modified: boolean;
          is_from_favorite: boolean;
          image_url_aux: string | null;
          feedback: string | null;
          recommendation: string | null;
          api_time_ms: number | null;
          processing_time_ms: number | null;
          prompt_version: string | null;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['meals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };
      nutrition_goals: {
        Row: {
          id: string;
          user_id: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
          source: 'algorithm' | 'ia' | 'manual' | null;
        };
        Insert: Omit<Database['public']['Tables']['nutrition_goals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['nutrition_goals']['Insert']>;
      };
      hydration_goals: {
        Row: {
          id: string;
          user_id: string;
          target: number;
          target_unit: 'ml' | 'oz';
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hydration_goals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['hydration_goals']['Insert']>;
      };
      food_items: {
        Row: {
          id: string;
          meal_id: string;
          created_at: string;
          name: string;
          quantity: number;
          unit: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          updated_at: string;
          barcode_number: string | null;
          scanned: boolean;
          servings: number | null;
          contributed: boolean;
          nutriscore_grade: string | null;
          nova_group: number | null;
          nutria_score: number | null;
          labels_tags: any | null;
          additives_tags: any | null;
          nutria_score_breakdown: any | null;
          additives_details: any | null;
          is_alcoholic: boolean;
          has_ingredients_data: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['food_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['food_items']['Insert']>;
      };
      water_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_at: string;
          recorded_timezone: string | null;
          volume: number;
          unit: 'ml' | 'oz';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['water_logs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['water_logs']['Insert']>;
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          weight_value: number | null;
          body_fat_value: number | null;
          height_value: number | null;
          weight_unit: 'kg' | 'lb';
          height_unit: 'cm' | 'm' | 'in';
          body_fat_unit: 'percentage';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['body_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['body_metrics']['Insert']>;
      };
    };
    Enums: {
      user_role: 'user' | 'creator' | 'admin' | 'superadmin';
      gender_enum: 'male' | 'female' | 'non_binary' | 'other';
      meal_type_enum: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      meal_status: 'analyzing' | 'complete' | 'error' | 'no_nutritional_info' | 'not_found' | 'contributed' | 'pending_lookup' | 'queued';
      meal_source_type_enum: 'camera' | 'gallery' | 'text' | 'scanner' | 'unknown' | 'voice';
      unit_enum: 'g' | 'ml' | 'oz' | 'cup' | 'slice' | 'unit' | 'tbsp' | 'tsp' | 'scoop' | 'clove';
      water_unit_enum: 'ml' | 'oz';
      height_unit_enum: 'cm' | 'm' | 'in';
      weight_unit_enum: 'kg' | 'lb';
      llm_model_enum: 'gemini-2.0-flash' | 'gpt-4.1-mini' | 'open-food-facts' | 'gemini-2.5-flash' | 'gpt-4.1' | 'gemini-2.5-pro';
    };
  };
};
