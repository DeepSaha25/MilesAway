import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ShimmerPlaceholder from '../src/components/ShimmerPlaceholder';

describe('ShimmerPlaceholder', () => {
  it('renders a sized placeholder block', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ShimmerPlaceholder width={120} height={32} borderRadius={8} />,
      );
    });

    expect(tree?.root.findByProps({importantForAccessibility: 'no-hide-descendants'}))
      .toBeTruthy();
  });
});
