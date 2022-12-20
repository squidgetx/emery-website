function link(props) {
  const { source, target, names = ["asdf"], color, value = 1 } = props;

  return {
    source,
    target,
    names,
    color,
    value,
  };
}

function node(props) {
  const { name, type, location = "local" } = props;

  return { name, type, location };
}

icons = Object.assign(
  {},
  {
    writer: ["📝", "storage"],
    file: ["📄", "storage"],
    bucket: ["🪣", "storage"],

    config: ["🎛️", "config"],

    database: ["📕", "db"],
    sqlite: ["🪶", "db"],

    cleaner: ["🧼", "data-ops"],
    joiner: ["🖇", "data-ops"],

    model: ["🧪", "processing"],
    analytics: ["📊", "processing"],

    logfile: ["🪵", "ux"],
    ui: ["💻", "ux"],
  }
);

function mutateRepeatNode({ nodes, links }, { nodeName, n }) {
  let node = nodes.find((d) => d.name === nodeName);

  let newNodes = [];
  let newLinks = [];

  for (let i = 0; i < n; i++) {
    newNodes.push(
      Object.assign({}, { ...node, name: node.name + `.${i + 1}` })
    );
  }
  for (const node of nodes) {
    if (node.name !== nodeName) newNodes.push(node);
  }

  for (const link of links) {
    // If link's source has been split into multiple files
    if (link.source === nodeName) {
      for (let i = 0; i < n; i++) {
        newLinks.push({
          ...link,
          source: node.name + `.${i + 1}`,
          value: link.value / n,
        });
      }
      continue;
    }
    if (link.target === nodeName) {
      for (let i = 0; i < n; i++) {
        newLinks.push({
          ...link,
          target: node.name + `.${i + 1}`,
          value: link.value / n,
        });
      }
      continue;
    }
    newLinks.push(link);
  }

  return { nodes: newNodes, links: newLinks };
}

function applyChain(graph, callList) {
  let { links, nodes } = graph;
  var newGraph = { links, nodes };

  for (const { fn, ...args } of callList) {
    console.log(fn);
    newGraph = fn(
      { links: newGraph.links, nodes: newGraph.nodes },
      { ...args }
    );
  }

  return newGraph;
}

/* charts */

const graphCompose = applyChain(
  {
    links: [
      link({ source: "c1", target: "w1" }),
      link({ source: "w1", target: "a1" }),
      link({ source: "db1", target: "ui1" }),
      link({ source: "a1", target: "db1" }),
    ],
    nodes: [
      node({ name: "c1", type: "config" }),
      node({ name: "a1", type: "analytics", location: "cloud" }),
      node({ name: "w1", type: "writer" }),
      node({ name: "db1", type: "database" }),
      node({ name: "ui1", type: "ui" }),
    ],
  },
  [{ fn: mutateRepeatNode, nodeName: "w1", n: 10 }]
);

const graphAnalytics2 = applyChain(
  {
    links: [
      link({ source: "f1", target: "c1" }),
      link({ source: "c1", target: "m1" }),
      link({ source: "m1", target: "m2" }),
      link({ source: "m2", target: "m3" }),
      link({ source: "m3", target: "a1" }),
      link({ source: "m1", target: "l1", value: 0.1 }),
      link({ source: "m2", target: "l1", value: 0.1 }),
      link({ source: "m3", target: "l1", value: 0.1 }),
      link({ source: "a1", target: "s1" }),
      link({ source: "m3", target: "b1" }),
      link({ source: "s1", target: "b1" }),
      link({ source: "l1", target: "b1", value: 0.3 }),
    ],
    nodes: [
      node({ name: "f1", type: "file" }),
      node({ name: "c1", type: "cleaner" }),
      node({ name: "m1", type: "model" }),
      node({ name: "m2", type: "joiner" }),
      node({ name: "m3", type: "model" }),
      node({ name: "a1", type: "analytics" }),
      node({ name: "l1", type: "logfile" }),
      node({ name: "s1", type: "sqlite" }),
      node({ name: "b1", type: "bucket" }),
    ],
  },
  [
    { fn: mutateRepeatNode, nodeName: "f1", n: 10 },
    { fn: mutateRepeatNode, nodeName: "m1", n: 4 },
  ]
);

