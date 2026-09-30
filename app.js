/* ==========================================================================
   מספרת אלמנט - Element Barbershop Interactive Controller
   Includes:
   - Real-time opening hours checker
   - Booking Modal with direct WhatsApp integration
   - Live In-Browser Text Editing (contenteditable + format bubble)
   - Universal Move Tool & Drag-and-Drop (Sections, Cards, Titles, Paragraphs, Anything!)
   - Micro Move Controls (▲ / ▼ / Drag / 🗑️) on all movable elements
   - Universal Eraser Tool (Click-to-Delete Anything)
   - Clear All (Wipe Canvas) option
   - Right-Click Universal Context Menu
   - Full Recycle Bin / Restoration System (Undo & Restore Modal)
   - LocalStorage persistence & Clean HTML Exporter
   ========================================================================== */

(function () {
  'use strict';

  // Storage keys
  const STORAGE_KEY = 'element_barbershop_texts_v4';
  const IMAGE_STORAGE_KEY = 'element_barbershop_images_v4';
  const DOM_ORDER_KEY = 'element_barbershop_dom_order_v4';
  const DYNAMIC_CARDS_KEY = 'element_barbershop_dynamic_cards_v4';
  const DELETED_ITEMS_KEY = 'element_barbershop_deleted_items_v4';

  // State
  let isEditMode = false;
  let isMoveMode = false;
  let isEraserMode = false;
  let hasUnsavedChanges = false;
  let activeImageTarget = null;
  let draggedElement = null;
  let draggedType = null; // 'section', 'card', 'movable'
  let activeSelectedElement = null;
  let contextMenuTarget = null;
  let deletedItems = [];

  // DOM Elements
  const editToolbar = document.getElementById('editToolbar');
  const editTopBanner = document.getElementById('editTopBanner');
  const toggleEditBtn = document.getElementById('toggleEditBtn');
  const toggleIcon = document.getElementById('toggleIcon');
  const toggleText = document.getElementById('toggleText');
  const saveEditsBtn = document.getElementById('saveEditsBtn');
  const bannerSaveBtn = document.getElementById('bannerSaveBtn');
  const bannerCloseBtn = document.getElementById('bannerCloseBtn');
  const exportHtmlBtn = document.getElementById('exportHtmlBtn');
  const resetEditsBtn = document.getElementById('resetEditsBtn');
  const collapseToolbarBtn = document.getElementById('collapseToolbarBtn');
  const collapseIcon = document.getElementById('collapseIcon');

  const toggleMoveBtn = document.getElementById('toggleMoveBtn');
  const moveBtnText = document.getElementById('moveBtnText');
  const bannerMoveBtn = document.getElementById('bannerMoveBtn');
  const bannerMoveText = document.getElementById('bannerMoveText');

  const toggleEraserBtn = document.getElementById('toggleEraserBtn');
  const bannerEraserBtn = document.getElementById('bannerEraserBtn');
  const bannerEraserText = document.getElementById('bannerEraserText');
  const eraserBtnText = document.getElementById('eraserBtnText');
  const eraserCursorBadge = document.getElementById('eraserCursorBadge');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const bannerClearAllBtn = document.getElementById('bannerClearAllBtn');

  const universalContextMenu = document.getElementById('universalContextMenu');
  const ctxDeleteBtn = document.getElementById('ctxDeleteBtn');
  const ctxMovePrevBtn = document.getElementById('ctxMovePrevBtn');
  const ctxMoveNextBtn = document.getElementById('ctxMoveNextBtn');

  const restoreDeletedBtn = document.getElementById('restoreDeletedBtn');
  const restoreBtnText = document.getElementById('restoreBtnText');
  const bannerRestoreBtn = document.getElementById('bannerRestoreBtn');
  const bannerRestoreText = document.getElementById('bannerRestoreText');
  const restoreModal = document.getElementById('restoreModal');
  const restoreList = document.getElementById('restoreList');
  const restoreEmptyState = document.getElementById('restoreEmptyState');

  const mainContent = document.getElementById('mainContent');
  const servicesGrid = document.getElementById('servicesGrid');
  const teamGrid = document.getElementById('teamGrid');
  const addServiceBtn = document.getElementById('addServiceBtn');
  const addTeamBtn = document.getElementById('addTeamBtn');
  const addHighlightBtn = document.getElementById('addHighlightBtn');
  const addHourRowBtn = document.getElementById('addHourRowBtn');

  const textFormatBubble = document.getElementById('textFormatBubble');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const globalImageUploader = document.getElementById('globalImageUploader');

  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');
  const bookingServiceSelect = document.getElementById('bookingService');
  const bookingBarberSelect = document.getElementById('bookingBarber');
  const bookingDateInput = document.getElementById('bookingDate');

  const openingStatusBadge = document.getElementById('openingStatusBadge');
  const openingStatusText = document.getElementById('openingStatusText');

  // Set minimum date to today
  if (bookingDateInput) {
    const today = new Date().toISOString().split('T')[0];
    bookingDateInput.min = today;
    bookingDateInput.value = today;
  }

  // Update footer year
  const currentYearEl = document.getElementById('currentYear');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  // ==========================================================================
  // 1. Opening Hours Real-Time Checker
  // ==========================================================================
  function updateOpeningStatus() {
    if (!openingStatusBadge || !openingStatusText) return;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTimeInMinutes = hour * 60 + minute;

    let isOpen = false;
    let statusMsg = '';

    if (day >= 0 && day <= 4) {
      const openMinutes = 8 * 60;
      const closeMinutes = 22 * 60;

      if (currentTimeInMinutes >= openMinutes && currentTimeInMinutes < closeMinutes) {
        isOpen = true;
        statusMsg = 'פתוח כעת (עד 22:00)';
      } else if (currentTimeInMinutes < openMinutes) {
        statusMsg = 'סגור כעת (נפתח היום ב-8:00)';
      } else {
        const nextDayText = (day === 4) ? 'מחר (שישי) ב-8:00' : 'מחר ב-8:00';
        statusMsg = `סגור כעת (נפתח ${nextDayText})`;
      }
    } else if (day === 5) {
      const openMinutes = 8 * 60;
      const closeMinutes = 13 * 60;

      if (currentTimeInMinutes >= openMinutes && currentTimeInMinutes < closeMinutes) {
        isOpen = true;
        statusMsg = 'פתוח כעת (עד 13:00)';
      } else if (currentTimeInMinutes < openMinutes) {
        statusMsg = 'סגור כעת (נפתח היום ב-8:00)';
      } else {
        statusMsg = 'סגור כעת (נפתח ביום ראשון ב-8:00)';
      }
    } else {
      statusMsg = 'סגור היום (נפתח ביום ראשון ב-8:00)';
    }

    openingStatusBadge.classList.remove('open', 'closed');
    if (isOpen) {
      openingStatusBadge.classList.add('open');
      openingStatusText.textContent = `🟢 ${statusMsg}`;
    } else {
      openingStatusBadge.classList.add('closed');
      openingStatusText.textContent = `⚪ ${statusMsg}`;
    }
  }

  // ==========================================================================
  // 2. Mobile Navigation Toggle
  // ==========================================================================
  if (mobileMenuToggle && mobileDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });

    document.querySelectorAll('.mobile-nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // Booking URL
  const BOKA_BOOKING_URL = 'https://app.boka.co.il/join/kRnQ12Otkly9xEIthPmL';
  const CALMARK_BOOKING_URL = BOKA_BOOKING_URL;

  // ==========================================================================
  // 3. Booking Operations (Direct to Boka)
  // ==========================================================================
  window.openBookingModal = function (preferredBarber = null, preferredService = null) {
    window.open(BOKA_BOOKING_URL, '_blank', 'noopener,noreferrer');
  };

  window.closeBookingModal = function () {
    if (bookingModal) {
      bookingModal.classList.remove('open');
      bookingModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeBookingModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookingModal();
      closeRestoreModal();
      hideFormatBubble();
      closeContextMenu();
      if (isEraserMode) setEraserMode(false);
      if (isMoveMode) setMoveMode(false);
    }
  });

  window.bookSpecificService = function (serviceName, price) {
    openBookingModal(null, serviceName);
  };

  window.handleBookingSubmit = function (e) {
    e.preventDefault();

    const service = bookingServiceSelect ? bookingServiceSelect.value : '';
    const barber = bookingBarberSelect ? bookingBarberSelect.value : '';
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const name = document.getElementById('bookingName').value;
    const phone = document.getElementById('bookingPhone').value;
    const notes = document.getElementById('bookingNotes').value;

    const message = 
`שלום מספרת אלמנט ✂️
אשמח לקבוע תור:
💈 שירות: ${service}
💇‍♂️ ספר: ${barber}
📅 תאריך: ${date}
⏰ שעה: ${time}
👤 שם מלא: ${name}
📞 טלפון: ${phone}
${notes ? `📝 הערות: ${notes}` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/972585681064?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    showToast('הפרטים נשלחו לוואטסאפ לתיאום סופי!');
    closeBookingModal();
    bookingForm.reset();
  };

  // ==========================================================================
  // 4. Live In-Browser Edit Mode Controller
  // ==========================================================================
  window.toggleEditModeFromButton = function () {
    setEditMode(!isEditMode);
  };

  function setEditMode(active) {
    isEditMode = active;
    document.body.classList.toggle('edit-mode-active', isEditMode);

    if (!isEditMode) {
      if (isEraserMode) setEraserMode(false);
      if (isMoveMode) setMoveMode(false);
    }

    if (toggleEditBtn) {
      toggleEditBtn.classList.toggle('active', isEditMode);
      if (toggleText) {
        toggleText.textContent = isEditMode ? 'עריכה פעילה' : 'עריכה';
      }
    }

    // Enable/Disable contenteditable
    const editableElements = document.querySelectorAll('[data-edit-key]');
    editableElements.forEach((el) => {
      el.contentEditable = isEditMode ? 'true' : 'false';
      if (isEditMode) {
        el.addEventListener('input', onContentChanged);
        el.addEventListener('focus', () => {
          activeSelectedElement = el;
        });
      }
    });

    setupUniversalMovableElements();
    setupDragAndDrop();
    setupDeleteButtons();
    updateRestoreButtonUI();

    if (isEditMode) {
      showToast('מצב עריכה והזזה פעיל! כעת תוכל לערוך טקסטים, לגרור אלמנטים ולמחוק');
    } else {
      hideFormatBubble();
      closeContextMenu();
      showToast('מצב עריכה כובה.');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function onContentChanged() {
    hasUnsavedChanges = true;
    enableSaveButtons();
  }

  function enableSaveButtons() {
    if (saveEditsBtn) saveEditsBtn.removeAttribute('disabled');
    if (bannerSaveBtn) bannerSaveBtn.classList.add('pulse');
  }

  if (toggleEditBtn) {
    toggleEditBtn.addEventListener('click', () => {
      setEditMode(!isEditMode);
    });
  }

  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener('click', () => {
      setEditMode(false);
    });
  }

  // Toolbar collapse / expand
  if (collapseToolbarBtn && editToolbar) {
    collapseToolbarBtn.addEventListener('click', () => {
      editToolbar.classList.toggle('collapsed');
      const isCollapsed = editToolbar.classList.contains('collapsed');
      collapseIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-up' : 'chevron-down');
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // ==========================================================================
  // 5. Universal Move Tool Controller (הזזת כל אלמנט באתר)
  // ==========================================================================
  function setMoveMode(active) {
    isMoveMode = active;
    document.body.classList.toggle('move-mode-active', isMoveMode);

    if (toggleMoveBtn) {
      toggleMoveBtn.classList.toggle('active', isMoveMode);
      if (moveBtnText) {
        moveBtnText.textContent = isMoveMode ? 'הזזה פעילה!' : 'כלי הזזה';
      }
    }

    if (bannerMoveBtn) {
      bannerMoveBtn.classList.toggle('active', isMoveMode);
      if (bannerMoveText) {
        bannerMoveText.textContent = isMoveMode ? 'הזזה פעילה!' : 'כלי הזזה';
      }
    }

    if (isMoveMode) {
      if (!isEditMode) setEditMode(true);
      if (isEraserMode) setEraserMode(false);
      showToast('✋ כלי הזזה חופשי פעיל! כעת תוכל לגרור כל אלמנט, או להשתמש בחיצים שמעליו.');
    } else {
      showToast('כלי הזזה כובה.');
    }
  }

  if (toggleMoveBtn) {
    toggleMoveBtn.addEventListener('click', () => {
      setMoveMode(!isMoveMode);
    });
  }

  if (bannerMoveBtn) {
    bannerMoveBtn.addEventListener('click', () => {
      setMoveMode(!isMoveMode);
    });
  }

  // ==========================================================================
  // 6. Universal Movable Elements Engine (Micro-bars & Drag)
  // ==========================================================================
  function setupUniversalMovableElements() {
    const movables = document.querySelectorAll('.movable-element');
    movables.forEach((el) => {
      // 1. Attach micro-move bar if not present
      if (!el.querySelector(':scope > .element-quick-move-bar')) {
        const moveBar = document.createElement('div');
        moveBar.className = 'element-quick-move-bar';
        moveBar.innerHTML = `
          <button type="button" class="btn-micro-move" data-dir="up" title="הזז למעלה / קודם">
            <i data-lucide="arrow-up"></i>
          </button>
          <button type="button" class="btn-micro-move" data-dir="down" title="הזז למטה / הבא">
            <i data-lucide="arrow-down"></i>
          </button>
          <span class="micro-drag-handle" title="גרור כדי להזיז"><i data-lucide="grip-vertical"></i></span>
          <button type="button" class="btn-micro-delete" title="מחק אלמנט זה"><i data-lucide="trash-2"></i></button>
        `;
        el.appendChild(moveBar);

        // Move Up / Prev
        moveBar.querySelector('[data-dir="up"]').onclick = (e) => {
          e.stopPropagation();
          const prev = el.previousElementSibling;
          if (prev && prev.parentElement === el.parentElement && !prev.classList.contains('hero-background-pattern')) {
            el.parentElement.insertBefore(el, prev);
            onContentChanged();
            showToast('האלמנט הועבר למעלה!');
          } else {
            showToast('האלמנט כבר בראש המקטע.');
          }
        };

        // Move Down / Next
        moveBar.querySelector('[data-dir="down"]').onclick = (e) => {
          e.stopPropagation();
          const next = el.nextElementSibling;
          if (next && next.parentElement === el.parentElement) {
            el.parentElement.insertBefore(next, el);
            onContentChanged();
            showToast('האלמנט הועבר למטה!');
          } else {
            showToast('האלמנט כבר בתחתית המקטע.');
          }
        };

        // Delete
        moveBar.querySelector('.btn-micro-delete').onclick = (e) => {
          e.stopPropagation();
          const title = el.textContent.trim().slice(0, 30) || 'אלמנט';
          deleteItemWithRecord(el, title, 'אלמנט');
        };
      }

      // 2. Drag & Drop on movable element
      el.setAttribute('draggable', (isEditMode || isMoveMode) ? 'true' : 'false');

      el.ondragstart = (e) => {
        if (e.target.isContentEditable && window.getSelection().toString().length > 0) {
          e.preventDefault();
          return;
        }
        draggedElement = el;
        draggedType = 'movable';
        el.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', el.id || 'movable');
      };

      el.ondragend = () => {
        if (draggedElement) draggedElement.classList.remove('is-dragging');
        document.querySelectorAll('.movable-element').forEach((m) => {
          m.classList.remove('drop-target-before', 'drop-target-after');
        });
        draggedElement = null;
        draggedType = null;
        onContentChanged();
      };

      el.ondragover = (e) => {
        if (draggedType !== 'movable' || !draggedElement || draggedElement === el) return;
        if (draggedElement.parentElement !== el.parentElement) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = el.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        if (relY < rect.height / 2) {
          el.classList.add('drop-target-before');
          el.classList.remove('drop-target-after');
        } else {
          el.classList.add('drop-target-after');
          el.classList.remove('drop-target-before');
        }
      };

      el.ondragleave = () => {
        el.classList.remove('drop-target-before', 'drop-target-after');
      };

      el.ondrop = (e) => {
        if (draggedType !== 'movable' || !draggedElement || draggedElement === el) return;
        if (draggedElement.parentElement !== el.parentElement) return;
        e.preventDefault();

        const rect = el.getBoundingClientRect();
        const relY = e.clientY - rect.top;

        if (relY < rect.height / 2) {
          el.parentElement.insertBefore(draggedElement, el);
        } else {
          el.parentElement.insertBefore(draggedElement, el.nextElementSibling);
        }

        el.classList.remove('drop-target-before', 'drop-target-after');
        showToast('מיקום האלמנט עודכן!');
        onContentChanged();
      };
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================================================
  // 7. Universal Eraser Tool (Click-to-Delete ANYTHING)
  // ==========================================================================
  function setEraserMode(active) {
    isEraserMode = active;
    document.body.classList.toggle('eraser-mode-active', isEraserMode);

    if (toggleEraserBtn) {
      toggleEraserBtn.classList.toggle('active', isEraserMode);
      if (eraserBtnText) {
        eraserBtnText.textContent = isEraserMode ? 'מחק פעיל!' : 'כלי מחק';
      }
    }

    if (bannerEraserBtn) {
      bannerEraserBtn.classList.toggle('active', isEraserMode);
      if (bannerEraserText) {
        bannerEraserText.textContent = isEraserMode ? 'מחק פעיל!' : 'כלי מחק';
      }
    }

    if (eraserCursorBadge) {
      eraserCursorBadge.style.display = isEraserMode ? 'flex' : 'none';
    }

    if (isEraserMode) {
      if (!isEditMode) setEditMode(true);
      if (isMoveMode) setMoveMode(false);
      showToast('🧹 כלי מחק פעיל! לחץ על כל דבר בעמוד כדי למחוק אותו מיד.');
    } else {
      showToast('כלי מחק כובה.');
    }
  }

  if (toggleEraserBtn) {
    toggleEraserBtn.addEventListener('click', () => {
      setEraserMode(!isEraserMode);
    });
  }

  if (bannerEraserBtn) {
    bannerEraserBtn.addEventListener('click', () => {
      setEraserMode(!isEraserMode);
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (isEraserMode && eraserCursorBadge) {
      eraserCursorBadge.style.left = `${e.clientX}px`;
      eraserCursorBadge.style.top = `${e.clientY}px`;
    }
  });

  document.addEventListener('click', (e) => {
    if (!isEraserMode) return;

    if (e.target.closest('#editToolbar, #editTopBanner, #restoreModal, #toastNotice, #bookingModal, #universalContextMenu')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    let target = e.target;
    const candidateSection = target.closest('.draggable-section');
    const candidateCard = target.closest('.draggable-card, .map-card');
    const candidateBlock = target.closest('.info-block, .highlight-item, .hours-row, .removable-element, .movable-element');

    let toDelete = target;
    let title = target.textContent.trim().slice(0, 30) || target.tagName;
    let type = 'אלמנט';

    if (candidateCard && !candidateBlock) {
      toDelete = candidateCard;
      title = candidateCard.querySelector('.service-name, .team-name')?.textContent || 'כרטיס';
      type = 'כרטיס';
    } else if (candidateBlock) {
      toDelete = candidateBlock;
      title = candidateBlock.textContent.trim().slice(0, 30);
      type = 'פריט';
    } else if (candidateSection && target.classList.contains('section-drag-handle')) {
      toDelete = candidateSection;
      title = candidateSection.getAttribute('data-section-title') || 'מקטע';
      type = 'מקטע';
    }

    deleteItemWithRecord(toDelete, title, type);
  }, true);

  // ==========================================================================
  // 8. Clear All Sections / "נקה הכל"
  // ==========================================================================
  function clearAllSections() {
    if (!mainContent) return;
    const sections = Array.from(mainContent.querySelectorAll('.draggable-section'));
    if (sections.length === 0) {
      showToast('העמוד כבר ריק!');
      return;
    }

    if (confirm(`האם אתה בטוח שברצונך למחוק את כל ${sections.length} המקטעים מהעמוד?\nתוכל לשחזר את הכל בכל עת מסל השחזור.`)) {
      sections.forEach((sec) => {
        const title = sec.getAttribute('data-section-title') || 'מקטע';
        deleteItemWithRecord(sec, title, 'מקטע');
      });

      let emptyNotice = document.getElementById('emptyCanvasNotice');
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.id = 'emptyCanvasNotice';
        emptyNotice.className = 'empty-canvas-notice';
        emptyNotice.innerHTML = `
          <i data-lucide="layers"></i>
          <h2 class="empty-canvas-title">כל המקטעים נמחקו</h2>
          <p class="empty-canvas-sub">העמוד ריק כעת לחלוטין. תוכל לשחזר את כל המקטעים בבת אחת או לבחור מה להחזיר מסל השחזור.</p>
          <button type="button" class="btn btn-primary" onclick="restoreAllDeleted()">
            <i data-lucide="rotate-ccw"></i>
            <span>שחזר את כל העמוד</span>
          </button>
        `;
        mainContent.appendChild(emptyNotice);
        if (window.lucide) window.lucide.createIcons();
      }

      showToast('כל המקטעים נמחקו מהעמוד!');
    }
  }

  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllSections);
  if (bannerClearAllBtn) bannerClearAllBtn.addEventListener('click', clearAllSections);

  // ==========================================================================
  // 9. Right-Click Universal Context Menu
  // ==========================================================================
  document.addEventListener('contextmenu', (e) => {
    if (!isEditMode) return;
    if (e.target.closest('#editToolbar, #editTopBanner, #restoreModal, #bookingModal')) return;

    e.preventDefault();
    contextMenuTarget = e.target.closest('.draggable-card, .draggable-section, .info-block, .highlight-item, .hours-row, [data-edit-key], .btn, .logo-box, .placeholder-box, .movable-element') || e.target;

    if (universalContextMenu) {
      universalContextMenu.style.display = 'flex';
      universalContextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`;
      universalContextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 150)}px`;
    }
  });

  function closeContextMenu() {
    if (universalContextMenu) universalContextMenu.style.display = 'none';
    contextMenuTarget = null;
  }

  document.addEventListener('click', (e) => {
    if (universalContextMenu && !universalContextMenu.contains(e.target)) {
      closeContextMenu();
    }
  });

  if (ctxDeleteBtn) {
    ctxDeleteBtn.addEventListener('click', () => {
      if (contextMenuTarget) {
        const title = contextMenuTarget.textContent.trim().slice(0, 30) || contextMenuTarget.tagName;
        deleteItemWithRecord(contextMenuTarget, title, 'אלמנט');
      }
      closeContextMenu();
    });
  }

  if (ctxMovePrevBtn) {
    ctxMovePrevBtn.addEventListener('click', () => {
      if (contextMenuTarget && contextMenuTarget.parentElement) {
        const prev = contextMenuTarget.previousElementSibling;
        if (prev) {
          contextMenuTarget.parentElement.insertBefore(contextMenuTarget, prev);
          onContentChanged();
          showToast('האלמנט הועבר קדימה!');
        }
      }
      closeContextMenu();
    });
  }

  if (ctxMoveNextBtn) {
    ctxMoveNextBtn.addEventListener('click', () => {
      if (contextMenuTarget && contextMenuTarget.parentElement) {
        const next = contextMenuTarget.nextElementSibling;
        if (next) {
          contextMenuTarget.parentElement.insertBefore(next, contextMenuTarget);
          onContentChanged();
          showToast('האלמנט הועבר אחורה!');
        }
      }
      closeContextMenu();
    });
  }

  // ==========================================================================
  // 10. Section & Card Move Buttons
  // ==========================================================================
  function setupSectionMoveButtons() {
    document.querySelectorAll('.btn-sec-move').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const section = btn.closest('.draggable-section');
        const dir = btn.getAttribute('data-move-sec');
        if (!section || !mainContent) return;

        if (dir === 'up') {
          const prev = section.previousElementSibling;
          if (prev && prev.classList.contains('draggable-section')) {
            mainContent.insertBefore(section, prev);
            onContentChanged();
            showToast('המקטע הועבר למעלה!');
          } else {
            showToast('המקטע כבר בראש העמוד.');
          }
        } else if (dir === 'down') {
          const next = section.nextElementSibling;
          if (next && next.classList.contains('draggable-section')) {
            mainContent.insertBefore(next, section);
            onContentChanged();
            showToast('המקטע הועבר למטה!');
          } else {
            showToast('המקטע כבר בתחתית העמוד.');
          }
        }
      };
    });
  }

  function setupCardMoveButtons() {
    document.querySelectorAll('.btn-card-move').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const card = btn.closest('.draggable-card');
        const parent = card ? card.parentElement : null;
        const dir = btn.getAttribute('data-card-move');
        if (!card || !parent) return;

        if (dir === 'prev') {
          const prev = card.previousElementSibling;
          if (prev && prev.classList.contains('draggable-card')) {
            parent.insertBefore(card, prev);
            onContentChanged();
            showToast('הכרטיס הועבר קדימה!');
          }
        } else if (dir === 'next') {
          const next = card.nextElementSibling;
          if (next && next.classList.contains('draggable-card')) {
            parent.insertBefore(next, card);
            onContentChanged();
            showToast('הכרטיס הועבר אחורה!');
          }
        }
      };
    });
  }

  // ==========================================================================
  // 11. Deletion Engine & Recycle Bin
  // ==========================================================================
  function setupDeleteButtons() {
    // 1. Delete Section
    document.querySelectorAll('.btn-sec-delete').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const section = btn.closest('.draggable-section');
        if (!section) return;

        const title = section.getAttribute('data-section-title') || 'מקטע';
        if (confirm(`האם אתה בטוח שברצונך למחוק את "${title}"?\nתוכל לשחזר אותו בכל עת מסל השחזור.`)) {
          deleteItemWithRecord(section, title, 'מקטע');
        }
      };
    });

    // 2. Delete Card
    document.querySelectorAll('.btn-card-delete, .btn-card-delete-corner').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const card = btn.closest('.draggable-card, .map-card');
        if (!card) return;

        const title = card.querySelector('.service-name, .team-name, .info-title, .map-city-title')?.textContent.trim() || 'כרטיס';
        if (confirm(`האם למחוק פריט זה ("${title}")?`)) {
          deleteItemWithRecord(card, title, 'כרטיס');
        }
      };
    });

    // 3. Delete Highlight item
    document.querySelectorAll('.btn-item-delete').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const item = btn.closest('.highlight-item, .info-block');
        if (!item) return;

        const title = item.querySelector('span, .info-title')?.textContent.trim() || 'אלמנט';
        deleteItemWithRecord(item, title, 'אלמנט');
      };
    });

    // 4. Delete Hours row
    document.querySelectorAll('.btn-hour-delete').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const row = btn.closest('.hours-row');
        if (!row) return;

        const label = row.querySelector('.day-label')?.textContent.trim() || 'שורה';
        deleteItemWithRecord(row, `שעות: ${label}`, 'שורת שעות');
      };
    });

    // 5. Delete Generic Removable Element
    document.querySelectorAll('.btn-delete-element').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const el = btn.closest('.removable-element');
        if (!el) return;

        const title = el.textContent.trim().slice(0, 30) || 'אלמנט';
        deleteItemWithRecord(el, title, 'אלמנט');
      };
    });

    // 6. Remove Image Button
    document.querySelectorAll('.btn-remove-image').forEach((btn) => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const imageKey = btn.getAttribute('data-remove-image');
        const box = btn.closest('.placeholder-box');
        if (!box) return;

        if (confirm('האם להסיר את התמונה ולחזור לברירת המחדל?')) {
          const img = box.querySelector('.uploaded-img');
          const placeholderContent = box.querySelector('.logo-placeholder-content, .photo-placeholder-content');

          if (img) {
            img.src = '';
            img.style.display = 'none';
          }
          if (placeholderContent) {
            placeholderContent.style.display = 'flex';
          }
          box.classList.remove('has-image');

          try {
            const currentImages = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}');
            delete currentImages[imageKey];
            localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(currentImages));
          } catch (err) {}

          onContentChanged();
          showToast('התמונה הוסרה בהצלחה!');
        }
      };
    });
  }

  function deleteItemWithRecord(element, title, type) {
    const parent = element.parentElement;
    if (!parent) return;

    const parentId = parent.id || (parent.classList.contains('services-grid') ? 'servicesGrid' : (parent.classList.contains('team-grid') ? 'teamGrid' : 'mainContent'));
    const nextSibling = element.nextElementSibling;
    const nextSiblingId = nextSibling ? (nextSibling.id || nextSibling.getAttribute('data-card-id') || null) : null;

    const record = {
      id: 'del_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      elementHtml: element.outerHTML,
      title: title,
      type: type,
      parentId: parentId,
      nextSiblingId: nextSiblingId,
      deletedAt: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    deletedItems.unshift(record);
    saveDeletedItemsToStorage();

    element.style.transition = 'opacity 0.25s, transform 0.25s';
    element.style.opacity = '0';
    element.style.transform = 'scale(0.85)';

    setTimeout(() => {
      element.remove();
      updateRestoreButtonUI();
      onContentChanged();
      showToastWithUndo(`"${title}" נמחק בהצלחה.`, () => {
        restoreSpecificItem(record.id);
      });
    }, 250);
  }

  function updateRestoreButtonUI() {
    const count = deletedItems.length;

    if (restoreDeletedBtn && restoreBtnText) {
      if (count > 0 && isEditMode) {
        restoreDeletedBtn.style.display = 'inline-flex';
        restoreBtnText.textContent = `שחזור (${count})`;
      } else {
        restoreDeletedBtn.style.display = 'none';
      }
    }

    if (bannerRestoreBtn && bannerRestoreText) {
      if (count > 0 && isEditMode) {
        bannerRestoreBtn.style.display = 'inline-flex';
        bannerRestoreText.textContent = `סל שחזור (${count})`;
      } else {
        bannerRestoreBtn.style.display = 'none';
      }
    }
  }

  window.openRestoreModal = function () {
    if (!restoreModal) return;
    renderRestoreList();
    restoreModal.classList.add('open');
    restoreModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeRestoreModal = function () {
    if (!restoreModal) return;
    restoreModal.classList.remove('open');
    restoreModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (restoreDeletedBtn) restoreDeletedBtn.addEventListener('click', openRestoreModal);
  if (bannerRestoreBtn) bannerRestoreBtn.addEventListener('click', openRestoreModal);

  function renderRestoreList() {
    if (!restoreList || !restoreEmptyState) return;
    restoreList.innerHTML = '';

    if (deletedItems.length === 0) {
      restoreEmptyState.style.display = 'flex';
      return;
    }

    restoreEmptyState.style.display = 'none';
    deletedItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'restore-item';
      row.innerHTML = `
        <div class="restore-item-info">
          <span class="restore-item-title">${item.title}</span>
          <span class="restore-item-type">${item.type} • נמחק ב-${item.deletedAt}</span>
        </div>
        <button type="button" class="btn-restore-single" onclick="restoreSpecificItem('${item.id}')">
          <i data-lucide="rotate-ccw"></i>
          <span>שחזר</span>
        </button>
      `;
      restoreList.appendChild(row);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  window.restoreSpecificItem = function (recordId) {
    const index = deletedItems.findIndex((it) => it.id === recordId);
    if (index === -1) return;

    const item = deletedItems[index];
    const parent = document.getElementById(item.parentId) || mainContent;

    const emptyNotice = document.getElementById('emptyCanvasNotice');
    if (emptyNotice) emptyNotice.remove();

    if (parent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = item.elementHtml;
      const restoredNode = tempDiv.firstElementChild;

      let inserted = false;
      if (item.nextSiblingId) {
        const sibling = parent.querySelector(`#${item.nextSiblingId}, [data-card-id="${item.nextSiblingId}"]`);
        if (sibling) {
          parent.insertBefore(restoredNode, sibling);
          inserted = true;
        }
      }

      if (!inserted) {
        parent.appendChild(restoredNode);
      }

      setupSectionMoveButtons();
      setupCardMoveButtons();
      setupDeleteButtons();
      setupUniversalMovableElements();
      setupDragAndDrop();
      setupImageUploadTriggers();

      if (isEditMode) {
        restoredNode.querySelectorAll('[data-edit-key]').forEach((el) => {
          el.contentEditable = 'true';
          el.addEventListener('input', onContentChanged);
        });
      }

      deletedItems.splice(index, 1);
      saveDeletedItemsToStorage();
      updateRestoreButtonUI();
      renderRestoreList();
      onContentChanged();

      if (window.lucide) window.lucide.createIcons();
      showToast(`"${item.title}" שוחזר בהצלחה!`);

      restoredNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  window.restoreAllDeleted = function () {
    if (deletedItems.length === 0) return;
    const itemsCopy = [...deletedItems];
    itemsCopy.forEach((it) => {
      restoreSpecificItem(it.id);
    });
    closeRestoreModal();
    showToast('כל הפריטים שנמחקו שוחזרו בהצלחה!');
  };

  function saveDeletedItemsToStorage() {
    try {
      localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(deletedItems));
    } catch (err) {}
  }

  function loadDeletedItemsFromStorage() {
    try {
      const saved = localStorage.getItem(DELETED_ITEMS_KEY);
      if (saved) {
        deletedItems = JSON.parse(saved);
        updateRestoreButtonUI();
      }
    } catch (err) {}
  }

  // ==========================================================================
  // 12. Drag & Drop Engine (Sections & Cards)
  // ==========================================================================
  function setupDragAndDrop() {
    // Sections
    document.querySelectorAll('.draggable-section').forEach((sec) => {
      const handle = sec.querySelector('.section-drag-handle');
      if (handle) {
        handle.setAttribute('draggable', (isEditMode || isMoveMode) ? 'true' : 'false');

        handle.ondragstart = (e) => {
          draggedElement = sec;
          draggedType = 'section';
          sec.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', sec.id);
        };

        handle.ondragend = () => {
          if (draggedElement) draggedElement.classList.remove('is-dragging');
          document.querySelectorAll('.draggable-section').forEach((s) => {
            s.classList.remove('drop-target-before', 'drop-target-after');
          });
          draggedElement = null;
          draggedType = null;
          onContentChanged();
        };
      }

      sec.ondragover = (e) => {
        if (draggedType !== 'section' || !draggedElement || draggedElement === sec) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = sec.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        if (relY < rect.height / 2) {
          sec.classList.add('drop-target-before');
          sec.classList.remove('drop-target-after');
        } else {
          sec.classList.add('drop-target-after');
          sec.classList.remove('drop-target-before');
        }
      };

      sec.ondragleave = () => {
        sec.classList.remove('drop-target-before', 'drop-target-after');
      };

      sec.ondrop = (e) => {
        if (draggedType !== 'section' || !draggedElement || draggedElement === sec) return;
        e.preventDefault();

        const rect = sec.getBoundingClientRect();
        const relY = e.clientY - rect.top;

        if (relY < rect.height / 2) {
          mainContent.insertBefore(draggedElement, sec);
        } else {
          mainContent.insertBefore(draggedElement, sec.nextElementSibling);
        }

        sec.classList.remove('drop-target-before', 'drop-target-after');
        showToast('מיקום המקטע עודכן!');
        onContentChanged();
      };
    });

    // Cards
    document.querySelectorAll('.draggable-card').forEach((card) => {
      const handle = card.querySelector('.card-drag-handle');
      if (handle) {
        handle.setAttribute('draggable', (isEditMode || isMoveMode) ? 'true' : 'false');

        handle.ondragstart = (e) => {
          draggedElement = card;
          draggedType = 'card';
          card.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.getAttribute('data-card-id'));
        };

        handle.ondragend = () => {
          if (draggedElement) draggedElement.classList.remove('is-dragging');
          document.querySelectorAll('.draggable-card').forEach((c) => {
            c.classList.remove('drop-target-before', 'drop-target-after');
          });
          draggedElement = null;
          draggedType = null;
          onContentChanged();
        };
      }

      card.ondragover = (e) => {
        if (draggedType !== 'card' || !draggedElement || draggedElement === card) return;
        if (draggedElement.parentElement !== card.parentElement) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = card.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        if (relX > rect.width / 2) {
          card.classList.add('drop-target-before');
          card.classList.remove('drop-target-after');
        } else {
          card.classList.add('drop-target-after');
          card.classList.remove('drop-target-before');
        }
      };

      card.ondragleave = () => {
        card.classList.remove('drop-target-before', 'drop-target-after');
      };

      card.ondrop = (e) => {
        if (draggedType !== 'card' || !draggedElement || draggedElement === card) return;
        if (draggedElement.parentElement !== card.parentElement) return;
        e.preventDefault();

        const rect = card.getBoundingClientRect();
        const relX = e.clientX - rect.left;

        if (relX > rect.width / 2) {
          card.parentElement.insertBefore(draggedElement, card);
        } else {
          card.parentElement.insertBefore(draggedElement, card.nextElementSibling);
        }

        card.classList.remove('drop-target-before', 'drop-target-after');
        showToast('מיקום הכרטיס עודכן!');
        onContentChanged();
      };
    });
  }

  // ==========================================================================
  // 13. Add New Items
  // ==========================================================================
  if (addServiceBtn && servicesGrid) {
    addServiceBtn.addEventListener('click', () => {
      const newCardId = `service_${Date.now()}`;
      const newCard = document.createElement('div');
      newCard.className = 'service-card draggable-card';
      newCard.setAttribute('data-card-id', newCardId);

      newCard.innerHTML = `
        <div class="edit-card-bar">
          <div class="card-drag-handle" title="גרור כדי להזיז מקום">
            <i data-lucide="grip-vertical"></i>
            <span>הזז</span>
          </div>
          <div class="card-move-actions">
            <button type="button" class="btn-card-move" data-card-move="prev" title="הזז ימינה">
              <i data-lucide="chevron-right"></i>
            </button>
            <button type="button" class="btn-card-move" data-card-move="next" title="הזז שמאלה">
              <i data-lucide="chevron-left"></i>
            </button>
            <button type="button" class="btn-card-delete" title="מחק שירות זה">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
        <div class="service-card-glow"></div>
        <div class="service-card-top">
          <div class="service-icon-wrap">
            <i data-lucide="scissors"></i>
          </div>
          <span class="service-badge" data-edit-key="${newCardId}_badge">שירות חדש</span>
        </div>
        <h3 class="service-name" data-edit-key="${newCardId}_title">שם השירות</h3>
        <p class="service-text" data-edit-key="${newCardId}_desc">
          תיאור קצר של השירות, מה הוא כולל והיתרונות שלו.
        </p>
        <div class="service-pricing">
          <span class="currency">₪</span>
          <span class="price-val" data-edit-key="${newCardId}_price">50</span>
        </div>
        <a href="${CALMARK_BOOKING_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-card-book">
          <span>הזמן תור עכשיו</span>
          <i data-lucide="arrow-left"></i>
        </a>
      `;

      servicesGrid.appendChild(newCard);
      setupCardMoveButtons();
      setupDeleteButtons();
      setupDragAndDrop();

      if (isEditMode) {
        newCard.querySelectorAll('[data-edit-key]').forEach((el) => {
          el.contentEditable = 'true';
          el.addEventListener('input', onContentChanged);
        });
      }

      if (window.lucide) window.lucide.createIcons();
      onContentChanged();
      showToast('נוסף שירות חדש למחירון!');
      newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (addTeamBtn && teamGrid) {
    addTeamBtn.addEventListener('click', () => {
      const newTeamId = `team_${Date.now()}`;
      const newCard = document.createElement('div');
      newCard.className = 'team-card draggable-card';
      newCard.setAttribute('data-card-id', newTeamId);

      newCard.innerHTML = `
        <div class="edit-card-bar">
          <div class="card-drag-handle" title="גרור כדי להזיז מקום">
            <i data-lucide="grip-vertical"></i>
            <span>הזז</span>
          </div>
          <div class="card-move-actions">
            <button type="button" class="btn-card-move" data-card-move="prev" title="הזז ימינה">
              <i data-lucide="chevron-right"></i>
            </button>
            <button type="button" class="btn-card-move" data-card-move="next" title="הזז שמאלה">
              <i data-lucide="chevron-left"></i>
            </button>
            <button type="button" class="btn-card-delete" title="מחק ספר זה">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
        <div class="team-photo-wrap placeholder-box" data-editable-image="${newTeamId}_photo" title="לחץ להעלאת תמונת ספר">
          <div class="photo-placeholder-content">
            <i data-lucide="user" class="member-default-icon"></i>
            <span class="placeholder-tag">[הוסף תמונה]</span>
          </div>
          <img src="" alt="תמונת ספר" class="uploaded-img" style="display: none;">
          <button type="button" class="btn-remove-image" data-remove-image="${newTeamId}_photo" title="הסר תמונה">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="team-content">
          <div class="team-header-info">
            <h3 class="team-name placeholder-text" data-edit-key="${newTeamId}_name">[שם הספר]</h3>
            <span class="team-role placeholder-text" data-edit-key="${newTeamId}_role">[תפקיד / התמחות]</span>
          </div>
          <p class="team-bio placeholder-text" data-edit-key="${newTeamId}_bio">
            [תיאור קצר אודות הספר, ניסיון ומיומנות]
          </p>
          <a href="${CALMARK_BOOKING_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm open-booking-btn">
            <i data-lucide="calendar"></i>
            <span>קבע תור</span>
          </a>
        </div>
      `;

      teamGrid.appendChild(newCard);
      setupCardMoveButtons();
      setupDeleteButtons();
      setupDragAndDrop();
      setupImageUploadTriggers();

      if (isEditMode) {
        newCard.querySelectorAll('[data-edit-key]').forEach((el) => {
          el.contentEditable = 'true';
          el.addEventListener('input', onContentChanged);
        });
      }

      if (window.lucide) window.lucide.createIcons();
      onContentChanged();
      showToast('נוסף ספר חדש לצוות!');
      newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (addHighlightBtn) {
    addHighlightBtn.addEventListener('click', () => {
      const heroHighlights = document.getElementById('heroHighlights');
      if (!heroHighlights) return;

      const newId = `h_${Date.now()}`;
      const divItem = document.createElement('div');
      divItem.className = 'highlight-item draggable-highlight';
      divItem.setAttribute('data-highlight-id', newId);
      divItem.innerHTML = `
        <i data-lucide="star"></i>
        <span data-edit-key="${newId}_text">יתרון חדש</span>
        <button type="button" class="btn-item-delete" title="מחק יתרון זה"><i data-lucide="x"></i></button>
      `;

      heroHighlights.appendChild(divItem);
      setupDeleteButtons();

      if (isEditMode) {
        divItem.querySelectorAll('[data-edit-key]').forEach((el) => {
          el.contentEditable = 'true';
          el.addEventListener('input', onContentChanged);
        });
      }

      if (window.lucide) window.lucide.createIcons();
      onContentChanged();
      showToast('נוסף יתרון חדש!');
    });
  }

  if (addHourRowBtn) {
    addHourRowBtn.addEventListener('click', () => {
      const hoursList = document.getElementById('hoursList');
      if (!hoursList) return;

      const newId = `hr_${Date.now()}`;
      const row = document.createElement('div');
      row.className = 'hours-row';
      row.innerHTML = `
        <span class="day-label" data-edit-key="${newId}_label">יום חדש:</span>
        <span class="day-hours" data-edit-key="${newId}_val">8:00 – 20:00</span>
        <button type="button" class="btn-hour-delete" title="מחק שורה זו"><i data-lucide="x"></i></button>
      `;

      hoursList.appendChild(row);
      setupDeleteButtons();

      if (isEditMode) {
        row.querySelectorAll('[data-edit-key]').forEach((el) => {
          el.contentEditable = 'true';
          el.addEventListener('input', onContentChanged);
        });
      }

      if (window.lucide) window.lucide.createIcons();
      onContentChanged();
      showToast('נוספה שורת שעות חדשה!');
    });
  }

  // ==========================================================================
  // 14. Floating Rich-Text Formatting Bubble
  // ==========================================================================
  function showFormatBubble(rect) {
    if (!textFormatBubble) return;
    textFormatBubble.style.display = 'flex';
    textFormatBubble.style.top = `${window.scrollY + rect.top - 46}px`;
    textFormatBubble.style.left = `${rect.left + rect.width / 2 - textFormatBubble.offsetWidth / 2}px`;
  }

  function hideFormatBubble() {
    if (textFormatBubble) textFormatBubble.style.display = 'none';
  }

  document.addEventListener('selectionchange', () => {
    if (!isEditMode) {
      hideFormatBubble();
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      hideFormatBubble();
      return;
    }

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const editableParent = commonAncestor.nodeType === 1 
      ? commonAncestor.closest('[data-edit-key]') 
      : commonAncestor.parentElement.closest('[data-edit-key]');

    if (editableParent) {
      activeSelectedElement = editableParent;
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        showFormatBubble(rect);
      }
    } else {
      hideFormatBubble();
    }
  });

  if (textFormatBubble) {
    textFormatBubble.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const cmd = btn.getAttribute('data-cmd');
        const color = btn.getAttribute('data-color');

        if (cmd === 'deleteActiveElement') {
          if (activeSelectedElement) {
            const title = activeSelectedElement.textContent.trim().slice(0, 30) || 'טקסט';
            if (confirm(`האם למחוק אלמנט זה ("${title}")?`)) {
              deleteItemWithRecord(activeSelectedElement, title, 'אלמנט');
              hideFormatBubble();
            }
          }
        } else if (cmd === 'color' && color) {
          document.execCommand('foreColor', false, color);
          onContentChanged();
        } else if (cmd) {
          document.execCommand(cmd, false, null);
          onContentChanged();
        }
      });
    });
  }

  // ==========================================================================
  // 15. Image Upload Handling
  // ==========================================================================
  function setupImageUploadTriggers() {
    document.querySelectorAll('[data-editable-image]').forEach((box) => {
      box.onclick = (e) => {
        if (e.target.closest('.btn-remove-image')) return;
        // If the box already has an image and edit mode is not active, don't trigger upload
        if (!isEditMode && box.classList.contains('has-image')) return;
        activeImageTarget = box;
        if (globalImageUploader) {
          globalImageUploader.click();
        }
      };
    });
  }

  if (globalImageUploader) {
    globalImageUploader.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !activeImageTarget) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const base64Data = event.target.result;
        const imageKey = activeImageTarget.getAttribute('data-editable-image');
        applyCustomImage(imageKey, base64Data);

        try {
          const currentImages = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}');
          currentImages[imageKey] = base64Data;
          localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(currentImages));
          showToast('התמונה הועלתה ונשמרה בהצלחה!');
          onContentChanged();
        } catch (storageErr) {
          showToast('התמונה הוצגה! מומלץ להוריד קובץ מעודכן לשמירה קבועה.');
        }
      };
      reader.readAsDataURL(file);
      globalImageUploader.value = '';
    });
  }

  function applyCustomImage(imageKey, base64Url) {
    const targetBox = document.querySelector(`[data-editable-image="${imageKey}"]`);
    if (!targetBox) return;

    const imgEl = targetBox.querySelector('.uploaded-img');
    const placeholderContent = targetBox.querySelector('.logo-placeholder-content, .photo-placeholder-content');

    if (imgEl && base64Url) {
      imgEl.src = base64Url;
      imgEl.style.display = 'block';
      targetBox.classList.add('has-image');
      if (placeholderContent) {
        placeholderContent.style.display = 'none';
      }
    }
  }

  // ==========================================================================
  // 16. Persistence: Save & Load
  // ==========================================================================
  function saveChangesToStorage() {
    const edits = {};
    document.querySelectorAll('[data-edit-key]').forEach((el) => {
      const key = el.getAttribute('data-edit-key');
      edits[key] = el.innerHTML;
    });

    const domOrder = {
      sections: [],
      services: [],
      team: []
    };

    if (mainContent) {
      mainContent.querySelectorAll('.draggable-section').forEach((sec) => {
        domOrder.sections.push(sec.getAttribute('data-section-id'));
      });
    }

    if (servicesGrid) {
      servicesGrid.querySelectorAll('.draggable-card').forEach((card) => {
        domOrder.services.push(card.getAttribute('data-card-id'));
      });
    }

    if (teamGrid) {
      teamGrid.querySelectorAll('.draggable-card').forEach((card) => {
        domOrder.team.push(card.getAttribute('data-card-id'));
      });
    }

    const dynamicGrids = {
      servicesHtml: servicesGrid ? servicesGrid.innerHTML : '',
      teamHtml: teamGrid ? teamGrid.innerHTML : ''
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      localStorage.setItem(DOM_ORDER_KEY, JSON.stringify(domOrder));
      localStorage.setItem(DYNAMIC_CARDS_KEY, JSON.stringify(dynamicGrids));
      saveDeletedItemsToStorage();

      hasUnsavedChanges = false;
      if (saveEditsBtn) saveEditsBtn.setAttribute('disabled', 'true');
      if (bannerSaveBtn) bannerSaveBtn.classList.remove('pulse');

      showToast('כל הטקסטים, התמונות, המיקומים והמחיקות נשמרו בהצלחה! 🎉');
    } catch (err) {
      console.error('Error saving edits:', err);
      showToast('שגיאה בשמירת השינויים בזיכרון הדפדפן.');
    }
  }

  if (saveEditsBtn) saveEditsBtn.addEventListener('click', saveChangesToStorage);
  if (bannerSaveBtn) bannerSaveBtn.addEventListener('click', saveChangesToStorage);

  function loadSavedCustomizations() {
    try {
      loadDeletedItemsFromStorage();

      const savedDynamic = localStorage.getItem(DYNAMIC_CARDS_KEY);
      if (savedDynamic) {
        const parsed = JSON.parse(savedDynamic);
        if (parsed.servicesHtml && servicesGrid) servicesGrid.innerHTML = parsed.servicesHtml;
        if (parsed.teamHtml && teamGrid) teamGrid.innerHTML = parsed.teamHtml;
      }

      const savedOrder = localStorage.getItem(DOM_ORDER_KEY);
      if (savedOrder && mainContent) {
        const order = JSON.parse(savedOrder);
        if (order.sections && order.sections.length) {
          order.sections.forEach((secId) => {
            const sec = mainContent.querySelector(`[data-section-id="${secId}"]`);
            if (sec) mainContent.appendChild(sec);
          });
        }
        if (order.services && order.services.length && servicesGrid) {
          order.services.forEach((cardId) => {
            const card = servicesGrid.querySelector(`[data-card-id="${cardId}"]`);
            if (card) servicesGrid.appendChild(card);
          });
        }
        if (order.team && order.team.length && teamGrid) {
          order.team.forEach((cardId) => {
            const card = teamGrid.querySelector(`[data-card-id="${cardId}"]`);
            if (card) teamGrid.appendChild(card);
          });
        }
      }

      const savedTexts = localStorage.getItem(STORAGE_KEY);
      if (savedTexts) {
        const edits = JSON.parse(savedTexts);
        Object.keys(edits).forEach((key) => {
          const el = document.querySelector(`[data-edit-key="${key}"]`);
          if (el) el.innerHTML = edits[key];
        });
      }

      const savedImages = localStorage.getItem(IMAGE_STORAGE_KEY) || localStorage.getItem('element_barbershop_images_v3');
      if (savedImages) {
        const images = JSON.parse(savedImages);
        Object.keys(images).forEach((key) => {
          applyCustomImage(key, images[key]);
        });
      }
    } catch (err) {
      console.warn('Could not load saved customizations:', err);
    }
  }

  // ==========================================================================
  // 17. Clean Export HTML
  // ==========================================================================
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', () => {
      const docClone = document.documentElement.cloneNode(true);

      docClone.querySelector('body').classList.remove('edit-mode-active', 'eraser-mode-active', 'move-mode-active');
      const topBanner = docClone.querySelector('#editTopBanner');
      if (topBanner) topBanner.remove();

      const bubble = docClone.querySelector('#textFormatBubble');
      if (bubble) bubble.remove();

      const ctxMenu = docClone.querySelector('#universalContextMenu');
      if (ctxMenu) ctxMenu.remove();

      const eraserBadge = docClone.querySelector('#eraserCursorBadge');
      if (eraserBadge) eraserBadge.remove();

      const modalRestore = docClone.querySelector('#restoreModal');
      if (modalRestore) modalRestore.remove();

      docClone.querySelectorAll('.element-quick-move-bar').forEach((b) => b.remove());

      docClone.querySelectorAll('[contenteditable]').forEach((el) => {
        el.removeAttribute('contenteditable');
      });

      docClone.querySelectorAll('.draggable-section, .draggable-card, .movable-element').forEach((el) => {
        el.classList.remove('is-dragging', 'drop-target-before', 'drop-target-after');
      });

      const fullHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'index-element-barbershop.html';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast('קובץ האתר המעודכן ירד למחשב שלך בהצלחה! 📥');
    });
  }

  // Reset to default
  if (resetEditsBtn) {
    resetEditsBtn.addEventListener('click', () => {
      if (confirm('האם אתה בטוח שברצונך לאפס את כל הטקסטים, התמונות, המיקומים והמחיקות לברירת המחדל?')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(IMAGE_STORAGE_KEY);
        localStorage.removeItem(DOM_ORDER_KEY);
        localStorage.removeItem(DYNAMIC_CARDS_KEY);
        localStorage.removeItem(DELETED_ITEMS_KEY);
        window.location.reload();
      }
    });
  }

  // ==========================================================================
  // 18. Toast Notification System with Undo
  // ==========================================================================
  function showToast(message) {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-msg';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>${message}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  function showToastWithUndo(message, onUndo) {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-msg';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="toast-undo-btn" id="toastUndoBtn">בטל מחיקה</button>
    `;
    toast.classList.add('show');

    const undoBtn = document.getElementById('toastUndoBtn');
    if (undoBtn) {
      undoBtn.onclick = () => {
        if (onUndo) onUndo();
        toast.classList.remove('show');
      };
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // ==========================================================================
  // 18. Modern Interactive FX & Animations
  // ==========================================================================

  // A. Scroll Progress Bar
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  function updateScrollProgress() {
    if (!scrollProgressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressBar.style.width = `${progress}%`;
  }

  // B. Back to Top Button
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function updateBackToTopVisibility() {
    if (!backToTopBtn) return;
    if (window.scrollY > 350) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateBackToTopVisibility();
  }, { passive: true });

  // C. Scroll Reveal Observer
  function setupScrollReveal() {
    // Automatically apply reveal to cards and headers with staggered delays
    const autoTargets = document.querySelectorAll(
      '.service-card, .team-card, .info-block, .map-card, .section-header'
    );
    autoTargets.forEach((el, idx) => {
      if (!el.classList.contains('reveal-scale') && !el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
        const colIndex = (idx % 3) + 1;
        el.classList.add(`delay-${colIndex}00`);
      }
    });

    const revealEls = document.querySelectorAll('.reveal-on-scroll, .reveal-scale');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      });

      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-revealed'));
    }
  }

  // Copy phone number to clipboard when clicking tel: links
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', () => {
      const phoneNum = link.getAttribute('href').replace('tel:', '');
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(phoneNum);
          showToast(`📞 מספר הטלפון ${phoneNum} הועתק ללוח ומחייג...`);
        }
      } catch (err) {}
    });
  });

  // D. Animated Stats Counters
  function setupStatsCounters() {
    const statCounters = document.querySelectorAll('.stat-counter');
    if (!statCounters.length) return;

    let hasCounted = false;

    function startCounting() {
      if (hasCounted) return;
      hasCounted = true;

      statCounters.forEach((counter) => {
        const target = parseFloat(counter.getAttribute('data-target') || '0');
        const duration = 1800; // ms
        const startTime = performance.now();
        const isDecimal = target % 1 !== 0;

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = target * easeProgress;

          counter.textContent = isDecimal 
            ? currentVal.toFixed(1) 
            : Math.floor(currentVal).toLocaleString('he-IL');

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          } else {
            counter.textContent = isDecimal 
              ? target.toFixed(1) 
              : target.toLocaleString('he-IL');
          }
        }

        requestAnimationFrame(updateCount);
      });
    }

    const statsBar = document.querySelector('.stats-counter-bar');
    if (statsBar && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startCounting();
            obs.disconnect();
          }
        });
      }, { threshold: 0.3 });
      obs.observe(statsBar);
    } else {
      startCounting();
    }
  }

  // E. Image Lightbox Modal
  const imageLightboxModal = document.getElementById('imageLightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  function openLightbox(src, caption = '') {
    if (!imageLightboxModal || !lightboxImg || !src) return;
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    imageLightboxModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!imageLightboxModal) return;
    imageLightboxModal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  if (lightboxCloseBtn) lightboxCloseBtn.onclick = closeLightbox;
  if (lightboxBackdrop) lightboxBackdrop.onclick = closeLightbox;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageLightboxModal && imageLightboxModal.classList.contains('is-active')) {
      closeLightbox();
    }
  });

  // Attach lightbox preview to uploaded photos when not in edit mode
  document.addEventListener('click', (e) => {
    if (isEditMode) return;
    const photoBox = e.target.closest('.custom-hero-photo-box.has-image, .team-photo-box.has-image');
    if (photoBox) {
      const img = photoBox.querySelector('.uploaded-img, .member-photo-img');
      if (img && img.src && img.style.display !== 'none') {
        const title = photoBox.querySelector('.custom-photo-title, .team-name')?.textContent || 'תמונה במספרת אלמנט';
        openLightbox(img.src, title);
      }
    }
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedCustomizations();
    updateOpeningStatus();
    setupSectionMoveButtons();
    setupCardMoveButtons();
    setupDeleteButtons();
    setupImageUploadTriggers();
    setupDragAndDrop();
    setupUniversalMovableElements();
    setupScrollReveal();
    setupStatsCounters();

    setInterval(updateOpeningStatus, 60000);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

})();
