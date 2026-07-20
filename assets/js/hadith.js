// ============ Hadith browser ============
// Source (public, no API key required): https://github.com/fawazahmed0/hadith-api
// via jsDelivr CDN: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/
(() => {
  const BOOKS = [
    { key:'bukhari',  label:'Sahih al-Bukhari', en:'eng-bukhari',  ar:'ara-bukhari',  max:7563 },
    { key:'muslim',   label:'Sahih Muslim',      en:'eng-muslim',   ar:'ara-muslim',   max:7470 },
    { key:'abudawud', label:'Sunan Abu Dawud',   en:'eng-abudawud', ar:'ara-abudawud', max:5274 },
    { key:'tirmidhi', label:'Jami at-Tirmidhi',  en:'eng-tirmidhi', ar:'ara-tirmidhi', max:3956 },
    { key:'nasai',    label:"Sunan an-Nasa'i",   en:'eng-nasai',    ar:'ara-nasai',    max:5761 },
    { key:'ibnmajah', label:'Sunan Ibn Majah',   en:'eng-ibnmajah', ar:'ara-ibnmajah', max:4341 },
  ];

  const bookList   = document.getElementById('bookList');
  const numInput   = document.getElementById('hadithNum');
  const goBtn      = document.getElementById('hadithGoBtn');
  const prevBtn    = document.getElementById('hadithPrevBtn');
  const nextBtn    = document.getElementById('hadithNextBtn');
  const resultHost = document.getElementById('hadithResult');
  const bookHeadEl = document.getElementById('activeBookLabel');

  let activeBook = BOOKS[0];
  let activeNum = 1;

  function esc(str){
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderBookList(){
    bookList.innerHTML = '';
    BOOKS.forEach(b => {
      const el = document.createElement('div');
      el.className = 'side-list-item' + (b.key === activeBook.key ? ' active' : '');
      el.innerHTML = `
        <div class="side-num" style="border-radius:50%;">${b.label.charAt(0)}</div>
        <div class="meta"><div>${esc(b.label)}</div><small>${b.max.toLocaleString()} hadith</small></div>`;
      el.addEventListener('click', () => { activeBook = b; activeNum = (b.key === 'muslim') ? 93 : 1; numInput.value = activeNum; renderBookList(); loadHadith(); });
      bookList.appendChild(el);
    });
  }

  async function loadHadith(){
    bookHeadEl.textContent = `${activeBook.label} — Hadith #${activeNum}`;
    resultHost.innerHTML = '<div class="state-msg">Loading hadith…</div>';
    try{
      const [enRes, arRes] = await Promise.all([
        fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${activeBook.en}/${activeNum}.json`),
        fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${activeBook.ar}/${activeNum}.json`)
      ]);
      if(!enRes.ok) throw new Error('not found');
      const enJson = await enRes.json();
      const arJson = arRes.ok ? await arRes.json() : null;
      const en = enJson.hadiths && enJson.hadiths[0];
      const ar = arJson && arJson.hadiths && arJson.hadiths[0];
      if(!en){ throw new Error('empty'); }

      // Some collections (e.g. Sahih Muslim #1-92, its untranslated
      // "Introduction"/isnad section) return a real record with an empty
      // text field. Show a clear message instead of a blank card, and use
      // the section metadata the API already gives us to jump past it.
      if(!en.text || !en.text.trim()){
        const bookIdx = en.reference && en.reference.book;
        const detail = enJson.metadata && enJson.metadata.section_detail && enJson.metadata.section_detail[bookIdx];
        const sectionName = enJson.metadata && enJson.metadata.section && enJson.metadata.section[bookIdx];
        const skipTo = detail ? detail.hadithnumber_last + 1 : activeNum + 1;
        resultHost.innerHTML = `
          <div class="state-msg">
            Hadith #${activeNum}${sectionName ? ` is part of the "${esc(sectionName)}"` : ''} section, which doesn't have translated hadith text in this collection (only chain-of-narration/heading entries).
            <div style="margin-top:16px;"><button type="button" class="btn btn-line-dark btn-block" id="hadithSkipBtn">Jump to Hadith #${skipTo} →</button></div>
          </div>`;
        const skipBtn = document.getElementById('hadithSkipBtn');
        if(skipBtn){
          skipBtn.addEventListener('click', () => { activeNum = skipTo; numInput.value = skipTo; loadHadith(); });
        }
        return;
      }

      resultHost.innerHTML = `
        <div class="dua-card" style="margin-bottom:0;">
          <span class="dua-tag">${esc(activeBook.label)} · #${en.hadithnumber}</span>
          ${ar ? `<div class="dua-arabic">${esc(ar.text)}</div>` : ''}
          <div class="ayah-trans" style="font-size:1rem;">${esc(en.text)}</div>
          ${en.grades && en.grades.length ? `<p class="dua-ref">Grading: ${en.grades.map(g => esc(g.name + ' — ' + g.grade)).join(' · ')}</p>` : ''}
        </div>`;
    }catch(err){
      resultHost.innerHTML = `<div class="state-msg error">Hadith #${activeNum} could not be found in ${esc(activeBook.label)}, or the connection failed. Try a different number.</div>`;
    }
  }

  goBtn.addEventListener('click', () => {
    const v = parseInt(numInput.value, 10);
    if(v >= 1){ activeNum = v; loadHadith(); }
  });
  numInput.addEventListener('keydown', e => { if(e.key === 'Enter') goBtn.click(); });
  prevBtn.addEventListener('click', () => { if(activeNum > 1){ activeNum--; numInput.value = activeNum; loadHadith(); } });
  nextBtn.addEventListener('click', () => { activeNum++; numInput.value = activeNum; loadHadith(); });

  renderBookList();
  loadHadith();
})();
