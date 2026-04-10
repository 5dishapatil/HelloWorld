import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeech } from '../hooks/useSpeech';

interface LoginStepConfig {
  badge: string;
  title: string;
  body: string;
  note: string;
  progressWidth: string;
  progressLabel: string;
}

const STEP_CONFIGS: Record<number, LoginStepConfig> = {
  1: {
    badge: 'STEP 1 OF 4',
    title: 'Enter Your Username / Customer ID',
    body: 'This is where you enter your <strong>Username</strong> or <strong>Customer ID</strong>. For this practice demo, use any sample text — e.g. <strong>"SampleUser123"</strong>.<br><span style="color:var(--sbi-red);font-weight:600;"> Do NOT enter your real banking username.</span>',
    note: '',
    progressWidth: '25%',
    progressLabel: 'Step 1 of 4 — Enter Username',
  },
  2: {
    badge: 'STEP 2 OF 4',
    title: 'Enter Your Password',
    body: 'Now type your password. For safety, <span style="color:var(--sbi-red);font-weight:600;">do NOT enter your real banking password</span>. You can type any sample password like <strong>"Practice@1"</strong>.',
    note: '',
    progressWidth: '50%',
    progressLabel: 'Step 2 of 4 — Enter Password',
  },
  3: {
    badge: 'STEP 3 OF 4',
    title: 'Enter the Captcha Text',
    body: 'Type the text shown in the image box. The captcha for this training demo is shown as a hint below the image. This step helps verify you are a real person.',
    note: '',
    progressWidth: '65%',
    progressLabel: 'Step 3 of 4 — Enter Captcha',
  },
  4: {
    badge: 'STEP 4 OF 4',
    title: 'Do you remember your password?',
    body: "Before we log in, let's make sure you know what to do if you forget your password. Answer the question below. Take your time — this is only practice!",
    note: '<span style="color:var(--sbi-green);font-weight:600;">✅ Captcha accepted!</span>',
    progressWidth: '80%',
    progressLabel: 'Step 4 of 4 — Confirm & Login',
  },
  5: {
    badge: 'FINAL STEP',
    title: 'Click Login to Continue',
    body: 'Now click the <strong>Login</strong> button to continue. This is only a practice login and does not connect to the real bank.',
    note: '<span style="color:var(--sbi-green);font-weight:600;">✅ All details entered. You are ready!</span>',
    progressWidth: '100%',
    progressLabel: 'Final Step — Click Login',
  },
};

const CAPTCHAS = ['7x2g2', 'k4p9x', 'm3w6r', '9ftz2', 'bx5hq'];

