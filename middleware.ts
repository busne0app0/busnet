export const config = {
  matcher: ['/connect/post/:slug*'],
  runtime: 'edge',
};

// Targeted list of social network crawlers, messengers, and search engine bots
const SOCIAL_BOTS_REGEX = /facebookexternalhit|Facebot|TelegramBot|WhatsApp|Viber|Twitterbot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Applebot|Googlebot|bingbot|DuckDuckBot|YandexBot/i;

// Fallback preview image if post doesn't have an image
const DEFAULT_OG_IMAGE = 'https://busnetua.it/og-image.jpg';

// Escape HTML special characters for safe insertion into meta tags
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // 1. Only process GET / HEAD methods
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return; // Pass through to standard routing
  }

  // 2. Identify if the request comes from a social media crawler or search bot
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = SOCIAL_BOTS_REGEX.test(userAgent);

  // If request is from a normal user browser, let Vercel route to the Vite SPA application
  if (!isBot) {
    return; // Pass through to SPA (index.html via vercel rewrites)
  }

  // 3. Extract slug or ID from URL path: /connect/post/:slug
  const match = url.pathname.match(/\/connect\/post\/([^/?#]+)/);
  if (!match || !match[1]) {
    return; // Pass through if slug is not extractable
  }

  const slugOrId = decodeURIComponent(match[1]);

  // 4. Fetch post data from Supabase REST API (Edge safe, anonymous public access)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vghrvtxovpzkosqgukla.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const isId = slugOrId.startsWith('BC-') || slugOrId.startsWith('FP-');
    const filterParam = isId ? `id=eq.${encodeURIComponent(slugOrId)}` : `slug=eq.${encodeURIComponent(slugOrId)}`;
    const queryUrl = `${supabaseUrl}/rest/v1/forum_posts?${filterParam}&select=id,slug,title,content,author_name,image_url,post_type,category,likes_count,comments,created_at,updated_at,is_public,is_indexable&limit=1`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return; // Fallback to SPA on DB failure
    }

    const posts = await response.json();
    const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;

    // 5. Security & Visibility checks:
    // If post not found OR is_public is false: return 404 HTML for bot
    if (!post || post.is_public === false) {
      return new Response(
        `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Публікацію не знайдено — BUSNET CONNECT</title>
  <meta name="robots" content="noindex, nofollow">
</head>
<body>
  <h1>404: Публікацію не знайдено або вона приватна</h1>
</body>
</html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=300',
          },
        }
      );
    }

    // 6. Build Open Graph Metadata
    const postTitle = post.title?.trim() || post.content?.slice(0, 60) || 'Публікація';
    const pageTitle = `${postTitle} | BUSNET CONNECT`;
    const cleanContent = (post.content || '').replace(/\s+/g, ' ').trim();
    const description = cleanContent.slice(0, 160) || 'Спільнота пасажирів та перевізників BUSNET UA';
    const imageUrl = post.image_url || DEFAULT_OG_IMAGE;
    const canonicalSlug = post.slug || post.id;
    const canonicalUrl = `https://busnetua.it/connect/post/${canonicalSlug}`;
    const authorName = post.author_name || 'Мандрівник BUSNET';

    // Strict SEO rule: only indexable if is_indexable === true AND is_public === true
    const robotsDirective = post.is_indexable === true ? 'index, follow' : 'noindex, follow';

    // JSON-LD structured data for Google / search crawlers
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      'mainEntityOfPage': canonicalUrl,
      'headline': postTitle,
      'articleBody': cleanContent,
      'image': imageUrl,
      'author': {
        '@type': 'Person',
        'name': authorName,
      },
      'datePublished': post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString(),
      'dateModified': post.updated_at ? new Date(post.updated_at).toISOString() : undefined,
      'interactionStatistic': [
        {
          '@type': 'InteractionCounter',
          'interactionType': 'https://schema.org/LikeAction',
          'userInteractionCount': Number(post.likes_count || 0),
        },
        {
          '@type': 'InteractionCounter',
          'interactionType': 'https://schema.org/CommentAction',
          'userInteractionCount': Number(post.comments || 0),
        },
      ],
      'publisher': {
        '@type': 'Organization',
        'name': 'BUSNET UA',
        'url': 'https://busnetua.it',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://busnetua.it/og-image.jpg',
        },
      },
    };

    // 7. Render complete prerendered HTML with Open Graph, Twitter Cards and JSON-LD
    const html = `<!DOCTYPE html>
<html lang="uk" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${robotsDirective}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / Facebook / Telegram / WhatsApp / Viber -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="BUSNET CONNECT">
  <meta property="og:title" content="${escapeHtml(postTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="article:published_time" content="${post.created_at || ''}">
  <meta property="article:author" content="${escapeHtml(authorName)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@busnetua">
  <meta name="twitter:title" content="${escapeHtml(postTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>
  <article>
    <h1>${escapeHtml(postTitle)}</h1>
    <p><strong>Автор:</strong> ${escapeHtml(authorName)}</p>
    <p>${escapeHtml(cleanContent)}</p>
    ${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(postTitle)}">` : ''}
  </article>
</body>
</html>`;

    // 8. Return response with Vercel Edge Cache headers:
    // s-maxage=3600 (cache on Vercel CDN for 1 hour)
    // stale-while-revalidate=86400 (revalidate in background)
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'X-Prerender-Powered-By': 'BUSNET Edge Middleware',
      },
    });
  } catch (err) {
    // Graceful fallback to client SPA
    return;
  }
}

