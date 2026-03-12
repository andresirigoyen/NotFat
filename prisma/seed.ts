import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Constants
const USER_COUNT = 100;
const DAYS_OF_DATA = 30;
const ADMIN_COUNT = 2;
const CREATOR_COUNT = 3;

// Helper functions
function getRandomEnum<T>(enumObj: any): T {
  const values = Object.values(enumObj) as T[];
  return values[Math.floor(Math.random() * values.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Seed functions
async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  const users = [];
  const now = new Date();
  
  // Create admin users
  for (let i = 0; i < ADMIN_COUNT; i++) {
    users.push({
      id: faker.string.uuid(),
      email: `admin${i + 1}@notfat.app`,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      gender: getRandomEnum(['male', 'female', 'non_binary', 'other']),
      birth_date: faker.date.birthdate({ min: 25, max: 65 }),
      role: 'admin' as const,
      onboarding_completed: true,
      created_at: faker.date.past({ years: 2 }),
      updated_at: now,
    });
  }
  
  // Create creator users
  for (let i = 0; i < CREATOR_COUNT; i++) {
    users.push({
      id: faker.string.uuid(),
      email: `creator${i + 1}@notfat.app`,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      gender: getRandomEnum(['male', 'female', 'non_binary', 'other']),
      birth_date: faker.date.birthdate({ min: 25, max: 65 }),
      role: 'creator' as const,
      onboarding_completed: true,
      created_at: faker.date.past({ years: 2 }),
      updated_at: now,
    });
  }
  
  // Create regular users
  for (let i = 0; i < USER_COUNT - ADMIN_COUNT - CREATOR_COUNT; i++) {
    users.push({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      gender: getRandomEnum(['male', 'female', 'non_binary', 'other']),
      birth_date: faker.date.birthdate({ min: 18, max: 80 }),
      role: 'user' as const,
      onboarding_completed: Math.random() > 0.1,
      created_at: faker.date.past({ years: 1 }),
      updated_at: now,
    });
  }
  
  await prisma.profiles.createMany({ data: users });
  console.log(`✅ Created ${users.length} users`);
  
  return users;
}

async function seedUserProfiles(users: any[]) {
  console.log('🏃 Seeding user profiles...');
  
  const profiles = [];
  const activityProfiles = [];
  const healthSettings = [];
  const nutritionGoals = [];
  const hydrationGoals = [];
  const userSports = [];
  
  for (const user of users) {
    // Basic profile data
    profiles.push({
      user_id: user.id,
      height_value: getRandomFloat(150, 200),
      weight_value: getRandomFloat(50, 120),
      height_unit: getRandomEnum(['cm', 'm', 'in']),
      weight_unit: getRandomEnum(['kg', 'lb']),
      diet_type: getRandomEnum(['Balanced', 'Keto', 'Vegan', 'Vegetarian', 'Paleo', 'Mediterranean']),
      nutrition_goal: getRandomEnum(['lose_weight', 'maintain', 'gain_weight']),
      achievement_goal: getRandomEnum(['healthy_eating', 'energy', 'motivation', 'body_image']),
      workout_frequency: getRandomEnum(['never', '1-2', '3-4', '5+']),
      timezone: faker.location.timeZone(),
      platform: getRandomEnum(['ios', 'android']),
      preferred_bottle_size: getRandomInt(500, 2000),
      preferred_bottle_unit: getRandomEnum(['ml', 'oz']),
      show_calories: Math.random() > 0.2,
      show_hydration: Math.random() > 0.1,
      steps_goal: getRandomInt(5000, 15000),
    });
    
    // Activity profile
    activityProfiles.push({
      user_id: user.id,
      does_sport: Math.random() > 0.3,
      daily_activity_level: getRandomEnum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
      activity_system_version: 'v2',
    });
    
    // Health settings
    healthSettings.push({
      user_id: user.id,
      health_platform: Math.random() > 0.5 ? 'apple_health' : 'health_connect',
      connected_at: Math.random() > 0.3 ? faker.date.past({ years: 1 }) : null,
      eat_back_exercise_calories: Math.random() > 0.5,
      eat_back_neat_calories: Math.random() > 0.5,
      sync_weight: Math.random() > 0.3,
    });
    
    // Nutrition goals
    nutritionGoals.push({
      user_id: user.id,
      calories: getRandomInt(1500, 3000),
      protein: getRandomInt(50, 200),
      carbs: getRandomInt(100, 400),
      fat: getRandomInt(40, 120),
      source: getRandomEnum(['algorithm', 'ia', 'manual']),
    });
    
    // Hydration goals
    hydrationGoals.push({
      user_id: user.id,
      target: getRandomInt(1500, 4000),
      target_unit: getRandomEnum(['ml', 'oz']),
      start_date: faker.date.past({ months: 6 }),
    });
    
    // User sports
    if (Math.random() > 0.4) {
      const sportCount = getRandomInt(1, 3);
      for (let i = 0; i < sportCount; i++) {
        userSports.push({
          user_id: user.id,
          sport_type: getRandomEnum(['cardio_low', 'cardio_moderate', 'cardio_high', 'strength', 'mixed', 'team', 'other']),
          hours_per_week: getRandomFloat(1, 20, 1),
        });
      }
    }
  }
  
  await prisma.profiles.updateMany({ 
    where: { id: { in: users.map(u => u.id) } },
    data: profiles 
  });
  
  await prisma.user_activity_profile.createMany({ data: activityProfiles });
  await prisma.health_settings.createMany({ data: healthSettings });
  await prisma.nutrition_goals.createMany({ data: nutritionGoals });
  await prisma.hydration_goals.createMany({ data: hydrationGoals });
  await prisma.user_sports.createMany({ data: userSports });
  
  console.log('✅ User profiles completed');
}

async function seedMeals(users: any[]) {
  console.log('🍽️ Seeding meals and food items...');
  
  const meals = [];
  const foodItems = [];
  const waterLogs = [];
  const bodyMetrics = [];
  const healthSnapshots = [];
  
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const sourceTypes = ['camera', 'gallery', 'text', 'scanner', 'unknown', 'voice'];
  const statuses = ['complete', 'analyzing', 'error', 'no_nutritional_info', 'not_found', 'contributed'];
  
  for (const user of users) {
    // Skip users without onboarding completed
    if (!user.onboarding_completed) continue;
    
    const startDate = addDays(new Date(), -DAYS_OF_DATA);
    
    for (let day = 0; day < DAYS_OF_DATA; day++) {
      const currentDate = addDays(startDate, day);
      
      // Generate 3-6 meals per day
      const mealCount = getRandomInt(3, 6);
      
      for (let mealIndex = 0; mealIndex < mealCount; mealIndex++) {
        const mealTime = new Date(currentDate);
        mealTime.setHours(getRandomInt(6, 22), getRandomInt(0, 59), 0, 0);
        
        const meal = {
          id: faker.string.uuid(),
          user_id: user.id,
          name: faker.helpers.arrayElement([
            'Ensalada saludable', 'Pollo a la plancha', 'Salmón con verduras',
            'Avena con frutas', 'Batido de proteínas', 'Tacos de pescado',
            'Pasta integral', 'Sopa de verduras', 'Wrap de pollo'
          ]),
          meal_type: getRandomEnum(mealTypes),
          meal_at: mealTime,
          status: getRandomEnum(statuses),
          source_type: getRandomEnum(sourceTypes),
          recorded_timezone: user.timezone || 'UTC',
          llm_used: getRandomEnum(['gemini-2.0-flash', 'gpt-4.1-mini', 'open-food-facts', 'gemini-2.5-flash', 'gpt-4.1', 'gemini-2.5-pro']),
          modified: Math.random() > 0.8,
          is_from_favorite: Math.random() > 0.9,
          api_time_ms: getRandomInt(500, 5000),
          processing_time_ms: getRandomInt(200, 3000),
        };
        
        meals.push(meal);
        
        // Generate 1-5 food items per meal
        const itemCount = getRandomInt(1, 5);
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
          foodItems.push({
            id: faker.string.uuid(),
            meal_id: meal.id,
            name: faker.helpers.arrayElement([
              'Pollo', 'Arroz integral', 'Brócoli', 'Aguacate', 'Tomate',
              'Lechuga', 'Zanahoria', 'Pepino', 'Quinoa', 'Huevo',
              'Yogurt griego', 'Frutas mixtas', 'Nueces', 'Aceite de oliva'
            ]),
            quantity: getRandomFloat(50, 300),
            unit: getRandomEnum(['g', 'ml', 'oz', 'cup', 'slice', 'unit', 'tbsp', 'tsp', 'scoop', 'clove']),
            calories: getRandomFloat(50, 500),
            protein: getRandomFloat(5, 50),
            carbs: getRandomFloat(10, 80),
            fat: getRandomFloat(2, 30),
            servings: getRandomFloat(0.5, 3),
            scanned: Math.random() > 0.7,
            contributed: Math.random() > 0.95,
            nutriscore_grade: getRandomEnum(['A', 'B', 'C', 'D', 'E']),
            nova_group: getRandomInt(1, 4),
            nutria_score: getRandomInt(-10, 100),
            is_alcoholic: Math.random() > 0.98,
            has_ingredients_data: Math.random() > 0.3,
          });
        }
      }
      
      // Generate water logs (4-8 per day)
      const waterCount = getRandomInt(4, 8);
      for (let waterIndex = 0; waterIndex < waterCount; waterIndex++) {
        const waterTime = new Date(currentDate);
        waterTime.setHours(getRandomInt(7, 22), getRandomInt(0, 59), 0, 0);
        
        waterLogs.push({
          id: faker.string.uuid(),
          user_id: user.id,
          logged_at: waterTime,
          recorded_timezone: user.timezone || 'UTC',
          volume: getRandomFloat(200, 500),
          unit: getRandomEnum(['ml', 'oz']),
        });
      }
      
      // Generate body metrics (1 every 3-7 days)
      if (day % getRandomInt(3, 7) === 0) {
        bodyMetrics.push({
          id: faker.string.uuid(),
          user_id: user.id,
          measured_at: new Date(currentDate),
          weight_value: getRandomFloat(50, 120),
          body_fat_value: getRandomFloat(10, 35),
          height_value: getRandomFloat(150, 200),
          weight_unit: getRandomEnum(['kg', 'lb']),
          height_unit: getRandomEnum(['cm', 'm', 'in']),
          body_fat_unit: 'pct',
        });
      }
      
      // Generate health snapshots (daily for active users)
      if (Math.random() > 0.3) {
        healthSnapshots.push({
          id: faker.string.uuid(),
          user_id: user.id,
          date: currentDate,
          steps: getRandomInt(2000, 20000),
          active_calories_burned: getRandomFloat(100, 1000),
          workout_calories_burned: getRandomFloat(0, 500),
          workout_count: getRandomInt(0, 3),
          workout_minutes: getRandomInt(0, 120),
          weight_kg: getRandomFloat(50, 120),
          sleep_hours: getRandomFloat(5, 10),
          sleep_quality: getRandomEnum(['poor', 'fair', 'good', 'excellent']),
          source: getRandomEnum(['apple_health', 'health_connect']),
        });
      }
    }
  }
  
  await prisma.meals.createMany({ data: meals });
  await prisma.food_items.createMany({ data: foodItems });
  await prisma.water_logs.createMany({ data: waterLogs });
  await prisma.body_metrics.createMany({ data: bodyMetrics });
  await prisma.health_daily_snapshots.createMany({ data: healthSnapshots });
  
  console.log(`✅ Created ${meals.length} meals, ${foodItems.length} food items`);
  console.log(`✅ Created ${waterLogs.length} water logs, ${bodyMetrics.length} body metrics`);
}

async function seedSubscriptions(users: any[]) {
  console.log('💳 Seeding subscriptions and payments...');
  
  const subscriptions = [];
  const payments = [];
  const paymentAnalytics = [];
  
  const planTypes = ['basic', 'premium', 'pro'];
  const statuses = ['active', 'cancelled', 'expired', 'pending'];
  const paymentMethods = ['mercadopago', 'credit_card', 'debit_card', 'paypal'];
  
  for (const user of users) {
    // Skip admin users
    if (user.role === 'admin') continue;
    
    // 60% of users have subscriptions
    if (Math.random() > 0.4) {
      const startDate = faker.date.past({ years: 1 });
      const isActive = Math.random() > 0.3;
      
      const subscription = {
        id: faker.string.uuid(),
        user_id: user.id,
        plan_type: getRandomEnum(planTypes),
        status: isActive ? 'active' : getRandomEnum(['cancelled', 'expired']),
        amount: getRandomFloat(9.99, 29.99),
        currency: 'USD',
        start_date: startDate,
        trial_end_date: addDays(startDate, 14),
        end_date: isActive ? null : addDays(startDate, getRandomInt(30, 365)),
        payment_provider: getRandomEnum(['mercadopago', 'revenuecat']),
        environment: getRandomEnum(['production', 'sandbox']),
      };
      
      subscriptions.push(subscription);
      
      // Generate payments for active subscriptions
      if (isActive) {
        const paymentCount = getRandomInt(1, 12);
        for (let i = 0; i < paymentCount; i++) {
          const paymentDate = addDays(startDate, i * 30);
          
          payments.push({
            id: faker.string.uuid(),
            user_id: user.id,
            subscription_id: subscription.id,
            status: 'completed',
            amount: subscription.amount,
            currency: subscription.currency,
            payment_date: paymentDate,
            last_modified: paymentDate,
            payment_type: getRandomEnum(paymentMethods),
            operation_type: 'payment',
            environment: subscription.environment,
          });
          
          paymentAnalytics.push({
            id: faker.string.uuid(),
            user_id: user.id,
            event_type: 'payment_completed',
            is_chilean: Math.random() > 0.8,
            plan_type: subscription.plan_type,
            payment_method: getRandomEnum(paymentMethods),
            transaction_id: faker.string.alphanumeric(10),
            amount: subscription.amount,
            currency: subscription.currency,
            is_successful: true,
            platform: user.platform,
          });
        }
      }
    }
  }
  
  await prisma.subscriptions.createMany({ data: subscriptions });
  await prisma.payments.createMany({ data: payments });
  await prisma.payments_analytics.createMany({ data: paymentAnalytics });
  
  console.log(`✅ Created ${subscriptions.length} subscriptions, ${payments.length} payments`);
}

async function seedMasterData() {
  console.log('📚 Seeding master data...');
  
  // Institutions
  const institutions = [];
  for (let i = 0; i < 20; i++) {
    institutions.push({
      id: faker.string.uuid(),
      name: faker.company.name() + ' Medical Center',
      logo_url: faker.image.url(),
    });
  }
  await prisma.institutions.createMany({ data: institutions });
  
  // Nutritionists
  const nutritionists = [];
  for (let i = 0; i < 50; i++) {
    nutritionists.push({
      id: faker.string.uuid(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      gender: getRandomEnum(['male', 'female', 'non_binary', 'other']),
      institution_id: getRandomInt(0, institutions.length - 1) > 0 ? institutions[getRandomInt(0, institutions.length - 1)].id : null,
      profile_image_url: faker.image.avatar(),
      specialties: [getRandomEnum(['weight_loss', 'sports_nutrition', 'pediatric', 'clinical', 'vegan'])],
      visible_in_app: Math.random() > 0.5,
      short_description: faker.lorem.sentences(2),
      long_description: faker.lorem.paragraphs(3),
    });
  }
  await prisma.nutritionists.createMany({ data: nutritionists });
  
  // Additives
  const additives = [];
  const eNumbers = ['E100', 'E200', 'E300', 'E400', 'E500', 'E600'];
  for (let i = 0; i < 100; i++) {
    additives.push({
      id: faker.string.uuid(),
      e_number: eNumbers[getRandomInt(0, eNumbers.length - 1)] + getRandomInt(1, 999),
      name_en: faker.science.chemicalElement().name,
      name_es: faker.science.chemicalElement().name,
      risk_level: getRandomEnum(['low', 'medium', 'high', 'unknown']),
      penalty_points: getRandomInt(0, 10),
      justification: faker.lorem.sentences(2),
    });
  }
  await prisma.additives.createMany({ data: additives });
  
  // Daily Tips
  const dailyTips = [];
  const tipCategories = ['nutrición', 'ejercicio', 'hidratación', 'descanso', 'mental'];
  for (let i = 0; i < 100; i++) {
    dailyTips.push({
      id: i + 1,
      emoji: getRandomEnum(['💡', '🥗', '💪', '💧', '😴', '🧘']),
      category: getRandomEnum(tipCategories),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
    });
  }
  await prisma.daily_tips.createMany({ data: dailyTips });
  
  console.log(`✅ Created ${institutions.length} institutions, ${nutritionists.length} nutritionists`);
  console.log(`✅ Created ${additives.length} additives, ${dailyTips.length} daily tips`);
}

async function seedNotifications(users: any[]) {
  console.log('🔔 Seeding notifications...');
  
  const notifications = [];
  const preferences = [];
  
  for (const user of users) {
    // Create notification preferences
    const mealTimes = [
      { hour: 8, minute: 0, type: 'breakfast' },
      { hour: 13, minute: 0, type: 'lunch' },
      { hour: 19, minute: 0, type: 'dinner' },
      { hour: 10, minute: 30, type: 'snack' },
    ];
    
    for (const mealTime of mealTimes) {
      if (Math.random() > 0.3) {
        preferences.push({
          id: faker.string.uuid(),
          user_id: user.id,
          hour: mealTime.hour,
          minute: mealTime.minute,
          meal_type: mealTime.type,
          enabled: Math.random() > 0.2,
          is_custom: Math.random() > 0.8,
          label: `${mealTime.type} reminder`,
          message: `Time for ${mealTime.type}!`,
          icon: '🍽️',
        });
      }
    }
    
    // Create notification logs (last 7 days)
    const startDate = addDays(new Date(), -7);
    for (let day = 0; day < 7; day++) {
      if (Math.random() > 0.5) {
        const notificationTime = new Date(addDays(startDate, day));
        notificationTime.setHours(getRandomInt(8, 20), getRandomInt(0, 59), 0, 0);
        
        notifications.push({
          id: faker.string.uuid(),
          user_id: user.id,
          sent_at: notificationTime,
          notification_type: 'simple_reminder',
          reminder_id: preferences.length > 0 ? preferences[getRandomInt(0, preferences.length - 1)].id : null,
        });
      }
    }
  }
  
  await prisma.notification_preferences.createMany({ data: preferences });
  await prisma.notification_logs.createMany({ data: notifications });
  
  console.log(`✅ Created ${preferences.length} preferences, ${notifications.length} notification logs`);
}

async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.notification_logs.deleteMany();
    await prisma.notification_preferences.deleteMany();
    await prisma.health_daily_snapshots.deleteMany();
    await prisma.body_metrics.deleteMany();
    await prisma.water_logs.deleteMany();
    await prisma.food_items.deleteMany();
    await prisma.meals.deleteMany();
    await prisma.payments_analytics.deleteMany();
    await prisma.payments.deleteMany();
    await prisma.subscriptions.deleteMany();
    await prisma.user_sports.deleteMany();
    await prisma.hydration_goals.deleteMany();
    await prisma.nutrition_goals.deleteMany();
    await prisma.health_settings.deleteMany();
    await prisma.user_activity_profile.deleteMany();
    await prisma.profiles.deleteMany();
    
    // Seed data
    const users = await seedUsers();
    await seedUserProfiles(users);
    await seedMeals(users);
    await seedSubscriptions(users);
    await seedMasterData();
    await seedNotifications(users);
    
    console.log('✨ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
