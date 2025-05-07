import React, { useEffect, useState } from 'react';
import { FaDownload, FaTrash } from 'react-icons/fa';
import { message } from 'antd';

function FileList({ bucketName, onSelectFile, refreshTrigger = 0, onDeleteSuccess, logToTerminal }) {
  const [files, setFiles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch(`http://localhost:9999/api/application/list_files?bucket_name=${bucketName}`, {
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setFiles(data.files || []))
      .catch(err => {
        console.error('Ошибка при загрузке файлов:', err);
        setFiles([]);
      });
  }, [bucketName, refreshTrigger]);

  const parseFileInfo = (filename) => {
    const longPyMatch = filename.match(/^(.*?) - (.*?) \((.*?)\) - .*? \((.*?)\)\.py$/);
    if (longPyMatch) {
      return {
        title: longPyMatch[1].trim(),
        user: longPyMatch[2].trim(),
        date: longPyMatch[3].trim()
      };
    }

    const shortMatch = filename.match(/^(.*?) - (.*?) \((.*?)\)\.(txt|py)$/);
    if (shortMatch) {
      return {
        title: shortMatch[1].trim(),
        user: shortMatch[2].trim(),
        date: shortMatch[3].trim()
      };
    }

    return { title: filename, user: '', date: '' };
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const handleDownload = (fileName) => {
    fetch(`http://localhost:9999/api/application/download_translated_script?file_name=${encodeURIComponent(fileName)}`, {
      credentials: 'include'
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        messageApi.success(`Файл "${fileName}" загружен.`);
        logToTerminal?.(`Файл "${fileName}" успешно загружен.`);
      })
      .catch(e => {
        messageApi.error(`Ошибка при загрузке файла "${fileName}".`);
        logToTerminal?.(`Ошибка при загрузке: ${e}`);
      });
  };

  const handleDelete = (fileName) => {
    if (!window.confirm(`Удалить "${fileName}"?`)) return;

    fetch(`http://localhost:9999/api/application/delete_translated_script?file_name=${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(({ message: msg }) => {
        messageApi.success(`Файл "${fileName}" удалён.`);
        logToTerminal?.(msg || `Файл "${fileName}" удалён.`);
        onDeleteSuccess?.();  // обновление списка
      })
      .catch(e => {
        messageApi.error(`Ошибка при удалении "${fileName}".`);
        logToTerminal?.(`Ошибка удаления: ${e}`);
      });
  };

  const sortedFiles = [...files].sort((a, b) => {
    const infoA = parseFileInfo(a);
    const infoB = parseFileInfo(b);
    const { key, direction } = sortConfig;
    if (!key) return 0;

    const valA = (infoA[key] || '').toLowerCase();
    const valB = (infoB[key] || '').toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <>
      {contextHolder}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'monospace',
          fontSize: 14
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left', cursor: 'pointer' }}>
              <th onClick={() => handleSort('title')} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                Название {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('date')} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                Дата создания {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('user')} style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                Пользователь {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((f, i) => {
              const { title, user, date } = parseFileInfo(f);
              return (
                <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  
                  <td
                    title={title}
                    onClick={() => onSelectFile?.(f)}
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #eee',
                      color: '#00A97F',
                      maxWidth: 150,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer'
                    }}
                  >
                    {title}
                  </td>

                  <td style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid #eee'
                  }}>{date}</td>

                  <td
                    title={user}
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #eee',
                      maxWidth: 150,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user}
                  </td>

                  <td style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid #eee',
                    whiteSpace: 'nowrap'
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(f); }}
                      title="Скачать"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1890ff',
                        cursor: 'pointer',
                        marginRight: 10
                      }}
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                      title="Удалить"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff4d4f',
                        cursor: 'pointer'
                      }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default FileList;
