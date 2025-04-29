// src/components/Header.js
import React from 'react';
import '../components/Header.css';
import logo from '../data/img/logo_nn.png';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Логотип" className="logo" />
        {/* <div className="menu-item">Главная</div>
        <div className="menu-item active">Интерпретатор</div> */}
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="user-name">Иванов И.И.</div>
          <div className="user-role">Роль: Разработчик</div>
        </div>
      </div>
    </header>
  );
}

export default Header;
