import { fetchJSON, renderProjects } from '/juntongye_portfolio/global.js';  

(async () => {
  // 1. Fetch all projects
  const projects = await fetchJSON('/juntongye_portfolio/project.json');
  
  // 2. Optional: 如果想取最新几个项目，比如前3个，可以用 slice()
  const latestProjects = projects.slice(0, 3); 

  // 3. Find container
  const projectsContainer = document.querySelector('.projects');

  // 4. Render all projects
  renderProjects(latestProjects, projectsContainer, 'h2');

  // 5. Update the project count in the title
  const titleElement = document.querySelector('.projects-title');
  if (titleElement) {
    titleElement.textContent = `Projects (${projects.length})`;
  }
})();
