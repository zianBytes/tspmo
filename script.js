// RAGE FEED SUBMISSION
document.getElementById('submitRage').addEventListener('click', () => {
    const text = document.querySelector('textarea').value.trim();
    if (text.length === 0) return;
  
    const li = document.createElement('li');
    li.textContent = text;
    document.getElementById('feedList').prepend(li);
    document.querySelector('textarea').value = '';
  });
  
  // LEADERBOARD TOGGLE
  const leaderboardBtn = document.getElementById('leaderboardToggle');
  const leaderboardPanel = document.getElementById('leaderboardPanel');
  let isLeaderboardOpen = false;
  
  leaderboardBtn.addEventListener('click', () => {
    isLeaderboardOpen = !isLeaderboardOpen;
    leaderboardPanel.classList.toggle('show');
    leaderboardBtn.style.color = isLeaderboardOpen ? '#ff4d4d' : '#00fff2';
    leaderboardBtn.style.textShadow = isLeaderboardOpen ? '0 0 10px #ff4d4d' : '0 0 6px #00fff2';
  });
  
  // Close leaderboard when clicking outside
  document.addEventListener('click', (event) => {
    if (isLeaderboardOpen && 
        !leaderboardPanel.contains(event.target) && 
        !leaderboardBtn.contains(event.target)) {
        isLeaderboardOpen = false;
        leaderboardPanel.classList.remove('show');
        leaderboardBtn.style.color = '#00fff2';
        leaderboardBtn.style.textShadow = '0 0 6px #00fff2';
    }
  });
  
  // PLAY BUTTON → GO TO RAGE ROOM
  document.getElementById('playBtn').addEventListener('click', () => {
    window.location.href = "rageRoom.html";
  });
  

