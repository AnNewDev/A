import {
    collection,
    getDocs,
    doc,
    setDoc,
    getDoc,
    query,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore-lite.js";
import { firestore } from "../js/app.js";

//constructor function
function User(username, email, avatar = "https://i.pinimg.com/originals/7c/d3/d4/7cd3d4a24e4821ead74b90cb8a55a692.jpg"
, point = 0) {
    // tạo thuộc tính (property) cho đối tượng
    // this là từ khóa đại diện cho đối tượng được tạo ra từ constructor function
    this.username = username;
    this.email = email;
    this.avatar = avatar;
    this.point = point;
    // tạo phương thức (method) cho đối tượng


    async function addUser() {
        const postsRef = collection(firestore, "users");
        await setDoc(doc(postsRef), {
          username: this.username,
          email: this.email,
          avatar: this.avatar,
          point: this.point,
        });
      }

      async function getUser(uid) {
        // get doc from firestore
        const docRef = doc(firestore, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // declare some var for current post
            this.username = docSnap.data().username;
            this.email = docSnap.data().email;
            this.avatar = docSnap.data().avatar;
            this.point = docSnap.data().point;
          } else {
            // docSnap.data() will be undefined in this case
      console.log("No such document!");
          }
        }









    // trả về đối tượng user sau khi được quy định thuộc tính và phương thức
    return {
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        point: this.point,
    }
}
//tạo ra một đối tượng từ constructor function

let user1 = new User("user1", "abc@gmail.com")
