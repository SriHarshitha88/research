(function () {
  const data = window.RESEARCH_DATA;
  const inventory = data.inventory || [];
  const top10 = [...(data.top10 || [])].sort((a, b) => a.rank - b.rank);
  const phase2Inventory = inventory.filter((paper) => paper.phase === "phase2");

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

  const roadmapSteps = [
    {
      step: "Step 1",
      title: "Methodology review",
      status: "Done",
      output: "Method matrix, top 10 papers, reusable pipeline components.",
    },
    {
      step: "Step 2",
      title: "Outcome selection",
      status: "In progress",
      output: "Climate-sensitive disease/outcome map and categorized shortlist.",
    },
    {
      step: "Step 3",
      title: "India evidence mapping",
      status: "Queued",
      output: "India RR, exposure-response, CI, TMREL, and dataset mapping.",
    },
    {
      step: "Step 4",
      title: "Model blueprint",
      status: "Queued",
      output: "Final model structure, assumptions, and input specification.",
    },
    {
      step: "Step 5",
      title: "Analysis and results",
      status: "Queued",
      output: "Burden estimates, visuals, and manuscript-ready summary tables.",
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
    if (value === null || value === undefined) return "Not reported";
    return value
      .toString()
      .replace(/\u00e2\u20ac\u2018/g, "-")
      .replace(/\u00e2\u20ac\u2019/g, "-")
      .replace(/\u00e2\u20ac\u201c/g, '"')
      .replace(/\u00e2\u20ac\u201d/g, '"')
      .replace(/\u00e2\u20ac\u2122/g, "'")
      .replace(/\u00e2\u20ac\u201a/g, ",")
      .replace(/\u00e2\u20ac\u00a6/g, "...")
      .replace(/\u00e2\u20ac\u00b0/g, " deg ")
      .replace(/\u00c2\u00b5/g, "u")
      .replace(/\u00c2/g, "")
      .replace(/\u00e2\u2030\u00a5/g, ">=")
      .replace(/\u00e2\u2030\u00a4/g, "<=")
      .replace(/\u00e2\u2030\u02c6/g, "~")
      .trim();
  }

  function normalize(value) {
    return toText(value).toLowerCase().replace(/\s+/g, " ").trim();
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
    const hero = document.getElementById("hero-summary");
    hero.innerHTML = `
      <p class="eyebrow">Methodology snapshot</p>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi__value">${inventory.length}</div><div class="kpi__label">Total papers screened</div></div>
        <div class="kpi"><div class="kpi__value">${top10.length}</div><div class="kpi__label">Papers highly relevant to our study</div></div>
      </div>
      <p class="small-note">
        Methodology review establishes the EBOD backbone for an India-focused climate-health study: exposure mapping, response functions, attributable fractions, DALY conversion, and uncertainty handling.
      </p>
    `;
  }

  function classifyOutcome(text) {
    const value = toText(text).toLowerCase();
    if (/heat|temperature/.test(value)) return "Heat-related";
    if (/air pollution|ozone|pm2\.5|pm10/.test(value)) return "Air pollution-related";
    if (/malaria|dengue|vector/.test(value)) return "Vector-borne";
    if (/respiratory|asthma|copd/.test(value)) return "Respiratory";
    if (/cardio|heart|stroke/.test(value)) return "Cardiovascular";
    if (/mental|anxiety|depression/.test(value)) return "Mental health";
    if (/diarrhoe|water|nutrition|malnutrition/.test(value)) return "Water and nutrition";
    return "Other climate-sensitive outcomes";
  }

  function classifyExposure(text) {
    const value = toText(text).toLowerCase();
    if (/temperature|heat|cold/.test(value)) return "Temperature";
    if (/air pollution|ozone|pm2\.5|pm10/.test(value)) return "Air quality";
    if (/rain|flood|drought|precipitation|water/.test(value)) return "Hydro-climate";
    if (/vector|mosquito/.test(value)) return "Vector ecology";
    if (/extreme|storm|weather/.test(value)) return "Extreme events";
    return "Other exposures";
  }

  function methodReadyCount(items, field) {
    return items.filter((item) => /yes/i.test(toText(item[field]))).length;
  }

  function renderCockpitBoard() {
    document.getElementById("roadmap-cards").innerHTML = roadmapSteps
      .map(
        (item) => `
          <article class="roadmap-card">
            <div class="eyebrow">${item.step}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="small-note">${escapeHtml(item.output)}</p>
            <div class="status-chip ${slug(item.status)}">${escapeHtml(item.status)}</div>
          </article>
        `
      )
      .join("");
  }

  function renderStep2() {
    function extractFirstUrl(value) {
      const text = toText(value);
      const matches = text.match(/https?:\/\/[^\s\]]+/gi) || [];
      const cleaned = matches.map((u) => u.replace(/[.,;]+$/, ""));
      if (!cleaned.length) return "";

      function isPlaceholder(url) {
        const lower = url.toLowerCase();
        return (
          lower.includes("doi.org/10.1016/j.xxxx") ||
          lower.includes("doi.org/10.xxxx") ||
          lower.includes("example.com")
        );
      }

      const valid = cleaned.filter((u) => !isPlaceholder(u));
      if (!valid.length) return "";

      const doiPreferred = valid.find((u) => /doi\.org\//i.test(u));
      return doiPreferred || valid[0];
    }
    const linkOverrides = {
      "Association between Acute Exposure to PM2.5 Chemical Species and Mortality in Delhi":
        "https://doi.org/10.1021/acs.est.1c06864",
      "Long-Term PM2.5 Exposure and Risks of Ischemic Heart Disease and Cerebrovascular Disease":
        "https://doi.org/10.1161/JAHA.120.018990",
      "Long-term exposure to particulate matter on cardiovascular and respiratory diseases in LMICs (systematic review/meta-analysis)":
        "https://doi.org/10.1186/s12940-023-00984-6",
      "Air pollution and its impact on cardiovascular health (narrative review)":
        "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7961250/",
      "PM2.5 inhalation exposure and associated health risk in young adults (South Asia undergraduates)":
        "https://www.frontiersin.org/journals/sustainable-cities/articles/10.3389/frsc.2026.1775496/full",
      "Long-term exposure to particulate matter and mortality: an update (meta-analysis)":
        "https://pubmed.ncbi.nlm.nih.gov/38838524/",
      "The impact of PM2.5 on the human respiratory system (PM2.5 respiratory review)":
        "https://pubmed.ncbi.nlm.nih.gov/26904255/",
      "Dengue situation in India: Suitability and transmission potential under climate change":
        "https://doi.org/10.1007/s11356-020-09472-3",
      "Climate change could shift disease burden from malaria to dengue":
        "https://doi.org/10.1073/pnas.1917275117",
      "Exploring the association between floods and diarrhea among children":
        "https://pubmed.ncbi.nlm.nih.gov/39444209/",
      "Infectious diarrhea risks as a public health emergency in floods (systematic analysis)":
        "https://pubmed.ncbi.nlm.nih.gov/38962364/",
    };
    const clusterOrder = [
      "cardiovascular",
      "respiratory_pm25_ozone",
      "heat_mortality",
      "diarrhoeal_flooding",
      "dengue_malaria",
      "undernutrition_drought",
      "mental_health",
    ];
    const clusterLabels = {
      cardiovascular: "Cardiovascular (IHD/Stroke)",
      respiratory_pm25_ozone: "Respiratory (PM2.5/Ozone)",
      heat_mortality: "Heat-related mortality",
      diarrhoeal_flooding: "Diarrhoeal disease and flooding",
      dengue_malaria: "Dengue and malaria",
      undernutrition_drought: "Child and maternal undernutrition",
      mental_health: "Mental health (emerging)",
      other: "Other",
    };
    function canonicalClusterName(value) {
      const v = normalize(value);
      if (v.includes("cardio")) return "cardiovascular";
      if (v.includes("respiratory")) return "respiratory_pm25_ozone";
      if (v.includes("heat")) return "heat_mortality";
      if (v.includes("diarr")) return "diarrhoeal_flooding";
      if (v.includes("dengue") || v.includes("malaria")) return "dengue_malaria";
      if (v.includes("undernutrition") || v.includes("drought")) return "undernutrition_drought";
      if (v.includes("mental")) return "mental_health";
      return "other";
    }
    const step2ClusterPaperCounts = {
      cardiovascular: 14,
      dengue_malaria: 12,
      diarrhoeal_flooding: 12,
      heat_mortality: 12,
      respiratory_pm25_ozone: 12,
      undernutrition_drought: 13,
    };
    const step2ReviewRows = Array.isArray(window.STEP2_REVIEW) ? window.STEP2_REVIEW : [];
    const step2PaperInventory = step2ReviewRows.length
      ? step2ReviewRows.map((row, index) => ({
          id: `s2-${index + 1}`,
          cluster: canonicalClusterName(row.cluster),
          cluster_label: clusterLabels[canonicalClusterName(row.cluster)] || clusterLabels.other,
          study: row.paper,
          year: row.year,
          exposure: row.exposure,
          outcome: row.outcome,
          geography: row.geography,
          priority: row.priority,
          use_main_model: row.step3,
          link: linkOverrides[toText(row.paper)] || extractFirstUrl(row.link),
        })).filter((row) => /^https?:\/\//i.test(row.link))
      : [];

    const diseaseInsights = [
      "Step 2 is disease-selection focused, so method mismatch across papers is acceptable when exposure-disease linkage is clear.",
      "Cardiovascular PM2.5 evidence should be handled as a dedicated cluster, including source-specific pathways.",
      "Step 3 extraction should prioritize papers with usable effect fields: estimate, CI, unit, lag, and counterfactual.",
      "Current Step 2 expansion includes six disease clusters from the new review folder and should drive the final shortlist.",
    ];
    document.getElementById("step2-disease-insights").innerHTML = diseaseInsights
      .map((text, index) => `<div class="insight-card"><div class="eyebrow">Evidence insight ${index + 1}</div><div>${escapeHtml(text)}</div></div>`)
      .join("");

    function clusterEvidence(clusterKey, maxItems = 5) {
      const rows = step2PaperInventory.filter((row) => row.cluster === clusterKey);
      const primaryHosts = new Set([
        "doi.org",
        "pubmed.ncbi.nlm.nih.gov",
        "pmc.ncbi.nlm.nih.gov",
        "thelancet.com",
        "nature.com",
        "sciencedirect.com",
        "pubs.acs.org",
        "jogh.org",
        "who.int",
        "stateofglobalair.org",
        "cambridge.org",
        "agupubs.onlinelibrary.wiley.com",
        "frontiersin.org",
      ]);
      const score = (row) => {
        const p = normalize(row.priority);
        if (p.includes("high")) return 3;
        if (p.includes("medium")) return 2;
        return 1;
      };
      const selected = rows
        .filter((row) => {
          const link = toText(row.link);
          if (!/^https?:\/\//i.test(link)) return false;
          try {
            const host = new URL(link).hostname.toLowerCase();
            return primaryHosts.has(host);
          } catch {
            return false;
          }
        })
        .sort((a, b) => score(b) - score(a))
        .slice(0, maxItems)
        .map((row) => ({
          source: `${toText(row.study)} (${toText(row.year)})`,
          link: toText(row.link).startsWith("http") ? toText(row.link) : "",
        }));
      return selected.length ? selected : [{ source: "No extracted papers yet in current Step 2 review files", link: "" }];
    }

    const frameworkRows = [
      {
        disease: "Heart disease (IHD/stroke and cardiovascular burden)",
        causes:
          "Industry emissions, vehicle emissions, construction dust, tar-road and resuspended road dust, ambient PM2.5; aerosol inhaler-related evidence is limited/emerging.",
        evidence: clusterEvidence("cardiovascular", 5),
        notes:
          "After reviewing the cardiovascular papers, we consistently observe PM2.5-linked increases in cardiovascular burden, especially for IHD and stroke. The evidence is strongest for ambient source-component pathways, including traffic, industry, and road/construction dust.\n\nLimitation: India-specific CVD-only RR functions are still fewer than all-cause mortality models, and aerosol-inhaler attribution remains weak for direct EBOD parameterization.",
      },
      {
        disease: "Respiratory disease (COPD, asthma, infections)",
        causes:
          "PM2.5 and ozone accumulation under climate stress, urban combustion emissions, and seasonal air-quality worsening.",
        evidence: clusterEvidence("respiratory_pm25_ozone", 5),
        notes:
          "After reviewing the respiratory papers, we consistently find strong support for PM2.5- and ozone-linked respiratory burden across COPD, asthma, and infection-related outcomes. The strongest evidence comes from burden synthesis and exposure-response studies that are directionally consistent.\n\nLimitation: India-specific subtype RRs (separate COPD vs asthma vs infection curves) remain less complete than broad respiratory or all-cause burden estimates, so Step 3 should retain sensitivity ranges.",
      },
      {
        disease: "Heat-related mortality",
        causes: "Extreme heat, humidity, prolonged heatwave days, and non-optimal temperature exposure.",
        evidence: clusterEvidence("heat_mortality", 5),
        notes:
          "After reviewing the heat-mortality papers, we consistently observe excess mortality under extreme heat and non-optimal temperature, with clear lag effects and climate-zone relevance for India. This cluster is among the most model-ready in the current review set.\n\nLimitation: cause-specific decomposition (cardiac, respiratory, renal shares within heat-attributable deaths) remains patchy across Indian datasets and should be flagged in Step 3.",
      },
      {
        disease: "Diarrhoeal disease",
        causes: "Flooding, heavy rainfall, damaged pipelines, contaminated water systems, and WASH disruption.",
        evidence: clusterEvidence("diarrhoeal_flooding", 5),
        notes:
          "After reviewing the diarrhoeal-disease papers, we repeatedly see the same pathway: flooding and heavy rainfall disrupt WASH systems and increase diarrhoeal risk. India outbreak evidence and pooled analyses both support this direction of effect.\n\nLimitation: India-wide standardized flood exposure metrics and pathogen-specific national RR estimates are still limited, so transferability across states should be treated cautiously.",
      },
      {
        disease: "Dengue and malaria",
        causes: "Temperature rise, rainfall variability, humidity, and vector-suitability expansion.",
        evidence: clusterEvidence("dengue_malaria", 5),
        notes:
          "After reviewing the dengue/malaria papers, we consistently find support for climate-driven vector suitability expansion and longer transmission windows, including India-focused projections. The direction of effect is clear across temperature, rainfall, and humidity studies.\n\nLimitation: per-unit climate-exposure RR harmonization (temperature/rainfall increment scaling) remains inconsistent across studies and must be normalized before model integration.",
      },
      {
        disease: "Child and maternal undernutrition",
        causes: "Drought, rainfall shock, crop loss, food-price stress, and food-system disruption.",
        evidence: clusterEvidence("undernutrition_drought", 5),
        notes:
          "After reviewing the undernutrition papers, we consistently observe drought-linked pathways through crop loss, food insecurity, and dietary deterioration, with clear India relevance. This cluster has enough evidence to remain in the core outcome discussion.\n\nLimitation: state-level longitudinal harmonization of drought exposure with nutrition outcomes remains incomplete, so early EBOD runs should use wider confidence bounds.",
      },
      {
        disease: "Mental health outcomes (anxiety, depression, climate distress)",
        causes: "Heat stress, disaster displacement, livelihood loss, and climate-linked chronic stress.",
        evidence: clusterEvidence("mental_health", 5),
        notes:
          "After reviewing the current Step 2 evidence base, mental-health outcomes remain a plausible and important climate-sensitive pathway that should stay in scope. However, this cluster is still evidence-thin relative to other core disease groups.\n\nLimitation: the current extracted set does not yet contain enough direct, model-ready mental-health RR papers (especially India-focused), so this should be treated as a priority direction for the next targeted search.",
      },
    ];

    const cardiovascularPm25RrLibrary = [
      {
        id: "rr-cvd-1",
        exposure: "PM2.5 (ambient, long-term)",
        outcome: "Ischemic heart disease mortality burden",
        effect_measure: "Burden trend (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "PM2.5-attributable burden estimate",
        lag: "Long-term",
        population: "General population",
        geography: "China",
        study: "Zhang and Wang",
        year: 2023,
        counterfactual: "GBD-based PM2.5 counterfactual assumptions",
        india_specific: "No",
        model_type: "APC burden trend model",
        adjusted_confounders: "Model-based burden decomposition",
        use_main_model: "Maybe",
        core_optional: "Optional",
        notes: "Useful for trend logic and cardiovascular cause framing."
      },
      {
        id: "rr-cvd-2",
        exposure: "Ambient PM2.5",
        outcome: "Ischemic heart disease burden",
        effect_measure: "Burden estimate (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "PM2.5-attributable IHD burden",
        lag: "Long-term",
        population: "General population",
        geography: "Global/Regional/National",
        study: "Guo et al.",
        year: 2024,
        counterfactual: "GBD 2019 framework",
        india_specific: "No",
        model_type: "GBD burden analysis",
        adjusted_confounders: "GBD comparative risk framework",
        use_main_model: "Yes",
        core_optional: "Core",
        notes: "Directly relevant to core cardiovascular PM2.5 module."
      },
      {
        id: "rr-cvd-3",
        exposure: "Ambient PM2.5",
        outcome: "Stroke and coronary heart disease burden",
        effect_measure: "Assessment and forecast (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "PM2.5-attributable burden estimate",
        lag: "Long-term",
        population: "Urban population",
        geography: "Tehran, Iran",
        study: "Kazemi et al.",
        year: 2024,
        counterfactual: "Scenario-based baseline PM2.5",
        india_specific: "No",
        model_type: "Assessment + forecast",
        adjusted_confounders: "Scenario assumptions",
        use_main_model: "Maybe",
        core_optional: "Optional",
        notes: "Useful for forecasting structure, not India-specific."
      },
      {
        id: "rr-cvd-4",
        exposure: "Ambient PM2.5 (daily)",
        outcome: "Years of life lost from ischemic heart disease",
        effect_measure: "Association estimate (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "Per increase in daily PM2.5",
        lag: "Short-term and cumulative",
        population: "General population",
        geography: "China",
        study: "Qi et al.",
        year: 2021,
        counterfactual: "Daily PM2.5 standard achievement scenario",
        india_specific: "No",
        model_type: "Life expectancy / YLL analysis",
        adjusted_confounders: "Time-series controls",
        use_main_model: "Maybe",
        core_optional: "Optional",
        notes: "Helpful for YLL framing in Step 3."
      },
      {
        id: "rr-cvd-5",
        exposure: "Ambient PM2.5 and components",
        outcome: "Coronary heart disease admissions with diabetes comorbidity",
        effect_measure: "Association estimate (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "Per PM2.5 component increase",
        lag: "Short-term",
        population: "CHD patients with diabetes",
        geography: "Beijing, China",
        study: "Zaheer et al.",
        year: 2025,
        counterfactual: "Low exposure period",
        india_specific: "No",
        model_type: "Hospital admissions analysis",
        adjusted_confounders: "Meteorology and time trends",
        use_main_model: "Maybe",
        core_optional: "Optional",
        notes: "Good for susceptibility subgroup logic."
      },
      {
        id: "rr-cvd-6",
        exposure: "Source-specific PM2.5 (industry/traffic/other components)",
        outcome: "Heart rate variability in elderly coronary heart disease patients",
        effect_measure: "Association estimate (RR extraction pending)",
        rr: null,
        ci_lower: null,
        ci_upper: null,
        unit_increment: "Per source/component increment",
        lag: "Short-term",
        population: "Elderly with coronary heart disease",
        geography: "China (community panel)",
        study: "Chen et al.",
        year: 2020,
        counterfactual: "Lower source-specific concentration",
        india_specific: "No",
        model_type: "Panel study",
        adjusted_confounders: "Time-varying and personal factors",
        use_main_model: "Maybe",
        core_optional: "Optional",
        notes: "Supports source-apportioned mechanisms for industry/vehicle/construction."
      }
    ];
    const rrLibrary = [...(data.step2RrLibrary || []), ...cardiovascularPm25RrLibrary];
    const outcomeCounts = countBy(rrLibrary, (row) => classifyOutcome(row.outcome));
    const exposureCounts = countBy(rrLibrary, (row) => classifyExposure(row.exposure));
    const highPriority = 6;
    const reviewedPaperCount = Object.values(step2ClusterPaperCounts).reduce((acc, value) => acc + value, 0);

    const kpis = [
      ["Disease clusters reviewed", Object.keys(step2ClusterPaperCounts).length],
      ["Papers in new Step 2 review", reviewedPaperCount],
      ["Core high-evidence clusters", highPriority],
      ["RR evidence rows", rrLibrary.length],
      ["Rows with numeric RR", rrLibrary.filter((row) => typeof row.rr === "number").length],
      ["India-specific RR rows", rrLibrary.filter((row) => /yes/i.test(toText(row.india_specific))).length],
      ["Outcome categories", Object.keys(outcomeCounts).length],
      ["Exposure categories", Object.keys(exposureCounts).length],
    ];

    document.getElementById("step2-kpis").innerHTML = kpis
      .map(
        ([label, value]) =>
          `<div class="kpi"><div class="kpi__value">${value}</div><div class="kpi__label">${label}</div></div>`
      )
      .join("");

    document.getElementById("step2-framework-table").innerHTML = `
      <thead>
        <tr>
          <th>Disease cluster</th>
          <th>Causes</th>
          <th>Evidence</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${frameworkRows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.disease)}</td>
                <td>${escapeHtml(row.causes)}</td>
                <td>
                  ${row.evidence
                    .map(
                      (paper) =>
                        paper.link
                          ? `<a href="${escapeHtml(paper.link)}" target="_blank" rel="noreferrer">${escapeHtml(
                              paper.source
                            )}</a>`
                          : `${escapeHtml(paper.source)}`
                    )
                    .join(", ")}
                </td>
                <td>${renderNotes(row.notes)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    `;

    const pathwayRows = [
      {
        cause: "High heat and humidity",
        pathway: "Thermal stress, dehydration, and cardiovascular strain",
        outcome: "All-cause and cardio-respiratory mortality",
      },
      {
        cause: "PM2.5 from traffic/industry/construction/road dust",
        pathway: "Inflammation, endothelial injury, and vascular stress",
        outcome: "IHD and stroke burden",
      },
      {
        cause: "PM2.5 and ozone accumulation",
        pathway: "Airway inflammation and impaired lung function",
        outcome: "COPD, asthma, and infectious respiratory outcomes",
      },
      {
        cause: "Flooding and heavy rainfall",
        pathway: "Water contamination and WASH disruption",
        outcome: "Diarrhoeal disease",
      },
      {
        cause: "Rainfall and temperature suitability shifts",
        pathway: "Vector breeding and transmission amplification",
        outcome: "Dengue and malaria outcomes",
      },
      {
        cause: "Drought and food-system stress",
        pathway: "Food insecurity and poor diet quality",
        outcome: "Child and maternal undernutrition",
      },
    ];
    document.getElementById("step2-pathway-map").innerHTML = `
      <div class="pathway-map">
        ${pathwayRows
          .map(
            (row) => `
              <article class="pathway-row">
                <div class="pathway-node">
                  <div class="eyebrow">Cause</div>
                  <div>${escapeHtml(row.cause)}</div>
                </div>
                <div class="pathway-arrow" aria-hidden="true">→</div>
                <div class="pathway-node">
                  <div class="eyebrow">Pathway</div>
                  <div>${escapeHtml(row.pathway)}</div>
                </div>
                <div class="pathway-arrow" aria-hidden="true">→</div>
                <div class="pathway-node pathway-node--outcome">
                  <div class="eyebrow">Outcome</div>
                  <div>${escapeHtml(row.outcome)}</div>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    const priorityRows = [
      {
        tier: "Tier 1 (Core)",
        outcomes: "Heat mortality, PM2.5-related cardio-respiratory outcomes, dengue, diarrhoeal disease",
        rationale: "Strong evidence + India relevance + RR pathway usable",
        step3: "Immediate RR extraction",
      },
      {
        tier: "Tier 2 (Secondary)",
        outcomes: "Undernutrition pathways, malaria submodules, flood-injury submodules",
        rationale: "Moderate evidence or incomplete harmonization",
        step3: "Extract where RR and baseline burden are available",
      },
      {
        tier: "Tier 3 (Emerging)",
        outcomes: "Mental health, chronic kidney heat pathways, complex occupational outcomes",
        rationale: "Evidence emerging; limited India-ready RR + DALY linkage",
        step3: "Track as research gap, not core EBOD model input",
      },
    ];
    document.getElementById("step2-priority-table").innerHTML = `
      <thead>
        <tr>
          <th>Tier</th>
          <th>Outcomes</th>
          <th>Inclusion logic</th>
          <th>Step 3 action</th>
        </tr>
      </thead>
      <tbody>
        ${priorityRows
          .map(
            (row) => `
              <tr>
                <td>${scoreText(row.tier)}</td>
                <td>${escapeHtml(row.outcomes)}</td>
                <td>${escapeHtml(row.rationale)}</td>
                <td>${escapeHtml(row.step3)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    `;

    renderBarChart(
      "step2-outcome-chart",
      Object.entries(outcomeCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
    );
    renderBarChart(
      "step2-exposure-chart",
      Object.entries(exposureCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
    );
    renderBarChart("step2-method-chart", [
      { label: "RR", value: methodReadyCount(phase2Inventory, "rr") },
      { label: "AF/PAF", value: methodReadyCount(phase2Inventory, "af") },
      { label: "DALY", value: methodReadyCount(phase2Inventory, "daly") },
      { label: "Uncertainty", value: methodReadyCount(phase2Inventory, "uncertainty") },
    ]);

    const step2PaperSearch = document.getElementById("step2-paper-search");
    const step2PaperExposureFilter = document.getElementById("step2-paper-exposure-filter");
    const step2PaperPriorityFilter = document.getElementById("step2-paper-priority-filter");
    const rrLookup = new Map(
      rrLibrary.map((row) => [
        [normalize(row.study), normalize(row.exposure), normalize(row.outcome)].join("||"),
        row,
      ])
    );
    const step2InventoryRows = step2PaperInventory.length ? step2PaperInventory : rrLibrary.map((row) => ({
          id: row.id,
          cluster: "other",
          cluster_label: clusterLabels.other,
          study: row.study,
          year: row.year,
          exposure: row.exposure,
          outcome: row.outcome,
          geography: row.geography,
          priority: normalize(row.use_main_model) === "yes" ? "High" : normalize(row.use_main_model) === "maybe" ? "Medium" : "Low",
          use_main_model: row.use_main_model,
          rr: row.rr,
          ci_lower: row.ci_lower,
          ci_upper: row.ci_upper,
          india_specific: row.india_specific,
          link: "",
        }));
    if (step2PaperInventory.length) {
      step2InventoryRows.forEach((row) => {
        const key = [normalize(row.study), normalize(row.exposure), normalize(row.outcome)].join("||");
        const rrMatch = rrLookup.get(key);
        row.rr = rrMatch ? rrMatch.rr : null;
        row.ci_lower = rrMatch ? rrMatch.ci_lower : null;
        row.ci_upper = rrMatch ? rrMatch.ci_upper : null;
        row.india_specific = rrMatch ? rrMatch.india_specific : "Not reported";
      });
    }

    function rowPriority(row) {
      return toText(row.priority);
    }

    step2PaperExposureFilter.innerHTML =
      `<option value="">All exposures</option>` +
      [...new Set(step2InventoryRows.map((row) => row.exposure))]
        .sort((a, b) => a.localeCompare(b))
        .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
        .join("");
    step2PaperPriorityFilter.innerHTML = `
      <option value="">All priority levels</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    `;

    function renderStep2PaperTable(items) {
      document.getElementById("step2-paper-table").innerHTML = `
        <thead>
          <tr>
            <th>Cluster</th>
            <th>Study</th>
            <th>Year</th>
            <th>Exposure</th>
            <th>Disease outcome</th>
            <th>Geography</th>
            <th>Priority</th>
            <th>Step 3 use</th>
            <th>RR</th>
            <th>95% CI</th>
            <th>India-specific RR</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.cluster_label || clusterLabels[row.cluster] || clusterLabels.other)}</td>
                  <td>${escapeHtml(row.study)}</td>
                  <td>${escapeHtml(row.year)}</td>
                  <td>${escapeHtml(row.exposure)}</td>
                  <td>${escapeHtml(row.outcome)}</td>
                  <td>${escapeHtml(row.geography)}</td>
                  <td>${scoreText(rowPriority(row))}</td>
                  <td>${scoreText(row.use_main_model)}</td>
                  <td>${escapeHtml(formatNumber(row.rr))}</td>
                  <td>${escapeHtml(formatCi(row.ci_lower, row.ci_upper))}</td>
                  <td>${scoreText(row.india_specific)}</td>
                  <td>${row.link ? `<a href="${escapeHtml(row.link)}" target="_blank" rel="noreferrer">Paper</a>` : "Not linked"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      `;
    }

    function applyStep2PaperFilters() {
      const query = normalize(step2PaperSearch.value);
      const exposure = normalize(step2PaperExposureFilter.value);
      const priority = normalize(step2PaperPriorityFilter.value);
      const filtered = step2InventoryRows.filter((row) => {
        const matchesExposure = !exposure || normalize(row.exposure) === exposure;
        const matchesPriority = !priority || normalize(rowPriority(row)) === priority;
        const haystack = [row.study, row.exposure, row.outcome, row.geography].join(" ").toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        return matchesExposure && matchesPriority && matchesQuery;
      }).sort((a, b) => {
        const ai = clusterOrder.indexOf(a.cluster);
        const bi = clusterOrder.indexOf(b.cluster);
        const aRank = ai === -1 ? 999 : ai;
        const bRank = bi === -1 ? 999 : bi;
        if (aRank !== bRank) return aRank - bRank;
        return toText(a.study).localeCompare(toText(b.study));
      });
      renderStep2PaperTable(filtered);
    }

    [step2PaperSearch, step2PaperExposureFilter, step2PaperPriorityFilter].forEach((element) => {
      element.addEventListener("input", applyStep2PaperFilters);
      element.addEventListener("change", applyStep2PaperFilters);
    });
    applyStep2PaperFilters();
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

  function renderNotes(text) {
    const parts = toText(text).split(/\n\s*\n/).filter(Boolean);
    const main = parts[0] ? `<p>${escapeHtml(parts[0])}</p>` : "";
    const limitation = parts[1]
      ? `<p><strong>Limitation:</strong> ${escapeHtml(parts[1].replace(/^Limitation:\s*/i, ""))}</p>`
      : "";
    return `${main}${limitation}`;
  }

  function formatNumber(value) {
    return typeof value === "number" ? value.toFixed(2) : "Not reported";
  }

  function formatCi(lower, upper) {
    if (typeof lower === "number" && typeof upper === "number") {
      return `${lower.toFixed(2)} to ${upper.toFixed(2)}`;
    }
    return "Not reported";
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
    const diseaseFilter = document.getElementById("disease-filter");
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
    diseaseFilter.innerHTML =
      `<option value="">All disease groups</option>` +
      [...new Set(inventory.map((paper) => classifyOutcome(paper.outcomes)))]
        .sort((a, b) => a.localeCompare(b))
        .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
        .join("");

    function applyFilters() {
      const phase = phaseFilter.value;
      const relevance = relevanceFilter.value;
      const disease = diseaseFilter.value;
      const query = searchInput.value.toLowerCase().trim();
      const filtered = inventory.filter((paper) => {
        const matchesPhase = !phase || paper.phase === phase;
        const matchesRelevance = !relevance || toText(paper.india_relevance).toLowerCase().includes(relevance);
        const matchesDisease = !disease || classifyOutcome(paper.outcomes) === disease;
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
        return matchesPhase && matchesRelevance && matchesDisease && matchesQuery;
      });
      renderInventoryTable(filtered);
    }

    [phaseFilter, relevanceFilter, diseaseFilter, searchInput].forEach((element) => {
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

  function setupFocusView() {
    const buttons = [...document.querySelectorAll(".focus-btn")];
    const panels = [...document.querySelectorAll(".panel[data-step]")];

    function applyFocus(mode) {
      buttons.forEach((button) => {
        button.classList.toggle("active", button.dataset.focus === mode);
      });
      panels.forEach((panel) => {
        const step = panel.dataset.step;
        const visible =
          mode === "all" ||
          (mode === "step1" && (step === "step1" || step === "meta")) ||
          (mode === "step2" && step === "step2");
        panel.classList.toggle("is-hidden", !visible);
      });
      if (mode === "step2") {
        const step2 = document.getElementById("step2");
        if (step2) step2.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => applyFocus(button.dataset.focus || "all"));
    });
  }

  renderCockpitBoard();
  renderHero();
  renderKpis();
  renderOverviewCharts();
  renderTop10();
  renderMatrix();
  renderStep2();
  renderPipeline();
  renderInputCharts();
  setupInventoryFilters();
  renderInsights();
  setupFocusView();
})();
