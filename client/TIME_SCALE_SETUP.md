# Time Scale Utilities - Quick Setup

## 📁 Files Created

### 1. Core Utilities
**`src/utils/timeScaleUtils.ts`** - Complete time scale calculation library
- ✅ 20+ utility functions
- ✅ Full TypeScript types
- ✅ 5 time scales (day, week, sprint, month, quarter)
- ✅ Grid snapping and positioning
- ✅ Date range calculations

### 2. Tests
**`src/utils/timeScaleUtils.test.ts`** - Comprehensive test suite
- ✅ 80+ test cases
- ✅ All functions covered
- ✅ Edge cases tested (leap years, month boundaries, etc.)

### 3. Enhanced Component
**`src/components/GanttChart/EnhancedGanttChart.tsx`** - Production-ready Gantt chart
- ✅ Uses all time scale utilities
- ✅ Drag and drop with snapping
- ✅ Weekend highlighting
- ✅ Today indicator
- ✅ Auto-scroll to today
- ✅ Resize handles

### 4. Examples
**`src/examples/TimeScaleExample.tsx`** - Interactive examples
- ✅ 6 complete examples
- ✅ Live demos for all functions
- ✅ Visual demonstrations

### 5. Documentation
**`TIME_SCALE_UTILS.md`** - Complete documentation
- ✅ API reference
- ✅ Usage examples
- ✅ Best practices
- ✅ Troubleshooting guide

---

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import {
  generateTimeHeaders,
  calculateTaskPosition,
  getVisibleDateRange,
  snapToGrid,
  type TimeScale,
} from './utils/timeScaleUtils'

// 1. Get visible date range
const range = getVisibleDateRange('week', new Date(), {
  tasks: projectTasks
})

// 2. Generate headers
const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
  range.startDate,
  range.endDate,
  'week'
)

// 3. Calculate task positions
const position = calculateTaskPosition(
  task,
  range.startDate,
  range.endDate,
  'week'
)

// 4. Snap dates to grid
const snappedDate = snapToGrid(draggedDate, 'week')
```

### 2. Use Enhanced Gantt Chart

```typescript
import { EnhancedGanttChart } from './components/GanttChart'

function MyApp() {
  const [tasks, setTasks] = useState<Task[]>([...])
  const [scale, setScale] = useState<TimeScale>('week')

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))
  }

  return (
    <EnhancedGanttChart
      tasks={tasks}
      timeScale={scale}
      onTaskUpdate={handleTaskUpdate}
      showWeekends={true}
      showToday={true}
      autoScrollToToday={true}
    />
  )
}
```

---

## 🎯 Key Functions

### generateTimeHeaders()
**Purpose:** Create timeline headers

```typescript
const { primaryHeaders, secondaryHeaders } = generateTimeHeaders(
  new Date('2024-06-01'),
  new Date('2024-06-30'),
  'week'
)

// Returns:
// primaryHeaders: Week headers
// secondaryHeaders: Day headers within each week
```

### calculateTaskPosition()
**Purpose:** Position tasks in the timeline

```typescript
const position = calculateTaskPosition(
  task,
  rangeStart,
  rangeEnd,
  'day'
)

// Returns: { left: 240, width: 200, startDate, endDate }
// Use in CSS: style={{ left: position.left, width: position.width }}
```

### snapToGrid()
**Purpose:** Snap dates to grid boundaries

```typescript
const draggedDate = new Date('2024-06-15T14:30:00')
const snapped = snapToGrid(draggedDate, 'day')
// Result: 2024-06-15T00:00:00 (midnight)

const snappedWeek = snapToGrid(draggedDate, 'week')
// Result: Monday of that week
```

### getVisibleDateRange()
**Purpose:** Calculate what dates to show

```typescript
// Auto-size based on scale
const range = getVisibleDateRange('week')
// Shows 12 weeks (3 months)

