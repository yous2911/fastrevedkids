import { createLazyComponent } from '../../utils/lazyLoading';

export const ExercisesLazy = createLazyComponent(
  () => import('../Exercises'),
  { preload: true }
);