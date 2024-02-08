import fastify from "fastify";
import { createPoll } from "../routes/create-poll";
import { getPoll } from "../routes/get-poll";
import cookie from "@fastify/cookie";
import { voteOnPoll } from "../routes/vote-on-poll";
import websocket from "@fastify/websocket";
import { pollResult } from "../websocket/poll-results";

const app = fastify();

app.register(cookie, {
  secret: "sistem-polls-voting",
  hook: "onRequest",
});

app.register(websocket);

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResult);

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running in port 3333!");
});
