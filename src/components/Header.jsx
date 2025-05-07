import React, { useState, useRef, useEffect } from 'react';
import '../components/Header.css';
import { FaAddressCard, FaMoon, FaQuestionCircle, FaSignOutAlt  } from "react-icons/fa";



function Header({ userEmail, userFullName, onLogout, onTranslate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <header className="header">
        <div className="header-left">
          <span className="header-title">Интерпретатор НМЗ XIS</span>
        </div>

        <div className="header-right">
          <button className="styled-button" onClick={onTranslate}>Интерпретировать</button>
          <button className="styled-button">Раскладка</button>
          <div className="user-menu-wrapper" ref={menuRef}>
            <button className="styled-button icon-button" onClick={() => setMenuOpen(!menuOpen)}>
              <FaAddressCard size={18} />
            </button>
            {menuOpen && (
              <div className="user-dropdown">
               <div className="user-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo-sm.svg" alt="Логотип" style={{ height: 32 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div
                        className="user-fullname"
                        title={userFullName}
                      >
                        {userFullName}
                      </div>
                      <div
                        className="user-email"
                        title={userEmail}
                      >
                        Почта: <a href={`mailto:${userEmail}`}>{userEmail}</a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="user-actions">
                  <div className="user-action">
                    <FaMoon style={{ marginRight: 8 }} />
                    Светлая/Темная тема
                  </div>
                  <div className="user-action">
                    <FaQuestionCircle style={{ marginRight: 8 }} />
                    Справка
                  </div>
                  <div className="user-action logout" onClick={onLogout}>
                    <FaSignOutAlt style={{ marginRight: 8 }} />
                    Выход
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </header>
    </div>
  );
}

export default Header;
