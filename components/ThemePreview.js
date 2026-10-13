'use client';

const THEME_STYLES = {
  classic: {
    bg: '#ffffff',
    text: '#111111',
    muted: '#64748b',
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  bold: {
    bg: '#0a0a0a',
    text: '#ffffff',
    muted: '#a1a1aa',
    accent: '#f97316',
    accentDark: '#ea580c',
    card: '#18181b',
    border: '#27272a',
  },
  minimal: {
    bg: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#0f172a',
    accentDark: '#000000',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  elegant: {
    bg: '#faf5ff',
    text: '#1e1b4b',
    muted: '#7c3aed',
    accent: '#7c3aed',
    accentDark: '#6d28d9',
    card: '#ffffff',
    border: '#e9d5ff',
  },
};

export default function ThemePreview({ theme, large }) {
  const t = THEME_STYLES[theme] || THEME_STYLES.classic;

  const height = large ? 240 : 120;
  const imageHeight = large ? 90 : 48;

  return (
    <div
      className="theme-preview-frame"
      style={{
        background: t.bg,
        borderColor: t.border,
        height,
      }}
    >
      <div
        className="theme-preview-hero"
        style={{
          background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
          height: imageHeight,
        }}
      >
        <span style={{ fontSize: large ? 32 : 18 }}>🎵</span>
      </div>

      <div className="theme-preview-body" style={{ padding: large ? 14 : 8 }}>
        <div
          className="theme-preview-title"
          style={{
            color: t.text,
            fontSize: large ? 15 : 10,
            fontWeight: 800,
          }}
        >
          Lagos Music Festival
        </div>
        <div
          className="theme-preview-meta"
          style={{
            color: t.muted,
            fontSize: large ? 11 : 8,
            marginBottom: large ? 10 : 6,
          }}
        >
          📅 Sat, Dec 14 · 📍 Eko Hotel
        </div>

        <div
          className="theme-preview-ticket"
          style={{
            borderColor: t.border,
            background: t.card,
            padding: large ? 10 : 6,
          }}
        >
          <div>
            <div
              style={{
                color: t.text,
                fontSize: large ? 11 : 8,
                fontWeight: 700,
              }}
            >
              VIP
            </div>
            <div
              style={{
                color: t.muted,
                fontSize: large ? 9 : 7,
              }}
            >
              Front row seat
            </div>
          </div>
          <div
            className="theme-preview-buy"
            style={{
              background: t.accent,
              fontSize: large ? 10 : 7,
              padding: large ? '6px 12px' : '3px 7px',
            }}
          >
            Buy
          </div>
        </div>
      </div>
    </div>
  );
      }
