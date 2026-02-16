import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO = ({
  title = 'AI Job Automation - Land Your Dream Job 10x Faster',
  description = 'Automate your job search with AI. Apply to hundreds of jobs, generate tailored resumes, and track applications—all on autopilot. Start your free trial today.',
  keywords = 'job automation, AI resume builder, automated job applications, job search automation, career automation, AI job search, resume generator',
  image = '/og-image.jpg',
  url = 'https://aijobautomation.com',
  type = 'website',
  author = 'AI Job Automation',
  publishedTime,
  modifiedTime,
}: SEOProps) => {
  const siteTitle = 'AI Job Automation';
  // FIX: Added backticks (`) for template literal
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://aijobautomation.com');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@aijobautomation" />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Theme Color */}
      {/* eslint-disable-next-line */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
    </Helmet>
  );
};

export default SEO;