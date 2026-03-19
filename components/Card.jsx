import React, { useEffect, useState } from "react";
import { makeInputStyle } from "../utils.js";
import { storage } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Card = ({ data, id, onUpdate, onDelete, allowEdit, allowDelete, onReadMore, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState(data.nume);
  const [editWork, setEditWork] = useState(data.lucrare_relevanta || "");
  const [editDesc, setEditDesc] = useState(data.comentariu_filosofic || "");
  const [editOptions, setEditOptions] = useState(data.options || ["", "", "", ""]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState(data.correctAnswer !== undefined ? data.correctAnswer : 0);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (!isEditing) {
      setEditName(data.nume);
      setEditWork(data.lucrare_relevanta || "");
      setEditDesc(data.comentariu_filosofic || "");
      setEditOptions(data.options || ["", "", "", ""]);
      setEditCorrectAnswer(data.correctAnswer !== undefined ? data.correctAnswer : 0);
    }
  }, [data, isEditing]);

  const persist = (partial) => {
    onUpdate({ ...data, ...partial });
  };

  const isCorrect = selectedOption === data.correctAnswer;
  const isAnswered = selectedOption !== null;

  const uploadImageFile = async (file) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const storageRef = ref(storage, `media/images/${fileId}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = String(event.target?.result || "");
        if (imageUrl) {
          onUpdate({ ...data, image_url: imageUrl, isLocalImage: true });
        }
      };
      reader.readAsDataURL(file);

      try {
        const imageUrl = await uploadImageFile(file);
        if (imageUrl) {
          onUpdate({ ...data, image_url: imageUrl, isLocalImage: false });
        }
      } catch (err) {
        console.error("Failed to upload image to Firebase Storage", err);
      }
    }
  };

  const inputStyle = makeInputStyle(theme);

  const renderEditForm = () => (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", height: "100%", overflowY: "auto", color: theme.textPrimary }}>
      <label style={{fontSize: "12px", fontWeight: "bold", color: theme.textSecondary}}>{data.type === "quiz" ? "Intrebare" : "Titlu"}</label>
      <input value={editName} onChange={(e) => { const v = e.target.value; setEditName(v); persist({ nume: v }); }} style={inputStyle} />
      {data.type === "standard" && (
        <>
          <label style={{fontSize: "12px", fontWeight: "bold", color: theme.textSecondary}}>Lucrare</label>
          <input value={editWork} onChange={(e) => { const v = e.target.value; setEditWork(v); persist({ lucrare_relevanta: v }); }} style={inputStyle} />
        </>
      )}
      <label style={{fontSize: "12px", fontWeight: "bold", color: theme.textSecondary}}>Descriere scurta</label>
      <textarea value={editDesc} onChange={(e) => { const v = e.target.value; setEditDesc(v); persist({ comentariu_filosofic: v }); }} rows={3} style={{ ...inputStyle, resize: "none" }} />
      <label style={{fontSize: "12px", fontWeight: "bold", color: theme.textSecondary}}>Imagine</label>
      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: "12px" }} />
      {data.type === "quiz" && (
        <div style={{ marginTop: "10px", borderTop: `1px solid ${theme.borderColor}`, paddingTop: "10px" }}>
          <label style={{fontSize: "12px", fontWeight: "bold", color: theme.textSecondary, display: "block", marginBottom: "8px"}}>Variante Raspuns</label>
          {editOptions.map((opt, idx) => (
             <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
               <input type="radio" name={`correctAnswer-${data.id}`} checked={editCorrectAnswer === idx} onChange={() => { setEditCorrectAnswer(idx); persist({ correctAnswer: idx, options: editOptions }); }} />
               <input value={opt} onChange={(e) => { const n = [...editOptions]; n[idx] = e.target.value; setEditOptions(n); persist({ options: n }); }} style={{ ...inputStyle, flex: 1 }} />
             </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "8px", background: theme.accent, color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Gata</button>
      </div>
    </div>
  );

  const renderMedia = () => (
    <>
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", backgroundColor: "#000", borderBottom: `1px solid ${theme.borderColor}` }}>
        {data.isLocalVideo ? <video src={data.video_url} controls style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} /> : <iframe src={data.video_url} title={data.nume} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} />}
      </div>
      <div style={{ padding: "20px", flexGrow: 1 }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", color: theme.textPrimary, fontFamily: "'Playfair Display', serif", fontWeight: "700" }}>{data.nume}</h3>
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: theme.textSecondary }}>{data.comentariu_filosofic}</p>
        {allowDelete && <button onClick={onDelete} style={{ marginTop: "15px", padding: "8px 16px", backgroundColor: theme.dangerBg, color: theme.danger, border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", width: "100%" }}>Sterge Video</button>}
      </div>
    </>
  );

  const renderQuiz = () => (
    <>
       <div style={{ height: "160px", width: "100%", overflow: "hidden", backgroundColor: theme.sectionBg, borderBottom: `1px solid ${theme.borderColor}`, position: "relative" }}>
         {data.image_url && <img src={data.image_url} alt={data.nume} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6) sepia(0.2)" }} />}
         <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
             <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "20px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{data.nume}</h3>
         </div>
         {allowEdit && <button onClick={() => setIsEditing(true)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", zIndex: 5 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>}
      </div>
      <div style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "10px", fontStyle: "italic" }}>{data.comentariu_filosofic}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {data.options?.map((opt, idx) => {
            let bgColor = theme.sectionBg, textColor = theme.textPrimary, borderColor = theme.borderColor;
            if (isAnswered) {
              if (idx === data.correctAnswer) { bgColor = theme.successBg; textColor = theme.success; borderColor = theme.success; } 
              else if (idx === selectedOption) { bgColor = theme.dangerBg; textColor = theme.danger; borderColor = theme.danger; }
            }
            return <button key={idx} onClick={() => !isAnswered && setSelectedOption(idx)} disabled={isAnswered} style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, fontSize: "13px", fontWeight: "600", cursor: isAnswered ? "default" : "pointer", transition: "all 0.2s" }}>{opt}</button>;
          })}
        </div>
        {isAnswered && <div style={{ marginTop: "10px", padding: "8px", borderRadius: "6px", backgroundColor: isCorrect ? theme.successBg : theme.dangerBg, color: isCorrect ? theme.success : theme.danger, fontSize: "13px", fontWeight: "bold", textAlign: "center" }}>{isCorrect ? "Corect!" : "Mai incearca!"}</div>}
        {allowDelete && <button onClick={onDelete} style={{ marginTop: "auto", padding: "8px", backgroundColor: theme.dangerBg, color: theme.danger, border: "1px solid " + theme.danger, borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", width: "100%", opacity: 0.8 }}>Sterge Intrebarea</button>}
      </div>
    </>
  );

  const renderStandard = () => (
    <>
      <div style={{ height: "220px", width: "100%", overflow: "hidden", backgroundColor: theme.sectionBg, borderBottom: `1px solid ${theme.borderColor}`, position: "relative" }}>
        {data.image_url ? (
          <img src={data.image_url} alt={data.nume} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)", transform: isHovered ? "scale(1.05)" : "scale(1.0)", filter: "sepia(0.15) contrast(1.05)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textSecondary, fontSize: "12px" }}>
            Fara imagine
          </div>
        )}
        {allowEdit && <button onClick={() => setIsEditing(true)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>}
      </div>
      <div style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", color: theme.textPrimary, fontFamily: "'Playfair Display', serif", fontWeight: "700" }}>{data.nume}</h3>
        <div style={{ fontSize: "12px", color: theme.accent, marginBottom: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{data.lucrare_relevanta}</div>
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: theme.textSecondary, textAlign: "justify", margin: 0, fontFamily: "'Inter', sans-serif" }}>{data.comentariu_filosofic}</p>
        
        <button onClick={onReadMore} style={{ marginTop: "16px", background: "none", border: "none", display: "flex", alignItems: "center", color: theme.accent, fontWeight: "600", fontSize: "14px", cursor: "pointer", padding: 0 }}>
          <span>Vezi Detalii {allowEdit ? "/ Editeaza Eseu" : ""}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>

        {allowDelete && <button onClick={onDelete} style={{ marginTop: "auto", paddingTop: "15px", background: "none", border: "none", color: theme.danger, cursor: "pointer", fontSize: "12px", fontWeight: "600", width: "100%", textAlign: "left" }}>Sterge Card</button>}
      </div>
    </>
  );

  return (
    <div 
      id={id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: theme.cardBg, borderRadius: "8px", boxShadow: isHovered ? "0 20px 25px -5px rgba(0, 0, 0, 0.1)" : theme.shadow,
        overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${theme.borderColor}`,
        transition: "all 0.3s ease", transform: isHovered && !isEditing ? "translateY(-4px)" : "translateY(0)", height: "100%", cursor: "default", scrollMarginTop: "100px"
      }}
    >
      {isEditing ? renderEditForm() : data.type === "quiz" ? renderQuiz() : data.type === "media" ? renderMedia() : renderStandard()}
    </div>
  );
};

export default Card;
