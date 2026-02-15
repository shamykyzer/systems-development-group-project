import React, { useState, useEffect } from 'react';

// API base URL configuration - uses environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

//comment
//save which preset should be used to train

// Default settings for Prophet forecasting model
const DEFAULT_SETTINGS = {
  growth: 'linear',                          // Growth type: 'linear' or 'logistic'
  changepoint_prior_scale: 0.05,             // Controls trend flexibility (0.001-0.5)
  seasonality_prior_scale: 10.0,             // Controls seasonality strength (0.1-100)
  seasonality_mode: 'multiplicative',        // How seasonality affects the trend
  daily_seasonality: false,                  // Enable/disable daily patterns
  weekly_seasonality: true,                  // Enable/disable weekly patterns
  yearly_seasonality: true,                  // Enable/disable yearly patterns
  forecast_periods: 365,                     // Number of days to forecast (1-730)
  floor_multiplier: 0.5,                     // Minimum constraint (0-0.95)
  cap_multiplier: 1.5,                       // Maximum constraint (1.1-5.0)
  custom_seasonality_enabled: false,         // Toggle custom seasonality
  custom_seasonality_name: '',               // Name of custom seasonality
  custom_seasonality_period: 30.5,           // Period in days for custom seasonality (7-365)
  custom_seasonality_fourier_order: 3,       // Fourier order for custom seasonality (1-20)
  n_changepoints: 25,                        // Number of potential changepoints (5-50)
  changepoint_range: 0.8,                    // Proportion of history for changepoints (0.6-0.95)
  interval_width: 0.80,                      // Prediction interval width (0.50-0.99)
  holidays_prior_scale: 10.0,                // How much holidays affect predictions (0.1-100)
  holidays: []                               // Selected holidays for the model
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
   * Tooltip component for parameter descriptions
   */
  const TooltipIcon = ({ text }) => (
    <span className="inline-block group relative cursor-pointer">
      <svg className="w-4 h-4 inline text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
      <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out absolute right-[-8px] top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </span>
    </span>
  );

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
          custom_seasonality_fourier_order: data.custom_seasonality_fourier_order,
          n_changepoints: data.n_changepoints ?? 25,
          changepoint_range: data.changepoint_range ?? 0.8,
          interval_width: data.interval_width ?? 0.80,
          holidays_prior_scale: data.holidays_prior_scale ?? 10.0,
          holidays: data.holidays ?? []
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
   * Prevents scroll wheel from changing number input values
   */
  const handleNumberScroll = (e) => {
    e.target.blur();
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
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Growth Type <span className="text-gray-500 text-xs">(Linear or Logistic)</span></span>
              <TooltipIcon text={"Linear: Assumes unbounded growth. Best for most bakery sales without natural limits.\n\nLogistic: Used when there's a maximum capacity (saturating growth), requires setting cap_multiplier."} />
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
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Seasonality Mode <span className="text-gray-500 text-xs">(Multiplicative or Additive)</span></span>
              <TooltipIcon text={"Multiplicative: Seasonal effects scale with the trend (e.g., 20% increase during holidays).\n\nAdditive: Fixed seasonal effect regardless of trend level."} />
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
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Changepoint Prior Scale <span className="text-gray-500 text-xs">(0.001 - 0.5)</span></span>
              <TooltipIcon text={"Controls how flexible the trend is at changepoints.\n\nLower values (0.001-0.05) create smoother, more conservative trends.\n\nHigher values (0.1-0.5) allow more dramatic trend changes."} />
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="0.5"
              value={settings.changepoint_prior_scale}
              onChange={(e) => handleInputChange('changepoint_prior_scale', parseFloat(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Seasonality Prior Scale - controls strength of seasonal components */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Seasonality Prior Scale <span className="text-gray-500 text-xs">(0.1 - 100)</span></span>
              <TooltipIcon text={"Controls the strength of seasonal patterns (weekly, yearly).\n\nHigher values (20-100) allow stronger seasonal effects.\n\nLower values (0.1-5) dampen seasonality for smoother predictions."} />
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={settings.seasonality_prior_scale}
              onChange={(e) => handleInputChange('seasonality_prior_scale', parseFloat(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Forecast Periods - how many days into the future to predict */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Forecast Periods <span className="text-gray-500 text-xs">(1 - 730 days)</span></span>
              <TooltipIcon text={"Number of days to forecast into the future.\n\nLonger forecasts have wider uncertainty intervals.\n\nMaximum 730 days (2 years)."} />
            </label>
            <input
              type="number"
              min="1"
              max="730"
              value={settings.forecast_periods}
              onChange={(e) => handleInputChange('forecast_periods', parseInt(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Interval Width - uncertainty prediction interval */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Interval Width <span className="text-gray-500 text-xs">(0.50 - 0.99)</span></span>
              <TooltipIcon text={"Confidence level for prediction intervals.\n\n0.80 (80%) means 80% confidence the actual sales will fall within the predicted range.\n\nDoes not affect the main prediction, only the uncertainty bounds."} />
            </label>
            <input
              type="number"
              step="0.05"
              min="0.50"
              max="0.99"
              value={settings.interval_width}
              onChange={(e) => handleInputChange('interval_width', parseFloat(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Floor Multiplier - sets minimum value constraint for logistic growth */}
          {settings.growth === 'logistic' && (
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Floor Multiplier <span className="text-gray-500 text-xs">(0 - 0.95)</span></span>
                <TooltipIcon text={"Minimum sales constraint as a proportion of historical data. 0.5 means sales won't drop below 50% of baseline.\n\nLower values allow bigger drops; higher values enforce a safety threshold.\n\nNot used with linear growth."} />
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.95"
                value={settings.floor_multiplier}
                onChange={(e) => handleInputChange('floor_multiplier', parseFloat(e.target.value))}
                onWheel={handleNumberScroll}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Cap Multiplier - sets maximum value constraint for logistic growth */}
          {settings.growth === 'logistic' && (
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Cap Multiplier <span className="text-gray-500 text-xs">(1.1 - 5.0)</span></span>
                <TooltipIcon text={"Maximum sales capacity as a proportion of historical peak. 1.5 means sales can't exceed 150% of historical maximum.\n\nUse 1.2-2.0 for established bakeries with physical constraints. Higher values (2.0-5.0) for growing businesses.\n\nNot used with linear growth."} />
              </label>
              <input
                type="number"
                step="0.1"
                min="1.1"
                max="5.0"
                value={settings.cap_multiplier}
                onChange={(e) => handleInputChange('cap_multiplier', parseFloat(e.target.value))}
                onWheel={handleNumberScroll}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Number of Changepoints - potential trend breaks */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Number of Changepoints <span className="text-gray-500 text-xs">(5 - 50)</span></span>
              <TooltipIcon text={"Number of potential points where the trend can change direction.\n\nDefault 25 works for most cases.\n\nUse fewer (10-15) for stable businesses with consistent growth.\n\nUse more (30-50) for volatile periods.\n\nMore changepoints = more flexible but potentially overfits."} />
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={settings.n_changepoints}
              onChange={(e) => handleInputChange('n_changepoints', parseInt(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Changepoint Range - proportion of history for fitting changepoints */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Changepoint Range <span className="text-gray-500 text-xs">(0.6 - 0.95)</span></span>
              <TooltipIcon text={"Proportion of historical data where changepoints can occur.\n\nDefault 0.80 means changepoints only in first 80% of data, preventing overfitting to recent noise.\n\nUse 0.90-0.95 if recent changes are important (new menu, expansion).\n\nUse 0.60-0.75 for more stable, conservative forecasts."} />
            </label>
            <input
              type="number"
              step="0.05"
              min="0.6"
              max="0.95"
              value={settings.changepoint_range}
              onChange={(e) => handleInputChange('changepoint_range', parseFloat(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Holidays Prior Scale - impact of holidays on predictions */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Holidays Prior Scale <span className="text-gray-500 text-xs">(0.1 - 100)</span></span>
              <TooltipIcon text={"Controls how much selected holidays affect predictions.\n\nHigher values (20-100) create larger holiday spikes.\n\nLower values (1-10) give subtle holiday effects.\n\nRequires holidays to be selected below."} />
            </label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              max="100"
              value={settings.holidays_prior_scale}
              onChange={(e) => handleInputChange('holidays_prior_scale', parseFloat(e.target.value))}
              onWheel={handleNumberScroll}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Seasonality component toggles section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-medium text-gray-800">
              Seasonality Components
            </h3>
            <TooltipIcon text={"Enable seasonal patterns in your forecast.\n\nDaily: patterns within a day (peak hours for bakery).\n\nWeekly: day-of-week effects (weekend vs weekday).\n\nYearly: seasonal patterns across the year (summer slump, winter holidays)."} />
          </div>
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

        {/* Holidays selection section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-medium text-gray-800">
              Holidays & Events
            </h3>
            <TooltipIcon text={"Select holidays that create predictable sales spikes or dips for your bakery. Prophet will learn the typical effect of each holiday from historical data and apply it to future forecasts.\n\nStrength controlled by Holidays Prior Scale above."} />
          </div>
          <p className="text-sm text-gray-600 mb-4">Select holidays that significantly impact bakery sales</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'New Year\'s Day',
              'Valentine\'s Day',
              'Easter',
              'Mother\'s Day',
              'Memorial Day',
              'Father\'s Day',
              'Independence Day',
              'Labor Day',
              'Halloween',
              'Thanksgiving',
              'Christmas Eve',
              'Christmas',
              'New Year\'s Eve',
              'Super Bowl Sunday',
              'Graduation Season',
              'Black Friday'
            ].map(holiday => (
              <label key={holiday} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.holidays?.includes(holiday) || false}
                  onChange={(e) => {
                    const currentHolidays = settings.holidays || [];
                    if (e.target.checked) {
                      handleInputChange('holidays', [...currentHolidays, holiday]);
                    } else {
                      handleInputChange('holidays', currentHolidays.filter(h => h !== holiday));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{holiday}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom seasonality configuration section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {/* Toggle to enable/disable custom seasonality */}
              <input
                type="checkbox"
                checked={settings.custom_seasonality_enabled}
                onChange={(e) => handleInputChange('custom_seasonality_enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <h3 className="text-base sm:text-lg font-medium text-gray-800 ml-3">
                Custom Seasonality
              </h3>
            </div>
            <TooltipIcon text={"Add custom seasonal patterns beyond daily/weekly/yearly.\n\nOnly enable if you have a specific recurring pattern not covered by standard seasonality."} />
          </div>
          
          {/* Custom seasonality fields - only shown when enabled */}
          {settings.custom_seasonality_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
              {/* Custom seasonality name input */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Name</span>
                  <TooltipIcon text="Descriptive name for your custom seasonality (e.g., 'monthly_promotion', 'biweekly_payday')." />
                </label>
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
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Period <span className="text-gray-500 text-xs">(7 - 365 days)</span></span>
                  <TooltipIcon text={"Length of the recurring cycle in days.\n\nMust be at least 7 days. Should be a pattern you observe repeating consistently in your sales data."} />
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="7"
                  max="365"
                  value={settings.custom_seasonality_period}
                  onChange={(e) => handleInputChange('custom_seasonality_period', parseFloat(e.target.value))}
                  onWheel={handleNumberScroll}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Fourier order - controls smoothness of custom seasonality */}
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Fourier Order <span className="text-gray-500 text-xs">(1 - 20)</span></span>
                  <TooltipIcon text={"Controls the complexity of the seasonal pattern.\n\nLower values (1-5) create smooth, simple patterns.\n\nHigher values (6-15) allow more complex, irregular patterns.\n\nMaximum 20, but values above 10 rarely needed."} />
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.custom_seasonality_fourier_order}
                  onChange={(e) => handleInputChange('custom_seasonality_fourier_order', parseInt(e.target.value))}
                  onWheel={handleNumberScroll}
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
