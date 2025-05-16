// assume firebase-app, auth, db are imported from firebase-config.js
// e.g. import { auth, db } from './firebase-config.js';
// and Firestore helpers: doc, setDoc, addDoc, collection, getDocs, updateDoc, getDoc

// 1) Post gossip into Firestore:
async function postGossip() {
  const text = document.getElementById('gossipInput').value.trim();
  if (!text) return alert('Type something!');
  const user = auth.currentUser;
  if (!user) return alert('Please sign in first.');
  // save to 'gossip' collection
  await addDoc(collection(db, 'gossip'), {
    userId: user.uid,
    text,
    timestamp: Date.now(),
    approved: false // admin approves later
  });
  alert('Gossip submitted – pending approval.');
}

// 2) Upload file to Firebase Storage and record in Firestore:
async function uploadFile() {
  const fileInput = document.getElementById('fileUpload');
  if (!fileInput.files.length) return alert('Choose a file first.');
  const file = fileInput.files[0];
  const user = auth.currentUser;
  if (!user) return alert('Please sign in first.');
  const storageRef = ref(storage, `study-files/${user.uid}/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, 'resources'), {
    userId: user.uid,
    name: file.name,
    url,
    timestamp: Date.now()
  });
  alert('File uploaded! +Vcoins.');
}

// 3) Populate leaderboard table:
async function loadLeaderboard() {
  const tbody = document.querySelector('#leaderboardTable tbody');
  const q = query(collection(db, 'users'), orderBy('vcoins','desc'), limit(50));
  const snap = await getDocs(q);
  let rank=1;
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `<td>${rank++}</td><td>${data.name}</td><td>${data.vcoins}</td>`;
    tbody.appendChild(row);
  });
}

// 4) Riddle handling:
const correctAnswer = 'piano';
function submitRiddle() {
  const ans = document.getElementById('riddleAnswer').value.trim().toLowerCase();
  const resp = document.getElementById('riddleResponse');
  if (ans === correctAnswer) {
    resp.textContent = 'Nice! +50 Vcoins.';
    // TODO: credit user
  } else {
    resp.textContent = 'Better luck next time!';
  }
}

// 5) Unlock LoungeVerse:
async function unlockLounge() {
  const user = auth.currentUser;
  if (!user) return alert('Please sign in first.');
  const udoc = await getDoc(doc(db,'users',user.uid));
  if (udoc.data().vcoins >= 25000) {
    await updateDoc(udoc.ref, { unlockedLounge: true });
    alert('Unlocked! Enjoy the Lounge.');
    // maybe redirect to exclusive content
  } else {
    alert('You need 25,000 Vcoins.');
  }
}

// 6) On page load, call these where relevant:
onAuthStateChanged(auth, user => {
  if (user) {
    loadLeaderboard();         // for leaderboard.html
    // loadResources();         // for study.html
    // loadGossip();            // for gossip.html
  }
});







