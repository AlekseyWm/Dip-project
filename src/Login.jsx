import React, { useState } from 'react';
import './Login.css';
import logo from './data/img/NM3_logo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login({ onLogin }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState('');
  const [emailError, setEmailError]     = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Не введён логин или почта');
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError('Не введён пароль');
      hasError = true;
    }
    if (hasError) return;

    try {
      const res = await fetch('http://localhost:9999/api/auth/jwt/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&scope=&client_id=&client_secret=`
      });

      if (!res.ok) {
        let errText = res.statusText;
        try {
          const err = await res.json();
          if (Array.isArray(err.detail)) {
            errText = err.detail.map(e => e.msg).join(', ');
          } else {
            errText = err.detail || JSON.stringify(err);
          }
        } catch {}
        throw new Error(errText);
      }

      const me = await fetch('http://localhost:9999/api/user/current', {
        credentials: 'include'
      });
      if (!me.ok) {
        throw new Error(`Не удалось получить current-user (${me.status})`);
      }
      const profile = await me.json();
      onLogin({ email: profile.email, fullName: profile.login });
    } catch (err) {
      setError('Ошибка входа: ' + err.message);
    }
  };

  return (
    <div className="login-background">
      <div className="login-container">
        <img src={logo} alt="Норникель" className="login-logo" />
        <h2>Добро пожаловать!</h2>
        {error && <p className="login-error">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          {emailError && <p className="field-error">{emailError}</p>}
          <input
            type="text"
            placeholder="Логин/Почта"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {passwordError && <p className="field-error">{passwordError}</p>}
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

          <p className="login-note">Для входа в систему нужно авторизироваться!</p>
          <button type="submit" className="login-form-btn">Войти</button>
        </form>
      </div>
    </div>
  );
}
