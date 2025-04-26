import { fetchJSON, renderProjects,fetchGitHubData } from '/juntongye_portfolio/global.js';  

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

  // 6. Fetch GitHub profile data
  const githubData = await fetchGitHubData('glyjtha');
  console.log('GitHub Profile:', githubData);

  // 7. Optional: 如果想在页面上显示GitHub数据
  const profileStats = document.querySelector('#profile-stats');

  if (profileStats) {
    profileStats.innerHTML = `
      <div class="github-card">
        <img src="${githubData.avatar_url}" alt="GitHub Avatar" class="github-avatar">
        <div class="github-info">
          <h2>My GitHub Stats</h2>
          <dl class="github-stats">
            <dt>Followers</dt><dd>${githubData.followers}</dd>
            <dt>Following</dt><dd>${githubData.following}</dd>
            <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
          </dl>
        </div>
      </div>
    `;
  }
  

})();