const graphWarehouse = applyChain(
  {
    links: [
      link({ source: "sql1", target: "db1" }),
      link({ source: "f1", target: "db1" }),
      link({ source: "b1", target: "db1" }),
      link({ source: "db1", target: "ui1", value: 3 }),
    ],
    nodes: [
      node({ name: "sql1", type: "sqlite", location: "cloud" }),
      node({ name: "f1", type: "file" }),
      node({ name: "b1", type: "bucket", location: "cloud" }),
      node({ name: "db1", type: "database", location: "local" }),
      node({ name: "ui1", type: "ui" }),
    ],
  },
  [
    { fn: mutateRepeatNode, nodeName: "f1", n: 6 },
    { fn: mutateRepeatNode, nodeName: "sql1", n: 3 },
  ]
);

const graphWarehouse2 = applyChain(
  {
    links: [
      link({ source: "sql1", target: "db1" }),
      link({ source: "f1", target: "c1" }),
      link({ source: "c1", target: "c2" }),
      link({ source: "c2", target: "c3" }),
      link({ source: "c3", target: "f2" }),
      link({ source: "f2", target: "db1" }),
      link({ source: "b1", target: "db1" }),
      link({ source: "db1", target: "ui1", value: 3 }),
    ],
    nodes: [
      node({ name: "sql1", type: "sqlite", location: "cloud" }),
      node({ name: "f1", type: "file" }),
      node({ name: "f2", type: "file" }),
      node({ name: "b1", type: "bucket", location: "cloud" }),
      node({ name: "c1", type: "cleaner" }),
      node({ name: "c2", type: "cleaner" }),
      node({ name: "c3", type: "cleaner" }),
      node({ name: "db1", type: "database", location: "local" }),
      node({ name: "ui1", type: "ui" }),
    ],
  },
  [
    { fn: mutateRepeatNode, nodeName: "f1", n: 6 },
    { fn: mutateRepeatNode, nodeName: "f2", n: 6 },
    { fn: mutateRepeatNode, nodeName: "sql1", n: 3 },
  ]
);

const graphSQLiteModeling = applyChain(
  {
    links: [
      link({ source: "sql1", target: "m1" }),
      link({ source: "m1", target: "f1" }),
      link({ source: "f1", target: "b1" }),
      link({ source: "c1", target: "m1" }),
    ],
    nodes: [
      node({ name: "sql1", type: "sqlite", location: "cloud" }),
      node({ name: "m1", type: "model", location: "local" }),
      node({ name: "c1", type: "config" }),
      node({ name: "f1", type: "file" }),
      node({ name: "b1", type: "bucket", location: "cloud" }),
    ],
  },
  [{ fn: mutateRepeatNode, nodeName: "m1", n: 6 }]
);

