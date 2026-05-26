const SPREADSHEET_NAME = "Chiguru Microgreens Orders";
const ORDERS_SHEET = "Orders";
const DAILY_SHEET = "Daily Summary";
const PRODUCTS_SHEET = "Product Summary";

const ORDER_HEADERS = [
  "Order ID",
  "Date",
  "Time",
  "Created At",
  "Customer Name",
  "Phone",
  "Address",
  "Area",
  "Delivery Slot",
  "Items",
  "Subtotal",
  "Delivery Fee",
  "Total",
  "UPI ID",
  "Payment Status",
  "Order Status",
  "Notes",
  "WhatsApp Message",
];

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const order = JSON.parse(event.postData.contents);
    const spreadsheet = getOrCreateSpreadsheet();
    const ordersSheet = getOrCreateSheet(spreadsheet, ORDERS_SHEET, ORDER_HEADERS);
    const now = new Date();
    const dateText = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const timeText = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
    const itemsText = order.items
      .map((item) => `${item.name} (${item.unit}) x ${item.quantity} = ${item.lineTotal}`)
      .join("\n");

    ordersSheet.appendRow([
      order.orderId,
      dateText,
      timeText,
      order.createdAt,
      order.customerName,
      order.phone,
      order.address,
      order.area,
      order.slot,
      itemsText,
      order.subtotal,
      order.delivery,
      order.total,
      order.upiId,
      order.paymentStatus || "Payment Pending",
      order.orderStatus || "New",
      order.notes || "",
      order.whatsappMessage || "",
    ]);

    ensureRefreshTrigger();
    refreshSummarySheets(spreadsheet);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: order.orderId }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: error.message }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function refreshReports() {
  const spreadsheet = getOrCreateSpreadsheet();
  refreshSummarySheets(spreadsheet);
}

function ensureRefreshTrigger() {
  const exists = ScriptApp.getProjectTriggers().some(
    (trigger) => trigger.getHandlerFunction() === "refreshReports",
  );

  if (!exists) {
    ScriptApp.newTrigger("refreshReports").timeBased().everyMinutes(15).create();
  }
}

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function refreshSummarySheets(spreadsheet) {
  refreshDailySummary(spreadsheet);
  refreshProductSummary(spreadsheet);
}

function refreshDailySummary(spreadsheet) {
  const ordersSheet = getOrCreateSheet(spreadsheet, ORDERS_SHEET, ORDER_HEADERS);
  const sheet = getOrCreateSheet(spreadsheet, DAILY_SHEET, [
    "Date",
    "Total Orders",
    "Total Sales",
    "New Orders",
    "Payment Pending",
    "Paid",
  ]);
  const rows = ordersSheet.getDataRange().getValues().slice(1);
  const summary = {};

  rows.forEach((row) => {
    const date = row[1];
    if (!date) return;

    if (!summary[date]) {
      summary[date] = {
        totalOrders: 0,
        totalSales: 0,
        newOrders: 0,
        paymentPending: 0,
        paid: 0,
      };
    }

    summary[date].totalOrders += 1;
    summary[date].totalSales += Number(row[12]) || 0;
    if (row[15] === "New") summary[date].newOrders += 1;
    if (row[14] === "Payment Pending") summary[date].paymentPending += 1;
    if (row[14] === "Paid") summary[date].paid += 1;
  });

  sheet.getRange("A2:F").clearContent();
  const output = Object.keys(summary)
    .sort()
    .map((date) => [
      date,
      summary[date].totalOrders,
      summary[date].totalSales,
      summary[date].newOrders,
      summary[date].paymentPending,
      summary[date].paid,
    ]);

  if (output.length) {
    sheet.getRange(2, 1, output.length, 6).setValues(output);
  }

  sheet.autoResizeColumns(1, 6);
}

function refreshProductSummary(spreadsheet) {
  const ordersSheet = getOrCreateSheet(spreadsheet, ORDERS_SHEET, ORDER_HEADERS);
  const sheet = getOrCreateSheet(spreadsheet, PRODUCTS_SHEET, [
    "Date",
    "Product",
    "Unit",
    "Quantity",
    "Sales",
  ]);
  const rows = ordersSheet.getDataRange().getValues().slice(1);
  const summary = {};

  rows.forEach((row) => {
    const date = row[1];
    const itemsText = row[9] || "";

    itemsText.split("\n").forEach((line) => {
      const match = line.match(/^(.+) \((.+)\) x (\d+) = (\d+(?:\.\d+)?)$/);
      if (!date || !match) return;

      const key = `${date}||${match[1]}||${match[2]}`;
      if (!summary[key]) {
        summary[key] = {
          date,
          product: match[1],
          unit: match[2],
          quantity: 0,
          sales: 0,
        };
      }

      summary[key].quantity += Number(match[3]) || 0;
      summary[key].sales += Number(match[4]) || 0;
    });
  });

  sheet.getRange("A2:E").clearContent();
  const output = Object.values(summary)
    .sort((a, b) => `${a.date}${a.product}`.localeCompare(`${b.date}${b.product}`))
    .map((item) => [item.date, item.product, item.unit, item.quantity, item.sales]);

  if (output.length) {
    sheet.getRange(2, 1, output.length, 5).setValues(output);
  }

  sheet.autoResizeColumns(1, 5);
}
