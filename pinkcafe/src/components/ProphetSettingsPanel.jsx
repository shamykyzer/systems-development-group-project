import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCog, FaPlus, FaCopy, FaTrashAlt, FaChartLine, FaChartBar, FaCalendarAlt } from 'react-icons/fa';
import { Toggle, TooltipIcon, SettingField, ToggleCard } from './shared/SharedComponents';

import { API_BASE_URL } from '../config/constants';
import { authFetch } from '../utils/apiUtils';

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
  enable_cap: true,                          // Toggle cap constraint (logistic)
  enable_floor: true,                        // Toggle floor constraint (logistic)
  custom_seasonality_enabled: false,         // Toggle custom seasonality
  custom_seasonality_name: '',               // Name of custom seasonality
  custom_seasonality_period: 30.5,           // Period in days for custom seasonality (7-365)
  custom_seasonality_fourier_order: 3,       // Fourier order for custom seasonality (1-20)
  n_changepoints: 25,                        // Number of potential changepoints (5-50)
  changepoint_range: 0.8,                    // Proportion of history for changepoints (0.6-0.95)
  interval_width: 0.80,                      // Prediction interval width (0.50-0.99)
  holidays_prior_scale: 10.0,                // How much holidays affect predictions (0.1-100)
  include_public_holidays: true,              // Master toggle for holiday effects
  country: 'United Kingdom',                  // Country for national holidays
  holidays: []                               // Selected holidays for the model
};

const HOLIDAY_OPTIONS = [
  'New Year\'s Day', 'Valentine\'s Day', 'Easter', 'Bank Holiday', 'Mother\'s Day', 'Father\'s Day',
  'Summer Solstice', 'Halloween', 'Diwali', 'Christmas Eve', 'Christmas', 'Christmas Day', 'Boxing Day', 'New Year\'s Eve',
  'Memorial Day', 'Independence Day', 'Labor Day', 'Thanksgiving', 'Super Bowl Sunday', 'Graduation Season', 'Black Friday'
];

