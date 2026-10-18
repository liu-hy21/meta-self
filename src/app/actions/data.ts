"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FinanceLiteracyKind,
  RelationKind,
  TechStackStatus,
} from "@prisma/client";
import { z } from "zod";

import { articleTopicLabel } from "@/lib/library-article";
import { getAppUserId } from "@/lib/user";
import { calendarDateInTimezone } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { generateReportForUser } from "@/lib/reports/generate";

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/body/profile");
  revalidatePath("/body/log");
  revalidatePath("/body/advice-log");
  revalidatePath("/mind/profile");
  revalidatePath("/mind/log");
  revalidatePath("/work/profile");
  revalidatePath("/work/log");
  revalidatePath("/relation/profile");
  revalidatePath("/relation/log");
  revalidatePath("/finance/profile");
  revalidatePath("/finance/log");
  revalidatePath("/body/sleep");
  revalidatePath("/body/meals");
  revalidatePath("/body/vitals");
  revalidatePath("/library/article", "layout");
}

export async function upsertBodyProfile(formData: FormData) {
  const userId = await getAppUserId();
  const heightCm = formData.get("heightCm");
  const weightKg = formData.get("weightKg");
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const bloodType = String(formData.get("bloodType") ?? "").trim() || null;
  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  const birthDate = birthRaw ? new Date(`${birthRaw}T00:00:00.000Z`) : null;
  const profileData = {
    heightCm: heightCm ? Number(heightCm) : null,
    weightKg: weightKg ? Number(weightKg) : null,
    birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
    gender,
    bloodType,
    chestCm: optionalNumber(formData, "chestCm"),
    waistCm: optionalNumber(formData, "waistCm"),
    thighCm: optionalNumber(formData, "thighCm"),
  };

  await prisma.bodyProfile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });
  revalidateApp();
  redirect("/body/profile");
}

function optionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function optionalText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim() || null;
}

function optionalCents(formData: FormData, key: string) {
  const value = optionalNumber(formData, key);
  if (value == null) return null;
  return Math.round(value * 100);
}

export async function upsertBodyDiet(formData: FormData) {
  const userId = await getAppUserId();
  const data = {
    proteinFoods: optionalText(formData, "proteinFoods"),
    fatFoods: optionalText(formData, "fatFoods"),
    carbFoods: optionalText(formData, "carbFoods"),
    vitaminFoods: optionalText(formData, "vitaminFoods"),
  };
  await prisma.bodyDiet.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/body/profile");
}

export async function upsertBodySleepHabit(formData: FormData) {
  const userId = await getAppUserId();
  const data = {
    durationHours: optionalNumber(formData, "durationHours"),
    bedtime: optionalText(formData, "bedtime"),
    wakeTime: optionalText(formData, "wakeTime"),
    quality: optionalText(formData, "quality"),
  };
  await prisma.bodySleepHabit.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/body/profile");
}

export async function upsertBodyExam(formData: FormData) {
  const userId = await getAppUserId();
  const examRaw = optionalText(formData, "examDate");
  const examDate = examRaw ? new Date(`${examRaw}T00:00:00.000Z`) : null;
  const keys = [
    "heart",
    "lung",
    "liver",
    "gallbladder",
    "spleen",
    "kidney",
    "thyroid",
    "wbc",
    "rbc",
    "hemoglobin",
    "platelets",
    "urineProtein",
    "urineGlucose",
    "urineBlood",
    "glucose",
    "uricAcid",
    "cholesterol",
    "triglycerides",
    "ldl",
    "alt",
    "creatinine",
    "systolic",
    "diastolic",
    "restingHeartRate",
  ] as const;
  const data = {
    examDate: examDate && !Number.isNaN(examDate.getTime()) ? examDate : null,
    ...Object.fromEntries(keys.map((key) => [key, optionalText(formData, key)])),
  };
  await prisma.bodyExam.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/body/profile");
}

