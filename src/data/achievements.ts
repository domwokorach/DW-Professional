import type { Achievement } from '@/types';

const CLOUDINARY = 'https://res.cloudinary.com/dkkuwmr42/image/upload';
const CLOUDINARY_VIDEO = 'https://res.cloudinary.com/dkkuwmr42/video/upload';

// "Proud moments", in order. Image alt text describes what is visible.
export const achievements: Achievement[] = [
  {
    number: '01 / 01', title: 'Lloyds Banking Group',
    description: 'From engineering apprentice to Senior Frontend Developer, 2014–2024.',
    mediaType: 'video',
    // Same asset, re-encoded by Cloudinary (q_auto:eco). The muted inline preview drops the audio
    // track (~2.5 MB); the pop-out player keeps it (~3.1 MB). The poster is its first frame.
    src: `${CLOUDINARY_VIDEO}/q_auto:eco,ac_none/v1783171340/IMG_0340_ftara5.mp4`,
    fullSrc: `${CLOUDINARY_VIDEO}/q_auto:eco/v1783171340/IMG_0340_ftara5.mp4`,
    poster: `${CLOUDINARY_VIDEO}/so_0,q_auto/v1783171340/IMG_0340_ftara5.jpg`,
    alt: 'Lloyds Banking Group career journey video',
  },
  {
    number: '02 / 02', title: 'Sky', description: 'Software Engineer Intern on catalogue, pricing and billing workflows.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1790018731/Untitled_design_y8od72.png`,
    alt: 'A smiling man in a navy jumper, shirt and tie stands in an atrium, in front of a glass-walled TV studio with camera rigs.',
  },
  {
    number: '03 / 03', title: 'Specialist Accessibility',
    description: 'WCAG 2.1 AA interfaces at Lloyds; working to WCAG 2.2 AA today.',
    mediaType: 'video',
    // Source is a .mov; Cloudinary delivers the same asset as MP4 (H.264), re-encoded (q_auto:eco).
    // Muted preview without audio ~11.6 MB; pop-out with audio ~14.1 MB (vs ~29 MB original).
    // Each loads only once it plays (preload="metadata").
    src: `${CLOUDINARY_VIDEO}/q_auto:eco,ac_none/v1783170985/videoplayback_1_qa4kbj.mp4`,
    fullSrc: `${CLOUDINARY_VIDEO}/q_auto:eco/v1783170985/videoplayback_1_qa4kbj.mp4`,
    // Poster at 2s; the opening frame is an empty office.
    poster: `${CLOUDINARY_VIDEO}/so_2,q_auto/v1783170985/videoplayback_1_qa4kbj.jpg`,
    alt: 'Specialist Accessibility professional experience video',
  },
  {
    number: '04 / 04', title: 'Freelance projects', description: 'Shipped since 2026, from news and booking apps to AI tools.',
    mediaType: 'stat', stat: { value: '8', badge: '↗' },
  },
  {
    number: '05 / 05', title: 'Financial Innovation Awards',
    description: 'A proud moment celebrating innovation and recognition within the financial services industry.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1790087626/IMG_4297_ickkd0.jpg`,
    alt: 'Financial Innovation Awards 20 Years trophy reading “Winner 2017, Best Financial Inclusion or Outreach Initiative, Lloyds Banking Group”.',
  },
  {
    number: '06 / 06', title: 'Thank You',
    description: 'A moment of appreciation and recognition that reflects the people, collaboration, and experiences that have shaped my professional journey.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1790087626/IMG_4295_okyttr.jpg`,
    alt: 'A “Thank You” card, a Lloyds-branded reusable coffee cup and a “Simply Thanks” box of chocolates on an office desk.',
  },
  {
    number: '07 / 07', title: 'Digital Conference',
    description: 'A professional conference moment connected to digital innovation, collaboration, and sharing ideas across technology communities.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1790087347/IC_2018_qfxdqi.jpg`,
    alt: 'Conference hall being set up for Innovation Community 2018, with stage lighting rigs, screens and a red Innovation Community 2018 banner.',
  },
  {
    number: '08 / 08', title: 'Office',
    description: 'A workplace moment representing the environments, teams, and day-to-day collaboration behind my career in technology.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168925/IMG_2530_hp9xn9.jpg`,
    alt: 'A filmed interview in an office, with a camera crew setting up beside a man in a shirt, tie and lanyard.',
    position: '68% center',
  },
  {
    number: '09 / 09', title: 'SEE ME',
    description: 'A personal professional moment highlighting visibility, individuality, and the experiences that form part of my wider career journey.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168925/IMG_2529_bthtow.jpg`,
    alt: 'Two people smiling beside “Will you SEE ME?” campaign posters showing a portrait of a man in a suit.',
  },
  {
    number: '10 / 10', title: 'SEE',
    description: 'A visual moment from my professional journey, capturing another perspective on the people, places, and experiences behind my work.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168924/IMG_2533_ixz36y.jpg`,
    alt: '“SEE ME?” campaign poster with a close-up portrait of a man in a suit, standing in a shopping centre.',
  },
  {
    number: '11 / 11', title: 'London',
    description: 'A London moment representing the city where much of my professional journey across digital banking, innovation, and software engineering has developed.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168924/IMG_2532_btmgaz.jpg`,
    alt: 'A man in a blue suit carrying a briefcase walks across the Millennium Bridge, with St Paul’s Cathedral behind him.',
  },
  {
    number: '12 / 12', title: 'Sky',
    description: 'A professional moment from my experience at Sky, representing another important stage in my software engineering journey.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168000/BSL_Dominic_Day_6_3_rnijtv.jpg`,
    alt: 'Colleagues talking in sign language across a desk with a laptop in a bright open-plan office.',
    position: '62% center',
  },
  {
    number: '13 / 13', title: 'Sky',
    description: 'A professional moment from my time at Sky, reflecting the people, collaboration, and experiences that formed part of my software engineering journey.',
    mediaType: 'image',
    src: `${CLOUDINARY}/v1783168000/BSL_Dominic_Day_3_94_wt7pck.jpg`,
    alt: 'Two colleagues in conversation as they walk past greenery outside an office building, one wearing an orange lanyard and a backpack.',
  },
];
