# 🚀 Guide de déploiement JeCode — Étape par étape

---

## ÉTAPE 1 — Préparer GitHub

1. Va sur https://github.com et crée un compte si tu n'en as pas
2. Clique sur **"New repository"** (bouton vert)
3. Nom du repo : `jecode-reservation`
4. Mets-le en **Public**
5. Clique **"Create repository"**
6. Sur ta machine, ouvre un terminal dans le dossier `jecode/` et tape :

```bash
git init
git add .
git commit -m "Initial commit JeCode"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/jecode-reservation.git
git push -u origin main
```

---

## ÉTAPE 2 — Configurer EmailJS (notifications email)

1. Va sur https://www.emailjs.com → crée un compte gratuit
2. Clique **"Add New Service"** → choisis **Gmail**
   - Connecte ton compte Gmail
   - Note le **Service ID** (ex: `service_abc123`)
3. Clique **"Email Templates"** → **"Create New Template"**
   - Sujet : `🔔 Nouvelle réservation JeCode — {{nom}}`
   - Corps du message :
     ```
     Nouvelle réservation reçue !

     Nom       : {{nom}}
     Téléphone : {{telephone}}
     Email     : {{email}}
     Niveau    : {{niveau}}
     Question  : {{question}}
     Date      : {{date}}
     ```
   - Note le **Template ID** (ex: `template_xyz789`)
4. Va dans **"Account"** → note ta **Public Key** (ex: `user_ABCDEF`)
5. Ouvre `src/config.js` et remplis :
   ```js
   export const EMAILJS_SERVICE_ID  = "service_abc123";
   export const EMAILJS_TEMPLATE_ID = "template_xyz789";
   export const EMAILJS_PUBLIC_KEY  = "user_ABCDEF";
   ```

---

## ÉTAPE 3 — Configurer Google Sheets

1. Va sur https://sheets.google.com → crée un nouveau tableau
2. Nomme-le `JeCode Réservations`
3. En ligne 1, mets ces en-têtes :
   `ID | Nom | Téléphone | Email | Niveau | Question | Date | Statut`
4. Va dans le menu **Extensions → Apps Script**
5. Efface le contenu et colle ce code :

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data  = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.id,
    data.nom,
    data.telephone,
    data.email     || "",
    data.niveau,
    data.question  || "",
    data.date,
    data.status
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ result: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

6. Clique **Déployer → Nouveau déploiement**
   - Type : **Application Web**
   - Exécuter en tant que : **Moi**
   - Accès : **Tout le monde**
   - Clique **Déployer** et autorise les permissions
7. Copie l'URL du Web App (commence par `https://script.google.com/...`)
8. Colle-la dans `src/config.js` :
   ```js
   export const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/TON_ID/exec";
   ```

---

## ÉTAPE 4 — Déployer sur Vercel

1. Va sur https://vercel.com → crée un compte avec ton GitHub
2. Clique **"Add New Project"**
3. Sélectionne ton repo `jecode-reservation`
4. Vercel détecte automatiquement Vite → laisse les paramètres par défaut
5. Clique **"Deploy"**
6. ⏳ Attends 1-2 minutes…
7. Vercel te donne ton lien ! ex : `https://jecode-reservation.vercel.app`

---

## ÉTAPE 5 — Pusher les changements (config.js rempli)

Après avoir rempli ton `config.js` :

```bash
git add .
git commit -m "Ajout config EmailJS et Google Sheets"
git push
```
→ Vercel redéploie automatiquement en 1 minute.

---

## ÉTAPE 6 — Changer le mot de passe admin

Dans `src/config.js`, change :
```js
export const ADMIN_PASSWORD = "TonMotDePasseSecret";
```
Puis `git push`.

---

## ✅ Récapitulatif des liens utiles

| Service   | Lien                          | Gratuit |
|-----------|-------------------------------|---------|
| GitHub    | https://github.com            | ✅ Oui  |
| Vercel    | https://vercel.com            | ✅ Oui  |
| EmailJS   | https://www.emailjs.com       | ✅ 200 emails/mois |
| G. Sheets | https://sheets.google.com     | ✅ Oui  |

---

## ❓ En cas de problème

Contacte sur WhatsApp : +224 624 144 006


ID de déploiement Google sheets

AKfycbyG70ys8uRKW0JzUOTzcMFtdETdZ-YTYVf0nc9bMFC9_7pwQBaB6IeqS7FI3ML1Ghn_-A

Application Web

https://script.google.com/macros/s/AKfycbyG70ys8uRKW0JzUOTzcMFtdETdZ-YTYVf0nc9bMFC9_7pwQBaB6IeqS7FI3ML1Ghn_-A/exec