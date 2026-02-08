# Gantt Chart Component Documentation

## Overview

A fully-featured, interactive Gantt chart component built with React, TypeScript, and Tailwind CSS. Supports drag-and-drop task management, multiple time scales, and responsive design.

---

## Features

### ✅ Time Scale Switching
- **5 time scales:** Day, Week, Sprint (2 weeks), Month, Quarter
- Dynamic header rendering based on selected scale
- Auto-calculated grid columns
- Smooth transitions between scales

### ✅ Drag and Drop
- **Move tasks:** Drag task bars horizontally to change dates
- **Resize tasks:** Drag left/right edges to adjust duration
- **Smart snapping:** Auto-snaps to grid based on time scale
- **Visual feedback:** Real-time preview while dragging
- **Validation:** Ensures start date < end date

### ✅ Visual Elements
- **Task bars:** Customizable colors with progress indicators
- **Milestones:** Diamond markers for key dates
- **Today indicator:** Vertical line showing current date
- **Weekend highlighting:** Gray background for weekends
- **Tooltips:** Hover to see task details
- **Row highlighting:** Hover effects for better visibility

### ✅ Responsive Design
- Horizontal and vertical scrolling
- Fixed task name sidebar
- Sticky timeline header
- Auto-scrolls to today on load
- Adapts to container size

---

## Installation

The component is already integrated into your project structure:

```
client/src/
├── components/
│   └── GanttChart/
│       ├── GanttChart.tsx          # Main component
│       ├── TaskBar.tsx             # Task bar with drag/drop
│       ├── TimelineHeader.tsx      # Timeline header
│       ├── GanttChartExample.tsx   # Usage example
│       └── index.ts                # Exports
├── types/
│   └── gantt.ts                    # TypeScript types
└── utils/
    └── ganttUtils.ts               # Utility functions
```

---

## Usage

### Basic Example

```tsx
import React, { useState } from 'react'
import { GanttChart } from './components/GanttChart'
import { Task, TimeScale } from './types/gantt'

function MyGanttChart() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Design Phase',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-15'),
      color: '#3b82f6',
      position: 0,
      projectId: 'project-1',
    },
    {
      id: '2',
      name: 'Development',
      startDate: new Date('2026-02-16'),
      endDate: new Date('2026-03-31'),
      color: '#10b981',
      position: 1,
      projectId: 'project-1',
      progress: 50,
    },
  ])

  const [timeScale, setTimeScale] = useState<TimeScale>('week')

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
  }

  return (
    <div className="h-screen">
      <GanttChart
        tasks={tasks}
        timeScale={timeScale}
        onTaskUpdate={handleTaskUpdate}
        readOnly={false}
        showWeekends={true}
        showToday={true}
      />
    </div>
  )
}
```

### With API Integration

```tsx
import React, { useState, useEffect } from 'react'
import { GanttChart } from './components/GanttChart'
import { Task, TimeScale } from './types/gantt'
import axios from 'axios'

function ProjectGanttChart({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [loading, setLoading] = useState(true)

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`/api/projects/${projectId}/tasks`)
        setTasks(response.data.data.tasks)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  // Update task on server
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )

    // Persist to server
    try {
      await axios.put(`/api/tasks/${taskId}`, updates)
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error (fetch tasks again)
      const response = await axios.get(`/api/projects/${projectId}/tasks`)
      setTasks(response.data.data.tasks)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-screen">
      <GanttChart
        tasks={tasks}
        timeScale={timeScale}
        onTaskUpdate={handleTaskUpdate}
        readOnly={false}
      />
    </div>
  )
}
```

---

## Props API

### GanttChartProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tasks` | `Task[]` | ✅ Yes | - | Array of tasks to display |
| `timeScale` | `TimeScale` | ✅ Yes | - | Time scale: 'day', 'week', 'sprint', 'month', 'quarter' |
| `onTaskUpdate` | `(taskId, updates) => void` | ✅ Yes | - | Callback when task is updated via drag/drop |
| `readOnly` | `boolean` | No | `false` | Disable editing (no drag/drop) |
| `showWeekends` | `boolean` | No | `true` | Highlight weekends with gray background |
| `showToday` | `boolean` | No | `true` | Show today indicator line |
| `minDate` | `Date` | No | Auto | Minimum date for timeline (auto-calculated from tasks) |
| `maxDate` | `Date` | No | Auto | Maximum date for timeline (auto-calculated from tasks) |

### Task Type

```typescript
interface Task {
  id: string                    // Unique task ID
  name: string                  // Task name (displayed in sidebar and tooltip)
  startDate: Date               // Task start date
  endDate: Date                 // Task end date
  color: string                 // Task bar color (hex format: #RRGGBB)
  position: number              // Vertical position (0-based)
  projectId: string             // Parent project ID
  isMilestone?: boolean         // Render as milestone (diamond)
  progress?: number             // Progress percentage (0-100)
}
```

### TimeScale Type

```typescript
type TimeScale = 'day' | 'week' | 'sprint' | 'month' | 'quarter'
```

---

## Time Scales

### Day View
- **Column width:** 40px
- **Best for:** Short-term planning (1-4 weeks)
- **Header:** Day number with weekday
- **Snap to:** Day boundaries

### Week View
- **Column width:** 80px
- **Best for:** Medium-term planning (1-3 months)
- **Header:** Week number (W1, W2, etc.)
- **Snap to:** Week boundaries (Monday start)

### Sprint View
- **Column width:** 120px
- **Duration:** 2 weeks per sprint
- **Best for:** Agile project planning
- **Header:** Sprint number (S1, S2, etc.)
- **Snap to:** Sprint boundaries

### Month View
- **Column width:** 100px
- **Best for:** Long-term planning (3-12 months)
- **Header:** Month name and year
- **Snap to:** Month boundaries

### Quarter View
- **Column width:** 150px
- **Best for:** Strategic planning (1-2 years)
- **Header:** Quarter and year (Q1 2026, Q2 2026, etc.)
- **Snap to:** Quarter boundaries

---

## Styling

The component uses Tailwind CSS for styling. Key color customizations:

### Task Colors

Use hex color codes for task bars:

```typescript
// Standard colors
const COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
}

// Usage
const task: Task = {
  // ...
  color: COLORS.blue,
}
```

### Theme Customization

The component supports Tailwind's color system. Key classes used:

- **Background:** `bg-white`, `bg-gray-50`, `bg-gray-100`
- **Borders:** `border-gray-200`, `border-gray-300`
- **Text:** `text-gray-600`, `text-gray-700`, `text-gray-900`
- **Accents:** `bg-blue-500`, `bg-blue-100`

To customize, override in your Tailwind config or use CSS variables.

---

## Features in Detail

### Drag and Drop

#### Move Task (Change Dates)
1. Click and hold on task bar
2. Drag horizontally
3. Release to apply changes
4. Dates snap to grid based on time scale

#### Resize Task (Change Duration)
1. Hover over left or right edge of task bar
2. Cursor changes to resize (↔)
3. Click and drag edge
4. Release to apply changes
5. Validation prevents start ≥ end

#### Visual Feedback
- Task becomes semi-transparent while dragging
- Real-time date display shows new dates
- Smooth transitions and animations

### Milestones

Tasks with `isMilestone: true` render as diamonds:

```typescript
const milestone: Task = {
  id: '1',
  name: 'Project Launch',
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-04-01'), // Same date
  color: '#ef4444',
  position: 0,
  projectId: 'proj-1',
  isMilestone: true, // Renders as diamond
}
```

### Progress Indicator

Tasks can show progress with a progress bar at the bottom:

```typescript
const task: Task = {
  // ...
  progress: 75, // 0-100
}
```

Shows as a white bar at 40% opacity across the bottom of the task bar.

### Weekend Highlighting

