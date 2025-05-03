// src/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      // 1) Логинимся по JWT‑эндпоинту
      const res = await fetch('http://localhost:9999/api/auth/jwt/login', {
        method: 'POST',
        credentials: 'include', // чтобы куки сохранились
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&scope=&client_id=&client_secret=`
      });

      if (!res.ok) {
        // читаем ошибку, если есть JSON
        let errText = res.statusText;
        try { 
          const err = await res.json(); 
          errText = err.detail || JSON.stringify(err);
        } catch {}
        throw new Error(errText);
      }

      // 2) Запрашиваем текущего залогиненного пользователя
      const me = await fetch('http://localhost:9999/api/user/current', {
        credentials: 'include'
      });
      if (!me.ok) {
        throw new Error(`Не удалось получить current-user (${me.status})`);
      }
      const profile = await me.json();

      // 3) Вызываем onLogin с email из профиля
      onLogin(/* токен в куках */ profile.email);
    }
    catch (err) {
      setError('Ошибка входа: ' + err.message);
    }
  };

  return (
    <div style={{
      maxWidth: 360, margin: '100px auto', padding: 20,
      border: '1px solid #ccc', borderRadius: 6
    }}>
      <h2>Вход</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Email:</label><br/>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width:'100%', padding:6 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Пароль:</label><br/>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width:'100%', padding:6 }}
          />
        </div>
        <button type="submit" style={{ width:'100%', padding:8 }}>
          Войти
        </button>
      </form>
    </div>
  );
}
