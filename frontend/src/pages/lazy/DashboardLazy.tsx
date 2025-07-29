import { createLazyComponent } from '../../utils/lazyLoading';

export const DashboardLazy = createLazyComponent(
  () => import('../Dashboard'),
  { preload: true }
);