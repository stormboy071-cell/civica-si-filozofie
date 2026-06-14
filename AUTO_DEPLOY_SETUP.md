# Auto Deploy Setup

This project is now prepared for automatic deploys with GitHub Actions, GitHub Pages, and Firebase Hosting.

## What happens after setup

- every push to `main` deploys the live website to GitHub Pages
- every push to `main` can also deploy to Firebase Hosting if the Firebase secret is configured
- every pull request gets a temporary preview link

## GitHub Pages setup

The GitHub Pages workflow is already in:

` .github/workflows/deploy-github-pages.yml`

One-time GitHub setting:

1. Open your GitHub repository.
2. Go to `Settings -> Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main`.

Your GitHub Pages URL should be:

`https://stormboy071-cell.github.io/civica-si-filozofie/`

## Firebase setup

The Firebase workflows are already in the repo, but GitHub still needs permission to deploy to your Firebase project.

### Option A: easiest official setup

Run this in the project folder:

```bash
firebase init hosting:github
```

Firebase's official docs say this command can:

- create a service account with Hosting deploy permission
- upload its JSON key to your GitHub repository as an encrypted secret
- generate the GitHub workflow files

If you use this command, Firebase may create its own workflow files. You can keep either the generated ones or the ones already added in this repo.

### Option B: set the GitHub secret manually

1. In Firebase / Google Cloud, create a service account key JSON for deploys.
2. In GitHub, open:

`Repo -> Settings -> Secrets and variables -> Actions`

3. Add a new repository secret named:

`FIREBASE_SERVICE_ACCOUNT`

4. Paste the full JSON key as the secret value.

After that, every push to `main` should deploy automatically.

## Files used for auto deploy

- `.github/workflows/deploy-github-pages.yml`
- `.github/workflows/deploy-live.yml`
- `.github/workflows/deploy-preview.yml`
- `vite.config.js`

## How to use it

```bash
git add .
git commit -m "Set up auto deploy"
git push origin main
```

GitHub Actions will build the app and publish it to GitHub Pages automatically.

If the Firebase secret is configured, GitHub Actions will also publish it to Firebase Hosting automatically.

## Official references

- Firebase Hosting GitHub integration: https://firebase.google.com/docs/hosting/github-integration
- Firebase action README: https://github.com/FirebaseExtended/action-hosting-deploy
