function refreshData(res) {
  const field = document.getElementById("indexing_info");
  if (res.data) {
    field.textContent = `索引建立日期: ${new Date(
      res.data.timestamp
    ).toLocaleString("zh-TW")}`;
  } else {
    field.removeChild(field.children[0]);
    field.textContent = res.error;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime
    .sendMessage({ action: "getCourses" })
    .then((res) => refreshData(res));
  const indexingButton = document.getElementById("indexing_button");

  indexingButton.addEventListener("click", async () => {
    chrome.runtime.sendMessage({
      action: "sendNotification",
      title: "建立索引中",
      message: "系統正在建立索引",
    });
    const res = await chrome.runtime.sendMessage({ action: "refreshCourses" });
    refreshData(res);
  });
});
