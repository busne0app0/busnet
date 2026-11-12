import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  
  // Detect crawlers (Telegram, Facebook, WhatsApp, Twitter, Googlebot, etc.)
  const isCrawler = /bot|crawl|slurp|spider|facebookexternalhit|telegrambot|whatsapp|twitterbot|pinterest|vkshare/i.test(userAgent);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vghrvtxovpzkosqgukla.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!slug) {
    return res.redirect(302, '/connect');
  }

  try {
    // Fetch post from Supabase REST API
    const slugStr = String(slug);
    const filter = slugStr.startsWith('BC-') || slugStr.startsWith('FP-') 
      ? `id=eq.${slugStr}` 
      : `slug=eq.${slugStr}`;

    const apiRes = await fetch(`${supabaseUrl}/rest/v1/forum_posts?${filter}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const posts = await apiRes.json();
    const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;

    if (!post) {
      return res.redirect(302, '/connect');
    }

    const title = post.title ? `${post.title} | BUSNET CONNECT` : 'Публікація у BUSNET CONNECT';
    const description = (post.content || '').slice(0, 160).replace(/"/g, '&quot;');
    const image = post.image_url || 'https://busnetua.it/og-image.jpg';
    const canonicalUrl = `https://busnetua.it/connect/post/${post.slug || post.id}`;

    // If it's a crawler, serve rich meta tags for Telegram, Facebook, WhatsApp previews
    if (isCrawler) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="${post.is_indexable ? 'index, follow' : 'noindex, follow'}">

  <!-- OpenGraph / Facebook / Telegram -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="BUSNET UA">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" alt="Preview">
</body>
</html>`);
    }

    // Normal users get directed to the SPA app
    return res.redirect(302, `/index.html`);
  } catch (e) {
    return res.redirect(302, '/connect');
  }
}

