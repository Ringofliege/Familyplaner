import { useMemo, useState } from 'react';
import {
  Gift,
  Plus,
  Sparkles,
  Settings2,
  Store,
  Trash2,
  Coins,
  WandSparkles,
  CheckSquare,
} from 'lucide-react';
import type {
  EffortLevel,
  FamilyMemberId,
  ShopItem,
  ShopItemTheme,
  Task,
  TaskCategory,
  TaskType,
} from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import { calculatePoints } from '../../engine/fairness';
import { familyMembers } from '../../data/family';
import { Avatar, Badge, Card, EmptyState } from '../../components';

interface AdminPageProps {
  state: FamilyState;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addShopItem: (item: ShopItem) => void;
  deleteShopItem: (itemId: string) => void;
  redeemShopItem: (itemId: string, memberId: FamilyMemberId) => void;
}

type AdminTab = 'tasks' | 'shop';

type TaskFormState = {
  title: string;
  description: string;
  category: TaskCategory;
  effort: EffortLevel;
  duration: string;
  type: TaskType;
  assignedTo: FamilyMemberId | '';
  fairnessPoints: string;
};

type RewardFormState = {
  name: string;
  description: string;
  cost: string;
  icon: string;
  theme: ShopItemTheme;
};

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Settings2 }[] = [
  { key: 'tasks', label: 'Task Studio', icon: CheckSquare },
  { key: 'shop', label: 'Reward Shop', icon: Store },
];

const CATEGORIES: { key: TaskCategory; label: string }[] = [
  { key: 'childcare', label: 'Kinder' },
  { key: 'household', label: 'Haushalt' },
  { key: 'pets', label: 'Tiere' },
  { key: 'food', label: 'Essen' },
  { key: 'admin', label: 'Admin' },
  { key: 'personal', label: 'Persönlich' },
  { key: 'garden', label: 'Garten' },
];

const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: 'recurring', label: 'Wiederkehrend' },
  { key: 'one-time', label: 'Einmalig' },
  { key: 'project', label: 'Projekt' },
  { key: 'mental-load', label: 'Mental Load' },
];

const TASK_FORM_DEFAULTS: TaskFormState = {
  title: '',
  description: '',
  category: 'household',
  effort: 'light',
  duration: '20',
  type: 'recurring',
  assignedTo: '',
  fairnessPoints: '',
};

const REWARD_FORM_DEFAULTS: RewardFormState = {
  name: '',
  description: '',
  cost: '30',
  icon: '🎁',
  theme: 'purple',
};

const themeClasses: Record<
  ShopItemTheme,
  { card: string; badge: 'pink' | 'blue' | 'purple' | 'green' | 'yellow' }
> = {
  pink: {
    card: 'from-pink-500/18 via-rose-400/14 to-transparent',
    badge: 'pink',
  },
  blue: {
    card: 'from-sky-500/18 via-blue-400/14 to-transparent',
    badge: 'blue',
  },
  purple: {
    card: 'from-violet-500/18 via-purple-400/14 to-transparent',
    badge: 'purple',
  },
  green: {
    card: 'from-emerald-500/18 via-green-400/14 to-transparent',
    badge: 'green',
  },
  yellow: {
    card: 'from-amber-400/18 via-yellow-300/14 to-transparent',
    badge: 'yellow',
  },
};

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white/85 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200';

