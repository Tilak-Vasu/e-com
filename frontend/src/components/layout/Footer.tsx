// src/components/layout/Footer.tsx

import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <p>© {new Date().getFullYear()} E-shop. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;