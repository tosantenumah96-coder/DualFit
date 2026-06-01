const { deleteRows, selectRows, upsertRows } = require("./supabase-rest");

const saveProfile = async (accessToken, profile) => {
  if (!profile?.user_id) {
    throw new Error("Profile sync requires user_id.");
  }

  const payload = {
    user_id: profile.user_id,
    first_name: profile.first_name || "",
    sex: profile.sex || "",
    age: profile.age ?? null,
    height: profile.height || "",
    weight_lbs: profile.weight_lbs || "",
    goal_type: profile.goal_type || "",
    target_calories: profile.target_calories ?? null,
    target_protein: profile.target_protein ?? null,
    target_carbs: profile.target_carbs ?? null,
    target_fat: profile.target_fat ?? null,
    activity_level: profile.activity_level || "",
    profile_photo_uri: profile.profile_photo_uri || "",
    updated_at: new Date().toISOString(),
  };

  try {
    const rows = await upsertRows("profiles", [payload], accessToken, "user_id");
    return rows?.[0] || null;
  } catch (error) {
    if (String(error?.message || "").toLowerCase().includes("profile_photo_uri")) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.profile_photo_uri;
      const rows = await upsertRows("profiles", [fallbackPayload], accessToken, "user_id");
      return rows?.[0] || null;
    }
    throw error;
  }
};

const replaceAllWorkoutTemplates = async (accessToken, userId, payload = {}) => {
  await deleteRows("workout_templates", accessToken, {
    user_id: userId,
  });

  if (!payload?.templates?.length) {
    return { templates: [], exercises: [], sets: [] };
  }

  const templates = await upsertRows("workout_templates", payload.templates, accessToken, "id");
  const exercises = payload.exercises?.length
    ? await upsertRows("workout_template_exercises", payload.exercises, accessToken, "id")
    : [];
  const sets = payload.sets?.length
    ? await upsertRows("workout_template_sets", payload.sets, accessToken, "id")
    : [];

  return { templates, exercises, sets };
};

const replaceAllTrainingPrograms = async (accessToken, userId, payload = {}) => {
  await deleteRows("training_programs", accessToken, {
    user_id: userId,
  });

  if (!payload?.programs?.length) {
    return { programs: [], days: [] };
  }

  const programs = await upsertRows("training_programs", payload.programs, accessToken, "id");
  const days = payload.days?.length
    ? await upsertRows("training_program_days", payload.days, accessToken, "id")
    : [];

  return { programs, days };
};

const replaceAllCompletedWorkouts = async (accessToken, userId, payload = {}) => {
  await deleteRows("completed_workouts", accessToken, {
    user_id: userId,
  });

  if (!payload?.workouts?.length) {
    return { workouts: [], exercises: [], sets: [] };
  }

  const workouts = await upsertRows("completed_workouts", payload.workouts, accessToken, "id");
  const exercises = payload.exercises?.length
    ? await upsertRows("completed_workout_exercises", payload.exercises, accessToken, "id")
    : [];
  const sets = payload.sets?.length
    ? await upsertRows("completed_workout_sets", payload.sets, accessToken, "id")
    : [];

  return { workouts, exercises, sets };
};

