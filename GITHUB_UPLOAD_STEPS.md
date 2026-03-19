# Upload pe GitHub

Terminalul curent nu are `git` instalat, deci uploadul direct nu poate fi facut de aici. Dupa ce instalezi Git, ruleaza comenzile de mai jos din folderul proiectului.

## 1. Initializare repo local

```bash
git init
git add .
git commit -m "Initial commit"
```

## 2. Creeaza repository nou pe GitHub

Creeaza un repository nou, de exemplu:

`civica-si-filozofie`

Nu bifa fisiere automate precum README, `.gitignore` sau license daca vrei sa urci exact proiectul pregatit aici.

## 3. Conecteaza proiectul local la GitHub

Inlocuieste `USERNAME` cu userul tau GitHub:

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/civica-si-filozofie.git
git push -u origin main
```

## 4. Publicare online

### Varianta recomandata: Vercel

- intri pe Vercel
- alegi `Add New Project`
- conectezi repository-ul GitHub
- framework detectat: `Vite`
- build command: `npm run build`
- output directory: `dist`

### Alternativa: Netlify

- importi repo-ul din GitHub
- build command: `npm run build`
- publish directory: `dist`

## 5. Ce sa verifici inainte

- `README.md` sa aiba numele tau si eventual linkul live
- `.gitignore` exista deja si exclude `node_modules`, `dist` si fisiere inutile
- proiectul porneste local cu `npm install` si `npm run dev`
