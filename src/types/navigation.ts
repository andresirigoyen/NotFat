export type RootStackParamList = {
  // Main Screens
  Dashboard: undefined;
  MealLogger: { mealType?: string };
  AnalysisResult: { imageUri: string; mealType: string };
  BarcodeScanner: undefined;
  VoiceInput: { mealType: string };
  Progress: undefined;
  Hydration: undefined;
  Stats: undefined;
  Preferences: undefined;
  SubscriptionCenter: undefined;
  
  // Nutrition Screens
  Nutritionists: undefined;
  NutritionGuidelines: undefined;
  NutritionGuideline: { id: string };
  
  // Recipe Screens
  Recipes: undefined;
  RecipeDetail: { id: string };
  
  // Workout Screens
  Workouts: undefined;
  WorkoutDetail: { id: string };
  
  // Coach Screens
  Coach: undefined;
  CoachScreenNew: undefined;
  
  // Health Screens
  HealthIntegration: undefined;
  
  // Profile Screens
  Profile: undefined;
  Onboarding: { step?: number };
  
  // Modals
  AddWater: undefined;
  AddMeal: { mealType: string };
  EditProfile: undefined;
  
  // Premium Screens
  Premium: undefined;
  SubscriptionPlans: undefined;
  
  // Settings
  Settings: undefined;
  Notifications: undefined;
  Privacy: undefined;
  About: undefined;
  
  // Auth
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Other
  Scanner: undefined;
  Camera: { mealType: string };
  Gallery: { mealType: string };
};

export type MainStackParamList = {
  DashboardTab: undefined;
  CoachTab: undefined;
  ProfileTab: undefined;
  AnalysisResult: { imageUri: string; mealType: string };
  MealLogger: { mealType?: string };
  MealTime: undefined;
  CustomTimeMeal: undefined;
  Hydration: undefined;
  EditProfile: undefined;
  ProfileSetup: undefined;
  Preferences: undefined;
  Favorites: undefined;
  EditFavorite: undefined;
  ScientificGoals: undefined;
  Progress: undefined;
  Stats: undefined;
  Achievements: undefined;
  HealthIntegration: undefined;
  ProfessionalServices: undefined;
  NutritionGuidelines: undefined;
  Nutritionists: undefined;
  Recipes: undefined;
  Workouts: undefined;
  VoiceInput: { mealType: string };
  NoFat: undefined;
  Pro: undefined;
  Steps: undefined;
  NutritionPlanDetail: undefined;
  NutritionPlanEdit: undefined;
};

export type StackNavigationProp<T extends keyof RootStackParamList> = {
  navigate: (screen: T, params?: RootStackParamList[T]) => void;
  goBack: () => void;
  replace: (screen: T, params?: RootStackParamList[T]) => void;
  reset: (actions: { name: T; params?: RootStackParamList[T] }[]) => void;
  isFocused: () => boolean;
  canGoBack: () => boolean;
  getState: () => any;
  setOptions: (options: any) => void;
  addListener: (event: string, callback: (event: any) => void) => any;
  removeListener: (event: string, callback: (event: any) => void) => any;
};

export type RouteProp<T extends keyof RootStackParamList> = {
  key: string;
  name: T;
  params?: RootStackParamList[T];
};
