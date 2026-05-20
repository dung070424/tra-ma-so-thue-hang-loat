const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const WEB_DIR = path.join(__dirname, "web");

const jobs = {}; // jobId -> { logs: [], proc, clients: [], done, startTime }

function serveStatic(req, res) {
  let url = req.url.split("?")[0];
  if (url === "/" || url === "/index.html") url = "/index.html";
  const filePath = path.join(WEB_DIR, url);
  if (!filePath.startsWith(WEB_DIR)) return notFound(res);
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
    };
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
    });
    stream.pipe(res);
  });
}

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function createJob(codes) {
  const jobId = crypto.randomBytes(8).toString("hex");
  const tmpFile = path.join(os.tmpdir(), `mst_${jobId}.txt`);
  fs.writeFileSync(tmpFile, codes.join("\n"));

  const job = {
    logs: [],
    clients: [],
    done: false,
    startTime: Date.now(),
    tmpFile,
  };
  jobs[jobId] = job;

  // spawn the existing script
  const proc = spawn(
    process.execPath,
    [path.join(__dirname, "tramaMST.js"), tmpFile],
    { cwd: process.cwd() },
  );
  job.proc = proc;

  proc.stdout.on("data", (d) => pushLog(jobId, d.toString()));
  proc.stderr.on("data", (d) => pushLog(jobId, d.toString()));

  proc.on("close", (code) => {
    pushLog(jobId, `PROCESS_EXIT code=${code}\n`);
    job.done = true;
  });

  return jobId;
}

function pushLog(jobId, text) {
  const job = jobs[jobId];
  if (!job) return;
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const l of lines) job.logs.push(l);
  // stream to connected clients
  for (const res of job.clients) {
    for (const l of lines)
      res.write(`data: ${l.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")}\n\n`);
  }
}

function findResultFile(sinceMs) {
  const files = fs
    .readdirSync(process.cwd())
    .filter((f) => f.startsWith("ketqua_mst_") && f.endsWith(".csv"));
  let best = null;
  for (const f of files) {
    try {
      const st = fs.statSync(path.join(process.cwd(), f));
      if (st.mtimeMs >= sinceMs) {
        if (!best || st.mtimeMs > best.mtime)
          best = { name: f, mtime: st.mtimeMs };
      }
    } catch (e) {}
  }
  return best ? best.name : null;
}

function findResultFileFromLogs(job) {
  // try to parse CSV path from logs (look for ketqua_mst_*.csv)
  for (let i = job.logs.length - 1; i >= 0; i--) {
    const line = job.logs[i];
    const m = line.match(/(ketqua_mst_[0-9]+\.csv)/i);
    if (m) return m[1];
    const m2 = line.match(/([A-Z]:\\.*ketqua_mst_[0-9]+\.csv)/i);
    if (m2) return path.basename(m2[1]);
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  if (
    req.method === "GET" &&
    (req.url === "/" ||
      req.url.startsWith("/index.html") ||
      req.url.startsWith("/app.js") ||
      req.url.startsWith("/style.css"))
  ) {
    return serveStatic(req, res);
  }

  if (req.method === "POST" && req.url === "/run") {
    try {
      const body = await parseJsonBody(req);
      const codes = Array.isArray(body.codes)
        ? body.codes
        : String(body.codes || "")
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
      if (codes.length === 0)
        return res.end(JSON.stringify({ error: "No codes provided" }));
      const jobId = createJob(codes);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ jobId }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // SSE stream
  if (req.method === "GET" && req.url.startsWith("/events/")) {
    const jobId = req.url.split("/")[2];
    const job = jobs[jobId];
    if (!job) return notFound(res);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    // send existing logs
    for (const l of job.logs)
      res.write(`data: ${l.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")}\n\n`);
    job.clients.push(res);

    req.on("close", () => {
      job.clients = job.clients.filter((r) => r !== res);
    });

    // when job finishes, send result file path if found, then end
    (async () => {
      while (!job.done) await new Promise((r) => setTimeout(r, 200));
      let file = findResultFile(job.startTime);
      if (!file) file = findResultFileFromLogs(job);
      if (file) res.write(`data: RESULT_FILE:${file}\n\n`);
      res.write("data: __DONE__\n\n");
      res.end();
    })();

    return;
  }

  // download result
  if (req.method === "GET" && req.url.startsWith("/download")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const file = url.searchParams.get("file");
    if (!file) return notFound(res);
    const filePath = path.join(process.cwd(), path.basename(file));
    if (!fs.existsSync(filePath)) return notFound(res);
    res.writeHead(200, {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // latest file endpoint
  if (req.method === "GET" && req.url === "/latest") {
    try {
      const files = fs
        .readdirSync(process.cwd())
        .filter((f) => f.startsWith("ketqua_mst_") && f.endsWith(".csv"));
      if (files.length === 0)
        return res.end(JSON.stringify({ error: "No files" }));
      files.sort(
        (a, b) =>
          fs.statSync(path.join(process.cwd(), b)).mtimeMs -
          fs.statSync(path.join(process.cwd(), a)).mtimeMs,
      );
      return res.end(JSON.stringify({ file: files[0] }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  notFound(res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Web UI server running at http://localhost:${PORT}`),
);