// Include all tasks
const range = getVisibleDateRange('day', new Date(), {
  tasks: projectTasks
})
// Expands to show all tasks with padding
```

---

## 📊 Time Scales

| Scale   | Column Width | Best For                    |
|---------|-------------|------------------------------|
| Day     | 40px        | Short-term, detailed view    |
| Week    | 120px       | Medium-term planning         |
| Sprint  | 240px       | Agile 2-week sprints         |
| Month   | 180px       | Long-term projects           |
| Quarter | 300px       | High-level roadmaps          |

---

## 🎨 Component Features

### EnhancedGanttChart

**Props:**
```typescript
interface EnhancedGanttChartProps {
  tasks: Task[]
  timeScale: TimeScale
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskClick?: (task: Task) => void
  readOnly?: boolean
  showWeekends?: boolean
  showToday?: boolean
  centerDate?: Date
  autoScrollToToday?: boolean
  minColumns?: number
  maxColumns?: number
}
```

**Features:**
- ✅ Drag to move tasks (with grid snapping)
- ✅ Resize task handles (left and right)
- ✅ Weekend highlighting
- ✅ Today indicator (red line)
- ✅ Auto-scroll to today on load
- ✅ Task progress bars
- ✅ Milestone indicators
- ✅ Read-only mode
- ✅ Fully responsive

---

## 💡 Common Patterns

### 1. Time Scale Selector

```typescript
function TimeScaleSelector({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="sprint">Sprint</option>
      <option value="month">Month</option>
      <option value="quarter">Quarter</option>
    </select>
  )
}
```

### 2. Drag and Drop

```typescript
const handleMouseDown = (e: MouseEvent, task: Task) => {
  const startX = e.clientX

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX
    const pixelX = position.left + deltaX

    const newDate = getDateAtPosition(pixelX, rangeStart, scale)
    const snapped = snapToGrid(newDate, scale)

    onTaskUpdate(task.id, { startDate: snapped })
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', handleMouseMove)
  }, { once: true })
}
```

### 3. Today Indicator

```typescript
const todayPosition = useMemo(() => {
  const today = new Date()
  const pos = getDatePosition(today, range.startDate, range.endDate, scale)
  return pos
}, [range, scale])

return (
  <div
    className="absolute top-0 bottom-0 w-0.5 bg-red-500"
    style={{ left: todayPosition }}
  />
)
```

### 4. Weekend Highlighting

```typescript
{secondaryHeaders.map(header => (
  <div
    key={header.id}
    className={header.isWeekend ? 'bg-gray-100' : 'bg-white'}
    style={{ width: header.width }}
  >
    {header.label}
  </div>
))}
```

---

## ✅ Testing

Run tests:
```bash
npm test timeScaleUtils
```

Test coverage includes:
- ✅ All time scales
- ✅ Date calculations
- ✅ Position calculations
- ✅ Grid snapping
- ✅ Edge cases (leap years, etc.)
- ✅ Boundary conditions

---

## 📚 Documentation

- **Full API Docs**: `TIME_SCALE_UTILS.md`
- **Examples**: `src/examples/TimeScaleExample.tsx`
- **Tests**: `src/utils/timeScaleUtils.test.ts`
- **Component**: `src/components/GanttChart/EnhancedGanttChart.tsx`

---

## 🐛 Troubleshooting

### Tasks Not Snapping to Grid

**Solution:** Use `snapToGrid()` after calculating new dates
```typescript
const newDate = getDateAtPosition(pixelX, rangeStart, scale)
const snapped = snapToGrid(newDate, scale) // ← Add this
```

### Headers Not Aligning with Tasks

**Solution:** Use same `startDate` and `scale` for both
```typescript
// Both use same values
const headers = generateTimeHeaders(range.startDate, range.endDate, scale)
const position = calculateTaskPosition(task, range.startDate, range.endDate, scale)
```

### Today Indicator Not Showing

**Solution:** Check if today is in visible range
```typescript
const today = new Date()
if (today >= range.startDate && today <= range.endDate) {
  // Show indicator
}
```

---

## 🎓 Best Practices

1. **Memoize Calculations**
   ```typescript
   const headers = useMemo(
     () => generateTimeHeaders(start, end, scale),
     [start, end, scale]
   )
   ```

2. **Always Snap User Input**
   ```typescript
   const snapped = snapToGrid(userDraggedDate, scale)
   ```

3. **Handle Edge Cases**
   ```typescript
   const width = Math.max(position.width, 20) // Minimum width
   ```

4. **Clamp to Visible Range**
   ```typescript
   const clamped = task.startDate < rangeStart
     ? rangeStart
     : task.startDate
   ```

---

## 🎉 You're Ready!

The time scale utilities are fully implemented and tested. Use `EnhancedGanttChart` for a complete implementation or build your own using the utility functions.

```typescript
import { EnhancedGanttChart } from './components/GanttChart'

<EnhancedGanttChart
  tasks={tasks}
  timeScale="week"
  onTaskUpdate={handleUpdate}
  showWeekends={true}
  showToday={true}
/>
```

See `TIME_SCALE_UTILS.md` for detailed documentation!
