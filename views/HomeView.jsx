import React, { useEffect, useRef, useState } from "react";
import AccordionItem from "../components/AccordionItem.jsx";
import { TABS, getTabLabel } from "../utils.js";

const HomeView = ({ data, activeTab, setActiveTab, openSectionIndex, setOpenSectionIndex, onUpdateCard, onDeleteCard, onAddCard, onUploadMedia, onNavigateToDetails, onAddSection, onUpdateSection, onDeleteSection, theme, isDevMode, searchQuery, showOnboarding, onDismissOnboarding }) => {
  const GenericAddCard = ({ onClick, label }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ backgroundColor: theme.sectionBg, borderRadius: "8px", border: "2px dashed " + theme.textSecondary, height: "100%", minHeight: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", transform: isHovered ? "scale(1.02)" : "scale(1)", borderColor: isHovered ? theme.accent : theme.textSecondary, color: isHovered ? theme.accent : theme.textSecondary }}>
        <div style={{ marginBottom: "16px" }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>{label}</h3>
      </div>
    );
  };

  const UploadCard = ({ onUpload }) => {
     const inputRef = useRef(null);
     const [isHovered, setIsHovered] = useState(false);
     return (
       <div onClick={() => inputRef.current?.click()} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ backgroundColor: theme.sectionBg, borderRadius: "8px", border: "2px dashed " + theme.textSecondary, height: "100%", minHeight: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", transform: isHovered ? "scale(1.02)" : "scale(1)", borderColor: isHovered ? theme.accent : theme.textSecondary, color: isHovered ? theme.accent : theme.textSecondary }}>
         <input type="file" accept="video/*" ref={inputRef} style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) { onUpload(file); e.target.value = ""; } }} />
         <div style={{ marginBottom: "16px" }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>
         <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Adaugă Video</h3>
       </div>
     );
  };

  const currentSections = data[activeTab] || [];
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
      item.type
    ].map(normalizeField).join(" ");
    return haystack.includes(normalizedQuery);
  };

  const displaySections = (hasQuery ? currentSections.map((section, sIdx) => {
    const sectionHaystack = normalizeField(section.title) + " " + normalizeField(section.description);
    if (sectionHaystack.includes(normalizedQuery)) {
      return { ...section, _originalIndex: sIdx };
    }
    const filteredItems = (section.items || []).filter(itemMatchesQuery);
    if (filteredItems.length === 0) return null;
    return { ...section, items: filteredItems, _originalIndex: sIdx };
  }).filter(Boolean) : currentSections.map((section, sIdx) => ({ ...section, _originalIndex: sIdx })));

  const totalMatches = displaySections.reduce((sum, section) => sum + (section.items?.length || 0), 0);

  return (
    <div>
        <div className="civica-hero" style={{ textAlign: "center", marginBottom: "60px", marginTop: "40px" }}>
            <h1 className="civica-hero-title" style={{ color: theme.textPrimary, fontSize: "48px", fontWeight: "800", marginBottom: "16px", letterSpacing: "-0.03em", fontFamily: "'Playfair Display', serif" }}>
              Politica ca fenomen de actualitate continua
            </h1>
            <div style={{ width: "60px", height: "4px", backgroundColor: theme.accent, margin: "0 auto 20px auto", borderRadius: "2px" }}></div>
            <p className="civica-hero-sub" style={{ color: theme.textSecondary, fontSize: "18px", fontWeight: "400", maxWidth: "600px", margin: "0 auto" }}>
              Explorează conceptele. Apasă pe "Vezi Detalii" pentru a citi și edita documentația extinsă pentru fiecare filozof.
            </p>

            {showOnboarding && (
              <div className="civica-onboarding" style={{ 
                margin: "28px auto 0 auto",
                maxWidth: "680px",
                backgroundColor: theme.sectionBg,
                border: `1px solid ${theme.borderColor}`,
                borderRadius: "16px",
                padding: "18px 20px",
                textAlign: "left",
                boxShadow: theme.shadow
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ fontWeight: "700", color: theme.textPrimary, fontSize: "16px" }}>Ghid rapid de început</div>
                  <button
                    onClick={onDismissOnboarding}
                    style={{ border: "none", background: "none", color: theme.textSecondary, cursor: "pointer", fontSize: "13px" }}
                  >
                    Am înțeles
                  </button>
                </div>
                <div style={{ marginTop: "10px", color: theme.textSecondary, fontSize: "14px", lineHeight: "1.6" }}>
                  1. Alege o categorie din taburi și deschide secțiunile.
                  <br />
                  2. Folosește căutarea globală pentru a găsi rapid concepte.
                  <br />
                  3. Activează "Mod Dezvoltator" din setări pentru a adăuga sau edita conținut.
                </div>
              </div>
            )}

            <div className="civica-tab-row" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "40px" }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setOpenSectionIndex(0); }}
                  style={{
                    padding: "12px 28px", borderRadius: "30px", border: activeTab === tab ? `1px solid ${theme.accent}` : "1px solid transparent",
                    backgroundColor: activeTab === tab ? theme.accent : theme.sectionBg, color: activeTab === tab ? "#fff" : theme.textSecondary,
                    fontWeight: "600", fontSize: "14px", boxShadow: activeTab === tab ? `0 4px 12px ${theme.accent}40` : "none",
                    cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  {getTabLabel(tab)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ minHeight: "400px" }}>
            {hasQuery && (
              <div className="civica-results" style={{ marginBottom: "20px", textAlign: "center", color: theme.textSecondary, fontSize: "14px" }}>
                {totalMatches > 0 ? `Rezultate găsite: ${totalMatches}` : "Niciun rezultat pentru căutarea curentă."}
              </div>
            )}

            {displaySections.length === 0 && (
              <div className="civica-empty" style={{
                backgroundColor: theme.sectionBg,
                border: `1px dashed ${theme.borderColor}`,
                borderRadius: "16px",
                padding: "28px",
                textAlign: "center",
                color: theme.textSecondary
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: theme.textPrimary, marginBottom: "8px" }}>
                  {hasQuery ? "Niciun rezultat" : "Nu există conținut încă"}
                </div>
                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  {hasQuery
                    ? "Încearcă alte cuvinte cheie sau verifică diacriticele."
                    : "Activează Mod Dezvoltator din setări și adaugă prima categorie și primele carduri."}
                </div>
              </div>
            )}

            {displaySections.map((section) => {
              const sectionIndex = section._originalIndex ?? 0;
              return (
              <AccordionItem 
                key={section.id}
                section={section}
                isOpen={openSectionIndex === sectionIndex}
                onClick={() => setOpenSectionIndex(openSectionIndex === sectionIndex ? null : sectionIndex)}
                canEdit={isDevMode} 
                canDelete={isDevMode}
                onUpdateItem={(cardId, updatedData) => onUpdateCard(activeTab, sectionIndex, cardId, updatedData)}
                onDeleteItem={(cardId) => onDeleteCard(activeTab, sectionIndex, cardId)}
                onUpdateSection={(updatedSection) => onUpdateSection(activeTab, sectionIndex, updatedSection)}
                onDeleteSection={() => onDeleteSection(activeTab, section.id)}
                extraItem={
                  isDevMode ? (
                    activeTab === "Media" 
                      ? <UploadCard onUpload={(file) => onUploadMedia(file, sectionIndex)} /> 
                      : <GenericAddCard onClick={() => onAddCard(activeTab, sectionIndex)} label={activeTab === "Quiz" ? "Adaugă Întrebare" : "Adaugă Card"} />
                  ) : null
                }
                onReadMore={(cardId) => onNavigateToDetails(cardId)}
                theme={theme}
              />
            );
            })}
            
            {isDevMode && !hasQuery && (
              <div 
                onClick={() => onAddSection(activeTab)}
                style={{
                  marginTop: "30px", padding: "20px", border: `2px dashed ${theme.textSecondary}`, borderRadius: "12px",
                  textAlign: "center", cursor: "pointer", color: theme.textSecondary, fontWeight: "600",
                  transition: "all 0.2s", backgroundColor: theme.sectionBg
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.textSecondary; e.currentTarget.style.color = theme.textSecondary; }}
              >
                + Adaugă Categorie Nouă (ex: Modernism, Secolul XX)
              </div>
            )}
          </div>
    </div>
  );
};

export default HomeView;