const COUNTRY_OPTIONS = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France', 'Ireland'];

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

  /**
   * Fetches the list of available presets from the backend API
   * Also retrieves and sets the currently active preset as the selected one
   */
  const fetchAvailablePresets = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvailablePresets(data.map(preset => preset.preset_name));
        const activeResponse = await authFetch(`${API_BASE_URL}/api/prophet/active-preset`);
        const activeData = await activeResponse.json();
        if (activeData.preset_name) {
          setSelectedPreset(activeData.preset_name);
        } else if (data.length > 0) {
          setSelectedPreset(data[0].preset_name);
        }
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
      setMessage({ type: 'error', text: 'Failed to load available presets' });
    }
  }, []);

  // Effect: Fetch available presets when component first mounts
  useEffect(() => {
    fetchAvailablePresets();
  }, [fetchAvailablePresets]);

  // Effect: Fetch preset settings whenever the selected preset changes
  useEffect(() => {
    if (selectedPreset) {
      fetchPresetSettings(selectedPreset);
    }
  }, [selectedPreset]);

  // Computed: Check if there are unsaved changes
  const hasUnsavedChanges = !showCreateDialog && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  /**
   * Updates the active preset in the backend
   * Marks the specified preset as active in the database so it persists across sessions
   * 
   * @param {string} presetName - The name of the preset to set as active
   */
  const updateActivePreset = async (presetName) => {
    try {
      await authFetch(`${API_BASE_URL}/api/prophet/active-preset`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preset_name: presetName })
      });
    } catch (error) {
      console.error('Error updating active preset:', error);
    }
  };

  /**
   * Handles preset selection change from dropdown
   * Updates both the local state and persists the selection to the backend
   * 
   * @param {string} presetName - The name of the newly selected preset
   */
  const handlePresetChange = async (presetName) => {
    setSelectedPreset(presetName);
    await updateActivePreset(presetName);
  };

  /**
   * Fetches the current settings for a specific preset from the backend
   * 
   * @param {string} presetName - The name of the preset to fetch settings for
   */
  const fetchPresetSettings = async (presetName) => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets/${presetName}`);
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
          enable_cap: data.enable_cap ?? true,
          enable_floor: data.enable_floor ?? true,
          custom_seasonality_enabled: Boolean(data.custom_seasonality_enabled),
          custom_seasonality_name: data.custom_seasonality_name,
          custom_seasonality_period: data.custom_seasonality_period,
          custom_seasonality_fourier_order: data.custom_seasonality_fourier_order,
          n_changepoints: data.n_changepoints ?? 25,
          changepoint_range: data.changepoint_range ?? 0.8,
          interval_width: data.interval_width ?? 0.80,
          holidays_prior_scale: data.holidays_prior_scale ?? 10.0,
          include_public_holidays: data.include_public_holidays ?? true,
          country: data.country ?? 'United Kingdom',
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
    const payload = { ...settings };
    if (!payload.include_public_holidays) payload.holidays = [];
    if (payload.growth === 'logistic') {
      if (!payload.enable_cap) payload.cap_multiplier = 5.0;
      if (!payload.enable_floor) payload.floor_multiplier = 0;
    }
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
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
   * Mode 'new' uses default settings, mode 'duplicate' uses current preset settings
   * After creation, automatically sets the new preset as active and switches to it
   */
  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a preset name' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const createPayload = { preset_name: newPresetName, ...settings };
      if (!createPayload.include_public_holidays) createPayload.holidays = [];
      if (createPayload.growth === 'logistic') {
        if (!createPayload.enable_cap) createPayload.cap_multiplier = 5.0;
        if (!createPayload.enable_floor) createPayload.floor_multiplier = 0;
      }
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const modeText = creationMode === 'new' ? 'created with default settings' : 'duplicated';
        setMessage({ type: 'success', text: `Preset '${newPresetName}' ${modeText} successfully!` });
        setNewPresetName('');
        setShowCreateDialog(false);
        setCreationMode('new');
        // Refresh preset list and set newly created preset as active
        await fetchAvailablePresets();
        await handlePresetChange(newPresetName);
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
   * Prevents deletion of the Default preset and switches to Default after successful deletion
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
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Preset '${selectedPreset}' deleted successfully!` });
        // Refresh preset list and switch to Default preset
        await fetchAvailablePresets();
        await handlePresetChange('Default');
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
      const response = await authFetch(`${API_BASE_URL}/api/prophet/presets/${selectedPreset}`, {
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
    <div className="ml-0 md:ml-64 flex-1 min-w-0 min-h-screen bg-dashboard-gradient p-4 md:p-8 transition-all duration-300">
      <div className="max-w-4xl mx-auto mt-16 md:mt-0">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-pinkcafe2/60 animate-fade-in">
        <Link to="/home" className="hover:text-pinkcafe2 transition-colors flex items-center gap-1">
          <FaHome className="text-xs" /> Home
        </Link>
        <span>/</span>
        <span className="text-pinkcafe2 font-medium">Settings</span>
      </nav>

      {/* Status message display - shows success, error, or info messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm sm:text-base border shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-pinkcafe2/10 text-pinkcafe2 border-pinkcafe2/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Preset selection and management - card with landing page style */}
      <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 mb-6 animate-fade-in-up animate-delay-75">
        <div className="bg-pinkcafe2 px-4 md:px-6 py-3 flex items-center gap-2">
          <FaCog className="text-white text-lg" />
          <h2 className="text-lg md:text-xl font-bold text-white">Preset Management</h2>
        </div>
        <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-pinkcafe2/80 mb-2">
              Select Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-4 py-2 border border-pinkcafe2/20 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50 focus:border-pinkcafe2/50 bg-white"
              disabled={loading || showCreateDialog}
            >
              {/* Populate dropdown with available presets */}
              {availablePresets.map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
          
          {/* Preset action buttons */}
          <div className="flex flex-wrap gap-3 sm:pt-7">
            <button
              onClick={handleNewPreset}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              title="Create new preset with default settings"
            >
              <FaPlus className="w-4 h-4" />
              New
            </button>
            
            <button
              onClick={handleDuplicatePreset}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pinkcafe2 hover:bg-pinkcafe2/90 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              title="Duplicate current preset"
            >
              <FaCopy className="w-4 h-4" />
              Duplicate
            </button>
            
            <button
              onClick={handleDeletePreset}
              disabled={loading || selectedPreset === 'Default' || showCreateDialog}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedPreset === 'Default' ? 'Cannot delete Default preset' : 'Delete preset'}
            >
              <FaTrashAlt className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Main settings configuration form - card with landing page style */}
      <div className={`rounded-xl overflow-hidden shadow-sm border transition-all duration-300 mb-6 animate-scale-in animate-delay-150 ${
        showCreateDialog ? `border-2 ${creationMode === 'new' ? 'border-emerald-500' : 'border-pinkcafe2'}` : 'border-pinkcafe2/10 hover:shadow-lg hover:-translate-y-0.5'
      }`}>
        <div className="bg-pinkcafe2 px-4 md:px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {showCreateDialog 
              ? (creationMode === 'new' ? 'Create New Preset' : 'Duplicate Preset')
              : 'Preset Configuration'}
          </h2>
          {hasUnsavedChanges && (
            <span className="px-3 py-1 bg-pinkcafe2/20 text-pinkcafe2 text-xs sm:text-sm font-semibold rounded-full border border-pinkcafe2/40">
              Unsaved Changes
            </span>
          )}
        </div>
        <div className="bg-white p-4 sm:p-6">
        
        {/* Preset name input - only shown when creating/duplicating a preset */}
        {showCreateDialog && (
          <div className="mb-6 p-4 bg-pinkcafe2/5 rounded-xl border border-pinkcafe2/10">
            <label className="block text-sm font-semibold text-pinkcafe2/80 mb-2">
              Preset Name
            </label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-4 py-2 border border-pinkcafe2/20 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50 focus:border-pinkcafe2/50"
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePreset()} // Allow Enter key to submit
            />
            <p className="text-sm text-pinkcafe2/60 mt-2">
              {creationMode === 'new' 
                ? 'The preset will be created with default settings shown below.' 
                : `The preset will be created with the current settings from '${selectedPreset}'.`}
            </p>
          </div>
        )}
        
        {/* Two-column grid layout for configuration inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Growth Model - ClaudeRevamp 2-card layout */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium text-pinkcafe2/80 flex items-center gap-1">
                How should the overall trend of your data grow over time?
                <TooltipIcon text={"Linear: Assumes unbounded growth. Best for most bakery sales without natural limits.\n\nLogistic: Used when there's a maximum capacity (saturating growth), requires setting cap_multiplier."} />
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['linear', FaChartLine, 'Uncapped growth — trend can rise or fall without limit'],
                ['logistic', FaChartBar, 'S-curve growth — levels off at a cap value. Requires setting a maximum'],
              ].map(([val, Icon, desc]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleInputChange('growth', val)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 ${
                    settings.growth === val
                      ? 'bg-pinkcafe/50 border-2 border-pinkcafe2 shadow-md scale-[1.02]'
                      : 'bg-white border border-gray-200 hover:border-pinkcafe2/40 hover:shadow-sm hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <Icon className={`text-lg flex-shrink-0 ${settings.growth === val ? 'text-pinkcafe2' : 'text-gray-500'}`} />
                    <p className={`font-bold text-sm capitalize ${settings.growth === val ? 'text-pinkcafe2' : 'text-gray-700'}`}>
                      {val}
                    </p>
                  </div>
                  <p className="text-xs pl-9 text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Seasonality Mode - how seasonal effects combine with trend */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-pinkcafe2/80 mb-2">
              <span>Seasonality Mode <span className="text-pinkcafe2/50 text-xs">(Multiplicative or Additive)</span></span>
              <TooltipIcon text={"Multiplicative: Seasonal effects scale with the trend (e.g., 20% increase during holidays).\n\nAdditive: Fixed seasonal effect regardless of trend level."} />
            </label>
            <select
              value={settings.seasonality_mode}
              onChange={(e) => handleInputChange('seasonality_mode', e.target.value)}
              className="w-full px-4 py-2 border border-pinkcafe2/20 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50 focus:border-pinkcafe2/50"
            >
              <option value="multiplicative">Multiplicative</option>
              <option value="additive">Additive</option>
            </select>
          </div>

          {/* Changepoint Prior Scale - controls how flexible the trend is */}
          <SettingField
            label="Changepoint Prior Scale" range="0.001 - 0.5"
            tooltip={"Controls how flexible the trend is at changepoints.\n\nLower values (0.001-0.05) create smoother, more conservative trends.\n\nHigher values (0.1-0.5) allow more dramatic trend changes."}
            value={settings.changepoint_prior_scale} onChange={(v) => handleInputChange('changepoint_prior_scale', v)}
            step={0.001} min={0.001} max={0.5} onWheel={handleNumberScroll}
          />

          {/* Seasonality Prior Scale - controls strength of seasonal components */}
          <SettingField
            label="Seasonality Prior Scale" range="0.1 - 100"
            tooltip={"Controls the strength of seasonal patterns (weekly, yearly).\n\nHigher values (20-100) allow stronger seasonal effects.\n\nLower values (0.1-5) dampen seasonality for smoother predictions."}
            value={settings.seasonality_prior_scale} onChange={(v) => handleInputChange('seasonality_prior_scale', v)}
            step={0.1} min={0.1} max={100} onWheel={handleNumberScroll}
          />

          {/* Forecast Periods - how many days into the future to predict */}
          <SettingField
            label="Forecast Periods" range="1 - 730 days"
            tooltip={"Number of days to forecast into the future.\n\nLonger forecasts have wider uncertainty intervals.\n\nMaximum 730 days (2 years)."}
            value={settings.forecast_periods} onChange={(v) => handleInputChange('forecast_periods', v)}
            min={1} max={730} parse="int" onWheel={handleNumberScroll}
          />

          {/* Interval Width - uncertainty prediction interval */}
          <SettingField
            label="Interval Width" range="0.50 - 0.99"
            tooltip={"Confidence level for prediction intervals.\n\n0.80 (80%) means 80% confidence the actual sales will fall within the predicted range.\n\nDoes not affect the main prediction, only the uncertainty bounds."}
            value={settings.interval_width} onChange={(v) => handleInputChange('interval_width', v)}
            step={0.05} min={0.50} max={0.99} onWheel={handleNumberScroll}
          />

          {/* Enable Cap / Enable Floor - logistic only */}
          {settings.growth === 'logistic' && (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToggleCard checked={settings.enable_cap} onChange={(v) => handleInputChange('enable_cap', v)} label="Enable Cap" desc="Maximum saturation value">
                {settings.enable_cap && (
                  <div className="mt-3">
                    <input type="number" step="0.1" min="1.1" max="5.0" value={settings.cap_multiplier}
                      onChange={(e) => handleInputChange('cap_multiplier', parseFloat(e.target.value))}
                      onWheel={handleNumberScroll} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50" />
                  </div>
                )}
              </ToggleCard>
              <ToggleCard checked={settings.enable_floor} onChange={(v) => handleInputChange('enable_floor', v)} label="Enable Floor" desc="Minimum saturation value">
                {settings.enable_floor && (
                  <div className="mt-3">
                    <input type="number" step="0.05" min="0" max="0.95" value={settings.floor_multiplier}
                      onChange={(e) => handleInputChange('floor_multiplier', parseFloat(e.target.value))}
                      onWheel={handleNumberScroll} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50" />
                  </div>
                )}
              </ToggleCard>
            </div>
          )}

          {/* Number of Changepoints - potential trend breaks */}
          <SettingField
            label="Number of Changepoints" range="5 - 50"
            tooltip={"Number of potential points where the trend can change direction.\n\nDefault 25 works for most cases.\n\nUse fewer (10-15) for stable businesses with consistent growth.\n\nUse more (30-50) for volatile periods.\n\nMore changepoints = more flexible but potentially overfits."}
            value={settings.n_changepoints} onChange={(v) => handleInputChange('n_changepoints', v)}
            min={5} max={50} parse="int" onWheel={handleNumberScroll}
          />

          {/* Changepoint Range - proportion of history for fitting changepoints */}
          <SettingField
            label="Changepoint Range" range="0.6 - 0.95"
            tooltip={"Proportion of historical data where changepoints can occur.\n\nDefault 0.80 means changepoints only in first 80% of data, preventing overfitting to recent noise.\n\nUse 0.90-0.95 if recent changes are important (new menu, expansion).\n\nUse 0.60-0.75 for more stable, conservative forecasts."}
            value={settings.changepoint_range} onChange={(v) => handleInputChange('changepoint_range', v)}
            step={0.05} min={0.6} max={0.95} onWheel={handleNumberScroll}
          />

          {/* Holidays Prior Scale - impact of holidays on predictions */}
          <SettingField
            label="Holidays Prior Scale" range="0.1 - 100"
            tooltip={"Controls how much selected holidays affect predictions.\n\nHigher values (20-100) create larger holiday spikes.\n\nLower values (1-10) give subtle holiday effects.\n\nRequires holidays to be selected below."}
            value={settings.holidays_prior_scale} onChange={(v) => handleInputChange('holidays_prior_scale', v)}
            step={0.5} min={0.1} max={100} onWheel={handleNumberScroll}
          />
        </div>

        {/* Seasonality Components - ClaudeRevamp toggle style */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-black">
              Seasonality Components
            </h3>
            <TooltipIcon text={"Enable seasonal patterns in your forecast.\n\nDaily: patterns within a day (peak hours for bakery).\n\nWeekly: day-of-week effects (weekend vs weekday).\n\nYearly: seasonal patterns across the year (summer slump, winter holidays)."} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleCard checked={settings.daily_seasonality} onChange={(v) => handleInputChange('daily_seasonality', v)} label="Daily Seasonality" desc="Intraday patterns" />
            <ToggleCard checked={settings.weekly_seasonality} onChange={(v) => handleInputChange('weekly_seasonality', v)} label="Weekly Seasonality" desc="Day-of-week patterns" />
            <ToggleCard checked={settings.yearly_seasonality} onChange={(v) => handleInputChange('yearly_seasonality', v)} label="Yearly Seasonality" desc="Annual patterns" />
          </div>
        </div>

        {/* Public Holidays - ClaudeRevamp layout */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center gap-2 mb-3">
            <FaCalendarAlt className="text-pinkcafe2/80 text-lg flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-black">
              Public Holidays
            </h3>
            <TooltipIcon text={"Select holidays that create predictable sales spikes or dips for your bakery. Prophet will learn the typical effect of each holiday from historical data and apply it to future forecasts.\n\nStrength controlled by Holidays Prior Scale above."} placement="top" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200">
              <Toggle
                checked={settings.include_public_holidays}
                onChange={(v) => handleInputChange('include_public_holidays', v)}
                label="Include Public Holidays"
                desc="Model the effect of national holidays"
              />
            </div>
            {settings.include_public_holidays && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-pinkcafe2/70 mb-2">Country</label>
                  <select
                    value={settings.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-pinkcafe2/50 focus:border-pinkcafe2/50 transition duration-200"
                  >
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-pinkcafe2/70 mb-3">Select additional specific holidays to model:</p>
                  <div className="flex flex-wrap gap-2">
                    {HOLIDAY_OPTIONS.map(holiday => {
                      const selected = settings.holidays?.includes(holiday) || false;
                      return (
                        <button
                          key={holiday}
                          type="button"
                          onClick={() => {
                            const current = settings.holidays || [];
                            if (selected) {
                              handleInputChange('holidays', current.filter(h => h !== holiday));
                            } else {
                              handleInputChange('holidays', [...current, holiday]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                            selected
                              ? 'bg-pinkcafe/30 border-pinkcafe2/50 text-pinkcafe2 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-pinkcafe2/40 hover:shadow-sm'
                          }`}
                        >
                          {holiday}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Custom seasonality configuration section */}
        <div className="mt-4 sm:mt-6 border-t pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 flex-1">
              <Toggle
                checked={settings.custom_seasonality_enabled}
                onChange={(v) => handleInputChange('custom_seasonality_enabled', v)}
                label="Custom Seasonality"
                desc="Add patterns beyond daily/weekly/yearly"
              />
            </div>
            <TooltipIcon text={"Add custom seasonal patterns beyond daily/weekly/yearly.\n\nOnly enable if you have a specific recurring pattern not covered by standard seasonality."} placement="top" />
          </div>
          
          {/* Custom seasonality fields - only shown when enabled */}
          {settings.custom_seasonality_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
              {/* Custom seasonality name input */}
              <SettingField
                label="Name" type="text" placeholder="e.g., monthly"
                tooltip="Descriptive name for your custom seasonality (e.g., 'monthly_promotion', 'biweekly_payday')."
                value={settings.custom_seasonality_name} onChange={(v) => handleInputChange('custom_seasonality_name', v)}
              />

              {/* Custom seasonality period (in days) */}
              <SettingField
                label="Period" range="7 - 365 days"
                tooltip={"Length of the recurring cycle in days.\n\nMust be at least 7 days. Should be a pattern you observe repeating consistently in your sales data."}
                value={settings.custom_seasonality_period} onChange={(v) => handleInputChange('custom_seasonality_period', v)}
                step={0.5} min={7} max={365} onWheel={handleNumberScroll}
              />

              {/* Fourier order - controls smoothness of custom seasonality */}
              <SettingField
                label="Fourier Order" range="1 - 20"
                tooltip={"Controls the complexity of the seasonal pattern.\n\nLower values (1-5) create smooth, simple patterns.\n\nHigher values (6-15) allow more complex, irregular patterns.\n\nMaximum 20, but values above 10 rarely needed."}
                value={settings.custom_seasonality_fourier_order} onChange={(v) => handleInputChange('custom_seasonality_fourier_order', v)}
                min={1} max={20} parse="int" onWheel={handleNumberScroll}
              />
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Action buttons section - card with landing page style */}
      <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-in-right animate-delay-225">
        <div className="bg-pinkcafe2 px-4 md:px-6 py-3">
          <h2 className="text-lg font-bold text-white">Actions</h2>
        </div>
        <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-wrap gap-4">
          {showCreateDialog ? (
            /* Create/Duplicate mode buttons */
            <>
              <button
                onClick={handleCreatePreset}
                disabled={loading || !newPresetName.trim()}
                className={`flex-1 min-w-0 text-white text-sm sm:text-base font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  creationMode === 'new'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-pinkcafe2 hover:bg-pinkcafe2/90'
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
                  hasUnsavedChanges ? 'bg-pinkcafe2 hover:bg-pinkcafe2/90' : 'bg-pinkcafe2/80 hover:bg-pinkcafe2'
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
        
        {/* Informational note about model retraining - only shown in normal mode */}
        {!showCreateDialog && (
          <div className="mt-4 p-4 bg-pinkcafe2/10 border border-pinkcafe2/20 rounded-xl">
            <p className="text-sm text-pinkcafe2/80">
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
