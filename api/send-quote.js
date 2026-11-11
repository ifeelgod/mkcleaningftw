const nodemailer = require('nodemailer');

const DEFAULT_RECIPIENT = 'MadameKatherines71@gmail.com';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailContent(payload) {
  const {
    name,
    phone,
    email,
    address,
    notes,
    beds,
    baths,
    cleanType,
    frequency,
    addons,
    estimatedTotal,
  } = payload;

  const addonsText = Array.isArray(addons) && addons.length > 0 ? addons.join(', ') : 'None';
  const subject = `New Cleaning Quote Request (${frequency}) - ${name} (${estimatedTotal})`;

  const text = [
    "New Cleaning Quote Request - Madame Katherine's Quality Cleaning Services",
    '',
    'CONTACT INFORMATION:',
    `- Name: ${name}`,
    `- Phone: ${phone}`,
    `- Email: ${email || 'Not provided'}`,
    `- Service Address: ${address}`,
    `- Preferred Date / Notes: ${notes || 'None'}`,
    '',
    'CLEANING CONFIGURATION:',
    `- Bedrooms: ${beds}`,
    `- Bathrooms: ${baths} bathroom(s)`,
    `- Cleaning Type: ${cleanType}`,
    `- Frequency: ${frequency}`,
    `- Selected Add-ons: ${addonsText}`,
    '',
    `ESTIMATED TOTAL: ${estimatedTotal}`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #2e1065; color: #ffffff; padding: 24px; border-bottom: 4px solid #d97706;">
        <h1 style="margin: 0; font-size: 20px; color: #f59e0b;">Madame Katherine's Quality Cleaning Services</h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #e9d5ff;">New Instant Quote Notification</p>
      </div>
      <div style="padding: 24px; background: #ffffff; color: #1f2937;">
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 12px; text-transform: uppercase; color: #6d28d9; font-weight: bold;">Estimated Total</div>
          <div style="font-size: 28px; font-weight: bold; color: #2e1065; margin-top: 4px;">${escapeHtml(estimatedTotal)}</div>
          <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">${escapeHtml(cleanType)} &bull; ${escapeHtml(frequency)}</div>
        </div>

        <h2 style="font-size: 15px; color: #2e1065; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Client Contact Info</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 140px;">Name:</td><td style="padding: 6px 0; font-weight: bold;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Phone:</td><td style="padding: 6px 0; font-weight: bold;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Email:</td><td style="padding: 6px 0;">${escapeHtml(email || 'Not provided')}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Address:</td><td style="padding: 6px 0;">${escapeHtml(address)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Notes / Date:</td><td style="padding: 6px 0;">${escapeHtml(notes || 'None')}</td></tr>
        </table>

        <h2 style="font-size: 15px; color: #2e1065; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Service Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 140px;">Bedrooms:</td><td style="padding: 6px 0;">${escapeHtml(beds)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Bathrooms:</td><td style="padding: 6px 0;">${escapeHtml(baths)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Cleaning Type:</td><td style="padding: 6px 0;">${escapeHtml(cleanType)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Frequency:</td><td style="padding: 6px 0;">${escapeHtml(frequency)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Add-ons:</td><td style="padding: 6px 0;">${escapeHtml(addonsText)}</td></tr>
        </table>
      </div>
    </div>
  `;

  return { subject, text, html };
}

async function sendViaResend({ to, replyTo, subject, text, html }) {
  const from = process.env.RESEND_FROM || "Madame Katherine's Quotes <onboarding@resend.dev>";
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errText}`);
  }
}

async function sendViaGmail({ to, replyTo, subject, text, html }) {
  const user = process.env.GMAIL_USER || DEFAULT_RECIPIENT;
  const pass = process.env.GMAIL_APP_PASSWORD;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Madame Katherine's Website" <${user}>`,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject,
    text,
    html,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
    }
  }

  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const address = String(body?.address || '').trim();
  const email = String(body?.email || '').trim();

  if (!name || !phone || !address) {
    return res.status(400).json({
      ok: false,
      error: 'Name, phone number, and service address are required.',
    });
  }

  const to = process.env.QUOTE_TO_EMAIL || DEFAULT_RECIPIENT;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const replyTo = emailRegex.test(email) ? email : undefined;

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasGmail = Boolean(process.env.GMAIL_APP_PASSWORD);

  if (!hasResend && !hasGmail) {
    return res.status(503).json({
      ok: false,
      code: 'NOT_CONFIGURED',
      error: 'Email delivery credentials are not configured yet on Vercel.',
    });
  }

  const content = buildEmailContent({
    name,
    phone,
    email,
    address,
    notes: String(body?.notes || '').trim(),
    beds: String(body?.beds || ''),
    baths: String(body?.baths || ''),
    cleanType: String(body?.cleanType || ''),
    frequency: String(body?.frequency || ''),
    addons: Array.isArray(body?.addons) ? body.addons.map(String) : [],
    estimatedTotal: String(body?.estimatedTotal || ''),
  });

  try {
    if (hasResend) {
      await sendViaResend({ to, replyTo, ...content });
    } else {
      await sendViaGmail({ to, replyTo, ...content });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Quote notification delivery failed:', error);
    return res.status(500).json({
      ok: false,
      error: 'Unable to send notification automatically right now.',
    });
  }
};
