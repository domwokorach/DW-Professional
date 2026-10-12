// British → American spelling for the English (US) option. Machine translation does not localise English to
// English, so this is a deliberately small, whole-word lexicon: it never touches words it does not list.

const WORDS: Readonly<Record<string, string>> = {
  analyse: 'analyze', analysed: 'analyzed', analysing: 'analyzing',
  catalogue: 'catalog', catalogues: 'catalogs',
  centre: 'center', centres: 'centers', centred: 'centered',
  defence: 'defense', licence: 'license', offence: 'offense', pretence: 'pretense',
  grey: 'gray', judgement: 'judgment', programme: 'program', programmes: 'programs',
  cancelled: 'canceled', cancelling: 'canceling', labelled: 'labeled', modelled: 'modeled',
  travelled: 'traveled', travelling: 'traveling', fulfil: 'fulfill', whilst: 'while',
  cheque: 'check', aluminium: 'aluminum', tyre: 'tire', mum: 'mom', maths: 'math', learnt: 'learned',
};

/** Stems of verbs and nouns spelled -ise/-isation in British English. */
const ISE_STEMS = [
  'authoris', 'categoris', 'centralis', 'customis', 'digitis', 'emphasis', 'finalis', 'generalis', 'initialis',
  'localis', 'maximis', 'minimis', 'modernis', 'normalis', 'optimis', 'organis', 'personalis', 'prioritis',
  'realis', 'recognis', 'specialis', 'standardis', 'summaris', 'sanitis', 'synchronis', 'utilis', 'visualis',
];
const ISE_RE = new RegExp(`\\b(${ISE_STEMS.join('|')})(e|es|ed|ing|ation|ations|er|ers)\\b`, 'gi');

/** Stems spelled -our in British English. */
const OUR_STEMS = ['behaviour', 'colour', 'favour', 'favourite', 'flavour', 'harbour', 'honour', 'humour', 'labour', 'neighbour'];
const OUR_RE = new RegExp(`\\b(${OUR_STEMS.join('|')})(s|ed|ing|ite|ites|able)?\\b`, 'gi');

const WORD_RE = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi');

/** Keeps the original's capitalisation (colour → color, Colour → Color, COLOUR → COLOR). */
function matchCase(from: string, to: string): string {
  if (from === from.toUpperCase() && from.length > 1) return to.toUpperCase();
  if (from[0] === from[0].toUpperCase()) return to[0].toUpperCase() + to.slice(1);
  return to;
}

export function americanise(text: string): string {
  return text
    .replace(WORD_RE, (m) => matchCase(m, WORDS[m.toLowerCase()]))
    .replace(ISE_RE, (m, stem: string, end: string) => matchCase(m, `${stem.slice(0, -1)}z${end}`.toLowerCase()))
    .replace(OUR_RE, (m, stem: string, end = '') => matchCase(m, `${stem.slice(0, -3)}or${end}`.toLowerCase()));
}
