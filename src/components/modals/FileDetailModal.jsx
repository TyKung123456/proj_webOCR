import React, { useState, useEffect } from 'react';
import ApiService from '../../services/ApiService.js';
import { toast } from 'react-toastify';

// --- Icon Imports ---
import {
  Building2, Hash, BadgePercent, Calendar, X, Check, Pencil, Save,
  FileText, Info, Download, Trash2
} from 'lucide-react';


// --- EditableInfoRow Component (เหมือนเดิม) ---
const EditableInfoRow = ({ icon: Icon, label, value, fieldKey, onSave, isEditing, setEditingField, editableValue, setEditableValue }) => {
  const handleSave = () => {
    onSave(fieldKey, editableValue);
    setEditingField(null);
  };
  const handleCancel = () => {
    setEditingField(null);
  };

  return (
    <div className={`p-3 rounded-lg transition-all duration-300 border ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <Icon className="text-indigo-500 dark:text-indigo-400 mt-1 flex-shrink-0" size={20} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
            {!isEditing ? (
              <span className="font-medium text-slate-800 dark:text-slate-200 break-words">{value || <span className="text-slate-400 dark:text-slate-500">N/A</span>}</span>
            ) : (
              <input
                type="text" value={editableValue} onChange={(e) => setEditableValue(e.target.value)}
                className="mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            )}
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setEditingField(fieldKey)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
            <Pencil size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="p-2 text-green-500 hover:text-green-700 rounded-full bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900"><Check size={16} /></button>
            <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><X size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ExtractedDataPanel Component (เหมือนเดิม) ---
const ExtractedDataPanel = ({ details, onDataChange, isDirty }) => {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const handleToggleEdit = (fieldKey) => {
    setTempValue(details[fieldKey] || '');
    setEditingField(fieldKey);
  };

  const fields = [
    { key: 'extract_entity', label: 'Entity / Company', icon: Building2 },
    { key: 'extract_number_of_receipt', label: 'Receipt Number', icon: Hash },
    { key: 'extract_taxid', label: 'Tax ID', icon: BadgePercent },
    { key: 'extract_receipt', label: 'Receipt Date', icon: Calendar },
  ];

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 h-full overflow-y-auto flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b dark:border-slate-700 pb-2">✨ Extracted Information</h3>
      <div className="space-y-3 flex-grow">
        {fields.map(field => (
          <EditableInfoRow
            key={field.key} icon={field.icon} label={field.label} value={details[field.key]}
            fieldKey={field.key} isEditing={editingField === field.key} setEditingField={handleToggleEdit}
            editableValue={tempValue} setEditableValue={setTempValue} onSave={onDataChange}
          />
        ))}
      </div>
      {isDirty && <div className="mt-4 pt-4 border-t dark:border-slate-700"><p className="text-xs text-center text-amber-600 dark:text-amber-500 mb-2">You have unsaved changes.</p></div>}
    </div>
  );
};

// --- Components สำหรับหน้า Info (เหมือนเดิม) ---
const MetadataRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{label}</p>
    <p className="text-slate-800 dark:text-slate-200 break-all">{value || '-'}</p>
  </div>
);

const FileInfoPanel = ({ details }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
    <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-slate-800 dark:text-slate-200"><Info size={20} /> File Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <MetadataRow label="Original Name" value={details.original_name || details.filename} />
      <MetadataRow label="Company Name" value={details.company_name} />
      <MetadataRow label="P/N" value={details.pn_name} />
      <MetadataRow label="File Type" value={details.file_type} />
      <MetadataRow label="File Size" value={ApiService.formatFileSize(details.file_size || 0)} />
      <MetadataRow label="Uploaded At" value={new Date(details.uploaded_at).toLocaleString()} />
    </div>
  </div>
);

const OcrTextPanel = ({ text }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
    <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-slate-800 dark:text-slate-200"><FileText size={20} /> OCR Results</h3>
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-h-96 overflow-y-auto">
      <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{text || 'No OCR data available.'}</pre>
    </div>
  </div>
);


const FileDetailModal = ({ file, onClose, onDelete }) => {
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState('preview');
  const [editableDetails, setEditableDetails] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (file?.id) loadFileDetails();
  }, [file?.id]);

  const loadFileDetails = async () => {
    try {
      setLoading(true); setError(null);
      const response = await ApiService.getFileById(file.id);
      setFileDetails(response.data);
      setEditableDetails(response.data);
      setIsDirty(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDataChange = (fieldKey, newValue) => {
    setEditableDetails(prev => ({ ...prev, [fieldKey]: newValue }));
    setIsDirty(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const changedData = {};
      Object.keys(editableDetails).forEach(key => {
        if (editableDetails[key] !== fileDetails[key]) {
          changedData[key] = editableDetails[key];
        }
      });
      if (Object.keys(changedData).length > 0) {
        await ApiService.updateFileDetails(file.id, changedData);
        toast.success("Changes saved successfully!");
        loadFileDetails();
      } else {
        toast.info("No changes to save.");
        setIsDirty(false);
      }
    } catch (err) { toast.error("Failed to save changes: " + err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${displayName}"?`)) {
      onDelete(details.id);
      onClose();
    }
  };

  // --- ✨ NEW: ฟังก์ชันสำหรับ Alert ก่อนปิด ---
  const handleCloseAttempt = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"><p className="text-white">Loading...</p></div>;
  if (error) return <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"><p className="text-white">Error: {error}</p></div>;

  const details = editableDetails || file;
  const fileUrl = ApiService.getFileViewUrl(details.id);
  const displayName = details.original_name || details.filename || details.name;
  const isPDF = details.mime_type === 'application/pdf' || details.file_type === 'PDF';

  return (
    // <<< MODIFIED: เรียกใช้ handleCloseAttempt เมื่อคลิกที่ Backdrop >>>
    <div onClick={handleCloseAttempt} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="text-3xl">{ApiService.getFileIcon(details.file_type, details.mime_type)}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 truncate" title={displayName}>{displayName}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isDirty && (
              <button onClick={handleSaveChanges} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50">
                <Save size={16} />{isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <div className="hidden sm:flex bg-slate-200/80 dark:bg-slate-800 rounded-lg p-1">
              <button onClick={() => setPreviewMode('preview')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'preview' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}`}>🔍 Preview</button>
              <button onClick={() => setPreviewMode('info')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'info' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}`}>ℹ️ Info</button>
            </div>
            <button onClick={() => ApiService.downloadFile(details.id, displayName)} className="p-2 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg" title="Download"><Download size={20} /></button>
            <button onClick={handleDelete} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-500 rounded-lg" title="Delete"><Trash2 size={20} /></button>
            {/* <<< MODIFIED: เรียกใช้ handleCloseAttempt เมื่อคลิกปุ่มปิด >>> */}
            <button onClick={handleCloseAttempt} className="p-2 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg" title="Close"><X size={24} /></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {previewMode === 'preview' ? (
            <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-950">
              {isPDF ? (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="w-full md:w-2/3 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                    <iframe src={fileUrl} className="w-full h-full border-0" title={`PDF Preview: ${displayName}`} />
                  </div>
                  <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-auto">
                    <ExtractedDataPanel details={details} onDataChange={handleDataChange} isDirty={isDirty} />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center p-4">
                  <p className="text-slate-500">Preview for this file type is not available.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex-1 p-6 md:p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950">
              <div className="max-w-4xl mx-auto space-y-6">
                <FileInfoPanel details={details} />
                <OcrTextPanel text={details.ocr_text} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;