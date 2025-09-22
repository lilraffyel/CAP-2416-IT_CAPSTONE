// src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function Login() {
  const navigate = useNavigate();

  // Use 'id' instead of 'username' to match backend expectation
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // This function calls the backend /login endpoint and handles the response.
 const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      'http://localhost:5000/login',
      { id, password },
      { withCredentials: true }  // IMPORTANT for cookies/session
    );

    if (response.data.status === 'success') {
      localStorage.setItem('user', JSON.stringify({ id, role: response.data.role }));
      if (response.data.role === 'Student') navigate('/student/home');
      else if (response.data.role === 'Tutor') navigate('/teacher/home');
      else if (response.data.role === 'Admin') navigate('/admin/home');
      else setError('Unknown user role.');
    } else {
      setError('Login failed. Please check your credentials.');
    }
  } catch (err) {
    console.error('Login error:', err);
    setError('An error occurred during login. Please try again later.');
  }
};


  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Math Tutor App</h2>
        <p style={{ marginBottom: '1rem' }}>Sharpen your skills with Bayesian help!</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>User ID:</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)} 
              placeholder="Enter your user ID"
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
