import React, { useEffect, useState } from 'react';

function FileList({ bucketName, onSelectFile, refreshTrigger = 0 }) {
  const [files, setFiles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
          </tr>
        </thead>
        <tbody>
          {sortedFiles.map((f, i) => {
            const { title, user, date } = parseFileInfo(f);
            return (
              <tr
                key={i}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => onSelectFile?.(f)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td
                  title={title}
                  style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid #eee',
                    color: '#00A97F',
                    maxWidth: 200,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title}
                </td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{date}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{user}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default FileList;
