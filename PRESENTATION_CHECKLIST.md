# Checklist prezentare

## Ce sa faci pe calculatorul pe care exista deja toate datele in localStorage

1. Porneste aplicatia in browserul unde ai lucrat pana acum.
2. Intra in `Setari`.
3. Apasa `Exporta Backup Prezentare`.
4. Salveaza fisierul descarcat cu numele:

`presentation-backup.json`

5. Pune fisierul aici:

`public/presentation-backup.json`

Daca folderul `public` nu exista, creeaza-l.

## De ce e important

- `localStorage` ramane doar pe browserul si profilul curent
- Firebase poate rata sincronizarea daca documentul devine prea mare
- backupul JSON inclus in proiect este cea mai sigura varianta pentru prezentare

## Ce face acum aplicatia

- daca exista `localStorage`, il foloseste
- daca nu exista `localStorage`, incearca sa incarce `presentation-backup.json`
- apoi incearca sincronizarea cu Firebase

## Verificare recomandata

1. Pune `public/presentation-backup.json` in proiect.
2. Ruleaza `npm run build` sau `npm run dev`.
3. Testeaza in:
   - un browser nou
   - un profil nou
   - sau alt user de Windows

## Buton util nou

In `Setari` ai acum si:

- `Forteaza Sync in Cloud`

Acesta incearca sa urce imediat datele curente in Firebase, dar pentru prezentare tot backupul JSON ramane varianta cea mai sigura.
