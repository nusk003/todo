const express = require("express");
const admin = require("firebase-admin");
const { signInWithEmailAndPassword, getAuth } = require("firebase/auth");
const {
  getFirestore,
  doc,
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
} = require("firebase/firestore");
const { initializeApp } = require("firebase/app");
const { __firebase_api_key__ } = require("./constants");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const firebaseConfig = {
  apiKey: __firebase_api_key__,
  authDomain: "crud-e5492.firebaseapp.com",
  projectId: "crud-e5492",
  storageBucket: "crud-e5492.appspot.com",
  messagingSenderId: "268887064942",
  appId: "1:268887064942:web:b78c1d578686a1de63417f",
  measurementId: "G-EDK29KVT82",
};

const app = express();
const port = 8080; // default port to listen

app.use(cookieParser());

app.use(bodyParser.json());

async function adminGuard(req, res) {
  const uid = req.cookies.uid;

  if (!uid) {
    res.sendStatus(401);
    res.send("Unauthorized");
  }

  try {
    const user = await firebaseAdminApp.auth().getUser(uid);
    if (!user.customClaims.admin) {
      res.sendStatus(401);
      res.send("Unauthorized");
    }
    return user;
  } catch {
    res.sendStatus(401);
  }
}

async function staffGuard(req, res) {
  const uid = req.cookies.uid;

  if (!uid) {
    res.sendStatus(401);
    res.send("Unauthorized");
  }

  try {
    const user = await firebaseAdminApp.auth().getUser(uid);
    if (!user.customClaims.staff) {
      res.sendStatus(401);
      res.send("Unauthorized");
    }
    req.user = user;
  } catch {
    res.sendStatus(401);
  }
}

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAdminApp = admin.initializeApp();

app.post("/login", async (req, res) => {
  const auth = getAuth(firebaseApp);
  const email = req.body.email;
  const password = req.body.password;

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    res.cookie("uid", user.uid);
    res.send("Login success");
  } catch (err) {
    res.sendStatus(401);
    res.send("Login failed");
  }
});

app.post("/logout", async (req, res) => {
  await staffGuard(req, res);
  try {
    res.clearCookie("uid");
    res.send("Success");
  } catch (err) {
    res.statusCode(500);
    res.send("Logout failed");
  }
});

app.post("/registerAdmin", async (req, res) => {
  await adminGuard(req, res);

  const auth = firebaseAdminApp.auth();
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await auth.createUser({ email, password });
    await auth.setCustomUserClaims(user.uid, { admin: true, staff: true });
    res.cookie("uid", user.uid);
    res.send("Sucess");
  } catch {
    res.sendStatus(500);
    res.send("Server error");
  }
});

app.post("/registerStaff", async (req, res) => {
  await adminGuard(req, res);

  const auth = firebaseAdminApp.auth();
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await auth.createUser({ email, password });
    await auth.setCustomUserClaims(user.uid, { admin: false, staff: true });
    res.cookie("uid", user.uid);
    res.send("Sucess");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
    res.send("Server error");
  }
});

app.post("/createTask", async (req, res) => {
  await staffGuard(req, res);

  const firestore = getFirestore(firebaseApp);
  const title = req.body.title;
  const description = req.body.description;

  try {
    const docRef = await addDoc(collection(firestore, "todos"), {
      title,
      description,
    });
    res.send(docRef.id);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/editTask", async (req, res) => {
  await staffGuard(req, res);

  const firestore = getFirestore(firebaseApp);
  const id = req.body.id;
  const data = req.body.data;

  const todoRef = doc(firestore, "todos", id);

  try {
    await updateDoc(todoRef, data);
    res.send("Success");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/deleteTask", async (req, res) => {
  await adminGuard(req, res);

  const firestore = getFirestore(firebaseApp);
  const id = req.body.id;

  try {
    await deleteDoc(doc(firestore, "todos", id));
    res.send("Success");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/user", async (req, res) => {
  await staffGuard(req, res);
  res.send(req.user);
});

// start the express server
app.listen(port, async () => {
  // tslint:disable-next-line:no-console
  console.log(`serrver started at http://localhost:${port}`);
});
