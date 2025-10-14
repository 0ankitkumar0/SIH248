import React from 'react';
import Nav from '../components/Nav';
// --- SVG Icon Components (for Features section) ---
// Using inline SVGs for icons as external libraries are not available.

const SailLogoIcon = (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="50" fill="#EF4135"/>
      <circle cx="50" cy="50" r="40" fill="white"/>
      <path d="M 38 44 L 44 38 L 56 38 L 62 44 L 62 56 L 56 62 L 44 62 L 38 56 Z" fill="#EF4135"/>
    </svg>
);

const TrainIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v10h-2" />
    <path d="M2 16h12" />
    <path d="M6 16l-4 4" />
    <path d="M10 16l4 4" />
    <path d="M18 16l-2 4" />
    <path d="M12 16V4H4v12" />
    <path d="M8 8h.01" />
    <path d="M12 8h.01" />
    <circle cx="18" cy="20" r="2" />
    <circle cx="6" cy="20" r="2" />
  </svg>
);

const TargetIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const LayersIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const GaugeIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 14 4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
);

const ClipboardCheckIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
    </svg>
);

const BrainCircuitIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 5a3 3 0 1 0-5.993.13a3 3 0 0 0 5.993-.13Zm0 0a3 3 0 1 0 5.993.13A3 3 0 0 0 12 5Z" />
        <path d="M12 12a3 3 0 1 0-5.993.13A3 3 0 0 0 12 12Zm0 0a3 3 0 1 0 5.993.13A3 3 0 0 0 12 12Z" />
        <path d="M12 19a3 3 0 1 0-5.993.13A3 3 0 0 0 12 19Zm0 0a3 3 0 1 0 5.993.13A3 3 0 0 0 12 19Z" />
        <path d="M12 8V5" /><path d="M12 15v-3" /><path d="M12 22v-3" />
        <path d="M15 12.5h3" /><path d="M15 19.5h3" /><path d="M6 12.5H3" />
        <path d="M6 19.5H3" /><path d="m15 5.5 3-1" /><path d="m6 4.5-3 1" />
    </svg>
);



// --- Feature Card Component ---
const FeatureCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-base md:text-lg">{children}</p>
  </div>
);


// --- Main Home Component (now App) ---
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-200 font-sans text-gray-800">
      <Nav />
      
      {/* Hero Section */}
      <main className="pt-0">
        <div className="relative pt-16 pb-32 flex content-center items-center justify-center" style={{ minHeight: "75vh" }}>
          <div className="absolute top-0 w-full h-full bg-center bg-cover" 
            style={{ 
                backgroundImage: "url('/trainback.png')", // Changed to use your local image
                filter: "brightness(0.5)"
            }}>
          </div>
          <div className="container relative mx-auto">
            <div className="items-center flex flex-wrap">
              <div className="w-full lg:w-8/12 px-4 ml-auto mr-auto text-center">
                <div className="text-white">
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                    Intelligent Rake Optimization for a Smarter Supply Chain
                  </h1>
                  <p className="text-lg md:text-xl text-gray-200 mb-8">
                    An AI/ML-based Decision Support System to revolutionize rake formation planning for SAIL, starting with Bokaro Steel Plant.
                  </p>
                  <a href="/dashboard" className="px-8 py-3 rounded-lg font-semibold text-lg text-white shadow-lg transition-transform transform hover:scale-105 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20">
                    Open Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About the Project Section - REMOVED */}

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold">Key System Capabilities</h2>
        <p className="text-lg text-gray-600 mt-2">Optimizing every step of the rake formation process.</p>
      </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard icon={<BrainCircuitIcon />} title="Dynamic Rake Planning">
                    AI evaluates material availability, order priorities, and resource constraints to generate optimal daily rake plans.
                </FeatureCard>
                <FeatureCard icon={<GaugeIcon />} title="Cost & Efficiency Optimization">
                    Minimizes total logistics costs, including transport, loading, and potential penalties like idle freight or demurrage.
                </FeatureCard>
                <FeatureCard icon={<LayersIcon />} title="Intelligent Load Clubbing">
                    Strategically matches materials across stockyards with open orders to ensure rakes are fully and efficiently loaded.
                </FeatureCard>
                <FeatureCard icon={<ClipboardCheckIcon />} title="Constraint Management">
                    Respects all operational constraints such as rake size, loading point capacity, siding availability, and route restrictions.
                </FeatureCard>
                <FeatureCard icon={<TrainIcon />} title="Rail & Road Fulfillment">
                    Optimizes both rail and road order fulfillment by suggesting production based on multi-modal loading capabilities.
                </FeatureCard>
                <FeatureCard icon={<TargetIcon />} title="Optimal Sequencing">
                    Determines the best sequence for rake formation and dispatch to meet Service Level Agreements (SLAs) and enhance efficiency.
                </FeatureCard>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>&copy; {new Date().getFullYear()} SAIL Rake Optimization Project. All Rights Reserved.</p>
            <p className="text-sm text-gray-400 mt-1">A Decision Support System for Bokaro Steel Plant</p>
        </div>
      </footer>
    </div>
  )
}

