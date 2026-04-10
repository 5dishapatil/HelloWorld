import React from 'react';
import { useAppContext } from '../context/AppContext';

const FinishScreen: React.FC = () => {
  const { showScreen, setPostLoginUI } = useAppContext();

  const practiceAgain = () => {
    setPostLoginUI(false);
    showScreen('screen-disclaimer');
  };

  return (
    <div className="success-screen">
      <div className="ss-icon">🎓</div>
      <h2>Thank You for Practising!</h2>
      <p>
        You have completed the SBI Online Banking Training Simulation.<br /><br />
        <strong>Remember:</strong> When using real SBI Online Banking, always ensure you are on the official website
        and never share your username, password, or OTP with anyone.
      </p>
      <div style={{ background: '#e8f7fd', border: '2px solid var(--sbi-cyan)', borderRadius: '8px', padding: '16px', textAlign: 'left', fontSize: '15px', color: '#154360', marginTop: '8px', marginBottom: '16px' }}>
        <strong>🔐 Safety Tips:</strong><br />
        ✅ Always check the URL before logging in<br />
        ✅ Never share OTP with anyone — bank never asks<br />
        ✅ Change your password regularly<br />
        ✅ Log out after every session<br />
        ✅ Use bank's official app or website only
      </div>
      <div className="ss-actions">
        <button className="btn-primary" onClick={practiceAgain}>🔁 Practice Again</button>
      </div>
    </div>
  );
};

export default FinishScreen;