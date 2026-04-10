import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';

import DisclaimerScreen from './screens/DisclaimerScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ForgotSuccessScreen from './screens/ForgotSuccessScreen';
import LoginAfterResetScreen from './screens/LoginAfterResetScreen';
import DashboardScreen from './screens/DashboardScreen';
import MyAccountsScreen from './screens/MyAccountsScreen';
import StatementScreen from './screens/StatementScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import FinishScreen from './screens/FinishScreen';

const AppInner: React.FC = () => {
  const {
    currentScreen,
    showScreen,
    postLoginUI,
    setPostLoginUI,
    breadcrumb,
    setBreadcrumb,
    hamburgerActive,
    setHamburgerActive,
    sidebarOpen,
    setSidebarOpen,
  } = useAppContext();

  const openSidebar = () => {
    setSidebarOpen(true);
    setHamburgerActive(false);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const goMyAccounts = () => {
    closeSidebar();
    setBreadcrumb('My Accounts & Profile');
    showScreen('screen-myaccounts');
  };

  const doLogout = () => {
    closeSidebar();
    if (window.confirm('Are you sure you want to logout from the training simulation?')) {
      setPostLoginUI(false);
      setHamburgerActive(false);
      showScreen('screen-disclaimer');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'screen-disclaimer':       return <DisclaimerScreen />;
      case 'screen-login':            return <LoginScreen />;
      case 'screen-forgot':           return <ForgotPasswordScreen />;
      case 'screen-forgot-success':   return <ForgotSuccessScreen />;
      case 'screen-login-after-reset':return <LoginAfterResetScreen />;
      case 'screen-dashboard':        return <DashboardScreen />;
      case 'screen-myaccounts':       return <MyAccountsScreen />;
      case 'screen-statement':        return <StatementScreen />;
      case 'screen-feedback':         return <FeedbackScreen />;
      case 'screen-finish':           return <FinishScreen />;
      default:                        return <DisclaimerScreen />;
    }
  };

  return (
    <>
      {/* Global Warning Banner */}
      <div id="global-warning">
        <span className="warn-icon">⚠️</span>
        <span>
          <strong>TRAINING SIMULATION ONLY</strong> — DO NOT ENTER YOUR REAL BANKING USERNAME, PASSWORD, OTP, OR ACCOUNT DETAILS. &nbsp;|&nbsp; यह केवल अभ्यास डेमो है। असली जानकारी दर्ज न करें।
        </span>
      </div>

      {/* SBI Header */}
      <header id="sbi-header">
        <div className="sbi-logo-area">
          <div className="sbi-logo-circle">SBI</div>
          <div className="sbi-logo-text">
            <div className="sbi-name">SBI</div>
            <div className="sbi-sub">ONLINE</div>
          </div>
        </div>
        <div className="sbi-header-right">
          <span className="training-badge">📚 Training Demo</span>
          {postLoginUI && (
            <button
              id="hamburger-btn"
              className={hamburgerActive ? 'step-active' : ''}
              aria-label="Open menu"
              title="Open Menu"
              onClick={openSidebar}
              style={{ display: 'flex' }}
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
          )}
          {postLoginUI && (
            <button id="logout-btn" onClick={doLogout} style={{ display: 'block' }}>
              ⏻ LOGOUT
            </button>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div id="sidebar-overlay" onClick={closeSidebar} style={{ display: 'block' }} />
      )}

      {/* Sidebar */}
      <nav id="sidebar" className={sidebarOpen ? 'open' : ''} aria-label="Main Menu">
        <div className="sidebar-header">
          <span>☰ Main Menu</span>
          <button id="close-sidebar" onClick={closeSidebar} aria-label="Close menu">✕</button>
        </div>
        <ul className="sidebar-menu">
          <li><a onClick={closeSidebar} id="menu-home"><span className="menu-icon">🏠</span> Home</a></li>
          <li>
            <a onClick={goMyAccounts} id="menu-myacc" className="step-active">
              <span className="menu-icon">🏦</span> My Accounts &amp; Profile
            </a>
          </li>
          <li><a className="dimmed"><span className="menu-icon">💸</span> Payments / Transfers</a></li>
          <li><a className="dimmed"><span className="menu-icon">📱</span> Bill Payments</a></li>
          <li><a className="dimmed"><span className="menu-icon">📈</span> Deposit &amp; Investment</a></li>
          <li><a className="dimmed"><span className="menu-icon">🧾</span> e-Tax</a></li>
          <li><a className="dimmed"><span className="menu-icon">🛎️</span> e-Services</a></li>
          <li><a className="dimmed"><span className="menu-icon">📩</span> Request &amp; Enquiries</a></li>
          <li><a className="dimmed"><span className="menu-icon">🔗</span> Useful Links</a></li>
          <li><a onClick={doLogout}><span className="menu-icon">🚪</span> Logout</a></li>
        </ul>
      </nav>

      {/* Breadcrumb */}
      {postLoginUI && (
        <div id="breadcrumb" style={{ display: 'block' }}>
          <span>You are here: / </span>
          <strong id="breadcrumb-text">{breadcrumb}</strong>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content">
        <div className="screen active">
          {renderScreen()}
        </div>
      </main>

      {/* Footer */}
      <footer id="sbi-footer">
        &copy; State Bank of India (Training Simulation — Not the real SBI website)
        &nbsp;|&nbsp; This demo does not connect to any real banking service.
        &nbsp;|&nbsp; <a href="#">Privacy Notice</a> &nbsp;|&nbsp; <a href="#">Terms</a>
      </footer>
    </>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppInner />
  </AppProvider>
);

export default App;