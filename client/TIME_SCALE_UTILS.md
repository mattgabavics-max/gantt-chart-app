# Time Scale Utilities Documentation

Comprehensive utilities for time-based calculations and rendering in Gantt charts.

## Table of Contents

1. [Overview](#overview)
2. [Time Scales](#time-scales)
3. [Core Functions](#core-functions)
4. [Usage Examples](#usage-examples)
5. [Integration with GanttChart](#integration-with-ganttchart)
6. [Best Practices](#best-practices)

---

## Overview

The time scale utilities provide a complete set of functions for:
- Generating time-based headers (day, week, sprint, month, quarter)
- Calculating task positions in pixels
- Snapping dates to grid boundaries
- Converting between dates and pixel positions
- Managing visible date ranges

### Key Features

✅ **Multiple Time Scales** - Day, Week, Sprint (2-week), Month, Quarter
✅ **Pixel-Perfect Positioning** - Accurate task bar placement
✅ **Smart Grid Snapping** - Prevent invalid date placements
✅ **Auto-Centering** - Automatically center view on today or custom date
✅ **Weekend Detection** - Highlight weekends in timeline
✅ **Today Indicator** - Mark current date in timeline
✅ **Type-Safe** - Full TypeScript support

---

## Time Scales

### Available Scales

```typescript
type TimeScale = 'day' | 'week' | 'sprint' | 'month' | 'quarter'
```

### Scale Properties

| Scale   | Column Width | Duration    | Use Case                    |
|---------|-------------|-------------|-----------------------------|
| Day     | 40px        | 1 day       | Detailed, short-term view   |
| Week    | 120px       | 7 days      | Medium-term planning        |
| Sprint  | 240px       | 14 days     | Agile sprint planning       |
| Month   | 180px       | ~30 days    | Long-term project view      |
| Quarter | 300px       | ~90 days    | High-level roadmap          |

---

## Core Functions

### 1. generateTimeHeaders()

Generate time header cells for the Gantt chart timeline.

```typescript
function generateTimeHeaders(
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): {
  primaryHeaders: TimeHeader[]
  secondaryHeaders: TimeHeader[]
}
```

**Returns two-level headers:**
- **Primary Headers**: Main time periods (e.g., months, weeks)
- **Secondary Headers**: Sub-periods (e.g., weeks in month, days in week)

**Example:**
```typescript
const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
  new Date('2024-06-01'),
  new Date('2024-06-30'),
  'week'
)

// Primary: Weeks of June
// Secondary: Individual days in each week
```

**Header Structure:**
```typescript
interface TimeHeader {
  id: string           // Unique identifier
  label: string        // Display label (e.g., "Jun 15", "Week of Jun 10")
  startDate: Date      // Period start
  endDate: Date        // Period end
  width: number        // Width in pixels
  level: number        // 0 for primary, 1 for secondary
  isWeekend?: boolean  // True if weekend (secondary headers only)
  isToday?: boolean    // True if today
}
```

### 2. calculateTaskPosition()

Calculate pixel position and width for a task.

```typescript
function calculateTaskPosition(
  task: Task | { startDate: Date; endDate: Date },
  startDate: Date,
  endDate: Date,
  scale: TimeScale,
  containerWidth?: number
): TaskPosition
```

**Returns:**
```typescript
interface TaskPosition {
  left: number       // Pixels from timeline start
  width: number      // Width in pixels (minimum 20px)
  startDate: Date    // Clamped start date
  endDate: Date      // Clamped end date
}
```

**Features:**
- Automatically clamps tasks to visible range
- Enforces minimum width (20px) for visibility
- Proportional scaling based on time scale
- Handles tasks outside visible range

**Example:**
```typescript
const position = calculateTaskPosition(
  task,
  new Date('2024-06-01'),
  new Date('2024-06-30'),
  'day'
)

// Use in CSS:
// style={{ left: position.left, width: position.width }}
```

### 3. snapToGrid()

Snap a date to the nearest grid boundary.

```typescript
function snapToGrid(date: Date, scale: TimeScale): Date
```

**Snapping Rules:**
- **Day**: Snap to midnight (00:00:00)
- **Week**: Snap to Monday
- **Sprint**: Snap to start of 2-week period
- **Month**: Snap to 1st of month
- **Quarter**: Snap to 1st of quarter (Jan, Apr, Jul, Oct)

**Example:**
```typescript
const draggedDate = new Date('2024-06-15T14:30:00')
const snapped = snapToGrid(draggedDate, 'day')
// Result: 2024-06-15T00:00:00

const snappedWeek = snapToGrid(draggedDate, 'week')
// Result: Monday of that week
```

### 4. getVisibleDateRange()

Calculate optimal date range to display.

```typescript
function getVisibleDateRange(
  scale: TimeScale,
  centerDate: Date = new Date(),
  options?: {
    minColumns?: number
    maxColumns?: number
    tasks?: Task[]
  }
): VisibleDateRange
```

**Returns:**
```typescript
interface VisibleDateRange {
  startDate: Date    // Range start
  endDate: Date      // Range end
  totalDays: number  // Total days in range
  totalWidth: number // Total width in pixels
}
```

**Auto-sizing:**
- **Day**: 30 columns (30 days)
- **Week**: 12 columns (3 months)
- **Sprint**: 8 columns (4 months)
- **Month**: 12 columns (1 year)
- **Quarter**: 8 columns (2 years)

**Task-based expansion:**
If tasks are provided, range expands to include all tasks with padding.

**Example:**
```typescript
// Center on today, show 30 days
const range = getVisibleDateRange('day')

// Center on custom date
const range = getVisibleDateRange('week', new Date('2024-06-15'))

// Expand to include tasks
const range = getVisibleDateRange('day', new Date(), {
  tasks: projectTasks,
  minColumns: 20,
  maxColumns: 100
})
```

### 5. getDatePosition()

Get pixel position for a specific date.

```typescript
function getDatePosition(
  date: Date,
  startDate: Date,
  endDate: Date,
  scale: TimeScale
): number
```

**Example:**
```typescript
const today = new Date()
const position = getDatePosition(
  today,
  rangeStart,
  rangeEnd,
  'day'
)

// Draw today indicator at this position
```

### 6. getDateAtPosition()

Get date at a specific pixel position.

```typescript
function getDateAtPosition(
  pixelX: number,
  startDate: Date,
  scale: TimeScale
): Date
```

**Example:**
```typescript
const handleDrag = (e: MouseEvent) => {
  const pixelX = e.clientX - containerLeft
  const newDate = getDateAtPosition(pixelX, rangeStart, 'day')
  const snapped = snapToGrid(newDate, 'day')
  updateTask({ startDate: snapped })
}
```

---

## Usage Examples

### Basic Timeline Rendering

```typescript
import {
  generateTimeHeaders,
  getVisibleDateRange,
  calculateTaskPosition,
} from './utils/timeScaleUtils'

function GanttChart({ tasks, scale }) {
  // 1. Get visible range
  const range = getVisibleDateRange(scale, new Date(), { tasks })

  // 2. Generate headers
  const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
    range.startDate,
    range.endDate,
    scale
  )

  // 3. Calculate task positions
  const taskPositions = tasks.map(task => ({
    task,
    position: calculateTaskPosition(
      task,
      range.startDate,
      range.endDate,
      scale
    )
  }))

  return (
    <div>
      {/* Render headers */}
      <div className="flex">
        {primaryHeaders.map(header => (
          <div key={header.id} style={{ width: header.width }}>
            {header.label}
          </div>
        ))}
      </div>

      {/* Render tasks */}
      {taskPositions.map(({ task, position }) => (
        <div
          key={task.id}
          style={{
            left: position.left,
            width: position.width
          }}
        >
          {task.name}
        </div>
      ))}
    </div>
  )
}
```

### Drag and Drop with Snapping

```typescript
function DraggableTask({ task, scale, onUpdate }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = (e: MouseEvent) => {
    // Get pixel position
    const pixelX = e.clientX - containerLeft + scrollLeft

    // Convert to date
    const newDate = getDateAtPosition(pixelX, rangeStart, scale)

    // Snap to grid
    const snappedDate = snapToGrid(newDate, scale)

    // Update task
    onUpdate({
      ...task,
      startDate: snappedDate,
      endDate: addPeriod(snappedDate, duration, scale)
    })
  }

  return (
    <div
      onMouseDown={() => setIsDragging(true)}
      onMouseMove={isDragging ? handleDrag : undefined}
      onMouseUp={() => setIsDragging(false)}
    >
      {task.name}
    </div>
  )
}
```

### Weekend Highlighting

```typescript
function Timeline({ secondaryHeaders, showWeekends }) {
  return (
    <div className="flex">
      {secondaryHeaders.map(header => (
        <div
          key={header.id}
          className={`
            ${showWeekends && header.isWeekend ? 'bg-gray-100' : 'bg-white'}
            ${header.isToday ? 'bg-blue-50 font-bold' : ''}
          `}
          style={{ width: header.width }}
        >
          {header.label}
        </div>
      ))}
    </div>
  )
}
```

### Today Indicator

```typescript
function TodayIndicator({ range, scale }) {
  const today = new Date()
  const position = getDatePosition(today, range.startDate, range.endDate, scale)

  if (position < 0 || position > range.totalWidth) {
    return null // Today not in visible range
  }

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
      style={{ left: position }}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
    </div>
  )
}
```

### Auto-Scroll to Today

```typescript
import { getScrollPositionForToday } from './utils/timeScaleUtils'

function GanttChart() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollPos = getScrollPositionForToday(
        range.startDate,
        scale,
        containerWidth
      )
      scrollRef.current.scrollLeft = scrollPos
    }
  }, [range, scale, containerWidth])

  return <div ref={scrollRef}>{/* Timeline */}</div>
}
```

---

## Integration with GanttChart

### Enhanced Gantt Chart Component

See `src/components/GanttChart/EnhancedGanttChart.tsx` for a complete implementation using these utilities.

**Key Features:**
- Dynamic time scale rendering
- Drag-and-drop with grid snapping
- Weekend highlighting
- Today indicator
- Auto-scroll to today
- Resize task handles
- Read-only mode

**Usage:**
```typescript
import { EnhancedGanttChart } from './components/GanttChart'

<EnhancedGanttChart
  tasks={tasks}
  timeScale="week"
  onTaskUpdate={(taskId, updates) => {
    // Handle task update
  }}
  showWeekends={true}
  showToday={true}
  autoScrollToToday={true}
/>
```

---

## Best Practices

### 1. Performance

✅ **DO:**
- Memoize header and position calculations
- Use `useMemo` for expensive operations
- Virtualize long task lists

❌ **DON'T:**
- Recalculate on every render
- Skip memoization for large datasets

```typescript
// Good
const headers = useMemo(
  () => generateTimeHeaders(start, end, scale),
  [start, end, scale]
)

// Bad - recalculates every render
const headers = generateTimeHeaders(start, end, scale)
```

### 2. Date Handling

✅ **DO:**
- Always use `snapToGrid` for user-dragged dates
- Clamp dates to visible range
- Handle timezone consistently

❌ **DON'T:**
- Allow partial-day positions (unless using hour scale)
- Ignore date validation

### 3. Responsive Design

✅ **DO:**
- Recalculate on container resize
- Use percentage widths for headers when appropriate
- Handle small screens gracefully

```typescript
useEffect(() => {
  const handleResize = () => {
    setContainerWidth(containerRef.current?.offsetWidth || 0)
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### 4. Accessibility

✅ **DO:**
- Provide keyboard navigation
- Add ARIA labels to time headers
- Support screen readers

```typescript
<div
  role="columnheader"
  aria-label={`${formatPeriodLabel(header.startDate, scale)}`}
>
  {header.label}
</div>
```

### 5. Edge Cases

Handle these scenarios:
- Tasks outside visible range
- Very short tasks (< 1 day)
- Very long tasks (spanning multiple quarters)
- Leap years
- DST transitions
- Month boundary edge cases

```typescript
// Handle short tasks
const width = Math.max(position.width, 20) // Minimum 20px

// Clamp to visible range
if (task.startDate < rangeStart) {
  clampedStart = rangeStart
}
```

---

## Helper Functions Reference

### Date Utilities

```typescript
// Get start/end of period
getStartOfPeriod(date: Date, scale: TimeScale): Date
getEndOfPeriod(date: Date, scale: TimeScale): Date

// Add/subtract periods
addPeriod(date: Date, count: number, scale: TimeScale): Date

// Format labels
formatPeriodLabel(date: Date, scale: TimeScale): string
formatDateRange(start: Date, end: Date): string

// Checks
isWeekend(date: Date): boolean
isToday(date: Date): boolean
daysBetween(start: Date, end: Date): number
```

### Grid Utilities

```typescript
// Calculate grid metrics
calculateGridMetrics(start: Date, end: Date, scale: TimeScale): GridMetrics

// Column operations
getColumnIndex(date: Date, startDate: Date, scale: TimeScale): number

// Range operations
dateRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean
getDateRangeWidth(start: Date, end: Date, scale: TimeScale): number
```

---

## Troubleshooting

### Tasks Not Aligned Properly

**Problem:** Tasks appear misaligned with grid.

**Solution:**
```typescript
// Ensure dates are snapped to grid
const snappedStart = snapToGrid(task.startDate, scale)
const snappedEnd = snapToGrid(task.endDate, scale)
```

### Headers Not Matching Task Positions

**Problem:** Time headers don't line up with task bars.

**Solution:**
- Verify same `startDate` and `scale` for both headers and positions
- Check that header widths match column widths

### Today Indicator Missing

**Problem:** Today indicator not showing.

**Solution:**
```typescript
// Check if today is in visible range
const range = getVisibleDateRange(scale, new Date(), { tasks })
const today = new Date()

if (today >= range.startDate && today <= range.endDate) {
  // Show indicator
}
```

---

## Testing

See `src/utils/timeScaleUtils.test.ts` for comprehensive test suite covering:
- All time scales
- Edge cases (leap years, month boundaries)
- Date snapping
- Position calculations
- Range calculations

Run tests:
```bash
npm test timeScaleUtils
```

---

## Examples

See `src/examples/TimeScaleExample.tsx` for interactive examples:
1. Time header generation
2. Task positioning
3. Date snapping
4. Visible range calculation
5. Date/position conversion
6. Period operations

---

## Further Reading

- [Gantt Chart Component](./src/components/GanttChart/EnhancedGanttChart.tsx)
- [Time Scale Examples](./src/examples/TimeScaleExample.tsx)
- [Test Suite](./src/utils/timeScaleUtils.test.ts)
