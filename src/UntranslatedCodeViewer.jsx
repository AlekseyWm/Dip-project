// src/UntranslatedCodeViewer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { FaSave, FaExpandArrowsAlt, FaListUl, FaChevronDown } from 'react-icons/fa';
import { Drawer } from 'antd';
import FileList from './FileList';
import './Uiverse.css';

function UntranslatedCodeViewer({
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
  const [refreshFileListTrigger, setRefreshFileListTrigger] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadPanelCollapsed, setIsUploadPanelCollapsed] = useState(false); // <--- новое состояние

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!fileName) { setCode(''); return; }
    fetch(`http://localhost:9999/api/application/get_untranslated_script_content?file_name=${encodeURIComponent(fileName)}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setCode(data.content || 'Ошибка: нет поля content'))
      .catch(() => setCode('Ошибка при загрузке скрипта'));
  }, [fileName]);

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
      credentials: 'include',
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
      method: 'POST', credentials: 'include', body: fd
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        logToTerminal?.(data.message || 'Успешно!');
        setSelectedFile(null);
        setRefreshFileListTrigger(n => n + 1);
        onSaveSuccess?.();
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
            <FaListUl />
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

      <Editor
        height={isFullscreen ? 'calc(100vh - 40px)' : 400}
        language="pascal"
        theme="vs"
        value={code}
        onChange={v => setCode(v || '')}
        options={{ fontSize: 14 }}
      />

      <Drawer
        title="Выберите файл для загрузки (.txt)"
        placement="left"
        closable
        onClose={closeDrawer}
        open={drawerVisible}
        width={600}
      >
        {/* Кнопка сворачивания */}
        <button
          onClick={() => setIsUploadPanelCollapsed(!isUploadPanelCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#1890ff',
            cursor: 'pointer',
            marginLeft: -5,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.3s ease'
          }}
        >
          <FaChevronDown
            size={14}
            style={{
              transition: 'transform 0.3s ease',
              transform: isUploadPanelCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
            }}
          />
          {isUploadPanelCollapsed ? 'Развернуть меню загрузки' : 'Свернуть меню загрузки'}
        </button>

        {/* Форма загрузки, если не свернуто */}
        {!isUploadPanelCollapsed && (
          <>
          <form onSubmit={handleUpload} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            maxWidth: 600,
            width: '100%',
            marginBottom: 10
          }}>
            {/* Кнопка выбора файла */}
            <button
              type="button"
              className="uiverse-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.4em 1.4em',
                fontSize: 14,
                height: '38px',
                minWidth: 110
              }}
            >
              <a href="#"><span>ВЫБРАТЬ</span></a>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </button>

            {/* Название выбранного файла */}
            <span
              title={selectedFile ? selectedFile.name : 'Файл не выбран'}
              style={{
                display: 'block',
                maxWidth: 150,
                fontFamily: 'Proxima Nova, sans-serif',
                fontSize: 14,
                color: '#555',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'right'
              }}
            >
              {selectedFile
                ? selectedFile.name.length > 30
                  ? `${selectedFile.name.slice(0, 27)}…`
                  : selectedFile.name
                : 'Файл не выбран'}
            </span>

            {/* Кнопка загрузки */}
            <button
              type="submit"
              className="uiverse-btn"
              disabled={isUploading}
              style={{
                padding: '0.4em 1.4em',
                fontSize: 14,
                height: '38px',
                minWidth: 110
              }}
            >
              <a href="#"><span>ЗАГРУЗИТЬ</span></a>
            </button>
          </form>
          </>
        )}
        <hr style={{ margin: '20px 0', borderTop: '1px solid #ccc' }} />

        {/* Список файлов — всегда виден */}
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
