import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LiveRunMap from '../src/components/LiveRunMap';

const renderLiveRunMap = (
  overrides: Partial<React.ComponentProps<typeof LiveRunMap>> = {},
) =>
  ReactTestRenderer.create(
    <LiveRunMap
      route={[
        {
          latitude: 0,
          longitude: 0,
          timestamp: new Date(0).toISOString(),
          accuracy: 5,
        },
      ]}
      elapsedSeconds={60}
      distanceKm={0.1}
      elevationGain={0}
      currentPace={null}
      motionState="STATIONARY"
      canSaveRun={false}
      status="running"
      onPauseResume={jest.fn()}
      onFinish={jest.fn()}
      onCancel={jest.fn()}
      {...overrides}
    />,
  );

describe('LiveRunMap telemetry presentation', () => {
  it('shows stationary feedback and hides current pace when movement is weak', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = renderLiveRunMap();
    });

    const textValues = tree?.root
      .findAllByType(Text)
      .flatMap(node => node.props.children);

    expect(textValues).toContain('Waiting for movement...');
    expect(textValues).toContain('--:-- /km');
  });

  it('marks finish controls disabled until save gates pass', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = renderLiveRunMap();
    });

    const disabledFinishButtons = tree?.root
      .findAllByType(TouchableOpacity)
      .filter(node => node.props.accessibilityState?.disabled === true);

    expect(disabledFinishButtons?.length).toBeGreaterThan(0);
  });
});
