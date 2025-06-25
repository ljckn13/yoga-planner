export const Category = {
  LAYING: 0,
  SITTING: 1,
  HALF_STANDING: 2,
  STANDING: 3,
  INVERSION: 4,
} as const;

export type Category = typeof Category[keyof typeof Category];

export const SubCategory = {
  UPWARD: 0,
  DOWNWARD: 1,
  GROUNDING: 2,
  BALANCING: 3,
  PARTIAL: 4,
  TOTAL: 5,
} as const;

export type SubCategory = typeof SubCategory[keyof typeof SubCategory];