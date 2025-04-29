import React, { useEffect, useState } from 'react';
import { FaRegFileAlt } from 'react-icons/fa'; // Добавляем иконку файла

function FileList({ bucketName, refreshTrigger = 0, onSelectFile }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const url = `http://localhost:9999/api/application/list_files?bucket_name=${bucketName}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.files)) {
          setFiles(data.files);
        } else {
          console.error('Неподходящий формат данных:', data);
        }
      })
      .catch((error) => {
        console.error(`Ошибка при загрузке списка файлов (${bucketName}):`, error);
      });
  }, [bucketName, refreshTrigger]);  

  return (
    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
      {files.map((fileName) => (
        <li
          key={fileName}
          style={{
            cursor: 'pointer',
            marginBottom: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            transition: 'background-color 0.3s ease',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            fontFamily: 'Proxima Nova, sans-serif',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={() => onSelectFile(fileName)}
          title={fileName}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f4ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FaRegFileAlt style={{ color: '#555', flexShrink: 0 }} /> {/* Иконка файла */}
          {fileName.length > 50
            ? fileName.slice(0, 47) + '...'
            : fileName}
        </li>
      ))}
    </ul>
  );
}

export default FileList;
