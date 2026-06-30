const SUPPORT_EMAIL = 'ideepsaha25@gmail.com';
const DELETION_REQUEST_SUBJECT = 'MilesAway Account Deletion Request';
const PRIVACY_POLICY_URL = 'https://sites.google.com/view/privacypolicy-milesaway/';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderDeleteAccountPage = () => {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(DELETION_REQUEST_SUBJECT)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MilesAway Account Deletion</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #060e20;
        --panel: rgba(13, 19, 33, 0.92);
        --panel-strong: #0d1321;
        --text: #f4f8fb;
        --muted: #a8b4c5;
        --line: rgba(153, 247, 255, 0.12);
        --accent: #99f7ff;
        --accent-2: #2ff801;
        --warning: #ff793e;
        --danger: #ff716c;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(153, 247, 255, 0.18), transparent 28%),
          radial-gradient(circle at 80% 20%, rgba(47, 248, 1, 0.12), transparent 22%),
          radial-gradient(circle at bottom right, rgba(255, 121, 62, 0.14), transparent 24%),
          var(--bg);
        color: var(--text);
        line-height: 1.6;
      }

      main {
        width: min(1080px, calc(100% - 24px));
        margin: 0 auto;
        padding: 28px 0 44px;
      }

      .hero,
      .card {
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(17, 20, 32, 0.96), rgba(7, 10, 17, 0.96));
        box-shadow: 0 28px 60px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(14px);
      }

      .hero {
        border-radius: 28px;
        padding: clamp(24px, 5vw, 48px);
        overflow: hidden;
        position: relative;
      }

      .hero::after {
        content: '';
        position: absolute;
        inset: auto -12% -36% auto;
        width: 320px;
        height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(153, 247, 255, 0.18), transparent 62%);
        pointer-events: none;
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3 {
        line-height: 1.12;
        margin: 0;
      }

      h1 {
        font-size: clamp(2.4rem, 8vw, 4.8rem);
        letter-spacing: -0.04em;
        max-width: 12ch;
      }

      .summary {
        max-width: 70ch;
        margin: 18px 0 0;
        color: var(--muted);
        font-size: clamp(1rem, 2.1vw, 1.15rem);
      }

      .hero-grid {
        display: grid;
        grid-template-columns: 1.35fr 0.9fr;
        gap: 18px;
        margin-top: 28px;
      }

      .card {
        border-radius: 22px;
        padding: 22px;
      }

      .card h2 {
        font-size: clamp(1.2rem, 2.6vw, 1.6rem);
        margin-bottom: 12px;
      }

      .stack {
        display: grid;
        gap: 14px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        width: fit-content;
        border: 1px solid rgba(153, 247, 255, 0.2);
        background: rgba(153, 247, 255, 0.08);
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .step-list,
      .data-list {
        margin: 12px 0 0;
        padding-left: 1.15rem;
      }

      .step-list li,
      .data-list li {
        margin: 10px 0;
        color: var(--text);
      }

      .step-list strong,
      .data-list strong {
        color: var(--accent);
      }

      .callout {
        border-left: 4px solid var(--danger);
        background: rgba(255, 113, 108, 0.08);
        padding: 16px 18px;
        border-radius: 0 14px 14px 0;
        color: var(--text);
      }

      a {
        color: var(--accent);
        font-weight: 700;
      }

      .meta {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 0.98rem;
      }

      .footer {
        margin-top: 18px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 18px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid transparent;
        text-decoration: none;
      }

      .button.primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        color: #06111a;
      }

      .button.secondary {
        border-color: rgba(255, 255, 255, 0.18);
        color: var(--text);
        background: rgba(255, 255, 255, 0.04);
      }

      @media (max-width: 780px) {
        main {
          width: min(100% - 16px, 1080px);
          padding: 8px 0 24px;
        }

        .hero-grid {
          grid-template-columns: 1fr;
        }

        .hero {
          border-radius: 22px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">MilesAway account deletion</p>
        <h1 id="page-title">Delete your MilesAway account</h1>
        <p class="summary">
          MilesAway gives you two secure ways to delete your account. If you can still sign in, use the in-app deletion flow. If you cannot access the app, email the support address below from your registered email address.
        </p>

        <div class="button-row">
          <a class="button primary" href="#in-app">Delete in app</a>
          <a class="button secondary" href="${mailto}">Email support</a>
        </div>

        <div class="hero-grid">
          <article class="card stack" id="in-app">
            <div class="pill">Method 1: In app</div>
            <h2>Delete from Profile</h2>
            <ol class="step-list">
              <li>Open <strong>MilesAway</strong> and go to <strong>Profile</strong>.</li>
              <li>Scroll to <strong>Account &amp; Data</strong>.</li>
              <li>Tap <strong>Delete account</strong>.</li>
              <li>Confirm with your current password and the permanent deletion acknowledgement.</li>
            </ol>
            <div class="callout">
              This action is permanent. Once the request is confirmed, deletion cannot be undone.
            </div>
          </article>

          <article class="card stack">
            <div class="pill">Method 2: Email support</div>
            <h2>Request deletion by email</h2>
            <div class="meta">
              <div><strong>Support email:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></div>
              <div><strong>Required subject:</strong> ${escapeHtml(DELETION_REQUEST_SUBJECT)}</div>
              <div><strong>Send from:</strong> the email address registered to your MilesAway account</div>
              <div><strong>Timeline:</strong> verified requests are completed within 30 days</div>
            </div>
            <p>
              Never email your password. We will verify the account ownership before processing the request.
            </p>
            <a class="button primary" href="${mailto}">Open email draft</a>
          </article>
        </div>
      </section>

      <section class="card stack" style="margin-top: 18px;">
        <div class="pill">Data deleted</div>
        <h2>What is removed</h2>
        <ul class="data-list">
          <li>Account profile, email, password hash, and location</li>
          <li>Runs, GPS coordinates, routes, and fitness statistics</li>
          <li>Daily aggregates and leaderboard data</li>
          <li>Authored community posts and comments</li>
          <li>Likes and references attached to other posts</li>
        </ul>
      </section>

      <section class="card stack" style="margin-top: 18px;">
        <div class="pill">Retention</div>
        <h2>How retention works</h2>
        <ul class="data-list">
          <li>No personal data is intentionally retained in the active database after deletion.</li>
          <li>Provider backups, if present, may take up to 30 days to expire.</li>
          <li>Deletion cannot be undone.</li>
        </ul>
        <p>
          Need more context? Read the <a href="${PRIVACY_POLICY_URL}">MilesAway Privacy Policy</a>.
        </p>
      </section>

      <p class="footer">
        MilesAway support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. Public deletion page for Google Play Console compliance.
      </p>
    </main>
  </body>
</html>`;
};

module.exports = {
  SUPPORT_EMAIL,
  DELETION_REQUEST_SUBJECT,
  PRIVACY_POLICY_URL,
  renderDeleteAccountPage
};