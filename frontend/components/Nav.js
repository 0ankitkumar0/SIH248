import React from 'react';

export default function Nav() {
  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-30 p-2">
            <div className="flex items-center">
        <a href="/" className="flex items-center">
          <img src="/SAIL_logo.PNG.png" alt="SAIL Logo" className="h-12 w-auto md:h-14" />
          <span className="ml-4 text-2xl md:text-3xl font-bold text-white">SAIL RakeOpt</span>
        </a>
            </div>
            <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
          <a href="/" className="text-white hover:bg-white hover:text-blue-600 px-3 py-2 rounded-md text-2xl font-semibold transition-colors duration-200">
                        Home
                    </a>
          <a href="/dashboard" className="text-white hover:bg-white hover:text-blue-600 px-3 py-2 rounded-md text-2xl font-semibold transition-colors duration-200">
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
      </div>
    </nav>
  );
}
