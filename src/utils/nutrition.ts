import { supabase } from '@/services/supabase';
export type Gender = 'male' | 'female' | 'non_binary' | 'other';

export interface CalculationInput {
  weight: number; // in kg
  height: number; // in cm
  age: number;
  gender: Gender;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
}

export interface NutritionGoalsResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  explanation?: string;
  recommendations?: string[];
}

// Función para usar NotFat IA (Gemini) para cálculos nutricionales
export const calculateNutritionGoalsWithAI = async (
  input: CalculationInput,
  userProfile?: any
): Promise<NutritionGoalsResponse> => {
  try {
    console.log('🧠 Calculando objetivos con NotFat IA...');
    
    // Construir el prompt específico para cálculos nutricionales
    const prompt = `Como nutricionista experto de NotFat IA, calcula los objetivos nutricionales diarios para este usuario:

DATOS DEL USUARIO:
- Edad: ${input.age} años
- Peso: ${input.weight} kg
- Altura: ${input.height} cm
- Género: ${input.gender}
- Nivel de actividad: ${input.activityLevel}
- Objetivo: ${input.goal}

${userProfile ? `
INFORMACIÓN ADICIONAL:
${userProfile.first_name ? `- Nombre: ${userProfile.first_name}` : ''}
${userProfile.diet_type ? `- Tipo de dieta preferida: ${userProfile.diet_type}` : ''}
${userProfile.workout_frequency ? `- Frecuencia de ejercicio: ${userProfile.workout_frequency}` : ''}
` : ''}

CALCULA Y RESPONDE SOLO con este JSON exacto:
{
  "calories": número_total_de_calorías,
  "protein": gramos_de_proteína,
  "carbs": gramos_de_carbohidratos,
  "fat": gramos_de_grasas,
  "explanation": "breve explicación del cálculo",
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"]
}

CONSIDERACIONES:
- Usa fórmulas científicas actualizadas (Mifflin-St Jeor como base)
- Ajusta según nivel de actividad y objetivo
- Distribución de macros: 25-35% proteína, 40-50% carbs, 20-30% grasas
- Mínimo seguro: 1200 kcal mujeres, 1500 kcal hombres
- Incluye explicación clara y 3 recomendaciones prácticas`;

    // Llamar al endpoint de NotFat IA
    const { data, error: fnError } = await supabase.functions.invoke('process-prompt', {
      body: {
        message: prompt,
        userProfile: userProfile
      },
    });

    if (fnError) {
      throw fnError;
    }
    console.log('📊 Respuesta de NotFat IA:', data);

    // Si la IA devuelve una respuesta de chat, extraer los números
    if (data.type === 'chat') {
      return extractNumbersFromAIResponse(data.response);
    }

    // Si hay datos estructurados, usarlos
    if (data.recipeData && typeof data.recipeData === 'object') {
      return {
        calories: data.recipeData.calories || 2000,
        protein: data.recipeData.protein || 150,
        carbs: data.recipeData.carbs || 250,
        fat: data.recipeData.fat || 65,
        explanation: "Cálculo personalizado con NotFat IA",
        recommendations: ["Mantente hidratado", "Come cada 3-4 horas", "Incluye proteína en cada comida"]
      };
    }

    // Fallback a cálculo tradicional
    return calculateFinalGoals(input);

  } catch (error) {
    console.error('❌ Error con NotFat IA, usando fallback:', error);
    return calculateFinalGoals(input);
  }
};

// Función para extraer números de respuesta de texto
const extractNumbersFromAIResponse = (response: string): NutritionGoalsResponse => {
  const numbers = response.match(/\d+/g);
  if (numbers && numbers.length >= 4) {
    return {
      calories: parseInt(numbers[0]) || 2000,
      protein: parseInt(numbers[1]) || 150,
      carbs: parseInt(numbers[2]) || 250,
      fat: parseInt(numbers[3]) || 65,
      explanation: "Basado en análisis de NotFat IA",
      recommendations: ["Sigue tu plan personalizado", "Mantén la consistencia", "Escucha a tu cuerpo"]
    };
  }
  
  // Ultimate fallback
  return {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    explanation: "Cálculo estándar de seguridad",
    recommendations: ["Consulta con un nutricionista", "Mantén un balance adecuado", "Escucha a tu cuerpo"]
  };
};

export const calculateBMR = (input: CalculationInput): number => {
  const { weight, height, age, gender } = input;
  
  // Harris-Benedict Equation (Revised by Roza and Shizgal in 1984)
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    // For female and others, we use female base as conservative estimate
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const calculateTDEE = (bmr: number, activityLevel: CalculationInput['activityLevel']): number => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  return bmr * multipliers[activityLevel];
};

export const calculateFinalGoals = (input: CalculationInput) => {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  
  let targetCalories = tdee;
  
  if (input.goal === 'lose_weight') {
    targetCalories -= 500; // Average deficit for 0.5kg/week
  } else if (input.goal === 'gain_weight') {
    targetCalories += 300; // Lean bulk
  }

  // Cap minimum calories for safety
  const minCalories = input.gender === 'male' ? 1500 : 1200;
  targetCalories = Math.max(targetCalories, minCalories);

  // Macro splitting (standard balanced approach: 30% Protein, 40% Carbs, 30% Fat)
  // Calories per gram: P=4, C=4, F=9
  const protein = (targetCalories * 0.30) / 4;
  const carbs = (targetCalories * 0.40) / 4;
  const fat = (targetCalories * 0.30) / 9;

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
};

export const calculateHydration = (weight: number): number => {
  // Common recommendation: 35ml per kg
  return Math.round(weight * 35);
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
