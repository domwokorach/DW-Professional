export type CompanySource = "companies-house" | "manual";

export type CompanyStatus = "active" | "dissolved" | "liquidation" | "administration" | string;

export type CompanySearchResult = {
  id: string;
  name: string;
  companyNumber?: string;
  status?: CompanyStatus;
  domain?: string;
  logo?: string;
  industry?: string;
  location?: string;
  source: CompanySource;
};

export type CompanyProfile = {
  status?: CompanyStatus;
  industry?: string;
  sicCodes?: string[];
};
