import React, { useState } from 'react';
import { Upload, Button } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import './Uiverse.css';

const { Dragger } = Upload;

function FileUploader({ logToTerminal, onUploadSuccess, userEmail }) {
  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleCustomRequest = ({ file, onSuccess }) => {
    // не отправляем на сервер, сохраняем в state
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleUploadClick = () => {
    const file = fileList[0];
    if (!file) {
      logToTerminal && logToTerminal('Выберите файл перед загрузкой.');
      return;
    }

    if (!userEmail) {
      logToTerminal && logToTerminal('Вы не авторизованы. Загрузка невозможна.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file.originFileObj);

    setIsUploading(true);
    logToTerminal && logToTerminal(`Начинается загрузка файла: ${file.name}`);

    fetch('http://localhost:9999/api/application/upload_script', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        logToTerminal && logToTerminal(data.message || 'Файл успешно загружен!');
        onUploadSuccess && onUploadSuccess(file.name);
        setFileList([]);
      })
      .catch((error) => {
        logToTerminal && logToTerminal(`Ошибка при загрузке файла: ${error.message}`);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <div style={{ marginBottom: '16px' }}>

      <Dragger
        accept=".txt,.py"
        multiple={false}
        showUploadList={true}
        customRequest={handleCustomRequest}
        fileList={fileList}
        onChange={({ fileList }) => setFileList(fileList.slice(-1))}
        itemRender={(originNode, file) => (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            padding: '6px 10px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px'
              }}
            >
              {file.name}
            </span>
            <Button
              icon={<UploadOutlined />}
              size="small"
              onClick={handleUploadClick}
              loading={isUploading}
              style={{
                marginLeft: 10,
                border: 'none',
                background: 'transparent',
                color: '#198754'
              }}
            />
          </div>
        )}
        style={{
          background: '#fafafa',
          borderRadius: '6px',
          padding: '12px 0'
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text" style={{ margin: 0 }}>Нажмите или перетащите файл в эту область</p>
        <p className="ant-upload-hint" style={{ fontSize: '12px', color: '#999' }}>
          Поддерживается один .txt или .py файл
        </p>
      </Dragger>
    </div>
  );
}

export default FileUploader;
