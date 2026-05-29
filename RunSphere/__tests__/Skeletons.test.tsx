import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CommunitySkeleton from '../src/components/CommunitySkeleton';
import HomeSkeleton from '../src/components/HomeSkeleton';
import LeaderboardSkeleton from '../src/components/LeaderboardSkeleton';

describe('screen skeletons', () => {
  it('renders the home dashboard skeleton frame', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<HomeSkeleton />);
    });

    expect(tree?.toJSON()).toBeTruthy();
  });

  it('renders the community feed skeleton frame', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<CommunitySkeleton />);
    });

    expect(tree?.toJSON()).toBeTruthy();
  });

  it('renders the leaderboard skeleton frame', () => {
    let tree: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<LeaderboardSkeleton />);
    });

    expect(tree?.toJSON()).toBeTruthy();
  });
});
