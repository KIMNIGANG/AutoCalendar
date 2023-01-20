import { app } from "./firebase_config.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const auth = getAuth(app);
const name_space = document.getElementById("name");
// const email_space = document.getElementById("email");

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    const name = user.displayName;
    const email = user.email;
    console.log(email);
    console.log(name);
    console.log(uid);
    name_space.innerText = name;
    // email_space.innerText = email;
    localStorage.setItem("uid", uid);
    localStorage.setItem("email", email);
    localStorage.setItem("name", name);
  } else {
    console.log("user is signed out");
  }
});
