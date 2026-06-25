"use strict";

/*
 * ระบบสมาชิกชมรมกีฬาเทเบิลเทนนิส สพป.สกลนคร เขต 2
 * - เมื่อเปิดบน localhost หรือเปิดไฟล์โดยตรง ระบบจะใช้ข้อมูลสาธิตใน localStorage
 * - เมื่อเผยแพร่บนเว็บไซต์จริง ระบบจะเชื่อม Google Apps Script Web App ด้านล่าง
 */
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbw8vQmu9WNHxMegWBMaUCscS0DD_0s-UgxUdRQJr8SCuKE2GReCwuqF3NbD3GcJ_VkP/exec";
const IS_LOCAL_PREVIEW = ["", "localhost", "127.0.0.1"].includes(location.hostname);
const API_URL = IS_LOCAL_PREVIEW ? "" : GAS_API_URL;
const STORAGE_KEY = "sakon2TableTennisMembers";
const CONTENT_STORAGE_KEY = "sakon2TableTennisContent";
const SESSION_KEY = "sakon2TableTennisAdminToken";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const demoMembers = [
  {
    memberId: "TT-0001", prefix: "นาย", fullName: "สมชาย ใจดี", position: "ผู้อำนวยการโรงเรียน",
    organization: "โรงเรียนบ้านตัวอย่าง", affiliation: "สพป.สกลนคร เขต 2", phone: "081-234-5678",
    email: "somchai@example.com", lineId: "", skillLevel: "ปานกลาง", attendance: "เข้าร่วมประจำ",
    note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-01-08T09:00:00+07:00", updatedAt: "2026-01-08T09:00:00+07:00"
  },
  {
    memberId: "TT-0002", prefix: "นางสาว", fullName: "สุดารัตน์ แสงทอง", position: "ครูชำนาญการ",
    organization: "โรงเรียนชุมชนพัฒนา", affiliation: "สพป.สกลนคร เขต 2", phone: "089-555-0102",
    email: "sudarat@example.com", lineId: "", skillLevel: "เริ่มต้น", attendance: "เข้าร่วมเป็นครั้งคราว",
    note: "", consent: true, status: "อนุมัติแล้ว", createdAt: "2026-01-15T10:30:00+07:00", updatedAt: "2026-01-15T10:30:00+07:00"
  },
  {
    memberId: "TT-0003", prefix: "นาย", fullName: "ประวิทย์ คำมั่น", position: "บุคลากรทางการศึกษา",
    organization: "สพป.สกลนคร เขต 2", affiliation: "สพป.สกลนคร เขต 2", phone: "086-222-4499",
    email: "", lineId: "", skillLevel: "ชำนาญ", attendance: "เข้าร่วมประจำ",
    note: "", consent: true, status: "รออนุมัติ", createdAt: "2026-02-03T14:00:00+07:00", updatedAt: "2026-02-03T14:00:00+07:00"
  }
];

const demoContent = {
  activities: [
    {
      activityId: "ACT-DEMO01",
      title: "กิจกรรมฝึกซ้อมประจำสัปดาห์",
      caption: "สมาชิกได้ฝึกการเสิร์ฟและการตีโต้ร่วมกันอย่างสนุกสนาน",
      activityDate: "2026-02-12",
      imageUrl: createDemoImage("#0a2866", "#ee2c7b", "THURSDAY CLUB"),
      status: "เผยแพร่",
      createdAt: "2026-02-12T18:00:00+07:00"
    },
    {
      activityId: "ACT-DEMO02",
      title: "มิตรภาพรอบโต๊ะ",
      caption: "บรรยากาศเป็นกันเอง รองรับทั้งผู้เล่นใหม่และผู้มีประสบการณ์",
      activityDate: "2026-01-29",
      imageUrl: createDemoImage("#0b4bc2", "#f4cd6b", "PLAY TOGETHER"),
      status: "เผยแพร่",
      createdAt: "2026-01-29T18:00:00+07:00"
    }
  ],
  questions: [
    {
      questionId: "Q-DEMO01",
      askerName: "ครูเมย์",
      organization: "โรงเรียนบ้านตัวอย่าง",
      question: "ไม่มีไม้ปิงปองส่วนตัว สามารถมาลองเล่นก่อนได้ไหมคะ",
      answer: "ได้ครับ ชมรมมีอุปกรณ์ส่วนกลางให้ทดลองใช้ในช่วงเริ่มต้น",
      status: "ตอบแล้ว",
      createdAt: "2026-02-10T09:00:00+07:00",
      answeredAt: "2026-02-10T12:00:00+07:00"
    },
    {
      questionId: "Q-DEMO02",
      askerName: "สมาชิกใหม่",
      organization: "",
      question: "กิจกรรมเริ่มประมาณกี่โมงครับ",
      answer: "",
      status: "รอตอบ",
      createdAt: "2026-02-14T11:30:00+07:00"
    }
  ]
};

