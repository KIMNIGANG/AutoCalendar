import { app } from "./firebase_config.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const auth = getAuth();

const submitButton = document.getElementById("logout_btn");
submitButton.onclick = () => {
  // console.log("hello");
  signOut(auth)
    .then(() => {
      console.log("loggedout");
    })
    .catch((error) => {
      console.log(error);
    });
};

// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     // const uid = user.uid;
//     // ...
//   } else {
//     // document.location.href = "index.html";
//     // User is signed out
//     // ...
//   }
// });

