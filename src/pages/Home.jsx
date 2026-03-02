import { useEffect, useMemo, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { loadCSV, buildKNNLinks } from "../lib/loadDataset";

function toWebImageUrl(rawImage) {
  if (!rawImage) return null;
  let s = String(rawImage).trim();
  s = s.replace(/\\/g, "/"); // Windows -> Web
  const name = s.split("/").pop(); // 先用“文件名”策略
  return name ? `/dataset/images/${name}` : null;
}

export default function Home() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastEvent, setLastEvent] = useState("none");

  useEffect(() => {
    (async () => {
      const rows = await loadCSV("/dataset/meta.csv");
      const g = buildKNNLinks(rows, 6);
      setGraph(g);
    })();
  }, []);

  const activeNode = useMemo(() => selected || hovered, [selected, hovered]);

  return (
    <div style={{ height: "100vh", background: "#1a1a1a" }}>
      <ForceGraph2D
        graphData={graph}
        backgroundColor="#1a1a1a"
        nodeRelSize={8}
        enableNodeDrag={false}
        nodeLabel={(n) => `${n.image ?? ""} | rule_group: ${n.rule_group ?? ""}`}
        linkWidth={(l) => {
          const d = Number(l?.dist ?? 1);
          return Math.max(0.2, 2.2 / (d + 1));
        }}
        linkDistance={(l) => {
          const d = Number(l?.dist ?? 1);
          return 10 + d * 220;
        }}
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.35}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 40, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        onNodeHover={(node) => {
          setHovered(node || null);
          setLastEvent(node ? "hover node" : "hover none");
        }}
        onNodeClick={(node) => {
          setSelected(node);
          setLastEvent("CLICK node");
        }}
        onNodeRightClick={(node) => {
          setSelected(node);
          setLastEvent("RIGHT CLICK node");
        }}
      />

      {/* 左上角：状态 */}
      <div
        style={{
          position: "fixed",
          left: 12,
          top: 12,
          padding: "10px 12px",
          background: "rgba(0,0,0,0.55)",
          border: "1px solid #333",
          borderRadius: 10,
          color: "#fff",
          fontSize: 12,
          zIndex: 9999,
          width: 360,
        }}
      >
        <div>
          lastEvent: <b>{lastEvent}</b>
        </div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>
          hovered: {hovered?.image ? String(hovered.image) : "-"}
        </div>
        <div style={{ opacity: 0.85 }}>
          selected: {selected?.image ? String(selected.image) : "-"}
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#111",
              color: "#fff",
              fontSize: 12,
            }}
          >
            Clear Selected
          </button>
        </div>
      </div>

      {/* ✅ 右上角：固定详情面板（不再依赖右侧栏） */}
      <div
        style={{
          position: "fixed",
          right: 12,
          top: 12,
          width: 420,
          maxHeight: "92vh",
          overflow: "auto",
          padding: 14,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid #333",
          borderRadius: 12,
          color: "#eaeaea",
          zIndex: 9999,
        }}
      >
        {!activeNode ? (
          <div style={{ opacity: 0.9 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
              Detail Panel
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.85 }}>
              鼠标放到黑点上就会显示详情；点击会锁定。<br />
              如果图片不显示，说明该文件不在 public/dataset/images 根目录里。<br />
            </div>
          </div>
        ) : (
          <DetailPanel node={activeNode} />
        )}
      </div>
    </div>
  );
}

function DetailPanel({ node }) {
  const raw = node?.image ? String(node.image) : "";
  const imageUrl = toWebImageUrl(raw);

  return (
    <div>
      <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>当前：</div>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
        {raw || "(no image field)"}
      </div>

      {imageUrl && (
        <div style={{ marginBottom: 12 }}>
          <img
            src={imageUrl}
            alt={raw}
            style={{ width: "100%", borderRadius: 10, border: "1px solid #444" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            尝试加载：{imageUrl}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Metadata</div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "rgba(0,0,0,0.55)",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #333",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(node, null, 2)}
      </pre>
    </div>
  );
}