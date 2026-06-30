/**
 * Application Pipeline - React UI Component
 * Provides interactive interface for ZIP analysis and synthesis
 */

import { useState, useRef, useCallback } from "react";
import ApplicationPipeline from "./pipeline.js";

function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) {
      resolve(window.JSZip);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.onload = () => resolve(window.JSZip);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function TreeNode({ name, node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = node !== null && typeof node === "object";
  const pad = depth * 14;

  if (!isDir) {
    return (
      <div
        style={{
          paddingLeft: pad + 16,
          fontSize: 11,
          color: "var(--color-text-secondary)",
          lineHeight: "1.9",
          fontFamily: "var(--font-mono)",
        }}
      >
        {name}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          paddingLeft: pad,
          fontSize: 11,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          lineHeight: "1.9",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          userSelect: "none",
        }}
      >
        {open ? "▾" : "▸"} {name}/
      </div>
      {open &&
        Object.entries(node).map(([k, v]) => (
          <TreeNode key={k} name={k} node={v} depth={depth + 1} />
        ))}
    </div>
  );
}

function TagPill({ label }) {
  const map = {
    TypeScript: "#E6F1FB:#185FA5",
    "TypeScript/Node": "#E6F1FB:#185FA5",
    "JavaScript/Node": "#FAEEDA:#854F0B",
    Python: "#EAF3DE:#3B6D11",
    Go: "#E1F5EE:#0F6E56",
    Rust: "#FAECE7:#993C1D",
  };
  const colors = map[label] || "#F1EFE8:#5F5E5A";
  const [bg, fg] = colors.split(":");

  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 100,
        background: bg,
        color: fg,
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          marginTop: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          fontFamily: "var(--font-sans)",
          marginTop: 2,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export default function PipelineUI() {
  const [zips, setZips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [synthOutput, setSynthOutput] = useState("");
  const [synthStatus, setSynthStatus] = useState("");
  const [synthProgress, setSynthProgress] = useState(0);
  const [synthVisible, setSynthVisible] = useState(false);
  const fileInputRef = useRef();
  const pipelineRef = useRef(null);

  const processFiles = useCallback(
    async (files) => {
      await loadJSZip();
      const pipeline =
        pipelineRef.current ||
        new ApplicationPipeline({
          apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
        });
      pipelineRef.current = pipeline;

      const newZips = await pipeline.uploadZips(Array.from(files));
      setZips((prev) => {
        const updated = [...prev, ...newZips];
        if (updated.length > 0 && selected === null) setSelected(0);
        return updated;
      });
    },
    [selected]
  );

  const analyzeOne = useCallback(
    async (idx) => {
      if (!pipelineRef.current) return;

      const z = zips[idx];
      if (!z || z.status === "analyzing" || z.status === "done") return;

      try {
        await pipelineRef.current.analyzeOne(z);
        setZips([...zips]);
      } catch (e) {
        console.error("Analysis error:", e);
      }
    },
    [zips]
  );

  const analyzeAll = useCallback(async () => {
    if (!pipelineRef.current) return;

    for (let i = 0; i < zips.length; i++) {
      if (zips[i].status === "pending") {
        await analyzeOne(i);
      }
    }
  }, [zips, analyzeOne]);

  const synthesize = useCallback(async () => {
    if (!pipelineRef.current) return;

    const done = zips.filter((z) => z.status === "done");
    if (done.length < 2) return;

    setSynthVisible(true);
    setSynthStatus("Analyzing...");
    setSynthProgress(20);
    setSynthOutput("");

    try {
      setSynthProgress(50);
      const result = await pipelineRef.current.synthesize(done);
      setSynthOutput(result.report);
      setSynthProgress(100);
      setSynthStatus(`Synthesis complete based on ${done.length} versions`);
    } catch (e) {
      setSynthOutput("Synthesis failed: " + e.message);
      setSynthProgress(0);
    }
  }, [zips]);

  const doneCount = zips.filter((z) => z.status === "done").length;
  const typeCount = [...new Set(zips.map((z) => z.type).filter(Boolean))].length;
  const selectedZip = selected !== null ? zips[selected] : null;

  return (
    <div style={{ padding: "1rem 0", fontFamily: "var(--font-mono)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "0.03em",
            }}
          >
            ZIP SYNTHESIS PLATFORM
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginTop: 2,
              fontFamily: "var(--font-sans)",
            }}
          >
            Upload → Analyze → Align → Synthesize Enhanced Version
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={zips.length === 0}
            onClick={analyzeAll}
            style={{
              padding: "7px 14px",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent",
              color: "var(--color-text-primary)",
              fontSize: 12,
              cursor: zips.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
              opacity: zips.length === 0 ? 0.4 : 1,
            }}
          >
            Analyze All
          </button>
          <button
            disabled={doneCount < 2}
            onClick={synthesize}
            style={{
              padding: "7px 14px",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-text-primary)",
              background: "var(--color-text-primary)",
              color: "var(--color-background-primary)",
              fontSize: 12,
              cursor: doneCount < 2 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
              opacity: doneCount < 2 ? 0.4 : 1,
            }}
          >
            ▶ Generate Synthesis
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="Uploaded" value={zips.length} sub="zip files" />
        <StatCard label="Analyzed" value={doneCount} sub="completed" />
        <StatCard label="Conflicts" value={doneCount >= 2 ? "—" : "—"} sub="detected" />
        <StatCard label="Tech Stack" value={typeCount || "—"} sub="types" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Upload Area */}
          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Upload Area
              </span>
            </div>
            <div style={{ padding: 12 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  processFiles(e.dataTransfer.files);
                }}
                style={{
                  border: "0.5px dashed var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  padding: "20px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "var(--color-background-secondary)" : "transparent",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>⬡</div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Drag .zip files here
                  <br />
                  or click to select
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip"
                style={{ display: "none" }}
                onChange={(e) => processFiles(e.target.files)}
              />
            </div>
          </div>

          {/* Project List */}
          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              overflow: "hidden",
              flex: 1,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Projects
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {zips.length} files
              </span>
            </div>
            <div style={{ padding: 12 }}>
              {zips.length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    textAlign: "center",
                    padding: "20px 0",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  No files uploaded
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    maxHeight: 340,
                    overflowY: "auto",
                  }}
                >
                  {zips.map((z, i) => (
                    <div
                      key={z.id}
                      onClick={() => setSelected(i)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: "var(--border-radius-md)",
                        cursor: "pointer",
                        background:
                          selected === i ? "var(--color-background-secondary)" : "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            z.status === "done"
                              ? "#1D9E75"
                              : z.status === "analyzing"
                                ? "#EF9F27"
                                : "#888780",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {z.name}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--color-text-secondary)",
                            marginTop: 2,
                          }}
                        >
                          {z.files.length} files
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {synthVisible ? (
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: 16,
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 12,
                }}
              >
                Synthesis Report
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  fontSize: 12,
                  color: "var(--color-text-primary)",
                  lineHeight: 1.6,
                  fontFamily: "var(--font-sans)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {synthOutput}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {synthStatus}
              </div>
              {synthProgress > 0 && synthProgress < 100 && (
                <div
                  style={{
                    marginTop: 8,
                    height: 4,
                    background: "var(--color-background-secondary)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${synthProgress}%`,
                      background: "var(--color-text-primary)",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              )}
            </div>
          ) : selectedZip ? (
            <div
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: 16,
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 12,
                }}
              >
                Project Details
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {selectedZip.name}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <TagPill label={selectedZip.type} />
                </div>
              </div>
              {selectedZip.analysis && (
                <div
                  style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>Overview:</strong> {selectedZip.analysis.overview}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Architecture:</strong> {selectedZip.analysis.architecture}
                  </div>
                  <div>
                    <strong>Value:</strong> {selectedZip.analysis.value}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
