// script.js

// Generate unique citizen ID (simulate login)
if (!localStorage.getItem("citizenID")) {
  const uniqueID = "CIT-" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("citizenID", uniqueID);
}

// Attach citizen ID to UI where needed
document.addEventListener("DOMContentLoaded", () => {
  const citizenIDElement = document.getElementById("citizenID");
  if (citizenIDElement) {
    citizenIDElement.textContent = localStorage.getItem("citizenID");
  }

  // handle report form
  const reportForm = document.getElementById("reportForm");
  if (reportForm) {
    reportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const file = document.getElementById("photo").files[0];
      if (!file) return alert("Please upload a photo");

      // get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const timestamp = new Date().toLocaleString();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // Save to localStorage (simulate DB)
          let reports = JSON.parse(localStorage.getItem("reports") || "[]");
          reports.push({
            citizenID: localStorage.getItem("citizenID"),
            fileName: file.name,
            timestamp: timestamp,
            lat: lat,
            lon: lon,
            cleaned: false,
          });
          localStorage.setItem("reports", JSON.stringify(reports));
          alert("Report submitted with location and timestamp!");
        });
      } else {
        alert("Location not supported");
      }
    });
  }

  // fill dashboard
  const dashboardTable = document.getElementById("dashboardTable");
  if (dashboardTable) {
    const myID = localStorage.getItem("citizenID");
    let reports = JSON.parse(localStorage.getItem("reports") || "[]");
    let myReports = reports.filter(r => r.citizenID === myID);
    let solved = myReports.filter(r => r.cleaned).length;
    let rating = solved * 10;
    document.getElementById("rating").textContent = rating;
    document.getElementById("solved").textContent = solved;
    document.getElementById("uploaded").textContent = myReports.length;

    dashboardTable.innerHTML = "";
    myReports.forEach(r => {
      dashboardTable.innerHTML += `
        <tr>
          <td>${r.timestamp}</td>
          <td>${r.lat.toFixed(3)},${r.lon.toFixed(3)}</td>
          <td>${r.cleaned ? "✅ Cleaned" : "⏳ Pending"}</td>
        </tr>`;
    });
  }

  // fill leaderboard
  const leaderboardBody = document.getElementById("leaderboardBody");
  if (leaderboardBody) {
    let reports = JSON.parse(localStorage.getItem("reports") || "[]");
    let byCitizen = {};
    reports.forEach(r => {
      if (!byCitizen[r.citizenID]) {
        byCitizen[r.citizenID] = {solved:0};
      }
      if (r.cleaned) byCitizen[r.citizenID].solved++;
    });
    let rows = Object.entries(byCitizen)
      .map(([id,data]) => ({id,score:data.solved*10}))
      .sort((a,b)=>b.score-a.score);

    leaderboardBody.innerHTML="";
    rows.forEach(r=>{
      leaderboardBody.innerHTML+=`<tr><td>${r.id}</td><td>${r.score}</td></tr>`;
    });
  }

  // municipality page listing
  const muniTable = document.getElementById("muniTable");
  if (muniTable) {
    let reports = JSON.parse(localStorage.getItem("reports") || "[]");
    muniTable.innerHTML="";
    reports.forEach((r,i)=>{
      muniTable.innerHTML+=`
        <tr>
          <td>${r.citizenID}</td>
          <td>${r.timestamp}</td>
          <td>${r.lat.toFixed(3)},${r.lon.toFixed(3)}</td>
          <td>${r.cleaned?"✅ Cleaned":"⏳ Pending"}</td>
          <td><button onclick="markCleaned(${i})">Mark Cleaned</button></td>
        </tr>`;
    });
  }
});

function markCleaned(index){
  let reports = JSON.parse(localStorage.getItem("reports") || "[]");
  reports[index].cleaned = true;
  localStorage.setItem("reports", JSON.stringify(reports));
  alert("Marked cleaned!");
  location.reload();
}
