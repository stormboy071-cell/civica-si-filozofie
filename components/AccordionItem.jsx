import React, { useEffect, useState } from "react";
import Card from "./Card.jsx";
import { makeInputStyle, slugify } from "../utils.js";

const AccordionItem = ({ section, isOpen, onClick, extraItem, onUpdateItem, onDeleteItem, canEdit, canDelete, onReadMore, onUpdateSection, onDeleteSection, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDesc, setEditDesc] = useState(section.description);

  useEffect(() => { if (!isEditing) { setEditTitle(section.title); setEditDesc(section.description); } }, [section.title, section.description, isEditing]);

  const handleTitleChange = (value) => {
    setEditTitle(value);
    onUpdateSection({ ...section, title: value, description: editDesc });
  };
  const handleDescChange = (value) => {
    setEditDesc(value);
    onUpdateSection({ ...section, title: editTitle, description: value });
  };
  const handleDone = (e) => { e.stopPropagation(); setIsEditing(false); };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDeleteSection) {
        onDeleteSection();
    }
  };

  const inputStyle = makeInputStyle(theme);

  return (
    <div style={{ 
      marginBottom: "20px", borderRadius: "12px", backgroundColor: theme.sectionBg, backdropFilter: "blur(10px)",
      overflow: "hidden", border: `1px solid ${theme.borderColor}`, boxShadow: isOpen ? "0 10px 30px rgba(0, 0, 0, 0.05)" : "0 2px 5px rgba(0, 0, 0, 0.02)", transition: "all 0.3s ease"
    }}>
      <div 
        onClick={!isEditing ? onClick : undefined} 
        className="civica-accordion-header"
        style={{ width: "100%", padding: "24px 32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: isEditing ? "default" : "pointer" }}
      >
        <div style={{ flex: 1 }}>
          {isEditing ? (
             <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px" }}>
               <input value={editTitle} onChange={(e) => handleTitleChange(e.target.value)} style={{ ...inputStyle, fontSize: "18px", fontWeight: "bold", border: `1px solid ${theme.accent}` }} />
               <input value={editDesc} onChange={(e) => handleDescChange(e.target.value)} style={{ ...inputStyle, fontSize: "14px" }} />
               <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                 <button onClick={handleDone} style={{ padding: "4px 12px", background: theme.accent, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Gata</button>
               </div>
             </div>
          ) : (
             <div style={{ position: "relative" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                 <h2 style={{ fontSize: "20px", fontWeight: "700", color: theme.textPrimary, margin: "0 0 4px 0", fontFamily: "'Playfair Display', serif" }}>{section.title}</h2>
                 {canEdit && (
                   <div style={{ display: "flex", gap: "8px", opacity: isOpen ? 1 : 0.5, alignItems: "center", zIndex: 10 }}>
                     <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: theme.textSecondary }} title="Editeaza Categorie">??</button>
                     <button 
                        onClick={handleDeleteClick}
                        style={{ 
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: "32px", height: "32px",
                            backgroundColor: theme.dangerBg, 
                            border: `1px solid ${theme.danger}`, 
                            borderRadius: "6px", 
                            cursor: "pointer", 
                            color: theme.danger,
                            transition: "all 0.2s",
                            zIndex: 20
                        }} 
                        title="Sterge Categorie"
                     >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                     </button>
                   </div>
                 )}
               </div>
               <p style={{ fontSize: "14px", color: theme.textSecondary, margin: 0, fontWeight: "500" }}>{section.description}</p>
             </div>
          )}
        </div>
        {!isEditing && (
          <div style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease", color: isOpen ? theme.accent : theme.textSecondary, marginLeft: "16px", alignSelf: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="civica-accordion-body" style={{ padding: "0 32px 32px 32px", borderTop: `1px solid ${theme.borderColor}`, animation: "fadeIn 0.4s ease" }}>
          <div className="civica-card-grid" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {section.items.map((item) => (
              <Card 
                key={item.id} data={item} id={slugify(item.nume)} 
                onUpdate={(updated) => onUpdateItem(item.id, updated)} onDelete={() => onDeleteItem(item.id)}
                allowEdit={canEdit} allowDelete={canDelete} onReadMore={() => onReadMore(slugify(item.nume))}
                theme={theme}
              />
            ))}
            {extraItem}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccordionItem;