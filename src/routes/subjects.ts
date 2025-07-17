import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

const SubjectSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  teacher: Type.String(),
});

type Subject = Static<typeof SubjectSchema>;

const subjects: Subject[] = [];

export default async function (fastify: FastifyInstance) {
  fastify.get('/subjects', (req, reply) => {
    reply.send(subjects);
  });

  fastify.post<{ Body: Subject }>('/subjects', (req, reply) => {
    const newSubject = req.body;
    subjects.push(newSubject);
    reply.code(201).send(newSubject);
  });
}
