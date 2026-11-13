"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ChoreCadence,
  FinanceLargeExpenseType,
  FinanceLiteracyKind,
  RelationKind,
  TechStackStatus,
} from "@prisma/client";
import { z } from "zod";

import { articleTopicLabel } from "@/lib/library-article";
import { getAppUserId } from "@/lib/user";
import {
  bodyExamImageDir,
  bodyExamImageExt,
  bodyExamImageLimit,
  bodyExamImageMaxFiles,
  bodyExamImageMime,
} from "@/lib/body-exam-image";
import { calendarDateInTimezone } from "@/lib/dates";
import { sleepDurationHours } from "@/lib/sleep-log";
import { choresPageQuery, isWeeklyChoreDone, parseChoresViewMode } from "@/lib/chores";
import { parseKitchenUsageFrequency, type KitchenActionState } from "@/lib/kitchen";
import { parseCleaningCadence } from "@/lib/kitchen-cleaning";
import { parseDishDifficulty } from "@/lib/kitchen-dish";
import {
  computeTotalCnyMinor,
  financeHoldingConfigs,
  holdingAccountLabel,
  holdingsMapToJson,
  isMarketPricedHolding,
  shanghaiCalendarDate,
  validateFinanceHoldingsForm,
} from "@/lib/finance-holdings";
import type { FinanceHoldingAccount } from "@prisma/client";
import { fetchGoldPricePerGram, fetchNineQuantFinancePrice, resolveFinancePrice, sharesToAmountMinor } from "@/lib/finance-prices";
import { askFinanceExpenseAgent } from "@/lib/finance-expense-agent";
import { prisma } from "@/lib/db";
import { generateReportForUser } from "@/lib/reports/generate";
import { generateRelationAiReport } from "@/lib/relation/ai-analysis";
import { analyzeRelationPerson } from "@/lib/relation/analysis";
import {
  workCredentialDir,
  workCredentialExt,
  workCredentialLimit,
  workCredentialMime,
} from "@/lib/work-credential";

function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/body/profile");
  revalidatePath("/body/log");
  revalidatePath("/mind/profile");
  revalidatePath("/mind/log");
  revalidatePath("/work/profile");
  revalidatePath("/work/log");
  revalidatePath("/relation/profile");
  revalidatePath("/relation/log");
  revalidatePath("/relation/people", "layout");
  revalidatePath("/relation/chat", "layout");
  revalidatePath("/relation/analysis", "layout");
  revalidatePath("/finance/profile");
  revalidatePath("/play");
  revalidatePath("/body/sleep");
  revalidatePath("/body/meals");
  revalidatePath("/body/vitals");
  revalidatePath("/library/article", "layout");
  revalidatePath("/library/family/chores");
  revalidatePath("/library/family/kitchen");
  revalidatePath("/library/family/support");
}

export async function upsertBodyProfile(formData: FormData) {
  const userId = await getAppUserId();
  const heightCm = formData.get("heightCm");
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const bloodType = String(formData.get("bloodType") ?? "").trim() || null;
  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  const birthDate = birthRaw ? new Date(`${birthRaw}T00:00:00.000Z`) : null;
  const profileData = {
    heightCm: heightCm ? Number(heightCm) : null,
    birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
    gender,
    bloodType,
  };

  await prisma.bodyProfile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });
  revalidateApp();
  return { ok: true };
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
  return { ok: true };
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
  redirect("/mind/profile");
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
  redirect("/work/profile?tab=profile");
}

