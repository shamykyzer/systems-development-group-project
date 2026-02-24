import React from 'react';
import NavBar from '../components/NavBar';
import LandingPagePanel from '../components/LandingPagePanel';


function Home() {
  return (
    <div className="flex min-h-screen w-full bg-dashboard-gradient overflow-x-hidden">
      <NavBar />
      <main className="flex-1 min-w-0">
        <LandingPagePanel />
      </main>
    </div>
  );
}
export default Home;