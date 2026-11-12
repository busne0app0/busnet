import type { VercelRequest, VercelResponse } from '@vercel/node';

// Targeted list of social network crawlers, messengers, and search engine bots
const SOCIAL_BOTS_REGEX = /facebookexternalhit|Facebot|TelegramBot|WhatsApp|Viber|Twitterbot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Applebot|Googlebot|bingbot|DuckDuckBot|YandexBot/i;

// Fallback preview image if post doesn't have an image
const DEFAULT_OG_IMAGE = 'https://busnetua.it/og-image.jpg';

// Escape HTML special characters for safe insertion into meta tags and text body
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Only process GET / HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }

  const { slug } = req.query;
  const userAgent = (req.headers['user-agent'] || '').toString();
  const isBot = SOCIAL_BOTS_REGEX.test(userAgent);

  // If a human visitor reaches here directly, redirect them to the SPA route
  if (!isBot) {
    const targetSlug = slug ? String(slug) : '';
    return res.redirect(302, `/connect/post/${targetSlug}`);
  }

  if (!slug) {
    return res.status(404).send('Not Found');
  }

  const slugOrId = String(slug);

  // 2. Fetch post data from Supabase REST API (anon key only, respecting RLS)
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
      return res.status(502).send('Error fetching from database');
    }

    const posts = await response.json();
    const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;

    // 3. Visibility and Security Check:
    // If not found or is_public is false: 404
    if (!post || post.is_public === false) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
      return res.status(404).send(`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Публікацію не знайдено — BUSNET CONNECT</title>
  <meta name="robots" content="noindex, nofollow">
</head>
<body>
  <h1>404: Публікацію не знайдено або вона приватна</h1>
</body>
</html>`);
    }

    // 4. Content construction for Social Bots AND Googlebot:
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

    // 5. Render full HTML: includes Open Graph, Twitter Cards, Schema.org AND readable article body for Googlebot
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
    <header>
      <h1>${escapeHtml(postTitle)}</h1>
      <p>Опубліковано: <time datetime="${post.created_at || ''}">${post.created_at ? new Date(post.created_at).toLocaleDateString('uk-UA') : ''}</time> | Автор: <strong>${escapeHtml(authorName)}</strong></p>
    </header>
    <main>
      <p style="white-space: pre-line;">${escapeHtml(cleanContent)}</p>
      ${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(postTitle)}" style="max-width: 100%; height: auto;" />` : ''}
    </main>
    <footer>
      <p>Спільнота мандрівників: <a href="https://busnetua.it/connect">BUSNET CONNECT</a></p>
    </footer>
  </article>
</body>
</html>`;

    // 6. Return response with Vercel Edge Cache headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Prerender-Powered-By', 'BUSNET Edge Prerender');
    return res.status(200).send(html);
  } catch (err: any) {
    return res.redirect(302, `/connect/post/${slugOrId}`);
  }
}
