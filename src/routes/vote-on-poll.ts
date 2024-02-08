import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";
import { redis } from "../lib/redis";
import { voting } from "../utils/voting-pub-sub";

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/vote", async (request, response) => {
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const voteOnPollBody = z.object({
      pollOptionsId: z.string().uuid(),
    });

    const { pollOptionsId } = voteOnPollBody.parse(request.body);
    const { pollId } = voteOnPollParams.parse(request.params);

    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (userPreviousVoteOnPoll) {
        if (userPreviousVoteOnPoll.pollOptionsId === pollOptionsId) {
          return response
            .status(400)
            .send({ message: "You already voted on this poll." });
        }

        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id,
          },
        });

        const votes = await redis.zincrby(
          pollId,
          -1,
          userPreviousVoteOnPoll.pollOptionsId
        );

        voting.publish(pollId, {
          pollOptionsId: userPreviousVoteOnPoll.pollOptionsId,
          votes: Number(votes),
        });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      response.setCookie("sessionId", sessionId, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionsId,
      },
    });

    const votes = await redis.zincrby(pollId, 1, pollOptionsId);

    voting.publish(pollId, {
      pollOptionsId,
      votes: Number(votes),
    });

    return response.status(201).send();
  });
}
