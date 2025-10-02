// src/components/Login.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
//import './Login.scss'

const Login = () => {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', form);

    // Log the response to check the token and user data
    console.log('Response data:', res.data);

    // Assuming the backend sends token and user data as follows:
    // { token: "your-jwt-token", user: { id, email, username } }

    // If token and user data is returned, proceed with login
    if (res.data.token && res.data.user) {
      login(res.data.token, res.data.user);
      alert('Logged in!');
    } else {
      alert('Failed to retrieve token or user data.');
    }
  } catch (err) {
    console.error('Error during login:', err);
    alert(err.response.data.msg || 'Login failed');
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
