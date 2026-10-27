(() => {
  const grid = document.getElementById('instagramGallery');
  const status = document.getElementById('instagramStatus');
  if (!grid) return;
  fetch('../instagram-feed.php', {credentials:'omit'})
    .then(r => {if (!r.ok) throw Error('Feed unavailable'); return r.json()})
    .then(data => {
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) { status.textContent='Photos will appear here once the Instagram feed is connected.'; return; }
      status.hidden=true;
      const fragment=document.createDocumentFragment();
      items.forEach(item => {
        try {
          const link=new URL(item.url), img=new URL(item.image);
          if(link.hostname!=='www.instagram.com' || img.protocol!=='https:') return;
          const a=document.createElement('a');a.className='ig-photo';a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','View Instagram post');
          const image=document.createElement('img');image.src=img.href;image.alt=item.caption ? item.caption.slice(0,110) : 'Youth Connect Foundation Instagram photo';image.loading='lazy';image.decoding='async';
          const icon=document.createElement('span');icon.className='ig-overlay';icon.innerHTML='<i class="fa-brands fa-instagram" aria-hidden="true"></i><span>View on Instagram</span>';
          a.append(image,icon);fragment.appendChild(a);
        } catch (_) {}
      });
      grid.replaceChildren(fragment);
      if(!grid.children.length){status.hidden=false;status.textContent='Instagram photos are currently unavailable.'}
    }).catch(() => {status.textContent='Instagram photos are temporarily unavailable. Visit our Instagram profile to see the latest posts.'});
})();