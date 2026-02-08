import React, { useState, useRef } from 'react'
import { TimeScale } from '../../types/gantt'

export interface ToolbarProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  showWeekends: boolean
  onShowWeekendsChange: (show: boolean) => void
  showToday: boolean
  onShowTodayChange: (show: boolean) => void
  onExportPNG?: () => void
  onExportPDF?: () => void
  onExportJSON?: () => void
  readOnly?: boolean
  onReadOnlyChange?: (readOnly: boolean) => void
}

const TIME_SCALES: { value: TimeScale; label: string; description: string }[] = [
  { value: 'day', label: 'Day', description: 'Daily view' },
  { value: 'week', label: 'Week', description: 'Weekly view' },
  { value: 'sprint', label: 'Sprint', description: '2-week sprints' },
  { value: 'month', label: 'Month', description: 'Monthly view' },
  { value: 'quarter', label: 'Quarter', description: 'Quarterly view' },
]

export const Toolbar: React.FC<ToolbarProps> = ({
  timeScale,
  onTimeScaleChange,
  showWeekends,
  onShowWeekendsChange,
  showToday,
  onShowTodayChange,
  onExportPNG,
  onExportPDF,
  onExportJSON,
  readOnly = false,
  onReadOnlyChange,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showViewOptions, setShowViewOptions] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const viewOptionsRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      if (viewOptionsRef.current && !viewOptionsRef.current.contains(event.target as Node)) {
        setShowViewOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleZoomIn = () => {
    const currentIndex = TIME_SCALES.findIndex((s) => s.value === timeScale)
    if (currentIndex > 0) {
      onTimeScaleChange(TIME_SCALES[currentIndex - 1].value)
    }
  }

  const handleZoomOut = () => {
    const currentIndex = TIME_SCALES.findIndex((s) => s.value === timeScale)
    if (currentIndex < TIME_SCALES.length - 1) {
      onTimeScaleChange(TIME_SCALES[currentIndex + 1].value)
    }
  }

  const canZoomIn = TIME_SCALES.findIndex((s) => s.value === timeScale) > 0
  const canZoomOut = TIME_SCALES.findIndex((s) => s.value === timeScale) < TIME_SCALES.length - 1

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left section - Zoom controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomIn}
              disabled={!canZoomIn}
              className={`p-1.5 rounded transition-colors ${
                canZoomIn
                  ? 'text-gray-700 hover:bg-white hover:shadow-sm'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Zoom in (more detail)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>

            <div className="px-3 py-1 text-sm font-medium text-gray-900 bg-white rounded shadow-sm min-w-[80px] text-center">
              {TIME_SCALES.find((s) => s.value === timeScale)?.label}
            </div>

            <button
              onClick={handleZoomOut}
              disabled={!canZoomOut}
              className={`p-1.5 rounded transition-colors ${
                canZoomOut
                  ? 'text-gray-700 hover:bg-white hover:shadow-sm'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Zoom out (less detail)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {TIME_SCALES.find((s) => s.value === timeScale)?.description}
          </div>
        </div>

        {/* Right section - View options and export */}
        <div className="flex items-center space-x-2">
          {/* View options dropdown */}
          <div className="relative" ref={viewOptionsRef}>
            <button
              onClick={() => setShowViewOptions(!showViewOptions)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>View</span>
              <svg
                className={`w-4 h-4 transition-transform ${showViewOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showViewOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Options
                </div>

                <label className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Show Weekends</span>
                  <input
                    type="checkbox"
                    checked={showWeekends}
                    onChange={(e) => onShowWeekendsChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm text-gray-700">Show Today Line</span>
                  <input
                    type="checkbox"
                    checked={showToday}
                    onChange={(e) => onShowTodayChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                {onReadOnlyChange && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <label className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <span className="text-sm text-gray-700">Read-only Mode</span>
                      <input
                        type="checkbox"
                        checked={readOnly}
                        onChange={(e) => onReadOnlyChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Export dropdown */}
          {(onExportPNG || onExportPDF || onExportJSON) && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {onExportPNG && (
                    <button
                      onClick={() => {
                        onExportPNG()
                        setShowExportMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Export as PNG</span>
                    </button>
                  )}

                  {onExportPDF && (
                    <button
                      onClick={() => {
                        onExportPDF()
                        setShowExportMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Export as PDF</span>
                    </button>
                  )}

                  {onExportJSON && (
                    <button
                      onClick={() => {
                        onExportJSON()
                        setShowExportMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Export as JSON</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom level indicator */}
      <div className="mt-2 flex items-center justify-center">
        <div className="flex items-center space-x-1">
          {TIME_SCALES.map((scale, index) => (
            <button
              key={scale.value}
              onClick={() => onTimeScaleChange(scale.value)}
              className={`h-1.5 rounded-full transition-all ${
                timeScale === scale.value
                  ? 'bg-blue-600 w-8'
                  : index === TIME_SCALES.findIndex((s) => s.value === timeScale)
                  ? 'bg-gray-300 w-6'
                  : 'bg-gray-200 w-4'
              }`}
              title={scale.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Toolbar
