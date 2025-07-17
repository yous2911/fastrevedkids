import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

const RevisionSchema = Type.Object({
  id: Type.Number(),
  studentId: Type.Number(),
  subjectId: Type.Number(),
  topic: Type.String(),
  dueDate: Type.String({ format: 'date-time' }),
  completed: Type.Boolean(),
});

type Revision = Static<typeof RevisionSchema>;

const revisions: Revision[] = [];

export default async function (fastify: FastifyInstance) {
  fastify.get('/revisions', (req, reply) => {
    reply.send(revisions);
  });

  fastify.post<{ Body: Revision }>('/revisions', (req, reply) => {
    const newRevision = req.body;
    revisions.push(newRevision);
    reply.code(201).send(newRevision);
  });
}
