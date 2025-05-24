import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaMoon, FaQuestionCircle, FaSignOutAlt, FaTerminal } from "react-icons/fa";
import '../components/Header.css';
import { LuUser } from 'react-icons/lu';


function Header({ userEmail, userFullName, onLogout, onTranslate, onToggleTerminal }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <header className="header">
        <div className="header-left">
          <span className="header-title">Интерпретатор НМЗ XIS</span>
        </div>

        <div className="header-right">
          <button
            className={`styled-button ${isMobile ? 'icon-button' : 'main-action'}`}
            onClick={onTranslate}
            title="Интерпретировать"
          >
            {isMobile ? <FaPlay size={16} /> : 'Интерпретировать'}
          </button>

          {/* <button 
            className="styled-button"
            title="Раскладка" 
          >
            <LuLayoutDashboard size={18} />            
          </button> */}


          <button
            className="styled-button icon-button"
            onClick={onToggleTerminal}
            title="Показать/скрыть терминал"
          >
            <FaTerminal size={18} />
          </button>

          <div className="user-menu-wrapper" ref={menuRef}>
            <button className="styled-button icon-button" onClick={() => setMenuOpen(!menuOpen)}>
              <LuUser size={18} />
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo-sm.svg" alt="Логотип" style={{ height: 32 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div className="user-fullname" title={userFullName}>
                        {userFullName}
                      </div>
                      <div className="user-email" title={userEmail}>
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
