import React from 'react';
import NavBar from '../components/NavBar';
import ProphetSettingsPanel from '../components/ProphetSettingsPanel';

/**
 * Settings Page
 * 
 * Container page for Prophet settings management.
 * Displays NavBar and ProphetSettingsPanel component.
 */
function Settings() {
  return (
    <div className="flex min-h-screen w-full bg-dashboard-gradient overflow-x-hidden">
      <NavBar />
      <main className="flex-1 min-w-0">
        <ProphetSettingsPanel />
      </main>
    </div>
  );
}

export default Settings;
