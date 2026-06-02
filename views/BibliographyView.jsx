import React from "react";
import { makeInputStyle } from "../utils.js";

const BibliographyView = ({ theme, isDevMode, items, onAddRow, onUpdateRow, onDeleteRow }) => {
  const inputStyle = { ...makeInputStyle(theme, "12px"), width: "100%", padding: "6px" };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", backgroundColor: theme.cardBg, padding: "40px", borderRadius: "28px", boxShadow: theme.shadow, color: theme.textPrimary }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "38px", marginBottom: "30px", color: theme.textPrimary }}>
        Bibliografie & Copyright
      </h1>
      <div style={{ marginBottom: "40px", padding: "20px", backgroundColor: theme.sectionBg, borderRadius: "18px", borderLeft: `4px solid ${theme.accent}` }}>
        <h3 style={{ marginTop: 0 }}>Copyright (c) 2024 Aplicație concurs</h3>
        <p style={{ fontSize: "14px", color: theme.textSecondary }}>
          Această aplicație a fost realizată pentru Concursul de Informatică și Filosofie. Toate textele originale sunt proprietatea autorului.
        </p>
      </div>
      <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>Resurse web & bibliografie</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ backgroundColor: theme.sectionBg, color: theme.textPrimary, textAlign: "left" }}>
            <th style={{ padding: "12px", borderRadius: "6px 0 0 6px" }}>Resursă / Titlu</th>
            <th style={{ padding: "12px" }}>Link / Editură</th>
            <th style={{ padding: "12px" }}>Note</th>
            {isDevMode && <th style={{ padding: "12px", borderRadius: "0 6px 6px 0" }}>Acțiuni</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
              <td style={{ padding: "10px" }}>{isDevMode ? <input value={item.resource} onChange={(e) => onUpdateRow(item.id, "resource", e.target.value)} style={inputStyle} /> : item.resource}</td>
              <td style={{ padding: "10px" }}>{isDevMode ? <input value={item.link} onChange={(e) => onUpdateRow(item.id, "link", e.target.value)} style={inputStyle} /> : <a href={item.link} target="_blank" rel="noreferrer" style={{ color: theme.accent }}>{item.link}</a>}</td>
              <td style={{ padding: "10px" }}>{isDevMode ? <input value={item.notes} onChange={(e) => onUpdateRow(item.id, "notes", e.target.value)} style={inputStyle} /> : item.notes}</td>
              {isDevMode && <td style={{ padding: "10px" }}><button onClick={() => onDeleteRow(item.id)} style={{ color: theme.danger, background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Șterge</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {isDevMode && <button onClick={onAddRow} style={{ marginTop: "15px", padding: "8px 16px", backgroundColor: theme.borderColor, border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: theme.textPrimary }}>+ Adaugă rând</button>}
    </div>
  );
};

export default BibliographyView;
