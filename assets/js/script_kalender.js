    // Variabel global
    let currentHijri = null; // Data API Hijriyah
    let dayList = [];    
    let monthList = [];  
    let currentMonthIndex = 0; 
    const monthLengths = [30,29,30,29,30,29,30,29,30,29,30,29];
    let events = {}; // { 'YYYY-MM-DD': [ 'event1', 'event2' ] }
    let selectedDate = "";

    // Fungsi penyimpanan event ke localStorage
    function saveEventsToStorage() {
      localStorage.setItem("calendarEvents", JSON.stringify(events));
    }
    function loadEventsFromStorage() {
      const storedEvents = localStorage.getItem("calendarEvents");
      if (storedEvents) {
        events = JSON.parse(storedEvents);
      }
    }

    async function fetchAPIData() {
      try {
        loadEventsFromStorage();
        // Ambil data tanggal Hijriyah (zona WIB)
        const resCurrent = await fetch('https://api.myquran.com/v2/cal/hijr/?adj=-1');
        const dataCurrent = await resCurrent.json();
        currentHijri = dataCurrent.data;

        // Ambil daftar nama hari
        const resDays = await fetch('https://api.myquran.com/v2/cal/list/days');
        const dataDays = await resDays.json();
        dayList = dataDays.data.id;

        // Ambil daftar nama bulan Hijriyah
        const resMonths = await fetch('https://api.myquran.com/v2/cal/list/months');
        const dataMonths = await resMonths.json();
        monthList = dataMonths.data.id;

        // Set currentMonthIndex (dataHijriyah.num[5] adalah bulan Hijriyah, 1-indexed)
        currentMonthIndex = currentHijri.num[5] - 1;

        renderWeekdays();
        renderCalendar();
        renderAllEvents();
      } catch (error) {
        console.error('Gagal mengambil data API:', error);
        document.getElementById('monthYear').textContent = 'Gagal memuat data';
      }
    }

    function renderWeekdays() {
      const weekdaysDiv = document.getElementById('weekdays');
      weekdaysDiv.innerHTML = '';
      dayList.forEach(day => {
        const div = document.createElement('div');
        div.textContent = day;
        weekdaysDiv.appendChild(div);
      });
    }

    function renderCalendar() {
      const monthYear = document.getElementById("monthYear");
      const gregorianDate = document.getElementById("gregorianDate");
      const calendarDays = document.getElementById("calendarDays");
      calendarDays.innerHTML = "";

      // Tampilkan nama bulan & tahun Hijriyah dan tanggal Masehi
      monthYear.textContent = monthList[currentMonthIndex] + " " + currentHijri.num[6];
      gregorianDate.textContent = currentHijri.date[2];

      const daysInMonth = monthLengths[currentMonthIndex];

      // Perhitungan offset:
      // currentHijri.num[0] = hari (1 = Ahad) untuk tanggal saat ini
      // currentHijri.num[4] = tanggal Hijriyah saat ini.
      const currentWeekdayIndex = currentHijri.num[0]; // 1-indexed
      const currentHijriDay = currentHijri.num[4];
      const weekdayOfFirst = ((currentWeekdayIndex - 1) - (currentHijriDay - 1) + 7) % 7;

      // Tambahkan sel kosong untuk offset
      for (let i = 0; i < weekdayOfFirst; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = 'day';
        emptyCell.style.visibility = "hidden";
        calendarDays.appendChild(emptyCell);
      }

      // Buat sel untuk setiap tanggal
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = currentHijri.num[6] + "-" + pad(currentMonthIndex + 1) + "-" + pad(day);
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        if (currentMonthIndex === currentHijri.num[5] - 1 && day === currentHijri.num[4]) {
          dayDiv.classList.add("today");
        }
        dayDiv.onclick = () => openModal(dateString, day);
        dayDiv.innerHTML = '<div class="day-number">' + day + '</div>';
        // Jika ada event, tampilkan icon
        if (events[dateString] && events[dateString].length > 0) {
          const icon = document.createElement("i");
          icon.className = "fa-solid fa-pen-to-square badge";
          icon.style.color = "#FFD43B";
          dayDiv.appendChild(icon);
        }
        calendarDays.appendChild(dayDiv);
      }
    }

    function pad(num) {
      return num < 10 ? '0' + num : num;
    }

    function prevMonth() {
      if (currentMonthIndex > 0) {
        currentMonthIndex--;
        renderCalendar();
      }
    }

    function nextMonth() {
      if (currentMonthIndex < monthList.length - 1) {
        currentMonthIndex++;
        renderCalendar();
      }
    }

    // Modal untuk event per hari
    function openModal(dateStr, day) {
      selectedDate = dateStr;
      document.getElementById('modalDate').textContent = day + " " + monthList[currentMonthIndex] + " " + currentHijri.num[6];
      displayEvents();
      document.getElementById("eventModal").style.display = "flex";
    }

    function closeModal() {
      document.getElementById("eventModal").style.display = "none";
      document.getElementById("eventInput").value = "";
    }

    function displayEvents() {
      const eventListDiv = document.getElementById("eventList");
      eventListDiv.innerHTML = "";
      if (events[selectedDate]) {
        events[selectedDate].forEach((evt, index) => {
          const evtDiv = document.createElement("div");
          evtDiv.classList.add("event-item");
          evtDiv.innerHTML = evt + ' <span onclick="deleteEvent(' + index + ')">&times;</span>';
          eventListDiv.appendChild(evtDiv);
        });
      } else {
        eventListDiv.innerHTML = "<em>Tidak ada event</em>";
      }
    }

    function addEvent() {
      const evtText = document.getElementById("eventInput").value.trim();
      if (!evtText) return;
      if (!events[selectedDate]) {
        events[selectedDate] = [];
      }
      events[selectedDate].push(evtText);
      document.getElementById("eventInput").value = "";
      displayEvents();
      renderCalendar();
      renderAllEvents();
      saveEventsToStorage();
    }

    function deleteEvent(index) {
      events[selectedDate].splice(index, 1);
      if (events[selectedDate].length === 0) {
        delete events[selectedDate];
      }
      displayEvents();
      renderCalendar();
      renderAllEvents();
      saveEventsToStorage();
    }

    // Render semua event ke sidebar
    function renderAllEvents() {
      const allEventsDiv = document.getElementById("allEventsList");
      allEventsDiv.innerHTML = "";
      let hasEvent = false;
      for (const date in events) {
        if (events[date] && events[date].length > 0) {
          hasEvent = true;
          const group = document.createElement("div");
          group.className = "event-group";
          const heading = document.createElement("h4");
          heading.textContent = date;
          group.appendChild(heading);
          events[date].forEach(evt => {
            const p = document.createElement("p");
            p.textContent = "- " + evt;
            group.appendChild(p);
          });
          allEventsDiv.appendChild(group);
        }
      }
      if (!hasEvent) {
        allEventsDiv.innerHTML = "<p>Tidak ada event yang ditambahkan.</p>";
      }
    }

    function resetAllEvents() {
      if (confirm("Apakah Anda yakin menghapus semua event?")) {
        events = {};
        renderCalendar();
        renderAllEvents();
        saveEventsToStorage();
      }
    }

    // Event listener: tutup modal jika klik di luar konten
    window.addEventListener("click", function(e) {
      const modals = document.querySelectorAll(".modal");
      modals.forEach(modal => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    });

    // Fungsi untuk membuka/menutup modal semua event (sidebar)
    function openAllEventsModal() {
      renderAllEvents();
      document.getElementById("allEventsModal").style.display = "flex";
    }
    function closeAllEventsModal() {
      document.getElementById("allEventsModal").style.display = "none";
    }

    // Panggil API saat halaman dimuat
    fetchAPIData();
