const CACHE_NAME =
  "gamja-office-v3";

self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.map((key) =>
              caches.delete(key)
            )
          )
        )
    );

    self.clients.claim();
  }
);

self.addEventListener(
  "fetch",
  () => {
    // 현재는 네트워크 요청을
    // Service Worker가 가로채지 않는다.
  }
);