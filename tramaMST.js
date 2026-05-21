/**
 * Tool Tra Cứu Mã Số Thuế & Trạng Thái Công Ty từ MaSoThue.com
 * Xuất bản: Bản đóng gói Executable (.exe) chuyên nghiệp
 * Cột xuất: STT, Tên công ty, Mã số thuế, Trạng thái hoạt động
 */

// Sửa lỗi tương thích Crypto trong môi trường đóng gói Node 18 pkg
if (!globalThis.crypto) {
  try {
    globalThis.crypto = require("crypto").webcrypto;
  } catch (e) {
    // Fallback im lặng nếu môi trường không hỗ trợ
  }
}

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m",
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

function printBanner() {
  console.log(
    `${colors.fg.cyan}${colors.bright}================================================================${colors.reset}`,
  );
  console.log(
    `${colors.fg.cyan}${colors.bright}      TOOL TRA CỨU MÃ SỐ THUẾ & TRẠNG THÁI CÔNG TY TỰ ĐỘNG      ${colors.reset}`,
  );
  console.log(
    `${colors.fg.cyan}                  Website: https://masothue.com                 ${colors.reset}`,
  );
  console.log(
    `${colors.fg.cyan}               Phiên bản Windows Executable (.exe)               ${colors.reset}`,
  );
  console.log(
    `${colors.fg.cyan}${colors.bright}================================================================${colors.reset}\n`,
  );
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    }),
  );
}

function cleanText(text) {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
}

const MST_LOOKUP_TIMEOUT = 10000;

async function extractCompanyInfo(page, mst) {
  const companyInfo = {
    STT: 0,
    "Mã số thuế": mst,
    "Tên công ty": "Không tìm thấy",
    "Trạng thái hoạt động": "Không tồn tại / Lỗi tra cứu",
    "Địa chỉ": "Không tìm thấy",
    "Địa chỉ Thuế": "Không tìm thấy",
    "Người đại diện": "Không tìm thấy",
    "Điện thoại": "Không tìm thấy",
    "Quản lý bởi": "Không tìm thấy",
    "Loại hình DN": "Không tìm thấy",
    "Ngành nghề chính": "Không tìm thấy",
  };

  const hasDetails = (await page.locator("table.table-taxinfo").count()) > 0;
  if (!hasDetails) {
    return companyInfo;
  }

  const h1Text = await page
    .locator("h1")
    .first()
    .innerText()
    .catch(() => "");
  let companyName = cleanText(h1Text);
  if (companyName.includes(" - ")) {
    companyName = companyName.substring(companyName.indexOf(" - ") + 3);
  }
  companyInfo["Tên công ty"] = companyName;

  const rows = await page.locator("table.table-taxinfo tr").all();
  for (const row of rows) {
    const cells = await row
      .locator("td, th")
      .all()
      .catch(() => []);
    if (cells.length >= 2) {
      const label = cleanText(await cells[0].innerText().catch(() => ""));
      const value = cleanText(await cells[1].innerText().catch(() => ""));

      if (
        label.includes("Tình trạng") ||
        label.includes("Trạng thái") ||
        label.includes("Tình trạng hoạt động")
      ) {
        companyInfo["Trạng thái hoạt động"] = value;
        continue;
      }

      if (label.includes("Địa chỉ") && !label.toLowerCase().includes("thuế")) {
        companyInfo["Địa chỉ"] = value;
        continue;
      }

      if (label.toLowerCase().includes("thuế")) {
        companyInfo["Địa chỉ Thuế"] = value;
        continue;
      }

      if (
        label.includes("Người đại diện") ||
        label.includes("Đại diện") ||
        label.includes("Người đại diện pháp luật")
      ) {
        companyInfo["Người đại diện"] = value;
        continue;
      }

      if (
        label.includes("Điện thoại") ||
        label.includes("Số điện thoại") ||
        label.includes("Phone")
      ) {
        companyInfo["Điện thoại"] = value;
        continue;
      }

      if (label.includes("Quản lý bởi") || label.includes("Quản lý bởi:")) {
        companyInfo["Quản lý bởi"] = value;
        continue;
      }

      if (
        label.includes("Loại hình") ||
        label.includes("Loại hình DN") ||
        label.toLowerCase().includes("loại hình doanh nghiệp")
      ) {
        companyInfo["Loại hình DN"] = value;
        continue;
      }

      if (label.includes("Ngành nghề chính") || label.includes("Ngành nghề")) {
        companyInfo["Ngành nghề chính"] = value;
        continue;
      }
    }
  }

  return companyInfo;
}

