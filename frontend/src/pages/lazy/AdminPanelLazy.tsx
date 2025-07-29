import { createLazyComponent } from '../../utils/lazyLoading';

export const AdminPanelLazy = createLazyComponent(
  () => import('../AdminPanel')
);