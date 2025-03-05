// Variabel global untuk pagination
let selectedBookId, selectedBookName, totalHadith;
let currentPage = 1;
const perPage = 1; // 1 hadits per halaman

// Fungsi untuk mengambil data dari URL
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Respons jaringan tidak berhasil.");
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Memuat daftar kitab hadits
async function loadBooks() {
  const container = document.getElementById("bookContainer");
  try {
    const data = await fetchData("https://api.hadith.gading.dev/books");
    if (data.code == 200) {
      container.innerHTML = data.data
        .map((book, index) => {
          const bookNameEscaped = book.name.replace(/'/g, "\\'");
          return `<div class="card" onclick="loadHadith('${
            book.id
          }', '${bookNameEscaped}', ${book.available})">
                          <div class="number-diamond">
                            <span>${index + 1}</span>
                          </div>
                          <div class="card-info">
                            <h2>${book.name}</h2>
                            <p>${book.available} hadits tersedia</p>
                          </div>
                        </div>`;
        })
        .join("");
    } else {
      container.innerHTML = "Data tidak ditemukan.";
    }
  } catch (error) {
    container.innerHTML = "Gagal memuat data kitab hadits.";
  }
}

// Mengambil hadits berdasarkan halaman
async function fetchHadithData() {
  const hadithContainer = document.getElementById("hadithContainer");
  hadithContainer.innerHTML = "Memuat hadits...";
  const start = (currentPage - 1) * perPage + 1;
  let end = currentPage * perPage;
  if (end > totalHadith) {
    end = totalHadith;
  }
  const url = `https://api.hadith.gading.dev/books/${selectedBookId}?range=${start}-${end}`;
  console.log("Memuat URL:", url);

  try {
    const data = await fetchData(url);
    if (data.code == 200 && data.data.hadiths && data.data.hadiths.length > 0) {
      // Ambil 1 hadits per halaman
      const hadith = data.data.hadiths[0];
      let displayNumber = hadith.number;
      // Penyesuaian untuk kitab Ahmad
      if (selectedBookId === "hr.ahmad") {
        displayNumber = (currentPage - 1) * perPage + 1;
      }

      hadithContainer.innerHTML = `<strong>Hadits ${displayNumber} :</strong>
                                         <p class="arab">${hadith.arab}</p>
                                         <p class="arti">${hadith.id}</p>`;

      document.getElementById(
        "hadithSubtitle"
      ).textContent = `${selectedBookName} #${displayNumber}`;
      updatePagination();
    } else {
      hadithContainer.innerHTML = "Hadits tidak ditemukan.";
      document.getElementById("pagination").innerHTML = "";
    }
  } catch (error) {
    console.error("Error:", error);
    hadithContainer.innerHTML = "Gagal memuat hadits.";
  }
}

// Mengupdate tombol pagination
function updatePagination() {
  const paginationDiv = document.getElementById("pagination");
  let paginationHTML = "";
  if (currentPage > 1) {
    paginationHTML += `<button onclick="changePage(${
      currentPage - 1
    })">Sebelumnya</button>`;
  }
  if (currentPage * perPage < totalHadith) {
    paginationHTML += `<button onclick="changePage(${
      currentPage + 1
    })">Selanjutnya</button>`;
  }
  paginationDiv.innerHTML = paginationHTML;
}

// Berpindah halaman
function changePage(page) {
  currentPage = page;
  fetchHadithData();
}

// Memuat hadits berdasarkan kitab
async function loadHadith(bookId, bookName, available) {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("hadithPage").style.display = "block";

  let arabicTitle = "Kitab Hadis";
  if (bookId === "bukhari") arabicTitle = "صحيح البخاري";
  if (bookId === "muslim") arabicTitle = "صحيح مسلم";
  if (bookId === "abudawud") arabicTitle = "سنن أبي داود";
  if (bookId === "tirmidhi") arabicTitle = "سنن الترمذي";
  if (bookId === "nasai") arabicTitle = "سنن النسائي";
  if (bookId === "ibnmajah") arabicTitle = "سنن ابن ماجه";
  if (bookId === "malik") arabicTitle = "موطأ مالك";
  if (bookId === "ahmad") arabicTitle = "مسند أحمد";
  if (bookId === "darimi") arabicTitle = "سنن الدارمي";

  document.getElementById("arabicTitle").textContent = arabicTitle;
  document.getElementById("bookTitle").textContent = bookName;

  totalHadith = parseInt(available, 10);
  currentPage = 1;
  selectedBookId = bookId;
  selectedBookName = bookName;

  fetchHadithData();
}

// Kembali ke halaman utama
function goBack() {
  document.getElementById("mainPage").style.display = "block";
  document.getElementById("hadithPage").style.display = "none";
}

// Fungsi pencarian berdasarkan nomor hadits
function searchByHadithNumber(event) {
  event.preventDefault();
  const inputValue = document.getElementById("hadithSearchInput").value;
  const hadithNumber = parseInt(inputValue, 10);
  if (!hadithNumber || hadithNumber < 1 || hadithNumber > totalHadith) {
    alert("Nomor hadist tidak valid.");
    return;
  }
  currentPage = hadithNumber;
  fetchHadithData();
}

document.addEventListener("DOMContentLoaded", loadBooks);

function goBack() {
      document.getElementById('hadithPage').style.display = 'none';
      document.getElementById('mainPage').style.display = 'block';
    }

    function searchByHadithNumber(e) {
      e.preventDefault();
      // Logika pencarian nomor hadits di sini
      alert('Pencarian hadits dengan nomor: ' + document.getElementById('hadithSearchInput').value);
    }