// Latest News: renders announcements.md (posts split on '## ' headings).
// Requires marked (loaded before this script) and an element #newsRoot.
// ---------- announcements ----------
(function(){
  const ON_SITE=/hustlebaseballgilroy\.org$/.test(location.hostname);
  const BASE=ON_SITE?location.origin+'/':'https://hustlebaseballgilroy.org/';
  const OLDER_SHOWN=3;
  const root=document.getElementById('newsRoot');

  // Split the markdown into posts on "## " headings; pull the "Posted on" line out as a date.
  function parse(md){
    return md.split(/^## /m).slice(1).map(chunk=>{
      const nl=chunk.indexOf('\n');
      const title=chunk.slice(0,nl).trim();
      let body=chunk.slice(nl+1).replace(/^-{3,}\s*$/gm,'');
      let date='';
      body=body.replace(/^#{3,6}\s*\*?Posted on ([^*\n]+)\*?\s*$/m,(_,d)=>{date=d.trim();return ''});
      return {title,date,body:body.trim()};
    }).filter(p=>p.title);
  }
  function html(md){
    const el=document.createElement('div');el.className='n-body';el.innerHTML=marked.parse(md);
    el.querySelectorAll('a[href],img[src]').forEach(n=>{
      const attr=n.tagName==='A'?'href':'src',v=n.getAttribute(attr);
      if(!/^(https?:|mailto:|tel:|#|data:)/i.test(v)) n.setAttribute(attr,new URL(v.replace(/^\//,''),BASE).href);
      if(n.tagName==='A'&&/^https?:/.test(n.href)&&!n.href.startsWith(BASE)){n.target='_blank';n.rel='noopener'}
    });
    return el;
  }
  const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const firstPara=md=>{const p=md.split(/\n\s*\n/).find(b=>b.trim()&&!/^\s*[<*-]/.test(b))||'';return p.replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g,(m,t)=>t||'').trim()};

  function render(posts){
    if(!posts.length){root.innerHTML='<p class="news-err">No announcements right now.</p>';return}
    root.innerHTML='';
    const [top,...rest]=posts;
    const body=html(top.body),img=body.querySelector('img');
    const feat=document.createElement('article');
    feat.className='news-feature cham'+(img?'':' noart');
    feat.innerHTML=`<div class="inner cham"><div class="txt"><div class="n-meta"><span class="n-new">Latest</span>${top.date?`<span class="n-date">Posted ${esc(top.date)}</span>`:''}</div><h3>${esc(top.title)}</h3></div><div class="art"></div></div>`;
    feat.querySelector('.txt').appendChild(body);
    if(img){const a=feat.querySelector('.art'),i=new Image();a.style.setProperty('--bg',`url("${img.src}")`);i.src=img.src;i.alt=img.alt||'';i.loading='lazy';a.appendChild(i)}
    root.appendChild(feat);
    if(!rest.length)return;
    const grid=document.createElement('div');grid.className='news-older';
    rest.forEach((p,k)=>{
      const d=document.createElement('details');d.className='n-card cham';if(k>=OLDER_SHOWN)d.hidden=true;
      d.innerHTML=`<summary>${p.date?`<div class="n-meta"><span class="n-date">${esc(p.date)}</span></div>`:''}<h4>${esc(p.title)}</h4><p class="ex">${esc(firstPara(p.body))}</p><span class="more">Read more</span></summary>`;
      d.appendChild(html(p.body));
      grid.appendChild(d);
    });
    root.appendChild(grid);
    if(rest.length>OLDER_SHOWN){
      const w=document.createElement('div');w.className='news-more';
      w.innerHTML=`<button class="btn btn-ghost btn-sm">Show all ${posts.length} announcements</button>`;
      w.firstChild.onclick=()=>{grid.querySelectorAll('[hidden]').forEach(n=>n.hidden=false);w.remove()};
      root.appendChild(w);
    }
  }
  if(typeof marked==='undefined'){root.innerHTML='<p class="news-err">Unable to load announcements.</p>';return}
  fetch('/announcements.md',{cache:'no-cache'}).then(r=>{if(!r.ok)throw 0;return r.text()})
    .then(md=>render(parse(md)))
    .catch(()=>{root.innerHTML='<p class="news-err">Unable to load announcements.</p>'});
})();