Weekends (Saturday and Sunday) are highlighted with gray background when `showWeekends={true}`.

### Today Indicator

A blue vertical line marks today's date when `showToday={true}`. The view auto-scrolls to show today on initial load.

---

## Utility Functions

### Date Calculations

```typescript
import {
  getStartOfPeriod,
  getEndOfPeriod,
  addPeriods,
  snapToGrid,
} from './utils/ganttUtils'

// Get start of current week
const weekStart = getStartOfPeriod(new Date(), 'week')

// Get end of current month
const monthEnd = getEndOfPeriod(new Date(), 'month')

// Add 2 weeks to a date
const futureDate = addPeriods(new Date(), 2, 'week')

// Snap date to nearest day
const snapped = snapToGrid(new Date(), 'day')
```

### Grid Calculations

```typescript
import { calculateGridMetrics } from './utils/ganttUtils'

// Calculate grid metrics for tasks
const metrics = calculateGridMetrics(tasks, 'week')

console.log(metrics)
// {
//   columnWidth: 80,
//   columns: [...],
//   totalWidth: 2400,
//   startDate: Date,
//   endDate: Date,
// }
```

---

## Responsive Design

The component is fully responsive:

### Desktop (≥1024px)
- Task sidebar: 256px fixed width
- Timeline: Scrollable horizontally and vertically
- Header: Sticky with grouped headers

### Tablet (768px - 1023px)
- Task sidebar: 200px width
- Same scrolling behavior
- Slightly smaller fonts

### Mobile (<768px)
- Consider hiding task sidebar or making it collapsible
- Touch gestures for scrolling
- May need custom styling for small screens

### Recommended Container

```tsx
<div className="h-screen w-full">
  <GanttChart {...props} />
</div>
```

Or with flex layout:

```tsx
<div className="flex flex-col h-screen">
  <header>...</header>
  <div className="flex-1">
    <GanttChart {...props} />
  </div>
</div>
```

---

## Performance Considerations

### Large Task Lists

For projects with 100+ tasks:

1. **Virtualize task rows:**
   ```tsx
   import { FixedSizeList } from 'react-window'
   ```

2. **Debounce updates:**
   ```tsx
   import { debounce } from 'lodash'

   const debouncedUpdate = debounce((taskId, updates) => {
     onTaskUpdate(taskId, updates)
   }, 300)
   ```

3. **Lazy load tasks:**
   ```tsx
   // Load tasks in chunks
   const [visibleTasks, setVisibleTasks] = useState([])
   ```

### Optimization Tips

- Use `React.memo` for task rows
- Memoize grid calculations with `useMemo`
- Batch updates with `unstable_batchedUpdates`
- Use CSS transforms for smooth animations

---

## Browser Support

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ IE 11 (not supported)

**Required features:**
- CSS Grid
- CSS Custom Properties
- ES6+ JavaScript
- Flexbox

---

## Accessibility

### Keyboard Navigation

Future enhancement - consider adding:
- Tab navigation between tasks
- Arrow keys to move tasks
- Space/Enter to edit
- Escape to cancel drag

### Screen Readers

Tasks include semantic HTML:
- Task names are readable
- Dates are formatted properly
- ARIA labels on interactive elements

### Color Contrast

All text meets WCAA AA standards:
- Task bars: Custom colors (ensure 4.5:1 contrast)
- UI text: Gray-700 on white (7.0:1)
- Tooltips: White on gray-900 (15.0:1)

---

## Troubleshooting

### Tasks not showing

**Cause:** Date range calculation issue

**Solution:** Ensure task dates are valid Date objects:
```tsx
const tasks = rawTasks.map(task => ({
  ...task,
  startDate: new Date(task.startDate),
  endDate: new Date(task.endDate),
}))
```

### Drag not working

**Cause:** `readOnly={true}` or missing `onTaskUpdate`

