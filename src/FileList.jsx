// src/FileList.jsx
import React, { useEffect, useState } from 'react';

function FileList({ bucketName, refreshTrigger = 0, onSelectFile }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const url = `http://localhost:9999/api/application/list_files?bucket_name=${bucketName}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json(); // { bucket, files: [...] }
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
  // ^^^ При изменении refreshTrigger заново загружаем список

  return (
    <ul>
      {files.map((fileName) => (
        <li
          key={fileName}
          style={{ cursor: 'pointer', marginBottom: '5px' }}
          onClick={() => onSelectFile(fileName)}
        >
          {fileName}
        </li>
      ))}
    </ul>
  );
}

export default FileList;
