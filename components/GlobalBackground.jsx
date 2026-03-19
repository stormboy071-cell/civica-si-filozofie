import React from "react";

const GlobalBackground = ({ theme }) => {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -2,
      background: theme.bgGradient,
      transition: "background 0.5s ease"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${theme.bgImageOpacity}'/%3E%3C/svg%3E")`,
        pointerEvents: "none"
      }} />
    </div>
  );
};

export default GlobalBackground;
