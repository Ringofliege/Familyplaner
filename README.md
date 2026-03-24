# FamilyOS – Family Operating System

A mobile-first family management application that reduces mental load, automatically assigns responsibilities, creates fairness and transparency, and adapts to real life.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

### Core Systems

| Module | Purpose |
|--------|---------|
| **Smart Calendar** | Multi-entity calendar with rule-based responsibilities and conflict detection |
| **Task System** | Recurring, one-time, project, and mental-load tasks with dependencies |
| **Energy & Load Model** | Classifies every 30-min time slot as free/limited/blocked per person |
| **Fairness System** | Tracks effort across childcare, household, mental load, and pets |
| **Meal Planning** | Weekly planner with difficulty/time-aware suggestions |
| **Resource System** | Car charging, cash availability tracking |
| **Automation Engine** | Daily suggestions, responsibility proposals, reminders |

### Tech Stack

- **React 19** + **TypeScript** – UI framework
- **Vite** – Build tool
- **Tailwind CSS v4** – Styling
- **React Router v7** – Navigation
- **date-fns** – Date utilities
- **Lucide React** – Icons
- **Vitest** – Testing

### Project Structure

```
src/
├── models/        # TypeScript interfaces & types
├── engine/        # Core algorithms
│   ├── energy.ts         # Time slot classification
│   ├── responsibility.ts # Task assignment engine
│   ├── fairness.ts       # Fairness tracking & scoring
│   ├── automation.ts     # Suggestion & reminder generation
│   └── meals.ts          # Meal planning engine
├── data/          # Default configuration
│   ├── family.ts         # Family members
│   ├── schedules.ts      # Work & activity schedules
│   ├── tasks.ts          # Recurring tasks
│   ├── meals.ts          # Sample meals
│   └── resources.ts      # Car & resources
├── hooks/         # React state management
├── components/    # Shared UI components
├── pages/         # Main views
│   ├── Today/     # Daily dashboard
│   ├── Calendar/  # Weekly calendar
│   ├── Tasks/     # Task management
│   ├── Meals/     # Meal planning
│   └── Family/    # Fairness & settings
├── App.tsx        # Root app with routing
└── main.tsx       # Entry point
```

### Responsibility Engine

The engine assigns tasks based on a priority cascade:

1. **Fixed assignments** – Explicitly assigned tasks
2. **Preferred assignee** – If available, prefer the designated person
3. **Availability** – Check who has more free time (energy blocks)
4. **Fairness balance** – Assign to the person with fewer points
5. **Childcare rules** – Father brings (default), Mother picks up; reversed on Wednesday
6. **Stress mode** – Reduce load for the stressed member

### Fairness Scoring

Points are weighted by effort and category:

| Factor | Multiplier |
|--------|-----------|
| Passive effort | 1 point |
| Light effort | 2 points |
| Moderate effort | 3 points |
| Heavy effort | 5 points |
| Mental load | ×1.5 |
| Childcare | ×1.5 |
| Duration bonus | +1 per 30 min over 15 min |

### Smart Features

- **Today Summary** – Daily briefing with tasks, responsibilities, suggestions
- **Take Over** – One tap to take a task from your partner
- **Thank You** – Express gratitude for completed tasks
- **Stress Mode** – Signal "this week is chaotic" to reduce load
- **Weekly Review** – Fairness balance, highlights, interactions

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
npm run test      # Run all tests
npm run test:watch # Watch mode
```
