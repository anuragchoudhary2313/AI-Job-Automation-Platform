import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the AI job automation work?',
    answer: 'Our AI analyzes job postings, generates tailored resumes and cover letters, and automatically submits applications on your behalf. It learns from your preferences and optimizes over time to match you with the best opportunities.',
  },
  {
    question: 'Is it safe to use automated job applications?',
    answer: 'Absolutely! We use industry-standard security practices and comply with all platform terms of service. Our bot behaves like a human user with randomized delays and rate limiting to avoid detection.',
  },
  {
    question: 'How many jobs can I apply to per month?',
    answer: 'It depends on your plan. Starter allows 50 applications/month, Professional allows 500, and Enterprise offers unlimited applications. You can always upgrade if you need more.',
  },
  {
    question: 'Can I customize the resumes and cover letters?',
    answer: 'Yes! You can create custom templates, set preferences, and review/edit any generated content before it\'s sent. The AI learns from your edits to improve future generations.',
  },
  {
    question: 'What happens if I get an interview?',
    answer: 'You\'ll receive instant notifications via email and in-app alerts. Our platform also includes interview scheduling tools and preparation resources to help you succeed.',
  },
  {
    question: 'Do you offer a free trial?',
    answer: 'Yes! All plans include a 14-day free trial with no credit card required. You can test all features and cancel anytime during the trial period.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely. You can cancel your subscription at any time from your account settings. We also offer a 30-day money-back guarantee if you\'re not satisfied.',
  },
  {
    question: 'Which job platforms do you support?',
    answer: 'We support all major job platforms including LinkedIn, Indeed, Glassdoor, ZipRecruiter, and many more. We\'re constantly adding new integrations based on user requests.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about the platform
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                    }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
              >
                <div className="px-6 pb-5 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
