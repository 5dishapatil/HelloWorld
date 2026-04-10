import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  currentScreen: string;
  showScreen: (id: string) => void;
  postLoginUI: boolean;
  setPostLoginUI: (val: boolean) => void;
  breadcrumb: string;
  setBreadcrumb: (text: string) => void;
  hamburgerActive: boolean;
  setHamburgerActive: (val: boolean) => void;
  lastLoginTime: string;
  setLastLoginTime: (val: string) => void;
  wsDateHTML: string;
  setWsDateHTML: (val: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('screen-disclaimer');
  const [postLoginUI, setPostLoginUI] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState('Home');
  const [hamburgerActive, setHamburgerActive] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [wsDateHTML, setWsDateHTML] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showScreen = (id: string) => {
    setCurrentScreen(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        showScreen,
        postLoginUI,
        setPostLoginUI,
        breadcrumb,
        setBreadcrumb,
        hamburgerActive,
        setHamburgerActive,
        lastLoginTime,
        setLastLoginTime,
        wsDateHTML,
        setWsDateHTML,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};