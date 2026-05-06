import React from 'react';

const Education: React.FC = () => {
  const categories = [
    {
      title: 'Wire Tools Foundation',
      description: 'Essential knowledge for cable management and tool operation.',
      links: ['Core Principles', 'Safety Standards', 'Efficiency Tips']
    },
    {
      title: 'Engineering Reference',
      description: 'Technical specifications, conversion charts, and wire properties.',
      links: ['Conductor Data', 'Insulation Ratings', 'NEC/CEC References']
    },
    {
      title: 'Learning Hub',
      description: 'Video tutorials and step-by-step guides for tool modules.',
      links: ['Calculator Tutorials', 'Database Management', 'Reports Guide']
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-4">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-black text-center header-gradient mb-2 uppercase">Education Center</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-medium">Professional development and technical resources for wire operations.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/10 hover:border-eecol-blue/40 transition-all group">
              <div className="w-12 h-12 bg-eecol-blue/10 rounded-xl flex items-center justify-center text-eecol-blue mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-black header-gradient uppercase mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-12 overflow-hidden">{cat.description}</p>
              <ul className="space-y-2">
                {cat.links.map((link, j) => (
                  <li key={j}>
                    <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase hover:underline flex items-center gap-1">
                      <span>•</span> {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-eecol-blue rounded-3xl text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 uppercase">Knowledge Base</h2>
            <p className="text-blue-100 mb-6 max-w-lg">Can't find what you're looking for? Explore our comprehensive technical documentation and FAQ.</p>
            <button className="bg-white text-eecol-blue font-black py-3 px-8 rounded-xl text-xs uppercase hover:bg-blue-50 transition-colors">Search Knowledge Base</button>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;
