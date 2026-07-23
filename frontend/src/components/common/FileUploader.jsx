import { useState, useRef, useCallback } from "react";
import { formatFileSize, getFileIcon } from "../../utils/helpers";

const FileUploader = ({
  onFilesSelected,
  accept = "*",
  multiple = false,
  maxSize = 10,
  label = "Upload Files",
  hint,
  allowedFormats = [],
  disabled = false,
  value = null,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState(value ? [value] : []);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" exceeds ${maxSize}MB limit`;
    }
    if (allowedFormats.length > 0) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!allowedFormats.includes(ext)) {
        return `"${ext}" format not allowed. Use: ${allowedFormats.join(", ")}`;
      }
    }
    return null;
  };

  const processFiles = useCallback((fileList) => {
    setError("");
    const selected = multiple ? Array.from(fileList) : [fileList[0]];
    for (const file of selected) {
      const err = validateFile(file);
      if (err) { setError(err); return; }
    }
    setFiles(selected);
    onFilesSelected(multiple ? selected : selected[0]);
  }, [multiple, onFilesSelected, maxSize, allowedFormats]);

  const handleDragOver = (e) => { e.preventDefault(); if (!disabled) setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  };
  const handleChange = (e) => { if (e.target.files?.length) processFiles(e.target.files); };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onFilesSelected(multiple ? updated : null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const getExt = (name) => name.split(".").pop().toLowerCase();

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 
          ${isDragging ? "border-primary-500 bg-primary-50 scale-[1.01]" : "border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error ? "border-red-300 bg-red-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform ${isDragging ? "scale-110" : ""}`}
            style={{ background: isDragging ? "#e8eaf6" : "#f5f5f5" }}>
            {isDragging ? "📂" : "☁️"}
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">
              {isDragging ? "Drop files here!" : label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {hint || `Drag & drop or click to browse${allowedFormats.length > 0 ? ` · ${allowedFormats.join(", ").toUpperCase()}` : ""} · Max ${maxSize}MB`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span>⚠️</span>
          <p className="text-red-600 text-xs font-medium">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                {getFileIcon(getExt(file.name))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;