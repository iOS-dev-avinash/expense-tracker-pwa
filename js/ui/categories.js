/**
 * categories.js
 * Category management view
 */

import { CategoryService } from '../services/categoryService.js';
import { showModal, showConfirm, showPrompt } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { escapeHtml, addRippleListeners } from '../utils/helpers.js';
import { TRANSACTION_TYPES } from '../utils/constants.js';

const CATEGORY_ICONS = ['🍔','🚗','🛍️','📄','🏠','🏥','🎬','✈️','👶','📚','📈','💼','🏦','🛡️','📡','⛽','📦','🎵','🎮','🐾','💇','🌿','🍕','☕','🎁','📱','💻','🔧','🏋️','🎯'];

const CATEGORY_COLORS = [
  '#f97316','#3b82f6','#ec4899','#8b5cf6','#14b8a6',
  '#ef4444','#f59e0b','#06b6d4','#a855f7','#6366f1',
  '#22c55e','#10b981','#f43f5e','#0ea5e9','#84cc16','#64748b',
];

export async function renderCategories() {
  const container = document.getElementById('page-categories');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Categories</h1>
        <div class="page-subtitle" id="cat-count">Loading...</div>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" id="add-category-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>
    </div>

    <!-- Type Filter -->
    <div class="filter-scroll" id="cat-type-filter">
      <button class="filter-chip active" data-cat-type="all">All</button>
      <button class="filter-chip" data-cat-type="expense">Expense</button>
      <button class="filter-chip" data-cat-type="income">Income</button>
    </div>

    <div id="cat-list" style="padding:var(--space-4)">
      ${[1,2,3,4,5].map(() => `
        <div class="card" style="margin-bottom:var(--space-3);padding:var(--space-4)">
          <div style="display:flex;gap:var(--space-3)">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex:1">
              <div class="skeleton skeleton-title" style="width:50%;margin-bottom:6px"></div>
              <div class="skeleton skeleton-text" style="width:70%"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="height:var(--space-16)"></div>
  `;

  document.getElementById('add-category-btn')?.addEventListener('click', () => openCategoryModal());
  addRippleListeners(container);

  let currentTypeFilter = 'all';

  document.getElementById('cat-type-filter')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat-type]');
    if (!chip) return;
    document.querySelectorAll('#cat-type-filter .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTypeFilter = chip.dataset.catType;
    loadCategories(currentTypeFilter);
  });

  await loadCategories('all');
}

async function loadCategories(typeFilter = 'all') {
  const listEl = document.getElementById('cat-list');
  const countEl = document.getElementById('cat-count');
  if (!listEl) return;

  try {
    let cats = await CategoryService.getAll();
    if (typeFilter !== 'all') {
      cats = cats.filter(c => c.type === typeFilter);
    }

    if (countEl) countEl.textContent = `${cats.length} categories`;

    if (!cats.length) {
      listEl.innerHTML = `
        <div style="background:var(--bg-card);border-radius:var(--border-radius-lg);border:1px solid var(--border-color)">
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div class="empty-state-title">No categories</div>
            <p class="empty-state-text">Add your first custom category</p>
          </div>
        </div>
      `;
      return;
    }

    // Group by type
    const expCats = cats.filter(c => c.type === 'expense' || !c.type);
    const incCats = cats.filter(c => c.type === 'income');

    let html = '';

    if (typeFilter === 'all' || typeFilter === 'expense') {
      if (expCats.length) {
        html += `<div class="settings-section-label">Expense Categories</div>`;
        html += `<div class="settings-list" style="margin-bottom:var(--space-4)">`;
        html += expCats.map(cat => renderCategoryItem(cat)).join('');
        html += `</div>`;
      }
    }

    if (typeFilter === 'all' || typeFilter === 'income') {
      if (incCats.length) {
        html += `<div class="settings-section-label">Income Categories</div>`;
        html += `<div class="settings-list" style="margin-bottom:var(--space-4)">`;
        html += incCats.map(cat => renderCategoryItem(cat)).join('');
        html += `</div>`;
      }
    }

    listEl.innerHTML = html;

    // Click handlers
    listEl.querySelectorAll('[data-cat-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.catId;
        const cat = cats.find(c => c.id === id);
        if (cat) openCategoryDetail(cat);
      });
    });

    listEl.querySelectorAll('[data-edit-cat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.editCat;
        const cat = cats.find(c => c.id === id);
        if (cat) openCategoryModal(cat);
      });
    });

    listEl.querySelectorAll('[data-delete-cat]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteCat;
        const cat = cats.find(c => c.id === id);
        if (!cat) return;

        const confirmed = await showConfirm({
          title: 'Delete Category',
          message: `Delete "${cat.name}"? Existing transactions won't be affected.`,
          confirmLabel: 'Delete',
          dangerous: true,
        });

        if (confirmed) {
          try {
            await CategoryService.delete(id);
            Toast.success(`"${cat.name}" deleted`);
            await loadCategories(typeFilter);
          } catch (err) {
            Toast.error(err.message);
          }
        }
      });
    });

    addRippleListeners(listEl);
  } catch (err) {
    console.error('Load categories error:', err);
    Toast.error('Failed to load categories');
  }
}

