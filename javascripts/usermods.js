// Ensure gtag is available globally (MkDocs Material uses dataLayer internally but doesn't expose gtag)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Check if we're on the usermods page
function isUsermodsPage() {
    return typeof usermods !== 'undefined' || document.querySelector('.grid.cards') !== null;
}

// URL Parameter Handling
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        filter: params.get('filter') || 'all',
        sort: params.get('sort') || (typeof defaultSort !== 'undefined' ? defaultSort : 'username'),
        order: params.get('order') || null,
        username: params.get('username') || 'all',
        page: params.get('page') || null
    };
}

function updateUrlParams(updates) {
    const params = new URLSearchParams(window.location.search);
    
    for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === 'all' && key !== 'filter') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
    }
    
    // Remove username param if sort is not 'username'
    if (params.get('sort') !== 'username') {
        params.delete('username');
    }
    
    const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
}

function getCurrentSortOrder() {
    const ascIcon = document.getElementById('usermods-ascending');
    return ascIcon && ascIcon.style.display !== 'none' ? 'ascending' : 'descending';
}

let currentPage = 1;

function getGrid() {
    return document.querySelector('.grid.cards > ul');
}

function getItems() {
    const grid = getGrid();
    return grid ? Array.from(grid.children) : [];
}

function getPerPage() {
    const val = (typeof window.per_page !== 'undefined') ? Number(window.per_page) : NaN;
    return Number.isFinite(val) && val > 0 ? val : 20;
}

function setFiltered(item, hidden) {
    if (!item) return;
    item.dataset.usermodFiltered = hidden ? 'true' : 'false';
}

function setPaged(item, hidden) {
    if (!item) return;
    item.dataset.usermodPaged = hidden ? 'true' : 'false';
}

function applyVisibility(item) {
    if (!item) return;
    const filtered = item.dataset.usermodFiltered === 'true';
    const paged = item.dataset.usermodPaged === 'true';
    item.style.display = (filtered || paged) ? 'none' : '';
}

function getVisibleItems() {
    return getItems().filter(item => item.dataset.usermodFiltered !== 'true');
}

function updateResultsCount(totalFiltered, startIndex, endIndex, totalPages) {
    const el = document.getElementById('usermod-results-count');
    if (!el) return;

    if (!Number.isFinite(totalFiltered) || totalFiltered < 0) {
        el.textContent = '';
        return;
    }

    if (totalFiltered === 0) {
        el.textContent = 'Showing 0 mods';
        return;
    }

    const unit = totalFiltered === 1 ? 'mod' : 'mods';

    if (!Number.isFinite(totalPages) || totalPages <= 1) {
        el.textContent = `Showing ${totalFiltered} ${unit}`;
        return;
    }

    el.textContent = `Showing ${startIndex}-${endIndex} of ${totalFiltered} ${unit}`;
}

