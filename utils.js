export const NAV_ITEMS = [
  { id: "home", label: "Acasă" },
  { id: "details", label: "Documentație" },
  { id: "bibliography", label: "Bibliografie" },
];

export const TABS = ["Politica", "Drepturi", "Quiz", "Media"];

const TAB_LABELS = {
  Politica: "Istorie Politică",
  Drepturi: "Drepturile Omului",
};

export const getTabLabel = (tab) => TAB_LABELS[tab] ?? tab;

export const makeInputStyle = (theme, fontSize = "14px") => ({
  padding: "8px",
  borderRadius: "4px",
  border: `1px solid ${theme.borderColor}`,
  backgroundColor: theme.inputBg,
  color: theme.textPrimary,
  fontSize,
});

export const slugify = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export const generateId = () => {
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 9);
};
