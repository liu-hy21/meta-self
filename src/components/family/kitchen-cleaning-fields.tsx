import type { KitchenCleaningCadence } from "@prisma/client";

import { fieldClass, labelClass } from "@/components/ui/form-shell";
import { cleaningCadences } from "@/lib/kitchen-cleaning";

export function KitchenCleaningFields({
  idPrefix,
  name,
  cadence,
  description,
  id,
  showCadenceSelect = false,
}: {
  idPrefix: string;
  name: string;
  cadence: KitchenCleaningCadence;
  description: string;
  id?: string;
  showCadenceSelect?: boolean;
}) {
  const nameId = `${idPrefix}-name`;
  const cadenceId = `${idPrefix}-cadence`;
  const descId = `${idPrefix}-description`;

  return (
    <>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {!showCadenceSelect ? <input type="hidden" name="cadence" value={cadence} /> : null}
      <div>
        <label className={labelClass()} htmlFor={nameId}>
          名称
        </label>
        <input id={nameId} name="name" className={fieldClass()} defaultValue={name} required maxLength={80} />
      </div>
      {showCadenceSelect ? (
        <div>
          <label className={labelClass()} htmlFor={cadenceId}>
            频率
          </label>
          <select id={cadenceId} name="cadence" className={fieldClass()} defaultValue={cadence} required>
            {cleaningCadences.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className={labelClass()} htmlFor={descId}>
          说明
        </label>
        <textarea
          id={descId}
          name="description"
          className={`${fieldClass()} min-h-20`}
          defaultValue={description}
          placeholder="清洁范围、用品、注意事项等"
        />
      </div>
    </>
  );
}
