// ================================================================
// Ed-Vantage — Student Events & Competitions Finder
// BNKS_Hackathon_Student_Events_Competitions_MVP.md §"MVP Features"
//
// Hand-curated demo dataset. Every record carries a source URL,
// verification status and last-verified date (MD §Quality Rules).
// API-first: GET /api/events for future integrations.
// ================================================================

import type {
  Event,
  Organization,
  StudentEventProfile,
  MatchResult,
  MatchReason,
  EventStatus,
} from './types'

// ---------------------------------------------------------------
// Organizations (MD §"Organization Database")
// ---------------------------------------------------------------

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-kucc',
    name: 'Kathmandu University Computer Club',
    organizationType: 'student_club',
    description:
      'Official student club of Kathmandu University running hackathons, coding events and tech workshops since 2012.',
    location: 'Dhulikhel, Kavre',
    website: 'https://ku.edu.np',
    facebook: 'https://facebook.com/kucc',
    affiliation: 'Kathmandu University',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://ku.edu.np/clubs',
    lastVerified: '2026-08-10',
  },
  {
    id: 'org-nesoir',
    name: 'Nepal Software Engineers Organization',
    organizationType: 'tech_community',
    description:
      'National developer community organizing coding championships and engineering bootcamps across Nepal.',
    location: 'Kathmandu',
    website: 'https://nepalsoftware.org.np',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://nepalsoftware.org.np/about',
    lastVerified: '2026-08-05',
  },
  {
    id: 'org-robotics-np',
    name: 'Nepal Robotics Association',
    organizationType: 'professional_organization',
    description:
      'Non-profit association promoting robotics education and hosting national robotics competitions.',
    location: 'Lalitpur',
    website: 'https://nepalrobotics.org',
    affiliation: 'Affiliated member of international robotics federations',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://nepalrobotics.org/about',
    lastVerified: '2026-07-28',
  },
  {
    id: 'org-mun-society',
    name: 'Himalayan MUN Society',
    organizationType: 'youth_organization',
    description:
      'Youth organization organizing Model United Nations conferences for school and university students.',
    location: 'Kathmandu',
    instagram: 'https://instagram.com/himalayanmun',
    verificationStatus: 'cross_checked',
    sourceUrl: 'https://himalayanmun.org',
    lastVerified: '2026-08-12',
  },
  {
    id: 'org-debate-society',
    name: 'Kathmandu Debate Society',
    organizationType: 'college_club',
    description:
      'Inter-college debate society hosting parliamentary debate tournaments and public-speaking trainings.',
    location: 'Kathmandu',
    facebook: 'https://facebook.com/ktmdebatesociety',
    affiliation: 'Tribhuvan University student network',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://ktmdebate.org.np',
    lastVerified: '2026-08-01',
  },
  {
    id: 'org-startup-np',
    name: 'Startup Nepal Network',
    organizationType: 'ngo',
    description:
      'NGO connecting students to entrepreneurship programs, pitch competitions and mentorship.',
    location: 'Kathmandu',
    website: 'https://startupnepal.net',
    linkedin: 'https://linkedin.com/company/startup-nepal-network',
    verificationStatus: 'verified_event',
    sourceUrl: 'https://startupnepal.net/events',
    lastVerified: '2026-08-08',
  },
  {
    id: 'org-leo-youth',
    name: 'Leo Club of Kathmandu Central',
    organizationType: 'community_organization',
    description:
      'Youth volunteer club running community service projects and leadership programs.',
    location: 'Kathmandu',
    facebook: 'https://facebook.com/leoktmcentral',
    affiliation: 'Leo/Lions youth network',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://leoktmcentral.org.np',
    lastVerified: '2026-07-20',
  },
  {
    id: 'org-pokhara-devs',
    name: 'Pokhara Developer Community',
    organizationType: 'tech_community',
    description:
      'Regional developer community outside Kathmandu Valley running meetups, bootcamps and code contests.',
    location: 'Pokhara',
    website: 'https://pokharadevs.org',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://pokharadevs.org',
    lastVerified: '2026-08-14',
  },
  {
    id: 'org-science-fdn',
    name: 'Nepal Science Foundation',
    organizationType: 'ngo',
    description:
      'Foundation promoting STEM education through science fairs, olympiads and research mentorship.',
    location: 'Bhaktapur',
    website: 'https://nepalscience.org.np',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://nepalscience.org.np/programs',
    lastVerified: '2026-08-03',
  },
  {
    id: 'org-careerbridge',
    name: 'CareerBridge Nepal Pvt. Ltd.',
    organizationType: 'company',
    description:
      'Career services company organizing student career fairs and employer networking events.',
    location: 'Kathmandu',
    website: 'https://careerbridge.com.np',
    verificationStatus: 'verified_organizer',
    sourceUrl: 'https://careerbridge.com.np/events',
    lastVerified: '2026-08-15',
  },
  {
    id: 'org-kala-collective',
    name: 'Kala Collective',
    organizationType: 'community_organization',
    description:
      'Artist-run collective hosting art, photography and design competitions for young creatives.',
    location: 'Lalitpur',
    instagram: 'https://instagram.com/kalacollective',
    verificationStatus: 'unverified',
    safetyFlags: ['Could not independently verify organizer through an official website.'],
    sourceUrl: 'https://instagram.com/kalacollective',
    lastVerified: '2026-08-18',
  },
  {
    id: 'org-youthfest-org',
    name: 'Mega Youth Fest Organizing Committee',
    organizationType: 'community_organization',
    description:
      'Ad-hoc committee announcing a large multi-event youth festival. Organizer identity could not be confirmed.',
    location: 'Kathmandu',
    sourceUrl: 'https://facebook.com/megayouthfest',
    verificationStatus: 'unverified',
    safetyFlags: [
      'Could not verify organizer.',
      'Registration link does not belong to a confirmed organizer domain.',
      'Fee information unclear.',
    ],
    lastVerified: '2026-08-19',
  },
]

