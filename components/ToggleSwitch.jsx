import React from "react";

const ToggleSwitch = ({ label, checked, onChange, theme }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
    <span style={{ fontSize: "14px", fontWeight: "600", color: theme.textPrimary }}>{label}</span>
    <button 
      onClick={() => onChange(!checked)}
      style={{
        width: "44px", height: "24px", borderRadius: "12px", 
        backgroundColor: checked ? theme.accent : (theme.textSecondary),
        position: "relative", border: "none", cursor: "pointer", transition: "background 0.3s"
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff",
        position: "absolute", top: "3px", left: checked ? "23px" : "3px",
        transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }} />
    </button>
  </div>
);

export default ToggleSwitch;
