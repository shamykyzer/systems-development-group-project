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
    <div className="flex min-h-screen bg-[linear-gradient(to_bottom,#f5dce0_0%,#efd2d6_12%,#e8c8cc_25%,#e0bcc0_38%,#d8b0b4_50%,#d0a4a8_62%,#c9989c_75%,#c18c90_88%,#b98084_100%)]">
      <NavBar />
      <ProphetSettingsPanel />
    </div>
  );
}

export default Settings;