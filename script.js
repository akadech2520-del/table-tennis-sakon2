"use strict";

/*
 * ระบบสมาชิกชมรมกีฬาเทเบิลเทนนิส สพป.สกลนคร เขต 2
 * - หากยังไม่กำหนด GAS_API_URL ระบบจะทำงานในโหมดสาธิตด้วย localStorage
 * - เมื่อนำไปใช้งานจริง ให้ใส่ URL ของ Google Apps Script Web App ด้านล่าง
 */
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbw8vQmu9WNHxMegWBMaUCscS0DD_0s-UgxUdRQJr8SCuKE2GReCwuqF3NbD3GcJ_VkP/exec";
const STORAGE_KEY = "sakon2TableTennisMembers";
const SESSION_KEY = "sakon2TableTennisAdminToken";

const demoMembers = [
  { memberId: "TT-0001", prefix: "นาย", fullName: "สมชาย ใจดี", position: "ผู้อำนวยการโรงเรียน", organization: "โรงเรียนบ้านตัวอย่าง", affiliation: "สถานศึกษาในสังกัด สพป.สกลนคร เขต 2", phone: "0812345678", email: "somchai@example.com", lineId: "somchai.tt", skillLevel: "ปานกลาง", attendance: "เข้าร่วมประจำ", note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-06-01T09:00:00.000Z" },
  { memberId: "TT-0002", prefix: "นาง", fullName: "กมลชนก พรหมมา", position: "ครูชำนาญการ", organization: "โรงเรียนอนุบาลสว่างแดนดิน", affiliation: "สถานศึกษาในสังกัด สพป.สกลนคร เขต 2", phone: "0823456789", email: "kamonchanok@example.com", lineId: "", skillLevel: "เริ่มต้น", attendance: "เข้าร่วมประจำ", note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-06-03T10:00:00.000Z" },
  { memberId: "TT-0003", prefix: "นาย", fullName: "วิชาญ ศรีสุข", position: "นักวิชาการศึกษา", organization: "กลุ่มส่งเสริมการจัดการศึกษา", affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสกลนคร เขต 2", phone: "0834567890", email: "wichan@example.com", lineId: "wichan.s", skillLevel: "เล่นได้", attendance: "เข้าร่วมเป็นครั้งคราว", note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-06-05T11:00:00.000Z" },
  { memberId: "TT-0004", prefix: "นางสาว", fullName: "อรทัย แสงทอง", position: "เจ้าพนักงานธุรการ", organization: "กลุ่มอำนวยการ", affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสกลนคร เขต 2", phone: "0845678901", email: "orathai@example.com", lineId: "", skillLevel: "ชำนาญ", attendance: "เข้าร่วมประจำ", note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-06-08T12:00:00.000Z" },
  { memberId: "TT-0005", prefix: "นาย", fullName: "ธนกฤต ภูมิใจ", position: "ครู", organization: "โรงเรียนบ้านโคกสว่าง", affiliation: "สถานศึกษาในสังกัด สพป.สกลนคร เขต 2", phone: "0856789012", email: "thanakrit@example.com", lineId: "", skillLevel: "เล่นได้", attendance: "เข้าร่วมเป็นครั้งคราว", note: "", consent: true, status: "รออนุมัติ", createdAt: "2026-06-10T13:00:00.000Z" },
  { memberId: "TT-0006", prefix: "นาง", fullName: "สุภาวดี คำลือ", position: "ผู้อำนวยการกลุ่ม", organization: "กลุ่มบริหารงานบุคคล", affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสกลนคร เขต 2", phone: "0867890123", email: "supawadee@example.com", lineId: "", skillLevel: "ปานกลาง", attendance: "เข้าร่วมประจำ", note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-06-12T14:00:00.000Z" }
];

let allMembers = [];
let adminToken = sessionStorage.getItem(SESSION_KEY) || "";
let editingIsNew = false;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  $("#currentYear").textContent = new Date().getFullYear();
  setupNavigation();
  setupReveal();
  setupForms();
  setupMemberFilters();
  setupAdmin();
  await loadMembers();
}

function setupNavigation() {
  const header = $(".site-header");
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");
  window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 30), { passive: true });
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  $$(".nav-links a").forEach(link => link.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal").forEach(el => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el => observer.observe(el));
}

async function loadMembers() {
  try {
    if (GAS_API_URL) {
      const response = await apiRequest("getPublicMembers");
      allMembers = Array.isArray(response.data) ? response.data : [];
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      allMembers = saved ? JSON.parse(saved) : structuredClone(demoMembers);
      if (!saved) saveLocalMembers();
    }
  } catch (error) {
    console.error(error);
    showToast("ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้ กำลังใช้ข้อมูลสาธิต");
    const saved = localStorage.getItem(STORAGE_KEY);
    allMembers = saved ? JSON.parse(saved) : structuredClone(demoMembers);
  }
  renderPublicMembers();
  updatePublicCount();
}

