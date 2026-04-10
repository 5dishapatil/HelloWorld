import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const LoginAfterResetScreen: React.FC = () => {
  const { showScreen, setPostLoginUI, setBreadcrumb, setHamburgerActive, setLastLoginTime, setWsDateHTML } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [showErr, setShowErr] = useState(false);

  const strongPwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

  const doLoginAfterReset = () => {
    if (!username.trim() || !password) {
      setErrMsg('Please enter both username and password to continue.');
      setShowErr(true);
      return;
    }
    if (!strongPwRegex.test(password)) {
      setErrMsg('Please enter the strong password you just created (min 8 chars, 1 letter, 1 num, 1 symbol).');
      setShowErr(true);
      return;
    }
    setShowErr(false);
    setPostLoginUI(true);
    setHamburgerActive(true);
    const now = new Date();
    setLastLoginTime(
      now.toLocaleDateString('en-IN') + ' [' + now.toLocaleTimeString('en-IN') + ' IST]'
    );
    setWsDateHTML(
      now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      '\n' +
      now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
      ' IST'
    );
    setBreadcrumb('Home Dashboard');
    showScreen('screen-dashboard');
  };

  return (
    <>
      <div style={{ background: 'var(--warn-bg)', border: '2px solid var(--warn-border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: 'var(--warn-text)', fontWeight: 600 }}>
        ⚠️ TRAINING DEMO: Use sample credentials only.
      </div>

      <div className="instruction-card">
        <div className="ic-header">
          <span className="ic-step-badge">GREAT!</span>
          <span className="ic-title">Practice Login After Password Reset</span>
        </div>
        <div className="ic-body">
          Now let's practice logging in with your new password.
          Enter any sample username and your sample new password, then click Login.
          <span className="ic-note">You're doing really well — take your time! 😊</span>
        </div>
      </div>

      <div className="form-card">
        <h2>Login to OnlineSBI</h2>
        <p className="card-subtitle">Now practice logging in with the new password you just set.</p>

        <div className="form-group">
          <label htmlFor="ar-username">Username <span className="req">*</span></label>
          <input
            type="text"
            id="ar-username"
            placeholder="Enter sample username"
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ar-password">New Password <span className="req">*</span></label>
          <div className="pw-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              id="ar-password"
              placeholder="Enter your sample new password"
              autoComplete="off"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="pw-toggle" onClick={() => setShowPw(p => !p)} type="button">👁️</button>
          </div>
        </div>

        <div className={`error-note${showErr ? ' show' : ''}`} style={{ marginBottom: '12px' }}>
          {errMsg}
        </div>

        <div className="form-actions">
          <button className="btn-login" onClick={doLoginAfterReset}>Login</button>
        </div>
      </div>
    </>
  );
};

export default LoginAfterResetScreen;