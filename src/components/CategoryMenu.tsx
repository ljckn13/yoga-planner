import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, SubCategory } from '../types/category';
import { yogaCategories } from '../assets/yoga-flows';
import { usePoseFilter } from '../hooks/usePoseFilter';

interface CategoryMenuProps {
  onPoseSelect: (pose: any) => void;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ onPoseSelect }) => {

  
  const {
    activeCategory,
    activeSubCategory,
    showSubcategoryMenu,
    filteredPoses,
    setActiveCategory,
    setActiveSubCategory,
  } = usePoseFilter();
  


  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category);
  };

  const handleSubCategoryClick = (subCategory: SubCategory, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveSubCategory(subCategory);
  };

  const handlePoseClick = (pose: any) => {
    onPoseSelect(pose);
  };

  return (
    <>
      {/* Test visibility */}
      <div className="fixed top-10 left-10 bg-red-500 text-white p-4 z-[10000]">
        CATEGORY MENU TEST - CAN YOU SEE THIS?
      </div>
      
      {/* Category Menu */}
      <div className="fixed bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border-2 border-red-500 p-1.5 shadow-lg backdrop-blur-[1px] z-50 bg-white" style={{zIndex: 9999}}>
        {yogaCategories.map((yogaCategory) => (
          <div
            key={yogaCategory.category}
            className={`relative flex cursor-pointer select-none items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-1 transition hover:bg-gray-50 ${
              activeCategory === yogaCategory.category
                ? '!bg-white text-black'
                : 'text-gray-400'
            }`}
            onClick={() => handleCategoryClick(yogaCategory.category)}
          >
            {yogaCategory.title}

            {/* Subcategories */}
            {activeCategory === yogaCategory.category && (
              <AnimatePresence>
                <div className="absolute left-0 -z-10 -translate-y-full items-start">
                  {yogaCategory.subCategories.map((subCategory, index) => (
                    <motion.div
                      key={subCategory.subCategory}
                      className={`absolute inline-block origin-bottom-left transform cursor-pointer rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-sm transition-all hover:bg-gray-50 ${
                        activeSubCategory === subCategory.subCategory
                          ? '!bg-white text-black z-10'
                          : 'text-gray-400'
                      } ${
                        !showSubcategoryMenu && 
                        activeSubCategory !== undefined && 
                        activeSubCategory !== subCategory.subCategory
                          ? 'opacity-50'
                          : ''
                      }`}
                      style={{
                        bottom: !showSubcategoryMenu && activeSubCategory !== undefined 
                          ? '32px' 
                          : `${(yogaCategory.subCategories.length - index) * 36}px`,
                        transform: `rotate(${(yogaCategory.subCategories.length - index) * -5}deg)`,
                      }}
                      onClick={(e) => handleSubCategoryClick(subCategory.subCategory, e)}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 50 }}
                      transition={{ delay: index * 0.05, duration: 0.15 }}
                    >
                      {subCategory.title}
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* Pose Selection */}
      {filteredPoses.length > 0 && (
        <div className="hide-scrollbar fixed bottom-28 left-0 -mb-2 flex w-full flex-1 items-center justify-center gap-1 overflow-x-auto px-20 pb-2 pt-20">
          <div className="flex min-w-0 gap-2">
            {filteredPoses.map((pose) => (
              <motion.div
                key={pose.id}
                className="relative"
                onClick={() => handlePoseClick(pose)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="peer cursor-pointer rounded-2xl opacity-40 transition-opacity hover:opacity-100">
                  <div className="flex items-center justify-center">
                    <img 
                      src={pose.image} 
                      alt={pose.name}
                      className="h-16 w-16"
                    />
                  </div>
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-center opacity-0 transition-opacity peer-hover:opacity-100">
                  <h3 className="truncate text-sm">{pose.name}</h3>
                  <p className="truncate text-xs text-gray-500">{pose.translation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};