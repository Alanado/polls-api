import { FastifyInstance } from "fastify";
import { z } from "zod";
import { voting } from "../utils/voting-pub-sub";

export async function pollResult(app: FastifyInstance) {
  app.get("/polls/:pollId/result", { websocket: true }, (connect, request) => {
    const pollResultParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = pollResultParams.parse(request.params);

    voting.subscribe(pollId, (message) => {
      connect.socket.send(JSON.stringify(message));
    });
  });
}
