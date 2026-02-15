import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Software Engineer',
    company: 'Google',
    image: '👩‍💻',
    content: 'This platform helped me land my dream job at Google! The AI-generated resumes were spot-on, and I got 3x more interviews than before.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Product Manager',
    company: 'Meta',
    image: '👨‍💼',
    content: 'Incredible time-saver! I applied to 200+ jobs in a week and got multiple offers. The automation is seamless and the analytics helped me optimize my approach.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Data Scientist',
    company: 'Amazon',
    image: '👩‍🔬',
    content: 'The best investment I made in my career. Within 2 weeks, I had 5 interviews lined up. The tailored cover letters were particularly impressive.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'UX Designer',
    company: 'Apple',
    image: '👨‍🎨',
    content: 'Game-changer for job hunting! The platform understood my skills perfectly and matched me with relevant positions. Now working at my dream company!',
    rating: 5,
  },
  {
    name: 'Jessica Taylor',
    role: 'Marketing Manager',
    company: 'Netflix',
    image: '👩‍💼',
    content: 'I was skeptical at first, but the results speak for themselves. Got hired within 3 weeks of using the platform. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Alex Martinez',
    role: 'DevOps Engineer',
    company: 'Microsoft',
    image: '👨‍💻',
    content: 'The automation saved me countless hours. The AI really understands what recruiters are looking for. Worth every penny!',
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by job seekers worldwide
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of professionals who landed their dream jobs with our platform
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-gray-200 dark:text-gray-800" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 dark:text-gray-300 mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              4.9/5
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Rating
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              2.5K+
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Happy Users
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
              95%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Success Rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
