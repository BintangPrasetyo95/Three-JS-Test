export function initNavigation(currentPage) {
  const container = document.createElement('div');
  container.className = 'nav-container';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'nav-toggle';
  // Check if there is a saved state for the menu in localStorage
  const isMenuOpen = localStorage.getItem('navMenuOpen') === 'true';
  toggleBtn.textContent = 'Explore \u25BC';
  
  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  if (isMenuOpen) {
    menu.classList.add('open');
    toggleBtn.textContent = 'Close \u25B2';
  }
  
  const pages = [
    { id: 'mobius', name: 'Möbius Strip', url: 'index.html' },
    { id: 'tesseract', name: 'Tesseract (4D)', url: 'tesseract.html' },
    { id: 'rocket', name: 'Rocket Thruster', url: 'rocket.html' },
    { id: 'car', name: 'Hyper Detailed Car', url: 'car.html' }
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