let allMembers = [];
let activityImages = [];
let questionItems = [];
let adminToken = sessionStorage.getItem(SESSION_KEY) || "";
let editingIsNew = false;
let previewObjectUrl = "";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  seedLocalDemo();
  setupNavigation();
  setupReveal();
  setupForms();
  setupMemberFilters();
  setupContentFeatures();
  setupAdmin();
  $("#currentYear").textContent = new Date().getFullYear();
  await Promise.all([loadMembers(), loadPublicContent()]);
}

function seedLocalDemo() {
  if (API_URL) return;
  if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(demoMembers));
  if (!localStorage.getItem(CONTENT_STORAGE_KEY)) localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(demoContent));
}

function setupNavigation() {
  const header = $(".site-header");
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");

  const updateHeader = () => header.classList.toggle("scrolled", scrollY > 20);
  updateHeader();
  addEventListener("scroll", updateHeader, { passive: true });

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  $$(".nav-links a").forEach(link => link.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal").forEach(item => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  $$(".reveal").forEach(item => observer.observe(item));
}

function setupForms() {
  $("#registrationForm").addEventListener("submit", submitRegistration);
  $("#registrationForm").addEventListener("input", event => event.target.classList.remove("invalid"));
  $$("[data-close-modal]").forEach(button => button.addEventListener("click", () => closeModal($("#successModal"))));
}

function setupMemberFilters() {
  $("#memberSearch").addEventListener("input", renderPublicMembers);
  $("#skillFilter").addEventListener("change", renderPublicMembers);
}

function setupContentFeatures() {
  $("#questionForm").addEventListener("submit", submitQuestion);
  $("#questionSearch").addEventListener("input", renderPublicQuestions);
}

function setupAdmin() {
  $$("[data-open-admin]").forEach(button => button.addEventListener("click", openAdmin));
  $$("[data-close-admin]").forEach(button => button.addEventListener("click", closeAdmin));
  $$("[data-close-editor]").forEach(button => button.addEventListener("click", closeMemberEditor));

  $("#adminLoginForm").addEventListener("submit", adminLogin);
  $("#adminLogoutBtn").addEventListener("click", adminLogout);
  $("#adminSearch").addEventListener("input", renderAdminTable);
  $("#adminStatusFilter").addEventListener("change", renderAdminTable);
  $("#addMemberBtn").addEventListener("click", () => openMemberEditor());
  $("#memberEditForm").addEventListener("submit", saveMemberEdit);
  $("#adminMemberRows").addEventListener("click", handleAdminTableAction);
  $("#exportCsvBtn").addEventListener("click", exportCsv);

  $("#activityImageFile").addEventListener("change", previewActivityImage);
  $("#clearActivityImage").addEventListener("click", clearActivityImage);
  $("#activityUploadForm").addEventListener("submit", uploadActivityImage);
  $("#adminActivityList").addEventListener("click", handleActivityAction);
  $("#adminQuestionList").addEventListener("submit", answerQuestion);
  $("#adminQuestionList").addEventListener("click", handleQuestionAction);

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!$("#memberEditorModal").hidden) closeMemberEditor();
    else if (!$("#adminModal").hidden) closeAdmin();
    else if (!$("#successModal").hidden) closeModal($("#successModal"));
  });
}

async function loadMembers() {
  $("#publicMemberRows").innerHTML = '<tr><td colspan="6">กำลังโหลดรายชื่อสมาชิก...</td></tr>';
  try {
    if (API_URL) {
      const result = await apiRequest("getPublicMembers");
      if (!result.success) throw new Error(result.message || "โหลดรายชื่อสมาชิกไม่สำเร็จ");
      allMembers = Array.isArray(result.data) ? result.data : [];
    } else {
      allMembers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }
  } catch (error) {
    console.error(error);
    allMembers = [];
    showToast("ยังไม่สามารถโหลดรายชื่อสมาชิกได้");
  }
  renderPublicMembers();
}

