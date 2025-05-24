import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

export default function Register({ onRegisterSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, setLogin] = useState('');
  const [roleId, setRoleId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!email || !password || !login || roleId === '') {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    const payload = {
      email,
      password,
      login,
      role_id: parseInt(roleId)
    };

    try {
      const res = await fetch('http://localhost:9999/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Ошибка регистрации');
      }

      onRegisterSuccess?.(); // вернуться к форме логина
    } catch (err) {
      setError('Ошибка регистрации: ' + err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Регистрация</h2>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={e => setLogin(e.target.value)}
        />
        <input
          type="email"
          placeholder="Почта"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Показать/скрыть пароль"
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>
        <input
          type="number"
          placeholder="ID Роли"
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
        />
        <button type="submit" className="login-form-btn">Зарегистрироваться</button>
      </form>
    </div>
  );
}
