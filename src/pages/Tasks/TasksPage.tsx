import { useState, useMemo } from 'react';
import { getDay } from 'date-fns';
import { Plus, X, ListChecks } from 'lucide-react';
import type {
  Task,
  FamilyMemberId,
  TaskCategory,
  TaskType,
  EffortLevel,
  DayOfWeek,
} from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import { Card, TaskCard, Badge, EmptyState } from '../../components';

interface TasksPageProps {
  state: FamilyState;
  completeTask: (taskId: string, completedBy: FamilyMemberId) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  takeOverTask: (taskId: string, to: FamilyMemberId) => void;
  sendThankYou: (to: FamilyMemberId, taskId?: string, message?: string) => void;
}

type FilterTab = 'alle' | 'heute' | 'offen' | 'erledigt';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'heute', label: 'Heute' },
  { key: 'offen', label: 'Offen' },
  { key: 'erledigt', label: 'Erledigt' },
];

const CATEGORIES: { key: TaskCategory; label: string; color: 'pink' | 'purple' | 'green' | 'yellow' | 'blue' | 'gray' }[] = [
  { key: 'childcare', label: 'Kinder', color: 'pink' },
  { key: 'household', label: 'Haushalt', color: 'purple' },
  { key: 'pets', label: 'Tiere', color: 'green' },
  { key: 'food', label: 'Essen', color: 'yellow' },
  { key: 'admin', label: 'Admin', color: 'blue' },
  { key: 'personal', label: 'Persönlich', color: 'gray' },
];

const EMPTY_FORM: {
  title: string;
  category: TaskCategory;
  effort: EffortLevel;
  duration: string;
  type: TaskType;
  assignedTo: FamilyMemberId | '';
} = {
  title: '',
  category: 'household',
  effort: 'light',
  duration: '15',
  type: 'recurring',
  assignedTo: '',
};

export function TasksPage({
  state,
  completeTask,
  addTask,
  deleteTask,
  takeOverTask,
  sendThankYou,
}: TasksPageProps) {
  const [filter, setFilter] = useState<FilterTab>('alle');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const today = getDay(new Date()) as DayOfWeek;
  const currentUser = state.currentUser;
  const otherUser: FamilyMemberId = currentUser === 'mother' ? 'father' : 'mother';

  const filteredTasks = useMemo(() => {
    let tasks = [...state.tasks];

    // Tab filter
    switch (filter) {
      case 'heute':
        tasks = tasks.filter((t) => {
          if (t.recurrenceDays && t.recurrenceDays.length > 0) return t.recurrenceDays.includes(today);
          if (t.recurrence === 'daily') return true;
          if (t.recurrence === 'weekday') return today >= 1 && today <= 5;
          return false;
        });
        break;
      case 'offen':
        tasks = tasks.filter((t) => !t.completed);
        break;
      case 'erledigt':
        tasks = tasks.filter((t) => t.completed);
        break;
    }

    // Category filter
    if (categoryFilter) {
      tasks = tasks.filter((t) => t.category === categoryFilter);
    }

    // Sort: incomplete first, then by category
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.category.localeCompare(b.category);
    });

    return tasks;
  }, [state.tasks, filter, categoryFilter, today]);

  const handleAddTask = () => {
    if (!form.title.trim()) return;

    const newTask: Task = {
      id: `task-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.title.trim(),
      type: form.type,
      category: form.category,
      effort: form.effort,
      durationMinutes: parseInt(form.duration, 10) || 15,
      assignedTo: form.assignedTo || undefined,
      fairnessPoints: form.effort === 'passive' ? 1 : form.effort === 'light' ? 2 : form.effort === 'moderate' ? 3 : 5,
    };

    addTask(newTask);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <div className="pb-24 px-4 space-y-4 pt-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() =>
              setCategoryFilter(categoryFilter === cat.key ? null : cat.key)
            }
          >
            <Badge
              label={cat.label}
              color={categoryFilter === cat.key ? cat.color : 'gray'}
              size="md"
            />
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div key={task.id} className="relative">
              <TaskCard
                task={task}
                onComplete={(id) => completeTask(id, currentUser)}
                onTakeOver={(id) => takeOverTask(id, currentUser)}
                onThankYou={(id) => sendThankYou(otherUser, id)}
              />
              {/* Delete button */}
              <button
                onClick={() => deleteTask(task.id)}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs hover:bg-red-200 transition-colors"
                aria-label={`Aufgabe "${task.title}" löschen`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ListChecks className="w-12 h-12" />}
          title="Keine Aufgaben"
          description="Keine Aufgaben passen zu deinem Filter. Ändere die Filter oder füge eine neue Aufgabe hinzu."
        />
      )}

      {/* Add task form (inline) */}
      {showForm && (
        <Card className="border border-blue-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Neue Aufgabe
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Aufgabenname"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Kategorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as TaskCategory })
                  }
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Aufwand
                </label>
                <select
                  value={form.effort}
                  onChange={(e) =>
                    setForm({ ...form, effort: e.target.value as EffortLevel })
                  }
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="passive">Passiv</option>
                  <option value="light">Leicht</option>
                  <option value="moderate">Mittel</option>
                  <option value="heavy">Schwer</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Dauer (Min.)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Typ
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as TaskType })
                  }
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="recurring">Wiederkehrend</option>
                  <option value="one-time">Einmalig</option>
                  <option value="project">Projekt</option>
                  <option value="mental-load">Mental Load</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Zugewiesen an
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assignedTo: e.target.value as FamilyMemberId | '',
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="">Automatisch</option>
                <option value="mother">Mama</option>
                <option value="father">Papa</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                className="px-4 bg-slate-100 text-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* FAB */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-20"
          aria-label="Neue Aufgabe hinzufügen"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
