import { fetchJSON, renderProjects } from '../global.js';

async () => {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');

  if (projects && projects.length > 0) {
    renderProjects(projects, projectsContainer, 'h2');
  } else {
    projectsContainer.innerHTML = '<p>No projects to display at the moment.</p>';
  }
})();