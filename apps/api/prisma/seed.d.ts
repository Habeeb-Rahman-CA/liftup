export declare const INITIAL_EXERCISES: {
  name: string;
  category: string;
  description: string;
  instructions: string;
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
  orderIndex: number;
  isActive: boolean;
}[];
export declare const INITIAL_MEAL_PLAN: {
  name: string;
  description: string;
  meals: {
    name: string;
    orderIndex: number;
    items: {
      name: string;
      quantity: number;
      unit: string;
      displayQuantity: string;
      orderIndex: number;
    }[];
  }[];
};
