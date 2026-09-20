export type CompanySource = "companies-house" | "manual";

export type CompanyStatus = "active" | "dissolved" | "liquidation" | "administration" | string;

export type CompanyAddress = {
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
};

export type CompanySearchResult = {
  id: string;
  name: string;
  companyNumber?: string;
  status?: CompanyStatus;
  type?: string;
  dateOfCreation?: string;
  address?: CompanyAddress;
  domain?: string;
  logo?: string;
  industry?: string;
  location?: string;
  sicCodes?: string[];
  source: CompanySource;
};

export type CompanyProfile = {
  status?: CompanyStatus;
  industry?: string;
  sicCodes?: string[];
};
