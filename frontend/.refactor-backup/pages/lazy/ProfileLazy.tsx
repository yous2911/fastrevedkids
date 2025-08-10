import { createLazyComponent } from '../../utils/lazyLoading';

export const ProfileLazy = createLazyComponent(
  () => import('../Profile')
);