// ---------------------------------------------------------------
// Events (MD §"Event Data Model")
// ---------------------------------------------------------------

export const EVENTS: Event[] = [
  {
    id: 'evt-ai-hackathon-2026',
    title: 'AI Hackathon Nepal 2026',
    description:
      '48-hour national hackathon focused on building practical AI solutions for local problems in agriculture, health and education. Mentors from leading Nepali tech companies guide teams throughout.',
    organizationId: 'org-kucc',
    eventType: 'hackathon',
    category: 'AI/ML',
    subCategory: 'Hackathon',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Kathmandu University City Campus, Thapathali',
    format: 'physical',
    startDatetime: '2026-09-12T09:00:00+05:45',
    endDatetime: '2026-09-14T17:00:00+05:45',
    registrationDeadline: '2026-09-04',
    registrationUrl: 'https://ku.edu.np/ai-hackathon/register',
    registrationUrlType: 'official',
    officialEventUrl: 'https://ku.edu.np/ai-hackathon',
    contactInformation: 'hackathon@ku.edu.np',
    eligibility: {
      educationLevels: ['plus_two', 'bachelors', 'masters', 'recent_graduate'],
      minimumAge: 16,
      maximumAge: 28,
    },
    participation: 'team',
    teamSizeMin: 2,
    teamSizeMax: 4,
    registrationFee: 0,
    prizeInformation: 'NPR 100,000',
    certificateAvailable: true,
    skills: ['Python', 'Machine Learning', 'Programming', 'Teamwork'],
    benefits: ['prize', 'certificate', 'mentorship', 'networking', 'portfolio_project'],
    sourceUrl: 'https://ku.edu.np/ai-hackathon',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-16',
    status: 'registration_open',
  },
  {
    id: 'evt-startup-pitch-2026',
    title: 'Startup Pitch Competition',
    description:
      'Students pitch early-stage business ideas to a panel of Nepali founders and investors. Winning teams receive seed support and incubation offers.',
    organizationId: 'org-startup-np',
    eventType: 'competition',
    category: 'Entrepreneurship',
    subCategory: 'Business plan',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Bhrikutimandap Exhibition Hall',
    format: 'physical',
    startDatetime: '2026-10-03T10:00:00+05:45',
    endDatetime: '2026-10-04T18:00:00+05:45',
    registrationDeadline: '2026-09-20',
    registrationUrl: 'https://startupnepal.net/pitch/register',
    registrationUrlType: 'official',
    contactInformation: 'pitch@startupnepal.net',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors', 'masters'],
    },
    participation: 'both',
    teamSizeMin: 1,
    teamSizeMax: 3,
    registrationFee: 0,
    prizeInformation: 'Incubation offer + NPR 50,000',
    certificateAvailable: true,
    skills: ['Business planning', 'Public speaking', 'Market research'],
    benefits: ['prize', 'certificate', 'mentorship', 'exposure', 'portfolio_project'],
    sourceUrl: 'https://startupnepal.net/pitch',
    sourceType: 'official_website',
    verificationStatus: 'verified_event',
    safetyFlags: [],
    lastVerified: '2026-08-12',
    status: 'registration_open',
  },
  {
    id: 'evt-national-coding-champ-2026',
    title: 'National Coding Championship',
    description:
      'Individual competitive programming contest with algorithmic problem sets. Top scorers form the national training pool.',
    organizationId: 'org-nesoir',
    eventType: 'competition',
    category: 'Coding',
    subCategory: 'Competitive programming',
    location: 'Online',
    district: 'Online',
    province: 'Nationwide',
    format: 'online',
    startDatetime: '2026-09-26T10:00:00+05:45',
    endDatetime: '2026-09-26T16:00:00+05:45',
    registrationDeadline: '2026-09-22',
    registrationUrl: 'https://nepalsoftware.org.np/championship/register',
    registrationUrlType: 'official',
    contactInformation: 'championship@nepalsoftware.org.np',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
      allowedPrograms: ['Any discipline'],
    },
    participation: 'individual',
    registrationFee: 0,
    prizeInformation: 'NPR 25,000 pool + laptops for top 3',
    certificateAvailable: true,
    skills: ['Data structures', 'Algorithms', 'Problem solving'],
    benefits: ['prize', 'certificate', 'exposure', 'portfolio_project'],
    sourceUrl: 'https://nepalsoftware.org.np/championship',
    sourceType: 'official_website',
    verificationStatus: 'cross_checked',
    safetyFlags: [],
    lastVerified: '2026-08-14',
    status: 'registration_open',
  },
  {
    id: 'evt-robotics-challenge-2026',
    title: 'National Robotics Challenge',
    description:
      'Teams design, build and pilot autonomous robots across line-following and rescue-track categories. Hardware kits provided on site.',
    organizationId: 'org-robotics-np',
    eventType: 'competition',
    category: 'Robotics',
    subCategory: 'Engineering competition',
    location: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati',
    venue: 'Nepal Engineering College Exhibition Hall',
    format: 'physical',
    startDatetime: '2026-11-07T09:00:00+05:45',
    endDatetime: '2026-11-08T17:00:00+05:45',
    registrationDeadline: '2026-10-25',
    registrationUrl: 'https://nepalrobotics.org/challenge/register',
    registrationUrlType: 'official',
    contactInformation: 'info@nepalrobotics.org',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors'],
      eligibilityNotes: 'Beginner-friendly division available for first-time participants.',
    },
    participation: 'team',
    teamSizeMin: 3,
    teamSizeMax: 5,
    registrationFee: 2500,
    prizeInformation: 'NPR 75,000 + robotics kits',
    certificateAvailable: true,
    skills: ['Electronics', 'Embedded programming', 'Mechanical design', 'Teamwork'],
    benefits: ['prize', 'certificate', 'training', 'portfolio_project', 'exposure'],
    sourceUrl: 'https://nepalrobotics.org/challenge',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-06',
    status: 'upcoming',
  },
  {
    id: 'evt-intercollege-quiz-2026',
    title: 'Inter-College Quiz Cup',
    description:
      'General knowledge, science and current-affairs quiz for college teams. Rapid-fire finals are held on stage.',
    organizationId: 'org-debate-society',
    eventType: 'competition',
    category: 'Quiz',
    location: 'Bhaktapur',
    district: 'Bhaktapur',
    province: 'Bagmati',
    venue: 'Bhaktapur Multiple Campus Hall',
    format: 'physical',
    startDatetime: '2026-09-19T11:00:00+05:45',
    endDatetime: '2026-09-19T16:00:00+05:45',
    registrationDeadline: '2026-09-12',
    registrationUrl: 'https://ktmdebate.org.np/quizcup',
    registrationUrlType: 'official',
    contactInformation: 'quiz@ktmdebate.org.np',
    eligibility: {
      educationLevels: ['plus_two', 'bachelors'],
    },
    participation: 'team',
    teamSizeMin: 2,
    teamSizeMax: 2,
    registrationFee: 0,
    prizeInformation: 'NPR 20,000 + trophy',
    certificateAvailable: true,
    skills: ['General knowledge', 'Current affairs', 'Quick recall'],
    benefits: ['prize', 'certificate', 'exposure'],
    sourceUrl: 'https://ktmdebate.org.np/quizcup',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-09',
    status: 'registration_open',
  },
  {
    id: 'evt-open-debate-2026',
    title: 'Kathmandu Open Debate Tournament',
    description:
      'Three-round parliamentary debate tournament open to individual speakers. Motions released 15 minutes before each round; adjudicator training included.',
    organizationId: 'org-debate-society',
    eventType: 'competition',
    category: 'Debate',
    subCategory: 'Public speaking',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Ratna Rajya Campus Auditorium',
    format: 'physical',
    startDatetime: '2026-10-10T09:30:00+05:45',
    endDatetime: '2026-10-11T17:30:00+05:45',
    registrationDeadline: '2026-09-30',
    registrationUrl: 'https://ktmdebate.org.np/opendebate',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
    },
    participation: 'individual',
    registrationFee: 500,
    prizeInformation: 'Best speaker NPR 15,000',
    certificateAvailable: true,
    skills: ['Argumentation', 'Public speaking', 'Critical thinking'],
    benefits: ['prize', 'certificate', 'training', 'exposure'],
    sourceUrl: 'https://ktmdebate.org.np/opendebate',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-11',
    status: 'registration_open',
  },
  {
    id: 'evt-himalayan-mun-2026',
    title: 'Himalayan Model United Nations 2026',
    description:
      'Two-day MUN conference with six committees debating climate policy, digital rights and regional security. Best delegates receive gavels and diplomatic visit invitations.',
    organizationId: 'org-mun-society',
    eventType: 'conference',
    category: 'Model United Nations',
    subCategory: 'Diplomacy simulation',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Hotel Ananya, Thamel',
    format: 'physical',
    startDatetime: '2026-10-24T09:00:00+05:45',
    endDatetime: '2026-10-25T18:00:00+05:45',
    registrationDeadline: '2026-10-05',
    registrationUrl: 'https://himalayanmun.org/apply',
    registrationUrlType: 'external',
    officialEventUrl: 'https://himalayanmun.org/hmun-2026',
    contactInformation: 'secretariat@himalayanmun.org',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
      minimumAge: 15,
    },
    participation: 'individual',
    registrationFee: 1500,
    certificateAvailable: true,
    skills: ['Negotiation', 'Public speaking', 'International relations', 'Research'],
    benefits: ['certificate', 'networking', 'exposure', 'training'],
    sourceUrl: 'https://himalayanmun.org/hmun-2026',
    sourceType: 'official_website',
    verificationStatus: 'cross_checked',
    safetyFlags: [],
    lastVerified: '2026-08-13',
    status: 'registration_open',
  },
  {
    id: 'evt-python-workshop-sep-2026',
    title: 'Python for Beginners — Free Weekend Workshop',
    description:
      'Two-day hands-on introduction to Python covering variables, loops, functions and a mini project. Designed for students with zero programming background.',
    organizationId: 'org-pokhara-devs',
    eventType: 'workshop',
    category: 'Programming',
    subCategory: 'Beginner training',
    location: 'Online',
    district: 'Online',
    province: 'Nationwide',
    format: 'online',
    startDatetime: '2026-09-05T10:00:00+05:45',
    endDatetime: '2026-09-06T16:00:00+05:45',
    registrationDeadline: '2026-09-03',
    registrationUrl: 'https://pokharadevs.org/python-beginners',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
      minimumAge: 13,
    },
    participation: 'individual',
    registrationFee: 0,
    certificateAvailable: true,
    skills: ['Python', 'Programming fundamentals'],
    benefits: ['certificate', 'training', 'portfolio_project'],
    sourceUrl: 'https://pokharadevs.org/python-beginners',
    sourceType: 'official_website',
    verificationStatus: 'verified_event',
    safetyFlags: [],
    lastVerified: '2026-08-17',
    status: 'registration_open',
  },
  {
    id: 'evt-webdev-bootcamp-2026',
    title: 'Web Development Bootcamp Pokhara',
    description:
      'Intensive five-day bootcamp covering HTML, CSS, JavaScript and React. Students ship a deployed portfolio site by the final day.',
    organizationId: 'org-pokhara-devs',
    eventType: 'bootcamp',
    category: 'Web development',
    subCategory: 'Training',
    location: 'Pokhara',
    district: 'Kaski',
    province: 'Gandaki',
    venue: 'Pokhara Engineering College Lab Block',
    format: 'hybrid',
    startDatetime: '2026-12-07T09:00:00+05:45',
    endDatetime: '2026-12-11T17:00:00+05:45',
    registrationDeadline: '2026-11-28',
    registrationUrl: 'https://pokharadevs.org/bootcamp/register',
    registrationUrlType: 'official',
    contactInformation: 'bootcamp@pokharadevs.org',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors'],
    },
    participation: 'individual',
    registrationFee: 3000,
    certificateAvailable: true,
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Git'],
    benefits: ['certificate', 'training', 'mentorship', 'portfolio_project'],
    sourceUrl: 'https://pokharadevs.org/bootcamp',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-15',
    status: 'upcoming',
  },
  {
    id: 'evt-career-fair-2026',
    title: 'Kathmandu Student Career Fair',
    description:
      'Meet 40+ Nepali employers and training providers, drop your CV, and join on-the-spot internship interviews targeted at students and fresh graduates.',
    organizationId: 'org-careerbridge',
    eventType: 'career_event',
    category: 'Career fair',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Everest Hotel, New Baneshwor',
    format: 'physical',
    startDatetime: '2026-09-18T10:00:00+05:45',
    endDatetime: '2026-09-18T17:00:00+05:45',
    registrationDeadline: '2026-09-16',
    registrationUrl: 'https://careerbridge.com.np/careerfair/register',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['plus_two', 'bachelors', 'masters', 'recent_graduate'],
    },
    participation: 'individual',
    registrationFee: 0,
    certificateAvailable: false,
    skills: ['CV writing', 'Interviewing', 'Networking'],
    benefits: ['internship_opportunity', 'networking', 'exposure'],
    sourceUrl: 'https://careerbridge.com.np/careerfair',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-16',
    status: 'registration_open',
  },
  {
    id: 'evt-community-drive-2026',
    title: 'Bagmati River Clean-up & Awareness Drive',
    description:
      'Half-day community volunteering: river-bank clean-up followed by a waste-management awareness session for local schools. Gloves and bags provided.',
    organizationId: 'org-leo-youth',
    eventType: 'volunteering',
    category: 'Volunteering',
    subCategory: 'Community project',
    location: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati',
    venue: 'Jhamsikhel riverside stretch',
    format: 'physical',
    startDatetime: '2026-09-12T07:00:00+05:45',
    endDatetime: '2026-09-12T13:00:00+05:45',
    registrationDeadline: '2026-09-09',
    registrationUrl: 'https://leoktmcentral.org.np/volunteer',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
      minimumAge: 13,
    },
    participation: 'individual',
    registrationFee: 0,
    certificateAvailable: true,
    skills: ['Teamwork', 'Community service'],
    benefits: ['certificate', 'networking', 'exposure'],
    sourceUrl: 'https://leoktmcentral.org.np/volunteer',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-08',
    status: 'registration_open',
  },
  {
    id: 'evt-science-fair-2026',
    title: 'National Science Fair 2026',
    description:
      'School and college teams exhibit original science projects to judges and the public. Categories: physics, chemistry, biology and applied technology.',
    organizationId: 'org-science-fdn',
    eventType: 'competition',
    category: 'Science',
    subCategory: 'Science fair',
    location: 'Bhaktapur',
    district: 'Bhaktapur',
    province: 'Bagmati',
    venue: 'Bhaktapur Science Campus Grounds',
    format: 'physical',
    startDatetime: '2026-11-21T09:00:00+05:45',
    endDatetime: '2026-11-22T16:00:00+05:45',
    registrationDeadline: '2026-11-05',
    registrationUrl: 'https://nepalscience.org.np/fair/register',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors'],
    },
    participation: 'team',
    teamSizeMin: 1,
    teamSizeMax: 4,
    registrationFee: 800,
    prizeInformation: 'Category prizes up to NPR 30,000',
    certificateAvailable: true,
    skills: ['Scientific method', 'Experiment design', 'Presentation'],
    benefits: ['prize', 'certificate', 'exposure', 'mentorship'],
    sourceUrl: 'https://nepalscience.org.np/fair',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-04',
    status: 'upcoming',
  },
  {
    id: 'evt-art-design-contest-2026',
    title: 'Street Art & Digital Design Contest',
    description:
      'Open-call art competition across mural sketching and digital illustration tracks. Selected works exhibited at a Patan gallery night.',
    organizationId: 'org-kala-collective',
    eventType: 'competition',
    category: 'Art/Design',
    subCategory: 'Visual arts',
    location: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati',
    venue: 'Patan Durbar Square vicinity',
    format: 'physical',
    startDatetime: '2026-10-17T10:00:00+05:45',
    endDatetime: '2026-10-18T18:00:00+05:45',
    registrationDeadline: '2026-10-08',
    registrationUrl: 'https://forms.gle/kala-collective-entry',
    registrationUrlType: 'google_form',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters'],
      maximumAge: 30,
    },
    participation: 'individual',
    registrationFee: null,
    prizeInformation: 'Exhibition slot + art supplies hamper',
    certificateAvailable: true,
    skills: ['Illustration', 'Painting', 'Digital design'],
    benefits: ['prize', 'certificate', 'exposure', 'portfolio_project'],
    sourceUrl: 'https://instagram.com/kalacollective',
    sourceType: 'social_media',
    verificationStatus: 'unverified',
    safetyFlags: [
      'Organizer not independently verified.',
      'Registration link does not belong to the organizer.',
      'Fee information unclear.',
    ],
    lastVerified: '2026-08-19',
    status: 'registration_open',
  },
  {
    id: 'evt-informatics-olympiad-2026',
    title: 'Nepal Informatics Olympiad 2026',
    description:
      'National olympiad in algorithms and problem solving. High scorers advance to national camp and international selection rounds.',
    organizationId: 'org-science-fdn',
    eventType: 'competition',
    category: 'Olympiad',
    subCategory: 'Informatics',
    location: 'Online + regional centers',
    district: 'Online',
    province: 'Nationwide',
    format: 'online',
    startDatetime: '2026-10-31T10:00:00+05:45',
    endDatetime: '2026-10-31T14:30:00+05:45',
    registrationDeadline: '2026-10-20',
    registrationUrl: 'https://nepalscience.org.np/olympiad/register',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see', 'plus_two'],
      maximumAge: 20,
    },
    participation: 'individual',
    registrationFee: 0,
    prizeInformation: 'Medals + national camp invitation',
    certificateAvailable: true,
    skills: ['Algorithms', 'C++/Java', 'Problem solving'],
    benefits: ['prize', 'certificate', 'training', 'exposure'],
    sourceUrl: 'https://nepalscience.org.np/olympiad',
    sourceType: 'official_website',
    verificationStatus: 'cross_checked',
    safetyFlags: [],
    lastVerified: '2026-08-10',
    status: 'upcoming',
  },
  {
    id: 'evt-essay-writing-2026',
    title: 'National Essay Writing Competition',
    description:
      'Essay contest on "Technology and the Future of Education in Nepal." Submissions judged blind by university faculty; winners published in a national journal.',
    organizationId: 'org-nesoir',
    eventType: 'competition',
    category: 'Writing',
    location: 'Online',
    district: 'Online',
    province: 'Nationwide',
    format: 'online',
    startDatetime: '2026-09-27T00:00:00+05:45',
    endDatetime: '2026-10-04T23:59:00+05:45',
    registrationDeadline: '2026-09-25',
    registrationUrl: 'https://nepalsoftware.org.np/essay/submit',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors', 'masters'],
    },
    participation: 'individual',
    registrationFee: 0,
    prizeInformation: 'NPR 10,000 + publication',
    certificateAvailable: true,
    skills: ['Writing', 'Research', 'Critical thinking'],
    benefits: ['prize', 'certificate', 'exposure', 'portfolio_project'],
    sourceUrl: 'https://nepalsoftware.org.np/essay',
    sourceType: 'official_website',
    verificationStatus: 'verified_event',
    safetyFlags: [],
    lastVerified: '2026-08-13',
    status: 'registration_open',
  },
  {
    id: 'evt-ai-seminar-2026',
    title: 'AI & the Future of Work — Public Seminar',
    description:
      'Evening seminar with panel discussion on how AI will change careers in Nepal. Q&A session and networking over refreshments afterwards.',
    organizationId: 'org-careerbridge',
    eventType: 'seminar',
    category: 'AI/ML',
    subCategory: 'Seminar',
    location: 'Online',
    district: 'Online',
    province: 'Nationwide',
    format: 'online',
    startDatetime: '2026-09-11T17:00:00+05:45',
    endDatetime: '2026-09-11T19:30:00+05:45',
    registrationDeadline: '2026-09-10',
    registrationUrl: 'https://careerbridge.com.np/seminar/ai-future',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors', 'masters', 'recent_graduate'],
    },
    participation: 'individual',
    registrationFee: 0,
    certificateAvailable: false,
    skills: ['AI literacy', 'Career planning'],
    benefits: ['networking', 'exposure', 'training'],
    sourceUrl: 'https://careerbridge.com.np/seminar/ai-future',
    sourceType: 'official_website',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-17',
    status: 'registration_open',
  },
  {
    id: 'evt-founders-night-2026',
    title: 'Founders & Students Networking Night',
    description:
      'Casual networking evening connecting students with startup founders. Structured speed-networking rounds followed by open mingling.',
    organizationId: 'org-startup-np',
    eventType: 'networking',
    category: 'Networking',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Work Around co-working, Baluwatar',
    format: 'physical',
    startDatetime: '2026-10-02T17:30:00+05:45',
    endDatetime: '2026-10-02T20:30:00+05:45',
    registrationDeadline: '2026-09-29',
    registrationUrl: 'https://startupnepal.net/networking-night',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['plus_two', 'bachelors', 'masters', 'recent_graduate'],
    },
    participation: 'individual',
    registrationFee: 200,
    certificateAvailable: false,
    skills: ['Networking', 'Communication'],
    benefits: ['networking', 'mentorship', 'internship_opportunity', 'exposure'],
    sourceUrl: 'https://startupnepal.net/networking-night',
    sourceType: 'official_website',
    verificationStatus: 'verified_event',
    safetyFlags: [],
    lastVerified: '2026-08-14',
    status: 'registration_open',
  },
  {
    id: 'evt-interschool-football-2026',
    title: 'Inter-School Football Cup',
    description:
      'District-level football tournament for school teams. Knockout format with a plate bracket so every team plays at least twice.',
    organizationId: 'org-leo-youth',
    eventType: 'competition',
    category: 'Sports',
    subCategory: 'Football',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Chyasal Ground',
    format: 'physical',
    startDatetime: '2026-12-19T08:00:00+05:45',
    endDatetime: '2026-12-21T17:00:00+05:45',
    registrationDeadline: '2026-12-01',
    registrationUrl: 'https://leoktmcentral.org.np/footballcup',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['school', 'see'],
      maximumAge: 19,
    },
    participation: 'team',
    teamSizeMin: 11,
    teamSizeMax: 16,
    registrationFee: 1500,
    prizeInformation: 'Champions NPR 40,000 + trophy',
    certificateAvailable: true,
    skills: ['Football', 'Teamwork', 'Fitness'],
    benefits: ['prize', 'certificate', 'exposure'],
    sourceUrl: 'https://leoktmcentral.org.np/footballcup',
    sourceType: 'official_facebook_page',
    verificationStatus: 'verified_organizer',
    safetyFlags: [],
    lastVerified: '2026-08-02',
    status: 'upcoming',
  },
  {
    id: 'evt-mega-youth-fest-2026',
    title: 'Mega Youth Fest — Multiple Competitions',
    description:
      'Announced festival claiming hackathon, dance and quiz competitions with large cash prizes. Details are sparse and the organizer could not be reached through any official channel.',
    organizationId: 'org-youthfest-org',
    eventType: 'other',
    category: 'Youth festival',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Not confirmed',
    format: 'unknown',
    startDatetime: '2026-10-10T09:00:00+05:45',
    endDatetime: '2026-10-12T18:00:00+05:45',
    registrationDeadline: '2026-09-28',
    registrationUrl: 'https://forms.gle/megayouthfest-register',
    registrationUrlType: 'google_form',
    eligibility: {
      educationLevels: ['see', 'plus_two', 'bachelors'],
      eligibilityNotes: 'Eligibility rules not clearly published.',
    },
    participation: 'unknown',
    registrationFee: null,
    prizeInformation: undefined,
    certificateAvailable: false,
    skills: [],
    benefits: [],
    sourceUrl: 'https://facebook.com/megayouthfest',
    sourceType: 'repost',
    verificationStatus: 'unverified',
    safetyFlags: [
      'Organizer not independently verified.',
      'Registration link does not belong to the organizer.',
      'Fee information unclear.',
      'Event date could not be confirmed.',
      'Source is only a repost.',
    ],
    lastVerified: '2026-08-20',
    status: 'unknown',
  },
  {
    id: 'evt-spring-hackathon-2026',
    title: 'Spring Code Sprint 2026',
    description:
      'Weekend spring coding sprint hosted earlier this year. Kept as an example of a completed event for freshness handling.',
    organizationId: 'org-kucc',
    eventType: 'hackathon',
    category: 'Coding',
    location: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati',
    venue: 'Kathmandu University, Dhulikhel',
    format: 'physical',
    startDatetime: '2026-04-18T09:00:00+05:45',
    endDatetime: '2026-04-19T17:00:00+05:45',
    registrationDeadline: '2026-04-05',
    registrationUrl: 'https://ku.edu.np/sprint',
    registrationUrlType: 'official',
    eligibility: {
      educationLevels: ['plus_two', 'bachelors'],
    },
    participation: 'team',
    teamSizeMin: 2,
    teamSizeMax: 4,
    registrationFee: 0,
    prizeInformation: 'NPR 60,000',
    certificateAvailable: true,
    skills: ['Programming', 'Teamwork'],
    benefits: ['prize', 'certificate'],
    sourceUrl: 'https://ku.edu.np/sprint',
    sourceType: 'official_website',
    verificationStatus: 'expired',
    safetyFlags: [],
    lastVerified: '2026-04-20',
    status: 'completed',
  },
]

