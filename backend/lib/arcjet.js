// import arcjet, {tokenBucket,shield,detectBot} from "@arcjet/node";
// import "dotenv/config"

// //init arcjet 

// export const aj = arcjet({
//     key : process.env.ARCJET_KEY,
//     characteristics: ["ip.src"],
//     rules: [
//         //shields protect from common attacks
//         shield({mode: "LIVE"}),
//         detectBot({
//             mode: "LIVE",
//             allow: [
//                 "CATEGORY:SEARCH_ENGINE"
//                 //https://arcjet.com/bot-list
//             ]
//         }),
//         //ratelimiting
//         //sliding window
//         tokenBucket({
//             mode: "LIVE",
//             refillRate: 5,
//             interval: 10,
//             capacity: 10
//         })
//     ]
// })

import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import "dotenv/config";

const isDev = process.env.NODE_ENV !== "production";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: isDev ? "DRY_RUN" : "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
    tokenBucket({
      mode: isDev ? "DRY_RUN" : "LIVE",
      refillRate: 60,
      interval: 10,
      capacity: 200,
    }),
  ],
});