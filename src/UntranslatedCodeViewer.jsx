// src/UntranslatedCodeViewer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaSave, FaExpandArrowsAlt, FaFolderOpen } from 'react-icons/fa';
import { Drawer } from 'antd';
import FileList from './FileList';
import './Uiverse.css'; // <-- наш новый CSS

function UntranslatedCodeViewer({
  fileName,
  logToTerminal,
  onSaveSuccess,
  onSelectFile
}) {
  const [code, setCode] = useState('');
  const [editedFileName, setEditedFileName] = useState(fileName || 'Новый скрипт.txt');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshFileListTrigger, setRefreshFileListTrigger] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // загрузка контента
  useEffect(() => {
    if (!fileName) { setCode(''); return; }
    fetch(`http://localhost:9999/api/application/get_untranslated_script_content?file_name=${encodeURIComponent(fileName)}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setCode(data.content || 'Ошибка: нет поля content'))
      .catch(() => setCode('Ошибка при загрузке скрипта'));
  }, [fileName]);

  // синхронизация имени
  useEffect(() => {
    setEditedFileName(fileName || 'Новый скрипт.txt');
  }, [fileName]);

  const openDrawer = () => {
    setRefreshFileListTrigger(n => n + 1);
    setDrawerVisible(true);
  };
  const closeDrawer = () => setDrawerVisible(false);

  const handleSelectFile = fname => {
    onSelectFile?.(fname);
    closeDrawer();
  };

  const handleSave = () => {
    if (!editedFileName.trim()) return logToTerminal?.('Нет имени для сохранения.');
    if (!code.trim()) return logToTerminal?.('Нельзя сохранить пустой скрипт.');
    logToTerminal?.(`Сохраняем: ${editedFileName}`);
    fetch(`http://localhost:9999/api/application/update_untranslated_script?file_name=${encodeURIComponent(editedFileName)}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ file_name: editedFileName, content: code })
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        logToTerminal?.(data.message || 'Сохранено!');
        onSaveSuccess?.();
      })
      .catch(err => logToTerminal?.(`Ошибка при сохранении: ${err}`));
  };

  const handleFileChange = e => {
    if (e.target.files?.length) setSelectedFile(e.target.files[0]);
  };

  const handleUpload = e => {
    e.preventDefault();
    if (!selectedFile) return logToTerminal?.('Выберите файл перед загрузкой.');
    setIsUploading(true);
    logToTerminal?.(`Загружаем файл: ${selectedFile.name}`);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fetch('http://localhost:9999/api/application/upload_script', {
      method: 'POST', body: fd
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        logToTerminal?.(data.message || 'Успешно!');
        setSelectedFile(null);
        setRefreshFileListTrigger(n => n + 1);
      })
      .catch(err => logToTerminal?.(`Ошибка загрузки: ${err}`))
      .finally(() => setIsUploading(false));
  };

  return (
    <div style={{
      position: isFullscreen ? 'absolute' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      width: isFullscreen ? '100vw' : '100%',
      height: isFullscreen ? '100vh' : 'auto',
      zIndex: isFullscreen ? 10 : 'auto',
      backgroundColor: '#1e1e1e',
      border: '1px solid #ccc',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {/* Верхняя панель */}
      <div style={{
        backgroundColor: '#f0f0f0',
        color: '#222',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'monospace',
        fontSize: 14
      }}>
        {isEditingName
          ? <input
              autoFocus
              value={editedFileName}
              onChange={e => setEditedFileName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key==='Enter' && setIsEditingName(false)}
              style={{
                fontSize: 14, background: 'transparent',
                border: 'none', borderBottom: '1px solid #222',
                width: '100%', color: '#222', fontFamily: 'monospace'
              }}
            />
          : <span
              title={editedFileName}
              onClick={() => setIsEditingName(true)}
              style={{
                maxWidth: 200,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                cursor: 'text',
                fontWeight: 'bold'
              }}
            >
              {editedFileName}
            </span>
        }

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openDrawer} title="Архив непереведённых скриптов" style={{ background:'none', border:'none', cursor:'pointer' }}>
            <FaFolderOpen />
          </button>
          <button onClick={handleSave} title="Сохранить" style={{ background:'none', border:'none', cursor:'pointer' }}>
            <FaSave />
          </button>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? 'В окно' : 'На весь экран'}
            style={{ background:'none', border:'none', cursor:'pointer' }}
          >
            <FaExpandArrowsAlt />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height={isFullscreen ? 'calc(100vh - 40px)' : 400}
        language="pascal"
        theme="vs"
        value={code}
        onChange={v => setCode(v || '')}
        options={{ fontSize: 14 }}
      />

      {/* Drawer с формой */}
      <Drawer
        title="Выберите файл для загрузки (.txt)"
        placement="left"
        closable
        onClose={closeDrawer}
        open={drawerVisible}
        width={500}
      >
        <form onSubmit={handleUpload} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Кнопка «Выберите файл» */}
          <button
            type="button"
            className="uiverse-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <a href="#"><span>Выберите файл</span></a>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </button>

          {/* Отображение имени выбранного файла */}
          <span style={{
            fontFamily: 'Proxima Nova, sans-serif',
            fontSize: 14,
            textAlign: 'center',
            color: '#555',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {selectedFile
              ? selectedFile.name.length > 30
                ? `${selectedFile.name.slice(0,27)}…`
                : selectedFile.name
              : 'Файл не выбран'}
          </span>

          {/* Кнопка «Загрузить» */}
          <button
            type="submit"
            className="uiverse-btn"
            disabled={isUploading}
          >
            <a href="#"><span>{isUploading ? 'Загрузка…' : 'Загрузить'}</span></a>
          </button>
        </form>

        <hr style={{ margin: '20px 0', borderTop: '1px solid #ccc' }} />

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
