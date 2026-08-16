 import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { registerUser } from '../../utils/api';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');

    try {
      const { data } = await registerUser({
        full_name: fullName,
        email,
        password,
        role,
      });

      setMessage('Registration successful!');

      // The auth slice persists token + user to localStorage.
      dispatch(login({
        user: data.user,
        token: data.token,
      }));

      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        setMessage(error.response.data?.error || 'Registration failed.');
      } else {
        setMessage('Unable to connect to the server.');
      }
    }
  };

  return (
    <div className="register">
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          required
        >
          <option value="developer">Developer</option>
          <option value="manager">Manager</option>
        </select>

        <button type="submit">
          Register
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}