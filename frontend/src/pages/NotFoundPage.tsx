// src/pages/NotFoundPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4em', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '2em', margin: '0 0 1rem 0' }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button>Go Back to Home</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;