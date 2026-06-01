# MassTrack Wireframe

This scaffold now supports live FatSecret-backed food search through a lightweight local Node server.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET`.
3. Keep `HOST=0.0.0.0` if you want to open the app from other devices on your Wi-Fi.
4. Run `npm start`.
5. Open [http://localhost:4173](http://localhost:4173).

## Quick Launch

- Double-click `start-localhost.ps1` to start the local server if needed and open the app in your browser at `http://localhost:4173`.
- The script also prints an `iPhone URL` such as `http://192.168.1.74:4173` that you can open on your phone while both devices are on the same Wi-Fi.
- If Windows asks about script execution, right-click PowerShell and run:
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## iPhone Testing

1. Make sure your PC and iPhone are on the same Wi-Fi network.
2. Start the app with `npm start` or double-click `start-localhost.ps1`.
3. On your iPhone, open Safari and go to the `iPhone URL` printed by the script or server logs.
4. If Windows shows a firewall prompt for Node.js, allow access on `Private networks`, otherwise your phone may not be able to connect.

## Notes

- The browser never sees your FatSecret secret. OAuth 2.0 happens in `server.js`.
- The diary UI will fall back to local sample foods if credentials are missing or FatSecret is unavailable and `FATSECRET_USE_SAMPLE_FALLBACK=true`.
- The diary page includes FatSecret attribution to match the platform requirements.
