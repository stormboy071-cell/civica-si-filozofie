# Auto Deploy Setup

This project is now prepared for automatic deploys with GitHub Actions and Firebase Hosting.

## What happens after setup

- every push to `main` deploys the live website
- every pull request gets a temporary preview link

## One-time setup you still need to do

The workflows are already in the repo, but GitHub still needs permission to deploy to your Firebase project.

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

## Files added for auto deploy

- `.github/workflows/deploy-live.yml`
- `.github/workflows/deploy-preview.yml`

## How to use it

```bash
git add .
git commit -m "Set up auto deploy"
git push origin main
```

If the secret is configured, GitHub Actions will build the app and publish it to Firebase Hosting automatically.

## Official references

- Firebase Hosting GitHub integration: https://firebase.google.com/docs/hosting/github-integration
- Firebase action README: https://github.com/FirebaseExtended/action-hosting-deploy