const LoginScreen: React.FC = () => {
  const { showScreen, setPostLoginUI, setBreadcrumb, setHamburgerActive, setLastLoginTime, setWsDateHTML } = useAppContext();
  const { speak } = useSpeech();

  const [loginStep, setLoginStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [captchaIdx, setCaptchaIdx] = useState(0);
  const captchaCode = CAPTCHAS[captchaIdx];

  // Notes/errors
  const [showUsernameNote, setShowUsernameNote] = useState(false);
  const [showUsernameErr, setShowUsernameErr] = useState(false);
  const [showPasswordNote, setShowPasswordNote] = useState(false);
  const [showPasswordErr, setShowPasswordErr] = useState(false);
  const [showCaptchaNote, setShowCaptchaNote] = useState(false);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<HTMLInputElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const decisionBoxRef = useRef<HTMLDivElement>(null);

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  // Focus management based on step
  useEffect(() => {
    if (loginStep === 1 && usernameRef.current) usernameRef.current.focus();
    else if (loginStep === 2 && passwordRef.current) passwordRef.current.focus();
    else if (loginStep === 3 && captchaRef.current) captchaRef.current.focus();
    else if (loginStep === 4 && decisionBoxRef.current) decisionBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    else if (loginStep === 5 && loginBtnRef.current) loginBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [loginStep]);

  const strongPwRegex = /^(?=.*)(?=.*\d)(?=.*).{8,}$/;

  const onUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUsername(v);
    clearStepTimer();
    if (v.trim().length > 0) {
      setShowUsernameNote(true);
      setShowUsernameErr(false);
      if (loginStep === 1) {
        stepTimerRef.current = setTimeout(() => setLoginStep(2), 2000);
      }
    }
  };

  const onPasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    clearStepTimer();
    if (strongPwRegex.test(v)) {
      setShowPasswordNote(true);
      setShowPasswordErr(false);
      if (loginStep === 2) {
        stepTimerRef.current = setTimeout(() => setLoginStep(3), 2000);
      }
    } else {
      setShowPasswordNote(false);
      setShowPasswordErr(true);
    }
  };

  const onCaptchaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCaptchaInput(v);
    clearStepTimer();
    if (v.trim().toLowerCase() === captchaCode.toLowerCase()) {
      setShowCaptchaNote(true);
      if (loginStep === 3) {
        stepTimerRef.current = setTimeout(() => setLoginStep(4), 2000);
      }
    } else {
      setShowCaptchaNote(false);
    }
  };

  const refreshCaptcha = () => {
    clearStepTimer();
    const next = (captchaIdx + 1) % CAPTCHAS.length;
    setCaptchaIdx(next);
    setCaptchaInput('');
    setShowCaptchaNote(false);
  };

  const goForgotPassword = () => {
    showScreen('screen-forgot');
  };

  const enableLoginButton = () => {
    setLoginStep(5);
  };

  const doLogin = () => {
    if (!username.trim() || !password) {
      alert('Please complete all fields before logging in.');
      return;
    }
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

  const resetLoginForm = () => {
    clearStepTimer();
    setUsername('');
    setPassword('');
    setCaptchaInput('');
    setShowUsernameNote(false);
    setShowPasswordNote(false);
    setShowCaptchaNote(false);
    setShowUsernameErr(false);
    setShowPasswordErr(false);
    setLoginStep(1);
  };

  const cfg = STEP_CONFIGS[loginStep];

  const isUsernameDisabled = false;
  const isPasswordDisabled = loginStep < 2;
  const isCaptchaDisabled  = loginStep < 3;
  const isLoginBtnDisabled = loginStep < 5;
  const showDecision = loginStep === 4;

  return (
    <>
      {/* Progress */}
      <div className="progress-bar-outer">
        <div className="progress-bar-inner" style={{ width: cfg.progressWidth }} />
      </div>
      <div className="progress-label">{cfg.progressLabel}</div>

      {/* Instruction card */}
      <div className="instruction-card">
        <div className="ic-header">
          <span className="ic-step-badge">{cfg.badge}</span>
          <span className="ic-title">{cfg.title}</span>
        </div>
        <div className="ic-body" dangerouslySetInnerHTML={{ __html: cfg.body }} />
        {cfg.note && (
          <div className="ic-note" dangerouslySetInnerHTML={{ __html: cfg.note }} />
        )}
        <div className="ic-actions">
          <button className="btn-speak" onClick={() => speak(cfg.body.replace(/<[^>]+>/g, ''))}>🔊 Read Aloud</button>
          <button className="btn-speak" onClick={() => speak(cfg.body.replace(/<[^>]+>/g, ''))}>🔁 Repeat</button>
        </div>
      </div>

      {/* Warning reminder */}
      <div style={{ background: 'var(--warn-bg)', border: '2px solid var(--warn-border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: 'var(--warn-text)', fontWeight: 600 }}>
        ⚠️ Reminder: Do NOT use your real bank credentials on this training page.
      </div>

      {/* Login form card */}
      <div className="form-card">
        <h2>Login to OnlineSBI</h2>
        <p className="card-subtitle">(CARE: Username and password are case sensitive.)</p>

        {/* Step 1: Username */}
        <div className={`form-group${loginStep < 1 ? ' dimmed' : ''}`} id="fg-username">
          <label htmlFor="inp-username">Username <span className="req">*</span></label>
          <input
            type="text"
            id="inp-username"
            ref={usernameRef}
            placeholder="Enter sample username"
            autoComplete="off"
            value={username}
            onChange={onUsernameInput}
            disabled={isUsernameDisabled}
            className={loginStep === 1 ? 'step-active' : ''}
          />
          <div className={`success-note${showUsernameNote ? ' show' : ''}`}>✅ Great! You completed the first step.</div>
          <div className={`error-note${showUsernameErr ? ' show' : ''}`}>Please type something before moving ahead.</div>
        </div>

        {/* Step 2: Password */}
        <div className={`form-group${isPasswordDisabled ? ' dimmed' : ''}`} id="fg-password">
          <label htmlFor="inp-password">Password <span className="req">*</span></label>
          <div className="pw-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              id="inp-password"
              ref={passwordRef}
              placeholder="Enter sample password"
              autoComplete="off"
              value={password}
              onChange={onPasswordInput}
              disabled={isPasswordDisabled}
              className={loginStep === 2 ? 'step-active' : ''}
            />
            <button
              className="pw-toggle"
              id="pw-toggle-btn"
              onClick={() => setShowPw(p => !p)}
              type="button"
              aria-label="Show/hide password"
            >
              👁️
            </button>
          </div>
          <div className={`success-note${showPasswordNote ? ' show' : ''}`}>✅ Well done. Now you are ready to log in.</div>
          <div className={`error-note${showPasswordErr ? ' show' : ''}`}>Please use a strong password (min 8 chars, 1 letter, 1 number, 1 symbol).</div>
        </div>

        {/* Step 3: CAPTCHA */}
        <div className={`form-group${isCaptchaDisabled ? ' dimmed' : ''}`} id="fg-captcha">
          <label>Enter the text as shown in the image <span className="req">*</span></label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="captcha-type" defaultChecked style={{ accentColor: 'var(--sbi-red)', width: '14px', height: '14px' }} />
              <span style={{ color: 'var(--sbi-red)', fontWeight: 700 }}>Image Captcha</span>
            </label>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="radio" name="captcha-type" style={{ accentColor: 'var(--sbi-red)', width: '14px', height: '14px' }} />
              <span style={{ color: 'var(--sbi-red)', fontWeight: 700 }}>Audio Captcha</span>
            </label>
          </div>
          <div className="captcha-area">
            <div className="captcha-img">{captchaCode}</div>
            <button className="btn-refresh" onClick={refreshCaptcha} type="button" title="Refresh Captcha">🔄</button>
            <input
              type="text"
              id="inp-captcha"
              ref={captchaRef}
              placeholder="Type captcha here"
              style={{ flex: 1, minWidth: '140px' }}
              autoComplete="off"
              value={captchaInput}
              onChange={onCaptchaInputChange}
              disabled={isCaptchaDisabled}
              className={loginStep === 3 ? 'step-active' : ''}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            💡 Training hint: The captcha for this demo is always: <strong>{captchaCode}</strong>
          </div>
          <div className={`success-note${showCaptchaNote ? ' show' : ''}`}>✅ Captcha accepted.</div>
          <div className="error-note">Please type the captcha text shown in the image.</div>
        </div>

        {/* Step 4: Decision */}
        {showDecision && (
          <div className="decision-card" ref={decisionBoxRef}>
            <h3>🤔 Quick Check — Do you remember your password?</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '14px' }}>Take your time — this is only a practice session!</p>
            <div className="decision-buttons">
              <button className="btn-decision yes" onClick={goForgotPassword}>😕 No, I forgot my password</button>
              <button className="btn-decision no" onClick={enableLoginButton}>👍 Yes, I remember it — Continue to Login</button>
            </div>
          </div>
        )}

        {/* Forgot link */}
        <div style={{ marginTop: '10px', marginBottom: '4px' }}>
          <button className="forgot-link" onClick={goForgotPassword} id="forgot-link-btn">
            Forgot Username / Login Password?
          </button>
        </div>

        {/* Form actions */}
        <div className="form-actions" style={{ marginTop: '16px' }}>
          <button
            className={`btn-login${loginStep === 5 ? ' step-active' : ''}`}
            id="btn-login-submit"
            ref={loginBtnRef}
            disabled={isLoginBtnDisabled}
            onClick={doLogin}
          >
            Login
          </button>
          <button className="btn-reset-grey" onClick={resetLoginForm}>Reset</button>
        </div>
      </div>

      {/* Security notice */}
      <div style={{ fontSize: '13px', color: '#666', padding: '8px 4px' }}>
        For better security use the Online Virtual Keyboard to login. &nbsp;<em>(Simulation only)</em>
      </div>
    </>
  );
};

export default LoginScreen;