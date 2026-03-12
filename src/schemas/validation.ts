import { z } from 'zod';

// Common validation schemas
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const timestampSchema = z.string().datetime();
const positiveNumberSchema = z.number().positive('Must be a positive number');
const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');

// User and Profile schemas
export const createProfileSchema = z.object({
  email: emailSchema,
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  gender: z.enum(['male', 'female', 'non_binary', 'other']),
  birth_date: z.string().refine((date) => {
    const birthDate = new Date(date);
    const now = new Date();
    const minAge = 13;
    const maxAge = 120;
    const age = now.getFullYear() - birthDate.getFullYear();
    return age >= minAge && age <= maxAge;
  }, 'Must be between 13 and 120 years old'),
  height_value: positiveNumberSchema.max(300, 'Height seems unrealistic'),
  weight_value: positiveNumberSchema.max(500, 'Weight seems unrealistic'),
  height_unit: z.enum(['cm', 'm', 'in']),
  weight_unit: z.enum(['kg', 'lb']),
  diet_type: z.string().optional(),
  nutrition_goal: z.string().optional(),
  achievement_goal: z.string().optional(),
  workout_frequency: z.string().optional(),
  timezone: z.string().optional(),
  steps_goal: positiveNumberSchema.max(100000, 'Steps goal seems unrealistic').optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Meal schemas
export const createMealSchema = z.object({
  name: z.string().min(1, 'Meal name is required').max(100, 'Meal name too long'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  meal_at: timestampSchema,
  source_type: z.enum(['camera', 'gallery', 'text', 'scanner', 'unknown', 'voice']),
  image_url: z.string().url().optional(),
  recorded_timezone: z.string().optional(),
});

export const updateMealSchema = createMealSchema.partial();

export const createFoodItemSchema = z.object({
  meal_id: uuidSchema,
  name: z.string().min(1, 'Food name is required').max(100, 'Food name too long'),
  quantity: positiveNumberSchema.max(10000, 'Quantity seems unrealistic'),
  unit: z.enum(['g', 'ml', 'oz', 'cup', 'slice', 'unit', 'tbsp', 'tsp', 'scoop', 'clove']),
  calories: nonNegativeNumberSchema.max(10000, 'Calories seem unrealistic'),
  protein: nonNegativeNumberSchema.max(1000, 'Protein seems unrealistic'),
  carbs: nonNegativeNumberSchema.max(1000, 'Carbs seem unrealistic'),
  fat: nonNegativeNumberSchema.max(1000, 'Fat seems unrealistic'),
  barcode_number: z.string().optional(),
  servings: positiveNumberSchema.max(100, 'Servings seem unrealistic').optional(),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

// Water log schemas
export const createWaterLogSchema = z.object({
  volume: positiveNumberSchema.max(10000, 'Volume seems unrealistic'),
  unit: z.enum(['ml', 'oz']),
  logged_at: timestampSchema,
  recorded_timezone: z.string().optional(),
});

export const updateWaterLogSchema = createWaterLogSchema.partial();

// Body metrics schemas
export const createBodyMetricsSchema = z.object({
  measured_at: timestampSchema,
  weight_value: positiveNumberSchema.max(500, 'Weight seems unrealistic'),
  body_fat_value: z.number().min(0).max(100).optional(),
  height_value: positiveNumberSchema.max(300, 'Height seems unrealistic').optional(),
  weight_unit: z.enum(['kg', 'lb']),
  height_unit: z.enum(['cm', 'm', 'in']),
  body_fat_unit: z.literal('pct'),
});

export const updateBodyMetricsSchema = createBodyMetricsSchema.partial();

// Nutrition goals schemas
export const createNutritionGoalsSchema = z.object({
  calories: positiveNumberSchema.max(10000, 'Calories goal seems unrealistic'),
  protein: positiveNumberSchema.max(1000, 'Protein goal seems unrealistic'),
  carbs: positiveNumberSchema.max(1000, 'Carbs goal seems unrealistic'),
  fat: positiveNumberSchema.max(1000, 'Fat goal seems unrealistic'),
  start_date: timestampSchema,
  end_date: timestampSchema.optional(),
  source: z.enum(['algorithm', 'ia', 'manual']),
});

export const updateNutritionGoalsSchema = createNutritionGoalsSchema.partial();

// Hydration goals schemas
export const createHydrationGoalsSchema = z.object({
  target: positiveNumberSchema.max(10000, 'Hydration goal seems unrealistic'),
  target_unit: z.enum(['ml', 'oz']),
  start_date: timestampSchema,
  end_date: timestampSchema.optional(),
});

export const updateHydrationGoalsSchema = createHydrationGoalsSchema.partial();

// Subscription schemas
export const createSubscriptionSchema = z.object({
  plan_type: z.string().min(1, 'Plan type is required'),
  amount: positiveNumberSchema.max(1000, 'Amount seems unrealistic'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  start_date: timestampSchema.optional(),
  trial_end_date: timestampSchema.optional(),
  end_date: timestampSchema.optional(),
  payment_provider: z.string().optional(),
  provider_subscription_id: z.string().optional(),
  environment: z.string().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

// Payment schemas
export const createPaymentSchema = z.object({
  user_id: uuidSchema,
  subscription_id: uuidSchema.optional(),
  status: z.string().min(1, 'Status is required'),
  payment_type: z.string().optional(),
  amount: positiveNumberSchema.max(10000, 'Amount seems unrealistic'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  payment_date: timestampSchema,
  last_modified: timestampSchema,
  operation_type: z.string().optional(),
  environment: z.string().optional(),
});

// Notification preferences schemas
export const createNotificationPreferencesSchema = z.object({
  hour: z.number().min(0).max(23, 'Hour must be between 0 and 23'),
  minute: z.number().min(0).max(59, 'Minute must be between 0 and 59'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  enabled: z.boolean(),
  is_custom: z.boolean(),
  label: z.string().max(50, 'Label too long').optional(),
  message: z.string().max(200, 'Message too long').optional(),
  icon: z.string().max(50, 'Icon too long').optional(),
  predefined_type: z.string().max(50, 'Type too long').optional(),
});

export const updateNotificationPreferencesSchema = createNotificationPreferencesSchema.partial();

// User sports schemas
export const createUserSportsSchema = z.object({
  sport_type: z.enum(['cardio_low', 'cardio_moderate', 'cardio_high', 'strength', 'mixed', 'team', 'other']),
  hours_per_week: z.number().min(0).max(168, 'Hours per week must be between 0 and 168'),
});

export const updateUserSportsSchema = createUserSportsSchema.partial();

// Health settings schemas
export const createHealthSettingsSchema = z.object({
  health_platform: z.string().optional(),
  connected_at: timestampSchema.optional(),
  disconnected_at: timestampSchema.optional(),
  eat_back_exercise_calories: z.boolean(),
  eat_back_neat_calories: z.boolean(),
  sync_weight: z.boolean(),
});

export const updateHealthSettingsSchema = createHealthSettingsSchema.partial();

// Manual workouts schemas
export const createManualWorkoutSchema = z.object({
  workout_date: z.string().refine((date) => {
    const workoutDate = new Date(date);
    const now = new Date();
    return workoutDate <= now;
  }, 'Workout date cannot be in the future'),
  sport_type: z.string().min(1, 'Sport type is required'),
  duration_minutes: positiveNumberSchema.max(1440, 'Duration cannot exceed 24 hours'),
  estimated_calories: nonNegativeNumberSchema.max(10000, 'Calories seem unrealistic'),
});

export const updateManualWorkoutSchema = createManualWorkoutSchema.partial();

// Scan events schemas
export const createScanEventSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(50, 'Barcode too long'),
  origin: z.string().min(1, 'Origin is required'),
  result: z.string().optional(),
  product_name: z.string().max(200, 'Product name too long').optional(),
  processing_ms: z.number().min(0).max(300000, 'Processing time seems unrealistic').optional(),
  meal_id: uuidSchema.optional(),
});

// Feedback schemas
export const createFeedbackSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  note: z.string().max(1000, 'Note too long').optional(),
  user_type: z.string().max(50, 'User type too long').optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  start_date: timestampSchema.optional(),
  end_date: timestampSchema.optional(),
});

export const mealFilterSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  status: z.enum(['analyzing', 'complete', 'error', 'no_nutritional_info', 'not_found', 'contributed', 'pending_lookup', 'queued']).optional(),
  source_type: z.enum(['camera', 'gallery', 'text', 'scanner', 'unknown', 'voice']).optional(),
}).merge(paginationSchema).merge(dateRangeSchema);

// API response schemas
export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

// Export type inference helpers
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
export type CreateWaterLogInput = z.infer<typeof createWaterLogSchema>;
export type UpdateWaterLogInput = z.infer<typeof updateWaterLogSchema>;
export type CreateBodyMetricsInput = z.infer<typeof createBodyMetricsSchema>;
export type UpdateBodyMetricsInput = z.infer<typeof updateBodyMetricsSchema>;
export type CreateNutritionGoalsInput = z.infer<typeof createNutritionGoalsSchema>;
export type UpdateNutritionGoalsInput = z.infer<typeof updateNutritionGoalsSchema>;
export type CreateHydrationGoalsInput = z.infer<typeof createHydrationGoalsSchema>;
export type UpdateHydrationGoalsInput = z.infer<typeof updateHydrationGoalsSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateNotificationPreferencesInput = z.infer<typeof createNotificationPreferencesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type CreateUserSportsInput = z.infer<typeof createUserSportsSchema>;
export type UpdateUserSportsInput = z.infer<typeof updateUserSportsSchema>;
export type CreateHealthSettingsInput = z.infer<typeof createHealthSettingsSchema>;
export type UpdateHealthSettingsInput = z.infer<typeof updateHealthSettingsSchema>;
export type CreateManualWorkoutInput = z.infer<typeof createManualWorkoutSchema>;
export type UpdateManualWorkoutInput = z.infer<typeof updateManualWorkoutSchema>;
export type CreateScanEventInput = z.infer<typeof createScanEventSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type MealFilterInput = z.infer<typeof mealFilterSchema>;
