// src/pages/LoginPage.tsx

import React, { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './FormPage.css'; // This page uses the shared form styles

const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // This line intelligently finds where the user was trying to go before being
  // sent to the login page. It defaults to the homepage '/' if they came here directly.
  const from = location.state?.from?.pathname || '/';

  // --- STATE MANAGEMENT ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // State to hold and display error messages

  // --- FORM SUBMISSION HANDLER ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // 1. Prevent the browser's default page reload behavior
    e.preventDefault();

    // DEBUG: This log will run the moment the form is submitted.
    // If you don't see this in your console when you click "Login",
    // the problem is with the <form> or <Button> element itself.
    console.log('Form submission triggered. Attempting to log in...');

    // 2. Set loading state and clear any previous errors
    setIsLoading(true);
    setError('');

    try {
      // 3. Call the login function from the context
      await loginUser({ username, password });
      // 4. On success, navigate the user to their original destination
      navigate(from, { replace: true });
    } catch (err) {
      // 5. If loginUser throws an error, catch it and display a message
      setError('Login failed. Please check your credentials.');
      console.error("Login page caught an error:", err); // Log the actual error for debugging
    } finally {
      // 6. ALWAYS set loading back to false, whether it succeeded or failed
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="form-container">
      {/* The `onSubmit` event handler is attached to the form element */}
      <form onSubmit={handleSubmit} className="form-card">
        <h2>Login</h2>

        {/* Display the error message if the 'error' state is not empty */}
        {error && <p className="form-error">{error}</p>}

        <div className="form-group">
          <label htmlFor="username-login">Username</label>
          <Input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password-login">Password</label>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* This button MUST have type="submit" to trigger the form's onSubmit event */}
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