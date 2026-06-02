# Civica si Filozofie

Aplicatie web dezvoltata cu React si Vite pentru organizarea si prezentarea continutului despre filosofie politica, drepturi, bibliografie si materiale media. Proiectul a fost gandit ca suport educational si ca instrument interactiv pentru studiu si documentare.

## Demo

Adauga aici linkul catre versiunea live dupa deploy:

`https://civica-si-filozofie.web.app`

## Functionalitati

- navigare pe categorii tematice precum Politica, Drepturi, Bibliografie, Quiz si Media
- filtrare rapida in categoria curenta
- mod dezvoltator pentru adaugare, editare si stergere de continut
- pagina separata pentru documentatie extinsa si eseuri
- persistenta locala prin `localStorage`
- sincronizare in cloud prin Supabase
- upload media prin Supabase Storage
- interfata tematizabila, cu mod light/dark si accente vizuale personalizabile

## Stack Tehnologic

- React 19
- Vite
- Supabase Database
- Supabase Storage
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
supabase.js     configurare Supabase
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

Proiectul poate fi publicat pe Firebase Hosting, iar datele si fisierele folosesc Supabase.

Auto deploy-ul este pregatit prin GitHub Actions:

- orice `push` in `main` publica versiunea live
- orice `pull request` primeste un preview link temporar

Configurarea finala pentru secretul GitHub este descrisa in:

`AUTO_DEPLOY_SETUP.md`

Configurarea backend-ului gratuit este descrisa in:

`SUPABASE_SETUP.md`

## Autor

Numele tau aici

Daca vrei, poti adauga si:

- LinkedIn
- email profesional
- portofoliu personal
