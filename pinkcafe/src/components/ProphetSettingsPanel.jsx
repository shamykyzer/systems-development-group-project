import React, { useState, useEffect } from 'react';

// API base URL configuration - uses environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

//choose what settings to show
//add tool tips and ranges
//comment
//check error handeling and ranges
//save which preset should be used to train

// Default settings for Prophet forecasting model
const DEFAULT_SETTINGS = {
  growth: 'linear',                          // Growth type: 'linear' or 'logistic'
  changepoint_prior_scale: 0.05,             // Controls trend flexibility (0.001-0.5)
  seasonality_prior_scale: 10.0,             // Controls seasonality strength (0.01-50)
  seasonality_mode: 'multiplicative',        // How seasonality affects the trend
  daily_seasonality: false,                  // Enable/disable daily patterns
  weekly_seasonality: true,                  // Enable/disable weekly patterns
  yearly_seasonality: true,                  // Enable/disable yearly patterns
  forecast_periods: 365,                     // Number of days to forecast (1-730)
  floor_multiplier: 0.5,                     // Minimum constraint (0-1)
  cap_multiplier: 1.5,                       // Maximum constraint (1-3)
  custom_seasonality_enabled: false,         // Toggle custom seasonality
  custom_seasonality_name: '',               // Name of custom seasonality
  custom_seasonality_period: 30.5,           // Period in days for custom seasonality
  custom_seasonality_fourier_order: 3        // Fourier order for custom seasonality (1-20)
};

/**
 * ProphetSettingsPanel Component
 * 
 * Provides a user interface for configuring Facebook Prophet forecasting model parameters.
 * Users can create, select, modify, and delete presets with different configurations
 * for training Prophet models.
 */
