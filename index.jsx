import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { THEMES, ACCENTS } from "./themes.js";
import { INITIAL_DATA } from "./data/initialData.js";
import { generateId, getSectionContentType, getTabs } from "./utils.js";
import {
  getRemoteAppData,
  isSupabaseConfigured,
  saveRemoteAppData,
  uploadToStorage,
} from "./supabase.js";

import GlobalBackground from "./components/GlobalBackground.jsx";
import NavBar from "./components/NavBar.jsx";
import HomeView from "./views/HomeView.jsx";
import DetailsView from "./views/DetailsView.jsx";
import BibliographyView from "./views/BibliographyView.jsx";

const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

function App() {
  const hasLocalSavedDataRef = useRef(false);
  const [currentView, setCurrentView] = useState(() => {
    try {
      return localStorage.getItem("civicaView") || "home";
    } catch (e) {
      return "home";
    }
  });
  const [openSectionIndex, setOpenSectionIndex] = useState(() => {
    try {
      const stored = localStorage.getItem("civicaOpenSectionIndex");
      return stored !== null ? Number(stored) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [appData, setAppData] = useState(() => {
    try {
      const saved = localStorage.getItem("civicaAppData");
      hasLocalSavedDataRef.current = Boolean(saved);
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error("Failed to load local data", e);
      return INITIAL_DATA;
    }
  });

  const [scrollTarget, setScrollTarget] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("civicaThemeMode") === "dark";
    } catch (e) {
      return false;
    }
  });
  const [accentKey, setAccentKey] = useState(() => {
    try {
      return localStorage.getItem("civicaAccent") || "Indigo";
    } catch (e) {
      return "Indigo";
    }
  });
  const [isDevMode, setIsDevMode] = useState(() => {
    try {
      return localStorage.getItem("civicaDevMode") === "true";
    } catch (e) {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("civicaActiveTab") || "Politica";
    } catch (e) {
      return "Politica";
    }
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem("civicaSearchQuery") || "";
    } catch (e) {
      return "";
    }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem("civicaOnboardingDismissed") !== "true";
    } catch (e) {
      return true;
    }
  });
  const [mediaUploadStatus, setMediaUploadStatus] = useState("");
  const [isCloudReady, setIsCloudReady] = useState(false);
  const isApplyingRemoteRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const pendingAssetUploadsRef = useRef(new Set());
  const bibliographyItems = Array.isArray(appData.Bibliografie)
    ? appData.Bibliografie
    : [];

  const baseTheme = isDarkMode ? THEMES.dark : THEMES.light;
  const accent =
    (ACCENTS[accentKey] &&
      (isDarkMode ? ACCENTS[accentKey].dark : ACCENTS[accentKey].light)) ||
    baseTheme.accent;
  const theme = { ...baseTheme, accent };
  const makePersistableData = (data) => {
    const updatedAt = Date.now();
    return {
      ...data,
      _meta: { ...(data && data._meta ? data._meta : {}), updatedAt },
    };
  };

  const isStructuredAppData = (data) => {
    return (
      Boolean(data) &&
      typeof data === "object" &&
      (Array.isArray(data.Politica) ||
        Array.isArray(data.Drepturi) ||
        Array.isArray(data.Bibliografie) ||
        Array.isArray(data.Quiz) ||
        Array.isArray(data.Media))
    );
  };

  const getDataScore = (data) => {
    if (!isStructuredAppData(data)) return 0;
    try {
      return JSON.stringify(data).length;
    } catch (e) {
      return 0;
    }
  };

  const pickMoreCompleteData = (left, right) => {
    const leftUpdatedAt = left?._meta?.updatedAt || 0;
    const rightUpdatedAt = right?._meta?.updatedAt || 0;
    if (leftUpdatedAt !== rightUpdatedAt) {
      return leftUpdatedAt > rightUpdatedAt ? left : right;
    }
    return getDataScore(left) >= getDataScore(right) ? left : right;
  };

  const loadBundledPresentationBackup = async () => {
    try {
      const response = await fetch("/presentation-backup.json", {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const json = await response.json();
      return isStructuredAppData(json) ? json : null;
    } catch (e) {
      return null;
    }
  };

  const isLocalAsset = (value) => {
    return (
      typeof value === "string" &&
      (value.startsWith("data:") || value.startsWith("blob:"))
    );
  };

  const getFileExtensionFromMime = (mimeType) => {
    if (!mimeType) return "bin";
    const [, subtype = "bin"] = mimeType.split("/");
    return subtype.split("+")[0].toLowerCase();
  };

  const uploadLocalAsset = async (assetUrl, folder, assetId) => {
    const response = await fetch(assetUrl);
    const blob = await response.blob();
    const extension = getFileExtensionFromMime(blob.type);
    const path = `${folder}/${assetId}-${Date.now()}.${extension}`;
    return uploadToStorage(path, blob, blob.type || undefined);
  };

  const replaceAssetUrlInData = (
    data,
    cardId,
    field,
    nextUrl,
    localFlagField,
    tempFlagField,
  ) => {
    let changed = false;
    const nextData = { ...data };
    Object.keys(nextData).forEach((tabKey) => {
      if (!Array.isArray(nextData[tabKey])) return;
      nextData[tabKey] = nextData[tabKey].map((section) => {
        if (!section || !Array.isArray(section.items)) return section;
        let sectionChanged = false;
        const nextItems = section.items.map((item) => {
          if (!item || item.id !== cardId) return item;
          sectionChanged = true;
          changed = true;
          const nextItem = { ...item, [field]: nextUrl };
          if (localFlagField in nextItem) nextItem[localFlagField] = false;
          if (tempFlagField in nextItem) nextItem[tempFlagField] = false;
          return nextItem;
        });
        return sectionChanged ? { ...section, items: nextItems } : section;
      });
    });
    return changed ? nextData : data;
  };

  const mergeRemoteWithLocalAssets = (remoteData, localData) => {
    if (!remoteData || typeof remoteData !== "object") return remoteData;
    if (!localData || typeof localData !== "object") return remoteData;

    const merged = { ...remoteData };
    const tabs = Object.keys(localData);
    for (const tab of tabs) {
      const localTab = localData[tab];
      const remoteTab = merged[tab];
      if (!Array.isArray(localTab) || !Array.isArray(remoteTab)) continue;

      const localItemsById = new Map();
      localTab.forEach((section) => {
        (section.items || []).forEach((item) => {
          if (item?.id) localItemsById.set(item.id, item);
        });
      });

      merged[tab] = remoteTab.map((section) => {
        const nextSection = { ...section };
        nextSection.items = (section.items || []).map((item) => {
          const localItem = localItemsById.get(item.id);
          if (!localItem) return item;
          const nextItem = { ...item };

          if (!nextItem.image_url && isLocalAsset(localItem.image_url)) {
            nextItem.image_url = localItem.image_url;
            nextItem.isLocalImage = true;
          }
          if (!nextItem.video_url && isLocalAsset(localItem.video_url)) {
            nextItem.video_url = localItem.video_url;
            nextItem.isLocalVideo = true;
          }

          return nextItem;
        });
        return nextSection;
      });
    }
    return merged;
  };

  const sanitizeForCloud = (value) => {
    if (Array.isArray(value)) {
      return value.map(sanitizeForCloud);
    }
    if (value && typeof value === "object") {
      const next = {};
      for (const [key, val] of Object.entries(value)) {
        if (
          typeof val === "string" &&
          (val.startsWith("data:") || val.startsWith("blob:"))
        ) {
          // Keep local assets local only; remote state should only store durable URLs.
          next[key] = null;
          continue;
        }
        next[key] = sanitizeForCloud(val);
      }
      return next;
    }
    return value;
  };

  const persistDataSnapshot = async (nextData) => {
    if (!nextData) return;
    const payload = makePersistableData(nextData);
    try {
      localStorage.setItem("civicaAppData", JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save data locally", e);
    }
    if (!isSupabaseConfigured) return;
    await saveRemoteAppData(sanitizeForCloud(payload));
  };

  useEffect(() => {
    let canceled = false;
    const migrate = async () => {
      try {
        const bundledBackup = await loadBundledPresentationBackup();
        let bestLocalCandidate = appData;
        if (!hasLocalSavedDataRef.current && bundledBackup) {
          bestLocalCandidate = pickMoreCompleteData(
            bestLocalCandidate,
            bundledBackup,
          );
        }

        const localUpdatedAt = bestLocalCandidate?._meta?.updatedAt || 0;
        if (!isSupabaseConfigured) {
          if (bestLocalCandidate !== appData) {
            isApplyingRemoteRef.current = true;
            setAppData(bestLocalCandidate);
            isApplyingRemoteRef.current = false;
          }
        } else {
          const remotePayload = await getRemoteAppData();
          if (!remotePayload) {
            if (bestLocalCandidate !== appData) {
              isApplyingRemoteRef.current = true;
              setAppData(bestLocalCandidate);
              isApplyingRemoteRef.current = false;
            }
            const payload = sanitizeForCloud(
              makePersistableData(bestLocalCandidate),
            );
            await saveRemoteAppData(payload);
          } else {
            const remoteUpdatedAt = remotePayload?._meta?.updatedAt || 0;
            const localSize = JSON.stringify(bestLocalCandidate || {}).length;
            const remoteSize = JSON.stringify(remotePayload || {}).length;
            if (remoteUpdatedAt > localUpdatedAt) {
              isApplyingRemoteRef.current = true;
              const merged = mergeRemoteWithLocalAssets(
                remotePayload,
                bestLocalCandidate,
              );
              setAppData(merged);
              isApplyingRemoteRef.current = false;
            } else if (localUpdatedAt > remoteUpdatedAt) {
              if (bestLocalCandidate !== appData) {
                isApplyingRemoteRef.current = true;
                setAppData(bestLocalCandidate);
                isApplyingRemoteRef.current = false;
              }
              const payload = sanitizeForCloud(
                makePersistableData(bestLocalCandidate),
              );
              await saveRemoteAppData(payload);
            } else if (remoteSize > localSize) {
              isApplyingRemoteRef.current = true;
              const merged = mergeRemoteWithLocalAssets(
                remotePayload,
                bestLocalCandidate,
              );
              setAppData(merged);
              isApplyingRemoteRef.current = false;
            } else if (localSize > remoteSize) {
              if (bestLocalCandidate !== appData) {
                isApplyingRemoteRef.current = true;
                setAppData(bestLocalCandidate);
                isApplyingRemoteRef.current = false;
              }
              const payload = sanitizeForCloud(
                makePersistableData(bestLocalCandidate),
              );
              await saveRemoteAppData(payload);
            } else if (bestLocalCandidate !== appData) {
              isApplyingRemoteRef.current = true;
              setAppData(bestLocalCandidate);
              isApplyingRemoteRef.current = false;
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync with Supabase", e);
      } finally {
        if (!canceled) setIsCloudReady(true);
      }
    };
    migrate();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const payload = makePersistableData(appData);
      localStorage.setItem("civicaAppData", JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save data locally", e);
    }
  }, [appData]);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!isCloudReady || isApplyingRemoteRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const payload = sanitizeForCloud(makePersistableData(appData));
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveRemoteAppData(payload);
      } catch (e) {
        console.error("Failed to save data to Supabase", e);
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [appData, isCloudReady]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!isCloudReady) return;

    const localAssets = [];
    Object.keys(appData || {}).forEach((tabKey) => {
      const sections = appData?.[tabKey];
      if (!Array.isArray(sections)) return;
      sections.forEach((section) => {
        (section.items || []).forEach((item) => {
          if (isLocalAsset(item?.image_url)) {
            localAssets.push({
              cardId: item.id,
              field: "image_url",
              folder: "images",
              localFlagField: "isLocalImage",
              tempFlagField: "isTempImage",
              assetUrl: item.image_url,
            });
          }
          if (isLocalAsset(item?.video_url)) {
            localAssets.push({
              cardId: item.id,
              field: "video_url",
              folder: "videos",
              localFlagField: "isLocalVideo",
              tempFlagField: "isTempVideo",
              assetUrl: item.video_url,
            });
          }
        });
      });
    });

    localAssets.forEach(
      ({ cardId, field, folder, localFlagField, tempFlagField, assetUrl }) => {
        const uploadKey = `${cardId}:${field}`;
        if (pendingAssetUploadsRef.current.has(uploadKey)) return;
        pendingAssetUploadsRef.current.add(uploadKey);

        uploadLocalAsset(assetUrl, folder, cardId)
          .then((downloadUrl) => {
            setAppData((prev) =>
              replaceAssetUrlInData(
                prev,
                cardId,
                field,
                downloadUrl,
                localFlagField,
                tempFlagField,
              ),
            );
            if (typeof assetUrl === "string" && assetUrl.startsWith("blob:")) {
              try {
                URL.revokeObjectURL(assetUrl);
              } catch (e) {
                /* no-op */
              }
            }
          })
          .catch((error) => {
            console.error(
              `Failed to upload ${field} for card ${cardId}`,
              error,
            );
          })
          .finally(() => {
            pendingAssetUploadsRef.current.delete(uploadKey);
          });
      },
    );
  }, [appData, isCloudReady]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaView", currentView);
    } catch (e) {
      console.error("Failed to save view preference", e);
    }
  }, [currentView]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "civicaOpenSectionIndex",
        String(openSectionIndex ?? 0),
      );
    } catch (e) {
      console.error("Failed to save section preference", e);
    }
  }, [openSectionIndex]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaDevMode", isDevMode ? "true" : "false");
    } catch (e) {
      console.error("Failed to save dev mode preference", e);
    }
  }, [isDevMode]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaActiveTab", activeTab);
    } catch (e) {
      console.error("Failed to save active tab preference", e);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaSearchQuery", searchQuery);
    } catch (e) {
      console.error("Failed to save search preference", e);
    }
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaThemeMode", isDarkMode ? "dark" : "light");
    } catch (e) {
      console.error("Failed to save theme mode", e);
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("civicaAccent", accentKey);
    } catch (e) {
      console.error("Failed to save accent", e);
    }
  }, [accentKey]);

  const handleExportData = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presentation-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleForceCloudSync = async () => {
    if (!isSupabaseConfigured) {
      alert("Configureaza mai intai cheile Supabase in fisierul .env.");
      return;
    }
    try {
      await persistDataSnapshot(appData);
      alert("Datele locale au fost trimise in cloud.");
    } catch (e) {
      console.error("Failed to force cloud sync", e);
      alert(
        "Trimiterea datelor in cloud a esuat. Pentru siguranta, pastreaza si backupul JSON local.",
      );
    }
  };

  const handleSaveProgress = async () => {
    try {
      await persistDataSnapshot(appData);
      if (isSupabaseConfigured) {
        alert("Progresul a fost salvat local și sincronizat cu Supabase.");
      } else {
        alert("Progresul a fost salvat local (Supabase neconfigurat).");
      }
    } catch (e) {
      console.error("Failed to save progress", e);
      alert("Salvarea progresului a eșuat. Verifică consola pentru erori.");
    }
  };

  const handleRestoreLocalAssets = () => {
    try {
      const raw = localStorage.getItem("civicaAppData");
      if (!raw) {
        alert("Nu exista date locale.");
        return;
      }
      const localData = JSON.parse(raw);
      const merged = mergeRemoteWithLocalAssets(appData, localData);
      setAppData(merged);
      alert("Imagini locale recuperate.");
    } catch (e) {
      console.error("Failed to restore local assets", e);
      alert("Nu am putut recupera imaginile locale.");
    }
  };

  const handleImportData = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || ""));
        if (json.Politica || json.Drepturi) {
          setAppData(json);
          if (isSupabaseConfigured) {
            await persistDataSnapshot(json);
            alert("Date importate cu succes si sincronizate in Supabase.");
          } else {
            alert("Date importate cu succes!");
          }
        } else {
          alert("Format fișier invalid.");
        }
      } catch (err) {
        alert("Eroare la citirea fișierului.");
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateCard = (tabKey, sectionIndex, cardId, updatedCard) => {
    setAppData((prev) => {
      const newData = { ...prev };
      const section = newData[tabKey][sectionIndex];
      const cardIndex = section.items.findIndex((c) => c.id === cardId);
      if (cardIndex !== -1) {
        section.items[cardIndex] = updatedCard;
      }
      return newData;
    });
  };

  const handleDeleteCard = (tabKey, sectionIndex, cardId) => {
    setAppData((prev) => {
      const newData = { ...prev };
      const section = newData[tabKey][sectionIndex];
      if (tabKey === "Media") {
        const target = section.items.find((c) => c.id === cardId);
        if (
          target?.isTempVideo &&
          typeof target.video_url === "string" &&
          target.video_url.startsWith("blob:")
        ) {
          try {
            URL.revokeObjectURL(target.video_url);
          } catch (e) {
            /* no-op */
          }
        }
      }
      section.items = section.items.filter((c) => c.id !== cardId);
      return newData;
    });
  };

  const createCardForSection = (contentType) => {
    const newId = generateId();
    if (contentType === "quiz") {
      return {
        id: newId,
        type: "quiz",
        nume: "Întrebare Nouă",
        comentariu_filosofic: "...",
        image_url:
          "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=800",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0,
      };
    }
    if (contentType === "media") {
      return {
        id: newId,
        type: "media",
        nume: "Video nou",
        video_url: "",
        comentariu_filosofic: "Adaugă un fișier video sau un link video.",
      };
    }
    return {
      id: newId,
      type: "standard",
      nume: "Titlu Nou",
      lucrare_relevanta: "Lucrare...",
      comentariu_filosofic: "Descriere...",
      detailed_text: "Scrie eseul...",
      image_url:
        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800",
    };
  };

  const handleAddCard = (tabKey, sectionIndex) => {
    setAppData((prev) => {
      const newData = { ...prev };
      if (!newData[tabKey] || !newData[tabKey][sectionIndex]) return prev;
      const section = newData[tabKey][sectionIndex];
      const newCard = createCardForSection(
        getSectionContentType(section, tabKey),
      );
      section.items.push(newCard);
      return newData;
    });
  };

  const handleUploadMedia = async (
    file,
    tabKey = "Media",
    sectionIndex = 0,
  ) => {
    if (!file) return;
    if (!isSupabaseConfigured) {
      alert(
        "Configureaza mai intai Supabase ca sa poti urca video-uri in cloud.",
      );
      return;
    }
    if (!String(file.type || "").startsWith("video/")) {
      alert("Fisierul selectat nu pare sa fie un video valid.");
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      alert(`Fisierul are ${sizeMb} MB. Limita aplicatiei este 50 MB.`);
      return;
    }
    const safeIndex = Number.isFinite(Number(sectionIndex))
      ? Number(sectionIndex)
      : 0;
    const mediaCardId = generateId();
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setMediaUploadStatus(
      `Se incarca "${file.name}" (${fileSizeMb} MB) in cloud...`,
    );
    try {
      const safeFileName = String(file.name || "video.mp4").replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );
      const downloadUrl = await uploadToStorage(
        `videos/${mediaCardId}-${Date.now()}-${safeFileName}`,
        file,
        file.type || "video/mp4",
        {
          onProgress: (bytesUploaded, bytesTotal) => {
            if (!bytesTotal) return;
            const progress = Math.min(
              100,
              Math.round((bytesUploaded / bytesTotal) * 100),
            );
            setMediaUploadStatus(
              `Se incarca "${file.name}" (${fileSizeMb} MB)... ${progress}%`,
            );
          },
        },
      );
      const nextData = { ...appData };
      if (!nextData[tabKey])
        nextData[tabKey] = [
          {
            id: generateId(),
            title: "Media",
            description: "",
            contentType: "media",
            items: [],
          },
        ];
      if (nextData[tabKey].length === 0)
        nextData[tabKey] = [
          {
            id: generateId(),
            title: "Media",
            description: "",
            contentType: "media",
            items: [],
          },
        ];

      const targetIndex = Math.min(
        Math.max(safeIndex, 0),
        nextData[tabKey].length - 1,
      );
      const targetSection = nextData[tabKey][targetIndex] || {
        id: generateId(),
        title: "Media",
        description: "",
        contentType: "media",
        items: [],
      };
      const nextItems = [
        ...(targetSection.items || []),
        {
          id: mediaCardId,
          type: "media",
          nume: file.name.replace(/\.[^/.]+$/, ""),
          video_url: downloadUrl,
          mime_type: file.type || "video/mp4",
          original_file_name: file.name,
          comentariu_filosofic: `Fisier: ${file.name}`,
          isLocalVideo: false,
          isTempVideo: false,
        },
      ];

      nextData[tabKey] = [...nextData[tabKey]];
      nextData[tabKey][targetIndex] = {
        ...targetSection,
        contentType: "media",
        items: nextItems,
      };

      setAppData(nextData);
      await persistDataSnapshot(nextData);
      setMediaUploadStatus(`Video publicat cu succes: ${file.name}`);
    } catch (err) {
      console.error("Failed to upload video to Supabase Storage", err);
      const errorMessage = err?.message || err?.code || "Eroare necunoscuta";
      setMediaUploadStatus(
        `Eroare upload pentru ${file.name}: ${errorMessage}`,
      );
      alert(
        `Upload-ul video in cloud a esuat. Cardul nu a fost salvat.\n\nDetaliu: ${errorMessage}`,
      );
    }
  };

  const handleAddSection = (tabKey, title = "Categorie noua") => {
    const cleanTitle = String(title || "").trim() || "Categorie noua";
    setAppData((prev) => {
      const nextSections = Array.isArray(prev[tabKey]) ? prev[tabKey] : [];
      const newSection = {
        id: generateId(),
        title: cleanTitle,
        description: "Adauga o descriere...",
        contentType:
          tabKey === "Quiz"
            ? "quiz"
            : tabKey === "Media"
              ? "media"
              : "standard",
        items: [],
      };
      return { ...prev, [tabKey]: [...nextSections, newSection] };
    });
  };

  const handleAddBibliographyRow = () => {
    setAppData((prev) => {
      const newData = { ...prev };
      if (!newData.Bibliografie) newData.Bibliografie = [];
      newData.Bibliografie.push({
        id: generateId(),
        resource: "",
        link: "",
        notes: "",
      });
      return newData;
    });
  };

  const handleUpdateBibliographyRow = (id, field, value) => {
    setAppData((prev) => {
      const newData = { ...prev };
      if (!newData.Bibliografie) newData.Bibliografie = [];
      newData.Bibliografie = newData.Bibliografie.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      );
      return newData;
    });
  };

  const handleDeleteBibliographyRow = (id) => {
    setAppData((prev) => {
      const newData = { ...prev };
      if (!newData.Bibliografie) return prev;
      newData.Bibliografie = newData.Bibliografie.filter(
        (item) => item.id !== id,
      );
      return newData;
    });
  };

  const handleUpdateSection = (tabKey, sectionIdx, updatedSection) => {
    setAppData((prev) => {
      const newData = { ...prev };
      newData[tabKey][sectionIdx] = updatedSection;
      return newData;
    });
  };

  const handleUpdateAppSettings = (partialSettings) => {
    setAppData((prev) => ({
      ...prev,
      _settings: {
        ...(prev._settings || {}),
        ...partialSettings,
      },
    }));
  };

  const handleUpdateTabLabel = (tabKey, label) => {
    setAppData((prev) => ({
      ...prev,
      _settings: {
        ...(prev._settings || {}),
        tabLabels: {
          ...(prev._settings?.tabLabels || {}),
          [tabKey]: label,
        },
      },
    }));
  };

  const handleAddTab = (label) => {
    const cleanLabel = String(label || "").trim();
    if (!cleanLabel) return;

    const tabKey = `tab-${generateId()}`;
    setAppData((prev) => {
      const tabs = getTabs(prev);
      return {
        ...prev,
        [tabKey]: [],
        _settings: {
          ...(prev._settings || {}),
          tabOrder: [...tabs, tabKey],
          tabLabels: {
            ...(prev._settings?.tabLabels || {}),
            [tabKey]: cleanLabel,
          },
        },
      };
    });
    setActiveTab(tabKey);
    setOpenSectionIndex(0);
  };

  const handleDeleteTab = (tabKey) => {
    const tabs = getTabs(appData);
    if (tabs.length <= 1) {
      alert("Pastreaza cel putin o categorie principala.");
      return;
    }
    if (
      !window.confirm(
        "Stergi aceasta categorie principala si tot continutul ei?",
      )
    )
      return;

    const nextActiveTab =
      activeTab === tabKey ? tabs.find((tab) => tab !== tabKey) : activeTab;
    setAppData((prev) => {
      const nextData = { ...prev };
      const nextTabs = getTabs(prev).filter((tab) => tab !== tabKey);
      const nextTabLabels = { ...(prev._settings?.tabLabels || {}) };
      delete nextTabLabels[tabKey];
      delete nextData[tabKey];
      nextData._settings = {
        ...(prev._settings || {}),
        tabOrder: nextTabs,
        tabLabels: nextTabLabels,
      };
      return nextData;
    });
    if (nextActiveTab) setActiveTab(nextActiveTab);
    setOpenSectionIndex(0);
  };

  const handleDeleteSection = (tabKey, sectionId) => {
    if (!window.confirm("Stergi aceasta sectiune si tot continutul ei?"))
      return;

    setAppData((prev) => {
      const newData = { ...prev };
      if (newData[tabKey]) {
        const deletedIndex = newData[tabKey].findIndex(
          (s) => s.id === sectionId,
        );
        newData[tabKey] = newData[tabKey].filter((s) => s.id !== sectionId);
        if (deletedIndex !== -1) {
          setOpenSectionIndex((current) => {
            if (current === null) return current;
            if (current === deletedIndex) return Math.max(0, deletedIndex - 1);
            if (current > deletedIndex) return current - 1;
            return current;
          });
        }
      }
      return newData;
    });
  };

  const handleReorderSection = (tabKey, sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) return;
    setAppData((prev) => {
      const nextData = { ...prev };
      const sections = Array.isArray(nextData[tabKey])
        ? [...nextData[tabKey]]
        : [];
      if (sourceIndex < 0 || sourceIndex >= sections.length) return prev;
      if (targetIndex < 0 || targetIndex >= sections.length) return prev;
      const [movedSection] = sections.splice(sourceIndex, 1);
      sections.splice(targetIndex, 0, movedSection);
      nextData[tabKey] = sections;
      return nextData;
    });
    setOpenSectionIndex((current) => {
      if (current === null) return current;
      if (current === sourceIndex) return targetIndex;
      if (
        sourceIndex < targetIndex &&
        current > sourceIndex &&
        current <= targetIndex
      )
        return current - 1;
      if (
        sourceIndex > targetIndex &&
        current >= targetIndex &&
        current < sourceIndex
      )
        return current + 1;
      return current;
    });
  };

  const handleReorderTab = (sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) return;
    setAppData((prev) => {
      const nextData = { ...prev };
      const currentOrder =
        nextData._settings && Array.isArray(nextData._settings.tabOrder)
          ? [...nextData._settings.tabOrder]
          : getTabs(prev);
      if (sourceIndex < 0 || sourceIndex >= currentOrder.length) return prev;
      if (targetIndex < 0 || targetIndex >= currentOrder.length) return prev;
      const [moved] = currentOrder.splice(sourceIndex, 1);
      currentOrder.splice(targetIndex, 0, moved);
      nextData._settings = {
        ...(nextData._settings || {}),
        tabOrder: currentOrder,
      };
      return nextData;
    });

    // If the active tab was moved, keep it active; otherwise leave activeTab unchanged
    setActiveTab((current) => {
      return current;
    });
  };

  const navigateToDetails = (targetId) => {
    setScrollTarget(targetId);
    setCurrentView("details");
  };
  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("civicaOnboardingDismissed", "true");
    } catch (e) {
      console.error("Failed to store onboarding dismissal", e);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Manrope', sans-serif",
        minHeight: "100vh",
        position: "relative",
        color: theme.textPrimary,
        paddingBottom: "40px",
      }}
    >
      <GlobalBackground theme={theme} />
      <NavBar
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
        accentKey={accentKey}
        setAccentKey={setAccentKey}
        theme={theme}
        appData={appData}
        setAppData={setAppData}
        activeTab={activeTab}
        openSectionIndex={openSectionIndex}
        setOpenSectionIndex={setOpenSectionIndex}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExport={handleExportData}
        onImport={handleImportData}
        onRestoreLocalAssets={handleRestoreLocalAssets}
        onForceCloudSync={handleForceCloudSync}
      />
      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(-10px); } 
          to { opacity: 1; transform: translateY(0); } 
        } 
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          color: ${theme.textPrimary};
          background: ${theme.bgGradient};
          font-family: 'Manrope', sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        h1, h2, h3, h4 {
          letter-spacing: -0.02em;
        }
        ::selection {
          background: ${theme.accent}33;
          color: ${theme.textPrimary};
        }
        button:focus { outline: none; }
        .civica-icon-button {
          border-radius: 999px;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .civica-icon-button:hover {
          background: ${theme.accent}12;
          transform: translateY(-1px);
        }
        .civica-nav-tab {
          position: relative;
        }
        .civica-nav-tab:hover {
          transform: translateY(-1px);
        }
        .civica-nav-tabs {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .civica-nav-tabs::-webkit-scrollbar {
          display: none;
        }
        .civica-search {
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .civica-search:focus {
          border-color: ${theme.accent} !important;
          box-shadow: 0 0 0 4px ${theme.accent}14;
          transform: translateY(-1px);
        }

        @media (max-width: 1000px) {
          .civica-nav-actions {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
          .civica-nav-tabs {
            width: 100%;
            padding-bottom: 2px;
          }
          .civica-search-wrap {
            width: 100% !important;
          }
        }

        @media (max-width: 720px) {
          .civica-nav {
            padding: 0 14px !important;
          }
          .civica-nav-inner {
            gap: 12px !important;
            padding: 12px 0 !important;
          }
          .civica-nav-top {
            align-items: flex-start !important;
          }
          .civica-nav-left {
            gap: 12px !important;
            min-width: 0;
          }
          .civica-nav-title {
            font-size: 16px !important;
            line-height: 1.05 !important;
          }
          .civica-nav-kicker {
            font-size: 9px !important;
          }
          .civica-settings-menu,
          .civica-toc-menu {
            width: min(320px, calc(100vw - 28px)) !important;
          }
          .civica-toc-menu {
            left: 0 !important;
          }
          .civica-nav-tabs {
            gap: 10px !important;
          }
          .civica-nav-tabs button {
            padding: 8px 14px !important;
            font-size: 12px !important;
          }
          .civica-search-hint {
            font-size: 11px !important;
          }
          .civica-hero { margin-top: 24px; margin-bottom: 40px; }
          .civica-hero-title { font-size: 40px !important; }
          .civica-hero-sub { font-size: 16px !important; }
          .civica-filter-note { font-size: 13px !important; padding: 12px 14px !important; }
          .civica-onboarding { padding: 14px 16px !important; }
          .civica-tab-row { gap: 8px; }
          .civica-accordion-header { padding: 18px 18px !important; }
          .civica-accordion-body { padding: 0 18px 18px 18px !important; }
          .civica-card-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; gap: 16px !important; }
        }

        @media (max-width: 520px) {
          .civica-nav-title {
            font-size: 14px !important;
          }
          .civica-nav-kicker {
            letter-spacing: 0.1em !important;
          }
          .civica-hero { padding: 30px 18px !important; border-radius: 24px !important; }
          .civica-hero-title { font-size: 34px !important; }
          .civica-hero-sub { font-size: 15px !important; }
          .civica-filter-note { font-size: 12px !important; }
          .civica-results { font-size: 13px !important; }
          .civica-empty { padding: 20px !important; }
        }
      `}</style>

      {currentView === "home" && (
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}
        >
          <HomeView
            data={appData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openSectionIndex={openSectionIndex}
            setOpenSectionIndex={setOpenSectionIndex}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onAddCard={handleAddCard}
            onUploadMedia={handleUploadMedia}
            onNavigateToDetails={navigateToDetails}
            onAddSection={handleAddSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSection={handleReorderSection}
            onReorderTab={handleReorderTab}
            onUpdateAppSettings={handleUpdateAppSettings}
            onUpdateTabLabel={handleUpdateTabLabel}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
            theme={theme}
            isDevMode={isDevMode}
            searchQuery={searchQuery}
            showOnboarding={showOnboarding}
            onDismissOnboarding={handleDismissOnboarding}
            mediaUploadStatus={mediaUploadStatus}
          />
        </div>
      )}
      {currentView === "details" && (
        <DetailsView
          data={appData}
          scrollTarget={scrollTarget}
          onUpdateCard={handleUpdateCard}
          theme={theme}
          isDevMode={isDevMode}
        />
      )}
      {currentView === "bibliography" && (
        <BibliographyView
          theme={theme}
          isDevMode={isDevMode}
          items={bibliographyItems}
          onAddRow={handleAddBibliographyRow}
          onUpdateRow={handleUpdateBibliographyRow}
          onDeleteRow={handleDeleteBibliographyRow}
        />
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
