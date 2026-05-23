import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface GoalState {
  weeklyHoursGoal: number;
  increaseWeeklyGoal: () => void;
  decreaseWeeklyGoal: () => void;
}

const clampGoal = (value: number) => Math.min(40, Math.max(1, value));

export const useGoalStore = create<GoalState>()(
  persist(
    set => ({
      weeklyHoursGoal: 6,
      increaseWeeklyGoal: () =>
        set(state => ({
          weeklyHoursGoal: clampGoal(state.weeklyHoursGoal + 0.5),
        })),
      decreaseWeeklyGoal: () =>
        set(state => ({
          weeklyHoursGoal: clampGoal(state.weeklyHoursGoal - 0.5),
        })),
    }),
    {
      name: 'milesaway-goals',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
