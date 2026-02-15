import React from 'react';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '29',
    description: 'Perfect for getting started',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      '50 job applications/month',
      'Basic resume templates',
      'Email support',
      'Application tracking',
      'Basic analytics',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: '79',
    description: 'For serious job seekers',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    features: [
      '500 job applications/month',
      'Premium resume templates',
      'Priority support',
      'Advanced analytics',
      'Custom cover letters',
      'Interview scheduler',
      'Salary insights',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '199',
    description: 'For teams and agencies',
    icon: Sparkles,
    gradient: 'from-orange-500 to-red-500',
    features: [
      'Unlimited applications',
      'All premium features',
      'Dedicated support',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'White-label option',
      'SLA guarantee',
    ],
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${plan.popular
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 shadow-2xl scale-105 border-2 border-purple-500'
                  : 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800'
                } transition-all duration-300 hover:shadow-xl`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold">
                  Most Popular
                </div>
              )}

              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              {/* Plan name */}
              <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'
                }`}>
                {plan.name}
              </h3>

              {/* Description */}
              <p className={`mb-6 ${plan.popular ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'
                }`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className={`text-5xl font-bold ${plan.popular ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'
                  }`}>
                  ${plan.price}
                </span>
                <span className={`text-lg ${plan.popular ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                  /month
                </span>
              </div>

              {/* CTA Button */}
              <button className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-all duration-200 ${plan.popular
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                }`}>
                Start Free Trial
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-green-400' : 'text-green-500'
                      }`} />
                    <span className={plan.popular ? 'text-gray-200 dark:text-gray-700' : 'text-gray-600 dark:text-gray-400'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            💰 30-day money-back guarantee • 🔒 No credit card required for trial
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
