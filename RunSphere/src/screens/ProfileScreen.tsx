import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import MiniRoutePreview from '../components/MiniRoutePreview';
import {useProfileLocation} from '../hooks/useProfileLocation';
import {isGuestUser} from '../services/guestSession';
import {useAuthStore} from '../store/authStore';
import {Colors} from '../theme/colors';
import {formatClock, formatDistance, formatPace, formatRunDate} from '../utils/runMetrics';

const DELETE_ACCOUNT_URL = 'https://sites.google.com/view/delete-data-milesaway/home';

const ProfileScreen = () => {
  const profileData = useProfileLocation();
  const user = useAuthStore(state => state.user);
  const deleteAccount = useAuthStore(state => state.deleteAccount);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const canDeleteAccount = Boolean(user) && !isGuestUser(user);

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteModalOpen(false);
    setCurrentPassword('');
    setAcknowledged(false);
  };

  const openDeleteHelp = () => {
    Linking.openURL(DELETE_ACCOUNT_URL).catch(() => {
      Alert.alert('Unable to open link', 'Please try again later.');
    });
  };

  const handleDeleteAccount = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Password required', 'Enter your current password to continue.');
      return;
    }

    if (!acknowledged) {
      Alert.alert('Confirmation required', 'Acknowledge that deletion is permanent.');
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(currentPassword.trim());
      closeDeleteModal();
    } catch (error: any) {
      const reason = error?.data?.message || error?.message || 'Account deletion failed.';
      Alert.alert('Could not delete account', reason);
    } finally {
      setDeleting(false);
    }
  };

  if (profileData.isInitialLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileData.refreshing}
            onRefresh={profileData.onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }>
        <View style={styles.hero}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <Avatar
              uri={profileData.profile?.avatar}
              name={profileData.profile?.name}
              size={104}
              borderColor={Colors.transparent}
            />
          </View>
        </View>

        <View style={styles.identity}>
          <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
            {profileData.displayName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <View style={styles.metaLabelRow}>
                <Text style={styles.metaLabel}>LOCATION</Text>
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.locationIconButton}
                  onPress={profileData.refreshLocation}
                  disabled={profileData.locating}
                  accessibilityLabel="Refresh location">
                  {profileData.locating ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name="refresh" size={14} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
              <Text numberOfLines={1} style={styles.metaValue}>
                {profileData.location}
              </Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>JOINED</Text>
              <Text style={styles.metaValue}>{profileData.joined}</Text>
            </View>
          </View>
        </View>

        <View style={styles.lifetimeCard}>
          <Text style={styles.primaryLabel}>LIFETIME DISTANCE</Text>
          <View style={styles.distanceLine}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.lifetimeValue}>
              {formatDistance(profileData.totalDistance, true)}
            </Text>
            <Text style={styles.kmUnit}>KM</Text>
          </View>
          <View style={styles.trendLine}>
            <Ionicons name="calendar" size={14} color={Colors.secondary} />
            <Text style={styles.trendText}>
              {formatDistance(profileData.weeklyDistance, true)} km this week
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {profileData.statTiles.map(tile => (
            <View key={tile.label} style={[styles.statTile, {borderLeftColor: tile.color}]}> 
              <Text style={[styles.statLabel, {color: tile.color}]}>{tile.label}</Text>
              <Text style={styles.statValue}>{tile.value}</Text>
              <Text style={styles.statCaption}>{tile.caption}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.primaryLabel}>PERFORMANCE VIEW</Text>
              <Text style={styles.chartTitle}>THIS WEEK'S DISTANCE</Text>
            </View>
          </View>
          <View style={styles.barRow}>
            {profileData.weeklyDistance > 0 ? (
              <View style={styles.weeklyTotalBlock}>
                <View style={styles.weeklyTotalRow}>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.weeklyTotalValue}>
                    {formatDistance(profileData.weeklyDistance, true)}
                  </Text>
                  <Text style={styles.weeklyTotalUnit}>KM</Text>
                </View>
                <Text style={styles.weeklyTotalLabel}>THIS WEEK</Text>
              </View>
            ) : (
              <View style={styles.weeklyEmptyBlock}>
                <Text style={styles.weeklyEmptyTitle}>NO RUNS THIS WEEK YET</Text>
                <Text style={styles.weeklyEmptyText}>
                  Your weekly distance appears after your next saved run.
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.recentTitle}>RECENT{' '}RUNS</Text>

        {profileData.recentRuns.length === 0 ? (
          <View style={styles.recentEmpty}>
            <Ionicons name="footsteps" size={28} color={Colors.primary} />
            <Text style={styles.recentEmptyTitle}>NO SAVED RUNS YET</Text>
            <Text style={styles.recentEmptyText}>Completed runs will appear here automatically.</Text>
          </View>
        ) : (
          profileData.recentRuns.slice(0, 4).map((run, index) => {
            const pace = run.averagePace || (run.avgSpeed ? 60 / run.avgSpeed : 0);

            return (
              <View key={`${run._id || run.date}-${index}`} style={styles.recentCard}>
                <MiniRoutePreview coordinates={run.coordinates || []} style={styles.recentRoute} />
                <View style={styles.recentCardHeader}>
                  <View style={styles.recentDistanceBlock}>
                    <Text style={styles.recentDistance}>
                      {formatDistance(Number(run.distance || 0))}
                    </Text>
                    <Text style={styles.recentDistanceUnit}>KM</Text>
                  </View>
                  <View style={styles.recentLocationBadge}>
                    <Text numberOfLines={1} style={styles.recentLocationText}>
                      {run.location?.city || 'OUTDOOR'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentDate}>{formatRunDate(run.date || run.endTime || new Date())}</Text>
                <View style={styles.recentMetrics}>
                  <View style={styles.recentMetric}>
                    <Text style={styles.recentMetricLabel}>TIME</Text>
                    <Text style={styles.recentMetricValue}>{formatClock(run.duration || 0)}</Text>
                  </View>
                  <View style={styles.recentMetric}>
                    <Text style={styles.recentMetricLabel}>PACE</Text>
                    <Text style={styles.recentMetricValue}>{formatPace(pace)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {canDeleteAccount ? (
          <View style={styles.accountSection}>
            <Text style={styles.accountTitle}>ACCOUNT &amp; DATA</Text>
            <Text style={styles.accountSubtitle}>
              Manage deletion directly in the app or use the public deletion page if you need help.
            </Text>

            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.deleteButton}
              onPress={() => setDeleteModalOpen(true)}
              accessibilityLabel="Delete account">
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <View style={styles.deleteButtonTextBlock}>
                <Text style={styles.deleteButtonTitle}>Delete account</Text>
                <Text style={styles.deleteButtonCaption}>
                  Requires your current password and permanently removes your MilesAway account.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.78} style={styles.helpLink} onPress={openDeleteHelp}>
              <Ionicons name="open-outline" size={16} color={Colors.primary} />
              <Text style={styles.helpLinkText}>
                Open the public deletion page for password recovery or email instructions
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>

      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="warning-outline" size={22} color={Colors.error} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Delete permanently</Text>
                <Text style={styles.modalSubtitle}>
                  This action is irreversible. Confirm your password to delete your account and data.
                </Text>
              </View>
            </View>

            <Text style={styles.modalLabel}>CURRENT PASSWORD</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={Colors.onSurfaceVariant}
              secureTextEntry
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.checkboxRow}
              onPress={() => setAcknowledged(value => !value)}>
              <View style={[styles.checkbox, acknowledged && styles.checkboxActive]}>
                {acknowledged ? <Ionicons name="checkmark" size={14} color={Colors.onPrimaryFixed} /> : null}
              </View>
              <Text style={styles.checkboxText}>I understand that deletion is permanent and cannot be undone.</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.secondaryAction}
                onPress={closeDeleteModal}
                disabled={deleting}>
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.destructiveAction, deleting && styles.destructiveActionDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={Colors.onError} />
                ) : (
                  <Text style={styles.destructiveActionText}>Delete permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.surface},
  loadingState: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface},
  content: {paddingHorizontal: 18, paddingTop: 6, paddingBottom: 24},
  hero: {alignSelf: 'center', width: 118, height: 118, alignItems: 'center', justifyContent: 'center'},
  avatarGlow: {position: 'absolute', width: 116, height: 116, borderRadius: 58, backgroundColor: Colors.secondary + '0D'},
  avatarRing: {width: 110, height: 110, borderRadius: 55, padding: 3, borderWidth: 2, borderColor: Colors.primary + '80', backgroundColor: Colors.surfaceContainerLowest, overflow: 'hidden'},
  identity: {alignItems: 'center', marginTop: 6, marginBottom: 22},
  name: {marginTop: 4, color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 30, lineHeight: 36, fontWeight: '900', fontStyle: 'italic', textAlign: 'center'},
  metaRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 20, marginTop: 12, width: '100%'},
  metaBlock: {flex: 1, minWidth: 0, alignItems: 'center'},
  metaLabelRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  metaLabel: {color: Colors.onSurfaceVariant, fontFamily: 'Inter-Bold', fontSize: 9, fontWeight: '800', letterSpacing: 1.2},
  metaValue: {marginTop: 4, color: Colors.onSurface, fontFamily: 'Inter-Bold', fontSize: 12, fontWeight: '800', textAlign: 'center'},
  locationIconButton: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary + '12', borderWidth: 1, borderColor: Colors.primary + '3D'},
  lifetimeCard: {borderRadius: 24, padding: 24, marginBottom: 18, backgroundColor: Colors.surfaceContainerLow},
  primaryLabel: {color: Colors.primary, fontFamily: 'Inter-Bold', fontSize: 10, fontWeight: '800', letterSpacing: 1.5},
  distanceLine: {flexDirection: 'row', alignItems: 'flex-end', marginTop: 20},
  lifetimeValue: {flexShrink: 1, color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 70, lineHeight: 76, fontWeight: '900', fontStyle: 'italic'},
  kmUnit: {marginLeft: 2, marginBottom: 9, color: Colors.primary, fontFamily: 'Lexend-Black', fontSize: 20, fontWeight: '900', fontStyle: 'italic'},
  trendLine: {flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12},
  trendText: {color: Colors.secondary, fontFamily: 'Inter-Bold', fontSize: 12, fontWeight: '800'},
  statGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 36},
  statTile: {width: '47.8%', minHeight: 126, borderRadius: 22, padding: 18, justifyContent: 'space-between', backgroundColor: Colors.surfaceContainerLow, borderLeftWidth: 3},
  statLabel: {fontFamily: 'Inter-Bold', fontSize: 9, fontWeight: '800', letterSpacing: 1.2},
  statValue: {color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 24, lineHeight: 29, fontWeight: '900', fontStyle: 'italic'},
  statCaption: {color: Colors.onSurfaceVariant, fontFamily: 'Inter-Medium', fontSize: 10},
  chartCard: {minHeight: 210, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 22, marginBottom: 30, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.primary + '16'},
  chartHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  chartTitle: {marginTop: 8, color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 25, lineHeight: 31, fontWeight: '900', fontStyle: 'italic'},
  barRow: {marginTop: 30},
  weeklyTotalBlock: {alignItems: 'flex-start', justifyContent: 'flex-end'},
  weeklyTotalRow: {flexDirection: 'row', alignItems: 'baseline'},
  weeklyTotalValue: {flexShrink: 1, color: Colors.primary, fontFamily: 'Lexend-Black', fontSize: 76, lineHeight: 84, fontWeight: '900', fontStyle: 'italic'},
  weeklyTotalUnit: {marginLeft: 10, color: Colors.onSurfaceVariant, fontFamily: 'Lexend-Black', fontSize: 20, fontWeight: '900'},
  weeklyTotalLabel: {marginTop: 2, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Bold', fontSize: 12, fontWeight: '800', letterSpacing: 2},
  weeklyEmptyBlock: {alignItems: 'center', justifyContent: 'center', minHeight: 104, borderRadius: 18, padding: 20, backgroundColor: Colors.surfaceContainerHigh + 'A8'},
  weeklyEmptyTitle: {color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 20, fontStyle: 'italic', textAlign: 'center'},
  weeklyEmptyText: {marginTop: 8, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 19, textAlign: 'center'},
  recentTitle: {marginBottom: 18, color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 24, lineHeight: 30, fontWeight: '900', fontStyle: 'italic'},
  recentEmpty: {minHeight: 126, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 18, marginBottom: 34, backgroundColor: Colors.surfaceContainerHigh},
  recentEmptyTitle: {marginTop: 10, color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 18, fontStyle: 'italic', textAlign: 'center'},
  recentEmptyText: {marginTop: 6, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 19, textAlign: 'center'},
  recentCard: {borderRadius: 22, padding: 16, marginBottom: 16, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.outlineVariant + '22'},
  recentRoute: {height: 118, marginBottom: 14},
  recentCardHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12},
  recentDistanceBlock: {flexDirection: 'row', alignItems: 'flex-end'},
  recentDistance: {color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 34, lineHeight: 38, fontWeight: '900', fontStyle: 'italic'},
  recentDistanceUnit: {marginLeft: 4, marginBottom: 4, color: Colors.primary, fontFamily: 'Lexend-Black', fontSize: 13, fontWeight: '900'},
  recentLocationBadge: {maxWidth: 120, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: Colors.surfaceContainerHigh},
  recentLocationText: {color: Colors.secondary, fontFamily: 'Inter-Bold', fontSize: 9, fontWeight: '800', letterSpacing: 1.2},
  recentDate: {marginTop: 4, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Medium', fontSize: 12},
  recentMetrics: {flexDirection: 'row', gap: 10, marginTop: 14},
  recentMetric: {flex: 1, borderRadius: 16, padding: 12, backgroundColor: Colors.surfaceContainerHigh},
  recentMetricLabel: {color: Colors.onSurfaceVariant, fontFamily: 'Inter-Bold', fontSize: 8, fontWeight: '800', letterSpacing: 1.2},
  recentMetricValue: {marginTop: 5, color: Colors.onSurface, fontFamily: 'Lexend-Bold', fontSize: 13, fontWeight: '900'},
  accountSection: {marginTop: 8, marginBottom: 10, borderRadius: 22, padding: 18, backgroundColor: Colors.surfaceContainerLow, borderWidth: 1, borderColor: Colors.error + '20'},
  accountTitle: {color: Colors.error, fontFamily: 'Inter-Bold', fontSize: 10, fontWeight: '800', letterSpacing: 1.4},
  accountSubtitle: {marginTop: 6, marginBottom: 14, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18},
  deleteButton: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, padding: 16, backgroundColor: Colors.error + '10', borderWidth: 1, borderColor: Colors.error + '30'},
  deleteButtonTextBlock: {flex: 1},
  deleteButtonTitle: {color: Colors.error, fontFamily: 'Lexend-Bold', fontSize: 16, fontWeight: '900', fontStyle: 'italic'},
  deleteButtonCaption: {marginTop: 5, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Regular', fontSize: 11, lineHeight: 17},
  helpLink: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 4},
  helpLinkText: {flex: 1, color: Colors.primary, fontFamily: 'Inter-Bold', fontSize: 11, fontWeight: '800', lineHeight: 17},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18},
  modalCard: {borderRadius: 24, padding: 20, backgroundColor: Colors.surfaceContainer, borderWidth: 1, borderColor: Colors.outlineVariant + '44'},
  modalHeader: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18},
  modalIconWrap: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.error + '12', borderWidth: 1, borderColor: Colors.error + '28'},
  modalHeaderText: {flex: 1},
  modalTitle: {color: Colors.onSurface, fontFamily: 'Lexend-Black', fontSize: 20, lineHeight: 24, fontWeight: '900', fontStyle: 'italic'},
  modalSubtitle: {marginTop: 7, color: Colors.onSurfaceVariant, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18},
  modalLabel: {color: Colors.onSurfaceVariant, fontFamily: 'Inter-Bold', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8},
  modalInput: {minHeight: 50, borderRadius: 16, paddingHorizontal: 14, color: Colors.onSurface, backgroundColor: Colors.surfaceContainerHigh, borderWidth: 1, borderColor: Colors.outlineVariant + '55', fontFamily: 'Inter-Medium', fontSize: 14},
  checkboxRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14, marginBottom: 18},
  checkbox: {width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerHigh, marginTop: 1},
  checkboxActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  checkboxText: {flex: 1, color: Colors.onSurface, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18},
  modalActions: {flexDirection: 'row', gap: 12},
  secondaryAction: {flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerHigh, borderWidth: 1, borderColor: Colors.outlineVariant + '55'},
  secondaryActionText: {color: Colors.onSurface, fontFamily: 'Inter-Bold', fontSize: 13, fontWeight: '800'},
  destructiveAction: {flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.error},
  destructiveActionDisabled: {opacity: 0.7},
  destructiveActionText: {color: Colors.onError, fontFamily: 'Inter-Bold', fontSize: 13, fontWeight: '800'},
  footerSpace: {height: 116},
});

export default ProfileScreen;
