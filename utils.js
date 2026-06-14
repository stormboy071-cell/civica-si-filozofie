export const NAV_ITEMS = [
  { id: "home", label: "Acasă" },
  { id: "details", label: "Documentație" },
  { id: "bibliography", label: "Bibliografie" },
];

export const TABS = ["Politica", "Drepturi", "Quiz", "Media"];

export const DEFAULT_TAB_LABELS = {
  Politica: "Istorie politică",
  Drepturi: "Drepturile omului",
  Quiz: "Quiz",
  Media: "Media",
};

export const DEFAULT_APP_SETTINGS = {
  heroKicker: "Psihologie",
  heroTitle: "Politica, o temă de eternă actualitate...",
  heroSubtitle:
    "Explorează conceptele esențiale și deschide „Vezi detalii” pentru a citi și edita documentația extinsă pentru fiecare filosof.",
  documentationTitle: "Documenta\u021bie filosofic\u0103",
  filterNote:
    "Folosește filtrul din bara de sus ca să restrângi rapid lista curentă după concepte, autori sau lucrări.",
  tabLabels: DEFAULT_TAB_LABELS,
};

export const getAppSettings = (data) => ({
  ...DEFAULT_APP_SETTINGS,
  ...(data?._settings || {}),
  tabLabels: {
    ...DEFAULT_TAB_LABELS,
    ...(data?._settings?.tabLabels || {}),
  },
});

export const getTabLabel = (tab, data) =>
  getAppSettings(data).tabLabels[tab] ?? tab;

export const getTabs = (data) => {
  const savedTabs = data?._settings?.tabOrder;
  const orderedTabs =
    Array.isArray(savedTabs) && savedTabs.length > 0 ? savedTabs : TABS;
  const knownTabs = new Set([
    ...TABS,
    ...Object.keys(data || {}).filter((key) => Array.isArray(data?.[key])),
  ]);
  const tabs = orderedTabs.filter((tab) => knownTabs.has(tab));

  Object.keys(data || {}).forEach((key) => {
    if (
      Array.isArray(data[key]) &&
      !tabs.includes(key) &&
      key !== "Bibliografie"
    ) {
      tabs.push(key);
    }
  });

  return tabs.length > 0 ? tabs : TABS;
};

export const getSectionContentType = (section, tabKey) => {
  if (section?.contentType) return section.contentType;
  if (tabKey === "Quiz") return "quiz";
  if (tabKey === "Media") return "media";
  return "standard";
};

export const makeInputStyle = (theme, fontSize = "14px") => ({
  padding: "10px 12px",
  borderRadius: "12px",
  border: `1px solid ${theme.borderColor}`,
  backgroundColor: theme.inputBg,
  color: theme.textPrimary,
  fontSize,
  fontFamily: "'Manrope', sans-serif",
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
  return (
    "id-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substr(2, 9)
  );
};
