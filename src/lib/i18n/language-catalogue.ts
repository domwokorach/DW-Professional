// Locally maintained catalogue of the languages Cloud Translation (v3, NMT) documents as translation targets
// (https://cloud.google.com/translate/docs/languages). Used only when the live getSupportedLanguages call fails and
// there is no earlier successful result, so the selector stays usable. A live response always replaces it, and
// anything Google rejects at translation time is reported to the visitor rather than assumed to work.
import type { SupportedLanguage } from './languages';

export const LANGUAGE_CATALOGUE: readonly SupportedLanguage[] = [
  ['af', 'Afrikaans'], ['sq', 'Albanian'], ['am', 'Amharic'], ['ar', 'Arabic'], ['hy', 'Armenian'], ['as', 'Assamese'],
  ['ay', 'Aymara'], ['az', 'Azerbaijani'], ['bm', 'Bambara'], ['eu', 'Basque'], ['be', 'Belarusian'], ['bn', 'Bengali'],
  ['bho', 'Bhojpuri'], ['bs', 'Bosnian'], ['bg', 'Bulgarian'], ['ca', 'Catalan'], ['ceb', 'Cebuano'],
  ['zh-CN', 'Chinese (Simplified)'], ['zh-TW', 'Chinese (Traditional)'], ['co', 'Corsican'], ['hr', 'Croatian'],
  ['cs', 'Czech'], ['da', 'Danish'], ['dv', 'Dhivehi'], ['doi', 'Dogri'], ['nl', 'Dutch'], ['en', 'English'],
  ['eo', 'Esperanto'], ['et', 'Estonian'], ['ee', 'Ewe'], ['fil', 'Filipino'], ['fi', 'Finnish'], ['fr', 'French'],
  ['fy', 'Frisian'], ['gl', 'Galician'], ['ka', 'Georgian'], ['de', 'German'], ['el', 'Greek'], ['gn', 'Guarani'],
  ['gu', 'Gujarati'], ['ht', 'Haitian Creole'], ['ha', 'Hausa'], ['haw', 'Hawaiian'], ['iw', 'Hebrew'], ['hi', 'Hindi'],
  ['hmn', 'Hmong'], ['hu', 'Hungarian'], ['is', 'Icelandic'], ['ig', 'Igbo'], ['ilo', 'Ilocano'], ['id', 'Indonesian'],
  ['ga', 'Irish'], ['it', 'Italian'], ['ja', 'Japanese'], ['jv', 'Javanese'], ['kn', 'Kannada'], ['kk', 'Kazakh'],
  ['km', 'Khmer'], ['rw', 'Kinyarwanda'], ['gom', 'Konkani'], ['ko', 'Korean'], ['kri', 'Krio'],
  ['ku', 'Kurdish (Kurmanji)'], ['ckb', 'Kurdish (Sorani)'], ['ky', 'Kyrgyz'], ['lo', 'Lao'], ['la', 'Latin'],
  ['lv', 'Latvian'], ['ln', 'Lingala'], ['lt', 'Lithuanian'], ['lg', 'Luganda'], ['lb', 'Luxembourgish'],
  ['mk', 'Macedonian'], ['mai', 'Maithili'], ['mg', 'Malagasy'], ['ms', 'Malay'], ['ml', 'Malayalam'], ['mt', 'Maltese'],
  ['mi', 'Maori'], ['mr', 'Marathi'], ['mni-Mtei', 'Meiteilon (Manipuri)'], ['lus', 'Mizo'], ['mn', 'Mongolian'],
  ['my', 'Myanmar (Burmese)'], ['ne', 'Nepali'], ['no', 'Norwegian'], ['ny', 'Nyanja (Chichewa)'], ['or', 'Odia (Oriya)'],
  ['om', 'Oromo'], ['ps', 'Pashto'], ['fa', 'Persian'], ['pl', 'Polish'], ['pt', 'Portuguese (Brazil)'],
  ['pt-PT', 'Portuguese (Portugal)'], ['pa', 'Punjabi'], ['qu', 'Quechua'], ['ro', 'Romanian'], ['ru', 'Russian'],
  ['sm', 'Samoan'], ['sa', 'Sanskrit'], ['gd', 'Scots Gaelic'], ['nso', 'Sepedi'], ['sr', 'Serbian'], ['st', 'Sesotho'],
  ['sn', 'Shona'], ['sd', 'Sindhi'], ['si', 'Sinhala'], ['sk', 'Slovak'], ['sl', 'Slovenian'], ['so', 'Somali'],
  ['es', 'Spanish'], ['su', 'Sundanese'], ['sw', 'Swahili'], ['sv', 'Swedish'], ['tl', 'Tagalog'], ['tg', 'Tajik'],
  ['ta', 'Tamil'], ['tt', 'Tatar'], ['te', 'Telugu'], ['th', 'Thai'], ['ti', 'Tigrinya'], ['ts', 'Tsonga'],
  ['tr', 'Turkish'], ['tk', 'Turkmen'], ['ak', 'Twi'], ['uk', 'Ukrainian'], ['ur', 'Urdu'], ['ug', 'Uyghur'],
  ['uz', 'Uzbek'], ['vi', 'Vietnamese'], ['cy', 'Welsh'], ['xh', 'Xhosa'], ['yi', 'Yiddish'], ['yo', 'Yoruba'], ['zu', 'Zulu'],
].map(([code, name]) => ({ code, name }));

/** How the language list in a response was obtained. */
export type ListSource = 'google' | 'stale' | 'catalogue';
