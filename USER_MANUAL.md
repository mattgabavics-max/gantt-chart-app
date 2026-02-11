# Gantt Chart Application - User Manual

**Version:** 1.0
**Last Updated:** February 10, 2026
**Audience:** End Users

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Account Management](#account-management)
4. [Project Management](#project-management)
5. [Working with the Gantt Chart](#working-with-the-gantt-chart)
6. [Task Management](#task-management)
7. [Collaboration & Sharing](#collaboration--sharing)
8. [Version History](#version-history)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips & Best Practices](#tips--best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

### What is the Gantt Chart Application?

The Gantt Chart Application is a powerful, web-based project management tool that helps you visualize project timelines, manage tasks, and collaborate with your team. With intuitive drag-and-drop functionality and real-time updates, you can easily plan and track your projects.

### Key Features

- **Interactive Gantt Charts**: Drag and drop tasks to adjust schedules
- **Multiple Time Scales**: View your project by day, week, sprint, month, or quarter
- **Real-Time Auto-Save**: Never lose your work with automatic saving
- **Project Sharing**: Collaborate with team members via shareable links
- **Version History**: Track changes and restore previous versions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure Authentication**: Your data is protected with industry-standard security

### System Requirements

**Supported Browsers:**
- Google Chrome (recommended, version 90+)
- Mozilla Firefox (version 88+)
- Microsoft Edge (version 90+)
- Safari (version 14+)

**Internet Connection:**
- Required for all functionality
- Minimum 1 Mbps recommended

---

## Getting Started

### Creating an Account

1. Navigate to the application URL
2. Click **"Sign Up"** on the login page
3. Enter your email address
4. Create a strong password that includes:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
5. Click **"Create Account"**
6. You'll be automatically logged in to your new account

### Logging In

1. Navigate to the application URL
2. Enter your email address
3. Enter your password
4. Click **"Login"**
5. You'll be redirected to your project dashboard

### First-Time Setup

After logging in for the first time:

1. **Familiarize yourself with the interface**:
   - Project List view (main dashboard)
   - Navigation menu
   - User profile menu (top right)

2. **Create your first project**:
   - Click the **"+ New Project"** button
   - Give your project a meaningful name
   - Choose whether to make it public or private

3. **Add your first task**:
   - Click **"Add Task"** in your new project
   - Enter task details (name, start date, end date)
   - Select a color for visual distinction

---

## Account Management

### Updating Your Profile

Currently, the application uses email-based authentication. Your email serves as your identifier.

### Changing Your Password

To change your password:
1. Log out of your account
2. Use the password reset feature (if available)
3. Or contact your system administrator

### Logging Out

To log out securely:
1. Click your profile icon in the top right corner
2. Select **"Logout"** from the dropdown menu
3. You'll be redirected to the login page

---

## Project Management

### Creating a New Project

1. From the project list, click **"+ New Project"**
2. Enter a project name (required)
3. Choose visibility:
   - **Private**: Only you can see and edit
   - **Public**: Anyone with the link can view (editing requires share link)
4. Click **"Create"**

### Viewing Your Projects

The Project List displays all your projects in a grid or list view:

**Grid View** (default):
- Visual cards with project thumbnails
- Shows: Project name, owner, creation date, task count
- Click any card to open the project

**List View**:
- Compact table format
- Shows: Name, last updated, created date, owner, task count
- Click any row to open the project

### Searching and Filtering Projects

**Search**:
- Use the search bar at the top
- Searches project names and descriptions
- Results update in real-time as you type

**Filter Options**:
- **All Projects**: Show everything you have access to
- **My Projects**: Show only projects you own
- **Public Projects**: Show only public projects
- **Private Projects**: Show only private projects

**Sort Options**:
- Name (A-Z or Z-A)
- Last Updated (newest or oldest first)
- Created Date (newest or oldest first)
- Owner (A-Z)
- Task Count (most or fewest first)
- Access Type

### Editing Project Details

1. Open the project
2. Click the project name at the top
3. Type the new name
4. Press **Enter** to save or **Escape** to cancel
5. Changes are auto-saved

### Deleting a Project

⚠️ **Warning**: Deleting a project is permanent and cannot be undone.

1. From the Project List, hover over the project card
2. Click the **trash icon** (🗑️)
3. Confirm deletion in the dialog that appears
4. The project and all its tasks will be permanently deleted

---

## Working with the Gantt Chart

### Understanding the Gantt Chart Interface

The Gantt chart consists of:

**Left Sidebar**:
- Task list with task names
- Scrollable if you have many tasks
- Fixed width for easy reference

**Timeline Area**:
- Horizontal timeline with dates
- Colored bars representing tasks
- Grid lines for time divisions
- Today indicator (vertical line)
- Weekend highlighting (optional)

**Timeline Header**:
- Shows time periods (days, weeks, months, quarters)
- Grouped by the selected time scale
- Sticky header that stays visible while scrolling

### Choosing a Time Scale

The time scale controls the granularity of your timeline view:

**Available Time Scales**:

1. **Day View** (40px per day)
   - Best for: Short-term planning, daily tasks
   - Shows: Individual days with day numbers
   - Grouping: Days grouped by week

2. **Week View** (80px per week)
   - Best for: Sprint planning, weekly schedules
   - Shows: Week numbers
   - Grouping: Weeks grouped by month

3. **2-Week Sprint** (120px per 2 weeks)
   - Best for: Agile sprint planning
   - Shows: 2-week periods
   - Grouping: Sprints grouped by month

4. **Month View** (100px per month)
   - Best for: Long-term planning, quarterly reviews
   - Shows: Month names
   - Grouping: Months grouped by quarter

5. **Quarter View** (150px per quarter)
   - Best for: Strategic planning, yearly roadmaps
   - Shows: Quarter labels (Q1, Q2, Q3, Q4)
   - Grouping: Quarters grouped by year

**To Change Time Scale**:
1. Click the **time scale selector** in the toolbar
2. Choose your preferred scale from the dropdown
3. The chart automatically adjusts

### View Options

Click the **"View Options"** button in the toolbar to access:

**Show/Hide Weekends**:
- Toggle weekend highlighting (Saturdays and Sundays)
- Weekends appear with a subtle gray background

**Show/Hide Today Line**:
- Toggle the vertical line marking today's date
- Helps you quickly identify current progress

**Read-Only Mode**:
- Lock the chart to prevent accidental changes
- Useful for presentations or reviews

### Zooming In/Out

Use the zoom controls in the toolbar:

**Zoom In** (magnifying glass +):
- Increases time scale detail
- Day → Week → 2-Week → Month → Quarter

**Zoom Out** (magnifying glass -):
- Decreases time scale detail
- Quarter → Month → 2-Week → Week → Day

**Zoom Indicator**:
- 5 dots showing current zoom level
- Filled dots indicate current position

### Navigating the Timeline

**Horizontal Scrolling**:
- Use your mouse wheel (with Shift key)
- Click and drag the scrollbar
- Use arrow keys

**Vertical Scrolling**:
- Use your mouse wheel
- Click and drag the scrollbar

**Jump to Today**:
- The chart automatically scrolls to show today's date when you first open it
- The today line helps you stay oriented

---

## Task Management

### Creating a New Task

**Method 1: Quick Add**
1. Click the **"+ Add Task"** button
2. An inline form appears at the bottom of the task list
3. Fill in:
   - Task name (required, max 200 characters)
   - Start date (required)
   - End date (required, must be after start date)
   - Color (optional, choose from 8 presets or custom)
4. Press **Enter** or click **"Add"**

**Method 2: Full Modal**
1. Click **"+ New Task"** or double-click empty space
2. A larger form modal opens
3. Fill in all task details
4. Click **"Create Task"**

**Color Selection**:
- 8 preset colors for quick selection
- Custom color picker for specific brand colors
- Colors help visually distinguish different task types or priorities

### Editing Task Details

**Quick Edit**:
1. Click on a task bar in the chart
2. A popup shows task details
3. Click **"Edit"** to modify
4. Update any field
5. Click **"Save"** or press **Enter**

**Inline Editing**:
1. Double-click the task name in the left sidebar
2. Type the new name
3. Press **Enter** to save

### Moving Tasks (Changing Dates)

**Drag to Move**:
1. Click and hold on a task bar
2. Drag horizontally to change dates
3. The task bar follows your cursor
4. Release to set the new dates
5. Changes are auto-saved

**Visual Feedback**:
- Task bar becomes semi-transparent while dragging
- Cursor changes to indicate drag mode
- Date tooltip shows new dates while dragging

**Smart Snapping**:
- Tasks snap to time divisions based on your current time scale
- Day view: Snaps to individual days
- Week view: Snaps to weeks
- Month view: Snaps to months

### Resizing Tasks (Adjusting Duration)

**Drag to Resize**:
1. Hover over the left or right edge of a task bar
2. The cursor changes to a resize cursor (↔)
3. Click and drag to adjust duration:
   - **Left edge**: Change start date, keep end date fixed
   - **Right edge**: Change end date, keep start date fixed
4. Release to apply changes
5. Changes are auto-saved

**Constraints**:
- Minimum duration: 1 time unit (1 day, 1 week, etc.)
- Start date must be before end date
- Invalid resizes are prevented

### Changing Task Colors

1. Click on a task bar
2. Click the **color picker** in the edit form
3. Choose from preset colors or use custom color
4. The task bar updates immediately
5. Auto-saved

### Deleting a Task

1. Click on a task bar to select it
2. Click the **delete button** (🗑️) in the popup
3. Confirm deletion
4. The task is permanently removed
5. Changes are auto-saved

**Bulk Delete**:
- Select multiple tasks (if multi-select enabled)
- Click **"Delete Selected"**
- Confirm bulk deletion

---

## Collaboration & Sharing

### Sharing a Project

**Creating a Share Link**:

1. Open the project you want to share
2. Click the **"Share"** button in the project header
3. In the Share Modal, click **"Create New Link"**
4. Configure the share link:
   - **Access Type**:
     - **Read-Only**: Recipients can view but not edit
     - **Editable**: Recipients can view and make changes
   - **Expiration**: Choose when the link expires:
     - 24 hours
     - 7 days
     - 30 days
     - Never (permanent)
5. Click **"Create Link"**

**Copying a Share Link**:
1. The link appears in the list
2. Click the **"Copy Link"** button
3. A success message confirms the link is copied
4. Share the link via email, chat, etc.

**Managing Share Links**:
- View all active share links for a project
- See access type and expiration date
- Monitor access count (how many times accessed)
- See last accessed date
- Revoke links at any time

### Accessing a Shared Project

**As a Recipient**:

1. Click the share link you received
2. The shared project opens (no login required)
3. You'll see:
   - Project name and description
   - Full Gantt chart view
   - All tasks and timeline
   - **If Read-Only**: View only, no edit controls
   - **If Editable**: Full editing capabilities

**Limitations**:
- Cannot change project name or settings
- Cannot create new share links
- Cannot access version history
- Cannot delete the project

**Copying to Your Account** (Authenticated Users):
1. While viewing a shared project, click **"Copy to My Account"**
2. A new project is created in your account
3. You become the owner with full control
4. Original shared project remains unchanged

### Revoking Access

To revoke a share link:

1. Open the project
2. Click **"Share"** button
3. Find the link you want to revoke
4. Click the **"Revoke"** button (🗑️)
5. Confirm revocation
6. The link immediately stops working

**Note**: Anyone who already has the project open can continue working until they refresh.

---

## Version History

### Understanding Version History

Version history tracks changes to your project over time. Every significant change creates a snapshot of your project state.

**Automatic Versioning**:
- Triggered when tasks are added, modified, or deleted
- Creates lightweight snapshots
- Limited retention (auto-cleanup of old versions)

**Manual Versioning**:
- Create explicit checkpoints with descriptions
- Permanent retention (not auto-deleted)
- Best for milestones or significant changes

### Viewing Version History

1. Open a project
2. Click the **"Version History"** button in the toolbar
3. A side panel opens showing all versions
4. Each version shows:
   - Version number
   - Creation date and time
   - Creator (who made the changes)
   - Description (for manual versions)
   - Task count at that time

### Creating a Manual Version

1. Open version history panel
2. Click **"Create Version"**
3. Enter a description:
   - "Phase 1 Complete"
   - "Before client review"
   - "Baseline schedule"
4. Click **"Save Version"**
5. The version appears in the list

**Best Practices for Manual Versions**:
- Create versions before major changes
- Create versions at project milestones
- Use clear, descriptive names
- Create versions before sharing for review

### Comparing Versions

**To compare two versions**:

1. Open version history panel
2. Select the first version (click on it)
3. Click **"Compare"** button
4. Select the second version to compare against
5. The **Version Diff Viewer** opens

**Understanding the Diff View**:

The diff viewer shows changes in a side-by-side layout:

**Color Coding**:
- 🟢 **Green**: New tasks added
- 🔴 **Red**: Tasks removed
- 🟡 **Yellow**: Tasks modified

**Change Details**:
- Task name changes
- Date changes (start/end)
- Color changes
- Position changes

**Summary Statistics**:
- Total tasks added
- Total tasks removed
- Total tasks modified
- Net change in task count

### Restoring a Previous Version

⚠️ **Warning**: Restoring a version will replace your current project state.

**To restore a version**:

1. Open version history panel
2. Find the version you want to restore
3. Click the **"Restore"** button
4. Review the confirmation dialog:
   - Shows what version you're restoring
   - Warns that current state will be backed up
5. Confirm restoration

**What Happens**:
1. Current project state is saved as a new version (automatic backup)
2. Project is restored to the selected version state
3. All tasks are replaced with the version snapshot
4. You can undo by restoring the backup version

### Deleting Versions

**Manual Versions**: Can be deleted by project owner

1. Open version history panel
2. Find the version to delete
3. Click the **delete icon** (🗑️)
4. Confirm deletion
5. The version is permanently removed

**Automatic Versions**: Automatically cleaned up to save space

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Force save project |
| `Ctrl/Cmd + Z` | Undo last change |
| `Ctrl/Cmd + Shift + Z` | Redo last change |
| `Ctrl/Cmd + /` | Show keyboard shortcuts help |
| `Escape` | Cancel current action |
| `?` | Show help |

### Task Management Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Create new task |
| `Enter` | Save current task |
| `Escape` | Cancel editing |
| `Delete` | Delete selected task |
| `Arrow Keys` | Navigate between tasks |
| `Tab` | Move to next field |
| `Shift + Tab` | Move to previous field |

### View Shortcuts

| Shortcut | Action |
|----------|--------|
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to default |
| `T` | Jump to today |
| `W` | Toggle weekend visibility |
| `G` | Toggle grid lines |
| `R` | Toggle read-only mode |

### Form Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form |
| `Escape` | Close form/modal |
| `Tab` | Next field |
| `Shift + Tab` | Previous field |

**To view all shortcuts**:
- Press `?` or `Ctrl/Cmd + /`
- A help modal appears with all available shortcuts

---

## Tips & Best Practices

### Project Organization

**Naming Conventions**:
- Use clear, descriptive project names
- Include dates or phase numbers: "Q1 2026 Marketing Campaign"
- Use consistent naming across related projects

**Task Organization**:
- Break large tasks into smaller subtasks
- Use consistent task naming patterns
- Group related tasks with same colors
- Order tasks logically in the sidebar

**Color Coding System**:
- Create a color scheme for your team:
  - 🔵 Blue: Development tasks
  - 🟢 Green: Design tasks
  - 🟡 Yellow: Review/QA tasks
  - 🔴 Red: Blocked/urgent tasks
  - 🟣 Purple: Research tasks

### Effective Timeline Planning

**Choose the Right Time Scale**:
- Short projects (< 1 month): Day or Week view
- Medium projects (1-6 months): Week or Sprint view
- Long projects (> 6 months): Month or Quarter view

**Avoid Over-Crowding**:
- Don't create tasks shorter than your time scale unit
- Leave buffer time between dependent tasks
- Break large tasks into phases

**Use Milestones**:
- Mark important deadlines
- Highlight phase completions
- Show client review dates

### Collaboration Best Practices

**Sharing Projects**:
- Use Read-Only links for status updates
- Use Editable links only for active collaborators
- Set appropriate expiration dates
- Regularly audit and revoke unused links

**Version Control**:
- Create manual versions before sharing
- Create versions at the start of each phase
- Add descriptive version names
- Don't rely solely on auto-versions

**Communication**:
- Use version descriptions to document changes
- Create versions after team meetings
- Reference version numbers in communications

### Performance Tips

**For Large Projects (100+ tasks)**:
- Use appropriate time scales (avoid Day view)
- Consider breaking into multiple projects
- Use filters to focus on specific task groups
- Close unused projects

**Browser Performance**:
- Keep only one project open at a time
- Close unused browser tabs
- Clear browser cache periodically
- Use a modern browser (Chrome, Firefox, Edge)

### Data Safety

**Regular Backups**:
- Create manual versions regularly
- Export project data periodically
- Keep important project data in multiple places

**Before Major Changes**:
- Create a manual version
- Document the reason for changes
- Test changes with a few tasks first

**Security**:
- Use strong, unique passwords
- Log out when using shared computers
- Be careful when sharing project links
- Regularly review who has access

---

## Troubleshooting

### Login Issues

**Problem**: Cannot log in / "Invalid credentials" error

**Solutions**:
1. Verify your email address is correct
2. Check your password (case-sensitive)
3. Ensure Caps Lock is off
4. Try resetting your password
5. Clear browser cache and cookies
6. Try a different browser

**Problem**: "Account locked" message

**Solutions**:
1. Wait 15 minutes (rate limiting)
2. Contact system administrator
3. Use password reset

### Chart Display Issues

**Problem**: Tasks not appearing

**Solutions**:
1. Refresh the browser (F5)
2. Check if tasks are outside visible date range
3. Try changing time scale
4. Check if filters are applied
5. Verify tasks exist in task list sidebar

**Problem**: Chart looks distorted

**Solutions**:
1. Try zooming in/out
2. Refresh the browser
3. Clear browser cache
4. Resize browser window
5. Try a different browser

**Problem**: Scrolling doesn't work

**Solutions**:
1. Check if chart is in read-only mode
2. Try clicking on the chart area first
3. Use scrollbar instead of mouse wheel
4. Refresh the page

### Drag and Drop Issues

**Problem**: Cannot drag tasks

**Solutions**:
1. Check if project is in read-only mode
2. Verify you're the project owner or have edit access
3. Try clicking the task first, then dragging
4. Refresh the browser
5. Try a different browser (Chrome recommended)

**Problem**: Tasks snap to wrong dates

**Solutions**:
1. This is based on your time scale
2. Zoom in for finer control (use Day view)
3. Edit dates manually if needed
4. Check time scale setting

### Auto-Save Issues

**Problem**: "Auto-save failed" message

**Solutions**:
1. Check your internet connection
2. Refresh and try again
3. Save manually (Ctrl/Cmd + S)
4. Check browser console for errors
5. Contact support if persistent

**Problem**: Changes not saving

**Solutions**:
1. Wait for auto-save (5 seconds by default)
2. Force save with Ctrl/Cmd + S
3. Check for "Saving..." indicator
4. Verify internet connection
5. Refresh and check if changes persisted

### Sharing Issues

**Problem**: Share link doesn't work

**Solutions**:
1. Check if link has expired
2. Verify link was copied completely
3. Check if link was revoked
4. Try creating a new share link
5. Contact project owner

**Problem**: Cannot edit shared project

**Solutions**:
1. Check link access type (may be Read-Only)
2. Verify link hasn't expired
3. Request an Editable link from owner
4. Try copying project to your account

### Performance Issues

**Problem**: Chart loads slowly

**Solutions**:
1. Use a higher-level time scale (Month instead of Day)
2. Close other browser tabs
3. Clear browser cache
4. Check internet connection speed
5. Try a different browser

**Problem**: Browser freezes

**Solutions**:
1. Reduce number of open projects
2. Use higher-level time scale
3. Close and reopen browser
4. Update browser to latest version
5. Check computer memory usage

### Version History Issues

**Problem**: Cannot restore version

**Solutions**:
1. Verify you're the project owner
2. Refresh the page
3. Try restoring a different version
4. Check browser console for errors
5. Contact support

**Problem**: Version not appearing

**Solutions**:
1. Wait a moment and refresh
2. Check if auto-save is enabled
3. Verify changes were made
4. Create manual version instead

---

## FAQ

### General Questions

**Q: Is my data safe?**
A: Yes. We use industry-standard security including:
- Encrypted passwords (bcrypt)
- Secure HTTPS connections
- JWT authentication
- HttpOnly cookies
- CSRF protection
- Regular security audits

**Q: Can I use this on mobile?**
A: Yes! The application is fully responsive and works on tablets and smartphones. Some advanced features work best on larger screens.

**Q: Is there an offline mode?**
A: No, an internet connection is required. The app uses cloud storage for real-time collaboration and data safety.

**Q: How often does auto-save work?**
A: By default, changes are saved 5 seconds after you stop editing. You can also force save with Ctrl/Cmd + S.

**Q: Can I export my project data?**
A: Yes, use the Export option in the toolbar. You can export as PDF, PNG, or CSV (if implemented).

### Account Questions

**Q: Can I change my email address?**
A: Contact your system administrator for email changes.

**Q: What happens if I forget my password?**
A: Use the "Forgot Password" link on the login page (if available) or contact support.

**Q: Can I delete my account?**
A: Contact your system administrator for account deletion requests.

**Q: Is there a free trial?**
A: Contact your organization's administrator for access and pricing information.

### Project Questions

**Q: How many projects can I create?**
A: There's no hard limit, but performance is best with fewer than 50 active projects.

**Q: How many tasks can a project have?**
A: Projects perform best with fewer than 500 tasks. Consider splitting large projects.

**Q: Can I have multiple people edit simultaneously?**
A: Yes, with share links set to "Editable". Changes from different users are saved independently.

**Q: What's the difference between public and private projects?**
A:
- **Private**: Only you can see and edit
- **Public**: Anyone with the link can view; editing requires a share link

### Task Questions

**Q: Can I create recurring tasks?**
A: Not currently. You'll need to create each task instance separately.

**Q: Can tasks have dependencies?**
A: Visual dependencies (one task starts when another ends) can be created manually by adjusting dates. Automatic dependency management is not currently available.

**Q: Can I assign tasks to team members?**
A: Task assignment is not currently available. Use task names or colors to indicate assignments.

**Q: What's the minimum task duration?**
A: Depends on your time scale:
- Day view: 1 day minimum
- Week view: 1 week minimum
- Month view: 1 month minimum

### Sharing Questions

**Q: Can I see who viewed my shared project?**
A: You can see access count and last accessed time, but not individual viewer identities.

**Q: Can someone with a Read-Only link make changes?**
A: No. Read-Only links only allow viewing, not editing.

**Q: Do shared project links expire?**
A: Only if you set an expiration date. You can create permanent links or time-limited links.

**Q: Can I edit expiration after creating a link?**
A: No. You'll need to revoke the old link and create a new one with the desired expiration.

### Version History Questions

**Q: How long are versions kept?**
A:
- **Manual versions**: Kept permanently
- **Auto versions**: Cleaned up after 30 days or when limit reached

**Q: Can I compare non-consecutive versions?**
A: Yes! Select any two versions to compare, regardless of order.

**Q: What happens to versions if I delete the project?**
A: All versions are deleted with the project. Export or restore important versions before deleting.

**Q: Can collaborators see version history?**
A: No. Only the project owner can access version history.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Edge, and Safari (recent versions). Chrome is recommended for best performance.

**Q: Do I need to install anything?**
A: No, it's a web application. Just use your browser.

**Q: Why do I see "Please enable JavaScript"?**
A: The application requires JavaScript. Enable it in your browser settings.

**Q: Can I use browser extensions with this?**
A: Most extensions work fine. Ad blockers and privacy extensions may interfere with some features.

---

## Support Contact

### Getting Help

If you encounter issues not covered in this manual:

1. **Check the Troubleshooting section** above
2. **Review the FAQ** for common questions
3. **Contact your system administrator**
4. **Submit a support ticket** at your organization's help desk

### Providing Feedback

We value your feedback! To suggest improvements:

1. Document your suggestion with screenshots
2. Explain your use case
3. Submit via your organization's feedback channel

### Reporting Bugs

When reporting bugs, include:

1. **What you were trying to do**
2. **What actually happened**
3. **Steps to reproduce the issue**
4. **Browser and operating system**
5. **Screenshots or screen recording** (if applicable)
6. **Error messages** (if any)

---

## Document Information

**Version**: 1.0
**Last Updated**: February 10, 2026
**Maintained By**: Documentation Team
**For Support**: Contact your system administrator

---

**Happy Project Planning! 🎯**
