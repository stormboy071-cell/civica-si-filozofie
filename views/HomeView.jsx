import React, { useEffect, useRef, useState } from "react";
import AccordionItem from "../components/AccordionItem.jsx";
import {
  getAppSettings,
  getSectionContentType,
  getTabLabel,
  getTabs,
  makeInputStyle,
} from "../utils.js";

const HomeView = ({
  data,
  activeTab,
  setActiveTab,
  openSectionIndex,
  setOpenSectionIndex,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onUploadMedia,
  onNavigateToDetails,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSection,
  onReorderTab,
  onUpdateAppSettings,
  onUpdateTabLabel,
  onAddTab,
  onDeleteTab,
  theme,
  isDevMode,
  searchQuery,
  showOnboarding,
  onDismissOnboarding,
  mediaUploadStatus,
}) => {
  const appSettings = getAppSettings(data);
  const inputStyle = makeInputStyle(theme);
  const [newSectionTitle, setNewSectionTitle] = useState("Istoria politica");
  const [newTabLabel, setNewTabLabel] = useState("Procesele afective");

  const GenericAddCard = ({ onClick, label }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: theme.sectionBg,
          borderRadius: "18px",
          border: "2px dashed " + theme.textSecondary,
          height: "100%",
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
          borderColor: isHovered ? theme.accent : theme.textSecondary,
          color: isHovered ? theme.accent : theme.textSecondary,
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <h3
          style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}
        >
          {label}
        </h3>
      </div>
    );
  };

  const UploadCard = ({ onUpload }) => {
    const inputRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: theme.sectionBg,
          borderRadius: "18px",
          border: "2px dashed " + theme.textSecondary,
          height: "100%",
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
          borderColor: isHovered ? theme.accent : theme.textSecondary,
          color: isHovered ? theme.accent : theme.textSecondary,
        }}
      >
        <input
          type="file"
          accept="video/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUpload(file);
              e.target.value = "";
            }
          }}
        />
        <div style={{ marginBottom: "16px" }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <h3
          style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}
        >
          Adaugă video
        </h3>
      </div>
    );
  };

  const currentSections = data[activeTab] || [];
  const tabs = getTabs(data);
  const normalizedQuery = String(searchQuery || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const hasQuery = normalizedQuery.length > 0;

  useEffect(() => {
    if (hasQuery) {
      setOpenSectionIndex(0);
    }
  }, [hasQuery, setOpenSectionIndex]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
      setOpenSectionIndex(0);
    }
  }, [activeTab, tabs, setActiveTab, setOpenSectionIndex]);

  const normalizeField = (value) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const itemMatchesQuery = (item) => {
    const haystack = [
      item.nume,
      item.lucrare_relevanta,
      item.comentariu_filosofic,
      item.detailed_text,
      Array.isArray(item.options) ? item.options.join(" ") : "",
      item.type,
    ]
      .map(normalizeField)
      .join(" ");

    return haystack.includes(normalizedQuery);
  };

  const displaySections = hasQuery
    ? currentSections
        .map((section, sIdx) => {
          const sectionHaystack =
            normalizeField(section.title) +
            " " +
            normalizeField(section.description);
          if (sectionHaystack.includes(normalizedQuery)) {
            return { ...section, _originalIndex: sIdx };
          }
          const filteredItems = (section.items || []).filter(itemMatchesQuery);
          if (filteredItems.length === 0) return null;
          return { ...section, items: filteredItems, _originalIndex: sIdx };
        })
        .filter(Boolean)
    : currentSections.map((section, sIdx) => ({
        ...section,
        _originalIndex: sIdx,
      }));

  const totalMatches = displaySections.reduce(
    (sum, section) => sum + (section.items?.length || 0),
    0,
  );
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [draggingTabIndex, setDraggingTabIndex] = useState(null);

  const handleCreateSection = (event) => {
    event.preventDefault();
    const cleanTitle = newSectionTitle.trim();
    if (!cleanTitle) return;
    onAddSection(activeTab, cleanTitle);
    setOpenSectionIndex(currentSections.length);
    setNewSectionTitle("");
  };

  const handleDragStart = (event, sectionIndex) => {
    if (!isDevMode) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(sectionIndex));
    setDraggingIndex(sectionIndex);
  };

  const handleTabDragStart = (event, tabIndex) => {
    if (!isDevMode) return;
    event.dataTransfer.effectAllowed = "move";
    // use a custom key so we don't mix with section drags
    try {
      event.dataTransfer.setData("text/tab", String(tabIndex));
    } catch (e) {
      // fallback
      event.dataTransfer.setData("text/plain", `tab:${tabIndex}`);
    }
    setDraggingTabIndex(tabIndex);
  };

  const handleDragEnd = (event) => {
    setDraggingIndex(null);
    event.currentTarget.style.opacity = "";
  };

  const handleDragOver = (event) => {
    if (!isDevMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event, targetIndex) => {
    if (!isDevMode) return;
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(sourceIndex)) return;
    if (sourceIndex === targetIndex) return;
    onReorderSection(activeTab, sourceIndex, targetIndex);
    setDraggingIndex(null);
  };
  const handleCreateTab = (event) => {
    event.preventDefault();
    const cleanLabel = newTabLabel.trim();
    if (!cleanLabel) return;
    onAddTab(cleanLabel);
    setNewTabLabel("");
  };

  const handleTabDrop = (event, targetIndex) => {
    if (!isDevMode || !onReorderTab) return;
    event.preventDefault();
    let sourceIndex = null;
    try {
      const v = event.dataTransfer.getData("text/tab");
      if (v) sourceIndex = Number(v);
    } catch (e) {}
    if (sourceIndex === null || !Number.isFinite(sourceIndex)) {
      // try fallback
      const plain = event.dataTransfer.getData("text/plain") || "";
      const m = plain.match(/tab:(\d+)/);
      if (m) sourceIndex = Number(m[1]);
    }
    if (!Number.isFinite(sourceIndex)) return;
    if (sourceIndex === targetIndex) return;
    onReorderTab(sourceIndex, targetIndex);
    setDraggingTabIndex(null);
  };

  const handleTabDragEnd = (event) => {
    setDraggingTabIndex(null);
    try {
      event.currentTarget.style.opacity = "";
    } catch (e) {}
  };

  return (
    <div>
      <div
        className="civica-hero"
        style={{
          textAlign: "center",
          marginBottom: "72px",
          marginTop: "40px",
          padding: "44px 28px",
          borderRadius: "32px",
          background: theme.sectionBg,
          border: `1px solid ${theme.borderColor}`,
          boxShadow: theme.shadow,
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 16px",
            borderRadius: "999px",
            marginBottom: "18px",
            backgroundColor: `${theme.accent}14`,
            color: theme.accent,
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {isDevMode ? (
            <input
              value={appSettings.heroKicker}
              onChange={(e) =>
                onUpdateAppSettings({ heroKicker: e.target.value })
              }
              style={{
                ...inputStyle,
                width: "260px",
                textAlign: "center",
                color: theme.accent,
                fontSize: "13px",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            />
          ) : (
            appSettings.heroKicker
          )}
        </div>
        {isDevMode ? (
          <textarea
            className="civica-hero-title"
            value={appSettings.heroTitle}
            onChange={(e) => onUpdateAppSettings({ heroTitle: e.target.value })}
            rows={2}
            style={{
              ...inputStyle,
              width: "min(760px, 100%)",
              marginBottom: "16px",
              textAlign: "center",
              color: theme.textPrimary,
              fontSize: "46px",
              fontWeight: "700",
              fontFamily: "'Cormorant Garamond', serif",
              lineHeight: "1",
              resize: "vertical",
            }}
          />
        ) : (
          <h1
            className="civica-hero-title"
            style={{
              color: theme.textPrimary,
              fontSize: "54px",
              fontWeight: "700",
              marginBottom: "16px",
              letterSpacing: "-0.04em",
              fontFamily: "'Cormorant Garamond', serif",
              lineHeight: "0.95",
            }}
          >
            {appSettings.heroTitle}
          </h1>
        )}
        <div
          style={{
            width: "72px",
            height: "4px",
            backgroundColor: theme.accent,
            margin: "0 auto 22px auto",
            borderRadius: "999px",
          }}
        ></div>
        <div
          className="civica-hero-sub"
          style={{
            color: theme.textSecondary,
            fontSize: "18px",
            fontWeight: "500",
            maxWidth: "720px",
            margin: "0 auto",
            lineHeight: "1.8",
          }}
        >
          {isDevMode ? (
            <textarea
              value={appSettings.heroSubtitle}
              onChange={(e) =>
                onUpdateAppSettings({ heroSubtitle: e.target.value })
              }
              rows={3}
              style={{
                ...inputStyle,
                width: "100%",
                textAlign: "center",
                fontSize: "16px",
                lineHeight: "1.6",
                resize: "vertical",
              }}
            />
          ) : (
            appSettings.heroSubtitle
          )}
        </div>

        <div
          className="civica-filter-note"
          style={{
            maxWidth: "640px",
            margin: "18px auto 0 auto",
            padding: "12px 16px",
            borderRadius: "18px",
            backgroundColor: `${theme.accent}10`,
            border: `1px solid ${theme.borderColor}`,
            color: theme.textSecondary,
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          {isDevMode ? (
            <textarea
              value={appSettings.filterNote}
              onChange={(e) =>
                onUpdateAppSettings({ filterNote: e.target.value })
              }
              rows={2}
              style={{
                ...inputStyle,
                width: "100%",
                fontSize: "14px",
                lineHeight: "1.5",
                resize: "vertical",
              }}
            />
          ) : (
            appSettings.filterNote
          )}
        </div>

        {showOnboarding && (
          <div
            className="civica-onboarding"
            style={{
              margin: "28px auto 0 auto",
              maxWidth: "680px",
              backgroundColor: theme.sectionBg,
              border: `1px solid ${theme.borderColor}`,
              borderRadius: "16px",
              padding: "18px 20px",
              textAlign: "left",
              boxShadow: theme.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontWeight: "700",
                  color: theme.textPrimary,
                  fontSize: "16px",
                }}
              >
                Ghid rapid de început
              </div>
              <button
                onClick={onDismissOnboarding}
                style={{
                  border: "none",
                  background: "none",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Am înțeles
              </button>
            </div>
            <div
              style={{
                marginTop: "10px",
                color: theme.textSecondary,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              1. Alege o categorie din taburi și deschide secțiunile.
              <br />
              2. Folosește filtrul din bara de sus pentru a găsi rapid concepte.
              <br />
              3. Activează „Mod Dezvoltator” din setări pentru a adăuga sau
              edita conținut.
            </div>
          </div>
        )}

        <div
          className="civica-tab-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginTop: "40px",
          }}
        >
          {tabs.map((tab, tabIndex) => {
            const isActive = activeTab === tab;
            const isTabDragging = draggingTabIndex === tabIndex;
            return (
              <div
                key={tab}
                draggable={isDevMode}
                onDragStart={(event) => handleTabDragStart(event, tabIndex)}
                onDragEnd={handleTabDragEnd}
                onDragOver={handleDragOver}
                onDrop={(event) => handleTabDrop(event, tabIndex)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  alignItems: "center",
                  opacity: isTabDragging ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setOpenSectionIndex(0);
                    }}
                    style={{
                      padding: "12px 28px",
                      borderRadius: "30px",
                      border: isActive
                        ? `1px solid ${theme.accent}`
                        : "1px solid transparent",
                      backgroundColor: isActive
                        ? theme.accent
                        : theme.sectionBg,
                      color: isActive ? "#fff" : theme.textSecondary,
                      fontWeight: "700",
                      fontSize: "14px",
                      boxShadow: isActive
                        ? `0 4px 12px ${theme.accent}40`
                        : "none",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {getTabLabel(tab, data)}
                  </button>
                  {isDevMode && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteTab(tab);
                      }}
                      title="Sterge categoria principala"
                      style={{
                        padding: "9px 12px",
                        border: `1px solid ${theme.danger}`,
                        borderRadius: "999px",
                        backgroundColor: theme.dangerBg,
                        color: theme.danger,
                        cursor: "pointer",
                        fontWeight: "800",
                        fontSize: "12px",
                      }}
                    >
                      Sterge
                    </button>
                  )}
                </div>
                {isDevMode && isActive && (
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={getTabLabel(tab, data)}
                      onChange={(e) => onUpdateTabLabel(tab, e.target.value)}
                      style={{
                        ...inputStyle,
                        width: "180px",
                        textAlign: "center",
                        fontSize: "12px",
                        padding: "7px 10px",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isDevMode && (
          <form
            onSubmit={handleCreateTab}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <input
              value={newTabLabel}
              onChange={(e) => setNewTabLabel(e.target.value)}
              placeholder="Ex: Procesele afective"
              style={{
                ...inputStyle,
                width: "min(280px, 100%)",
                textAlign: "center",
                fontSize: "13px",
              }}
            />
            <button
              type="submit"
              disabled={!newTabLabel.trim()}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "12px",
                backgroundColor: newTabLabel.trim()
                  ? theme.accent
                  : theme.textSecondary,
                color: "#fff",
                cursor: newTabLabel.trim() ? "pointer" : "not-allowed",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              + Adauga categorie
            </button>
          </form>
        )}
      </div>

      <div style={{ minHeight: "400px" }}>
        {mediaUploadStatus && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: theme.sectionBg,
              border: `1px solid ${theme.borderColor}`,
              color: theme.textPrimary,
              fontSize: "14px",
            }}
          >
            {mediaUploadStatus}
          </div>
        )}

        {hasQuery && (
          <div
            className="civica-results"
            style={{
              marginBottom: "20px",
              textAlign: "center",
              color: theme.textSecondary,
              fontSize: "14px",
            }}
          >
            {totalMatches > 0
              ? `Afișăm ${totalMatches} repere care se potrivesc cu filtrul tău.`
              : "Nu am găsit încă rezultate pentru acest filtru."}
          </div>
        )}

        {displaySections.length === 0 && (
          <div
            className="civica-empty"
            style={{
              backgroundColor: theme.sectionBg,
              border: `1px dashed ${theme.borderColor}`,
              borderRadius: "16px",
              padding: "28px",
              textAlign: "center",
              color: theme.textSecondary,
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: theme.textPrimary,
                marginBottom: "8px",
              }}
            >
              {hasQuery ? "Niciun rezultat" : "Nu există conținut încă"}
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {hasQuery
                ? "Încearcă un termen mai scurt, un sinonim sau caută doar numele autorului."
                : "Activează Mod Dezvoltator din setări și adaugă prima categorie și primele carduri."}
            </div>
          </div>
        )}

        {displaySections.map((section) => {
          const sectionIndex = section._originalIndex ?? 0;
          const sectionContentType = getSectionContentType(section, activeTab);
          const isDragging = draggingIndex === sectionIndex;
          return (
            <div
              key={section.id}
              draggable={isDevMode}
              onDragStart={(event) => handleDragStart(event, sectionIndex)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, sectionIndex)}
              style={{
                opacity: isDragging ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <AccordionItem
                section={section}
                activeTab={activeTab}
                isOpen={openSectionIndex === sectionIndex}
                onClick={() =>
                  setOpenSectionIndex(
                    openSectionIndex === sectionIndex ? null : sectionIndex,
                  )
                }
                canEdit={isDevMode}
                canDelete={isDevMode}
                onUpdateItem={(cardId, updatedData) =>
                  onUpdateCard(activeTab, sectionIndex, cardId, updatedData)
                }
                onDeleteItem={(cardId) =>
                  onDeleteCard(activeTab, sectionIndex, cardId)
                }
                onUpdateSection={(updatedSection) =>
                  onUpdateSection(activeTab, sectionIndex, updatedSection)
                }
                onDeleteSection={() => onDeleteSection(activeTab, section.id)}
                extraItem={
                  isDevMode ? (
                    sectionContentType === "media" ? (
                      <UploadCard
                        onUpload={(file) =>
                          onUploadMedia(file, activeTab, sectionIndex)
                        }
                      />
                    ) : (
                      <GenericAddCard
                        onClick={() => onAddCard(activeTab, sectionIndex)}
                        label={
                          sectionContentType === "quiz"
                            ? "Adaugă întrebare"
                            : "Adaugă card"
                        }
                      />
                    )
                  ) : null
                }
                onReadMore={(cardId) => onNavigateToDetails(cardId)}
                theme={theme}
              />
            </div>
          );
        })}

        {isDevMode && !hasQuery && (
          <form
            onSubmit={handleCreateSection}
            style={{
              marginTop: "30px",
              padding: "18px",
              border: `2px dashed ${theme.textSecondary}`,
              borderRadius: "18px",
              backgroundColor: theme.sectionBg,
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Ex: Istoria politica"
              style={{ ...inputStyle, flex: "1 1 240px", minWidth: "0" }}
            />
            <button
              type="submit"
              disabled={!newSectionTitle.trim()}
              style={{
                padding: "11px 18px",
                border: "none",
                borderRadius: "12px",
                backgroundColor: newSectionTitle.trim()
                  ? theme.accent
                  : theme.textSecondary,
                color: "#fff",
                cursor: newSectionTitle.trim() ? "pointer" : "not-allowed",
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              + Adauga sectiune
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HomeView;
