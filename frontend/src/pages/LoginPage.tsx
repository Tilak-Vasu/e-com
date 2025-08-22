// src/pages/LoginPage.tsx

import React, { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './FormPage.css'; // This uses your shared form styles

const LoginPage: React.FC = () => {
  // Get the login function from our new AuthContext
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // This redirects the user back to the page they were on before logging in
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Call the login function from the context
      await loginUser({ username, password });
      // On success, navigate to the previous page or homepage
      navigate(from, { replace: true });
    } catch (err) {
      setError('Login failed. Please check your username and password.');
      console.error("Login page caught an error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-card">
        <h2>Welcome Back!</h2>
        {error && <p className="form-error">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        <p className="form-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;