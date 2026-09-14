import React from "react";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Rajasthan Sepak Takraw Association (RSTA) | Official Governing Body",
  description = "Official state portal for Sepak Takraw and Aatya Paatya in Rajasthan. Presided over by Shri T. K. Singh (NIS). Certified fixtures, live scores, and player registry.",
  image = "/assets/hero/stadium-court.svg",
  url = "https://rsta.org.in",
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: "Rajasthan Sepak Takraw Association",
    alternateName: "RSTA",
    url: url,
    logo: image,
    description: description,
    founder: {
      "@type": "Person",
      name: "Shri T. K. Singh",
      jobTitle: "President",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sawai Mansingh Stadium, Amar Jawan Jyoti",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302005",
      addressCountry: "IN",
    },
    sport: ["Sepak Takraw", "Aatya Paatya"],
    memberOf: {
      "@type": "SportsOrganization",
      name: "Sepaktakraw Federation of India",
      alternateName: "STFI",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default SEOHead;
