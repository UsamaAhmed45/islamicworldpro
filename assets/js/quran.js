// ============ Qur'an reader ============
// Data sources (public, no API key required):
//   Surah list + Arabic + translations : https://api.alquran.cloud/v1
//   Tafseer (Arabic)                   : https://api.quran-tafseer.com
//   Recitation audio (Mishary Alafasy) : https://cdn.islamic.network/quran/audio*
(() => {
  const sideList   = document.getElementById('surahList');
  const searchBox  = document.getElementById('surahSearch');
  const mainHead   = document.getElementById('readerTitle');
  const mainSub    = document.getElementById('readerSub');
  const ayahHost   = document.getElementById('ayahHost');
  const langBtns   = document.querySelectorAll('.lang-toggle button');
  const playSurahBtn   = document.getElementById('playSurahBtn');
  const playSurahIcon  = document.getElementById('playSurahIcon');
  const playSurahLabel = document.getElementById('playSurahLabel');

  let SURAHS = [];
  let currentLang = 'en'; // 'en' | 'ur'
  let currentSurahNum = 1;
  let tafseerId = null;
  let cache = {}; // surahNum -> {ar, en, ur, tafsirs:{ayahNum:text}}

  function esc(str){
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // ---------- Audio (recitation by Mishary Alafasy) ----------
  const player = new Audio();
  player.preload = 'none';
  const ICON_PLAY  = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
  let audioMode = null;          // 'ayah' | 'surah' | null
  let currentAyahNumber = null;  // global ayah number (1-6236) currently playing
  let currentSurahPlaying = null;

  function setSurahButtonState(playing){
    if(!playSurahBtn) return;
    playSurahIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    playSurahLabel.textContent = playing ? 'Pause' : 'Play Surah';
    playSurahBtn.classList.toggle('active', playing);
  }

  function syncAyahButtons(){
    ayahHost.querySelectorAll('.ayah-play-btn').forEach(btn => {
      const isPlaying = audioMode === 'ayah' && Number(btn.dataset.number) === currentAyahNumber;
      btn.classList.toggle('playing', isPlaying);
      const block = btn.closest('.ayah-block');
      if(block) block.classList.toggle('playing', isPlaying);
      btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">${isPlaying ? ICON_PAUSE : ICON_PLAY}</svg>`;
    });
  }

  function stopAudio(){
    player.pause();
    audioMode = null;
    currentAyahNumber = null;
    currentSurahPlaying = null;
    setSurahButtonState(false);
    syncAyahButtons();
  }

  function playAyahAudio(globalNumber){
    audioMode = 'ayah';
    currentAyahNumber = globalNumber;
    currentSurahPlaying = null;
    setSurahButtonState(false);
    syncAyahButtons();
    player.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`;
    player.play().catch(() => stopAudio());
  }

  function toggleAyahAudio(btn){
    const num = Number(btn.dataset.number);
    if(audioMode === 'ayah' && currentAyahNumber === num && !player.paused){
      stopAudio();
      return;
    }
    playAyahAudio(num);
  }

  playSurahBtn && playSurahBtn.addEventListener('click', () => {
    if(audioMode === 'surah' && currentSurahPlaying === currentSurahNum && !player.paused){
      stopAudio();
      return;
    }
    audioMode = 'surah';
    currentSurahPlaying = currentSurahNum;
    currentAyahNumber = null;
    syncAyahButtons();
    setSurahButtonState(true);
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${currentSurahNum}.mp3`;
    player.play().catch(() => stopAudio());
  });

  player.addEventListener('ended', stopAudio);

  async function loadSurahList(){
    sideList.innerHTML = '<div class="state-msg">Loading surah list…</div>';
    try{
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const json = await res.json();
      SURAHS = json.data;
      renderSideList(SURAHS);
      loadSurah(1);
    }catch(err){
      sideList.innerHTML = '<div class="state-msg error">Could not load the surah list. Please check your internet connection and reload the page.</div>';
    }
  }

  function renderSideList(list){
    sideList.innerHTML = '';
    list.forEach(s => {
      const el = document.createElement('div');
      el.className = 'side-list-item' + (s.number === currentSurahNum ? ' active' : '');
      el.dataset.num = s.number;
      el.innerHTML = `
        <div class="side-num">${s.number}</div>
        <div class="meta">
          <div>${esc(s.englishName)} <span style="opacity:.6;font-size:.78rem;">— ${esc(s.name)}</span></div>
          <small>${esc(s.englishNameTranslation)} · ${s.numberOfAyahs} verses</small>
        </div>`;
      el.addEventListener('click', () => loadSurah(s.number));
      sideList.appendChild(el);
    });
  }

  searchBox && searchBox.addEventListener('input', () => {
    const q = searchBox.value.trim().toLowerCase();
    if(!q){ renderSideList(SURAHS); return; }
    renderSideList(SURAHS.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number) === q
    ));
  });

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      renderAyahs();
    });
  });

  async function ensureTafseerId(){
    if(tafseerId) return tafseerId;
    try{
      const res = await fetch('https://api.quran-tafseer.com/tafseer/');
      const list = await res.json();
      const arabic = list.find(t => t.language === 'ar') || list[0];
      tafseerId = arabic ? arabic.id : 1;
    }catch(e){
      tafseerId = 1; // sensible fallback
    }
    return tafseerId;
  }

  async function loadSurah(num){
    stopAudio();
    currentSurahNum = num;
    document.querySelectorAll('.side-list-item').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.num) === num);
    });

    const meta = SURAHS.find(s => s.number === num);
    mainHead.textContent = meta ? `${meta.number}. ${meta.englishName}` : 'Loading…';
    mainSub.textContent = meta ? `${meta.name} · ${meta.englishNameTranslation} · ${meta.numberOfAyahs} verses` : '';
    ayahHost.innerHTML = '<div class="state-msg">Loading verses…</div>';

    if(cache[num]){ renderAyahs(); return; }

    try{
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih,ur.jalandhry`);
      const json = await res.json();
      const [ar, en, ur] = json.data;
      cache[num] = { ar: ar.ayahs, en: en.ayahs, ur: ur.ayahs, tafsirs: {} };
      renderAyahs();
    }catch(err){
      ayahHost.innerHTML = '<div class="state-msg error">This surah could not be loaded right now. Please check your internet connection and try again.</div>';
    }
  }

  function renderAyahs(){
    const data = cache[currentSurahNum];
    if(!data) return;
    ayahHost.innerHTML = '';
    data.ar.forEach((a, i) => {
      const trans = currentLang === 'ur' ? data.ur[i].text : data.en[i].text;
      const block = document.createElement('div');
      block.className = 'ayah-block';
      block.innerHTML = `
        <div class="ayah-arabic">${esc(a.text)} <span class="ayah-num-badge">${a.numberInSurah}</span></div>
        <div class="ayah-trans" ${currentLang==='ur' ? 'dir="rtl" style="text-align:right;font-family:var(--font-arabic);font-size:1.05rem;"' : ''}>${esc(trans)}</div>
        <div class="ayah-actions">
          <button class="ayah-play-btn" type="button" data-number="${a.number}" title="Play this verse" aria-label="Play verse ${a.numberInSurah}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button class="tafsir-toggle" data-ayah="${a.numberInSurah}">Show Tafseer</button>
        </div>
        <div class="tafsir-box" data-ayah-box="${a.numberInSurah}"></div>
      `;
      ayahHost.appendChild(block);
    });

    ayahHost.querySelectorAll('.tafsir-toggle').forEach(btn => {
      btn.addEventListener('click', () => toggleTafsir(btn));
    });
    ayahHost.querySelectorAll('.ayah-play-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleAyahAudio(btn));
    });
    syncAyahButtons();
  }

  async function toggleTafsir(btn){
    const ayahNum = btn.dataset.ayah;
    const box = ayahHost.querySelector(`[data-ayah-box="${ayahNum}"]`);
    const isOpen = box.classList.contains('open');
    if(isOpen){
      box.classList.remove('open');
      btn.textContent = 'Show Tafseer';
      return;
    }
    box.classList.add('open');
    btn.textContent = 'Hide Tafseer';

    const data = cache[currentSurahNum];
    if(data.tafsirs[ayahNum]){
      box.innerHTML = data.tafsirs[ayahNum];
      return;
    }
    box.innerHTML = '<span class="small-muted">Loading tafseer…</span>';
    try{
      const id = await ensureTafseerId();
      const res = await fetch(`https://api.quran-tafseer.com/tafseer/${id}/${currentSurahNum}/${ayahNum}`);
      const json = await res.json();
      const text = json.text ? `<div dir="rtl" style="text-align:right;font-family:var(--font-arabic);font-size:1.15rem;line-height:2;">${esc(json.text)}</div>` : 'Tafseer not available for this verse.';
      data.tafsirs[ayahNum] = text;
      box.innerHTML = text;
    }catch(err){
      box.innerHTML = '<span class="small-muted">Tafseer could not be loaded right now.</span>';
    }
  }

  // deep link ?surah=NN
  const params = new URLSearchParams(location.search);
  const initial = parseInt(params.get('surah'), 10);
  loadSurahList().then(() => {
    if(initial >= 1 && initial <= 114) loadSurah(initial);
  });
})();
