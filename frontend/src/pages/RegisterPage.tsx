// src/pages/RegisterPage.tsx

import React, { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './FormPage.css';

const RegisterPage: React.FC = () => {
  const { registerUser, loginUser } = useAuth(); // Get both register and login
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Call the register function from the context
      await registerUser({ username, email, password });
      
      // 2. (Optional but good UX) Automatically log the user in after they register
      await loginUser({ username, password });
      
      // 3. Navigate them to the homepage as a logged-in user
      navigate('/');
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.username?.[0] || 'Registration failed. Please try a different username or email.';
      setError(errorMessage);
      console.error('Registration Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-card">
        <h2>Create an Account</h2>
        {error && <p className="form-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <Input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <Input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <Input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Register'}
        </Button>

        <p className="form-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;