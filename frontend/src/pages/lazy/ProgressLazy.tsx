import { createLazyComponent } from '../../utils/lazyLoading';

export const ProgressLazy = createLazyComponent(
  () => import('../Progress')
);