async function main() {
  console.log("[NCKU CE] Active");
  await inject();
  console.log("[NCKU CE] Injection Done!");
}

function sendNotification(title, message) {
  chrome.runtime.sendMessage({
    action: "sendNotification",
    title,
    message,
  });
}

async function getCourses() {
  console.log("[NCKU CE] Loading Database. This may take a while...");
  const res = await chrome.runtime.sendMessage({ action: "getCourses" });
  if (res.error) {
    sendNotification("無法插入資料", res.error);
    return undefined;
  }
  console.log("[NCKU CE] Database loaded.");
  return res.data;
}

async function fetchCourseData(ids) {
  return (
    await chrome.runtime.sendMessage({
      action: "fetchCourseData",
      ids,
    })
  ).data;
}

async function inject() {
  const db = await getCourses();

  const ids = new Set();
  const elems = [];
  for (let elem of document.querySelectorAll(
    ".table tbody tr, .table tbody tr td :not(:has(.c-div)), .c-div"
  )) {
    const res_reg =
      elem.id?.match("[A-Z\\d]{2}-\\d{3}") ??
      (elem.tagName == "DIV" || elem.tagName == "TD"
        ? elem.textContent?.match("[A-Z\\d]{2}-\\d{3}")
        : undefined);
    if (res_reg == null) {
      continue;
    }
    const classid = res_reg[0];

    const course_datas = db.courses[classid];
    if (!course_datas) {
      continue;
    }
    for (let subview of course_datas) {
      ids.add(subview.id);
    }
    elems.push({
      elem: elem,
      classid,
    });
  }
  const id_arr = Array.from(ids);
  const course_datas = await fetchCourseData(id_arr);

  for (let { elem, classid } of elems) {
    for (let id of db.courses[classid].map((pack) => pack.id)) {
      elem.appendChild(generate_review(course_datas, id));
    }
  }
}

main();

function generate_review(course_datas, id) {
  const ratings = document.createElement("div");
  ratings.className = "ncku-rating";

  const subrow = document.createElement("div");
  subrow.className = "ncku-subrow";
  const subrow1 = document.createElement("div");
  subrow1.className = "ncku-subrow";

  const discipline_elem = document.createElement("a");
  discipline_elem.className = "ncku-badge";
  discipline_elem.style.backgroundColor = "black";
  discipline_elem.style.color = "blue";
  discipline_elem.href = `https://nckuhub.com/course/${id}`;

  const review = course_datas[id];

  discipline_elem.textContent = `${review.discipline}|${review.class}|${review.category}`;

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

    subrow.appendChild(got_elem);
    subrow.appendChild(cold_elem);
    subrow.appendChild(sweet_elem);
  } else {
    const info_elem = document.createElement("div");
    info_elem.className = "ncku-badge";
    info_elem.style.backgroundColor = "red";
    info_elem.textContent = "無相關評論(┛`д´)┛";

    subrow.appendChild(info_elem);
  }
  subrow1.appendChild(discipline_elem);

  ratings.appendChild(subrow);
  ratings.appendChild(subrow1);
  return ratings;
}

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