export async function createWorkCredential(formData: FormData) {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  const file = formData.get("file");
  const back = "/work/profile?tab=credentials";

  if (!name || !(file instanceof File) || file.size === 0) {
    redirect(`${back}&error=required`);
  }
  if (file.size > workCredentialLimit()) {
    redirect(`${back}&error=size`);
  }

  const ext = workCredentialExt(file);
  if (!ext) {
    redirect(`${back}&error=type`);
  }

  const storedName = `${randomUUID()}.${ext}`;
  const dir = workCredentialDir();
  const fullPath = path.join(dir, storedName);
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  try {
    await prisma.workCredential.create({
      data: {
        userId,
        name: name.slice(0, 120),
        storedName,
        originalName: file.name.slice(0, 255),
        mime: workCredentialMime(ext),
        sizeBytes: file.size,
      },
    });
  } catch (error) {
    await unlink(fullPath).catch(() => undefined);
    throw error;
  }

  revalidateApp();
  redirect(back);
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
  redirect("/work/profile");
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
  redirect("/relation/profile");
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

function financeLargeExpenseRedirect(page: number, expenseYear: string | null, error = false) {
  const params = new URLSearchParams({ expensePage: String(page) });
  if (expenseYear) params.set("expenseYear", expenseYear);
  if (error) params.set("largeExpenseError", "required");
  return `/finance/profile?${params.toString()}#finance-large-expenses-card`;
}

export async function createFinanceLargeExpense(formData: FormData) {
  const userId = await getAppUserId();
  const title = optionalText(formData, "title");
  const occurredOn = optionalDate(formData, "occurredOn");
  const amountYuan = optionalNumber(formData, "amountYuan");
  const typeValue = optionalText(formData, "type");
  const expenseYear = optionalText(formData, "expenseYear");
  const type = Object.values(FinanceLargeExpenseType).find((value) => value === typeValue);

  if (!title || !occurredOn || amountYuan == null || amountYuan <= 0 || !type) {
    redirect(financeLargeExpenseRedirect(1, expenseYear, true));
  }

  await prisma.financeLargeExpense.create({
    data: {
      userId,
      title: title.slice(0, 120),
      amountMinor: Math.round(amountYuan * 100),
      occurredOn,
      type,
    },
  });

  revalidateApp();
  redirect(financeLargeExpenseRedirect(1, expenseYear));
}

export async function updateFinanceLargeExpense(formData: FormData) {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  const title = optionalText(formData, "title");
  const occurredOn = optionalDate(formData, "occurredOn");
  const amountYuan = optionalNumber(formData, "amountYuan");
  const typeValue = optionalText(formData, "type");
  const type = Object.values(FinanceLargeExpenseType).find((value) => value === typeValue);
  const page = Math.max(1, Number.parseInt(String(formData.get("expensePage") ?? "1"), 10) || 1);
  const expenseYear = optionalText(formData, "expenseYear");

  if (!id || !title || !occurredOn || amountYuan == null || amountYuan <= 0 || !type) {
    redirect(financeLargeExpenseRedirect(page, expenseYear, true));
  }

  await prisma.financeLargeExpense.updateMany({
    where: { id, userId },
    data: {
      title: title.slice(0, 120),
      amountMinor: Math.round(amountYuan * 100),
      occurredOn,
      type,
    },
  });

  revalidateApp();
  redirect(financeLargeExpenseRedirect(page, expenseYear));
}

export async function upsertFinanceHoldings(formData: FormData) {
  const userId = await getAppUserId();
  const validated = validateFinanceHoldingsForm(formData);
  if (!validated.ok) {
    const code =
      validated.missingLabels.length > 0
        ? "required"
        : "invalid";
    redirect(`/finance/profile?edit=1&assetsError=${code}`);
  }

  const existing = await prisma.financeHolding.findMany({ where: { userId } });
  const byAccount = new Map(existing.map((row) => [row.account, row]));
  const newAmounts = new Map(validated.amounts);
  const prepared = new Map<
    FinanceHoldingAccount,
    {
      amountMinor: number;
      quantityMinor: number | null;
      priceUsdMinor: number | null;
      priceCnyMinor: number | null;
      priceFetchedAt: Date | null;
    }
  >();
  const fallbackAssets: string[] = [];

  for (const config of financeHoldingConfigs) {
    const prev = byAccount.get(config.account);
    if (!isMarketPricedHolding(config)) {
      prepared.set(config.account, {
        amountMinor: newAmounts.get(config.account)!,
        quantityMinor: null,
        priceUsdMinor: null,
        priceCnyMinor: null,
        priceFetchedAt: null,
      });
      continue;
    }

    const quantityMinor = validated.quantities.get(config.account)!;
    const priceCurrency = config.marketPriceCurrency ?? "USD";
    const cachedPrice = priceCurrency === "CNY" ? prev?.priceCnyMinor ?? null : prev?.priceUsdMinor ?? null;
    const price = await resolveFinancePrice(
      cachedPrice,
      prev?.priceFetchedAt ?? null,
      () => (config.marketPriceSource === "goldprice" ? fetchGoldPricePerGram() : fetchNineQuantFinancePrice(config.priceSymbol!)),
    );
    if (price.unavailable || price.priceUsdMinor == null) {
      redirect(`/finance/profile?edit=1&assetsError=price-unavailable&asset=${encodeURIComponent(holdingAccountLabel(config.account))}`);
    }
    if (price.usedFallback) fallbackAssets.push(holdingAccountLabel(config.account));

    const amountMinor = sharesToAmountMinor(quantityMinor, price.priceUsdMinor);
    newAmounts.set(config.account, amountMinor);
    prepared.set(config.account, {
      amountMinor,
      quantityMinor,
      priceUsdMinor: priceCurrency === "USD" ? price.priceUsdMinor : null,
      priceCnyMinor: priceCurrency === "CNY" ? price.priceUsdMinor : null,
      priceFetchedAt: price.fetchedAt,
    });
  }

  const totalCnyMinor = computeTotalCnyMinor(newAmounts);

  for (const config of financeHoldingConfigs) {
    const next = prepared.get(config.account)!;
    const prev = byAccount.get(config.account);
    const previousMinor = prev?.amountMinor ?? null;
    const changed =
      !prev ||
      previousMinor !== next.amountMinor ||
      prev.quantityMinor !== next.quantityMinor ||
      prev.priceUsdMinor !== next.priceUsdMinor ||
      prev.priceCnyMinor !== next.priceCnyMinor ||
      prev.priceFetchedAt?.getTime() !== next.priceFetchedAt?.getTime();
    if (!changed) continue;

    await prisma.financeHolding.upsert({
      where: { userId_account: { userId, account: config.account } },
      create: {
        userId,
        account: config.account,
        amountMinor: next.amountMinor,
        quantityMinor: next.quantityMinor,
        priceUsdMinor: next.priceUsdMinor,
        priceCnyMinor: next.priceCnyMinor,
        priceFetchedAt: next.priceFetchedAt,
      },
      update: {
        amountMinor: next.amountMinor,
        quantityMinor: next.quantityMinor,
        priceUsdMinor: next.priceUsdMinor,
        priceCnyMinor: next.priceCnyMinor,
        priceFetchedAt: next.priceFetchedAt,
      },
    });

    await prisma.financeHoldingLog.create({
      data: {
        userId,
        account: config.account,
        previousAmountMinor: prev ? previousMinor : null,
        newAmountMinor: next.amountMinor,
        totalCnyMinor,
      },
    });
  }

  const asOfDate = shanghaiCalendarDate();
  await prisma.financeAssetSnapshot.upsert({
    where: { userId_asOfDate: { userId, asOfDate } },
    create: {
      userId,
      asOfDate,
      totalCnyMinor,
      holdingsJson: holdingsMapToJson(newAmounts),
    },
    update: {
      totalCnyMinor,
      holdingsJson: holdingsMapToJson(newAmounts),
    },
  });

  revalidateApp();
  const query = new URLSearchParams();
  if (fallbackAssets.length > 0) {
    query.set("assetsNotice", "stale-price");
    query.set("asset", fallbackAssets.join("、"));
  }
  const suffix = query.toString();
  redirect(suffix ? `/finance/profile?${suffix}` : "/finance/profile");
}

export async function createPlayDistrict(formData: FormData) {
  const userId = await getAppUserId();
  const district = optionalText(formData, "district");
  const project = optionalText(formData, "project");
  if (!district || !project) return;
  await prisma.playDistrict.create({ data: { userId, district, project } });
  revalidateApp();
  redirect("/play");
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

const supportHref = "/library/family/support";

export async function createFamilySupportContact(formData: FormData) {
  const userId = await getAppUserId();
  const device = optionalText(formData, "device");
  if (!device) return;
  await prisma.familySupportContact.create({
    data: {
      userId,
      device,
      contact: optionalText(formData, "contact"),
    },
  });
  revalidateApp();
  redirect(supportHref);
}

export async function updateFamilySupportContact(formData: FormData) {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  const device = optionalText(formData, "device");
  if (!id || !device) return;
  const existing = await prisma.familySupportContact.findFirst({ where: { id, userId } });
  if (!existing) return;
  await prisma.familySupportContact.update({
    where: { id },
    data: {
      device,
      contact: optionalText(formData, "contact"),
    },
  });
  revalidateApp();
  redirect(supportHref);
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
  redirect(`/play?edit=travel&trip=${trip.id}`);
}

export async function createTripEntry(formData: FormData) {
  const userId = await getAppUserId();
  const tripId = optionalText(formData, "tripId");
  const kind = optionalText(formData, "kind");
  if (!tripId || !kind) return;
  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId } });
  if (!trip) return;

  const back = `/play?edit=travel&trip=${tripId}`;
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

