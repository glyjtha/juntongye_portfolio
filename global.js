console.log("IT’S ALIVE!");

// Define the pages array
let pages = [
  { url: "",         title: "Home" },
  { url: "project/", title: "Projects" },
  { url: "contact/",  title: "Contact" },
  { url: "cv/",       title: "CV" },
  { url: "https://github.com/glyjtha", title: "GitHub" }
];

// 1) Create a <nav> and prepend it to <body>
let nav = document.createElement("nav");
document.body.prepend(nav);

// 2) Detect if we are on the home page via <html class="home">
const ARE_WE_HOME = document.documentElement.classList.contains("home");

// 3) Build each link in a loop
for (let p of pages) {
  let url   = p.url;
  let title = p.title;

  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;


  // Create the anchor element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);
  
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  if(a.host!=location.host){
    a.target = '_blank'
  }
}

console.log("Navigation built!");

document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="auto" selected>Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="green">Green</option>
      </select>
    </label>
  `
);

// 1) Grab the newly inserted <select>
const selectEl = document.querySelector("#theme-select");

// If there's a saved scheme in localStorage, apply it
if ("colorScheme" in localStorage) {
  const savedScheme = localStorage.colorScheme;
  if (savedScheme === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", savedScheme);
  }
  selectEl.value = savedScheme; // reflect in the dropdown
}

// When the user picks a theme, save it and apply it
selectEl.addEventListener("change", (evt) => {
  const mode = evt.target.value;
  localStorage.colorScheme = mode; // persist

  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
});

const form = document.querySelector('.contact-form')

form?.addEventListener('submit', function (e) {
  e.preventDefault(); // Stop the default mailto: submission
  
  const data = new FormData(form);
  const base = form.action; // e.g. "mailto:your_email@example.com"
  
  const subject = encodeURIComponent(data.get('subject') || '');
  const body    = encodeURIComponent(data.get('body') || '');
  
  const mailtoUrl = `${base}?subject=${subject}&body=${body}`;
  location.href = mailtoUrl;
});

export async function fetchJSON(url) {
  console.log('🔍 Trying to fetch:', url); // 加一行打印

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Step 2: Clear existing content to avoid duplication
  containerElement.innerHTML = '';

  // Step 3: Check that the input data is valid
  if (!Array.isArray(projects)) {
    console.error('renderProjects: expected an array of projects');
    return;
  }

  if (!containerElement) {
    console.error('renderProjects: container element is invalid');
    return;
  }

  // Step 4: Handle empty array
  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available at this time.</p>';
    return;
  }

  // Step 5: Render each project
  projects.forEach(project => {
    const article = document.createElement('article');

    article.innerHTML = `
      <h2>${project.title}</h2>
      <img src="${project.image}" alt="${project.title}" />
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
