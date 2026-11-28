import { EMAIL, EmailButton, EmailDivider, EmailFeatureRow, EmailFooter, EmailHeader, EmailHeading, EmailHero, EmailParagraph, esc } from './email-components';

export type EmailTemplateId = 'internal' | 'events' | 'news' | 'welcome';

type Feature = { title: string; text: string };
type EmailContent = {
  id: EmailTemplateId;
  /** Short name on the template selector. */
  tab: string;
  /** One-line purpose shown beside the selector. */
  purpose: string;
  subject: string;
  preheader: string;
  label: string;
  heroAlt: string;
  headline: string;
  hero: string;
  cta: string;
  intro: string;
  featuresHeading: string;
  features: [Feature, Feature, Feature];
  closing: { heading: string; text: string; cta: string };
  footerLine: string;
};

const DISCLAIMER = 'For illustrative portfolio demonstration purposes only. Not an official Lloyds Banking Group communication.';
const BRAND = 'Lloyds Banking Group';

/** Illustrative content only: no real communication, names, dates, links or figures. */
export const TEMPLATES: Record<EmailTemplateId, EmailContent> = {
  internal: {
    id: 'internal',
    tab: 'Internal Communications',
    purpose: 'Corporate and departmental updates',
    subject: 'Internal Communications: technology and digital transformation update',
    preheader: 'Supporting collaboration, digital transformation and continuous improvement across our organisation.',
    label: 'Internal Communications',
    heroAlt: 'Three overlapping green circles on a pale green background, representing colleagues connecting.',
    headline: 'Keeping our colleagues connected.',
    hero: 'Supporting collaboration, digital transformation and continuous improvement across our organisation.',
    cta: 'Explore Internal Updates',
    intro: 'Welcome to our internal technology and digital transformation update. Explore the latest initiatives, engineering developments and opportunities to collaborate with colleagues across the organisation.',
    featuresHeading: 'Featured updates',
    features: [
      { title: 'Digital Transformation', text: 'Supporting modern digital experiences through accessible, responsive and reusable technologies.' },
      { title: 'Technology & Innovation', text: 'Exploring emerging technologies, innovative solutions and opportunities to improve internal systems.' },
      { title: 'Engineering & Collaboration', text: 'Connecting multidisciplinary teams to support knowledge sharing, software quality and continuous improvement.' },
    ],
    closing: { heading: 'Share an idea', text: 'Have a suggestion for a future update? Tell the communications team.', cta: 'Share Feedback' },
    footerLine: 'Internal Communications · Employee Information',
  },
  events: {
    id: 'events',
    tab: 'Events',
    purpose: 'Employee events, workshops and networking',
    subject: 'Events: workshops and networking for colleagues',
    preheader: 'Workshops, learning sessions and networking opportunities for colleagues.',
    label: 'Events',
    heroAlt: 'A grid of rounded green and white squares resembling a calendar, on a pale green background.',
    headline: 'Learn, connect and grow together.',
    hero: 'Workshops, learning sessions and networking opportunities for colleagues across the organisation.',
    cta: 'View Upcoming Events',
    intro: 'Our events programme brings colleagues together to share knowledge, build relationships and learn from one another. Explore what is coming up and find a session that suits you.',
    featuresHeading: 'Upcoming highlights',
    features: [
      { title: 'Technology Workshop', text: 'A hands-on session on accessible, responsive and reusable front-end practices.' },
      { title: 'Networking Morning', text: 'An informal opportunity to meet colleagues from other teams and share experiences.' },
      { title: 'Open Forum', text: 'A relaxed conversation about ideas, challenges and how we can work better together.' },
    ],
    closing: { heading: 'Never miss a session', text: 'Add events to your calendar so you can plan ahead.', cta: 'Add to Calendar' },
    footerLine: 'Employee Events · Employee Information',
  },
  news: {
    id: 'news',
    tab: 'News',
    purpose: 'Internal business, technology and colleague news',
    subject: 'News: this month across technology and the business',
    preheader: 'The latest business, technology and colleague news in one place.',
    label: 'News',
    heroAlt: 'A row of green vertical bars of different heights on a pale green background, resembling a chart.',
    headline: 'What is new across the organisation.',
    hero: 'The latest business, technology and colleague news, all in one place.',
    cta: 'Read the Latest News',
    intro: 'Catch up on recent progress across our teams, from platform improvements to colleague achievements. Each story is short, clear and written for busy readers.',
    featuresHeading: 'In this edition',
    features: [
      { title: 'Platform Update', text: 'A summary of recent improvements to shared digital platforms and tools.' },
      { title: 'Engineering Spotlight', text: 'How teams are improving software quality through review, testing and collaboration.' },
      { title: 'Colleague Recognition', text: 'Celebrating colleagues who have made a positive difference to their teams.' },
    ],
    closing: { heading: 'Have a story to share?', text: 'Let the communications team know about news from your area.', cta: 'Suggest a Story' },
    footerLine: 'Internal News · Employee Information',
  },
  welcome: {
    id: 'welcome',
    tab: 'Welcome to New Colleagues',
    purpose: 'Employee onboarding and welcome communications',
    subject: 'Welcome: everything you need for your first few weeks',
    preheader: 'A friendly guide to your first few weeks, from meeting your team to finding your way around.',
    label: 'Welcome',
    heroAlt: 'Nested green arches forming a doorway on a pale green background, representing a warm welcome.',
    headline: 'Welcome to the team.',
    hero: 'A friendly guide to your first few weeks, from meeting your team to finding your way around.',
    cta: 'Start Your Onboarding',
    intro: 'We are delighted that you have joined us. This guide brings together the essentials so you can settle in with confidence and know where to find help when you need it.',
    featuresHeading: 'Your first steps',
    features: [
      { title: 'Meet Your Team', text: 'Introductions, ways of working and the people who will support you as you start.' },
      { title: 'Set Up Your Tools', text: 'Access, equipment and software, with clear guidance on who to ask for help.' },
      { title: 'Learn How We Work', text: 'An overview of our values, practices and the learning available to you.' },
    ],
    closing: { heading: 'Need a hand?', text: 'Our colleague guide answers the most common first-week questions.', cta: 'View the Colleague Guide' },
    footerLine: 'Onboarding · Employee Information',
  },
};

