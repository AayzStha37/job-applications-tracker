export interface JobData {
  company: string;
  position: string;
  location: string;
  url: string;
  source: string;
  externalJobId: string;
  jobDescription: string;
}

export type LocCode = "HFX" | "TO" | "OW" | "MO" | "VC";
export type MailAlias = "email1" | "email2";

export interface CreatePayload extends JobData {
  locCode: LocCode | "";
  mailAlias: MailAlias;
}
