// src/pages/AuthPage.tsx

import React from 'react';
import './AuthPage.css'; // Create this new CSS file

interface AuthPageProps {
  children: React.ReactNode;
}

const AuthPage: React.FC<AuthPageProps> = ({ children }) => {
  return (
    <div className="auth-page-container">
      {children}
    </div>
  );
};

export default AuthPage;