function renderPagination(totalItems) {
    const container = document.getElementById('usermod-pagination');
    if (!container) return;

    const perPage = getPerPage();
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    updateUrlParams({ page: totalPages > 1 ? String(currentPage) : null });

    if (totalPages <= 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = '';

    const windowSize = 2;
    const start = Math.max(1, currentPage - windowSize);
    const end = Math.min(totalPages, currentPage + windowSize);

    let html = '';
    html += `<button type="button" class="usermod-page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

    if (start > 1) {
        html += `<button type="button" class="usermod-page-btn" data-page="1">1</button>`;
        if (start > 2) {
            html += `<span class="usermod-page-ellipsis">…</span>`;
        }
    }

    for (let p = start; p <= end; p++) {
        html += `<button type="button" class="usermod-page-btn${p === currentPage ? ' is-active' : ''}" data-page="${p}" aria-current="${p === currentPage ? 'page' : 'false'}">${p}</button>`;
    }

    if (end < totalPages) {
        if (end < totalPages - 1) {
            html += `<span class="usermod-page-ellipsis">…</span>`;
        }
        html += `<button type="button" class="usermod-page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button type="button" class="usermod-page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
    container.innerHTML = html;
}

function applyPagination() {
    const perPage = getPerPage();
    const visible = getVisibleItems();

    const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = visible.length === 0 ? 0 : ((currentPage - 1) * perPage) + 1;
    const endIndex = visible.length === 0 ? 0 : Math.min(currentPage * perPage, visible.length);

    visible.forEach((item, idx) => {
        const pageIdx = Math.floor(idx / perPage) + 1;
        setPaged(item, pageIdx !== currentPage);
        applyVisibility(item);
    });

    getItems().forEach(item => {
        if (item.dataset.usermodFiltered === 'true') {
            setPaged(item, false);
            applyVisibility(item);
        }
    });

    renderPagination(visible.length);
    updateResultsCount(visible.length, startIndex, endIndex, totalPages);
}

function initPagination() {
    const container = document.getElementById('usermod-pagination');
    if (!container || container.dataset.initialized) return;
    container.dataset.initialized = 'true';

    container.addEventListener('click', function(e) {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        const page = Number(btn.dataset.page);
        if (!Number.isFinite(page)) return;
        currentPage = page;
        applyPagination();
    });
}

function getControlValues() {
    const tagFilter = document.querySelector('select[name="tag-filter"]');
    const orderSelect = document.querySelector('select[name="usermod-order"]');
    const usernameFilter = document.querySelector('select[name="username-filter"]');

    const filter = tagFilter ? tagFilter.value : 'all';
    const sort = orderSelect ? orderSelect.value : (typeof defaultSort !== 'undefined' ? defaultSort : 'popularity');
    const order = getCurrentSortOrder();
    const username = usernameFilter ? usernameFilter.value : 'all';

    return { filter, sort, order, username };
}

function applyUrlParamsToControls() {
    const params = getUrlParams();
    const tagFilter = document.querySelector('select[name="tag-filter"]');
    const orderSelect = document.querySelector('select[name="usermod-order"]');
    const usernameFilter = document.querySelector('select[name="username-filter"]');
    const ascIcon = document.getElementById('usermods-ascending');
    const descIcon = document.getElementById('usermods-descending');
    
    if (!tagFilter || !orderSelect) return;
    
    // Apply tag filter
    if (params.filter) {
        tagFilter.value = params.filter;
    }
    
    // Apply sort field
    if (params.sort) {
        orderSelect.value = params.sort;
    }
    
    // Determine sort order: use URL param if provided, otherwise use data-sort from selected option
    const selectedOption = orderSelect.selectedOptions[0];
    const defaultOrder = (selectedOption && selectedOption.dataset.sort) || 'ascending';
    const sortOrder = params.order || defaultOrder;
    
    // Apply sort order icons
    if (ascIcon && descIcon) {
        if (sortOrder === 'ascending') {
            ascIcon.style.display = '';
            descIcon.style.display = 'none';
        } else {
            ascIcon.style.display = 'none';
            descIcon.style.display = '';
        }
    }
    
    // Show/hide and apply username filter
    if (usernameFilter) {
        if (params.sort === 'username') {
            usernameFilter.style.display = '';
            if (params.username) {
                // Case-insensitive match for username URL parameter
                const matchingOption = Array.from(usernameFilter.options).find(
                    opt => opt.value.toLowerCase() === params.username.toLowerCase()
                );
                if (matchingOption) {
                    usernameFilter.value = matchingOption.value;
                }
            }
        } else {
            usernameFilter.style.display = 'none';
        }
    }
    
    // Trigger the actual filtering/sorting
    const urlPage = Number(params.page);
    currentPage = Number.isFinite(urlPage) && urlPage > 0 ? Math.floor(urlPage) : 1;
    applyFiltersAndSort(params.filter, params.sort, sortOrder, params.username, false);
}

function applyFiltersAndSort(filterValue, sortValue, sortOrder, usernameValue, resetPage) {
    const grid = document.querySelector('.grid.cards > ul');
    if (!grid) return;
    
    const items = Array.from(grid.children);
    
    // Apply tag filter
    const filterBy = (filterValue || 'all').toLowerCase();
    items.forEach(item => {
        const heading = item.querySelector('h3');
        if (!heading) return;
        
        if (filterBy === 'all') {
            setFiltered(item, false);
            applyVisibility(item);
        } else {
            let hasTag = false;
            for (const attr of heading.attributes) {
                if (!attr.name.startsWith('data-tag-')) continue;
                const wildcard = attr.name.substring('data-tag-'.length).toLowerCase();
                if (wildcard === filterBy) {
                    hasTag = true;
                    break;
                }
            }
            setFiltered(item, !hasTag);
            applyVisibility(item);
        }
    });
    
    // Apply username filter (only if sorting by username)
    if (sortValue === 'username' && usernameValue && usernameValue !== 'all') {
        items.forEach(item => {
            const heading = item.querySelector('h3');
            if (!heading) return;
            const username = heading.dataset.username || '';
            if (username.toLowerCase() !== usernameValue.toLowerCase()) {
                setFiltered(item, true);
                applyVisibility(item);
            }
        });
    }
    
    // Apply sorting
    const sortBy = sortValue || (typeof defaultSort !== 'undefined' ? defaultSort : 'popularity');
    const sortDir = sortOrder || (typeof defaultSortOrder !== 'undefined' ? defaultSortOrder : 'ascending');
    
    items.sort((a, b) => {
        const aHeading = a.querySelector('h3');
        const bHeading = b.querySelector('h3');
        if (!aHeading || !bHeading) return 0;
        
        const aVal = aHeading.dataset[sortBy] || '';
        const bVal = bHeading.dataset[sortBy] || '';
        
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        const bothNumeric = !isNaN(aNum) && !isNaN(bNum) && aVal !== '' && bVal !== '';
        
        if (bothNumeric) {
            return sortDir === 'ascending' ? aNum - bNum : bNum - aNum;
        }
        
        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDir === 'ascending'
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
    });
    
    items.forEach(item => grid.appendChild(item));

    if (resetPage !== false) {
        currentPage = 1;
    }
    applyPagination();
}

// Sorting
document.addEventListener('click', function(e) {
    if (!isUsermodsPage()) return;
    
    const sortButton = e.target.closest('#usermod-sort');
    if (!sortButton) return;
    
    e.preventDefault();

    // Flip the ascending/descending icons
    const ascIcon = document.getElementById('usermods-ascending');
    const descIcon = document.getElementById('usermods-descending');
    if (ascIcon && descIcon) {
        if (ascIcon.style.display === 'none') {
            ascIcon.style.display = '';
            descIcon.style.display = 'none';
        } else {
            ascIcon.style.display = 'none';
            descIcon.style.display = '';
        }
    }

    const { filter, sort, order, username } = getControlValues();
    applyFiltersAndSort(filter, sort, order, username);
    
    // Update URL with new order
    updateUrlParams({ order: getCurrentSortOrder() });
});

// Filtering
document.addEventListener('change', function(e) {
    if (!isUsermodsPage()) return;
    
    if (e.target.name === 'tag-filter') {
        const { filter, sort, order, username } = getControlValues();
        applyFiltersAndSort(filter, sort, order, username);
        
        // Update URL
        updateUrlParams({ filter: e.target.value.toLowerCase() });
    }

    if (e.target.name === 'username-filter') {
        const { filter, sort, order, username } = getControlValues();
        applyFiltersAndSort(filter, sort, order, username);
        
        // Update URL
        updateUrlParams({ username: e.target.value });
    }

    if (e.target.name === 'usermod-order') {
        const select = e.target;
        const sortBy = select.value;

        // Show/hide username filter based on sort selection
        const usernameFilter = document.querySelector('select[name="username-filter"]');
        if (usernameFilter) {
            if (sortBy === 'username') {
                usernameFilter.style.display = '';
            } else {
                usernameFilter.style.display = 'none';
                usernameFilter.value = 'all'; // Reset filter when hidden
            }
        }

        const selectedOption = select.selectedOptions[0];
        const sortDir = (selectedOption && selectedOption.dataset.sort) || 'ascending';

        const ascIcon = document.getElementById('usermods-ascending');
        const descIcon = document.getElementById('usermods-descending');

        if (ascIcon && descIcon) {
            if (sortDir === 'ascending') {
                ascIcon.style.display = '';
                descIcon.style.display = 'none';
            } else {
                ascIcon.style.display = 'none';
                descIcon.style.display = '';
            }
        }

        const { filter, username } = getControlValues();
        applyFiltersAndSort(filter, sortBy, sortDir, username);
        
        // Update URL with sort field and order
        updateUrlParams({ 
            sort: sortBy,
            order: sortDir
        });
    }
});

// Initialize URL params on page load
function initUrlParams() {
    const grid = document.querySelector('.grid.cards > ul');
    if (!grid || grid.dataset.urlParamsInitialized) return;
    grid.dataset.urlParamsInitialized = 'true';

    initPagination();
    getItems().forEach(item => {
        if (typeof item.dataset.usermodFiltered === 'undefined') {
            setFiltered(item, false);
        }
        if (typeof item.dataset.usermodPaged === 'undefined') {
            setPaged(item, false);
        }
        applyVisibility(item);
    });
    
    applyUrlParamsToControls();
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    if (isUsermodsPage()) initUrlParams();
});

