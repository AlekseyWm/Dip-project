import React, { useRef, useState, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import UntranslatedCodeViewer from './UntranslatedCodeViewer';
import TranslatedCodeViewer from './TranslatedCodeViewer';
import Header from './components/Header';
import Split from 'react-split';
import '../src/App.css';

import Login from './Login';
import ProgressModal from './ProgressModal';

function App() {
  const terminalRef = useRef(null);
  const logToTerminal = (msg) => terminalRef.current?.writeln(msg);

  const [userEmail, setUserEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const [refreshUntranslatedTrigger, setRefreshUntranslatedTrigger] = useState(0);
  const [refreshTranslatedTrigger, setRefreshTranslatedTrigger] = useState(0);

  const [selectedFileLeft, setSelectedFileLeft] = useState('');
  const [selectedFileRight, setSelectedFileRight] = useState('');
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideFileName, setOverrideFileName] = useState('');

  const [showProgress, setShowProgress] = useState(false);
  const [progTotal, setProgTotal] = useState(0);
  const [progCurrent, setProgCurrent] = useState(0);

  // --- Авторизация
  useEffect(() => {
    fetch('http://localhost:9999/api/user/current', {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setUserEmail(data.email);
        logToTerminal(`Сессия восстановлена: ${data.email}`);
      })
      .catch(() => {
        logToTerminal('Сессия не активна. Требуется вход.');
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = () => {
    fetch('http://localhost:9999/api/auth/jwt/logout', {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => {
        if (res.ok) {
          setUserEmail('');
          logToTerminal('Вы вышли из аккаунта.');
        } else {
          logToTerminal('Ошибка выхода.');
        }
      })
      .catch(err => logToTerminal('Ошибка выхода: ' + err));
  };

  // --- Процесс интерпретации
  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }

    setShowProgress(true);
    setProgTotal(0);
    setProgCurrent(0);
    setOverrideCode('');
    setOverrideFileName('');

    const url = `http://localhost:9999/api/application/translate_code_file_stream?file_name=${encodeURIComponent(selectedFileLeft)}`;
    const es = new EventSource(url);
    const chunks = [];

    es.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'start') {
        setProgTotal(d.total);
      } else if (d.type === 'progress') {
        chunks.push(d.block);
        setProgCurrent(d.current);
      } else if (d.type === 'complete') {
        es.close();
        const result = chunks.join('\n\n');
        setOverrideCode(result);
        const base = selectedFileLeft.replace(/\.[^.]+$/, '');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        setOverrideFileName(`${base} - ${userEmail} (${now}).py`);
        logToTerminal('Интерпретация завершена.');
      }
    };

    es.onerror = (err) => {
      es.close();
      logToTerminal('Ошибка SSE: ' + err);
      setShowProgress(false);
    };
  };

  if (!authChecked) return <div>Проверка авторизации...</div>;

  if (!userEmail) {
    return (
      <Login
        onLogin={(email) => {
          setUserEmail(email);
          logToTerminal(`Успешный вход: ${email}`);
        }}
      />
    );
  }

  return (
    <div className="App">
      <Header userEmail={userEmail} onLogout={handleLogout} />

      <div style={{ padding: '15px 10px' }}>
        {/* Верхняя панель */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px',
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'Proxima Nova, sans-serif',
            color: '#444',
          }}>
            Интерпретатор НМЗ XIS
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleTranslate}
              className="btn-translate"
            >
              Интерпретировать
            </button>
          </div>
        </div>

        {/* Два редактора */}
        <div style={{ marginTop: '10px' }}>
          <Split
            className="split"
            sizes={[50, 50]}
            minSize={200}
            direction="horizontal"
            style={{ display: 'flex' }}
          >
            <div style={{ height: '100%' }}>
              <UntranslatedCodeViewer
                fileName={selectedFileLeft}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshUntranslatedTrigger(prev => prev + 1)}
                onSelectFile={(fname) => {
                  setSelectedFileLeft(fname);
                  logToTerminal(`Выбран новый файл слева: ${fname}`);
                }}
              />
            </div>
            <div style={{ height: '100%' }}>
              <TranslatedCodeViewer
                fileName={selectedFileRight}
                overrideCode={overrideCode}
                overrideFileName={overrideFileName}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshTranslatedTrigger(prev => prev + 1)}
                onSelectFile={(fname) => {
                  setSelectedFileRight(fname);
                  setOverrideCode('');
                  setOverrideFileName('');
                  logToTerminal(`Выбран новый файл справа: ${fname}`);
                }}
              />
            </div>
          </Split>
        </div>

        {/* Терминал */}
        <div style={{ marginTop: '10px' }}>
          <div className='terminal-container'>
            <TerminalWindow terminalRef={terminalRef} />
          </div>
        </div>
      </div>

      {/* Модальное окно прогресса */}
      <ProgressModal
        open={showProgress}
        total={progTotal}
        current={progCurrent}
        onClose={() => setShowProgress(false)}
      />
    </div>
  );
}

export default App;
