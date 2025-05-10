import React, { useRef, useState, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import UntranslatedCodeViewer from './UntranslatedCodeViewer';
import TranslatedCodeViewer from './TranslatedCodeViewer';
import Header from './components/Header';
import Split from 'react-split';
import '../src/App.css';
import Login from './Login';
import ProgressModal from './ProgressModal';
import useWindowSize from './hooks/useWindowSize'; // <-- добавлено

function App() {
  const terminalRef = useRef(null);
  const [terminalLog, setTerminalLog] = useState([]);
  const [showTerminal, setShowTerminal] = useState(true);
  const [width] = useWindowSize();
  const isNarrow = width < 900;

  const logToTerminal = (msg) => {
    setTerminalLog(prev => [...prev, msg]);
    terminalRef.current?.writeln(msg);
  };

  const esRef = useRef(null);
  const totalRef = useRef(0);

  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('http://localhost:9999/api/user/current', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(d => {
        setUserEmail(d.email);
        setUserFullName(d.login);
        setTimeout(() => logToTerminal(`Сессия восстановлена: ${d.email}`), 0);
      })
      .catch(() => setTimeout(() => logToTerminal('Сессия не активна. Требуется вход.'), 0))
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
          setUserFullName('');
          logToTerminal('Вы вышли из аккаунта.');
        } else {
          logToTerminal('Ошибка выхода.');
        }
      })
      .catch(err => logToTerminal('Ошибка выхода: ' + err));
  };

  const [selectedFileLeft, setFileLeft] = useState('');
  const [selectedFileRight, setFileRight] = useState('');
  const [overrideCode, setOvrCode] = useState('');
  const [overrideFileName, setOvrName] = useState('');
  const [refreshLeft, setRefreshLeft] = useState(0);
  const [refreshRight, setRefreshRight] = useState(0);

  const [showProgress, setShowProg] = useState(false);
  const [progTotal, setProgTot] = useState(0);
  const [progCurrent, setProgCur] = useState(0);
  const [progPhase, setProgPhase] = useState('translate');

  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }

    if (esRef.current) esRef.current.close();

    logToTerminal(`Интерпретация файла: ${selectedFileLeft}`);
    setShowProg(true);
    setProgPhase('translate');
    setProgTot(0);
    setProgCur(0);
    totalRef.current = 0;
    setOvrCode('');
    setOvrName('');

    const url = `http://localhost:9999/api/application/translate_code_file_stream?file_name=${encodeURIComponent(selectedFileLeft)}`;
    const es = new EventSource(url);
    esRef.current = es;
    const chunks = [];

    es.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'start') {
        setProgTot(d.total);
        totalRef.current = d.total;
        logToTerminal(`Всего блоков: ${d.total}`);
      } else if (d.type === 'progress') {
        chunks.push(d.block);
        setProgCur(d.current);
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
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        setOvrName(`${base} - ${userEmail} (${now}).py`);
        es.close();
        esRef.current = null;
      }
    };

    es.onerror = (err) => {
      es.close();
      esRef.current = null;
      totalRef.current = 0;
      logToTerminal('Ошибка SSE: ' + err);
      setShowProg(false);
    };
  };

  if (!authChecked) return <div>Проверка авторизации...</div>;
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
      <Header
        userEmail={userEmail}
        userFullName={userFullName}
        onLogout={handleLogout}
        onTranslate={handleTranslate}
        onToggleTerminal={() => setShowTerminal(prev => !prev)}
      />

      <div style={{ padding: '15px 10px' }}>
        {isNarrow ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <UntranslatedCodeViewer
                fileName={selectedFileLeft}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshLeft(r => r + 1)}
                onSelectFile={(fname) => {
                  setFileLeft(fname);
                  logToTerminal(`Выбран новый файл слева: ${fname}`);
                }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <TranslatedCodeViewer
                fileName={selectedFileRight}
                overrideCode={overrideCode}
                overrideFileName={overrideFileName}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshRight(r => r + 1)}
                onSelectFile={(fname) => {
                  setFileRight(fname);
                  setOvrCode('');
                  setOvrName('');
                  logToTerminal(`Выбран новый файл справа: ${fname}`);
                }}
              />
            </div>
          </>
        ) : (
          <Split className="split" sizes={[50, 50]} minSize={200} direction="horizontal" style={{ display: 'flex' }}>
            <div style={{ height: '100%' }}>
              <UntranslatedCodeViewer
                fileName={selectedFileLeft}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshLeft(r => r + 1)}
                onSelectFile={(fname) => {
                  setFileLeft(fname);
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
                onSaveSuccess={() => setRefreshRight(r => r + 1)}
                onSelectFile={(fname) => {
                  setFileRight(fname);
                  setOvrCode('');
                  setOvrName('');
                  logToTerminal(`Выбран новый файл справа: ${fname}`);
                }}
              />
            </div>
          </Split>
        )}

        {showTerminal && (
          <div style={{ marginTop: 10 }}>
            <TerminalWindow ref={terminalRef} initialLog={terminalLog} />
          </div>
        )}
      </div>

      <ProgressModal
        open={showProgress}
        total={progTotal}
        current={progCurrent}
        phase={progPhase}
        onClose={() => {
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
            totalRef.current = 0;
            logToTerminal('Интерпретация была принудительно остановлена.');
          }
          setShowProg(false);
        }}
      />
    </div>
  );
}

export default App;
