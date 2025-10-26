# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment

Quick steps to push this project to GitHub and deploy:

1. Create a GitHub repository (on github.com) and copy the HTTPS remote URL..
2. From PowerShell in the project root, run:

```powershell
git remote add origin <YOUR_GIT_REMOTE_URL>
git branch -M main
git push -u origin main
```

3. Frontend hosting: connect the repository to Vercel or Netlify. Build command: `npm run build` and publish directory: `dist`.

4. Backend hosting: use Render, Railway, or Heroku. Set environment variables (MONGODB_URI, JWT_SECRET, SMTP credentials). If you use Render, create a new Web Service from the repo, set the start command to `node backend/server.js` (or follow the project's backend README if present).

Notes:
- Do NOT commit secret files like `.env` — they are listed in `.gitignore`.
- If your repository is large because of `uploads/`, consider moving uploads to external object storage (S3, DigitalOcean Spaces) and add `uploads/` to `.gitignore` before pushing.

## Deploying Frontend (Vercel)

1. Log in to Vercel and import the GitHub repository.
2. Build command: `npm run build` ; Output directory: `dist`.
3. Set environment variables if your frontend needs any (none required by default).
4. Deploy and verify the public URL.

## Deploying Backend (Render)

1. Create a new Web Service on Render and connect the GitHub repo.
2. Use the following settings:
	- Environment: Node
	- Build Command: `cd backend && npm install`
	- Start Command: `cd backend && npm run start`
3. Add the following environment variables in the Render dashboard (replace values):
	- MONGODB_URI
	- JWT_SECRET
	- SMTP_HOST (e.g. smtp.gmail.com)
	- SMTP_PORT (e.g. 587)
	- SMTP_USER
	- SMTP_PASS
	- OPTIONAL: CLOUDINARY_URL or other storage creds if you move uploads to cloud storage

4. Deploy and monitor the logs for successful startup.

## Post-deploy checklist

- Verify `POST /api/staff/:id/send-password-setup` works in production (it will send an email/SMS based on your SMTP settings).
- Verify attachments are accessible; if attachments require authentication, ensure the frontend fetch includes the Bearer token or use signed URLs.

