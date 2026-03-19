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
  const docRef = useRef(doc(db, "appData", "main"));
  const bibliographyItems = Array.isArray(appData.Bibliografie) ? appData.Bibliografie : [];
  
  const baseTheme = isDarkMode ? THEMES.dark : THEMES.light;
  const accent = (ACCENTS[accentKey] && (isDarkMode ? ACCENTS[accentKey].dark : ACCENTS[accentKey].light)) || baseTheme.accent;
  const theme = { ...baseTheme, accent };
  const makePersistableData = (data) => {
    const updatedAt = Date.now();
    return { ...data, _meta: { ...(data && data._meta ? data._meta : {}), updatedAt } };
  };

  const isLocalAsset = (value) => {
    return typeof value === "string" && (value.startsWith("data:") || value.startsWith("blob:"));
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
        const localUpdatedAt = appData?._meta?.updatedAt || 0;
        const remoteSnap = await getDoc(docRef.current);
        if (!remoteSnap.exists()) {
          const payload = sanitizeForFirestore(makePersistableData(appData));
          await setDoc(docRef.current, { payload }, { merge: true });
        } else {
          const remotePayload = remoteSnap.data()?.payload;
          const remoteUpdatedAt = remotePayload?._meta?.updatedAt || 0;
          const localSize = JSON.stringify(appData || {}).length;
          const remoteSize = JSON.stringify(remotePayload || {}).length;
          if (remoteUpdatedAt > localUpdatedAt) {
            isApplyingRemoteRef.current = true;
            const merged = mergeRemoteWithLocalAssets(remotePayload, appData);
            setAppData(merged);
            isApplyingRemoteRef.current = false;
          } else if (localUpdatedAt > remoteUpdatedAt) {
            const payload = sanitizeForFirestore(makePersistableData(appData));
            await setDoc(docRef.current, { payload }, { merge: true });
          } else if (remoteSize > localSize) {
            isApplyingRemoteRef.current = true;
            const merged = mergeRemoteWithLocalAssets(remotePayload, appData);
            setAppData(merged);
            isApplyingRemoteRef.current = false;
          } else if (localSize > remoteSize) {
            const payload = sanitizeForFirestore(makePersistableData(appData));
            await setDoc(docRef.current, { payload }, { merge: true });
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
    a.download = `civica-data-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const uploadVideoFile = async (file) => {
    const fileId = generateId();
    const storageRef = ref(storage, `media/videos/${fileId}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleUploadMedia = async (file, sectionIndex = 0) => {
    if (!file) return;
    const safeIndex = Number.isFinite(Number(sectionIndex)) ? Number(sectionIndex) : 0;
    const addMediaCard = (videoUrl, isTempVideo = false) => {
      if (!videoUrl) return;
      const newMediaCard = { id: generateId(), type: "media", nume: file.name.replace(/\.[^/.]+$/, ""), video_url: videoUrl, comentariu_filosofic: `Fisier: ${file.name}`, isLocalVideo: true, isTempVideo };
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

    try {
      const videoUrl = await uploadVideoFile(file);
      if (videoUrl) {
        const newMediaCard = { id: generateId(), type: "media", nume: file.name.replace(/\.[^/.]+$/, ""), video_url: videoUrl, comentariu_filosofic: `Fisier: ${file.name}`, isLocalVideo: false, isTempVideo: false };
        setAppData(prev => {
          const newData = { ...prev };
          if (!newData["Media"]) newData["Media"] = [{ id: "sec-media", title: "Media", description: "", items: [] }];
          if (newData["Media"].length === 0) newData["Media"].push({ id: "sec-media", title: "Media", description: "", items: [] });
          const targetIndex = Math.min(Math.max(safeIndex, 0), newData["Media"].length - 1);
          newData["Media"][targetIndex].items.push(newMediaCard);
          return newData;
        });
      }
    } catch (err) {
      console.error("Failed to upload video to Firebase Storage", err);
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
