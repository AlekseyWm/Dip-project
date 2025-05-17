import React, { useEffect, useState } from 'react';
import { FaDownload, FaTrash } from 'react-icons/fa';
import { message, Input, Modal, Pagination } from 'antd';

const ITEMS_PER_PAGE = 10;

function FileList({
  bucketName,
  onSelectFile,
  refreshTrigger = 0,
  onDeleteSuccess,
  logToTerminal,
  mode = 'translated',
  currentFileName = '',
  drawerVisible = false
}) {
  const [files, setFiles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, [refreshTrigger, drawerVisible]);

  const parseFileInfo = (filename) => {
    const match = filename.match(/^(.*?) - ([^(]+) \(([^)]+)\)\.(py|txt)$/);
    if (match) {
      return {
        title: match[1].trim(),
        user: match[2].trim(),
        date: match[3].trim()
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
    const endpoint = mode === 'translated' ? 'download_translated_script' : 'download_untranslated_script';
    fetch(`http://localhost:9999/api/application/${endpoint}?file_name=${encodeURIComponent(fileName)}`, {
      credentials: 'include'
    })
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
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
    if (fileName === currentFileName) {
      Modal.warning({
        title: 'Нельзя удалить файл',
        content: 'Файл в данный момент открыт в редакторе. Закройте его перед удалением.',
        okText: 'Понятно'
      });
      return;
    }

    if (!window.confirm(`Удалить "${fileName}"?`)) return;

    const endpoint = mode === 'translated' ? 'delete_translated_script' : 'delete_untranslated_script';
    fetch(`http://localhost:9999/api/application/${endpoint}?file_name=${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(({ message: msg }) => {
        messageApi.success(`Файл "${fileName}" удалён.`);
        logToTerminal?.(msg || `Файл "${fileName}" удалён.`);
        onDeleteSuccess?.();
      })
      .catch(e => {
        messageApi.error(`Ошибка при удалении файла "${fileName}".`);
        logToTerminal?.(`Ошибка удаления: ${e}`);
      });
  };

  const filteredFiles = files.filter(f =>
    parseFileInfo(f).title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    const infoA = parseFileInfo(a);
    const infoB = parseFileInfo(b);
    const { key, direction } = sortConfig;
    if (!key) return 0;
    const valA = (infoA[key] || '').toLowerCase();
    const valB = (infoB[key] || '').toLowerCase();
    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFiles = sortedFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      {contextHolder}
      <Input
        autoFocus
        placeholder="Поиск по названию файла..."
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        style={{ marginBottom: 10 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
        <div style={{ flexGrow: 1, overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'monospace',
            fontSize: 14,
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left', cursor: 'pointer' }}>
                <th onClick={() => handleSort('title')} style={{ width: '40%', padding: '8px', borderBottom: '1px solid #ccc' }}>
                  Название {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('date')} style={{ width: '20%', padding: '8px', borderBottom: '1px solid #ccc' }}>
                  Дата {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('user')} style={{ width: '25%', padding: '8px', borderBottom: '1px solid #ccc' }}>
                  Пользователь {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ width: '15%', padding: '8px', borderBottom: '1px solid #ccc' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFiles.map((f, i) => {
                const { title, user, date } = parseFileInfo(f);
                const isCurrent = f === currentFileName;
                return (
                  <tr key={i}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td title={title} onClick={() => onSelectFile?.(f)} style={{
                      width: '40%',
                      padding: '6px 8px',
                      borderBottom: '1px solid #eee',
                      color: '#00A97F',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: 'pointer'
                    }}>
                      {title}
                    </td>
                    <td style={{ width: '20%', padding: '6px 8px', borderBottom: '1px solid #eee' }}>{date}</td>
                    <td title={user} style={{
                      width: '25%',
                      padding: '6px 8px',
                      borderBottom: '1px solid #eee',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{user}</td>
                    <td style={{ width: '15%', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(f); }} title="Скачать" style={{
                        background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', marginRight: 10
                      }}>
                        <FaDownload />
                      </button>
                      {isCurrent ? (
                        <span title="Файл открыт" style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, color: '#ccc', cursor: 'not-allowed'
                        }}>
                          <FaTrash />
                        </span>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(f); }} title="Удалить" style={{
                          background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer',
                          width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={currentPage}
            pageSize={ITEMS_PER_PAGE}
            total={sortedFiles.length}
            onChange={page => setCurrentPage(page)}
            size="small"
            showSizeChanger={false}
            className="custom-pagination"
          />
        </div>
      </div>
    </>
  );
}

export default FileList;
