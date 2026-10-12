import Link from "next/link";
import type { Trip, TripEntry } from "@prisma/client";

import { createTrip, createTripEntry } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

type TripWithEntries = Trip & { entries: TripEntry[] };

const base = "/finance/profile?tab=play";

export function TravelBlock({
  trips,
  edit,
  tripId,
  add,
}: {
  trips: TripWithEntries[];
  edit?: string;
  tripId?: string;
  add?: string;
}) {
  const editing = edit === "travel";
  const trip = trips.find((item) => item.id === tripId) ?? null;

  return (
    <section className="pixel-box p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">旅游</h2>
        {editing ? (
          <Link href={trip && add ? `${base}&edit=travel&trip=${trip.id}` : base} className={backClass}>
            返回
          </Link>
        ) : (
          <Link href={`${base}&edit=travel`} className={submitClass()}>
            记一次
          </Link>
        )}
      </div>

      {editing && add && trip ? (
        <EntryForm tripId={trip.id} kind={add} />
      ) : editing && trip ? (
        <TripBoard trip={trip} />
      ) : editing ? (
        <div className="grid gap-4">
          <form action={createTrip} className="grid gap-4">
            <Field id="title" label="行程" placeholder="重庆 → 冲绳 + 宫古岛" />
            <Field id="traveler" label="旅客" placeholder="LIU/HANGYU" />
            <Area id="note" label="计价" placeholder="机票仅票面和税费。酒店为含税实付。不含餐饮、当地交通、购物。" />
            <SaveButton label="建立行程" />
          </form>
          {trips.length > 0 ? <TripList trips={trips} /> : null}
        </div>
      ) : trips.length === 0 ? (
        <p className="text-sm text-[var(--gold-deep)]">未填</p>
      ) : (
        <TripList trips={trips} />
      )}
    </section>
  );
}