function saveLocalMembers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMembers));
}

function setupForms() {
  const form = $("#registrationForm");
  form.addEventListener("submit", submitRegistration);
  $$("input, select, textarea", form).forEach(field => {
    field.addEventListener("input", () => field.classList.remove("invalid"));
  });
  $("#backHome").addEventListener("click", () => {
    closeModal("#successModal");
    location.hash = "#home";
  });
}

async function submitRegistration(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#formMessage");
  message.className = "form-message";

  if (!validateForm(form)) {
    showFormMessage(message, "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง", "error");
    form.querySelector(".invalid, :invalid")?.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  data.consent = form.elements.consent.checked;
  data.status = "รออนุมัติ";
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.querySelector("span:first-child").textContent = "กำลังส่งใบสมัคร...";

  try {
    let result;
    if (GAS_API_URL) {
      result = await apiRequest("register", data);
      if (!result.success) throw new Error(result.message || "สมัครสมาชิกไม่สำเร็จ");
    } else {
      const duplicate = findDuplicate(data);
      if (duplicate) throw new Error(`พบข้อมูลซ้ำกับสมาชิก ${duplicate.memberId} กรุณาติดต่อผู้ดูแลระบบ`);
      const nextNumber = Math.max(0, ...allMembers.map(m => Number(String(m.memberId).replace(/\D/g, "")) || 0)) + 1;
      data.memberId = `TT-${String(nextNumber).padStart(4, "0")}`;
      data.createdAt = new Date().toISOString();
      allMembers.push(data);
      saveLocalMembers();
      result = { success: true, memberId: data.memberId };
    }

    $("#successMemberId").textContent = result.memberId;
    form.reset();
    await loadMembers();
    openModal("#successModal");
  } catch (error) {
    showFormMessage(message, error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span:first-child").textContent = "ส่งใบสมัคร";
  }
}

function validateForm(form) {
  let valid = true;
  $$("[required]", form).forEach(field => {
    if (!field.checkValidity()) {
      field.classList.add("invalid");
      valid = false;
    }
  });
  return valid;
}

function findDuplicate(data, excludeId = "") {
  const normalize = value => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  return allMembers.find(member => member.memberId !== excludeId && (
    normalize(member.fullName) === normalize(data.fullName) ||
    (data.phone && normalize(member.phone) === normalize(data.phone)) ||
    (data.email && normalize(member.email) === normalize(data.email))
  ));
}

function showFormMessage(element, text, type) {
  element.textContent = text;
  element.className = `form-message show ${type}`;
}

function setupMemberFilters() {
  $("#memberSearch").addEventListener("input", renderPublicMembers);
  $("#publicSkillFilter").addEventListener("change", renderPublicMembers);
}

function renderPublicMembers() {
  const query = $("#memberSearch")?.value.trim().toLowerCase() || "";
  const skill = $("#publicSkillFilter")?.value || "";
  const members = allMembers.filter(member => {
    const searchable = `${member.prefix} ${member.fullName} ${member.position} ${member.organization}`.toLowerCase();
    return member.status === "อนุมัติแล้ว" && (!query || searchable.includes(query)) && (!skill || member.skillLevel === skill);
  });

  $("#publicMemberRows").innerHTML = members.map((member, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><span class="member-name">${escapeHtml(member.prefix)}${escapeHtml(member.fullName)}</span></td>
      <td>${escapeHtml(member.position)}</td>
      <td>${escapeHtml(member.organization)}</td>
      <td><span class="skill-badge" data-skill="${escapeHtml(member.skillLevel)}">${escapeHtml(member.skillLevel)}</span></td>
      <td><span class="status-badge approved">● ${escapeHtml(member.status)}</span></td>
    </tr>`).join("");
  $("#memberResultCount").textContent = members.length;
  $("#memberEmpty").hidden = members.length > 0;
}

function updatePublicCount() {
  const count = allMembers.filter(member => member.status === "อนุมัติแล้ว").length;
  animateNumber($("#publicMemberCount"), count);
}

function animateNumber(element, target) {
  const start = performance.now();
  const duration = 700;
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setupAdmin() {
  $$("[data-open-admin]").forEach(button => button.addEventListener("click", () => {
    openModal("#adminModal");
    if (adminToken) showDashboard();
  }));
  $$("[data-close-admin]").forEach(button => button.addEventListener("click", () => closeModal("#adminModal")));
  $$("[data-close-edit]").forEach(button => button.addEventListener("click", () => closeModal("#memberEditModal")));
  $("#adminLoginForm").addEventListener("submit", adminLogin);
  $("#adminLogout").addEventListener("click", adminLogout);
  $("#adminSearch").addEventListener("input", renderAdminTable);
  $("#adminSkillFilter").addEventListener("change", renderAdminTable);
  $("#adminStatusFilter").addEventListener("change", renderAdminTable);
  $("#exportCsv").addEventListener("click", exportCsv);
  $("#addMemberBtn").addEventListener("click", () => openMemberEditor());
  $("#memberEditForm").addEventListener("submit", saveMemberEdit);
  $("#adminMemberRows").addEventListener("click", handleAdminTableAction);
}

async function adminLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const message = $("#loginMessage");
  try {
    if (GAS_API_URL) {
      const result = await apiRequest("login", data);
      if (!result.success) throw new Error(result.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      adminToken = result.token;
    } else {
      if (data.username !== "admin" || data.password !== "pingpong2569") throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      adminToken = "demo-admin-token";
    }
    sessionStorage.setItem(SESSION_KEY, adminToken);
    form.reset();
    showDashboard();
  } catch (error) {
    showFormMessage(message, error.message, "error");
  }
}

async function showDashboard() {
  try {
    if (GAS_API_URL) {
      const result = await apiRequest("getAdminMembers", { token: adminToken });
      if (!result.success) throw new Error(result.message || "เซสชันหมดอายุ");
      allMembers = result.data;
    }
    $("#adminLoginView").hidden = true;
    $("#adminDashboard").hidden = false;
    renderDashboard();
  } catch (error) {
    adminLogout();
    showFormMessage($("#loginMessage"), error.message, "error");
  }
}

function adminLogout() {
  adminToken = "";
  sessionStorage.removeItem(SESSION_KEY);
  $("#adminDashboard").hidden = true;
  $("#adminLoginView").hidden = false;
}

function renderDashboard() {
  const approved = allMembers.filter(m => m.status === "อนุมัติแล้ว").length;
  const pending = allMembers.filter(m => m.status === "รออนุมัติ").length;
  const regular = allMembers.filter(m => m.attendance === "เข้าร่วมประจำ").length;
  $("#dashTotal").textContent = allMembers.length;
  $("#dashApproved").textContent = approved;
  $("#dashPending").textContent = pending;
  $("#dashRegular").textContent = regular;
  renderBarChart("#skillChart", countBy(allMembers, "skillLevel"), ["เริ่มต้น", "เล่นได้", "ปานกลาง", "ชำนาญ"]);
  renderBarChart("#orgChart", countBy(allMembers, "organization"), null, 5);
  renderAttendanceChart();
  renderAdminTable();
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = item[key] || "ไม่ระบุ";
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function renderBarChart(selector, counts, preferredOrder = null, limit = 99) {
  let entries = Object.entries(counts);
  if (preferredOrder) entries.sort((a, b) => preferredOrder.indexOf(a[0]) - preferredOrder.indexOf(b[0]));
  else entries.sort((a, b) => b[1] - a[1]);
  entries = entries.slice(0, limit);
  const max = Math.max(1, ...entries.map(item => item[1]));
  $(selector).innerHTML = entries.map(([label, count]) => `
    <div class="bar-row" title="${escapeHtml(label)}">
      <span>${escapeHtml(label)}</span>
      <span class="bar-track"><i class="bar-fill" style="width:${(count / max) * 100}%"></i></span>
      <b>${count}</b>
    </div>`).join("") || "<p>ยังไม่มีข้อมูล</p>";
}

function renderAttendanceChart() {
  const counts = countBy(allMembers, "attendance");
  const regular = counts["เข้าร่วมประจำ"] || 0;
  const occasional = counts["เข้าร่วมเป็นครั้งคราว"] || 0;
  const total = Math.max(1, regular + occasional);
  const percent = Math.round((regular / total) * 100);
  $("#attendanceDonut").style.background = `conic-gradient(var(--pink) 0 ${percent}%, var(--blue) ${percent}% 100%)`;
  $("#attendanceDonut span").textContent = `${percent}%`;
  $("#attendanceLegend").innerHTML = `
    <div class="legend-item"><i style="background:var(--pink)"></i><span>เข้าร่วมประจำ <b>${regular}</b></span></div>
    <div class="legend-item"><i style="background:var(--blue)"></i><span>เป็นครั้งคราว <b>${occasional}</b></span></div>`;
}

function renderAdminTable() {
  const query = $("#adminSearch").value.trim().toLowerCase();
  const skill = $("#adminSkillFilter").value;
  const status = $("#adminStatusFilter").value;
  const members = allMembers.filter(member => {
    const searchable = `${member.fullName} ${member.phone} ${member.email} ${member.organization}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!skill || member.skillLevel === skill) && (!status || member.status === status);
  });
  $("#adminMemberRows").innerHTML = members.map(member => `
    <tr>
      <td>${escapeHtml(member.memberId)}</td>
      <td><span class="member-name">${escapeHtml(member.prefix)}${escapeHtml(member.fullName)}</span><br><small>${escapeHtml(member.position)}</small></td>
      <td>${escapeHtml(member.organization)}</td>
      <td>${escapeHtml(member.phone)}<br><small>${escapeHtml(member.email || "-")}</small></td>
      <td><span class="skill-badge" data-skill="${escapeHtml(member.skillLevel)}">${escapeHtml(member.skillLevel)}</span></td>
      <td><span class="status-badge ${statusClass(member.status)}">${escapeHtml(member.status)}</span></td>
      <td><div class="table-actions"><button class="action-btn action-edit" type="button" data-edit="${escapeHtml(member.memberId)}" title="แก้ไข">✎</button><button class="action-btn action-delete" type="button" data-delete="${escapeHtml(member.memberId)}" title="ลบ">×</button></div></td>
    </tr>`).join("");
}

function statusClass(status) {
  return status === "อนุมัติแล้ว" ? "approved" : status === "รออนุมัติ" ? "pending" : "cancelled";
}

function handleAdminTableAction(event) {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) openMemberEditor(editButton.dataset.edit);
  if (deleteButton) deleteMember(deleteButton.dataset.delete);
}

