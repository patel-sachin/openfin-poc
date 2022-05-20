# PREREQUISITES:
This repository uses Lerna and Yarn Workspaces. So **Yarn** is **REQUIRED**
<br><br>

---

# HOW DO I RUN THIS?

Everything must be run from the root - assuming you have downloaded the source code in `c:\somefolder\openfin-poc`.
    - The root is `c:\somefolder\openfin-poc`
    - this is the folder where you will run the scripts below to run the various things
```
C:\someFolder\openfin-poc
├── README.md
├── lerna.json
├── node_modules
├── package.json
├── packages
├── poc-meeting-notes
└── yarn.lock
```

# SCRIPTS
    IMPORTANT: Run these in the order listed below

## STEP-1:
- Install all dependencies
- use `yarn install`

## STEP-2:
- Run `of-poc-app`
- use `yarn start:poc_app`
- this will start a react app on `localhost:3000`
  - it has the following entries (webpack multi-entries):
    - `localhost:3000/cpu-hogger.html`
    - `localhost:3000/pubsub-publisher.html`
    - `localhost:3000/pubsub-receiver.html`
    - `localhost:3000/chart-loader.html`
    - `localhost:3000/chart-renderer.html`

## STEP-3:
- build `of-workspace-starter-client`
- use `yarn build:of-ws`
  - this will build openfin workspace starter which uses OpenFin Workspace SDK

## STEP-4:
- we need to serve `of-workspace-starter-client`
- use `yarn serve:of-ws`
  - this will serve the workspace client on `localhost:3100`

## STEP-5:
- launch Openfin with the manifest served from `localhost:3100`
- use `yarn launch:of-ws`