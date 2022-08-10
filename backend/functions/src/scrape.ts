import { TwitterApi } from "twitter-api-v2";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./supabaseCredentials";
import {
    appKey,
    appSecret,
    accessToken,
    accessSecret,
} from "./twitterCredentials";

import { chunk } from "lodash";
import { getDayData, sendSMS } from "./shared";

/**
 * This script will go through all the available Twitter handles, and scrape yesterday's tweets for each one.
 * It will then write the data to the database.
 */

const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const chunkSize = 10; // Note: the 'batchIndex' in SQL depends on this quantity

function getTimeInterval() {
    return {
        timestampStart: new Date().getTime() - 26 * 60 * 60 * 1000,
        timestampEnd: new Date().getTime() - 2 * 60 * 60 * 1000,
    };
}

async function deletePrevious(dayIndex: number) {
    const { data } = await supabase
        .from("Tweets")
        .delete()
        .lt("count", dayIndex);
    return data;
}

function getHandles(): PromiseLike<string[]> {
    return supabase
        .from("Handles")
        .select("*")
        .then((res) => {
            if (res.error) {
                console.log("error getting handles");
                return [];
            }
            return res.data.map((d) => d.handle);
        });
}

async function getAllWeCan(
    chunkStart: number,
    dayIndex: number,
    timestampStart: number,
    timestampEnd: number
): Promise<IDayData> {
    // const orig = chunkStart;
    await deletePrevious(dayIndex - 1);

    const allHandles = await getHandles();
    const chunks = chunk(allHandles, chunkSize);

    await sendSMS(
        `Day ${dayIndex}: scraping ${chunks.length} chunks starting from ${chunkStart}`
    );

    for (const chunk of chunks.slice(chunkStart)) {
        try {
            const authors: string[] = [];
            await Promise.all(
                chunk.map(async (handle) => {
                    return await client.v2
                        .search(
                            `from:${handle}  -is:retweet -is:quote -is:reply -has:media`, // exclude retweets and replies and tweets with photos/gifs etc.
                            {
                                start_time: new Date(
                                    timestampStart
                                ).toISOString(),
                                end_time: new Date(timestampEnd).toISOString(),
                                "tweet.fields": "public_metrics",
                                expansions: "author_id,attachments.poll_ids",
                                "user.fields": "username,profile_image_url",
                            }
                        )
                        .then((res) => {
                            // A simulation of usage limits (for testing):
                            // if (chunkStart >= orig + 3) {
                            //     throw new Error("Usage Limitsss!");
                            //     return;
                            // }
                            return res;
                        })
                        .then(async (res) => {
                            if (!res) {
                                return;
                            }
                            // console.dir(res.data, { depth: null });
                            const user_object = res.data?.includes?.users?.find(
                                (u) => u.username === handle
                            );
                            const author_full = user_object?.name || "";
                            const author_profile_url =
                                user_object?.profile_image_url || "";
                            if (!res.data.data) {
                                return;
                            }
                            const rows: IRow[] = res.data.data
                                .filter(
                                    (d) =>
                                        !d.text.includes("_") &&
                                        !d.attachments?.poll_ids
                                )
                                .map((d) => {
                                    const row: IRow = {
                                        id: d.id,
                                        text: d.text,
                                        author: handle,
                                        author_full,
                                        author_profile_url,
                                        likes: d.public_metrics!.like_count,
                                        retweets:
                                            d.public_metrics!.retweet_count,
                                        quotes: d.public_metrics!.quote_count,
                                        replies: d.public_metrics!.reply_count,
                                        count: dayIndex,
                                    };
                                    return row;
                                });

                            const writeResult = await supabase
                                .from("Tweets")
                                .insert(rows);

                            authors.push(handle);

                            return writeResult;
                        })
                        .catch((err) => {
                            if (err.message === "Usage Limitsss!") {
                                throw new Error("Usage limit error.");
                            }
                            if (err.code === 429) {
                                throw new Error("Usage limit error.");
                            } else {
                                console.log("Error", err.code, err);
                            }
                        });
                })
            );
            // console.log(
            //     "Written chunk number",
            //     chunkStart,
            //     "\nAuthors: ",
            //     authors.join(", ")
            // );
            chunkStart++;
        } catch (e) {
            console.log("Bailing out at chunk number", chunkStart);
            return {
                id: "metadata",
                startTime: timestampStart.toString(),
                endTime: timestampEnd.toString(),
                batchOffset: chunkStart,
                isComplete: false,
                dayIndex,
            };
        }
    }
    return {
        id: "metadata",
        startTime: timestampStart.toString(),
        endTime: timestampEnd.toString(),
        batchOffset: chunkStart,
        isComplete: chunkStart >= chunks.length,
        dayIndex,
    };
}

export async function scrape() {
    const day = await getDayData();
    const { timestampStart, timestampEnd } = getTimeInterval();

    if (!day) {
        // make a new entry
        const originDay = await getAllWeCan(0, 0, timestampStart, timestampEnd);
        await supabase.from("ScrapeData").upsert(originDay);
        console.log("Scraped up until batch offset", originDay.batchOffset);
        return;
    } else {
        if (Number(day.endTime) > timestampStart + 1000 * 60 * 5) {
            // give a 5 minute buffer
            if (day.isComplete) {
                console.log(
                    "Too early and scraping is already complete (hours remaining)",
                    Math.floor(
                        (Number(day.endTime) - timestampStart) /
                            (1000 * 60 * 60)
                    )
                );
                return;
            } else {
                // scrape some more and then make the day complete (use previous timestamps)
                const updatedDay = await getAllWeCan(
                    day.batchOffset,
                    day.dayIndex,
                    Number(day.startTime),
                    Number(day.endTime)
                );
                if (updatedDay.batchOffset === day.batchOffset) {
                    console.log(
                        "For some reason that beach offset did not increase. Setting day to complete"
                    );
                    updatedDay.isComplete = true;
                }
                await supabase.from("ScrapeData").upsert(updatedDay);
                console.log(
                    "Scraped up until batch offset",
                    updatedDay.batchOffset
                );
                return;
            }
        }
        // start a brand new day
        const newDay = await getAllWeCan(
            0,
            day.dayIndex + 1,
            timestampStart,
            timestampEnd
        );
        await supabase.from("ScrapeData").upsert(newDay);
        console.log("Scraped up until batch offset", newDay.batchOffset);
        return;
    }
}
