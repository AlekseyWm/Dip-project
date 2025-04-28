import React, { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaUndo, FaSave, FaExpandArrowsAlt } from 'react-icons/fa'; // <-- Добавили иконку Fullscreen

function TranslatedCodeViewer({
  fileName,
  overrideCode,
  overrideFileName,
  logToTerminal,
  onSaveSuccess
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFileName, setEditedFileName] = useState('');
  const [code, setCode] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (overrideCode) {
      setCode(overrideCode);
      setCurrentFileName(overrideFileName || 'Новый файл.py');
      setEditedFileName(overrideFileName || 'Новый файл.py');
      return;
    }

    if (fileName) {
      const url = `http://localhost:9999/api/application/get_translated_script_content?file_name=${encodeURIComponent(fileName)}`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data && data.content) {
            setCode(data.content);
            setCurrentFileName(fileName);
            setEditedFileName(fileName);
          } else {
            setCode('Ошибка: не получено поле content');
          }
        })
        .catch((err) => {
          console.error('Ошибка при загрузке .py:', err);
          setCode('Ошибка при загрузке скрипта');
        });
    }
  }, [fileName, overrideCode, overrideFileName]);

  const handleSaveEdited = () => {
    if (!code.trim()) {
      logToTerminal?.('Нельзя сохранить пустой скрипт (.py).');
      return;
    }
    if (!editedFileName) {
      logToTerminal?.('Нет имени файла для сохранения.');
      return;
    }

    logToTerminal?.(`Сохраняем .py: ${editedFileName}`);

    fetch('http://localhost:9999/api/application/update_translated_script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: editedFileName, code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.message) {
          logToTerminal?.(data.message);
          onSaveSuccess?.();
        } else {
          logToTerminal?.('Не получено поле "message"');
        }
      })
      .catch((err) => {
        logToTerminal?.(`Ошибка при сохранении .py: ${err.message}`);
      });
  };

  return (
    <div
    onDoubleClick={() => setIsFullscreen(prev => !prev)}
    style={{
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      width: isFullscreen ? '100vw' : '100%',
      height: isFullscreen ? '100vh' : 'auto',
      zIndex: isFullscreen ? 9999 : 'auto',
      backgroundColor: '#1e1e1e',
      border: '1px solid #ccc',
      borderRadius: '8px',
      overflow: 'hidden',
      paddingRight: isFullscreen ? '20px' : '0px',
      paddingLeft: isFullscreen ? '20px' : '0px',
      boxSizing: 'border-box',
    }}
    >
      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#fff',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        {isEditingName ? (
          <input
            autoFocus
            value={editedFileName}
            onChange={(e) => setEditedFileName(e.target.value)}
            onBlur={() => {
              setIsEditingName(false);
              setCurrentFileName(editedFileName);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingName(false);
                setCurrentFileName(editedFileName);
              }
            }}
            style={{
              fontSize: '14px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #fff',
              color: '#fff',
              fontFamily: 'monospace',
              width: '100%',
            }}
          />
        ) : (
          <span
            title={editedFileName || 'Переведённый скрипт.py'}
            onClick={() => setIsEditingName(true)}
            style={{
              maxWidth: '200px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              cursor: 'text',
              fontWeight: 'bold',
              color: '#fff'
            }}
          >
            {editedFileName || 'Переведённый скрипт.py'}
          </span>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <FaUndo />
          </button>
          <button onClick={handleSaveEdited} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <FaSave />
          </button>
          <button onClick={() => setIsFullscreen(prev => !prev)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <FaExpandArrowsAlt />
          </button>
        </div>
      </div>
      <Editor
        height={isFullscreen ? 'calc(100vh - 40px)' : '400px'}
        language="python"
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{ fontSize: 14 }}
      />
    </div>
  );
}

export default TranslatedCodeViewer;
