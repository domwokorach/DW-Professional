export type Testimonial = {
  id: number;
  organisation: string;
  company: string;
  avatarUrl?: string;
  quote: string;
  attribution: string;
  date: string;
  dateTime: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 19,
    organisation: 'Innovation Community',
    company: 'Lloyds Banking Group',
    quote: 'Dom A big big thanks from the team for all the handout you have done on Innovation Community conference 2018. It has been great working with you.',
    attribution: 'Innovation Communities Team',
    date: '5 Oct 2026',
    dateTime: '2026-10-05',
  },
];
