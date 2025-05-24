import React, { useEffect, useState, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import { FaSave, FaExpandArrowsAlt, FaListUl } from 'react-icons/fa';
import { Drawer, message } from 'antd';
import FileList from './FileList';

export default function TranslatedCodeViewer({
  fileName,
  overrideCode,
  overrideFileName,
  logToTerminal,
  onSaveSuccess,
  onSelectFile
}) {
  const [code, setCode] = useState('');
  const [editedFileName, setName] = useState('');
  const [isEditingName, setEditing] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [drawerVisible, setDrawer] = useState(false);
  const [refreshTrigger, setRefresh] = useState(0);
  const [msgApi, contextHolder] = message.useMessage();

  const editorRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ensurePyExtension = (name) => name.endsWith('.py') ? name : `${name}.py`;

  const cleanFileName = (name) =>
    name
      .replace(/^Имя\s?\d*\s?файл[а-я]*\s*-\s*/i, '')
      .replace(/ - [^()]+ \([^)]+\)(?=\.py$)/, '');

  useEffect(() => {
    if (overrideCode) {
      const name = ensurePyExtension(overrideFileName || 'Новый файл.py');
      setName(name);
      setCode(overrideCode);
      return;
    }
    if (!fileName) {
      setName('Переведённый скрипт.py');
      setCode('');
      return;
    }

    fetch(`http://localhost:9999/api/application/get_translated_script_content?file_name=${encodeURIComponent(fileName)}`, {
      credentials: 'include'
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        setName(fileName);
        setCode(d.content || 'Нет поля content');
      })
      .catch(() => setCode('// Ошибка при загрузке скрипта'));
  }, [fileName, overrideCode, overrideFileName]);

  const parseErrorLine = (message) => {
    const match = message.match(/line (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleSave = () => {
    if (!code.trim()) return logToTerminal('Пустой скрипт нельзя сохранить.');
    if (!editedFileName.trim()) return logToTerminal('Нет имени файла.');

    logToTerminal(`Сохраняем .py: ${editedFileName}`);

    fetch('http://localhost:9999/api/application/update_translated_script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file_name: editedFileName, code })
    })
      .then(r => r.ok ? r.json() : r.text().then(text => Promise.reject(text)))
      .then(() => {
        msgApi.destroy();
        msgApi.success({ content: `"${editedFileName}" сохранён.`, duration: 2 });
        logToTerminal?.(`Файл "${editedFileName}" сохранён. Откройте его в архиве справа.`);
        onSaveSuccess();
      })
      .catch(e => {
        logToTerminal(`Ошибка сохранения: ${e}`);
        msgApi.open({ type: 'error', content: 'Ошибка при сохранении', duration: 4 });

        const line = parseErrorLine(e);
        if (line) {
          logToTerminal(`Ошибка в строке ${line}`);
        }
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
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        zIndex: isFullscreen ? 10 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        background: '#1e1e1e',
        overflow: 'hidden'
      }}>
        {/* Шапка */}
        <div style={{
          background: '#f0f0f0', color: '#222',
          padding: '8px 12px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #ddd'
        }}>
          {isEditingName ? (
            <input
              autoFocus
              value={editedFileName}
              onChange={e => setName(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={e => e.key === 'Enter' && setEditing(false)}
              style={{
                ...fileHeaderStyle,
                background: 'transparent', border: 'none',
                borderBottom: '1px solid #222'
              }}
            />
          ) : (
            <span
              onClick={() => setEditing(true)}
              title={editedFileName}
              style={fileHeaderStyle}
            >
              {cleanFileName(editedFileName) || 'Переведённый скрипт.py'}
            </span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setRefresh(r => r + 1); setDrawer(true); }} style={{ border: 'none', background: 'none' }}>
              <FaListUl />
            </button>
            <button onClick={handleSave} style={{ border: 'none', background: 'none' }}>
              <FaSave />
            </button>
            <button
              onClick={() =>
                setFullscreen(f => {
                  const next = !f;
                  requestAnimationFrame(() => {
                    editorRef.current?.layout();
                  });
                  return next;
                })
              }
              style={{ border: 'none', background: 'none' }}
            >
              <FaExpandArrowsAlt />
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language="python"
            theme="vs"
            value={code}
            onChange={v => setCode(v || '')}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            options={{
              fontSize: 14,
              fontFamily: '"Proxima Nova", sans-serif',
              fontWeight: 'normal',
              fontLigatures: false,
              glyphMargin: true
            }}
          />
        </div>

        {/* Боковое меню */}
        <Drawer
          title="Архив переведённых скриптов"
          placement="right"
          closable
          onClose={() => setDrawer(false)}
          open={drawerVisible}
          width={750}
        >
          <FileList
            bucketName="scripts-translated"
            mode="translated"
            refreshTrigger={refreshTrigger}
            currentFileName={fileName}
            onSelectFile={fname => {
              onSelectFile(fname);
              setDrawer(false);
            }}
            onDeleteSuccess={() => setRefresh(r => r + 1)}
            logToTerminal={logToTerminal}
          />
        </Drawer>
      </div>
    </>
  );
}
