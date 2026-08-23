// ================================================================
// EduFit Nepal — Single source of truth for all data shapes
// MASTER_PROMPT.md §"Non-negotiable architecture" rule #4
// ================================================================

// --- School Profile ---

export type SchoolType = 'public' | 'private' | 'community' | 'religious' | 'international'
export type GradeLevel = 'primary' | 'lower_secondary' | 'secondary' | 'higher_secondary'
export type TechnologyUsage = 'none' | 'minimal' | 'moderate' | 'substantial' | 'advanced'

export interface SchoolProfile {
  id?: string
  name: string
  location: string
  district: string
  schoolType: SchoolType
  studentCount: number
  gradeLevels: GradeLevel[]
  teacherCount: number
  technologyUsage: TechnologyUsage
  createdAt?: string
}

// --- Four-Dimension Assessment Interfaces ---

export type InfrastructureLevel = 0 | 1 | 2 | 3 | 4  // 0 = none, 4 = excellent
export type ReadinessLevel = 0 | 1 | 2 | 3 | 4

export interface InfrastructureAssessment {
  internetConnectivity: InfrastructureLevel   // quality/reliability
  deviceAvailability: InfrastructureLevel     // student:device ratio proxy
  powerReliability: InfrastructureLevel       // load shedding / UPS
  bandwidthAdequacy: InfrastructureLevel      // speed for EdTech tools
  technicalSupport: InfrastructureLevel       // in-house IT capacity
  additionalNotes?: string
}

export interface TeacherReadinessAssessment {
  digitalLiteracy: ReadinessLevel             // general computer comfort
  edtechExperience: ReadinessLevel            // prior EdTech tool use
  trainingWillingness: ReadinessLevel         // openness to upskilling
  ictCurriculumIntegration: ReadinessLevel    // current ICT in lessons
  devicePersonalOwnership: ReadinessLevel     // teachers' own devices
  additionalNotes?: string
}

export interface SchoolManagementAssessment {
  leadershipBuyIn: ReadinessLevel             // principal/leadership commitment
  budgetAllocation: ReadinessLevel            // existing EdTech budget
  policyFramework: ReadinessLevel             // formal digital policy exists
  parentCommunitySupport: ReadinessLevel      // community acceptance
  dataPrivacyAwareness: ReadinessLevel        // awareness of student data issues
  additionalNotes?: string
}

export interface LearningRequirementsAssessment {
  curriculumAlignment: ReadinessLevel         // fit with national curriculum
  studentAccessAtHome: ReadinessLevel         // home device/internet access proxy
  languageSupport: ReadinessLevel             // Nepali/local language content
  accessibilityNeeds: ReadinessLevel          // students with disabilities
  blendedLearningReadiness: ReadinessLevel    // hybrid model feasibility
  additionalNotes?: string
}

// --- Student Survey ---

export type DeviceOwnership = 'none' | 'shared_family' | 'personal_basic' | 'personal_smartphone' | 'personal_computer'
export type InternetAccess = 'none' | 'mobile_data_limited' | 'mobile_data_adequate' | 'home_broadband' | 'school_only'
export type DigitalConfidence = 1 | 2 | 3 | 4 | 5  // 1=very low, 5=very high
export type LearningPreference = 'text' | 'video' | 'interactive' | 'audio' | 'mixed'

export interface StudentSurvey {
  id?: string
  schoolId: string
  // Auth
  authMethod: 'school_email' | 'school_code'
  // Survey fields
  deviceOwnership: DeviceOwnership
  internetAccess: InternetAccess
  averageDailyScreenTimeMinutes: number
  learningPreference: LearningPreference
  digitalConfidence: DigitalConfidence
  hasQuietStudySpace: boolean
  accessLimitations: string[]             // e.g. ['cost', 'parental_restriction', 'no_device']
  completedOnSharedDevice: boolean        // in-class fallback flag
  // Timestamps
  submittedAt?: string
  confirmedAt?: string                    // set only after DB write confirmed
}

// --- Resource Hub ---

export type ResourceType = 'scholarship' | 'competition' | 'learning_resource' | 'digital_material'

export interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  url: string
  eligibility: string     // who can apply / access
  deadline?: string       // ISO date string, optional
  provider: string
  isFree: boolean
  language: 'nepali' | 'english' | 'both'
}

// --- EdTech Tool Profile ---

export type BandwidthRequirement = 'offline' | 'low' | 'medium' | 'high'
export type CostModel = 'free' | 'freemium' | 'subscription' | 'one_time' | 'government_licensed'
export type DeploymentMode = 'web' | 'app' | 'both' | 'offline_capable'

export interface EdTechTool {
  id: string
  name: string
  description: string
  category: string
  bandwidthRequirement: BandwidthRequirement
  costModel: CostModel
  costUsdPerStudentYear: number | null    // null = free / government
  deploymentMode: DeploymentMode
  supportsLowBandwidth: boolean
  nepaliLanguageSupport: boolean
  minimumDeviceSpec: 'basic' | 'mid' | 'high'
  teacherTrainingDaysRequired: number
  onlineSupportAvailable: boolean
  // Scoring weight hints
  infrastructureRequirement: InfrastructureLevel   // minimum infrastructure needed
  teacherReadinessRequirement: ReadinessLevel
}

