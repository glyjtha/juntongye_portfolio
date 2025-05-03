import { fetchJSON, renderProjects } from '/juntongye_portfolio/global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

(async () => {

  const projects = await fetchJSON('/juntongye_portfolio/project.json');
  const projectsContainer = document.querySelector('.projects');
  const titleElement = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');
  const svg = d3.select('#projects-pie-plot');
  const legendContainer = document.querySelector('#legend');
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  let selectedIndex = -1;

  function renderPieChart(projectsSubset) {
  svg.selectAll('path').remove();
  legendContainer.innerHTML = '';
  
  const yearCounts = {};
  for (let p of projectsSubset) {
    yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
  }

  const projectData = Object.entries(yearCounts).map(([year, count]) => ({
    label: year,
    value: count
  }));

  const pie = d3.pie().value(d => d.value);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const pieData = pie(projectData);

  // --- PIE CHART ---
  svg.selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) =>
      selectedIndex === i ? 'oklch(60% 45% 0)' : colors(i)
    )
    .attr('class', (d, i) => selectedIndex === i ? 'selected' : null)
    .attr('cursor', 'pointer')
    .on('click', function (event, d) {
      const i = pieData.indexOf(d);
      selectedIndex = selectedIndex === i ? -1 : i;

      // Re-render everything to update visuals
      renderPieChart(projectsSubset);

      // Update projects display
      const query = searchInput.value.toLowerCase();
      let filtered = projectsSubset.filter(p =>
        Object.values(p).join(' ').toLowerCase().includes(query)
      );

      if (selectedIndex !== -1) {
        filtered = filtered.filter(p => p.year === projectData[selectedIndex].label);
      }

      renderProjects(filtered, projectsContainer, 'h2');
      if (titleElement) {
        titleElement.textContent = `${filtered.length} Projects`;
      }

      
    })
    .append('title')
    .text(d => `${d.data.label}: ${d.data.value} projects`);

  // --- LEGEND ---
  projectData.forEach((d, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="swatch" style="background-color: ${colors(i)};"></span>
      ${d.label} <em>(${d.value})</em>
    `;
    li.className = selectedIndex === i ? 'selected' : '';
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      selectedIndex = selectedIndex === i ? -1 : i;
      const filtered = projects.filter(p => {
        const matchText = Object.values(p).join(' ').toLowerCase().includes(query);
        const matchYear = selectedIndex === -1 || p.year === d.label;
        return matchText && matchYear;
      });
      
      renderProjects(filtered, projectsContainer, 'h2');
      
      renderPieChart(filtered); // re-render to reflect selection
      searchInput.value = ''; // clear input
    });
    legendContainer.appendChild(li);
  });
}

  // Initial render
  renderProjects(projects, projectsContainer, 'h2');
  if (titleElement) titleElement.textContent = `${projects.length} Projects`;
  renderPieChart(projects);

  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    let filtered = projects.filter(p =>
      Object.values(p).join(' ').toLowerCase().includes(query)
    );
    
    if (selectedIndex !== -1) {
      const year = d3.pie().value(d => d.value)(Object.entries(
        projects.reduce((acc, p) => {
          acc[p.year] = (acc[p.year] || 0) + 1;
          return acc;
        }, {})
      ).map(([label, value]) => ({ label, value })))[selectedIndex]?.data.label;
    
      if (year) {
        filtered = filtered.filter(p => p.year === year);
      }
    }    
  
    renderProjects(filtered, projectsContainer, 'h2');
    if (titleElement) {
      titleElement.textContent = `${filtered.length} Projects`;
    }
  
    if (filtered.length > 0) {
      renderPieChart(filtered);
    } else {
    }
  });
  
})();
