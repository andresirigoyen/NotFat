export type Gender = 'male' | 'female' | 'non_binary' | 'other';

export interface CalculationInput {
  weight: number; // in kg
  height: number; // in cm
  age: number;
  gender: Gender;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
}

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
