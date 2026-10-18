export const boardAdviceSections = [
  { id: "diet", title: "饮食建议" },
  { id: "sleep", title: "睡眠建议" },
  { id: "fitness", title: "健身建议" },
  { id: "exam", title: "体检建议" },
  { id: "mind", title: "心态建议" },
  { id: "work", title: "工作建议" },
  { id: "stack", title: "技术栈建议" },
  { id: "relation", title: "关系建议" },
  { id: "assets", title: "资产建议" },
] as const;

export type BoardAdviceSectionId = (typeof boardAdviceSections)[number]["id"];

export type BoardAdviceSectionView = {
  id: BoardAdviceSectionId;
  title: string;
  text: string | null;
};

export const boardAdviceSectionSplitIndex = 5;