export async function upsertMindProfile(formData: FormData) {
  const userId = await getAppUserId();
  const level = optionalNumber(formData, "emotionLevel");
  const data = {
    emotionWords: optionalText(formData, "emotionWords"),
    emotionLevel: level != null && level >= 1 && level <= 5 ? Math.round(level) : null,
    psycheNote: optionalText(formData, "psycheNote"),
    stressNote: optionalText(formData, "stressNote"),
  };
  await prisma.mindProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/mind/profile");
}

export async function createMindInfoLog(formData: FormData) {
  const userId = await getAppUserId();
  const emotion = optionalText(formData, "emotion");
  const psyche = optionalText(formData, "psyche");
  if (!emotion && !psyche) return;

  await prisma.mindInfoLog.create({
    data: { userId, writtenOn: new Date(), emotion, psyche },
  });
  revalidateApp();
  redirect("/mind/log");
}

export async function upsertWorkProfile(formData: FormData) {
  const userId = await getAppUserId();
  const data = {
    companyName: optionalText(formData, "companyName"),
    department: optionalText(formData, "department"),
    role: optionalText(formData, "role"),
    joinedOn: optionalText(formData, "joinedOn"),
    proficient: optionalText(formData, "proficient"),
    learning: optionalText(formData, "learning"),
    retired: optionalText(formData, "retired"),
    studyHistory: optionalText(formData, "studyHistory"),
  };
  await prisma.workProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/work/profile");
}

export async function createWorkInfoLog(formData: FormData) {
  const userId = await getAppUserId();
  const occasion = optionalText(formData, "occasion");
  const outcome = optionalText(formData, "outcome");
  const nextChange = optionalText(formData, "nextChange");
  if (!occasion && !outcome && !nextChange) return;

  await prisma.workInfoLog.create({
    data: { userId, writtenOn: new Date(), occasion, outcome, nextChange },
  });
  revalidateApp();
  redirect("/work/log");
}

export async function upsertRelationProfile(formData: FormData) {
  const userId = await getAppUserId();
  const data = {
    friends: optionalText(formData, "friends"),
    romance: optionalText(formData, "romance"),
    family: optionalText(formData, "family"),
    other: optionalText(formData, "other"),
  };
  await prisma.relationProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/relation/profile");
}

export async function createRelationInfoLog(formData: FormData) {
  const userId = await getAppUserId();
  const person = optionalText(formData, "person");
  const happened = optionalText(formData, "happened");
  const feelingRaw = optionalNumber(formData, "feeling");
  const feeling = feelingRaw != null && feelingRaw >= 1 && feelingRaw <= 5 ? Math.round(feelingRaw) : null;
  if (!person && !happened && feeling == null) return;

  await prisma.relationInfoLog.create({
    data: { userId, writtenOn: new Date(), person, happened, feeling },
  });
  revalidateApp();
  redirect("/relation/log");
}

export async function upsertFinanceProfile(formData: FormData) {
  const userId = await getAppUserId();
  const data = {
    cashCents: optionalCents(formData, "cashYuan"),
    investmentCents: optionalCents(formData, "investmentYuan"),
    liabilityCents: optionalCents(formData, "liabilityYuan"),
  };
  await prisma.financeProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  revalidateApp();
  redirect("/finance/profile");
}

export async function createPlayDistrict(formData: FormData) {
  const userId = await getAppUserId();
  const district = optionalText(formData, "district");
  const project = optionalText(formData, "project");
  if (!district || !project) return;
  await prisma.playDistrict.create({ data: { userId, district, project } });
  revalidateApp();
  redirect("/finance/profile?tab=play");
}

export async function createLibraryArticleEntry(formData: FormData) {
  const userId = await getAppUserId();
  const topic = optionalText(formData, "topic");
  const body = optionalText(formData, "body");
  if (!topic || !articleTopicLabel(topic) || !body) return;
  await prisma.libraryArticleEntry.create({
    data: {
      userId,
      topic,
      body,
    },
  });
  revalidateApp();
  redirect(`/library/article/${topic}`);
}

