import React from 'react';

const Screenshots = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Beautiful, intuitive interface
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Designed for productivity. Built for scale.
          </p>
        </div>

        {/* Main screenshot */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20" />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>

              {/* Dashboard mockup */}
              <div className="bg-white dark:bg-gray-950 rounded-lg p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-8 w-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4">
                      <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                      <div className="h-8 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded" />
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
                        <div className="h-2 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                      <div className="h-6 w-20 bg-green-500 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature screenshots grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {['Analytics', 'Resume Builder', 'Job Tracker'].map((title, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-3" />
                    <div className="h-3 w-24 mx-auto bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white font-semibold">{title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Screenshots;
