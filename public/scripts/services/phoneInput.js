import countryCodesList from 'country-codes-list';

export function initializePhoneInput() {
  const countrySelector = document.querySelector('.country-selector-header');
  if (!countrySelector) return;

  const countries = countryCodesList.all();

  // DOM elements
  const options = document.querySelector('.country-selector-options');
  const countryList = document.createElement('div');
  countryList.className = 'divide-y divide-gray-100';
  
  // Create search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'sticky top-0 bg-white border-b border-gray-100';
  searchContainer.innerHTML = `
    <input type="text" placeholder="Search countries..." 
          class="search-country w-full p-2 text-sm bg-transparent focus:outline-none placeholder-gray-400"/>
  `;
  
  options.innerHTML = '';
  options.appendChild(searchContainer);
  options.appendChild(countryList);

  // Populate country list (hidden country names)
  countries.forEach(country => {
    const option = document.createElement('div');
    option.className = 'country-option flex items-center p-2 hover:bg-gray-50 cursor-pointer';
    option.innerHTML = `
      <span class="country-flag w-6">${country.flag}</span>
      <span class="country-code text-sm text-gray-500 ml-2">+${country.countryCallingCode}</span>
    `;

    // Store country name in dataset for search
    option.dataset.countryName = country.countryNameEn.toLowerCase();

    option.addEventListener('click', () => {
      document.querySelector('.selected-flag').textContent = country.flag;
      document.querySelector('.selected-code').textContent = `+${country.countryCallingCode}`;
      document.getElementById('country-code').value = `+${country.countryCallingCode}`;
      options.classList.add('hidden');
      searchContainer.querySelector('input').value = '';
    });
    
    countryList.appendChild(option);
  });

  // Search functionality using hidden country names
  const searchInput = document.querySelector('.search-country');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const countryOptions = countryList.querySelectorAll('.country-option');
    
    countryOptions.forEach(option => {
      const code = option.querySelector('.country-code').textContent.toLowerCase();
      const name = option.dataset.countryName;
      option.classList.toggle('hidden', !(name.includes(searchTerm) || code.includes(searchTerm)));
    });
  });

  // Rest of the code remains the same
  const header = document.querySelector('.country-selector-header');

  header.addEventListener('click', (e) => {
    e.stopPropagation();
    options.classList.toggle('hidden');
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.phone-input-group')) {
      options.classList.add('hidden');
    }
  });
}