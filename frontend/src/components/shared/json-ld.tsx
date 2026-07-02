import { siteConfig } from "@/lib/site";
import { faqs } from "@/lib/content";

/**
 * Structured data (schema.org) for SEO, AEO (answer engines) and GEO
 * (generative engines). Rendered as a single JSON-LD graph in <head>.
 */
export function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.company,
      url: siteConfig.url,
      logo: `${siteConfig.url}/icon.svg`,
      description: siteConfig.description,
      sameAs: Object.values(siteConfig.links),
      contactPoint: {
        "@type": "ContactPoint",
        email: siteConfig.contact.email,
        telephone: siteConfig.contact.phone,
        contactType: "customer support",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "340 Market Street, Suite 500",
        addressLocality: "San Francisco",
        addressRegion: "CA",
        postalCode: "94103",
        addressCountry: "US",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: siteConfig.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "12480",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
