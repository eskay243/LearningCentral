// Exercise tracking methods
async getCodingExercisesCount(): Promise<number> {
  try {
    const result = await db.select({ count: sql`count(*)` }).from(codingExercises);
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error counting coding exercises:", error);
    return 0;
  }
}

async getCodingExercisesByDifficulty(): Promise<Record<string, number>> {
  try {
    const result = await db
      .select({
        difficulty: codingExercises.difficulty,
        count: sql`count(*)`,
      })
      .from(codingExercises)
      .groupBy(codingExercises.difficulty);

    const countByDifficulty: Record<string, number> = {};
    for (const row of result) {
      countByDifficulty[row.difficulty] = Number(row.count);
    }
    return countByDifficulty;
  } catch (error) {
    console.error("Error counting exercises by difficulty:", error);
    return {};
  }
}

async getExerciseProgress(exerciseId: number, userId: string): Promise<ExerciseProgress | undefined> {
  try {
    const [progress] = await db
      .select()
      .from(exerciseProgress)
      .where(
        and(
          eq(exerciseProgress.exerciseId, exerciseId),
          eq(exerciseProgress.userId, userId)
        )
      );
    return progress;
  } catch (error) {
    console.error("Error fetching exercise progress:", error);
    return undefined;
  }
}

async updateExerciseProgress(
  exerciseId: number, 
  userId: string, 
  progressData: Partial<ExerciseProgress>
): Promise<ExerciseProgress> {
  try {
    // First check if progress exists
    const existingProgress = await this.getExerciseProgress(exerciseId, userId);
    
    let progress: ExerciseProgress;
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(exerciseProgress)
        .set({
          ...progressData,
          lastAttemptAt: new Date(),
          attemptCount: progressData.attemptCount !== undefined ? 
            progressData.attemptCount : 
            existingProgress.attemptCount + 1
        })
        .where(
          and(
            eq(exerciseProgress.exerciseId, exerciseId),
            eq(exerciseProgress.userId, userId)
          )
        )
        .returning();
      
      progress = updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(exerciseProgress)
        .values({
          exerciseId,
          userId,
          status: progressData.status || "in_progress",
          currentCode: progressData.currentCode,
          lastAttemptAt: new Date(),
          attemptCount: 1,
          hintsUsed: progressData.hintsUsed || 0,
          timeSpent: progressData.timeSpent || 0,
        })
        .returning();
      
      progress = newProgress;
    }
    
    return progress;
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    throw error;
  }
}

async getUserExerciseProgress(userId: string): Promise<ExerciseProgress[]> {
  try {
    const progress = await db
      .select()
      .from(exerciseProgress)
      .where(eq(exerciseProgress.userId, userId));
    
    return progress;
  } catch (error) {
    console.error("Error fetching user exercise progress:", error);
    return [];
  }
}

async getExerciseStatsByCourse(courseId: number): Promise<any[]> {
  try {
    // Get all exercises for this course
    const exercises = await db
      .select()
      .from(codingExercises)
      .where(eq(codingExercises.courseId, courseId));
    
    if (exercises.length === 0) {
      return [];
    }
    
    const exerciseIds = exercises.map(ex => ex.id);
    
    // Get all progress entries for these exercises
    const allProgress = await db
      .select({
        exerciseId: exerciseProgress.exerciseId,
        status: exerciseProgress.status,
        attemptCount: exerciseProgress.attemptCount,
        completedAt: exerciseProgress.completedAt,
      })
      .from(exerciseProgress)
      .where(inArray(exerciseProgress.exerciseId, exerciseIds));
    
    // Organize stats by exercise
    const stats = exercises.map(exercise => {
      const exerciseProgress = allProgress.filter(p => p.exerciseId === exercise.id);
      
      const totalAttempts = exerciseProgress.length;
      const completedCount = exerciseProgress.filter(p => p.status === "completed").length;
      const inProgressCount = exerciseProgress.filter(p => p.status === "in_progress").length;
      const notStartedCount = 0; // This is implied rather than stored
      
      const avgAttempts = totalAttempts > 0 
        ? exerciseProgress.reduce((sum, p) => sum + p.attemptCount, 0) / totalAttempts 
        : 0;
      
      return {
        exerciseId: exercise.id,
        title: exercise.title,
        difficulty: exercise.difficulty,
        language: exercise.language,
        totalAttempts,
        completedCount,
        inProgressCount,
        notStartedCount,
        avgAttempts,
        completionRate: totalAttempts > 0 ? (completedCount / totalAttempts) * 100 : 0,
      };
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching exercise stats by course:", error);
    return [];
  }
}

async getExerciseStatsByMentor(mentorId: string): Promise<any[]> {
  try {
    // Get courses taught by this mentor
    const mentorCourseIds = await db
      .select({ courseId: mentorCourses.courseId })
      .from(mentorCourses)
      .where(eq(mentorCourses.mentorId, mentorId));
    
    const courseIds = mentorCourseIds.map(mc => mc.courseId);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Combine stats from all courses
    const allStats = [];
    for (const courseId of courseIds) {
      const courseStats = await this.getExerciseStatsByCourse(courseId);
      allStats.push(...courseStats);
    }
    
    return allStats;
  } catch (error) {
    console.error("Error fetching exercise stats by mentor:", error);
    return [];
  }
}