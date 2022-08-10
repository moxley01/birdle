declare module "*.css";
declare module "*.svg";

interface IRow {
  id: string;
  text: string;
  author: string;
  author_full: string;
  author_profile_url: string;
  likes: number;
  retweets: number;
  quotes: number;
  replies: number;
  count: number;
}

interface IExtendedRow extends IRow {
  puzzle_text: string;
}

interface IDayData {
  id: "metadata";
  startTime: string;
  endTime: string;
  batchOffset: number;
  isComplete: boolean;
  dayIndex: number;
}

declare namespace NodeJS {
  export interface ProcessEnv {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_TOKEN: string;
    TWILIO_SOURCE_NUMBER: string;
    TWILIO_TARGET_NUMBER: string;
    TWITTER_APP_KEY: string;
    TWITTER_APP_SECRET: string;
    TWITTER_ACCESS_TOKEN: string;
    TWITTER_ACCESS_SECRET: string;
  }
}
