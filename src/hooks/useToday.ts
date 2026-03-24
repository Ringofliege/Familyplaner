import { useMemo } from 'react';
import { getDay, format } from 'date-fns';
import type { DayOfWeek, Task, TimeBlock, FamilyMemberId, Suggestion } from '../models/types';
import { calculateTimeBlocks, getDayLoad } from '../engine/energy';
import { getResponsibleToday } from '../engine/responsibility';
import { generateDailySuggestions } from '../engine/automation';
import { motherWorkSchedule, fatherWorkSchedule, allFixedEvents } from '../data/schedules';
import type { FamilyState } from './useFamilyState';

export interface TodayView {
  today: DayOfWeek;
  dateString: string;
  dayName: string;
  blocks: TimeBlock[];
  motherLoad: { blocked: number; limited: number; free: number };
  fatherLoad: { blocked: number; limited: number; free: number };
  responsibilities: Map<string, FamilyMemberId>;
  todayTasks: Task[];
  suggestions: Suggestion[];
}

export function useToday(familyState: FamilyState): TodayView {
  return useMemo(() => {
    const now = new Date();
    const today = getDay(now) as DayOfWeek;
    const dateString = format(now, 'yyyy-MM-dd');
    const dayName = format(now, 'EEEE');

    const workSchedules = {
      mother: motherWorkSchedule,
      father: fatherWorkSchedule,
    };

    const blocks = calculateTimeBlocks(today, workSchedules, allFixedEvents);
    const motherLoad = getDayLoad(today, 'mother', blocks);
    const fatherLoad = getDayLoad(today, 'father', blocks);

    // Filter tasks applicable to today
    const todayTasks = familyState.tasks.filter((task) => {
      if (task.completed) return false;
      if (task.recurrenceDays && task.recurrenceDays.length > 0) {
        return task.recurrenceDays.includes(today);
      }
      if (task.recurrence === 'daily') return true;
      if (task.recurrence === 'weekday') return today >= 1 && today <= 5;
      if (task.dueDate) return task.dueDate === dateString;
      return true;
    });

    // Compute fairness totals for responsibility assignment
    const fairness = { mother: 0, father: 0 };
    for (const record of familyState.fairnessRecords) {
      if (record.memberId === 'mother') fairness.mother += record.points;
      else fairness.father += record.points;
    }

    const responsibilities = getResponsibleToday(today, todayTasks, blocks, fairness);

    const suggestions = generateDailySuggestions(
      today,
      todayTasks,
      blocks,
      familyState.carResource,
      familyState.stressMode,
    );

    return {
      today,
      dateString,
      dayName,
      blocks,
      motherLoad,
      fatherLoad,
      responsibilities,
      todayTasks,
      suggestions,
    };
  }, [familyState.tasks, familyState.fairnessRecords, familyState.carResource, familyState.stressMode]);
}