const graphBuckets = Object.assign(
  {},
  {
    links: [
      // Cleaner 1 inputs
      link({ source: "b1", target: "f1-1", names: ["asdf"], value: 1 }),
      link({ source: "b1", target: "f1-2", names: ["asdf"], value: 1 }),
      link({ source: "b1", target: "f1-3", names: ["asdf"], value: 1 }),
      link({ source: "b2", target: "f2-1", names: ["asdf"], value: 1 }),
      link({ source: "b2", target: "f2-2", names: ["asdf"], value: 1 }),
      link({ source: "b2", target: "f2-3", names: ["asdf"], value: 1 }),
      link({ source: "b3", target: "f3-1", names: ["asdf"], value: 1 }),
      link({ source: "b3", target: "f3-2", names: ["asdf"], value: 1 }),
      link({ source: "b3", target: "f3-3", names: ["asdf"], value: 1 }),

      link({ source: "f1-1", target: "m1", names: ["asdf"], value: 1 }),
      link({ source: "f1-2", target: "m1", names: ["asdf"], value: 1 }),
      link({ source: "f1-3", target: "m1", names: ["asdf"], value: 1 }),
      link({ source: "f2-1", target: "m1", names: ["asdf"], value: 1 }),
      link({ source: "f2-2", target: "m1", names: ["asdf"], value: 1 }),
      link({ source: "f2-3", target: "m1", names: ["asdf"], value: 1 }),

      link({ source: "m1", target: "lf1", names: ["asdf"], value: 1 }),
      link({ source: "m2", target: "lf2", names: ["asdf"], value: 1 }),

      link({ source: "f3-1", target: "m2", names: ["asdf"], value: 1 }),
      link({ source: "f3-2", target: "m2", names: ["asdf"], value: 1 }),
      link({ source: "f3-3", target: "m2", names: ["asdf"], value: 1 }),

      link({
        source: "c1",
        target: "m1",
        names: ["analytics config"],
        value: 0.2,
      }),
      link({
        source: "c1",
        target: "m2",
        names: ["analytics config"],
        value: 0.2,
      }),

      link({ source: "m1", target: "a1", names: ["asdf"], value: 1 }),
      link({ source: "m2", target: "a2", names: ["asdf"], value: 1 }),

      link({ source: "m1", target: "of1", names: ["asdf"], value: 1 }),
      link({ source: "m2", target: "of2", names: ["asdf"], value: 1 }),

      link({ source: "of1", target: "a1", names: ["asdf"], value: 1 }),
      link({ source: "of2", target: "a2", names: ["asdf"], value: 1 }),

      link({ source: "of1", target: "sql1", names: ["asdf"], value: 1 }),
      link({ source: "of2", target: "sql1", names: ["asdf"], value: 1 }),

      link({ source: "a1", target: "sql1", names: ["asdf"], value: 1 }),
      link({ source: "a2", target: "sql1", names: ["asdf"], value: 1 }),

      link({ source: "lf1", target: "sql1", names: ["asfd"], value: 1 }),
      link({ source: "lf2", target: "sql1", names: ["asfd"], value: 1 }),

      link({
        source: "sql1",
        target: "result_bucket",
        names: ["asdf"],
        value: 1,
      }),
    ],
    nodes: [
      node({ name: "b1", type: "bucket" }),
      node({ name: "b2", type: "bucket" }),
      node({ name: "b3", type: "bucket" }),
      node({ name: "result_bucket", type: "bucket" }),

      node({ name: "f1-1", type: "file" }),
      node({ name: "f1-2", type: "file" }),
      node({ name: "f1-3", type: "file" }),
      node({ name: "f2-1", type: "file" }),
      node({ name: "f2-2", type: "file" }),
      node({ name: "f2-3", type: "file" }),
      node({ name: "f3-1", type: "file" }),
      node({ name: "f3-2", type: "file" }),
      node({ name: "f3-3", type: "file" }),

      node({ name: "a1", type: "analytics" }),
      node({ name: "a2", type: "analytics" }),

      node({ name: "of1", type: "file" }),
      node({ name: "of2", type: "file" }),

      node({ name: "m1", type: "model" }),
      node({ name: "m2", type: "model" }),

      node({ name: "c1", type: "config" }),
      node({ name: "sql1", type: "sqlite" }),
      node({ name: "lf1", type: "logfile" }),
      node({ name: "lf2", type: "logfile" }),
    ],
  }
);