function renderCategoryItem(cat) {
  return `
    <div class="category-list-item" data-cat-id="${cat.id}" tabindex="0" role="button" aria-label="${escapeHtml(cat.name)}">
      <div class="category-icon" style="background:${cat.color}20;font-size:1.3rem">
        ${cat.icon}
      </div>
      <div class="category-list-item-name">
        ${escapeHtml(cat.name)}
        ${cat.isDefault ? '<span class="badge badge-success" style="margin-left:6px;font-size:0.55rem">Default</span>' : ''}
      </div>
      <div style="font-size:0.75rem;color:var(--text-tertiary);margin-right:var(--space-2)">
        ${(cat.subcategories || []).length} sub
      </div>
      <div class="category-actions">
        <button class="category-action-btn" data-edit-cat="${cat.id}" aria-label="Edit ${escapeHtml(cat.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        ${!cat.isDefault ? `
          <button class="category-action-btn danger" data-delete-cat="${cat.id}" aria-label="Delete ${escapeHtml(cat.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function openCategoryDetail(cat) {
  const subs = cat.subcategories || [];

  const content = `
    <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-6)">
      <div class="category-icon" style="width:56px;height:56px;border-radius:16px;font-size:1.8rem;background:${cat.color}20">
        ${cat.icon}
      </div>
      <div>
        <div style="font-size:1.1rem;font-weight:700">${escapeHtml(cat.name)}</div>
        <div class="badge ${cat.type === 'income' ? 'badge-income' : 'badge-expense'}" style="margin-top:4px">${cat.type || 'expense'}</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <div style="font-size:0.875rem;font-weight:600">Subcategories (${subs.length})</div>
      <button class="btn btn-primary btn-sm" id="add-sub-btn">+ Add</button>
    </div>

    <div id="sub-list" style="background:var(--bg-tertiary);border-radius:var(--border-radius);overflow:hidden">
      ${subs.length ? subs.map(sub => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-color);last-child:border-none" class="sub-item">
          <span style="font-size:0.875rem">${escapeHtml(sub)}</span>
          <button class="category-action-btn danger" data-delete-sub="${escapeHtml(sub)}" aria-label="Delete ${escapeHtml(sub)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      `).join('') : `
        <div style="text-align:center;padding:var(--space-6);color:var(--text-tertiary);font-size:0.875rem">
          No subcategories yet
        </div>
      `}
    </div>
  `;

  const { el, close } = showModal({ title: cat.name, content, variant: 'bottom' });

  el.querySelector('#add-sub-btn')?.addEventListener('click', async () => {
    const name = await showPrompt({ title: 'Add Subcategory', placeholder: 'e.g., Breakfast', label: 'Subcategory name' });
    if (name) {
      try {
        await CategoryService.addSubcategory(cat.id, name);
        Toast.success(`"${name}" added`);
        close();
        const updatedCat = await CategoryService.getById(cat.id);
        if (updatedCat) setTimeout(() => openCategoryDetail(updatedCat), 300);
        await loadCategories('all');
      } catch (err) {
        Toast.error(err.message);
      }
    }
  });

  el.querySelectorAll('[data-delete-sub]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const subName = btn.dataset.deleteSub;
      const ok = await showConfirm({ title: 'Delete Subcategory', message: `Remove "${subName}"?`, confirmLabel: 'Delete', dangerous: true });
      if (ok) {
        await CategoryService.removeSubcategory(cat.id, subName);
        Toast.success('Subcategory removed');
        close();
        const updatedCat = await CategoryService.getById(cat.id);
        if (updatedCat) setTimeout(() => openCategoryDetail(updatedCat), 300);
        await loadCategories('all');
      }
    });
  });
}

function openCategoryModal(existing = null) {
  const isEdit = Boolean(existing);
  let selectedIcon  = existing?.icon  || '📦';
  let selectedColor = existing?.color || '#64748b';

  const content = `
    <!-- Preview -->
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-6)">
      <div id="cat-preview" class="category-icon" style="width:72px;height:72px;border-radius:20px;font-size:2rem;background:${selectedColor}20">
        ${selectedIcon}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label required" for="cat-name">Category Name</label>
      <input type="text" class="form-control" id="cat-name" placeholder="e.g., Food & Dining" value="${escapeHtml(existing?.name || '')}" maxlength="50" />
    </div>

    <div class="form-group">
      <label class="form-label">Type</label>
      <div class="chip-group" id="cat-type-group">
        <button type="button" class="chip expense ${(existing?.type || 'expense') === 'expense' ? 'selected' : ''}" data-cat-type="expense">📉 Expense</button>
        <button type="button" class="chip income ${existing?.type === 'income' ? 'selected' : ''}" data-cat-type="income">📈 Income</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Icon</label>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-1)" id="icon-picker">
        ${CATEGORY_ICONS.map(icon => `
          <button class="icon-pick-btn" data-icon="${icon}" title="${icon}"
            style="width:40px;height:40px;border:2px solid ${icon === selectedIcon ? 'var(--accent-500)' : 'transparent'};border-radius:10px;font-size:1.25rem;background:var(--bg-tertiary);cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center">
            ${icon}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Color</label>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)" id="color-picker">
        ${CATEGORY_COLORS.map(color => `
          <button class="color-pick-btn" data-color="${color}"
            style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid ${color === selectedColor ? 'var(--text-primary)' : 'transparent'};cursor:pointer;transition:all 0.15s">
          </button>
        `).join('')}
      </div>
    </div>

    <div id="cat-error" style="color:var(--red-500);font-size:0.8rem;display:none"></div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="cat-cancel">Cancel</button>
    <button class="btn btn-primary" id="cat-save">${isEdit ? 'Update' : 'Create'}</button>
  `;

  const { el, close } = showModal({ title: isEdit ? 'Edit Category' : 'New Category', content, footer, variant: 'bottom' });

  let catType = existing?.type || 'expense';

  // Type toggle
  el.querySelectorAll('[data-cat-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('[data-cat-type]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      catType = btn.dataset.catType;
    });
  });

  // Icon picker
  el.querySelectorAll('.icon-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.icon-pick-btn').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = 'var(--accent-500)';
      selectedIcon = btn.dataset.icon;
      updatePreview(el, selectedIcon, selectedColor);
    });
  });

  // Color picker
  el.querySelectorAll('.color-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.color-pick-btn').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = 'var(--text-primary)';
      selectedColor = btn.dataset.color;
      updatePreview(el, selectedIcon, selectedColor);
    });
  });

  // Save
  el.querySelector('#cat-save')?.addEventListener('click', async () => {
    const name = el.querySelector('#cat-name')?.value?.trim();
    const errEl = el.querySelector('#cat-error');

    if (!name) {
      if (errEl) { errEl.textContent = 'Category name is required'; errEl.style.display = 'block'; }
      return;
    }

    const saveBtn = el.querySelector('#cat-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const data = { name, icon: selectedIcon, color: selectedColor, type: catType };
      if (isEdit) {
        await CategoryService.update(existing.id, data);
        Toast.success('Category updated');
      } else {
        await CategoryService.add(data);
        Toast.success('Category created');
      }
      close();
      await loadCategories('all');
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Update' : 'Create';
    }
  });

  el.querySelector('#cat-cancel')?.addEventListener('click', () => close());
  addRippleListeners(el);
}

function updatePreview(el, icon, color) {
  const preview = el.querySelector('#cat-preview');
  if (preview) {
    preview.style.background = `${color}20`;
    preview.textContent = icon;
  }
}

export async function refreshCategories() {
  await loadCategories('all');
}
