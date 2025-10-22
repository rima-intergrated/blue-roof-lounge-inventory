// Helper to fetch an attachment (with auth) and return an object URL for preview
import { API_BASE_URL } from '../services/api';

export async function fetchAttachmentPreview(attachment) {
  const att = attachment || {};
  const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
  const backendBase = API_BASE_URL || ((typeof window !== 'undefined' && window.location) ? `${window.location.protocol}//${window.location.hostname}:5000` : '');
  // Prefer explicit att.downloadUrl or att.url when provided; otherwise build absolute API download URL
  let downloadUrl = att.downloadUrl || att.url || (backendBase ? `${backendBase}/attachments/download/${att._id}` : `/attachments/download/${att._id}`);
  if (downloadUrl && typeof downloadUrl === 'string') {
    // If downloadUrl is a relative path like '/uploads/...', prefix backendBase
    const isAbsolute = /^https?:\/\//i.test(downloadUrl);
    if (!isAbsolute && downloadUrl.startsWith('/') && backendBase) {
      downloadUrl = backendBase + downloadUrl;
    }
  }

  try {
    const resp = await fetch(downloadUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
    if (!resp.ok) throw new Error(`Failed to fetch attachment: ${resp.status}`);

    const contentType = resp.headers.get('content-type') || '';
    const contentDisposition = resp.headers.get('content-disposition') || '';

    // If server returned HTML (e.g., login page), treat as an error so caller falls back
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Attachment endpoint returned HTML (likely an auth/login page)');
    }

    const blob = await resp.blob();

    // Helper to extract filename from Content-Disposition header
    const getFilenameFromDisposition = (header) => {
      if (!header) return null;
      // RFC5987 and other variants
      const filenameStar = header.match(/filename\*=(?:UTF-8'')?([^;\n]+)/i);
      if (filenameStar && filenameStar[1]) return decodeURIComponent(filenameStar[1].replace(/['"\s]/g, ''));
      const filenameMatch = header.match(/filename="?([^";]+)"?/i);
      if (filenameMatch && filenameMatch[1]) return filenameMatch[1];
      return null;
    };

    const filenameFromHeader = getFilenameFromDisposition(contentDisposition);
    const filename = filenameFromHeader || att.originalName || att.name || (att._id ? `attachment-${att._id}` : 'download');

    const objectUrl = URL.createObjectURL(blob);
    return {
      url: objectUrl,
      mimeType: blob.type,
      filename,
      blob,
      revoke: () => { try { URL.revokeObjectURL(objectUrl); } catch (e) { /* ignore */ } },
      source: 'blob'
    };
  } catch (err) {
    // Fallback to direct download URL (may be public)
    return {
      url: downloadUrl,
      mimeType: att.type || null,
      filename: att.originalName || att.name || (att._id ? `attachment-${att._id}` : null),
      revoke: () => {},
      error: err,
      source: 'direct'
    };
  }
}
