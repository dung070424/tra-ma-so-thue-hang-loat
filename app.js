document.getElementById("run").addEventListener("click", async () => {
  const codesText = document.getElementById("codes").value || "";
  const codes = codesText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (codes.length === 0) {
    alert("Vui lòng nhập ít nhất một mã số thuế");
    return;
  }

  const res = await fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codes }),
  });
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }
  const jobId = data.jobId;
  document.getElementById("job").textContent = `Job: ${jobId}`;

  const logsEl = document.getElementById("logs");
  logsEl.textContent = "";

  const es = new EventSource(`/events/${jobId}`);
  es.onmessage = (e) => {
    if (!e.data) return;
    if (e.data.startsWith("RESULT_FILE:")) {
      const file = e.data.substring("RESULT_FILE:".length);
      // fetch CSV and render as table
      fetch(`/download?file=${encodeURIComponent(file)}`)
        .then((r) => r.text())
        .then((txt) => {
          // remove BOM
          let content = txt;
          if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
          const rows = content
            .split(/\r?\n/)
            .filter(Boolean)
            .map((r) => parseCsvRow(r));
          renderTable(rows);
          // also add download link
          const a = document.createElement("a");
          a.href = `/download?file=${encodeURIComponent(file)}`;
          a.textContent = `Tải CSV: ${file}`;
          a.style.display = "block";
          document.getElementById("results").appendChild(a);
        })
        .catch((err) => {
          logsEl.appendChild(
            document.createTextNode("Lỗi tải kết quả: " + err.message + "\n"),
          );
        });
      return;
    }
    if (e.data === "__DONE__") {
      logsEl.appendChild(document.createTextNode("\n--- DONE ---\n"));
      es.close();
      return;
    }
    const clean = e.data.replace(/\u001b\[[0-9;]*m/g, "");
    logsEl.appendChild(document.createTextNode(clean + "\n"));
    logsEl.scrollTop = logsEl.scrollHeight;
  };
  es.onerror = (err) => {
    console.error("EventSource error", err);
    es.close();
  };
});

document.getElementById("load").addEventListener("click", async () => {
  try {
    const res = await fetch("/latest");
    const j = await res.json();
    if (j.error) {
      alert(j.error);
      return;
    }
    const file = j.file;
    const txt = await (
      await fetch(`/download?file=${encodeURIComponent(file)}`)
    ).text();
    let content = txt;
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    const rows = content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((r) => parseCsvRow(r));
    renderTable(rows);
    const a = document.createElement("a");
    a.href = `/download?file=${encodeURIComponent(file)}`;
    a.textContent = `Tải CSV: ${file}`;
    a.style.display = "block";
    const resDiv = document.getElementById("results");
    resDiv.appendChild(a);
  } catch (e) {
    alert("Lỗi tải bảng: " + e.message);
  }
});

function parseCsvRow(line) {
  const cells = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuote = !inQuote;
      continue;
    }
    if (ch === "," && !inQuote) {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function renderTable(rows) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  if (!rows || rows.length === 0) {
    container.textContent = "Không có dữ liệu";
    return;
  }
  const table = document.createElement("table");
  table.className = "result-table";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  rows[0].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let i = 1; i < rows.length; i++) {
    const tr = document.createElement("tr");
    rows[i].forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}
