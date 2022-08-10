import { createClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "./supabaseCredentials";
import { getDayData, sendSMS } from "./shared";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const wordCount = 4;
const maxPossiblePuzzles = 10;

/**
 * Requirements:
 * TODO: the 'like' query is erroneous in that it cannot match starts and ends of sentences
 */

async function findSolution(sample: string, dayIndex: number) {
    const words = sample.replace(",", "").split(" ");
    if (words.length !== wordCount) {
        throw new Error(`sample must have 4 words. ${words.length}. ${sample}`);
    }
    let foundTweets: IRow[] = [];
    for (const word of words) {
        const { data } = await supabase
            .from("Tweets")
            .select()
            .eq("count", dayIndex)
            .ilike("text", `% ${word} %`);
        const filtered = data?.filter(
            (tweet) => !foundTweets.some((t) => t.id === tweet.id)
        );
        if (filtered?.length) {
            foundTweets.push(filtered[0]);
        }
    }
    if (foundTweets.length === wordCount) {
        return foundTweets;
    }
    // console.log(
    //     `${sample}: only found ${foundTweets.length} matches out of ${wordCount}`
    // );
    return null;
}

async function solve(dayIndex: number) {
    const sayings = await getSayings();
    const possiblePuzzles: IPuzzle[] = [];
    console.log("Solving", sayings.length);

    for (const saying of sayings) {
        if (possiblePuzzles.length >= maxPossiblePuzzles) {
            return possiblePuzzles;
        }
        if (
            saying.lastUsage?.length &&
            new Date().getTime() - Number(saying.lastUsage) <
                1000 * 60 * 60 * 24 * 3
        ) {
            // skip if it was used within the last 3 days
            continue;
        }
        let result: IRow[] | null = null;
        try {
            result = await findSolution(saying.text, dayIndex);
        } catch (e) {
            console.log("error", e);
        }
        if (result) {
            possiblePuzzles.push({
                id: `${dayIndex}_${possiblePuzzles.length}`,
                text: saying.text,
                tweet1: result[0].id,
                tweet2: result[1].id,
                tweet3: result[2].id,
                tweet4: result[3].id,
                usageCount: saying.usageCount,
                picked: false,
                dayIndex,
            });
        }
    }
    return possiblePuzzles;
}
interface ISaying {
    text: string;
    usageCount: number;
    lastUsage: string | null;
}

interface IPuzzle {
    id: string;
    text: string;
    tweet1: string;
    tweet2: string;
    tweet3: string;
    tweet4: string;
    usageCount: number;
    picked: boolean;
    dayIndex: number;
}

async function deletePreviousPuzzles(dayIndex: number) {
    const { data } = await supabase
        .from("Puzzle")
        .delete()
        .lt("dayIndex", dayIndex);
    return data;
}

async function getSayings(): Promise<ISaying[]> {
    return supabase
        .from("Sayings")
        .select("*")
        .order("usageCount", { ascending: true })
        .then((res) => {
            return res.data as ISaying[];
        });
}

export async function solveAndWrite() {
    const currentDay = await getDayData();
    if (!currentDay) {
        console.log("no day data found");
        return;
    }
    const currentDayIndex = currentDay.dayIndex;

    await solve(currentDayIndex).then(async (puzzles) => {
        if (puzzles.length === 0) {
            console.log("no puzzles found");
            return;
        }
        await deletePreviousPuzzles(currentDayIndex - 1).then(() => {
            return supabase
                .from("Puzzle")
                .insert(puzzles)
                .then((data) => {
                    console.log(
                        `wrote ${puzzles.length} puzzles.`,
                        data.error
                            ? "However the Supabase write operation failed"
                            : "And the Supabase write operation succeeded"
                    );
                    return sendSMS(
                        `Wrote ${
                            puzzles.length
                        } puzzles for day ${currentDayIndex}. ${
                            data.error
                                ? "However the Supabase write operation failed"
                                : "And the Supabase write operation succeeded"
                        }`
                    );
                });
        });
    });
}

// this will serve to pick the first of the current day's puzzles and set it to "picked"
export async function pickNextPuzzle() {
    const currentDay = await getDayData();
    if (!currentDay) {
        console.log("no day data found");
        return;
    }
    const currentDayIndex = currentDay.dayIndex;
    const { data: alreadyPicked } = await supabase
        .from("Puzzle")
        .select()
        .eq("dayIndex", currentDayIndex)
        .eq("picked", true)
        .limit(1);
    if (alreadyPicked && alreadyPicked.length > 0) {
        console.log("already picked the day's puzzle");
        return;
    }
    const { data } = await supabase
        .from("Puzzle")
        .select()
        .eq("dayIndex", currentDayIndex)
        .eq("picked", false)
        .order("usageCount", { ascending: true })
        .limit(1);

    if (!data) {
        console.log("something went wrong. no puzzles found");
        return;
    }
    const puzzle = data[0];
    puzzle.picked = true;
    return supabase
        .from("Puzzle")
        .update(puzzle)
        .eq("id", puzzle.id)
        .then(async () => {
            console.log(`picked puzzle ${puzzle.id}`);
            await sendSMS(`automatically picked puzzle ${puzzle.id}`);
            const { data: pickedSaying } = await supabase
                .from("Sayings")
                .select()
                .eq("text", puzzle.text);
            if (!pickedSaying?.length) {
                console.log(
                    "something went wrong. could not update the picked saying"
                );
                return;
            }
            const saying = pickedSaying[0];
            await supabase
                .from("Sayings")
                .update({
                    ...saying,
                    lastUsage: new Date().getTime().toString(),
                    usageCount: saying.usageCount + 1,
                })
                .eq("text", saying.text)
                .then(() => {
                    console.log("Updated the picked saying", saying.text);
                });
        });
}
