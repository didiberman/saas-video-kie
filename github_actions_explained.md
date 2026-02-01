# GitHub Actions Workflow Explained

This document breaks down your [deploy.yml](file:///Users/yadid/Documents/GitHub/saas-video-kie/.github/workflows/deploy.yml) file line-by-line.

## 1. Triggers & Environment
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main
      - master
```
- **name**: The label you see in the GitHub Actions tab.
- **on.push**: This pipeline runs automatically whenever code is pushed.
- **branches**: It only listens for pushes to `main` or `master`. Feature branches won't trigger this production deployment.

```yaml
env:
  PROJECT_ID: gen-lang-client-0104807788
  REGION: us-central1
  SERVICE_NAME: video-saas-frontend
  WORKLOAD_IDENTITY_PROVIDER: projects/922541531212/...
  SERVICE_ACCOUNT: github-actions-sa@...
```
- **env**: Global variables available to all jobs.
- **PROJECT_ID/REGION**: Target Google Cloud project and region.
- **WORKLOAD_IDENTITY_PROVIDER**: The "address" of the OIDC trust relationship in GCP. This is what allows GitHub to say "I am this repo" without a password.
- **SERVICE_ACCOUNT**: The specific Google Service Account email that GitHub Actions will "impersonate" to perform deployments.

## 2. Job: Check Paths (Smart Filtering)
```yaml
jobs:
  check-paths:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      start_generation: ${{ steps.changes.outputs.start_generation }}
      # ... other outputs mapping
```
- **check-paths**: This is the first job. It's fast and cheap.
- **outputs**: We explicitly "export" the results of this job so the *next* jobs can read them (e.g., did `frontend` change? Yes/No).

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check path filters
        uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            frontend:
              - 'app/**'
              - 'components/**'
              # ... other frontend files
            start_generation:
              - 'functions/start-generation/**'
```
- **dorny/paths-filter**: This assumes the role of a traffic cop.
- It looks at the **diff** between the new commit and the previous one.
- If files in `app/**` changed, it sets `frontend` to `true`.
- If files in `functions/start-generation/**` changed, it sets `start_generation` to `true`.
- **Result**: We know exactly *what* needs updating before we start heavy lifting.

## 3. Job: Quality Check (Safety First)
```yaml
  quality_check:
    name: "Lint & Type Check"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
      
      - name: Install Dependencies
        run: npm ci

      - name: Type Check
        run: npm run type-check

      - name: Lint
        run: npm run lint
```
- **npm ci**: A faster, cleaner install than `npm install` (meant for CI servers).
- **npm run type-check**: Runs TypeScript compiler (`tsc`). Fails if there are type errors.
- **npm run lint**: Runs ESLint. Fails if there are syntax errors (like the unclosed tag we fixed).
- **Goal**: Stop bad code *here* (fast) before building Docker images (slow).

## 4. Job: Frontend & Function Deployment (The Heavy Lifting)
```yaml
  deploy-frontend:
    needs: [check-paths, quality_check]
    runs-on: ubuntu-latest
    permissions:
      contents: "read"
      id-token: "write"
```
- **needs**: This is crucial. It says "Do not start unless `check-paths` AND `quality_check` finished successfully".
- **permissions**: 
    - `id-token: write`: Required for OIDC authentication. It allows GitHub to request an OpenID Connect token.

```yaml
    steps:
      - name: Google Auth
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}
```
- **google-github-actions/auth**: The magic key.
- It exchanges the GitHub OIDC token for a Google Cloud Access Token.
- **Zero secrets**: We didn't pass a JSON key file.

```yaml
      - name: Configure Docker
        if: needs.check-paths.outputs.frontend == 'true'
        run: gcloud auth configure-docker
```
- **if**: This conditional logic saves time. We ONLY proceed if `frontend` was marked as changed.

```yaml
      - name: Build and Push
        if: needs.check-paths.outputs.frontend == 'true'
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="..." \
            # ... other build args
            -t gcr.io/${{ env.PROJECT_ID }}/video-saas:${{ github.sha }} \
            -t gcr.io/${{ env.PROJECT_ID }}/video-saas:latest \
            .
          docker push ...
```
- **docker build**: create the container image.
- **--build-arg**: We bake the public Firebase keys into the image so the browser app (Next.js) can use them.
- **-t (tags)**: We tag it with the Commit SHA (for unique history) AND `latest` (for convenience).
- **docker push**: Upload the image to Google Container Registry.

```yaml
      - name: Deploy to Cloud Run
        if: needs.check-paths.outputs.frontend == 'true'
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}
          region: ${{ env.REGION }}
          image: gcr.io/${{ env.PROJECT_ID }}/video-saas:${{ github.sha }}
```
- **deploy-cloudrun**: Tells Cloud Run "Hey, grab that new image we just pushed and serve traffic with it."

### Cloud Function Steps
```yaml
      - name: Deploy start-generation
        if: needs.check-paths.outputs.start_generation == 'true'
        uses: google-github-actions/deploy-cloud-functions@v2
        with:
          name: start-generation
          runtime: nodejs22
          entry_point: startGeneration
          source_dir: functions/start-generation
```
- **if**: Checks specifically for changes in `functions/start-generation/`.
- **deploy-cloud-functions**: Zips up that folder, uploads it to GCP, and updates the existing Cloud Function.
- **runtime**: Ensures we are using Node.js 22.

---
**Summary**: This workflow is a "Smart Monorepo" pipeline. It knows *what* you changed and only verifies and deploys *that specific part*, saving time and reducing errors.
