import React, { useEffect, useState } from 'react';
import ApiService from '../services/ApiService';
import { Loader2, Maximize2, Download, FileText, Building2, Calendar, Hash, BadgePercent } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={16} className="mt-1 text-slate-400 dark:text-slate-300" />
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{value || '-'}</p>
    </div>
  </div>
);

const FilePreviewPane = ({ file, onOpenDetail }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!file?.id) {
      setDetails(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    ApiService.getFileById(file.id)
      .then((response) => {
        if (isMounted) {
          setDetails(response.data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [file?.id]);

  if (!file) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Select a document to preview.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading preview…</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-6">
        <p className="text-sm text-red-600 dark:text-red-300">Cannot load preview: {error || 'Unknown error'}</p>
      </div>
    );
  }

  const isPDF = details.mime_type === 'application/pdf' || (details.file_type || '').toLowerCase() === 'pdf';
  const isImage = (details.mime_type || '').startsWith('image/');
  const fileUrl = ApiService.getFileViewUrl(details.id);
  const displayName = details.original_name || details.filename || details.name;

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate" title={displayName}>{displayName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">ID: {details.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => ApiService.downloadFile(details.id, displayName)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300" title="Download">
            <Download size={18} />
          </button>
          <button onClick={() => onOpenDetail(details)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700">
            <Maximize2 size={16} /> Detail
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-1 min-h-[240px] overflow-hidden">
        {isPDF ? (
          <iframe src={fileUrl} title={`Preview ${displayName}`} className="h-full w-full border-0" />
        ) : isImage ? (
          <img src={fileUrl} alt={displayName} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-6 text-center">
            Preview is not available for this file type.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <InfoRow icon={FileText} label="File Type" value={details.file_type || details.mime_type} />
        <InfoRow icon={Building2} label="Company" value={details.company_name} />
        <InfoRow icon={Hash} label="Reference" value={details.pn_name} />
        <InfoRow icon={BadgePercent} label="Tax ID" value={details.extract_taxid} />
        <InfoRow icon={Calendar} label="Uploaded" value={new Date(details.uploaded_at || details.created_at).toLocaleString()} />
      </div>
    </div>
  );
};

export default FilePreviewPane;
