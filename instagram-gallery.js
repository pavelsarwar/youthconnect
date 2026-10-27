(() => {
  const grid = document.getElementById('instagramGallery');
  const status = document.getElementById('instagramStatus');
  if (!grid) return;
  const BATCH_SIZE = 8;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ig-load-more';
  button.textContent = 'See More Photos';
  button.hidden = true;
  grid.insertAdjacentElement('afterend', button);

  let items = [];
  let shown = 0;

  const renderNext = () => {
    const fragment = document.createDocumentFragment();
    const next = items.slice(shown, shown + BATCH_SIZE);
    next.forEach(item => {
      const a = document.createElement('a');
      a.className = 'ig-photo';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'View Instagram post');
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.caption ? item.caption.slice(0, 110) : 'Youth Connect Foundation Instagram photo';
      image.loading = 'lazy';
      image.decoding = 'async';
      const overlay = document.createElement('span');
      overlay.className = 'ig-overlay';
      overlay.innerHTML = '<i class="fa-brands fa-instagram" aria-hidden="true"></i><span>View on Instagram</span>';
      a.append(image, overlay);
      fragment.appendChild(a);
    });
    grid.appendChild(fragment);
    shown += next.length;
    button.hidden = shown >= items.length;
  };

  button.addEventListener('click', renderNext);

  fetch('../instagram-feed.php', {credentials:'omit'})
    .then(r => { if (!r.ok) throw Error('Feed unavailable'); return r.json(); })
    .then(data => {
      const source = Array.isArray(data.items) ? data.items : [];
      items = source.filter(item => {
        try {
          const link = new URL(item.url);
          const img = new URL(item.image);
          return link.hostname === 'www.instagram.com' && img.protocol === 'https:';
        } catch (_) { return false; }
      });
      if (!items.length) {
        status.textContent = 'Photos will appear here once the Instagram feed is connected.';
        return;
      }
      status.remove();
      renderNext();
    })
    .catch(() => {
      status.textContent = 'Instagram photos are temporarily unavailable. Visit our Instagram profile to see the latest posts.';
    });
})();