document.addEventListener('DOMContentLoaded', () => {

  /* --- 1. Client-Side Routing (Hash-based for back/forward support) --- */
  const navLinks = document.querySelectorAll('.primary-nav a[data-target]');
  const views = document.querySelectorAll('.view-section');
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');

  function switchView(targetId) {
    if (!targetId) return;

    // Hide all views & remove active states
    views.forEach(view => view.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected view
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');
    
    // Highlight matching link (including sub-nav)
    const activeLink = document.querySelector(`.primary-nav a[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Close mobile menu if open
    sidebar.classList.remove('mobile-open');
  }

  // Handle true browser navigation via URL hash
  function handleHashChange() {
    const hash = window.location.hash || '#dashboard';
    const activeLink = document.querySelector(`.primary-nav a[href="${hash}"]`);
    
    if (activeLink) {
      const targetId = activeLink.getAttribute('data-target');
      switchView(targetId);
    }
  }

  window.addEventListener('hashchange', handleHashChange);
  // Trigger on initial load
  handleHashChange();


  /* --- 2. Mobile Menu Toggle --- */
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  /* --- 3. Quick Add Modal & Save Logic --- */
  const quickAddBtn = document.getElementById('quick-add-btn');
  const modal = document.getElementById('quick-add-modal');
  const cancelBtn = document.getElementById('qa-cancel');
  const saveBtn = document.getElementById('qa-save');
  const qaType = document.getElementById('qa-type');
  const qaContent = document.getElementById('qa-content');
  const qaConfirmation = document.getElementById('qa-confirmation');

  quickAddBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    qaContent.value = ''; 
    qaConfirmation.classList.add('hidden'); // hide confirmation on reopen
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  saveBtn.addEventListener('click', () => {
    const contentText = qaContent.value.trim();
    if (!contentText) return; // Prevent empty saves

    const newItem = {
      id: 'qa_' + Date.now().toString(),
      type: qaType.value,
      content: contentText,
      timestamp: Date.now(),
      ownerId: AppStorage.defaultUserId
    };

    // Retrieve existing array, push, and save
    const quickAddItems = AppStorage.get('quick_add_items', []);
    quickAddItems.push(newItem);
    AppStorage.set('quick_add_items', quickAddItems);

    // Show Confirmation UI temporarily
    qaConfirmation.classList.remove('hidden');
    saveBtn.disabled = true;

    setTimeout(() => {
      modal.classList.add('hidden');
      qaConfirmation.classList.add('hidden');
      saveBtn.disabled = false;
      qaContent.value = '';
    }, 1500);
  });


  /* --- 4. Persistent Data: Quick Notes --- */
  const quickNoteInput = document.getElementById('quick-note-input');
  const savedNote = AppStorage.get('quick_note', '');
  if (quickNoteInput) {
    quickNoteInput.value = savedNote;
    quickNoteInput.addEventListener('input', (e) => {
      AppStorage.set('quick_note', e.target.value);
    });
  }


  /* --- 5. Persistent Data: Brain Dump --- */
  const bdInput = document.getElementById('bd-input');
  const bdSubmit = document.getElementById('bd-submit');
  const bdList = document.getElementById('bd-list');

  function renderBrainDumps() {
    if (!bdList) return;
    const dumps = AppStorage.get('brain_dumps', []);
    bdList.innerHTML = '';
    
    if (dumps.length === 0) {
      bdList.innerHTML = '<p class="empty-state">No ideas saved yet.</p>';
      return;
    }

    dumps.slice().reverse().forEach(dump => {
      const div = document.createElement('div');
      div.className = 'dump-item';
      
      const timeSpan = document.createElement('div');
      timeSpan.className = 'dump-time';
      timeSpan.textContent = new Date(dump.timestamp).toLocaleString();
      
      const textNode = document.createTextNode(dump.text);
      
      div.appendChild(timeSpan);
      div.appendChild(textNode);
      bdList.appendChild(div);
    });
  }

  if (bdSubmit && bdInput) {
    bdSubmit.addEventListener('click', () => {
      const text = bdInput.value.trim();
      if (!text) return;

      const dumps = AppStorage.get('brain_dumps', []);
      dumps.push({ text: text, timestamp: Date.now() });
      
      AppStorage.set('brain_dumps', dumps);
      bdInput.value = ''; 
      renderBrainDumps();
    });

    renderBrainDumps();
  }
});
