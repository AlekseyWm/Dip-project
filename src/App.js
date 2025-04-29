// src/App.js
import React, { useRef, useState, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import UntranslatedCodeViewer from './UntranslatedCodeViewer';
import TranslatedCodeViewer from './TranslatedCodeViewer';
import Header from './components/Header';
import Split from 'react-split';
import '../src/App.css';

function App() {
  const terminalRef = useRef(null);
  const logToTerminal = (msg) => {
    if (terminalRef.current) {
      terminalRef.current.writeln(msg);
    }
  };

  const [refreshUntranslatedTrigger, setRefreshUntranslatedTrigger] = useState(0);
  const [refreshTranslatedTrigger, setRefreshTranslatedTrigger] = useState(0);

  const [selectedFileLeft, setSelectedFileLeft] = useState('');
  const [selectedFileRight, setSelectedFileRight] = useState('');
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideFileName, setOverrideFileName] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Обновление списка после загрузки
  const handleUploadSuccess = () => {
    setRefreshUntranslatedTrigger(prev => prev + 1);
  };

  // --- Выбор файла справа
  const handleSelectFileRight = (fname) => {
    setSelectedFileRight(fname);
    setOverrideCode('');
    setOverrideFileName('');
    logToTerminal(`Выбран справа: ${fname}`);
  };

  // --- Процесс интерпретации
  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }

    setIsTranslating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 5 : prev));
    }, 300);

    const url = `http://localhost:9999/api/application/translate_code_file?file_name=${encodeURIComponent(selectedFileLeft)}`;
    logToTerminal(`Запрос на интерпретацию: ${selectedFileLeft}`);

    fetch(url, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.translated_code) {
          logToTerminal(`Интерпретация завершена, длина = ${data.translated_code.length}`);
          setOverrideCode(data.translated_code);

          const baseName = selectedFileLeft.replace(/\.[^.]+$/, '');
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const hh = String(now.getHours()).padStart(2, '0');
          const min = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          const newName = `${baseName} (${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}).py`;

          setOverrideFileName(newName);
          setSelectedFileRight('');
        } else {
          logToTerminal('Не удалось получить "translated_code" из ответа.');
        }
      })
      .catch((err) => {
        logToTerminal(`Ошибка при интерпретации: ${err.message}`);
      })
      .finally(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => setIsTranslating(false), 500);
      });
  };

  return (
    <div className="App">
      {/* Модальное окно прогресса */}
      {isTranslating && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '25px 30px',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            minWidth: '350px',
            textAlign: 'center'
          }}>
            <div style={{
              marginBottom: '20px',
              fontFamily: 'Proxima Nova, sans-serif',
              fontSize: '18px',
              fontWeight: 'Semibold',
              color: '#rgb(36, 36, 41),'
            }}>
              Идёт интерпретация...
            </div>

            {/* Прогрессбар */}
            <div style={{
              backgroundColor: '#ddd',
              borderRadius: '5px',
              overflow: 'hidden',
              height: '18px',
              position: 'relative'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `
                  linear-gradient(
                    270deg,
                    rgb(168, 192, 213),
                    rgb(108, 137, 154),
                    rgb(114, 146, 191),
                    rgb(124, 158, 192),
                    rgb(168, 192, 213)
                  )
                `,
                backgroundSize: '400% 400%',
                animation: 'waveAnimation 8s ease infinite',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Ключевые кадры анимации плавной волны */}
            <style>
              {`
                @keyframes waveAnimation {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}
            </style>

          </div>
        </div>
      )}


      {/* Основной интерфейс */}
      <Header />
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
          < button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="btn-translate"
          >
            {isTranslating ? 'Интерпретируем...' : 'Интерпретировать'}
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

        {/* Терминал
        <div style={{ marginTop: '10px' }}>
          <div className='terminal-container'>
            <TerminalWindow terminalRef={terminalRef} />
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default App;