export async function createBodyMeasureLog(formData: FormData) {
  const userId = await getAppUserId();
  const weightKg = optionalNumber(formData, "weightKg");
  const bodyFatPct = optionalNumber(formData, "bodyFatPct");
  const chestCm = optionalNumber(formData, "chestCm");
  const waistCm = optionalNumber(formData, "waistCm");
  const thighCm = optionalNumber(formData, "thighCm");
  if (weightKg == null && bodyFatPct == null && chestCm == null && waistCm == null && thighCm == null) {
    return { ok: false };
  }

  await prisma.bodyMeasureLog.create({
    data: {
      userId,
      logDate: calendarDateInTimezone(new Date()),
      weightKg,
      bodyFatPct,
      chestCm,
      waistCm,
      thighCm,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function createBodyExamLog(formData: FormData) {
  const userId = await getAppUserId();
  const logDate = optionalDate(formData, "logDate") ?? calendarDateInTimezone(new Date());
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { ok: false };
  if (files.length > bodyExamImageMaxFiles()) return { ok: false };

  const prepared: { storedName: string; originalName: string; mime: string; sizeBytes: number; buffer: Buffer }[] =
    [];
  for (const file of files) {
    if (file.size > bodyExamImageLimit()) return { ok: false };
    const ext = bodyExamImageExt(file);
    if (!ext) return { ok: false };
    const storedName = `${randomUUID()}.${ext}`;
    prepared.push({
      storedName,
      originalName: file.name.slice(0, 255),
      mime: bodyExamImageMime(ext),
      sizeBytes: file.size,
      buffer: Buffer.from(await file.arrayBuffer()),
    });
  }

  const dir = bodyExamImageDir();
  await mkdir(dir, { recursive: true });
  const written: string[] = [];
  try {
    for (const item of prepared) {
      const fullPath = path.join(dir, item.storedName);
      await writeFile(fullPath, item.buffer);
      written.push(fullPath);
    }
    await prisma.bodyExamLog.create({
      data: {
        userId,
        logDate,
        images: {
          create: prepared.map(({ storedName, originalName, mime, sizeBytes }) => ({
            storedName,
            originalName,
            mime,
            sizeBytes,
          })),
        },
      },
    });
  } catch (error) {
    await Promise.all(written.map((fullPath) => unlink(fullPath).catch(() => undefined)));
    throw error;
  }

  revalidateApp();
  return { ok: true };
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
  redirect("/body/profile");
}

export async function createMedicalVisitLog(formData: FormData) {
  const userId = await getAppUserId();
  const visitedOn = calendarDateInTimezone(new Date());
  const hospital = optionalText(formData, "hospital");
  const department = optionalText(formData, "department");
  const note = optionalText(formData, "note");
  if (!note && !hospital && !department) return { ok: false };

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
  return { ok: true };
}

const choreCadences = new Set<string>(["DAILY", "WEEKLY", "MONTHLY"]);

export async function createChoreLog(formData: FormData) {
  const userId = await getAppUserId();
  const cadenceRaw = String(formData.get("cadence") ?? "").trim();
  if (!choreCadences.has(cadenceRaw)) return;
  const cadence = cadenceRaw as ChoreCadence;
  const text = optionalText(formData, "text");
  if (!text) return;

  await prisma.choreLog.create({
    data: {
      userId,
      cadence,
      text,
    },
  });
  revalidateApp();
  const mode = parseChoresViewMode(optionalText(formData, "mode") ?? undefined);
  redirect(`/library/family/chores${choresPageQuery({ mode })}`);
}

export async function updateChoreLog(formData: FormData) {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return;
  const cadenceRaw = String(formData.get("cadence") ?? "").trim();
  if (!choreCadences.has(cadenceRaw)) return;
  const cadence = cadenceRaw as ChoreCadence;
  const text = optionalText(formData, "text");
  if (!text) return;

  const existing = await prisma.choreLog.findFirst({ where: { id, userId } });
  if (!existing) return;

  await prisma.choreLog.update({
    where: { id },
    data: { cadence, text },
  });
  revalidateApp();
  const mode = parseChoresViewMode(optionalText(formData, "mode") ?? undefined);
  redirect(`/library/family/chores${choresPageQuery({ mode })}`);
}

function finishKitchenAction(): KitchenActionState {
  revalidateApp();
  return { ok: true };
}

export async function createKitchenSeasoning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  await prisma.kitchenSeasoning.create({
    data: { userId, name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function updateKitchenSeasoning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  const existing = await prisma.kitchenSeasoning.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenSeasoning.update({
    where: { id },
    data: { name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function deleteKitchenSeasoning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;

  const existing = await prisma.kitchenSeasoning.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenSeasoning.delete({ where: { id } });
  return finishKitchenAction();
}

export async function createKitchenVegetable(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  await prisma.kitchenVegetable.create({
    data: { userId, name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function updateKitchenVegetable(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  const existing = await prisma.kitchenVegetable.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenVegetable.update({
    where: { id },
    data: { name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function deleteKitchenVegetable(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;

  const existing = await prisma.kitchenVegetable.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenVegetable.delete({ where: { id } });
  return finishKitchenAction();
}

export async function createKitchenMeat(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  await prisma.kitchenMeat.create({
    data: { userId, name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function updateKitchenMeat(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;
  const name = optionalText(formData, "name");
  if (!name) return null;
  const usageFrequency = parseKitchenUsageFrequency(String(formData.get("usageFrequency") ?? "").trim());
  if (!usageFrequency) return null;
  const description = optionalText(formData, "description") || null;

  const existing = await prisma.kitchenMeat.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenMeat.update({
    where: { id },
    data: { name, usageFrequency, description },
  });
  return finishKitchenAction();
}

export async function deleteKitchenMeat(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;

  const existing = await prisma.kitchenMeat.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenMeat.delete({ where: { id } });
  return finishKitchenAction();
}

export async function createKitchenDish(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  if (!name) return null;
  const difficulty = parseDishDifficulty(String(formData.get("difficulty") ?? "").trim());
  if (!difficulty) return null;
  const ingredients = optionalText(formData, "ingredients") || null;
  const cookingProcess = optionalText(formData, "cookingProcess") || null;

  await prisma.kitchenDish.create({
    data: { userId, name, difficulty, ingredients, cookingProcess },
  });
  return finishKitchenAction();
}

export async function updateKitchenDish(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;
  const name = optionalText(formData, "name");
  if (!name) return null;
  const difficulty = parseDishDifficulty(String(formData.get("difficulty") ?? "").trim());
  if (!difficulty) return null;
  const ingredients = optionalText(formData, "ingredients") || null;
  const cookingProcess = optionalText(formData, "cookingProcess") || null;

  const existing = await prisma.kitchenDish.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenDish.update({
    where: { id },
    data: { name, difficulty, ingredients, cookingProcess },
  });
  return finishKitchenAction();
}

export async function deleteKitchenDish(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;

  const existing = await prisma.kitchenDish.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenDish.delete({ where: { id } });
  return finishKitchenAction();
}

export async function createKitchenCleaning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const name = optionalText(formData, "name");
  if (!name) return null;
  const cadence = parseCleaningCadence(String(formData.get("cadence") ?? "").trim());
  if (!cadence) return null;
  const description = optionalText(formData, "description") || null;

  await prisma.kitchenCleaning.create({
    data: { userId, name, cadence, description },
  });
  return finishKitchenAction();
}

export async function updateKitchenCleaning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;
  const name = optionalText(formData, "name");
  if (!name) return null;
  const cadence = parseCleaningCadence(String(formData.get("cadence") ?? "").trim());
  if (!cadence) return null;
  const description = optionalText(formData, "description") || null;

  const existing = await prisma.kitchenCleaning.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenCleaning.update({
    where: { id },
    data: { name, cadence, description },
  });
  return finishKitchenAction();
}

export async function deleteKitchenCleaning(
  _previousState: KitchenActionState,
  formData: FormData,
): Promise<KitchenActionState> {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return null;

  const existing = await prisma.kitchenCleaning.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.kitchenCleaning.delete({ where: { id } });
  return finishKitchenAction();
}

export async function toggleChoreWeeklyDone(formData: FormData) {
  const userId = await getAppUserId();
  const id = optionalText(formData, "id");
  if (!id) return;
  const mode = parseChoresViewMode(optionalText(formData, "mode") ?? undefined);

  const log = await prisma.choreLog.findFirst({
    where: { id, userId, cadence: "WEEKLY" },
  });
  if (!log) return;

  await prisma.choreLog.update({
    where: { id },
    data: { completedAt: isWeeklyChoreDone(log.completedAt) ? null : new Date() },
  });
  revalidateApp();
  redirect(`/library/family/chores${choresPageQuery({ mode })}`);
}

export async function createSleepLog(formData: FormData) {
  const userId = await getAppUserId();
  const sleepStart = String(formData.get("sleepStart") ?? "").trim();
  const wakeTime = String(formData.get("wakeTime") ?? "").trim();
  if (!sleepStart || !wakeTime) return { ok: false };

  const durationHours = sleepDurationHours(sleepStart, wakeTime);
  if (durationHours <= 0) return { ok: false };

  const logDate = calendarDateInTimezone(new Date());
  const now = new Date();

  await prisma.sleepLog.create({
    data: {
      userId,
      logDate,
      sleepStart,
      wakeTime,
      occurredAt: now,
      durationHours,
      note: null,
    },
  });
  revalidateApp();
  return { ok: true };
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

export async function analyzeRelationPersonAction(formData: FormData) {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  if (!personId) return;

  await analyzeRelationPerson(userId, personId);
  revalidatePath("/relation/profile");
  revalidatePath(`/relation/people/${personId}`);
  revalidatePath(`/relation/analysis/${personId}`);
  revalidatePath(`/relation/analysis/${personId}/ai`);
}

export async function createRelationMetricLedgerAction(formData: FormData) {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const calculation = String(formData.get("calculation") ?? "").trim();
  if (!personId || !name || !calculation) return;

  const person = await prisma.relationPerson.findFirst({ where: { id: personId, userId }, select: { id: true } });
  if (!person) return;
  await prisma.relationMetricLedger.create({ data: { userId, personId, name, calculation } });
  revalidatePath(`/relation/analysis/${personId}`);
}

export async function updateRelationMetricLedgerAction(formData: FormData) {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const calculation = String(formData.get("calculation") ?? "").trim();
  if (!personId || !id || !name || !calculation) return;

  const entry = await prisma.relationMetricLedger.findFirst({ where: { id, personId, userId }, select: { id: true } });
  if (!entry) return;
  await prisma.relationMetricLedger.update({ where: { id }, data: { name, calculation } });
  revalidatePath(`/relation/analysis/${personId}`);
}

export async function updateRelationPersonProfileAction(formData: FormData) {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  if (!personId) return;
  const person = await prisma.relationPerson.findFirst({ where: { id: personId, userId } });
  if (!person) return;

  const birthRaw = String(formData.get("birthDate") ?? "").trim();
  const birthDate = birthRaw ? new Date(`${birthRaw}T00:00:00.000Z`) : null;
  const name = optionalText(formData, "name") || person.name;
  await prisma.relationPerson.update({
    where: { id: personId },
    data: {
      name,
      birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
      zodiac: optionalText(formData, "zodiac"),
      mbti: optionalText(formData, "mbti"),
      heightCm: optionalNumber(formData, "heightCm"),
      weightKg: optionalNumber(formData, "weightKg"),
      hometown: optionalText(formData, "hometown"),
      familySituation: optionalText(formData, "familySituation"),
      undergraduate: optionalText(formData, "undergraduate"),
      graduate: optionalText(formData, "graduate"),
      major: optionalText(formData, "major"),
      company: optionalText(formData, "company"),
      jobTitle: optionalText(formData, "jobTitle"),
    },
  });
  revalidatePath("/relation/profile");
  revalidatePath(`/relation/people/${personId}`);
  redirect(`/relation/people/${personId}`);
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

export async function chatFinanceLargeExpensesAction(year: number | null, history: Array<{ role: "user" | "assistant"; content: string }>) {
  if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2200)) throw new Error("年份无效。");
  if (!Array.isArray(history) || !history.length || history.length > 16 || history.some((item) =>
    !item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim() || item.content.length > 2000
  )) throw new Error("对话内容无效。");
  if (history.at(-1)?.role !== "user") throw new Error("请先输入问题。");
  return askFinanceExpenseAgent(await getAppUserId(), year, history);
}

export type RelationAiActionState = { ok: boolean; message: string };

export async function generateRelationAiReportAction(
  _previousState: RelationAiActionState,
  formData: FormData,
): Promise<RelationAiActionState> {
  const userId = await getAppUserId();
  const personId = String(formData.get("personId") ?? "");
  if (!personId) return { ok: false, message: "缺少人物档案。" };
  try {
    await generateRelationAiReport(userId, personId);
    revalidatePath(`/relation/analysis/${personId}/ai`);
    return { ok: true, message: "AI 分析已生成，已保存到当前人物档案。" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "AI 分析生成失败。" };
  }
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
