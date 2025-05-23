import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', row => ({
      ...row,
      line:     +row.line,
      depth:    +row.depth,
      length:   +row.length,
      date:     new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    return data;
  }
  
  function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/glyjtha/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,   // hide from for…in, Object.keys, console.log
        writable:   false,   // (optional) prevent reassigning ret.lines
        configurable: true   // allow future redefinition or deletion if desired
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
// Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

// Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

// Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

// Add more stats as needed...
    const hours = commits.map(c => c.hourFrac);
    const minHour = d3.min(hours);
    const maxHour = d3.max(hours);
    dl.append('dt').text('Time of day (earliest → latest)');
    dl.append('dd').text(`${minHour.toFixed(2)} → ${maxHour.toFixed(2)}`);

//number of file in the codebase
    const allFiles = commits.flatMap(c => c.lines.map(l => l.file));
    const uniqueFiles = new Set(allFiles).size;
    dl.append('dt').text('Number of files in the codebase');
    dl.append('dd').text(uniqueFiles);
}
// usage:
let data    = await loadData();
let commits = processCommits(data);
console.log(commits);       // you won’t see `lines` in the object dump…

// compute the time span and file count exactly as you do in renderCommitInfo
const hours      = commits.map(c => c.hourFrac);
const minHour    = d3.min(hours).toFixed(2);
const maxHour    = d3.max(hours).toFixed(2);
const allFiles   = commits.flatMap(c => c.lines.map(l => l.file));
const uniqueFiles = new Set(allFiles).size;

// now fill in your “summary-stats” slots:
d3.select('#stat-commits').text(commits.length);
d3.select('#stat-loc')    .text(data.length);
d3.select('#stat-time')   .text(`${minHour} → ${maxHour}`);
d3.select('#stat-file')   .text(uniqueFiles);

// (and you can still call renderCommitInfo() afterwards if you like)
renderCommitInfo(data, commits);

const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file,
  );

const averageFileLength = d3.mean(fileLengths, (d) => d[1]);


const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
  );

const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];


function renderScatterPlot(data, commits) {
    const width  = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 50 }; // more left for better labels
  
    const usableArea = {
      top:    margin.top,
      right:  width  - margin.right,
      bottom: height - margin.bottom,
      left:   margin.left,
      width:  width  - margin.left  - margin.right,
      height: height - margin.top   - margin.bottom
    };
  
    // 1) Create SVG
    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);
  
    // 2) Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    const yScale = d3.scaleLinear()
      .domain([0,24])
      .range([usableArea.bottom, usableArea.top]);
  
    // 3) Gridlines
    svg.append('g')
      .attr('transform', `translate(${usableArea.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width))
      .selectAll('line').attr('stroke','#ccc').attr('stroke-opacity',0.3);
    svg.select('.domain').remove();
  
    // 4) Axes
    svg.append('g')
      .attr('transform', `translate(0,${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
    svg.append('g')
      .attr('transform', `translate(${usableArea.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d).padStart(2,'0') + ':00'));
  
    // 5) Brush
    const brush = d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on('start brush end', brushed);
  
    svg.append('g')
      .attr('class','brush')
      .call(brush);
  
    // 6) Dots (sorted, sized, hoverable)
    const sorted = commits.slice().sort((a,b)=>b.totalLines - a.totalLines);
    const [minL,maxL] = d3.extent(sorted, d=>d.totalLines);
    const rScale = d3.scaleSqrt().domain([minL,maxL]).range([4,30]);
  
    
    const dots = svg.append('g').attr('class', 'dots')
    .selectAll('circle')
    .data(sorted)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r',  d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(d);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    })
    .on('click',(e,d)=>{
        renderSelectionCount([d]);
        renderLanguageBreakdown([d]);
      });
      
  
    // 7) Raise dots above brush overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
  
    // 8) Brush handler
    function brushed(event) {
        const sel = event.selection;
      
        // highlight circles
        dots.classed('selected', d => {
          if (!sel) return false;
          const [[x0,y0],[x1,y1]] = sel;
          const xx = xScale(d.datetime), yy = yScale(d.hourFrac);
          return x0<=xx && xx<=x1 && y0<=yy && yy<=y1;
        });
      
        // build array of chosen commits
        const chosen = sel
          ? commits.filter(d => {
              const [[x0,y0],[x1,y1]] = sel;
              const xx = xScale(d.datetime), yy = yScale(d.hourFrac);
              return x0<=xx && xx<=x1 && y0<=yy && yy<=y1;
            })
          : [];
      
        renderSelectionCount(chosen);
        renderLanguageBreakdown(chosen);
      }
      
      
  
    // 9) Helpers in scope of scales & commits
    function isCommitSelected(selection, d) {
      if (!selection) return false;
      const [[x0,y0],[x1,y1]] = selection;
      const x = xScale(d.datetime), y = yScale(d.hourFrac);
      return x0<=x && x<=x1 && y0<=y && y<=y1;
    }
  }
 
renderScatterPlot(data, commits);
renderTooltipContent(commit);


function renderTooltipContent(commit) {
    if (!commit || !commit.id) return;
    document.getElementById('commit-link').href        = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
    document.getElementById('commit-date').textContent =
      commit.datetime.toLocaleDateString('en',{dateStyle:'full'});
    document.getElementById('commit-time').textContent =
      commit.datetime.toLocaleTimeString('en',{timeStyle:'short'});
    document.getElementById('commit-author').textContent = commit.author;
    document.getElementById('commit-lines').textContent  = commit.totalLines;
  }
  
function updateTooltipVisibility(visible) {
    document.getElementById('commit-tooltip').hidden = !visible;
}
  
function updateTooltipPosition(event) {
    const chart = document.getElementById('chart');
    const tooltip = document.getElementById('commit-tooltip');
  
    // get container’s top/left in page coords
    const { x: cx, y: cy } = chart.getBoundingClientRect();
    
    // place tooltip relative to container
    tooltip.style.left = (event.clientX - cx + 10) + 'px';  // +10px so it doesn’t sit under the cursor
    tooltip.style.top  = (event.clientY - cy + 10) + 'px';
  }
  
function renderSelectionCount(chosen) {
    const p = document.getElementById('selection-count');
    p.textContent = chosen.length
      ? `${chosen.length} commit${chosen.length>1?'s':''} selected`
      : 'No commits selected';
}

function renderLanguageBreakdown(commitsArr){
  const dl = document.getElementById('language-breakdown');
  dl.innerHTML = '';
  if (!commitsArr.length) return;

  const lines   = commitsArr.flatMap(c => c.lines);
  const counts  = d3.rollups(lines, v=>v.length, d=>d.type.toUpperCase());
  const total   = d3.sum(counts, d=>d[1]);

  const order = ['CSS','JS','HTML'];
  counts.sort((a,b)=>order.indexOf(a[0]) - order.indexOf(b[0]));

  for (const [lang, n] of counts){          // ← 用 n
    const pct = ((n/total)*100).toFixed(1) + '%';
    dl.innerHTML += `
      <dt>${lang}</dt>
      <dd class="num">${n}</dd>             <!-- 改成 n -->
      <dd class="unit">lines</dd>
      <dd class="pct">(${pct})</dd>
    `;
  }
}
