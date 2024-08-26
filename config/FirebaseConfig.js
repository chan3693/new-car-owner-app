// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3AyuZ9nq44dtr0M26uinj6KvTogfPAuE",
  authDomain: "react-native-g08.firebaseapp.com",
  projectId: "react-native-g08",
  storageBucket: "react-native-g08.appspot.com",
  messagingSenderId: "347853521046",
  appId: "1:347853521046:web:8f34e20ab66aef636fc2b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app)

export {db}