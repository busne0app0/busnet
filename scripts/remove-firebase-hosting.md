# Remove Firebase Hosting (guide)

If you previously deployed the site to Firebase Hosting, the live URL may still serve the old build. Follow these steps to remove or replace the Firebase-hosted site.

IMPORTANT: These steps do not delete your project or database. Double-check before deleting hosting resources.

1) Check whether Firebase CLI is configured locally

```powershell
# ensure firebase tools are installed
npm install -g firebase-tools

# list available projects
firebase projects:list
```

2) If you know the Firebase project you used for hosting, open Firebase Console > Hosting and either:
- Delete the site from the UI (Hosting > Site settings > Delete site), or
- Remove the deployed version manually (remove files or create a new deploy).

3) To disable hosting via CLI (projectId replace accordingly):

```powershell
# select project
firebase use <PROJECT_ID>

# remove the default hosting site content by deploying an empty folder
# create an empty folder and deploy it to replace content
New-Item -ItemType Directory -Path ./empty_host
npm --no-install run -s echo "" > ./empty_host/index.html
firebase deploy --only hosting

# optionally, remove the hosting site via console if you prefer
```

4) Remove any CI/CD steps or scripts that call `firebase deploy` (example: `prepare-deploy.ps1`), and update to point to Vercel or your chosen host.

5) Clean local `dist_production/` and rebuild for Vercel:

```powershell
# remove older production build
Remove-Item -Recurse -Force dist_production

# build and deploy to Vercel
npm run build
npm run deploy:full
```

6) Verify DNS / domain settings in Vercel and Firebase: if you previously mapped a custom domain to Firebase Hosting, remove the mapping there and add it to Vercel.

If you want I can create a small PowerShell script that automates steps 3 and 5 (will require firebase-tools and interactive auth).