function openMemberEditor(memberId = "") {
  const form = $("#memberEditForm");
  form.reset();
  editingIsNew = !memberId;
  $("#editTitle").textContent = editingIsNew ? "เพิ่มข้อมูลสมาชิก" : "แก้ไขข้อมูลสมาชิก";
  if (memberId) {
    const member = allMembers.find(item => item.memberId === memberId);
    if (!member) return;
    Object.entries(member).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    });
  } else {
    form.elements.memberId.value = "";
    form.elements.status.value = "รออนุมัติ";
  }
  openModal("#memberEditModal");
}

async function saveMemberEdit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const duplicate = findDuplicate(data, data.memberId);
  if (duplicate) {
    showToast(`พบข้อมูลซ้ำกับสมาชิก ${duplicate.memberId}`);
    return;
  }
  try {
    if (GAS_API_URL) {
      const action = editingIsNew ? "adminAddMember" : "updateMember";
      const result = await apiRequest(action, { token: adminToken, member: data });
      if (!result.success) throw new Error(result.message);
      await showDashboard();
    } else if (editingIsNew) {
      const nextNumber = Math.max(0, ...allMembers.map(m => Number(String(m.memberId).replace(/\D/g, "")) || 0)) + 1;
      allMembers.push({ ...data, memberId: `TT-${String(nextNumber).padStart(4, "0")}`, attendance: "เข้าร่วมเป็นครั้งคราว", consent: true, createdAt: new Date().toISOString() });
      saveLocalMembers();
    } else {
      const index = allMembers.findIndex(item => item.memberId === data.memberId);
      allMembers[index] = { ...allMembers[index], ...data };
      saveLocalMembers();
    }
    closeModal("#memberEditModal");
    renderDashboard();
    renderPublicMembers();
    updatePublicCount();
    showToast("บันทึกข้อมูลเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "บันทึกข้อมูลไม่สำเร็จ");
  }
}