// ---------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------

export function getAllEvents(): Event[] {
  return EVENTS
}

export function getEventById(id: string): Event | undefined {
  return EVENTS.find((e) => e.id === id)
}

export function getOrganizationById(id: string): Organization | undefined {
  return ORGANIZATIONS.find((o) => o.id === id)
}

export function getAllOrganizations(): Organization[] {
  return ORGANIZATIONS
}

const TODAY = () => new Date().toISOString().slice(0, 10)

/**
 * Freshness handling (MD §"Event Freshness"):
 * old events automatically move out of active discovery.
 */
export function getEffectiveStatus(event: Event): EventStatus {
  const today = TODAY()
  if (
    event.status === 'completed' ||
    event.status === 'cancelled' ||
    event.status === 'ongoing'
  ) {
    return event.status
  }
  if (event.registrationDeadline < today && event.startDatetime.slice(0, 10) < today) {
    return 'registration_closed'
  }
  return event.status
}

export function isActiveForDiscovery(event: Event): boolean {
  const status = getEffectiveStatus(event)
  return status !== 'completed' && status !== 'cancelled'
}

export function isRegistrationOpen(event: Event): boolean {
  return getEffectiveStatus(event) === 'registration_open' || getEffectiveStatus(event) === 'upcoming'
}

/** Sorted upcoming events for preview surfaces (survey incentive section). */
export function getUpcomingEvents(limit?: number): Event[] {
  const list = EVENTS.filter(isActiveForDiscovery).sort(
    (a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline)
  )
  return limit ? list.slice(0, limit) : list
}

