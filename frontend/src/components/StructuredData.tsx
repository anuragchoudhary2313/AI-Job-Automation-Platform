import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Product' | 'SoftwareApplication' | 'FAQPage' | 'Article';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    };

    return JSON.stringify(baseData);
  };

  return (
    <Helmet>
      <script type="application/ld+json">{getStructuredData()}</script>
    </Helmet>
  );
};

// Pre-built structured data components
export const OrganizationSchema = () => (
  <StructuredData
    type="Organization"
    data={{
      name: 'AI Job Automation',
      url: 'https://aijobautomation.com',
      logo: 'https://aijobautomation.com/logo.png',
      description: 'AI-powered job search automation platform',
      sameAs: [
        'https://twitter.com/aijobautomation',
        'https://linkedin.com/company/aijobautomation',
        'https://github.com/aijobautomation',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'Customer Service',
        email: 'support@aijobautomation.com',
      },
    }}
  />
);

export const WebSiteSchema = () => (
  <StructuredData
    type="WebSite"
    data={{
      name: 'AI Job Automation',
      url: 'https://aijobautomation.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://aijobautomation.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    }}
  />
);

export const SoftwareApplicationSchema = () => (
  <StructuredData
    type="SoftwareApplication"
    data={{
      name: 'AI Job Automation',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '29',
        priceCurrency: 'USD',
        priceValidUntil: '2025-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2500',
      },
      description: 'Automate your job search with AI-powered resume generation and application tracking',
    }}
  />
);

export const FAQPageSchema = ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) => (
  <StructuredData
    type="FAQPage"
    data={{
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }}
  />
);

export default StructuredData;
