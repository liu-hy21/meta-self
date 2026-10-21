import type { SeasoningUsageFrequency } from "@prisma/client";

import { fieldClass, labelClass } from "@/components/ui/form-shell";
import { kitchenUsageFrequencies } from "@/lib/kitchen";

export function KitchenPantryFields({
  idPrefix,
  name,
  usageFrequency,
  description,
  id,
}: {
  idPrefix: string;
  name: string;
  usageFrequency: SeasoningUsageFrequency;
  description: string;
  id?: string;
}) {
  const nameId = `${idPrefix}-name`;
  const freqId = `${idPrefix}-usageFrequency`;
  const descId = `${idPrefix}-description`;

  return (
    <>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div>
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <label className={labelClass()} htmlFor={nameId}>
              名称
            </label>
            <input id={nameId} name="name" className={fieldClass()} defaultValue={name} required maxLength={80} />
          </div>
          <div className="w-full">
            <label className={labelClass()} htmlFor={freqId}>
              使用频率
            </label>
            <select id={freqId} name="usageFrequency" className={fieldClass()} defaultValue={usageFrequency} required>
              {kitchenUsageFrequencies.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className={labelClass()} htmlFor={descId}>
          说明
        </label>
        <textarea
          id={descId}
          name="description"
          className={`${fieldClass()} min-h-20`}
          defaultValue={description}
          placeholder="存放位置、常用做法等"
        />
      </div>
    </>
  );
}
