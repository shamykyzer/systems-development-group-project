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
    <div className="flex min-h-screen bg-pinkcafe">
      <NavBar />
      <ProphetSettingsPanel />
    </div>
  );
}

export default Settings;