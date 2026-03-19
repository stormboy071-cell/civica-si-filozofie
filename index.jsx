import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { THEMES, ACCENTS } from "./themes.js";
import { INITIAL_DATA } from "./data/initialData.js";
import { generateId } from "./utils.js";
import { db, storage } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import GlobalBackground from "./components/GlobalBackground.jsx";
import NavBar from "./components/NavBar.jsx";
import HomeView from "./views/HomeView.jsx";
import DetailsView from "./views/DetailsView.jsx";
import BibliographyView from "./views/BibliographyView.jsx";

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
  const [isCloudReady, setIsCloudReady] = useState(false);
  const isApplyingRemoteRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const pendingAssetUploadsRef = useRef(new Set());
  const docRef = useRef(doc(db, "appData", "main"));
  const bibliographyItems = Array.isArray(appData.Bibliografie) ? appData.Bibliografie : [];
  
  const baseTheme = isDarkMode ? THEMES.dark : THEMES.light;
  const accent = (ACCENTS[accentKey] && (isDarkMode ? ACCENTS[accentKey].dark : ACCENTS[accentKey].light)) || baseTheme.accent;
  const theme = { ...baseTheme, accent };
  const makePersistableData = (data) => {
    const updatedAt = Date.now();
    return { ...data, _meta: { ...(data && data._meta ? data._meta : {}), updatedAt } };
  };

  const isStructuredAppData = (data) => {
    return Boolean(data) && typeof data === "object" && (
      Array.isArray(data.Politica) ||
      Array.isArray(data.Drepturi) ||
      Array.isArray(data.Bibliografie) ||
      Array.isArray(data.Quiz) ||
      Array.isArray(data.Media)
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
      const response = await fetch("/presentation-backup.json", { cache: "no-store" });
      if (!response.ok) return null;
      const json = await response.json();
      return isStructuredAppData(json) ? json : null;
    } catch (e) {
      return null;
    }
  };

  const isLocalAsset = (value) => {
    return typeof value === "string" && (value.startsWith("data:") || value.startsWith("blob:"));
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
    const storageRef = ref(storage, `${folder}/${assetId}-${Date.now()}.${extension}`);
    await uploadBytes(storageRef, blob, blob.type ? { contentType: blob.type } : undefined);
    return getDownloadURL(storageRef);
  };

  const replaceAssetUrlInData = (data, cardId, field, nextUrl, localFlagField, tempFlagField) => {
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

  const sanitizeForFirestore = (value) => {
    if (Array.isArray(value)) {
      return value.map(sanitizeForFirestore);
    }
    if (value && typeof value === "object") {
      const next = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === "string" && (val.startsWith("data:") || val.startsWith("blob:"))) {
          // Firestore has strict size limits; keep local assets local only.
          next[key] = null;
          continue;
        }
        next[key] = sanitizeForFirestore(val);
      }
      return next;
    }
    return value;
  };

  useEffect(() => {
    let canceled = false;
    const migrate = async () => {
      try {
        const bundledBackup = await loadBundledPresentationBackup();
        let bestLocalCandidate = appData;
        if (!hasLocalSavedDataRef.current && bundledBackup) {
          bestLocalCandidate = pickMoreCompleteData(bestLocalCandidate, bundledBackup);
        }

        const localUpdatedAt = bestLocalCandidate?._meta?.updatedAt || 0;
        const remoteSnap = await getDoc(docRef.current);
        if (!remoteSnap.exists()) {
          if (bestLocalCandidate !== appData) {
            isApplyingRemoteRef.current = true;
            setAppData(bestLocalCandidate);
            isApplyingRemoteRef.current = false;
          }
          const payload = sanitizeForFirestore(makePersistableData(bestLocalCandidate));
          await setDoc(docRef.current, { payload }, { merge: true });
        } else {
          const remotePayload = remoteSnap.data()?.payload;
          const remoteUpdatedAt = remotePayload?._meta?.updatedAt || 0;
          const localSize = JSON.stringify(bestLocalCandidate || {}).length;
          const remoteSize = JSON.stringify(remotePayload || {}).length;
          if (remoteUpdatedAt > localUpdatedAt) {
            isApplyingRemoteRef.current = true;
            const merged = mergeRemoteWithLocalAssets(remotePayload, bestLocalCandidate);
            setAppData(merged);
            isApplyingRemoteRef.current = false;
          } else if (localUpdatedAt > remoteUpdatedAt) {
            if (bestLocalCandidate !== appData) {
              isApplyingRemoteRef.current = true;
              setAppData(bestLocalCandidate);
              isApplyingRemoteRef.current = false;
            }
            const payload = sanitizeForFirestore(makePersistableData(bestLocalCandidate));
            await setDoc(docRef.current, { payload }, { merge: true });
          } else if (remoteSize > localSize) {
            isApplyingRemoteRef.current = true;
            const merged = mergeRemoteWithLocalAssets(remotePayload, bestLocalCandidate);
            setAppData(merged);
            isApplyingRemoteRef.current = false;
          } else if (localSize > remoteSize) {
            if (bestLocalCandidate !== appData) {
              isApplyingRemoteRef.current = true;
              setAppData(bestLocalCandidate);
              isApplyingRemoteRef.current = false;
            }
            const payload = sanitizeForFirestore(makePersistableData(bestLocalCandidate));
            await setDoc(docRef.current, { payload }, { merge: true });
          } else if (bestLocalCandidate !== appData) {
            isApplyingRemoteRef.current = true;
            setAppData(bestLocalCandidate);
            isApplyingRemoteRef.current = false;
          }
        }
      } catch (e) {
        console.error("Failed to sync with Firestore", e);
      } finally {
        if (!canceled) setIsCloudReady(true);
      }
    };
    migrate();
    return () => { canceled = true; };
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
    if (!isCloudReady || isApplyingRemoteRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const payload = sanitizeForFirestore(makePersistableData(appData));
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await setDoc(docRef.current, { payload }, { merge: true });
      } catch (e) {
        console.error("Failed to save data to Firestore", e);
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [appData, isCloudReady]);

  useEffect(() => {
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
              folder: "media/images",
              localFlagField: "isLocalImage",
              tempFlagField: "isTempImage",
              assetUrl: item.image_url
            });
          }
          if (isLocalAsset(item?.video_url)) {
            localAssets.push({
              cardId: item.id,
              field: "video_url",
              folder: "media/videos",
              localFlagField: "isLocalVideo",
              tempFlagField: "isTempVideo",
              assetUrl: item.video_url
            });
          }
        });
      });
    });

    localAssets.forEach(({ cardId, field, folder, localFlagField, tempFlagField, assetUrl }) => {
      const uploadKey = `${cardId}:${field}`;
      if (pendingAssetUploadsRef.current.has(uploadKey)) return;
      pendingAssetUploadsRef.current.add(uploadKey);

      uploadLocalAsset(assetUrl, folder, cardId)
        .then((downloadUrl) => {
          setAppData((prev) => replaceAssetUrlInData(prev, cardId, field, downloadUrl, localFlagField, tempFlagField));
          if (typeof assetUrl === "string" && assetUrl.startsWith("blob:")) {
            try { URL.revokeObjectURL(assetUrl); } catch (e) { /* no-op */ }
          }
        })
        .catch((error) => {
          console.error(`Failed to upload ${field} for card ${cardId}`, error);
        })
        .finally(() => {
          pendingAssetUploadsRef.current.delete(uploadKey);
        });
    });
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
      localStorage.setItem("civicaOpenSectionIndex", String(openSectionIndex ?? 0));
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
    try {
      const payload = sanitizeForFirestore(makePersistableData(appData));
      await setDoc(docRef.current, { payload }, { merge: true });
      alert("Sincronizarea in cloud a fost finalizata.");
    } catch (e) {
      console.error("Failed to force cloud sync", e);
      alert("Sincronizarea in cloud a esuat. Pentru prezentare, foloseste si backupul JSON local.");
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
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || ""));
        if (json.Politica || json.Drepturi) {
            setAppData(json);
            alert("Date importate cu succes!");
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
    setAppData(prev => {
      const newData = { ...prev };
      const section = newData[tabKey][sectionIndex];
      const cardIndex = section.items.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) { section.items[cardIndex] = updatedCard; }
      return newData;
    });
  };

  const handleDeleteCard = (tabKey, sectionIndex, cardId) => {
    setAppData(prev => {
      const newData = { ...prev };
      const section = newData[tabKey][sectionIndex];
      if (tabKey === "Media") {
        const target = section.items.find(c => c.id === cardId);
        if (target?.isTempVideo && typeof target.video_url === "string" && target.video_url.startsWith("blob:")) {
          try { URL.revokeObjectURL(target.video_url); } catch (e) { /* no-op */ }
        }
      }
      section.items = section.items.filter(c => c.id !== cardId);
      return newData;
    });
  };

  const handleAddCard = (tabKey, sectionIndex) => {
    setAppData(prev => {
      const newData = { ...prev };
      if (!newData[tabKey] || !newData[tabKey][sectionIndex]) return prev;
      const section = newData[tabKey][sectionIndex];
      const newId = generateId();
      let newCard;
      if (tabKey === "Quiz") { newCard = { id: newId, type: "quiz", nume: "Întrebare Nouă", comentariu_filosofic: "...", image_url: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=800", options: ["A", "B", "C", "D"], correctAnswer: 0 }; } 
      else { newCard = { id: newId, type: "standard", nume: "Titlu Nou", lucrare_relevanta: "Lucrare...", comentariu_filosofic: "Descriere...", detailed_text: "Scrie eseul...", image_url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800" }; }
      section.items.push(newCard);
      return newData;
    });
  };

  const handleUploadMedia = async (file, sectionIndex = 0) => {
    if (!file) return;
    const safeIndex = Number.isFinite(Number(sectionIndex)) ? Number(sectionIndex) : 0;
    const mediaCardId = generateId();
    const addMediaCard = (videoUrl, isTempVideo = false) => {
      if (!videoUrl) return;
      const newMediaCard = { id: mediaCardId, type: "media", nume: file.name.replace(/\.[^/.]+$/, ""), video_url: videoUrl, comentariu_filosofic: `Fisier: ${file.name}`, isLocalVideo: true, isTempVideo };
      setAppData(prev => {
        const newData = { ...prev };
        if (!newData["Media"]) newData["Media"] = [{ id: "sec-media", title: "Media", description: "", items: [] }];
        if (newData["Media"].length === 0) newData["Media"].push({ id: "sec-media", title: "Media", description: "", items: [] });
        const targetIndex = Math.min(Math.max(safeIndex, 0), newData["Media"].length - 1);
        newData["Media"][targetIndex].items.push(newMediaCard);
        return newData;
      });
    };

    const maxDataUrlBytes = 4 * 1024 * 1024;
    if (file.size > maxDataUrlBytes) {
      const objectUrl = URL.createObjectURL(file);
      addMediaCard(objectUrl, true);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const videoUrl = String(event.target?.result || "");
        addMediaCard(videoUrl, false);
      };
      reader.onerror = () => {
        alert("Nu am putut citi fisierul video. Incearca un fisier mai mic.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSection = (tabKey) => {
    setAppData(prev => {
      const newData = { ...prev };
      if (!newData[tabKey]) newData[tabKey] = [];
      newData[tabKey].push({ id: generateId(), title: "Categorie Nouă", description: "Adaugă o descriere...", items: [] });
      return newData;
    });
  };

  const handleAddBibliographyRow = () => {
    setAppData(prev => {
      const newData = { ...prev };
      if (!newData.Bibliografie) newData.Bibliografie = [];
      newData.Bibliografie.push({ id: generateId(), resource: "", link: "", notes: "" });
      return newData;
    });
  };

  const handleUpdateBibliographyRow = (id, field, value) => {
    setAppData(prev => {
      const newData = { ...prev };
      if (!newData.Bibliografie) newData.Bibliografie = [];
      newData.Bibliografie = newData.Bibliografie.map(item => item.id === id ? { ...item, [field]: value } : item);
      return newData;
    });
  };

  const handleDeleteBibliographyRow = (id) => {
    setAppData(prev => {
      const newData = { ...prev };
      if (!newData.Bibliografie) return prev;
      newData.Bibliografie = newData.Bibliografie.filter(item => item.id !== id);
      return newData;
    });
  };

  const handleUpdateSection = (tabKey, sectionIdx, updatedSection) => {
    setAppData(prev => { const newData = { ...prev }; newData[tabKey][sectionIdx] = updatedSection; return newData; });
  };

  const handleDeleteSection = (tabKey, sectionId) => {
    if(!window.confirm("Ești sigur că vrei să ștergi această categorie și tot conținutul ei?")) return;
    
    setAppData(prev => { 
        const newData = { ...prev }; 
        if (newData[tabKey]) {
            newData[tabKey] = newData[tabKey].filter((s) => s.id !== sectionId); 
        }
        return newData; 
    });
  };

  const navigateToDetails = (targetId) => { setScrollTarget(targetId); setCurrentView("details"); };
  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("civicaOnboardingDismissed", "true");
    } catch (e) {
      console.error("Failed to store onboarding dismissal", e);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", position: "relative", color: theme.textPrimary, paddingBottom: "40px" }}>
      <GlobalBackground theme={theme} />
      <NavBar 
        currentView={currentView} onViewChange={setCurrentView} 
        isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} 
        isDevMode={isDevMode} setIsDevMode={setIsDevMode}
        accentKey={accentKey} setAccentKey={setAccentKey}
        theme={theme}
        appData={appData}
        activeTab={activeTab}
        openSectionIndex={openSectionIndex}
        setOpenSectionIndex={setOpenSectionIndex}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
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
        button:focus { outline: none; }

        @media (max-width: 1000px) {
          .civica-nav-inner { flex-wrap: wrap; height: auto; gap: 10px; padding: 10px 0; }
          .civica-nav-actions { width: 100%; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
          .civica-nav-tabs { flex-wrap: wrap; }
          .civica-search { width: 180px !important; }
        }

        @media (max-width: 720px) {
          .civica-nav-inner { padding: 8px 0 12px 0; }
          .civica-nav-left { width: 100%; justify-content: space-between; }
          .civica-nav-actions { width: 100%; justify-content: space-between; }
          .civica-search { width: 100% !important; }
          .civica-hero { margin-top: 24px; margin-bottom: 40px; }
          .civica-hero-title { font-size: 34px !important; }
          .civica-hero-sub { font-size: 16px !important; }
          .civica-onboarding { padding: 14px 16px !important; }
          .civica-tab-row { gap: 8px; }
          .civica-accordion-header { padding: 18px 18px !important; }
          .civica-accordion-body { padding: 0 18px 18px 18px !important; }
          .civica-card-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; gap: 16px !important; }
        }

        @media (max-width: 520px) {
          .civica-hero-title { font-size: 30px !important; }
          .civica-hero-sub { font-size: 15px !important; }
          .civica-nav-tabs button { padding: 6px 12px !important; font-size: 12px !important; }
          .civica-results { font-size: 13px !important; }
          .civica-empty { padding: 20px !important; }
        }
      `}</style>
      
      {currentView === "home" && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
          <HomeView 
            data={appData} 
            activeTab={activeTab} setActiveTab={setActiveTab}
            openSectionIndex={openSectionIndex} setOpenSectionIndex={setOpenSectionIndex}
            onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onAddCard={handleAddCard} onUploadMedia={handleUploadMedia}
            onNavigateToDetails={navigateToDetails} onAddSection={handleAddSection} onUpdateSection={handleUpdateSection} onDeleteSection={handleDeleteSection}
            theme={theme} isDevMode={isDevMode}
            searchQuery={searchQuery}
            showOnboarding={showOnboarding}
            onDismissOnboarding={handleDismissOnboarding}
          />
        </div>
      )}
      {currentView === "details" && <DetailsView data={appData} scrollTarget={scrollTarget} onUpdateCard={handleUpdateCard} theme={theme} isDevMode={isDevMode} />}
      {currentView === "bibliography" && <BibliographyView
        theme={theme}
        isDevMode={isDevMode}
        items={bibliographyItems}
        onAddRow={handleAddBibliographyRow}
        onUpdateRow={handleUpdateBibliographyRow}
        onDeleteRow={handleDeleteBibliographyRow}
      />}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
