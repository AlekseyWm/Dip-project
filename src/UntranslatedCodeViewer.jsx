import React, { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaUndo, FaSave, FaExpandArrowsAlt, FaSyncAlt } from 'react-icons/fa';
import { Drawer, Button } from 'antd';
import { FaFolderOpen } from 'react-icons/fa';
import FileList from './FileList';

function UntranslatedCodeViewer({ fileName, logToTerminal, onSaveSuccess, onSelectFile }) {
  const [code, setCode] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFileName, setEditedFileName] = useState(fileName || 'Новый скрипт.txt');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshFileListTrigger, setRefreshFileListTrigger] = useState(0);


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
        title="Выберите файл для загрузки"
        placement="left"
        closable={true}
        onClose={closeDrawer}
        open={drawerVisible}
        width={400}
      >
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
