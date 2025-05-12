// src/UntranslatedCodeViewer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaSave, FaExpandArrowsAlt, FaListUl } from 'react-icons/fa';
import { Drawer, message } from 'antd';
import FileList from './FileList';
import './Uiverse.css';  // тут лежит .uiverse-btn

export default function UntranslatedCodeViewer({
  fileName,
  logToTerminal,
  onSaveSuccess,
  onSelectFile
}) {
  const [code, setCode]                     = useState('');
  const [editedFileName, setEditedFileName] = useState(fileName || 'Новый скрипт.txt');
  const [isEditingName, setIsEditingName]   = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [drawerVisible, setDrawerVisible]   = useState(false);
  const [refreshList, setRefreshList]       = useState(0);
  const [selectedFile, setSelectedFile]     = useState(null);
  const [isUploading, setIsUploading]       = useState(false);

  const fileInputRef = useRef(null);
  const [msgApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!fileName) {
      setCode('');
      setEditedFileName('Новый скрипт.txt');
      return;
    }
    fetch(
      `http://localhost:9999/api/application/get_untranslated_script_content?file_name=${encodeURIComponent(
        fileName
      )}`,
      { credentials: 'include' }
    )
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(data => setCode(data.content || 'Ошибка: нет поля content'))
      .catch(() => setCode('Ошибка при загрузке скрипта'));
    setEditedFileName(fileName);
  }, [fileName]);

  const handleSave = () => {
    if (!editedFileName.trim()) return logToTerminal('Нет имени для сохранения.');
    if (!code.trim()) return logToTerminal('Нельзя сохранить пустой скрипт.');
    logToTerminal(`Сохраняем: ${editedFileName}`);
    fetch('http://localhost:9999/api/application/update_untranslated_script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file_name: editedFileName, content: code })
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(() => {
        logToTerminal(`Файл "${editedFileName}" сохранён.`);
        msgApi.open({ type: 'success', content: `"${editedFileName}" сохранён.`, duration: 4 });
        onSaveSuccess();
      })
      .catch(e => {
        logToTerminal(`Ошибка при сохранении: ${e}`);
        msgApi.open({ type: 'error', content: 'Ошибка при сохранении скрипта.', duration: 4 });
      });
  };

  const handleUpload = e => {
    e.preventDefault();
    if (!selectedFile) return logToTerminal('Выберите файл перед загрузкой.');
    setIsUploading(true);
    logToTerminal(`Загружаем файл: ${selectedFile.name}`);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fetch('http://localhost:9999/api/application/upload_script', {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(d => {
        logToTerminal(d.message || 'Успешно!');
        setSelectedFile(null);
        setRefreshList(r => r + 1);
        onSaveSuccess();
      })
      .catch(e => logToTerminal(`Ошибка загрузки: ${e}`))
      .finally(() => setIsUploading(false));
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
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
        }}
      >
        {/* Шапка */}
        <div
          style={{
            background: '#f0f0f0',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: 14
          }}
        >
          {isEditingName ? (
            <input
              autoFocus
              value={editedFileName}
              onChange={e => setEditedFileName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              style={{
                flex: 1,
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #222',
                fontFamily: 'monospace'
              }}
            />
          ) : (
            <span
              title={editedFileName}
              onClick={() => setIsEditingName(true)}
              style={{
                flex: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                cursor: 'text',
                fontWeight: 'bold'
              }}
            >
              {editedFileName}
            </span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setDrawerVisible(true)}
              title="Архив"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FaListUl />
            </button>
            <button
              onClick={handleSave}
              title="Сохранить"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FaSave />
            </button>
            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'В окно' : 'Во весь экран'}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FaExpandArrowsAlt />
            </button>
          </div>
        </div>

        {/* Monaco-editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language="pascal"
            theme="vs"
            value={code}
            onChange={v => setCode(v || '')}
            options={{ fontSize: 14 }}
          />
        </div>

        {/* Drawer: выбор + загрузка + список */}
        <Drawer
          title="Загрузить .txt"
          placement="left"
          closable
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={650}
        >
          <form onSubmit={handleUpload}>
            <button
              type="button"
              className="uiverse-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <span>ВЫБРАТЬ</span>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={e =>
                  e.target.files?.length && setSelectedFile(e.target.files[0])
                }
              />
            </button>
            <button
              type="submit"
              className="uiverse-btn"
              disabled={isUploading}
              style={{ marginLeft: 8 }}
            >
              <span>ЗАГРУЗИТЬ</span>
            </button>
          </form>

          <hr style={{ margin: '16px 0' }} />

          <FileList
            bucketName="scripts-untranslated"
            mode="untranslated"
            refreshTrigger={refreshList}
            onSelectFile={fname => {
              onSelectFile(fname);
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