async function clickSearchResultFallback(page, mst) {
  const selectors = [
    `a:has-text("${mst}")`,
    `a:has-text("${mst.replace(/-/g, "")}")`,
    'table a[href*="/ma-so-thue/"]',
    'a[href*="/ma-so-thue/"]',
  ];

  for (const selector of selectors) {
    const link = page.locator(selector).first();
    if ((await link.count()) > 0) {
      await Promise.all([
        link.click(),
        page
          .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 })
          .catch(() => {}),
      ]);
      return true;
    }
  }

  return false;
}

async function tryLookupTaxCode(context, mst) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  try {
    await page.goto("https://masothue.com/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    const searchBox = page.locator("input#search");
    if ((await searchBox.count()) === 0) {
      throw new Error("Không tìm thấy ô tìm kiếm trên trang masothue.com");
    }

    await searchBox.fill(mst);
    await Promise.all([
      page.keyboard.press("Enter"),
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 })
        .catch(() => {}),
    ]);

    let companyInfo = await extractCompanyInfo(page, mst);
    if (companyInfo["Tên công ty"] === "Không tìm thấy") {
      const clicked = await clickSearchResultFallback(page, mst);
      if (clicked) {
        companyInfo = await extractCompanyInfo(page, mst);
      }
    }

    return companyInfo;
  } finally {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {});
    }
  }
}

