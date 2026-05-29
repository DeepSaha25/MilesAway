import React from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import {Colors} from '../theme/colors';

const LeaderboardSkeleton = () => (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />

    <View style={styles.header}>
      <ShimmerPlaceholder width={132} height={26} borderRadius={13} />
      <ShimmerPlaceholder width={42} height={42} borderRadius={21} />
    </View>

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      pointerEvents="none">
      <View style={styles.headingWrap}>
        <ShimmerPlaceholder width={186} height={38} borderRadius={14} />
      </View>

      <View style={styles.tabs}>
        {[0, 1, 2, 3].map(index => (
          <ShimmerPlaceholder
            key={index}
            width="22%"
            height={44}
            borderRadius={14}
          />
        ))}
      </View>

      <View style={styles.podium}>
        <View style={styles.sidePodium}>
          <ShimmerPlaceholder width={68} height={68} borderRadius={34} />
          <ShimmerPlaceholder width={58} height={12} borderRadius={6} style={styles.nameLine} />
          <ShimmerPlaceholder width={72} height={24} borderRadius={10} style={styles.distanceLine} />
        </View>
        <View style={styles.winnerPodium}>
          <ShimmerPlaceholder width={96} height={96} borderRadius={48} />
          <ShimmerPlaceholder width={88} height={12} borderRadius={6} style={styles.nameLine} />
          <ShimmerPlaceholder width={86} height={28} borderRadius={12} style={styles.distanceLine} />
        </View>
        <View style={styles.sidePodium}>
          <ShimmerPlaceholder width={68} height={68} borderRadius={34} />
          <ShimmerPlaceholder width={58} height={12} borderRadius={6} style={styles.nameLine} />
          <ShimmerPlaceholder width={72} height={24} borderRadius={10} style={styles.distanceLine} />
        </View>
      </View>

      {[0, 1, 2].map(index => (
        <View key={index} style={styles.row}>
          <ShimmerPlaceholder width={34} height={28} borderRadius={10} />
          <ShimmerPlaceholder width={52} height={52} borderRadius={26} />
          <View style={styles.rowCopy}>
            <ShimmerPlaceholder width="68%" height={18} borderRadius={8} />
            <ShimmerPlaceholder width="44%" height={10} borderRadius={5} style={styles.rowMeta} />
          </View>
          <ShimmerPlaceholder width={58} height={34} borderRadius={12} />
        </View>
      ))}

      <View style={styles.footerSpace} />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    minHeight: 74,
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface + 'F0',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 24,
  },
  headingWrap: {
    minHeight: 88,
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  tabs: {
    height: 52,
    borderRadius: 18,
    padding: 4,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow + 'CC',
  },
  podium: {
    minHeight: 184,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  sidePodium: {
    flex: 1,
    minHeight: 158,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  winnerPodium: {
    flex: 1,
    minHeight: 184,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nameLine: {
    marginTop: 10,
  },
  distanceLine: {
    marginTop: 14,
  },
  row: {
    minHeight: 78,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: Colors.surfaceContainerHigh + 'D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowMeta: {
    marginTop: 8,
  },
  footerSpace: {
    height: 116,
  },
});

export default LeaderboardSkeleton;
