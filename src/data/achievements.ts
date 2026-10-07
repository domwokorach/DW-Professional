const CLOUDINARY = 'https://res.cloudinary.com/dkkuwmr42/image/upload';
const photo = (path: string) => `${CLOUDINARY}/f_auto,q_auto/${path}`;
const heicPhoto = (path: string) => `${CLOUDINARY}/f_jpg,q_auto/${path}`;

/** Vue Bits Accordion Gallery images, in the requested order. */
export const achievements = [
  { src: photo('v1783168924/IMG_2533_ixz36y.jpg'), label: 'SEE ME', alt: 'SEE ME campaign portrait poster in a shopping centre.', position: '50% center' },
  { src: photo('v1783168924/IMG_2528_oqrwfb.jpg'), label: 'SEE ME campaign', alt: 'Two SEE ME portrait banners in a meeting room.', position: '50% center' },
  { src: photo('v1783168925/IMG_2529_bthtow.jpg'), label: 'SEE ME together', alt: 'Two people smiling beside SEE ME campaign posters.', position: '50% center' },
  { src: photo('v1783168924/IMG_2531_m1l87j.jpg'), label: 'London', alt: 'Dominic seated beside the Thames with St Paul’s Cathedral in the background.', position: '50% center' },
  { src: photo('v1783168925/IMG_2530_hp9xn9.jpg'), label: 'At work', alt: 'A camera crew filming an interview in an office.', position: '68% center' },
  { src: photo('v1783168924/IMG_2532_btmgaz.jpg'), label: 'Millennium Bridge', alt: 'Dominic walking across the Millennium Bridge with St Paul’s Cathedral behind him.', position: '50% center' },
  { src: photo('v1790087346/10_downing_street_2014_rp8eoo.jpg'), label: '10 Downing Street', alt: 'Dominic standing outside the front door of 10 Downing Street.', position: '50% center' },
  { src: photo('v1790087346/IBM_2015_mwt0bp.jpg'), label: 'IBM', alt: 'Black-and-white portrait of Dominic beside an IBM sign.', position: '68% center' },
  { src: photo('v1790087347/red_lion_court_p1rjfv.jpg'), label: 'Red Lion Court', alt: 'Dominic seated in a bright open-plan office.', position: '40% center' },
  { src: photo('v1790087626/IMG_4298_cfji6j.jpg'), label: 'Professional connections', alt: 'Dominic standing beside a colleague at a professional event.', position: '50% center' },
  { src: heicPhoto('v1790087347/IC_conference_dmmrsr.heic'), label: 'Innovation conference', alt: 'An innovation conference hall with cyber security exhibits and attendees.', position: '50% center' },
  { src: photo('v1783168000/BSL_Dominic_Day_3_94_wt7pck.jpg'), label: 'At Sky', alt: 'Two colleagues walking past greenery outside an office building.', position: '50% center' },
  { src: photo('v1783168000/BSL_Dominic_Day_15_24_ceele4.jpg'), label: 'Sky office', alt: 'Dominic standing in a Sky office with an orange lanyard.', position: '35% center' },
  { src: photo('v1783168000/BSL_Dominic_Day_6_3_rnijtv.jpg'), label: 'Working together', alt: 'Colleagues using sign language across a desk in an office.', position: '55% center' },
  { src: photo('v1790020464/dominic_ie0owj.png'), label: 'Dominic', alt: 'Portrait of Dominic smiling in a navy jumper, shirt and tie.', position: '50% center' },
] as const;
