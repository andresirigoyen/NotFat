import { StyleSheet } from 'react-native';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';

export const TYPOGRAPHY = {
  heading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  subheading: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  body: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
  button: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.bold,
  },
  caption: {
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.normal,
  },
};

export const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3ED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: colors.primary?.amber || '#FFB800',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: '#ffffff',
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#666666',
    marginTop: SPACING.md,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 18,
    color: '#000000',
    marginBottom: SPACING.md,
  },
  profileInfo: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: '#666666',
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: '#000000',
    fontWeight: '600',
  },
  introductionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introductionTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: FONTS.sizes.xl,
    color: colors.text?.primary || '#000000',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  introductionText: {
    ...TYPOGRAPHY.body,
    color: colors.text?.secondary || '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  generateButton: {
    backgroundColor: colors.primary?.amber || '#FFB800',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.lg,
    minWidth: 200,
  },
  generateButtonText: {
    ...TYPOGRAPHY.button,
    color: colors.background?.primary || '#000000',
    textAlign: 'center',
  },
  formulasCard: {
    backgroundColor: colors.background?.secondary || '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  formulasTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: FONTS.sizes.lg,
    color: colors.text?.primary || '#000000',
    marginBottom: SPACING.md,
  },
  formulaSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  formulaName: {
    ...TYPOGRAPHY.subheading,
    color: colors.text?.primary || '#000000',
    marginBottom: SPACING.xs,
  },
  formulaValue: {
    ...TYPOGRAPHY.caption,
    color: colors.text?.secondary || '#666666',
    fontFamily: 'monospace',
    marginBottom: SPACING.xs,
  },
  formulaResult: {
    ...TYPOGRAPHY.body,
    color: colors.primary?.amber || '#FFB800',
    fontWeight: '600',
  },
  goalsCard: {
    backgroundColor: colors.background?.secondary || '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  goalsTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: FONTS.sizes.lg,
    color: colors.text?.primary || '#000000',
    marginBottom: SPACING.md,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  goalValue: {
    ...TYPOGRAPHY.heading,
    fontSize: FONTS.sizes.base,
    color: colors.text?.primary || '#000000',
    marginBottom: 2,
  },
  goalLabel: {
    ...TYPOGRAPHY.caption,
    color: colors.text?.secondary || '#666666',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: colors.primary?.amber || '#FFB800',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  doneButtonText: {
    ...TYPOGRAPHY.button,
    color: '#000000',
  },
});