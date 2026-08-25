// ================================================================
// EduFit Nepal ΓÇö Curated Resource Hub Content
//
// docs/RESOURCE_HUB_BUILD_PROMPT.md: hand-curated real content.
// API-first so future apps can integrate via GET /api/resources.
// No submission/approval workflow for MVP.
// ================================================================

import type { Resource } from './types'

export const CURATED_RESOURCES: Resource[] = [
  // --- Scholarships ---
  {
    id: 'sch-eoi-01',
    title: 'EOI Nepal Government Scholarship',
    description:
      'Government of Nepal merit-based scholarship program for students in public schools. Covers tuition and living allowance for higher secondary and university level.',
    type: 'scholarship',
    url: 'https://moest.gov.np/',
    eligibility: 'Nepali students in public schools, Grade 10 passed, merit-based',
    deadline: '2026-10-31',
    provider: 'Ministry of Education, Science and Technology (MoEST), Nepal',
    isFree: true,
    language: 'nepali',
  },
  {
    id: 'sch-adb-02',
    title: 'ADB-JSP Scholarship',
    description:
      'Asian Development Bank ΓÇö Japan Scholarship Program for postgraduate study at designated Asian universities, with strong engineering and development focus.',
    type: 'scholarship',
    url: 'https://www.adb.org/work-with-us/careers/japan-scholarship-program',
    eligibility: 'Nepali citizens, bachelor\'s degree completed, under 35 years old',
    deadline: '2026-12-15',
    provider: 'Asian Development Bank',
    isFree: true,
    language: 'english',
  },
  {
    id: 'sch-brit-03',
    title: 'British Council GREAT Scholarship',
    description:
      'Full funding for postgraduate study in the UK. Nepal is an eligible country. Covers tuition + living costs for one year at a UK university.',
    type: 'scholarship',
    url: 'https://www.britishcouncil.org.np/programmes/education/study-uk/scholarships',
    eligibility: 'Nepali students, undergraduate completed, English proficiency required',
    provider: 'British Council Nepal',
    isFree: true,
    language: 'english',
  },

  // --- Competitions ---
  {
    id: 'comp-ktm-hack-01',
    title: 'Kathmandu University Innovation Hackathon',
    description:
      'Annual 48-hour hackathon hosted by Kathmandu University open to high school and university students. Focus areas rotate: EdTech, health, agriculture.',
    type: 'competition',
    url: 'https://ku.edu.np/',
    eligibility: 'Students grades 9ΓÇô12 and university, teams of 2ΓÇô4',
    deadline: '2026-11-01',
    provider: 'Kathmandu University',
    isFree: true,
    language: 'both',
  },
  {
    id: 'comp-nmo-01',
    title: 'Nepal Mathematical Olympiad (NMO)',
    description:
      'Annual national mathematics competition. Top performers represent Nepal at the International Mathematical Olympiad (IMO). Prestigious for university applications.',
    type: 'competition',
    url: 'https://www.nmo.edu.np/',
    eligibility: 'Students up to Grade 12, Nepali citizens',
    deadline: '2026-09-30',
    provider: 'Nepal Mathematics Board',
    isFree: true,
    language: 'nepali',
  },
  {
    id: 'comp-youth-code-01',
    title: 'Youth Code Nepal',
    description:
      'National coding competition for school students. Categories: web development, mobile apps, and AI/ML. Prizes include laptops and mentorship from tech companies.',
    type: 'competition',
    url: 'https://youthcodenepal.org/',
    eligibility: 'Students grades 8ΓÇô12 across Nepal, individual or team',
    deadline: '2026-10-15',
    provider: 'Digital Nepal Foundation',
    isFree: true,
    language: 'both',
  },

  // --- Learning Resources ---
  {
    id: 'learn-khan-01',
    title: 'Khan Academy ΓÇö Free Math & Science',
    description:
      'World-class free education platform with full curriculum coverage from Grade 1 through university. Available offline via app. Aligned with many national curricula.',
    type: 'learning_resource',
    url: 'https://www.khanacademy.org/',
    eligibility: 'All students, free registration',
    provider: 'Khan Academy (non-profit)',
    isFree: true,
    language: 'english',
  },
  {
    id: 'learn-olenepal-01',
    title: 'OLE Nepal Digital Library',
    description:
      'Nepal-specific digital learning materials aligned with the national curriculum. Available in Nepali. Optimised for low-bandwidth environments and offline use.',
    type: 'learning_resource',
    url: 'https://www.olenepal.org/',
    eligibility: 'Students grades 1ΓÇô10, schools and teachers',
    provider: 'Open Learning Exchange Nepal (OLE Nepal)',
    isFree: true,
    language: 'nepali',
  },
  {
    id: 'learn-coursera-01',
    title: 'Coursera Financial Aid ΓÇö Free Certificates',
    description:
      'Apply for financial aid to access any Coursera course for free, including certificates from top universities. Strong CS, data science, and business offerings.',
    type: 'learning_resource',
    url: 'https://www.coursera.org/financial-aid',
    eligibility: 'Students 18+, financial aid application required',
    provider: 'Coursera',
    isFree: true,
    language: 'english',
  },

  // --- Digital Materials ---
  {
    id: 'dm-ncert-01',
    title: 'NCERT Free Textbooks (Nepal-compatible)',
    description:
      'Free PDF textbooks from India\'s NCERT covering science, mathematics and social studies. Widely used as supplementary material in Nepal given curriculum overlap.',
    type: 'digital_material',
    url: 'https://ncert.nic.in/textbook.php',
    eligibility: 'All students and teachers, public domain',
    provider: 'NCERT (India)',
    isFree: true,
    language: 'english',
  },
  {
    id: 'dm-cdc-01',
    title: 'Curriculum Development Centre ΓÇö E-Resources',
    description:
      'Official digital learning materials produced by Nepal\'s CDC aligned with the national curriculum. Includes teacher guides, student workbooks, and assessment tools.',
    type: 'digital_material',
    url: 'https://www.moecdc.gov.np/',
    eligibility: 'Schools and students across Nepal',
    provider: 'Curriculum Development Centre (CDC), Nepal',
    isFree: true,
    language: 'nepali',
  },
]

/**
 * Return all resources, optionally filtered by type or school ID.
 * School-level filtering is a stub for future integration.
 */
export function getResources(params?: {
  type?: string
  schoolId?: string
}): Resource[] {
  let resources = CURATED_RESOURCES
  if (params?.type) {
    resources = resources.filter((r) => r.type === params.type)
  }
  // schoolId filtering would apply eligibility rules once we have tool profiles per school
  return resources
}