function buildTaskFromForm(form: TaskFormState, suggestedPoints: number): Task {
  const customPoints = Number(form.fairnessPoints);
  return {
    id: `task-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    type: form.type,
    category: form.category,
    effort: form.effort,
    durationMinutes: Number(form.duration) || 15,
    assignedTo: form.assignedTo || undefined,
    fairnessPoints: customPoints > 0 ? customPoints : suggestedPoints,
  };
}

export function AdminPage({
  state,
  addTask,
  updateTask,
  deleteTask,
  addShopItem,
  deleteShopItem,
  redeemShopItem,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('tasks');
  const [taskForm, setTaskForm] = useState<TaskFormState>(TASK_FORM_DEFAULTS);
  const [rewardForm, setRewardForm] = useState<RewardFormState>(REWARD_FORM_DEFAULTS);
  const [taskPointDrafts, setTaskPointDrafts] = useState<Record<string, string>>({});

  const suggestedPoints = useMemo(
    () =>
      calculatePoints({
        id: 'preview-task',
        title: taskForm.title || 'Preview',
        description: taskForm.description || undefined,
        category: taskForm.category,
        effort: taskForm.effort,
        durationMinutes: Number(taskForm.duration) || 15,
        type: taskForm.type,
        assignedTo: taskForm.assignedTo || undefined,
        fairnessPoints: 0,
      }),
    [taskForm],
  );

  const taskStats = useMemo(() => {
    const openTasks = state.tasks.filter((task) => !task.completed).length;
    const totalTaskPoints = state.tasks.reduce((sum, task) => sum + task.fairnessPoints, 0);
    return {
      openTasks,
      totalTaskPoints,
      rewardsInStore: state.shopItems.length,
    };
  }, [state.shopItems.length, state.tasks]);

  const sortedTasks = useMemo(
    () =>
      [...state.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.fairnessPoints - a.fairnessPoints;
      }),
    [state.tasks],
  );

  const currentUserName = familyMembers.find((member) => member.id === state.currentUser)?.name ?? 'Aktiver User';

  const handleAddTask = () => {
    if (!taskForm.title.trim()) return;
    addTask(buildTaskFromForm(taskForm, suggestedPoints));
    setTaskForm(TASK_FORM_DEFAULTS);
  };

  const handleSaveTaskPoints = (task: Task) => {
    const rawValue = taskPointDrafts[task.id];
    const nextPoints = Number(rawValue);
    if (!Number.isFinite(nextPoints) || nextPoints <= 0) return;
    updateTask(task.id, { fairnessPoints: nextPoints });
    setTaskPointDrafts((prev) => {
      const nextDrafts = { ...prev };
      delete nextDrafts[task.id];
      return nextDrafts;
    });
  };

  const handleAddReward = () => {
    if (!rewardForm.name.trim()) return;
    addShopItem({
      id: `reward-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: rewardForm.name.trim(),
      description: rewardForm.description.trim() || undefined,
      cost: Number(rewardForm.cost) || 10,
      icon: rewardForm.icon.trim() || '🎁',
      theme: rewardForm.theme,
      featured: Number(rewardForm.cost) >= 40,
    });
    setRewardForm(REWARD_FORM_DEFAULTS);
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <Card className="section-fade-in overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_28%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Control center</p>
              <h2 className="mt-3 text-2xl font-bold">Admin, Punkte und Reward-Shop</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Hier steuerst du fehlende Kernfunktionen: neue Aufgaben anlegen, Punkte pro Task feinjustieren und belohnende Shop-Items wie Massage oder Date Night verwalten.
              </p>
            </div>
            <Badge label={`Live für ${currentUserName}`} color="purple" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Offene Tasks</p>
              <p className="mt-2 text-3xl font-bold text-white">{taskStats.openTasks}</p>
              <p className="mt-1 text-xs text-white/70">bereit für Automatisierung & Priorisierung</p>
            </div>
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Task-Punkte</p>
              <p className="mt-2 text-3xl font-bold text-white">{taskStats.totalTaskPoints}</p>
              <p className="mt-1 text-xs text-white/70">aktuell im Task-Backlog hinterlegt</p>
            </div>
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Reward-Shop</p>
              <p className="mt-2 text-3xl font-bold text-white">{taskStats.rewardsInStore}</p>
              <p className="mt-1 text-xs text-white/70">Belohnungen sofort verfügbar</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="section-fade-in flex gap-2 overflow-x-auto pb-1">
        {ADMIN_TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex min-h-[52px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'glass-panel text-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </section>

      {activeTab === 'tasks' ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <Card className="section-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Neue Aufgabe anlegen</h3>
                  <p className="mt-1 text-xs text-slate-500">Mit vorgeschlagenen Punkten oder bewusstem Override.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <WandSparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Titel</label>
                  <input
                    value={taskForm.title}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                    className={inputClassName}
                    placeholder="z. B. Wochenendeinkauf planen"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Beschreibung</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                    className={`${inputClassName} min-h-24 resize-none`}
                    placeholder="Optional: Details, Kontext oder Erinnerungen"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Kategorie</label>
                  <select
                    value={taskForm.category}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, category: event.target.value as TaskCategory }))}
                    className={inputClassName}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Aufwand</label>
                  <select
                    value={taskForm.effort}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, effort: event.target.value as EffortLevel }))}
                    className={inputClassName}
                  >
                    <option value="passive">Passiv</option>
                    <option value="light">Leicht</option>
                    <option value="moderate">Mittel</option>
                    <option value="heavy">Schwer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Dauer (Min.)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={taskForm.duration}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, duration: event.target.value }))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Typ</label>
                  <select
                    value={taskForm.type}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, type: event.target.value as TaskType }))}
                    className={inputClassName}
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Zugewiesen an</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value as FamilyMemberId | '' }))}
                    className={inputClassName}
                  >
                    <option value="">Automatisch</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Fairness-Punkte</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={taskForm.fairnessPoints}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, fairnessPoints: event.target.value }))}
                    className={inputClassName}
                    placeholder={`${suggestedPoints}`}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Empfohlen aus Engine: {suggestedPoints} Punkte</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAddTask}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Task speichern
                </button>
                <button
                  onClick={() => setTaskForm(TASK_FORM_DEFAULTS)}
                  className="inline-flex min-h-[48px] items-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Zurücksetzen
                </button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="section-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Punkte pro Task anpassen</h3>
                  <p className="mt-1 text-xs text-slate-500">Direkte Kontrolle über jede Aufgabe im System.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {sortedTasks.map((task) => {
                  const draftValue = taskPointDrafts[task.id] ?? String(task.fairnessPoints);
                  return (
                    <div key={task.id} className="glass-panel rounded-[28px] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                            <Badge label={task.category} color="purple" />
                            {task.completed && <Badge label="Erledigt" color="green" />}
                          </div>
                          {task.description && <p className="mt-2 text-xs text-slate-500">{task.description}</p>}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>{task.durationMinutes} Min.</span>
                            <span>•</span>
                            <span>{task.effort}</span>
                            <span>•</span>
                            <span>{task.type}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition hover:bg-red-100"
                          aria-label={`Aufgabe ${task.title} löschen`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-500">Punkte</label>
                          <input
                            type="number"
                            min={1}
                            value={draftValue}
                            onChange={(event) =>
                              setTaskPointDrafts((prev) => ({ ...prev, [task.id]: event.target.value }))
                            }
                            className={inputClassName}
                          />
                        </div>
                        <button
                          onClick={() => handleSaveTaskPoints(task)}
                          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Punkte speichern
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <Card className="section-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Punkte-Konten</h3>
                  <p className="mt-1 text-xs text-slate-500">Belohnungen werden direkt mit verdienten Punkten bezahlt.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Coins className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {familyMembers.map((member) => (
                  <div key={member.id} className="glass-panel rounded-[28px] p-4">
                    <div className="flex items-center gap-3">
                      <Avatar memberId={member.id} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">Verfügbares Reward-Budget</p>
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-slate-900">{state.rewardPoints[member.id]}</p>
                    <p className="mt-1 text-xs text-slate-400">Punkte</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="section-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Belohnung anlegen</h3>
                  <p className="mt-1 text-xs text-slate-500">Neue Store-Items wie Massage, Auszeit oder Frühstück im Bett.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Gift className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
                  <input
                    value={rewardForm.name}
                    onChange={(event) => setRewardForm((prev) => ({ ...prev, name: event.target.value }))}
                    className={inputClassName}
                    placeholder="Massage, Auszeit, Kinoabend"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Kosten</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={rewardForm.cost}
                    onChange={(event) => setRewardForm((prev) => ({ ...prev, cost: event.target.value }))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Icon / Emoji</label>
                  <input
                    value={rewardForm.icon}
                    onChange={(event) => setRewardForm((prev) => ({ ...prev, icon: event.target.value }))}
                    className={inputClassName}
                    placeholder="💆"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Beschreibung</label>
                  <textarea
                    value={rewardForm.description}
                    onChange={(event) => setRewardForm((prev) => ({ ...prev, description: event.target.value }))}
                    className={`${inputClassName} min-h-24 resize-none`}
                    placeholder="Wofür kann die Belohnung eingelöst werden?"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(themeClasses) as ShopItemTheme[]).map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setRewardForm((prev) => ({ ...prev, theme }))}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          rewardForm.theme === theme
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAddReward}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Reward speichern
                </button>
                <button
                  onClick={() => setRewardForm(REWARD_FORM_DEFAULTS)}
                  className="inline-flex min-h-[48px] items-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Zurücksetzen
                </button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="section-fade-in overflow-hidden">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Reward Shop</h3>
                  <p className="mt-1 text-xs text-slate-500">Wähle ein Item und löse es sofort mit Punkten ein.</p>
                </div>
                <Badge label={`aktiv für ${currentUserName}`} color="green" />
              </div>

              {state.shopItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {state.shopItems.map((item) => {
                    const theme = themeClasses[item.theme];
                    const canRedeem = state.rewardPoints[state.currentUser] >= item.cost;
                    return (
                      <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br ${theme.card} glass-panel p-4`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-3xl">{item.icon}</div>
                            <h4 className="mt-3 text-lg font-semibold text-slate-900">{item.name}</h4>
                            {item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}
                          </div>
                          <button
                            onClick={() => deleteShopItem(item.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                            aria-label={`${item.name} entfernen`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Badge label={`${item.cost} Punkte`} color={theme.badge} />
                          {item.featured && <Badge label="Featured" color="purple" />}
                        </div>

                        <button
                          onClick={() => redeemShopItem(item.id, state.currentUser)}
                          disabled={!canRedeem}
                          className={`mt-4 inline-flex min-h-[46px] w-full items-center justify-center rounded-full text-sm font-semibold transition ${
                            canRedeem
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {canRedeem ? `Einlösen als ${currentUserName}` : 'Nicht genug Punkte'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Gift className="h-12 w-12" />}
                  title="Noch keine Rewards"
                  description="Lege den ersten Shop-Artikel an, damit Punkte gegen schöne Belohnungen getauscht werden können."
                />
              )}
            </Card>

            <Card className="section-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Zuletzt eingelöst</h3>
                  <p className="mt-1 text-xs text-slate-500">Die letzten Shop-Aktionen in der Familie.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Store className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {state.shopRedemptions.length > 0 ? (
                  state.shopRedemptions.slice(0, 6).map((redemption) => {
                    const item = state.shopItems.find((entry) => entry.id === redemption.shopItemId);
                    const member = familyMembers.find((entry) => entry.id === redemption.memberId);
                    return (
                      <div key={redemption.id} className="glass-panel flex items-center justify-between gap-3 rounded-[24px] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item?.icon ?? '🎁'} {item?.name ?? 'Reward'}
                          </p>
                          <p className="text-xs text-slate-500">eingelöst von {member?.name ?? redemption.memberId}</p>
                        </div>
                        <Badge label={`-${redemption.cost} Pkt.`} color="yellow" />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400">Noch keine Reward-Einlösungen gespeichert.</p>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
