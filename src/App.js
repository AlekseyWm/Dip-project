// src/App.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Modal, Splitter } from 'antd';
import Header from './components/Header';
import Login from './Login';
import UntranslatedCodeViewer from './UntranslatedCodeViewer';
import TranslatedCodeViewer from './TranslatedCodeViewer';
import TerminalWindow from './TerminalWindow';
import ProgressModal from './ProgressModal';
import './App.css';

function App() {
  // Refs для терминала и SSE
  const terminalRef = useRef(null);
  const esRef      = useRef(null);
  const totalRef   = useRef(0);

  // Auth
  const [authChecked, setAuthChecked]     = useState(false);
  const [userEmail,    setUserEmail]      = useState('');
  const [userFullName, setUserFullName]   = useState('');

  // Файлы
  const [selectedFileLeft,  setFileLeft]   = useState('');
  const [selectedFileRight, setFileRight]  = useState('');
  const [overrideCode,      setOvrCode]    = useState('');
  const [overrideFileName,  setOvrName]    = useState('');
  const [refreshLeft,       setRefreshLeft]= useState(0);
  const [refreshRight,      setRefreshRight]= useState(0);

  // Терминал
  const [terminalLog,  setTerminalLog]  = useState([]);
  const [showTerminal, setShowTerminal] = useState(true);

  // Интерпретация
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progTotal,    setProgTotal]    = useState(0);
  const [progCurrent,  setProgCurrent]  = useState(0);
  const [progPhase,    setProgPhase]    = useState('translate');

  // Функция логирования
  const logToTerminal = (msg) => {
    setTerminalLog(prev => [...prev, msg]);
    terminalRef.current?.writeln(msg);
  };

  // Проверка сессии
  useEffect(() => {
    fetch('http://localhost:9999/api/user/current', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setUserEmail(d.email);
        setUserFullName(d.login);
        logToTerminal(`Сессия восстановлена: ${d.email}`);
      })
      .catch(() => logToTerminal('Сессия не активна. Требуется вход.'))
      .finally(() => setAuthChecked(true));
  }, []);

  // Logout
  const handleLogout = () => {
    fetch('http://localhost:9999/api/auth/jwt/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(r => {
        if (r.ok) {
          setUserEmail('');
          setUserFullName('');
          logToTerminal('Вы вышли из аккаунта.');
        } else {
          logToTerminal('Ошибка выхода.');
        }
      })
      .catch(err => logToTerminal('Ошибка выхода: ' + err));
  };

  // Кнопка "Интерпретировать"
  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }
    setShowConfirm(true);
  };

  // Запуск SSE-интерпретации
  const startInterpretation = () => {
    setShowConfirm(false);
    if (esRef.current) esRef.current.close();

    logToTerminal(`Интерпретация файла: ${selectedFileLeft}`);
    setShowProgress(true);
    setProgPhase('translate');
    setProgTotal(0);
    setProgCurrent(0);
    totalRef.current = 0;
    setOvrCode('');
    setOvrName('');

    const url = `http://localhost:9999/api/application/translate_code_file_stream?file_name=${encodeURIComponent(selectedFileLeft)}`;
    const es = new EventSource(url);
    esRef.current = es;
    const chunks = [];

    es.onmessage = e => {
      const d = JSON.parse(e.data);
      if (d.type === 'start') {
        setProgTotal(d.total);
        totalRef.current = d.total;
        logToTerminal(`Всего блоков: ${d.total}`);
      } else if (d.type === 'progress') {
        chunks.push(d.block);
        setProgCurrent(d.current);
        logToTerminal(`[${d.current}/${totalRef.current}] блок переведён`);
      } else if (d.type === 'complete') {
        logToTerminal('Перевод завершён, проверяем синтаксис…');
        setProgPhase('syntax');
      } else if (d.type === 'syntax') {
        logToTerminal(`[Проверка синтаксиса] ${d.message}`);
        setProgPhase('done');
        const result = chunks.join('\n\n');
        setOvrCode(result);
        const base = selectedFileLeft.replace(/\.[^.]+$/, '');
        const now = new Date().toISOString().slice(0,19).replace('T',' ');
        setOvrName(`${base} - ${userEmail} (${now}).py`);
        es.close();
        esRef.current = null;
      }
    };

    es.onerror = err => {
      es.close();
      esRef.current = null;
      totalRef.current = 0;
      logToTerminal('Ошибка SSE: ' + err);
      setShowProgress(false);
    };
  };

  // Если авторизация не проверена
  if (!authChecked) return <div>Проверка авторизации...</div>;

  // Если не залогинены — показываем Login
  if (!userEmail) {
    return (
      <Login onLogin={({ email, fullName }) => {
        setUserEmail(email);
        setUserFullName(fullName);
        terminalRef.current?.clear();
        setTerminalLog([]);
        logToTerminal(`Успешный вход: ${email}`);
      }} />
    );
  }

  return (
    <div className="App">
      {/* Header */}
      <Header
        userEmail={userEmail}
        userFullName={userFullName}
        onLogout={handleLogout}
        onTranslate={handleTranslate}
        onToggleTerminal={() => setShowTerminal(v => !v)}
      />

      {/* Основной Splitter */}
      <div className="split">
        <Splitter
          layout="vertical"
          style={{ height: '100%' }}
          sizes={showTerminal ? [80, 20] : [100, 0]}
          min={100}
          onResize={() => terminalRef.current?.fit?.()}
        >
          {/* Верх: редакторы (оба collapsible!) */}
          <Splitter.Panel min={200}>
            <Splitter style={{ height: '100%' }}>
              <Splitter.Panel min="20%" collapsible>
                <UntranslatedCodeViewer
                  fileName={selectedFileLeft}
                  logToTerminal={logToTerminal}
                  onSaveSuccess={() => setRefreshLeft(n => n+1)}
                  onSelectFile={fname => {
                    setFileLeft(fname);
                    setOvrCode('');
                    setOvrName('');
                    logToTerminal(`Выбран файл слева: ${fname}`);
                  }}
                />
              </Splitter.Panel>
              <Splitter.Panel min="20%" collapsible>
                <TranslatedCodeViewer
                  fileName={selectedFileRight}
                  overrideCode={overrideCode}
                  overrideFileName={overrideFileName}
                  logToTerminal={logToTerminal}
                  onSaveSuccess={() => setRefreshRight(n => n+1)}
                  onSelectFile={fname => {
                    setFileRight(fname);
                    logToTerminal(`Выбран файл справа: ${fname}`);
                  }}
                />
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>

          {/* Низ: терминал (не collapsible, min=200) */}
          {showTerminal && (
            <Splitter.Panel min={200} max={400}>
              <div className="terminal-body-only">
                <TerminalWindow ref={terminalRef} initialLog={terminalLog} />
              </div>
            </Splitter.Panel>
          )}
        </Splitter>
      </div>

      {/* Подтверждение */}
      <Modal
        title="Подтверждение"
        open={showConfirm}
        onOk={startInterpretation}
        onCancel={() => setShowConfirm(false)}
        okText="Продолжить"
        cancelText="Отмена"
      >
        <p>Процесс интерпретации нельзя будет остановить. Продолжить?</p>
      </Modal>

      {/* Прогресс */}
      <ProgressModal
        open={showProgress}
        total={progTotal}
        current={progCurrent}
        phase={progPhase}
        fileName={overrideFileName}
        onClose={() => {
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
            totalRef.current = 0;
            logToTerminal('Интерпретация остановлена.');
          }
          setShowProgress(false);
        }}
      />
    </div>
  );
}

export default App;
