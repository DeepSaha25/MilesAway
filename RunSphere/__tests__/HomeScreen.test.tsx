import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '../src/screens/HomeScreen';
import {useDashboard} from '../src/hooks/useDashboard';

jest.mock('../src/hooks/useDashboard', () => ({
  useDashboard: jest.fn(),
}));

jest.mock('../src/components/AppHeader', () => {
  const MockReact = require('react');
  return () => MockReact.createElement(MockReact.Fragment);
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const MockReact = require('react');
  const {View} = require('react-native');
  return (props: any) => MockReact.createElement(View, props);
});

const mockedUseDashboard = useDashboard as jest.Mock;

const dashboardBase = {
  profile: {_id: 'runner-1', name: 'Deep Saha'},
  refreshing: false,
  dashboardStatus: 'SUCCESS',
  dashboardError: null,
  isInitialLoading: false,
  onRefresh: jest.fn(),
  onRetryDashboard: jest.fn(),
  displayDistance: '0.00',
  activeHours: 0,
  activeProgress: 0,
  rank: null,
  weeklyHoursGoal: 6,
  increaseWeeklyGoal: jest.fn(),
  decreaseWeeklyGoal: jest.fn(),
};

const renderHome = () =>
  ReactTestRenderer.create(
    <HomeScreen navigation={{navigate: jest.fn(), goBack: jest.fn()}} />,
  );

const getTextValues = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).flatMap(node => node.props.children);

describe('HomeScreen last saved run card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a compact saved-run summary with distance and pace', () => {
    mockedUseDashboard.mockReturnValue({
      ...dashboardBase,
      lastRun: {_id: 'run-1'},
      lastRunLabel: '0.650 km',
      lastPace: '11:40 min/km',
    });

    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = renderHome();
    });

    const textValues = getTextValues(tree!);

    expect(textValues).toContain('LAST SAVED RUN');
    expect(textValues).toContain('0.650 km');
    expect(textValues).toContain('PACE');
    expect(textValues).toContain('11:40 min/km');
  });

  it('renders a clear empty state when no run has been saved', () => {
    mockedUseDashboard.mockReturnValue({
      ...dashboardBase,
      lastRun: null,
      lastRunLabel: 'No runs yet',
      lastPace: '--',
    });

    let tree!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      tree = renderHome();
    });

    const textValues = getTextValues(tree!);

    expect(textValues).toContain('LAST SAVED RUN');
    expect(textValues).toContain('No saved runs yet');
    expect(textValues).toContain('Start a run to see your latest workout here.');
    expect(textValues).not.toContain('No runs yet');
    expect(textValues).not.toContain('PACE');
  });
});
