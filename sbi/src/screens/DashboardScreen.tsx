import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';

const DASHBOARD_SPEAK_TEXT =
  'Excellent! You have successfully completed the login practice. Now look at the top-left area of the page header. You will see three horizontal lines. That is the Main Menu button. Click the three lines to continue.';

const DashboardScreen: React.FC = () => {
  const { lastLoginTime, wsDateHTML } = useAppContext();
  const { speak } = useSpeech();

  const dateLines = wsDateHTML.split('\n');

  return (
    <>
      {/* Last login strip */}
      <div style={{ background: 'white', borderBottom: '1px solid #d5e5f5', padding: '8px 16px', fontSize: '13px', color: '#555', textAlign: 'center' }}>
        Last Login Date &amp; Time: <strong>{lastLoginTime}</strong>
      </div>

      {/* Welcome strip */}
      <div id="welcome-strip">
        <div className="ws-date">
          {dateLines[0]}<br />{dateLines[1]}
        </div>
        <div>
          <div>Welcome</div>
          <div className="ws-name">Mr. Sample User</div>
          <div className="ws-email">sampleuser@email.com — <span style={{ color: 'var(--sbi-red)', fontStyle: 'italic' }}>Please verify (Demo)</span></div>
        </div>
      </div>

      {/* Instruction card for hamburger */}
      <div className="instruction-card" id="dash-ic" style={{ marginTop: '16px' }}>
        <div className="ic-header">
          <span className="ic-step-badge">STEP D1</span>
          <span className="ic-title">Open the Main Menu</span>
        </div>
        <div className="ic-body">
          🎉 <strong>Excellent! You have successfully completed the login practice.</strong><br /><br />
          Now look at the <strong>top-left area</strong> of the page header — you will see three horizontal lines (☰).
          That is the <strong>Main Menu button</strong>. Many banking options like "My Accounts" can be found there.
          <br /><br /><strong>Click the ☰ button in the top header to continue.</strong>
        </div>
        <div className="ic-actions">
          <button className="btn-speak" onClick={() => speak(DASHBOARD_SPEAK_TEXT)}>🔊 Read Aloud</button>
        </div>
      </div>

      {/* Promo */}
      <div className="promo-banner">
        <strong>SBI Credit Card</strong> — Welcome Gift worth up to ₹5,000 awaits you! <em>(Training Demo)</em>
      </div>

      {/* You are here bar */}
      <div style={{ background: 'var(--sbi-blue)', color: 'white', padding: '10px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
        You are here: / My Accounts &amp; Profile / <strong>Home Dashboard</strong>
      </div>

      {/* Dashboard cards */}
      <div className="dashboard-grid">
        <div className="dash-card"><div className="dc-icon">💰</div><h3>Account Balance</h3><p>Click to view (Demo)</p></div>
        <div className="dash-card"><div className="dc-icon">💳</div><h3>Debit Card</h3><p>Manage your card (Demo)</p></div>
        <div className="dash-card"><div className="dc-icon">📤</div><h3>Fund Transfer</h3><p>Send money (Demo)</p></div>
        <div className="dash-card"><div className="dc-icon">📋</div><h3>Account Statement</h3><p>View transactions (Demo)</p></div>
      </div>
    </>
  );
};

export default DashboardScreen;