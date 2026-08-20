import { createContext, useContext, useState, type ReactNode } from 'react';
import '../../styles/ui/Tabs.css';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ defaultTab, children, className = '' }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`tabs ${className}`.trim()}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`tabs__list ${className}`.trim()} role="tablist">
    {children}
  </div>
);

interface TabProps {
  id: string;
  children: ReactNode;
}

export const Tab = ({ id, children }: TabProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const isActive = context.activeTab === id;

  return (
    <button
      className={`tabs__tab ${isActive ? 'tabs__tab--active' : ''}`}
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(id)}
    >
      {children}
    </button>
  );
};

export const TabPanel = ({
  id,
  children,
  className = '',
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  if (context.activeTab !== id) return null;

  return (
    <div className={`tabs__panel ${className}`.trim()} role="tabpanel">
      {children}
    </div>
  );
};
