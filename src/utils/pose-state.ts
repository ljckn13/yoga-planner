import { yogaPoses } from '../assets/yoga-flows';
import type { YogaPoseSVG } from './svg-pose-parser';

// Simple global state for selected pose
let selectedPose: typeof yogaPoses[0] | YogaPoseSVG | undefined = undefined;

export const getPoseState = () => ({
  selectedPose,
  setSelectedPose: (pose: typeof yogaPoses[0] | YogaPoseSVG | undefined) => {
    selectedPose = pose;
  }
});