async function lookupTaxCode(context, mst) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              `Timeout mỗi mã số thuế (${mst}) sau ${MST_LOOKUP_TIMEOUT / 1000}s`,
            ),
          ),
        MST_LOOKUP_TIMEOUT,
      );
    });

    try {
      return await Promise.race([
        tryLookupTaxCode(context, mst),
        timeoutPromise,
      ]);
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        console.log(
          `   ${colors.fg.yellow}[LƯỢT THỬ LẠI] Thử lại mã số thuế ${mst} (lần ${attempt + 1})...${colors.reset}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

// Kiểm tra và cài đặt Chromium nếu thiếu (phục vụ chạy độc lập trên máy khác)
async function ensureChromium() {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
  } catch (e) {
    if (
      e.message.includes("Executable doesn't exist") ||
      e.message.includes("playwright install") ||
      e.message.includes("looks like Playwright was just installed")
    ) {
      console.log(
        `${colors.fg.yellow}[HỆ THỐNG] Không tìm thấy trình duyệt nền. Đang tải và cài đặt tự động (chỉ chạy lần đầu)...${colors.reset}`,
      );
      try {
        execSync("npx playwright install chromium", { stdio: "inherit" });
        console.log(
          `${colors.fg.green}[HỆ THỐNG] Trình duyệt đã được cài đặt thành công!${colors.reset}\n`,
        );
      } catch (err) {
        console.log(
          `${colors.fg.red}[LỖI] Cài đặt trình duyệt tự động thất bại. Hãy đảm bảo máy tính có kết nối mạng.${colors.reset}`,
        );
        throw err;
      }
    } else {
      throw e;
    }
  }
}

async function main() {
  printBanner();

  let mstList = [];
  const args = process.argv.slice(2);

  // Đọc đầu vào từ tham số dòng lệnh hoặc hỏi trực tiếp
  if (args.length > 0) {
    const inputParam = args[0];
    if (fs.existsSync(inputParam) && fs.lstatSync(inputParam).isFile()) {
      console.log(
        `${colors.fg.green}[INFO] Đọc dữ liệu từ file: ${inputParam}${colors.reset}`,
      );
      const content = fs.readFileSync(inputParam, "utf-8");
      mstList = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
      console.log(
        `${colors.fg.green}[INFO] Đã tìm thấy ${mstList.length} mã số thuế.${colors.reset}\n`,
      );
    } else {
      mstList = args
        .join(",")
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
      console.log(
        `${colors.fg.green}[INFO] Nhận được ${mstList.length} mã số thuế từ tham số đầu vào.${colors.reset}\n`,
      );
    }
  } else {
    console.log(
      `${colors.fg.yellow}Hướng dẫn: Nhập một hoặc nhiều MST (phân tách bởi dấu phẩy).`,
    );
    console.log(
      `Hoặc kéo thả file văn bản (.txt) chứa danh sách MST vào đây.${colors.reset}\n`,
    );

    const userInput = await askQuestion(
      `${colors.bright}Nhập mã số thuế hoặc kéo thả file vào đây: ${colors.reset}`,
    );
    console.log();

    if (!userInput) {
      console.log(
        `${colors.fg.red}[LỖI] Không nhận được thông tin đầu vào. Thoát chương trình.${colors.reset}`,
      );
      // Giữ màn hình console mở để người dùng kịp đọc lỗi
      await askQuestion(`\nNhấn Enter để đóng chương trình...`);
      return;
    }

    const cleanPath = userInput
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    if (fs.existsSync(cleanPath) && fs.lstatSync(cleanPath).isFile()) {
      console.log(
        `${colors.fg.green}[INFO] Đang xử lý file: ${cleanPath}${colors.reset}`,
      );
      const content = fs.readFileSync(cleanPath, "utf-8");
      mstList = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
      console.log(
        `${colors.fg.green}[INFO] Đã nhận ${mstList.length} mã số thuế từ file.${colors.reset}\n`,
      );
    } else {
      mstList = userInput
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
    }
  }

  if (mstList.length === 0) {
    console.log(
      `${colors.fg.red}[LỖI] Không tìm thấy mã số thuế hợp lệ nào. Thoát chương trình.${colors.reset}`,
    );
    await askQuestion(`\nNhấn Enter để đóng chương trình...`);
    return;
  }

  console.log(
    `${colors.fg.cyan}[CHUẨN BỊ] Đang kiểm tra cấu hình hệ thống...${colors.reset}`,
  );
  await ensureChromium();

  console.log(
    `${colors.fg.cyan}[BẮT ĐẦU] Đang khởi động trình duyệt bảo mật ẩn danh...${colors.reset}`,
  );
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
  });

  const results = [];
  const total = mstList.length;

  console.log(
    `${colors.fg.green}[TIẾN HÀNH] Bắt đầu tra cứu tự động ${total} mã số thuế. Mỗi mã số thuế sẽ chạy tối đa ${MST_LOOKUP_TIMEOUT / 1000}s.${colors.reset}\n`,
  );

  for (let i = 0; i < total; i++) {
    const mst = mstList[i];
    console.log(
      `${colors.fg.yellow}[${i + 1}/${total}] Đang tra cứu: ${colors.bright}${mst}${colors.reset}...`,
    );

    const startTime = Date.now();
    const companyInfo = {
      STT: i + 1,
      "Mã số thuế": mst,
      "Tên công ty": "Không tìm thấy",
      "Trạng thái hoạt động": "Không tồn tại / Lỗi tra cứu",
      "Địa chỉ": "Không tìm thấy",
      "Địa chỉ Thuế": "Không tìm thấy",
      "Người đại diện": "Không tìm thấy",
      "Điện thoại": "Không tìm thấy",
      "Quản lý bởi": "Không tìm thấy",
      "Loại hình DN": "Không tìm thấy",
      "Ngành nghề chính": "Không tìm thấy",
    };

    try {
      const lookupResult = await lookupTaxCode(context, mst);
      companyInfo["Tên công ty"] = lookupResult["Tên công ty"];
      companyInfo["Trạng thái hoạt động"] =
        lookupResult["Trạng thái hoạt động"];
      companyInfo["Địa chỉ"] =
        lookupResult["Địa chỉ"] || companyInfo["Địa chỉ"];
      companyInfo["Địa chỉ Thuế"] =
        lookupResult["Địa chỉ Thuế"] || companyInfo["Địa chỉ Thuế"];
      companyInfo["Người đại diện"] =
        lookupResult["Người đại diện"] || companyInfo["Người đại diện"];
      companyInfo["Điện thoại"] =
        lookupResult["Điện thoại"] || companyInfo["Điện thoại"];
      companyInfo["Quản lý bởi"] =
        lookupResult["Quản lý bởi"] || companyInfo["Quản lý bởi"];
      companyInfo["Loại hình DN"] =
        lookupResult["Loại hình DN"] || companyInfo["Loại hình DN"];
      companyInfo["Ngành nghề chính"] =
        lookupResult["Ngành nghề chính"] || companyInfo["Ngành nghề chính"];

      const statusColor = companyInfo["Trạng thái hoạt động"].includes(
        "Đang hoạt động",
      )
        ? colors.fg.green
        : colors.fg.red;
      console.log(
        `   ${colors.fg.green}✔ THÀNH CÔNG (${((Date.now() - startTime) / 1000).toFixed(1)}s):${colors.reset}`,
      );
      console.log(
        `   - Tên công ty: ${colors.bright}${companyInfo["Tên công ty"]}${colors.reset}`,
      );
      console.log(
        `   - Trạng thái:  ${statusColor}${colors.bright}${companyInfo["Trạng thái hoạt động"]}${colors.reset}`,
      );
      console.log(
        `   - Địa chỉ: ${colors.bright}${companyInfo["Địa chỉ"]}${colors.reset}`,
      );
      console.log(
        `   - Địa chỉ Thuế: ${colors.bright}${companyInfo["Địa chỉ Thuế"]}${colors.reset}`,
      );
      console.log(
        `   - Người đại diện: ${colors.bright}${companyInfo["Người đại diện"]}${colors.reset}`,
      );
      console.log(
        `   - Điện thoại: ${colors.bright}${companyInfo["Điện thoại"]}${colors.reset}`,
      );
      console.log(
        `   - Quản lý bởi: ${colors.bright}${companyInfo["Quản lý bởi"]}${colors.reset}`,
      );
      console.log(
        `   - Loại hình DN: ${colors.bright}${companyInfo["Loại hình DN"]}${colors.reset}`,
      );
      console.log(
        `   - Ngành nghề chính: ${colors.bright}${companyInfo["Ngành nghề chính"]}${colors.reset}\n`,
      );
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `   ${colors.fg.red}✘ LỖI (${elapsed}s): ${err.message}${colors.reset}\n`,
      );
    }

    results.push(companyInfo);
  }

  await browser.close();

  // Xuất file báo cáo chính xác các cột yêu cầu
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .substring(0, 14);
  const filename = `ketqua_mst_${timestamp}.csv`;
  const outputPath = path.join(process.cwd(), filename);

  // Cột hiển thị theo thứ tự yêu cầu của người dùng
  const headersCSV = [
    "STT",
    "Tên công ty",
    "Mã số thuế",
    "Trạng thái hoạt động",
    "Địa chỉ",
    "Địa chỉ Thuế",
    "Người đại diện",
    "Điện thoại",
    "Quản lý bởi",
    "Loại hình DN",
    "Ngành nghề chính",
  ];

  let csvContent =
    headersCSV.map((h) => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
  for (const info of results) {
    const rowData = headersCSV.map((h) => {
      const val = String(info[h] || "");
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvContent += rowData.join(",") + "\n";
  }

  // Lưu với định dạng UTF-8 BOM
  fs.writeFileSync(outputPath, "\uFEFF" + csvContent, "utf-8");

  console.log(
    `${colors.fg.cyan}${colors.bright}================================================================${colors.reset}`,
  );
  console.log(
    `${colors.fg.green}${colors.bright}             TRA CỨU HOÀN TẤT - XUẤT FILE THÀNH CÔNG!           ${colors.reset}`,
  );
  console.log(
    ` - Đã tra cứu xong: ${colors.bright}${total}/${total}${colors.reset} mã số thuế.`,
  );
  console.log(
    ` - Kết quả lưu tại: ${colors.fg.green}${colors.bright}${outputPath}${colors.reset}`,
  );
  console.log(
    `   (Các cột xuất: STT, Tên công ty, Mã số thuế, Trạng thái hoạt động, Địa chỉ, Địa chỉ Thuế, Người đại diện, Điện thoại).`,
  );
  console.log(
    `${colors.fg.cyan}${colors.bright}================================================================${colors.reset}\n`,
  );

  // Giữ console mở để người dùng xem file kết quả
  await askQuestion(`Nhấn Enter để kết thúc chương trình...`);
}

main().catch((err) => {
  console.error("Lỗi hệ thống:", err);
});