// Initialize on MkDocs Material SPA navigation
document.addEventListener('DOMContentSwitch', function() {
    if (isUsermodsPage()) initUrlParams();
});

// Also try the instant loading event
if (typeof document$ !== 'undefined') {
    document$.subscribe(function() {
        if (isUsermodsPage()) initUrlParams();
    });
}

// Modal
function initUsermodModal() {
  var modal = document.getElementById('usermod-modal');
  if (!modal || modal.dataset.initialized) return;
  modal.dataset.initialized = 'true';

  var backdrop = modal.querySelector('.usermod-modal-backdrop');
  var closeBtn = modal.querySelector('.usermod-modal-close');

  function openModal(modData) {
    document.getElementById('usermod-modal-title').textContent = modData.name;
    document.getElementById('usermod-modal-author').textContent = modData.username;
    document.getElementById('usermod-modal-views').textContent = modData.views_formatted || modData.views;
    document.getElementById('usermod-modal-downloads').textContent = modData.downloads_formatted || modData.downloads;
    document.getElementById('usermod-modal-created').textContent = String(modData.created_date).split('T')[0];

    document.getElementById('usermod-modal-readme').innerHTML = marked.parse(modData.readme || '');

    // Populate image carousel
    populateCarousel(modData.images || []);

    // Update GitHub button
    var githubBtn = document.getElementById('usermod-modal-github');
    if (modData.url) {
      githubBtn.href = modData.url;
      githubBtn.style.display = '';
    } else {
      githubBtn.style.display = 'none';
    }

    // Update Download button
    var downloadBtn = document.getElementById('usermod-modal-download');
    if (modData.url) {
      downloadBtn.href = 'https://download-directory.github.io/?url=' + encodeURIComponent(modData.url);
      downloadBtn.style.display = '';
    } else {
      downloadBtn.style.display = 'none';
    }

    // Helper to extract filename from URL
    function getFileName(url) {
      var decoded = decodeURIComponent(url);
      return decoded.split('/').pop();
    }

    // Helper to populate file list
    function populateFileList(sectionId, files, iconSvg, trackingData) {
      var section = document.getElementById(sectionId);
      var list = section.querySelector('.usermod-files-list');
      list.innerHTML = '';

      if (!files || files.length === 0) {
        section.style.display = 'none';
        return;
      }

      section.style.display = '';
      files.forEach(function(fileUrl) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'usermod-file-link';
        link.innerHTML = iconSvg + ' ' + getFileName(fileUrl);
        link.addEventListener('click', function() {
          trackUsermodDownload(trackingData);
        });
        li.appendChild(link);
        list.appendChild(li);
      });
    }

    // Tracking data for downloads
    var trackingData = {
      name: modData.name,
      username: modData.username,
      repository: modData.repository
    };

    // Populate CAD files
    var cadIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>';
    populateFileList('usermod-modal-cads', modData.cads, cadIcon, trackingData);

    // Populate STL files
    var stlIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="M12.5 2h-9a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-7-7zm5 18h-14V4h8v6h6v10zm-7-9l3 3-3 3-1-1 2-2-2-2 1-1z"/></svg>';
    populateFileList('usermod-modal-stls', modData.stls, stlIcon, trackingData);

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Reset scroll positions after modal is visible
    var modalContent = modal.querySelector('.usermod-modal-content');
    var bodyEl = document.getElementById('usermod-modal-body');
    var filesEl = document.getElementById('usermod-modal-files');
    if (modalContent) modalContent.scrollTop = 0;
    if (bodyEl) bodyEl.scrollTop = 0;
    if (filesEl) filesEl.scrollTop = 0;
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // Image Carousel
  var carouselImages = [];
  var carouselIndex = 0;

  function populateCarousel(images) {
    var carousel = document.getElementById('usermod-modal-carousel');
    var imagesContainer = carousel.querySelector('.usermod-carousel-images');
    var thumbsContainer = carousel.querySelector('.usermod-carousel-thumbs');

    imagesContainer.innerHTML = '';
    thumbsContainer.innerHTML = '';
    carouselImages = images;
    carouselIndex = 0;

    if (!images || images.length === 0) {
      carousel.style.display = 'none';
      return;
    }

    carousel.style.display = '';

    images.forEach(function(imgUrl, idx) {
      // Main carousel image
      var img = document.createElement('img');
      img.src = imgUrl;
      img.alt = 'Usermod image ' + (idx + 1);
      img.className = 'usermod-carousel-img' + (idx === 0 ? ' active' : '');
      img.addEventListener('click', function() {
        openLightbox(carouselIndex);  // Use current index, not creation index
      });
      imagesContainer.appendChild(img);

      // Thumbnail
      var thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.alt = 'Thumbnail ' + (idx + 1);
      thumb.className = 'usermod-carousel-thumb' + (idx === 0 ? ' active' : '');
      thumb.addEventListener('click', function() {
        goToSlide(idx);
      });
      thumbsContainer.appendChild(thumb);
    });
  }

  function goToSlide(idx) {
    var carousel = document.getElementById('usermod-modal-carousel');
    var imgs = carousel.querySelectorAll('.usermod-carousel-img');
    var thumbs = carousel.querySelectorAll('.usermod-carousel-thumb');

    imgs[carouselIndex].classList.remove('active');
    thumbs[carouselIndex].classList.remove('active');

    carouselIndex = idx;
    if (carouselIndex < 0) carouselIndex = imgs.length - 1;
    if (carouselIndex >= imgs.length) carouselIndex = 0;

    imgs[carouselIndex].classList.add('active');
    thumbs[carouselIndex].classList.add('active');
  }

  // Carousel navigation
  var carouselEl = document.getElementById('usermod-modal-carousel');
  if (carouselEl) {
    carouselEl.querySelector('.usermod-carousel-prev').addEventListener('click', function() {
      goToSlide(carouselIndex - 1);
    });
    carouselEl.querySelector('.usermod-carousel-next').addEventListener('click', function() {
      goToSlide(carouselIndex + 1);
    });
  }

  // Lightbox
  var lightbox = document.getElementById('usermod-lightbox');
  var lightboxImg = lightbox ? lightbox.querySelector('.usermod-lightbox-img') : null;
  var lightboxIndex = 0;

  function openLightbox(idx) {
    if (!lightbox || !carouselImages.length) return;
    lightboxIndex = idx;
    lightboxImg.src = carouselImages[idx];
    lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    if (lightbox) lightbox.classList.remove('is-open');
  }

  function lightboxNav(dir) {
    lightboxIndex += dir;
    if (lightboxIndex < 0) lightboxIndex = carouselImages.length - 1;
    if (lightboxIndex >= carouselImages.length) lightboxIndex = 0;
    lightboxImg.src = carouselImages[lightboxIndex];
  }

  if (lightbox) {
    lightbox.querySelector('.usermod-lightbox-backdrop').addEventListener('click', closeLightbox);
    lightbox.querySelector('.usermod-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.usermod-lightbox-prev').addEventListener('click', function() {
      lightboxNav(-1);
    });
    lightbox.querySelector('.usermod-lightbox-next').addEventListener('click', function() {
      lightboxNav(1);
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    // Only handle keyboard events if modal or lightbox is open
    var modalOpen = modal && modal.classList.contains('is-open');
    var lightboxOpen = lightbox && lightbox.classList.contains('is-open');
    
    if (!modalOpen && !lightboxOpen) return;
    
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (lightboxOpen) {
        closeLightbox();
      } else if (modalOpen) {
        closeModal();
      }
    }
    // Arrow keys for lightbox navigation
    if (lightboxOpen) {
      if (e.key === 'ArrowLeft') lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
    }
  });

  // Event delegation: handle clicks anywhere inside the card grid
  var grid = document.querySelector('.grid.cards');
  if (!grid) return;

  grid.addEventListener('click', function (e) {
    // Find the nearest card (list item)
    var card = e.target.closest('li');
    if (!card || !grid.contains(card)) return;

    // The hidden heading inside the card holds the data-* attributes
    var el = card.querySelector('[data-index]');
    if (!el) return;

    var idx = Number(el.getAttribute('data-index'));
    var mod = usermods[idx];

    // Track the usermod view
    trackUsermodView({
      name: mod['name'] || '',
      username: mod['username'] || '',
      repository: mod['repository'] || ''
    });

    openModal({
      name: mod['name'] || '',
      username: mod['username'] || '',
      repository: mod['repository'] || '',
      views: mod['views_formatted'] !== undefined ? mod['views_formatted'] : 0,
      downloads: mod['downloads_formatted'] !== undefined ? mod['downloads_formatted'] : 0,
      created_date: mod['created_date'] || '',
      images: mod['images'] || [],
      readme: mod['readme_data'] || '',
      url: mod['url'] || '',
      stls: mod['stls'] || [],
      cads: mod['cads'] || []
    });
  });
}

