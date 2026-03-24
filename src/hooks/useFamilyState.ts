import { useReducer, useCallback, useMemo } from 'react';
import type {
  Task,
  FairnessRecord,
  MealPlanEntry,
  StressMode,
  ThankYou,
  TakeOver,
  FamilyMemberId,
  CarResource,
} from '../models/types';
import { recurringTasks } from '../data/tasks';
import { carResource as defaultCarResource } from '../data/resources';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FamilyState {
  tasks: Task[];
  fairnessRecords: FairnessRecord[];
  mealPlan: MealPlanEntry[];
  stressMode: StressMode;
  thankYous: ThankYou[];
  takeOvers: TakeOver[];
  carResource: CarResource;
  currentUser: FamilyMemberId;
}

const initialState: FamilyState = {
  tasks: recurringTasks.map((t) => ({ ...t })),
  fairnessRecords: [],
  mealPlan: [],
  stressMode: { active: false },
  thankYous: [],
  takeOvers: [],
  carResource: { ...defaultCarResource, metadata: { ...defaultCarResource.metadata } },
  currentUser: 'mother',
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type FamilyAction =
  | { type: 'COMPLETE_TASK'; taskId: string; completedBy: FamilyMemberId; date: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; taskId: string; updates: Partial<Task> }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'SET_MEAL_PLAN'; entry: MealPlanEntry }
  | { type: 'REMOVE_MEAL_PLAN'; date: string; mealType: string }
  | { type: 'TOGGLE_STRESS_MODE'; activatedBy: FamilyMemberId; reason?: string; endDate?: string }
  | { type: 'SEND_THANK_YOU'; from: FamilyMemberId; to: FamilyMemberId; taskId?: string; message?: string }
  | { type: 'TAKE_OVER_TASK'; taskId: string; from: FamilyMemberId; to: FamilyMemberId }
  | { type: 'UPDATE_CAR'; chargeLevel?: number; isAvailable?: boolean }
  | { type: 'SWITCH_USER'; memberId: FamilyMemberId }
  | { type: 'RESET_WEEKLY' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function familyReducer(state: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case 'COMPLETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;

      const newRecord: FairnessRecord = {
        date: action.date,
        taskId: action.taskId,
        memberId: action.completedBy,
        category: task.category,
        points: task.fairnessPoints,
      };

      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, completed: true, completedBy: action.completedBy, completedAt: action.date }
            : t,
        ),
        fairnessRecords: [...state.fairnessRecords, newRecord],
      };
    }

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.updates } : t,
        ),
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };

    case 'SET_MEAL_PLAN': {
      const filtered = state.mealPlan.filter(
        (e) => !(e.date === action.entry.date && e.mealType === action.entry.mealType),
      );
      return { ...state, mealPlan: [...filtered, action.entry] };
    }

    case 'REMOVE_MEAL_PLAN':
      return {
        ...state,
        mealPlan: state.mealPlan.filter(
          (e) => !(e.date === action.date && e.mealType === action.mealType),
        ),
      };

    case 'TOGGLE_STRESS_MODE':
      return {
        ...state,
        stressMode: state.stressMode.active
          ? { active: false }
          : {
              active: true,
              activatedBy: action.activatedBy,
              reason: action.reason,
              startDate: new Date().toISOString(),
              endDate: action.endDate,
            },
      };

    case 'SEND_THANK_YOU': {
      const thankYou: ThankYou = {
        id: `ty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: action.from,
        to: action.to,
        taskId: action.taskId,
        message: action.message,
        date: new Date().toISOString(),
      };
      return { ...state, thankYous: [...state.thankYous, thankYou] };
    }

    case 'TAKE_OVER_TASK': {
      const takeOver: TakeOver = {
        id: `to-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        taskId: action.taskId,
        from: action.from,
        to: action.to,
        date: new Date().toISOString(),
      };
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, assignedTo: action.to } : t,
        ),
        takeOvers: [...state.takeOvers, takeOver],
      };
    }

    case 'UPDATE_CAR':
      return {
        ...state,
        carResource: {
          ...state.carResource,
          metadata: {
            ...state.carResource.metadata,
            ...(action.chargeLevel !== undefined && { chargeLevel: action.chargeLevel }),
            ...(action.isAvailable !== undefined && { isAvailable: action.isAvailable }),
          },
          status: action.isAvailable === false ? 'in-use' : state.carResource.status,
        },
      };

    case 'SWITCH_USER':
      return { ...state, currentUser: action.memberId };

    case 'RESET_WEEKLY':
      return {
        ...state,
        tasks: state.tasks.map((t) => ({ ...t, completed: false, completedBy: undefined, completedAt: undefined })),
        fairnessRecords: [],
        thankYous: [],
        takeOvers: [],
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFamilyState() {
  const [state, dispatch] = useReducer(familyReducer, initialState);

  const completeTask = useCallback(
    (taskId: string, completedBy: FamilyMemberId) =>
      dispatch({ type: 'COMPLETE_TASK', taskId, completedBy, date: new Date().toISOString() }),
    [],
  );

  const addTask = useCallback(
    (task: Task) => dispatch({ type: 'ADD_TASK', task }),
    [],
  );

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) =>
      dispatch({ type: 'UPDATE_TASK', taskId, updates }),
    [],
  );

  const deleteTask = useCallback(
    (taskId: string) => dispatch({ type: 'DELETE_TASK', taskId }),
    [],
  );

  const setMealPlan = useCallback(
    (entry: MealPlanEntry) => dispatch({ type: 'SET_MEAL_PLAN', entry }),
    [],
  );

  const removeMealPlan = useCallback(
    (date: string, mealType: string) =>
      dispatch({ type: 'REMOVE_MEAL_PLAN', date, mealType }),
    [],
  );

  const toggleStressMode = useCallback(
    (activatedBy: FamilyMemberId, reason?: string) =>
      dispatch({ type: 'TOGGLE_STRESS_MODE', activatedBy, reason }),
    [],
  );

  const sendThankYou = useCallback(
    (to: FamilyMemberId, taskId?: string, message?: string) =>
      dispatch({ type: 'SEND_THANK_YOU', from: state.currentUser, to, taskId, message }),
    [state.currentUser],
  );

  const takeOverTask = useCallback(
    (taskId: string, to: FamilyMemberId) =>
      dispatch({ type: 'TAKE_OVER_TASK', taskId, from: state.currentUser, to }),
    [state.currentUser],
  );

  const updateCar = useCallback(
    (updates: { chargeLevel?: number; isAvailable?: boolean }) =>
      dispatch({ type: 'UPDATE_CAR', ...updates }),
    [],
  );

  const switchUser = useCallback(
    (memberId: FamilyMemberId) => dispatch({ type: 'SWITCH_USER', memberId }),
    [],
  );

  return useMemo(
    () => ({
      state,
      completeTask,
      addTask,
      updateTask,
      deleteTask,
      setMealPlan,
      removeMealPlan,
      toggleStressMode,
      sendThankYou,
      takeOverTask,
      updateCar,
      switchUser,
    }),
    [
      state,
      completeTask,
      addTask,
      updateTask,
      deleteTask,
      setMealPlan,
      removeMealPlan,
      toggleStressMode,
      sendThankYou,
      takeOverTask,
      updateCar,
      switchUser,
    ],
  );
}
