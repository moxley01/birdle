import { createClient } from "@supabase/supabase-js";
import twilio = require("twilio");
import { accountSid, token, sourceNumber, targetNumber } from "./twilioCredentials";
const twilioClient = twilio(accountSid, token);

import { supabaseServiceKey, supabaseUrl } from "./supabaseCredentials";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getDayData(): Promise<IDayData | null> {
    return supabase
        .from("ScrapeData")
        .select("*")
        .then((res) => {
            if (res.error) {
                console.log("error getting day data");
                return null;
            }
            if (!res.data.length) {
                return null;
            } else {
                return res.data[0];
            }
        });
}

export function sendSMS(message: string) {
    return twilioClient.messages.create({
        body: message,
        to: targetNumber,
        from: sourceNumber,
    });
}