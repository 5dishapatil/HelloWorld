import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';

const MY_ACCOUNTS_SPEAK_TEXT =
  'You are now inside the My Accounts section. To get a copy of your bank statement, choose Account Statement, which is highlighted on screen.';

const MyAccountsScreen: React.FC = () => {
  const { showScreen, setBreadcrumb } = useAppContext();
  const { speak } = useSpeech();

  const goAccountStatement = () => {
    setBreadcrumb('My Accounts & Profile / Account Statement');
    showScreen('screen-statement');
  };

  return (
    <>
      <div className="instruction-card" id="myacc-ic">
        <div className="ic-header">
          <span className="ic-step-badge">STEP F1</span>
          <span className="ic-title">Choose "Account Statement"</span>
        </div>
        <div className="ic-body" id="myacc-ic-body">
          You are now inside the <strong>My Accounts</strong> section.
          This section contains account-related options like balances, statements, and account services.
          <br /><br />
          To get a copy of your bank statement, choose <strong>"Account Statement"</strong> (highlighted below).
        </div>
        <div className="ic-actions">
          <button className="btn-speak" onClick={() => speak(MY_ACCOUNTS_SPEAK_TEXT)}>🔊 Read Aloud</button>
        </div>
      </div>

      {/* Welcome strip */}
      <div id="welcome-strip-2">
        <div style={{ background: 'white', borderBottom: '1px solid #d5e5f5', padding: '8px 16px', fontSize: '13px', color: '#555' }}>
          <span style={{ color: '#555' }}>Welcome</span> <strong style={{ color: 'var(--sbi-blue)' }}>Mr. Sample User</strong> &nbsp;|&nbsp;
          <span style={{ color: 'var(--sbi-red)', fontSize: '12px' }}>sampleuser@email.com — Please verify (Demo)</span>
        </div>
      </div>

      <div style={{ background: 'var(--sbi-blue)', color: 'white', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, marginBottom: '16px', marginTop: '8px' }}>
        You are here: / <strong>My Accounts &amp; Profile</strong>
      </div>

      <div className="form-card">
        <h2>My Accounts</h2>
        <div className="accounts-grid">
          <div className="acc-option step-active" onClick={goAccountStatement} id="opt-acc-stmt">
            <div className="ao-icon">📋</div>
            <h3>Account Statement</h3>
          </div>
          <div className="acc-option dimmed">
            <div className="ao-icon">📊</div>
            <h3>Account Summary</h3>
          </div>
          <div className="acc-option dimmed">
            <div className="ao-icon">👤</div>
            <h3>Profile</h3>
          </div>
          <div className="acc-option dimmed">
            <div className="ao-icon">🖥️</div>
            <h3>e-Statement</h3>
          </div>
          <div className="acc-option dimmed">
            <div className="ao-icon">🕐</div>
            <h3>Pending Statement</h3>
          </div>
          <div className="acc-option dimmed">
            <div className="ao-icon">📉</div>
            <h3>Transactions</h3>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyAccountsScreen;