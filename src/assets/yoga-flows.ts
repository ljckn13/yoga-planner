import { Category, SubCategory } from '../types/category';

export const yogaPoses: {
  id: number;
  name: string;
  translation: string;
  image: string;
  category: Category;
  subCategory?: SubCategory;
  linked?: number[];
}[] = [
  {
    id: 1,
    name: "Plough Pose",
    translation: "Halasana",
    image: "/yoga-skribbles/1_ploughpose.svg",
    category: Category.LAYING,
    subCategory: SubCategory.UPWARD,
    linked: [18],
  },
  {
    id: 2,
    name: "Child's Pose",
    translation: "Balasana",
    image: "/yoga-skribbles/2_childspose.svg",
    category: Category.LAYING,
    subCategory: SubCategory.UPWARD,
    linked: [1],
  },
  {
    id: 3,
    name: "Bow Pose",
    translation: "Dhanurasana",
    image: "/yoga-skribbles/3_bowpose.svg",
    category: Category.LAYING,
    subCategory: SubCategory.DOWNWARD,
    linked: [7],
  },
  {
    id: 4,
    name: "Lotus Pose",
    translation: "Padmasana",
    image: "/yoga-skribbles/4_lotuspose.svg",
    category: Category.SITTING,
    linked: [5],
  },
  {
    id: 5,
    name: "Staff Pose",
    translation: "Dandasana",
    image: "/yoga-skribbles/5_staffpose.svg",
    category: Category.SITTING,
    linked: [6],
  },
  {
    id: 6,
    name: "Hero Pose",
    translation: "Virasana",
    image: "/yoga-skribbles/6_heropose.svg",
    category: Category.SITTING,
    linked: [2],
  },
  {
    id: 7,
    name: "Plank Pose",
    translation: "Phalakasana",
    image: "/yoga-skribbles/7_plankpose.svg",
    category: Category.HALF_STANDING,
    subCategory: SubCategory.UPWARD,
    linked: [15, 16],
  },
  {
    id: 8,
    name: "Tabletop Pose",
    translation: "Bharmanasana",
    image: "/yoga-skribbles/8_tabletoppose.svg",
    category: Category.HALF_STANDING,
    subCategory: SubCategory.UPWARD,
    linked: [16],
  },
  {
    id: 9,
    name: "Wheel Pose",
    translation: "Chakrasana",
    image: "/yoga-skribbles/9_wheelpose.svg",
    category: Category.HALF_STANDING,
    subCategory: SubCategory.DOWNWARD,
    linked: [10],
  },
  {
    id: 10,
    name: "Bridge Pose",
    translation: "Setu Bandha Sarvangasana",
    image: "/yoga-skribbles/10_bridgepose.svg",
    category: Category.HALF_STANDING,
    subCategory: SubCategory.DOWNWARD,
    linked: [9, 18],
  },
  {
    id: 11,
    name: "Triangle Pose",
    translation: "Trikonasana",
    image: "/yoga-skribbles/11_trianglepose.svg",
    category: Category.STANDING,
    subCategory: SubCategory.GROUNDING,
    linked: [12, 13],
  },
  {
    id: 12,
    name: "Warrior I",
    translation: "Virabhadrasana I",
    image: "/yoga-skribbles/12_warrieri.svg",
    category: Category.STANDING,
    subCategory: SubCategory.GROUNDING,
    linked: [13],
  },
  {
    id: 13,
    name: "Warrior III",
    translation: "Virabhadrasana III",
    image: "/yoga-skribbles/13_warrioriii.svg",
    category: Category.STANDING,
    subCategory: SubCategory.BALANCING,
    linked: [14],
  },
  {
    id: 14,
    name: "Half Moon",
    translation: "Ardha Chandrasana",
    image: "/yoga-skribbles/14_halfmoon.svg",
    category: Category.STANDING,
    subCategory: SubCategory.BALANCING,
    linked: [13],
  },
  {
    id: 15,
    name: "Down Dog",
    translation: "Adho Mukha Svanasana",
    image: "/yoga-skribbles/15_downdog.svg",
    category: Category.INVERSION,
    subCategory: SubCategory.PARTIAL,
    linked: [7],
  },
  {
    id: 16,
    name: "Fold Forward",
    translation: "Uttanasana",
    image: "/yoga-skribbles/16_foldforward.svg",
    category: Category.INVERSION,
    subCategory: SubCategory.PARTIAL,
    linked: [15],
  },
  {
    id: 17,
    name: "Headstand",
    translation: "Shirshasana",
    image: "/yoga-skribbles/17_headstand.svg",
    category: Category.INVERSION,
    subCategory: SubCategory.TOTAL,
    linked: [2],
  },
  {
    id: 18,
    name: "Shoulder Stand",
    translation: "Sarvangasana",
    image: "/yoga-skribbles/18_shoulderstand.svg",
    category: Category.INVERSION,
    subCategory: SubCategory.TOTAL,
    linked: [1],
  },
];

export const yogaCategories = [
  {
    category: Category.LAYING,
    title: "Laying",
    subCategories: [
      {
        subCategory: SubCategory.UPWARD,
        title: "Upward",
      },
      {
        subCategory: SubCategory.DOWNWARD,
        title: "Downward",
      },
    ],
  },
  {
    category: Category.SITTING,
    subCategories: [],
    title: "Sitting",
  },
  {
    category: Category.HALF_STANDING,
    title: "Half Standing",
    subCategories: [
      {
        subCategory: SubCategory.UPWARD,
        title: "Upward",
      },
      {
        subCategory: SubCategory.DOWNWARD,
        title: "Downward",
      },
    ],
  },
  {
    category: Category.STANDING,
    title: "Standing",
    subCategories: [
      {
        subCategory: SubCategory.GROUNDING,
        title: "Grounding",
      },
      {
        subCategory: SubCategory.BALANCING,
        title: "Balancing",
      },
    ],
  },
  {
    category: Category.INVERSION,
    title: "Inversion",
    subCategories: [
      {
        subCategory: SubCategory.PARTIAL,
        title: "Partial",
      },
      {
        subCategory: SubCategory.TOTAL,
        title: "Total",
      },
    ],
  },
];