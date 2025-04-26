import { fetchJSON, renderProjects } from '/juntongye_portfolio/global.js';

(async () => {
  const projects = await fetchJSON('/juntongye_portfolio/project.json');  // 注意这个路径
  console.log('Projects loaded:', projects);

  const projectsContainer = document.querySelector('.projects');
  console.log('Container found?', projectsContainer);

  if (projects && projects.length > 0) {
    renderProjects(projects, projectsContainer, 'h2');

    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.textContent = `${projects.length} Projects`;
    }

  } else {
    projectsContainer.innerHTML = '<p>No projects to display at the moment.</p>';
  }
})();
