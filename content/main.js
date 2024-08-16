async function main() {
  console.log("[NCKU CE] Active");

  console.log("[NCKU CE] Loading Database. This may take a while...");
  const res = await chrome.runtime.sendMessage({ action: "getCourses" });

  if (res.error) {
    chrome.runtime.sendMessage({
      action: "sendNotification",
      title: "無法插入資料",
      message: res.error,
    });
    return;
  }
  console.log("[NCKU CE] Database loaded. Attempting to inject...");

  const db = res.data; // {courses, length, timestamp}
  let all_rows = document.querySelectorAll(".table tbody tr td");
  const ids = new Set();
  const elems = [];
  for (let td of all_rows) {
    const textcontent = td.textContent.trim();
    const res_reg = textcontent?.match("[A-Z][A-Z\\d]{6}");
    if (textcontent == null || res_reg == null) {
      continue;
    }
    const classid = res_reg[0];

    const footer = document.createElement("footer");
    footer.style.color = "gray";
    footer.style.fontSize = "smaller";
    footer.style.fontStyle = "italic";
    td.appendChild(footer);

    const course_datas = db.courses[classid];
    if (course_datas) {
      footer.textContent = "此欄位已使用nckuhub.com搜尋";
    } else {
      footer.textContent = "nckuhub.com無相關資料";
      continue;
    }
    for (let subview of course_datas) {
      ids.add(subview.id);
    }
    elems.push({
      elem: td,
      classid,
    });
  }

  const id_arr = Array.from(ids);

  const course_datas = (
    await chrome.runtime.sendMessage({
      action: "fetchCourseData",
      ids: id_arr,
    })
  ).data;

  for (let { elem, classid } of elems) {
    for (let id of db.courses[classid].map((pack) => pack.id)) {
      const ratings = document.createElement("div");
      ratings.className = "ncku-rating";

      const discipline_elem = document.createElement("div");
      discipline_elem.className = "ncku-badge";
      discipline_elem.style.backgroundColor = "black";

      const link_elem = document.createElement("a");
      link_elem.className = "ncku-badge";
      link_elem.style.backgroundColor = "black";
      link_elem.style.color = "blue";
      link_elem.textContent = `前往${id}頁面`;
      link_elem.href = `https://nckuhub.com/course/${id}`;

      const review = course_datas[id];

      discipline_elem.textContent = review.discipline + review.class;

      if (review.rate_count > 0) {
        const got_elem = document.createElement("div");
        got_elem.className = "ncku-badge";

        const cold_elem = document.createElement("div");
        cold_elem.className = "ncku-badge";

        const sweet_elem = document.createElement("div");
        sweet_elem.className = "ncku-badge";
        got_elem.style.backgroundColor = generate_color(review.got);
        cold_elem.style.backgroundColor = generate_color(review.cold);
        sweet_elem.style.backgroundColor = generate_color(review.sweet);
        got_elem.textContent = `收穫${
          Math.round(review.got * 10) / 10
        }${generate_emoji(review.got)}`;
        cold_elem.textContent = `涼度${
          Math.round(review.cold * 10) / 10
        }${generate_emoji(review.cold)}`;
        sweet_elem.textContent = `甜度${
          Math.round(review.sweet * 10) / 10
        }${generate_emoji(review.sweet)}`;

        ratings.appendChild(got_elem);
        ratings.appendChild(cold_elem);
        ratings.appendChild(sweet_elem);
      } else {
        const info_elem = document.createElement("div");
        info_elem.className = "ncku-badge";
        info_elem.style.backgroundColor = "red";
        info_elem.textContent = "無相關評論(┛`д´)┛";

        ratings.appendChild(info_elem);
      }
      ratings.appendChild(discipline_elem);
      ratings.appendChild(link_elem);

      elem.appendChild(ratings);
    }
  }
  console.log("[NCKU CE] Injection Done!");
}

main();

function generate_color(level) {
  if (level > 7.5) {
    return "rgb(0, 200, 0)";
  } else if (level > 5) {
    return "rgb(200,200,0)";
  }
  return "rgb(200,0,0)";
}
function generate_emoji(level) {
  if (level > 7) {
    return "⭐";
  } else if (level > 5) {
    return "👌";
  }
  return "❌";
}
