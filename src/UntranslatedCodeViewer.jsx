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
        paddingRight: isFullscreen ? '10px' : '0px',
        paddingLeft: isFullscreen ? '10px' : '0px',
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
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingName(false);
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
              color: '#fff'
            }}
          >
            {editedFileName}
          </span>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={openDrawer} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>
            <FaFolderOpen />
          </button>
          <button onClick={handleSaveEditedScript} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <FaSave />
          </button>
          <button onClick={() => setIsFullscreen(prev => !prev)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <FaExpandArrowsAlt />
          </button>
        </div>
      </div>

      <Editor
        height={isFullscreen ? 'calc(100vh - 40px)' : '400px'}
        language="pascal"
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{ fontSize: 14 }}
      />

      <Drawer
        title="Загрузка скрипта и список файлов"
        placement="left"
        closable={true}
        onClose={closeDrawer}
        open={drawerVisible}
        width={400}
      >
        {/* Форма для загрузки файла */}
        <form
          onSubmit={handleUpload}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '10px' }}
        >
          <label style={{
            border: '1px solid #198754',
            color: '#198754',
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Proxima Nova, sans-serif',
          }}>
            Выберите файл
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ fontFamily: 'Proxima Nova, sans-serif', fontSize: '14px' }}>
            {selectedFile ? selectedFile.name : 'Файл не выбран'}
          </span>
          <button
            type="submit"
            disabled={isUploading}
            style={{
              border: '1px solid #198754',
              color: '#198754',
              backgroundColor: 'transparent',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Proxima Nova, sans-serif',
            }}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>

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
