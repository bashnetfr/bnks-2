import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Ed-Vantage privacy policy — how we collect, store, and protect student survey data and school assessment data.',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '8px' }}>Privacy Policy</h1>
        <p className="meta-text">
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="body-text" style={{ marginTop: '12px' }}>
          Ed-Vantage collects real student data and school data. This policy is specific
          to what we collect — not generic boilerplate. If you are an NGO or municipality
          evaluating this platform for adoption, read this in full.
        </p>
      </div>

      {[
        {
          heading: 'Who operates this platform',
          body: `Ed-Vantage is a decision-intelligence platform currently in pilot phase. It is not operated by a government ministry. Data collected during the pilot is used only to produce readiness assessments and to improve the platform.`,
        },
        {
          heading: 'What data we collect',
          body: `We collect two categories of data:

1. School assessment data — entered by school administrators or NGO program officers. This includes school name, location, district, school type, student and teacher count, and responses to the four-dimension readiness assessment (Infrastructure, Teacher Readiness, School Management, Learning Requirements).

2. Student survey data — self-reported by students. This includes: device ownership, internet access type, average daily screen time, learning preferences, digital confidence (1–5 scale), whether the student has a quiet study space, and access limitations (e.g., cost, parental restriction, no device). We also record the authentication method used (school email or school code) and whether the survey was completed on a shared device.`,
        },
        {
          heading: 'What data we do NOT collect',
          body: `We do not collect student names, personal email addresses (school email is used for authentication only and is not linked to individual survey answers), photographs, identification numbers, or any biometric data.`,
        },
        {
          heading: 'How student data is stored and accessed',
          body: `Student survey responses are stored at the school level, not the individual student level. No member of teaching staff can access individual student answers. Teacher-facing views show only aggregate completion counts ("18 of 24 students have submitted") — never individual responses.

Students are informed of this explicitly before they begin the survey: "Your teacher won't see your individual answers. Only combined school-level results are shared with the school."`,
        },
        {
          heading: 'How assessment data is used',
          body: `School assessment data and aggregated student survey data are used by the Ed-Vantage compatibility engine to compute a readiness score. The AI explanation layer receives only the already-computed score — not raw survey data — to generate plain-language explanations. No raw student data is sent to any AI API.`,
        },
        {
          heading: 'Data retention',
          body: `Data is retained for the duration of the pilot engagement. At the end of a pilot, the organization that ran the assessment may request export and/or deletion of their school and student data. We will fulfil deletion requests within 30 days.`,
        },
        {
          heading: 'Third-party services',
          body: `We use Supabase for data storage and authentication (servers located in the EU/US). We use the NVIDIA NIM API for AI explanation generation — we pass only the computed compatibility result (numbers and text flags), not any raw student data, to this API.`,
        },
        {
          heading: 'Children\'s data',
          body: `Many students completing the survey will be under 18. We collect only the minimum data needed for the readiness assessment. Survey responses are not associated with student names or personal identifiers. School administrators are responsible for obtaining appropriate parental consent before deploying the survey in their school context.`,
        },
        {
          heading: 'Your rights',
          body: `Organizations participating in a pilot may request access to, export of, or deletion of their school and student data at any time. Contact us directly to make such a request.`,
        },
        {
          heading: 'Questions',
          body: `If you have questions about this policy, contact the Ed-Vantage team directly. This is a pilot-stage product — we are reachable and will respond.`,
        },
      ].map((section) => (
        <section key={section.heading} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>{section.heading}</h2>
          {section.body.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="body-text"
              style={{ lineHeight: 1.8, marginBottom: '10px' }}
            >
              {para}
            </p>
          ))}
        </section>
      ))}

      <div className="divider" />
      <p className="meta-text">
        <Link href="/" style={{ color: 'var(--primary)' }}>Back to home</Link>
        {' · '}
        <Link href="/#faq" style={{ color: 'var(--primary)' }}>FAQ</Link>
        {' · '}
        <Link href="/pricing" style={{ color: 'var(--primary)' }}>Pricing</Link>
      </p>
    </div>
  )
}
