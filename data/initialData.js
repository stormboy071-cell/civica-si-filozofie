export const INITIAL_DATA = {
  Politica: [
    {
      id: "sec-antichitate",
      title: "Antichitate",
      description: "Bazele democrației și ale idealismului politic în Grecia Antică.",
      items: [
        {
          id: "p1",
          type: "standard",
          nume: "Pericle",
          lucrare_relevanta: "Discursul funerar (în Tucidide)",
          comentariu_filosofic: "Pericle definește democrația prin acțiune și retorică.",
          detailed_text: "Aici poți scrie analiza detaliată despre Pericle pentru concurs...",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pericles_Pio-Clementino_Inv269_n2.jpg/640px-Pericles_Pio-Clementino_Inv269_n2.jpg"
        },
        {
          id: "p2",
          type: "standard",
          nume: "Platon",
          lucrare_relevanta: "Republica (Politeia)",
          comentariu_filosofic: "Platon imaginează statul ideal condus de rațiune.",
          detailed_text: "Analiza detaliată a 'Republicii' și a mitului peșterii...",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg/640px-Plato_Silanion_Musei_Capitolini_MC1377.jpg"
        },
        {
          id: "p3",
          type: "standard",
          nume: "Aristotel",
          lucrare_relevanta: "Politica",
          comentariu_filosofic: "Aristotel definește omul ca 'Zoon Politikon'.",
          detailed_text: "Comparatie între formele de guvernământ la Aristotel...",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/640px-Aristotle_Altemps_Inv8575.jpg"
        }
      ]
    },
    {
      id: "sec-renastere",
      title: "Renaștere",
      description: "Realismul politic și suveranitatea.",
      items: [
        {
          id: "r1",
          type: "standard",
          nume: "Niccolò Machiavelli",
          lucrare_relevanta: "Principele",
          comentariu_filosofic: "Scopul scuză mijloacele în menținerea statului.",
          detailed_text: "Analiza realismului politic...",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg/640px-Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg"
        }
      ]
    }
  ],
  Drepturi: [
    {
      id: "sec-libertate",
      title: "Rădăcinile Libertății",
      description: "Momente cheie în istoria drepturilor.",
      items: [
        {
          id: "d1",
          type: "standard",
          nume: "Magna Carta (1215)",
          lucrare_relevanta: "Magna Carta Libertatum",
          comentariu_filosofic: "Nimeni nu este mai presus de lege.",
          detailed_text: "Impactul istoric al Magna Carta...",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg/640px-Magna_Carta_%28British_Library_Cotton_MS_Augustus_II.106%29.jpg"
        }
      ]
    }
  ],
  Bibliografie: [
    {
      id: "b1",
      resource: "Platon - Republica",
      link: "https://example.com/republica",
      notes: "Editia 2020, Humanitas"
    },
    {
      id: "b2",
      resource: "Stanford Encyclopedia of Philosophy",
      link: "https://plato.stanford.edu/",
      notes: "Sursa academica"
    }
  ],
  Quiz: [
    {
      id: "sec-quiz",
      title: "Testează-ți Cunoștințele",
      description: "Întrebări esențiale.",
      items: [
        {
          id: "q1",
          type: "quiz",
          nume: "Cine a scris 'Republica'?",
          comentariu_filosofic: "Descrie mitul peșterii.",
          options: ["Aristotel", "Platon", "Socrate", "Pericle"],
          correctAnswer: 1,
          image_url: "https://images.unsplash.com/photo-1555445054-a9dcb8a4a755?auto=format&fit=crop&q=80&w=800"
        }
      ]
    }
  ],
  Media: []
};
