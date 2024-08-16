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
      ratings.style.display = "flex";
      ratings.style.justifyContent = "center";
      ratings.style.flexDirection = "row";
      ratings.style.border = "1px";
      ratings.style.borderStyle = "solid";

      const got_elem = document.createElement("div");
      got_elem.style.borderRadius = "10px";
      got_elem.style.color = "beige";
      got_elem.style.padding = "4px";
      got_elem.style.margin = "2px";

      const cold_elem = document.createElement("div");
      cold_elem.style.borderRadius = "10px";
      cold_elem.style.color = "beige";
      cold_elem.style.padding = "4px";
      cold_elem.style.margin = "2px";

      const sweet_elem = document.createElement("div");
      sweet_elem.style.borderRadius = "10px";
      sweet_elem.style.color = "beige";
      sweet_elem.style.padding = "4px";
      sweet_elem.style.margin = "2px";

      const discipline_elem = document.createElement("div");
      discipline_elem.style.borderRadius = "10px";
      discipline_elem.style.backgroundColor = "black";
      discipline_elem.style.padding = "4px";
      discipline_elem.style.margin = "2px";
      discipline_elem.style.color = "beige";
      discipline_elem.href = `https://nckuhub.com/course/${id}`;

      const link_elem = document.createElement("a");
      link_elem.style.borderRadius = "10px";
      link_elem.style.backgroundColor = "black";
      link_elem.style.padding = "4px";
      link_elem.style.margin = "2px";
      link_elem.style.color = "blue";
      link_elem.textContent = `前往${id}頁面`;
      link_elem.href = `https://nckuhub.com/course/${id}`;

      const review = course_datas[id];

      discipline_elem.textContent = review.discipline;

      got_elem.style.backgroundColor = generate_color(review.got);
      cold_elem.style.backgroundColor = generate_color(review.cold);
      sweet_elem.style.backgroundColor = generate_color(review.sweet);
      got_elem.textContent = `收穫${review.got}${generate_emoji(review.got)}`;
      cold_elem.textContent = `涼度${review.cold}${generate_emoji(
        review.cold
      )}`;
      sweet_elem.textContent = `甜度${review.sweet}${generate_emoji(
        review.sweet
      )}`;

      ratings.appendChild(got_elem);
      ratings.appendChild(cold_elem);
      ratings.appendChild(sweet_elem);
      ratings.appendChild(discipline_elem);
      ratings.appendChild(link_elem);

      elem.appendChild(ratings);
    }
  }
  console.log("[NCKU CE] Injection Done!");
}

main();

function generate_color(level) {
  if (level > 7) {
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