function renderPublicMembers() {
  const query = $("#memberSearch").value.trim().toLowerCase();
  const skill = $("#skillFilter").value;
  const visible = allMembers
    .filter(member => member.status === "อนุมัติแล้ว" || !member.status)
    .filter(member => !skill || member.skillLevel === skill)
    .filter(member => {
      const text = `${member.memberId} ${member.prefix} ${member.fullName} ${member.position} ${member.organization}`.toLowerCase();
      return !query || text.includes(query);
    });

  $("#publicMemberRows").innerHTML = visible.map(member => `
    <tr>
      <td>${escapeHtml(member.memberId)}</td>
      <td class="member-name">${escapeHtml(member.prefix)}${escapeHtml(member.fullName)}</td>
      <td>${escapeHtml(member.position)}</td>
      <td>${escapeHtml(member.organization)}</td>
      <td><span class="skill-badge" data-skill="${escapeHtml(member.skillLevel)}">${escapeHtml(member.skillLevel)}</span></td>
      <td><span class="status-badge approved">อนุมัติแล้ว</span></td>
    </tr>`).join("");
  $("#memberResultCount").textContent = visible.length;
  $("#publicMemberCount").textContent = visible.length;
  $("#memberEmpty").hidden = visible.length > 0;
}

async function submitRegistration(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#registrationMessage");
  if (!validateForm(form)) {
    showFormMessage(message, "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  data.consent = data.consent === "true";
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังส่งใบสมัคร...");

  try {
    let memberId;
    if (API_URL) {
      const result = await apiRequest("register", data);
      if (!result.success) throw new Error(result.message || "สมัครสมาชิกไม่สำเร็จ");
      memberId = result.memberId;
    } else {
      const members = getLocalMembers();
      const duplicate = findDuplicate(members, data);
      if (duplicate) throw new Error("พบชื่อ เบอร์โทรศัพท์ หรืออีเมลนี้ในระบบแล้ว");
      memberId = nextMemberId(members);
      const now = new Date().toISOString();
      members.push({ ...data, memberId, status: "รออนุมัติ", createdAt: now, updatedAt: now });
      saveLocalMembers(members);
      allMembers = members;
    }

    form.reset();
    showFormMessage(message, "", "success");
    $("#newMemberId").textContent = memberId;
    openModal($("#successModal"));
    renderPublicMembers();
  } catch (error) {
    showFormMessage(message, error.message || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่", "error");
  } finally {
    setButtonLoading(button, false, 'ส่งใบสมัครสมาชิก <span>→</span>');
  }
}

async function loadPublicContent() {
  $("#activityGallery").innerHTML = '<div class="loading-card">กำลังโหลดภาพกิจกรรม...</div>';
  $("#publicQuestionList").innerHTML = '<div class="loading-card">กำลังโหลดคำถาม...</div>';
  try {
    if (API_URL) {
      const result = await apiRequest("getPublicContent");
      if (!result.success) throw new Error(result.message || "โหลดข้อมูลกิจกรรมไม่สำเร็จ");
      activityImages = Array.isArray(result.activities) ? result.activities : [];
      questionItems = Array.isArray(result.questions) ? result.questions : [];
    } else {
      const saved = getLocalContent();
      activityImages = saved.activities;
      questionItems = saved.questions;
    }
  } catch (error) {
    console.error(error);
    activityImages = [];
    questionItems = [];
    showToast("ยังไม่สามารถโหลดภาพกิจกรรมและคำถามได้");
  }
  renderActivityGallery();
  renderPublicQuestions();
}

function renderActivityGallery() {
  const published = [...activityImages]
    .filter(item => item.status !== "ซ่อน")
    .sort((a, b) => String(b.activityDate || b.createdAt).localeCompare(String(a.activityDate || a.createdAt)));
  $("#activityGallery").innerHTML = published.map(item => `
    <article class="gallery-card reveal visible">
      <img src="${safeImageUrl(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">
      <div class="gallery-card-content">
        <time>${formatThaiDate(item.activityDate || item.createdAt)}</time>
        <h3>${escapeHtml(item.title)}</h3>
        ${item.caption ? `<p>${escapeHtml(item.caption)}</p>` : ""}
      </div>
    </article>`).join("");
  $("#galleryEmpty").hidden = published.length > 0;
}

function renderPublicQuestions() {
  const query = $("#questionSearch").value.trim().toLowerCase();
  const visible = [...questionItems]
    .filter(item => item.status !== "ซ่อน")
    .filter(item => {
      const text = `${item.askerName} ${item.organization} ${item.question} ${item.answer}`.toLowerCase();
      return !query || text.includes(query);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  $("#publicQuestionList").innerHTML = visible.map(item => `
    <article class="qa-item">
      <div class="qa-meta">
        <span><b>${escapeHtml(item.askerName)}</b>${item.organization ? ` · ${escapeHtml(item.organization)}` : ""}</span>
        <time>${formatThaiDate(item.createdAt)}</time>
      </div>
      <p class="qa-question">${escapeHtml(item.question)}</p>
      ${item.answer
        ? `<div class="qa-answer">${escapeHtml(item.answer)}</div>`
        : '<div class="qa-answer pending">รอคำตอบจากผู้ดูแลชมรม</div>'}
    </article>`).join("");
  $("#questionCount").textContent = visible.length;
  $("#questionEmpty").hidden = visible.length > 0;
}

async function submitQuestion(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#questionMessage");
  if (!form.checkValidity()) {
    showFormMessage(message, "กรุณากรอกชื่อและคำถามให้ครบถ้วน", "error");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังส่งคำถาม...");
  try {
    if (API_URL) {
      const result = await apiRequest("submitQuestion", data);
      if (!result.success) throw new Error(result.message || "ส่งคำถามไม่สำเร็จ");
      await loadPublicContent();
    } else {
      questionItems.unshift({
        ...data,
        questionId: `Q-${Date.now()}`,
        answer: "",
        status: "รอตอบ",
        createdAt: new Date().toISOString()
      });
      saveLocalContent();
      renderPublicQuestions();
    }
    form.reset();
    showFormMessage(message, "ส่งคำถามเรียบร้อยแล้ว ผู้ดูแลจะตอบกลับผ่านบอร์ดนี้", "success");
  } catch (error) {
    showFormMessage(message, error.message || "ส่งคำถามไม่สำเร็จ กรุณาลองใหม่", "error");
  } finally {
    setButtonLoading(button, false, 'ส่งคำถาม <span>→</span>');
  }
}

function openAdmin() {
  openModal($("#adminModal"));
  if (adminToken) showDashboard();
  else showAdminLogin();
}

function closeAdmin() {
  closeModal($("#adminModal"));
}

function showAdminLogin() {
  $("#adminLoginView").hidden = false;
  $("#adminDashboard").hidden = true;
  setTimeout(() => $("#adminLoginForm input")?.focus(), 50);
}

async function adminLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#loginMessage");
  const credentials = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังตรวจสอบ...");
  try {
    if (API_URL) {
      const result = await apiRequest("login", credentials);
      if (!result.success) throw new Error(result.message || "เข้าสู่ระบบไม่สำเร็จ");
      adminToken = result.token;
    } else {
      if (credentials.username !== "admin" || credentials.password !== "pingpong2569") {
        throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
      adminToken = "demo-admin-session";
    }
    sessionStorage.setItem(SESSION_KEY, adminToken);
    form.reset();
    await showDashboard();
  } catch (error) {
    showFormMessage(message, error.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
  } finally {
    setButtonLoading(button, false, "เข้าสู่ระบบ");
  }
}

function adminLogout() {
  adminToken = "";
  sessionStorage.removeItem(SESSION_KEY);
  showAdminLogin();
  showToast("ออกจากระบบแล้ว");
}

async function showDashboard() {
  try {
    if (API_URL) {
      const [memberResult, contentResult] = await Promise.all([
        apiRequest("getAdminMembers", { token: adminToken }),
        apiRequest("getAdminContent", { token: adminToken })
      ]);
      if (!memberResult.success || !contentResult.success) {
        throw new Error(memberResult.message || contentResult.message || "เซสชันหมดอายุ");
      }
      allMembers = memberResult.data || [];
      activityImages = contentResult.activities || [];
      questionItems = contentResult.questions || [];
    } else {
      allMembers = getLocalMembers();
      const content = getLocalContent();
      activityImages = content.activities;
      questionItems = content.questions;
    }
    $("#adminLoginView").hidden = true;
    $("#adminDashboard").hidden = false;
    renderDashboard();
  } catch (error) {
    adminToken = "";
    sessionStorage.removeItem(SESSION_KEY);
    showAdminLogin();
    showFormMessage($("#loginMessage"), error.message || "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "error");
  }
}

function renderDashboard() {
  $("#adminTotalCount").textContent = allMembers.length;
  $("#adminApprovedCount").textContent = allMembers.filter(item => item.status === "อนุมัติแล้ว").length;
  $("#adminPendingCount").textContent = allMembers.filter(item => item.status === "รออนุมัติ").length;
  $("#adminActivityCount").textContent = activityImages.length;
  renderAdminTable();
  renderAdminActivities();
  renderAdminQuestions();
}

function renderAdminTable() {
  const query = $("#adminSearch").value.trim().toLowerCase();
  const status = $("#adminStatusFilter").value;
  const visible = allMembers.filter(member => {
    const text = `${member.memberId} ${member.fullName} ${member.organization} ${member.phone} ${member.email}`.toLowerCase();
    return (!query || text.includes(query)) && (!status || member.status === status);
  });
  $("#adminMemberRows").innerHTML = visible.map(member => `
    <tr>
      <td>${escapeHtml(member.memberId)}</td>
      <td class="member-name">${escapeHtml(member.prefix)}${escapeHtml(member.fullName)}</td>
      <td>${escapeHtml(member.organization)}</td>
      <td>${escapeHtml(member.phone)}${member.email ? `<br>${escapeHtml(member.email)}` : ""}</td>
      <td>${escapeHtml(member.skillLevel)}</td>
      <td><span class="status-badge ${statusClass(member.status)}">${escapeHtml(member.status)}</span></td>
      <td><div class="action-group">
        <button class="action-btn action-edit" type="button" data-edit-member="${escapeHtml(member.memberId)}">แก้ไข</button>
        <button class="action-btn action-delete" type="button" data-delete-member="${escapeHtml(member.memberId)}">ลบ</button>
      </div></td>
    </tr>`).join("") || '<tr><td colspan="7">ไม่พบข้อมูลสมาชิก</td></tr>';
}

function handleAdminTableAction(event) {
  const editButton = event.target.closest("[data-edit-member]");
  const deleteButton = event.target.closest("[data-delete-member]");
  if (editButton) openMemberEditor(editButton.dataset.editMember);
  if (deleteButton) deleteMember(deleteButton.dataset.deleteMember);
}

function openMemberEditor(memberId = "") {
  editingIsNew = !memberId;
  const form = $("#memberEditForm");
  form.reset();
  showFormMessage($("#editorMessage"), "", "success");
  $("#editorTitle").textContent = editingIsNew ? "เพิ่มสมาชิก" : "แก้ไขข้อมูลสมาชิก";
  if (memberId) {
    const member = allMembers.find(item => item.memberId === memberId);
    if (!member) return;
    [...form.elements].forEach(element => {
      if (element.name && member[element.name] !== undefined) element.value = member[element.name];
    });
  } else {
    form.elements.status.value = "รออนุมัติ";
    form.elements.attendance.value = "เข้าร่วมเป็นครั้งคราว";
  }
  openModal($("#memberEditorModal"));
}

function closeMemberEditor() {
  closeModal($("#memberEditorModal"));
}

async function saveMemberEdit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#editorMessage");
  if (!form.checkValidity()) {
    showFormMessage(message, "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", "error");
    return;
  }
  const member = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังบันทึก...");
  try {
    if (API_URL) {
      const action = editingIsNew ? "adminAddMember" : "updateMember";
      const result = await apiRequest(action, { token: adminToken, member });
      if (!result.success) throw new Error(result.message || "บันทึกข้อมูลไม่สำเร็จ");
      await showDashboard();
    } else {
      const members = getLocalMembers();
      const duplicate = findDuplicate(members, member, member.memberId);
      if (duplicate) throw new Error(`ข้อมูลซ้ำกับสมาชิก ${duplicate.memberId}`);
      const now = new Date().toISOString();
      if (editingIsNew) {
        members.push({
          ...member,
          memberId: nextMemberId(members),
          consent: true,
          createdAt: now,
          updatedAt: now
        });
      } else {
        const index = members.findIndex(item => item.memberId === member.memberId);
        if (index < 0) throw new Error("ไม่พบข้อมูลสมาชิก");
        members[index] = { ...members[index], ...member, updatedAt: now };
      }
      saveLocalMembers(members);
      allMembers = members;
      renderDashboard();
    }
    closeMemberEditor();
    renderPublicMembers();
    showToast("บันทึกข้อมูลสมาชิกเรียบร้อยแล้ว");
  } catch (error) {
    showFormMessage(message, error.message || "บันทึกข้อมูลไม่สำเร็จ", "error");
  } finally {
    setButtonLoading(button, false, "บันทึกข้อมูล");
  }
}

async function deleteMember(memberId) {
  if (!confirm(`ยืนยันการลบสมาชิก ${memberId} ใช่หรือไม่?`)) return;
  try {
    if (API_URL) {
      const result = await apiRequest("deleteMember", { token: adminToken, memberId });
      if (!result.success) throw new Error(result.message || "ลบข้อมูลไม่สำเร็จ");
      await showDashboard();
    } else {
      const members = getLocalMembers().filter(item => item.memberId !== memberId);
      saveLocalMembers(members);
      allMembers = members;
      renderDashboard();
    }
    renderPublicMembers();
    showToast("ลบข้อมูลสมาชิกเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "ลบข้อมูลไม่สำเร็จ");
  }
}

function previewActivityImage(event) {
  const file = event.target.files[0];
  const preview = $("#activityImagePreview");
  if (!file) {
    preview.hidden = true;
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    showFormMessage($("#activityUploadMessage"), "รองรับเฉพาะไฟล์ JPG, PNG และ WebP", "error");
    event.target.value = "";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showFormMessage($("#activityUploadMessage"), "ไฟล์มีขนาดเกิน 8 MB กรุณาเลือกภาพใหม่", "error");
    event.target.value = "";
    return;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  preview.querySelector("img").src = previewObjectUrl;
  preview.hidden = false;
}

function clearActivityImage() {
  $("#activityImageFile").value = "";
  $("#activityImagePreview").hidden = true;
  $("#activityImagePreview img").removeAttribute("src");
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
}

async function uploadActivityImage(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const file = $("#activityImageFile").files[0];
  const message = $("#activityUploadMessage");
  if (!form.checkValidity() || !file) {
    showFormMessage(message, "กรุณากรอกข้อมูลและเลือกภาพกิจกรรม", "error");
    return;
  }
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังเตรียมและอัปโหลดภาพ...");
  try {
    const imageData = await compressImage(file, 1600, .84);
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.image;
    data.imageData = imageData;
    data.fileName = file.name.replace(/[^\wก-๙.-]/g, "_").replace(/\.[^.]+$/, ".jpg");
    data.mimeType = "image/jpeg";

    if (API_URL) {
      const result = await apiRequest("addActivity", { token: adminToken, activity: data });
      if (!result.success) throw new Error(result.message || "อัปโหลดภาพไม่สำเร็จ");
      await showDashboard();
      await loadPublicContent();
    } else {
      activityImages.unshift({
        ...data,
        activityId: `ACT-${Date.now()}`,
        imageUrl: imageData,
        status: "เผยแพร่",
        createdAt: new Date().toISOString()
      });
      saveLocalContent();
      renderDashboard();
      renderActivityGallery();
    }
    form.reset();
    clearActivityImage();
    showFormMessage(message, "อัปโหลดภาพกิจกรรมเรียบร้อยแล้ว", "success");
  } catch (error) {
    showFormMessage(message, error.message || "อัปโหลดภาพไม่สำเร็จ", "error");
  } finally {
    setButtonLoading(button, false, "อัปโหลดภาพกิจกรรม");
  }
}

function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("รูปแบบไฟล์ภาพไม่ถูกต้อง"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAdminActivities() {
  const sorted = [...activityImages].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  $("#adminActivityList").innerHTML = sorted.map(item => `
    <article class="admin-activity-item">
      <img src="${safeImageUrl(item.imageUrl)}" alt="">
      <div><h4>${escapeHtml(item.title)}</h4><p>${formatThaiDate(item.activityDate)} · ${escapeHtml(item.status || "เผยแพร่")}</p></div>
      <button class="action-btn action-delete" type="button" data-delete-activity="${escapeHtml(item.activityId)}" title="ลบภาพ">×</button>
    </article>`).join("") || '<div class="content-empty compact"><p>ยังไม่มีภาพกิจกรรม</p></div>';
}

function handleActivityAction(event) {
  const button = event.target.closest("[data-delete-activity]");
  if (button) deleteActivity(button.dataset.deleteActivity);
}

async function deleteActivity(activityId) {
  if (!confirm("ยืนยันการลบภาพกิจกรรมนี้ใช่หรือไม่?")) return;
  try {
    if (API_URL) {
      const result = await apiRequest("deleteActivity", { token: adminToken, activityId });
      if (!result.success) throw new Error(result.message || "ลบภาพไม่สำเร็จ");
      await showDashboard();
      await loadPublicContent();
    } else {
      activityImages = activityImages.filter(item => item.activityId !== activityId);
      saveLocalContent();
      renderDashboard();
      renderActivityGallery();
    }
    showToast("ลบภาพกิจกรรมเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "ลบภาพไม่สำเร็จ");
  }
}

function renderAdminQuestions() {
  const sorted = [...questionItems].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  $("#adminQuestionCount").textContent = sorted.length;
  $("#adminQuestionList").innerHTML = sorted.map(item => `
    <article class="admin-question-item">
      <div class="admin-question-item-head">
        <b>${escapeHtml(item.askerName)}${item.organization ? ` · ${escapeHtml(item.organization)}` : ""}</b>
        <span>${formatThaiDate(item.createdAt)} · ${escapeHtml(item.status || "รอตอบ")}</span>
      </div>
      <p>${escapeHtml(item.question)}</p>
      <form class="admin-answer-form" data-question-form="${escapeHtml(item.questionId)}">
        <textarea name="answer" maxlength="2000" placeholder="พิมพ์คำตอบจากผู้ดูแล...">${escapeHtml(item.answer || "")}</textarea>
        <div class="admin-answer-actions">
          <button class="btn btn-small btn-danger-soft" type="button" data-delete-question="${escapeHtml(item.questionId)}">ลบ</button>
          <button class="btn btn-small btn-primary" type="submit">บันทึกคำตอบ</button>
        </div>
      </form>
    </article>`).join("") || '<div class="content-empty compact"><p>ยังไม่มีคำถาม</p></div>';
}

async function answerQuestion(event) {
  const form = event.target.closest("[data-question-form]");
  if (!form) return;
  event.preventDefault();
  const questionId = form.dataset.questionForm;
  const answer = form.elements.answer.value.trim();
  if (!answer) {
    showToast("กรุณาพิมพ์คำตอบก่อนบันทึก");
    return;
  }
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "กำลังบันทึก...");
  try {
    if (API_URL) {
      const result = await apiRequest("answerQuestion", { token: adminToken, questionId, answer });
      if (!result.success) throw new Error(result.message || "บันทึกคำตอบไม่สำเร็จ");
      await showDashboard();
      await loadPublicContent();
    } else {
      const item = questionItems.find(question => question.questionId === questionId);
      if (!item) throw new Error("ไม่พบคำถาม");
      item.answer = answer;
      item.status = "ตอบแล้ว";
      item.answeredAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      saveLocalContent();
      renderDashboard();
      renderPublicQuestions();
    }
    showToast("บันทึกคำตอบเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "บันทึกคำตอบไม่สำเร็จ");
  } finally {
    setButtonLoading(button, false, "บันทึกคำตอบ");
  }
}

function handleQuestionAction(event) {
  const button = event.target.closest("[data-delete-question]");
  if (button) deleteQuestion(button.dataset.deleteQuestion);
}

async function deleteQuestion(questionId) {
  if (!confirm("ยืนยันการลบคำถามนี้ใช่หรือไม่?")) return;
  try {
    if (API_URL) {
      const result = await apiRequest("deleteQuestion", { token: adminToken, questionId });
      if (!result.success) throw new Error(result.message || "ลบคำถามไม่สำเร็จ");
      await showDashboard();
      await loadPublicContent();
    } else {
      questionItems = questionItems.filter(item => item.questionId !== questionId);
      saveLocalContent();
      renderDashboard();
      renderPublicQuestions();
    }
    showToast("ลบคำถามเรียบร้อยแล้ว");
  } catch (error) {
    showToast(error.message || "ลบคำถามไม่สำเร็จ");
  }
}

function exportCsv() {
  const headers = ["รหัสสมาชิก", "คำนำหน้า", "ชื่อ-สกุล", "ตำแหน่ง", "หน่วยงาน", "สังกัด", "โทรศัพท์", "อีเมล", "Line ID", "ระดับทักษะ", "การเข้าร่วม", "สถานะ", "วันที่สมัคร"];
  const keys = ["memberId", "prefix", "fullName", "position", "organization", "affiliation", "phone", "email", "lineId", "skillLevel", "attendance", "status", "createdAt"];
  const rows = [headers, ...allMembers.map(member => keys.map(key => member[key] ?? ""))];
  const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `table-tennis-members-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("สร้างไฟล์ CSV เรียบร้อยแล้ว");
}

async function apiRequest(action, payload = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`เซิร์ฟเวอร์ตอบกลับ ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateForm(form) {
  let valid = true;
  [...form.elements].forEach(element => {
    if (element.willValidate && !element.checkValidity()) {
      element.classList.add("invalid");
      valid = false;
    }
  });
  return valid;
}

function getLocalMembers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveLocalMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function getLocalContent() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTENT_STORAGE_KEY) || "{}");
    return { activities: saved.activities || [], questions: saved.questions || [] };
  } catch {
    return { activities: [], questions: [] };
  }
}

function saveLocalContent() {
  localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify({ activities: activityImages, questions: questionItems }));
}

function findDuplicate(members, data, excludeId = "") {
  const name = normalize(data.fullName);
  const phone = normalize(data.phone);
  const email = normalize(data.email);
  return members.find(member => member.memberId !== excludeId && (
    (name && normalize(member.fullName) === name) ||
    (phone && normalize(member.phone) === phone) ||
    (email && normalize(member.email) === email)
  ));
}

function nextMemberId(members) {
  const maximum = members.reduce((max, member) => Math.max(max, Number(String(member.memberId || "").replace(/\D/g, "")) || 0), 0);
  return `TT-${String(maximum + 1).padStart(4, "0")}`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function statusClass(status) {
  return status === "อนุมัติแล้ว" ? "approved" : status === "ยกเลิก" ? "cancelled" : "pending";
}

function setButtonLoading(button, loading, label) {
  button.disabled = loading;
  button.innerHTML = label;
}

function openModal(modal) {
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.hidden = true;
  if ($$(".modal:not([hidden])").length === 0) document.body.classList.remove("modal-open");
}

function showFormMessage(element, text, type) {
  element.textContent = text;
  element.className = `form-message${text ? ` show ${type}` : ""}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatThaiDate(value) {
  if (!value) return "ไม่ระบุวันที่";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function safeImageUrl(value) {
  const url = String(value || "");
  return /^(https:\/\/|data:image\/)/i.test(url) ? escapeHtml(url) : createDemoImage("#061840", "#ee2c7b", "TABLE TENNIS");
}

function createDemoImage(colorA, colorB, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#g)"/>
      <g opacity=".15" stroke="#fff"><path d="M0 160h1200M0 320h1200M0 480h1200M0 640h1200"/><path d="M200 0v800M400 0v800M600 0v800M800 0v800M1000 0v800"/></g>
      <ellipse cx="430" cy="335" rx="150" ry="185" fill="#ee2c7b" transform="rotate(-24 430 335)"/>
      <rect x="510" y="455" width="55" height="220" rx="18" fill="#f4cd6b" transform="rotate(-24 510 455)"/>
      <circle cx="790" cy="270" r="54" fill="#fff7d6"/>
      <path d="M650 545h410" stroke="#fff" stroke-width="16" opacity=".75"/>
      <path d="M855 545v-165" stroke="#fff" stroke-width="8" opacity=".75"/>
      <text x="75" y="715" fill="#fff" font-family="Arial,sans-serif" font-size="58" font-weight="700" letter-spacing="8">${escapeXml(label)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
