import React from 'react';
import { useAppContext } from '../context/AppContext';

const ForgotSuccessScreen: React.FC = () => {
  const { showScreen } = useAppContext();

  return (
    <div className="success-screen">
      <div className="ss-icon">🎉</div>
      <h2>Password Reset Successful!</h2>
      <p>
        Great job! You have completed the password reset practice.<br />
        Now let's practice logging in with your new sample password.
      </p>
      <div className="ss-actions">
        <button className="btn-primary" onClick={() => showScreen('screen-login-after-reset')}>
          → Return to Login Page
        </button>
      </div>
    </div>
  );
};

export default ForgotSuccessScreen;