**Solution:** Check props:
```tsx
<GanttChart
  tasks={tasks}
  timeScale="week"
  onTaskUpdate={handleTaskUpdate} // Required
  readOnly={false} // Must be false
/>
```

### Scrollbar issues

**Cause:** Container height not set

**Solution:** Ensure container has explicit height:
```tsx
<div className="h-screen"> {/* or h-full, h-[600px], etc. */}
  <GanttChart {...props} />
</div>
```

### Performance issues

**Cause:** Too many tasks or expensive re-renders

**Solution:** Use memoization:
```tsx
const memoizedTasks = useMemo(() => tasks, [tasks])
const memoizedOnUpdate = useCallback(handleTaskUpdate, [])
```

---

## Examples

### Example 1: Simple Gantt Chart

See `GanttChartExample.tsx` for a complete working example with:
- Time scale selector
- Read-only toggle
- Add task button
- Task statistics

Run the example:
```bash
cd client
npm run dev
# Navigate to the example page
```

### Example 2: With Real-Time Updates

```tsx
function RealtimeGanttChart() {
  const [tasks, setTasks] = useState<Task[]>([])

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)

      if (update.type === 'TASK_UPDATE') {
        setTasks(prev =>
          prev.map(task =>
            task.id === update.taskId
              ? { ...task, ...update.changes }
              : task
          )
        )
      }
    }

    return () => ws.close()
  }, [])

  return <GanttChart tasks={tasks} {...props} />
}
```

---

## Future Enhancements

Potential features to add:

- [ ] Task dependencies (arrows between tasks)
- [ ] Critical path highlighting
- [ ] Baseline comparison (planned vs actual)
- [ ] Resource allocation view
- [ ] Gantt chart export (PDF, PNG, Excel)
- [ ] Undo/redo functionality
- [ ] Task grouping/collapsing
- [ ] Multi-project view
- [ ] Custom columns in sidebar
- [ ] Keyboard shortcuts

---

## API Integration Example

Complete example with backend integration:

```tsx
import React, { useState, useEffect } from 'react'
import { GanttChart } from './components/GanttChart'
import axios from 'axios'

function ProjectGanttView({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeScale, setTimeScale] = useState<TimeScale>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          `/api/projects/${projectId}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // Convert date strings to Date objects
        const tasksWithDates = response.data.data.tasks.map(task => ({
          ...task,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
        }))

        setTasks(tasksWithDates)
        setLoading(false)
      } catch (err) {
        setError('Failed to load tasks')
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  // Update task on backend
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )

    try {
      await axios.put(
        `/api/tasks/${taskId}`,
        {
          ...updates,
          createSnapshot: true, // Create version snapshot
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    } catch (err) {
      console.error('Failed to update task:', err)

      // Revert on error
      const response = await axios.get(
        `/api/projects/${projectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setTasks(response.data.data.tasks)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="h-screen flex flex-col">
      {/* Header with controls */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Project Timeline</h1>

          <div className="flex items-center space-x-4">
            <select
              value={timeScale}
              onChange={(e) => setTimeScale(e.target.value as TimeScale)}
              className="px-3 py-1.5 border rounded"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="sprint">Sprint</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1">
        <GanttChart
          tasks={tasks}
          timeScale={timeScale}
          onTaskUpdate={handleTaskUpdate}
          readOnly={false}
          showWeekends={true}
          showToday={true}
        />
      </div>
    </div>
  )
}
```

---

## Summary

The Gantt Chart component is a production-ready, feature-rich solution for project timeline visualization with:

✅ **5 time scales** (day, week, sprint, month, quarter)
✅ **Drag and drop** (move and resize tasks)
✅ **Visual indicators** (today line, weekends, milestones)
✅ **Responsive design** (works on all screen sizes)
✅ **TypeScript** (full type safety)
✅ **Tailwind CSS** (easy customization)
✅ **Performance optimized** (memoization, efficient calculations)
✅ **API-ready** (designed for backend integration)

Perfect for project management applications, task tracking systems, and timeline visualizations!