const graphMapReduce = Object.assign(
  {},
  {
    links: [
      // Cleaner 1 inputs
      link({ source: "file 1", target: "a1", names: ["asdf"], value: 1 }),
      link({ source: "file 2", target: "a2", names: ["asdf"], value: 1 }),
      link({ source: "file 3", target: "a3", names: ["asdf"], value: 1 }),
      link({ source: "file 4", target: "a1", names: ["asdf"], value: 1 }),
      link({ source: "file 5", target: "a2", names: ["asdf"], value: 1 }),
      link({ source: "file 6", target: "a3", names: ["asdf"], value: 1 }),

      link({
        source: "config 1",
        target: "a1",
        names: ["analytics config"],
        value: 0.2,
      }),
      link({
        source: "config 1",
        target: "a2",
        names: ["analytics config"],
        value: 0.2,
      }),
      link({
        source: "config 1",
        target: "a3",
        names: ["analytics config"],
        value: 0.2,
      }),

      link({ source: "a1", target: "sql1", names: ["asdf"], value: 1 }),
      link({ source: "a2", target: "sql1", names: ["asdf"], value: 1 }),
      link({ source: "a3", target: "sql1", names: ["asfd"], value: 1 }),
      link({ source: "a1", target: "lf1", names: ["asdf"], value: 1 }),
      link({ source: "a2", target: "lf1", names: ["asdf"], value: 1 }),
      link({ source: "a3", target: "lf1", names: ["asfd"], value: 1 }),

      link({ source: "lf1", target: "sql2", names: ["asfd"], value: 1 }),

      link({ source: "sql1", target: "s3-1", names: ["asdf"], value: 1 }),
      link({ source: "sql2", target: "s3-1", names: ["asdf"], value: 1 }),
    ],
    nodes: [
      node({ name: "file 1", type: "file" }),
      node({ name: "file 2", type: "file" }),
      node({ name: "file 3", type: "file" }),
      node({ name: "file 4", type: "file" }),
      node({ name: "file 5", type: "file" }),
      node({ name: "file 6", type: "file" }),
      node({ name: "a1", type: "analytics" }),
      node({ name: "a2", type: "analytics" }),
      node({ name: "a3", type: "analytics" }),
      node({ name: "config 1", type: "config" }),
      node({ name: "s3-1", type: "bucket" }),
      node({ name: "sql1", type: "sqlite" }),
      node({ name: "sql2", type: "sqlite" }),
      node({ name: "lf1", type: "logfile" }),
    ],
  }
);

const graph1 = Object.assign(
  {},
  {
    links: [
      // Cleaner 1 inputs
      link({
        source: "file 1",
        target: "cleaner 1",
        names: ["file1.csv"],
        value: 1,
      }),
      link({
        source: "file 2",
        target: "cleaner 2",
        names: ["file2.tiff"],
        value: 1,
      }),
      link({
        source: "file 3",
        target: "cleaner 3",
        names: ["file3.json"],
        value: 1,
      }),

      link({
        source: "config 2",
        target: "joiner 1",
        names: ["joiner config"],
        value: 0.2,
      }),
      link({
        source: "cleaner 1",
        target: "joiner 1",
        names: ["cleaned csv"],
        value: 1,
      }),
      link({
        source: "cleaner 2",
        target: "joiner 1",
        names: ["cleaned image"],
        value: 1,
      }),
      link({
        source: "cleaner 3",
        target: "model 1",
        names: ["cleaned json"],
        value: 1,
      }),
      link({
        source: "config 1",
        target: "model 1",
        names: ["model config"],
        value: 0.2,
      }),
      link({
        source: "cleaner 1",
        target: "logfile 1",
        names: ["cleaner 1 logs"],
        value: 0.2,
      }),
      link({
        source: "cleaner 2",
        target: "logfile 1",
        names: ["cleaner 2 logs"],
        value: 0.2,
      }),
      link({
        source: "cleaner 3",
        target: "logfile 1",
        names: ["cleaner 3 logs"],
        value: 0.2,
      }),

      link({
        source: "joiner 1",
        target: "model 1",
        names: ["model input"],
        value: 2,
      }),
      link({
        source: "joiner 1",
        target: "logfile 2",
        names: ["joiner logs"],
        value: 0.2,
      }),

      link({
        source: "model 1",
        target: "logfile 3",
        names: ["model logs"],
        value: 0.2,
      }),
      link({
        source: "model 1",
        target: "serializer - csv",
        names: ["model output"],
        value: 1,
      }),
      link({
        source: "model 1",
        target: "database driver 1",
        names: ["model output"],
        value: 1,
      }),
      link({
        source: "database driver 1",
        target: "database 1",
        names: ["Postgres wire protocol"],
        value: 1,
      }),
      link({
        source: "serializer - csv",
        target: "bucket 1",
        names: ["HTTP"],
        value: 1,
      }),

      link({
        source: "logfile 1",
        target: "web ui 1",
        names: ["web ui"],
        value: 0.6,
      }),
      link({
        source: "logfile 2",
        target: "web ui 1",
        names: ["web ui"],
        value: 0.2,
      }),
      link({
        source: "logfile 3",
        target: "web ui 1",
        names: ["web ui"],
        value: 0.2,
      }),
      link({
        source: "logfile 1",
        target: "bucket 2",
        names: ["bucket 2"],
        value: 0.6,
      }),
      link({
        source: "logfile 2",
        target: "bucket 2",
        names: ["bucket 2"],
        value: 0.2,
      }),
      link({
        source: "logfile 3",
        target: "bucket 2",
        names: ["bucket 2"],
        value: 0.2,
      }),
    ],
    nodes: [
      node({ name: "file 1", type: "file" }),
      node({ name: "file 2", type: "file" }),
      node({ name: "file 3", type: "file" }),
      node({ name: "cleaner 1", type: "cleaner" }),
      node({ name: "cleaner 2", type: "cleaner" }),
      node({ name: "cleaner 3", type: "cleaner" }),
      node({ name: "joiner 1", type: "joiner" }),
      node({ name: "config 1", type: "config" }),
      node({ name: "config 2", type: "config" }),
      node({ name: "model 1", type: "model", location: "cloud" }),
      node({ name: "serializer - csv", type: "writer" }),
      node({ name: "database driver 1", type: "writer" }),
      node({ name: "database 1", type: "database" }),
      node({ name: "bucket 1", type: "bucket" }),
      node({ name: "bucket 2", type: "bucket" }),
      node({ name: "logfile 1", type: "logfile" }),
      node({ name: "logfile 2", type: "logfile" }),
      node({ name: "logfile 3", type: "logfile" }),
      node({ name: "web ui 1", type: "ui" }),
    ],
  }
);