export interface EventFilters {
  q?: string
  eventType?: string
  district?: string
  format?: string
  freeOnly?: boolean
  educationLevel?: string
  teamOnly?: boolean
  verifiedOnly?: boolean
  openOnly?: boolean
}

export function filterEvents(filters: EventFilters): Event[] {
  let list = EVENTS.filter(isActiveForDiscovery)

  if (filters.q) {
    const q = filters.q.toLowerCase()
    list = list.filter((e) =>
      [e.title, e.description, e.category, e.location, e.skills.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }
  if (filters.eventType) {
    list = list.filter((e) => e.eventType === filters.eventType)
  }
  if (filters.district) {
    list = list.filter((e) => e.district === filters.district || e.format === 'online')
  }
  if (filters.format) {
    list = list.filter((e) => e.format === filters.format)
  }
  if (filters.freeOnly) {
    list = list.filter((e) => e.registrationFee === 0)
  }
  if (filters.educationLevel) {
    list = list.filter((e) =>
      e.eligibility.educationLevels.includes(filters.educationLevel as never)
    )
  }
  if (filters.teamOnly) {
    list = list.filter((e) => e.participation === 'team' || e.participation === 'both')
  }
  if (filters.verifiedOnly) {
    list = list.filter((e) => e.verificationStatus !== 'unverified')
  }

  return list.sort((a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline))
}

// ---------------------------------------------------------------
// Deterministic, explainable student matching (MD §"Student Matching"
// and §"Matching Should Be Explainable")
// ---------------------------------------------------------------

const EDUCATION_ORDER = ['school', 'see', 'plus_two', 'bachelors', 'masters', 'recent_graduate']

function educationCompatible(event: Event, profile: StudentEventProfile): boolean {
  return event.eligibility.educationLevels.includes(profile.educationLevel)
}

function interestMatches(event: Event, interests: string[]): boolean {
  if (interests.length === 0) return false
  const haystack = [
    event.title,
    event.category,
    event.subCategory ?? '',
    event.eventType,
    event.skills.join(' '),
  ]
    .join(' ')
    .toLowerCase()
  return interests.some((i) => haystack.includes(i.toLowerCase()))
}

export function computeMatch(event: Event, profile: StudentEventProfile): MatchResult {
  const reasons: MatchReason[] = []

  // Education eligibility
  const eduOk = educationCompatible(event, profile)
  reasons.push({
    ok: eduOk,
    text: eduOk
      ? 'Your education level is eligible'
      : 'Your education level may not be eligible',
  })

  // Interest relevance
  let interestOk = true
  let interestText = 'Set your interests to see personalized relevance'
  let interestPoints = 12 // neutral partial credit when no interests provided
  if (profile.interests.length > 0) {
    interestOk = interestMatches(event, profile.interests)
    interestPoints = interestOk ? 24 : 0
    interestText = interestOk
      ? `Matches your ${event.category} interest`
      : 'Outside your listed interests'
  }
  reasons.push({ ok: interestOk, text: interestText })

  // Location
  const locationOk =
    profile.location === '' ||
    event.format === 'online' ||
    event.format === 'hybrid' ||
    event.district.toLowerCase() === profile.location.toLowerCase()
  reasons.push({
    ok: locationOk,
    text:
      profile.location === ''
        ? 'Location: any district works'
        : event.format === 'online'
          ? 'Online — accessible from anywhere'
          : locationOk
            ? `Located in ${event.district}`
            : `Different location (${event.location})`,
  })

  // Cost vs free preference
  const costOk = profile.preferFree ? event.registrationFee === 0 : true
  let costText: string
  if (event.registrationFee === null) {
    costText = 'Fee information unclear'
  } else if (event.registrationFee === 0) {
    costText = 'Free entry'
  } else {
    costText = `Paid entry (NPR ${event.registrationFee.toLocaleString('en-US')})`
  }
  reasons.push({ ok: costOk, text: costText })

  // Format preference (online/offline)
  const formatOk = profile.preferOnline
    ? event.format === 'online' || event.format === 'hybrid'
    : true
  reasons.push({
    ok: formatOk,
    text: formatOk
      ? event.format === 'online'
        ? 'Fully online — fits your preference'
        : event.format === 'hybrid'
          ? 'Hybrid attendance possible'
          : 'In-person event'
      : 'Requires in-person attendance',
  })

  // Team vs individual
  const teamEvent = event.participation === 'team' || event.participation === 'both'
  const teamOk =
    event.participation === 'unknown'
      ? false
      : profile.preferTeam
        ? teamEvent
        : event.participation !== 'team'
  reasons.push({
    ok: teamOk,
    text: teamOk
      ? event.teamSizeMin
        ? `Team size ${event.teamSizeMin}–${event.teamSizeMax} works`
        : event.participation === 'individual'
          ? 'Individual entry — no team needed'
          : 'Participation mode flexible'
      : event.participation === 'unknown'
        ? 'Participation mode unknown'
        : profile.preferTeam && !teamEvent
          ? 'Individual-only event'
          : 'Team required',
  })

  // Deadline pressure
  const open = isRegistrationOpen(event)
  reasons.push({
    ok: open,
    text: open
      ? `Registration closes ${new Date(event.registrationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
      : 'Registration window has passed',
  })

  // Weighted deterministic score
  let score = 0
  score += eduOk ? 24 : 0
  score += interestPoints
  score += locationOk ? 14 : 0
  score += costOk ? 14 : 0
  score += formatOk ? 5 : 0
  score += teamOk ? 12 : 0
  score += open ? 7 : 0

  // Hard eligibility gate: ineligible students should never see high scores
  if (!eduOk) score = Math.min(score, 38)

  return { score, reasons }
}
