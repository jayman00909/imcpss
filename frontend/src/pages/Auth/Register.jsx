 import React, { useState } from 'react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful!');

        console.log('Registration response:', data);

        // Save the JWT token
        localStorage.setItem('token', data.token);

        // Save user information
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setMessage(data.error || 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Unable to connect to the server.');
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