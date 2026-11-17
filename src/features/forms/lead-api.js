export function addLeadHoneypot(form) {
  if (form.querySelector('[name="website"]')) return;

  const field = document.createElement('input');
  field.type = 'text';
  field.name = 'website';
  field.tabIndex = -1;
  field.autocomplete = 'off';
  field.setAttribute('aria-hidden', 'true');
  field.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
  form.prepend(field);
}

export async function encodeLeadAttachment(file) {
  if (!file) return undefined;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return {
    name: file.name,
    type: file.type,
    contentBase64: btoa(binary)
  };
}

export async function submitLead(lead, attachment, attachmentField = 'attachment') {
  if (attachmentField !== 'attachment' && attachmentField !== 'customizerPreview') {
    throw new TypeError(`Unsupported lead attachment field: ${attachmentField}`);
  }

  const payload = { ...lead };
  if (attachment) {
    const hostname = window.location.hostname;
    const usesLocalFileServer = hostname === 'localhost' || hostname === '127.0.0.1';
    if (usesLocalFileServer) {
      payload[attachmentField] = await encodeLeadAttachment(attachment);
    } else {
      const extension = attachment.name.split('.').pop()?.toLowerCase() || '';
      const extensionTypes = {
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        pdf: 'application/pdf',
        png: 'image/png',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      const contentType = extensionTypes[extension];
      if (!contentType || !extensionTypes[extension]) {
        throw new Error('Unsupported attachment format.');
      }

      const { upload } = await import('/assets/js/vercel-blob-client.js');
      const blob = await upload(
        `lead-attachments/${crypto.randomUUID()}.${extension}`,
        attachment,
        {
          access: 'private',
          contentType,
          handleUploadUrl: '/api/blob-upload',
          multipart: attachment.size > 5 * 1024 * 1024
        }
      );
      payload[attachmentField] = {
        name: attachment.name,
        type: contentType,
        pathname: blob.pathname
      };
    }
  }

  const response = await fetch('/api/leads', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Не удалось отправить заявку (${response.status}).`);
  }
  return result;
}

export function setLeadFeedback(form, message, isError = false, linkUrl = '') {
  let feedback = form.querySelector('[data-form-feedback]');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.dataset.formFeedback = '';
    feedback.setAttribute('aria-live', 'polite');
    feedback.className = 'mt-3 text-xs';
    form.append(feedback);
  }
  feedback.replaceChildren();
  feedback.classList.toggle('text-red-400', isError);
  feedback.classList.toggle('text-slate-400', !isError);
  feedback.append(document.createTextNode(message));

  if (linkUrl) {
    feedback.append(document.createTextNode(' '));
    const link = document.createElement('a');
    link.href = linkUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'underline underline-offset-2';
    link.textContent = 'Открыть WhatsApp';
    feedback.append(link);
  }
}
