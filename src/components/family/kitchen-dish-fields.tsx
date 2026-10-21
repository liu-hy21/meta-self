import type { DishDifficulty } from "@prisma/client";

import { fieldClass, labelClass } from "@/components/ui/form-shell";
import { dishDifficulties } from "@/lib/kitchen-dish";

export function KitchenDishFields({
  idPrefix,
  name,
  difficulty,
  ingredients,
  cookingProcess,
  id,
  showDifficultySelect = false,
}: {
  idPrefix: string;
  name: string;
  difficulty: DishDifficulty;
  ingredients: string;
  cookingProcess: string;
  id?: string;
  showDifficultySelect?: boolean;
}) {
  const nameId = `${idPrefix}-name`;
  const diffId = `${idPrefix}-difficulty`;
  const ingredientsId = `${idPrefix}-ingredients`;
  const processId = `${idPrefix}-cooking-process`;

  return (
    <>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {!showDifficultySelect ? <input type="hidden" name="difficulty" value={difficulty} /> : null}
      <div>
        <label className={labelClass()} htmlFor={nameId}>
          名称
        </label>
        <input id={nameId} name="name" className={fieldClass()} defaultValue={name} required maxLength={80} />
      </div>
      {showDifficultySelect ? (
        <div>
          <label className={labelClass()} htmlFor={diffId}>
            做菜难度
          </label>
          <select id={diffId} name="difficulty" className={fieldClass()} defaultValue={difficulty} required>
            {dishDifficulties.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className={labelClass()} htmlFor={ingredientsId}>
          原材料
        </label>
        <textarea
          id={ingredientsId}
          name="ingredients"
          className={`${fieldClass()} min-h-20`}
          defaultValue={ingredients}
          placeholder="主料、配菜、调料等"
        />
      </div>
      <div>
        <label className={labelClass()} htmlFor={processId}>
          烹饪流程
        </label>
        <textarea
          id={processId}
          name="cookingProcess"
          className={`${fieldClass()} min-h-24`}
          defaultValue={cookingProcess}
          placeholder="步骤、火候、时间等"
        />
      </div>
    </>
  );
}
