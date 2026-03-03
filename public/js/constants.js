/* =============================================
   CONSTANTS — never mutated after declaration
   ============================================= */

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];
const LEVEL_NAMES      = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

const ACHIEVEMENTS_CONFIG = {
  firstTask: { name: 'First Task',   emoji: '🎯', desc: 'Complete your first task' },
  streak3:   { name: '3-Day Streak', emoji: '🔥', desc: 'Study 3 days in a row' },
  streak7:   { name: 'Week Warrior', emoji: '⚡', desc: 'Study 7 days in a row' },
  level5:    { name: 'Graduate',     emoji: '🎓', desc: 'Reach Level 5' },
  nightOwl:  { name: 'Night Owl',    emoji: '🦉', desc: 'Complete a task after 10 pm' },
  earlyBird: { name: 'Early Bird',   emoji: '🌅', desc: 'Complete a task before 8 am' },
};

const UNIVERSITY_RESOURCES = {
  mental_health: {
    icon: '💚', label: 'Mental Health Support',
    items: [
      { name: 'University Counselling Service', desc: 'Free, confidential counselling. Self-refer online — no GP needed.', link: '#counselling' },
      { name: 'Samaritans (24/7 Crisis Line)',  desc: 'Free emotional support around the clock.',                         link: 'https://www.samaritans.org', phone: '116 123' },
      { name: 'Student Minds',                  desc: "The UK's student mental health charity — peer support & resources.", link: 'https://www.studentminds.org.uk' },
    ],
  },
  academic: {
    icon: '📚', label: 'Academic Support',
    items: [
      { name: 'Extenuating Circumstances', desc: 'Deadline extensions if circumstances are affecting your studies.', link: '#extenuating' },
      { name: 'Academic Skills Centre',    desc: 'Essay writing, referencing, revision strategy — free drop-in.',   link: '#academic-skills' },
      { name: 'Library Research Support',  desc: 'Subject librarians to help you find credible sources.',            link: '#library' },
    ],
  },
  financial: {
    icon: '💰', label: 'Financial Support',
    items: [
      { name: 'Student Hardship Fund',    desc: 'Emergency assistance reviewed within 5 working days.', link: '#hardship' },
      { name: 'Money Advice Service',     desc: 'Free budgeting help, benefit checks, and debt guidance.', link: '#money' },
      { name: 'Bursaries & Scholarships', desc: 'Check if you qualify for additional financial support.', link: '#bursaries' },
    ],
  },
  social: {
    icon: '🤝', label: 'Social & Community',
    items: [
      { name: "Students' Union",             desc: 'Hundreds of clubs and societies to meet like-minded people.', link: '#su' },
      { name: 'Peer Mentoring Scheme',       desc: 'Matched with an experienced student for support.',           link: '#mentoring' },
      { name: 'Student Befriending Service', desc: 'Trained volunteers for anyone feeling isolated.',            link: '#befriending' },
    ],
  },
  accessibility: {
    icon: '♿', label: 'Accessibility Support',
    items: [
      { name: 'Disability Support Office', desc: 'Register for a needs assessment and personalised support plan.', link: '#disability' },
      { name: 'Reasonable Adjustments',    desc: 'Extra time, alternative formats, and exam adjustments.',        link: '#adjustments' },
      { name: 'Assistive Technology',      desc: 'Free access to Read&Write, Dragon, and screen readers.',        link: '#assistive' },
    ],
  },
};