// Deklarasi audio (ganti URL "imsak.mp3", "subuh.mp3", "adzan.mp3" sesuai file yang Anda miliki)
const imsakAudio = new Audio("assets/audio/imsak.mp3");
const subuhAudio = new Audio("assets/audio/subuh.mp3");
const adzanAudio = new Audio("assets/audio/adzan.mp3");
let prayerInterval = null;

// Fungsi untuk memutar audio sesuai dengan nama waktu sholat
function playAudio(prayerName) {
  if (prayerName === "Imsak") {
    imsakAudio.play();
  } else if (prayerName === "Subuh") {
    subuhAudio.play();
  } else if (["Dzuhur", "Ashar", "Maghrib", "Isya"].includes(prayerName)) {
    adzanAudio.play();
  }
}

// Fungsi untuk memberi highlight pada baris tabel hari yang sesuai dengan waktu sholat
function highlightPrayerRow(prayerName) {
  // Menghapus highlight dari semua baris
  $("#day-view table tbody tr").removeClass("table-success");
  // Menambahkan highlight pada baris yang memiliki nama sholat sesuai
  $("#day-view table tbody tr").each(function () {
    const rowText = $(this).find("td:first").text().trim();
    if (rowText === prayerName) {
      $(this).addClass("table-success");
    }
  });
}

function normalizeCityName(cityName) {
  return cityName
    .toLowerCase()
    .replace(/^(kota|city of)\s+/i, "")
    .trim();
}

function findExactCityMatch(userCity, cityList) {
  let normalizedUserCity = normalizeCityName(userCity);
  console.log("User city after normalization:", normalizedUserCity);
  return cityList.find(
    (city) => normalizeCityName(city.lokasi) === normalizedUserCity
  );
}

async function getUserLocation(cityList) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          let userCity =
            data.address.city || data.address.town || data.address.village;
          console.log("Kota terdeteksi:", userCity);
          let matchedCity = findExactCityMatch(userCity, cityList) || {
            id: "1301",
            lokasi: "Jakarta",
          };
          console.log("Kota cocok:", matchedCity.lokasi || "Default Jakarta");
          $("#city").val(matchedCity.id).trigger("change");
        } catch (error) {
          console.error("Gagal mendapatkan lokasi:", error);
          $("#city").val("1301").trigger("change");
        }
      },
      () => {
        console.error("Geolocation tidak diizinkan.");
        $("#city").val("1301").trigger("change");
      }
    );
  } else {
    console.warn("Geolocation tidak didukung.");
    $("#city").val("1301").trigger("change");
  }
}

async function loadCities() {
  try {
    const response = await fetch(
      "https://api.myquran.com/v2/sholat/kota/semua"
    );
    const data = await response.json();
    const citySelect = $("#city");
    citySelect.empty();
    data.data.forEach((city) => {
      citySelect.append(new Option(city.lokasi, city.id));
    });
    $("#city").select({
      placeholder: "Cari Kota/Kab.",
      allowClear: true,
    });
    getUserLocation(data.data);
  } catch (error) {
    console.error("Gagal mengambil daftar kota:", error);
  }
}

async function getPrayerSchedule() {
  const citySelect = document.getElementById("city");
  const cityId = citySelect.value;
  const cityName =
    citySelect.options[citySelect.selectedIndex].text || "Jakarta";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthNames = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];
  const monthName = monthNames[now.getMonth()];
  document.getElementById(
    "judul-jadwal"
  ).textContent = `JADWAL IMSAKIYAH ${cityName} - ${monthName} ${year}`;

  const url = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const tbodyMonth = document.getElementById("schedule-body-month");
    tbodyMonth.innerHTML = "";
    let foundToday = false;
    let todayData = null;
    const today = new Date();
    const formattedToday = today.getDate();

    if (data.status && data.data && data.data.jadwal) {
      data.data.jadwal.forEach((item) => {
        const dateObj = new Date(item.date);
        const dayNumber = dateObj.getDate();
        const isToday =
          dayNumber === formattedToday &&
          year === today.getFullYear() &&
          month === String(today.getMonth() + 1).padStart(2, "0");
        const rowHtml = `<tr ${
          isToday ? 'class="formattedToday" id="todayRow"' : ""
        }>
                                  <td>${item.tanggal}</td>
                                  <td>${item.imsak}</td>
                                  <td>${item.terbit}</td>
                                  <td>${item.dhuha}</td>
                                  <td>${item.subuh}</td>
                                  <td>${item.dzuhur}</td>
                                  <td>${item.ashar}</td>
                                  <td>${item.maghrib}</td>
                                  <td>${item.isya}</td>
                                </tr>`;
        tbodyMonth.innerHTML += rowHtml;
        if (isToday) {
          foundToday = true;
          todayData = item;
        }
      });
      if (foundToday && todayData) {
        document.getElementById("daily-date").textContent = todayData.tanggal;
        document.getElementById("daily-imsak").textContent = todayData.imsak;
        document.getElementById("daily-subuh").textContent = todayData.subuh;
        document.getElementById("daily-terbit").textContent = todayData.terbit;
        document.getElementById("daily-dhuha").textContent = todayData.dhuha;
        document.getElementById("daily-dzuhur").textContent = todayData.dzuhur;
        document.getElementById("daily-ashar").textContent = todayData.ashar;
        document.getElementById("daily-maghrib").textContent =
          todayData.maghrib;
        document.getElementById("daily-isya").textContent = todayData.isya;
        updatePrayerNotification(todayData);
      } else {
        document.getElementById("daily-date").textContent =
          "Data tidak tersedia untuk hari ini";
        [
          "daily-imsak",
          "daily-subuh",
          "daily-terbit",
          "daily-dhuha",
          "daily-dzuhur",
          "daily-ashar",
          "daily-maghrib",
          "daily-isya",
        ].forEach((id) => (document.getElementById(id).textContent = ""));
      }
    } else {
      tbodyMonth.innerHTML = `<tr><td colspan="9">Data tidak ditemukan</td></tr>`;
      [
        "daily-date",
        "daily-imsak",
        "daily-subuh",
        "daily-terbit",
        "daily-dhuha",
        "daily-dzuhur",
        "daily-ashar",
        "daily-maghrib",
        "daily-isya",
      ].forEach((id) => (document.getElementById(id).textContent = ""));
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    document.getElementById(
      "schedule-body-month"
    ).innerHTML = `<tr><td colspan="9">Gagal mengambil data</td></tr>`;
    [
      "daily-date",
      "daily-imsak",
      "daily-subuh",
      "daily-terbit",
      "daily-dhuha",
      "daily-dzuhur",
      "daily-ashar",
      "daily-maghrib",
      "daily-isya",
    ].forEach((id) => (document.getElementById(id).textContent = ""));
  }
  const todayElement = document.getElementById("todayRow");
  if (
    todayElement &&
    document.getElementById("month-view").style.display !== "none"
  ) {
    todayElement.scrollIntoView({ behavior: "smooth", block: "start" });
    const tableContainer = document.querySelector(
      "#month-view .table-container"
    );
    tableContainer.scrollTo({
      top: todayElement.offsetTop,
      behavior: "smooth",
    });
  }
}

