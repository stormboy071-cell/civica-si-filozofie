import React, { useEffect } from "react";
import {
  getAppSettings,
  getTabs,
  makeInputStyle,
  slugify,
} from "../utils.js";

const SKIPPED_DOC_TABS = new Set(["Bibliografie"]);

const DetailsView = ({
  data,
  scrollTarget,
  onUpdateCard,
  onUpdateAppSettings,
  theme,
  isDevMode,
}) => {
  const appSettings = getAppSettings(data);
  const inputStyle = makeInputStyle(theme);
  const docTabs = getTabs(data).filter(
    (tab) => !SKIPPED_DOC_TABS.has(tab) && Array.isArray(data?.[tab]),
  );

  useEffect(() => {
    if (scrollTarget) {
      setTimeout(() => {
        const el =
          document.getElementById(`doc-${scrollTarget}`) ||
          document.getElementById(`doc-${slugify(scrollTarget)}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [scrollTarget]);

  const updateItem = (tab, sectionIndex, item, partial) => {
    onUpdateCard(tab, sectionIndex, item.id, { ...item, ...partial });
  };

  const editableFieldStyle = {
    ...inputStyle,
    width: "100%",
    minWidth: 0,
    border: `1px solid ${theme.accent}`,
  };

  return (
    <div
      style={{
        maxWidth: "880px",
        margin: "40px auto",
        backgroundColor: theme.cardBg,
        padding: "60px",
        borderRadius: "28px",
        boxShadow: theme.shadow,
        minHeight: "100vh",
        color: theme.textPrimary,
      }}
    >
      {isDevMode ? (
        <input
          value={appSettings.documentationTitle}
          onChange={(event) =>
            onUpdateAppSettings({ documentationTitle: event.target.value })
          }
          aria-label="Titlul paginii Documentatie"
          style={{
            ...editableFieldStyle,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "42px",
            fontWeight: "700",
            padding: "8px 12px 18px",
            marginBottom: "40px",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderRadius: 0,
          }}
        />
      ) : (
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "42px",
            borderBottom: `1px solid ${theme.borderColor}`,
            paddingBottom: "20px",
            marginBottom: "40px",
          }}
        >
          {appSettings.documentationTitle}
        </h1>
      )}

      {docTabs.map((tab) => (
        <div key={tab}>
          {data[tab].map((section, sIdx) => (
            <div key={section.id || sIdx}>
              {(section.items || []).map((item) => {
                const hasSecondaryField =
                  item.type === "standard" || Boolean(item.lucrare_relevanta);
                const secondaryText = item.lucrare_relevanta || "";

                return (
                  <div
                    id={`doc-${slugify(item.nume)}`}
                    key={item.id}
                    style={{
                      marginBottom: "80px",
                      scrollMarginTop: "100px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.nume}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `4px solid ${theme.sectionBg}`,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isDevMode ? (
                          <input
                            value={item.nume || ""}
                            onChange={(event) =>
                              updateItem(tab, sIdx, item, {
                                nume: event.target.value,
                              })
                            }
                            aria-label="Titlu card in Documentatie"
                            style={{
                              ...editableFieldStyle,
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "34px",
                              fontWeight: "700",
                              marginBottom: "8px",
                            }}
                          />
                        ) : (
                          <h2
                            style={{
                              margin: 0,
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "34px",
                              color: theme.textPrimary,
                            }}
                          >
                            {item.nume}
                          </h2>
                        )}

                        {hasSecondaryField && isDevMode ? (
                          <input
                            value={secondaryText}
                            onChange={(event) =>
                              updateItem(tab, sIdx, item, {
                                lucrare_relevanta: event.target.value,
                              })
                            }
                            aria-label="Lucrare sau fisier"
                            placeholder="Lucrare sau fisier"
                            style={{
                              ...editableFieldStyle,
                              color: theme.accent,
                              fontWeight: "600",
                              fontSize: "14px",
                            }}
                          />
                        ) : (
                          secondaryText && (
                            <div
                              style={{
                                color: theme.accent,
                                fontWeight: "600",
                                fontSize: "14px",
                                marginTop: "4px",
                              }}
                            >
                              {secondaryText}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "16px",
                        lineHeight: "1.8",
                        color: theme.textSecondary,
                        textAlign: "justify",
                        marginBottom: "20px",
                      }}
                    >
                      <strong>Rezumat:</strong>{" "}
                      {isDevMode ? (
                        <textarea
                          value={item.comentariu_filosofic || ""}
                          onChange={(event) =>
                            updateItem(tab, sIdx, item, {
                              comentariu_filosofic: event.target.value,
                            })
                          }
                          aria-label="Rezumat card"
                          rows={2}
                          style={{
                            ...editableFieldStyle,
                            display: "block",
                            marginTop: "8px",
                            resize: "vertical",
                            lineHeight: "1.7",
                          }}
                        />
                      ) : (
                        item.comentariu_filosofic
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: theme.sectionBg,
                        padding: "20px",
                        borderRadius: "18px",
                        border: `1px solid ${theme.borderColor}`,
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          marginBottom: "10px",
                          fontWeight: "700",
                          color: theme.textSecondary,
                          fontSize: "12px",
                          textTransform: "uppercase",
                        }}
                      >
                        Analiza extinsa / eseu{" "}
                        {isDevMode ? "(Editabil)" : "(Doar citire)"}
                      </label>
                      <textarea
                        value={item.detailed_text || ""}
                        readOnly={!isDevMode}
                        onChange={(event) =>
                          updateItem(tab, sIdx, item, {
                            detailed_text: event.target.value,
                          })
                        }
                        placeholder="Scrie aici analiza detaliata pentru concurs..."
                        style={{
                          width: "100%",
                          minHeight: "300px",
                          padding: "16px",
                          borderRadius: "16px",
                          border: `1px solid ${theme.borderColor}`,
                          fontFamily: "'Manrope', sans-serif",
                          fontSize: "15px",
                          lineHeight: "1.7",
                          resize: "vertical",
                          backgroundColor: theme.inputBg,
                          color: theme.textPrimary,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DetailsView;
