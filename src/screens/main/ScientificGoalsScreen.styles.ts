import { StyleSheet, Platform } from 'react-native';
import { SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: SPACING.md,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.primary,
    fontWeight: '800',
    color: colors.text.primary,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontFamily: FONTS.primary,
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  
  // Cards
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.primary,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: SPACING.lg,
    letterSpacing: -0.3,
  },
  
  // Profile Info
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  profileItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    padding: SPACING.md,
    borderRadius: 16,
  },
  profileLabel: {
    fontFamily: FONTS.primary,
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  profileValue: {
    fontFamily: FONTS.primary,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // Introduction
  introContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  introTitle: {
    fontFamily: FONTS.primary,
    fontSize: 24,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -0.8,
  },
  introText: {
    fontFamily: FONTS.primary,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },

  // Formulas
  formulaItem: {
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.amber,
  },
  formulaName: {
    fontFamily: FONTS.primary,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  formulaDesc: {
    fontFamily: FONTS.primary,
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: 4,
  },
  formulaResult: {
    fontFamily: FONTS.primary,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary.amber,
  },

  // Goals Grid
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  goalCard: {
    width: '47%',
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    padding: SPACING.lg,
    borderRadius: 20,
    alignItems: 'center',
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalValue: {
    fontFamily: FONTS.primary,
    fontSize: 20,
    fontWeight: '900',
    color: colors.text.primary,
    marginBottom: 2,
  },
  goalLabel: {
    fontFamily: FONTS.primary,
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Buttons
  mainButton: {
    backgroundColor: colors.primary.amber,
    borderRadius: 20,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  mainButtonText: {
    fontFamily: FONTS.primary,
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },
  
  secondaryButton: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  },
  secondaryButtonText: {
    fontFamily: FONTS.primary,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});