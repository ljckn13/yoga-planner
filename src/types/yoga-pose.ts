import { Category, SubCategory } from './category';

export interface YogaPose {
  id: string;
  name: string;
  translation: string;
  image: string;
  category: Category;
  subCategory?: SubCategory;
  linked?: number[];
}