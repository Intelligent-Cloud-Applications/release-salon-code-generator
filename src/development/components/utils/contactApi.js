/**
 * Shared contact / enquiry submission via Tekkzy SES API.
 * Destination inbox: site.contactMail || site.contact.email (from data.json)
 */

const DEFAULT_ENDPOINT =
  'https://tg2d8qq95k.execute-api.us-east-2.amazonaws.com/dev/tekkzy/contact';

export function getContactMail(siteData) {
  if (!siteData) return '';
  return (
    siteData?.contactMail ||
    siteData?.site?.contactMail ||
    siteData?.contact?.email ||
    siteData?.site?.contact?.email ||
    siteData?.contact?.info?.email ||
    siteData?.site?.contact?.info?.email ||
    siteData?.footer?.contact?.email ||
    siteData?.email ||
    ''
  ).trim();
}

export function getContactEndpoint(siteData) {
  if (!siteData) return import.meta.env.VITE_TEKKZY_CONTACT_API || DEFAULT_ENDPOINT;
  return (
    siteData?.api?.contactEndpoint ||
    siteData?.site?.api?.contactEndpoint ||
    import.meta.env.VITE_TEKKZY_CONTACT_API ||
    DEFAULT_ENDPOINT
  );
}

/**
 * @param {object} options
 * @param {object} options.payload
 * @param {object} options.siteData
 * @param {string} [options.formName]
 * @param {string} [options.toEmail]
 */
export async function submitContactForm({
  payload,
  siteData,
  formName = 'Website Contact Form',
  toEmail,
} = {}) {
  const email = String(
    payload?.email ||
      payload?.emailAddress ||
      payload?.emailId ||
      payload?.['email-address'] ||
      ''
  ).trim();

  const phone = String(
    payload?.phone ||
      payload?.phoneNumber ||
      payload?.['phone-number'] ||
      siteData?.contact?.phone ||
      siteData?.site?.contact?.phone ||
      siteData?.phone ||
      'N/A'
  ).trim();

  const fullName = String(
    payload?.fullName ||
      payload?.name ||
      payload?.full_name ||
      payload?.['full-name'] ||
      ''
  ).trim();

  const subject = String(
    payload?.subject || payload?.inquiry || payload?.["I'm inquiring about"] || ''
  ).trim();

  const message = String(
    payload?.message || payload?.messageBody || payload?.message_body || ''
  ).trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  let mailTo = (toEmail || getContactMail(siteData) || '').trim();
  let endpoint = getContactEndpoint(siteData);

  if (!mailTo || !endpoint) {
    try {
      const res = await fetch('./data.json');
      if (res.ok) {
        const fetchedData = await res.json();
        if (!mailTo) mailTo = getContactMail(fetchedData);
        if (!endpoint) endpoint = getContactEndpoint(fetchedData);
      }
    } catch {
      /* ignore fetch errors */
    }
  }

  if (!mailTo) {
    throw new Error('Contact email is not configured in data.json.');
  }
  if (!endpoint) {
    throw new Error('Contact API endpoint is not configured.');
  }

  const body = {
    formName,
    toEmail: mailTo,
    email,
    phone,
    fullName,
    subject,
    message,
    extra: payload,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errJson = await response.json();
      detail = errJson?.message || errJson?.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Failed to send message (${response.status}).`);
  }

  try {
    return await response.json();
  } catch {
    return { ok: true };
  }
}
