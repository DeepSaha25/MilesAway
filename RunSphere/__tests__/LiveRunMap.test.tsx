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

    expect(textValues).toContain('Waiting for movement');
    expect(textValues?.filter(value => value === 'Waiting for movement')).toHaveLength(1);
    expect(textValues).toContain('--:-- min/km');
  });

  it('maps confidence states to specific live feedback messages', () => {
    const expectedMessages = [
      ['ACQUIRING_GPS', 'Finding GPS...'],
      ['LIVE_ESTIMATE', 'Tracking live estimate'],
      ['WEAK_GPS', 'GPS signal weak, tracking movement'],
      ['GPS_JUMPING', 'GPS signal jumping'],
      ['STATIONARY', 'Waiting for movement'],
      ['SENSOR_ONLY_MOVEMENT', 'Movement detected'],
      ['POSSIBLE_INDOOR', 'Movement detected, GPS weak'],
    ] as const;

    expectedMessages.forEach(([motionState, message]) => {
      let tree: ReactTestRenderer.ReactTestRenderer | undefined;

      ReactTestRenderer.act(() => {
        tree = renderLiveRunMap({motionState});
      });

      const textValues = tree?.root
        .findAllByType(Text)
        .flatMap(node => node.props.children);

      expect(textValues).toContain(message);
      expect(textValues?.filter(value => value === message)).toHaveLength(1);
      expect(textValues).not.toContain('GPS Settling...');
    });
  });

  it('keeps finish controls tappable so blocked saves can explain the reason', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = renderLiveRunMap();
    });

    const disabledButtons = tree?.root
      .findAllByType(TouchableOpacity)
      .filter(node => node.props.accessibilityState?.disabled === true);
    const finishButton = tree?.root
      .findAllByType(TouchableOpacity)
      .find(node => {
        const textChildren = node.findAllByType(Text).flatMap(text => text.props.children);
        return textChildren.includes('Finish');
      });

    expect(disabledButtons).toHaveLength(0);
    expect(finishButton?.props.onPress).toEqual(expect.any(Function));
  });

  it('hides settling feedback and shows pace while live movement is active', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = renderLiveRunMap({
        route: [
          {
            latitude: 0,
            longitude: 0,
            timestamp: new Date(0).toISOString(),
            accuracy: 5,
          },
          {
            latitude: 0,
            longitude: 0.001,
            timestamp: new Date(3000).toISOString(),
            accuracy: 5,
          },
        ],
        currentPace: 0.6,
        motionState: 'GOOD_GPS',
      });
    });

    const textValues = tree?.root
      .findAllByType(Text)
      .flatMap(node => node.props.children);

    expect(textValues).not.toContain('GPS Settling...');
    expect(textValues).not.toContain('--:-- min/km');
    expect(textValues).toContain('0:36 min/km');
  });

  it('shows ready to save only when movement save gates pass', () => {
    let saveReadyTree: ReactTestRenderer.ReactTestRenderer | undefined;
    let notReadyTree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      saveReadyTree = renderLiveRunMap({
        motionState: 'GOOD_GPS',
        canSaveRun: true,
        gpsStatus: 'GPS locked',
      });
      notReadyTree = renderLiveRunMap({
        motionState: 'GOOD_GPS',
        canSaveRun: false,
        gpsStatus: 'GPS locked',
      });
    });

    const saveReadyText = saveReadyTree?.root
      .findAllByType(Text)
      .flatMap(node => node.props.children);
    const notReadyText = notReadyTree?.root
      .findAllByType(Text)
      .flatMap(node => node.props.children);

    expect(saveReadyText).toContain('Ready to save');
    expect(notReadyText).toContain('Live GPS tracking');
    expect(notReadyText).not.toContain('Ready to save');
  });

  it('shows simple average pace when a pace value is provided', () => {
    (['WEAK_GPS', 'GPS_JUMPING'] as const).forEach(motionState => {
      let tree: ReactTestRenderer.ReactTestRenderer | undefined;

      ReactTestRenderer.act(() => {
        tree = renderLiveRunMap({currentPace: 0.6, motionState});
      });

      const textValues = tree?.root
        .findAllByType(Text)
        .flatMap(node => node.props.children);

      expect(textValues).toContain('0:36 min/km');
      expect(textValues).not.toContain('--:-- min/km');
    });
  });

  it('does not show speed-based save blocking copy', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = renderLiveRunMap({motionState: 'TOO_FAST_FOR_RUN'});
    });

    const textValues = tree?.root
      .findAllByType(Text)
      .flatMap(node => node.props.children);

    expect(textValues).not.toContain('Too fast for a verified run');
    expect(textValues).toContain('Live GPS tracking');
  });
});
