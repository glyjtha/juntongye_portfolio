import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
console.log('🔥 main.js start');


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
        enumerable: false,   
        writable:   false,   
        configurable: true 
      });

      return ret;
    });

}

function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    const hours = commits.map(c => c.hourFrac);
    const minHour = d3.min(hours);
    const maxHour = d3.max(hours);
    dl.append('dt').text('Time of day (earliest → latest)');
    dl.append('dd').text(`${minHour.toFixed(2)} → ${maxHour.toFixed(2)}`);

    const allFiles = commits.flatMap(c => c.lines.map(l => l.file));
    const uniqueFiles = new Set(allFiles).size;
    dl.append('dt').text('Number of files in the codebase');
    dl.append('dd').text(uniqueFiles);
}
// usage:
let xScale;
let yScale;
let data    = await loadData();
let commits = d3.sort(processCommits(data), d => d.datetime);
console.log(commits);     
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const hours      = commits.map(c => c.hourFrac);
const minHour    = d3.min(hours).toFixed(2);
const maxHour    = d3.max(hours).toFixed(2);
const allFiles   = commits.flatMap(c => c.lines.map(l => l.file));
const uniqueFiles = new Set(allFiles).size;

d3.select('#stat-commits').text(commits.length);
d3.select('#stat-loc')    .text(data.length);
d3.select('#stat-time')   .text(`${minHour} → ${maxHour}`);
d3.select('#stat-file')   .text(uniqueFiles);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);


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


let commitProgress = 100;
let timeScale = d3
.scaleTime()
.domain([
  d3.min(commits, (d) => d.datetime),
  d3.max(commits, (d) => d.datetime),
])
.range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);
const slider     = d3.select('#commit-progress');
const timeLabel  = d3.select('#slider-time'); 
console.log('slider', slider.node()); 
console.log('timeLabel', timeLabel.node()); 
let filteredCommits = commits;
let lines = filteredCommits.flatMap((d) => d.lines);
let files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  });

  let filesContainer = d3
  .select('#files')
  .selectAll('div')
  .data(files, (d) => d.name)
  .join(
    // This code only runs when the div is initially rendered
    (enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      }),
  );

// This code updates the div info
filesContainer.select('dt > code').text((d) => d.name);
filesContainer.select('dd').text((d) => `${d.lines.length} lines`);
console.log('scatter-story');

d3.select('#steps-1')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

function onStepEnter({ element }) {
  const commit = element.__data__;      // 原始数据就在 element.__data__
  if (!commit) return;
  const filtered = commits.filter(c => c.datetime <= commit.datetime);

  updateScatterPlot(null, filtered);    // 你已有的重绘函数
  updateFileDisplay(filtered);          // 文件点阵图同步
  // 如果还有 updateStats(filtered) 也一起调用
}

// 生成滚动段落

d3.select('#steps-1')
  .append('div')
  .data(commits) 
  .attr('class', 'step intro');

d3.select('#steps-1')
  .selectAll('div.step.commit')
  .data(commits)
  .join('div')
  .attr('class')
  

scrollama()
  .setup({
    container: '#scrolly-1',
    step:   '#steps-1 .step',
    offset: 0.5                        // 滚到视窗中线触发
  })
  .onStepEnter(onStepEnter);
d3.select('#steps-2')
  .selectAll('.step')
  .data(commits)
  .join('div')
    .attr('class', 'step')
    .html(d => {
      const fileCount = d3.rollups(
        d.lines,
        linesArr => linesArr.length,
        line => line.file
      ).length;

      return `
        <p>
          On <strong>${d.datetime.toLocaleString('en', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}</strong>,
          I edited <strong>${d.totalLines}</strong> lines
          across <strong>${fileCount}</strong> files.
        </p>
      `;
    });

function onStepEnter2({ element }) {
  const commit = element.__data__;
  const filtered = commits.filter(c => c.datetime <= commit.datetime);

  // 只更新文件点阵 & 统计（不动散点图）
  updateFileDisplay(filtered);
  // 如果有 updateStats(filtered) 也放进来
}

scrollama()                         // 新实例
  .setup({
    container: '#scrolly-2',
    step:      '#steps-2 .step',
    offset:    0.5
  })
  .onStepEnter(onStepEnter2);




function onTimeSliderChange() {
  console.log('🔄 onTimeSliderChange()', { rawValue: slider.node().value });

  commitProgress = +slider.node().value;
  commitMaxTime  = timeScale.invert(commitProgress);
  console.log('   commitMaxTime →', commitMaxTime.toString());

  const human = commitMaxTime.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  timeLabel.text(human);
  console.log('   timeLabel.node().textContent =', timeLabel.node().textContent);
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  console.log(filteredCommits)
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits)

}


slider.on('input', onTimeSliderChange);
onTimeSliderChange();


