declare module "*.css";
declare module "*.svg";

// note that these should stay identical to the ones in the root

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
    }
}
