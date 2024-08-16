const course_url = "https://nckuhub.com/course";

const COURSE_INDEX_KEY = "COURSE_INDEX";

function course_info_gen(course_id) {
  return `https://nckuhub.com/course/${course_id}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCourses") {
    chrome.storage.local
      .get(COURSE_INDEX_KEY)
      .then((tab) => {
        return tab[COURSE_INDEX_KEY];
      })
      .then((data) => {
        if (data == undefined) {
          sendResponse({ error: "區域索引未找到，須建立索引。" });
        } else {
          sendResponse({ data: data });
        }
      });
    return true;
  } else if (request.action === "refreshCourses") {
    fetch(course_url)
      .then((v) => {
        return v.json();
      })
      .then((obj) => {
        const courses = obj.courses;
        let indexed_data = {
          courses: {},
          length: courses.length,
          timestamp: new Date().getTime(),
        };
        for (let c of courses) {
          const key = c["課程碼"];
          if (indexed_data.courses[key]) {
            indexed_data.courses[key].push(c);
          } else {
            indexed_data.courses[key] = [c];
          }
        }
        console.log(indexed_data);
        chrome.storage.local.set({
          [COURSE_INDEX_KEY]: indexed_data,
        });
        sendResponse({ data: indexed_data });
      });
    return true;
  } else if (request.action === "fetchCourseData") {
    // Parallel Fetching all data
    // ! May result in false ddos alarm
    // ! Better off contacting the owner of the API
    Promise.all(
      request.ids.map((id) =>
        fetch(course_info_gen(id))
          .then((v) => v.json())
          .then((bod) => {
            return {
              got: bod.got,
              cold: bod.cold,
              sweet: bod.sweet,
              discipline: bod.courseInfo["系所名稱"],
              class: bod.courseInfo["班別"],
              rate_count: bod.rate_count,
              id: bod.courseInfo.id,
            };
          })
      )
    ).then((arr) => {
      const obj = {};
      for (const val of arr) {
        obj[val.id] = val;
      }
      sendResponse({ data: obj });
    });
    return true;
  } else if (request.action === "sendNotification") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "../icon.png", // Path to your icon
        title: request.title,
        message: request.message,
        priority: 2, // Priority levels: 0 (min), 1, 2 (high)
      },
      (notificationId) => {
        console.log("Created notification ", notificationId);
      }
    );
  }
});