export const TEMPLATE_ORDER: EmailTemplateId[] = ['internal', 'events', 'news', 'welcome'];

/** Mobile rules for clients that support <style>; every layout rule is also inline so clients that strip it still render. */
const RESPONSIVE_CSS = `
body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{-ms-interpolation-mode:bicubic}
@media only screen and (max-width:480px){
.outer{padding:0!important}
.container{width:100%!important;border-radius:0!important}
.px{padding-left:20px!important;padding-right:20px!important}
.hero{padding-top:32px!important;padding-bottom:28px!important}
.hero-h1{font-size:26px!important;line-height:32px!important}
.label{letter-spacing:1px!important}
}`.trim();

/** Complete standalone HTML email document: table layout, inline CSS, Outlook ghost table, no JavaScript. */
export function renderEmail(id: EmailTemplateId): string {
  const t = TEMPLATES[id];
  const row = (inner: string, pad: string, bg: string = EMAIL.white, align = 'left') =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="px" align="${align}" style="padding:${pad};background-color:${bg};">${inner}</td></tr></table>`;
  const body = [
    EmailHeader({ brand: BRAND, label: t.label }),
    EmailHero({ image: { file: `hero-${id}.png`, alt: t.heroAlt }, headline: t.headline, text: t.hero, cta: t.cta }),
    row(EmailDivider(), '0 32px'),
    row(EmailParagraph({ text: t.intro }), '28px 32px 8px'),
    row(EmailHeading({ text: t.featuresHeading, level: 2, size: 20 }), '20px 32px 0'),
    row(t.features.map((f, i) => (i ? EmailDivider() : '') + EmailFeatureRow({ thumb: `thumb-${id}-${i + 1}.png`, ...f })).join(''), '0 32px'),
    row(
      `<h2 style="margin:0 0 6px;font-family:${EMAIL.font};font-size:18px;line-height:24px;font-weight:bold;color:${EMAIL.charcoal};text-align:center;">${esc(t.closing.heading)}</h2>` +
      `<div style="margin:0 auto 18px;max-width:400px;">${EmailParagraph({ text: t.closing.text, size: 14, align: 'center' })}</div>` +
      EmailButton({ label: t.closing.cta, variant: 'secondary' }),
      '32px 32px 36px', EMAIL.greenTint, 'center'),
    EmailFooter({ brand: BRAND, line: t.footerLine, disclaimer: DISCLAIMER }),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(t.subject)}</title>
<style>${RESPONSIVE_CSS}</style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL.page}" style="background-color:${EMAIL.page};"><tr><td class="outer" align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<div class="container" style="box-sizing:border-box;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;background-color:${EMAIL.white};border:1px solid ${EMAIL.line};">
${body}
</div>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
  // Break between tags so the "View HTML" panel is readable; whitespace between block tables does not render.
  return html.replace(/>\s+</g, '>\n<');
}

/** All four templates, ready for the preview. */
export const renderAllEmails = () => TEMPLATE_ORDER.map((id) => ({ id, tab: TEMPLATES[id].tab, purpose: TEMPLATES[id].purpose, subject: TEMPLATES[id].subject, html: renderEmail(id) }));
