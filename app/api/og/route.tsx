import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'FireChess Blog';
  const slug = searchParams.get('slug') || '';
  const post = slug ? getPostBySlug(slug) : null;

  // Theme color based on post tags or default
  const getThemeColor = (tags?: string[]) => {
    if (!tags) return { primary: '#f59e0b', secondary: '#fbbf24', bg: '#0c1220' };
    if (tags.some(t => t.includes('opening') || t.includes('gambit'))) return { primary: '#f59e0b', secondary: '#fbbf24', bg: '#0c1220' };
    if (tags.some(t => t.includes('tactic') || t.includes('blunder'))) return { primary: '#ef4444', secondary: '#f87171', bg: '#0c1220' };
    if (tags.some(t => t.includes('strategy') || t.includes('plan'))) return { primary: '#22c55e', secondary: '#4ade80', bg: '#0c1220' };
    if (tags.some(t => t.includes('analysis') || t.includes('review'))) return { primary: '#8b5cf6', secondary: '#a78bfa', bg: '#0c1220' };
    if (tags.some(t => t.includes('variant') || t.includes('chaos'))) return { primary: '#8b5cf6', secondary: '#a78bfa', bg: '#0c1220' };
    if (tags.some(t => t.includes('rating') || t.includes('improve'))) return { primary: '#06b6d4', secondary: '#67e8f9', bg: '#0c1220' };
    return { primary: '#f59e0b', secondary: '#fbbf24', bg: '#0c1220' };
  };

  const theme = getThemeColor(post?.tags);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.bg,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.primary}15 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${theme.secondary}10 0%, transparent 50%)`,
        }}
      >
        {/* Chess board pattern background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.03,
          }}
        >
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {Array.from({ length: 8 }).map((_, c) => (
                <div
                  key={c}
                  style={{
                    flex: 1,
                    backgroundColor: (r + c) % 2 === 0 ? '#ffffff' : 'transparent',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* FireChess logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${theme.primary}40, ${theme.secondary}20)`,
              border: `2px solid ${theme.primary}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: theme.primary,
              }}
            >
              F
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#f1f5f9',
              letterSpacing: 2,
            }}
          >
            FIRECHESS
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#f1f5f9',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.2,
            marginBottom: 20,
            padding: '0 40px',
          }}
        >
          {title}
        </div>

        {/* Description if available */}
        {post?.description && (
          <div
            style={{
              fontSize: 20,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: 700,
              lineHeight: 1.4,
              padding: '0 40px',
            }}
          >
            {post.description.length > 120 ? post.description.slice(0, 120) + '...' : post.description}
          </div>
        )}

        {/* Decorative chess pieces */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 60,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          <div style={{ width: 24, height: 32, backgroundColor: theme.primary, opacity: 0.6, borderRadius: '4px 4px 0 0' }} />
          <div style={{ width: 20, height: 24, backgroundColor: theme.secondary, opacity: 0.4, borderRadius: '4px 4px 0 0' }} />
          <div style={{ width: 28, height: 40, backgroundColor: theme.primary, opacity: 0.5, borderRadius: '4px 4px 0 0' }} />
        </div>

        {/* Date badge */}
        {post?.date && (
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 60,
              padding: '8px 16px',
              backgroundColor: `${theme.primary}20`,
              border: `1px solid ${theme.primary}40`,
              borderRadius: 8,
              color: theme.primary,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
