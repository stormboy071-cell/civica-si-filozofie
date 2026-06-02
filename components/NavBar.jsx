import React, { useRef, useState } from "react";
import ToggleSwitch from "./ToggleSwitch.jsx";
import { NAV_ITEMS, getTabLabel, slugify, makeInputStyle } from "../utils.js";
import { ACCENTS } from "../themes.js";

const NavBar = ({
  currentView,
  onViewChange,
  isDarkMode,
  setIsDarkMode,
  isDevMode,
  setIsDevMode,
  accentKey,
  setAccentKey,
  theme,
  appData,
  activeTab,
  openSectionIndex,
  setOpenSectionIndex,
  searchQuery,
  setSearchQuery,
  onExport,
  onImport,
  onRestoreLocalAssets,
  onForceCloudSync,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const fileInputRef = useRef(null);

  const currentSections = appData[activeTab] || [];
  const scopedSections =
    openSectionIndex !== null && openSectionIndex !== undefined && currentSections[openSectionIndex]
      ? [{ section: currentSections[openSectionIndex], sIdx: openSectionIndex }]
      : currentSections.map((section, sIdx) => ({ section, sIdx }));

  const handleTocClick = (itemNume, sIdx) => {
    if (currentView !== "home") {
      onViewChange("home");
    }
    setOpenSectionIndex(sIdx);
    setTimeout(() => {
      const id = slugify(itemNume);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    setIsTocOpen(false);
  };

  const handleFileImport = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (event.target) event.target.value = "";
  };

  return (
    <nav
      className="civica-nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: theme.navBg,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${theme.borderColor}`,
        padding: "0 20px",
        transition: "background-color 0.3s, border-color 0.3s",
      }}
    >
      <div
        className="civica-nav-inner"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          padding: "16px 0",
        }}
      >
        <div
          className="civica-nav-top"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div className="civica-nav-left" style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setIsTocOpen(!isTocOpen)}
                className="civica-icon-button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.textPrimary,
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Cuprins / Navigare rapidă"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              {isTocOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setIsTocOpen(false)} />
                  <div
                    className="civica-toc-menu"
                    style={{
                      position: "absolute",
                      top: "56px",
                      left: 0,
                      width: "280px",
                      maxHeight: "80vh",
                      overflowY: "auto",
                      backgroundColor: theme.menuBg,
                      padding: "20px",
                      borderRadius: "18px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      border: `1px solid ${theme.borderColor}`,
                      zIndex: 101,
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 16px 0",
                        color: theme.textPrimary,
                        fontSize: "16px",
                        borderBottom: `2px solid ${theme.accent}`,
                        paddingBottom: "8px",
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      Cuprins: {getTabLabel(activeTab, appData)}
                      {scopedSections.length === 1 ? ` / ${scopedSections[0].section.title}` : ""}
                    </h4>

                    {currentSections.length === 0 ? (
                      <div style={{ fontSize: "13px", color: theme.textSecondary }}>Nu există conținut.</div>
                    ) : (
                      scopedSections.map(({ section, sIdx }) => (
                        <div key={sIdx} style={{ marginBottom: "16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", marginBottom: "8px" }}>
                            {section.title}
                          </div>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {section.items.map((item) => (
                              <li key={item.id} style={{ marginBottom: "6px" }}>
                                <button
                                  onClick={() => handleTocClick(item.nume, sIdx)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: theme.accent,
                                    fontSize: "14px",
                                    textAlign: "left",
                                    padding: "4px 0",
                                    width: "100%",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    transition: "opacity 0.2s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                >
                                  • {item.nume}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="civica-nav-brand" style={{ minWidth: 0 }}>
              <div
                className="civica-nav-kicker"
                style={{
                  color: theme.textSecondary,
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                Atlas educațional
              </div>
              <div
                className="civica-nav-title"
                style={{
                  fontWeight: "800",
                  fontSize: "22px",
                  fontFamily: "'Cormorant Garamond', serif",
                  color: theme.textPrimary,
                  lineHeight: "1",
                }}
              >
                Civică & Filosofie
              </div>
            </div>
          </div>

          <div className="civica-nav-utility" style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="civica-icon-button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: theme.textPrimary,
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Setări"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {isSettingsOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setIsSettingsOpen(false)} />
                <div
                  className="civica-settings-menu"
                  style={{
                    position: "absolute",
                    top: "56px",
                    right: 0,
                    width: "240px",
                    backgroundColor: theme.menuBg,
                    padding: "20px",
                    borderRadius: "18px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    border: `1px solid ${theme.borderColor}`,
                    zIndex: 101,
                  }}
                >
                  <h4 style={{ margin: "0 0 16px 0", color: theme.textSecondary, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Setări
                  </h4>
                  <ToggleSwitch label="Temă întunecată" checked={isDarkMode} onChange={setIsDarkMode} theme={theme} />
                  <ToggleSwitch label="Mod Dezvoltator" checked={isDevMode} onChange={setIsDevMode} theme={theme} />

                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "12px", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      Accent
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {Object.keys(ACCENTS).map((key) => {
                        const color = isDarkMode ? ACCENTS[key].dark : ACCENTS[key].light;
                        const isActive = accentKey === key;

                        return (
                          <button
                            key={key}
                            onClick={() => setAccentKey(key)}
                            title={key}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              border: isActive ? `2px solid ${theme.textPrimary}` : `1px solid ${theme.borderColor}`,
                              backgroundColor: color,
                              cursor: "pointer",
                              boxShadow: isActive ? `0 0 0 2px ${theme.menuBg} inset` : "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: "20px", borderTop: `1px solid ${theme.borderColor}`, paddingTop: "15px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: theme.textSecondary, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Date aplicație
                    </h4>
                    <button
                      onClick={() => {
                        onExport();
                        setIsSettingsOpen(false);
                      }}
                      style={{ display: "block", width: "100%", padding: "8px", marginBottom: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "10px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                      Exportă backup prezentare
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: "block", width: "100%", padding: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "10px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                      Importă date
                    </button>
                    <button
                      onClick={() => {
                        onForceCloudSync();
                        setIsSettingsOpen(false);
                      }}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "10px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                      Forțează sincronizarea în cloud
                    </button>
                    <button
                      onClick={() => {
                        onRestoreLocalAssets();
                        setIsSettingsOpen(false);
                      }}
                      style={{ display: "block", width: "100%", padding: "8px", marginTop: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "10px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                      Recuperează imagini locale
                    </button>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".json" onChange={handleFileImport} />
                  </div>

                  <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "12px", fontStyle: "italic", lineHeight: "1.4" }}>
                    {isDevMode
                      ? "Mod Dezvoltator: poți șterge, adăuga și modifica conținutul."
                      : "Mod Vizualizare: doar previzualizare. Activează Mod Dezvoltator pentru a edita."}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="civica-nav-actions"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div className="civica-nav-tabs" style={{ display: "flex", gap: "8px", minWidth: 0 }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="civica-nav-tab"
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: currentView === item.id ? theme.accent : "transparent",
                  color: currentView === item.id ? "#fff" : theme.textSecondary,
                  borderRadius: "999px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="civica-search-wrap" style={{ position: "relative", width: "340px", maxWidth: "100%" }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrează după concept, autor sau lucrare"
              className="civica-search"
              style={{
                ...makeInputStyle(theme, "13px"),
                padding: "11px 38px 11px 14px",
                borderRadius: "999px",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="Șterge filtrul"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "20px",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ×
              </button>
            )}
            <div
              className="civica-search-hint"
              style={{
                marginTop: "8px",
                paddingLeft: "4px",
                color: theme.textSecondary,
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              Filtrul se aplică doar în categoria selectată acum.
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
