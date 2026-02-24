let section = document.getElementById("main_body");
let currentAudio = null; // Track currently playing song
let currentButton = null;

// Loader helpers
function showLoader(message) {
  const loader = document.getElementById("loader");
  if (!loader) return;
  if (message) loader.querySelector(".loader-text").textContent = message;
  loader.setAttribute("aria-hidden", "false");
}

const customDropdown = document.querySelector(".custom-dropdown");
const dropdownToggle = document.querySelector(".dropdown-toggle");
const dropdownLabel = document.querySelector(".dropdown-label");
const dropdownItems = document.querySelectorAll(".dropdown-item");

dropdownToggle.addEventListener("click", () => {
  customDropdown.classList.toggle("active");
});


document.addEventListener("click", (e) => {
  if (!customDropdown.contains(e.target)) {
    customDropdown.classList.remove("active");
  }
});

// Handle dropdown item selection
dropdownItems.forEach((item) => {
  item.addEventListener("click", () => {
    const value = item.dataset.value;
    const label = item.textContent;

    // Update label
    dropdownLabel.textContent = label;

    // Remove active state from all items
    dropdownItems.forEach((i) => i.classList.remove("selected"));
    item.classList.add("selected");

    // Close dropdown
    customDropdown.classList.remove("active");

    // Trigger search
    if (value === "all") {
      mainbody();
    } else if (value === "hiphop") {
      search("Hiphop");
    } else {
      const genre = value.charAt(0).toUpperCase() + value.slice(1);
      search(genre);
    }
  });
});
function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.setAttribute("aria-hidden", "true");
}

async function mainbody() {
  showLoader('Loading artists...');
  try {
    const response = await fetch("http://127.0.0.1:8000/all-entries");

    if (!response.ok) throw new Error("Failed to fetch artists");

    const data = await response.json();
    section.innerHTML = "";

    data.forEach((artist, index) => {
      const div = document.createElement("div");
      div.className = "song-card"; 
      div.innerHTML = `
        <img class="artist-img" src="download.png" alt="${artist.artist}" />

        <audio id="audio-${index}" src="${artist.audio_url}"></audio>

        <button class="play-btn" onclick="toggleAudio('audio-${index}', this)">
          <i class="fa-solid fa-play"></i>
        </button>

        <div class="progress">
          <div class="progress-bar" id="progress-${index}" style="width: 0%;"></div>
        </div>

        <h3>${artist.artist}</h3>
        <p><strong>Song:</strong> ${artist.song}</p>
        <p><strong>Genre:</strong> ${artist.genre}</p>
        <p><strong>Subscribers:</strong> ${artist.subscribers || 0}</p>
        <hr />
        <a class="download-btn" href="${artist.audio_url}" download>Download</a>
      `;

      section.appendChild(div);

      // We select the elements specifically for THIS card
      const audio = div.querySelector(`#audio-${index}`);
      const progressBar = div.querySelector(`#progress-${index}`);

      // Update progress bar
      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          const percent = (audio.currentTime / audio.duration) * 100;
          progressBar.style.width = percent + "%";
        }
      });

      // Reset when song ends
      audio.addEventListener("ended", () => {
        resetPlayer(audio, div.querySelector(".play-btn"));
      });
    });
  } catch (error) {
    console.error("Connection error:", error);
    section.innerHTML = "<p>Could not load artists. Is the server running?</p>";
  } finally {
    hideLoader();
  }
}
function toggleAudio(audioId, button) {
  const audio = document.getElementById(audioId);
  const icon = button.querySelector("i");

  // Stop previous audio if different
  if (currentAudio && currentAudio !== audio) {
    resetPlayer(currentAudio, currentButton);
  }

  if (audio.paused) {
    audio.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
    button.classList.add("playing");

    currentAudio = audio;
    currentButton = button;
  } else {
    resetPlayer(audio, button);
  }
}

function resetPlayer(audio, button) {
  const icon = button.querySelector("i");

  audio.pause();
  audio.currentTime = 0;

  icon.classList.remove("fa-pause");
  icon.classList.add("fa-play");

  button.classList.remove("playing");

  currentAudio = null;
  currentButton = null;
}
function toggleTheme() {
  const body = document.body;
  const icon = document.querySelector(".theme-toggle i");

  body.classList.toggle("dark");

  if (body.classList.contains("dark")) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }}
function search_() {
    const query = document.getElementById("search_input").value.trim();
  search(query);
}

async function search(query){
  if (!query) return;

  showLoader('Searching...');
  try {
    const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Failed to search");
    const data = await response.json();
    section.innerHTML = "<section class='search-results'><h2>Search Results</h2></section>";
    if (data.length === 0) {
      section.innerHTML = "<p>No results found.</p>";
      return;
    }
  data.forEach((artist,index)=>{
    const div=document.createElement("div");
    div.className="song-card";
    div.innerHTML=`
      <img class="artist-img" src="download.png" alt="${artist.artist}" />

      <audio id="audio-search-${index}" src="${artist.audio_url}"></audio>  
      <button class="play-btn" onclick="toggleAudio('audio-search-${index}', this)">
        <i class="fa-solid fa-play"></i>
      </button>

      <div class="progress">
        <div class="progress-bar" id="progress-search-${index}" style="width: 0%;"></div>
      </div> 
      <h3>${artist.artist}</h3>
      <p><strong>Song:</strong> ${artist.song}</p>
      <p><strong>Genre:</strong> ${artist.genre}</p>
      <p><strong>Subscribers:</strong> ${artist.subscribers || 0}</p>
      <hr />
      <a class="download-btn" href="${artist.audio_url}" download>Download</a>
    `;
    section.appendChild(div);
    const audio=div.querySelector(`#audio-search-${index}`);
    const progressBar=div.querySelector(`#progress-search-${index}`);
    audio.addEventListener("timeupdate",()=>{
      if(audio.duration){
        const percent=(audio.currentTime/audio.duration)*100;
        progressBar.style.width=percent+"%";
      }
    });
    audio.addEventListener("ended",()=>{
      resetPlayer(audio,div.querySelector(".play-btn"));
    }); 
  });
}catch(error){
  console.error("Search error:",error);
  section.innerHTML="<p>Search failed. Please try again.</p>";
}finally{
  hideLoader();
}}

mainbody();
