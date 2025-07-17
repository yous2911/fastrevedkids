import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { students, exercises, modules, progress, sessions } from '../db/schema';
import { studentSchemas } from '../schemas/student.schema';
import { SpacedRepetitionService } from '../services/spaced-repetition.service';
import { RecommendationService } from '../services/recommendation.service';

export default async function studentRoutes(fastify: any) {
  const spacedRepetition = new SpacedRepetitionService(fastify.db, fastify.cache);
  const recommendations = new RecommendationService(fastify.db, fastify.cache);

  // Get student by ID
  fastify.get('/:id', {
    schema: studentSchemas.getStudent,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);

      if (isNaN(studentId) || studentId <= 0) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'ID élève invalide',
            code: 'INVALID_STUDENT_ID',
          },
        });
      }

      // Check if user can access this student data
      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        const student = await fastify.db
          .select({
            id: students.id,
            prenom: students.prenom,
            nom: students.nom,
            niveauActuel: students.niveauActuel,
            age: students.age,
            totalPoints: students.totalPoints,
            serieJours: students.serieJours,
            preferences: students.preferences,
            dernierAcces: students.dernierAcces,
            estConnecte: students.estConnecte,
          })
          .from(students)
          .where(eq(students.id, studentId))
          .limit(1);

        if (student.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: `Élève avec l'ID ${studentId} non trouvé`,
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        // Update last access
        await fastify.db
          .update(students)
          .set({ dernierAcces: new Date() })
          .where(eq(students.id, studentId));

        return reply.send({
          success: true,
          data: student[0],
          message: 'Données élève récupérées avec succès',
        });
      } catch (error) {
        fastify.log.error('Get student error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des données',
            code: 'GET_STUDENT_ERROR',
          },
        });
      }
    },
  });

  // Create/Update student
  fastify.post('/', {
    schema: studentSchemas.createStudent,
    handler: async (request: FastifyRequest<{
      Body: {
        prenom: string
        nom: string
        dateNaissance: string
        niveauActuel: string
        emailParent?: string
        motDePasse?: string
      }
    }>, reply: FastifyReply) => {
      const { prenom, nom, dateNaissance, niveauActuel, emailParent, motDePasse } = request.body;

      try {
        // Calculate age from birth date
        const birthDate = new Date(dateNaissance);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        // Hash password if provided
        let motDePasseHash: string | undefined;
        if (motDePasse) {
          const bcrypt = await import('bcrypt');
          motDePasseHash = await bcrypt.hash(motDePasse, 10);
        }

        // Create student
        const newStudent = await fastify.db
          .insert(students)
          .values({
            prenom,
            nom,
            dateNaissance: birthDate,
            age,
            niveauActuel: niveauActuel as any,
            emailParent,
            motDePasseHash,
            totalPoints: 0,
            serieJours: 0,
            preferences: {},
            adaptations: {},
            estConnecte: false,
          });

        return reply.status(201).send({
          success: true,
          data: {
            id: newStudent.insertId,
            prenom,
            nom,
            age,
            niveauActuel,
          },
          message: 'Élève créé avec succès',
        });
      } catch (error) {
        fastify.log.error('Create student error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la création de l\'élève',
            code: 'CREATE_STUDENT_ERROR',
          },
        });
      }
    },
  });

  // Update student
  fastify.put('/:id', {
    schema: studentSchemas.updateStudent,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
      Body: {
        prenom?: string
        nom?: string
        niveauActuel?: string
        emailParent?: string
        preferences?: Record<string, any>
        adaptations?: Record<string, any>
      }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        const updateData = { ...request.body };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        await fastify.db
          .update(students)
          .set(updateData)
          .where(eq(students.id, studentId));

        return reply.send({
          success: true,
          message: 'Élève mis à jour avec succès',
        });
      } catch (error) {
        fastify.log.error('Update student error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la mise à jour de l\'élève',
            code: 'UPDATE_STUDENT_ERROR',
          },
        });
      }
    },
  });

  // Delete student
  fastify.delete('/:id', {
    schema: studentSchemas.deleteStudent,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        // Delete student (cascade will handle related records)
        await fastify.db
          .delete(students)
          .where(eq(students.id, studentId));

        // Clear cache
        await fastify.cache.del([
          `session:${studentId}`,
          `recommendations:${studentId}:*`,
          `progress:${studentId}:*`,
        ]);

        return reply.send({
          success: true,
          message: 'Élève supprimé avec succès',
        });
      } catch (error) {
        fastify.log.error('Delete student error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la suppression de l\'élève',
            code: 'DELETE_STUDENT_ERROR',
          },
        });
      }
    },
  });

  // Get recommended exercises
  fastify.get('/:id/recommendations', {
    schema: studentSchemas.getRecommendations,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
      Querystring: { limit?: string; niveau?: string; matiere?: string }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);
      const limit = Math.min(parseInt(request.query.limit || '10'), 50);
      const niveau = request.query.niveau;
      const matiere = request.query.matiere;

      if (isNaN(studentId) || studentId <= 0) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'ID élève invalide',
            code: 'INVALID_STUDENT_ID',
          },
        });
      }

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        // Check cache first
        const cacheKey = `recommendations:${studentId}:${limit}:${niveau || 'all'}:${matiere || 'all'}`;
        const cached = await fastify.cache.get(cacheKey);
        if (cached) {
          return reply.send({
            success: true,
            data: JSON.parse(cached),
            message: 'Exercices recommandés (cache)',
          });
        }

        // Get recommendations
        const recommendedExercises = await recommendations.getRecommendations(
          studentId,
          { limit, niveau, matiere }
        );

        // Cache the results for 15 minutes
        await fastify.cache.set(cacheKey, JSON.stringify(recommendedExercises), 900);

        return reply.send({
          success: true,
          data: recommendedExercises,
          message: `${recommendedExercises.length} exercices recommandés`,
        });
      } catch (error) {
        fastify.log.error('Get recommendations error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Impossible de récupérer les recommandations',
            code: 'RECOMMENDATION_ERROR',
          },
        });
      }
    },
  });

  // Submit exercise attempt
  fastify.post('/:id/attempts', {
    schema: studentSchemas.submitAttempt,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
      Body: {
        exerciseId: number
        attempt: {
          reponse: any
          reussi: boolean
          tempsSecondes: number
          aidesUtilisees?: number
        }
      }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);
      const { exerciseId, attempt } = request.body;

      if (isNaN(studentId) || studentId <= 0) {
        return reply.status(400).send({
          success: false,
          error: {
            message: 'ID élève invalide',
            code: 'INVALID_STUDENT_ID',
          },
        });
      }

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        // Validate student exists
        const student = await fastify.db
          .select()
          .from(students)
          .where(eq(students.id, studentId))
          .limit(1);

        if (student.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: `Élève avec l'ID ${studentId} non trouvé`,
              code: 'STUDENT_NOT_FOUND',
            },
          });
        }

        // Validate exercise exists
        const exercise = await fastify.db
          .select()
          .from(exercises)
          .where(eq(exercises.id, exerciseId))
          .limit(1);

        if (exercise.length === 0) {
          return reply.status(404).send({
            success: false,
            error: {
              message: `Exercice avec l'ID ${exerciseId} non trouvé`,
              code: 'EXERCISE_NOT_FOUND',
            },
          });
        }

        const exerciseData = exercise[0];
        const { reponse, reussi, tempsSecondes, aidesUtilisees = 0 } = attempt;

        // Calculate points
        const pointsGagnes = reussi ? exerciseData.pointsReussite : 0;

        // Get or create progress record
        const existingProgress = await fastify.db
          .select()
          .from(progress)
          .where(and(
            eq(progress.studentId, studentId),
            eq(progress.exerciseId, exerciseId)
          ))
          .limit(1);

        const attemptRecord = {
          date: new Date().toISOString(),
          reussi,
          tempsSecondes,
          aidesUtilisees,
          pointsGagnes,
          reponse,
        };

        if (existingProgress.length === 0) {
          // Create new progress record
          await fastify.db.insert(progress).values({
            studentId,
            exerciseId,
            statut: reussi ? 'TERMINE' : 'EN_COURS',
            nombreTentatives: 1,
            nombreReussites: reussi ? 1 : 0,
            tauxReussite: reussi ? '100.00' : '0.00',
            pointsGagnes,
            derniereTentative: new Date(),
            premiereReussite: reussi ? new Date() : null,
            historique: [attemptRecord],
          });
        } else {
          // Update existing progress
          const currentProgress = existingProgress[0];
          const newTentatives = currentProgress.nombreTentatives + 1;
          const newReussites = currentProgress.nombreReussites + (reussi ? 1 : 0);
          const newTauxReussite = ((newReussites / newTentatives) * 100).toFixed(2);
          const newHistorique = [...(currentProgress.historique as any[]), attemptRecord];

          const updateData: any = {
            nombreTentatives: newTentatives,
            nombreReussites: newReussites,
            tauxReussite: newTauxReussite,
            pointsGagnes: currentProgress.pointsGagnes + pointsGagnes,
            derniereTentative: new Date(),
            historique: newHistorique,
          };

          // Update status based on performance
          if (reussi && newReussites >= 3 && parseFloat(newTauxReussite) >= 80) {
            updateData.statut = 'MAITRISE';
          } else if (reussi) {
            updateData.statut = 'TERMINE';
          } else if (newTentatives >= 5 && parseFloat(newTauxReussite) < 50) {
            updateData.statut = 'EN_COURS';
          }

          // Set first success date if this is the first success
          if (reussi && !currentProgress.premiereReussite) {
            updateData.premiereReussite = new Date();
          }

          await fastify.db
            .update(progress)
            .set(updateData)
            .where(and(
              eq(progress.studentId, studentId),
              eq(progress.exerciseId, exerciseId)
            ));
        }

        // Update student points
        await fastify.db
          .update(students)
          .set({
            totalPoints: student[0].totalPoints + pointsGagnes,
          })
          .where(eq(students.id, studentId));

        // Schedule spaced repetition if successful
        if (reussi) {
          await spacedRepetition.scheduleRevision(studentId, exerciseId, reussi);
        }

        // Invalidate recommendations cache
        const cachePattern = `recommendations:${studentId}:*`;
        await fastify.cache.del([cachePattern]);

        // Broadcast progress update via WebSocket
        if (fastify.broadcast) {
          fastify.broadcast({
            type: 'progress_update',
            studentId,
            exerciseId,
            reussi,
            pointsGagnes,
            totalPoints: student[0].totalPoints + pointsGagnes,
          });
        }

        return reply.send({
          success: true,
          data: {
            reussi,
            pointsGagnes,
            totalPoints: student[0].totalPoints + pointsGagnes,
            recommendations: reussi ? 'mise à jour programmée' : 'inchangées',
          },
          message: reussi ? 'Tentative réussie!' : 'Tentative enregistrée',
        });
      } catch (error) {
        fastify.log.error('Submit attempt error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de l\'enregistrement de la tentative',
            code: 'SUBMIT_ATTEMPT_ERROR',
          },
        });
      }
    },
  });

  // Get student progress
  fastify.get('/:id/progress', {
    schema: studentSchemas.getProgress,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
      Querystring: { matiere?: string; limit?: string }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);
      const matiere = request.query.matiere;
      const limit = parseInt(request.query.limit || '50');

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        // Build query with optional filters
        let query = fastify.db
          .select({
            id: progress.id,
            exerciseId: progress.exerciseId,
            statut: progress.statut,
            nombreTentatives: progress.nombreTentatives,
            nombreReussites: progress.nombreReussites,
            tauxReussite: progress.tauxReussite,
            pointsGagnes: progress.pointsGagnes,
            derniereTentative: progress.derniereTentative,
            premiereReussite: progress.premiereReussite,
            exerciseTitle: exercises.titre,
            exerciseType: exercises.type,
            exerciseDifficulty: exercises.difficulte,
            moduleTitle: modules.titre,
            moduleMatiere: modules.matiere,
          })
          .from(progress)
          .innerJoin(exercises, eq(progress.exerciseId, exercises.id))
          .innerJoin(modules, eq(exercises.moduleId, modules.id))
          .where(eq(progress.studentId, studentId))
          .orderBy(desc(progress.derniereTentative))
          .limit(limit);

        // Add matiere filter if specified
        if (matiere) {
          query = query.where(and(
            eq(progress.studentId, studentId),
            eq(modules.matiere, matiere as any)
          ));
        }

        const progressData = await query;

        return reply.send({
          success: true,
          data: progressData,
          message: 'Progression récupérée avec succès',
        });
      } catch (error) {
        fastify.log.error('Get progress error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération de la progression',
            code: 'GET_PROGRESS_ERROR',
          },
        });
      }
    },
  });

  // Get student sessions and analytics
  fastify.get('/:id/sessions', {
    schema: studentSchemas.getSessions,
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { id: string }
      Querystring: { limit?: string; days?: string }
    }>, reply: FastifyReply) => {
      const studentId = parseInt(request.params.id);
      const limit = parseInt(request.query.limit || '20');
      const _days = parseInt(request.query.days || '30');

      if (request.user.studentId !== studentId) {
        return reply.status(403).send({
          success: false,
          error: {
            message: 'Accès non autorisé',
            code: 'FORBIDDEN',
          },
        });
      }

      try {
        // Get recent sessions
        const recentSessions = await fastify.db
          .select()
          .from(sessions)
          .where(eq(sessions.studentId, studentId))
          .orderBy(desc(sessions.dateDebut))
          .limit(limit);

        // Calculate analytics
        const totalSessions = recentSessions.length;
        const totalTime = recentSessions.reduce((sum, session) => sum + session.dureeSecondes, 0);
        const totalExercises = recentSessions.reduce((sum, session) => sum + session.exercicesCompletes, 0);
        const totalPoints = recentSessions.reduce((sum, session) => sum + session.pointsGagnes, 0);

        const analytics = {
          totalSessions,
          totalTimeMinutes: Math.round(totalTime / 60),
          totalExercises,
          totalPoints,
          averageSessionTime: totalSessions > 0 ? Math.round(totalTime / totalSessions / 60) : 0,
          averageExercisesPerSession: totalSessions > 0 ? Math.round(totalExercises / totalSessions) : 0,
          averagePointsPerSession: totalSessions > 0 ? Math.round(totalPoints / totalSessions) : 0,
        };

        return reply.send({
          success: true,
          data: {
            sessions: recentSessions,
            analytics,
          },
          message: 'Sessions et analytics récupérés avec succès',
        });
      } catch (error) {
        fastify.log.error('Get sessions error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des sessions',
            code: 'GET_SESSIONS_ERROR',
          },
        });
      }
    },
  });
} 