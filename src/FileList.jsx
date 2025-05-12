// src/components/FileList.jsx
import React, { useEffect, useState } from "react";
import { FaDownload, FaTrash } from "react-icons/fa";
import { message } from "antd";

/**
 * props:
 *  bucketName        – имя бакета
 *  onSelectFile       коллбэк по клику
 *  refreshTrigger     число, чтобы вручную дернуть useEffect
 *  onDeleteSuccess    вызывается после удаления
 *  logToTerminal      пишет строки в терминал
 */
function FileList({
  bucketName,
  onSelectFile,
  refreshTrigger = 0,
  onDeleteSuccess,
  logToTerminal
}) {
  const [files, setFiles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [messageApi, contextHolder] = message.useMessage();

  /* ---------- загрузка списка ---------- */
  useEffect(() => {
  const url = `http://localhost:9999/api/application/list_files?bucket_name=${encodeURIComponent(bucketName)}&_=${Date.now()}`;
  fetch(url, { credentials: "include" })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => setFiles(data.files || []))
    .catch((err) => {
      console.error("Ошибка при загрузке файлов:", err);
      setFiles([]);
    });
}, [bucketName, refreshTrigger]);


  /* ---------- helpers ---------- */
  const parseFileInfo = (filename) => {
    const longPy = filename.match(
      /^(.*?) - (.*?) \((.*?)\) - .*? \((.*?)\)\.py$/
    );
    if (longPy)
      return {
        title: longPy[1].trim(),
        user: longPy[2].trim(),
        date: longPy[3].trim()
      };

    const short = filename.match(/^(.*?) - (.*?) \((.*?)\)\.(txt|py)$/);
    if (short)
      return {
        title: short[1].trim(),
        user: short[2].trim(),
        date: short[3].trim()
      };

    return { title: filename, user: "", date: "" };
  };

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));

  // true → scripts-translated / scripts-translated-2nd
  const isTranslatedBucket = bucketName.includes("translated");

  // формируем строку запроса без внешних библиотек
  const makeUrl = (endpoint, file) =>
    `http://localhost:9999/api/application/${endpoint}` +
    `?bucket_name=${encodeURIComponent(bucketName)}` +
    `&file_name=${encodeURIComponent(file)}`;

  /* ---------- download ---------- */
  const handleDownload = (fileName) => {
    const endpoint = isTranslatedBucket
      ? "download_translated_script"
      : "download_untranslated_script";

    fetch(makeUrl(endpoint, fileName), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        messageApi.success(`Файл "${fileName}" загружен.`);
        logToTerminal?.(`Файл "${fileName}" успешно загружен.`);
      })
      .catch((e) => {
        messageApi.error(`Ошибка загрузки "${fileName}" (${e.message})`);
        logToTerminal?.(`Ошибка загрузки: ${e}`);
      });
  };

  /* ---------- delete ---------- */
  const handleDelete = (fileName) => {
    if (!window.confirm(`Удалить "${fileName}"?`)) return;

    const endpoint = isTranslatedBucket
      ? "delete_translated_script"
      : "delete_untranslated_script";

    fetch(makeUrl(endpoint, fileName), {
      method: "DELETE",
      credentials: "include"
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(({ message: msg }) => {
        messageApi.success(`Файл "${fileName}" удалён.`);
        logToTerminal?.(msg || `Файл "${fileName}" удалён.`);
        onDeleteSuccess?.();
      })
      .catch((e) => {
        messageApi.error(`Ошибка удаления "${fileName}" (${e})`);
        logToTerminal?.(`Ошибка удаления: ${e}`);
      });
  };

  const sortedFiles = [...files].sort((a, b) => {
    const infoA = parseFileInfo(a);
    const infoB = parseFileInfo(b);
    const { key, direction } = sortConfig;
    if (!key) return 0;
    const valA = (infoA[key] || "").toLowerCase();
    const valB = (infoB[key] || "").toLowerCase();
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  /* ---------- render ---------- */
  return (
    <>
      {contextHolder}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "monospace",
            fontSize: 14
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f0f0f0",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <th
                onClick={() => handleSort("title")}
                style={{ padding: 8, borderBottom: "1px solid #ccc" }}
              >
                Название{" "}
                {sortConfig.key === "title"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("date")}
                style={{ padding: 8, borderBottom: "1px solid #ccc" }}
              >
                Дата{" "}
                {sortConfig.key === "date"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("user")}
                style={{ padding: 8, borderBottom: "1px solid #ccc" }}
              >
                Пользователь{" "}
                {sortConfig.key === "user"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th style={{ padding: 8, borderBottom: "1px solid #ccc" }}>
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((f, i) => {
              const { title, user, date } = parseFileInfo(f);
              return (
                <tr
                  key={i}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9f9f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td
                    title={title}
                    onClick={() => onSelectFile?.(f)}
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid #eee",
                      color: "#00A97F",
                      maxWidth: 150,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "pointer"
                    }}
                  >
                    {title}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid #eee"
                    }}
                  >
                    {date}
                  </td>
                  <td
                    title={user}
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid #eee",
                      maxWidth: 150,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {user}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      borderBottom: "1px solid #eee",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(f);
                      }}
                      title="Скачать"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1890ff",
                        cursor: "pointer",
                        marginRight: 10
                      }}
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(f);
                      }}
                      title="Удалить"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff4d4f",
                        cursor: "pointer"
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
