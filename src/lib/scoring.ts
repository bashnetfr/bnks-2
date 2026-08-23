// ================================================================
// Ed-Vantage — Compatibility / Readiness Scoring Engine
//
// MASTER_PROMPT.md §"Non-negotiable architecture" rule #1:
//   Deterministic. Pure rule-based logic. ZERO AI/LLM/API calls.
//   Same inputs → same outputs. Always.
// ================================================================

import type {
  SchoolProfile,
  InfrastructureAssessment,
  TeacherReadinessAssessment,
  SchoolManagementAssessment,
  LearningRequirementsAssessment,
  StudentSurvey,
  EdTechTool,
  CompatibilityResult,
  DimensionScore,
  ReadinessLevel,
} from './types'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

/** Default score for any field that was skipped / left null.
 *  Per DASHBOARD_BUILD_PROMPT.md: do NOT default to 0 or 100.
 *  Use 50 (neutral) and add "incomplete data" to problems list. */
const INCOMPLETE_DEFAULT: ReadinessLevel = 2

const DIMENSION_WEIGHTS = {
  infrastructure: 0.30,
  teacherReadiness: 0.30,
  schoolManagement: 0.20,
  learningRequirements: 0.20,
}

/** Reality gap threshold: if blended student vs school differs by
 *  more than this many points, raise realityGapFlag. */
const REALITY_GAP_THRESHOLD = 15

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Normalise a ReadinessLevel (0–4) to a 0–100 score.
 */
function levelToScore(level: ReadinessLevel | null | undefined): { score: number; incomplete: boolean } {
  if (level === null || level === undefined) {
    return { score: (INCOMPLETE_DEFAULT / 4) * 100, incomplete: true }
  }
  return { score: (level / 4) * 100, incomplete: false }
}

/**
 * Average an array of level readings into 0–100, tracking incomplete fields.
 */
function avgLevels(
  levels: (ReadinessLevel | null | undefined)[]
): { score: number; incompleteCount: number } {
  let total = 0
  let incompleteCount = 0
  for (const l of levels) {
    const { score, incomplete } = levelToScore(l)
    total += score
    if (incomplete) incompleteCount++
  }
  return { score: total / levels.length, incompleteCount }
}

// ----------------------------------------------------------------
// Dimension scorers
// ----------------------------------------------------------------