function ProphetSettingsPanel() {
  // State: Currently selected preset name
  const [selectedPreset, setSelectedPreset] = useState('Default');
  
  // State: New preset name for creating a new preset
  const [newPresetName, setNewPresetName] = useState('');
  
  // State: Show/hide create preset dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // State: Creation mode - 'new' for default settings, 'duplicate' for current settings
  const [creationMode, setCreationMode] = useState('new');
  
  // State: Model configuration settings with default values
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // State: Saved settings to track unsaved changes
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  
  // State: Loading indicator for async operations
  const [loading, setLoading] = useState(false);
  
  // State: User feedback messages (success, error, info)
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State: List of available presets fetched from the backend
  const [availablePresets, setAvailablePresets] = useState([]);

  // Effect: Fetch available presets when component first mounts
  useEffect(() => {
    fetchAvailablePresets();
  }, []);

  // Effect: Fetch preset settings whenever the selected preset changes
  useEffect(() => {
    if (selectedPreset) {
      fetchPresetSettings(selectedPreset);
    }
  }, [selectedPreset]);

  // Computed: Check if there are unsaved changes
  const hasUnsavedChanges = !showCreateDialog && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  /**
   * Fetches the list of available presets from the backend API
   * Populates the preset dropdown selector
   */
  const fetchAvailablePresets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets`);
      const data = await response.json();
      
      // Extract preset names from the response array
      if (Array.isArray(data)) {
        setAvailablePresets(data.map(preset => preset.preset_name));
        if (data.length > 0 && !selectedPreset) {
          setSelectedPreset(data[0].preset_name);
        }
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
      setMessage({ type: 'error', text: 'Failed to load available presets' });
    }
  };

  /**
   * Fetches the current settings for a specific preset from the backend
   * 
   * @param {string} presetName - The name of the preset to fetch settings for
   */
  const fetchPresetSettings = async (presetName) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets/${presetName}`);
      const data = await response.json();
      
      if (response.ok) {
        // Update settings state with fetched data from backend, converting integers to booleans for checkboxes
        const loadedSettings = {
          growth: data.growth,
          changepoint_prior_scale: data.changepoint_prior_scale,
          seasonality_prior_scale: data.seasonality_prior_scale,
          seasonality_mode: data.seasonality_mode,
          daily_seasonality: Boolean(data.daily_seasonality),
          weekly_seasonality: Boolean(data.weekly_seasonality),
          yearly_seasonality: Boolean(data.yearly_seasonality),
          forecast_periods: data.forecast_periods,
          floor_multiplier: data.floor_multiplier,
          cap_multiplier: data.cap_multiplier,
          custom_seasonality_enabled: Boolean(data.custom_seasonality_enabled),
          custom_seasonality_name: data.custom_seasonality_name,
          custom_seasonality_period: data.custom_seasonality_period,
          custom_seasonality_fourier_order: data.custom_seasonality_fourier_order
        };
        setSettings(loadedSettings);
        setSavedSettings(loadedSettings); // Update saved settings
        setMessage({ type: '', text: '' }); // Clear any previous messages
      }
    } catch (error) {
      console.error('Error fetching preset settings:', error);
      setMessage({ type: 'error', text: 'Failed to load preset settings' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates a single field in the settings state
   * 
   * @param {string} field - The field name to update
   * @param {*} value - The new value for the field
   */
  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Saves the current settings to the backend via PUT request
   * Displays success or error message based on the result
   */
  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSavedSettings(settings); // Update saved settings after successful save
        setMessage({ type: 'success', text: `Preset '${selectedPreset}' saved successfully!` });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save preset' });
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      setMessage({ type: 'error', text: 'Failed to save preset. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the create dialog in 'new' mode (with default settings)
   */
  const handleNewPreset = () => {
    setCreationMode('new');
    setShowCreateDialog(true);
    setNewPresetName('');
    setSettings(DEFAULT_SETTINGS); // Populate fields with default settings
  };

  /**
   * Opens the create dialog in 'duplicate' mode (with current settings)
   * Reloads the preset settings from the backend to ensure we're duplicating saved values
   */
  const handleDuplicatePreset = async () => {
    setCreationMode('duplicate');
    setShowCreateDialog(true);
    setNewPresetName('');
    // Refetch the current preset settings to ensure we're duplicating the saved values
    await fetchPresetSettings(selectedPreset);
  };

  /**
   * Cancels the preset creation and returns to normal view
   */
  const handleCancelCreate = () => {
    setShowCreateDialog(false);
    setNewPresetName('');
    setMessage({ type: '', text: '' });
  };

  /**
   * Creates a new preset based on the creation mode
   */
  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a preset name' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Always use current settings (which may have been modified by the user)
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preset_name: newPresetName,
          ...settings
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const modeText = creationMode === 'new' ? 'created with default settings' : 'duplicated';
        setMessage({ type: 'success', text: `Preset '${newPresetName}' ${modeText} successfully!` });
        setNewPresetName('');
        setShowCreateDialog(false);
        setCreationMode('new');
        await fetchAvailablePresets();
        setSelectedPreset(newPresetName);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create preset' });
      }
    } catch (error) {
      console.error('Error creating preset:', error);
      setMessage({ type: 'error', text: 'Failed to create preset. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes the currently selected preset
   */
  const handleDeletePreset = async () => {
    if (selectedPreset === 'Default') {
      setMessage({ type: 'error', text: 'Cannot delete the Default preset' });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the preset '${selectedPreset}'?`)) {
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Preset '${selectedPreset}' deleted successfully!` });
        await fetchAvailablePresets();
        setSelectedPreset('Default');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete preset' });
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      setMessage({ type: 'error', text: 'Failed to delete preset. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets settings to default values and saves them to the backend
   */
  const handleResetToDefaults = async () => {
    if (!window.confirm(`Are you sure you want to reset settings to defaults for preset '${selectedPreset}'?`)) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Reset to default settings
      setSettings(DEFAULT_SETTINGS);
      
      // Save the default settings to the backend
      const response = await fetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(DEFAULT_SETTINGS)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSavedSettings(DEFAULT_SETTINGS); // Update saved settings after reset
        setMessage({ type: 'success', text: `Preset '${selectedPreset}' reset to defaults and saved successfully!` });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save default settings' });
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      setMessage({ type: 'error', text: 'Failed to reset and save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:ml-64 md:p-8 transition-all duration-300">
    <div className="mt-16 md:mt-0">
    <div className="max-w-4xl mx-auto ml-0">
      {/* Page header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Prophet Preset Settings</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Create and manage presets for Prophet forecasting</p>

      {/* Status message display - shows success, error, or info messages */}
      {message.text && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Preset selection and management */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || showCreateDialog}
            >
              {/* Populate dropdown with available presets */}
              {availablePresets.map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
          
          {/* Preset action buttons */}
          <div className="flex gap-2 sm:pt-7">
            <button
              onClick={handleNewPreset}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-medium rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              title="Create new preset with default settings"
            >
              <img src="/icons/plus-solid-full.svg" alt="" className="w-4 h-4 brightness-0 invert" />
              New
            </button>
            
            <button
              onClick={handleDuplicatePreset}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              title="Duplicate current preset"
            >
              <img src="/icons/clone-solid-full.svg" alt="" className="w-4 h-4 brightness-0 invert" />
              Duplicate
            </button>
            
            <button
              onClick={handleDeletePreset}
              disabled={loading || selectedPreset === 'Default' || showCreateDialog}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={selectedPreset === 'Default' ? 'Cannot delete Default preset' : 'Delete preset'}
            >
              <img src="/icons/trash-solid-full.svg" alt="" className="w-4 h-4 brightness-0 invert" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main settings configuration form */}
      <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 ${
        showCreateDialog ? `border-2 ${creationMode === 'new' ? 'border-green-500' : 'border-blue-500'}` : ''
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {showCreateDialog 
              ? (creationMode === 'new' ? 'Create New Preset' : 'Duplicate Preset')
              : 'Preset Configuration'}
          </h2>
          {hasUnsavedChanges && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold rounded-full border border-yellow-300">
              Unsaved Changes
            </span>
          )}
        </div>
        
        {/* Preset name input - shown when creating */}
        {showCreateDialog && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preset Name
            </label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePreset()}
            />
            <p className="text-sm text-gray-500 mt-2">
              {creationMode === 'new' 
                ? 'The preset will be created with default settings shown below.' 
                : `The preset will be created with the current settings from '${selectedPreset}'.`}
            </p>
          </div>
        )}
        
        {/* Two-column grid layout for configuration inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Growth Type selector - determines how the trend grows over time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Growth Type
              <span className="text-gray-500 text-xs ml-2">(Linear or Logistic)</span>
            </label>
            <select
              value={settings.growth}
              onChange={(e) => handleInputChange('growth', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="linear">Linear</option>
              <option value="logistic">Logistic</option>
            </select>
          </div>

          {/* Seasonality Mode - how seasonal effects combine with trend */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seasonality Mode
              <span className="text-gray-500 text-xs ml-2">(Multiplicative or Additive)</span>
            </label>
            <select
              value={settings.seasonality_mode}
              onChange={(e) => handleInputChange('seasonality_mode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="multiplicative">Multiplicative</option>
              <option value="additive">Additive</option>
            </select>
          </div>

          {/* Changepoint Prior Scale - controls how flexible the trend is */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Changepoint Prior Scale
              <span className="text-gray-500 text-xs ml-2">(0.001 - 0.5)</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="0.5"
              value={settings.changepoint_prior_scale}
              onChange={(e) => handleInputChange('changepoint_prior_scale', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Controls trend flexibility. Lower = smoother</p>
          </div>

          {/* Seasonality Prior Scale - controls strength of seasonal components */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seasonality Prior Scale
              <span className="text-gray-500 text-xs ml-2">(0.01 - 50)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.01"
              max="50"
              value={settings.seasonality_prior_scale}
              onChange={(e) => handleInputChange('seasonality_prior_scale', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Controls seasonality strength</p>
          </div>

          {/* Forecast Periods - how many days into the future to predict */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Periods (days)
              <span className="text-gray-500 text-xs ml-2">(1 - 730)</span>
            </label>
            <input
              type="number"
              min="1"
              max="730"
              value={settings.forecast_periods}
              onChange={(e) => handleInputChange('forecast_periods', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Floor Multiplier - sets minimum value constraint for logistic growth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor Multiplier
              <span className="text-gray-500 text-xs ml-2">(0 - 1)</span>
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={settings.floor_multiplier}
              onChange={(e) => handleInputChange('floor_multiplier', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum value constraint multiplier</p>
          </div>

          {/* Cap Multiplier - sets maximum value constraint for logistic growth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cap Multiplier
              <span className="text-gray-500 text-xs ml-2">(1 - 3)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="3"
              value={settings.cap_multiplier}
              onChange={(e) => handleInputChange('cap_multiplier', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum value constraint multiplier</p>
          </div>
        </div>

        {/* Seasonality component toggles section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-4">Seasonality Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily seasonality toggle */}
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.daily_seasonality}
                onChange={(e) => handleInputChange('daily_seasonality', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Daily Seasonality</span>
            </label>
            
            {/* Weekly seasonality toggle */}
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.weekly_seasonality}
                onChange={(e) => handleInputChange('weekly_seasonality', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Weekly Seasonality</span>
            </label>
            
            {/* Yearly seasonality toggle */}
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.yearly_seasonality}
                onChange={(e) => handleInputChange('yearly_seasonality', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Yearly Seasonality</span>
            </label>
          </div>
        </div>

        {/* Custom seasonality configuration section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center mb-4">
            {/* Toggle to enable/disable custom seasonality */}
            <input
              type="checkbox"
              checked={settings.custom_seasonality_enabled}
              onChange={(e) => handleInputChange('custom_seasonality_enabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <h3 className="text-base sm:text-lg font-medium text-gray-800 ml-3">Custom Seasonality</h3>
          </div>
          
          {/* Custom seasonality fields - only shown when enabled */}
          {settings.custom_seasonality_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
              {/* Custom seasonality name input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={settings.custom_seasonality_name}
                  onChange={(e) => handleInputChange('custom_seasonality_name', e.target.value)}
                  placeholder="e.g., monthly"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Custom seasonality period (in days) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period (days)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.custom_seasonality_period}
                  onChange={(e) => handleInputChange('custom_seasonality_period', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Fourier order - controls smoothness of custom seasonality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fourier Order</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.custom_seasonality_fourier_order}
                  onChange={(e) => handleInputChange('custom_seasonality_fourier_order', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-wrap gap-4">
          {showCreateDialog ? (
            /* Create/Duplicate mode buttons */
            <>
              <button
                onClick={handleCreatePreset}
                disabled={loading || !newPresetName.trim()}
                className={`flex-1 min-w-0 text-white text-sm sm:text-base font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  creationMode === 'new'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Creating...' : (creationMode === 'new' ? 'Create Preset' : 'Duplicate Preset')}
              </button>
              
              <button
                onClick={handleCancelCreate}
                disabled={loading}
                className="flex-1 min-w-0 bg-gray-500 hover:bg-gray-600 text-white text-sm sm:text-base font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          ) : (
            /* Normal mode buttons */
            <>
              {/* Save settings button */}
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className={`flex-1 min-w-0 text-white text-sm sm:text-base font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasUnsavedChanges ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                }`}
              >
                {loading ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes' : 'Save Preset')}
              </button>
              
              {/* Reset to defaults button */}
              <button
                onClick={handleResetToDefaults}
                disabled={loading}
                className="flex-1 min-w-0 bg-gray-500 hover:bg-gray-600 text-white text-sm sm:text-base font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset to Defaults
              </button>
            </>
          )}
        </div>
        
        {/* Informational note about model retraining */}
        {!showCreateDialog && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After updating a preset, you'll need to retrain Prophet using that preset for changes to take effect.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>  
    </div>
  );
}

export default ProphetSettingsPanel;
