import { useState, useMemo, useCallback } from 'react';
import { Category, SubCategory } from '../types/category';
import { yogaPoses } from '../assets/yoga-flows';

interface PoseFilterState {
  activeCategory?: Category;
  activeSubCategory?: SubCategory;
  showSubcategoryMenu: boolean;
  filteredPoses: typeof yogaPoses;
  setActiveCategory: (category: Category) => void;
  setActiveSubCategory: (subCategory: SubCategory) => void;
  getActiveCategoryTitle: () => string;
  getSubCategories: () => Array<{ subCategory: SubCategory; title: string }>;
}

export const usePoseFilter = (): PoseFilterState => {
  const [activeCategory, setActiveCategoryState] = useState<Category | undefined>();
  const [activeSubCategory, setActiveSubCategoryState] = useState<SubCategory | undefined>();
  const [showSubcategoryMenu, setShowSubcategoryMenu] = useState(true);

  const filteredPoses = useMemo(() => {
    return yogaPoses.filter(pose => 
      pose.category === activeCategory && 
      pose.subCategory === activeSubCategory
    );
  }, [activeCategory, activeSubCategory]);

  const setActiveCategory = useCallback((category: Category) => {
    if (category === activeCategory) {
      setActiveCategoryState(undefined);
      setActiveSubCategoryState(undefined);
      return;
    }
    setActiveCategoryState(category);
    setActiveSubCategoryState(undefined);
  }, [activeCategory]);

  const setActiveSubCategory = useCallback((subCategory: SubCategory) => {
    if (!showSubcategoryMenu) {
      setShowSubcategoryMenu(true);
      setActiveSubCategoryState(undefined);
      return;
    }
    setActiveSubCategoryState(subCategory);
    setShowSubcategoryMenu(false);
  }, [showSubcategoryMenu]);

  const getActiveCategoryTitle = useCallback((): string => {
    const categoryTitles = {
      [Category.LAYING]: 'Laying',
      [Category.SITTING]: 'Sitting',
      [Category.HALF_STANDING]: 'Half Standing',
      [Category.STANDING]: 'Standing',
      [Category.INVERSION]: 'Inversion',
    };
    return activeCategory !== undefined ? categoryTitles[activeCategory] : '';
  }, [activeCategory]);

  const getSubCategories = useCallback(() => {
    const subCategoryMap = {
      [Category.LAYING]: [
        { subCategory: SubCategory.UPWARD, title: 'Upward' },
        { subCategory: SubCategory.DOWNWARD, title: 'Downward' },
      ],
      [Category.SITTING]: [],
      [Category.HALF_STANDING]: [
        { subCategory: SubCategory.UPWARD, title: 'Upward' },
        { subCategory: SubCategory.DOWNWARD, title: 'Downward' },
      ],
      [Category.STANDING]: [
        { subCategory: SubCategory.GROUNDING, title: 'Grounding' },
        { subCategory: SubCategory.BALANCING, title: 'Balancing' },
      ],
      [Category.INVERSION]: [
        { subCategory: SubCategory.PARTIAL, title: 'Partial' },
        { subCategory: SubCategory.TOTAL, title: 'Total' },
      ],
    };
    return activeCategory !== undefined ? subCategoryMap[activeCategory] : [];
  }, [activeCategory]);

  return {
    activeCategory,
    activeSubCategory,
    showSubcategoryMenu,
    filteredPoses,
    setActiveCategory,
    setActiveSubCategory,
    getActiveCategoryTitle,
    getSubCategories,
  };
};