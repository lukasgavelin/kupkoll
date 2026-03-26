import { createContext, ReactNode, useContext } from 'react';

const FloatingTabBarSpacingContext = createContext(0);

type FloatingTabBarProviderProps = {
  children: ReactNode;
  bottomSpacing: number;
};

export function FloatingTabBarProvider({ children, bottomSpacing }: FloatingTabBarProviderProps) {
  return <FloatingTabBarSpacingContext.Provider value={bottomSpacing}>{children}</FloatingTabBarSpacingContext.Provider>;
}

export function useFloatingTabBarSpacing() {
  return useContext(FloatingTabBarSpacingContext);
}