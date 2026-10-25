import Link from "next/link";

import { createFamilySupportContact, updateFamilySupportContact } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { pageWrapHome } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { starterSupportDevices } from "@/lib/family-support";
import { getAppUser } from "@/lib/user";

const base = "/library/family/support";
const tones = ["sun", "mint", "lilac"] as const;

function PhoneIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" fill="#fff6e6" />
    </svg>
  );
}

function WrenchIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2z" />
    </svg>
  );
}

export default async function FamilySupportPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string; edit?: string }>;
}) {
  const user = await getAppUser();
  const { write, edit } = await searchParams;

  const existingCount = await prisma.familySupportContact.count({ where: { userId: user.id } });
  if (existingCount === 0) {
    await prisma.familySupportContact.createMany({
      data: starterSupportDevices.map((device) => ({ userId: user.id, device })),
    });
  }

  const contacts = await prisma.familySupportContact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const editing = contacts.find((item) => item.id === edit) ?? null;
  const writing = !editing && (write === "1" || contacts.length === 0);
  const filled = contacts.filter((item) => item.contact?.trim()).length;

  return (
    <div className={pageWrapHome}>
      <header className="q-home-hero flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-7">
        <div className="flex items-center gap-3">
          <span className="q-badge size-12 bg-[#fff6e6] text-[#4a3326]">
            <PhoneIcon />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#4a3326]">家里的客服本</h2>
            <p className="text-xs text-[#4a3326]/70">坏了找谁，一眼就能看到</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="q-chip tabular-nums">设备 {contacts.length}</span>
          <span className="q-chip tabular-nums">
            已填 {filled}/{contacts.length}
          </span>
          {writing || editing ? (
            contacts.length > 0 ? (
              <Link href={base} className="q-btn" data-variant="ghost">
                返回
              </Link>
            ) : null
          ) : (
            <Link href={`${base}?write=1`} className="q-btn">
              <span aria-hidden className="text-base leading-none">＋</span>
              记一条
            </Link>
          )}
        </div>
      </header>

      {writing || editing ? (
        <section className="q-block" data-tone="sun">
          <header className="q-block-head">
            <span className="q-badge text-[#4a3326]">
              <WrenchIcon />
            </span>
            <span className="q-title-pill">{editing ? `修改 · ${editing.device}` : "记一条客服"}</span>
          </header>
          <form action={editing ? updateFamilySupportContact : createFamilySupportContact} className="grid gap-4 p-4 sm:grid-cols-2">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#4a3326]">设备</span>
              <input
                name="device"
                required
                defaultValue={editing?.device ?? ""}
                className="q-field"
                placeholder="洗衣机、空调…"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-bold text-[#4a3326]">联系方式</span>
              <input
                name="contact"
                defaultValue={editing?.contact ?? ""}
                className="q-field"
                placeholder="电话、售后、保修，可先空着"
              />
            </label>
            <div className="sm:col-span-2">
              <SaveButton label={editing ? "保存" : "记一条"} className="q-btn" />
            </div>
          </form>
        </section>
      ) : null}

      <section className="q-block" data-tone="mint">
        <header className="q-block-head">
          <span className="q-badge text-[#4a3326]">
            <PhoneIcon className="size-5" />
          </span>
          <span className="q-title-pill">设备清单</span>
        </header>
        {contacts.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#4a3326]/70">还没有设备，点「记一条」开始写。</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((item, index) => {
              const hasContact = Boolean(item.contact?.trim());
              return (
                <li key={item.id} className="q-col flex flex-col gap-2 p-3" data-tone={tones[index % tones.length]}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="q-col-title">{item.device}</span>
                    <Link href={`${base}?edit=${item.id}`} className="q-tag hover:brightness-95">
                      修改
                    </Link>
                  </div>
                  <p
                    className={`whitespace-pre-wrap text-sm leading-5 ${hasContact ? "font-semibold text-[#4a3326]" : "text-[#4a3326]/50"}`}
                  >
                    {hasContact ? item.contact : "联系方式还空着"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
