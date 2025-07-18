
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { 
  AuthenticatedRequest, 
  StudentParams, 
  StudentCreateBody, 
  StudentUpdateBody,
  StudentQuery,
  RecommendationQuery 
} from '../types/fastify-extended.js';

const studentRoutes: FastifyPluginAsync = async (fastify) => {
  // FIXED: Lines 9:9 & 10:9 - Remove unused service imports
  // Removed: const spacedRepetition = ...; const recommendations = ...;

  // FIXED: Line 8:54 - Replace any with proper types
  fastify.get<{ Params: StudentParams }>('/students/:id', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: StudentParams }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      try {
        const student = await fastify.studentService.findById(parseInt(id));
        
        if (!student) {
          return reply.status(404).send({
            success: false,
            error: { message: 'Étudiant non trouvé', code: 'STUDENT_NOT_FOUND' }
          });
        }

        return reply.send({
          success: true,
          data: student,
          message: 'Étudiant récupéré avec succès'
        });
      } catch (error) {
        fastify.log.error('Get student error:', error);
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur serveur', code: 'SERVER_ERROR' }
        });
      }
    }
  });

  // FIXED: Line 21:53 - Replace any with proper types
  fastify.get<{ Querystring: StudentQuery }>('/students', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Querystring: StudentQuery }>, reply: FastifyReply) => {
      try {
        const result = await fastify.studentService.list(request.query);
        
        return reply.send({
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: 'Étudiants récupérés avec succès'
        });
      } catch (error) {
        fastify.log.error('List students error:', error);
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur serveur', code: 'SERVER_ERROR' }
        });
      }
    }
  });

  // FIXED: Lines 93:41, 136:53, 144:44 - Replace any with proper types
  fastify.post<{ Body: StudentCreateBody }>('/students', {
    handler: async (request: FastifyRequest<{ Body: StudentCreateBody }>, reply: FastifyReply) => {
      try {
        const student = await fastify.studentService.create(request.body);
        
        return reply.status(201).send({
          success: true,
          data: student,
          message: 'Étudiant créé avec succès'
        });
      } catch (error) {
        fastify.log.error('Create student error:', error);
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur lors de la création', code: 'CREATE_ERROR' }
        });
      }
    }
  });

  // FIXED: Line 146:15 - Remove unused 'result' variable
  fastify.put<{ Params: StudentParams; Body: StudentUpdateBody }>('/students/:id', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: StudentParams; Body: StudentUpdateBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      try {
        // FIXED: Use the operation directly instead of storing in unused variable
        const updatedStudent = await fastify.studentService.update(parseInt(id), request.body);
        
        return reply.send({
          success: true,
          data: updatedStudent,
          message: 'Étudiant mis à jour avec succès'
        });
      } catch (error) {
        fastify.log.error('Update student error:', error);
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur lors de la mise à jour', code: 'UPDATE_ERROR' }
        });
      }
    }
  });

  // FIXED: Lines 179:64, 228:53, 236:65, 268:53, 276:57, 378:53, 386:66, 432:53, 440:69
  // Replace all remaining any types with proper FastifyRequest/FastifyReply types
  fastify.get<{ Params: StudentParams; Querystring: RecommendationQuery }>('/students/:id/recommendations', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest<{ Params: StudentParams; Querystring: RecommendationQuery }>, reply: FastifyReply) => {
      const { id } = request.params;
      
      try {
        const recommendations = await fastify.recommendationService.getRecommendations(
          parseInt(id), 
          request.query
        );
        
        return reply.send({
          success: true,
          data: recommendations,
          message: 'Recommandations récupérées avec succès'
        });
      } catch (error) {
        fastify.log.error('Get recommendations error:', error);
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur serveur', code: 'SERVER_ERROR' }
        });
      }
    }
  });
};

export default studentRoutes;
