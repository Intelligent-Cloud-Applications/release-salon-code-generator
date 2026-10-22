/**
 * Shared contact / enquiry submission via Tekkzy SES API.
 * Destination inbox: site.contactMail || site.contact.email (from site data)
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
    'concierge@tekkzy-salon.com'
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

export async function submitContactForm({
  payload,
  siteData,
  formName = 'Salon Website Inquiry',
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
      'N/A'
  ).trim();

  const fullName = String(
    payload?.fullName ||
      payload?.name ||
      payload?.full_name ||
      ''
  ).trim();

  const subject = String(
    payload?.subject || payload?.service || 'Appointment Inquiry'
  ).trim();

  const message = String(
    payload?.message || ''
  ).trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  const mailTo = (toEmail || getContactMail(siteData) || 'concierge@tekkzy-salon.com').trim();
  const endpoint = getContactEndpoint(siteData);

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
