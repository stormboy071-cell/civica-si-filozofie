# Civica si Filozofie

Aplicatie web dezvoltata cu React si Vite pentru organizarea si prezentarea continutului despre filosofie politica, drepturi, bibliografie si materiale media. Proiectul a fost gandit ca suport educational si ca instrument interactiv pentru studiu si documentare.

## Demo

Adauga aici linkul catre versiunea live dupa deploy:

`https://exemplu-vercel-sau-netlify.app`

## Functionalitati

- navigare pe categorii tematice precum Politica, Drepturi, Bibliografie, Quiz si Media
- cautare globala in continutul aplicatiei
- mod dezvoltator pentru adaugare, editare si stergere de continut
- pagina separata pentru documentatie extinsa si eseuri
- persistenta locala prin `localStorage`
- sincronizare in cloud prin Firebase Firestore
- upload media prin Firebase Storage
- interfata tematizabila, cu mod light/dark si accente vizuale personalizabile

## Stack Tehnologic

- React 19
- Vite
- Firebase Firestore
- Firebase Storage
- JavaScript
- CSS inline styling

## Rulare Locala

### Cerinte

- Node.js 18+ recomandat
- npm

### Instalare

```bash
npm install
```

### Pornire in dezvoltare

```bash
npm run dev
```

### Build productie

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

## Structura Proiect

```text
components/     componente reutilizabile UI
views/          pagini si ecrane principale
data/           date initiale ale aplicatiei
index.jsx       punctul principal de intrare
firebase.js     configurare Firebase
themes.js       teme si accente vizuale
utils.js        functii utilitare
```

## Ce Evidentiaza Proiectul

- organizarea unui proiect frontend modular
- lucrul cu React state si efecte
- integrarea unui serviciu cloud real prin Firebase
- gandirea unui produs educational cu functionalitati de administrare continut

## Posibile Imbunatatiri

- autentificare pentru zona de administrare
- validare mai buna pentru continutul introdus
- optimizare pentru accesibilitate
- rafinarea stilurilor responsive
- export sau backup pentru continut

## Publicare

Proiectul poate fi publicat usor pe:

- Vercel
- Netlify
- Firebase Hosting

Recomandare pentru portofoliu: codul in GitHub si deploy automat din GitHub in Vercel sau Netlify.

## Autor

Numele tau aici

Daca vrei, poti adauga si:

- LinkedIn
- email profesional
- portofoliu personal
