import { useState, useMemo } from 'react';
import { addDays, startOfWeek, format, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, ChefHat, Clock, UtensilsCrossed } from 'lucide-react';
import type { DayOfWeek, MealPlanEntry, Meal, MealDifficulty } from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import { suggestMeal } from '../../engine/meals';
import { calculateTimeBlocks } from '../../engine/energy';
import { motherWorkSchedule, fatherWorkSchedule, allFixedEvents } from '../../data/schedules';
import { sampleMeals } from '../../data/meals';
import { Card, Badge, EmptyState } from '../../components';

interface MealsPageProps {
  state: FamilyState;
  setMealPlan: (entry: MealPlanEntry) => void;
  removeMealPlan: (date: string, mealType: string) => void;
}

type MealSlot = 'lunch' | 'dinner';

const DIFFICULTY_COLOR: Record<MealDifficulty, 'green' | 'yellow' | 'red'> = {
  easy: 'green',
  medium: 'yellow',
  complex: 'red',
};

const DIFFICULTY_LABEL: Record<MealDifficulty, string> = {
  easy: 'Einfach',
  medium: 'Mittel',
  complex: 'Aufwendig',
};

export function MealsPage({ state, setMealPlan, removeMealPlan }: MealsPageProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const todayDow = getDay(new Date()) as DayOfWeek;

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        return {
          dayOfWeek: getDay(date) as DayOfWeek,
          label: format(date, 'EEE', { locale: de }),
          dateNum: format(date, 'd'),
          dateStr: format(date, 'yyyy-MM-dd'),
        };
      }),
    [weekStart],
  );

  const [selectedDate, setSelectedDate] = useState(
    () => weekDays.find((d) => d.dayOfWeek === todayDow)?.dateStr ?? weekDays[0].dateStr,
  );
  const [addingSlot, setAddingSlot] = useState<MealSlot | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<MealDifficulty | null>(null);

  const selectedDow = weekDays.find((d) => d.dateStr === selectedDate)?.dayOfWeek ?? todayDow;

  // Meals planned for selected day
  const dayMeals = useMemo(
    () => state.mealPlan.filter((e) => e.date === selectedDate),
    [state.mealPlan, selectedDate],
  );

  const lunchEntry = dayMeals.find((e) => e.mealType === 'lunch');
  const dinnerEntry = dayMeals.find((e) => e.mealType === 'dinner');

  const findMeal = (id?: string) => sampleMeals.find((m) => m.id === id);

  // Suggestions
  const blocks = useMemo(
    () =>
      calculateTimeBlocks(
        selectedDow,
        { mother: motherWorkSchedule, father: fatherWorkSchedule },
        allFixedEvents,
      ),
    [selectedDow],
  );

  const recentMealIds = useMemo(
    () => state.mealPlan.filter((e) => e.mealId).map((e) => e.mealId!),
    [state.mealPlan],
  );

  const mealSuggestions = useMemo(
    () =>
      addingSlot
        ? suggestMeal(selectedDow, addingSlot, 90, blocks, recentMealIds, sampleMeals)
        : [],
    [addingSlot, selectedDow, blocks, recentMealIds],
  );

  // Stats
  const totalPlanned = state.mealPlan.length;
  const totalSlotsInWeek = 14; // 7 days × 2 meals
  const remaining = totalSlotsInWeek - totalPlanned;

  // Has meal indicator per day
  const dayHasMeal = useMemo(() => {
    const set = new Set<string>();
    for (const e of state.mealPlan) set.add(e.date);
    return set;
  }, [state.mealPlan]);

  const handleSelectMeal = (meal: Meal) => {
    if (!addingSlot) return;
    setMealPlan({
      date: selectedDate,
      mealType: addingSlot,
      mealId: meal.id,
      assignedTo: state.currentUser,
    });
    setAddingSlot(null);
  };

  // Library meals
  const libraryMeals = useMemo(() => {
    if (!difficultyFilter) return sampleMeals;
    return sampleMeals.filter((m) => m.difficulty === difficultyFilter);
  }, [difficultyFilter]);

  const renderMealSlot = (slot: MealSlot, entry?: MealPlanEntry) => {
    const meal = entry ? findMeal(entry.mealId) : null;
    const slotLabel = slot === 'lunch' ? 'Mittagessen' : 'Abendessen';

    if (meal) {
      return (
        <Card key={slot}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{slotLabel}</p>
              <p className="text-sm font-semibold text-slate-800">{meal.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  label={DIFFICULTY_LABEL[meal.difficulty]}
                  color={DIFFICULTY_COLOR[meal.difficulty]}
                  size="sm"
                />
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {meal.prepTimeMinutes + meal.cookTimeMinutes} Min.
                </span>
              </div>
            </div>
            <button
              onClick={() => removeMealPlan(selectedDate, slot)}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
            >
              Entfernen
            </button>
          </div>
        </Card>
      );
    }

    return (
      <Card
        key={slot}
        onClick={() => setAddingSlot(addingSlot === slot ? null : slot)}
        className={`border border-dashed ${
          addingSlot === slot ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
        }`}
      >
        <div className="flex items-center justify-center gap-2 py-2">
          <Plus className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">{slotLabel} planen</span>
        </div>
      </Card>
    );
  };

  return (
    <div className="pb-20 px-4 space-y-4 pt-4">
      {/* Week day selector */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          const hasMeal = dayHasMeal.has(d.dateStr);
          return (
            <button
              key={d.dateStr}
              onClick={() => {
                setSelectedDate(d.dateStr);
                setAddingSlot(null);
              }}
              className={`flex flex-col items-center min-w-[48px] py-2 px-2 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{d.label}</span>
              <span className="text-lg font-bold">{d.dateNum}</span>
              {hasMeal && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white' : 'bg-green-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick stats */}
      <Card className="py-3">
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-lg font-bold text-slate-800">{totalPlanned}</p>
            <p className="text-xs text-slate-500">Geplant</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <p className="text-lg font-bold text-slate-800">{remaining}</p>
            <p className="text-xs text-slate-500">Offen</p>
          </div>
        </div>
      </Card>

      {/* Meal slots for selected day */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          {weekDays.find((d) => d.dateStr === selectedDate)?.label},{' '}
          {weekDays.find((d) => d.dateStr === selectedDate)?.dateNum}.
        </h3>
        <div className="space-y-2">
          {renderMealSlot('lunch', lunchEntry)}
          {renderMealSlot('dinner', dinnerEntry)}
        </div>
      </section>

      {/* Suggestions when adding */}
      {addingSlot && mealSuggestions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Vorschläge</h3>
          <div className="space-y-2">
            {mealSuggestions.map((meal) => (
              <Card key={meal.id} onClick={() => handleSelectMeal(meal)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{meal.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        label={DIFFICULTY_LABEL[meal.difficulty]}
                        color={DIFFICULTY_COLOR[meal.difficulty]}
                        size="sm"
                      />
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {meal.prepTimeMinutes + meal.cookTimeMinutes} Min.
                      </span>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-blue-500" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Meal library */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Rezeptbibliothek</h3>
        <div className="flex gap-2 mb-3">
          {(['easy', 'medium', 'complex'] as const).map((d) => (
            <button
              key={d}
              onClick={() =>
                setDifficultyFilter(difficultyFilter === d ? null : d)
              }
            >
              <Badge
                label={DIFFICULTY_LABEL[d]}
                color={difficultyFilter === d ? DIFFICULTY_COLOR[d] : 'gray'}
                size="md"
              />
            </button>
          ))}
        </div>

        {libraryMeals.length > 0 ? (
          <div className="space-y-2">
            {libraryMeals.map((meal) => (
              <Card
                key={meal.id}
                onClick={addingSlot ? () => handleSelectMeal(meal) : undefined}
                className={addingSlot ? 'cursor-pointer' : ''}
              >
                <div className="flex items-center gap-3">
                  <ChefHat className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {meal.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        label={DIFFICULTY_LABEL[meal.difficulty]}
                        color={DIFFICULTY_COLOR[meal.difficulty]}
                        size="sm"
                      />
                      <span className="text-xs text-slate-500">
                        {meal.prepTimeMinutes + meal.cookTimeMinutes} Min.
                      </span>
                      <span className="text-xs text-slate-400">
                        {meal.servings} Port.
                      </span>
                    </div>
                  </div>
                  {addingSlot && <Plus className="w-4 h-4 text-blue-500 shrink-0" />}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UtensilsCrossed className="w-12 h-12" />}
            title="Keine Rezepte"
            description="Keine Rezepte mit diesem Filter gefunden."
          />
        )}
      </section>
    </div>
  );
}