function TripList({ trips }: { trips: TripWithEntries[] }) {
  return (
    <div className="grid gap-3">
      {trips.map((trip) => {
        const money = totals(trip.entries);
        return (
          <Link key={trip.id} href={`${base}&edit=travel&trip=${trip.id}`} className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
            <p className="text-sm font-semibold">{trip.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {[trip.traveler, span(trip.entries)].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-sm text-[var(--gold-deep)]">
              机票 {money.flights} · 酒店 {money.hotels} · 合计 {money.all}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function TripBoard({ trip }: { trip: TripWithEntries }) {
  const money = totals(trip.entries);
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold">{trip.title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{[trip.traveler, span(trip.entries)].filter(Boolean).join(" · ")}</p>
        {trip.note ? <p className="mt-2 whitespace-pre-wrap text-sm">{trip.note}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`${base}&edit=travel&trip=${trip.id}&add=flight`} className={submitClass()}>
          航班
        </Link>
        <Link href={`${base}&edit=travel&trip=${trip.id}&add=hotel`} className={submitClass()}>
          酒店
        </Link>
        <Link href={`${base}&edit=travel&trip=${trip.id}&add=event`} className={submitClass()}>
          当天
        </Link>
      </div>
      {trip.entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">还没有按时间排上的记录。</p>
      ) : (
        <ol className="grid gap-3">
          {dayGroups(trip.entries).map((group) => (
            <li key={group.day} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
              <p className="text-sm font-semibold">{dayHeading(group.day)}</p>
              <ul className="mt-3 grid gap-3">
                {group.entries.map((entry) => {
                  const time = clock(entry);
                  return (
                  <li key={entry.id} className={`border-t-2 border-[var(--ink)] pt-3 first:border-t-0 first:pt-0 ${time ? "grid gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]" : ""}`}>
                    {time ? <p className="text-xs text-[var(--muted)]">{time}</p> : null}
                    <div>
                      {headline(entry) ? <p className="text-sm">{headline(entry)}</p> : null}
                      {subline(entry) ? <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--gold-deep)]">{subline(entry)}</p> : null}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
      <p className="text-sm">
        机票 {money.flights} · 酒店 {money.hotels} · 合计 {money.all}
      </p>
    </div>
  );
}

function EntryForm({ tripId, kind }: { tripId: string; kind: string }) {
  return (
    <form action={createTripEntry} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="kind" value={kind} />
      {kind === "flight" ? <FlightFields /> : null}
      {kind === "hotel" ? <HotelFields /> : null}
      {kind === "event" ? <EventFields /> : null}
      <div className="sm:col-span-2">
        <SaveButton label="加到行程" />
      </div>
    </form>
  );
}

function FlightFields() {
  return (
    <>
      <Field id="date" label="日期" type="date" />
      <Field id="flightNo" label="航班" placeholder="HB869" />
      <Field id="origin" label="出发" placeholder="重庆CKG" />
      <Field id="destination" label="到达" placeholder="香港HKG" />
      <Field id="departTime" label="起飞" placeholder="18:00" />
      <Field id="arriveTime" label="降落" placeholder="20:25" />
      <Field id="cabin" label="舱位" placeholder="经济舱" />
      <Field id="terminal" label="航站楼" placeholder="T1" />
      <Field id="fareYuan" label="票面（元）" type="number" />
      <Field id="taxYuan" label="税费（元）" type="number" />
      <Field id="totalYuan" label="小计（元）" type="number" />
      <div className="sm:col-span-2">
        <Area id="baggage" label="行李" placeholder="手提1件，托运2件×23kg" />
      </div>
      <div className="sm:col-span-2">
        <Area id="remark" label="说明" placeholder="联程只在一段填小计" />
      </div>
    </>
  );
}

function HotelFields() {
  return (
    <>
      <div className="sm:col-span-2">
        <Field id="hotelName" label="酒店" placeholder="那霸格拉斯丽酒店" />
      </div>
      <Field id="checkIn" label="入住" type="date" />
      <Field id="checkOut" label="退房" type="date" />
      <Field id="nights" label="晚数" type="number" />
      <Field id="paidYuan" label="实付（元）" type="number" />
      <Field id="includes" label="含" placeholder="1份早餐" />
    </>
  );
}

function EventFields() {
  return (
    <>
      <Field id="date" label="日期" type="date" />
      <div className="sm:col-span-2">
        <Area id="body" label="发生了什么" placeholder="冲绳北部一日游" />
      </div>
    </>
  );
}

function Field({
  id,
  label,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} type={type} step={type === "number" ? "0.01" : undefined} placeholder={placeholder} className={fieldClass()} />
    </div>
  );
}

function Area({ id, label, placeholder }: { id: string; label: string; placeholder: string }) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
      </label>
      <textarea id={id} name={id} rows={3} placeholder={placeholder} className={fieldClass()} />
    </div>
  );
}

function dayText(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(5, 10).replace("-", "/");
}

function yuan(cents: number) {
  return `${(cents / 100).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}元`;
}

function totals(entries: TripEntry[]) {
  const flights = entries.reduce((sum, entry) => sum + (entry.kind === "flight" ? entry.totalCents ?? 0 : 0), 0);
  const hotels = entries.reduce((sum, entry) => sum + (entry.kind === "hotel" ? entry.paidCents ?? 0 : 0), 0);
  return { flights: yuan(flights), hotels: yuan(hotels), all: yuan(flights + hotels) };
}

function span(entries: TripEntry[]) {
  const dates = entries.flatMap((entry) => [entry.happenedOn, entry.checkIn, entry.checkOut].filter((date): date is Date => date != null));
  if (dates.length === 0) return "";
  const sorted = dates.map((date) => date.toISOString().slice(0, 10)).toSorted();
  const first = sorted[0]?.slice(5).replace("-", "/");
  const last = sorted[sorted.length - 1]?.slice(5).replace("-", "/");
  return first === last ? first : `${first}–${last}`;
}

function entryDay(entry: TripEntry) {
  const date = entry.kind === "hotel" ? entry.checkIn : entry.happenedOn;
  return date ? date.toISOString().slice(0, 10) : "";
}

function dayGroups(entries: TripEntry[]) {
  const groups: { day: string; entries: TripEntry[] }[] = [];
  for (const entry of entries) {
    const day = entryDay(entry) || "未标日期";
    const last = groups[groups.length - 1];
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

function dayHeading(day: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  return `${Number(match[2])}月${Number(match[3])}日`;
}

function clock(entry: TripEntry) {
  if (entry.kind === "hotel") return "入住";
  if (entry.kind === "flight") return entry.departTime ?? "";
  return "";
}

function headline(entry: TripEntry) {
  if (entry.kind === "flight") {
    return ["航班", `${entry.origin} → ${entry.destination}`, entry.flightNo, entry.cabin].filter(Boolean).join(" · ");
  }
  if (entry.kind === "hotel") {
    return ["酒店", entry.hotelName, entry.nights != null ? `${entry.nights}晚` : null].filter(Boolean).join(" · ");
  }
  return "";
}

function subline(entry: TripEntry) {
  if (entry.kind === "flight") {
    const money = [
      entry.fareCents != null ? `票面 ${yuan(entry.fareCents)}` : null,
      entry.taxCents != null ? `税 ${yuan(entry.taxCents)}` : null,
      entry.totalCents != null ? `小计 ${yuan(entry.totalCents)}` : null,
    ].filter(Boolean);
    return [
      [entry.departTime, entry.arriveTime].filter(Boolean).join("–"),
      entry.terminal,
      money.join("，"),
      entry.baggage,
      entry.remark,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (entry.kind === "hotel") {
    return [
      [dayText(entry.checkIn), dayText(entry.checkOut)].filter(Boolean).join("–"),
      entry.paidCents != null ? `实付 ${yuan(entry.paidCents)}` : null,
      entry.includes,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return entry.body;
}
