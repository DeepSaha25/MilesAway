import React from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import {Colors} from '../theme/colors';

const HomeSkeleton = () => (
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
      <View style={styles.hero}>
        <ShimmerPlaceholder width={118} height={12} borderRadius={6} />
        <View style={styles.distanceRow}>
          <ShimmerPlaceholder width={188} height={86} borderRadius={24} />
          <ShimmerPlaceholder width={42} height={28} borderRadius={12} />
        </View>
      </View>

      <ShimmerPlaceholder
        width={278}
        height={78}
        borderRadius={39}
        style={styles.startButton}
      />

      <View style={styles.card}>
        <ShimmerPlaceholder width={122} height={12} borderRadius={6} />
        <View>
          <ShimmerPlaceholder width="72%" height={34} borderRadius={13} />
          <View style={styles.cardFooter}>
            <View>
              <ShimmerPlaceholder width={88} height={42} borderRadius={14} />
              <ShimmerPlaceholder
                width={66}
                height={10}
                borderRadius={5}
                style={styles.microLine}
              />
            </View>
            <ShimmerPlaceholder width={58} height={58} borderRadius={29} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View>
          <ShimmerPlaceholder width={142} height={12} borderRadius={6} />
          <ShimmerPlaceholder
            width={132}
            height={60}
            borderRadius={16}
            style={styles.valueBlock}
          />
        </View>
        <View>
          <View style={styles.goalRow}>
            <ShimmerPlaceholder width={92} height={10} borderRadius={5} />
            <View style={styles.goalControls}>
              <ShimmerPlaceholder width={34} height={34} borderRadius={17} />
              <ShimmerPlaceholder width={34} height={34} borderRadius={17} />
            </View>
          </View>
          <ShimmerPlaceholder width="100%" height={13} borderRadius={999} />
          <View style={styles.progressMeta}>
            <ShimmerPlaceholder width={70} height={10} borderRadius={5} />
            <ShimmerPlaceholder width={86} height={10} borderRadius={5} />
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <ShimmerPlaceholder width={108} height={12} borderRadius={6} />
            <ShimmerPlaceholder
              width={118}
              height={54}
              borderRadius={16}
              style={styles.valueBlock}
            />
          </View>
          <ShimmerPlaceholder width={48} height={48} borderRadius={24} />
        </View>
        <View style={styles.chartBars}>
          {[42, 70, 54, 86, 64, 94, 58].map((height, index) => (
            <ShimmerPlaceholder
              key={index}
              width="10%"
              height={height}
              borderRadius={10}
              style={styles.chartBar}
            />
          ))}
        </View>
      </View>

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
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
  },
  hero: {
    marginBottom: 34,
  },
  distanceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  startButton: {
    marginBottom: 48,
  },
  card: {
    minHeight: 226,
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 34,
    marginBottom: 26,
    backgroundColor: Colors.surfaceContainer + 'F8',
    justifyContent: 'space-between',
  },
  cardFooter: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  microLine: {
    marginTop: 10,
  },
  valueBlock: {
    marginTop: 12,
  },
  goalRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalControls: {
    flexDirection: 'row',
    gap: 8,
  },
  progressMeta: {
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartCard: {
    minHeight: 300,
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 34,
    marginBottom: 26,
    backgroundColor: Colors.surfaceContainer + 'F8',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartBars: {
    flex: 1,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    alignSelf: 'flex-end',
  },
  footerSpace: {
    height: 116,
  },
});

export default HomeSkeleton;
