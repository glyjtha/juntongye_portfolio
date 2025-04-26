import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  const projects = await fetchJSON('../projects.json');

  console.log('✅ Projects loaded:', projects);

  const projectsContainer = document.querySelector('.projects');
  console.log('📦 Container found?', projectsContainer);

  if (projects && projects.length > 0) {
    renderProjects(projects, projectsContainer, 'h2');
  } else {
    projectsContainer.innerHTML = '<p>No projects to display at the moment.</p>';
  }
})();
