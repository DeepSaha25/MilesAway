import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import {
  RunCoordinate,
  haversineMeters,
  shouldAcceptCoordinate,
} from '../utils/runMetrics';

type RunStatus = 'idle' | 'running' | 'paused' | 'summary';

interface RunState {
  status: RunStatus;
  clientRunId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  elapsedSeconds: number;
  distanceKm: number;
  elevationGain: number;
  coordinates: RunCoordinate[];
  startRun: (seed?: RunCoordinate | null) => void;
  addCoordinate: (coordinate: RunCoordinate) => void;
  tick: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  prepareSummary: () => void;
  resetRun: () => void;
}

const initialState = {
  status: 'idle' as RunStatus,
  clientRunId: null,
  startedAt: null,
  finishedAt: null,
  elapsedSeconds: 0,
  distanceKm: 0,
  elevationGain: 0,
  coordinates: [] as RunCoordinate[],
};

const createClientRunId = () =>
  `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const useRunStore = create<RunState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,
        startRun: seed => {
          set({
            ...initialState,
            status: 'running',
            clientRunId: createClientRunId(),
            startedAt: seed?.timestamp || new Date().toISOString(),
            coordinates: seed ? [seed] : [],
          });
        },
        addCoordinate: coordinate => {
          const previous = get().coordinates.at(-1) || null;
          if (!shouldAcceptCoordinate(previous, coordinate)) {
            return;
          }

          const segmentKm = previous
            ? haversineMeters(previous, coordinate) / 1000
            : 0;
          const elevationDelta =
            previous &&
            typeof previous.altitude === 'number' &&
            typeof coordinate.altitude === 'number' &&
            Number.isFinite(previous.altitude) &&
            Number.isFinite(coordinate.altitude) &&
            coordinate.altitude > previous.altitude
              ? coordinate.altitude - previous.altitude
              : 0;
          const coordinates = [...get().coordinates, coordinate];

          set(state => ({
            coordinates,
            distanceKm: Math.round((state.distanceKm + segmentKm) * 1000) / 1000,
            elevationGain: Math.round((state.elevationGain + elevationDelta) * 100) / 100,
          }));
        },
        tick: () => {
          if (get().status !== 'running') {
            return;
          }

          set(state => ({
            elapsedSeconds: state.startedAt
              ? Math.max(
                  state.elapsedSeconds + 1,
                  Math.floor(
                    (Date.now() - new Date(state.startedAt).getTime()) / 1000,
                  ),
                )
              : state.elapsedSeconds + 1,
          }));
        },
        pauseRun: () => set({status: 'paused'}),
        resumeRun: () => set({status: 'running'}),
        prepareSummary: () =>
          set({
            status: 'summary',
            finishedAt: new Date().toISOString(),
          }),
        resetRun: () => set(initialState),
      }),
      {name: 'milesaway-run-store'},
    ),
    {
      name: 'milesaway-active-run',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        status: state.status,
        clientRunId: state.clientRunId,
        startedAt: state.startedAt,
        finishedAt: state.finishedAt,
        elapsedSeconds: state.elapsedSeconds,
        distanceKm: state.distanceKm,
        elevationGain: state.elevationGain,
        coordinates: state.coordinates,
      }),
    },
  ),
);
