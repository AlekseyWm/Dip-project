// src/App.js
import React, { useRef, useState, useEffect } from 'react';
import TerminalWindow from './TerminalWindow';
import FileUploader from './FileUploader';
import FileList from './FileList';
import UntranslatedCodeViewer from './UntranslatedCodeViewer';
import TranslatedCodeViewer from './TranslatedCodeViewer';
import Header from './components/Header';
import Split from 'react-split';

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

  // Обновление списков после загрузки
  const handleUploadSuccess = () => {
    setRefreshUntranslatedTrigger(prev => prev + 1);
  };

  // Выбор файла справа
  const handleSelectFileRight = (fname) => {
    setSelectedFileRight(fname);
    setOverrideCode('');
    setOverrideFileName('');
    logToTerminal(`Выбран справа: ${fname}`);
  };

  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }

    setIsTranslating(true);
    setProgress(0);

    const interval = setInterval(() => {
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
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setIsTranslating(false);
        }, 500);
      });
  };

  return (
    <div className="App">
      {/* Модалка загрузки */}
      {isTranslating && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px 40px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            minWidth: '300px',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: '#ddd',
              borderRadius: '10px',
              overflow: 'hidden',
              height: '16px',
              marginBottom: '20px',
            }}>
             <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `repeating-linear-gradient(
                  45deg,
                rgb(168, 213, 194),
                rgb(168, 213, 199) 10px,
                rgb(127, 199, 192) 10px,
                rgb(135, 204, 202) 20px
                )`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              fontFamily: 'Proxima Nova, sans-serif',
              fontSize: '16px',
              color: '#444'
            }}>
              Идёт интерпретация...
            </div>
          </div>
        </div>
      )}

      {/* Основной интерфейс */}
      <Header />
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '15px 20px',
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
            <FileUploader
              logToTerminal={logToTerminal}
              onUploadSuccess={handleUploadSuccess}
            />
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              style={{
                padding: '10px 15px',
                backgroundColor: '#0055a4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {isTranslating ? 'Интерпретируем...' : 'Интерпретировать'}
            </button>
          </div>
        </div>

        {/* Списки файлов */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2>Список (scripts-untranslated)</h2>
            <FileList
              bucketName="scripts-untranslated"
              refreshTrigger={refreshUntranslatedTrigger}
              onSelectFile={(fname) => {
                setSelectedFileLeft(fname);
                logToTerminal(`Выбран слева: ${fname}`);
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h2>Список (scripts-translated)</h2>
            <FileList
              bucketName="scripts-translated"
              refreshTrigger={refreshTranslatedTrigger}
              onSelectFile={handleSelectFileRight}
            />
          </div>
        </div>

        {/* Окна редакторов */}
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
              />
            </div>
            <div style={{ height: '100%' }}>
              <TranslatedCodeViewer
                fileName={selectedFileRight}
                overrideCode={overrideCode}
                overrideFileName={overrideFileName}
                logToTerminal={logToTerminal}
                onSaveSuccess={() => setRefreshTranslatedTrigger(prev => prev + 1)}
              />
            </div>
          </Split>
        </div>

        {/* Терминал */}
        <div style={{ marginTop: '10px' }}>
          <TerminalWindow terminalRef={terminalRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