async function deleteMember(memberId) {
  if (!confirm(`ยืนยันการลบสมาชิก ${memberId} ใช่หรือไม่?`)) return;
  try {
    if (GAS_API_URL) {
      const result = await apiRequest("deleteMember", { token: adminToken, memberId });
      if (!result.success) throw new Error(result.message);
      await showDashboard();
    } else {
      allMembers = allMembers.filter(item => item.memberId !== memberId);
      saveLocalMembers();
    }
    renderDashboard();
    renderPublicMembers();
    updatePublicCount();
    showToast("ลบข้อมูลเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "ลบข้อมูลไม่สำเร็จ");
  }
}

function exportCsv() {
  const headers = ["รหัสสมาชิก","คำนำหน้า","ชื่อ-สกุล","ตำแหน่ง","หน่วยงาน","สังกัด","โทรศัพท์","อีเมล","Line ID","ระดับทักษะ","การเข้าร่วม","สถานะ","วันที่สมัคร"];
  const keys = ["memberId","prefix","fullName","position","organization","affiliation","phone","email","lineId","skillLevel","attendance","status","createdAt"];
  const rows = allMembers.map(member => keys.map(key => csvCell(member[key])));
  const csv = "\uFEFF" + [headers.map(csvCell), ...rows].map(row => row.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `table-tennis-members-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

async function apiRequest(action, payload = {}) {
  const response = await fetch(GAS_API_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });
  if (!response.ok) throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  return response.json();
}

function openModal(selector) {
  $(selector).hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => $(selector).querySelector("input, button")?.focus(), 50);
}

function closeModal(selector) {
  $(selector).hidden = true;
  if (!$(".modal:not([hidden])")) document.body.classList.remove("modal-open");
}

function showToast(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
