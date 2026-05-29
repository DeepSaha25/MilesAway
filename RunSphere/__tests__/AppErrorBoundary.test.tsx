import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import AppErrorBoundary from '../src/components/AppErrorBoundary';

const BrokenScreen = () => {
  throw new Error('render failed');
};

describe('AppErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders a recovery screen after a child render crash', () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <AppErrorBoundary>{() => <BrokenScreen />}</AppErrorBoundary>,
      );
    });

    expect(tree!.root.findByProps({children: 'RECOVERY MODE'})).toBeTruthy();
    expect(
      tree!.root.findByProps({
        children: 'Something went wrong with your run session',
      }),
    ).toBeTruthy();
  });

  it('resets boundary state and remounts children', () => {
    let shouldCrash = true;
    let tree: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <AppErrorBoundary>
          {resetKey =>
            shouldCrash ? (
              <BrokenScreen />
            ) : (
              <Text>{`Recovered ${resetKey}`}</Text>
            )
          }
        </AppErrorBoundary>,
      );
    });

    shouldCrash = false;
    const reloadButton = tree!.root.findByType(TouchableOpacity);
    ReactTestRenderer.act(() => {
      reloadButton.props.onPress();
    });

    expect(tree!.root.findByProps({children: 'Recovered 1'})).toBeTruthy();
  });
});
