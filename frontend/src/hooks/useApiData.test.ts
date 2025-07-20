import { renderHook } from '@testing-library/react';
import { useApiData } from './useApiData';

describe('useApiData', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useApiData('/api/test'));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