function optionalDate(formData: FormData, key: string) {
  const raw = optionalText(formData, key);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortAt(date: string, time: string | null) {
  const clock = time && /^\d{2}:\d{2}$/.test(time) ? time : "12:00";
  const value = new Date(`${date}T${clock}:00+08:00`);
  return Number.isNaN(value.getTime()) ? new Date() : value;
}

export async function createTrip(formData: FormData) {
  const userId = await getAppUserId();
  const title = optionalText(formData, "title");
  if (!title) return;
  const trip = await prisma.trip.create({
    data: {
      userId,
      title,
      traveler: optionalText(formData, "traveler"),
      note: optionalText(formData, "note"),
    },
  });
  revalidateApp();
  redirect(`/finance/profile?tab=play&edit=travel&trip=${trip.id}`);
}

export async function createTripEntry(formData: FormData) {
  const userId = await getAppUserId();
  const tripId = optionalText(formData, "tripId");
  const kind = optionalText(formData, "kind");
  if (!tripId || !kind) return;
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) return;

  const back = `/finance/profile?tab=play&edit=travel&trip=${tripId}`;
  if (kind === "flight") {
    const day = optionalText(formData, "date");
    const origin = optionalText(formData, "origin");
    const destination = optionalText(formData, "destination");
    if (!day || !origin || !destination) return;
    await prisma.tripEntry.create({
      data: {
        tripId,
        kind,
        sortAt: sortAt(day, optionalText(formData, "departTime")),
        happenedOn: optionalDate(formData, "date"),
        origin,
        destination,
        flightNo: optionalText(formData, "flightNo"),
        cabin: optionalText(formData, "cabin"),
        departTime: optionalText(formData, "departTime"),
        arriveTime: optionalText(formData, "arriveTime"),
        terminal: optionalText(formData, "terminal"),
        fareCents: optionalCents(formData, "fareYuan"),
        taxCents: optionalCents(formData, "taxYuan"),
        totalCents: optionalCents(formData, "totalYuan"),
        baggage: optionalText(formData, "baggage"),
        remark: optionalText(formData, "remark"),
      },
    });
  } else if (kind === "hotel") {
    const hotelName = optionalText(formData, "hotelName");
    const checkIn = optionalDate(formData, "checkIn");
    if (!hotelName || !checkIn) return;
    const checkOut = optionalDate(formData, "checkOut");
    const nightsRaw = optionalNumber(formData, "nights");
    await prisma.tripEntry.create({
      data: {
        tripId,
        kind,
        sortAt: checkIn,
        hotelName,
        checkIn,
        checkOut,
        nights: nightsRaw == null ? null : Math.round(nightsRaw),
        paidCents: optionalCents(formData, "paidYuan"),
        includes: optionalText(formData, "includes"),
      },
    });
  } else if (kind === "event") {
    const day = optionalText(formData, "date");
    const body = optionalText(formData, "body");
    if (!day || !body) return;
    await prisma.tripEntry.create({
      data: {
        tripId,
        kind,
        sortAt: sortAt(day, null),
        happenedOn: optionalDate(formData, "date"),
        body,
      },
    });
  } else {
    return;
  }

  revalidateApp();
  redirect(back);
}

export async function createFinanceInfoLog(formData: FormData) {
  const userId = await getAppUserId();
  const learned = optionalText(formData, "learned");
  const decision = optionalText(formData, "decision");
  const outcome = optionalText(formData, "outcome");
  if (!learned && !decision && !outcome) return;

  await prisma.financeInfoLog.create({
    data: { userId, writtenOn: new Date(), learned, decision, outcome },
  });
  revalidateApp();
  redirect("/finance/log");
}

