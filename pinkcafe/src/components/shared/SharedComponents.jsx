import React from 'react';

/**
 * Toggle — on/off switch with label and optional description.
 * Extracted from ProphetSettingsPanel.jsx.
 */
export function Toggle({ checked, onChange, label, desc, disabled = false }) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        className="relative flex-shrink-0 mt-0.5"
        onClick={disabled ? undefined : () => onChange(!checked)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onChange(!checked); } }}
      >
        <div
          className="toggle-track"
          style={{
            background: checked ? 'rgba(66,59,57,0.2)' : 'rgba(0,0,0,0.06)',
            border: `1px solid ${checked ? 'rgba(66,59,57,0.4)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <div
            className="toggle-thumb"
            style={{
              transform: checked ? 'translateX(22px)' : 'translateX(0)',
              background: checked ? '#423b39' : 'rgba(255,255,255,0.9)',
              boxShadow: checked ? '0 0 8px rgba(66,59,57,0.4)' : 'none',
            }}
          />
        </div>
      </div>
      <div>
        <p className={`text-sm font-semibold transition-colors duration-200 ${checked ? 'text-pinkcafe2' : 'text-gray-600'}`}>
          {label}
        </p>
        {desc && <p className="text-xs mt-0.5 text-gray-500">{desc}</p>}
      </div>
    </label>
  );
}

/**
 * TooltipIcon — ⓘ info icon that shows a tooltip on hover.
 * Supports \n line breaks in text and top/bottom placement.
 * Extracted from ProphetSettingsPanel.jsx (was incorrectly defined inside the function body).
 */
export function TooltipIcon({ text, placement = 'bottom' }) {
  return (
    <span className="inline-block group relative cursor-pointer">
      <svg className="w-4 h-4 inline text-pinkcafe2/50 hover:text-pinkcafe2 transition-colors" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
      <span className={`invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out absolute right-0 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-20 ${
        placement === 'top' ? 'bottom-full mb-2' : 'top-6'
      }`}>
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

/**
 * EmptyState — centered icon + title + description for no-data states.
 * Accepts an svg path string for the icon.
 */
export function EmptyState({ iconPath, title, description }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 text-center border border-gray-100 h-full flex flex-col items-center justify-center">
      <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

/**
 * IconBadge — icon wrapped in a coloured circular background.
 * Pass bgClass and iconClass as Tailwind strings (e.g. "bg-sky-300", "w-5 h-5 text-sky-800").
 */
export function IconBadge({ icon: Icon, bgClass, iconClass }) {
  return (
    <div className={`rounded-full flex items-center justify-center ${bgClass}`}>
      <Icon className={iconClass} />
    </div>
  );
}

/**
 * StatCard — metric card with icon, label, value and optional change badge.
 * Used in QuickStatsBar. Pass className for animation delays.
 */
export function StatCard({ icon: Icon, label, value, change, positive, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-pinkcafe2/10 px-4 py-4 flex items-center gap-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-pinkcafe2/10 flex items-center justify-center shrink-0">
        <Icon className="text-pinkcafe2 text-sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-pinkcafe2/50 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-pinkcafe2 leading-tight">{value}</p>
      </div>
      {change && (
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
          positive === true  ? 'bg-emerald-100 text-emerald-700' :
          positive === false ? 'bg-rose-100 text-rose-700' :
                               'bg-pinkcafe2/8 text-pinkcafe2/60'
        }`}>
          {change}
        </span>
      )}
    </div>
  );
}

/**
 * ProgressBar — horizontal gradient bar showing a value relative to a max.
 * Displays a label below describing the percentage.
 */
export function ProgressBar({ value, max, barClass = 'bg-gradient-to-r from-sky-300 to-blue-300', labelClass = 'text-sky-700' }) {
  const pct = max > 0 ? ((value / max) * 100).toFixed(0) : 0;
  return (
    <div className="mt-4">
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full shadow-lg ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-semibold mt-2 text-center ${labelClass}`}>
        Avg is {pct}% of maximum
      </p>
    </div>
  );
}

/**
 * BulletListItem — coloured dot bullet + text content.
 * Pass dotClass as a Tailwind text colour (e.g. "text-emerald-600").
 */
export function BulletListItem({ dotClass, children }) {
  return (
    <li className="flex gap-2">
      <span className={dotClass}>●</span>
      {children}
    </li>
  );
}

/**
 * SettingField — label + optional tooltip + input (number or text).
 * Handles parseInt/parseFloat internally via the parse prop.
 */
export function SettingField({ label, range, tooltip, value, onChange, type = 'number', step, min, max, parse = 'float', onWheel, placeholder }) {
  const handleChange = (e) => {
    if (type === 'text') {
      onChange(e.target.value);
    } else {
      onChange(parse === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value));
    }
  };
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-pinkcafe2/80 mb-2">
        <span>{label}{range && <span className="text-pinkcafe2/50 text-xs ml-1">({range})</span>}</span>
        {tooltip && <TooltipIcon text={tooltip} />}
      </label>
      <input
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        onWheel={type === 'number' ? onWheel : undefined}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-pinkcafe2/20 rounded-lg focus:ring-2 focus:ring-pinkcafe2/50 focus:border-pinkcafe2/50"
      />
    </div>
  );
}

/**
 * ToggleCard — Toggle wrapped in a white rounded card.
 * Accepts optional children rendered below the toggle (e.g. conditional inputs).
 */
export function ToggleCard({ checked, onChange, label, desc, disabled, children }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200">
      <Toggle checked={checked} onChange={onChange} label={label} desc={desc} disabled={disabled} />
      {children}
    </div>
  );
}
