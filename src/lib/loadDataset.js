import Papa from "papaparse";

export async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
  return parsed.data.filter(
    (r) => r && Object.keys(r).some((k) => r[k] !== null && r[k] !== "")
  );
}

// 用 5 个特征做 KNN 连边（每个点连最近 k 个）
export function buildKNNLinks(rows, k = 6) {
  const nodes = rows.map((r, idx) => ({
    id: String(idx),
    ...r,
  }));

  const links = [];

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const aVec = [
      Number(a.whiteness),
      Number(a.edge),
      Number(a.color),
      Number(a.horizontal),
      Number(a.texture),
    ];

    const dists = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const bVec = [
        Number(b.whiteness),
        Number(b.edge),
        Number(b.color),
        Number(b.horizontal),
        Number(b.texture),
      ];

      const dist = Math.sqrt(
        aVec.reduce((sum, val, t) => {
          const diff = val - bVec[t];
          return sum + diff * diff;
        }, 0)
      );

      dists.push({ j, dist });
    }

    dists.sort((p, q) => p.dist - q.dist);

    for (let t = 0; t < Math.min(k, dists.length); t++) {
      const b = nodes[dists[t].j];
      links.push({ source: a.id, target: b.id, dist: dists[t].dist });
    }
  }

  return { nodes, links };
}