export async function createBodyInfoLog(formData: FormData) {
  const userId = await getAppUserId();
  const body = optionalText(formData, "body");
  const diet = optionalText(formData, "diet");
  const sleep = optionalText(formData, "sleep");
  const exam = optionalText(formData, "exam");
  if (!body && !diet && !sleep && !exam) return;

  await prisma.bodyInfoLog.create({
    data: { userId, writtenOn: new Date(), body, diet, sleep, exam },
  });
  revalidateApp();
  redirect("/body/log");
}

export async function createMedicalVisitLog(formData: FormData) {
  const userId = await getAppUserId();
  const visitedRaw = optionalText(formData, "visitedOn");
  const visitedOn = visitedRaw ? new Date(`${visitedRaw}T12:00:00.000+08:00`) : new Date();
  const hospital = optionalText(formData, "hospital");
  const department = optionalText(formData, "department");
  const note = optionalText(formData, "note");
  if (!note && !hospital && !department) return;
  if (visitedRaw && Number.isNaN(visitedOn.getTime())) return;

  await prisma.medicalVisitLog.create({
    data: {
      userId,
      visitedOn: Number.isNaN(visitedOn.getTime()) ? new Date() : visitedOn,
      hospital,
      department,
      note,
    },
  });
  revalidateApp();
  redirect("/body/log");
}

export async function createSleepLog(formData: FormData) {
  const userId = await getAppUserId();
  const durationHours = Number(formData.get("durationHours"));
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!durationHours || durationHours <= 0) return;

  await prisma.sleepLog.create({
    data: {
      userId,
      occurredAt: new Date(),
      durationHours,
      note,
    },
  });
  revalidateApp();
}

export async function createMealLog(formData: FormData) {
  const userId = await getAppUserId();
  const description = String(formData.get("description") ?? "").trim();
  const satietyRaw = formData.get("satiety");
  if (!description) return;

  await prisma.mealLog.create({
    data: {
      userId,
      occurredAt: new Date(),
      description,
      satiety: satietyRaw ? Number(satietyRaw) : null,
    },
  });
  revalidateApp();
}

export async function createVitalMetric(formData: FormData) {
  const userId = await getAppUserId();
  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  if (!name || !value) return;

  await prisma.vitalMetric.create({
    data: {
      userId,
      name,
      value,
      unit,
      measuredAt: new Date(),
    },
  });
  revalidateApp();
}

export async function upsertMoodLog(formData: FormData) {
  const userId = await getAppUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });
  const score = Number(formData.get("score"));
  const note = String(formData.get("note") ?? "").trim() || null;
  if (score < 1 || score > 5) return;

  const calendarDate = calendarDateInTimezone(new Date(), user.timezone);

  await prisma.moodLog.upsert({
    where: { userId_calendarDate: { userId, calendarDate } },
    create: {
      userId,
      calendarDate,
      score,
      note,
      occurredAt: new Date(),
    },
    update: { score, note, occurredAt: new Date() },
  });
  revalidateApp();
}

export async function setCompanySnapshot(formData: FormData) {
  const userId = await getAppUserId();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!companyName) return;

  await prisma.$transaction([
    prisma.workCompanySnapshot.updateMany({
      where: { userId, isCurrent: true },
      data: { isCurrent: false },
    }),
    prisma.workCompanySnapshot.create({
      data: {
        userId,
        companyName,
        role,
        note,
        isCurrent: true,
      },
    }),
  ]);
  revalidateApp();
}

export async function upsertTechStackItem(formData: FormData) {
  const userId = await getAppUserId();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status")) as TechStackStatus;
  if (!name || !status) return;

  await prisma.techStackItem.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name, status },
    update: { status },
  });
  revalidateApp();
}

