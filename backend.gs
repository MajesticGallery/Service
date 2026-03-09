// EXPECTED TO BE CONFIGURED BY ADMIN
// Replace with your Google Sheet ID
const SHEET_ID = "1-vWrL8EWnAIjSYG4EwNifm3LNVCnd2HqGbLttXsKV2Q";
const SHEET_NAME = "Sheet1";

// Handle GET Requests (Fetch Orders)
function doGet(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var action = e.parameter.action;
  
  if (action === "getOrders") {
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // Skip header row (assuming row 1 is headers)
    var orders = [];
    for (var i = 1; i < values.length; i++) {
      orders.push({
        orderId: values[i][0],
        name: values[i][1],
        purpose: values[i][2],
        mobile: values[i][3],
        status: values[i][4],
        date: values[i][5]
      });
    }
    
    return createJsonResponse({ status: "success", orders: orders });
  }
  
  return createJsonResponse({ status: "error", message: "Invalid action" });
}

// Handle POST Requests (Create Order, Update Status)
function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    // ACTION: CREATE NEW ORDER
    if (action === "create") {
      var lastRow = sheet.getLastRow();
      
      // If sheet is empty (only headers), start at 1000. Else, last order + 1
      var orderId = 1000;
      if (lastRow > 1) {
         orderId = sheet.getRange(lastRow, 1).getValue() + 1;
      }
      
      sheet.appendRow([
        orderId,
        payload.name,
        payload.purpose,
        payload.mobile,
        "Processing",
        new Date()
      ]);
      
      return createJsonResponse({
        status: "success",
        orderId: orderId,
        purpose: payload.purpose
      });
    }
    
    // ACTION: UPDATE STATUS TO READY
    if (action === "updateStatus") {
      var targetId = parseInt(payload.orderId);
      var newStatus = payload.status;
      
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      
      var rowToUpdate = -1;
      // Search for the Order ID (Column A/0)
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] == targetId) {
          rowToUpdate = i + 1; // +1 because array is 0-indexed, sheet is 1-indexed
          break;
        }
      }
      
      if (rowToUpdate !== -1) {
        // Status is in Column E (5)
        sheet.getRange(rowToUpdate, 5).setValue(newStatus);
        return createJsonResponse({ status: "success", message: "Order updated inline" });
      } else {
        return createJsonResponse({ status: "error", message: "Order ID not found" });
      }
    }
    
    return createJsonResponse({ status: "error", message: "Invalid action" });
    
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Helper formatting function
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
