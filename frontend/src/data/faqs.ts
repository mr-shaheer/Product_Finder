export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "what-is-product-finder",
    question: "What is Product Finder?",
    answer:
      "Product Finder is a free AI shopping assistant that discovers products across top multiple marketplaces, ranks relevant results and simplifies product comparisons.",
  },
  {
    id: "how-does-the-match-score-work",
    question: "How does the match score work?",
    answer:
      "Each product is evaluated based on relevance to your request, price, customer ratings and reviews. The transparent scoring system shows how well each product matches your needs and why it rank that product.",
  },
  {
    id: "does-product-finder-sell-products",
    question: "Does Product Finder sell products?",
    answer:
      "No, Product Finder helps you discover and compare products, then redirects you to the retailer's website to complete your purchase.",
  },
  {
    id: "do-i-need-an-account",
    question: "Do I need an account?",
    answer:
      "No account is required, Simply add your own API keys to start searching. Your keys are used for your requests and are never stored.",
  },
];

/** FAQPage structured data, generated from the same source as the visible copy. */
export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};