// Initialize on DOMContentLoaded (first page load)
document.addEventListener('DOMContentLoaded', function() {
    if (isUsermodsPage()) initUsermodModal();
});

// Initialize on MkDocs Material SPA navigation
document.addEventListener('DOMContentSwitch', function() {
    if (isUsermodsPage()) initUsermodModal();
});

// Also try the instant loading event
if (typeof document$ !== 'undefined') {
  document$.subscribe(function() {
      if (isUsermodsPage()) initUsermodModal();
  });
}

// Analytics - Track usermod card views
var VIEWED_MODS_KEY = 'usermod_viewed';

function getViewedMods() {
  try {
    var stored = localStorage.getItem(VIEWED_MODS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function markModAsViewed(modId) {
  try {
    var viewed = getViewedMods();
    if (viewed.indexOf(modId) === -1) {
      viewed.push(modId);
      localStorage.setItem(VIEWED_MODS_KEY, JSON.stringify(viewed));
    }
  } catch (e) {
    // localStorage not available, ignore
  }
}

function isFirstTimeView(modId) {
  return getViewedMods().indexOf(modId) === -1;
}

function trackUsermodView(mod) {
  // Validate required fields before tracking
  if (!mod || !mod.name || !mod.username || !mod.repository) {
    return;
  }

  // Create a unique identifier for this mod
  var modId = mod.repository + '/' + mod.username + '/' + mod.name;
  var firstTime = isFirstTimeView(modId);

  // Send to Google Analytics via gtag (provided by MkDocs Material)
  if (typeof gtag === 'function') {
    gtag('event', 'usermod_view', {
      'mod_title': mod.name,
      'mod_author': mod.username,
      'mod_repository': mod.repository,
      'first_time_view': firstTime
    });
  }

  // Mark as viewed after tracking
  markModAsViewed(modId);
}

// Analytics - Track usermod file downloads
var DOWNLOADED_MODS_KEY = 'usermod_downloaded';

function getDownloadedMods() {
  try {
    var stored = localStorage.getItem(DOWNLOADED_MODS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function markModAsDownloaded(modId) {
  try {
    var downloaded = getDownloadedMods();
    if (downloaded.indexOf(modId) === -1) {
      downloaded.push(modId);
      localStorage.setItem(DOWNLOADED_MODS_KEY, JSON.stringify(downloaded));
    }
  } catch (e) {
    // localStorage not available, ignore
  }
}

function isFirstTimeDownload(modId) {
  return getDownloadedMods().indexOf(modId) === -1;
}

function trackUsermodDownload(mod) {
  // Validate required fields before tracking
  if (!mod || !mod.name || !mod.username || !mod.repository) {
    return;
  }

  // Create a unique identifier for this mod
  var modId = mod.repository + '/' + mod.username + '/' + mod.name;
  var firstTime = isFirstTimeDownload(modId);

  // Send to Google Analytics via gtag (provided by MkDocs Material)
  if (typeof gtag === 'function') {
    gtag('event', 'usermod_download', {
      'mod_title': mod.name,
      'mod_author': mod.username,
      'mod_repository': mod.repository,
      'first_time_download': firstTime
    });
  }

  // Mark as downloaded after tracking
  markModAsDownloaded(modId);
}
