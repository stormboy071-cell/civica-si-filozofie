import React, { useState, useRef } from "react";
import ToggleSwitch from "./ToggleSwitch.jsx";
import { NAV_ITEMS, getTabLabel, slugify, makeInputStyle } from "../utils.js";
import { ACCENTS } from "../themes.js";

const NavBar = ({ currentView, onViewChange, isDarkMode, setIsDarkMode, isDevMode, setIsDevMode, accentKey, setAccentKey, theme, appData, activeTab, openSectionIndex, setOpenSectionIndex, searchQuery, setSearchQuery, onExport, onImport, onRestoreLocalAssets }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const fileInputRef = useRef(null);

  const currentSections = appData[activeTab] || [];
  const scopedSections = (openSectionIndex !== null && openSectionIndex !== undefined && currentSections[openSectionIndex])
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
    <nav className="civica-nav" style={{ 
      position: "sticky", top: 0, zIndex: 1000, 
      backgroundColor: theme.navBg, backdropFilter: "blur(12px)", 
      borderBottom: `1px solid ${theme.borderColor}`, padding: "0 20px",
      transition: "background-color 0.3s, border-color 0.3s"
    }}>
      <div className="civica-nav-inner" style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        
        <div className="civica-nav-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setIsTocOpen(!isTocOpen)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: theme.textPrimary, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Cuprins / Navigare Rapida"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

                {isTocOpen && (
                  <>
                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100 }} onClick={() => setIsTocOpen(false)} />
                    <div style={{ 
                      position: "absolute", top: "50px", left: 0, width: "280px", maxHeight: "80vh", overflowY: "auto",
                      backgroundColor: theme.menuBg, padding: "20px", borderRadius: "12px", 
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: `1px solid ${theme.borderColor}`, zIndex: 101 
                    }}>
                      <h4 style={{ margin: "0 0 16px 0", color: theme.textPrimary, fontSize: "16px", borderBottom: `2px solid ${theme.accent}`, paddingBottom: "8px", fontFamily: "'Playfair Display', serif" }}>
                        Cuprins: {getTabLabel(activeTab)}
                        {scopedSections.length === 1 ? ` / ${scopedSections[0].section.title}` : ""}
                      </h4>
                      
                      {currentSections.length === 0 ? (
                          <div style={{ fontSize: "13px", color: theme.textSecondary }}>Nu exista continut.</div>
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
                                                      background: "none", border: "none", cursor: "pointer", 
                                                      color: theme.accent, fontSize: "14px", textAlign: "left", padding: "4px 0",
                                                      width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                      transition: "opacity 0.2s"
                                                  }}
                                                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                                                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
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

            <div style={{ fontWeight: "800", fontSize: "18px", fontFamily: "'Playfair Display', serif", color: theme.textPrimary }}>
            Civica & Filozofie
            </div>
        </div>

        <div className="civica-nav-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="civica-nav-tabs" style={{ display: "flex", gap: "8px" }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: currentView === item.id ? theme.accent : "transparent",
                  color: currentView === item.id ? "#fff" : theme.textSecondary,
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cauta concepte, autori, lucrari..."
              className="civica-search"
              style={{ 
                ...makeInputStyle(theme, "13px"),
                padding: "8px 30px 8px 12px",
                borderRadius: "20px",
                width: "230px"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="Sterge cautarea"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ×
              </button>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: theme.textPrimary, padding: "8px", display: "flex", alignItems: "center" }}
              title="Setari"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            
            {isSettingsOpen && (
              <>
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100 }} onClick={() => setIsSettingsOpen(false)} />
                <div style={{ 
                  position: "absolute", top: "40px", right: 0, width: "240px", 
                  backgroundColor: theme.menuBg, padding: "20px", borderRadius: "12px", 
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: `1px solid ${theme.borderColor}`, zIndex: 101 
                }}>
                  <h4 style={{ margin: "0 0 16px 0", color: theme.textSecondary, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Setari</h4>
                  <ToggleSwitch label="Tema Intunecata" checked={isDarkMode} onChange={setIsDarkMode} theme={theme} />
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
                              boxShadow: isActive ? `0 0 0 2px ${theme.menuBg} inset` : "none"
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "20px", borderTop: `1px solid ${theme.borderColor}`, paddingTop: "15px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: theme.textSecondary, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Date Aplicatie</h4>
                    <button 
                        onClick={() => { onExport(); setIsSettingsOpen(false); }}
                        style={{ display: "block", width: "100%", padding: "8px", marginBottom: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "6px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                        Exporta Date (JSON)
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ display: "block", width: "100%", padding: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "6px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                        Importa Date
                    </button>
                    <button 
                        onClick={() => { onRestoreLocalAssets(); setIsSettingsOpen(false); }}
                        style={{ display: "block", width: "100%", padding: "8px", marginTop: "8px", backgroundColor: theme.sectionBg, border: `1px solid ${theme.borderColor}`, borderRadius: "6px", color: theme.textPrimary, cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                    >
                        Recupereaza Imagini Locale
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: "none" }} 
                        accept=".json" 
                        onChange={handleFileImport}
                    />
                  </div>

                  <div style={{ fontSize: "11px", color: theme.textSecondary, marginTop: "12px", fontStyle: "italic", lineHeight: "1.4" }}>
                    {isDevMode 
                      ? "Mod Dezvoltator: Poti sterge, adauga si modifica continutul." 
                      : "Mod Vizualizare: Doar previzualizare. Activeaza Mod Dezvoltator pentru a edita."}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;