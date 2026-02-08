import React from 'react'
import { TimeScale, GridMetrics } from '../../types/gantt'

interface TimelineHeaderProps {
  gridMetrics: GridMetrics
  timeScale: TimeScale
  showWeekends?: boolean
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  gridMetrics,
  timeScale,
  showWeekends = true,
}) => {
  const { columns } = gridMetrics

  // Group columns by month/quarter for secondary header
  const getGroupedHeaders = () => {
    const groups: { label: string; span: number; startIndex: number }[] = []
    let currentGroup: { label: string; span: number; startIndex: number } | null = null

    columns.forEach((column, index) => {
      let groupLabel = ''

      switch (timeScale) {
        case 'day':
        case 'week':
          // Group by month
          groupLabel = column.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          break

        case 'sprint':
          // Group by month
          groupLabel = column.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          break

        case 'month':
          // Group by year
          groupLabel = column.date.getFullYear().toString()
          break

        case 'quarter':
          // Group by year
          groupLabel = column.date.getFullYear().toString()
          break
      }

      if (!currentGroup || currentGroup.label !== groupLabel) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = { label: groupLabel, span: 1, startIndex: index }
      } else {
        currentGroup.span++
      }
    })

    if (currentGroup) {
      groups.push(currentGroup)
    }

    return groups
  }

  const groupedHeaders = getGroupedHeaders()

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-300">
      {/* Primary header (months/years) */}
      {(timeScale === 'day' || timeScale === 'week' || timeScale === 'sprint' || timeScale === 'month') && (
        <div className="flex border-b border-gray-200">
          {groupedHeaders.map((group, index) => (
            <div
              key={`group-${index}`}
              className="flex-shrink-0 px-2 py-2 text-center font-semibold text-gray-700 bg-gray-50 border-r border-gray-200"
              style={{ width: `${group.span * columns[group.startIndex].width}px` }}
            >
              {group.label}
            </div>
          ))}
        </div>
      )}

      {/* Secondary header (days/weeks/sprints/months/quarters) */}
      <div className="flex">
        {columns.map((column, index) => {
          const isWeekend = showWeekends && column.isWeekend
          const isToday = column.isToday

          return (
            <div
              key={`col-${index}`}
              className={`flex-shrink-0 px-2 py-2 text-center text-sm border-r border-gray-200 transition-colors ${
                isToday
                  ? 'bg-blue-100 font-bold text-blue-700'
                  : isWeekend
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-white text-gray-700'
              }`}
              style={{ width: `${column.width}px` }}
            >
              <div className="flex flex-col items-center">
                <span className="font-medium">{column.label}</span>
                {timeScale === 'day' && (
                  <span className="text-xs text-gray-500 mt-0.5">
                    {column.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