const graph2 = mutateRepeatNode(
  mutateRepeatNode(graph1, { nodeName: "file 1", n: 5 }),
  { nodeName: "cleaner 1", n: 2 }
);

const linkColor = ({ source, target }) => {
  if (source.type === "logfile") return "black";

  if (source.type === "config") return "#fccf03";

  if (target.type === "logfile") return "black";

  if (source.location === "cloud" || target.location === "cloud")
    return "rgb(181, 231, 235)";

  var c = d3.scaleOrdinal(d3.schemePastel1).domain(_.keys(icons))(source.type);
  c = d3.hsl(c);
  c.s = 0.2;
  c.l = 0.89;

  return c + "";
};

const linkBlendMode = function ({ source }) {
  if (source.type === "config") return null;

  return "multiply";
};

const linkWidth = ({ source, target, width }) => {
  if (target.type === "logfile" || source.type === "logfile") return 2;

  if (source.type === "config") return 4;

  return width;
};

const circleColor = (node) => {
  if (node.type === "config") return "#fccf03";

  return locationColor(node.location);
};

const linkDashArray = ({ source, target }) => {
  if (source.type === "config") return null;
  if (source.location !== target.location) return "24 1.5";

  return null;
};

const locationColor = d3
  .scaleOrdinal()
  .domain(["local", "cloud"])
  .range(["#ccc", "rgb(40, 156, 181)"]);

const linkOpacity = ({ source, target }) =>
  source.type === "logfile" || target.type === "logfile" ? 0.4 : 1;

const shadowFill = ({ type }) => {
  if (type === "config" || type === "ui") return "gold";

  return "white";
};

const width = 900;
const height = 375;

const sankey = d3
  .sankey()
  .nodeSort(null)
  .nodeAlign(d3.sankeyCenter)
  .nodeId((d) => d.name)
  .linkSort(null)
  .nodeWidth(15)
  .nodePadding(25)
  .extent([
    [15, 15],
    [width - 30, height - 30],
  ]);

