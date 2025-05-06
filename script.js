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
  
  leaderboardBtn.addEventListener('click', () => {
    leaderboardPanel.classList.toggle('hidden');
  });
  
  // PLAY BUTTON → GO TO RAGE ROOM
  document.getElementById('playBtn').addEventListener('click', () => {
    window.location.href = "rageRoom.html";
  });
  

