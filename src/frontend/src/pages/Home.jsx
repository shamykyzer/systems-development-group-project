import React from 'react';
import NavBar from '../components/NavBar';
import LandingPagePanel from '../components/LandingPagePanel';


function Home() {
  return (
    <div className="flex min-h-screen bg-dashboard-gradient">
      <NavBar />
      <LandingPagePanel />
    </div>
  );
}
export default Home;