const chart = function (graphToChart) {
  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const glowFilter = svg
    .append("defs")
    .append("filter")
    .attr("id", "shadow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  glowFilter
    .append("feGaussianBlur")
    .attr("stdDeviation", "4 4")
    .attr("result", "shadow");

  glowFilter
    .append("feOffset")
    .append("feMergeNode")
    .attr("dx", 6)
    .attr("dy", 6);

  const { nodes, links } = sankey({
    nodes: graphToChart.nodes.map((d) => Object.assign({}, d)),
    links: graphToChart.links.map((d) => Object.assign({}, d)),
  });

  const circleRadius = 11;

  svg
    .append("g")
    .selectAll("rect")
    .data(nodes.filter(({ location }) => location === "cloud"))
    .join("rect")
    .attr("x", (d) => d.x0 - 3)
    .attr("y", (d) => d.y0 - 3)
    .attr("height", (d) => d.y1 - d.y0 + 6)
    .attr("width", (d) => d.x1 - d.x0 + 6)
    .attr("fill", (d) => "rgb(3, 207, 252)")
    .attr("filter", "url(#shadow)");

  svg
    .append("g")
    .selectAll("rect")
    .data(nodes.filter(({ y1, y0 }) => y1 - y0 > circleRadius + 25))
    .join("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("fill", (d) => locationColor(d.location));

  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("g")
    .data(links.filter((d) => d.source.type === "config"))
    .join("path")
    .attr("d", (d) => {
      return d3
        .link(d3.curveStep)
        .source((d) => [d.source.x1, d.y0])
        .target((d) => [d.target.x0, d.y1])(d);
    })
    .attr("stroke", linkColor)
    .attr("stroke-opacity", linkOpacity)
    .attr("stroke-width", linkWidth)
    .attr("stroke-dasharray", linkDashArray)
    .attr("filter", "url(#shadow)")
    .style("mix-blend-mode", linkBlendMode);

  svg
    .append("g")
    .attr("fill", "none")
    .selectAll("g")
    .data(links)
    .join("path")
    .attr("d", (d) => {
      if (d.source.type === "config")
        return d3
          .link(d3.curveStep)
          .source((d) => [d.source.x1, d.y0])
          .target((d) => [d.target.x0, d.y1])(d);
      else return d3.sankeyLinkHorizontal()(d);
    })
    .attr("stroke", linkColor)
    .attr("stroke-opacity", linkOpacity)
    .attr("stroke-width", linkWidth)
    .attr("stroke-dasharray", linkDashArray)
    .style("mix-blend-mode", linkBlendMode);

  svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("stroke", circleColor)
    .attr("stroke-width", 4)
    .attr("cx", (d) => (d.x1 + d.x0) / 2)
    .attr("cy", (d) => (d.y1 + d.y0) / 2)
    .attr("r", circleRadius)
    .attr("fill", "#ccc");

  svg
    .append("g")
    .style("font", "26px sans-serif")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (d) => (d.x1 + d.x0) / 2)
    .attr("cy", (d) => (d.y1 + d.y0) / 2)
    .attr("r", 17)
    .attr("fill", shadowFill)
    .attr("filter", "url(#shadow)");

  svg
    .append("g")
    .style("font", "29px sans-serif")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => (d.x1 + d.x0) / 2)
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .text((d) => icons[d.type][0]);

  svg
    .append("g")
    .selectAll("circle")
    .data(nodes.filter(({ location }) => location === "cloud"))
    .join("circle")
    .attr("cx", (d) => d.x1)
    .attr("cy", (d) => d.y0)
    .attr("r", 8)
    .attr("filter", "url(#shadow)")
    .attr("fill", "rgb(3, 207, 252)");

  svg
    .append("g")
    .style("font", "17.5px sans-serif")
    .selectAll("text")
    .data(nodes.filter(({ location }) => location === "cloud"))
    .join("text")
    .attr("x", (d) => d.x1)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text("⛅");

  return svg.node();
};

window.onload = function () {
  const allGraphs = {
    compose: graphCompose,
    analytics: graphAnalytics2,
    analytics2: graphAnalytics2,
    warehouse: graphWarehouse,
    warehouse2: graphWarehouse2,
    sqlite: graphSQLiteModeling,
    graph1: graph1,
    graph2: graph2,
    mapReduce: graphMapReduce,
    buckets: graphBuckets,
  };

  var currentChartKey = _.sample(_.keys(allGraphs));
  document.getElementById("viz").appendChild(chart(allGraphs[currentChartKey]));

  const getNextChart = (currentChartKey) => {
    const candidates = _.keys(allGraphs).filter(
      (str) => str !== currentChartKey
    );
    const winner = _.sample(candidates);

    return { nextChartKey: winner, graph: allGraphs[winner] };
  };

  document.getElementById("viz").addEventListener("click", (e) => {
    const result = getNextChart(currentChartKey);
    currentChartKey = result.nextChartKey;

    document.getElementById("viz").innerHTML = "";
    document.getElementById("viz").appendChild(chart(result.graph));
  });
};

// todo
// pull in the other charts
// dynmaically set width/height
// reset/regen on touch/click event
