const REQUIRED_COLUMNS = ['category', 'brand', 'vendor_name', 'email', 'whatsapp'];

const state = {
  vendors: [],
  category: '',
  brand: '',
};

const el = {
  csvFileInput: document.getElementById('csvFileInput'),
  dataStatus: document.getElementById('dataStatus'),
  categoryPage: document.getElementById('categoryPage'),
  brandPage: document.getElementById('brandPage'),
  vendorsPage: document.getElementById('vendorsPage'),
  categorySelect: document.getElementById('categorySelect'),
  brandSelect: document.getElementById('brandSelect'),
  toBrandsBtn: document.getElementById('toBrandsBtn'),
  backToCategoriesBtn: document.getElementById('backToCategoriesBtn'),
  showVendorsBtn: document.getElementById('showVendorsBtn'),
  backToBrandsBtn: document.getElementById('backToBrandsBtn'),
  emailAllCategoryBtn: document.getElementById('emailAllCategoryBtn'),
  vendorList: document.getElementById('vendorList'),
  resultSummary: document.getElementById('resultSummary'),
  vendorItemTemplate: document.getElementById('vendorItemTemplate'),
};

function showPage(page) {
  [el.categoryPage, el.brandPage, el.vendorsPage].forEach((section) =>
    section.classList.remove('is-active'),
  );
  page.classList.add('is-active');
}

function updateCategoryOptions() {
  const categories = [...new Set(state.vendors.map((v) => v.category))].sort();
  el.categorySelect.innerHTML = '<option value="">Select category...</option>';

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    el.categorySelect.appendChild(option);
  });

  el.toBrandsBtn.disabled = true;
}

function updateBrandOptions() {
  const brands = [...new Set(state.vendors.filter((v) => v.category === state.category).map((v) => v.brand))]
    .sort();

  el.brandSelect.innerHTML = '<option value="">Select brand...</option>';

  brands.forEach((brand) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    el.brandSelect.appendChild(option);
  });

  el.showVendorsBtn.disabled = true;
}

function normalizePhoneNumber(rawPhone) {
  return String(rawPhone || '').replace(/[^\d]/g, '');
}

function buildMailToLink(emails, subject, body) {
  const list = emails.filter(Boolean).join(',');
  return `mailto:${list}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function renderVendors() {
  const matches = state.vendors.filter((v) => v.category === state.category && v.brand === state.brand);
  el.vendorList.innerHTML = '';

  el.resultSummary.textContent = `${matches.length} vendor(s) found for ${state.category} / ${state.brand}.`;

  if (!matches.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No vendors found for this selection.';
    empty.className = 'vendor-item';
    el.vendorList.appendChild(empty);
    return;
  }

  matches.forEach((vendor) => {
    const clone = el.vendorItemTemplate.content.cloneNode(true);
    clone.querySelector('.vendor-name').textContent = vendor.vendor_name;
    clone.querySelector('.vendor-meta').textContent = `${vendor.email} • ${vendor.whatsapp}`;

    const whatsappButton = clone.querySelector('[data-role="whatsapp"]');
    const emailButton = clone.querySelector('[data-role="email"]');
    whatsappButton.href = `https://wa.me/${normalizePhoneNumber(vendor.whatsapp)}`;
    emailButton.href = buildMailToLink(
      [vendor.email],
      `Inquiry for ${vendor.brand} in ${vendor.category}`,
      `Hello ${vendor.vendor_name},\n\nI'm interested in your ${vendor.brand} (${vendor.category}) products.`,
    );

    el.vendorList.appendChild(clone);
  });
}

function validateColumns(headers) {
  return REQUIRED_COLUMNS.every((column) => headers.includes(column));
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.');
  }

  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());

  if (!validateColumns(headers)) {
    throw new Error(
      `CSV is missing required columns. Required: ${REQUIRED_COLUMNS.join(', ')}`,
    );
  }

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((item) => item.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

async function loadCsvText(text, sourceName = 'uploaded file') {
  try {
    state.vendors = parseCsv(text);
    state.category = '';
    state.brand = '';
    updateCategoryOptions();
    showPage(el.categoryPage);
    el.dataStatus.textContent = `Loaded ${state.vendors.length} records from ${sourceName}.`;
  } catch (error) {
    el.dataStatus.textContent = error.message;
  }
}

async function tryAutoLoadCsv() {
  try {
    const response = await fetch('vendors.csv');
    if (!response.ok) {
      throw new Error('vendors.csv not found. Upload a CSV file to begin.');
    }
    const text = await response.text();
    await loadCsvText(text, 'vendors.csv');
  } catch (error) {
    el.dataStatus.textContent = error.message;
  }
}

el.csvFileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const text = await file.text();
  await loadCsvText(text, file.name);
});

el.categorySelect.addEventListener('change', () => {
  state.category = el.categorySelect.value;
  el.toBrandsBtn.disabled = !state.category;
});

el.toBrandsBtn.addEventListener('click', () => {
  updateBrandOptions();
  showPage(el.brandPage);
});

el.backToCategoriesBtn.addEventListener('click', () => showPage(el.categoryPage));

el.brandSelect.addEventListener('change', () => {
  state.brand = el.brandSelect.value;
  el.showVendorsBtn.disabled = !state.brand;
});

el.showVendorsBtn.addEventListener('click', () => {
  renderVendors();
  showPage(el.vendorsPage);
});

el.backToBrandsBtn.addEventListener('click', () => showPage(el.brandPage));

el.emailAllCategoryBtn.addEventListener('click', () => {
  const emails = state.vendors
    .filter((v) => v.category === state.category)
    .map((v) => v.email);

  const subject = `Bulk inquiry for ${state.category}`;
  const body = `Hello,\n\nI am interested in vendors for ${state.category}.`;
  window.location.href = buildMailToLink(emails, subject, body);
});

tryAutoLoadCsv();
