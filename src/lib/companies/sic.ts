/**
 * Maps a UK SIC 2007 code to a human-readable industry label. Companies
 * House profiles return SIC codes, not industry names, so this buckets the
 * 5-digit code by its leading digits (the SIC "section") into categories
 * relevant to a recruitment/professional-services audience.
 */
const SIC_PREFIX_INDUSTRY: Array<[prefix: string, industry: string]> = [
  ["64191", "Banking"],
  ["64192", "Banking"],
  ["641", "Banking"],
  ["642", "Financial Services"],
  ["643", "Financial Services"],
  ["649", "Financial Services"],
  ["651", "Insurance"],
  ["652", "Insurance"],
  ["653", "Insurance"],
  ["66", "Financial Services"],
  ["620", "Technology & Software"],
  ["582", "Technology & Software"],
  ["631", "Technology & Software"],
  ["611", "Telecommunications"],
  ["612", "Telecommunications"],
  ["613", "Telecommunications"],
  ["61", "Telecommunications"],
  ["70221", "Consulting & Professional Services"],
  ["702", "Consulting & Professional Services"],
  ["69", "Legal & Accounting"],
  ["71", "Engineering & Architecture"],
  ["72", "Research & Development"],
  ["86", "Healthcare"],
  ["87", "Healthcare"],
  ["21", "Pharmaceutical"],
  ["41", "Construction"],
  ["42", "Construction"],
  ["43", "Construction"],
  ["28", "Manufacturing"],
  ["29", "Automotive"],
  ["30300", "Aerospace & Defence"],
  ["25400", "Aerospace & Defence"],
  ["84220", "Aerospace & Defence"],
  ["10", "Manufacturing"],
  ["20", "Manufacturing"],
  ["3", "Manufacturing"],
  ["35", "Energy & Utilities"],
  ["36", "Energy & Utilities"],
  ["06", "Oil & Gas"],
  ["09", "Oil & Gas"],
  ["49", "Transport & Logistics"],
  ["50", "Transport & Logistics"],
  ["51", "Aviation"],
  ["52", "Transport & Logistics"],
  ["55", "Hospitality & Hotels"],
  ["56", "Restaurants & Food & Beverage"],
  ["58", "Media & Publishing"],
  ["59", "Media & Entertainment"],
  ["60", "Media & Entertainment"],
  ["73", "Advertising & Marketing"],
  ["14", "Fashion"],
  ["15", "Fashion"],
  ["47", "Retail"],
  ["45", "Retail"],
  ["46", "Retail"],
  ["68", "Property & Real Estate"],
  ["85", "Education"],
  ["84", "Government & Public Sector"],
  ["94", "Charity & Non-profit"],
  ["78", "Recruitment"],
];

export function mapSicCodesToIndustry(sicCodes: string[] | undefined): string | undefined {
  if (!sicCodes || sicCodes.length === 0) return undefined;
  for (const code of sicCodes) {
    const match = SIC_PREFIX_INDUSTRY.find(([prefix]) => code.startsWith(prefix));
    if (match) return match[1];
  }
  return "Other";
}
