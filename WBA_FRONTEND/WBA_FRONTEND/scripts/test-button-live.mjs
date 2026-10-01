const WebSocket = globalThis.WebSocket;

async function checkButtons() {
  const versionRes = await fetch("http://localhost:9222/json/list");
  const pages = await versionRes.json();
  const page = pages.find((p) => p.type === "page" && p.url.includes("blockpages"));
  if (!page) {
    console.error("No blockpages target found!");
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => { ws.onopen = r; });

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(fnStr) {
    const res = await send("Runtime.evaluate", {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  await send("Page.navigate", { url: "http://localhost:3000/blockpages/?template=ecommerce" });
  await new Promise((r) => setTimeout(r, 2500));

  // Switch to Button editing mode
  await evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const btnSpan = spans.find((s) => s.textContent?.trim() === "Button");
    btnSpan?.parentElement?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const details = await evaluate(() => {
    const container = document.querySelector("[data-textblock-canvas]");
    if (!container) return { error: "No container" };

    const pens = Array.from(document.querySelectorAll('[data-blockpages-overlay-kind="button"]'));
    const penMap = new Map();
    pens.forEach((p) => {
      const id = p.getAttribute("data-blockpages-overlay-btn");
      const top = p.style.top;
      const left = p.style.left;
      penMap.set(id, { top, left, title: p.getAttribute("title"), aria: p.getAttribute("aria-label") });
    });

    const allButtons = Array.from(container.querySelectorAll("button, a"));
    return allButtons.map((el, index) => {
      const id = el.getAttribute("data-blockpages-button-id");
      const rect = el.getBoundingClientRect();
      const isVisible = el.offsetParent !== null && rect.width > 0 && rect.height > 0;
      const section = el.closest("section[id], [data-blockpages-section-id], article, footer, [id]");
      const sectionId = section?.getAttribute("data-blockpages-section-id") || section?.id || section?.tagName.toLowerCase();
      const productCard = el.closest(".buyscreen-product-card, article");
      const productName = productCard?.querySelector("p.uppercase, [class*='product-meta'] p")?.textContent?.trim();
      const hasPen = penMap.has(id);
      const pen = penMap.get(id);

      return {
        index,
        tagName: el.tagName,
        id,
        text: el.textContent?.trim().slice(0, 25) || el.getAttribute("aria-label") || el.getAttribute("title"),
        aria: el.getAttribute("aria-label"),
        productName,
        sectionId,
        isVisible,
        hasPen,
        penPos: pen ? `${pen.top}, ${pen.left}` : null,
      };
    }).filter(b => b.id || b.hasPen || b.isVisible);
  });

  console.log("=== BUTTONS WITH ID / PEN IN E-COMMERCE ===");
  console.table(details);

  ws.close();
}

checkButtons().catch(console.error);
