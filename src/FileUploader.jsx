import React, { useState } from 'react';

function FileUploader({ logToTerminal, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      logToTerminal && logToTerminal('Выберите файл перед загрузкой.');
      return;
    }

    setIsUploading(true);
    logToTerminal && logToTerminal(`Начинается загрузка файла: ${selectedFile.name}`);

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://localhost:9999/api/application/upload_script', {
      method: 'POST',
      body: formData
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        logToTerminal && logToTerminal(data.message || 'Файл успешно загружен!');
        onUploadSuccess && onUploadSuccess();
        setSelectedFile(null); // сброс
      })
      .catch((error) => {
        logToTerminal && logToTerminal(`Ошибка при загрузке файла: ${error.message}`);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <form
      onSubmit={handleUpload}
      style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
    >
      <label
        style={{
          minWidth: '100px',
          height: '21px',
          border: '1px solid #198754',
          color: '#198754',
          backgroundColor: 'transparent',
          padding: '6px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'Proxima Nova, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        Выберите файл
        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>
      <span style={{ fontFamily: 'Proxima Nova, sans-serif', fontSize: '14px' }}>
        {selectedFile ? selectedFile.name : 'Файл не выбран'}
      </span>
      <button
        type="submit"
        disabled={isUploading}
        style={{
          minWidth: '120px',
          height: '35px',
          border: '1px solid #198754',
          color: '#198754',
          backgroundColor: 'transparent',
          padding: '6px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'Proxima Nova, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
        }}
      >
        {isUploading ? 'Загрузка...' : 'Загрузить'}
      </button>
    </form>
  );
}

export default FileUploader;
