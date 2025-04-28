// src/App.js
import React, { useRef, useState } from 'react';
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

  // Триггеры
  const [refreshUntranslatedTrigger, setRefreshUntranslatedTrigger] = useState(0);
  const [refreshTranslatedTrigger, setRefreshTranslatedTrigger] = useState(0);

  // Выбор файлов
  const [selectedFileLeft, setSelectedFileLeft] = useState('');
  const [selectedFileRight, setSelectedFileRight] = useState('');

  // Содержимое для правого окна
  const [overrideCode, setOverrideCode] = useState('');
  // Новое имя (с датой) для правого файла
  const [overrideFileName, setOverrideFileName] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);

  // --- Обновление списков
  const handleUploadSuccess = () => {
    setRefreshUntranslatedTrigger((prev) => prev + 1);
  };

  // --- Выбор файла справа
  const handleSelectFileRight = (fname) => {
    setSelectedFileRight(fname);
    // Сбрасываем override (код + имя)
    setOverrideCode('');
    setOverrideFileName('');
    logToTerminal(`Выбран справа: ${fname}`);
  };

  // --- Интерпретация
  const handleTranslate = () => {
    if (!selectedFileLeft) {
      logToTerminal('Не выбран файл слева для интерпретации.');
      return;
    }
    setIsTranslating(true);

    const url = `http://localhost:9999/api/application/translate_code_file?file_name=${encodeURIComponent(selectedFileLeft)}`;
    logToTerminal(`Запрос на интерпретацию: ${selectedFileLeft}`);

    fetch(url, { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка HTTP: ${res.status}`);
        }
        return res.json(); // { translated_code: "..."}
      })
      .then((data) => {
        if (data && data.translated_code) {
          logToTerminal(`Интерпретация завершена, длина = ${data.translated_code.length}`);
          setOverrideCode(data.translated_code);

          // Формируем имя на основе "Пример 2.txt" -> "Пример 2"
          // Убираем расширение:
          const baseName = selectedFileLeft.replace(/\.[^.]+$/, '');
          // Текущая дата/время
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const hh = String(now.getHours()).padStart(2, '0');
          const min = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          // Формируем "Пример 2 (2025-03-26 10:15:00).py"
          const newName = `${baseName} (${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}).py`;

          setOverrideFileName(newName);

          // Сбрасываем выбранный справа файл (т.к. теперь override)
          setSelectedFileRight('');
        } else {
          logToTerminal('Не удалось получить "translated_code" из ответа.');
        }
      })
      .catch((err) => {
        logToTerminal(`Ошибка при интерпретации: ${err.message}`);
      })
      .finally(() => setIsTranslating(false));
  };

  return (
    <div className="App">
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

            <div style={{ display: 'flex', alignItems: 'center', jastifyContent: 'center' , gap: '10px' }}>
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

        {/* Два списка */}
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

        {/* Два редактора */}
        <div style={{ height: '500px', marginTop: '10px' }}>
        <Split
          className="split"
          sizes={[50, 50]}
          minSize={200}
          direction="horizontal"
          style={{ height: '500px', display: 'flex' }}
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
        <TerminalWindow terminalRef={terminalRef} />
      </div>
    </div>
  );
}

export default App;
