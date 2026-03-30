import type { Meal } from '../models/types';

export const sampleMeals: Meal[] = [
  // Easy meals (< 30min total, good for busy days)
  { id: 'meal-1', name: 'Pasta mit Tomatensoße', difficulty: 'easy', prepTimeMinutes: 5, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite', 'vegetarian'] },
  { id: 'meal-2', name: 'Brot mit Aufschnitt', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 0, servings: 4, tags: ['quick', 'cold'] },
  { id: 'meal-3', name: 'Würstchen mit Kartoffelsalat', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite'] },
  { id: 'meal-4', name: 'Pfannkuchen', difficulty: 'easy', prepTimeMinutes: 10, cookTimeMinutes: 20, servings: 4, tags: ['kids-favorite', 'vegetarian'] },
  { id: 'meal-5', name: 'Tiefkühlpizza', difficulty: 'easy', prepTimeMinutes: 2, cookTimeMinutes: 15, servings: 4, tags: ['quick', 'kids-favorite'] },

  // Medium meals (30-60min, standard weekday)
  { id: 'meal-6', name: 'Gemüsesuppe', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 30, servings: 4, tags: ['healthy', 'thermomix'] },
  { id: 'meal-7', name: 'Hähnchen mit Reis', difficulty: 'medium', prepTimeMinutes: 10, cookTimeMinutes: 35, servings: 4, tags: ['protein', 'kids-favorite'] },
  { id: 'meal-8', name: 'Fischstäbchen mit Kartoffelpüree', difficulty: 'medium', prepTimeMinutes: 10, cookTimeMinutes: 25, servings: 4, tags: ['kids-favorite', 'fish'] },
  { id: 'meal-9', name: 'Bolognese', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 40, servings: 4, tags: ['kids-favorite', 'thermomix', 'batch-cook'] },
  { id: 'meal-10', name: 'Gemüse-Curry', difficulty: 'medium', prepTimeMinutes: 15, cookTimeMinutes: 25, servings: 4, tags: ['vegetarian', 'healthy', 'thermomix'] },

  // Complex meals (60min+, weekend cooking)
  { id: 'meal-11', name: 'Lasagne', difficulty: 'complex', prepTimeMinutes: 30, cookTimeMinutes: 45, servings: 6, tags: ['batch-cook', 'kids-favorite', 'thermomix'] },
  { id: 'meal-12', name: 'Sonntagsbraten', difficulty: 'complex', prepTimeMinutes: 20, cookTimeMinutes: 120, servings: 6, tags: ['weekend', 'traditional'] },
  { id: 'meal-13', name: 'Sushi', difficulty: 'complex', prepTimeMinutes: 45, cookTimeMinutes: 30, servings: 4, tags: ['special', 'fish'] },
  { id: 'meal-14', name: 'Pizza selbstgemacht', difficulty: 'complex', prepTimeMinutes: 30, cookTimeMinutes: 20, servings: 4, tags: ['kids-favorite', 'weekend', 'fun'] },
];
