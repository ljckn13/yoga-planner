import { useState, useCallback } from 'react';
import type { YogaPose } from '../types/yoga-pose';

interface FlowPlannerState {
  flowPoses: YogaPose[];
  addPose: (pose: YogaPose, rowIndex?: number) => void;
  removePose: (index: number) => void;
  clearFlow: () => void;
  reorderPoses: (fromIndex: number, toIndex: number) => void;
}

export const useFlowPlanner = (): FlowPlannerState => {
  const [flowPoses, setFlowPoses] = useState<YogaPose[]>([]);

  const addPose = useCallback((pose: YogaPose, rowIndex?: number) => {
    setFlowPoses(prev => {
      if (rowIndex !== undefined && rowIndex >= 0 && rowIndex <= prev.length) {
        const newPoses = [...prev];
        newPoses.splice(rowIndex, 0, pose);
        return newPoses;
      }
      return [...prev, pose];
    });
  }, []);

  const removePose = useCallback((index: number) => {
    setFlowPoses(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFlow = useCallback(() => {
    setFlowPoses([]);
  }, []);

  const reorderPoses = useCallback((fromIndex: number, toIndex: number) => {
    setFlowPoses(prev => {
      const newPoses = [...prev];
      const [movedPose] = newPoses.splice(fromIndex, 1);
      newPoses.splice(toIndex, 0, movedPose);
      return newPoses;
    });
  }, []);

  return {
    flowPoses,
    addPose,
    removePose,
    clearFlow,
    reorderPoses,
  };
};