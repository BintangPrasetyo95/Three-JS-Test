export function initNavigation(currentPage) {
  const container = document.createElement('div');
  container.className = 'nav-container';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'nav-toggle';
  // Logic for default open state if no localStorage exists
  const defaultOpenPages = ['mobius', 'tesseract'];
  const hasSavedState = localStorage.getItem('navMenuOpen') !== null;
  const isMenuOpen = hasSavedState 
    ? localStorage.getItem('navMenuOpen') === 'true'
    : defaultOpenPages.includes(currentPage);

  toggleBtn.textContent = 'Explore \u25BC';
  
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  if (isMenuOpen) {
    menu.classList.add('open');
    toggleBtn.textContent = 'Close \u25B2';
  }
  
  const pages = [
    { id: 'home', name: 'Landing Page', url: 'index.html' },
    { id: 'mobius', name: 'Möbius Strip', url: 'mobius.html' },
    { id: 'tesseract', name: 'Tesseract (4D)', url: 'tesseract.html' },
    { id: 'rocket', name: 'Rocket Thruster', url: 'rocket.html' },
    { id: 'car', name: 'Formula 1', url: 'car.html' },
    { id: 'hatchback', name: 'White Hatchback', url: 'hatchback.html' },
    { id: 'backrooms', name: 'The Backrooms', url: 'backrooms.html' },
    { id: 'statue', name: 'Wooden Statue', url: 'statue.html' }
  ];
  
  pages.forEach(page => {
    const link = document.createElement('a');
    link.href = page.url;
    link.className = 'nav-link' + (currentPage === page.id ? ' active' : '');
    link.innerHTML = `<span>${page.name}</span> <span class="arrow">\u2192</span>`;
    menu.appendChild(link);
  });
  
  toggleBtn.addEventListener('click', () => {
    const willBeOpen = !menu.classList.contains('open');
    menu.classList.toggle('open');
    toggleBtn.textContent = willBeOpen ? 'Close \u25B2' : 'Explore \u25BC';
    localStorage.setItem('navMenuOpen', willBeOpen);
  });
  
  container.appendChild(toggleBtn);
  container.appendChild(menu);
  document.body.appendChild(container);
}
