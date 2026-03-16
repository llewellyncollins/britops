# Firestore TTL Policy Setup — Data Retention

**Purpose:** Automatically hard-delete soft-deleted operations after 30 days, enforced server-side by Firestore.

---

## Background

When a user deletes an operation, the app sets `deleted: true` and `deletedAt` to the current ISO timestamp. The document remains in Firestore for sync purposes (so other devices see the deletion). After 30 days, Firestore's TTL (Time-to-Live) policy automatically purges the document permanently.

This is more reliable than client-side purging because it runs server-side regardless of whether the user opens the app.

---

## Setup Instructions

### Using Google Cloud Console

1. Go to the [Firebase Console](https://console.firebase.google.com/) > your project > Firestore Database
2. Navigate to **Indexes** > **Time-to-live (TTL)**
3. Click **Create policy**
4. Configure:
   - **Collection group:** `operations`
   - **Timestamp field:** `deletedAt`
5. Click **Create**

### Using gcloud CLI

```bash
gcloud firestore fields ttls update deletedAt \
  --collection-group=operations \
  --enable-ttl \
  --project=britops-1f219
```

For staging:
```bash
gcloud firestore fields ttls update deletedAt \
  --collection-group=operations \
  --enable-ttl \
  --project=britops-staging
```

### Verify TTL is active

```bash
gcloud firestore fields ttls list \
  --project=britops-1f219
```

---

## How It Works

1. User soft-deletes an operation in the app
2. The app sets `deleted: true` and `deletedAt: "2026-03-16T12:00:00.000Z"` on the document
3. The document is synced to Firestore with the `deletedAt` timestamp
4. Firestore's TTL policy monitors the `deletedAt` field
5. ~30 days after `deletedAt`, Firestore automatically deletes the document
6. The deletion propagates to other devices via real-time sync (the document disappears from snapshots)

**Note:** Firestore TTL deletions may be delayed up to 72 hours beyond the expiration time. This is expected behaviour per Google's documentation.

---

## Important Notes

- TTL only applies to documents where `deletedAt` is a non-null timestamp
- Active (non-deleted) operations have `deletedAt: null` and are unaffected
- Account deletion (`purgeAllUserData`) immediately hard-deletes all documents — it does not wait for TTL
- The TTL policy must be configured in **both** staging and production projects
- Local IndexedDB data is not affected by the TTL policy — it persists until the user clears browser data or deletes their account
