// src/UntranslatedCodeViewer.jsx
import React, { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Drawer, message } from 'antd';
import { FaSave, FaExpandArrowsAlt, FaListUl, FaChevronRight } from 'react-icons/fa';
import FileList from './FileList';
import FileUploader from './FileUploader';
import './Uiverse.css';

export default function UntranslatedCodeViewer({
  fileName,
  logToTerminal,
  onSaveSuccess,
  onSelectFile,
  userEmail
}) {
  const [code, setCode] = useState('');
  const [editedFileName, setEditedFileName] = useState(fileName || 'Новый скрипт.txt');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  const [isUploaderVisible, setIsUploaderVisible] = useState(true);
  const [msgApi, contextHolder] = message.useMessage();

  const ensureTxtExtension = (name) => name.endsWith('.txt') ? name : `${name}.txt`;

  const cleanFileName = (name) =>
    name
      .replace(/^Имя\s?\d*\s?файл[а-я]*\s*-\s*/i, '')
      .replace(/ - [^()]+ \([^)]+\)(?=\.txt$)/, '');

  useEffect(() => {
    if (!fileName) {
      setCode('// Откройте файл из меню слева, чтобы начать работу.');
      setEditedFileName('Новый скрипт.txt');
      return;
    }

    const finalName = ensureTxtExtension(fileName);
    const encoded = encodeURIComponent(finalName);

    console.log('📥 Загружаем файл:', finalName);

    fetch(`http://localhost:9999/api/application/get_untranslated_script_content?file_name=${encoded}`, {
      credentials: 'include'
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Ошибка загрузки скрипта:', res.status, text);
          throw new Error(`Ошибка загрузки скрипта: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setCode(data.content || '// ⚠️ Файл пуст или повреждён.'))
      .catch(err => {
        console.error('❌ Ошибка при загрузке скрипта:', err.message);
        setCode('// ⚠️ Не удалось загрузить скрипт.\n// Откройте нужный файл в архиве слева.');
      });

    setEditedFileName(finalName);
  }, [fileName]);

  const handleSave = () => {
    const safeFileName = ensureTxtExtension(editedFileName);

    if (!safeFileName.trim()) {
      logToTerminal?.('Нет имени для сохранения.');
      return;
    }
    if (!code.trim()) {
      logToTerminal?.('Нельзя сохранить пустой скрипт.');
      return;
    }

    logToTerminal?.(`Сохраняем: ${safeFileName}`);

    fetch('http://localhost:9999/api/application/update_untranslated_script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file_name: safeFileName, content: code })
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(() => {
        msgApi.success({ content: `"${safeFileName}" сохранён.`, duration: 3 });
        logToTerminal?.(`Файл "${safeFileName}" сохранён. Откройте его в боковом меню для просмотра.`);
        onSaveSuccess?.();
        onSelectFile?.(safeFileName);
        setRefreshList(r => r + 1);
      })
      .catch(e => {
        msgApi.error({ content: 'Ошибка при сохранении скрипта.', duration: 4 });
        logToTerminal?.(`Ошибка при сохранении: ${e}`);
      });
  };

  const fileHeaderStyle = {
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'text',
    fontWeight: 'bold',
    fontFamily: '"Proxima Nova", sans-serif',
    fontSize: 14,
    color: '#000'
  };

  return (
    <>
      {contextHolder}
      <div style={{
        position: isFullscreen ? 'absolute' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        background: '#1e1e1e',
        overflow: 'hidden',
        zIndex: isFullscreen ? 10 : 'auto'
      }}>
        <div style={{
          background: '#f0f0f0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ddd'
        }}>
          {isEditingName ? (
            <input
              autoFocus
              value={editedFileName}
              onChange={e => setEditedFileName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              style={{
                ...fileHeaderStyle,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #222'
              }}
            />
          ) : (
            <span
              title={editedFileName}
              onClick={() => setIsEditingName(true)}
              style={fileHeaderStyle}
            >
              {cleanFileName(editedFileName)}
            </span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setDrawerVisible(true)} title="Архив" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaListUl />
            </button>
            <button onClick={handleSave} title="Сохранить" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaSave />
            </button>
            <button onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'В окно' : 'Во весь экран'} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaExpandArrowsAlt />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language="pascal"
            theme="vs"
            value={code}
            onChange={v => setCode(v || '')}
            options={{
              fontSize: 14,
              fontFamily: '"Proxima Nova", sans-serif',
              fontWeight: 'normal',
              fontLigatures: false
            }}
          />
        </div>

        <Drawer
          title="Архив непереведённых скриптов"
          placement="left"
          closable
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={750}
        >
          <div
            className="upload-toggle"
            onClick={() => setIsUploaderVisible(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <FaChevronRight style={{
              transform: isUploaderVisible ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }} />
            {isUploaderVisible ? 'Свернуть меню загрузки' : 'Развернуть меню загрузки'}
          </div>

          {isUploaderVisible && (
            <FileUploader
              logToTerminal={logToTerminal}
              onUploadSuccess={(uploadedName) => {
                const safeName = ensureTxtExtension(uploadedName);
                onSelectFile(safeName);
                setRefreshList(r => r + 1);
              }}
              userEmail={userEmail}
            />
          )}

          <hr style={{ margin: '16px 0', borderTop: '1px solid #ccc' }} />

          <FileList
            bucketName="scripts-untranslated"
            mode="untranslated"
            refreshTrigger={refreshList}
            onSelectFile={fname => {
              const safeName = ensureTxtExtension(fname);
              onSelectFile(safeName);
              setDrawerVisible(false);
            }}
            onDeleteSuccess={() => setRefreshList(r => r + 1)}
            logToTerminal={logToTerminal}
          />
        </Drawer>
      </div>
    </>
  );
}