function updatePrayerNotification(schedule) {
  const marqueeText = document.getElementById("marquee-text");
  const currentTime = new Date();
  const prayerTimes = [
    { name: "Imsak", time: schedule.imsak },
    { name: "Terbit", time: schedule.terbit },
    { name: "Dhuha", time: schedule.dhuha },
    { name: "Subuh", time: schedule.subuh },
    { name: "Dzuhur", time: schedule.dzuhur },
    { name: "Ashar", time: schedule.ashar },
    { name: "Maghrib", time: schedule.maghrib },
    { name: "Isya", time: schedule.isya },
  ];

  let nextPrayer = null;
  let minDiff = Infinity;
  prayerTimes.forEach((prayer) => {
    const [hour, minute] = prayer.time.split(":").map(Number);
    const prayerTime = new Date(currentTime);
    prayerTime.setHours(hour, minute, 0, 0);
    if (prayerTime < currentTime) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }
    const diff = prayerTime - currentTime;
    if (diff < minDiff) {
      minDiff = diff;
      nextPrayer = { name: prayer.name, time: prayerTime };
    }
  });

  // Berikan highlight pada baris jadwal hari sesuai dengan waktu sholat berikutnya
  if (
    ["Imsak", "Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"].includes(
      nextPrayer.name
    )
  ) {
    highlightPrayerRow(nextPrayer.name);
  }

  if (prayerInterval) {
    clearInterval(prayerInterval);
  }
  if (nextPrayer) {
    prayerInterval = setInterval(() => {
      const now = new Date();
      const timeDiff = nextPrayer.time - now;
      if (timeDiff <= 0) {
        clearInterval(prayerInterval);
        marqueeText.textContent = `Waktu ${nextPrayer.name} telah tiba!`;
        // Mainkan audio sesuai dengan waktu sholat yang telah tiba
        playAudio(nextPrayer.name);
        // Segarkan jadwal dan notifikasi setelah audio diputar
        getPrayerSchedule();
        return;
      }
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      marqueeText.textContent = `Waktu ${nextPrayer.name} akan tiba dalam ${hours} jam, ${minutes} menit, ${seconds} detik`;
    }, 1000);
  }
}

function applyDarkMode() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 18 || hour < 6) {
    document.body.classList.add("dark-mode");
    document
      .querySelectorAll("table")
      .forEach((table) => table.classList.add("dark-mode"));
  } else {
    document.body.classList.remove("dark-mode");
    document
      .querySelectorAll("table")
      .forEach((table) => table.classList.remove("dark-mode"));
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadCities().then(getPrayerSchedule);
  applyDarkMode();
  setInterval(applyDarkMode, 3600000);
});

$(document).ready(function () {
  $("#city").select({
    placeholder: "Pilih kota/kabupaten",
    allowClear: true,
  });
  $("#city").on("change", getPrayerSchedule);
  document.getElementById("btn-hari").addEventListener("click", function () {
    document.getElementById("day-view").style.display = "block";
    document.getElementById("month-view").style.display = "none";
    this.classList.add("btn-primary");
    this.classList.remove("btn-outline-primary");
    document.getElementById("btn-bulan").classList.add("btn-outline-primary");
    document.getElementById("btn-bulan").classList.remove("btn-primary");
  });
  document.getElementById("btn-bulan").addEventListener("click", function () {
    document.getElementById("day-view").style.display = "none";
    document.getElementById("month-view").style.display = "block";
    this.classList.add("btn-primary");
    this.classList.remove("btn-outline-primary");
    document.getElementById("btn-hari").classList.add("btn-outline-primary");
    document.getElementById("btn-hari").classList.remove("btn-primary");
  });
});