const loadProfile = async (accessToken, userId) => {
  const rows = await selectRows("profiles", accessToken, `user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  return rows?.[0] || null;
};

const loadAllWorkoutTemplates = async (accessToken, userId) => {
  const templates = await selectRows(
    "workout_templates",
    accessToken,
    `user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`
  );

  if (!templates.length) {
    return { templates: [], exercises: [], sets: [] };
  }

  const templateIds = templates.map((row) => row.id);
  const templateIdFilter = templateIds.map((id) => `"${id}"`).join(",");
  const exercises = await selectRows(
    "workout_template_exercises",
    accessToken,
    `template_id=in.(${templateIdFilter})&order=order_index.asc`
  );

  if (!exercises.length) {
    return { templates, exercises: [], sets: [] };
  }

  const exerciseIds = exercises.map((row) => row.id);
  const exerciseIdFilter = exerciseIds.map((id) => `"${id}"`).join(",");
  const sets = await selectRows(
    "workout_template_sets",
    accessToken,
    `template_exercise_id=in.(${exerciseIdFilter})&order=set_number.asc`
  );

  return { templates, exercises, sets };
};

const loadAllTrainingPrograms = async (accessToken, userId) => {
  const programs = await selectRows(
    "training_programs",
    accessToken,
    `user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`
  );

  if (!programs.length) {
    return { programs: [], days: [] };
  }

  const programIds = programs.map((row) => row.id);
  const programIdFilter = programIds.map((id) => `"${id}"`).join(",");
  const days = await selectRows(
    "training_program_days",
    accessToken,
    `program_id=in.(${programIdFilter})&order=order_index.asc`
  );

  return { programs, days };
};

const loadAllDiaryEntries = async (accessToken, userId) =>
  selectRows("diary_entries", accessToken, `user_id=eq.${encodeURIComponent(userId)}&order=created_at.asc`);

const insertDiaryEntries = async (accessToken, entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  return upsertRows(
    "diary_entries",
    entries.map(({ id, ...entry }) => entry),
    accessToken
  );
};

const replaceDiaryEntriesForDate = async (accessToken, userId, dateKey, entries = []) => {
  await deleteRows("diary_entries", accessToken, {
    user_id: userId,
    date_key: dateKey,
  });

  if (!entries.length) {
    return [];
  }

  return insertDiaryEntries(accessToken, entries);
};

const replaceAllDiaryEntries = async (accessToken, userId, entries = []) => {
  await deleteRows("diary_entries", accessToken, {
    user_id: userId,
  });

  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  return insertDiaryEntries(accessToken, entries);
};

const loadDiaryEntriesForDate = async (accessToken, userId, dateKey) =>
  selectRows(
    "diary_entries",
    accessToken,
    `user_id=eq.${encodeURIComponent(userId)}&date_key=eq.${encodeURIComponent(dateKey)}&order=created_at.asc`
  );

const replaceAllCheckIns = async (accessToken, userId, payload = []) => {
  const checkIns = Array.isArray(payload) ? payload : payload?.checkIns || [];
  const photoRows = Array.isArray(payload) ? [] : payload?.photos || [];

  await deleteRows("check_in_photos", accessToken, {
    user_id: userId,
  });

  await deleteRows("check_ins", accessToken, {
    user_id: userId,
  });

  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return { checkIns: [], photos: [] };
  }

  const syncedCheckIns = await upsertRows(
    "check_ins",
    checkIns.map((entry) => ({
      id: entry.id,
      user_id: entry.user_id,
      date_key: entry.date_key,
      weight_lbs: entry.weight_lbs ?? null,
      notes: entry.notes || "",
      created_at: entry.created_at || new Date().toISOString(),
      updated_at: entry.updated_at || new Date().toISOString(),
    })),
    accessToken,
    "id"
  );

  const syncedPhotos = photoRows.length
    ? await upsertRows("check_in_photos", photoRows, accessToken, "id")
    : [];

  return { checkIns: syncedCheckIns, photos: syncedPhotos };
};

const loadCheckIns = async (accessToken, userId) => {
  const checkIns = await selectRows("check_ins", accessToken, `user_id=eq.${encodeURIComponent(userId)}&order=date_key.desc`);
  if (!checkIns.length) {
    return [];
  }

  const checkInIds = checkIns.map((row) => row.id);
  const checkInIdFilter = checkInIds.map((id) => `"${id}"`).join(",");
  const photos = await selectRows(
    "check_in_photos",
    accessToken,
    `check_in_id=in.(${checkInIdFilter})&order=created_at.asc`
  );
  const photosByCheckIn = new Map();
  photos.forEach((photo) => {
    const bucket = photosByCheckIn.get(photo.check_in_id) || [];
    bucket.push(photo);
    photosByCheckIn.set(photo.check_in_id, bucket);
  });

  return checkIns.map((row) => ({
    ...row,
    photos: photosByCheckIn.get(row.id) || [],
  }));
};

const loadAllCompletedWorkouts = async (accessToken, userId) => {
  const workouts = await selectRows(
    "completed_workouts",
    accessToken,
    `user_id=eq.${encodeURIComponent(userId)}&order=completed_at.desc.nullslast,created_at.desc`
  );

  if (!workouts.length) {
    return { workouts: [], exercises: [], sets: [] };
  }

  const workoutIds = workouts.map((row) => row.id);
  const workoutIdFilter = workoutIds.map((id) => `"${id}"`).join(",");
  const exercises = await selectRows(
    "completed_workout_exercises",
    accessToken,
    `completed_workout_id=in.(${workoutIdFilter})&order=order_index.asc`
  );

  if (!exercises.length) {
    return { workouts, exercises: [], sets: [] };
  }

  const exerciseIds = exercises.map((row) => row.id);
  const exerciseIdFilter = exerciseIds.map((id) => `"${id}"`).join(",");
  const sets = await selectRows(
    "completed_workout_sets",
    accessToken,
    `completed_workout_exercise_id=in.(${exerciseIdFilter})&order=set_number.asc`
  );

  return { workouts, exercises, sets };
};

module.exports = {
  saveProfile,
  loadProfile,
  replaceAllWorkoutTemplates,
  replaceAllTrainingPrograms,
  replaceAllCompletedWorkouts,
  loadAllWorkoutTemplates,
  loadAllTrainingPrograms,
  loadAllDiaryEntries,
  insertDiaryEntries,
  replaceDiaryEntriesForDate,
  replaceAllDiaryEntries,
  loadDiaryEntriesForDate,
  replaceAllCheckIns,
  loadCheckIns,
  loadAllCompletedWorkouts,
};
