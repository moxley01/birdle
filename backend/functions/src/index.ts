import * as functions from "firebase-functions";
import { scrape } from "./scrape";
import { solveAndWrite, pickNextPuzzle } from "./solve";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const scrapeTweets = functions
    .runWith({
        timeoutSeconds: 540,
    })
    .pubsub.schedule("0 7 * * *") // 7am every day
    .timeZone("Europe/Madrid")
    .onRun(async () => {
        await scrape();
        return "success";
    });

export const scrapeTweets2 = functions
    .runWith({
        timeoutSeconds: 540,
    })
    .pubsub.schedule("30 7 * * *") // 7:30am every day
    .timeZone("Europe/Madrid")
    .onRun(async () => {
        await scrape();
        return "success";
    });

export const getDailyPuzzles = functions
    .runWith({
        timeoutSeconds: 540,
    })
    .pubsub.schedule("0 8 * * *") // 8am every day
    .timeZone("Europe/Madrid")
    .onRun(async () => {
        await solveAndWrite();
        return "success";
    });


export const autoPickPuzzle = functions
    .runWith({
        timeoutSeconds: 540,
    })
    .pubsub.schedule("0 9 * * *") // 9am every day (allows 1h window for manual puzzle selection)
    .timeZone("Europe/Madrid")
    .onRun(async () => {
        await pickNextPuzzle();
        return "success";
    });
