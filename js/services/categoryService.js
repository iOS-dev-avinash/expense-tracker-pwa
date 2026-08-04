/**
 * categoryService.js
 * Business logic for categories
 */

import { CategoryRepository } from '../db/repositories.js';
import { createCategory, validateCategory } from '../db/models.js';
import { DEFAULT_CATEGORIES } from '../utils/constants.js';

export const CategoryService = {
  /** Initialize default categories if DB is empty */
  async initDefaults() {
    const count = await CategoryRepository.count();
    if (count === 0) {
      const defaults = DEFAULT_CATEGORIES.map(cat =>
        createCategory({ ...cat, isDefault: true })
      );
      await CategoryRepository.bulkAdd(defaults);
    }
  },

  /** Get all categories */
  async getAll() {
    return CategoryRepository.getAll();
  },

  /** Get a category by ID */
  async getById(id) {
    return CategoryRepository.getById(id);
  },

  /** Get categories by type */
  async getByType(type) {
    const all = await CategoryRepository.getAll();
    return all.filter(c => c.type === type || !c.type);
  },

  /** Get expense categories */
  async getExpenseCategories() {
    return this.getByType('expense');
  },

  /** Get income categories */
  async getIncomeCategories() {
    return this.getByType('income');
  },

  /** Add a new category */
  async add(data) {
    const { valid, errors } = validateCategory(data);
    if (!valid) throw new Error(errors.join('; '));
    const category = createCategory(data);
    return CategoryRepository.add(category);
  },

  /** Update a category */
  async update(id, data) {
    const existing = await CategoryRepository.getById(id);
    if (!existing) throw new Error('Category not found');

    const merged = { ...existing, ...data, id };
    const { valid, errors } = validateCategory(merged);
    if (!valid) throw new Error(errors.join('; '));

    return CategoryRepository.update(merged);
  },

  /** Delete a category */
  async delete(id) {
    const category = await CategoryRepository.getById(id);
    if (!category) throw new Error('Category not found');
    return CategoryRepository.delete(id);
  },

  /** Add a subcategory */
  async addSubcategory(categoryId, subcategoryName) {
    const category = await CategoryRepository.getById(categoryId);
    if (!category) throw new Error('Category not found');

    if (!subcategoryName || !subcategoryName.trim()) {
      throw new Error('Subcategory name is required');
    }

    if ((category.subcategories || []).includes(subcategoryName.trim())) {
      throw new Error('Subcategory already exists');
    }

    category.subcategories = [...(category.subcategories || []), subcategoryName.trim()];
    return CategoryRepository.update(category);
  },

  /** Remove a subcategory */
  async removeSubcategory(categoryId, subcategoryName) {
    const category = await CategoryRepository.getById(categoryId);
    if (!category) throw new Error('Category not found');

    category.subcategories = (category.subcategories || []).filter(s => s !== subcategoryName);
    return CategoryRepository.update(category);
  },

  /** Get a map of categoryId -> category for quick lookup */
  async getCategoryMap() {
    const all = await CategoryRepository.getAll();
    const map = {};
    for (const cat of all) map[cat.id] = cat;
    return map;
  },

  /** Bulk import categories */
  async importJSON(categories, mode = 'merge') {
    if (mode === 'replace') {
      await CategoryRepository.clearAll();
    }
    const enriched = categories.map(c => createCategory(c));
    return CategoryRepository.bulkAdd(enriched);
  },

  /** Export categories as JSON */
  async exportJSON() {
    return CategoryRepository.getAll();
  },
};
