import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  title: string;
  subtitle?: string;
  onOpenAIChat?: () => void;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  title,
  subtitle,
  onOpenAIChat,
  actionButton,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: '270px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="main-content-wrapper"
      >
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAIChat={onOpenAIChat}
          actionButton={actionButton}
        />

        <main style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-content-wrapper {
            margin-left: 0 !important;
          }
          .sidebar-desktop {
            transform: translateX(-100%);
          }
          .mobile-only-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
