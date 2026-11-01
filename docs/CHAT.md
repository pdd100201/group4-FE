# Chat feature

All signed-in roles use `/chat`. Public navigation and each workspace sidebar link to the same protected route.

## File responsibilities

- `src/features/chat/api/chatApi.ts`: typed directory, history, upload and authenticated download contracts; socket URL follows the configured API host.
- `src/shared/hooks/useChat.ts`: history pagination, socket authentication, reconnect/backoff, presence, cache isolation and acknowledgements.
- `src/features/chat/screens/ChatPage.tsx`: active peer, responsive panel visibility, send-in-progress guard and composition of the screen.
- `src/features/chat/components/ChatContacts.tsx`: contact search/pagination, avatar rail and directory list.
- `src/features/chat/components/ChatAvatar.tsx`: profile-image fallback and actual chat-presence indicator.
- `src/features/chat/components/ChatThread.tsx`: message history, date separators, bubbles and media placement.
- `src/features/chat/components/ChatComposer.tsx`: text/file drafts, preview, size/type checks, upload and send retry.
- `src/features/chat/components/ChatMedia.tsx`: authenticated media fetch, blob URL lifecycle and image/video rendering.
- `src/features/chat/screens/messenger.css`: Messenger-style layout and responsive rules.

## State and security notes

The logo toggles the conversation list without unmounting the thread/composer. Drafts and selected uploads therefore survive toggles. A different peer changes the composer key so that a private draft cannot accidentally move to another conversation. Contact switching is disabled while a send is in progress.

The socket sends the access token in the first AUTH frame, never a query parameter. Server authorization remains authoritative. ChatMedia uses the bearer-token API client, not public media URLs. Image/video blob URLs are revoked when the component unmounts. Message text uses React escaping, never raw HTML.

On a lost acknowledgement, the composer retains both the upload ID and client UUID. The server deduplicates retries for that sender/recipient/content. Green dots indicate an authenticated chat socket, not an invented last-seen time. New-message counts are local to the current page session.

The backend requires V013 and V014 chat migrations. See the backend `docs/CHAT.md` for API/security/storage details. Supported images are JPG/PNG/WebP/GIF (5 MiB), videos MP4/WebM (25 MiB).

## Verify

```sh
npm exec tsc -- --noEmit
npm run lint
npm run build
```

The existing ESLint config targets JS/JSX; TypeScript files are checked by tsc. Manually verify community/private selection, image/video upload, retry, logo hide/show and draft retention. Backend ChatIntegrationTests exercise real WebSocket frames and isolated H2 persistence.
