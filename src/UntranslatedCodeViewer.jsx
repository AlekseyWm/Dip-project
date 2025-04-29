import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaSave, FaExpandArrowsAlt, FaFolderOpen } from 'react-icons/fa';
import { Drawer } from 'antd';
import FileList from './FileList';

function UntranslatedCodeViewer({ fileName, logToTerminal, onSaveSuccess, onSelectFile }) {
  const [code, setCode] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFileName, setEditedFileName] = useState(fileName || 'Новый скрипт.txt');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshFileListTrigger, setRefreshFileListTrigger] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!fileName) {
      setCode('');
      return;
    }

    const url = `http://localhost:9999/api/application/get_untranslated_script_content?file_name=${encodeURIComponent(fileName)}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.content) {
          setCode(data.content);
        } else {
          setCode('Ошибка: не получено поле content');
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке скрипта:', error);
        setCode('Ошибка при загрузке скрипта');
      });
  }, [fileName]);

  useEffect(() => {
    setEditedFileName(fileName || 'Новый скрипт.txt');
  }, [fileName]);

  const handleSaveEditedScript = () => {
    if (!editedFileName) {
      logToTerminal && logToTerminal('Нет имени для сохранения.');
      return;
    }
    if (!code.trim()) {
      logToTerminal && logToTerminal('Нельзя сохранить пустой скрипт.');
      return;
    }

    logToTerminal && logToTerminal(`Сохраняем отредактированный скрипт: ${editedFileName}`);

    const url = `http://localhost:9999/api/application/update_untranslated_script?file_name=${encodeURIComponent(editedFileName)}`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: editedFileName, content: code })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        logToTerminal && logToTerminal(data.message || 'Сохранено!');
        onSaveSuccess && onSaveSuccess();
      })
      .catch((err) => {
        logToTerminal && logToTerminal(`Ошибка при сохранении: ${err.message}`);
      });
  };

  const openDrawer = () => {
    setRefreshFileListTrigger(prev => prev + 1);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleSelectFile = (fname) => {
    onSelectFile && onSelectFile(fname);
    closeDrawer();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      logToTerminal && logToTerminal('Выберите файл перед загрузкой.');
      return;
    }

    setIsUploading(true);
    logToTerminal && logToTerminal(`Начинается загрузка файла: ${selectedFile.name}`);

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://localhost:9999/api/application/upload_script', {
      method: 'POST',
      body: formData
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        logToTerminal && logToTerminal(data.message || 'Файл успешно загружен!');
        setSelectedFile(null);
        setRefreshFileListTrigger(prev => prev + 1); // обновить список
      })
      .catch((error) => {
        logToTerminal && logToTerminal(`Ошибка при загрузке файла: ${error.message}`);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <div
      style={{
        position: isFullscreen ? 'absolute' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 10 : 'auto',
        backgroundColor: '#1e1e1e',
        border: '1px solid #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
        paddingRight: isFullscreen ? '10px' : '0px',
        paddingLeft: isFullscreen ? '10px' : '0px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        backgroundColor: '#f0f0f0',
        color: '#222',
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
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingName(false);
            }}
            style={{
              fontSize: '14px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #222',
              color: '#222',
              fontFamily: 'monospace',
              width: '100%',
            }}
          />
        ) : (
          <span
            title={editedFileName}
            onClick={() => setIsEditingName(true)}
            style={{
              maxWidth: '200px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              cursor: 'text',
              fontWeight: 'bold',
              color: '#222'
            }}
          >
            {editedFileName}
          </span>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={openDrawer}
            title="Архив непереведённых скриптов"
            style={{
              background: 'none',
              border: 'none',
              color: '#222',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            <FaFolderOpen />
          </button>

          <button
            onClick={handleSaveEditedScript}
            title="Сохранить"
            style={{
              background: 'none',
              border: 'none',
              color: '#222',
              cursor: 'pointer'
            }}
          >
            <FaSave />
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            title={isFullscreen ? 'Свернуть в окно' : 'Развернуть на весь экран'}
            style={{
              background: 'none',
              border: 'none',
              color: '#222',
              cursor: 'pointer'
            }}
          >
            <FaExpandArrowsAlt />
          </button>
        </div>
      </div>

      <Editor
        height={isFullscreen ? 'calc(100vh - 40px)' : '400px'}
        language="pascal"
        theme="vs"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{ fontSize: 14 }}
      />

      <Drawer
        title="Выберите файл для загрузки (.txt)"
        placement="left"
        closable={true}
        onClose={closeDrawer}
        open={drawerVisible}
        width={500}
      >
        {/* Форма для загрузки файла */}
        <form
          onSubmit={handleUpload}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            marginBottom: '20px',
            gap: '10px',
          }}
        >
          {/* Кнопка выбора файла */}
          <label
            style={{
              border: '2px solid #198754',
              color: '#198754',
              backgroundColor: 'transparent',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Proxima Nova, sans-serif',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center',
              width: '100%',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e6f4eb';
              e.currentTarget.style.color = '#146c43';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#198754';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#cfead8';
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#e6f4eb';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            Выберите файл
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {/* Название выбранного файла */}
          <span style={{
            fontFamily: 'Proxima Nova, sans-serif',
            fontSize: '14px',
            textAlign: 'center',
            color: '#555',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            width: '100%',
            maxWidth: '100%',
          }}>
            {selectedFile
              ? (selectedFile.name.length > 20
                ? `${selectedFile.name.slice(0, 17)}...${selectedFile.name.split('.').pop()}`
                : selectedFile.name)
              : 'Файл не выбран'}
          </span>

          {/* Кнопка загрузки */}
          <button
            type="submit"
            disabled={isUploading}
            style={{
              border: '2px solid #198754',
              color: '#198754',
              backgroundColor: 'transparent',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontFamily: 'Proxima Nova, sans-serif',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center',
              width: '100%',
              transition: 'all 0.3s ease',
              userSelect: 'none',
              pointerEvents: isUploading ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = '#e6f4eb';
                e.currentTarget.style.color = '#146c43';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#198754';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onMouseDown={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = '#cfead8';
                e.currentTarget.style.transform = 'scale(0.97)';
              }
            }}
            onMouseUp={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = '#e6f4eb';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>

        
        <hr style={{
          border: 'none',
          borderTop: '1px solid #ccc',
          margin: '20px 0'
        }} />

        {/* Список файлов */}
        <FileList
          bucketName="scripts-untranslated"
          refreshTrigger={refreshFileListTrigger}
          onSelectFile={handleSelectFile}
        />
      </Drawer>
    </div>
  );
}

export default UntranslatedCodeViewer;
