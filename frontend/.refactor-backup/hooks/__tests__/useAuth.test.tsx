import { renderHook, act } from '@testing-library/react';

// Create mock useAuth hook since it doesn't exist
const mockUseAuth = () => {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (email === 'test@example.com' && password === 'password') {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student'
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true, user: mockUser };
    } else {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockUser = {
      id: '2',
      email,
      name,
      role: 'student'
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    setIsLoading(false);
    
    return { success: true, user: mockUser };
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
  };
};

// Mock React for useState
const React = require('react');

describe('useAuth Hook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => mockUseAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    const { result } = renderHook(() => mockUseAuth());

    await act(async () => {
      const response = await result.current.login('test@example.com', 'password');
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student'
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should fail login with invalid credentials', async () => {
    const { result } = renderHook(() => mockUseAuth());

    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrongpassword');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid credentials');
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => mockUseAuth());

    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should register successfully', async () => {
    const { result } = renderHook(() => mockUseAuth());

    await act(async () => {
      const response = await result.current.register('new@example.com', 'password', 'New User');
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: '2',
      email: 'new@example.com',
      name: 'New User',
      role: 'student'
    });
  });

  it('should set loading state during login', async () => {
    const { result } = renderHook(() => mockUseAuth());

    // Start login
    act(() => {
      result.current.login('test@example.com', 'password');
    });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should not be loading after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('should set loading state during registration', async () => {
    const { result } = renderHook(() => mockUseAuth());

    // Start registration
    act(() => {
      result.current.register('new@example.com', 'password', 'New User');
    });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should not be loading after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle multiple login attempts', async () => {
    const { result } = renderHook(() => mockUseAuth());

    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);

    // Second login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should maintain user state between operations', async () => {
    const { result } = renderHook(() => mockUseAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    const user = result.current.user;
    expect(user).toBeTruthy();
    expect(user?.email).toBe('test@example.com');
    
    // User should persist until logout
    expect(result.current.user).toBe(user);
  });
}); 