export function scoreInfrastructure(
  a: Partial<InfrastructureAssessment>
): DimensionScore {
  const levels = [
    a.internetConnectivity,
    a.deviceAvailability,
    a.powerReliability,
    a.bandwidthAdequacy,
    a.technicalSupport,
  ]
  const { score, incompleteCount } = avgLevels(levels)
  const problems: string[] = []
  if (incompleteCount > 0) problems.push(`${incompleteCount} infrastructure field(s) not assessed — incomplete data`)
  if ((a.internetConnectivity ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Internet connectivity is critically low')
  if ((a.powerReliability ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Power reliability risk — frequent outages expected')
  if ((a.deviceAvailability ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Insufficient devices per student')
  if ((a.bandwidthAdequacy ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Bandwidth insufficient for most EdTech tools')

  return {
    score: Math.round(score),
    weight: DIMENSION_WEIGHTS.infrastructure,
    problems,
    tooltipExplanation:
      'Infrastructure score reflects your school\'s internet connectivity, device availability, power reliability, bandwidth quality, and technical support capacity. Low scores here mean most EdTech tools will struggle to function reliably.',
  }
}

export function scoreTeacherReadiness(
  a: Partial<TeacherReadinessAssessment>
): DimensionScore {
  const levels = [
    a.digitalLiteracy,
    a.edtechExperience,
    a.trainingWillingness,
    a.ictCurriculumIntegration,
    a.devicePersonalOwnership,
  ]
  const { score, incompleteCount } = avgLevels(levels)
  const problems: string[] = []
  if (incompleteCount > 0) problems.push(`${incompleteCount} teacher readiness field(s) not assessed — incomplete data`)
  if ((a.digitalLiteracy ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Teacher digital literacy is critically low — training required before deployment')
  if ((a.ictCurriculumIntegration ?? INCOMPLETE_DEFAULT) <= 1) problems.push('ICT not integrated in curriculum — World Bank ETRI Nepal 2022 finding: this is the primary risk factor')
  if ((a.trainingWillingness ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Low teacher willingness for training — adoption risk high')

  return {
    score: Math.round(score),
    weight: DIMENSION_WEIGHTS.teacherReadiness,
    problems,
    tooltipExplanation:
      'Teacher Readiness is the most critical pillar — the World Bank ETRI Nepal 2022 pilot specifically flagged this as the weakest dimension nationally due to absent standards and limited ICT curriculum integration. Low scores here are the leading cause of EdTech deployment failure.',
  }
}

export function scoreSchoolManagement(
  a: Partial<SchoolManagementAssessment>
): DimensionScore {
  const levels = [
    a.leadershipBuyIn,
    a.budgetAllocation,
    a.policyFramework,
    a.parentCommunitySupport,
    a.dataPrivacyAwareness,
  ]
  const { score, incompleteCount } = avgLevels(levels)
  const problems: string[] = []
  if (incompleteCount > 0) problems.push(`${incompleteCount} management field(s) not assessed — incomplete data`)
  if ((a.leadershipBuyIn ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Weak leadership buy-in — EdTech initiatives without principal commitment typically stall')
  if ((a.budgetAllocation ?? INCOMPLETE_DEFAULT) === 0) problems.push('No EdTech budget allocated — deployment without budget is unsustainable')
  if ((a.dataPrivacyAwareness ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Low data privacy awareness — risk when collecting student data')

  return {
    score: Math.round(score),
    weight: DIMENSION_WEIGHTS.schoolManagement,
    problems,
    tooltipExplanation:
      'School Management scores leadership commitment, budget allocation, policy frameworks, community support, and data privacy awareness. Strong management is a force multiplier — it can compensate for moderate infrastructure gaps.',
  }
}

export function scoreLearningRequirements(
  a: Partial<LearningRequirementsAssessment>
): DimensionScore {
  const levels = [
    a.curriculumAlignment,
    a.studentAccessAtHome,
    a.languageSupport,
    a.accessibilityNeeds,
    a.blendedLearningReadiness,
  ]
  const { score, incompleteCount } = avgLevels(levels)
  const problems: string[] = []
  if (incompleteCount > 0) problems.push(`${incompleteCount} learning requirements field(s) not assessed — incomplete data`)
  if ((a.languageSupport ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Limited Nepali/local language content support — adoption barrier for students and teachers')
  if ((a.studentAccessAtHome ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Poor student home device/internet access — limits homework/async learning use cases')
  if ((a.curriculumAlignment ?? INCOMPLETE_DEFAULT) <= 1) problems.push('Poor national curriculum alignment — may conflict with current teaching requirements')

  return {
    score: Math.round(score),
    weight: DIMENSION_WEIGHTS.learningRequirements,
    problems,
    tooltipExplanation:
      'Learning Requirements scores how well EdTech fits national curriculum, student home access, Nepali language content availability, accessibility needs, and readiness for blended/hybrid learning models.',
  }
}

// ----------------------------------------------------------------
// Student data blending
// ----------------------------------------------------------------

/**
 * Compute student-side home access score from aggregated surveys.
 * Returns 0–100.
 */
export function computeStudentAccessScore(surveys: StudentSurvey[]): number {
  if (surveys.length === 0) return (INCOMPLETE_DEFAULT / 4) * 100

  const deviceScores: Record<string, number> = {
    none: 0,
    shared_family: 0.25,
    personal_basic: 0.5,
    personal_smartphone: 0.75,
    personal_computer: 1,
  }
  const internetScores: Record<string, number> = {
    none: 0,
    mobile_data_limited: 0.25,
    mobile_data_adequate: 0.5,
    home_broadband: 1,
    school_only: 0.15,
  }

  let total = 0
  for (const s of surveys) {
    const d = deviceScores[s.deviceOwnership] ?? 0.5
    const i = internetScores[s.internetAccess] ?? 0.5
    const conf = (s.digitalConfidence - 1) / 4  // 1–5 → 0–1
    // Weighted: device 40%, internet 40%, confidence 20%
    total += (d * 0.4 + i * 0.4 + conf * 0.2) * 100
  }
  return Math.round(total / surveys.length)
}

// ----------------------------------------------------------------
// Main engine
// ----------------------------------------------------------------

export function computeCompatibility(
  _profile: SchoolProfile,
  tool: EdTechTool,
  infrastructure: Partial<InfrastructureAssessment>,
  teacherReadiness: Partial<TeacherReadinessAssessment>,
  schoolManagement: Partial<SchoolManagementAssessment>,
  learningRequirements: Partial<LearningRequirementsAssessment>,
  studentSurveys?: StudentSurvey[],
): CompatibilityResult {
  const infra = scoreInfrastructure(infrastructure)
  const teacher = scoreTeacherReadiness(teacherReadiness)
  const mgmt = scoreSchoolManagement(schoolManagement)
  const learning = scoreLearningRequirements(learningRequirements)

  // Weighted overall (school-reported)
  const schoolReportedScore =
    infra.score * DIMENSION_WEIGHTS.infrastructure +
    teacher.score * DIMENSION_WEIGHTS.teacherReadiness +
    mgmt.score * DIMENSION_WEIGHTS.schoolManagement +
    learning.score * DIMENSION_WEIGHTS.learningRequirements

  // Student data blending (student data weighted higher — ground truth)
  let overallScore = schoolReportedScore
  let realityGapFlag = false
  let realityGapDetails: string | undefined

  if (studentSurveys && studentSurveys.length > 0) {
    const studentAccessScore = computeStudentAccessScore(studentSurveys)
    const gap = Math.abs(studentAccessScore - (learning.score))

    if (gap > REALITY_GAP_THRESHOLD) {
      realityGapFlag = true
      realityGapDetails = `Student-reported home access (${studentAccessScore}/100) diverges from school-reported learning requirements score (${learning.score}/100) by ${Math.round(gap)} points. Student data is treated as ground truth.`
    }

    // Blend: student data 60%, school-reported 40% for the learning dimension proxy
    const blendedLearning = studentAccessScore * 0.6 + learning.score * 0.4
    overallScore =
      infra.score * DIMENSION_WEIGHTS.infrastructure +
      teacher.score * DIMENSION_WEIGHTS.teacherReadiness +
      mgmt.score * DIMENSION_WEIGHTS.schoolManagement +
      blendedLearning * DIMENSION_WEIGHTS.learningRequirements
  }

  // Collect all problems
  const allProblems = [
    ...infra.problems,
    ...teacher.problems,
    ...mgmt.problems,
    ...learning.problems,
  ]

  // Flag incomplete data
  const incompleteDataFlag = allProblems.some((p) => p.includes('incomplete data'))

  // Tool compatibility adjustment: penalise if tool requires more than school can provide
  const toolInfraGap = (tool.infrastructureRequirement / 4) * 100 - infra.score
  if (toolInfraGap > 20) {
    allProblems.push(
      `${tool.name} requires higher infrastructure than currently available (gap: ${Math.round(toolInfraGap)} pts)`
    )
    overallScore = Math.max(0, overallScore - toolInfraGap * 0.3)
  }
  const toolTeacherGap = (tool.teacherReadinessRequirement / 4) * 100 - teacher.score
  if (toolTeacherGap > 20) {
    allProblems.push(
      `${tool.name} requires higher teacher readiness than currently available (gap: ${Math.round(toolTeacherGap)} pts)`
    )
    overallScore = Math.max(0, overallScore - toolTeacherGap * 0.3)
  }

  const finalScore = Math.round(Math.min(100, Math.max(0, overallScore)))

  let recommendation: CompatibilityResult['recommendation']
  if (finalScore >= 70) recommendation = 'recommended'
  else if (finalScore >= 45) recommendation = 'conditional'
  else recommendation = 'not_recommended'

  return {
    toolId: tool.id,
    schoolId: _profile.id ?? 'unknown',
    overallScore: finalScore,
    recommendation,
    dimensions: {
      infrastructure: infra,
      teacherReadiness: teacher,
      schoolManagement: mgmt,
      learningRequirements: learning,
    },
    problems: allProblems,
    realityGapFlag,
    realityGapDetails,
    incompleteDataFlag,
    computedAt: new Date().toISOString(),
  }
}
