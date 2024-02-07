import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/vote", async (request, response) => {
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const { pollOptionId } = voteOnPollBody.parse(request.body);
    const { pollId } = voteOnPollParams.parse(request.params);

    let { sessionId } = request.cookies;

    if (!sessionId) {
      sessionId = randomUUID();

      response.setCookie("sessionId", sessionId, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
      });
    }

    return response.status(201).send(sessionId);
  });
}
