import React from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import ShimmerPlaceholder from './ShimmerPlaceholder';
import {Colors} from '../theme/colors';

const PLACEHOLDER_CARDS = [0, 1, 2];

const CommunitySkeleton = () => (
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
        <ShimmerPlaceholder width={132} height={10} borderRadius={5} />
        <ShimmerPlaceholder
          width={206}
          height={42}
          borderRadius={14}
          style={styles.titleBlock}
        />
      </View>

      <View style={styles.eventsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <ShimmerPlaceholder width={112} height={9} borderRadius={5} />
            <ShimmerPlaceholder
              width={168}
              height={24}
              borderRadius={10}
              style={styles.sectionTitleBlock}
            />
          </View>
          <ShimmerPlaceholder width={34} height={34} borderRadius={17} />
        </View>
        <ShimmerPlaceholder width="100%" height={238} borderRadius={20} />
      </View>

      {PLACEHOLDER_CARDS.map(index => (
        <View key={index} style={styles.card}>
          <View style={styles.userRow}>
            <ShimmerPlaceholder width={42} height={42} borderRadius={21} />
            <View style={styles.userCopy}>
              <ShimmerPlaceholder width="58%" height={15} borderRadius={7} />
              <ShimmerPlaceholder
                width="36%"
                height={8}
                borderRadius={4}
                style={styles.metaLine}
              />
            </View>
          </View>

          <ShimmerPlaceholder width="100%" height={190} borderRadius={18} />

          <View style={styles.textLines}>
            <ShimmerPlaceholder width="92%" height={12} borderRadius={6} />
            <ShimmerPlaceholder width="68%" height={12} borderRadius={6} />
          </View>

          <View style={styles.engagementRow}>
            <ShimmerPlaceholder width={64} height={18} borderRadius={9} />
            <ShimmerPlaceholder width={58} height={18} borderRadius={9} />
            <ShimmerPlaceholder width={24} height={18} borderRadius={9} />
          </View>
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
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 28,
  },
  titleBlock: {
    marginTop: 8,
  },
  eventsSection: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleBlock: {
    marginTop: 4,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  userCopy: {
    flex: 1,
  },
  metaLine: {
    marginTop: 7,
  },
  textLines: {
    marginTop: 18,
    gap: 8,
  },
  engagementRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerSpace: {
    height: 116,
  },
});

export default CommunitySkeleton;