export async function createExpressionReview(formData: FormData) {
  const userId = await getAppUserId();
  const context = String(formData.get("context") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim() || null;
  const nextImprovement =
    String(formData.get("nextImprovement") ?? "").trim() || null;
  if (!context) return;

  await prisma.expressionReview.create({
    data: {
      userId,
      occurredAt: new Date(),
      context,
      outcome,
      nextImprovement,
    },
  });
  revalidateApp();
}

export async function createRelationPerson(formData: FormData) {
  const userId = await getAppUserId();
  const name = String(formData.get("name") ?? "").trim();
  const kinds = formData.getAll("kinds") as RelationKind[];
  if (!name || kinds.length === 0) return;

  const person = await prisma.relationPerson.create({
    data: { userId, name },
  });
  await prisma.relationPersonKind.createMany({
    data: kinds.map((kind) => ({ personId: person.id, kind })),
  });
  revalidateApp();
}

export async function createRelationInteraction(formData: FormData) {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const feelingScore = Number(formData.get("feelingScore"));
  if (!personId || !note || feelingScore < 1 || feelingScore > 5) return;

  await prisma.relationInteraction.create({
    data: {
      userId,
      personId,
      occurredAt: new Date(),
      note,
      feelingScore,
    },
  });
  revalidateApp();
}

export async function createAssetSnapshot(formData: FormData) {
  const userId = await getAppUserId();
  const cash = Number(formData.get("cashYuan") ?? 0);
  const investment = Number(formData.get("investmentYuan") ?? 0);
  const liability = Number(formData.get("liabilityYuan") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.financeAssetSnapshot.create({
    data: {
      userId,
      asOfDate: new Date(),
      cashCents: Math.round(cash * 100),
      investmentCents: Math.round(investment * 100),
      liabilityCents: Math.round(liability * 100),
      note,
    },
  });
  revalidateApp();
}

export async function createLiteracyLog(formData: FormData) {
  const userId = await getAppUserId();
  const kind = String(formData.get("kind")) as FinanceLiteracyKind;
  const content = String(formData.get("content") ?? "").trim();
  const outcomeNote = String(formData.get("outcomeNote") ?? "").trim() || null;
  if (!content || !kind) return;

  await prisma.financeLiteracyLog.create({
    data: {
      userId,
      occurredAt: new Date(),
      kind,
      content,
      outcomeNote,
    },
  });
  revalidateApp();
}

const quickNoteSchema = z.object({
  domain: z.enum(["mind", "work"]),
  text: z.string().min(1),
  score: z.coerce.number().min(1).max(5).optional(),
  context: z.string().optional(),
});

export async function createQuickNote(formData: FormData) {
  const userId = await getAppUserId();
  const parsed = quickNoteSchema.safeParse({
    domain: formData.get("domain"),
    text: formData.get("text"),
    score: formData.get("score"),
    context: formData.get("context"),
  });
  if (!parsed.success) return;

  if (parsed.data.domain === "mind") {
    const score = parsed.data.score ?? 3;
    const fd = new FormData();
    fd.set("score", String(score));
    fd.set("note", parsed.data.text);
    await upsertMoodLog(fd);
    return;
  }

  const fd = new FormData();
  fd.set("context", parsed.data.context || "快速记录");
  fd.set("outcome", parsed.data.text);
  await createExpressionReview(fd);
}

export async function generateReportAction(type: "BIWEEKLY" | "MONTHLY") {
  const userId = await getAppUserId();
  const report = await generateReportForUser(userId, type);
  revalidatePath("/reports");
  revalidatePath("/");
  return report.id;
}

export async function generateBiweeklyReport() {
  await generateReportAction("BIWEEKLY");
}

export async function generateMonthlyReport() {
  await generateReportAction("MONTHLY");
}

export async function updateReportContent(reportId: string, content: string) {
  const userId = await getAppUserId();
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId },
  });
  if (!report || report.status === "FINALIZED") return;

  await prisma.report.update({
    where: { id: reportId },
    data: { contentMarkdown: content },
  });
  revalidatePath(`/reports/${reportId}`);
}

export async function finalizeReport(reportId: string) {
  const userId = await getAppUserId();
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId, status: "DRAFT" },
  });
  if (!report) return;

  await prisma.report.update({
    where: { id: reportId },
    data: { status: "FINALIZED", finalizedAt: new Date() },
  });
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}
