import Link from "next/link";
import type { WorkCredential } from "@prisma/client";

import { createWorkCredential } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

const credentialErrors: Record<string, string> = {
  required: "请填写名称并选择文件。",
  size: "文件过大（上限 25MB）。",
  type: "不支持该文件类型，请上传 PDF、图片或常见办公文档。",
};

export function WorkCredentialsPanel({
  credentials,
  editing,
  error,
}: {
  credentials: WorkCredential[];
  editing: boolean;
  error?: string;
}) {
  const base = "/work/profile?tab=credentials";
  const message = error ? credentialErrors[error] : undefined;

  return (
    <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-3">
        <p className="text-sm font-semibold">证件</p>
        {editing ? (
          <Link href={base} className={backClass}>
            返回
          </Link>
        ) : (
          <Link href={`${base}&edit=1`} className={submitClass()}>
            记一条
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {message ? (
          <p className="mb-4 border-2 border-[#b3644d]/40 bg-[#fde8e8] px-3 py-2 text-sm text-[#8b2e2e]" role="alert">
            {message}
          </p>
        ) : null}

        {editing ? (
          <form action={createWorkCredential} className="grid gap-4" encType="multipart/form-data">
            <div>
              <label className={labelClass()} htmlFor="credentialName">
                名称
              </label>
              <input
                id="credentialName"
                name="name"
                required
                maxLength={120}
                className={fieldClass()}
                placeholder="例如：身份证、护照、学位证"
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="credentialFile">
                文件
              </label>
              <input
                id="credentialFile"
                name="file"
                type="file"
                required
                className="mt-1 block w-full text-xs file:mr-2 file:inline-flex file:h-8 file:items-center file:justify-center file:border-2 file:border-[var(--ink)] file:bg-[var(--panel)] file:px-3 file:leading-none"
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">支持 PDF、图片、Word/Excel/PPT、TXT、ZIP，单文件不超过 25MB。</p>
            </div>
            <SaveButton label="保存" />
          </form>
        ) : null}

        {credentials.length === 0 && !editing ? (
          <div className="grid min-h-[12rem] place-items-center">
            <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">还没有证件。点「记一条」上传。</p>
          </div>
        ) : (
          <ul className={`grid gap-3 ${editing ? "mt-4" : ""}`}>
            {credentials.map((item) => {
              const when = item.createdAt.toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
              const sizeMb = (item.sizeBytes / (1024 * 1024)).toFixed(item.sizeBytes >= 1024 * 1024 ? 1 : 2);
              const sizeLabel = item.sizeBytes >= 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(item.sizeBytes / 1024)} KB`;
              return (
                <li key={item.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--gold-deep)]">{item.name}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {when} · {sizeLabel}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{item.originalName}</p>
                    </div>
                    <a
                      href={`/api/work/credentials/${item.id}`}
                      className={submitClass()}
                      download={item.originalName}
                    >
                      下载
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