// --- Compatibility Engine Output ---

export interface DimensionScore {
  score: number           // 0–100
  weight: number          // weighting applied
  problems: string[]      // specific flags for this dimension
  tooltipExplanation: string  // why this score — shown in UI tooltips
}

export interface CompatibilityResult {
  toolId: string
  schoolId: string
  overallScore: number    // 0–100, weighted blend
  recommendation: 'recommended' | 'conditional' | 'not_recommended'
  dimensions: {
    infrastructure: DimensionScore
    teacherReadiness: DimensionScore
    schoolManagement: DimensionScore
    learningRequirements: DimensionScore
  }
  problems: string[]      // aggregated across all dimensions
  realityGapFlag: boolean // true when school-reported vs student-reported diverge meaningfully
  realityGapDetails?: string
  incompleteDataFlag: boolean
  computedAt: string
}

// --- AI Explanation Layer Output ---

export interface ActionPlanMonth {
  month: 1 | 2 | 3
  focus: string
}

export interface ExplanationResult {
  explanation: string | null
  actionPlan: ActionPlanMonth[]
  fallback: boolean       // true = API failed, raw engine output should stand alone
}

// ================================================================
// Student Events & Competitions Finder
// BNKS_Hackathon_Student_Events_Competitions_MVP.md §"Event Data Model"
// ================================================================

// --- Organizations ---

export type OrganizationType =
  | 'student_club'
  | 'college_club'
  | 'university'
  | 'ngo'
  | 'ingo'
  | 'youth_organization'
  | 'tech_community'
  | 'professional_organization'
  | 'company'
  | 'government'
  | 'municipality'
  | 'community_organization'

export type VerificationStatus =
  | 'verified_organizer'
  | 'verified_event'
  | 'cross_checked'
  | 'unverified'
  | 'expired'

export interface Organization {
  id: string
  name: string
  organizationType: OrganizationType
  description: string
  location: string
  website?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  contact?: string
  affiliation?: string
  verificationStatus: Exclude<VerificationStatus, 'expired'>
  /** Anti-scam warning signals at organizer level — neutral language only */
  safetyFlags?: string[]
  sourceUrl?: string
  lastVerified: string // ISO date
}

// --- Events ---

export type EventType =
  | 'competition'
  | 'hackathon'
  | 'workshop'
  | 'bootcamp'
  | 'seminar'
  | 'conference'
  | 'career_event'
  | 'volunteering'
  | 'networking'
  | 'other'

export type EventFormat = 'online' | 'physical' | 'hybrid' | 'unknown'

export type Participation = 'individual' | 'team' | 'both' | 'unknown'

export type EventStatus =
  | 'upcoming'
  | 'registration_open'
  | 'registration_closed'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'unknown'

export type EducationLevel =
  | 'school'
  | 'see'
  | 'plus_two'
  | 'bachelors'
  | 'masters'
  | 'recent_graduate'

/** Registration fee: number = NPR amount; null = unknown cost */
export type RegistrationFee = number | null

export interface EventEligibility {
  educationLevels: EducationLevel[]
  minimumAge?: number
  maximumAge?: number
  allowedPrograms?: string[]
  eligibilityNotes?: string
}

export type RegistrationUrlType = 'official' | 'external' | 'google_form' | 'unknown'

export type EventBenefit =
  | 'prize'
  | 'certificate'
  | 'mentorship'
  | 'networking'
  | 'portfolio_project'
  | 'internship_opportunity'
  | 'exposure'
  | 'training'

export interface Event {
  id: string
  title: string
  description: string
  organizationId: string
  eventType: EventType
  category: string            // e.g. 'AI/ML', 'Debate', 'Robotics'
  subCategory?: string
  location: string            // city / area label shown on cards
  district: string
  province: string
  venue?: string              // physical venue when applicable
  format: EventFormat
  startDatetime: string       // ISO datetime
  endDatetime: string         // ISO datetime
  registrationDeadline: string // ISO date
  registrationUrl: string
  registrationUrlType: RegistrationUrlType
  officialEventUrl?: string
  contactInformation?: string
  eligibility: EventEligibility
  participation: Participation
  teamSizeMin?: number
  teamSizeMax?: number
  registrationFee: RegistrationFee
  prizeInformation?: string   // e.g. 'NPR 100,000' — never guessed per MD quality rules
  certificateAvailable: boolean
  skills: string[]
  benefits: EventBenefit[]
  sourceUrl: string
  sourceType: string          // e.g. 'official_website', 'facebook', 'college_notice'
  verificationStatus: VerificationStatus
  /** Anti-scam warning signals — neutral language only (MD §Anti-Scam) */
  safetyFlags: string[]
  lastVerified: string        // ISO date
  status: EventStatus
}

// --- Student Matching ---

export interface StudentEventProfile {
  educationLevel: EducationLevel
  interests: string[]         // matched against category + skills
  location: string            // district name, '' = anywhere
  preferFree: boolean
  preferOnline: boolean
  preferTeam: boolean
}

export interface MatchReason {
  ok: boolean
  text: string
}

export interface MatchResult {
  score: number               // 0–100
  reasons: MatchReason[]
}
