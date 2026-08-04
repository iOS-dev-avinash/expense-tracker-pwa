/**
 * constants.js
 * Application-wide constants and configuration
 */

export const APP_NAME = 'Expense Tracker';
export const APP_VERSION = '1.0.0';
export const DB_NAME = 'ExpenseTrackerDB';
export const DB_VERSION = 1;

/** Currency symbol (localizable) */
export const CURRENCY_SYMBOL = '₹';

/** Transaction types */
export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME:  'income',
};

/** Payment methods */
export const PAYMENT_METHODS = [
  { id: 'cash',        label: 'Cash',         icon: '💵' },
  { id: 'upi',         label: 'UPI',          icon: '📱' },
  { id: 'bank',        label: 'Bank Transfer', icon: '🏦' },
  { id: 'credit_card', label: 'Credit Card',  icon: '💳' },
  { id: 'debit_card',  label: 'Debit Card',   icon: '💳' },
  { id: 'net_banking', label: 'Net Banking',  icon: '🌐' },
  { id: 'auto_debit',  label: 'Auto Debit',   icon: '🔄' },
  { id: 'sodexo',      label: 'Sodexo',       icon: '🍽️' },
  { id: 'meal_card',   label: 'Meal Card',    icon: '🥗' },
  { id: 'wallet',      label: 'Wallet',       icon: '👛' },
  { id: 'other',       label: 'Other',        icon: '💰' },
];

/** Default categories with subcategories */
export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    name: 'Food & Dining',
    icon: '🍔',
    color: '#f97316',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Restaurants', 'Groceries', 'Takeaway', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Coffee', 'Sweets', 'Bakery'],
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚗',
    color: '#3b82f6',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Cab/Auto', 'Bus', 'Metro', 'Train', 'Flight', 'Parking', 'Toll', 'Bike Ride'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#ec4899',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Clothing', 'Electronics', 'Home Appliances', 'Books', 'Accessories', 'Gifts', 'Furniture', 'Sports'],
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    icon: '📄',
    color: '#8b5cf6',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Electricity', 'Water', 'Internet', 'Gas', 'Cable TV', 'Phone Bill', 'Subscription', 'OTT'],
  },
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    color: '#14b8a6',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Rent', 'Maintenance', 'Repairs', 'Security', 'Housekeeping', 'Furniture', 'Renovation'],
  },
  {
    id: 'medical',
    name: 'Medical & Health',
    icon: '🏥',
    color: '#ef4444',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Doctor', 'Medicine', 'Lab Tests', 'Hospital', 'Pharmacy', 'Dental', 'Eye Care', 'Gym', 'Yoga'],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#f59e0b',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Movies', 'Events', 'Gaming', 'Sports Events', 'Concerts', 'Parties', 'Hobbies', 'Reading'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#06b6d4',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Hotel', 'Flight', 'Train', 'Bus', 'Tours', 'Sightseeing', 'Visa', 'Travel Insurance'],
  },
  {
    id: 'kids',
    name: 'Kids',
    icon: '👶',
    color: '#a855f7',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['School Fees', 'Tuition', 'Toys', 'Clothing', 'Activities', 'Daycare', 'Books', 'Events'],
  },
  {
    id: 'education',
    name: 'Education',
    icon: '📚',
    color: '#6366f1',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Course Fees', 'Books', 'Online Courses', 'Coaching', 'Exam Fees', 'Stationery', 'Software'],
  },
  {
    id: 'fuel',
    name: 'Fuel',
    icon: '⛽',
    color: '#f97316',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Petrol', 'Diesel', 'CNG', 'EV Charging'],
  },
  {
    id: 'recharge',
    name: 'Recharge',
    icon: '📡',
    color: '#84cc16',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Mobile Recharge', 'DTH Recharge', 'Data Pack', 'Roaming Pack'],
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: '📦',
    color: '#64748b',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Other Expense', 'Charity', 'Donation', 'Personal Care', 'Pet Care'],
  },
  {
    id: 'salary',
    name: 'Salary',
    icon: '💼',
    color: '#10b981',
    type: TRANSACTION_TYPES.INCOME,
    subcategories: ['Monthly Salary', 'Bonus', 'Commission', 'Overtime', 'Incentive', 'Increment'],
  },
  {
    id: 'investment',
    name: 'Investment',
    icon: '📈',
    color: '#22c55e',
    type: TRANSACTION_TYPES.INCOME,
    subcategories: ['Stocks', 'Mutual Fund', 'SIP Returns', 'Crypto', 'Fixed Deposit', 'PPF', 'NPS', 'Gold'],
  },
  {
    id: 'loan',
    name: 'Loan',
    icon: '🏦',
    color: '#f43f5e',
    type: TRANSACTION_TYPES.INCOME,
    subcategories: ['Personal Loan', 'Home Loan', 'Car Loan', 'Education Loan', 'Credit Line', 'EMI Collection'],
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    color: '#0ea5e9',
    type: TRANSACTION_TYPES.EXPENSE,
    subcategories: ['Life Insurance', 'Health Insurance', 'Vehicle Insurance', 'Home Insurance', 'Term Insurance'],
  },
];

/** Quick Date Filter Options */
export const DATE_FILTERS = [
  { id: 'today',      label: 'Today' },
  { id: 'yesterday',  label: 'Yesterday' },
  { id: 'this_week',  label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: '3 Months' },
  { id: 'this_year',  label: 'This Year' },
  { id: 'custom',     label: 'Custom' },
];

/** Sort options for transactions */
export const SORT_OPTIONS = [
  { id: 'date_desc',   label: 'Date: Newest First' },
  { id: 'date_asc',    label: 'Date: Oldest First' },
  { id: 'amount_desc', label: 'Amount: Highest' },
  { id: 'amount_asc',  label: 'Amount: Lowest' },
];

/** Chart colors */
export const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f59e0b', '#06b6d4',
  '#a855f7', '#6366f1', '#ef4444', '#10b981',
  '#f43f5e', '#0ea5e9', '#84cc16', '#64748b',
];

/** Toast durations */
export const TOAST_DURATION = 3000;

/** Max items in recent transactions (dashboard) */
export const RECENT_TX_LIMIT = 10;

/** Routes */
export const ROUTES = {
  DASHBOARD:    'dashboard',
  TRANSACTIONS: 'transactions',
  CATEGORIES:   'categories',
  REPORTS:      'reports',
  SETTINGS:     'settings',
};

/** Recurring frequencies */
export const RECURRING_FREQUENCIES = [
  { id: 'daily',    label: 'Daily' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'monthly',  label: 'Monthly' },
  { id: 'yearly',   label: 'Yearly' },
];

/** Budget alert thresholds */
export const BUDGET_ALERT_THRESHOLDS = {
  WARNING: 0.8,  // 80%
  DANGER:  1.0,  // 100%
};

/** Service Worker Cache Name */
export const SW_CACHE_NAME = 'expense-tracker-v1';
