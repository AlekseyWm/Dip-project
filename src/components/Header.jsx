import React from 'react';
import '../components/Header.css';
import logo from '../data/img/logo_nn.png';

function Header({ userEmail, onLogout }) {
  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Логотип" className="logo" />
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="user-name">{userEmail}</div>
          <button onClick={onLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
