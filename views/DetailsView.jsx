import React, { useEffect } from "react";
import { slugify } from "../utils.js";

const DetailsView = ({ data, scrollTarget, onUpdateCard, theme, isDevMode }) => {
  useEffect(() => {
    if (scrollTarget) { setTimeout(() => { const el = document.getElementById(`doc-${scrollTarget}`); el?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300); }
  }, [scrollTarget]);

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", backgroundColor: theme.cardBg, padding: "60px", borderRadius: "8px", boxShadow: theme.shadow, minHeight: "100vh", color: theme.textPrimary }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "36px", borderBottom: `1px solid ${theme.borderColor}`, paddingBottom: "20px", marginBottom: "40px" }}>Documentație Filozofică</h1>
      {Object.keys(data).map((tab) => (
        <div key={tab}>
           {(tab === "Politica" || tab === "Drepturi") && data[tab].map((section, sIdx) => (
             <div key={sIdx}>
               {section.items.map((item) => (
                 <div id={`doc-${slugify(item.nume)}`} key={item.id} style={{ marginBottom: "80px", scrollMarginTop: "100px" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                     {item.image_url && <img src={item.image_url} alt={item.nume} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: `4px solid ${theme.sectionBg}` }} />}
                     <div>
                       <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "28px", color: theme.textPrimary }}>{item.nume}</h2>
                       <div style={{ color: theme.accent, fontWeight: "600", fontSize: "14px", marginTop: "4px" }}>{item.lucrare_relevanta}</div>
                     </div>
                   </div>
                   <div style={{ fontSize: "16px", lineHeight: "1.8", color: theme.textSecondary, textAlign: "justify", marginBottom: "20px" }}><strong>Rezumat:</strong> {item.comentariu_filosofic}</div>
                   <div style={{ backgroundColor: theme.sectionBg, padding: "20px", borderRadius: "8px", border: `1px solid ${theme.borderColor}` }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", color: theme.textSecondary, fontSize: "12px", textTransform: "uppercase" }}>Analiză Extinsă / Eseu {isDevMode ? "(Editabil)" : "(Doar Citire)"}</label>
                      <textarea
                        value={item.detailed_text || ""}
                        readOnly={!isDevMode}
                        onChange={(e) => onUpdateCard(tab, sIdx, item.id, { ...item, detailed_text: e.target.value })}
                        placeholder="Scrie aici analiza detaliată pentru concurs..."
                        style={{ width: "100%", minHeight: "300px", padding: "16px", borderRadius: "4px", border: `1px solid ${theme.borderColor}`, fontFamily: "'Inter', sans-serif", fontSize: "15px", lineHeight: "1.6", resize: "vertical", backgroundColor: theme.inputBg, color: theme.textPrimary }}
                      />
                   </div>
                 </div>
               ))}
             </div>
           ))}
        </div>
      ))}
    </div>
  );
};

export default DetailsView;
