(function () {
  const data = window.RESEARCH_DATA;
  const inventory = data.inventory || [];
  const top10 = [...(data.top10 || [])].sort((a, b) => a.rank - b.rank);

  const phaseLabels = {
    phase1: "Phase 1 - Methodology",
    phase2: "Phase 2 - Climate burden",
    phase3: "Phase 3 - National implementation",
    phase4: "Phase 4 - India and South Asia",
    phase5: "Phase 5 - Uncertainty",
    phase6: "Phase 6 - Exposure support",
  };
  const phaseOrder = ["phase1", "phase2", "phase3", "phase4", "phase5", "phase6"];

  const pipelineSteps = [
    {
      title: "Exposure mapping",
      desc: "Climate, air pollution, water, temperature, and environmental exposure distributions.",
    },
    {
      title: "RR / response functions",
      desc: "Use epidemiological evidence to map exposure intensity to risk.",
    },
    {
      title: "AF / PAF estimation",
      desc: "Translate exposure and risk into attributable fractions for outcomes.",
    },
    {
      title: "Baseline burden",
      desc: "Bring in mortality, incidence, prevalence, and state or national disease burden inputs.",
    },
    {
      title: "DALY conversion",
      desc: "Convert attributable burden into YLL, YLD, and DALYs.",
    },
    {
      title: "Uncertainty",
      desc: "Propagate assumptions, ranges, and scenario uncertainty into final estimates.",
    },
  ];

  const reuseRules = [
    ["Full pipeline", /workflow|comparative risk assessment|framework sequence|pipeline/i],
    ["Disease selection logic", /disease|outcome selection|priority outcome/i],
    ["RR integration", /\brr\b|relative risk|exposure-response/i],
    ["AF/PAF calculation", /\baf\b|\bpaf\b|attributable fraction/i],
    ["DALY conversion", /daly|yll|yld/i],
    ["Uncertainty analysis", /uncertainty|sensitivity|monte carlo/i],
    ["Policy framing", /policy|state-level|national-level|decision-making/i],
  ];

  function toText(value) {
    return (value || "Not reported").toString().trim();
  }

  function slug(text) {
    return toText(text).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function statusClass(value) {
    const lower = toText(value).toLowerCase();
    if (lower.includes("yes") || lower.includes("high")) return "yes";
    if (lower.includes("maybe") || lower.includes("medium")) return "maybe";
    return "no";
  }

  function linkify(value) {
    const urlMatch = toText(value).match(/https?:\/\/[^\s)]+/);
    if (!urlMatch) return escapeHtml(toText(value));
    const url = urlMatch[0];
    return `<a href="${url}" target="_blank" rel="noreferrer">Open source</a>`;
  }

  function escapeHtml(value) {
    return toText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function countBy(items, getter) {
    return items.reduce((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function renderBarChart(targetId, entries) {
    const root = document.getElementById(targetId);
    const max = Math.max(...entries.map((entry) => entry.value), 1);
    root.innerHTML = entries
      .map(
        (entry) => `
          <div class="bar-row">
            <div class="bar-label">
              <span>${escapeHtml(entry.label)}</span>
              <strong>${entry.value}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(entry.value / max) * 100}%"></div>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderHero() {
    const shortlisted = inventory.filter((paper) => /yes/i.test(paper.shortlist)).length;
    const hero = document.getElementById("hero-summary");
    hero.innerHTML = `
      <p class="eyebrow">Step 1 snapshot</p>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi__value">${inventory.length}</div><div class="kpi__label">Total papers screened</div></div>
        <div class="kpi"><div class="kpi__value">${top10.length}</div><div class="kpi__label">Papers highly relevant to our study</div></div>
        <div class="kpi"><div class="kpi__value">${shortlisted}</div><div class="kpi__label">Inventory papers tagged for shortlist</div></div>
      </div>
      <p class="small-note">
        Step 1 establishes the methodological backbone for an India-focused climate-health EBOD study: exposure mapping, response functions, attributable fractions, DALY conversion, and uncertainty handling.
      </p>
    `;
  }

  function renderKpis() {
    const categoryCounts = countBy(inventory, (paper) => paper.phase);
    const kpis = [
      ["Total papers", inventory.length],
      ["Top 10 papers", top10.length],
      ["High India relevance", inventory.filter((paper) => /high/i.test(paper.india_relevance)).length],
      ["Uses RR", inventory.filter((paper) => /yes/i.test(paper.rr)).length],
      ["Uses AF/PAF", inventory.filter((paper) => /yes/i.test(paper.af)).length],
      ["Uses DALY", inventory.filter((paper) => /yes/i.test(paper.daly)).length],
      ["Uses uncertainty", inventory.filter((paper) => /yes/i.test(paper.uncertainty)).length],
      ["Phases covered", Object.keys(categoryCounts).length],
    ];
    document.getElementById("kpis").innerHTML = kpis
      .map(
        ([label, value]) =>
          `<div class="kpi"><div class="kpi__value">${value}</div><div class="kpi__label">${label}</div></div>`
      )
      .join("");
  }

  function renderOverviewCharts() {
    renderBarChart(
      "category-chart",
      phaseOrder.map((phase) => ({
        label: phaseLabels[phase],
        value: inventory.filter((paper) => paper.phase === phase).length,
      }))
    );
    renderBarChart("feature-chart", [
      { label: "RR / response", value: inventory.filter((paper) => /yes/i.test(paper.rr)).length },
      { label: "AF / PAF", value: inventory.filter((paper) => /yes/i.test(paper.af)).length },
      { label: "DALY / YLL / YLD", value: inventory.filter((paper) => /yes/i.test(paper.daly)).length },
      { label: "Uncertainty", value: inventory.filter((paper) => /yes/i.test(paper.uncertainty)).length },
    ]);
    renderBarChart(
      "relevance-chart",
      ["High", "Medium", "Low", "Not reported"].map((level) => ({
        label: level,
        value: inventory.filter((paper) => toText(paper.india_relevance).toLowerCase().includes(level.toLowerCase())).length,
      }))
    );
  }

  function deriveReuseTags(paper) {
    const source = [
      paper.direct_reuse,
      paper.framework,
      paper.findings,
      paper.india_relevance,
    ].join(" ");
    return reuseRules
      .filter(([, pattern]) => pattern.test(source))
      .map(([label]) => label);
  }

  function renderTop10() {
    const container = document.getElementById("top10-list");
    container.innerHTML = top10
      .map((paper) => {
        const tags = deriveReuseTags(paper);
        return `
          <details class="paper-card" id="${slug(paper.title)}">
            <summary>
              <div class="paper-summary">
                <div class="rank-badge">#${paper.rank}</div>
                <div>
                  <div class="paper-title">${escapeHtml(paper.title)}</div>
                  <div class="paper-meta">${escapeHtml(paper.citation)}</div>
                </div>
                <div class="tag-row">
                  ${tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
              </div>
            </summary>
            <div class="paper-body">
              <div class="paper-grid">
                <div class="paper-box"><h4>Why it matters</h4><div>${escapeHtml(paper.india_relevance)}</div></div>
                <div class="paper-box"><h4>Framework</h4><div>${escapeHtml(paper.framework)}</div></div>
                <div class="paper-box"><h4>Study design</h4><div>${escapeHtml(paper.study_design)}</div></div>
                <div class="paper-box"><h4>Direct reuse</h4><div>${escapeHtml(paper.direct_reuse)}</div></div>
              </div>
              <div class="paper-grid">
                <div class="paper-box"><h4>Exposures</h4><div>${escapeHtml(paper.exposures)}</div></div>
                <div class="paper-box"><h4>Outcomes</h4><div>${escapeHtml(paper.outcomes)}</div></div>
                <div class="paper-box"><h4>Inputs</h4><div>${escapeHtml(paper.inputs)}</div></div>
                <div class="paper-box"><h4>Workflow</h4><div>${escapeHtml(paper.workflow)}</div></div>
              </div>
              <div class="paper-grid">
                <div class="paper-box"><h4>Main findings</h4><div>${escapeHtml(paper.findings)}</div></div>
                <div class="paper-box"><h4>Limitations</h4><div>${escapeHtml(paper.limitations)}</div></div>
                <div class="paper-box"><h4>Quotable lines</h4><div>${escapeHtml(paper.quotes)}</div></div>
                <div class="paper-box"><h4>Source</h4><div>${linkify(paper.url)}</div></div>
              </div>
            </div>
          </details>
        `;
      })
      .join("");
  }

  function renderMatrix() {
    const columns = [
      ["Paper", (paper) => escapeHtml(paper.title)],
      ["EBOD fit", (paper) => scoreText(/environmental burden|comparative risk assessment|cra|paf/i.test(paper.framework) ? "High" : "Medium")],
      ["RR", (paper) => scoreText(/\brr\b|relative risk|exposure-response/i.test(paper.effect_measures) ? "Yes" : "Not reported")],
      ["AF/PAF", (paper) => scoreText(/\bpaf\b|attributable fraction/i.test(paper.effect_measures + " " + paper.equations) ? "Yes" : "Not reported")],
      ["DALY", (paper) => scoreText(/daly|yll|yld/i.test(paper.effect_measures + " " + paper.equations) ? "Yes" : "Not reported")],
      ["Uncertainty", (paper) => scoreText(/uncertainty|sensitivity|monte carlo/i.test(paper.uncertainty) ? "Yes" : "Not reported")],
      ["India adaptation", (paper) => scoreText(/very high|high/i.test(paper.india_relevance) ? "High" : "Medium")],
      ["Reuse focus", (paper) => escapeHtml(deriveReuseTags(paper).slice(0, 3).join(", "))],
    ];
    const table = document.getElementById("matrix-table");
    table.innerHTML = `
      <thead><tr>${columns.map(([label]) => `<th>${label}</th>`).join("")}</tr></thead>
      <tbody>
        ${top10
          .map(
            (paper) => `
              <tr>
                ${columns.map(([, render]) => `<td>${render(paper)}</td>`).join("")}
              </tr>
            `
          )
          .join("")}
      </tbody>
    `;
  }

  function scoreText(text) {
    return `<span class="${statusClass(text)}">${escapeHtml(text)}</span>`;
  }

  function renderPipeline() {
    const root = document.getElementById("pipeline-flow");
    root.innerHTML = pipelineSteps
      .map(
        (step) => `
          <div class="pipeline-step">
            <h3>${escapeHtml(step.title)}</h3>
            <div class="small-note">${escapeHtml(step.desc)}</div>
          </div>
        `
      )
      .join("");
  }

  function keywordCounts(texts, terms) {
    const all = texts.join(" ").toLowerCase();
    return terms.map(({ label, pattern }) => ({
      label,
      value: (all.match(pattern) || []).length,
    }));
  }

  function renderInputCharts() {
    const inputTerms = [
      { label: "Exposure data", pattern: /exposure/g },
      { label: "Relative risk", pattern: /relative risk|\brr\b/g },
      { label: "Mortality data", pattern: /mortality|deaths/g },
      { label: "Incidence / prevalence", pattern: /incidence|prevalence/g },
      { label: "DALY inputs", pattern: /daly|yll|yld/g },
      { label: "Population / demographics", pattern: /population|demographic/g },
      { label: "Disability weights", pattern: /disability weight/g },
      { label: "Uncertainty parameters", pattern: /uncertainty|sensitivity|confidence interval/g },
    ];
    const frameworkTerms = [
      { label: "Comparative risk assessment", pattern: /comparative risk assessment|cra/g },
      { label: "PAF / attributable fraction", pattern: /paf|attributable fraction/g },
      { label: "GBD-aligned framework", pattern: /global burden of disease|gbd/g },
      { label: "Scenario modeling", pattern: /scenario/g },
      { label: "Exposure-response", pattern: /exposure-response|ier|gemm/g },
    ];
    renderBarChart("inputs-chart", keywordCounts(top10.map((paper) => paper.inputs), inputTerms));
    renderBarChart("framework-chart", keywordCounts(top10.map((paper) => paper.framework), frameworkTerms));
  }

  function renderInventoryTable(items) {
    const table = document.getElementById("inventory-table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Paper</th>
          <th>Phase</th>
          <th>Category</th>
          <th>Framework</th>
          <th>RR</th>
          <th>AF/PAF</th>
          <th>DALY</th>
          <th>Uncertainty</th>
          <th>India relevance</th>
          <th>Shortlist</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (paper) => `
              <tr>
                <td><strong>${escapeHtml(paper.title)}</strong><br><span class="small-note">${escapeHtml(paper.citation)}</span></td>
                <td>${escapeHtml(phaseLabels[paper.phase] || paper.phase)}</td>
                <td>${escapeHtml(paper.category)}</td>
                <td>${escapeHtml(paper.framework)}</td>
                <td>${scoreText(paper.rr)}</td>
                <td>${scoreText(paper.af)}</td>
                <td>${scoreText(paper.daly)}</td>
                <td>${scoreText(paper.uncertainty)}</td>
                <td>${scoreText(paper.india_relevance)}</td>
                <td>${scoreText(paper.shortlist)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    `;
  }

  function setupInventoryFilters() {
    const phaseFilter = document.getElementById("phase-filter");
    const relevanceFilter = document.getElementById("relevance-filter");
    const searchInput = document.getElementById("search-input");

    phaseFilter.innerHTML =
      `<option value="">All phases</option>` +
      Object.entries(phaseLabels)
        .map(([value, label]) => `<option value="${value}">${label}</option>`)
        .join("");
    relevanceFilter.innerHTML = `
      <option value="">All relevance levels</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    `;

    function applyFilters() {
      const phase = phaseFilter.value;
      const relevance = relevanceFilter.value;
      const query = searchInput.value.toLowerCase().trim();
      const filtered = inventory.filter((paper) => {
        const matchesPhase = !phase || paper.phase === phase;
        const matchesRelevance = !relevance || toText(paper.india_relevance).toLowerCase().includes(relevance);
        const haystack = [
          paper.title,
          paper.citation,
          paper.category,
          paper.exposures,
          paper.outcomes,
          paper.framework,
        ]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        return matchesPhase && matchesRelevance && matchesQuery;
      });
      renderInventoryTable(filtered);
    }

    [phaseFilter, relevanceFilter, searchInput].forEach((element) => {
      element.addEventListener("input", applyFilters);
      element.addEventListener("change", applyFilters);
    });
    applyFilters();
  }

  function renderInsights() {
    const insights = [
      `The strongest methodological spine across the review is exposure -> RR/exposure-response -> AF/PAF -> attributable burden -> DALY conversion.`,
      `${inventory.filter((paper) => /yes/i.test(paper.daly)).length} of ${inventory.length} screened papers explicitly use DALY, YLL, or YLD outputs, which keeps Step 1 tightly aligned with manuscript-ready burden estimation.`,
      `${top10.filter((paper) => /india/i.test(paper.country)).length} of the top 10 highlighted papers are directly India-focused, which strengthens adaptation from generic EBOD methods to your final study setting.`,
      `${inventory.filter((paper) => /yes/i.test(paper.uncertainty)).length} screened papers include uncertainty handling, but the most reusable formal guidance comes from the WHO and dedicated uncertainty-method papers.`,
      `The most reusable blocks for India are WHO-style comparative risk assessment, GBD-aligned PAF logic, and India-specific response functions for air pollution and heat.`,
    ];
    document.getElementById("insight-cards").innerHTML = insights
      .map(
        (insight, index) => `
          <div class="insight-card">
            <div class="eyebrow">Insight ${index + 1}</div>
            <div>${escapeHtml(insight)}</div>
          </div>
        `
      )
      .join("");
  }

  renderHero();
  renderKpis();
  renderOverviewCharts();
  renderTop10();
  renderMatrix();
  renderPipeline();
  renderInputCharts();
  setupInventoryFilters();
  renderInsights();
})();