function renderScatterPlot(data, commits) {
    const width  = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 50 };
  
    const usableArea = {
      top:    margin.top,
      right:  width  - margin.right,
      bottom: height - margin.bottom,
      left:   margin.left,
      width:  width  - margin.left  - margin.right,
      height: height - margin.top   - margin.bottom
    };
  
    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);
  
    xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3.scaleLinear()
      .domain([0,24])
      .range([usableArea.bottom, usableArea.top]);
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width))
      .selectAll('line').attr('stroke','#ccc').attr('stroke-opacity',0.3);
    svg.select('.domain').remove();
  
    svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')      // ← mark it!
    .call(d3.axisBottom(xScale));

  // Y-axis
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => String(d).padStart(2,'0') + ':00'));

  
    const brush = d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on('start brush end', brushed);
  
    svg.append('g')
      .attr('class','brush')
      .call(brush);
  
    const sorted = commits.slice().sort((a,b)=>b.totalLines - a.totalLines);
    const [minL,maxL] = d3.extent(sorted, d=>d.totalLines);
    const rScale = d3.scaleSqrt().domain([minL,maxL]).range([4,30]);
  
    
    const dots = svg.append('g').attr('class', 'dots')
    .selectAll('circle')
    .data(sorted, d => d.id)
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
      
  
    svg.selectAll('.dots, .overlay ~ *').raise();
  
    function brushed(event) {
        const sel = event.selection;
      
        dots.classed('selected', d => {
          if (!sel) return false;
          const [[x0,y0],[x1,y1]] = sel;
          const xx = xScale(d.datetime), yy = yScale(d.hourFrac);
          return x0<=xx && xx<=x1 && y0<=yy && yy<=y1;
        });
      
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
      
    function isCommitSelected(selection, d) {
      if (!selection) return false;
      const [[x0,y0],[x1,y1]] = selection;
      const x = xScale(d.datetime), y = yScale(d.hourFrac);
      return x0<=x && x<=x1 && y0<=y && y<=y1;
    }
  }

function updateScatterPlot(data, commits) {
  // 1) update the xScale’s domain to the new commits
  xScale.domain(d3.extent(commits, d => d.datetime));

  // 2) re-draw the X axis in place
  const svg = d3.select('#chart').select('svg');
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.call(d3.axisBottom(xScale));

  // 3) update your rScale if you want radius to adapt as well
  const [minL, maxL] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minL, maxL]).range([4, 30]);
  
    // 4) re-bind the filtered commits to the existing dots group
  const sorted = commits.slice().sort((a, b) => b.totalLines - a.totalLines);
  svg.select('g.dots')
    .selectAll('circle')
    .data(sorted, d => d.id)               // use a key so D3 can diff
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r',  d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    ;
}

 
renderTooltipContent(commit);
console.log(commit);     



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
  
function updateFileDisplay(filteredCommits) {
  d3.select('#files').selectAll('*').remove();
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
  .map(([name, lines]) => ({
    name,
    lines,
    // pick a single “type” for the file—here we just use the first line’s type
    type: lines[0].type 
  }))
  // sort so that largest files come first
  .sort((a, b) => b.lines.length - a.lines.length);


  const filesContainer = d3.select('#files')
  .selectAll('div.file-entry')
  .data(files, d => d.name)
  .join(
    enter => enter.append('div')
                  .attr('class','file-entry')
                  .call(div => {
                    div.append('dt').append('code');
                    div.select('dt').append('small');
                    div.append('dd');
                  }),
    update => update,
    exit   => exit.remove()
  )
  .attr('style', d => `--color: ${colors(d.type)}`);

  
  filesContainer.select('dt > code').text(d => d.name);
  filesContainer.select('dt > small').text(d => `${d.lines.length} lines`);

  filesContainer.select('dd')
    .selectAll('div.loc')
    .data(d => d.lines)
    .join('div')
      .attr('class','loc');
  }
  
  
function updateTooltipVisibility(visible) {
    document.getElementById('commit-tooltip').hidden = !visible;
}
  
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const MARGIN_X = 4;   // 水平方向紧贴
  const MARGIN_Y = 4;   // 垂直方向微调

  let left = event.pageX + MARGIN_X;
  let top  = event.pageY + MARGIN_Y;

  const ttRect = tooltip.getBoundingClientRect();
  if (left + ttRect.width > window.innerWidth) {
    left = event.pageX - ttRect.width - MARGIN_X;
  }
  if (top + ttRect.height > window.innerHeight) {
    top = event.pageY - ttRect.height - MARGIN_Y;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top  = `${top}px`;
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

  for (const [lang, n] of counts){         
    const pct = ((n/total)*100).toFixed(1) + '%';
    dl.innerHTML += `
      <dt>${lang}</dt>
      <dd class="num">${n}</dd>            
      <dd class="unit">lines</dd>
      <dd class="pct">(${pct})</dd>
    `;
  }
}
